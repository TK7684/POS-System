-- Improved Cost Calculation System
-- Handles different prices for the same ingredient with multiple costing methods

-- ============================================================================
-- OPTION 1: Weighted Average Cost (Recommended for most businesses)
-- ============================================================================
-- This calculates the average cost based on all purchases, weighted by quantity
-- Best for: General inventory management, smooth price fluctuations

CREATE OR REPLACE FUNCTION update_ingredient_cost_weighted_average()
RETURNS TRIGGER AS $$
DECLARE
    weighted_avg DECIMAL(10,2);
    total_qty DECIMAL(10,3);
    total_cost DECIMAL(10,2);
BEGIN
    -- Calculate weighted average: SUM(quantity * price) / SUM(quantity)
    SELECT 
        COALESCE(SUM(p.quantity * p.unit_price), 0),
        COALESCE(SUM(p.quantity), 0)
    INTO total_cost, total_qty
    FROM purchases p
    WHERE p.ingredient_id = NEW.ingredient_id
      AND p.unit_price IS NOT NULL 
      AND p.unit_price > 0
      AND p.purchase_date >= CURRENT_DATE - INTERVAL '90 days'; -- Last 3 months
    
    -- Calculate weighted average
    IF total_qty > 0 THEN
        weighted_avg := total_cost / total_qty;
    ELSE
        weighted_avg := NEW.unit_price; -- Fallback to current purchase price
    END IF;
    
    -- Update ingredient cost_per_unit
    UPDATE ingredients
    SET 
        cost_per_unit = weighted_avg,
        updated_at = NOW()
    WHERE id = NEW.ingredient_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- OPTION 2: Latest Purchase Price (Current Simple Method)
-- ============================================================================
-- Uses the most recent purchase price
-- Best for: Stable prices, manual cost control

CREATE OR REPLACE FUNCTION update_ingredient_cost_latest()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ingredients
    SET 
        cost_per_unit = NEW.unit_price,
        updated_at = NOW()
    WHERE id = NEW.ingredient_id
      AND NEW.unit_price IS NOT NULL 
      AND NEW.unit_price > 0;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- OPTION 3: FIFO Cost (First In, First Out)
-- ============================================================================
-- Uses the cost from the oldest lot/purchase still in stock
-- Requires: Lots table tracking
-- Best for: Perishable items, expiry tracking

CREATE OR REPLACE FUNCTION get_fifo_cost(ingredient_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    fifo_cost DECIMAL(10,2);
BEGIN
    SELECT unit_cost INTO fifo_cost
    FROM lots
    WHERE ingredient_id = ingredient_uuid
      AND status = 'active'
      AND remaining_quantity > 0
    ORDER BY received_date ASC, created_at ASC
    LIMIT 1;
    
    RETURN COALESCE(fifo_cost, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Purchase History with Cost Analysis
-- ============================================================================

CREATE OR REPLACE VIEW ingredient_purchase_analysis AS
SELECT 
    i.id as ingredient_id,
    i.name as ingredient_name,
    i.unit,
    i.cost_per_unit as current_cost,
    COUNT(p.id) as purchase_count,
    MIN(p.unit_price) as min_price,
    MAX(p.unit_price) as max_price,
    AVG(p.unit_price) as avg_price,
    -- Weighted average
    CASE 
        WHEN SUM(p.quantity) > 0 
        THEN SUM(p.quantity * p.unit_price) / SUM(p.quantity)
        ELSE NULL
    END as weighted_avg_price,
    SUM(p.quantity) as total_purchased_qty,
    SUM(p.total_amount) as total_purchased_amount,
    MAX(p.purchase_date) as last_purchase_date,
    MIN(p.purchase_date) as first_purchase_date
FROM ingredients i
LEFT JOIN purchases p ON i.id = p.ingredient_id
WHERE p.unit_price IS NOT NULL AND p.unit_price > 0
GROUP BY i.id, i.name, i.unit, i.cost_per_unit;

-- ============================================================================
-- FUNCTION: Update cost using preferred method
-- ============================================================================
-- You can switch between methods by changing which trigger is active

-- To use Weighted Average (recommended):
DROP TRIGGER IF EXISTS trigger_update_ingredient_cost ON purchases;
CREATE TRIGGER trigger_update_ingredient_cost
    AFTER INSERT OR UPDATE ON purchases
    FOR EACH ROW
    WHEN (NEW.unit_price IS NOT NULL AND NEW.unit_price > 0)
    EXECUTE FUNCTION update_ingredient_cost_weighted_average();

-- To use Latest Price instead, comment above and uncomment below:
/*
DROP TRIGGER IF EXISTS trigger_update_ingredient_cost ON purchases;
CREATE TRIGGER trigger_update_ingredient_cost
    AFTER INSERT OR UPDATE ON purchases
    FOR EACH ROW
    WHEN (NEW.unit_price IS NOT NULL AND NEW.unit_price > 0)
    EXECUTE FUNCTION update_ingredient_cost_latest();
*/

-- ============================================================================
-- FUNCTION: Manually recalculate all ingredient costs
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_all_ingredient_costs()
RETURNS TABLE (
    ingredient_id UUID,
    ingredient_name TEXT,
    old_cost DECIMAL(10,2),
    new_cost DECIMAL(10,2),
    purchase_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH cost_updates AS (
        SELECT 
            i.id,
            i.name,
            i.cost_per_unit as old_cost,
            CASE 
                WHEN SUM(p.quantity) > 0 
                THEN SUM(p.quantity * p.unit_price) / SUM(p.quantity)
                ELSE i.cost_per_unit
            END as new_cost,
            COUNT(p.id) as p_count
        FROM ingredients i
        LEFT JOIN purchases p ON i.id = p.ingredient_id
            AND p.unit_price IS NOT NULL 
            AND p.unit_price > 0
            AND p.purchase_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY i.id, i.name, i.cost_per_unit
    )
    UPDATE ingredients
    SET 
        cost_per_unit = cu.new_cost,
        updated_at = NOW()
    FROM cost_updates cu
    WHERE ingredients.id = cu.id
    RETURNING 
        cu.id,
        cu.name,
        cu.old_cost,
        cu.new_cost,
        cu.p_count;
END;
$$ LANGUAGE plpgsql;

