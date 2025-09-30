/**
 * Cost-POS System - Google Apps Script
 * Optimized version with improved performance and maintainability
 * 
 * @author Optimized by AI Assistant
 * @version 2.0
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

/**
 * Cache management functions
 */
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

/**
 * Clear cache for specific sheet data
 * @param {string} sheetName - Name of the sheet to clear cache for
 */
function _clearSheetCache(sheetName) {
  const keysToDelete = Object.keys(cache).filter(key => 
    key.includes(sheetName) || key === 'ingredient_map'
  );
  keysToDelete.forEach(key => delete cache[key]);
}

// ===== CORE HELPER FUNCTIONS =====

/**
 * Get current timestamp string
 * @return {string} ISO timestamp
 */
function nowStr() {
  return new Date().toISOString();
}

/**
 * Generate unique ID with prefix
 * @param {string} prefix - ID prefix
 * @return {string} Unique ID
 */
function _genId(prefix) {
  const d = new Date();
  const ts = Utilities.formatDate(d, Session.getScriptTimeZone() || 'GMT+7', 'yyyyMMddHHmmss');
  return `${prefix}${ts}`;
}

/**
 * Validate required parameters
 * @param {Object} params - Parameters to validate
 * @param {Array} required - Required parameter names
 * @throws {Error} If required parameters are missing
 */
function _validateParams(params, required) {
  const missing = required.filter(param => !params[param]);
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

/**
 * Safe number conversion with default value
 * @param {*} value - Value to convert
 * @param {number} defaultValue - Default value if conversion fails
 * @return {number} Converted number
 */
function _safeNumber(value, defaultValue = 0) {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Ensure sheet with headers exists; create if missing
 * @param {string} name - Sheet name
 * @param {Array} headers - Header array
 * @return {Sheet} Sheet object
 */
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
    // If header row is empty or different length, set headers (non-destructive if matching)
    if (!firstRow[0]) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  
  _setCache(cacheKey, sh);
  return sh;
}

/**
 * Read sheet with headers and return structured data
 * @param {string} sheetName - Name of the sheet
 * @return {Object} Object containing rows, idx, and sh
 */
function byHeader(sheetName) {
  const cacheKey = `data_${sheetName}`;
  const cached = _getCache(cacheKey);
  if (cached) return cached;
  
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error(`Sheet '${sheetName}' not found`);
  
  const lastRow = sh.getLastRow();
  if (lastRow < 1) {
    const result = {rows: [], idx: {}, sh};
    _setCache(cacheKey, result);
    return result;
  }
  
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const idx = {};
  headers.forEach((h, i) => { if (h) idx[h] = i; });
  
  const rows = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, headers.length).getValues() : [];
  const result = {rows, idx, sh};
  
  _setCache(cacheKey, result);
  return result;
}

/**
 * Get ingredient map for lookups with caching
 * @return {Object} Ingredient map
 */
function _getIngredientMap() {
  const cacheKey = 'ingredient_map';
  const cached = _getCache(cacheKey);
  if (cached) return cached;
  
  try {
    const {rows, idx} = byHeader(SHEET_ING);
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

/** List lots by ingredient for FIFO */
function _listLotsByIngredient(ingredient_id) {
  const {rows, idx, sh} = byHeader(SHEET_PUR);
  const lots = [];
  
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const id = r[idx['ingredient_id']];
    const rem = Number(r[idx['remaining_stock']] || 0);
    
    if (String(id) === String(ingredient_id) && rem > 0) {
      lots.push({
        rowIdx: i,
        lot_id: r[idx['lot_id']],
        date: new Date(r[idx['date']]),
        costPer: Number(r[idx['cost_per_stock']] || 0),
        rem: rem
      });
    }
  }
  
  // Sort by date (FIFO)
  lots.sort((a, b) => a.date - b.date);
  return {lots, sh, idx};
}

// Simple test function to check sheet availability
function testSheetAccess() {
  try {
    const ss = SpreadsheetApp.getActive();
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(s => s.getName());
    
    console.log('Available sheets:', sheetNames);
    
    // Test ingredients sheet
    const ingSheet = ss.getSheetByName(SHEET_ING);
    console.log('Ingredients sheet exists:', !!ingSheet);
    
    // Test menu sheet
    const menuSheet = ss.getSheetByName(SHEET_MENU_RECIPES);
    console.log('Menu sheet exists:', !!menuSheet);
    
    return {
      success: true,
      availableSheets: sheetNames,
      ingredientsSheetExists: !!ingSheet,
      menuSheetExists: !!menuSheet
    };
  } catch (error) {
    console.error('testSheetAccess error:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/** =========================
 * BOOTSTRAP DATA FUNCTION
 * =========================*/

// Function to clean up AUTO entries from purchases sheet
function cleanupAutoEntries() {
  try {
    const {rows, idx, sh} = byHeader(SHEET_PUR);
    let cleaned = 0;
    
    // Find rows with ingredient_id = "AUTO"
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (row[idx['ingredient_id']] === 'AUTO') {
        const rowNumber = i + 2; // +2 because rows array is 0-based and sheet has header
        console.log(`Removing AUTO entry at row ${rowNumber}:`, row);
        sh.deleteRow(rowNumber);
        cleaned++;
      }
    }
    
    return {
      status: 'success',
      cleaned: cleaned,
      message: `ลบรายการ AUTO จำนวน ${cleaned} รายการ`
    };
  } catch (e) {
    console.error('Error cleaning up AUTO entries:', e);
    return {
      status: 'error',
      error: e.toString()
    };
  }
}

// Debug function to check sheet structure
function debugSheetStructure() {
  try {
    const ss = SpreadsheetApp.getActive();
    const sheets = ss.getSheets();
    console.log('Available sheets:', sheets.map(s => s.getName()));
    
    // Check ingredients sheet
    const ingSheet = ss.getSheetByName(SHEET_ING);
    if (ingSheet) {
      console.log('Ingredients sheet found:', SHEET_ING);
      const headers = ingSheet.getRange(1, 1, 1, ingSheet.getLastColumn()).getValues()[0];
      console.log('Ingredients headers:', headers);
      
      const sampleData = ingSheet.getRange(2, 1, Math.min(5, ingSheet.getLastRow()-1), headers.length).getValues();
      console.log('Sample ingredients data:', sampleData);
    } else {
      console.log('Ingredients sheet not found:', SHEET_ING);
    }
    
    // Check menu sheet
    const menuSheet = ss.getSheetByName(SHEET_MENU_RECIPES);
    if (menuSheet) {
      console.log('Menu sheet found:', SHEET_MENU_RECIPES);
      const headers = menuSheet.getRange(1, 1, 1, menuSheet.getLastColumn()).getValues()[0];
      console.log('Menu headers:', headers);
    } else {
      console.log('Menu sheet not found:', SHEET_MENU_RECIPES);
    }
    
    return {
      sheets: sheets.map(s => s.getName()),
      ingredientsHeaders: ingSheet ? ingSheet.getRange(1, 1, 1, ingSheet.getLastColumn()).getValues()[0] : null,
      sampleIngredients: ingSheet ? ingSheet.getRange(2, 1, Math.min(3, ingSheet.getLastRow()-1), ingSheet.getLastColumn()).getValues() : null,
      menuHeaders: menuSheet ? menuSheet.getRange(1, 1, 1, menuSheet.getLastColumn()).getValues()[0] : null
    };
  } catch (e) {
    console.error('Debug error:', e);
    return {error: e.toString()};
  }
}

function getBootstrapData() {
  try {
    // Get ingredients
    const ingredients = [];
    try {
      const {rows: ingRows, idx: ingIdx} = byHeader(SHEET_ING);
      console.log('Ingredients sheet headers:', Object.keys(ingIdx));
      console.log('Ingredients sheet sample rows:', ingRows.slice(0, 3));
      
      ingRows.forEach(r => {
        const id = r[ingIdx['id']];
        if (id) {
          const ingredient = {
            id: id,
            name: r[ingIdx['name']] || id,
            stockU: r[ingIdx['stock_unit']] || 'unit'
          };
          console.log('Processing ingredient:', ingredient);
          ingredients.push(ingredient);
        }
      });
    } catch (e) {
      console.log('No ingredients sheet found:', e.message);
    }

    // Get menus
    const menus = [];
    try {
      const {rows: menuRows, idx: menuIdx} = byHeader(SHEET_MENU);
      menuRows.forEach(r => {
        const id = r[menuIdx['menu_id']];
        if (id) {
          menus.push({
            menu_id: id,
            name: r[menuIdx['name']] || id
          });
        }
      });
    } catch (e) {
      console.log('No menus sheet found:', e.message);
    }

    // Get platforms (default if no sheet)
    const platforms = {
      'ร้าน': 0,
      'Line Man': 30,
      'Food Panda': 35,
      'Grab Food': 30,
      'Shopee Food': 25
    };

    return {
      ingredients: ingredients,
      menus: menus,
      platforms: platforms,
      status: 'ok'
    };
    
  } catch (error) {
    console.error('getBootstrapData error:', error);
    return {
      ingredients: [],
      menus: [],
      platforms: {'ร้าน': 0},
      status: 'error',
      error: error.toString()
    };
  }
}

/** =========================
 * PURCHASE FUNCTION
 * =========================*/

/**
 * Add purchase with optimized validation and error handling
 * @param {Object} params - Purchase parameters
 * @param {string} params.date - Purchase date
 * @param {string} params.ingredient_id - Ingredient ID
 * @param {number} params.qtyBuy - Quantity bought
 * @param {string} params.unit - Unit
 * @param {number} params.totalPrice - Total price
 * @param {number} params.unitPrice - Unit price
 * @param {string} params.supplierNote - Supplier note
 * @return {Object} Result object
 */
function addPurchase({date, ingredient_id, qtyBuy, unit, totalPrice, unitPrice, supplierNote, actualYield}) {
  // Validate required parameters
  _validateParams({ingredient_id, qtyBuy, totalPrice}, ['ingredient_id', 'qtyBuy', 'totalPrice']);
  
  // Convert and validate numbers
  qtyBuy = _safeNumber(qtyBuy);
  totalPrice = _safeNumber(totalPrice);
  unitPrice = _safeNumber(unitPrice);
  
  if (qtyBuy <= 0 || totalPrice <= 0) {
    throw new Error('จำนวนและราคารวมต้องมากกว่า 0');
  }
  
  // CRITICAL FIX: If ingredient_id is "AUTO", throw an error
  if (ingredient_id === 'AUTO') {
    throw new Error('❌ เกิดข้อผิดพลาด: ingredient_id เป็น "AUTO" กรุณาล้างข้อมูลและลองใหม่');
  }

  const lot_id = _genId('LOT');
  const d = date || nowStr().slice(0, 10);
  
  // Get ingredient info for conversion
  const ingMap = _getIngredientMap();
  
  // Try to find ingredient by ID first, then by name
  let ing = ingMap[ingredient_id];
  if (!ing) {
    // If not found by ID, try to find by name
    for (const [id, ingredient] of Object.entries(ingMap)) {
      if (ingredient.name === ingredient_id) {
        ing = ingredient;
        break;
      }
    }
  }
  
  if (!ing) {
    // If still not found, create a new ingredient entry
    ing = {
      id: ingredient_id,
      name: ingredient_id,
      stockU: 'หน่วย',
      buyU: 'หน่วย',
      ratio: 1,
      minStock: 5
    };
  }
  
  // Handle variable yield (like prawns per kg)
  let qtyStock, costPerStock;
  
  if (actualYield && actualYield > 0) {
    // Use actual yield from purchase (e.g., 43 prawns from 1kg)
    qtyStock = actualYield;
    costPerStock = totalPrice / actualYield; // Cost per piece
    console.log(`Using actual yield: ${actualYield} pieces from ${qtyBuy} ${unit}`);
  } else {
    // Use standard conversion ratio
    const conversionRatio = ing.ratio > 0 ? (1 / ing.ratio) : 1;
    qtyStock = qtyBuy * conversionRatio;
    costPerStock = qtyStock > 0 ? (qtyBuy * unitPrice) / qtyStock : 0;
  }
  
  // Ensure the purchases sheet exists with proper headers
  const sh = _ensureSheetWithHeaders(SHEET_PUR, [
    'date', 'lot_id', 'ingredient_id', 'ingredient_name', 
    'qty_buy', 'unit', 'total_price', 'unit_price', 'qty_stock', 
    'cost_per_stock', 'remaining_stock', 'supplier_note'
  ]);
  
  sh.appendRow([
    d,                    // date
    lot_id,               // lot_id  
    ing.id,               // ingredient_id
    ing.name,             // ingredient_name
    qtyBuy,               // qty_buy
    unit || 'หน่วย',      // unit
    totalPrice,           // total_price
    unitPrice,            // unit_price
    qtyStock,             // qty_stock
    costPerStock,         // cost_per_stock
    qtyStock,             // remaining_stock
    supplierNote || ''    // supplier_note
  ]);
  
  // Clear cache since we modified data
  _clearSheetCache(SHEET_PUR);
  
  return {
    status: 'ok',
    lot_id: lot_id,
    qtyStock: qtyStock,
    costPerStock: costPerStock
  };
}

/** =========================
 * LOW STOCK HTML (for dashboard)
 * =========================*/

function getLowStockHTML() {
  try {
    // Get ingredient info with minimum stock levels
    const ingMap = _getIngredientMap();
    const stockMap = {};
    
    // Try to get stock from purchases sheet first
    try {
      const {rows, idx} = byHeader(SHEET_PUR);
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
    
    // Find low stock items using minimum stock from ingredients sheet
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

/** Refresh stock view (placeholder) */
function rebuildStockView() {
  return {status: 'ok'};
}

/** Suggest selling price (placeholder for pricing) */
function suggestSellingPrice({menu_id, platform, targetGrossPct}) {
  // This is a placeholder - you'll need to implement based on your BOM logic
  const baseRecipeCost = 15; // Mock recipe cost
  const gp = Number(targetGrossPct || 60) / 100;
  const platformGP = 0.3; // Mock platform GP
  
  const grossPrice = baseRecipeCost / (1 - gp);
  const netPrice = grossPrice / (1 - platformGP);
  
  return {
    recipeCost: baseRecipeCost,
    price: Math.ceil(netPrice)
  };
}

/** =========================
 * REPORTS & HISTORY & EXPORT
 * =========================*/


/** Entry สำหรับ Web App */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('POS ร้านกุ้งแซ่บ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * Parse date (sheet may store Date or string)
 * @param {*} v - Value to parse as date
 * @return {Date|null} Parsed date or null
 */
function _toDate(v) {
  if (v instanceof Date) return v;
  if (!v) return null;
  const t = new Date(v);
  return isNaN(t.getTime()) ? null : t;
}

/**
 * Check if date is in range [from, to]
 * @param {*} d - Date to check
 * @param {*} from - Start date
 * @param {*} to - End date
 * @return {boolean} True if in range
 */
function _inRange(d, from, to) {
  if (!d) return false;
  const dd = _toDate(d);
  if (!dd) return false;
  if (from && dd < _toDate(from)) return false;
  if (to && dd > _toDate(to)) return false;
  return true;
}

/**
 * Generate bucket key for grouping data
 * @param {*} d - Date
 * @param {string} granularity - 'day' or 'month'
 * @return {string} Bucket key
 */
function _getBucketKey(d, granularity) {
  const dt = _toDate(d) || new Date();
  if (granularity === 'month') {
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  }
  return dt.toISOString().slice(0, 10);
}

/**
 * Aggregate sales data by bucket
 * @param {Array} sRows - Sales rows
 * @param {Object} sIdx - Sales index
 * @param {string} granularity - Granularity
 * @param {*} from - Start date
 * @param {*} to - End date
 * @return {Object} Aggregated sales data
 */
function _aggregateSales(sRows, sIdx, granularity, from, to) {
  const group = {};
  
  const addToGroup = (k, f) => { 
    group[k] = group[k] || {gross: 0, net: 0, qty: 0, byPlat: {}, byMenu: {}, byPlatMenu: {}}; 
    f(group[k]); 
  };

  sRows.forEach(r => {
    const d = r[sIdx['วันที่']];
    if (!_inRange(d, from, to)) return;
    
    const k = _getBucketKey(d, granularity);
    const qty = _safeNumber(r[sIdx['จำนวน']]);
    const price = _safeNumber(r[sIdx['ราคาขายต่อหน่วย']]);
    const netUnit = _safeNumber(r[sIdx['สุทธิ(ต่อหน่วย)']]);
    const plat = String(r[sIdx['แพลตฟอร์ม']] || '');
    const mid = r[sIdx['menu_id']];

    addToGroup(k, g => {
      g.gross += price * qty;
      g.net += netUnit * qty;
      g.qty += qty;
      g.byPlat[plat] = (g.byPlat[plat] || 0) + (netUnit * qty);
      g.byMenu[mid] = (g.byMenu[mid] || 0) + (netUnit * qty);
      const bpm = g.byPlatMenu[plat] = g.byPlatMenu[plat] || {};
      bpm[mid] = (bpm[mid] || 0) + (netUnit * qty);
    });
  });

  return group;
}

/**
 * Aggregate COGS data by bucket
 * @param {Array} cRows - COGS rows
 * @param {Object} cIdx - COGS index
 * @param {string} granularity - Granularity
 * @param {*} from - Start date
 * @param {*} to - End date
 * @return {Object} Aggregated COGS data
 */
function _aggregateCOGS(cRows, cIdx, granularity, from, to) {
  const cogsGroup = {};
  
  const addToC = (k, f) => { 
    cogsGroup[k] = cogsGroup[k] || {cogs: 0, byMenu: {}}; 
    f(cogsGroup[k]); 
  };

  cRows.forEach(r => {
    const d = r[cIdx['วันที่']];
    if (!_inRange(d, from, to)) return;
    
    const k = _getBucketKey(d, granularity);
    const cost = _safeNumber(r[cIdx['ต้นทุนรวม']]);
    const mid = r[cIdx['menu_id']];
    
    addToC(k, cg => {
      cg.cogs += cost;
      cg.byMenu[mid] = (cg.byMenu[mid] || 0) + cost;
    });
  });

  return cogsGroup;
}

/**
 * Process report results for a single bucket
 * @param {string} k - Bucket key
 * @param {Object} g - Sales group data
 * @param {Object} cg - COGS group data
 * @param {Object} menuName - Menu name lookup
 * @return {Object} Processed bucket data
 */
function _processBucketResults(k, g, cg, menuName) {
  const gross = g.gross;
  const net = g.net;
  const cogs = cg.cogs;
  const profit = net - cogs;
  const gmPct = net > 0 ? (profit / net * 100) : 0;

  // Top menus by net contribution
  const byMenuArr = Object.entries(g.byMenu)
    .map(([mid, val]) => ({
      menu_id: mid,
      name: menuName[mid] || mid,
      net: val,
      cogs: (cg.byMenu[mid] || 0),
      profit: val - (cg.byMenu[mid] || 0)
    }))
    .sort((a, b) => b.net - a.net)
    .slice(0, 5);

  // Platform analysis
  const byPlatArr = Object.entries(g.byPlat).map(([plat, netVal]) => {
    const platMenu = g.byPlatMenu[plat] || {};
    let allocCogs = 0;
    
    Object.entries(platMenu).forEach(([mid, netOnPlat]) => {
      const totalMenuNet = g.byMenu[mid] || 0;
      const menuCogs = cg.byMenu[mid] || 0;
      if (totalMenuNet > 0 && menuCogs > 0) {
        allocCogs += menuCogs * (netOnPlat / totalMenuNet);
      }
    });
    
    const pProfit = netVal - allocCogs;
    return {
      platform: plat,
      net: netVal,
      cogs: allocCogs,
      profit: pProfit
    };
  });

  return {
    bucket: k,
    gross,
    net,
    cogs,
    profit,
    gmPct,
    qty: g.qty,
    byMenu: byMenuArr,
    byPlatform: byPlatArr
  };
}

/**
 * Generate comprehensive report with optimized performance
 * @param {Object} params - Report parameters
 * @param {*} params.from - Start date
 * @param {*} params.to - End date
 * @param {string} params.granularity - 'day' or 'month'
 * @return {Object} Report data
 */
function getReport({from, to, granularity}) {
  granularity = granularity || 'day';

  // Load data with caching
  const {rows: sRows, idx: sIdx} = byHeader(SHEET_SALE);
  const {rows: cRows, idx: cIdx} = byHeader(SHEET_COGS);
  const {rows: mRows, idx: mIdx} = byHeader(SHEET_MENU);

  // Build menu name lookup
  const menuName = {};
  mRows.forEach(r => { 
    menuName[r[mIdx['menu_id']]] = r[mIdx['เมนู']]; 
  });

  // Aggregate data using helper functions
  const group = _aggregateSales(sRows, sIdx, granularity, from, to);
  const cogsGroup = _aggregateCOGS(cRows, cIdx, granularity, from, to);

  // Build results using helper function
  const keys = Object.keys(group).sort();
  const rows = keys.map(k => {
    const g = group[k];
    const cg = cogsGroup[k] || {cogs: 0, byMenu: {}};
    return _processBucketResults(k, g, cg, menuName);
  });

  // Calculate totals
  const totals = rows.reduce((acc, r) => ({
    gross: acc.gross + r.gross,
    net: acc.net + r.net,
    cogs: acc.cogs + r.cogs,
    profit: acc.profit + r.profit,
    qty: acc.qty + r.qty
  }), {gross: 0, net: 0, cogs: 0, profit: 0, qty: 0});
  
  totals.gmPct = totals.net > 0 ? (totals.profit / totals.net * 100) : 0;

  return {granularity, from, to, totals, rows};
}

// History (sales & purchases) for table view / export
function getHistory({type, from, to, platform, menu_id, ingredient_id, limit, sortDesc}) {
  type = type || 'sales'; // 'sales' | 'purchases'
  limit = limit || 200;
  sortDesc = (sortDesc!==false);

  if (type === 'sales') {
    const {rows, idx} = byHeader(SHEET_SALE);
    let arr = rows.map(r=>({
      date: r[idx['date']],
      platform: r[idx['platform']],
      menu_id: r[idx['menu_id']],
      qty: Number(r[idx['qty']]||0),
      price_per_unit: Number(r[idx['price_per_unit']]||0),
      net_per_unit: Number(r[idx['net_per_unit']]||0),
      gross: Number(r[idx['price_per_unit']]||0) * Number(r[idx['qty']]||0),
      net:   Number(r[idx['net_per_unit']]||0) * Number(r[idx['qty']]||0),
    }));
    arr = arr.filter(x => _inRange(x.date, from, to));
    if (platform) arr = arr.filter(x=>String(x.platform)===String(platform));
    if (menu_id)  arr = arr.filter(x=>String(x.menu_id)===String(menu_id));
    arr.sort((a,b)=> (sortDesc? -1:1) * (new Date(a.date)-new Date(b.date)));
    return arr.slice(0, limit);
  }

  if (type === 'purchases') {
    const {rows, idx} = byHeader(SHEET_PUR);
    let arr = rows.map(r=>({
      date: r[idx['date']],
      lot_id: r[idx['lot_id']],
      ingredient_id: r[idx['ingredient_id']],
      ingredient: r[idx['ingredient_name']],
      qty_buy: Number(r[idx['qty_buy']]||0),
      unit: r[idx['unit']] || '',
      total_price: Number(r[idx['total_price']]||0),
      unit_price: Number(r[idx['unit_price']]||0),
      got_stock: Number(r[idx['qty_stock']]||0),
      cost_per_stock: Number(r[idx['cost_per_stock']]||0),
      remain_stock: Number(r[idx['remaining_stock']]||0),
      note: r[idx['supplier_note']]
    }));
    arr = arr.filter(x => _inRange(x.date, from, to));
    if (ingredient_id) arr = arr.filter(x=>String(x.ingredient_id)===String(ingredient_id));
    arr.sort((a,b)=> (sortDesc? -1:1) * (new Date(a.date)-new Date(b.date)));
    return arr.slice(0, limit);
  }

  throw new Error('Unknown history type');
}

// CSV export (returns a blob URL to download)
function exportCSV({type, from, to, platform, menu_id, ingredient_id}) {
  const records = getHistory({type, from, to, platform, menu_id, ingredient_id, limit: 5000, sortDesc:false});
  if (!records.length) return {url:null, filename:null};

  const headers = Object.keys(records[0]);
  const csv = [headers.join(',')].concat(
    records.map(r => headers.map(h => {
      const v = r[h];
      if (v == null) return '';
      const s = String(v).replace(/"/g,'""');
      return `"${s}"`;
    }).join(','))
  ).join('\n');

  const fileName = `${type}_${(from||'').toString().slice(0,10)}_${(to||'').toString().slice(0,10)}.csv`;
  const blob = Utilities.newBlob(csv, 'text/csv', fileName);
  const driveFile = DriveApp.createFile(blob); // requires Drive scope
  return {url: driveFile.getUrl(), filename: fileName};
}

/** =========================
 * USERS / ROLES / PERMISSIONS
 * =========================*/

// SHEET_USERS is already defined above

// map สิทธิ์ตามบทบาท
const ROLE_ALLOW = {
  OWNER  : ['VIEW','BUY','SELL','PRICE','REPORT','EXPORT','WASTE','LABOR','SETTINGS','WRITE'],
  PARTNER: ['VIEW','BUY','SELL','PRICE','REPORT','EXPORT','WASTE','LABOR','WRITE'],
  STAFF  : ['VIEW','BUY','SELL','PRICE','REPORT','WASTE','LABOR','WRITE'],
  VIEWER : ['VIEW','REPORT']
};

// ดึง user_key: ถ้าเป็น Workspace จะได้อีเมล, ถ้าไม่ได้ให้รับจาก client
function getCurrentUser(e) {
  const email = Session.getActiveUser().getEmail(); // หมายเหตุ: อาจว่างถ้าไม่ใช่ Workspace
  return { email: email || '' };
}

function _getRoleByUserKey(userKey) {
  const {rows, idx} = byHeader(SHEET_USERS);
  const row = rows.find(r => String(r[idx['user_key']]).trim() === String(userKey).trim()
                         && String(r[idx['active']]).toUpperCase()==='TRUE');
  const role = row ? String(row[idx['role']]).toUpperCase() : 'VIEWER';
  return ROLE_ALLOW[role] ? role : 'VIEWER';
}

// ตรวจสิทธิ์การทำงาน
function assertPermission(userKey, action) {
  try {
    const role = _getRoleByUserKey(userKey);
    const ok = (ROLE_ALLOW[role]||[]).includes(action);
    if (!ok) throw new Error(`ไม่มีสิทธิ์ทำรายการนี้ (${action})`);
    return {role};
  } catch (error) {
    // If Users sheet doesn't exist, create it and add default user
    if (error.message.includes('Sheet') && error.message.includes('not found')) {
      console.log('Users sheet not found, creating default setup...');
      _createDefaultUsersSheet(userKey);
      // Try again with default OWNER role
      const ok = (ROLE_ALLOW['OWNER']||[]).includes(action);
      if (!ok) throw new Error(`ไม่มีสิทธิ์ทำรายการนี้ (${action})`);
      return {role: 'OWNER'};
    }
    throw error;
  }
}

// Create default Users sheet with current user as OWNER
function _createDefaultUsersSheet(userKey) {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_USERS, [
      'user_key', 'role', 'name', 'active', 'created_at'
    ]);
    
    // Add current user as OWNER
    sh.appendRow([
      userKey,           // user_key
      'OWNER',           // role
      'Default Owner',   // name
      'TRUE',            // active
      nowStr()           // created_at
    ]);
    
    console.log('Created default Users sheet with user:', userKey);
  } catch (error) {
    console.error('Error creating Users sheet:', error);
    throw error;
  }
}

// Setup user account (for first-time users)
function setupUserAccount({userKey, name, role = 'OWNER'}) {
  try {
    // Ensure Users sheet exists
    const sh = _ensureSheetWithHeaders(SHEET_USERS, [
      'user_key', 'role', 'name', 'active', 'created_at'
    ]);
    
    // Check if user already exists
    const {rows, idx} = byHeader(SHEET_USERS);
    const existingUser = rows.find(r => String(r[idx['user_key']]).trim() === String(userKey).trim());
    
    if (existingUser) {
      // Update existing user to ensure they have proper permissions
      const rowNumber = rows.indexOf(existingUser) + 2; // +2 because rows array is 0-based and sheet has header
      sh.getRange(rowNumber, idx['role'] + 1).setValue(role.toUpperCase());
      sh.getRange(rowNumber, idx['active'] + 1).setValue('TRUE');
      sh.getRange(rowNumber, idx['name'] + 1).setValue(name || 'User');
      return {status: 'updated', message: 'อัปเดตสิทธิ์ผู้ใช้แล้ว'};
    }
    
    // Add new user
    sh.appendRow([
      userKey,           // user_key
      role.toUpperCase(), // role
      name || 'User',    // name
      'TRUE',            // active
      nowStr()           // created_at
    ]);
    
    return {status: 'created', message: 'สร้างบัญชีผู้ใช้สำเร็จ'};
  } catch (error) {
    console.error('Error setting up user account:', error);
    throw error;
  }
}

// Check user permissions and fix if needed
function checkUserPermissions({userKey}) {
  try {
    const {rows, idx} = byHeader(SHEET_USERS);
    const user = rows.find(r => String(r[idx['user_key']]).trim() === String(userKey).trim());
    
    if (!user) {
      return {status: 'not_found', message: 'ไม่พบผู้ใช้ในระบบ'};
    }
    
    const role = String(user[idx['role']]).toUpperCase();
    const active = String(user[idx['active']]).toUpperCase();
    const name = user[idx['name']];
    
    return {
      status: 'found',
      userKey: userKey,
      role: role,
      active: active,
      name: name,
      hasWritePermission: (ROLE_ALLOW[role]||[]).includes('WRITE')
    };
  } catch (error) {
    console.error('Error checking user permissions:', error);
    throw error;
  }
}

/** =========================
 * LABOR (ต้นทุนแรงงาน)
 * =========================*/
function addLaborLog({userKey, date, cost_center_id, hours, rate, note}) {
  assertPermission(userKey, 'LABOR');
  hours = Number(hours||0); rate = Number(rate||0);
  if (hours<=0) throw new Error('ชั่วโมงต้องมากกว่า 0');
  if (!rate) {
    // ถ้าไม่กรอก rate ใช้มาตรฐานจาก CostCenters
    const {rows, idx} = byHeader(SHEET_COST_CENTERS);
    const row = rows.find(r => String(r[idx['cost_center_id']])===String(cost_center_id));
    if (!row) throw new Error('ไม่พบ Cost Center');
    rate = Number(row[idx['standard_rate']]||0);
  }
  const amount = hours * rate;
  const {sh} = byHeader(SHEET_LABOR);
  sh.appendRow([date || nowStr().slice(0,10), cost_center_id, hours, rate, amount, userKey, note||'']);
  
  // Clear cache since we modified data
  _clearSheetCache(SHEET_LABOR);
  
  return {status:'ok', amount};
}

/** =========================
 * WASTE (ของเสีย/สูญเสีย) – ตัดสต๊อกด้วย FIFO
 * =========================*/
function addWaste({userKey, date, ingredient_id, qtyStock, note}) {
  assertPermission(userKey, 'WASTE');
  qtyStock = Number(qtyStock||0);
  if (qtyStock<=0) throw new Error('จำนวนต้องมากกว่า 0');

  let remain = qtyStock, totalCost = 0;
  const {lots, sh, idx} = _listLotsByIngredient(ingredient_id);
  const wasteSh = SpreadsheetApp.getActive().getSheetByName(SHEET_WASTE);
  for (let lot of lots) {
    if (remain<=0) break;
    const use = Math.min(lot.rem, remain);
    const cost = use * lot.costPer;
    totalCost += cost;

    // บันทึก Waste row
    wasteSh.appendRow([
      date || nowStr().slice(0,10),
      ingredient_id,
      _getIngredientMap()[ingredient_id]?.name || ingredient_id,
      use,
      lot.lot_id,
      lot.costPer,
      cost,
      note||''
    ]);

    // อัปเดตคงเหลือล็อต
    const rowNumber = lot.rowIdx + 2;
    const currentRem = sh.getRange(rowNumber, idx['remaining_stock']+1).getValue();
    sh.getRange(rowNumber, idx['remaining_stock']+1).setValue(Number(currentRem)-use);

    remain -= use;
  }
  if (remain>0) throw new Error(`สต๊อก ${ingredient_id} ไม่พอสำหรับบันทึกของเสีย (ขาด ${remain})`);
  
  // Clear cache since we modified data
  _clearSheetCache(SHEET_WASTE);
  _clearSheetCache(SHEET_PUR);
  
  return {status:'ok', waste_cost: totalCost};
}

/** =========================
 * MENU MANAGEMENT FUNCTIONS
 * =========================*/

// Add ingredient to menu (BOM)
function addMenuIngredient({userKey, menu_id, ingredient_id, qty, note}) {
  assertPermission(userKey, 'WRITE');
  
  if (!menu_id || !ingredient_id) throw new Error('menu_id และ ingredient_id จำเป็น');
  if (qty <= 0) throw new Error('จำนวนต้องมากกว่า 0');
  
  console.log('addMenuIngredient called with:', {userKey, menu_id, ingredient_id, qty, note});
  
  // Ensure menu ingredients sheet exists
  const sh = _ensureSheetWithHeaders(SHEET_MENU_RECIPES, [
    'menu_id', 'ingredient_id', 'ingredient_name', 'qty_per_serve', 'note', 'created_at', 'user_key'
  ]);
  
  console.log('Menu sheet ensured:', sh.getName());
  
  // Check if this combination already exists
  const {rows, idx} = byHeader(SHEET_MENU_RECIPES);
  console.log('Menu sheet rows:', rows.length, 'idx:', idx);
  
  const existing = rows.find(r => 
    r[idx['menu_id']] === menu_id && r[idx['ingredient_id']] === ingredient_id
  );
  
  // Get ingredient name for display
  console.log('Getting ingredient map...');
  const ingMap = _getIngredientMap();
  console.log('Ingredient map keys:', Object.keys(ingMap));
  const ingredient = ingMap[ingredient_id];
  const ingredientName = ingredient ? ingredient.name : ingredient_id;
  
  if (existing) {
    // Update existing entry
    const rowNumber = rows.indexOf(existing) + 2;
    sh.getRange(rowNumber, idx['qty_per_serve'] + 1).setValue(qty);
    sh.getRange(rowNumber, idx['note'] + 1).setValue(note || '');
    sh.getRange(rowNumber, idx['created_at'] + 1).setValue(nowStr());
    
    // Clear cache since we modified data
    _clearSheetCache(SHEET_MENU_RECIPES);
    
    return {status: 'updated', message: 'อัปเดตรายการแล้ว'};
  } else {
    // Add new entry
    const newRow = [menu_id, ingredient_id, ingredientName, qty, note || '', nowStr(), userKey];
    sh.appendRow(newRow);
    
    // Clear cache since we modified data
    _clearSheetCache(SHEET_MENU_RECIPES);
    
    return {status: 'added', message: 'เพิ่มรายการใหม่แล้ว'};
  }
}

// Get menu ingredients HTML
function getMenuIngredientsHTML({menu_id}) {
  try {
    const {rows, idx} = byHeader(SHEET_MENU_RECIPES);
    const menuIngredients = rows.filter(r => r[idx['menu_id']] === menu_id);
    
    if (menuIngredients.length === 0) {
      return '<div class="hint">ยังไม่มีวัตถุดิบในเมนูนี้</div>';
    }
    
    // Get ingredient names
    const ingMap = _getIngredientMap();
    
    const rows_html = menuIngredients.map(r => {
      const ingredient_id = r[idx['ingredient_id']];
      const qty = r[idx['qty_per_serve']];
      const note = r[idx['note']] || '';
      const ingredient = ingMap[ingredient_id];
      const name = ingredient ? ingredient.name : ingredient_id;
      
      return `<tr>
        <td>${name}</td>
        <td>${qty}</td>
        <td>${ingredient ? ingredient.stockU : 'หน่วย'}</td>
        <td>${note}</td>
      </tr>`;
    }).join('');
    
    return `<table>
      <thead>
        <tr><th>วัตถุดิบ</th><th>จำนวน</th><th>หน่วย</th><th>หมายเหตุ</th></tr>
      </thead>
      <tbody>${rows_html}</tbody>
    </table>`;
    
  } catch (error) {
    return `<div class="hint">ไม่สามารถโหลดข้อมูลได้: ${error.toString()}</div>`;
  }
}

// Calculate menu cost with detailed breakdown
function calculateMenuCost({menu_id, targetGP = 60}) {
  try {
    const {rows, idx} = byHeader(SHEET_MENU_RECIPES);
    const menuIngredients = rows.filter(r => r[idx['menu_id']] === menu_id);
    
    if (menuIngredients.length === 0) {
      throw new Error('ไม่พบวัตถุดิบในเมนูนี้');
    }
    
    // Get current ingredient costs (FIFO)
    const ingMap = _getIngredientMap();
    let totalCost = 0;
    const ingredients = [];
    const missingIngredients = [];
    const noCostData = [];
    
    for (const row of menuIngredients) {
      const ingredient_id = row[idx['ingredient_id']];
      const qtyPerServe = Number(row[idx['qty_per_serve']] || 0);
      const note = row[idx['note']] || '';
      
      const ingredient = ingMap[ingredient_id];
      if (!ingredient) {
        missingIngredients.push(ingredient_id);
        continue;
      }
      
      // Get current cost from lots
      const {lots} = _listLotsByIngredient(ingredient_id);
      if (lots.length === 0) {
        // No purchase data - use default cost of 0
        noCostData.push(ingredient.name);
        ingredients.push({
          name: ingredient.name,
          qtyPerServe: qtyPerServe,
          stockUnit: ingredient.stockU,
          buyUnit: ingredient.buyU || 'N/A',
          conversionRatio: ingredient.buyToStockRatio || 1,
          costPerStockUnit: 0,
          totalCost: 0,
          note: note + ' (ไม่มีข้อมูลราคา)',
          hasCostData: false
        });
        continue;
      }
      
      // Use FIFO cost (first lot) - this is cost per buy unit
      const costPerBuyUnit = lots[0].costPer;
      
      // Convert to cost per stock unit
      const conversionRatio = Number(ingredient.buyToStockRatio) || 1;
      const costPerStockUnit = costPerBuyUnit / conversionRatio;
      
      // Calculate total cost for this ingredient
      const ingredientCost = qtyPerServe * costPerStockUnit;
      
      totalCost += ingredientCost;
      ingredients.push({
        name: ingredient.name,
        qtyPerServe: qtyPerServe,
        stockUnit: ingredient.stockU,
        buyUnit: ingredient.buyU || 'N/A',
        conversionRatio: conversionRatio,
        costPerBuyUnit: costPerBuyUnit,
        costPerStockUnit: costPerStockUnit,
        totalCost: ingredientCost,
        note: note,
        hasCostData: true,
        lotInfo: {
          lotId: lots[0].lot_id,
          buyQty: lots[0].qtyBuy,
          buyUnit: lots[0].unit,
          totalBuyPrice: lots[0].totalPrice,
          actualYield: lots[0].actualYield || null
        }
      });
    }
    
    // Calculate suggested price
    const suggestedPrice = totalCost / (1 - targetGP/100);
    
    return {
      totalCost: totalCost,
      ingredients: ingredients,
      suggestedPrice: suggestedPrice,
      targetGP: targetGP,
      missingIngredients: missingIngredients,
      noCostData: noCostData,
      hasMissingIngredients: missingIngredients.length > 0,
      hasNoPurchaseData: noCostData.length > 0,
      ingredientCount: ingredients.length,
      costBreakdown: {
        withCostData: ingredients.filter(ing => ing.hasCostData).length,
        withoutCostData: ingredients.filter(ing => !ing.hasCostData).length
      }
    };
    
  } catch (error) {
    throw new Error(`ไม่สามารถคำนวณต้นทุนได้: ${error.toString()}`);
  }
}

// Verify menu ingredient data was saved correctly
function verifyMenuIngredientData({menu_id, ingredient_id, qty}) {
  try {
    const {rows, idx} = byHeader(SHEET_MENU_RECIPES);
    
    // Look for the specific combination
    const found = rows.find(r => 
      r[idx['menu_id']] === menu_id && 
      r[idx['ingredient_id']] === ingredient_id &&
      Number(r[idx['qty_per_serve']]) === Number(qty)
    );
    
    if (found) {
      return {
        success: true,
        message: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว',
        data: {
          menu_id: found[idx['menu_id']],
          ingredient_id: found[idx['ingredient_id']],
          ingredient_name: found[idx['ingredient_name']],
          qty_per_serve: found[idx['qty_per_serve']],
          note: found[idx['note']],
          created_at: found[idx['created_at']]
        }
      };
    } else {
      return {
        success: false,
        message: 'ไม่พบข้อมูลที่บันทึก',
        searchedFor: { menu_id, ingredient_id, qty }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการตรวจสอบ: ${error.toString()}`
    };
  }
}

// Verify purchase data was saved correctly
function verifyPurchaseData({lot_id, ingredient_id, qtyBuy, unit, totalPrice}) {
  try {
    const {rows, idx} = byHeader(SHEET_PUR);
    
    // Look for the specific lot
    const found = rows.find(r => 
      r[idx['lot_id']] === lot_id && 
      r[idx['ingredient_id']] === ingredient_id
    );
    
    if (found) {
      return {
        success: true,
        message: 'ข้อมูลการซื้อถูกบันทึกเรียบร้อยแล้ว',
        data: {
          lot_id: found[idx['lot_id']],
          ingredient_id: found[idx['ingredient_id']],
          ingredient_name: found[idx['ingredient_name']],
          qty_buy: found[idx['qty_buy']],
          unit: found[idx['unit']],
          total_price: found[idx['total_price']],
          unit_price: found[idx['unit_price']],
          date: found[idx['date']]
        }
      };
    } else {
      return {
        success: false,
        message: 'ไม่พบข้อมูลการซื้อที่บันทึก',
        searchedFor: { lot_id, ingredient_id, qtyBuy, unit, totalPrice }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการตรวจสอบ: ${error.toString()}`
    };
  }
}

// ====== EXPENSE MANAGEMENT ======

// Add expense to the system
function addExpense({userKey, date, category, amount, description, note}) {
  assertPermission(userKey, 'WRITE');
  
  if (!category) throw new Error('กรุณาเลือกประเภทค่าใช้จ่าย');
  if (amount <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0');
  if (!description) throw new Error('กรุณาใส่รายละเอียด');
  
  console.log('addExpense called with:', {userKey, date, category, amount, description, note});
  
  // Ensure expenses sheet exists
  const sh = _ensureSheetWithHeaders(SHEET_EXPENSES, [
    'expense_id', 'date', 'category', 'amount', 'description', 'note', 'created_at', 'user_key'
  ]);
  
  console.log('Expenses sheet ensured:', sh.getName());
  
  // Generate unique expense ID
  const expense_id = _genId('EXP');
  
  // Add new expense entry
  const newRow = [expense_id, date || nowStr().slice(0,10), category, amount, description, note || '', nowStr(), userKey];
  sh.appendRow(newRow);
  
  // Clear cache since we modified data
  _clearSheetCache(SHEET_EXPENSES);
  
  return {status: 'added', expense_id: expense_id, message: 'เพิ่มค่าใช้จ่ายใหม่แล้ว'};
}

// Verify expense data was saved correctly
function verifyExpenseData({expense_id, category, amount, date}) {
  try {
    const {rows, idx} = byHeader(SHEET_EXPENSES);
    
    // Look for the specific expense
    const found = rows.find(r => 
      r[idx['expense_id']] === expense_id && 
      r[idx['category']] === category &&
      Number(r[idx['amount']]) === Number(amount)
    );
    
    if (found) {
      return {
        success: true,
        message: 'ข้อมูลค่าใช้จ่ายถูกบันทึกเรียบร้อยแล้ว',
        data: {
          expense_id: found[idx['expense_id']],
          date: found[idx['date']],
          category: found[idx['category']],
          amount: found[idx['amount']],
          description: found[idx['description']],
          note: found[idx['note']],
          created_at: found[idx['created_at']]
        }
      };
    } else {
      return {
        success: false,
        message: 'ไม่พบข้อมูลค่าใช้จ่ายที่บันทึก',
        searchedFor: { expense_id, category, amount, date }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการตรวจสอบ: ${error.toString()}`
    };
  }
}

// Get expense summary by category
function getExpenseSummary() {
  try {
    const {rows, idx} = byHeader(SHEET_EXPENSES);
    
    if (rows.length === 0) {
      return [];
    }
    
    // Group by category
    const categoryTotals = {};
    const categoryCounts = {};
    
    rows.forEach(row => {
      const category = row[idx['category']];
      const amount = Number(row[idx['amount']] || 0);
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
        categoryCounts[category] = 0;
      }
      
      categoryTotals[category] += amount;
      categoryCounts[category] += 1;
    });
    
    // Convert to array and sort by amount
    const summary = Object.keys(categoryTotals).map(category => ({
      category: category,
      category_name: getCategoryDisplayName(category),
      amount: categoryTotals[category],
      count: categoryCounts[category]
    })).sort((a, b) => b.amount - a.amount);
    
    return summary;
  } catch (error) {
    throw new Error(`ไม่สามารถโหลดสรุปค่าใช้จ่ายได้: ${error.toString()}`);
  }
}

// Get detailed expense breakdown
function getExpenseBreakdown() {
  try {
    const {rows, idx} = byHeader(SHEET_EXPENSES);
    
    if (rows.length === 0) {
      return {
        totalAmount: 0,
        totalCount: 0,
        dateRange: 'ไม่มีข้อมูล',
        expenses: []
      };
    }
    
    // Calculate totals
    let totalAmount = 0;
    const expenses = [];
    
    rows.forEach(row => {
      const amount = Number(row[idx['amount']] || 0);
      totalAmount += amount;
      
      expenses.push({
        expense_id: row[idx['expense_id']],
        date: row[idx['date']],
        category: row[idx['category']],
        amount: amount,
        description: row[idx['description']],
        note: row[idx['note']],
        created_at: row[idx['created_at']]
      });
    });
    
    // Sort by date (newest first)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get date range
    const dates = expenses.map(e => e.date).filter(d => d);
    const dateRange = dates.length > 0 ? 
      `${dates[dates.length - 1]} ถึง ${dates[0]}` : 
      'ไม่มีข้อมูล';
    
    return {
      totalAmount: totalAmount,
      totalCount: expenses.length,
      dateRange: dateRange,
      expenses: expenses
    };
  } catch (error) {
    throw new Error(`ไม่สามารถโหลดรายละเอียดค่าใช้จ่ายได้: ${error.toString()}`);
  }
}

// Get expense report for export
function getExpenseReport() {
  try {
    const {rows, idx} = byHeader(SHEET_EXPENSES);
    
    if (rows.length === 0) {
      return [];
    }
    
    // Convert to export format
    const expenses = rows.map(row => ({
      date: row[idx['date']],
      category: row[idx['category']],
      description: row[idx['description']],
      amount: Number(row[idx['amount']] || 0),
      note: row[idx['note']],
      created_at: row[idx['created_at']]
    }));
    
    // Sort by date (newest first)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return expenses;
  } catch (error) {
    throw new Error(`ไม่สามารถโหลดรายงานค่าใช้จ่ายได้: ${error.toString()}`);
  }
}

// Helper function to get category display name
function getCategoryDisplayName(category) {
  const names = {
    'electricity': 'ค่าไฟ',
    'rent': 'ค่าเช่า',
    'equipment': 'อุปกรณ์ครัว',
    'containers': 'ภาชนะบรรจุ',
    'utilities': 'สาธารณูปโภค',
    'maintenance': 'ซ่อมบำรุง',
    'insurance': 'ประกันภัย',
    'marketing': 'การตลาด',
    'other': 'อื่นๆ'
  };
  return names[category] || category;
}

// Calculate total business expenses for a given period
function calculateTotalExpenses({fromDate, toDate}) {
  try {
    const {rows, idx} = byHeader(SHEET_EXPENSES);
    
    if (rows.length === 0) {
      return {
        totalAmount: 0,
        categoryBreakdown: {},
        expenseCount: 0
      };
    }
    
    let totalAmount = 0;
    const categoryBreakdown = {};
    let expenseCount = 0;
    
    // Filter by date range if provided
    const filteredRows = rows.filter(row => {
      if (!fromDate && !toDate) return true;
      
      const rowDate = row[idx['date']];
      if (!rowDate) return false;
      
      if (fromDate && rowDate < fromDate) return false;
      if (toDate && rowDate > toDate) return false;
      
      return true;
    });
    
    filteredRows.forEach(row => {
      const amount = Number(row[idx['amount']] || 0);
      const category = row[idx['category']];
      
      totalAmount += amount;
      expenseCount += 1;
      
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = 0;
      }
      categoryBreakdown[category] += amount;
    });
    
    return {
      totalAmount: totalAmount,
      categoryBreakdown: categoryBreakdown,
      expenseCount: expenseCount,
      period: fromDate && toDate ? `${fromDate} ถึง ${toDate}` : 'ทั้งหมด'
    };
  } catch (error) {
    throw new Error(`ไม่สามารถคำนวณค่าใช้จ่ายได้: ${error.toString()}`);
  }
}

// Enhanced menu cost calculation with overhead expenses
function calculateMenuCostWithOverhead({menu_id, targetGP = 60, includeOverhead = true, overheadPeriod = 30}) {
  try {
    // Get basic menu cost
    const menuCost = calculateMenuCost({menu_id, targetGP});
    
    if (!includeOverhead) {
      return menuCost;
    }
    
    // Calculate overhead expenses for the specified period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - overheadPeriod);
    
    const expenseData = calculateTotalExpenses({
      fromDate: startDate.toISOString().slice(0, 10),
      toDate: endDate.toISOString().slice(0, 10)
    });
    
    // Calculate overhead per serve (assuming average daily serves)
    // This is a simplified calculation - you might want to make it more sophisticated
    const estimatedDailyServes = 50; // This could be calculated from actual sales data
    const overheadPerServe = expenseData.totalAmount / (overheadPeriod * estimatedDailyServes);
    
    // Add overhead to total cost
    const totalCostWithOverhead = menuCost.totalCost + overheadPerServe;
    const suggestedPriceWithOverhead = totalCostWithOverhead / (1 - targetGP/100);
    
    return {
      ...menuCost,
      overheadData: {
        totalExpenses: expenseData.totalAmount,
        period: expenseData.period,
        overheadPerServe: overheadPerServe,
        estimatedDailyServes: estimatedDailyServes
      },
      totalCostWithOverhead: totalCostWithOverhead,
      suggestedPriceWithOverhead: suggestedPriceWithOverhead,
      costBreakdown: {
        ...menuCost.costBreakdown,
        overheadIncluded: true,
        overheadPercentage: menuCost.totalCost > 0 ? (overheadPerServe / menuCost.totalCost * 100).toFixed(1) : 0
      }
    };
  } catch (error) {
    throw new Error(`ไม่สามารถคำนวณต้นทุนรวมได้: ${error.toString()}`);
  }
}

// Add missing ingredients to Ingredients sheet
function addMissingIngredients({ingredientNames}) {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_ING, [
      'id', 'name', 'stock_unit', 'buy_unit', 'buy_to_stock_ratio', 'min_stock'
    ]);
    
    const {rows, idx} = byHeader(SHEET_ING);
    const existingNames = rows.map(r => String(r[idx['name']]).toLowerCase());
    
    let added = 0;
    for (const name of ingredientNames) {
      if (!existingNames.includes(name.toLowerCase())) {
        const id = _genId('ING');
        // Smart unit detection based on ingredient name
        let stockUnit = 'หน่วย';
        let buyUnit = 'หน่วย';
        let ratio = 1;
        
        // Common ingredient unit mappings
        if (name.includes('กุ้ง') || name.includes('เนื้อ') || name.includes('ปลา') || name.includes('หมู') || name.includes('ไก่')) {
          stockUnit = 'กรัม';
          buyUnit = 'กก.';
          ratio = 1000; // 1 kg = 1000 grams
        } else if (name.includes('น้ำ') || name.includes('ซอส') || name.includes('น้ำมัน')) {
          stockUnit = 'มล.';
          buyUnit = 'ลิตร';
          ratio = 1000; // 1 liter = 1000 ml
        } else if (name.includes('มะนาว') || name.includes('หอม') || name.includes('กระเทียม')) {
          stockUnit = 'ลูก';
          buyUnit = 'กก.';
          ratio = 10; // Approximate: 1 kg ≈ 10 pieces
        } else if (name.includes('ผัก') || name.includes('กะหล่ำ') || name.includes('ผักกาด')) {
          stockUnit = 'กรัม';
          buyUnit = 'กก.';
          ratio = 1000; // 1 kg = 1000 grams
        }
        
        sh.appendRow([
          id,           // id
          name,         // name
          stockUnit,    // stock_unit
          buyUnit,      // buy_unit
          ratio,        // buy_to_stock_ratio
          5             // min_stock
        ]);
        added++;
      }
    }
    
    return {
      status: 'success',
      added: added,
      message: `เพิ่มวัตถุดิบ ${added} รายการ`
    };
  } catch (error) {
    console.error('Error adding missing ingredients:', error);
    throw error;
  }
}

// Configure ingredient units properly
function configureIngredientUnits({ingredient_id, stock_unit, buy_unit, buy_to_stock_ratio}) {
  try {
    const sh = _ensureSheetWithHeaders(SHEET_ING, [
      'id', 'name', 'stock_unit', 'buy_unit', 'buy_to_stock_ratio', 'min_stock'
    ]);
    
    const {rows, idx} = byHeader(SHEET_ING);
    const rowIndex = rows.findIndex(r => r[idx['id']] === ingredient_id);
    
    if (rowIndex === -1) {
      throw new Error(`Ingredient ${ingredient_id} not found`);
    }
    
    const rowNumber = rowIndex + 2; // +2 because rows array is 0-based and sheet has header
    
    // Update the specific cells
    sh.getRange(rowNumber, idx['stock_unit'] + 1).setValue(stock_unit);
    sh.getRange(rowNumber, idx['buy_unit'] + 1).setValue(buy_unit);
    sh.getRange(rowNumber, idx['buy_to_stock_ratio'] + 1).setValue(buy_to_stock_ratio);
    
    return {
      status: 'success',
      message: `Updated units for ingredient ${ingredient_id}`,
      stock_unit: stock_unit,
      buy_unit: buy_unit,
      ratio: buy_to_stock_ratio
    };
  } catch (error) {
    console.error('Error configuring ingredient units:', error);
    throw error;
  }
}

// Get ingredient unit configuration
function getIngredientUnits({ingredient_id}) {
  try {
    const {rows, idx} = byHeader(SHEET_ING);
    const ingredient = rows.find(r => r[idx['id']] === ingredient_id);
    
    if (!ingredient) {
      throw new Error(`Ingredient ${ingredient_id} not found`);
    }
    
    return {
      id: ingredient[idx['id']],
      name: ingredient[idx['name']],
      stock_unit: ingredient[idx['stock_unit']],
      buy_unit: ingredient[idx['buy_unit']],
      buy_to_stock_ratio: Number(ingredient[idx['buy_to_stock_ratio']] || 1),
      min_stock: Number(ingredient[idx['min_stock']] || 5)
    };
  } catch (error) {
    console.error('Error getting ingredient units:', error);
    throw error;
  }
}

/** =========================
 * รายงาน: รวม Waste & Labor
 * =========================*/
function getReportPlus({userKey, from, to, granularity}) {
  assertPermission(userKey, 'REPORT');
  const base = getReport({from, to, granularity}); // ของเดิม: net/cogs/profit
  // รวมค่า Waste (ช่วงเดียวกัน)
  const {rows: wRows, idx: wIdx} = byHeader(SHEET_WASTE);
  const {rows: lRows, idx: lIdx} = byHeader(SHEET_LABOR);
  // Batch cost lines (สำหรับแพ็กกิ้ง)
  const blSheet = _ensureSheetWithHeaders(SHEET_BATCH_COST_LINES, ['date','batch_id','type','item_id','qty','lot_id','cost_per_unit','total_cost','user_key','note']);
  const blLast = blSheet.getLastRow();
  const blRows = blLast>1 ? blSheet.getRange(2,1,blLast-1,10).getValues() : [];

  // สร้าง bucket key เหมือน getReport
  const bucketKey = (d) => {
    const dt = _toDate(d) || new Date();
    if ((granularity||'day')==='month') return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
    return dt.toISOString().slice(0,10);
  };

  const wMap = {}; // key -> waste_cost
  wRows.forEach(r=>{
    const d=r[wIdx['วันที่']]; if(!_inRange(d, from, to)) return;
    const k = bucketKey(d);
    wMap[k] = (wMap[k]||0) + Number(r[wIdx['มูลค่าเสียหาย']]||0);
  });

  const lMap = {}; // key -> labor_cost
  lRows.forEach(r=>{
    const d=r[lIdx['วันที่']]; if(!_inRange(d, from, to)) return;
    const k = bucketKey(d);
    lMap[k] = (lMap[k]||0) + Number(r[lIdx['รวม(บาท)']]||0);
  });

  // Packaging cost by bucket (จาก BatchCostLines type=PACK)
  const pMap = {}; // key -> pack_cost
  blRows.forEach(r=>{
    const d = r[0]; // date
    const type = String(r[2]||'');
    if (type!=='PACK') return;
    if(!_inRange(d, from, to)) return;
    const k = bucketKey(d);
    const cost = Number(r[7]||0); // total_cost
    pMap[k] = (pMap[k]||0) + cost;
  });

  // ผนวกเข้าแต่ละช่วง
  base.rows = base.rows.map(r=>{
    const waste = wMap[r.bucket]||0;
    const labor = lMap[r.bucket]||0;
    const pack  = pMap[r.bucket]||0;
    const profit_after_labor = (r.profit - labor - waste);
    const profit_after_full  = (r.profit - labor - waste - pack);
    return {...r, waste, labor, pack, profit_after_labor, profit_after_full};
  });

  // รวมยอด
  const totals = base.rows.reduce((a,r)=>(
    {
    net: a.net + r.net,
    cogs:a.cogs+ r.cogs,
    profit: a.profit + r.profit,
    waste: a.waste + r.waste,
    labor: a.labor + r.labor,
      pack: a.pack + (r.pack||0),
      profit_after_labor: a.profit_after_labor + (r.profit_after_labor||0),
      profit_after_full: a.profit_after_full + (r.profit_after_full||0)
    }
  ), {net:0,cogs:0,profit:0,waste:0,labor:0,pack:0,profit_after_labor:0,profit_after_full:0});
  base.totalsPlus = totals;

  return base;
}

// ===== PACKAGING STOCK VIEW =====
function getPackagingStockHTML({asOf}={}){
  const sh = _ensureSheetWithHeaders(SHEET_PACKING, ['date','lot_id','pkg_id','qty_buy','cost_per_unit','remain_units','note']);
  const last = sh.getLastRow();
  const rows = last>1 ? sh.getRange(2,1,last-1,7).getValues() : [];
  const map = {};
  rows.forEach(r=>{
    const date = r[0];
    if (asOf && !_inRange(date, null, asOf)) return;
    const pkg = String(r[2]||'');
    const rem = Number(r[5]||0);
    if (!pkg) return;
    map[pkg] = (map[pkg]||0) + rem;
  });
  const keys = Object.keys(map).sort();
  const body = keys.map(k=>`<tr><td>${k}</td><td style="text-align:right">${map[k]}</td></tr>`).join('');
  const html = `<table><thead><tr><th>แพ็กกิ้ง</th><th>คงเหลือ(ชิ้น)</th></tr></thead><tbody>${body||'<tr><td colspan="2">ไม่มีข้อมูล</td></tr>'}</tbody></table>`;
  return html;
}

// CSV export for ReportPlus
function exportReportPlusCSV({userKey, from, to, granularity}){
  const rep = getReportPlus({userKey, from, to, granularity});
  const headers = ['bucket','gross','net','cogs','waste','labor','pack','profit','gmPct','profit_after_labor','profit_after_full','qty'];
  const rows = rep.rows.map(r=>({
    bucket: r.bucket,
    gross: r.gross||0,
    net: r.net||0,
    cogs: r.cogs||0,
    waste: r.waste||0,
    labor: r.labor||0,
    pack: r.pack||0,
    profit: r.profit||0,
    gmPct: r.gmPct||0,
    profit_after_labor: r.profit_after_labor||0,
    profit_after_full: r.profit_after_full||0,
    qty: r.qty||0
  }));
  const csv = [headers.join(',')].concat(
    rows.map(r => headers.map(h => {
      const v = r[h];
      if (v == null) return '';
      const s = String(v).replace(/"/g,'""');
      return `"${s}"`;
    }).join(','))
  ).join('\n');

  const fileName = `report_plus_${(from||'').toString().slice(0,10)}_${(to||'').toString().slice(0,10)}.csv`;
  const blob = Utilities.newBlob(csv, 'text/csv', fileName);
  const driveFile = DriveApp.createFile(blob);
  return {url: driveFile.getUrl(), filename: fileName};
}

function exportReportPlatformCSV({userKey, from, to, granularity}){
  const rep = getReport({from, to, granularity});
  // Ensure platform profit fields are present by reusing logic from getReport (already added byPlat with net and cogs/profit via modifications)
  // If not present, recompute allocation similar to getReport implementation
  const headers = ['bucket','platform','net','cogs_alloc','profit'];
  const rows = [];
  rep.rows.forEach(r=>{
    (r.byPlatform||[]).forEach(p=>{
      const rec = {
        bucket: r.bucket,
        platform: p.platform,
        net: Number(p.net||0),
        cogs_alloc: Number(p.cogs||0),
        profit: Number(p.profit|| (Number(p.net||0)-Number(p.cogs||0)))
      };
      rows.push(rec);
    });
  });
  if (!rows.length) return {url:null, filename:null};
  const csv = [headers.join(',')].concat(
    rows.map(r => headers.map(h => {
      const v = r[h];
      if (v == null) return '';
      const s = String(v).replace(/"/g,'""');
      return `"${s}"`;
    }).join(','))
  ).join('\n');
  const fileName = `report_platform_${(from||'').toString().slice(0,10)}_${(to||'').toString().slice(0,10)}.csv`;
  const blob = Utilities.newBlob(csv, 'text/csv', fileName);
  const driveFile = DriveApp.createFile(blob);
  return {url: driveFile.getUrl(), filename: fileName};
}




/** =========================
 * MARKET RUNS / PACKAGING / BATCH COSTING (MVP)
 * =========================*/

// 1) Start a market run
function startMarketRun({userKey, date, buyer, note}){
  assertPermission(userKey, 'BUY');
  const run_id = _genId('RUN');
  const sh = _ensureSheetWithHeaders(SHEET_MARKET_RUNS, ['run_id','date','buyer','note','created_at']);
  const created_at = new Date();
  sh.appendRow([run_id, date||nowStr().slice(0,10), buyer||'', note||'', created_at]);
  return {run_id};
}

// 2) Add an item to market run (proxy to existing addPurchase and record link)
function addMarketRunItem({userKey, run_id, date, ingredient_id, qtyBuy, unitPrice, note}){
  assertPermission(userKey, 'BUY');
  if (!run_id) throw new Error('run_id is required');
  if (!ingredient_id) throw new Error('ingredient_id is required');
  qtyBuy = Number(qtyBuy||0); unitPrice = Number(unitPrice||0);
  if (qtyBuy<=0 || unitPrice<=0) throw new Error('จำนวน/ราคาต้องมากกว่า 0');

  // Call existing purchase logic to create lot and handle conversions
  const res = addPurchase({
    date: date || nowStr().slice(0,10),
    ingredient_id,
    qtyBuy,
    unitPrice,
    supplierNote: `[RUN:${run_id}] ${note||''}`.trim()
  });

  const sh = _ensureSheetWithHeaders(SHEET_MARKET_ITEMS, ['run_id','date','ingredient_id','qty_buy','unit_price','note','lot_id']);
  sh.appendRow([run_id, date||nowStr().slice(0,10), ingredient_id, qtyBuy, unitPrice, note||'', (res&&res.lot_id)||'']);
  return {status:'ok', lot_id: (res&&res.lot_id)||null};
}

// 3) Packaging purchases (simple log)
function addPackagingPurchase({userKey, date, pkg_id, qtyBuy, unitPrice, note}){
  assertPermission(userKey, 'BUY');
  const shLog  = _ensureSheetWithHeaders(SHEET_PACKING_PURCHASES,  ['date','pkg_id','qty_buy','unit_price','note']);
  const shLots = _ensureSheetWithHeaders(SHEET_PACKING, ['date','lot_id','pkg_id','qty_buy','cost_per_unit','remain_units','note']);
  qtyBuy = Number(qtyBuy||0); unitPrice = Number(unitPrice||0);
  if (qtyBuy<=0 || unitPrice<=0) throw new Error('จำนวน/ราคาต้องมากกว่า 0');
  const d = date||nowStr().slice(0,10);
  const lot_id = _genId('PKG');
  // log
  shLog.appendRow([d, pkg_id, qtyBuy, unitPrice, note||'']);
  // create lot
  shLots.appendRow([d, lot_id, pkg_id, qtyBuy, unitPrice, qtyBuy, note||'']);
  return {status:'ok', lot_id};
}

function _listPackLotsByPkg(pkg_id){
  const sh = _ensureSheetWithHeaders(SHEET_PACKING, ['date','lot_id','pkg_id','qty_buy','cost_per_unit','remain_units','note']);
  const last = sh.getLastRow();
  const rows = last>1 ? sh.getRange(2,1,last-1,7).getValues() : [];
  const lots = [];
  for (let i=0;i<rows.length;i++){
    const [date, lot_id, pid, qty, cost, rem, note] = rows[i];
    if (String(pid)===String(pkg_id) && Number(rem)>0){
      lots.push({rowIdx:i, date:new Date(date), lot_id:String(lot_id), costPer:Number(cost||0), rem:Number(rem||0)});
    }
  }
  lots.sort((a,b)=> a.date - b.date);
  return {lots, sh};
}

function addBatchUsePackaging({userKey, batch_id, pkg_id, qtyUnits, note}){
  assertPermission(userKey, 'SELL');
  qtyUnits = Number(qtyUnits||0);
  if (!batch_id) throw new Error('batch_id is required');
  if (!pkg_id) throw new Error('pkg_id is required');
  if (qtyUnits<=0) throw new Error('จำนวนต้องมากกว่า 0');

  let remain = qtyUnits, totalCost = 0;
  const {lots, sh} = _listPackLotsByPkg(pkg_id);
  const bl = _ensureSheetWithHeaders(SHEET_BATCH_COST_LINES, ['date','batch_id','type','item_id','qty','lot_id','cost_per_unit','total_cost','user_key','note']);
  for (let lot of lots){
    if (remain<=0) break;
    const use = Math.min(lot.rem, remain);
    const cost = use * lot.costPer; totalCost += cost;

    // log line
    bl.appendRow([nowStr().slice(0,10), batch_id, 'PACK', pkg_id, use, lot.lot_id, lot.costPer, cost, userKey, note||'']);

    // update remain
    const rowNumber = lot.rowIdx + 2; // offset for header
    const remCol = 6; // remain_units column index in sheet (1-based)
    const cur = sh.getRange(rowNumber, remCol).getValue();
    sh.getRange(rowNumber, remCol).setValue(Number(cur)-use);

    remain -= use;
  }
  if (remain>0) throw new Error(`สต๊อกแพ็กกิ้ง ${pkg_id} ไม่พอ (ขาด ${remain})`);
  return {status:'ok', pack_cost: totalCost};
}

// 4) Overheads config (key-value)
function getOverheadsConfig(){
  const sh = _ensureSheetWithHeaders(SHEET_OVERHEADS, ['key','value']);
  const last = sh.getLastRow();
  const rows = last>1 ? sh.getRange(2,1,last-1,2).getValues() : [];
  const map = {};
  rows.forEach(([k,v])=>{ if(k) map[String(k)] = Number(v)||0; });
  return {
    pack_per_serve: map['PACK_PER_SERVE']||0,
    oh_per_hour:    map['OH_PER_HOUR']||0,
    oh_per_kg:      map['OH_PER_KG']||0
  };
}

function setOverheadsConfig({userKey, pack_per_serve, oh_per_hour, oh_per_kg}){
  assertPermission(userKey, 'SETTINGS');
  const sh = _ensureSheetWithHeaders(SHEET_OVERHEADS, ['key','value']);
  const kv = {
    PACK_PER_SERVE: Number(pack_per_serve||0),
    OH_PER_HOUR: Number(oh_per_hour||0),
    OH_PER_KG: Number(oh_per_kg||0)
  };
  const data = [['PACK_PER_SERVE', kv.PACK_PER_SERVE], ['OH_PER_HOUR', kv.OH_PER_HOUR], ['OH_PER_KG', kv.OH_PER_KG]];
  // overwrite completely for simplicity
  sh.clearContents();
  sh.getRange(1,1,1,2).setValues([['key','value']]);
  sh.getRange(2,1,data.length,2).setValues(data);
  return {status:'ok'};
}

// 5) Batches (create + finalize)
function addBatch({userKey, date, menu_id, plan_qty, note, run_id}){
  assertPermission(userKey, 'SELL');
  const batch_id = _genId('BAT');
  const sh = _ensureSheetWithHeaders(SHEET_BATCHES, [
    'batch_id','date','menu_id','plan_qty','note','run_id','status','actual_qty','weightKg','hours','recipe_cost_per_serve','pack_per_serve','oh_hour_rate','oh_kg_rate','cost_per_serve','total_cost'
  ]);
  sh.appendRow([batch_id, date||nowStr().slice(0,10), menu_id, Number(plan_qty||0), note||'', run_id||'', 'OPEN','','','','','','','','']);
  return {batch_id};
}

function finalizeBatch({userKey, batch_id, actual_qty, weightKg, hours, recipe_cost_per_serve, pack_per_serve, oh_per_hour, oh_per_kg}){
  assertPermission(userKey, 'SELL');
  if (!batch_id) throw new Error('batch_id is required');
  actual_qty = Number(actual_qty||0);
  weightKg   = Number(weightKg||0);
  hours      = Number(hours||0);
  recipe_cost_per_serve = Number(recipe_cost_per_serve||0);
  pack_per_serve        = Number(pack_per_serve||0);
  oh_per_hour           = Number(oh_per_hour||0);
  oh_per_kg             = Number(oh_per_kg||0);

  const sh = _ensureSheetWithHeaders(SHEET_BATCHES, [
    'batch_id','date','menu_id','plan_qty','note','run_id','status','actual_qty','weightKg','hours','recipe_cost_per_serve','pack_per_serve','oh_hour_rate','oh_kg_rate','cost_per_serve','total_cost'
  ]);
  const last = sh.getLastRow();
  if (last<2) throw new Error('No batches');
  const data = sh.getRange(2,1,last-1,16).getValues();
  let rowIdx = -1; let plan_qty = 0;
  for (let i=0;i<data.length;i++){
    if (String(data[i][0])===String(batch_id)) { rowIdx = i+2; plan_qty = Number(data[i][3]||0); break; }
  }
  if (rowIdx<0) throw new Error('batch not found');
  const serves = actual_qty || plan_qty || 1;
  const oh_per_serve_from_hour = serves>0 ? (oh_per_hour*hours/serves) : 0;
  const oh_per_serve_from_kg   = serves>0 ? (oh_per_kg*weightKg/serves) : 0;
  const cost_per_serve = recipe_cost_per_serve + pack_per_serve + oh_per_serve_from_hour + oh_per_serve_from_kg;
  const total_cost = cost_per_serve * serves;

  sh.getRange(rowIdx, 7).setValue('CLOSED'); // status
  sh.getRange(rowIdx, 8).setValue(actual_qty||'');
  sh.getRange(rowIdx, 9).setValue(weightKg||'');
  sh.getRange(rowIdx,10).setValue(hours||'');
  sh.getRange(rowIdx,11).setValue(recipe_cost_per_serve);
  sh.getRange(rowIdx,12).setValue(pack_per_serve);
  sh.getRange(rowIdx,13).setValue(oh_per_hour);
  sh.getRange(rowIdx,14).setValue(oh_per_kg);
  sh.getRange(rowIdx,15).setValue(cost_per_serve);
  sh.getRange(rowIdx,16).setValue(total_cost);

  return {status:'ok', serves, cost_per_serve, total_cost};
}