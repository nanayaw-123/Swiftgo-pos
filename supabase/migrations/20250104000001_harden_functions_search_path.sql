-- Migration: Harden PostgreSQL functions against mutable search_path
-- Description: Sets 'search_path = public' for all public schema functions to prevent schema injection attacks
-- and satisfy Supabase security scans.

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. increment_customer_debt
CREATE OR REPLACE FUNCTION public.increment_customer_debt(p_customer_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
    UPDATE customers_new
    SET total_debt = total_debt + p_amount,
        updated_at = NOW()
    WHERE id = p_customer_id;
END;
$$;

-- 3. decrement_customer_debt
CREATE OR REPLACE FUNCTION public.decrement_customer_debt(p_customer_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
    UPDATE customers_new
    SET total_debt = GREATEST(total_debt - p_amount, 0),
        updated_at = NOW()
    WHERE id = p_customer_id;
END;
$$;

-- 4. record_active_day_charge
CREATE OR REPLACE FUNCTION public.record_active_day_charge(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
    v_last_day DATE;
    v_rate NUMERIC;
BEGIN
    SELECT last_active_day, daily_rate INTO v_last_day, v_rate FROM organizations WHERE id = p_org_id;
    
    -- If it's a new day, charge the wallet
    IF v_last_day IS NULL OR v_last_day < CURRENT_DATE THEN
        INSERT INTO wallet_transactions (organization_id, amount, type, description)
        VALUES (p_org_id, -v_rate, 'charge', 'Daily active usage charge (' || CURRENT_DATE || ')');
        
        UPDATE organizations 
        SET wallet_balance = wallet_balance - v_rate,
            last_active_day = CURRENT_DATE
        WHERE id = p_org_id;
    END IF;
END;
$$;

-- 5. get_branch_inventory_value
CREATE OR REPLACE FUNCTION public.get_branch_inventory_value(br_id bigint)
 RETURNS numeric
 LANGUAGE sql
 SET search_path = public
AS $$
    SELECT COALESCE(SUM(stock_quantity * price), 0)
    FROM "Products_Service"
    WHERE branch_id = br_id;
$$;

-- 6. decrease_stock
CREATE OR REPLACE FUNCTION public.decrease_stock(p_product_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $$
BEGIN
    UPDATE products
    SET stock = stock - p_quantity
    WHERE id = p_product_id;
END;
$$;

-- 7. get_low_stock_items
CREATE OR REPLACE FUNCTION public.get_low_stock_items(br_id bigint, threshold integer)
 RETURNS SETOF "Products_Service"
 LANGUAGE sql
 SET search_path = public
AS $$
    SELECT *
    FROM "Products_Service"
    WHERE branch_id = br_id AND stock_quantity <= threshold;
$$;

-- 8. sync_sales_tenant_id
CREATE OR REPLACE FUNCTION public.sync_sales_tenant_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $$
BEGIN
    IF NEW.tenant_id IS NULL AND NEW.organization_id IS NOT NULL THEN
        NEW.tenant_id := NEW.organization_id;
    END IF;
    IF NEW.organization_id IS NULL AND NEW.tenant_id IS NOT NULL THEN
        NEW.organization_id := NEW.tenant_id;
    END IF;
    RETURN NEW;
END;
$$;

-- 9. get_business_stats_v2
CREATE OR REPLACE FUNCTION public.get_business_stats_v2(bus_id bigint)
 RETURNS json
 LANGUAGE sql
 SET search_path = public
AS $$
    SELECT json_build_object(
        'total_sales', (SELECT COALESCE(SUM(total_amount), 0) FROM "Sales(orders/reciepts)" WHERE business_id = bus_id),
        'total_customers', (SELECT COUNT(*) FROM "Customers" WHERE business_id = bus_id),
        'total_products', (SELECT COUNT(*) FROM "Products_Service" WHERE business_id = bus_id)
    );
$$;

-- 10. get_branch_revenue
CREATE OR REPLACE FUNCTION public.get_branch_revenue(br_id bigint, start_date timestamp with time zone, end_date timestamp with time zone)
 RETURNS numeric
 LANGUAGE sql
 SET search_path = public
AS $$
    SELECT COALESCE(SUM(total_amount), 0)
    FROM "Sales(orders/reciepts)"
    WHERE branch_id = br_id AND created_at BETWEEN start_date AND end_date;
$$;

-- 11. sync_sales_total_amount
CREATE OR REPLACE FUNCTION public.sync_sales_total_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $$
BEGIN
    IF NEW.total IS NULL AND NEW.amount IS NOT NULL THEN
        NEW.total := NEW.amount;
    END IF;
    IF NEW.amount IS NULL AND NEW.total IS NOT NULL THEN
        NEW.amount := NEW.total;
    END IF;
    RETURN NEW;
END;
$$;

-- 12. get_all_business_metrics
CREATE OR REPLACE FUNCTION public.get_all_business_metrics(p_business_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
    v_owner_id UUID;
    v_org_id UUID;
    v_result JSONB;
BEGIN
    -- Get linked identifiers
    SELECT owner_id INTO v_owner_id FROM "Business" WHERE id = p_business_id;
    SELECT id INTO v_org_id FROM "organizations" WHERE owner_id = v_owner_id LIMIT 1;

    SELECT jsonb_build_object(
        'core_business', (
            SELECT jsonb_build_object(
                'business_info', (SELECT row_to_json(b) FROM "Business" b WHERE b.id = p_business_id),
                'organizations', (SELECT count(*) FROM "organizations" WHERE owner_id = v_owner_id),
                'organization_members', (SELECT count(*) FROM "organization_members" WHERE organization_id = v_org_id),
                'branches', (SELECT count(*) FROM "Branches" WHERE business_id = p_business_id),
                'stores', (SELECT count(*) FROM "stores" WHERE organization_id = v_org_id),
                'api_keys', (SELECT count(*) FROM "api_keys" WHERE business_id = p_business_id),
                'onboarding_status', (SELECT row_to_json(o) FROM "onboarding" o WHERE o.user_id = v_owner_id LIMIT 1)
            )
        ),
        'staff_and_hr', (
            SELECT jsonb_build_object(
                'total_staff', (SELECT count(*) FROM "Staff_profiles" sp JOIN "Branches" b ON sp.branch_id = b.id WHERE b.business_id = p_business_id),
                'attendance_records', (SELECT count(*) FROM "Attendance(Payroll-ready)" a JOIN "Staff_profiles" sp ON a.staff_id = sp.id JOIN "Branches" b ON sp.branch_id = b.id WHERE b.business_id = p_business_id),
                'staff_loans_total', (SELECT COALESCE(sum(amount), 0) FROM "staff_loans" sl JOIN "Staff_profiles" sp ON sl.staff_id = sp.id JOIN "Branches" b ON sp.branch_id = b.id WHERE b.business_id = p_business_id),
                'payrolls_count', (SELECT count(*) FROM "payrolls" WHERE business_id = p_business_id),
                'total_payslips', (SELECT count(*) FROM "payslips" ps JOIN "payrolls" p ON ps.payroll_id = p.id WHERE p.business_id = p_business_id),
                'business_roles', (SELECT count(*) FROM "Business_roles" WHERE business_id = p_business_id)
            )
        ),
        'sales_and_finance', (
            SELECT jsonb_build_object(
                'total_sales_count', (SELECT count(*) FROM "Sales(orders/reciepts)" WHERE business_id = p_business_id),
                'total_revenue', (SELECT COALESCE(sum(total_amount), 0) FROM "Sales(orders/reciepts)" WHERE business_id = p_business_id),
                'sale_items_count', (SELECT count(*) FROM "Sale item" si JOIN "Sales(orders/reciepts)" s ON si.sale_id = s.id WHERE s.business_id = p_business_id),
                'payments_collected', (SELECT COALESCE(sum(amount), 0) FROM "Payment(Momo/Cash/Card)" p JOIN "Sales(orders/reciepts)" s ON p.sale_id = s.id WHERE s.business_id = p_business_id),
                'receipts_issued', (SELECT count(*) FROM "receipts" r JOIN "Sales(orders/reciepts)" s ON r.sale_id = s.id WHERE s.business_id = p_business_id),
                'refunds_total', (SELECT COALESCE(sum(amount), 0) FROM "refunds" r JOIN "Sales(orders/reciepts)" s ON r.sale_id = s.id WHERE s.business_id = p_business_id),
                'expenses_total', (SELECT COALESCE(sum(amount), 0) FROM "Expenses" WHERE business_id = p_business_id),
                'daily_summaries_count', (SELECT count(*) FROM "daily_summaries" WHERE business_id = p_business_id)
            )
        ),
        'inventory_and_supply', (
            SELECT jsonb_build_object(
                'total_products', (SELECT count(*) FROM "Products_Service" WHERE business_id = p_business_id),
                'inventory_movements', (SELECT count(*) FROM "inventory_movements" WHERE business_id = p_business_id),
                'suppliers_count', (SELECT count(*) FROM "suppliers" WHERE business_id = p_business_id),
                'purchase_orders', (SELECT count(*) FROM "purchase_orders" WHERE business_id = p_business_id),
                'po_items_count', (SELECT count(*) FROM "purchase_order_items" poi JOIN "purchase_orders" po ON poi.purchase_order_id = po.id WHERE po.business_id = p_business_id),
                'stock_transfers', (SELECT count(*) FROM "stock_transfers" WHERE business_id = p_business_id),
                'stock_transfer_items', (SELECT count(*) FROM "stock_transfer_items" sti JOIN "stock_transfers" st ON sti.stock_transfer_id = st.id WHERE st.business_id = p_business_id)
            )
        ),
        'customers_and_loyalty', (
            SELECT jsonb_build_object(
                'total_customers', (SELECT count(*) FROM "Customers" WHERE business_id = p_business_id),
                'total_loyalty_points', (SELECT COALESCE(sum(loyalty_points), 0) FROM "Customers" WHERE business_id = p_business_id),
                'wallet_balances', (SELECT COALESCE(sum(balance), 0) FROM "customer_wallet" cw JOIN "Customers" c ON cw.customer_id = c.id WHERE c.business_id = p_business_id),
                'loyalty_transactions', (SELECT count(*) FROM "loyalty_transactions" lt JOIN "Customers" c ON lt.customer_id = c.id WHERE c.business_id = p_business_id)
            )
        ),
        'marketing_and_system', (
            SELECT jsonb_build_object(
                'discounts_active', (SELECT count(*) FROM "discounts" WHERE business_id = p_business_id AND is_active = TRUE),
                'sale_discounts_applied', (SELECT count(*) FROM "sale_discounts" sd JOIN "Sales(orders/reciepts)" s ON sd.sale_id = s.id WHERE s.business_id = p_business_id),
                'subscriptions', (SELECT count(*) FROM "Subscription" WHERE business_id = p_business_id),
                'activity_logs_count', (SELECT count(*) FROM "activity_logs" WHERE business_id = p_business_id),
                'notifications_sent', (SELECT count(*) FROM "notification" WHERE user_id = v_owner_id),
                'feature_flags_enabled', (SELECT count(*) FROM "feature_flags" ff JOIN "Subscription" sub ON ff.plan_id = sub.plan_id WHERE sub.business_id = p_business_id AND ff.is_enabled = TRUE)
            )
        ),
        'global_meta', (
            SELECT jsonb_build_object(
                'profiles_count', (SELECT count(*) FROM "profiles"),
                'saas_plans_count', (SELECT count(*) FROM "SaaS Plans"),
                'permissions_count', (SELECT count(*) FROM "Permissions"),
                'role_permissions_count', (SELECT count(*) FROM "role_permissions"),
                'raw_sales_count', (SELECT count(*) FROM "sales")
            )
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 13. current_user_id
CREATE OR REPLACE FUNCTION public.current_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- 14. current_user_tenant_id (Refresh/Maintain)
CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  user_tenant_id UUID;
BEGIN
  SELECT tenant_id
  INTO user_tenant_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN user_tenant_id;
END;
$$;

-- 15. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_company_name text;
  v_role text;
BEGIN
  v_company_name := new.raw_user_meta_data->>'company_name';
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'owner');

  -- If it's an owner and company name is provided, create a new tenant
  IF v_role = 'owner' AND v_company_name IS NOT NULL AND v_company_name != '' THEN
    INSERT INTO public.tenants (id, name, owner_user_id, subscription_tier)
    VALUES (gen_random_uuid(), v_company_name, new.id, 'free')
    RETURNING id INTO v_tenant_id;
    
    -- Also create an organization record since it's used in some tables
    INSERT INTO public.organizations (id, owner_id, business_name, business_type)
    VALUES (v_tenant_id, new.id, v_company_name, 'Retail');
  ELSE
    -- Use default tenant
    v_tenant_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  INSERT INTO public.profiles (id, email, role, onboarding_completed, full_name, tenant_id)
  VALUES (
    new.id, 
    new.email, 
    v_role, 
    FALSE,
    TRIM(COALESCE(new.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data->>'last_name', '')),
    v_tenant_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(new.raw_user_meta_data->>'role', profiles.role),
    full_name = COALESCE(NULLIF(TRIM(COALESCE(new.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data->>'last_name', '')), ''), profiles.full_name),
    tenant_id = EXCLUDED.tenant_id;
    
  RETURN new;
END;
$$;

-- 16. complete_onboarding
CREATE OR REPLACE FUNCTION public.complete_onboarding(p_business_name text, p_business_type text, p_currency text, p_store_name text, p_store_location text, p_phone text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 1. Create Organization
  INSERT INTO public.organizations (business_name, owner_id, business_type, currency)
  VALUES (p_business_name, current_user_id, p_business_type, p_currency)
  RETURNING id INTO new_org_id;
  
  -- 2. Add as member (Owner role)
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, current_user_id, 'owner');
  
  -- 3. Create Store
  INSERT INTO public.stores (organization_id, name, location, is_active)
  VALUES (new_org_id, p_store_name, p_store_location, TRUE);
  
  -- 4. Update Profile
  UPDATE public.profiles
  SET onboarding_completed = TRUE,
      phone = COALESCE(p_phone, phone)
  WHERE id = current_user_id;
  
  RETURN jsonb_build_object('success', true, 'organization_id', new_org_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
