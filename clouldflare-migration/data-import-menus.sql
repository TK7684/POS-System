-- Data Import: Menus & Recipes for กุ้งแซ่บ เจ๊แพท
-- Run this AFTER database-schema-clean.sql

-- ============================================================================
-- INSERT INGREDIENTS
-- ============================================================================

-- Get or create a default user (for created_by fields)
DO $$
DECLARE
    default_user_id UUID;
BEGIN
    SELECT id INTO default_user_id FROM users WHERE email = 'admin@pos.local' LIMIT 1;
    
    IF default_user_id IS NULL THEN
        INSERT INTO users (email, display_name, role, email_verified)
        VALUES ('admin@pos.local', 'System Administrator', 'admin', true)
        RETURNING id INTO default_user_id;
    END IF;
END $$;

-- Main Ingredients
INSERT INTO ingredients (name, unit, description, is_active) VALUES
    ('กุ้งสด', 'ตัว', 'กุ้งสดคุณภาพดี 41-45 ตัว/โล', true),
    ('กุ้งดอง', 'ตัว', 'กุ้งดองซีอิ๊วสไตล์เกาหลี', true),
    ('แซลม่อนสด', 'กรัม', 'แซลมอนสดนำเข้า', true),
    ('ปูอัดสด', 'ชิ้น', 'ปูอัดคุณภาพดี', true),
    
    -- Vegetables
    ('กะหล่ำปลี', 'กรัม', 'กะหล่ำปลีซอย', true),
    ('มะระ', 'กรัม', 'มะระหั่นแว่น', true),
    ('กระเทียมไทย', 'กรัม', 'กระเทียมไทยหั่นบาง', true),
    ('กระเทียมจีน', 'กรัม', 'กระเทียมจีน', true),
    ('ผักชี', 'กรัม', 'ผักชีสด', true),
    ('คึ่นช่าย', 'กรัม', 'คึ่นช่ายสด', true),
    ('สะหระแหน่', 'กรัม', 'สะหระแหน่สด', true),
    ('พริกแดงจินดา', 'กรัม', 'พริกจินดาแดงสด', true),
    ('พริกสวน', 'กรัม', 'พริกขี้หนูสวน', true),
    ('ตะไคร้', 'กรัม', 'ตะไคร้สด', true),
    ('หอมแดง', 'กรัม', 'หอมแดงสด', true),
    ('ผักชีฝรั่ง', 'กรัม', 'ผักชีฝรั่งสด', true),
    
    -- Condiments & Seasonings
    ('หอมเจียว', 'กรัม', 'หอมเจียวกรอบ', true),
    ('งาขาว', 'กรัม', 'งาขาวคั่ว', true),
    ('น้ำปลา', 'มล', 'น้ำปลาทิพรส', true),
    ('น้ำตาลมะพร้าว', 'กรัม', 'น้ำตาลมะพร้าวธรรมชาติ', true),
    ('น้ำตาลทรายขาว', 'กรัม', 'น้ำตาลทรายขาว', true),
    ('เกลือป่น', 'กรัม', 'เกลือป่น', true),
    ('ผงชูรส', 'กรัม', 'ชูรส อายิโนะโมโตะ', true),
    ('มะนาวขวด', 'มล', 'น้ำมะนาวขวด', true),
    ('มะนาวสด', 'มล', 'น้ำมะนาวสดคั้น', true),
    ('กระเทียมดอง', 'หัว', 'กระเทียมดอง', true),
    ('น้ำกระเทียมดอง', 'มล', 'น้ำกระเทียมดอง', true),
    
    -- Sauces
    ('ซอสดองเกาหลี', 'มล', 'เอโร ซอสดองสไตล์เกาหลี', true),
    ('น้ำมันงา', 'มล', 'น้ำมันงาคั่ว', true),
    ('ซอสโชยุ', 'มล', 'ทาคุมิ ซอสโชยุ', true),
    ('วาซาบิ', 'กรัม', 'วาซาบิฟูจิ', true),
    ('น้ำเชื่อม', 'มล', 'น้ำเชื่อม', true),
    ('น้ำมะขามเปียก', 'มล', 'น้ำมะขามเปียก', true),
    ('ข้าวคั่ว', 'กรัม', 'ข้าวคั่วป่น', true),
    ('พริกป่น', 'กรัม', 'พริกป่น', true),
    ('ผงลาบ', 'กรัม', 'รสดี ผงลาบน้ำตก', true),
    
    -- Rice & Seaweed
    ('ข้าวญี่ปุ่น', 'กรัม', 'ข้าวญี่ปุ่น มิโนริ หุงสุก', true),
    ('ข้าวญี่ปุ่นดิบ', 'กรัม', 'ข้าวญี่ปุ่น มิโนริ', true),
    ('สาหร่ายอบกรอบ', 'ซอง', 'สาหร่าย ยังบัน 4 กรัม', true),
    
    -- Beverages
    ('โค้กกระป๋อง', 'กระป๋อง', 'โค้ก 325 มล', true),
    ('เป๊ปซี่กระป๋อง', 'กระป๋อง', 'เป๊ปซี่ 325 มล', true),
    ('น้ำดื่ม', 'ขวด', 'คริสตัล 600 มล', true),
    
    -- Special Items
    ('น้ำจิ้มซีฟู้ด', 'มล', 'น้ำจิ้มซีฟู้ดสูตรพิเศษ', true),
    ('น้ำดองเกาหลี', 'มล', 'น้ำดองสไตล์เกาหลี', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INSERT MENU CATEGORIES
-- ============================================================================

INSERT INTO categories (name, type, color) VALUES
    ('กุ้งแช่น้ำปลา', 'menu', '#dc2626'),
    ('กุ้งดองซีอิ๊ว', 'menu', '#ea580c'),
    ('เซ็ตเมนู', 'menu', '#16a34a'),
    ('แซลมอน', 'menu', '#9333ea'),
    ('คอมโบเมนู', 'menu', '#0891b2'),
    ('ของทานเล่น', 'menu', '#ca8a04'),
    ('เครื่องดื่ม', 'menu', '#06b6d4'),
    ('เครื่องเคียง', 'menu', '#f59e0b')
ON CONFLICT (name, type) DO NOTHING;

-- ============================================================================
-- INSERT MENUS
-- ============================================================================

-- Get category IDs
DO $$
DECLARE
    cat_kung_cha UUID;
    cat_kung_dong UUID;
    cat_set UUID;
    cat_salmon UUID;
    cat_combo UUID;
    cat_snack UUID;
    cat_drink UUID;
    cat_side UUID;
BEGIN
    SELECT id INTO cat_kung_cha FROM categories WHERE name = 'กุ้งแช่น้ำปลา' AND type = 'menu';
    SELECT id INTO cat_kung_dong FROM categories WHERE name = 'กุ้งดองซีอิ๊ว' AND type = 'menu';
    SELECT id INTO cat_set FROM categories WHERE name = 'เซ็ตเมนู' AND type = 'menu';
    SELECT id INTO cat_salmon FROM categories WHERE name = 'แซลมอน' AND type = 'menu';
    SELECT id INTO cat_combo FROM categories WHERE name = 'คอมโบเมนู' AND type = 'menu';
    SELECT id INTO cat_snack FROM categories WHERE name = 'ของทานเล่น' AND type = 'menu';
    SELECT id INTO cat_drink FROM categories WHERE name = 'เครื่องดื่ม' AND type = 'menu';
    SELECT id INTO cat_side FROM categories WHERE name = 'เครื่องเคียง' AND type = 'menu';

    -- Main Menus
    INSERT INTO menus (menu_id, name, price, category_id, is_active, is_available) VALUES
        -- กุ้งแช่น้ำปลา
        ('A1', 'กุ้งแช่น้ำปลาแซ่บซี๊ด 7 ตัว', 139, cat_kung_cha, true, true),
        ('A2', 'กุ้งแช่น้ำปลาแซ่บซี๊ด 12 ตัว', 179, cat_kung_cha, true, true),
        ('D', 'กุ้งแช่น้ำปลาแซ่บซี๊ด 70 ตัว', 1179, cat_kung_cha, true, true),
        
        -- กุ้งดองซีอิ๊ว
        ('B1', 'กุ้งดองซีอิ๊วสไตล์เกาหลี 7 ตัว', 139, cat_kung_dong, true, true),
        ('B2', 'กุ้งดองซีอิ๊วสไตล์เกาหลี 12 ตัว', 192, cat_kung_dong, true, true),
        
        -- เซ็ตกุ้งดอง
        ('SetB1', 'เซ็ต กุ้งดองซีอิ๊วสไตล์เกาหลี 7 ตัว', 149, cat_set, true, true),
        ('SetB2', 'เซ็ต กุ้งดองซีอิ๊วสไตล์เกาหลี 12 ตัว', 215, cat_set, true, true),
        ('SetB3', 'เซ็ตแซ่บคุ้ม กุ้งดองซีอิ๊ว 7 ตัว + ข้าวญี่ปุ่น + สาหร่าย', 169, cat_set, true, true),
        ('SetB4', 'เซ็ตแซ่บคุ้ม กุ้งดองซีอิ๊ว 12 ตัว + ข้าวญี่ปุ่น + สาหร่าย', 219, cat_set, true, true),
        
        -- แซลมอน
        ('C1', 'แซลมอนดองซีอิ๊วเกาหลี เซ็ตเล็ก', 256, cat_salmon, true, true),
        ('C2', 'แซลมอนดองซีอิ๋วเกาหลี เซ็ตใหญ่', 299, cat_salmon, true, true),
        
        -- เซ็ตแซลมอน
        ('SetC1', 'เซ็ตแซ่บคุ้ม แซลแม่อนดองซีอิ๊ว L + ข้าวญี่ปุ่น + สาหร่าย', 239, cat_set, true, true),
        ('SetC2', 'เซ็ตแซ่บคุ้ม แซลมอนดองซีอิ๊ว XL + ข้าวญี่ปุ่น + สาหร่าย', 319, cat_set, true, true),
        
        -- คอมโบ
        ('B1C1', 'แซลมอน + กุ้ง ดองซีอิ๊วเกาหลี', 239, cat_combo, true, true),
        ('SetB1C1', 'เซ็ตแซ่บคุ้ม แซลม่อน+กุ้งดองซีอิ๊ว + ข้าวญี่ปุ่น + สาหร่าย', 279, cat_set, true, true),
        
        -- กุ้งสดรสต่างๆ
        ('E1', 'กุ้งสด ลุยสวน 7 ตัว', 139, cat_kung_cha, true, true),
        ('E2', 'กุ้งสุก ลุยสวน 7 ตัว', 149, cat_kung_cha, true, true),
        ('F1', 'กุ้งสด ลาบ 7 ตัว', 139, cat_kung_cha, true, true),
        ('F2', 'กุ้งสุก ลาบ 7 ตัว', 149, cat_kung_cha, true, true),
        
        -- ของทานเล่น
        ('G', 'ปูอัดสดเด้ง + น้ำจิ้มซีฟู้ดจี๊ดจ๊าด 8 ชิ้น', 79, cat_snack, true, true),
        
        -- เครื่องเคียง
        ('S', 'สาหร่ายอบกรอบ', 25, cat_side, true, true),
        ('L', 'หอมเจียว', 20, cat_side, true, true),
        ('M', 'มะระหั่นแว่น', 15, cat_side, true, true),
        ('N', 'กะหล่ำปลีซอย', 15, cat_side, true, true),
        ('O', 'น้ำจิ้มซีฟู้ด', 25, cat_side, true, true),
        
        -- เครื่องดื่ม
        ('P', 'โค้ก ขนาด 325 มล.', 30, cat_drink, true, true),
        ('Q', 'น้ำดื่ม คริสตัล ขนาด 600 มล.', 25, cat_drink, true, true),
        ('R', 'เป๊ปซี่ กระป๋อง 325 มล', 30, cat_drink, true, true)
    ON CONFLICT (menu_id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        category_id = EXCLUDED.category_id;
END $$;

-- ============================================================================
-- INSERT MENU RECIPES (Ingredients per menu item)
-- ============================================================================

DO $$
DECLARE
    v_menu_id UUID;
    v_ingredient_id UUID;
BEGIN
    -- A1: กุ้งแช่น้ำปลาแซ่บซี๊ด 7 ตัว
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'A1';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กุ้งสด'), 7, 'ตัว'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กะหล่ำปลี'), 30, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'มะระ'), 20, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมไทย'), 10, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'ผักชี'), 5, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 50, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'หอมเจียว'), 10, 'กรัม')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- A2: กุ้งแช่น้ำปลาแซ่บซี๊ด 12 ตัว
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'A2';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กุ้งสด'), 12, 'ตัว'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กะหล่ำปลี'), 50, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'มะระ'), 30, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมไทย'), 15, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'ผักชี'), 10, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 80, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'หอมเจียว'), 15, 'กรัม')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- B1: กุ้งดองซีอิ๊วสไตล์เกาหลี 7 ตัว
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'B1';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กุ้งดอง'), 7, 'ตัว'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'พริกแดงจินดา'), 5, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมไทย'), 10, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'งาขาว'), 5, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 50, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำดองเกาหลี'), 100, 'มล')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- B2: กุ้งดองซีอิ๊วสไตล์เกาหลี 12 ตัว
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'B2';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กุ้งดอง'), 12, 'ตัว'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'พริกแดงจินดา'), 8, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมไทย'), 15, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'งาขาว'), 8, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 80, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำดองเกาหลี'), 150, 'มล')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- SetB1: เซ็ต กุ้งดองซีอิ๊วสไตล์เกาหลี 7 ตัว
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'SetB1';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กุ้งดอง'), 7, 'ตัว'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'พริกแดงจินดา'), 5, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมไทย'), 10, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'งาขาว'), 5, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 50, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'สาหร่ายอบกรอบ'), 1, 'ซอง'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำดองเกาหลี'), 100, 'มล')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- SetB3: เซ็ตแซ่บคุ้ม กุ้งดองซีอิ๊ว 7 ตัว + ข้าวญี่ปุ่น + สาหร่าย
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'SetB3';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กุ้งดอง'), 7, 'ตัว'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'พริกแดงจินดา'), 5, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมไทย'), 10, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'งาขาว'), 5, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 50, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'สาหร่ายอบกรอบ'), 1, 'ซอง'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'ข้าวญี่ปุ่น'), 100, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำดองเกาหลี'), 100, 'มล')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- C1: แซลมอนดองซีอิ๊วเกาหลี เซ็ตเล็ก
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'C1';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'แซลม่อนสด'), 100, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำดองเกาหลี'), 200, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'พริกแดงจินดา'), 5, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมไทย'), 10, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'งาขาว'), 5, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 50, 'มล')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- C2: แซลมอนดองซีอิ๋วเกาหลี เซ็ตใหญ่
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'C2';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'แซลม่อนสด'), 150, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำดองเกาหลี'), 300, 'มล'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'พริกแดงจินดา'), 8, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กระเทียมไทย'), 15, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'งาขาว'), 8, 'กรัม'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 80, 'มล')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- G: ปูอัดสดเด้ง + น้ำจิ้มซีฟู้ดจี๊ดจ๊าด 8 ชิ้น
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'G';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'ปูอัดสด'), 8, 'ชิ้น'),
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 50, 'มล')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- S: สาหร่ายอบกรอบ
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'S';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'สาหร่ายอบกรอบ'), 1, 'ซอง')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- L: หอมเจียว
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'L';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'หอมเจียว'), 30, 'กรัม')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- M: มะระหั่นแว่น
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'M';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'มะระ'), 50, 'กรัม')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- N: กะหล่ำปลีซอย
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'N';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'กะหล่ำปลี'), 50, 'กรัม')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- O: น้ำจิ้มซีฟู้ด
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'O';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำจิ้มซีฟู้ด'), 100, 'มล')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- P: โค้ก
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'P';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'โค้กกระป๋อง'), 1, 'กระป๋อง')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- Q: น้ำดื่ม
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'Q';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'น้ำดื่ม'), 1, 'ขวด')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

    -- R: เป๊ปซี่
    SELECT id INTO v_menu_id FROM menus WHERE menu_id = 'R';
    
    INSERT INTO menu_recipes (menu_id, ingredient_id, quantity_per_serve, unit) VALUES
        (v_menu_id, (SELECT id FROM ingredients WHERE name = 'เป๊ปซี่กระป๋อง'), 1, 'กระป๋อง')
    ON CONFLICT (menu_id, ingredient_id) DO NOTHING;

END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
DECLARE
    menu_count INTEGER;
    ingredient_count INTEGER;
    recipe_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO menu_count FROM menus;
    SELECT COUNT(*) INTO ingredient_count FROM ingredients;
    SELECT COUNT(*) INTO recipe_count FROM menu_recipes;
    
    RAISE NOTICE '✅ Data import completed successfully!';
    RAISE NOTICE '📋 Menus imported: %', menu_count;
    RAISE NOTICE '🥬 Ingredients imported: %', ingredient_count;
    RAISE NOTICE '📝 Recipes created: %', recipe_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Your กุ้งแซ่บ เจ๊แพท menu is ready!';
END $$;

