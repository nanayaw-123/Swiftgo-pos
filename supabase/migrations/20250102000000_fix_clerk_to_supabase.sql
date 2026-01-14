-- Migration to fix Clerk references to Supabase Auth
-- This migration renames columns from old Clerk naming to Supabase naming

-- 1. Fix tenants table: rename owner_id to owner_user_id (if it exists as owner_id)
DO $$ 
BEGIN
    -- Check if owner_id column exists (old name)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE tenants RENAME COLUMN owner_id TO owner_user_id;
    END IF;
    
    -- Check if owner_clerk_id column exists (another old name)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'owner_clerk_id'
    ) THEN
        ALTER TABLE tenants RENAME COLUMN owner_clerk_id TO owner_user_id;
    END IF;
END $$;

-- 2. Fix profiles table: rename clerk_id to user_id (if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'clerk_id'
    ) THEN
        ALTER TABLE profiles RENAME COLUMN clerk_id TO user_id;
    END IF;
END $$;

-- 3. Add missing columns to profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN first_name TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_name TEXT;
    END IF;
END $$;

-- 4. Add missing columns to products if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'cost'
    ) THEN
        ALTER TABLE products ADD COLUMN cost NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
    ) THEN
        ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 10;
    END IF;
END $$;

-- 5. Add missing columns to stores if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'phone'
    ) THEN
        ALTER TABLE stores ADD COLUMN phone TEXT;
    END IF;
END $$;

-- 6. Add updated_at to sales if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE sales ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE sales ADD COLUMN customer_name TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'notes'
    ) THEN
        ALTER TABLE sales ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 7. Add missing columns to inventory_movements if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_movements' AND column_name = 'reference_id'
    ) THEN
        ALTER TABLE inventory_movements ADD COLUMN reference_id UUID;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_movements' AND column_name = 'performed_by'
    ) THEN
        ALTER TABLE inventory_movements ADD COLUMN performed_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_movements' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE inventory_movements ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 8. Update payment_method check constraint to include mobile_money (ONLY if column exists)
DO $$ 
BEGIN
    -- Only proceed if payment_method column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'payment_method'
    ) THEN
        -- Drop old constraint if exists
        ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
        
        -- Add new constraint
        ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check 
            CHECK (payment_method IN ('cash', 'card', 'digital', 'mobile_money'));
    END IF;
END $$;

-- 9. Update inventory_movements type check constraint (ONLY if column and table exist)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_movements' AND column_name = 'type'
    ) THEN
        -- Drop old constraint if exists
        ALTER TABLE inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_type_check;
        
        -- Add new constraint
        ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_type_check 
            CHECK (type IN ('in', 'out', 'adjustment', 'sale', 'restock', 'transfer'));
    END IF;
END $$;

-- 10. Remove UNIQUE constraint from tenants.owner_user_id if it exists
DO $$ 
BEGIN
    ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_owner_id_key;
    ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_owner_clerk_id_key;
    ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_owner_user_id_key;
END $$;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed: Clerk references fixed to Supabase Auth';
END $$;