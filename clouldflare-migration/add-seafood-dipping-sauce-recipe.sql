-- Add Recipe for น้ำจิ้มซีฟู๊ด (Seafood Dipping Sauce)
-- This adds the complete recipe with all ingredients for cost calculation

-- ============================================================================
-- STEP 1: Ensure all ingredients exist
-- ============================================================================

INSERT INTO ingredients (name, unit, description, is_active) VALUES
    ('พริกสวน', 'กรัม', 'พริกขี้หนูสวน', true),
    ('ผักชี ราก+ต้น', 'กรัม', 'ผักชีพร้อมรากและต้น', true),
    ('กระเทียมไทย', 'กรัม', 'กระเทียมไทยหั่นบาง', true),
    ('กระเทียมจีน', 'กรัม', 'กระเทียมจีน', true),
    ('น้ำตาลมะพร้าว', 'กรัม', 'น้ำตาลมะพร้าวธรรมชาติ', true),
    ('น้ำตาลทรายขาว', 'กรัม', 'น้ำตาลทรายขาว', true),
    ('เกลือป่น', 'กรัม', 'เกลือป่น', true),
    ('ผงชูรส', 'กรัม', 'ชูรส อายิโนะโมโตะ', true),
    ('ตะไคร้ซอย', 'ต้น', 'ตะไคร้ซอย', true),
    ('เนื้อกระเทียมดอง', 'หัว', 'เนื้อกระเทียมดอง', true),
    ('น้ำปลา', 'มล', 'น้ำปลาทิพรส', true),
    ('น้ำกระเทียมดอง', 'มล', 'น้ำกระเทียมดอง', true),
    ('มะนาวขวด', 'มล', 'น้ำมะนาวขวด', true),
    ('มะนาวจริง', 'มล', 'น้ำมะนาวจริง', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 2: Find or create menu for น้ำจิ้มซีฟู๊ด
-- ============================================================================

DO $$
DECLARE
    v_menu_id UUID;
    v_menu_code TEXT := 'SAUCE-001';
    v_category_id UUID;
BEGIN
    -- Get or create a category for sauces
    SELECT id INTO v_category_id FROM categories WHERE name = 'น้ำจิ้ม' AND type = 'menu' LIMIT 1;
    
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, type, description)
        VALUES ('น้ำจิ้ม', 'menu', 'น้ำจิ้มและซอส')
        RETURNING id INTO v_category_id;
    END IF;

    -- Check if menu already exists
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = v_menu_code OR name ILIKE '%น้ำจิ้มซีฟู๊ด%' LIMIT 1;
    
    IF v_menu_id IS NULL THEN
        -- Create new menu
        INSERT INTO menus (menu_id, name, description, price, category_id, is_active, is_available)
        VALUES (
            v_menu_code,
            'น้ำจิ้มซีฟู๊ด',
            'สูตรน้ำจิ้มซีฟู๊ด✨ (O) - สำหรับคำนวณต้นทุน',
            0, -- Price 0 because it's a recipe component, not a sellable item
            v_category_id,
            true,
            false -- Not available for sale, just for cost calculation
        )
        RETURNING id INTO v_menu_id;
        
        RAISE NOTICE '✅ Created menu: น้ำจิ้มซีฟู๊ด (ID: %)', v_menu_id;
    ELSE
        RAISE NOTICE '✅ Found existing menu: น้ำจิ้มซีฟู๊ด (ID: %)', v_menu_id;
    END IF;

    -- ============================================================================
    -- STEP 3: Add recipe ingredients
    -- ============================================================================
    
    -- Delete existing recipes for this menu (to avoid duplicates)
    DELETE FROM menu_recipes WHERE menu_id = v_menu_id;
    
    -- Insert all recipe ingredients
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        -- Dry ingredients (grams)
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'พริกสวน'), 100, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'ผักชี ราก+ต้น'), 75, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมไทย'), 50, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมจีน'), 50, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำตาลมะพร้าว'), 250, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำตาลทรายขาว'), 30, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'เกลือป่น'), 15, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'ผงชูรส'), 20, 'กรัม'),
        
        -- Whole items
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'ตะไคร้ซอย'), 2, 'ต้น'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'เนื้อกระเทียมดอง'), 3, 'หัว'),
        
        -- Liquid ingredients (ml)
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำปลา'), 150, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำกระเทียมดอง'), 75, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'มะนาวขวด'), 350, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'มะนาวจริง'), 100, 'มล')
    ON CONFLICT (menu_id, ingredient_id) DO UPDATE SET
        quantity_per_serve = EXCLUDED.quantity_per_serve,
        unit = EXCLUDED.unit;
    
    RAISE NOTICE '✅ Recipe added successfully!';
    RAISE NOTICE '📋 Total ingredients in recipe: 14';
    
    -- Calculate and update menu cost
    UPDATE menus
    SET cost_price = (
        SELECT COALESCE(SUM(mr.quantity_per_serve * COALESCE(i.cost_per_unit, 0)), 0)
        FROM menu_recipes mr
        LEFT JOIN ingredients i ON mr.ingredient_id = i.id
        WHERE mr.menu_id = v_menu_id
    ),
    updated_at = NOW()
    WHERE id = v_menu_id;
    
    RAISE NOTICE '✅ Menu cost calculated and updated';
    
END $$;

-- ============================================================================
-- VERIFICATION: Show the recipe and calculated cost
-- ============================================================================

SELECT 
    m.name AS menu_name,
    m.menu_id,
    m.cost_price AS total_cost,
    COUNT(mr.id) AS ingredient_count,
    STRING_AGG(i.name || ' (' || mr.quantity_per_serve || ' ' || mr.unit || ')', ', ' ORDER BY i.name) AS ingredients
FROM menus m
LEFT JOIN menu_recipes mr ON m.id = mr.menu_id
LEFT JOIN ingredients i ON mr.ingredient_id = i.id
WHERE m.name ILIKE '%น้ำจิ้มซีฟู๊ด%'
GROUP BY m.id, m.name, m.menu_id, m.cost_price;

-- Show detailed breakdown
SELECT 
    m.name AS menu_name,
    i.name AS ingredient_name,
    mr.quantity_per_serve,
    mr.unit,
    i.cost_per_unit,
    (mr.quantity_per_serve * COALESCE(i.cost_per_unit, 0)) AS ingredient_cost
FROM menus m
JOIN menu_recipes mr ON m.id = mr.menu_id
JOIN ingredients i ON mr.ingredient_id = i.id
WHERE m.name ILIKE '%น้ำจิ้มซีฟู๊ด%'
ORDER BY i.name;

