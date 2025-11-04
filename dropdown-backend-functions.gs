/**
 * ========================================
 * DROPDOWN FUNCTIONALITY BACKEND FUNCTIONS
 * Add these functions to your Code.gs file in Google Apps Script
 * ========================================
 */

/**
 * Get all ingredients for dropdown population
 * @return {Array} Array of ingredient objects with id, name, stock_unit, buy_unit, buy_to_stock_ratio
 */
function getIngredients() {
  try {
    const cacheKey = 'dropdown_ingredients';
    const cached = _getCache(cacheKey);
    if (cached) return cached;

    const { rows, idx } = byHeader(SHEET_ING);
    const ingredients = [];

    rows.forEach(r => {
      const id = r[idx['id']];
      if (id) {
        ingredients.push({
          id: id,
          name: r[idx['name']] || id,
          stock_unit: r[idx['stock_unit']] || 'unit',
          buy_unit: r[idx['buy_unit']] || 'unit',
          buy_to_stock_ratio: _safeNumber(r[idx['buy_to_stock_ratio']], 1)
        });
      }
    });

    _setCache(cacheKey, ingredients);
    return ingredients;

  } catch (error) {
    console.error('Error in getIngredients:', error);
    return []; // Return empty array instead of throwing error
  }
}

/**
 * Get all menus for dropdown population
 * @return {Array} Array of menu objects with id, name, price
 */
function getMenus() {
  try {
    const cacheKey = 'dropdown_menus';
    const cached = _getCache(cacheKey);
    if (cached) return cached;

    const { rows, idx } = byHeader(SHEET_MENU);
    const menus = [];

    rows.forEach(r => {
      const id = r[idx['menu_id']] || r[idx['id']];
      if (id) {
        menus.push({
          id: id,
          name: r[idx['name']] || r[idx['เมนู']] || id,
          price: _safeNumber(r[idx['price']] || r[idx['ราคา']], 0)
        });
      }
    });

    _setCache(cacheKey, menus);
    return menus;

  } catch (error) {
    console.error('Error in getMenus:', error);
    return []; // Return empty array instead of throwing error
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

    const { rows, idx } = byHeader(SHEET_MENU_RECIPES);
    const ingredients = [];

    // Get ingredient names for lookup
    const ingMap = _getIngredientMap();

    rows.forEach(r => {
      const recipeMenuId = r[idx['menu_id']];
      if (String(recipeMenuId) === String(menuId)) {
        const ingredientId = r[idx['ingredient_id']];
        const ingredient = ingMap[ingredientId];
        
        ingredients.push({
          ingredient_id: ingredientId,
          ingredient_name: ingredient ? ingredient.name : ingredientId,
          quantity: _safeNumber(r[idx['quantity']], 0),
          unit: r[idx['unit']] || (ingredient ? ingredient.stockU : 'unit')
        });
      }
    });

    _setCache(cacheKey, ingredients);
    return ingredients;

  } catch (error) {
    console.error('Error in getMenuIngredients:', error);
    return []; // Return empty array instead of throwing error
  }
}

/**
 * Get all platforms for dropdown population
 * @return {Array} Array of platform objects with id, name
 */
function getPlatforms() {
  try {
    const cacheKey = 'dropdown_platforms';
    const cached = _getCache(cacheKey);
    if (cached) return cached;

    let platforms = [];

    // Try to get from Platforms sheet first
    try {
      const { rows, idx } = byHeader(SHEET_PLATFORMS);
      rows.forEach(r => {
        const id = r[idx['id']];
        if (id) {
          platforms.push({
            id: id,
            name: r[idx['name']] || id
          });
        }
      });
    } catch (e) {
      // If Platforms sheet doesn't exist, use default platforms
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
    // Return default platforms on error
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
 * Test function to verify dropdown backend functions
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

    // Test getMenuIngredients (if menus exist)
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
 * Clear dropdown cache (useful for testing and manual refresh)
 * @return {Object} Result
 */
function clearDropdownCache() {
  try {
    // Clear specific dropdown cache keys
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

    // Clear menu ingredients cache (all entries with prefix)
    Object.keys(cache).forEach(key => {
      if (key.startsWith('dropdown_menu_ingredients_')) {
        delete cache[key];
      }
    });

    // Also clear ingredient map cache
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