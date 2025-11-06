-- Clean Supabase Database Schema for POS & Inventory System
-- No conflicts, clean structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'email',
    email_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ
);

-- Platforms table
CREATE TABLE IF NOT EXISTS platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ingredient', 'menu')),
    description TEXT,
    color TEXT DEFAULT '#64748b',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, type)
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    unit TEXT NOT NULL DEFAULT 'pieces',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    min_stock DECIMAL(10,2) DEFAULT 0,
    current_stock DECIMAL(10,2) DEFAULT 0,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    supplier TEXT,
    supplier_code TEXT,
    barcode TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    reorder_point DECIMAL(10,2),
    max_stock DECIMAL(10,2),
    lead_time_days INTEGER DEFAULT 1,
    storage_location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menus table
CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time_minutes INTEGER DEFAULT 5,
    sort_order INTEGER DEFAULT 0,
    cost_price DECIMAL(10,2) DEFAULT 0,
    profit_margin DECIMAL(5,2),
    allergens TEXT[],
    nutrition_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Recipes junction table
CREATE TABLE IF NOT EXISTS menu_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    quantity_per_serve DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    is_optional BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(menu_id, ingredient_id)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id UUID NOT NULL,
    platform_id UUID,
    user_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    order_time TIME NOT NULL DEFAULT CURRENT_TIME,
    customer_name TEXT,
    customer_phone TEXT,
    order_number TEXT,
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'paid',
    status TEXT DEFAULT 'completed',
    notes TEXT,
    delivery_address TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    service_fee DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID,
    user_id UUID NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    vendor TEXT NOT NULL,
    vendor_invoice TEXT,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_time TIME NOT NULL DEFAULT CURRENT_TIME,
    receipt_image_url TEXT,
    receipt_number TEXT,
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'paid',
    delivery_date DATE,
    quality_notes TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL,
    transaction_type TEXT NOT NULL,
    quantity_change DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    reason TEXT,
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL,
    adjustment_type TEXT NOT NULL,
    previous_stock DECIMAL(10,3) NOT NULL,
    new_stock DECIMAL(10,3) NOT NULL,
    quantity_change DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    reason TEXT,
    notes TEXT,
    approved_by UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'THB',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash',
    receipt_image_url TEXT,
    receipt_number TEXT,
    vendor TEXT,
    project_code TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency TEXT,
    next_recurring_date DATE,
    status TEXT DEFAULT 'approved',
    approved_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labor Logs table
CREATE TABLE IF NOT EXISTS labor_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in_time TIMESTAMPTZ,
    clock_out_time TIMESTAMPTZ,
    break_minutes INTEGER DEFAULT 0,
    hours_worked DECIMAL(4,2),
    hourly_rate DECIMAL(8,2),
    total_pay DECIMAL(10,2),
    role_during_shift TEXT,
    notes TEXT,
    approved BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waste Tracking table
CREATE TABLE IF NOT EXISTS waste (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID,
    menu_id UUID,
    user_id UUID NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    waste_type TEXT NOT NULL,
    reason TEXT,
    estimated_cost DECIMAL(10,2),
    waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
    waste_time TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADVANCED INVENTORY & COSTING TABLES
-- ============================================================================

-- Cost Centers table (for department/location cost tracking)
CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    parent_id UUID REFERENCES cost_centers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packaging table (packaging materials inventory)
CREATE TABLE IF NOT EXISTS packaging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    unit TEXT NOT NULL DEFAULT 'pieces',
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    supplier TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lots table (for batch/lot tracking of ingredients)
CREATE TABLE IF NOT EXISTS lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_number TEXT UNIQUE NOT NULL,
    ingredient_id UUID REFERENCES ingredients(id),
    purchase_id UUID REFERENCES purchases(id),
    quantity DECIMAL(10,3) NOT NULL,
    remaining_quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    unit_cost DECIMAL(10,2),
    expiry_date DATE,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted', 'recalled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Runs table (bulk purchasing trips)
CREATE TABLE IF NOT EXISTS market_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id TEXT UNIQUE NOT NULL,
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID NOT NULL,
    market_name TEXT,
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Run Items table (items purchased in each market run)
CREATE TABLE IF NOT EXISTS market_run_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES market_runs(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    qty_buy DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (qty_buy * unit_price) STORED,
    lot_id UUID REFERENCES lots(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COGS table (Cost of Goods Sold tracking)
CREATE TABLE IF NOT EXISTS cogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id),
    menu_id UUID REFERENCES menus(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    ingredient_cost DECIMAL(10,2) DEFAULT 0,
    packaging_cost DECIMAL(10,2) DEFAULT 0,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    overhead_cost DECIMAL(10,2) DEFAULT 0,
    total_cogs DECIMAL(10,2) GENERATED ALWAYS AS (
        COALESCE(ingredient_cost, 0) + 
        COALESCE(packaging_cost, 0) + 
        COALESCE(labor_cost, 0) + 
        COALESCE(overhead_cost, 0)
    ) STORED,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stocks table (detailed stock tracking with lot info)
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    lot_id UUID REFERENCES lots(id),
    location TEXT,
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    last_counted_date DATE,
    counted_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packing table (finished product packing records)
CREATE TABLE IF NOT EXISTS packing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packing_id TEXT UNIQUE NOT NULL,
    menu_id UUID REFERENCES menus(id),
    quantity INTEGER NOT NULL,
    packed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    packed_by UUID REFERENCES users(id),
    expiry_date DATE,
    status TEXT DEFAULT 'packed' CHECK (status IN ('packed', 'sold', 'expired', 'damaged')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packing Purchases table (packaging material purchases)
CREATE TABLE IF NOT EXISTS packing_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packaging_id UUID REFERENCES packaging(id),
    user_id UUID NOT NULL REFERENCES users(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    vendor TEXT NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Overheads table (overhead cost allocation)
CREATE TABLE IF NOT EXISTS overheads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    allocation_method TEXT DEFAULT 'equal' CHECK (allocation_method IN ('equal', 'proportional', 'manual')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    cost_center_id UUID REFERENCES cost_centers(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Extras table (add-ons and customizations)
CREATE TABLE IF NOT EXISTS menu_extras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches table (production batches)
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number TEXT UNIQUE NOT NULL,
    menu_id UUID REFERENCES menus(id),
    quantity INTEGER NOT NULL,
    production_date DATE NOT NULL DEFAULT CURRENT_DATE,
    produced_by UUID REFERENCES users(id),
    expiry_date DATE,
    total_cost DECIMAL(10,2) DEFAULT 0,
    cost_per_unit DECIMAL(10,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Cost Lines table (detailed cost breakdown per batch)
CREATE TABLE IF NOT EXISTS batch_cost_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    cost_type TEXT NOT NULL CHECK (cost_type IN ('ingredient', 'packaging', 'labor', 'overhead', 'other')),
    item_id UUID,
    item_name TEXT NOT NULL,
    quantity DECIMAL(10,3),
    unit TEXT,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Calculate menu cost function
CREATE OR REPLACE FUNCTION calculate_menu_cost(menu_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_cost DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(mr.quantity_per_serve * i.cost_per_unit), 0)
    INTO total_cost
    FROM menu_recipes mr
    JOIN ingredients i ON mr.ingredient_id = i.id
    WHERE mr.menu_id = menu_uuid;

    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Update stock after transaction function
CREATE OR REPLACE FUNCTION update_stock_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'sales' THEN
        INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity_change, reference_id, reference_type, created_by)
        SELECT
            mr.ingredient_id,
            'sale',
            -(mr.quantity_per_serve * NEW.quantity),
            NEW.id,
            'sale',
            NEW.user_id
        FROM menu_recipes mr
        WHERE mr.menu_id = NEW.menu_id;

        UPDATE ingredients
        SET current_stock = current_stock - sub.total_used,
            updated_at = NOW()
        FROM (
            SELECT
                mr.ingredient_id,
                (mr.quantity_per_serve * NEW.quantity) as total_used
            FROM menu_recipes mr
            WHERE mr.menu_id = NEW.menu_id
        ) sub
        WHERE ingredients.id = sub.ingredient_id;

    ELSIF TG_TABLE_NAME = 'purchases' THEN
        INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity_change, reference_id, reference_type, created_by)
        VALUES (NEW.ingredient_id, 'purchase', NEW.quantity, NEW.id, 'purchase', NEW.user_id);

        UPDATE ingredients
        SET current_stock = current_stock + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;

    ELSIF TG_TABLE_NAME = 'stock_adjustments' THEN
        INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity_change, reference_id, reference_type, created_by)
        VALUES (NEW.ingredient_id, 'adjustment', NEW.quantity_change, NEW.id, 'adjustment', NEW.created_by);

        UPDATE ingredients
        SET current_stock = NEW.new_stock,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;

    ELSIF TG_TABLE_NAME = 'waste' THEN
        INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity_change, reference_id, reference_type, created_by)
        VALUES (NEW.ingredient_id, 'waste', -NEW.quantity, NEW.id, 'waste', NEW.user_id);

        UPDATE ingredients
        SET current_stock = current_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id AND NEW.ingredient_id IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update menu cost function
CREATE OR REPLACE FUNCTION update_menu_cost()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE menus
    SET
        cost_price = calculate_menu_cost(NEW.menu_id),
        profit_margin = CASE
            WHEN price > 0 THEN ((price - calculate_menu_cost(NEW.menu_id)) / price) * 100
            ELSE 0
        END,
        updated_at = NOW()
    WHERE id = NEW.menu_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update market run total function
CREATE OR REPLACE FUNCTION update_market_run_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE market_runs
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM market_run_items
        WHERE run_id = CASE
            WHEN TG_OP = 'DELETE' THEN OLD.run_id
            ELSE NEW.run_id
        END
    ),
    updated_at = NOW()
    WHERE id = CASE
        WHEN TG_OP = 'DELETE' THEN OLD.run_id
        ELSE NEW.run_id
    END;
    
    RETURN CASE
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql;

-- Update packaging stock function
CREATE OR REPLACE FUNCTION update_packaging_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'packing_purchases' THEN
        UPDATE packaging
        SET current_stock = current_stock + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.packaging_id;
    ELSIF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'packing' THEN
        -- Deduct packaging materials when packing finished products
        -- This would require a packing_recipes table similar to menu_recipes
        -- For now, this is a placeholder
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate batch cost function
CREATE OR REPLACE FUNCTION calculate_batch_cost(batch_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(total_cost), 0)
    INTO total
    FROM batch_cost_lines
    WHERE batch_id = batch_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Update batch cost trigger function
CREATE OR REPLACE FUNCTION update_batch_total_cost()
RETURNS TRIGGER AS $$
DECLARE
    batch_qty INTEGER;
BEGIN
    -- Calculate total cost
    UPDATE batches
    SET total_cost = calculate_batch_cost(CASE
        WHEN TG_OP = 'DELETE' THEN OLD.batch_id
        ELSE NEW.batch_id
    END)
    WHERE id = CASE
        WHEN TG_OP = 'DELETE' THEN OLD.batch_id
        ELSE NEW.batch_id
    END
    RETURNING quantity INTO batch_qty;
    
    -- Calculate cost per unit
    IF batch_qty > 0 THEN
        UPDATE batches
        SET cost_per_unit = total_cost / batch_qty
        WHERE id = CASE
            WHEN TG_OP = 'DELETE' THEN OLD.batch_id
            ELSE NEW.batch_id
        END;
    END IF;
    
    RETURN CASE
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_stock_after_sale ON sales;
DROP TRIGGER IF EXISTS update_stock_after_purchase ON purchases;
DROP TRIGGER IF EXISTS update_stock_after_adjustment ON stock_adjustments;
DROP TRIGGER IF EXISTS update_stock_after_waste ON waste;
DROP TRIGGER IF EXISTS update_menu_cost_trigger ON menu_recipes;
DROP TRIGGER IF EXISTS update_users_timestamp ON users;
DROP TRIGGER IF EXISTS update_ingredients_timestamp ON ingredients;
DROP TRIGGER IF EXISTS update_menus_timestamp ON menus;
DROP TRIGGER IF EXISTS update_sales_timestamp ON sales;
DROP TRIGGER IF EXISTS update_purchases_timestamp ON purchases;
DROP TRIGGER IF EXISTS update_market_run_total_trigger ON market_run_items;
DROP TRIGGER IF EXISTS update_packaging_stock_on_purchase ON packing_purchases;
DROP TRIGGER IF EXISTS update_batch_cost_trigger ON batch_cost_lines;
DROP TRIGGER IF EXISTS update_market_runs_timestamp ON market_runs;
DROP TRIGGER IF EXISTS update_cost_centers_timestamp ON cost_centers;
DROP TRIGGER IF EXISTS update_packaging_timestamp ON packaging;
DROP TRIGGER IF EXISTS update_stocks_timestamp ON stocks;

-- Automatic stock update triggers
CREATE TRIGGER update_stock_after_sale
    AFTER INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION update_stock_after_transaction();

CREATE TRIGGER update_stock_after_purchase
    AFTER INSERT ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_stock_after_transaction();

CREATE TRIGGER update_stock_after_adjustment
    AFTER INSERT ON stock_adjustments
    FOR EACH ROW EXECUTE FUNCTION update_stock_after_transaction();

CREATE TRIGGER update_stock_after_waste
    AFTER INSERT ON waste
    FOR EACH ROW EXECUTE FUNCTION update_stock_after_transaction();

-- Automatic menu cost calculation trigger
CREATE TRIGGER update_menu_cost_trigger
    AFTER INSERT OR UPDATE ON menu_recipes
    FOR EACH ROW EXECUTE FUNCTION update_menu_cost();

-- Update timestamp triggers
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_timestamp
    BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_timestamp
    BEFORE UPDATE ON menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_timestamp
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_timestamp
    BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- New table triggers
CREATE TRIGGER update_market_run_total_trigger
    AFTER INSERT OR UPDATE OR DELETE ON market_run_items
    FOR EACH ROW EXECUTE FUNCTION update_market_run_total();

CREATE TRIGGER update_packaging_stock_on_purchase
    AFTER INSERT ON packing_purchases
    FOR EACH ROW EXECUTE FUNCTION update_packaging_stock();

CREATE TRIGGER update_batch_cost_trigger
    AFTER INSERT OR UPDATE OR DELETE ON batch_cost_lines
    FOR EACH ROW EXECUTE FUNCTION update_batch_total_cost();

CREATE TRIGGER update_market_runs_timestamp
    BEFORE UPDATE ON market_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_centers_timestamp
    BEFORE UPDATE ON cost_centers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packaging_timestamp
    BEFORE UPDATE ON packaging
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_timestamp
    BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Note: platforms does NOT have RLS enabled for real-time to work without authentication

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view all sales" ON sales;
DROP POLICY IF EXISTS "Users can insert sales" ON sales;
DROP POLICY IF EXISTS "Users can view all purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert purchases" ON purchases;
DROP POLICY IF EXISTS "Public read access for categories" ON categories;
DROP POLICY IF EXISTS "Public read access for active ingredients" ON ingredients;
DROP POLICY IF EXISTS "Public read access for active menus" ON menus;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Sales policies
CREATE POLICY "Users can view all sales" ON sales
    FOR SELECT USING (auth.role() = 'admin' OR auth.uid() = user_id);

CREATE POLICY "Users can insert sales" ON sales
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Purchases policies
CREATE POLICY "Users can view all purchases" ON purchases
    FOR SELECT USING (auth.role() = 'admin' OR auth.uid() = user_id);

CREATE POLICY "Users can insert purchases" ON purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: No RLS policies for platforms to allow real-time without auth

-- Public read access for reference data
CREATE POLICY "Public read access for categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Public read access for active ingredients" ON ingredients
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for active menus" ON menus
    FOR SELECT USING (is_active = true AND is_available = true);

-- ============================================================================
-- REPORTING VIEWS
-- ============================================================================

-- Low Stock View
CREATE OR REPLACE VIEW low_stock_view AS
SELECT
    i.id,
    i.name,
    i.current_stock,
    i.min_stock,
    i.unit,
    i.cost_per_unit,
    c.name as category_name,
    (i.current_stock <= i.min_stock) as need_reorder,
    (i.min_stock - i.current_stock) as shortage_amount,
    (i.min_stock - i.current_stock) * i.cost_per_unit as reorder_value,
    i.supplier,
    i.updated_at as last_updated
FROM ingredients i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.is_active = true
AND i.current_stock <= i.min_stock
ORDER BY shortage_amount DESC;

-- Recent Transactions View
CREATE OR REPLACE VIEW recent_transactions_view AS
SELECT
    s.id,
    'sale' as type,
    m.name as item_name,
    m.menu_id,
    p.name as platform,
    s.quantity,
    s.total_amount,
    s.order_date,
    s.order_time,
    u.display_name as user,
    s.status,
    s.payment_status
FROM sales s
JOIN menus m ON s.menu_id = m.id
LEFT JOIN platforms p ON s.platform_id = p.id
JOIN users u ON s.user_id = u.id

UNION ALL

SELECT
    p.id,
    'purchase' as type,
    i.name as item_name,
    NULL as menu_id,
    p.vendor as platform,
    p.quantity,
    p.total_amount,
    p.purchase_date as order_date,
    p.purchase_time as order_time,
    u.display_name as user,
    p.status,
    p.payment_status
FROM purchases p
JOIN ingredients i ON p.ingredient_id = i.id
JOIN users u ON p.user_id = u.id
ORDER BY order_date DESC, order_time DESC;

-- Daily Sales Summary View
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT
    s.order_date,
    p.name as platform,
    COUNT(*) as transaction_count,
    SUM(s.quantity) as total_items,
    SUM(s.total_amount) as total_revenue,
    SUM(s.discount_amount) as total_discounts,
    AVG(s.total_amount) as avg_order_value
FROM sales s
LEFT JOIN platforms p ON s.platform_id = p.id
WHERE s.status = 'completed'
GROUP BY s.order_date, p.name
ORDER BY s.order_date DESC;

-- Market Run Summary View
CREATE OR REPLACE VIEW market_run_summary AS
SELECT
    mr.run_id,
    mr.run_date,
    mr.market_name,
    u.display_name as buyer,
    COUNT(mri.id) as items_count,
    SUM(mri.total_price) as total_amount,
    mr.status,
    mr.created_at
FROM market_runs mr
LEFT JOIN market_run_items mri ON mr.id = mri.run_id
LEFT JOIN users u ON mr.user_id = u.id
GROUP BY mr.id, mr.run_id, mr.run_date, mr.market_name, u.display_name, mr.status, mr.created_at
ORDER BY mr.run_date DESC;

-- Expired Lots View
CREATE OR REPLACE VIEW expired_lots_view AS
SELECT
    l.lot_number,
    i.name as ingredient_name,
    l.remaining_quantity,
    l.unit,
    l.expiry_date,
    l.received_date,
    (l.remaining_quantity * l.unit_cost) as waste_value,
    l.status
FROM lots l
JOIN ingredients i ON l.ingredient_id = i.id
WHERE l.expiry_date < CURRENT_DATE
AND l.remaining_quantity > 0
AND l.status = 'active'
ORDER BY l.expiry_date;

-- COGS Analysis View
CREATE OR REPLACE VIEW cogs_analysis AS
SELECT
    c.date,
    m.name as menu_name,
    m.menu_id,
    SUM(c.quantity) as units_sold,
    AVG(c.ingredient_cost) as avg_ingredient_cost,
    AVG(c.packaging_cost) as avg_packaging_cost,
    AVG(c.labor_cost) as avg_labor_cost,
    AVG(c.overhead_cost) as avg_overhead_cost,
    AVG(c.total_cogs) as avg_total_cogs,
    SUM(c.total_cogs) as total_cogs
FROM cogs c
JOIN menus m ON c.menu_id = m.id
GROUP BY c.date, m.id, m.name, m.menu_id
ORDER BY c.date DESC;

-- Packaging Inventory Value View
CREATE OR REPLACE VIEW packaging_inventory_value AS
SELECT
    p.name,
    p.current_stock,
    p.min_stock,
    p.cost_per_unit,
    (p.current_stock * p.cost_per_unit) as total_value,
    (p.current_stock <= p.min_stock) as need_reorder,
    p.supplier
FROM packaging p
WHERE p.is_active = true
ORDER BY total_value DESC;

-- Production Batch Cost View
CREATE OR REPLACE VIEW batch_cost_summary AS
SELECT
    b.batch_number,
    m.name as menu_name,
    b.quantity,
    b.production_date,
    b.total_cost,
    b.cost_per_unit,
    u.display_name as produced_by,
    b.status
FROM batches b
LEFT JOIN menus m ON b.menu_id = m.id
LEFT JOIN users u ON b.produced_by = u.id
ORDER BY b.production_date DESC;

-- Stock by Location View
CREATE OR REPLACE VIEW stock_by_location AS
SELECT
    s.location,
    i.name as ingredient_name,
    s.quantity,
    s.unit,
    l.lot_number,
    l.expiry_date,
    s.last_counted_date
FROM stocks s
JOIN ingredients i ON s.ingredient_id = i.id
LEFT JOIN lots l ON s.lot_id = l.id
WHERE s.quantity > 0
ORDER BY s.location, i.name;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Ingredients indexes
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock, min_stock);
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON ingredients(is_active);

-- Menus indexes
CREATE INDEX IF NOT EXISTS idx_menus_name ON menus(name);
CREATE INDEX IF NOT EXISTS idx_menus_category ON menus(category_id);
CREATE INDEX IF NOT EXISTS idx_menus_active ON menus(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_menus_price ON menus(price);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_menu ON sales(menu_id);
CREATE INDEX IF NOT EXISTS idx_sales_platform ON sales(platform_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_ingredient ON purchases(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_purchases_vendor ON purchases(vendor);

-- Stock transactions indexes
CREATE INDEX IF NOT EXISTS idx_stock_transactions_ingredient ON stock_transactions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_type ON stock_transactions(transaction_type);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_sales_date_platform ON sales(order_date, platform_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock_active ON ingredients(current_stock, min_stock, is_active);

-- Lots indexes
CREATE INDEX IF NOT EXISTS idx_lots_ingredient ON lots(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_lots_purchase ON lots(purchase_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
CREATE INDEX IF NOT EXISTS idx_lots_expiry ON lots(expiry_date);

-- Market runs indexes
CREATE INDEX IF NOT EXISTS idx_market_runs_date ON market_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_market_runs_user ON market_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_market_runs_status ON market_runs(status);

-- Market run items indexes
CREATE INDEX IF NOT EXISTS idx_market_run_items_run ON market_run_items(run_id);
CREATE INDEX IF NOT EXISTS idx_market_run_items_ingredient ON market_run_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_market_run_items_lot ON market_run_items(lot_id);

-- COGS indexes
CREATE INDEX IF NOT EXISTS idx_cogs_sale ON cogs(sale_id);
CREATE INDEX IF NOT EXISTS idx_cogs_menu ON cogs(menu_id);
CREATE INDEX IF NOT EXISTS idx_cogs_date ON cogs(date);

-- Stocks indexes
CREATE INDEX IF NOT EXISTS idx_stocks_ingredient ON stocks(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stocks_lot ON stocks(lot_id);
CREATE INDEX IF NOT EXISTS idx_stocks_location ON stocks(location);

-- Packaging indexes
CREATE INDEX IF NOT EXISTS idx_packaging_name ON packaging(name);
CREATE INDEX IF NOT EXISTS idx_packaging_active ON packaging(is_active);

-- Packing indexes
CREATE INDEX IF NOT EXISTS idx_packing_menu ON packing(menu_id);
CREATE INDEX IF NOT EXISTS idx_packing_date ON packing(packed_date);
CREATE INDEX IF NOT EXISTS idx_packing_status ON packing(status);

-- Batches indexes
CREATE INDEX IF NOT EXISTS idx_batches_menu ON batches(menu_id);
CREATE INDEX IF NOT EXISTS idx_batches_date ON batches(production_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);

-- Batch cost lines indexes
CREATE INDEX IF NOT EXISTS idx_batch_cost_lines_batch ON batch_cost_lines(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_cost_lines_type ON batch_cost_lines(cost_type);

-- Overheads indexes
CREATE INDEX IF NOT EXISTS idx_overheads_period ON overheads(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_overheads_cost_center ON overheads(cost_center_id);

-- ============================================================================
-- REAL-TIME CONFIGURATION
-- ============================================================================

-- Enable real-time for key tables (skip if already exists)
DO $$
BEGIN
    -- Set replica identity to full for real-time to work properly
    EXECUTE 'ALTER TABLE platforms REPLICA IDENTITY FULL';
    EXECUTE 'ALTER TABLE sales REPLICA IDENTITY FULL';
    EXECUTE 'ALTER TABLE ingredients REPLICA IDENTITY FULL';
    EXECUTE 'ALTER TABLE menus REPLICA IDENTITY FULL';
    
    -- Add tables to real-time publication if not already added
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE platforms;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Table already in publication, skip
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE sales;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE ingredients;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE menus;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    RAISE NOTICE '✅ Real-time configured for: platforms, sales, ingredients, menus';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Real-time configuration: % (this is normal if already configured)', SQLERRM;
END $$;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default platforms
INSERT INTO platforms (name, commission_rate, sort_order) VALUES
    ('ร้าน', 0.00, 1),
    ('Grab', 0.20, 2),
    ('FoodPanda', 0.22, 3),
    ('Line Man', 0.18, 4)
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, type, color) VALUES
    ('ทะเล', 'ingredient', '#3b82f6'),
    ('เนื้อสัตว์', 'ingredient', '#ef4444'),
    ('ผัก', 'ingredient', '#22c55e'),
    ('เครื่องเคียง', 'ingredient', '#f59e0b'),
    ('เครื่องดื่ม', 'ingredient', '#8b5cf6'),
    ('กุ้งแช่น้ำปลา', 'menu', '#dc2626'),
    ('กุ้งดองซีอิ๊ว', 'menu', '#ea580c'),
    ('เซ็ตเมนู', 'menu', '#16a34a'),
    ('แซลมอน', 'menu', '#9333ea'),
    ('คอมโบเมนู', 'menu', '#0891b2'),
    ('ของทานเล่น', 'menu', '#ca8a04')
ON CONFLICT (name, type) DO NOTHING;

-- Create admin user placeholder
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@pos.local') THEN
        INSERT INTO users (email, display_name, role, email_verified)
        VALUES ('admin@pos.local', 'System Administrator', 'admin', true)
        ON CONFLICT (email) DO NOTHING;
    END IF;
END
$$;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Log successful schema creation
DO $$
BEGIN
    RAISE NOTICE 'Clean Supabase POS Database Schema created successfully at %', NOW();
END;
$$;
