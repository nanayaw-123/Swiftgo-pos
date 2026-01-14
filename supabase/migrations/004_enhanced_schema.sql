-- Add phone number support to profiles
ALTER TABLE profiles ADD COLUMN phone TEXT;

-- Add business details to tenants
ALTER TABLE tenants ADD COLUMN currency TEXT NOT NULL DEFAULT 'GHS';
ALTER TABLE tenants ADD COLUMN business_type TEXT CHECK (business_type IN ('shop', 'pharmacy', 'boutique', 'restaurant', 'cafe', 'supermarket', 'other'));

-- Add supplier and expiry tracking to products
ALTER TABLE products ADD COLUMN supplier TEXT;
ALTER TABLE products ADD COLUMN expiry_date DATE;
ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 10;

-- Update payment methods to include MoMo
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check 
    CHECK (payment_method IN ('cash', 'card', 'momo', 'bank_transfer'));

-- Create pending_orders table for saved carts
CREATE TABLE pending_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    cashier_id TEXT NOT NULL,
    customer_name TEXT,
    items JSONB NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create low_stock_alerts table
CREATE TABLE low_stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create function to check and create low stock alerts
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is below threshold
    IF NEW.stock <= NEW.low_stock_threshold THEN
        -- Insert or update alert
        INSERT INTO low_stock_alerts (tenant_id, product_id, current_stock, threshold)
        VALUES (NEW.tenant_id, NEW.id, NEW.stock, NEW.low_stock_threshold)
        ON CONFLICT (product_id) WHERE NOT acknowledged
        DO UPDATE SET 
            current_stock = NEW.stock,
            threshold = NEW.low_stock_threshold,
            created_at = NOW();
    ELSE
        -- Delete alert if stock is back above threshold
        DELETE FROM low_stock_alerts 
        WHERE product_id = NEW.id AND NOT acknowledged;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock alerts
CREATE TRIGGER trigger_check_low_stock
AFTER UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION check_low_stock();

-- Add unique constraint to low_stock_alerts
CREATE UNIQUE INDEX idx_low_stock_alerts_product_unacknowledged 
ON low_stock_alerts(product_id) WHERE NOT acknowledged;

-- Create indexes
CREATE INDEX idx_pending_orders_tenant_id ON pending_orders(tenant_id);
CREATE INDEX idx_pending_orders_store_id ON pending_orders(store_id);
CREATE INDEX idx_low_stock_alerts_tenant_id ON low_stock_alerts(tenant_id);
CREATE INDEX idx_low_stock_alerts_acknowledged ON low_stock_alerts(acknowledged);
CREATE INDEX idx_products_expiry_date ON products(expiry_date) WHERE expiry_date IS NOT NULL;

-- Add trigger for pending_orders updated_at
CREATE TRIGGER update_pending_orders_updated_at BEFORE UPDATE ON pending_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
