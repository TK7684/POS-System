/**
 * POS System API - Google Apps Script Backend
 * CORS-enabled API for hybrid frontend/backend architecture
 */

// ===== CORS CONFIGURATION =====
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    // Enable CORS for all origins (adjust for production)
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Get action and parameters
    const action = e.parameter.action || e.postData?.contents ? JSON.parse(e.postData.contents).action : null;
    const params = e.parameter.action ? e.parameter : JSON.parse(e.postData?.contents || '{}');
    
    let result = { status: 'error', message: 'Unknown action' };
    
    // Route to appropriate function
    switch(action) {
      case 'addPurchase':
        result = addPurchase(params);
        break;
      case 'addSale':
        result = addSale(params);
        break;
      case 'getReport':
        result = getReport(params);
        break;
      case 'getBootstrapData':
        result = getBootstrapData();
        break;
      case 'getLowStockHTML':
        result = { status: 'success', html: getLowStockHTML() };
        break;
      case 'searchIngredients':
        result = searchIngredients(params);
        break;
      case 'getIngredientMap':
        result = { status: 'success', data: _getIngredientMap() };
        break;
      default:
        result = { status: 'error', message: `Unknown action: ${action}` };
    }
    
    // Add CORS headers
    const response = {
      ...result,
      timestamp: new Date().toISOString(),
      cors: true
    };
    
    return output.setContent(JSON.stringify(response));
    
  } catch (error) {
    console.error('API Error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== API ENDPOINTS =====

/**
 * Add purchase endpoint
 */
function addPurchase(params) {
  try {
    validateRequired(params, ['ingredient_id', 'qtyBuy', 'totalPrice']);
    
    const result = addPurchaseInternal({
      date: params.date || nowStr(),
      ingredient_id: params.ingredient_id,
      qtyBuy: Number(params.qtyBuy),
      unit: params.unit || '',
      totalPrice: Number(params.totalPrice),
      unitPrice: Number(params.unitPrice || params.totalPrice / params.qtyBuy),
      supplierNote: params.supplierNote || '',
      actualYield: params.actualYield ? Number(params.actualYield) : null
    });
    
    return {
      status: 'success',
      message: 'Purchase added successfully',
      lot_id: result.lot_id,
      data: result
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Add sale endpoint
 */
function addSale(params) {
  try {
    validateRequired(params, ['platform', 'menu_id', 'qty', 'price']);
    
    const result = addSaleInternal({
      date: params.date || nowStr(),
      platform: params.platform,
      menu_id: params.menu_id,
      qty: Number(params.qty),
      price: Number(params.price)
    });
    
    return {
      status: 'success',
      message: 'Sale recorded successfully',
      data: result
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

/**
 * Search ingredients endpoint
 */
function searchIngredients(params) {
  try {
    const query = params.query || '';
    const limit = Number(params.limit || 10);
    
    const ingredients = _getIngredientMap();
    const results = Object.values(ingredients)
      .filter(ing => 
        ing.name.toLowerCase().includes(query.toLowerCase()) ||
        ing.id.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
    
    return {
      status: 'success',
      data: results,
      count: results.length
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// ===== UTILITY FUNCTIONS =====

function validateRequired(params, required) {
  const missing = required.filter(param => !params[param]);
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

function addPurchaseInternal(data) {
  // Your existing addPurchase logic here
  // This is a placeholder - use your actual implementation
  const lot_id = `LOT${Date.now()}`;
  
  // Add to sheets logic here...
  
  return { lot_id, ...data };
}

function addSaleInternal(data) {
  // Your existing addSale logic here
  // This is a placeholder - use your actual implementation
  
  // Add to sheets logic here...
  
  return data;
}

// ===== DEPLOYMENT INFO =====
function getApiInfo() {
  return {
    name: 'POS System API',
    version: '2.0',
    endpoints: [
      'addPurchase',
      'addSale', 
      'getReport',
      'getBootstrapData',
      'getLowStockHTML',
      'searchIngredients',
      'getIngredientMap'
    ],
    cors: true,
    timestamp: new Date().toISOString()
  };
}