/**
 * Google Sheets Setup for POS System
 * Run this once to create all required sheets with proper headers
 */

function setupPOSSheets() {
  console.log('🚀 Setting up POS Sheets...');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create Ingredients sheet
    createIngredientsSheet(ss);
    
    // Create Purchases sheet  
    createPurchasesSheet(ss);
    
    // Create Sales sheet
    createSalesSheet(ss);
    
    // Create Menus sheet
    createMenusSheet(ss);
    
    // Create MenuRecipes sheet
    createMenuRecipesSheet(ss);
    
    // Create Users sheet
    createUsersSheet(ss);
    
    // Create Platforms sheet
    createPlatformsSheet(ss);
    
    // Create CostCenters sheet
    createCostCentersSheet(ss);
    
    console.log('✅ All sheets created successfully!');
    
    return {
      status: 'success',
      message: 'All POS sheets created successfully',
      sheets: ss.getSheets().map(s => s.getName())
    };
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

function createIngredientsSheet(ss) {
  let sheet = ss.getSheetByName('Ingredients');
  if (!sheet) {
    sheet = ss.insertSheet('Ingredients');
  }
  
  // Clear and set headers
  sheet.clear();
  const headers = [
    'id', 'name', 'stock_unit', 'buy_unit', 'buy_to_stock_ratio', 
    'min_stock', 'current_stock', 'cost_per_unit', 'last_updated'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Add sample data
  const sampleData = [
    ['กุ้ง', 'กุ้งสด', 'กรام', 'กิโลกรام', 1000, 5000, 10000, 200, new Date()],
    ['มะละกอ', 'มะละกอดิบ', 'กรัม', 'กิโลกรัม', 1000, 2000, 5000, 30, new Date()],
    ['น้ำปลา', 'น้ำปลาดี', 'มิลลิลิตร', 'ขวด', 700, 1400, 2800, 45, new Date()],
    ['มะนาว', 'มะนาวสด', 'ลูก', 'กิโลกรัม', 20, 50, 100, 25, new Date()]
  ];
  
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  
  console.log('✅ Ingredients sheet created');
}

function createPurchasesSheet(ss) {
  let sheet = ss.getSheetByName('Purchases');
  if (!sheet) {
    sheet = ss.insertSheet('Purchases');
  }
  
  sheet.clear();
  const headers = [
    'date', 'ingredient_id', 'qty_buy', 'unit', 'total_price', 
    'unit_price', 'supplier_note', 'actual_yield', 'lot_id', 'cost_per_stock'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  console.log('✅ Purchases sheet created');
}

function createSalesSheet(ss) {
  let sheet = ss.getSheetByName('Sales');
  if (!sheet) {
    sheet = ss.insertSheet('Sales');
  }
  
  sheet.clear();
  const headers = [
    'date', 'platform', 'menu_id', 'qty', 'price', 'revenue', 'cost', 'profit'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  console.log('✅ Sales sheet created');
}

function createMenusSheet(ss) {
  let sheet = ss.getSheetByName('Menus');
  if (!sheet) {
    sheet = ss.insertSheet('Menus');
  }
  
  sheet.clear();
  const headers = [
    'menu_id', 'name', 'price', 'category', 'active', 'description'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Add sample menus
  const sampleMenus = [
    ['กุ้งแซ่บ', 'กุ้งแซ่บ (ถาดใหญ่)', 120, 'หลัก', true, 'กุ้งสดย่างเผ็ดร้อน'],
    ['ส้มตำ', 'ส้มตำไทย', 80, 'หลัก', true, 'ส้มตำรสชาติดั้งเดิม'],
    ['ลาบ', 'ลาบหมู', 100, 'หลัก', true, 'ลาบหมูสับเผ็ดร้อน'],
    ['น้ำส้ม', 'น้ำส้มคั้นสด', 25, 'เครื่องดื่ม', true, 'น้ำส้มคั้นสดใหม่']
  ];
  
  sheet.getRange(2, 1, sampleMenus.length, sampleMenus[0].length).setValues(sampleMenus);
  
  console.log('✅ Menus sheet created');
}

function createMenuRecipesSheet(ss) {
  let sheet = ss.getSheetByName('MenuRecipes');
  if (!sheet) {
    sheet = ss.insertSheet('MenuRecipes');
  }
  
  sheet.clear();
  const headers = [
    'menu_id', 'ingredient_id', 'quantity_per_serving', 'unit', 'notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Add sample recipes
  const sampleRecipes = [
    ['กุ้งแซ่บ', 'กุ้ง', 200, 'กรัม', 'กุ้งสดขนาดกลาง'],
    ['กุ้งแซ่บ', 'น้ำปลา', 30, 'มิลลิลิตร', 'ปรุงรส'],
    ['ส้มตำ', 'มะละกอ', 150, 'กรัม', 'มะละกอฝอยหยาบ'],
    ['ส้มตำ', 'มะนาว', 2, 'ลูก', 'คั้นน้ำมะนาว']
  ];
  
  sheet.getRange(2, 1, sampleRecipes.length, sampleRecipes[0].length).setValues(sampleRecipes);
  
  console.log('✅ MenuRecipes sheet created');
}

function createUsersSheet(ss) {
  let sheet = ss.getSheetByName('Users');
  if (!sheet) {
    sheet = ss.insertSheet('Users');
  }
  
  sheet.clear();
  const headers = [
    'user_id', 'name', 'role', 'email', 'active', 'created_date'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Add sample user
  const sampleUsers = [
    ['admin', 'ผู้ดูแลระบบ', 'admin', 'admin@restaurant.com', true, new Date()]
  ];
  
  sheet.getRange(2, 1, sampleUsers.length, sampleUsers[0].length).setValues(sampleUsers);
  
  console.log('✅ Users sheet created');
}

function createPlatformsSheet(ss) {
  let sheet = ss.getSheetByName('Platforms');
  if (!sheet) {
    sheet = ss.insertSheet('Platforms');
  }
  
  sheet.clear();
  const headers = [
    'platform_id', 'name', 'commission_rate', 'active', 'notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Add sample platforms
  const samplePlatforms = [
    ['walkin', 'Walk-in', 0, true, 'ลูกค้าเดินเข้ามาซื้อเอง'],
    ['grab', 'Grab Food', 0.30, true, 'แพลตฟอร์ม Grab Food'],
    ['lineman', 'LINE MAN', 0.25, true, 'แพลตฟอร์ม LINE MAN'],
    ['foodpanda', 'foodpanda', 0.35, true, 'แพลตฟอร์ม foodpanda']
  ];
  
  sheet.getRange(2, 1, samplePlatforms.length, samplePlatforms[0].length).setValues(samplePlatforms);
  
  console.log('✅ Platforms sheet created');
}

function createCostCentersSheet(ss) {
  let sheet = ss.getSheetByName('CostCenters');
  if (!sheet) {
    sheet = ss.insertSheet('CostCenters');
  }
  
  sheet.clear();
  const headers = [
    'cost_center_id', 'name', 'description', 'active'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Add sample cost centers
  const sampleCostCenters = [
    ['kitchen', 'ครัว', 'ค่าใช้จ่ายในครัว', true],
    ['service', 'บริการ', 'ค่าใช้จ่ายด้านบริการ', true],
    ['admin', 'บริหาร', 'ค่าใช้จ่ายด้านบริหาร', true]
  ];
  
  sheet.getRange(2, 1, sampleCostCenters.length, sampleCostCenters[0].length).setValues(sampleCostCenters);
  
  console.log('✅ CostCenters sheet created');
}

/**
 * Test function to verify all sheets are working
 */
function testSheetsSetup() {
  console.log('🧪 Testing sheets setup...');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const requiredSheets = [
      'Ingredients', 'Purchases', 'Sales', 'Menus', 
      'MenuRecipes', 'Users', 'Platforms', 'CostCenters'
    ];
    
    const results = {};
    
    requiredSheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      results[sheetName] = {
        exists: !!sheet,
        rows: sheet ? sheet.getLastRow() : 0,
        columns: sheet ? sheet.getLastColumn() : 0
      };
    });
    
    console.log('📊 Test results:', results);
    
    return {
      status: 'success',
      message: 'Sheets test completed',
      results: results
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}