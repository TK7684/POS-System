-- Fix stock_transactions trigger to include unit field
-- This fixes the error: "null value in column "unit" of relation "stock_transactions" violates not-null constraint"

-- Drop and recreate the trigger function with unit field included
CREATE OR REPLACE FUNCTION update_stock_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'sales' THEN
        -- Insert stock transactions with unit from ingredients
        INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity_change, unit, reference_id, reference_type, created_by)
        SELECT
            mr.ingredient_id,
            'sale',
            -(mr.quantity_per_serve * NEW.quantity),
            i.unit,  -- Get unit from ingredient
            NEW.id,
            'sale',
            NEW.user_id
        FROM menu_recipes mr
        JOIN ingredients i ON mr.ingredient_id = i.id
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
        -- Insert stock transactions with unit from purchase or ingredient
        INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity_change, unit, reference_id, reference_type, created_by)
        SELECT
            NEW.ingredient_id,
            'purchase',
            NEW.quantity,
            COALESCE(NEW.unit, i.unit),  -- Use purchase unit or ingredient unit as fallback
            NEW.id,
            'purchase',
            NEW.user_id
        FROM ingredients i
        WHERE i.id = NEW.ingredient_id;

        -- Update stock and cost_per_unit from purchase
        UPDATE ingredients
        SET 
            current_stock = current_stock + NEW.quantity,
            -- Update cost_per_unit from purchase unit_price (if provided and valid)
            cost_per_unit = CASE 
                WHEN NEW.unit_price IS NOT NULL AND NEW.unit_price > 0 THEN NEW.unit_price
                ELSE cost_per_unit  -- Keep existing cost if purchase doesn't have valid price
            END,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;

    ELSIF TG_TABLE_NAME = 'stock_adjustments' THEN
        -- Insert stock transactions with unit from adjustment
        INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity_change, unit, reference_id, reference_type, created_by)
        VALUES (
            NEW.ingredient_id,
            'adjustment',
            NEW.quantity_change,
            NEW.unit,
            NEW.id,
            'adjustment',
            NEW.created_by
        );

        UPDATE ingredients
        SET current_stock = NEW.new_stock,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;

    ELSIF TG_TABLE_NAME = 'waste' THEN
        -- Insert stock transactions with unit from waste
        INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity_change, unit, reference_id, reference_type, created_by)
        VALUES (
            NEW.ingredient_id,
            'waste',
            -NEW.quantity,
            NEW.unit,
            NEW.id,
            'waste',
            NEW.user_id
        );

        UPDATE ingredients
        SET current_stock = current_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id AND NEW.ingredient_id IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Stock transactions trigger updated successfully!';
    RAISE NOTICE 'The trigger now includes the unit field from ingredients.';
    RAISE NOTICE '';
END $$;

