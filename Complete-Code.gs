/**
 * Complete Google Apps Script Code for POS System with Dropdown Functionality
 * Copy this entire content to your Code.gs file in Google Apps Script
 */

// ===== SHEET CONSTANTS =====
const SHEET_SALE = 'Sales';
const SHEET_PUR = 'Purchases';
const SHEET_MENU = 'Menus';
const SHEET_COGS = 'COGS';
const SHEET_ING = 'Ingredients';
const SHEET_MENU_RECIPES = 'MenuRecipes';
const SHEET_USERS = 'Users';
const SHEET_COST_CENTERS = 'CostCenters';
const SHEET_PACKAGING = 'Packaging';
const SHEET_LOTS = 'Lots';
const SHEET_PLATFORMS = 'Platforms';
const SHEET_STOCKS = 'Stocks';
const SHEET_LABOR = 'LaborLogs';
const SHEET_WASTE = 'Waste';
const SHEET_MARKET_RUNS = 'MarketRuns';
const SHEET_MARKET_RUN_ITEMS = 'MarketRunItems';
const SHEET_PACKING = 'Packing';
const SHEET_PACKING_PURCHASES = 'PackingPurchases';
const SHEET_OVERHEADS = 'Overheads';
const SHEET_MENU_EXTRAS = 'MenuExtras';
const SHEET_BATCH_COST_LINES = 'BatchCostLines';
const SHEET_BATCHES = 'Batches';
const SHEET_EXPENSES = 'Expenses';

// ===== CACHE MANAGEMENT =====
const CACHE_DURATION = 300; // 5 minutes
const cache = {};

function _getCache(key) {
  const cached = cache[key];
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION * 1000) {
    return cached.data;
  }
  return null;
}

function _setCache(key, data) {
  cache[key] = {
    data: data,
    timestamp: Date.now()
  };
}

function _clearCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
}

function _clearSheetCache(sheetName) {
  const keysToDelete = Object.keys(cache).filter(key =>
    key.includes(sheetName) || key === 'ingredient_map'
  );
  keysToDelete.forEach(key => delete cache[key]);
}

// ===== CORE HELPER FUNCTIONS =====
function nowStr() {
  return new Date().toISOString();
}

function _genId(prefix) {
  const d = new Date();
  const ts = Utilities.formatDate(d, Session.getScriptTimeZone() || 'GMT+7', 'yyyyMMddHHmmss');
  return `${prefix}${ts}`;
}

function _validateParams(params, required) {
  const missing = required.filter(param => !params[param]);
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

function _safeNumber(value, defaultValue = 0) {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

function _ensureSheetWithHeaders(name, headers) {
  const cacheKey = `sheet_${name}`;
  const cached = _getCache(cacheKey);
  if (cached) return cached;

  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);

  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers && headers.length) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  } else if (headers && headers.length) {
    const firstRow = sh.getRange(1, 1, 1, Math.max(headers.length, 1)).getValues()[0];
    if (!firstRow[0]) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  _setCache(cacheKey, sh);
  return sh;
}

function byHeader(sheetName) {
  const cacheKey = `data_${sheetName}`;
  const cached = _getCache(cacheKey);
  if (cached) return cached;

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error(`Sheet '${sheetName}' not found`);

  const lastRow = sh.getLastRow();
  if (lastRow < 1) {
    const result = { rows: [], idx: {}, sh };
    _setCache(cacheKey, result);
    return result;
  }

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const idx = {};
  headers.forEach((h, i) => { if (h) idx[h] = i; });

  const rows = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, headers.length).getValues() : [];
  const result = { rows, idx, sh };

  _setCache(cacheKey, result);
  return result;
}

function _getIngredientMap() {
  const cacheKey = 'ingredient_map';
  const cached = _getCache(cacheKey);
  if (cached) return cached;

  try {
    const { rows, idx } = byHeader(SHEET_ING);
    const map = {};

    rows.forEach(r => {
      const id = r[idx['id']];
      if (id) {
        map[id] = {
          id: id,
          name: r[idx['name']] || id,
          stockU: r[idx['stock_unit']] || 'unit',
          buyU: r[idx['buy_unit']] || 'unit',
          ratio: _safeNumber(r[idx['buy_to_stock_ratio']], 1),
          minStock: _safeNumber(r[idx['min_stock']], 5)
        };
      }
    });

    _setCache(cacheKey, map);
    return map;
  } catch (error) {
    console.error('Error in _getIngredientMap:', error);
    throw error;
  }
}

// ===== DROPDOWN FUNCTIONS =====

/**
 * Get all ingredients for dropdown population
 * @return {Array} Array of ingredient objects
 */
function getIngredients() {
  try {
    const cacheKey = 'dropdown_ingredients';
    const cached = _getCache(cacheKey);
    if (cached) return cached;

    const { rows, idx } = byHeader('Ingredients');
    const ingredients = [];

    rows.forEach(r => {
      const id = r[idx['id']] || r[idx['ingredient_id']] || r[idx['ID']];
      if (id) {
        ingredients.push({
          id: id,
          name: r[idx['name']] || r[idx['ingredient_name']] || r[idx['ชื่อ']] || id,
          stock_unit: r[idx['stock_unit']] || r[idx['หน่วยสต๊อก']] || 'unit',
          buy_unit: r[idx['buy_unit']] || r[idx['หน่วยซื้อ']] || 'unit',
          buy_to_stock_ratio: _safeNumber(r[idx['buy_to_stock_ratio']] || r[idx['อัตราแปลง']], 1)
        });
      }
    });

    _setCache(cacheKey, ingredients);
    return ingredients;

  } catch (error) {
    console.error('Error in getIngredients:', error);
    return [];
  }
}

/**
 * Get all menus for dropdown population
 * @return {Array} Array of menu objects
 */
function getMenus() {
  try {
    const cacheKey = 'dropdown_menus';
    const cached = _getCache(cacheKey);
    if (cached) return cached;

    const { rows, idx } = byHeader('Menus');
    const menus = [];

    rows.forEach(r => {
      const id = r[idx['menu_id']] || r[idx['id']] || r[idx['ID']];
      if (id) {
        menus.push({
          id: id,
          name: r[idx['name']] || r[idx['เมนู']] || r[idx['menu_name']] || id,
          price: _safeNumber(r[idx['price']] || r[idx['ราคา']] || r[idx['selling_price']], 0)
        });
      }
    });

    _setCache(cacheKey, menus);
    return menus;

  } catch (error) {
    console.error('Error in getMenus:', error);
    return [];
  }
}

/**
 * Get ingredients for a specific menu
 * @param {string} menuId - Menu ID
 * @return {Array} Array of menu ingredient objects
 */
function getMenuIngredients(menuId) {
  try {
    if (!menuId) return [];

    const cacheKey = `dropdown_menu_ingredients_${menuId}`;
    const cached = _getCache(cacheKey);
    if (cached) return cached;

    const { rows, idx } = byHeader('MenuRecipes');
    const ingredients = [];

    const ingMap = _getIngredientMap();

    rows.forEach(r => {
      const recipeMenuId = r[idx['menu_id']] || r[idx['เมนู_id']];
      if (String(recipeMenuId) === String(menuId)) {
        const ingredientId = r[idx['ingredient_id']] || r[idx['วัตถุดิบ_id']];
        const ingredient = ingMap[ingredientId];
        
        ingredients.push({
          ingredient_id: ingredientId,
          ingredient_name: ingredient ? ingredient.name : (r[idx['ingredient_name']] || ingredientId),
          quantity: _safeNumber(r[idx['quantity']] || r[idx['จำนวน']], 0),
          unit: r[idx['unit']] || r[idx['หน่วย']] || (ingredient ? ingredient.stockU : 'unit')
        });
      }
    });

    _setCache(cacheKey, ingredients);
    return ingredients;

  } catch (error) {
    console.error('Error in getMenuIngredients:', error);
    return [];
  }
}

/**
 * Get all platforms for dropdown population
 * @return {Array} Array of platform objects
 */
function getPlatforms() {
  try {
    const cacheKey = 'dropdown_platforms';
    const cached = _getCache(cacheKey);
    if (cached) return cached;

    let platforms = [];

    try {
      const { rows, idx } = byHeader('Platforms');
      rows.forEach(r => {
        const id = r[idx['id']] || r[idx['platform_id']] || r[idx['ID']];
        if (id) {
          platforms.push({
            id: id,
            name: r[idx['name']] || r[idx['platform_name']] || r[idx['ชื่อ']] || id
          });
        }
      });
    } catch (e) {
      console.log('Platforms sheet not found, using defaults');
    }

    if (platforms.length === 0) {
      platforms = [
        { id: 'walkin', name: 'Walk-in' },
        { id: 'grab', name: 'Grab' },
        { id: 'lineman', name: 'Line Man' },
        { id: 'shopee', name: 'Shopee Food' },
        { id: 'foodpanda', name: 'Foodpanda' }
      ];
    }

    _setCache(cacheKey, platforms);
    return platforms;

  } catch (error) {
    console.error('Error in getPlatforms:', error);
    return [
      { id: 'walkin', name: 'Walk-in' },
      { id: 'grab', name: 'Grab' },
      { id: 'lineman', name: 'Line Man' },
      { id: 'shopee', name: 'Shopee Food' },
      { id: 'foodpanda', name: 'Foodpanda' }
    ];
  }
}

/**
 * Test dropdown functions
 * @return {Object} Test results
 */
function testDropdownFunctions() {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test getIngredients
    try {
      const ingredients = getIngredients();
      results.tests.getIngredients = {
        success: true,
        count: ingredients.length,
        sample: ingredients.slice(0, 3)
      };
    } catch (e) {
      results.tests.getIngredients = {
        success: false,
        error: e.toString()
      };
    }

    // Test getMenus
    try {
      const menus = getMenus();
      results.tests.getMenus = {
        success: true,
        count: menus.length,
        sample: menus.slice(0, 3)
      };
    } catch (e) {
      results.tests.getMenus = {
        success: false,
        error: e.toString()
      };
    }

    // Test getPlatforms
    try {
      const platforms = getPlatforms();
      results.tests.getPlatforms = {
        success: true,
        count: platforms.length,
        sample: platforms
      };
    } catch (e) {
      results.tests.getPlatforms = {
        success: false,
        error: e.toString()
      };
    }

    // Test getMenuIngredients
    try {
      const menus = getMenus();
      if (menus.length > 0) {
        const menuIngredients = getMenuIngredients(menus[0].id);
        results.tests.getMenuIngredients = {
          success: true,
          menuId: menus[0].id,
          count: menuIngredients.length,
          sample: menuIngredients.slice(0, 3)
        };
      } else {
        results.tests.getMenuIngredients = {
          success: true,
          note: 'No menus available to test'
        };
      }
    } catch (e) {
      results.tests.getMenuIngredients = {
        success: false,
        error: e.toString()
      };
    }

    return results;

  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Clear dropdown cache
 * @return {Object} Result
 */
function clearDropdownCache() {
  try {
    const keysToDelete = [
      'dropdown_ingredients',
      'dropdown_menus', 
      'dropdown_platforms'
    ];

    keysToDelete.forEach(key => {
      if (cache[key]) {
        delete cache[key];
      }
    });

    Object.keys(cache).forEach(key => {
      if (key.startsWith('dropdown_menu_ingredients_')) {
        delete cache[key];
      }
    });

    if (cache['ingredient_map']) {
      delete cache['ingredient_map'];
    }

    return {
      success: true,
      message: 'Dropdown cache cleared successfully',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

// ===== SHEET VERIFICATION FUNCTIONS =====

/**
 * Verify and fix sheet structure
 * @return {Object} Verification results
 */
function verifyAndFixSheetStructure() {
  const results = {
    timestamp: new Date().toISOString(),
    sheets: {},
    summary: {
      total: 0,
      existing: 0,
      created: 0,
      fixed: 0,
      errors: 0
    }
  };

  const requiredSheets = {
    'Ingredients': {
      required: ['id', 'name', 'stock_unit', 'buy_unit', 'buy_to_stock_ratio'],
      optional: ['min_stock', 'category', 'supplier', 'notes']
    },
    'Menus': {
      required: ['menu_id', 'name', 'price'],
      optional: ['category', 'description', 'active', 'เมนู', 'ราคา']
    },
    'MenuRecipes': {
      required: ['menu_id', 'ingredient_id', 'quantity', 'unit'],
      optional: ['notes', 'optional']
    },
    'Platforms': {
      required: ['id', 'name'],
      optional: ['commission_rate', 'active', 'notes']
    },
    'Sales': {
      required: ['date', 'platform', 'menu_id', 'qty', 'price_per_unit', 'net_per_unit'],
      optional: ['วันที่', 'แพลตฟอร์ม', 'จำนวน', 'ราคาขายต่อหน่วย', 'สุทธิ(ต่อหน่วย)', 'notes']
    },
    'Purchases': {
      required: ['date', 'lot_id', 'ingredient_id', 'ingredient_name', 'qty_buy', 'unit', 'total_price', 'unit_price', 'qty_stock', 'cost_per_stock', 'remaining_stock'],
      optional: ['supplier_note', 'supplier', 'batch_number']
    },
    'COGS': {
      required: ['วันที่', 'menu_id', 'ต้นทุนรวม'],
      optional: ['quantity', 'notes']
    },
    'Users': {
      required: ['user_key', 'role', 'name', 'active', 'created_at'],
      optional: ['email', 'last_login', 'permissions']
    }
  };

  const ss = SpreadsheetApp.getActive();

  Object.entries(requiredSheets).forEach(([sheetName, structure]) => {
    results.summary.total++;
    
    try {
      let sheet = ss.getSheetByName(sheetName);
      const sheetResult = {
        exists: !!sheet,
        columns: {
          existing: [],
          missing: [],
          added: []
        },
        actions: [],
        status: 'ok'
      };

      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheetResult.exists = true;
        sheetResult.actions.push('Created sheet');
        results.summary.created++;
      } else {
        results.summary.existing++;
      }

      const lastCol = Math.max(sheet.getLastColumn(), 1);
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      
      const existingHeaders = headers.map(h => String(h || '').trim()).filter(h => h);
      sheetResult.columns.existing = existingHeaders;

      const missingRequired = structure.required.filter(col => !existingHeaders.includes(col));
      sheetResult.columns.missing = missingRequired;

      if (missingRequired.length > 0) {
        const newHeaders = [...existingHeaders, ...missingRequired];
        sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
        sheetResult.columns.added = missingRequired;
        sheetResult.actions.push(`Added columns: ${missingRequired.join(', ')}`);
        results.summary.fixed++;
      }

      if (sheet.getLastRow() <= 1) {
        const sampleData = generateSampleData(sheetName, structure);
        if (sampleData.length > 0) {
          const startRow = 2;
          const numCols = sheet.getLastColumn();
          sheet.getRange(startRow, 1, sampleData.length, numCols).setValues(sampleData);
          sheetResult.actions.push(`Added ${sampleData.length} sample rows`);
        }
      }

      results.sheets[sheetName] = sheetResult;

    } catch (error) {
      results.sheets[sheetName] = {
        exists: false,
        error: error.toString(),
        status: 'error'
      };
      results.summary.errors++;
    }
  });

  return results;
}

function generateSampleData(sheetName, structure) {
  const now = new Date().toISOString().slice(0, 10);
  
  switch (sheetName) {
    case 'Ingredients':
      return [
        ['ING001', 'กุ้ง', 'piece', 'kg', 43, 10],
        ['ING002', 'น้ำปลา', 'ml', 'bottle', 700, 2],
        ['ING003', 'พริกแกง', 'g', 'pack', 100, 5]
      ];
      
    case 'Menus':
      return [
        ['MENU001', 'กุ้งแซ่บ', 120],
        ['MENU002', 'ส้มตำกุ้ง', 80],
        ['MENU003', 'ลาบกุ้ง', 100]
      ];
      
    case 'MenuRecipes':
      return [
        ['MENU001', 'ING001', 5, 'piece'],
        ['MENU001', 'ING002', 10, 'ml'],
        ['MENU002', 'ING001', 3, 'piece']
      ];
      
    case 'Platforms':
      return [
        ['walkin', 'Walk-in', 0],
        ['grab', 'Grab', 30],
        ['lineman', 'Line Man', 30],
        ['shopee', 'Shopee Food', 25],
        ['foodpanda', 'Foodpanda', 35]
      ];
      
    case 'Sales':
      return [
        [now, 'walkin', 'MENU001', 2, 120, 120],
        [now, 'grab', 'MENU002', 1, 80, 56]
      ];
      
    case 'Users':
      return [
        [Session.getActiveUser().getEmail() || 'admin@example.com', 'OWNER', 'Admin User', 'TRUE', new Date().toISOString()]
      ];
      
    default:
      return [];
  }
}

/**
 * Quick setup function for dropdown functionality
 * @return {Object} Setup results
 */
function quickSetupDropdownSheets() {
  try {
    console.log('🚀 Starting quick setup for dropdown functionality...');
    
    const results = verifyAndFixSheetStructure();
    
    console.log('📊 Sheet verification completed:');
    console.log(`- Total sheets: ${results.summary.total}`);
    console.log(`- Existing: ${results.summary.existing}`);
    console.log(`- Created: ${results.summary.created}`);
    console.log(`- Fixed: ${results.summary.fixed}`);
    console.log(`- Errors: ${results.summary.errors}`);
    
    console.log('🧪 Testing dropdown functions...');
    const testResults = testDropdownFunctions();
    
    const allTests = Object.values(testResults.tests);
    const successCount = allTests.filter(t => t.success).length;
    const summary = `${successCount}/${allTests.length} tests passed`;
    
    console.log('✅ Setup completed!');
    console.log(`Test results: ${summary}`);
    
    return {
      success: true,
      message: 'Dropdown sheets setup completed successfully',
      details: results,
      tests: testResults,
      summary: summary
    };
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ===== EXISTING POS FUNCTIONS (keeping your original functions) =====

function addPurchase({ date, ingredient_id, qtyBuy, unit, totalPrice, unitPrice, supplierNote, actualYield }) {
  _validateParams({ ingredient_id, qtyBuy, totalPrice }, ['ingredient_id', 'qtyBuy', 'totalPrice']);

  qtyBuy = _safeNumber(qtyBuy);
  totalPrice = _safeNumber(totalPrice);
  unitPrice = _safeNumber(unitPrice);

  if (qtyBuy <= 0 || totalPrice <= 0) {
    throw new Error('จำนวนและราคารวมต้องมากกว่า 0');
  }

  if (ingredient_id === 'AUTO') {
    throw new Error('❌ เกิดข้อผิดพลาด: ingredient_id เป็น "AUTO" กรุณาล้างข้อมูลและลองใหม่');
  }

  const lot_id = _genId('LOT');
  const d = date || nowStr().slice(0, 10);

  const ingMap = _getIngredientMap();

  let ing = ingMap[ingredient_id];
  if (!ing) {
    for (const [id, ingredient] of Object.entries(ingMap)) {
      if (ingredient.name === ingredient_id) {
        ing = ingredient;
        break;
      }
    }
  }

  if (!ing) {
    ing = {
      id: ingredient_id,
      name: ingredient_id,
      stockU: 'หน่วย',
      buyU: 'หน่วย',
      ratio: 1,
      minStock: 5
    };
  }

  let qtyStock, costPerStock;

  if (actualYield && actualYield > 0) {
    qtyStock = actualYield;
    costPerStock = totalPrice / actualYield;
    console.log(`Using actual yield: ${actualYield} pieces from ${qtyBuy} ${unit}`);
  } else {
    const conversionRatio = ing.ratio > 0 ? (1 / ing.ratio) : 1;
    qtyStock = qtyBuy * conversionRatio;
    costPerStock = qtyStock > 0 ? (qtyBuy * unitPrice) / qtyStock : 0;
  }

  const sh = _ensureSheetWithHeaders(SHEET_PUR, [
    'date', 'lot_id', 'ingredient_id', 'ingredient_name',
    'qty_buy', 'unit', 'total_price', 'unit_price', 'qty_stock',
    'cost_per_stock', 'remaining_stock', 'supplier_note'
  ]);

  sh.appendRow([
    d, lot_id, ing.id, ing.name, qtyBuy, unit || 'หน่วย',
    totalPrice, unitPrice, qtyStock, costPerStock, qtyStock, supplierNote || ''
  ]);

  _clearSheetCache(SHEET_PUR);

  return {
    status: 'ok',
    lot_id: lot_id,
    qtyStock: qtyStock,
    costPerStock: costPerStock
  };
}

function getLowStockHTML() {
  try {
    const ingMap = _getIngredientMap();
    const stockMap = {};

    try {
      const { rows, idx } = byHeader(SHEET_PUR);
      rows.forEach(r => {
        const id = r[idx['ingredient_id']];
        const rem = Number(r[idx['remaining_stock']] || 0);
        if (id && rem > 0) {
          stockMap[id] = (stockMap[id] || 0) + rem;
        }
      });
    } catch (e) {
      console.log('No purchases sheet found for stock calculation');
    }

    const lowStock = Object.entries(ingMap)
      .filter(([id, ing]) => {
        const currentStock = stockMap[id] || 0;
        const minStock = ing.minStock || 5;
        return currentStock < minStock;
      })
      .map(([id, ing]) => ({
        id: id,
        name: ing.name,
        remaining: stockMap[id] || 0,
        minimum: ing.minStock || 5,
        unit: ing.stockU || 'หน่วย'
      }))
      .sort((a, b) => a.remaining - b.remaining);

    if (lowStock.length === 0) {
      return '<div class="hint">ไม่มีวัตถุดิบที่ใกล้หมด 👍</div>';
    }

    const rows = lowStock.map(item =>
      `<tr><td>${item.name}</td><td style="color: ${item.remaining === 0 ? 'red' : 'orange'}">${item.remaining} ${item.unit}</td><td>${item.minimum} ${item.unit}</td><td>${item.id}</td></tr>`
    ).join('');

    return `<table><thead><tr><th>วัตถุดิบ</th><th>คงเหลือ</th><th>ขั้นต่ำ</th><th>รหัส</th></tr></thead><tbody>${rows}</tbody></table>`;

  } catch (error) {
    return `<div class="hint">ไม่สามารถโหลดข้อมูลได้: ${error.toString()}</div>`;
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('POS ร้านกุ้งแซ่บ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}