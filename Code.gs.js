/**
 * POS & Inventory App (Strict-Header, FIFO, Menu Recipes, AI Agent)
 * Author: TK
 * Updated: 2025-10-18
 *
 * Tabs expected (strict):
 *  - Ingredients: id, name, stock_unit, buy_unit, buy_to_stock_ratio, min_stock, current_stock, cost_per_unit, last_updated
 *  - Purchases:   date, ingredient_id, qty_buy, unit, total_price, unit_price, supplier_note, actual_yield, lot_id, cost_per_stock, ingredient_name, qty_stock, remaining_stock
 *  - Sales:       date, platform, menu_id, qty, price, revenue, cost, profit, price_per_unit, net_per_unit
 *  - Menu:        menu_id, name, price, category, active, description
 *  - MenuRecipes: menu_id, ingredient_id, quantity_per_serving|qty_per_serving|quantity|qty, unit|stock_unit|buy_unit
 */

// ===================== CONFIG =====================
const CONFIG = {
  SPREADSHEET_ID: '1qb5_R0JhLINnU7KL3q7hFpGWT0m7OCU1sBMZ8hdUs14', // <- your linked sheet
  TIMEZONE: 'Asia/Bangkok',
  BRAND: 'D+',
  PLATFORM_MARKUP: { WalkIn: 1.30, Shopee: 1.35, TikTok: 1.38, Grab: 1.45, FoodPanda: 1.45 }
};

// Tab names
const TABS = {
  INGREDIENTS: 'Ingredients',
  PURCHASES:   'Purchases',
  SALES:       'Sales',
  MENU:        'Menu',
  RECIPE:      'MenuRecipes'
};

// ===================== UTILITIES =====================
function _ss() { return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); }
function nowStr() { return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'); }
function _genId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyMMddHHmmss');
  return prefix + '-' + ts + '-' + rand;
}
function assertPermission(_userKey, _role) { return true; } // TODO: RBAC if needed

function getSheetOrThrow(name) {
  const sh = _ss().getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" not found');
  return sh;
}
function getRows(sheet) {
  const lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];
  return sheet.getRange(2, 1, lastRow-1, lastCol).getValues();
}
/** Strict header resolver: throws if any required header is missing */
function getIdxStrict(sheetName, requiredHeaders) {
  const sh = getSheetOrThrow(sheetName);
  const headers = sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(function(h){ return String(h||'').trim(); });
  const idx = {};
  headers.forEach(function(h,i){ idx[h]=i; });
  const missing = [];
  requiredHeaders.forEach(function(h){ if (!(h in idx)) missing.push(h); });
  if (missing.length) throw new Error('Sheet "' + sheetName + '" missing headers: ' + missing.join(', '));
  return { sheet: sh, idx: idx, headers: headers };
}
/** Alias-friendly header resolver for MenuRecipes */
function getIdxWithAliases(sheetName, aliases) {
  const sh = getSheetOrThrow(sheetName);
  const headers = sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(function(h){ return String(h||'').trim(); });
  const mapRaw = {};
  headers.forEach(function(h,i){ mapRaw[h]=i; });
  const idx = {};
  const missing = [];
  Object.keys(aliases).forEach(function(logical){
    const candidates = aliases[logical] || [];
    var found = null;
    for (var k=0;k<candidates.length;k++){
      var c = candidates[k];
      if (c in mapRaw) { found = mapRaw[c]; break; }
    }
    if (found == null) missing.push(logical + ' -> [' + candidates.join(', ') + ']');
    else idx[logical] = found;
  });
  if (missing.length) throw new Error('Sheet "' + sheetName + '" missing headers (aliases):\n' + missing.join('\n'));
  return { sheet: sh, idx: idx, headers: headers };
}

// ===================== LOOKUPS =====================
/** Cached Ingredients header indices */
var _ING_IDX_CACHE = null;
function idxIngredients() {
  if (_ING_IDX_CACHE) return _ING_IDX_CACHE;
  const pack = getIdxStrict(TABS.INGREDIENTS, [
    'id','name','stock_unit','buy_unit','buy_to_stock_ratio','min_stock','current_stock','cost_per_unit','last_updated'
  ]);
  _ING_IDX_CACHE = pack.idx;
  return _ING_IDX_CACHE;
}
/** Find ingredient by id OR name */
function findIngredient(idOrName) {
  const sh = getSheetOrThrow(TABS.INGREDIENTS);
  const idx = idxIngredients();
  const rows = getRows(sh);
  const key = String(idOrName||'').trim().toLowerCase();
  for (var i=0;i<rows.length;i++){
    var r = rows[i];
    var id = String(r[idx['id']]||'').trim().toLowerCase();
    var name = String(r[idx['name']]||'').trim().toLowerCase();
    if (id===key || name===key) {
      return {
        rowIndex: i+2,
        id: r[idx['id']], name: r[idx['name']],
        stock_unit: r[idx['stock_unit']],
        buy_unit: r[idx['buy_unit']],
        buy_to_stock_ratio: Number(r[idx['buy_to_stock_ratio']]||1),
        min_stock: Number(r[idx['min_stock']]||0),
        current_stock: Number(r[idx['current_stock']]||0),
        cost_per_unit: Number(r[idx['cost_per_unit']]||0),
        last_updated: r[idx['last_updated']]
      };
    }
  }
  return null;
}
function getRemainingStock(ingredientId) {
  const pack = getIdxStrict(TABS.PURCHASES, [
    'date','ingredient_id','qty_buy','unit','total_price','unit_price','supplier_note',
    'actual_yield','lot_id','cost_per_stock','ingredient_name','qty_stock','remaining_stock'
  ]);
  const sheet = pack.sheet, idx = pack.idx;
  var total = 0;
  getRows(sheet).forEach(function(r){
    if (String(r[idx['ingredient_id']]||'').trim().toLowerCase() !== String(ingredientId).trim().toLowerCase()) return;
    total += Number(r[idx['remaining_stock']]||0);
  });
  return total;
}
function currentWeightedCost(ingredientId) {
  const pack = getIdxStrict(TABS.PURCHASES, [
    'date','ingredient_id','qty_buy','unit','total_price','unit_price','supplier_note',
    'actual_yield','lot_id','cost_per_stock','ingredient_name','qty_stock','remaining_stock'
  ]);
  const sheet = pack.sheet, idx = pack.idx;
  const rows = getRows(sheet);
  const key = String(ingredientId||'').trim().toLowerCase();
  var totalQty=0, totalCost=0;
  rows.forEach(function(r){
    if (String(r[idx['ingredient_id']]||'').trim().toLowerCase() !== key) return;
    var rem = Number(r[idx['remaining_stock']]||0);
    if (rem <= 0) return;
    var unitCost = Number(r[idx['cost_per_stock']]);
    if (!(unitCost>0)) unitCost = Number(r[idx['unit_price']]||0);
    if (unitCost>0) { totalQty += rem; totalCost += rem*unitCost; }
  });
  if (totalQty>0) return totalCost/totalQty;

  // fallback: last unit_price
  var lastUP=null, lastDate=null;
  rows.forEach(function(r){
    if (String(r[idx['ingredient_id']]||'').trim().toLowerCase() !== key) return;
    var d = new Date(r[idx['date']] || '1970-01-01');
    var up = Number(r[idx['unit_price']]||0);
    if (!isNaN(up) && (!lastDate || d>lastDate)) { lastDate=d; lastUP=up; }
  });
  return lastUP!=null ? lastUP : 0;
}

// ===================== PURCHASES =====================
/**
 * Add a purchase row aligned to Purchases headers.
 * Guardrails:
 *  - If user unit != ingredient.buy_unit and also != ingredient.stock_unit => throw (prevents wrong ratios)
 *  - If user unit == stock_unit, we treat qtyBuy as stock qty directly (no double conversion)
 */
function addPurchase(params) {
  assertPermission('guest','BUY');
  var date = params.date, ingredient_id = params.ingredient_id, qtyBuy = params.qtyBuy, unit = params.unit;
  var totalPrice = params.totalPrice, unitPrice = params.unitPrice, supplierNote = params.supplierNote, actualYield = params.actualYield;

  const ing = findIngredient(ingredient_id);
  if (!ing) throw new Error('ไม่พบวัตถุดิบ: ' + ingredient_id);

  const u = String(unit||'').trim().toLowerCase();
  const buyU = String(ing.buy_unit||'').trim().toLowerCase();
  const stockU = String(ing.stock_unit||'').trim().toLowerCase();
  const ratio = Number(ing.buy_to_stock_ratio||1);
  const qty_buy_number = Number(qtyBuy);
  const yieldFactor = actualYield != null ? Number(actualYield) : 1;

  var userQtyIsStock = false;
  if (u && buyU && u !== buyU) {
    if (u === stockU && ratio>0) {
      userQtyIsStock = true; // qtyBuy already in stock units
    } else {
      throw new Error('หน่วยที่ซื้อ ("' + unit + '") ไม่ตรงกับ "' + ing.buy_unit + '". โปรดใช้ ' + ing.buy_unit + ' หรือ ' + ing.stock_unit + '.');
    }
  }

  var qty_stock = userQtyIsStock
    ? qty_buy_number * (yieldFactor>0?yieldFactor:1)
    : qty_buy_number * (ratio>0?ratio:1) * (yieldFactor>0?yieldFactor:1);

  var total_price = totalPrice != null ? Number(totalPrice) : null;
  var unit_price  = unitPrice  != null ? Number(unitPrice)  : null;
  if (unit_price == null && total_price != null && qty_stock > 0) unit_price = total_price / qty_stock;
  if (total_price == null && unit_price != null) total_price = unit_price * qty_stock;

  var cost_per_stock = (total_price && qty_stock>0) ? (total_price/qty_stock) : (unit_price||0);

  const pack = getIdxStrict(TABS.PURCHASES, [
    'date','ingredient_id','qty_buy','unit','total_price','unit_price','supplier_note',
    'actual_yield','lot_id','cost_per_stock','ingredient_name','qty_stock','remaining_stock'
  ]);
  const sheet = pack.sheet;
  const lot_id = _genId('LOT');
  const now = nowStr();

  sheet.appendRow([
    (date || now).slice(0,10),
    ing.id,
    qty_buy_number,
    unit || ing.buy_unit || '',
    total_price != null ? total_price : '',
    unit_price  != null ? unit_price  : '',
    supplierNote || '',
    actualYield != null ? Number(actualYield) : '',
    lot_id,
    cost_per_stock,
    ing.name,
    qty_stock,
    qty_stock // initial remaining
  ]);

  // update ingredient running stats
  const shIng = getSheetOrThrow(TABS.INGREDIENTS);
  const iIdx = idxIngredients();
  shIng.getRange(ing.rowIndex, iIdx['current_stock']+1).setValue(getRemainingStock(ing.id));
  shIng.getRange(ing.rowIndex, iIdx['cost_per_unit']+1).setValue(currentWeightedCost(ing.id));
  shIng.getRange(ing.rowIndex, iIdx['last_updated']+1).setValue(now);

  return { lot_id: lot_id, qty_stock: qty_stock, cost_per_stock: cost_per_stock, unit_price: unit_price, total_price: total_price, stock_unit: ing.stock_unit };
}

// ===================== FIFO DEDUCTION =====================
function fifoDeduct(ingredientId, needQty) {
  const pack = getIdxStrict(TABS.PURCHASES, [
    'date','ingredient_id','qty_buy','unit','total_price','unit_price','supplier_note',
    'actual_yield','lot_id','cost_per_stock','ingredient_name','qty_stock','remaining_stock'
  ]);
  const sheet = pack.sheet, idx = pack.idx;
  const rows = getRows(sheet);
  const key = String(ingredientId||'').trim().toLowerCase();
  const lots = [];

  rows.forEach(function(r,i){
    if (String(r[idx['ingredient_id']]||'').trim().toLowerCase() !== key) return;
    var rem = Number(r[idx['remaining_stock']]||0);
    if (rem<=0) return;
    var up = Number(r[idx['cost_per_stock']]||r[idx['unit_price']]||0);
    var d  = new Date(r[idx['date']] || '1970-01-01');
    lots.push({ rowNum: i+2, date: d, remaining: rem, unitCost: up, lot_id: r[idx['lot_id']]||'' });
  });

  lots.sort(function(a,b){ return a.date - b.date; });
  var qty = Number(needQty);
  if (!(qty>0)) throw new Error('จำนวนที่ขายต้องมากกว่า 0');

  var totalCost=0;
  const consumed=[];
  for (var j=0;j<lots.length && qty>0;j++){
    var lot = lots[j];
    var take = Math.min(qty, lot.remaining);
    sheet.getRange(lot.rowNum, idx['remaining_stock']+1).setValue(lot.remaining - take);
    totalCost += take * lot.unitCost;
    consumed.push({
      lot_id: lot.lot_id,
      date: Utilities.formatDate(lot.date, CONFIG.TIMEZONE, 'yyyy-MM-dd'),
      takeQty: take,
      unitCost: lot.unitCost,
      cost: take * lot.unitCost
    });
    qty -= take;
  }
  if (qty>0) throw new Error('สต๊อกไม่พอสำหรับการขาย (ขาด ' + qty + ')');

  return { consumedLots: consumed, totalCost: totalCost, avgCost: totalCost / Number(needQty) };
}

// ===================== SALES =====================
/** Raw ingredient sale → FIFO + write Sales row (uses ingredient as menu_id) */
function recordSaleFIFO(params) {
  assertPermission(params.userKey,'SELL');
  const ingredient_id = params.ingredient_id, qty = params.qty, price = params.price, platform = params.platform;

  const needQty = Number(qty);
  if (!(needQty>0)) throw new Error('จำนวนต้องมากกว่า 0');

  // price fallback if omitted
  var unitPrice = price != null ? Number(price) : NaN;
  if (!isFinite(unitPrice)) {
    const cost = currentWeightedCost(ingredient_id);
    const walkMarkup = (CONFIG.PLATFORM_MARKUP && CONFIG.PLATFORM_MARKUP.WalkIn) || 1.3;
    unitPrice = +(cost * walkMarkup).toFixed(2);
  }

  const fifo = fifoDeduct(ingredient_id, needQty);
  const cogs = fifo.totalCost;
  const revenue = unitPrice * needQty;
  const profit = revenue - cogs;
  const price_per_unit = unitPrice;
  const net_per_unit = needQty>0 ? (profit/needQty) : 0;

  const pack = getIdxStrict(TABS.SALES, [
    'date','platform','menu_id','qty','price','revenue','cost','profit','price_per_unit','net_per_unit'
  ]);
  const sheet = pack.sheet;
  const now = nowStr();
  sheet.appendRow([
    now.slice(0,10),
    platform || 'WalkIn',
    ingredient_id,  // store ingredient id in menu_id column
    needQty,
    unitPrice,
    revenue,
    cogs,
    profit,
    price_per_unit,
    net_per_unit
  ]);

  return { fifo: fifo, cogs: cogs, profit: profit, revenue: revenue, price_per_unit: price_per_unit, net_per_unit: net_per_unit, platform: platform || 'WalkIn' };
}

/** Menu lookup & recipes */
function findMenu(idOrName) {
  const pack = getIdxStrict(TABS.MENU, ['menu_id','name','price','category','active','description']);
  const sheet = pack.sheet, idx = pack.idx;
  const rows = getRows(sheet);
  const key = String(idOrName||'').trim().toLowerCase();
  for (var r=0;r<rows.length;r++){
    const row = rows[r];
    const id = String(row[idx['menu_id']]||'').trim().toLowerCase();
    const name = String(row[idx['name']]||'').trim().toLowerCase();
    if (id===key || name===key) {
      return {
        rowIndex: r+2, menu_id: row[idx['menu_id']], name: row[idx['name']],
        price: Number(row[idx['price']]||0), category: row[idx['category']],
        active: row[idx['active']], description: row[idx['description']]
      };
    }
  }
  return null;
}
function getRecipeForMenu(menu_id) {
  const aliases = {
    menu_id: ['menu_id'],
    ingredient_id: ['ingredient_id'],
    qty_per_serving: ['quantity_per_serving','qty_per_serving','quantity','qty'],
    unit: ['unit','stock_unit','buy_unit']
  };
  const pack = getIdxWithAliases(TABS.RECIPE, aliases);
  const sheet = pack.sheet, idx = pack.idx;
  const rows = getRows(sheet);
  const key = String(menu_id||'').trim().toLowerCase();
  const out=[];
  rows.forEach(function(r){
    if (String(r[idx.menu_id]||'').trim().toLowerCase() !== key) return;
    out.push({
      ingredient_id: r[idx.ingredient_id],
      qty_per_serving: Number(r[idx.qty_per_serving]||0),
      unit: r[idx.unit] || ''
    });
  });
  return out;
}
function convertToStockUnits(qty, recipeUnit, ing) {
  const u = String(recipeUnit||'').trim().toLowerCase();
  const stockUnit = String(ing.stock_unit||'').trim().toLowerCase();
  const buyUnit   = String(ing.buy_unit||'').trim().toLowerCase();
  const ratio     = Number(ing.buy_to_stock_ratio||1);
  if (!(qty>0)) return { qtyStock: 0, note: 'qty<=0' };
  if (u === stockUnit || u === '') return { qtyStock: qty, note: 'stock-unit' };
  if (u === buyUnit && ratio > 0)  return { qtyStock: qty * ratio, note: 'buy→stock x' + ratio };
  // Fallback: unknown unit → assume 1:1 (explicit note)
  return { qtyStock: qty, note: 'unit "' + recipeUnit + '" ≠ stock/buy → assumed 1:1' };
}

/** Menu sale → expand recipe & FIFO all ingredients, then write single Sales row */
function recordMenuSaleFIFO(params) {
  assertPermission(params.userKey,'SELL');
  const menu_id = params.menu_id, servings = params.servings, priceEach = params.priceEach, platform = params.platform;

  if (!(servings>0)) throw new Error('จำนวนเสิร์ฟต้องมากกว่า 0');

  const menu = findMenu(menu_id) || findMenu(String(menu_id));
  if (!menu) throw new Error('ไม่พบเมนู: ' + menu_id);
  const realMenuId = menu.menu_id;

  const recipe = getRecipeForMenu(realMenuId);
  if (!recipe.length) throw new Error('เมนู "' + realMenuId + '" ไม่มีสูตรใน ' + TABS.RECIPE);

  // Compute ingredient requirements in stock units
  const needs = {}; // ingredient_id -> totalQtyStock
  for (var i=0;i<recipe.length;i++){
    var rec = recipe[i];
    var ing = findIngredient(rec.ingredient_id);
    if (!ing) throw new Error('ไม่พบวัตถุดิบในสูตร: ' + rec.ingredient_id);
    var needQty = rec.qty_per_serving * servings;
    var c = convertToStockUnits(needQty, rec.unit, ing);
    var prev = needs[ing.id] || 0;
    needs[ing.id] = prev + c.qtyStock;
  }

  // FIFO each ingredient
  var totalCOGS = 0;
  const breakdown=[];
  Object.keys(needs).forEach(function(ingId){
    var q = needs[ingId];
    if (!(q>0)) return;
    var fifo = fifoDeduct(ingId, q);
    totalCOGS += fifo.totalCost;
    var ingObj = findIngredient(ingId);
    breakdown.push({
      ingredient_id: ingId,
      name: (ingObj && ingObj.name) || ingId,
      needQty: q,
      fifo: fifo
    });
  });

  // Pricing
  var priceUnit = (priceEach != null) ? Number(priceEach) : Number(menu.price||0);
  var qty = Number(servings);
  var revenue = priceUnit * qty;
  var profit = revenue - totalCOGS;
  var price_per_unit = priceUnit;
  var net_per_unit = qty>0 ? (profit/qty) : 0;

  const pack = getIdxStrict(TABS.SALES, [
    'date','platform','menu_id','qty','price','revenue','cost','profit','price_per_unit','net_per_unit'
  ]);
  const sheet = pack.sheet;
  const now = nowStr();
  sheet.appendRow([
    now.slice(0,10),
    platform || 'WalkIn',
    realMenuId,
    qty,
    priceUnit,
    revenue,
    totalCOGS,
    profit,
    price_per_unit,
    net_per_unit
  ]);

  return {
    menu_id: realMenuId,
    menu_name: menu.name,
    qty: qty,
    price_per_unit: price_per_unit,
    revenue: revenue,
    cost: totalCOGS,
    profit: profit,
    net_per_unit: net_per_unit,
    breakdown: breakdown
  };
}

// ===================== PRICE SUGGESTIONS =====================
function getPriceSuggestions(params) {
  const ingredient_id = params.ingredient_id, platform = params.platform;
  const cost = currentWeightedCost(ingredient_id);
  const map = CONFIG.PLATFORM_MARKUP || {};
  const rows = [];
  if (platform && map[platform]) {
    rows.push({ platform: platform, markup: map[platform], suggest: +(cost*map[platform]).toFixed(2) });
  } else {
    Object.keys(map).forEach(function(p){ rows.push({ platform:p, markup:map[p], suggest: +(cost*map[p]).toFixed(2) }); });
  }
  return { ingredient_id: ingredient_id, cost: cost, rows: rows };
}

// ===================== LOW STOCK WIDGET =====================
function getLowStockHTML() {
  const shIng = getSheetOrThrow(TABS.INGREDIENTS);
  const idx = idxIngredients();
  const rows = getRows(shIng);
  const items = rows.map(function(r){
    const id = r[idx['id']], name=r[idx['name']], unit=r[idx['stock_unit']]||'';
    const min = Number(r[idx['min_stock']]||0);
    const remain = getRemainingStock(id);
    return { id:id, name:name, unit:unit, min:min, remain:remain };
  }).filter(function(x){ return x.min>0; })
    .sort(function(a,b){ return (a.remain/a.min) - (b.remain/b.min); });

  const trs = items.map(function(x){
    return '<tr>' +
      '<td>' + x.id + '</td>' +
      '<td>' + x.name + '</td>' +
      '<td style="text-align:right">' + x.remain.toFixed(2) + '</td>' +
      '<td>' + x.unit + '</td>' +
      '<td style="text-align:right">' + x.min.toFixed(2) + '</td>' +
    '</tr>';
  }).join('');
  return ''
    + '<div>'
    + '  <div style="font-weight:600;margin-bottom:6px">วัตถุดิบใกล้หมด</div>'
    + '  <div class="table-container" style="margin-top:8px">'
    + '    <table class="table">'
    + '      <thead><tr><th>ID</th><th>ชื่อ</th><th style="text-align:right">คงเหลือ</th><th>หน่วย</th><th style="text-align:right">ขั้นต่ำ</th></tr></thead>'
    + '      <tbody>' + (trs || '<tr><td colspan="5" class="muted">ยังไม่มีตั้งค่าขั้นต่ำ</td></tr>') + '</tbody>'
    + '    </table>'
    + '  </div>'
    + '</div>';
}

// ===================== RENDER HELPERS =====================
function renderSaleResultHTML(ingredient, res){
  const rows = res.fifo.consumedLots.map(function(l){
    return '<tr><td>' + (l.lot_id || '-') + '</td><td>' + l.date + '</td><td style="text-align:right">' + l.takeQty +
           '</td><td style="text-align:right">' + l.unitCost.toFixed(2) + '</td><td style="text-align:right">' + l.cost.toFixed(2) + '</td></tr>';
  }).join('');
  return ''
    + '<div>'
    + '  <div style="font-weight:600;margin-bottom:6px">บันทึกขายสำเร็จ ✅</div>'
    + '  <div>สินค้า: <b>' + ingredient + '</b> · แพลตฟอร์ม: <b>' + res.platform + '</b></div>'
    + '  <div>ยอดขาย: <b>' + res.revenue.toFixed(2) + '</b> · ต้นทุน: <b>' + res.cogs.toFixed(2) + '</b> · กำไร: <b>' + res.profit.toFixed(2) + '</b></div>'
    + '  <div class="table-container" style="margin-top:8px">'
    + '    <table class="table">'
    + '      <thead><tr><th>Lot</th><th>วันที่</th><th style="text-align:right">ตัดสต๊อก</th><th style="text-align:right">ต้นทุน/หน่วย</th><th style="text-align:right">ต้นทุนรวม</th></tr></thead>'
    + '      <tbody>' + rows + '</tbody>'
    + '    </table>'
    + '  </div>'
    + '</div>';
}
function renderPriceSuggestHTML(res){
  const rows = res.rows.map(function(r){
    return '<tr><td>' + r.platform + '</td><td style="text-align:right">' + (r.markup*100-100).toFixed(0) + '%</td><td style="text-align:right">' + r.suggest.toFixed(2) + '</td></tr>';
  }).join('');
  return ''
    + '<div>'
    + '  <div style="font-weight:600;margin-bottom:6px">ราคาแนะนำ · ' + res.ingredient_id + '</div>'
    + '  <div>ต้นทุนเฉลี่ยคงเหลือ: <b>' + res.cost.toFixed(2) + '</b> /หน่วย</div>'
    + '  <div class="table-container" style="margin-top:8px">'
    + '    <table class="table">'
    + '      <thead><tr><th>แพลตฟอร์ม</th><th style="text-align:right">Markup</th><th style="text-align:right">ราคาแนะนำ</th></tr></thead>'
    + '      <tbody>' + rows + '</tbody>'
    + '    </table>'
    + '  </div>'
    + '  <div class="muted" style="font-size:12px;margin-top:6px">ปรับตัวคูณใน <code>CONFIG.PLATFORM_MARKUP</code></div>'
    + '</div>';
}
function renderMenuSaleResultHTML(res){
  const ingTables = res.breakdown.map(function(b){
    const lots = b.fifo.consumedLots.map(function(l){
      return '<tr><td>' + (l.lot_id || '-') + '</td><td>' + l.date + '</td><td style="text-align:right">' + l.takeQty + '</td><td style="text-align:right">' + l.unitCost.toFixed(2) + '</td><td style="text-align:right">' + l.cost.toFixed(2) + '</td></tr>';
    }).join('');
    return ''
      + '<div class="card" style="margin:10px 0; padding:10px; border:1px solid #e5e7eb; border-radius:10px;">'
      + '  <div style="font-weight:600">' + b.name + ' · ใช้ ' + b.needQty.toFixed(3) + '</div>'
      + '  <div class="table-container" style="margin-top:6px">'
      + '    <table class="table">'
      + '      <thead><tr><th>Lot</th><th>วันที่</th><th style="text-align:right">ตัดสต๊อก</th><th style="text-align:right">ต้นทุน/หน่วย</th><th style="text-align:right">ต้นทุนรวม</th></tr></thead>'
      + '      <tbody>' + lots + '</tbody>'
      + '    </table>'
      + '  </div>'
      + '</div>';
  }).join('');
  return ''
    + '<div>'
    + '  <div style="font-weight:700;margin-bottom:6px">บันทึกขายเมนูสำเร็จ ✅</div>'
    + '  <div>เมนู: <b>' + res.menu_id + ' · ' + (res.menu_name || '') + '</b></div>'
    + '  <div>จำนวนเสิร์ฟ: <b>' + res.qty + '</b> · ราคา/เสิร์ฟ: <b>' + res.price_per_unit.toFixed(2) + '</b></div>'
    + '  <div>รายรับ: <b>' + res.revenue.toFixed(2) + '</b> · ต้นทุนรวม (COGS): <b>' + res.cost.toFixed(2) + '</b> · กำไร: <b>' + res.profit.toFixed(2) + '</b> · กำไร/เสิร์ฟ: <b>' + res.net_per_unit.toFixed(2) + '</b></div>'
    + '  <div style="margin-top:10px">' + ingTables + '</div>'
    + '</div>';
}

// ===================== AI AGENT (parse → plan → confirm) =====================
function _agentParseText(text) {
  const t = String(text || '').trim();
  if (!t) return { intent:'help', entities:{}, confidence:0.2, raw:t };

  const norm = t
    .replace(/[,]+/g,'')
    .replace(/บาท/g,' THB ')
    .replace(/กก\.?|กิโล|กิโลกรัม|kg/gi,' kg ')
    .replace(/กรัม|g/gi,' g ')
    .replace(/ตัว|ชิ้น|pcs?|piece/gi,' pcs ')
    .replace(/\s+/g,' ')
    .trim();

  // ซื้อเข้า
  const buyRe = /(?:ซื้อ|บันทึกซื้อ|ซื้อวัตถุดิบ)\s+([^\d]+?)\s+([\d.]+)\s*(kg|g|pcs|pack|box|bottle|bag|can|liter|ml)?\s+([\d.]+)\s*(?:บาท|THB)(?:\s*(?:จาก|ที่)\s*([^\n]+))?/i;
  // อัปเดตวัตถุดิบ
  const updRe = /(?:อัปเดต|แก้ไข)\s+วัตถุดิบ\s+(.+?)\s+(.*)$/i;
  // สต๊อกต่ำ
  const lowRe = /(วัตถุดิบใกล้หมด|คงเหลือต่ำ|สต๊อกต่ำ)/i;
  // ขายวัตถุดิบ
  const saleRe = /(?:ขาย|บันทึกขาย|sell)\s+([^\d@]+?)\s+([\d.]+)\s*(kg|g|pcs|pack|box|bottle|bag|can|liter|ml)?(?:\s*(?:@|ราคา)\s*([\d.]+)\s*(?:บาท|THB))?(?:.*?(?:ที่|แพลตฟอร์ม|platform)\s+([A-Za-zก-๙]+))?/i;
  // ราคาแนะนำ
  const priceRe = /(?:แนะนำราคา|ราคาแนะนำ|price\s*suggest|ตั้งราคา)\s+(.+?)(?:\s+(?:สำหรับ|บน|on|แพลตฟอร์ม)\s+([A-Za-zก-๙]+))?$/i;
  // ขายเมนู
  const saleMenuRe = /(?:ขายเมนู|ขาย\s*เมนู|sell\s*menu)\s+(.+?)\s+([\d.]+)\s*(?:เสิร์ฟ|servings|ที่จาน|qty)?(?:\s*(?:@|ราคา)\s*([\d.]+)\s*(?:บาท|THB))?(?:.*?(?:ที่|แพลตฟอร์ม|platform)\s+([A-Za-zก-๙]+))?/i;

  var m;
  if ((m = buyRe.exec(norm))) {
    return { intent:'add_purchase', entities:{ ingredient:m[1].trim(), qty:Number(m[2]), unit:(m[3]||'').trim()||'kg', totalPrice:Number(m[4]), supplierNote:(m[5]||'').trim()||'' }, confidence:0.9, raw:t };
  }
  if ((m = updRe.exec(t))) {
    const changes={};
    String(m[2]||'').split(/\s+/).forEach(function(tok,i,arr){
      if (i%2===0 && arr[i+1]!=null){ var vRaw=arr[i+1]; changes[tok.trim()] = isNaN(Number(vRaw))? vRaw : Number(vRaw); }
    });
    return { intent:'update_ingredient', entities:{ ingredient:m[1].trim(), changes:changes }, confidence:0.7, raw:t };
  }
  if (lowRe.test(t)) return { intent:'low_stock', entities:{}, confidence:0.75, raw:t };
  if ((m = saleRe.exec(t))) {
    return { intent:'sale_fifo', entities:{ ingredient:m[1].trim(), qty:Number(m[2]), unit:(m[3]||'').trim()||'kg', price: m[4]!=null?Number(m[4]):null, platform:(m[5]||'').trim()||'WalkIn' }, confidence:0.92, raw:t };
  }
  if ((m = priceRe.exec(t))) {
    return { intent:'price_suggest', entities:{ ingredient:m[1].trim(), platform:(m[2]||'').trim()||null }, confidence:0.85, raw:t };
  }
  if ((m = saleMenuRe.exec(t))) {
    return { intent:'sale_menu', entities:{ menu:m[1].trim(), servings:Number(m[2]), priceEach: m[3]!=null?Number(m[3]):null, platform:(m[4]||'').trim()||'WalkIn' }, confidence:0.92, raw:t };
  }
  return { intent:'help', entities:{}, confidence:0.4, raw:t };
}

function _cachePlanReturn(userKey, plan, parsed) {
  const token = _genId('AG');
  CacheService.getScriptCache().put(token, JSON.stringify({ userKey:userKey||'guest', plan:plan }), 60*10);
  return { status:'ok', token:token, plan:plan, parsed:parsed };
}
function agentPlan(obj) {
  try {
    const userKey = obj.userKey, text = obj.text;
    const parsed = _agentParseText(text);
    const intent = parsed.intent, entities = parsed.entities;

    if (intent==='add_purchase') {
      const ingredient = entities.ingredient, qty = entities.qty, unit = entities.unit, totalPrice = entities.totalPrice, supplierNote = entities.supplierNote;
      return _cachePlanReturn(userKey, { summary:'บันทึกซื้อ: ' + ingredient + ' ' + qty + ' ' + unit + ' ราคารวม ' + totalPrice + ' บาท' + (supplierNote?(' (ผู้ขาย: ' + supplierNote + ')'):''),
        applyFn:'apply_add_purchase', payload:{ ingredient:ingredient, qtyBuy:qty, unit:unit, totalPrice:totalPrice, supplierNote:supplierNote } }, parsed);
    }
    if (intent==='update_ingredient') {
      const ingredient = entities.ingredient, changes = entities.changes;
      const pretty = Object.keys(changes).map(function(k){ return k + ': ' + changes[k]; }).join(', ');
      return _cachePlanReturn(userKey, { summary:'อัปเดตวัตถุดิบ: ' + ingredient + ' ⇢ { ' + pretty + ' }',
        applyFn:'apply_update_ingredient', payload:{ ingredient:ingredient, changes:changes } }, parsed);
    }
    if (intent==='low_stock') {
      return _cachePlanReturn(userKey, { summary:'ดูรายการวัตถุดิบใกล้หมด', applyFn:'apply_show_low_stock', payload:{} }, parsed);
    }
    if (intent==='sale_fifo') {
      const ingredient = entities.ingredient, qty = entities.qty, price = entities.price, platform = entities.platform;
      return _cachePlanReturn(userKey, { summary:'บันทึกขาย (FIFO): ' + ingredient + ' จำนวน ' + qty + ' @ ' + (price!=null?price:'—') + ' บาท (' + platform + ')',
        applyFn:'apply_sale_fifo', payload:{ ingredient_id:ingredient, qty:qty, price:price, platform:platform } }, parsed);
    }
    if (intent==='price_suggest') {
      const ingredient = entities.ingredient, platform = entities.platform;
      return _cachePlanReturn(userKey, { summary:'ราคาแนะนำ: ' + ingredient + (platform?(' บน ' + platform):''), applyFn:'apply_price_suggest',
        payload:{ ingredient_id:ingredient, platform:platform }, autoApply:true }, parsed);
    }
    if (intent==='sale_menu') {
      const menu = entities.menu, servings = entities.servings, priceEach = entities.priceEach, platform = entities.platform;
      return _cachePlanReturn(userKey, { summary:'บันทึกขายเมนู: ' + menu + ' × ' + servings + ' @ ' + (priceEach!=null?priceEach:'—') + ' บาท (' + platform + ')',
        applyFn:'apply_sale_menu', payload:{ menu_id:menu, servings:servings, priceEach:priceEach, platform:platform } }, parsed);
    }

    return _cachePlanReturn(userKey, { summary:'คู่มือ: "ซื้อ กุ้ง 2 kg 240", "อัปเดตวัตถุดิบ น้ำปลา min_stock 3", "ขาย กุ้ง 0.5 kg @ 220 Shopee", "ขายเมนู กะเพราไก่ 2 @ 89 Grab", "แนะนำราคา กุ้ง Shopee"', applyFn:'none', payload:{} }, parsed);
  } catch(e) {
    return { status:'error', error:String(e) };
  }
}
function agentConfirm(obj) {
  try {
    const userKey = obj.userKey, token = obj.token;
    const c = CacheService.getScriptCache();
    const s = c.get(token);
    if (!s) throw new Error('Token หมดอายุหรือไม่ถูกต้อง');
    const parsed = JSON.parse(s);
    const u = parsed.userKey, plan = parsed.plan;

    if (plan.applyFn==='apply_add_purchase') {
      assertPermission(u,'BUY');
      const payload = plan.payload;
      const res = addPurchase({ date: nowStr().slice(0,10), ingredient_id: payload.ingredient, qtyBuy: payload.qtyBuy, unit: payload.unit, totalPrice: payload.totalPrice, unitPrice: null, supplierNote: payload.supplierNote });
      c.remove(token); return { status:'applied', result: res };
    }
    if (plan.applyFn==='apply_update_ingredient') {
      assertPermission(u,'WRITE');
      const payload = plan.payload;
      const res = upsertIngredient({ userKey:u, idOrName: payload.ingredient, patch: payload.changes });
      c.remove(token); return { status:'applied', result: res };
    }
    if (plan.applyFn==='apply_show_low_stock') {
      const html = getLowStockHTML();
      c.remove(token); return { status:'applied', result:{ type:'html', html:html } };
    }
    if (plan.applyFn==='apply_sale_fifo') {
      const payload = plan.payload;
      const res = recordSaleFIFO({ userKey:u, ingredient_id: payload.ingredient_id, qty: payload.qty, price: payload.price, platform: payload.platform });
      const html = renderSaleResultHTML(payload.ingredient_id, res);
      c.remove(token); return { status:'applied', result:{ type:'html', html:html } };
    }
    if (plan.applyFn==='apply_price_suggest') {
      const payload = plan.payload;
      const res = getPriceSuggestions({ ingredient_id: payload.ingredient_id, platform: payload.platform });
      const html = renderPriceSuggestHTML(res);
      c.remove(token); return { status:'applied', result:{ type:'html', html:html } };
    }
    if (plan.applyFn==='apply_sale_menu') {
      const payload = plan.payload;
      const res = recordMenuSaleFIFO({ userKey:u, menu_id: payload.menu_id, servings: payload.servings, priceEach: payload.priceEach, platform: payload.platform });
      const html = renderMenuSaleResultHTML(res);
      c.remove(token); return { status:'applied', result:{ type:'html', html:html } };
    }

    c.remove(token);
    return { status:'noop', message:'คำสั่งนี้ไม่ต้องทำรายการ' };
  } catch(e) {
    return { status:'error', error:String(e) };
  }
}

// ===================== INGREDIENT UPSERT =====================
function upsertIngredient(obj) {
  const userKey = obj.userKey, idOrName = obj.idOrName, patch = obj.patch || {};
  assertPermission(userKey, 'WRITE');

  const sh = getSheetOrThrow(TABS.INGREDIENTS);
  const idx = idxIngredients();
  const rows = getRows(sh);

  var rNum = -1, idFound = null;
  const target = String(idOrName||'').trim().toLowerCase();
  for (var i=0;i<rows.length;i++){
    const id = String(rows[i][idx['id']]||'').trim().toLowerCase();
    const name = String(rows[i][idx['name']]||'').trim().toLowerCase();
    if (id===target || name===target) { rNum=i+2; idFound=rows[i][idx['id']]; break; }
  }

  const now = nowStr();
  if (rNum < 0) {
    const id = String(idOrName).trim();
    const headers = Object.keys(idx).sort(function(a,b){ return idx[a]-idx[b]; });
    const row = [];
    for (var h=0; h<headers.length; h++){
      var col = headers[h], v = '';
      if (col==='id') v = id;
      else if (col==='name') v = patch.name || id;
      else if (col==='stock_unit') v = patch.stock_unit || '';
      else if (col==='buy_unit') v = patch.buy_unit || '';
      else if (col==='buy_to_stock_ratio') v = patch.buy_to_stock_ratio != null ? Number(patch.buy_to_stock_ratio) : '';
      else if (col==='min_stock') v = patch.min_stock != null ? Number(patch.min_stock) : '';
      else if (col==='last_updated') v = now;
      row[idx[col]] = v;
    }
    sh.appendRow(row);
    return { status: 'created', id: id, applied: patch };
  } else {
    function set(col, val){ sh.getRange(rNum, idx[col]+1).setValue(val); }
    if (patch.name != null) set('name', patch.name);
    if (patch.stock_unit != null) set('stock_unit', patch.stock_unit);
    if (patch.buy_unit != null) set('buy_unit', patch.buy_unit);
    if (patch.buy_to_stock_ratio != null) set('buy_to_stock_ratio', Number(patch.buy_to_stock_ratio));
    if (patch.min_stock != null) set('min_stock', Number(patch.min_stock));
    set('last_updated', now);
    return { status: 'updated', id: idFound || idOrName, applied: patch };
  }
}

// ===================== SCHEMA INSPECTION (optional) =====================
function listSheetsSchemaFromId(spreadsheetId, limit) {
  const n = Math.max(0, Number(limit)||5);
  const tz = CONFIG.TIMEZONE || Session.getScriptTimeZone();
  const ss = SpreadsheetApp.openById(spreadsheetId || CONFIG.SPREADSHEET_ID);
  const out = { spreadsheetId:ss.getId(), spreadsheetName:ss.getName(), generatedAt:Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss'), sheets:[] };
  ss.getSheets().forEach(function(sh){
    const lastRow=sh.getLastRow(), lastCol=sh.getLastColumn();
    if (lastRow===0||lastCol===0){ out.sheets.push({name:sh.getName(), rowsCount:0, columnsCount:0, headers:[], sample:[]}); return; }
    const vals = sh.getRange(1,1,Math.min(lastRow,1+n), lastCol).getValues();
    out.sheets.push({ name:sh.getName(), rowsCount:Math.max(0,lastRow-1), columnsCount:lastCol, headers:(vals[0]||[]).map(function(h){return String(h||'').trim();}), sample: vals.slice(1).map(function(r){return r.map(function(c){return c==null?'':c;});}) });
  });
  return out;
}
function listSheetsSchemaHTMLFromId(spreadsheetId, limit) {
  const snap = listSheetsSchemaFromId(spreadsheetId, limit);
  function esc(s){ s = String(s==null?'':s); return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  const sections = snap.sheets.map(function(s){
    const headRow = s.headers.map(function(h){return '<th>'+esc(h)+'</th>';}).join('');
    const dataRows = (s.sample && s.sample.length) ? s.sample.map(function(r){ return '<tr>'+ r.map(function(c){return '<td>'+esc(c)+'</td>';}).join('') + '</tr>'; }).join('') : '<tr><td colspan="'+Math.max(1,s.columnsCount)+'" style="color:#6b7280">— no data —</td></tr>';
    return ''
      + '<section style="margin:18px 0; padding:12px; border:1px solid #e5e7eb; border-radius:10px; background:#fff">'
      + '  <h3 style="margin:0 0 6px">' + esc(s.name) + '</h3>'
      + '  <div style="color:#6b7280; font-size:12px; margin-bottom:8px">Columns: <b>' + s.columnsCount + '</b> · Data rows: <b>' + s.rowsCount + '</b></div>'
      + '  <div style="overflow:auto; -webkit-overflow-scrolling:touch">'
      + '    <table style="border-collapse:collapse; min-width:640px; width:100%; font:13px system-ui,-apple-system,Segoe UI,Roboto,sans-serif">'
      + '      <thead><tr style="background:#f8fafc; border-bottom:1px solid #e5e7eb">' + headRow + '</tr></thead>'
      + '      <tbody>' + dataRows + '</tbody>'
      + '    </table>'
      + '  </div>'
      + '</section>';
  }).join('');
  return ''
    + '<div style="padding:12px">'
    + '  <div style="margin-bottom:10px; color:#374151; font:14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif">'
    + '    <div><b>Spreadsheet:</b> ' + esc(snap.spreadsheetName) + ' (' + esc(snap.spreadsheetId) + ')</div>'
    + '    <div><b>Generated:</b> ' + esc(snap.generatedAt) + '</div>'
    + '  </div>'
    + sections
    + '</div>';
}

// ===================== WEB APP =====================
function doGet() {
  const t = HtmlService.createTemplateFromFile('Index');
  t.brand = CONFIG.BRAND;
  return t.evaluate()
    .setTitle(CONFIG.BRAND + ' · POS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport','width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
}
function include(name){ return HtmlService.createHtmlOutputFromFile(name).getContent(); }

// Debug helpers (optional)
function _verifySchemaStrict(){
  const msgs=[];
  try{ getIdxStrict(TABS.INGREDIENTS, ['id','name','stock_unit','buy_unit','buy_to_stock_ratio','min_stock','current_stock','cost_per_unit','last_updated']); msgs.push('✅ Ingredients'); }catch(e){msgs.push('❌ Ingredients :: '+e);}
  try{ getIdxStrict(TABS.PURCHASES, ['date','ingredient_id','qty_buy','unit','total_price','unit_price','supplier_note','actual_yield','lot_id','cost_per_stock','ingredient_name','qty_stock','remaining_stock']); msgs.push('✅ Purchases'); }catch(e){msgs.push('❌ Purchases :: '+e);}
  try{ getIdxStrict(TABS.SALES, ['date','platform','menu_id','qty','price','revenue','cost','profit','price_per_unit','net_per_unit']); msgs.push('✅ Sales'); }catch(e){msgs.push('❌ Sales :: '+e);}
  try{ getIdxStrict(TABS.MENU, ['menu_id','name','price','category','active','description']); msgs.push('✅ Menu'); }catch(e){msgs.push('❌ Menu :: '+e);}
  try{ getIdxWithAliases(TABS.RECIPE, {menu_id:['menu_id'],ingredient_id:['ingredient_id'],qty_per_serving:['quantity_per_serving','qty_per_serving','quantity','qty'],unit:['unit','stock_unit','buy_unit']}); msgs.push('✅ MenuRecipes'); }catch(e){msgs.push('❌ MenuRecipes :: '+e);}
  Logger.log(msgs.join('\n')); return msgs.join('\n');
}
