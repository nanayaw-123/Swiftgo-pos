-- SwiftPOS Database Schema for Supabase with Native Supabase Auth
-- Cleaned migration: safer helper functions, explicit grants, RLS policies, indexes, and triggers

-- 1) Helper function to get current authenticated user ID from Supabase Auth
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Revoke public execute and grant to authenticated
REVOKE EXECUTE ON FUNCTION public.current_user_id() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;

-- 2) Helper function to get tenant_id for current user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID
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

-- Revoke public execute and grant to authenticated
REVOKE EXECUTE ON FUNCTION public.current_user_tenant_id() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated;

-- 3) Create tables

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'cashier')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  price NUMERIC(10, 2) NOT NULL,
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

CREATE TABLE IF NOT EXISTS product_expiry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  quantity INTEGER NOT NULL,
  alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  alert_status TEXT NOT NULL DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id),
  cashier_id UUID NOT NULL REFERENCES auth.users(id),
  items JSONB NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'digital', 'mobile_money')),
  customer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id),
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'sale', 'restock', 'transfer')),
  quantity INTEGER NOT NULL,
  reference_id UUID,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  total_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,
  transactions_count INTEGER NOT NULL DEFAULT 0,
  items_sold INTEGER NOT NULL DEFAULT 0,
  average_transaction_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('prediction', 'reorder', 'anomaly', 'weekly_report')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data_json JSONB,
  confidence_score NUMERIC(3, 2),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  polar_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trial')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, feature)
);

-- 4) Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_expiry ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- 5) RLS policies

-- tenants
CREATE POLICY tenants_select_for_authenticated
  ON tenants FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR id = public.current_user_tenant_id()
  );

CREATE POLICY tenants_update_by_owner
  ON tenants FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY tenants_insert_by_user
  ON tenants FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

-- profiles
CREATE POLICY profiles_select_in_tenant_or_self
  ON profiles FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id() OR user_id = auth.uid());

CREATE POLICY profiles_insert_self
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND tenant_id = public.current_user_tenant_id());

CREATE POLICY profiles_update_by_owner_or_manager
  ON profiles FOR UPDATE TO authenticated
  USING (
    tenant_id = public.current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.tenant_id = public.current_user_tenant_id()
        AND p.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    tenant_id = public.current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.tenant_id = public.current_user_tenant_id()
        AND p.role IN ('owner', 'manager')
    )
  );

-- stores
CREATE POLICY stores_select_in_tenant
  ON stores FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY stores_manage_by_owner_or_manager
  ON stores FOR ALL TO authenticated
  USING (
    tenant_id = public.current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.tenant_id = public.current_user_tenant_id()
        AND p.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    tenant_id = public.current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.tenant_id = public.current_user_tenant_id()
        AND p.role IN ('owner', 'manager')
    )
  );

-- products
CREATE POLICY products_select_in_tenant
  ON products FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY products_manage_by_owner_or_manager
  ON products FOR ALL TO authenticated
  USING (
    tenant_id = public.current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.tenant_id = public.current_user_tenant_id()
        AND p.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    tenant_id = public.current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.tenant_id = public.current_user_tenant_id()
        AND p.role IN ('owner', 'manager')
    )
  );

-- product_expiry
CREATE POLICY product_expiry_select_in_tenant
  ON product_expiry FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY product_expiry_insert_in_tenant
  ON product_expiry FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_user_tenant_id()
  );

CREATE POLICY product_expiry_update_in_tenant
  ON product_expiry FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

-- low_stock_alerts
CREATE POLICY low_stock_alerts_select_in_tenant
  ON low_stock_alerts FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY low_stock_alerts_insert_in_tenant
  ON low_stock_alerts FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

CREATE POLICY low_stock_alerts_update_in_tenant
  ON low_stock_alerts FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

-- sales
CREATE POLICY sales_select_in_tenant
  ON sales FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY sales_insert_by_cashier
  ON sales FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_user_tenant_id()
    AND cashier_id = auth.uid()
  );

CREATE POLICY sales_update_in_tenant_by_manager
  ON sales FOR UPDATE TO authenticated
  USING (
    tenant_id = public.current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.tenant_id = public.current_user_tenant_id()
        AND p.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (tenant_id = public.current_user_tenant_id());

-- inventory_movements
CREATE POLICY inventory_movements_select_in_tenant
  ON inventory_movements FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY inventory_movements_insert_by_user
  ON inventory_movements FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_user_tenant_id()
    AND performed_by = auth.uid()
  );

CREATE POLICY inventory_movements_update_in_tenant
  ON inventory_movements FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

-- staff_performance
CREATE POLICY staff_performance_select_in_tenant
  ON staff_performance FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY staff_performance_insert_in_tenant
  ON staff_performance FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

CREATE POLICY staff_performance_update_in_tenant
  ON staff_performance FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

-- ai_insights
CREATE POLICY ai_insights_select_in_tenant
  ON ai_insights FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY ai_insights_insert_in_tenant
  ON ai_insights FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

CREATE POLICY ai_insights_update_in_tenant
  ON ai_insights FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

-- audit_logs
CREATE POLICY audit_logs_select_in_tenant
  ON audit_logs FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY audit_logs_insert_in_tenant
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

-- billing_subscriptions
CREATE POLICY billing_subscriptions_select_in_tenant
  ON billing_subscriptions FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY billing_subscriptions_insert_in_tenant
  ON billing_subscriptions FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

CREATE POLICY billing_subscriptions_update_in_tenant
  ON billing_subscriptions FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

-- feature_flags
CREATE POLICY feature_flags_select_in_tenant
  ON feature_flags FOR SELECT TO authenticated
  USING (tenant_id = public.current_user_tenant_id());

CREATE POLICY feature_flags_insert_in_tenant
  ON feature_flags FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_user_tenant_id());

CREATE POLICY feature_flags_update_in_tenant
  ON feature_flags FOR UPDATE TO authenticated
  USING (tenant_id = public.current_user_tenant_id())
  WITH CHECK (tenant_id = public.current_user_tenant_id());

-- 6) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stores_tenant_id ON stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_sku ON products(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 7) updated_at trigger function and triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach triggers only to tables that have updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_expiry_updated_at BEFORE UPDATE ON product_expiry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_low_stock_alerts_updated_at BEFORE UPDATE ON low_stock_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_movements_updated_at BEFORE UPDATE ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_performance_updated_at BEFORE UPDATE ON staff_performance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_subscriptions_updated_at BEFORE UPDATE ON billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();