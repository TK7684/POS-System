/**
 * Mock Data Generator for Cost-POS System
 * This file contains comprehensive mock data and test functions
 * to validate all system functionality
 */

// ===== MOCK DATA CONSTANTS =====
const MOCK_DATA = {
  // Ingredients with realistic Thai food ingredients
  ingredients: [
    { id: 'ING001', name: 'กุ้งสด', stock_unit: 'กรัม', buy_unit: 'กก.', buy_to_stock_ratio: 1000, min_stock: 2000 },
    { id: 'ING002', name: 'ข้าวสวย', stock_unit: 'ถ้วย', buy_unit: 'กก.', buy_to_stock_ratio: 4, min_stock: 20 },
    { id: 'ING003', name: 'พริกขี้หนู', stock_unit: 'กรัม', buy_unit: 'กก.', buy_to_stock_ratio: 1000, min_stock: 100 },
    { id: 'ING004', name: 'กระเทียม', stock_unit: 'กรัม', buy_unit: 'กก.', buy_to_stock_ratio: 1000, min_stock: 200 },
    { id: 'ING005', name: 'หอมแดง', stock_unit: 'กรัม', buy_unit: 'กก.', buy_to_stock_ratio: 1000, min_stock: 150 },
    { id: 'ING006', name: 'มะนาว', stock_unit: 'ลูก', buy_unit: 'กก.', buy_to_stock_ratio: 8, min_stock: 20 },
    { id: 'ING007', name: 'น้ำปลา', stock_unit: 'มล.', buy_unit: 'ลิตร', buy_to_stock_ratio: 1000, min_stock: 500 },
    { id: 'ING008', name: 'น้ำตาล', stock_unit: 'กรัม', buy_unit: 'กก.', buy_to_stock_ratio: 1000, min_stock: 500 },
    { id: 'ING009', name: 'ผักกะหล่ำ', stock_unit: 'กรัม', buy_unit: 'กก.', buy_to_stock_ratio: 1000, min_stock: 1000 },
    { id: 'ING010', name: 'แครอท', stock_unit: 'กรัม', buy_unit: 'กก.', buy_to_stock_ratio: 1000, min_stock: 500 }
  ],

  // Menus with realistic Thai dishes
  menus: [
    { menu_id: 'MENU001', name: 'กุ้งแซ่บ', price: 120, category: 'เมนูหลัก' },
    { menu_id: 'MENU002', name: 'ส้มตำไทย', price: 80, category: 'เมนูหลัก' },
    { menu_id: 'MENU003', name: 'ลาบหมู', price: 90, category: 'เมนูหลัก' },
    { menu_id: 'MENU004', name: 'ข้าวผัดกุ้ง', price: 100, category: 'เมนูหลัก' },
    { menu_id: 'MENU005', name: 'ต้มยำกุ้ง', price: 150, category: 'เมนูหลัก' },
    { menu_id: 'MENU006', name: 'น้ำมะนาว', price: 25, category: 'เครื่องดื่ม' },
    { menu_id: 'MENU007', name: 'น้ำส้ม', price: 30, category: 'เครื่องดื่ม' }
  ],

  // Menu recipes (BOM - Bill of Materials)
  menuRecipes: [
    // กุ้งแซ่บ
    { menu_id: 'MENU001', ingredient_id: 'ING001', qty_per_serve: 150, note: 'กุ้งสด' },
    { menu_id: 'MENU001', ingredient_id: 'ING002', qty_per_serve: 1, note: 'ข้าวสวย' },
    { menu_id: 'MENU001', ingredient_id: 'ING003', qty_per_serve: 10, note: 'พริกขี้หนู' },
    { menu_id: 'MENU001', ingredient_id: 'ING004', qty_per_serve: 15, note: 'กระเทียม' },
    { menu_id: 'MENU001', ingredient_id: 'ING005', qty_per_serve: 20, note: 'หอมแดง' },
    { menu_id: 'MENU001', ingredient_id: 'ING006', qty_per_serve: 1, note: 'มะนาว' },
    { menu_id: 'MENU001', ingredient_id: 'ING007', qty_per_serve: 10, note: 'น้ำปลา' },
    { menu_id: 'MENU001', ingredient_id: 'ING008', qty_per_serve: 5, note: 'น้ำตาล' },
    { menu_id: 'MENU001', ingredient_id: 'ING009', qty_per_serve: 50, note: 'ผักกะหล่ำ' },
    
    // ส้มตำไทย
    { menu_id: 'MENU002', ingredient_id: 'ING009', qty_per_serve: 100, note: 'ผักกะหล่ำ' },
    { menu_id: 'MENU002', ingredient_id: 'ING010', qty_per_serve: 30, note: 'แครอท' },
    { menu_id: 'MENU002', ingredient_id: 'ING003', qty_per_serve: 15, note: 'พริกขี้หนู' },
    { menu_id: 'MENU002', ingredient_id: 'ING004', qty_per_serve: 10, note: 'กระเทียม' },
    { menu_id: 'MENU002', ingredient_id: 'ING005', qty_per_serve: 15, note: 'หอมแดง' },
    { menu_id: 'MENU002', ingredient_id: 'ING006', qty_per_serve: 2, note: 'มะนาว' },
    { menu_id: 'MENU002', ingredient_id: 'ING007', qty_per_serve: 15, note: 'น้ำปลา' },
    { menu_id: 'MENU002', ingredient_id: 'ING008', qty_per_serve: 8, note: 'น้ำตาล' }
  ],

  // Users with different roles
  users: [
    { user_key: 'owner@restaurant.com', role: 'OWNER', name: 'เจ้าของร้าน', active: 'TRUE' },
    { user_key: 'manager@restaurant.com', role: 'PARTNER', name: 'ผู้จัดการ', active: 'TRUE' },
    { user_key: 'staff1@restaurant.com', role: 'STAFF', name: 'พนักงาน 1', active: 'TRUE' },
    { user_key: 'staff2@restaurant.com', role: 'STAFF', name: 'พนักงาน 2', active: 'TRUE' }
  ],

  // Cost centers for labor tracking
  costCenters: [
    { cost_center_id: 'CC001', name: 'ครัว', standard_rate: 200, description: 'งานครัว' },
    { cost_center_id: 'CC002', name: 'เสิร์ฟ', standard_rate: 150, description: 'งานเสิร์ฟ' },
    { cost_center_id: 'CC003', name: 'ทำความสะอาด', standard_rate: 120, description: 'งานทำความสะอาด' }
  ],

  // Packaging items
  packaging: [
    { pkg_id: 'PKG001', name: 'กล่องกุ้งแซ่บ', unit: 'ชิ้น', cost_per_unit: 2.5 },
    { pkg_id: 'PKG002', name: 'ถุงพลาสติก', unit: 'ชิ้น', cost_per_unit: 0.5 },
    { pkg_id: 'PKG003', name: 'ช้อนส้อม', unit: 'ชุด', cost_per_unit: 1.0 },
    { pkg_id: 'PKG004', name: 'แก้วน้ำ', unit: 'ชิ้น', cost_per_unit: 1.5 }
  ],

  // Market runs
  marketRuns: [
    { run_id: 'RUN001', date: '2024-01-15', buyer: 'พนักงาน 1', note: 'ซื้อวัตถุดิบประจำสัปดาห์' },
    { run_id: 'RUN002', date: '2024-01-22', buyer: 'พนักงาน 2', note: 'ซื้อวัตถุดิบเพิ่มเติม' },
    { run_id: 'RUN003', date: '2024-01-29', buyer: 'ผู้จัดการ', note: 'ซื้อวัตถุดิบประจำเดือน' }
  ],

  // Market run items
  marketRunItems: [
    { run_id: 'RUN001', ingredient_id: 'ING001', qty_buy: 5, unit_price: 180, note: 'กุ้งสดคุณภาพดี' },
    { run_id: 'RUN001', ingredient_id: 'ING002', qty_buy: 10, unit_price: 25, note: 'ข้าวหอมมะลิ' },
    { run_id: 'RUN001', ingredient_id: 'ING003', qty_buy: 2, unit_price: 80, note: 'พริกขี้หนูสด' },
    { run_id: 'RUN002', ingredient_id: 'ING004', qty_buy: 3, unit_price: 60, note: 'กระเทียมไทย' },
    { run_id: 'RUN002', ingredient_id: 'ING005', qty_buy: 2, unit_price: 45, note: 'หอมแดง' },
    { run_id: 'RUN003', ingredient_id: 'ING006', qty_buy: 5, unit_price: 20, note: 'มะนาวแป้น' }
  ],

  // Packaging purchases
  packagingPurchases: [
    { date: '2024-01-10', pkg_id: 'PKG001', qty_buy: 100, unit_price: 2.5, note: 'กล่องกุ้งแซ่บ' },
    { date: '2024-01-12', pkg_id: 'PKG002', qty_buy: 500, unit_price: 0.5, note: 'ถุงพลาสติก' },
    { date: '2024-01-15', pkg_id: 'PKG003', qty_buy: 200, unit_price: 1.0, note: 'ช้อนส้อม' },
    { date: '2024-01-18', pkg_id: 'PKG004', qty_buy: 150, unit_price: 1.5, note: 'แก้วน้ำ' }
  ],

  // Overheads configuration
  overheads: [
    { key: 'PACK_PER_SERVE', value: 3.5 },
    { key: 'OH_PER_HOUR', value: 25 },
    { key: 'OH_PER_KG', value: 2 }
  ],

  // Menu extras
  menuExtras: [
    { menu_id: 'MENU001', extra_name: 'ไข่ดาว', price: 15, note: 'ไข่ดาวทอด' },
    { menu_id: 'MENU001', extra_name: 'ข้าวเพิ่ม', price: 10, note: 'ข้าวสวยเพิ่ม' },
    { menu_id: 'MENU002', extra_name: 'กุ้งแห้ง', price: 20, note: 'กุ้งแห้งทอด' },
    { menu_id: 'MENU003', extra_name: 'ข้าวเหนียว', price: 5, note: 'ข้าวเหนียว' },
    { menu_id: 'MENU004', extra_name: 'ไข่เจียว', price: 12, note: 'ไข่เจียว' }
  ],

  // Batches
  batches: [
    { 
      batch_id: 'BAT001', 
      date: '2024-01-15', 
      menu_id: 'MENU001', 
      plan_qty: 50, 
      note: 'กุ้งแซ่บประจำวัน',
      run_id: 'RUN001',
      status: 'CLOSED',
      actual_qty: 48,
      weightKg: 7.2,
      hours: 2.5,
      recipe_cost_per_serve: 45,
      pack_per_serve: 3.5,
      oh_hour_rate: 25,
      oh_kg_rate: 2,
      cost_per_serve: 52.5,
      total_cost: 2520
    },
    { 
      batch_id: 'BAT002', 
      date: '2024-01-16', 
      menu_id: 'MENU002', 
      plan_qty: 30, 
      note: 'ส้มตำไทยประจำวัน',
      run_id: 'RUN001',
      status: 'CLOSED',
      actual_qty: 32,
      weightKg: 4.8,
      hours: 1.5,
      recipe_cost_per_serve: 25,
      pack_per_serve: 3.5,
      oh_hour_rate: 25,
      oh_kg_rate: 2,
      cost_per_serve: 32.5,
      total_cost: 1040
    },
    { 
      batch_id: 'BAT003', 
      date: '2024-01-17', 
      menu_id: 'MENU001', 
      plan_qty: 40, 
      note: 'กุ้งแซ่บประจำวัน',
      run_id: 'RUN002',
      status: 'OPEN',
      actual_qty: '',
      weightKg: '',
      hours: '',
      recipe_cost_per_serve: '',
      pack_per_serve: '',
      oh_hour_rate: '',
      oh_kg_rate: '',
      cost_per_serve: '',
      total_cost: ''
    }
  ],

  // Batch cost lines
  batchCostLines: [
    { date: '2024-01-15', batch_id: 'BAT001', type: 'ING', item_id: 'ING001', qty: 7.5, lot_id: 'LOT001', cost_per_unit: 45, total_cost: 337.5, user_key: 'owner@restaurant.com', note: 'กุ้งสด' },
    { date: '2024-01-15', batch_id: 'BAT001', type: 'ING', item_id: 'ING002', qty: 48, lot_id: 'LOT002', cost_per_unit: 6.25, total_cost: 300, user_key: 'owner@restaurant.com', note: 'ข้าวสวย' },
    { date: '2024-01-15', batch_id: 'BAT001', type: 'PACK', item_id: 'PKG001', qty: 48, lot_id: 'PKG001', cost_per_unit: 2.5, total_cost: 120, user_key: 'owner@restaurant.com', note: 'กล่องกุ้งแซ่บ' },
    { date: '2024-01-16', batch_id: 'BAT002', type: 'ING', item_id: 'ING009', qty: 3.2, lot_id: 'LOT003', cost_per_unit: 15, total_cost: 48, user_key: 'owner@restaurant.com', note: 'ผักกะหล่ำ' },
    { date: '2024-01-16', batch_id: 'BAT002', type: 'PACK', item_id: 'PKG002', qty: 32, lot_id: 'PKG002', cost_per_unit: 0.5, total_cost: 16, user_key: 'owner@restaurant.com', note: 'ถุงพลาสติก' }
  ]
};

// ===== MOCK DATA GENERATION FUNCTIONS =====

/**
 * Generate mock purchases data for the last 30 days
 * @return {Array} Array of purchase records
 */
function generateMockPurchases() {
  const purchases = [];
  const ingredients = MOCK_DATA.ingredients;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    
    // Generate 1-3 purchases per day
    const numPurchases = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < numPurchases; j++) {
      const ingredient = ingredients[Math.floor(Math.random() * ingredients.length)];
      const qtyBuy = Math.floor(Math.random() * 10) + 1; // 1-10 units
      const unitPrice = Math.random() * 100 + 10; // 10-110 baht per unit
      const totalPrice = qtyBuy * unitPrice;
      
      // Calculate stock quantity based on ratio
      const qtyStock = qtyBuy * ingredient.buy_to_stock_ratio;
      const costPerStock = totalPrice / qtyStock;
      
      purchases.push({
        date: dateStr,
        lot_id: `LOT${dateStr.replace(/-/g, '')}${String(j + 1).padStart(2, '0')}`,
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.name,
        qty_buy: qtyBuy,
        unit: ingredient.buy_unit,
        total_price: totalPrice,
        unit_price: unitPrice,
        qty_stock: qtyStock,
        cost_per_stock: costPerStock,
        remaining_stock: qtyStock * (0.3 + Math.random() * 0.7), // 30-100% remaining
        supplier_note: `ซื้อจาก ${['ตลาดสด', 'ซุปเปอร์มาร์เก็ต', 'ผู้จำหน่าย'][Math.floor(Math.random() * 3)]}`
      });
    }
  }
  
  return purchases;
}

/**
 * Generate mock sales data for the last 30 days
 * @return {Array} Array of sales records
 */
function generateMockSales() {
  const sales = [];
  const menus = MOCK_DATA.menus;
  const platforms = ['ร้าน', 'Line Man', 'Food Panda', 'Grab Food', 'Shopee Food'];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    
    // Generate 5-20 sales per day
    const numSales = Math.floor(Math.random() * 16) + 5;
    
    for (let j = 0; j < numSales; j++) {
      const menu = menus[Math.floor(Math.random() * menus.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const qty = Math.floor(Math.random() * 3) + 1; // 1-3 items
      
      // Calculate platform commission
      const platformCommission = platform === 'ร้าน' ? 0 : 
        platform === 'Line Man' ? 0.30 :
        platform === 'Food Panda' ? 0.35 :
        platform === 'Grab Food' ? 0.30 : 0.25;
      
      const pricePerUnit = menu.price;
      const netPerUnit = pricePerUnit * (1 - platformCommission);
      
      sales.push({
        date: dateStr,
        platform: platform,
        menu_id: menu.menu_id,
        qty: qty,
        price_per_unit: pricePerUnit,
        net_per_unit: netPerUnit,
        gross: pricePerUnit * qty,
        net: netPerUnit * qty
      });
    }
  }
  
  return sales;
}

/**
 * Generate mock COGS data based on sales
 * @param {Array} sales - Sales data to base COGS on
 * @return {Array} Array of COGS records
 */
function generateMockCOGS(sales) {
  const cogs = [];
  const menuRecipes = MOCK_DATA.menuRecipes;
  const ingredients = MOCK_DATA.ingredients;
  
  // Group sales by date and menu
  const salesByDateMenu = {};
  sales.forEach(sale => {
    const key = `${sale.date}_${sale.menu_id}`;
    if (!salesByDateMenu[key]) {
      salesByDateMenu[key] = { date: sale.date, menu_id: sale.menu_id, total_qty: 0 };
    }
    salesByDateMenu[key].total_qty += sale.qty;
  });
  
  // Calculate COGS for each date-menu combination
  Object.values(salesByDateMenu).forEach(sale => {
    const recipes = menuRecipes.filter(r => r.menu_id === sale.menu_id);
    let totalCost = 0;
    
    recipes.forEach(recipe => {
      const ingredient = ingredients.find(i => i.id === recipe.ingredient_id);
      if (ingredient) {
        // Use average cost from mock purchases (simplified)
        const avgCostPerStock = Math.random() * 50 + 10; // 10-60 baht per stock unit
        const costPerServe = (recipe.qty_per_serve / ingredient.buy_to_stock_ratio) * avgCostPerStock;
        totalCost += costPerServe * sale.total_qty;
      }
    });
    
    if (totalCost > 0) {
      cogs.push({
        date: sale.date,
        menu_id: sale.menu_id,
        total_cost: totalCost,
        cost_per_serve: totalCost / sale.total_qty
      });
    }
  });
  
  return cogs;
}

/**
 * Generate mock labor logs
 * @return {Array} Array of labor records
 */
function generateMockLaborLogs() {
  const laborLogs = [];
  const costCenters = MOCK_DATA.costCenters;
  const users = MOCK_DATA.users.filter(u => u.role !== 'VIEWER');
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    
    // Generate 2-5 labor entries per day
    const numEntries = Math.floor(Math.random() * 4) + 2;
    
    for (let j = 0; j < numEntries; j++) {
      const costCenter = costCenters[Math.floor(Math.random() * costCenters.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const hours = Math.random() * 8 + 1; // 1-9 hours
      const rate = costCenter.standard_rate;
      const amount = hours * rate;
      
      laborLogs.push({
        date: dateStr,
        cost_center_id: costCenter.cost_center_id,
        hours: hours,
        rate: rate,
        amount: amount,
        user_key: user.user_key,
        note: `งาน${costCenter.name}`
      });
    }
  }
  
  return laborLogs;
}

/**
 * Generate mock waste records
 * @return {Array} Array of waste records
 */
function generateMockWaste() {
  const waste = [];
  const ingredients = MOCK_DATA.ingredients;
  const today = new Date();
  
  for (let i = 0; i < 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    
    // Generate 0-2 waste entries per day
    const numEntries = Math.floor(Math.random() * 3);
    
    for (let j = 0; j < numEntries; j++) {
      const ingredient = ingredients[Math.floor(Math.random() * ingredients.length)];
      const qtyStock = Math.random() * 100 + 10; // 10-110 stock units
      const lotId = `LOT${dateStr.replace(/-/g, '')}${String(j + 1).padStart(2, '0')}`;
      const costPerUnit = Math.random() * 50 + 10; // 10-60 baht per unit
      const totalCost = qtyStock * costPerUnit;
      
      waste.push({
        date: dateStr,
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.name,
        qty_stock: qtyStock,
        lot_id: lotId,
        cost_per_unit: costPerUnit,
        total_cost: totalCost,
        note: ['หมดอายุ', 'เสียหาย', 'หกหล่น'][Math.floor(Math.random() * 3)]
      });
    }
  }
  
  return waste;
}

// ===== DATA POPULATION FUNCTIONS =====

/**
 * Populate all sheets with mock data
 * @return {Object} Result object with status and details
 */
function populateAllMockData() {
  try {
    console.log('Starting mock data population...');
    
    // Clear existing cache
    _clearCache();
    
    const results = {
      ingredients: populateIngredients(),
      menus: populateMenus(),
      menuRecipes: populateMenuRecipes(),
      users: populateUsers(),
      costCenters: populateCostCenters(),
      purchases: populatePurchases(),
      sales: populateSales(),
      cogs: populateCOGS(),
      laborLogs: populateLaborLogs(),
      waste: populateWaste(),
      packaging: populatePackaging(),
      marketRuns: populateMarketRuns(),
      marketRunItems: populateMarketRunItems(),
      packagingPurchases: populatePackagingPurchases(),
      overheads: populateOverheads(),
      menuExtras: populateMenuExtras(),
      batches: populateBatches(),
      batchCostLines: populateBatchCostLines()
    };
    
    console.log('Mock data population completed successfully');
    return {
      status: 'success',
      message: 'All mock data populated successfully',
      details: results
    };
    
  } catch (error) {
    console.error('Error populating mock data:', error);
    return {
      status: 'error',
      message: 'Failed to populate mock data',
      error: error.toString()
    };
  }
}

/**
 * Populate ingredients sheet
 * @return {Object} Result object
 */
function populateIngredients() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_ING, [
      'id', 'name', 'stock_unit', 'buy_unit', 'buy_to_stock_ratio', 'min_stock'
    ]);
    
    // Clear existing data (except headers)
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 6).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.ingredients.map(ing => [
      ing.id, ing.name, ing.stock_unit, ing.buy_unit, ing.buy_to_stock_ratio, ing.min_stock
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 6).setValues(data);
    }
    
    _clearSheetCache(SHEET_ING);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate menus sheet
 * @return {Object} Result object
 */
function populateMenus() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_MENU, [
      'menu_id', 'name', 'price', 'category'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 4).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.menus.map(menu => [
      menu.menu_id, menu.name, menu.price, menu.category
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 4).setValues(data);
    }
    
    _clearSheetCache(SHEET_MENU);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate menu recipes sheet
 * @return {Object} Result object
 */
function populateMenuRecipes() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_MENU_RECIPES, [
      'menu_id', 'ingredient_id', 'ingredient_name', 'qty_per_serve', 'note', 'created_at', 'user_key'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 7).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.menuRecipes.map(recipe => [
      recipe.menu_id,
      recipe.ingredient_id,
      MOCK_DATA.ingredients.find(i => i.id === recipe.ingredient_id)?.name || recipe.ingredient_id,
      recipe.qty_per_serve,
      recipe.note,
      nowStr(),
      'owner@restaurant.com'
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 7).setValues(data);
    }
    
    _clearSheetCache(SHEET_MENU_RECIPES);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate users sheet
 * @return {Object} Result object
 */
function populateUsers() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_USERS, [
      'user_key', 'role', 'name', 'active', 'created_at'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 5).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.users.map(user => [
      user.user_key, user.role, user.name, user.active, nowStr()
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 5).setValues(data);
    }
    
    _clearSheetCache(SHEET_USERS);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate cost centers sheet
 * @return {Object} Result object
 */
function populateCostCenters() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_COST_CENTERS, [
      'cost_center_id', 'name', 'standard_rate', 'description'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 4).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.costCenters.map(cc => [
      cc.cost_center_id, cc.name, cc.standard_rate, cc.description
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 4).setValues(data);
    }
    
    _clearSheetCache(SHEET_COST_CENTERS);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate purchases sheet
 * @return {Object} Result object
 */
function populatePurchases() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_PUR, [
      'date', 'lot_id', 'ingredient_id', 'ingredient_name', 
      'qty_buy', 'unit', 'total_price', 'unit_price', 'qty_stock', 
      'cost_per_stock', 'remaining_stock', 'supplier_note'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 12).clearContent();
    }
    
    // Generate and add mock data
    const mockPurchases = generateMockPurchases();
    const data = mockPurchases.map(purchase => [
      purchase.date, purchase.lot_id, purchase.ingredient_id, purchase.ingredient_name,
      purchase.qty_buy, purchase.unit, purchase.total_price, purchase.unit_price,
      purchase.qty_stock, purchase.cost_per_stock, purchase.remaining_stock, purchase.supplier_note
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 12).setValues(data);
    }
    
    _clearSheetCache(SHEET_PUR);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate sales sheet
 * @return {Object} Result object
 */
function populateSales() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_SALE, [
      'date', 'platform', 'menu_id', 'qty', 'price_per_unit', 'net_per_unit', 'gross', 'net'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 8).clearContent();
    }
    
    // Generate and add mock data
    const mockSales = generateMockSales();
    const data = mockSales.map(sale => [
      sale.date, sale.platform, sale.menu_id, sale.qty,
      sale.price_per_unit, sale.net_per_unit, sale.gross, sale.net
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 8).setValues(data);
    }
    
    _clearSheetCache(SHEET_SALE);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate COGS sheet
 * @return {Object} Result object
 */
function populateCOGS() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_COGS, [
      'date', 'menu_id', 'total_cost', 'cost_per_serve'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 4).clearContent();
    }
    
    // Generate mock sales first to base COGS on
    const mockSales = generateMockSales();
    const mockCOGS = generateMockCOGS(mockSales);
    
    const data = mockCOGS.map(cogs => [
      cogs.date, cogs.menu_id, cogs.total_cost, cogs.cost_per_serve
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 4).setValues(data);
    }
    
    _clearSheetCache(SHEET_COGS);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate labor logs sheet
 * @return {Object} Result object
 */
function populateLaborLogs() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_LABOR, [
      'date', 'cost_center_id', 'hours', 'rate', 'amount', 'user_key', 'note'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 7).clearContent();
    }
    
    // Generate and add mock data
    const mockLabor = generateMockLaborLogs();
    const data = mockLabor.map(labor => [
      labor.date, labor.cost_center_id, labor.hours, labor.rate,
      labor.amount, labor.user_key, labor.note
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 7).setValues(data);
    }
    
    _clearSheetCache(SHEET_LABOR);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate waste sheet
 * @return {Object} Result object
 */
function populateWaste() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_WASTE, [
      'date', 'ingredient_id', 'ingredient_name', 'qty_stock', 'lot_id', 'cost_per_unit', 'total_cost', 'note'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 8).clearContent();
    }
    
    // Generate and add mock data
    const mockWaste = generateMockWaste();
    const data = mockWaste.map(waste => [
      waste.date, waste.ingredient_id, waste.ingredient_name, waste.qty_stock,
      waste.lot_id, waste.cost_per_unit, waste.total_cost, waste.note
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 8).setValues(data);
    }
    
    _clearSheetCache(SHEET_WASTE);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate packaging sheet
 * @return {Object} Result object
 */
function populatePackaging() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_PACKAGING, [
      'pkg_id', 'name', 'unit', 'cost_per_unit'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 4).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.packaging.map(pkg => [
      pkg.pkg_id, pkg.name, pkg.unit, pkg.cost_per_unit
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 4).setValues(data);
    }
    
    _clearSheetCache(SHEET_PACKAGING);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate market runs sheet
 * @return {Object} Result object
 */
function populateMarketRuns() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_MARKET_RUNS, [
      'run_id', 'date', 'buyer', 'note', 'created_at'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 5).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.marketRuns.map(run => [
      run.run_id, run.date, run.buyer, run.note, nowStr()
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 5).setValues(data);
    }
    
    _clearSheetCache(SHEET_MARKET_RUNS);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate market run items sheet
 * @return {Object} Result object
 */
function populateMarketRunItems() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_MARKET_RUN_ITEMS, [
      'run_id', 'date', 'ingredient_id', 'qty_buy', 'unit_price', 'note', 'lot_id'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 7).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.marketRunItems.map(item => [
      item.run_id, 
      MOCK_DATA.marketRuns.find(run => run.run_id === item.run_id)?.date || '2024-01-15',
      item.ingredient_id, 
      item.qty_buy, 
      item.unit_price, 
      item.note, 
      `LOT${item.run_id}${item.ingredient_id}`
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 7).setValues(data);
    }
    
    _clearSheetCache(SHEET_MARKET_RUN_ITEMS);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate packaging purchases sheet
 * @return {Object} Result object
 */
function populatePackagingPurchases() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_PACKING_PURCHASES, [
      'date', 'pkg_id', 'qty_buy', 'unit_price', 'note'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 5).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.packagingPurchases.map(purchase => [
      purchase.date, purchase.pkg_id, purchase.qty_buy, purchase.unit_price, purchase.note
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 5).setValues(data);
    }
    
    _clearSheetCache(SHEET_PACKING_PURCHASES);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate overheads sheet
 * @return {Object} Result object
 */
function populateOverheads() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_OVERHEADS, [
      'key', 'value'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 2).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.overheads.map(overhead => [
      overhead.key, overhead.value
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 2).setValues(data);
    }
    
    _clearSheetCache(SHEET_OVERHEADS);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate menu extras sheet
 * @return {Object} Result object
 */
function populateMenuExtras() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_MENU_EXTRAS, [
      'menu_id', 'extra_name', 'price', 'note'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 4).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.menuExtras.map(extra => [
      extra.menu_id, extra.extra_name, extra.price, extra.note
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 4).setValues(data);
    }
    
    _clearSheetCache(SHEET_MENU_EXTRAS);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate batches sheet
 * @return {Object} Result object
 */
function populateBatches() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_BATCHES, [
      'batch_id', 'date', 'menu_id', 'plan_qty', 'note', 'run_id', 'status', 
      'actual_qty', 'weightKg', 'hours', 'recipe_cost_per_serve', 'pack_per_serve', 
      'oh_hour_rate', 'oh_kg_rate', 'cost_per_serve', 'total_cost'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 16).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.batches.map(batch => [
      batch.batch_id, batch.date, batch.menu_id, batch.plan_qty, batch.note, batch.run_id, batch.status,
      batch.actual_qty, batch.weightKg, batch.hours, batch.recipe_cost_per_serve, batch.pack_per_serve,
      batch.oh_hour_rate, batch.oh_kg_rate, batch.cost_per_serve, batch.total_cost
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 16).setValues(data);
    }
    
    _clearSheetCache(SHEET_BATCHES);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

/**
 * Populate batch cost lines sheet
 * @return {Object} Result object
 */
function populateBatchCostLines() {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_BATCH_COST_LINES, [
      'date', 'batch_id', 'type', 'item_id', 'qty', 'lot_id', 'cost_per_unit', 'total_cost', 'user_key', 'note'
    ]);
    
    // Clear existing data
    const lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, 10).clearContent();
    }
    
    // Add mock data
    const data = MOCK_DATA.batchCostLines.map(line => [
      line.date, line.batch_id, line.type, line.item_id, line.qty, line.lot_id, 
      line.cost_per_unit, line.total_cost, line.user_key, line.note
    ]);
    
    if (data.length > 0) {
      sh.getRange(2, 1, data.length, 10).setValues(data);
    }
    
    _clearSheetCache(SHEET_BATCH_COST_LINES);
    
    return { status: 'success', count: data.length };
  } catch (error) {
    return { status: 'error', error: error.toString() };
  }
}

// ===== TEST FUNCTIONS =====

/**
 * Quick test of all functions (alias for testAllFunctions)
 * @return {Object} Test results
 */
function quickTest() {
  return testAllFunctions();
}

/**
 * Test all system functions with mock data
 * @return {Object} Test results
 */
function testAllFunctions() {
  const results = {
    timestamp: nowStr(),
    tests: {}
  };
  
  try {
    console.log('Starting comprehensive function tests...');
    
    // Test 1: Bootstrap data
    console.log('Testing getBootstrapData...');
    results.tests.bootstrapData = getBootstrapData();
    
    // Test 2: Add purchase
    console.log('Testing addPurchase...');
    results.tests.addPurchase = addPurchase({
      date: '2024-01-15',
      ingredient_id: 'ING001',
      qtyBuy: 2,
      unit: 'กก.',
      totalPrice: 400,
      unitPrice: 200,
      supplierNote: 'Test purchase'
    });
    
    // Test 3: Low stock check
    console.log('Testing getLowStockHTML...');
    results.tests.lowStock = getLowStockHTML();
    
    // Test 4: Menu cost calculation
    console.log('Testing calculateMenuCost...');
    results.tests.menuCost = calculateMenuCost({
      menu_id: 'MENU001',
      targetGP: 60
    });
    
    // Test 5: Menu ingredients
    console.log('Testing getMenuIngredientsHTML...');
    results.tests.menuIngredients = getMenuIngredientsHTML({
      menu_id: 'MENU001'
    });
    
    // Test 6: Add menu ingredient
    console.log('Testing addMenuIngredient...');
    results.tests.addMenuIngredient = addMenuIngredient({
      userKey: 'owner@restaurant.com',
      menu_id: 'MENU001',
      ingredient_id: 'ING001',
      qty: 200,
      note: 'Test ingredient'
    });
    
    // Test 7: Add labor log
    console.log('Testing addLaborLog...');
    results.tests.addLabor = addLaborLog({
      userKey: 'owner@restaurant.com',
      date: '2024-01-15',
      cost_center_id: 'CC001',
      hours: 8,
      rate: 200,
      note: 'Test labor'
    });
    
    // Test 8: Add waste
    console.log('Testing addWaste...');
    results.tests.addWaste = addWaste({
      userKey: 'owner@restaurant.com',
      date: '2024-01-15',
      ingredient_id: 'ING001',
      qtyStock: 50,
      note: 'Test waste'
    });
    
    // Test 9: Generate report
    console.log('Testing getReport...');
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    results.tests.report = getReport({
      from: lastWeek.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
      granularity: 'day'
    });
    
    // Test 10: Get history
    console.log('Testing getHistory...');
    results.tests.history = getHistory({
      type: 'sales',
      from: lastWeek.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
      limit: 10
    });
    
    // Test 11: User permissions
    console.log('Testing checkUserPermissions...');
    results.tests.userPermissions = checkUserPermissions({
      userKey: 'owner@restaurant.com'
    });
    
    // Test 12: Suggest selling price
    console.log('Testing suggestSellingPrice...');
    results.tests.suggestPrice = suggestSellingPrice({
      menu_id: 'MENU001',
      platform: 'Line Man',
      targetGrossPct: 60
    });
    
    // Test 13: Market run functions
    console.log('Testing startMarketRun...');
    results.tests.startMarketRun = startMarketRun({
      userKey: 'owner@restaurant.com',
      date: '2024-01-20',
      buyer: 'Test Buyer',
      note: 'Test market run'
    });
    
    // Test 14: Packaging purchase
    console.log('Testing addPackagingPurchase...');
    results.tests.addPackagingPurchase = addPackagingPurchase({
      userKey: 'owner@restaurant.com',
      date: '2024-01-20',
      pkg_id: 'PKG001',
      qtyBuy: 50,
      unitPrice: 2.5,
      note: 'Test packaging purchase'
    });
    
    // Test 15: Batch functions
    console.log('Testing addBatch...');
    results.tests.addBatch = addBatch({
      userKey: 'owner@restaurant.com',
      date: '2024-01-20',
      menu_id: 'MENU001',
      plan_qty: 25,
      note: 'Test batch',
      run_id: 'RUN001'
    });
    
    // Test 16: Overheads config
    console.log('Testing getOverheadsConfig...');
    results.tests.getOverheadsConfig = getOverheadsConfig();
    
    results.status = 'success';
    results.message = 'All tests completed successfully';
    
  } catch (error) {
    console.error('Test error:', error);
    results.status = 'error';
    results.message = 'Test failed';
    results.error = error.toString();
  }
  
  return results;
}

/**
 * Clean up all mock data
 * @return {Object} Cleanup result
 */
function cleanupMockData() {
  try {
    console.log('Cleaning up mock data...');
    
    const sheets = [
      SHEET_ING, SHEET_MENU, SHEET_MENU_RECIPES, SHEET_USERS,
      SHEET_COST_CENTERS, SHEET_PUR, SHEET_SALE, SHEET_COGS,
      SHEET_LABOR, SHEET_WASTE, SHEET_PACKAGING, SHEET_MARKET_RUNS,
      SHEET_MARKET_RUN_ITEMS, SHEET_PACKING_PURCHASES, SHEET_OVERHEADS,
      SHEET_MENU_EXTRAS, SHEET_BATCHES, SHEET_BATCH_COST_LINES
    ];
    
    sheets.forEach(sheetName => {
      try {
        const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
        if (sh) {
          const lastRow = sh.getLastRow();
          if (lastRow > 1) {
            sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).clearContent();
          }
        }
      } catch (error) {
        console.log(`Could not clean sheet ${sheetName}:`, error.message);
      }
    });
    
    _clearCache();
    
    return {
      status: 'success',
      message: 'Mock data cleaned up successfully'
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to clean up mock data',
      error: error.toString()
    };
  }
}

/**
 * Run complete system test with mock data
 * @return {Object} Complete test results
 */
function runCompleteSystemTest() {
  console.log('=== STARTING COMPLETE SYSTEM TEST ===');
  
  const results = {
    timestamp: nowStr(),
    steps: {}
  };
  
  try {
    // Step 1: Clean up existing data
    console.log('Step 1: Cleaning up existing data...');
    results.steps.cleanup = cleanupMockData();
    
    // Step 2: Populate mock data
    console.log('Step 2: Populating mock data...');
    results.steps.populate = populateAllMockData();
    
    // Step 3: Test all functions
    console.log('Step 3: Testing all functions...');
    results.steps.functionTests = testAllFunctions();
    
    // Step 4: Performance test
    console.log('Step 4: Running performance test...');
    const startTime = Date.now();
    const report = getReport({
      from: '2024-01-01',
      to: '2024-01-31',
      granularity: 'day'
    });
    const endTime = Date.now();
    
    results.steps.performance = {
      status: 'success',
      reportRows: report.rows.length,
      executionTime: endTime - startTime,
      message: `Report generated in ${endTime - startTime}ms`
    };
    
    results.status = 'success';
    results.message = 'Complete system test passed successfully';
    
  } catch (error) {
    console.error('System test error:', error);
    results.status = 'error';
    results.message = 'System test failed';
    results.error = error.toString();
  }
  
  console.log('=== SYSTEM TEST COMPLETED ===');
  return results;
}

/**
 * Verify all sheets are populated with mock data
 * @return {Object} Verification results
 */
function verifyMockDataPopulation() {
  console.log('🔍 Verifying mock data population...');
  
  const results = {
    timestamp: nowStr(),
    sheets: {},
    summary: {
      totalSheets: 0,
      populatedSheets: 0,
      emptySheets: 0
    }
  };
  
  const sheetsToCheck = [
    { name: 'Ingredients', sheet: SHEET_ING, expectedMin: 10 },
    { name: 'Menus', sheet: SHEET_MENU, expectedMin: 7 },
    { name: 'Menu Recipes', sheet: SHEET_MENU_RECIPES, expectedMin: 15 },
    { name: 'Users', sheet: SHEET_USERS, expectedMin: 4 },
    { name: 'Cost Centers', sheet: SHEET_COST_CENTERS, expectedMin: 3 },
    { name: 'Purchases', sheet: SHEET_PUR, expectedMin: 50 },
    { name: 'Sales', sheet: SHEET_SALE, expectedMin: 100 },
    { name: 'COGS', sheet: SHEET_COGS, expectedMin: 20 },
    { name: 'Labor Logs', sheet: SHEET_LABOR, expectedMin: 30 },
    { name: 'Waste', sheet: SHEET_WASTE, expectedMin: 10 },
    { name: 'Packaging', sheet: SHEET_PACKAGING, expectedMin: 4 },
    { name: 'Market Runs', sheet: SHEET_MARKET_RUNS, expectedMin: 3 },
    { name: 'Market Run Items', sheet: SHEET_MARKET_RUN_ITEMS, expectedMin: 6 },
    { name: 'Packaging Purchases', sheet: SHEET_PACKING_PURCHASES, expectedMin: 4 },
    { name: 'Overheads', sheet: SHEET_OVERHEADS, expectedMin: 3 },
    { name: 'Menu Extras', sheet: SHEET_MENU_EXTRAS, expectedMin: 5 },
    { name: 'Batches', sheet: SHEET_BATCHES, expectedMin: 3 },
    { name: 'Batch Cost Lines', sheet: SHEET_BATCH_COST_LINES, expectedMin: 5 }
  ];
  
  try {
    sheetsToCheck.forEach(sheetInfo => {
      try {
        const {rows} = byHeader(sheetInfo.sheet);
        const rowCount = rows.length;
        const isPopulated = rowCount >= sheetInfo.expectedMin;
        
        results.sheets[sheetInfo.name] = {
          sheetName: sheetInfo.sheet,
          rowCount: rowCount,
          expectedMin: sheetInfo.expectedMin,
          isPopulated: isPopulated,
          status: isPopulated ? '✅ Populated' : '❌ Empty/Insufficient'
        };
        
        results.summary.totalSheets++;
        if (isPopulated) {
          results.summary.populatedSheets++;
        } else {
          results.summary.emptySheets++;
        }
        
      } catch (error) {
        results.sheets[sheetInfo.name] = {
          sheetName: sheetInfo.sheet,
          error: error.message,
          status: '❌ Error'
        };
        results.summary.totalSheets++;
        results.summary.emptySheets++;
      }
    });
    
    results.summary.overallStatus = results.summary.emptySheets === 0 ? '✅ All sheets populated' : '❌ Some sheets missing data';
    
    console.log('Verification Results:', results);
    
    return results;
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return {
      status: 'error',
      message: 'Verification failed',
      error: error.toString()
    };
  }
}
