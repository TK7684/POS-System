-- Diagnostic script to check if database has data needed for menu cost calculation
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. Check if menu_recipes exist
-- ============================================================================
SELECT 
    'Menu Recipes' as check_type,
    COUNT(*) as total_recipes,
    COUNT(DISTINCT menu_id) as unique_menus_with_recipes,
    COUNT(DISTINCT ingredient_id) as unique_ingredients_in_recipes
FROM menu_recipes;

-- Show sample recipes
SELECT 
    mr.id,
    m.menu_id,
    m.name as menu_name,
    i.name as ingredient_name,
    mr.quantity_per_serve,
    mr.unit,
    i.cost_per_unit,
    (mr.quantity_per_serve * COALESCE(i.cost_per_unit, 0)) as calculated_cost
FROM menu_recipes mr
LEFT JOIN menus m ON mr.menu_id = m.id
LEFT JOIN ingredients i ON mr.ingredient_id = i.id
ORDER BY m.menu_id, i.name
LIMIT 20;

-- ============================================================================
-- 2. Check ingredients with missing cost_per_unit
-- ============================================================================
SELECT 
    'Ingredients Missing Cost' as check_type,
    COUNT(*) as ingredients_without_cost
FROM ingredients
WHERE cost_per_unit IS NULL OR cost_per_unit = 0;

-- List ingredients without cost
SELECT 
    id,
    name,
    unit,
    cost_per_unit,
    current_stock,
    CASE 
        WHEN cost_per_unit IS NULL THEN 'NULL'
        WHEN cost_per_unit = 0 THEN 'ZERO'
        ELSE 'HAS_COST'
    END as cost_status
FROM ingredients
WHERE cost_per_unit IS NULL OR cost_per_unit = 0
ORDER BY name;

-- ============================================================================
-- 3. Check menus and their recipe status
-- ============================================================================
SELECT 
    m.menu_id,
    m.name as menu_name,
    m.price as current_price,
    COUNT(mr.id) as recipe_count,
    COUNT(CASE WHEN i.cost_per_unit IS NULL OR i.cost_per_unit = 0 THEN 1 END) as ingredients_missing_cost,
    CASE 
        WHEN COUNT(mr.id) = 0 THEN 'NO_RECIPES'
        WHEN COUNT(CASE WHEN i.cost_per_unit IS NULL OR i.cost_per_unit = 0 THEN 1 END) > 0 THEN 'MISSING_COSTS'
        ELSE 'READY'
    END as cost_calculation_status
FROM menus m
LEFT JOIN menu_recipes mr ON m.id = mr.menu_id
LEFT JOIN ingredients i ON mr.ingredient_id = i.id
GROUP BY m.id, m.menu_id, m.name, m.price
ORDER BY 
    CASE 
        WHEN COUNT(mr.id) = 0 THEN 1
        WHEN COUNT(CASE WHEN i.cost_per_unit IS NULL OR i.cost_per_unit = 0 THEN 1 END) > 0 THEN 2
        ELSE 3
    END,
    m.menu_id;

-- ============================================================================
-- 4. Check if calculate_menu_cost function works for a specific menu
-- ============================================================================
-- Replace 'A2' menu_id with the menu you want to test
SELECT 
    m.menu_id,
    m.name,
    calculate_menu_cost(m.id) as calculated_cost,
    m.price as current_price,
    (m.price - calculate_menu_cost(m.id)) as profit_if_sold_at_current_price
FROM menus m
WHERE m.menu_id = 'A2';

-- ============================================================================
-- 5. Detailed breakdown for a specific menu (e.g., A2)
-- ============================================================================
-- Replace 'A2' menu_id with the menu you want to check
SELECT 
    m.menu_id,
    m.name as menu_name,
    i.name as ingredient_name,
    mr.quantity_per_serve,
    mr.unit as recipe_unit,
    i.cost_per_unit,
    i.unit as ingredient_unit,
    (mr.quantity_per_serve * COALESCE(i.cost_per_unit, 0)) as ingredient_cost,
    CASE 
        WHEN i.cost_per_unit IS NULL THEN '⚠️ Missing cost'
        WHEN i.cost_per_unit = 0 THEN '⚠️ Cost is zero'
        ELSE '✅ OK'
    END as status
FROM menus m
JOIN menu_recipes mr ON m.id = mr.menu_id
JOIN ingredients i ON mr.ingredient_id = i.id
WHERE m.menu_id = 'A2'
ORDER BY ingredient_cost DESC;

-- ============================================================================
-- 6. Summary statistics
-- ============================================================================
SELECT 
    'SUMMARY' as report_section,
    (SELECT COUNT(*) FROM menus) as total_menus,
    (SELECT COUNT(*) FROM menu_recipes) as total_recipes,
    (SELECT COUNT(DISTINCT menu_id) FROM menu_recipes) as menus_with_recipes,
    (SELECT COUNT(*) FROM ingredients) as total_ingredients,
    (SELECT COUNT(*) FROM ingredients WHERE cost_per_unit IS NOT NULL AND cost_per_unit > 0) as ingredients_with_cost,
    (SELECT COUNT(*) FROM ingredients WHERE cost_per_unit IS NULL OR cost_per_unit = 0) as ingredients_without_cost,
    (SELECT COUNT(DISTINCT m.id) 
     FROM menus m 
     JOIN menu_recipes mr ON m.id = mr.menu_id
     JOIN ingredients i ON mr.ingredient_id = i.id
     GROUP BY m.id
     HAVING COUNT(CASE WHEN i.cost_per_unit IS NULL OR i.cost_per_unit = 0 THEN 1 END) = 0
    ) as menus_ready_for_cost_calc;

-- ============================================================================
-- 7. Check recent purchases to see if cost_per_unit is being updated
-- ============================================================================
SELECT 
    p.id,
    i.name as ingredient_name,
    p.quantity,
    p.unit,
    p.total_amount,
    p.unit_price,
    p.purchase_date,
    i.cost_per_unit as current_cost_per_unit,
    CASE 
        WHEN i.cost_per_unit IS NULL OR i.cost_per_unit = 0 THEN '⚠️ Cost not set'
        WHEN ABS(i.cost_per_unit - p.unit_price) > 0.01 THEN '⚠️ Cost differs from purchase'
        ELSE '✅ Cost matches'
    END as cost_status
FROM purchases p
JOIN ingredients i ON p.ingredient_id = i.id
ORDER BY p.purchase_date DESC, p.purchase_time DESC
LIMIT 20;

