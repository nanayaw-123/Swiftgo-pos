-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant_id from Supabase Auth user_id
CREATE OR REPLACE FUNCTION get_user_tenant_id(auth_user_id UUID)
RETURNS UUID AS $$
    SELECT tenant_id FROM profiles WHERE user_id = auth_user_id LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role(auth_user_id UUID)
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE user_id = auth_user_id LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Tenants policies
CREATE POLICY "Users can view their own tenant"
    ON tenants FOR SELECT
    USING (id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Owners can update their tenant"
    ON tenants FOR UPDATE
    USING (
        id = get_user_tenant_id(auth.uid()) 
        AND get_user_role(auth.uid()) = 'owner'
    );

-- Profiles policies
CREATE POLICY "Users can view profiles in their tenant"
    ON profiles FOR SELECT
    USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Owners and managers can create profiles"
    ON profiles FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id(auth.uid())
        AND get_user_role(auth.uid()) IN ('owner', 'manager')
    );

CREATE POLICY "Owners and managers can update profiles"
    ON profiles FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id(auth.uid())
        AND get_user_role(auth.uid()) IN ('owner', 'manager')
    );

CREATE POLICY "Owners can delete profiles"
    ON profiles FOR DELETE
    USING (
        tenant_id = get_user_tenant_id(auth.uid())
        AND get_user_role(auth.uid()) = 'owner'
    );

-- Stores policies
CREATE POLICY "Users can view stores in their tenant"
    ON stores FOR SELECT
    USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Owners and managers can manage stores"
    ON stores FOR ALL
    USING (
        tenant_id = get_user_tenant_id(auth.uid())
        AND get_user_role(auth.uid()) IN ('owner', 'manager')
    );

-- Products policies
CREATE POLICY "Users can view products in their tenant"
    ON products FOR SELECT
    USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Owners and managers can manage products"
    ON products FOR ALL
    USING (
        tenant_id = get_user_tenant_id(auth.uid())
        AND get_user_role(auth.uid()) IN ('owner', 'manager')
    );

-- Sales policies
CREATE POLICY "Users can view sales in their tenant"
    ON sales FOR SELECT
    USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "All users can create sales"
    ON sales FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Inventory movements policies
CREATE POLICY "Users can view inventory movements in their tenant"
    ON inventory_movements FOR SELECT
    USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Owners and managers can manage inventory"
    ON inventory_movements FOR ALL
    USING (
        tenant_id = get_user_tenant_id(auth.uid())
        AND get_user_role(auth.uid()) IN ('owner', 'manager')
    );

-- Billing subscriptions policies
CREATE POLICY "Owners can view billing"
    ON billing_subscriptions FOR SELECT
    USING (
        tenant_id = get_user_tenant_id(auth.uid())
        AND get_user_role(auth.uid()) = 'owner'
    );

-- Feature flags policies
CREATE POLICY "Users can view feature flags in their tenant"
    ON feature_flags FOR SELECT
    USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Audit logs policies
CREATE POLICY "Owners and managers can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        tenant_id = get_user_tenant_id(auth.uid())
        AND get_user_role(auth.uid()) IN ('owner', 'manager')
    );

CREATE POLICY "All users can create audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));