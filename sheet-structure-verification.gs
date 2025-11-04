/**
 * ========================================
 * SHEET STRUCTURE VERIFICATION FUNCTIONS
 * Add these functions to verify and fix sheet structures
 * ========================================
 */

/**
 * Complete sheet structure verification and auto-fix
 * This function checks all sheets and their required columns
 * @return {Object} Verification results with auto-fix actions
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

  // Define required sheet structures
  const requiredSheets = {
    'Ingredients': {
      required: ['id', 'name', 'stock_unit', 'buy_unit', 'buy_to_stock_ratio'],
      optional: ['min_stock', 'category', 'supplier', 'notes']
    },
    'Menus': {
      required: ['menu_id', 'name', 'price'],
      optional: ['category', 'description', 'active', 'เมนู', 'ราคา'] // Support Thai columns
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
      optional: ['วันที่', 'แพลตฟอร์ม', 'จำนวน', 'ราคาขายต่อหน่วย', 'สุทธิ(ต่อหน่วย)', 'notes'] // Support Thai columns
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

  // Check each required sheet
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
        // Create missing sheet
        sheet = ss.insertSheet(sheetName);
        sheetResult.exists = true;
        sheetResult.actions.push('Created sheet');
        results.summary.created++;
      } else {
        results.summary.existing++;
      }

      // Check and fix column headers
      const lastCol = Math.max(sheet.getLastColumn(), 1);
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      
      // Convert headers to strings and trim
      const existingHeaders = headers.map(h => String(h || '').trim()).filter(h => h);
      sheetResult.columns.existing = existingHeaders;

      // Check required columns
      const missingRequired = structure.required.filter(col => !existingHeaders.includes(col));
      sheetResult.columns.missing = missingRequired;

      // Add missing required columns
      if (missingRequired.length > 0) {
        const newHeaders = [...existingHeaders, ...missingRequired];
        sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
        sheetResult.columns.added = missingRequired;
        sheetResult.actions.push(`Added columns: ${missingRequired.join(', ')}`);
        results.summary.fixed++;
      }

      // Add sample data if sheet is empty (except headers)
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

/**
 * Generate sample data for empty sheets
 * @param {string} sheetName - Name of the sheet
 * @param {Object} structure - Sheet structure definition
 * @return {Array} Sample data rows
 */
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
 * Updated dropdown functions with proper column name handling
 * These replace the previous dropdown functions to handle both English and Thai column names
 */

/**
 * Get all ingredients for dropdown population (Updated)
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
      // Try multiple possible column names for ID
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
 * Get all menus for dropdown population (Updated)
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
      // Try multiple possible column names for ID
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
 * Get ingredients for a specific menu (Updated)
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

    // Get ingredient names for lookup
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
 * Get all platforms for dropdown population (Updated)
 * @return {Array} Array of platform objects
 */
function getPlatforms() {
  try {
    const cacheKey = 'dropdown_platforms';
    const cached = _getCache(cacheKey);
    if (cached) return cached;

    let platforms = [];

    // Try to get from Platforms sheet first
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

    // If no platforms found, use defaults
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
 * Test all dropdown functions with current sheet structure
 * @return {Object} Comprehensive test results
 */
function testDropdownFunctionsWithSheets() {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      sheetVerification: null,
      dropdownTests: {}
    };

    // First verify and fix sheet structure
    console.log('Verifying sheet structure...');
    results.sheetVerification = verifyAndFixSheetStructure();

    // Test each dropdown function
    console.log('Testing dropdown functions...');

    // Test getIngredients
    try {
      const ingredients = getIngredients();
      results.dropdownTests.getIngredients = {
        success: true,
        count: ingredients.length,
        sample: ingredients.slice(0, 3),
        message: `Found ${ingredients.length} ingredients`
      };
    } catch (e) {
      results.dropdownTests.getIngredients = {
        success: false,
        error: e.toString()
      };
    }

    // Test getMenus
    try {
      const menus = getMenus();
      results.dropdownTests.getMenus = {
        success: true,
        count: menus.length,
        sample: menus.slice(0, 3),
        message: `Found ${menus.length} menus`
      };
    } catch (e) {
      results.dropdownTests.getMenus = {
        success: false,
        error: e.toString()
      };
    }

    // Test getPlatforms
    try {
      const platforms = getPlatforms();
      results.dropdownTests.getPlatforms = {
        success: true,
        count: platforms.length,
        sample: platforms,
        message: `Found ${platforms.length} platforms`
      };
    } catch (e) {
      results.dropdownTests.getPlatforms = {
        success: false,
        error: e.toString()
      };
    }

    // Test getMenuIngredients (if menus exist)
    try {
      const menus = getMenus();
      if (menus.length > 0) {
        const menuIngredients = getMenuIngredients(menus[0].id);
        results.dropdownTests.getMenuIngredients = {
          success: true,
          menuId: menus[0].id,
          count: menuIngredients.length,
          sample: menuIngredients.slice(0, 3),
          message: `Found ${menuIngredients.length} ingredients for menu ${menus[0].id}`
        };
      } else {
        results.dropdownTests.getMenuIngredients = {
          success: true,
          message: 'No menus available to test menu ingredients'
        };
      }
    } catch (e) {
      results.dropdownTests.getMenuIngredients = {
        success: false,
        error: e.toString()
      };
    }

    // Overall success
    const allTests = Object.values(results.dropdownTests);
    const successCount = allTests.filter(t => t.success).length;
    results.overallSuccess = successCount === allTests.length;
    results.summary = `${successCount}/${allTests.length} tests passed`;

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
 * Quick fix function to run after copying to Apps Script
 * This will verify and fix all sheet structures automatically
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
    
    // Test dropdown functions
    console.log('🧪 Testing dropdown functions...');
    const testResults = testDropdownFunctionsWithSheets();
    
    console.log('✅ Setup completed!');
    console.log(`Test results: ${testResults.summary}`);
    
    return {
      success: true,
      message: 'Dropdown sheets setup completed successfully',
      details: results,
      tests: testResults
    };
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}