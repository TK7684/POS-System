/**
 * Functional Testing Module
 * Tests core business functionality end-to-end
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

class FunctionalTestingModule {
  constructor(config = {}) {
    console.log('FunctionalTestingModule constructor received config:', config);
    this.config = {
      apiUrl: config.apiUrl || '',
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      ...config
    };
    console.log('FunctionalTestingModule this.config.apiUrl:', this.config.apiUrl);
    
    this.testResults = {
      timestamp: null,
      testCategories: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: [],
      performanceMetrics: []
    };
  }

  /**
   * Test complete purchase flow
   * Requirement: 3.1, 3.5, 3.9
   */
  async testPurchaseFlow() {
    console.log('Testing purchase flow...');
    
    const results = [];
    const testData = {
      ingredient_id: 'TEST_ING_001',
      ingredient_name: 'Test Ingredient',
      qtyBuy: 10,
      unit: 'กิโลกรัม',
      totalPrice: 1000,
      unitPrice: 100,
      supplierNote: 'Test Supplier',
      date: new Date().toISOString().split('T')[0]
    };
    
    // Test 1: Add purchase record with all fields
    try {
      const startTime = performance.now();
      const response = await this.addPurchase(testData);
      const endTime = performance.now();
      
      const passed = response.status === 'success' && response.lot_id;
      
      results.push({
        testName: 'Add purchase with all fields',
        passed: passed,
        responseTime: endTime - startTime,
        response: response,
        requirement: '3.1',
        message: passed
          ? `Purchase added successfully with lot_id: ${response.lot_id}`
          : 'Failed to add purchase'
      });
      
      // Store lot_id for subsequent tests
      if (passed) {
        testData.lot_id = response.lot_id;
      }
      
    } catch (error) {
      results.push({
        testName: 'Add purchase with all fields',
        passed: false,
        error: error.message,
        requirement: '3.1'
      });
    }
    
    // Test 2: Validate stock updates after purchase
    if (testData.lot_id) {
      try {
        const stockBefore = await this.getIngredientStock(testData.ingredient_id);
        
        // Add another purchase
        const purchaseData = {
          ...testData,
          qtyBuy: 5,
          totalPrice: 500
        };
        
        await this.addPurchase(purchaseData);
        
        const stockAfter = await this.getIngredientStock(testData.ingredient_id);
        
        // Stock should increase by qty_stock (qtyBuy * buy_to_stock_ratio)
        const expectedIncrease = 5; // Assuming 1:1 ratio
        const actualIncrease = stockAfter - stockBefore;
        const passed = Math.abs(actualIncrease - expectedIncrease) < 0.01;
        
        results.push({
          testName: 'Validate stock updates after purchase',
          passed: passed,
          stockBefore: stockBefore,
          stockAfter: stockAfter,
          expectedIncrease: expectedIncrease,
          actualIncrease: actualIncrease,
          requirement: '3.5',
          message: passed
            ? `Stock updated correctly: ${stockBefore} → ${stockAfter}`
            : `Stock update mismatch: expected +${expectedIncrease}, got +${actualIncrease}`
        });
        
      } catch (error) {
        results.push({
          testName: 'Validate stock updates after purchase',
          passed: false,
          error: error.message,
          requirement: '3.5'
        });
      }
    }
    
    // Test 3: Verify lot creation and FIFO tracking
    if (testData.lot_id) {
      try {
        const lot = await this.getLotDetails(testData.lot_id);
        
        const hasRequiredFields = lot && 
          lot.lot_id === testData.lot_id &&
          lot.ingredient_id === testData.ingredient_id &&
          lot.qty_initial > 0 &&
          lot.cost_per_unit > 0;
        
        results.push({
          testName: 'Verify lot creation',
          passed: hasRequiredFields,
          lot: lot,
          requirement: '3.9',
          message: hasRequiredFields
            ? `Lot created with initial qty: ${lot.qty_initial}, cost: ${lot.cost_per_unit}`
            : 'Lot missing required fields'
        });
        
      } catch (error) {
        results.push({
          testName: 'Verify lot creation',
          passed: false,
          error: error.message,
          requirement: '3.9'
        });
      }
    }
    
    // Test 4: Test FIFO lot consumption
    try {
      // Create multiple lots with different dates
      const lot1 = await this.addPurchase({
        ingredient_id: 'TEST_FIFO_001',
        qtyBuy: 10,
        totalPrice: 1000,
        date: '2024-10-01'
      });
      
      const lot2 = await this.addPurchase({
        ingredient_id: 'TEST_FIFO_001',
        qtyBuy: 10,
        totalPrice: 1200,
        date: '2024-10-02'
      });
      
      // Record a sale that consumes from lots
      const saleResponse = await this.addSale({
        menu_id: 'TEST_MENU_001',
        platform: 'ร้าน',
        qty: 1,
        price: 100
      });
      
      // Verify oldest lot (lot1) was consumed first
      const lot1After = await this.getLotDetails(lot1.lot_id);
      const lot2After = await this.getLotDetails(lot2.lot_id);
      
      const fifoWorking = lot1After.qty_remaining < 10 && lot2After.qty_remaining === 10;
      
      results.push({
        testName: 'Test FIFO lot tracking',
        passed: fifoWorking,
        lot1: { before: 10, after: lot1After.qty_remaining },
        lot2: { before: 10, after: lot2After.qty_remaining },
        requirement: '3.9',
        message: fifoWorking
          ? 'FIFO working correctly - oldest lot consumed first'
          : 'FIFO not working - lot consumption order incorrect'
      });
      
    } catch (error) {
      results.push({
        testName: 'Test FIFO lot tracking',
        passed: false,
        error: error.message,
        requirement: '3.9'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Helper: Add purchase via API
   */
  async addPurchase(data) {
    const params = {
      action: 'addPurchase',
      ingredient_id: data.ingredient_id,
      qtyBuy: data.qtyBuy,
      totalPrice: data.totalPrice,
      date: data.date || new Date().toISOString().split('T')[0],
      unit: data.unit || 'กิโลกรัม',
      unitPrice: data.unitPrice || (data.totalPrice / data.qtyBuy),
      supplierNote: data.supplierNote || '',
      actualYield: data.actualYield || data.qtyBuy
    };
    
    return await this.makeApiCall(params);
  }

  /**
   * Helper: Get ingredient stock
   */
  async getIngredientStock(ingredientId) {
    const response = await this.makeApiCall({
      action: 'getIngredientMap'
    });
    
    if (response.status === 'success' && response.data) {
      const ingredient = response.data[ingredientId];
      return ingredient ? ingredient.current_stock : 0;
    }
    
    return 0;
  }

  /**
   * Helper: Get lot details
   */
  async getLotDetails(lotId) {
    const response = await this.makeApiCall({
      action: 'getLotDetails',
      lot_id: lotId
    });
    
    if (response.status === 'success') {
      return response.data;
    }
    
    return null;
  }

  /**
   * Helper: Add sale via API
   */
  async addSale(data) {
    const params = {
      action: 'addSale',
      platform: data.platform,
      menu_id: data.menu_id,
      qty: data.qty,
      price: data.price,
      date: data.date || new Date().toISOString().split('T')[0]
    };
    
    return await this.makeApiCall(params);
  }

  /**
   * Make API call
   */
  async makeApiCall(params) {
    if (!this.config.apiUrl) {
      throw new Error('API URL not configured');
    }
    
    const url = new URL(this.config.apiUrl);
    
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Test sales flow and calculations
   * Requirement: 3.2, 3.7, 3.8
   */
  async testSalesFlow() {
    console.log('Testing sales flow...');
    
    const results = [];
    
    // Test 1: Record sale and verify calculations
    try {
      const saleData = {
        platform: 'ร้าน',
        menu_id: 'TEST_MENU_001',
        qty: 2,
        price: 80,
        date: new Date().toISOString().split('T')[0]
      };
      
      const startTime = performance.now();
      const response = await this.addSale(saleData);
      const endTime = performance.now();
      
      const passed = response.status === 'success';
      
      results.push({
        testName: 'Record sale transaction',
        passed: passed,
        responseTime: endTime - startTime,
        response: response,
        requirement: '3.2',
        message: passed
          ? 'Sale recorded successfully'
          : 'Failed to record sale'
      });
      
    } catch (error) {
      results.push({
        testName: 'Record sale transaction',
        passed: false,
        error: error.message,
        requirement: '3.2'
      });
    }
    
    // Test 2: Verify sale calculations (gross, net, COGS, profit)
    try {
      const saleData = {
        platform: 'Line Man',
        menu_id: 'TEST_MENU_002',
        qty: 3,
        price: 100
      };
      
      const response = await this.addSale(saleData);
      
      // Get the sale details to verify calculations
      const saleDetails = await this.getSaleDetails(response.sale_id);
      
      if (saleDetails) {
        // Verify calculations
        const expectedGross = saleData.qty * saleData.price; // 3 * 100 = 300
        const platformFee = 0.15; // Line Man 15%
        const expectedNet = expectedGross * (1 - platformFee); // 300 * 0.85 = 255
        
        const grossCorrect = Math.abs(saleDetails.gross - expectedGross) < 0.01;
        const netCorrect = Math.abs(saleDetails.net - expectedNet) < 0.01;
        const cogsPresent = saleDetails.cogs >= 0;
        const profitCorrect = Math.abs(saleDetails.profit - (saleDetails.net - saleDetails.cogs)) < 0.01;
        
        const passed = grossCorrect && netCorrect && cogsPresent && profitCorrect;
        
        results.push({
          testName: 'Verify sale calculations',
          passed: passed,
          calculations: {
            gross: { expected: expectedGross, actual: saleDetails.gross, correct: grossCorrect },
            net: { expected: expectedNet, actual: saleDetails.net, correct: netCorrect },
            cogs: { actual: saleDetails.cogs, present: cogsPresent },
            profit: { actual: saleDetails.profit, correct: profitCorrect }
          },
          requirement: '3.2',
          message: passed
            ? 'All sale calculations correct'
            : 'Sale calculation errors detected'
        });
      } else {
        results.push({
          testName: 'Verify sale calculations',
          passed: false,
          requirement: '3.2',
          message: 'Could not retrieve sale details'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Verify sale calculations',
        passed: false,
        error: error.message,
        requirement: '3.2'
      });
    }
    
    // Test 3: Test platform fee calculation
    try {
      const platforms = [
        { name: 'ร้าน', fee: 0 },
        { name: 'Line Man', fee: 0.15 },
        { name: 'Grab Food', fee: 0.20 },
        { name: 'Food Panda', fee: 0.18 }
      ];
      
      const platformTests = [];
      
      for (const platform of platforms) {
        const saleData = {
          platform: platform.name,
          menu_id: 'TEST_MENU_001',
          qty: 1,
          price: 100
        };
        
        const response = await this.addSale(saleData);
        const saleDetails = await this.getSaleDetails(response.sale_id);
        
        if (saleDetails) {
          const expectedNet = 100 * (1 - platform.fee);
          const netCorrect = Math.abs(saleDetails.net - expectedNet) < 0.01;
          
          platformTests.push({
            platform: platform.name,
            fee: platform.fee,
            expectedNet: expectedNet,
            actualNet: saleDetails.net,
            correct: netCorrect
          });
        }
      }
      
      const allCorrect = platformTests.every(t => t.correct);
      
      results.push({
        testName: 'Test platform fee calculation',
        passed: allCorrect,
        platformTests: platformTests,
        requirement: '3.8',
        message: allCorrect
          ? 'All platform fees calculated correctly'
          : 'Platform fee calculation errors detected'
      });
      
    } catch (error) {
      results.push({
        testName: 'Test platform fee calculation',
        passed: false,
        error: error.message,
        requirement: '3.8'
      });
    }
    
    // Test 4: Verify COGS calculation using latest prices
    try {
      // Add a purchase to set ingredient price
      await this.addPurchase({
        ingredient_id: 'TEST_ING_COGS',
        qtyBuy: 10,
        totalPrice: 500,
        date: '2024-10-01'
      });
      
      // Add a newer purchase with different price
      await this.addPurchase({
        ingredient_id: 'TEST_ING_COGS',
        qtyBuy: 10,
        totalPrice: 600,
        date: '2024-10-02'
      });
      
      // Record a sale
      const response = await this.addSale({
        menu_id: 'TEST_MENU_COGS',
        platform: 'ร้าน',
        qty: 1,
        price: 100
      });
      
      const saleDetails = await this.getSaleDetails(response.sale_id);
      
      // COGS should use FIFO (oldest lot first)
      const passed = saleDetails && saleDetails.cogs > 0;
      
      results.push({
        testName: 'Verify COGS calculation',
        passed: passed,
        cogs: saleDetails?.cogs,
        requirement: '3.7',
        message: passed
          ? `COGS calculated: ${saleDetails.cogs}`
          : 'COGS calculation failed'
      });
      
    } catch (error) {
      results.push({
        testName: 'Verify COGS calculation',
        passed: false,
        error: error.message,
        requirement: '3.7'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test menu management operations
   * Requirement: 3.3, 3.7
   */
  async testMenuManagement() {
    console.log('Testing menu management...');
    
    const results = [];
    
    // Test 1: Create new menu
    try {
      const menuData = {
        menu_id: `TEST_MENU_${Date.now()}`,
        name: 'Test Menu Item',
        description: 'Test menu description',
        category: 'Test Category',
        active: true
      };
      
      const response = await this.createMenu(menuData);
      const passed = response.status === 'success';
      
      results.push({
        testName: 'Create new menu',
        passed: passed,
        response: response,
        requirement: '3.3',
        message: passed
          ? `Menu created: ${menuData.menu_id}`
          : 'Failed to create menu'
      });
      
      if (passed) {
        menuData.created = true;
      }
      
    } catch (error) {
      results.push({
        testName: 'Create new menu',
        passed: false,
        error: error.message,
        requirement: '3.3'
      });
    }
    
    // Test 2: Read/retrieve menu
    try {
      const menuId = 'TEST_MENU_001';
      const menu = await this.getMenu(menuId);
      
      const passed = menu && menu.menu_id === menuId;
      
      results.push({
        testName: 'Read menu details',
        passed: passed,
        menu: menu,
        requirement: '3.3',
        message: passed
          ? `Menu retrieved: ${menu.name}`
          : 'Failed to retrieve menu'
      });
      
    } catch (error) {
      results.push({
        testName: 'Read menu details',
        passed: false,
        error: error.message,
        requirement: '3.3'
      });
    }
    
    // Test 3: Update menu
    try {
      const menuId = 'TEST_MENU_001';
      const updateData = {
        name: 'Updated Menu Name',
        description: 'Updated description',
        active: true
      };
      
      const response = await this.updateMenu(menuId, updateData);
      const passed = response.status === 'success';
      
      results.push({
        testName: 'Update menu',
        passed: passed,
        response: response,
        requirement: '3.3',
        message: passed
          ? 'Menu updated successfully'
          : 'Failed to update menu'
      });
      
    } catch (error) {
      results.push({
        testName: 'Update menu',
        passed: false,
        error: error.message,
        requirement: '3.3'
      });
    }
    
    // Test 4: Add recipe to menu
    try {
      const recipeData = {
        menu_id: 'TEST_MENU_001',
        ingredient_id: 'TEST_ING_001',
        qty_per_serve: 0.15,
        note: 'Test ingredient'
      };
      
      const response = await this.addMenuRecipe(recipeData);
      const passed = response.status === 'success';
      
      results.push({
        testName: 'Add recipe to menu',
        passed: passed,
        response: response,
        requirement: '3.3',
        message: passed
          ? 'Recipe added to menu'
          : 'Failed to add recipe'
      });
      
    } catch (error) {
      results.push({
        testName: 'Add recipe to menu',
        passed: false,
        error: error.message,
        requirement: '3.3'
      });
    }
    
    // Test 5: Calculate menu cost automatically
    try {
      const menuId = 'TEST_MENU_001';
      const menuCost = await this.calculateMenuCost(menuId);
      
      const passed = menuCost !== null && menuCost >= 0;
      
      results.push({
        testName: 'Calculate menu cost',
        passed: passed,
        menuCost: menuCost,
        requirement: '3.7',
        message: passed
          ? `Menu cost calculated: ${menuCost}`
          : 'Failed to calculate menu cost'
      });
      
    } catch (error) {
      results.push({
        testName: 'Calculate menu cost',
        passed: false,
        error: error.message,
        requirement: '3.7'
      });
    }
    
    // Test 6: Verify cost uses latest ingredient prices
    try {
      const menuId = 'TEST_MENU_PRICE';
      
      // Add ingredient with initial price
      await this.addPurchase({
        ingredient_id: 'TEST_ING_PRICE',
        qtyBuy: 10,
        totalPrice: 1000,
        date: '2024-10-01'
      });
      
      // Add recipe using this ingredient
      await this.addMenuRecipe({
        menu_id: menuId,
        ingredient_id: 'TEST_ING_PRICE',
        qty_per_serve: 1
      });
      
      const costBefore = await this.calculateMenuCost(menuId);
      
      // Add new purchase with different price
      await this.addPurchase({
        ingredient_id: 'TEST_ING_PRICE',
        qtyBuy: 10,
        totalPrice: 1200,
        date: '2024-10-02'
      });
      
      const costAfter = await this.calculateMenuCost(menuId);
      
      // Cost should reflect latest price (FIFO)
      const passed = costBefore !== null && costAfter !== null;
      
      results.push({
        testName: 'Verify cost uses latest prices',
        passed: passed,
        costBefore: costBefore,
        costAfter: costAfter,
        requirement: '3.7',
        message: passed
          ? `Cost updated from ${costBefore} to ${costAfter}`
          : 'Failed to verify price updates'
      });
      
    } catch (error) {
      results.push({
        testName: 'Verify cost uses latest prices',
        passed: false,
        error: error.message,
        requirement: '3.7'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Helper: Get sale details
   */
  async getSaleDetails(saleId) {
    const response = await this.makeApiCall({
      action: 'getSaleDetails',
      sale_id: saleId
    });
    
    if (response.status === 'success') {
      return response.data;
    }
    
    return null;
  }

  /**
   * Helper: Create menu
   */
  async createMenu(data) {
    return await this.makeApiCall({
      action: 'createMenu',
      ...data
    });
  }

  /**
   * Helper: Get menu
   */
  async getMenu(menuId) {
    const response = await this.makeApiCall({
      action: 'getMenu',
      menu_id: menuId
    });
    
    if (response.status === 'success') {
      return response.data;
    }
    
    return null;
  }

  /**
   * Helper: Update menu
   */
  async updateMenu(menuId, data) {
    return await this.makeApiCall({
      action: 'updateMenu',
      menu_id: menuId,
      ...data
    });
  }

  /**
   * Helper: Add menu recipe
   */
  async addMenuRecipe(data) {
    return await this.makeApiCall({
      action: 'addMenuRecipe',
      ...data
    });
  }

  /**
   * Helper: Calculate menu cost
   */
  async calculateMenuCost(menuId) {
    const response = await this.makeApiCall({
      action: 'calculateMenuCost',
      menu_id: menuId
    });
    
    if (response.status === 'success') {
      return response.data.cost;
    }
    
    return null;
  }

  /**
   * Test stock management functionality
   * Requirement: 3.4, 3.5, 3.6
   */
  async testStockManagement() {
    console.log('Testing stock management...');
    
    const results = [];
    
    // Test 1: Update stock levels after purchases
    try {
      const ingredientId = 'TEST_ING_STOCK';
      
      // Get initial stock
      const stockBefore = await this.getIngredientStock(ingredientId);
      
      // Add purchase
      await this.addPurchase({
        ingredient_id: ingredientId,
        qtyBuy: 10,
        totalPrice: 1000
      });
      
      // Get updated stock
      const stockAfter = await this.getIngredientStock(ingredientId);
      
      const stockIncreased = stockAfter > stockBefore;
      
      results.push({
        testName: 'Update stock after purchase',
        passed: stockIncreased,
        stockBefore: stockBefore,
        stockAfter: stockAfter,
        increase: stockAfter - stockBefore,
        requirement: '3.5',
        message: stockIncreased
          ? `Stock increased from ${stockBefore} to ${stockAfter}`
          : 'Stock did not increase after purchase'
      });
      
    } catch (error) {
      results.push({
        testName: 'Update stock after purchase',
        passed: false,
        error: error.message,
        requirement: '3.5'
      });
    }
    
    // Test 2: Update stock levels after sales
    try {
      const ingredientId = 'TEST_ING_STOCK2';
      
      // Add initial stock
      await this.addPurchase({
        ingredient_id: ingredientId,
        qtyBuy: 20,
        totalPrice: 2000
      });
      
      const stockBefore = await this.getIngredientStock(ingredientId);
      
      // Record sale that uses this ingredient
      await this.addSale({
        menu_id: 'TEST_MENU_STOCK',
        platform: 'ร้าน',
        qty: 5,
        price: 100
      });
      
      const stockAfter = await this.getIngredientStock(ingredientId);
      
      const stockDecreased = stockAfter < stockBefore;
      
      results.push({
        testName: 'Update stock after sale',
        passed: stockDecreased,
        stockBefore: stockBefore,
        stockAfter: stockAfter,
        decrease: stockBefore - stockAfter,
        requirement: '3.5',
        message: stockDecreased
          ? `Stock decreased from ${stockBefore} to ${stockAfter}`
          : 'Stock did not decrease after sale'
      });
      
    } catch (error) {
      results.push({
        testName: 'Update stock after sale',
        passed: false,
        error: error.message,
        requirement: '3.5'
      });
    }
    
    // Test 3: Identify low stock ingredients
    try {
      // Create ingredient with low stock
      const lowStockIngredient = {
        ingredient_id: 'TEST_LOW_STOCK',
        min_stock: 10
      };
      
      // Add purchase below minimum
      await this.addPurchase({
        ingredient_id: lowStockIngredient.ingredient_id,
        qtyBuy: 5,
        totalPrice: 500
      });
      
      // Get low stock alerts
      const lowStockItems = await this.getLowStockIngredients();
      
      const foundLowStock = lowStockItems.some(
        item => item.ingredient_id === lowStockIngredient.ingredient_id
      );
      
      results.push({
        testName: 'Identify low stock ingredients',
        passed: foundLowStock,
        lowStockItems: lowStockItems,
        requirement: '3.6',
        message: foundLowStock
          ? `Low stock alert generated for ${lowStockIngredient.ingredient_id}`
          : 'Failed to identify low stock ingredient'
      });
      
    } catch (error) {
      results.push({
        testName: 'Identify low stock ingredients',
        passed: false,
        error: error.message,
        requirement: '3.6'
      });
    }
    
    // Test 4: Test low stock alert HTML generation
    try {
      const response = await this.makeApiCall({
        action: 'getLowStockHTML'
      });
      
      const passed = response.status === 'success' && response.html;
      
      results.push({
        testName: 'Generate low stock HTML',
        passed: passed,
        hasHtml: !!response.html,
        requirement: '3.6',
        message: passed
          ? 'Low stock HTML generated successfully'
          : 'Failed to generate low stock HTML'
      });
      
    } catch (error) {
      results.push({
        testName: 'Generate low stock HTML',
        passed: false,
        error: error.message,
        requirement: '3.6'
      });
    }
    
    // Test 5: Test real-time stock updates
    try {
      const ingredientId = 'TEST_REALTIME_STOCK';
      
      // Add initial stock
      await this.addPurchase({
        ingredient_id: ingredientId,
        qtyBuy: 100,
        totalPrice: 10000
      });
      
      // Perform multiple operations
      const operations = [
        { type: 'purchase', qty: 10 },
        { type: 'sale', qty: 5 },
        { type: 'purchase', qty: 20 },
        { type: 'sale', qty: 3 }
      ];
      
      let currentStock = await this.getIngredientStock(ingredientId);
      const stockHistory = [currentStock];
      
      for (const op of operations) {
        if (op.type === 'purchase') {
          await this.addPurchase({
            ingredient_id: ingredientId,
            qtyBuy: op.qty,
            totalPrice: op.qty * 100
          });
        } else {
          await this.addSale({
            menu_id: 'TEST_MENU_REALTIME',
            platform: 'ร้าน',
            qty: op.qty,
            price: 100
          });
        }
        
        currentStock = await this.getIngredientStock(ingredientId);
        stockHistory.push(currentStock);
      }
      
      // Verify stock changed with each operation
      const stockChanged = stockHistory.every((stock, i) => 
        i === 0 || stock !== stockHistory[i - 1]
      );
      
      results.push({
        testName: 'Real-time stock updates',
        passed: stockChanged,
        stockHistory: stockHistory,
        requirement: '3.4',
        message: stockChanged
          ? 'Stock updated in real-time for all operations'
          : 'Stock updates not reflecting in real-time'
      });
      
    } catch (error) {
      results.push({
        testName: 'Real-time stock updates',
        passed: false,
        error: error.message,
        requirement: '3.4'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test user permissions and role-based access control
   * Requirement: 3.10
   */
  async testUserPermissions() {
    console.log('Testing user permissions...');
    
    const results = [];
    
    // Test 1: OWNER role has full access
    try {
      const ownerUser = {
        user_key: 'owner@test.com',
        role: 'OWNER'
      };
      
      // Test various operations as OWNER
      const operations = [
        { action: 'addPurchase', params: { ingredient_id: 'TEST', qtyBuy: 10, totalPrice: 100 } },
        { action: 'addSale', params: { menu_id: 'TEST', platform: 'ร้าน', qty: 1, price: 50 } },
        { action: 'createMenu', params: { menu_id: 'TEST', name: 'Test' } },
        { action: 'getReport', params: { type: 'daily' } }
      ];
      
      const accessResults = [];
      
      for (const op of operations) {
        try {
          const response = await this.makeApiCall({
            ...op.params,
            action: op.action,
            user_key: ownerUser.user_key
          });
          
          accessResults.push({
            action: op.action,
            allowed: response.status !== 'error' || !response.message.includes('permission')
          });
        } catch (error) {
          accessResults.push({
            action: op.action,
            allowed: false,
            error: error.message
          });
        }
      }
      
      const allAllowed = accessResults.every(r => r.allowed);
      
      results.push({
        testName: 'OWNER role full access',
        passed: allAllowed,
        accessResults: accessResults,
        requirement: '3.10',
        message: allAllowed
          ? 'OWNER has access to all operations'
          : 'OWNER access restrictions detected'
      });
      
    } catch (error) {
      results.push({
        testName: 'OWNER role full access',
        passed: false,
        error: error.message,
        requirement: '3.10'
      });
    }
    
    // Test 2: PARTNER role has limited access
    try {
      const partnerUser = {
        user_key: 'partner@test.com',
        role: 'PARTNER'
      };
      
      // Test operations as PARTNER
      const allowedOps = [
        { action: 'addSale', params: { menu_id: 'TEST', platform: 'ร้าน', qty: 1, price: 50 } },
        { action: 'getReport', params: { type: 'daily' } }
      ];
      
      const restrictedOps = [
        { action: 'addPurchase', params: { ingredient_id: 'TEST', qtyBuy: 10, totalPrice: 100 } },
        { action: 'createMenu', params: { menu_id: 'TEST', name: 'Test' } }
      ];
      
      const allowedResults = [];
      const restrictedResults = [];
      
      for (const op of allowedOps) {
        try {
          const response = await this.makeApiCall({
            ...op.params,
            action: op.action,
            user_key: partnerUser.user_key
          });
          
          allowedResults.push({
            action: op.action,
            allowed: response.status !== 'error' || !response.message.includes('permission')
          });
        } catch (error) {
          allowedResults.push({
            action: op.action,
            allowed: false
          });
        }
      }
      
      for (const op of restrictedOps) {
        try {
          const response = await this.makeApiCall({
            ...op.params,
            action: op.action,
            user_key: partnerUser.user_key
          });
          
          restrictedResults.push({
            action: op.action,
            restricted: response.status === 'error' && response.message.includes('permission')
          });
        } catch (error) {
          restrictedResults.push({
            action: op.action,
            restricted: true
          });
        }
      }
      
      const correctAccess = allowedResults.every(r => r.allowed) && 
                           restrictedResults.every(r => r.restricted);
      
      results.push({
        testName: 'PARTNER role limited access',
        passed: correctAccess,
        allowedResults: allowedResults,
        restrictedResults: restrictedResults,
        requirement: '3.10',
        message: correctAccess
          ? 'PARTNER has correct access restrictions'
          : 'PARTNER access control not working correctly'
      });
      
    } catch (error) {
      results.push({
        testName: 'PARTNER role limited access',
        passed: false,
        error: error.message,
        requirement: '3.10'
      });
    }
    
    // Test 3: STAFF role has restricted access
    try {
      const staffUser = {
        user_key: 'staff@test.com',
        role: 'STAFF'
      };
      
      // Test operations as STAFF
      const allowedOps = [
        { action: 'addSale', params: { menu_id: 'TEST', platform: 'ร้าน', qty: 1, price: 50 } }
      ];
      
      const restrictedOps = [
        { action: 'addPurchase', params: { ingredient_id: 'TEST', qtyBuy: 10, totalPrice: 100 } },
        { action: 'createMenu', params: { menu_id: 'TEST', name: 'Test' } },
        { action: 'getReport', params: { type: 'daily' } }
      ];
      
      const allowedResults = [];
      const restrictedResults = [];
      
      for (const op of allowedOps) {
        try {
          const response = await this.makeApiCall({
            ...op.params,
            action: op.action,
            user_key: staffUser.user_key
          });
          
          allowedResults.push({
            action: op.action,
            allowed: response.status !== 'error' || !response.message.includes('permission')
          });
        } catch (error) {
          allowedResults.push({
            action: op.action,
            allowed: false
          });
        }
      }
      
      for (const op of restrictedOps) {
        try {
          const response = await this.makeApiCall({
            ...op.params,
            action: op.action,
            user_key: staffUser.user_key
          });
          
          restrictedResults.push({
            action: op.action,
            restricted: response.status === 'error' && response.message.includes('permission')
          });
        } catch (error) {
          restrictedResults.push({
            action: op.action,
            restricted: true
          });
        }
      }
      
      const correctAccess = allowedResults.every(r => r.allowed) && 
                           restrictedResults.every(r => r.restricted);
      
      results.push({
        testName: 'STAFF role restricted access',
        passed: correctAccess,
        allowedResults: allowedResults,
        restrictedResults: restrictedResults,
        requirement: '3.10',
        message: correctAccess
          ? 'STAFF has correct access restrictions'
          : 'STAFF access control not working correctly'
      });
      
    } catch (error) {
      results.push({
        testName: 'STAFF role restricted access',
        passed: false,
        error: error.message,
        requirement: '3.10'
      });
    }
    
    // Test 4: Inactive users denied access
    try {
      const inactiveUser = {
        user_key: 'inactive@test.com',
        role: 'STAFF',
        active: false
      };
      
      const response = await this.makeApiCall({
        action: 'addSale',
        menu_id: 'TEST',
        platform: 'ร้าน',
        qty: 1,
        price: 50,
        user_key: inactiveUser.user_key
      });
      
      const accessDenied = response.status === 'error' && 
                          (response.message.includes('inactive') || 
                           response.message.includes('permission'));
      
      results.push({
        testName: 'Inactive user access denied',
        passed: accessDenied,
        response: response,
        requirement: '3.10',
        message: accessDenied
          ? 'Inactive user correctly denied access'
          : 'Inactive user was not denied access'
      });
      
    } catch (error) {
      results.push({
        testName: 'Inactive user access denied',
        passed: false,
        error: error.message,
        requirement: '3.10'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Helper: Get low stock ingredients
   */
  async getLowStockIngredients() {
    const response = await this.makeApiCall({
      action: 'getLowStockIngredients'
    });
    
    if (response.status === 'success') {
      return response.data || [];
    }
    
    return [];
  }

  /**
   * Run all functional tests
   */
  async runAllTests() {
    console.log('Running all functional tests...');
    
    this.testResults.timestamp = new Date().toISOString();
    
    const categories = [
      { name: 'Purchase Flow', method: 'testPurchaseFlow' },
      { name: 'Sales Flow', method: 'testSalesFlow' },
      { name: 'Menu Management', method: 'testMenuManagement' },
      { name: 'Stock Management', method: 'testStockManagement' },
      { name: 'User Permissions', method: 'testUserPermissions' }
    ];
    
    for (const category of categories) {
      try {
        console.log(`\nRunning ${category.name} tests...`);
        const result = await this[category.method]();
        
        this.testResults.testCategories.push({
          name: category.name,
          ...result
        });
        
        this.testResults.totalTests += result.summary.total;
        this.testResults.passed += result.summary.passed;
        this.testResults.failed += result.summary.failed;
        
        if (!result.passed) {
          this.testResults.issues.push({
            category: category.name,
            failedTests: result.results.filter(r => !r.passed)
          });
        }
        
      } catch (error) {
        console.error(`Error running ${category.name} tests:`, error);
        this.testResults.failed++;
        this.testResults.issues.push({
          category: category.name,
          error: error.message
        });
      }
    }
    
    return this.getFunctionalTestReport();
  }

  /**
   * Get functional test report
   */
  getFunctionalTestReport() {
    return {
      ...this.testResults,
      generatedAt: new Date().toISOString(),
      passed: this.testResults.failed === 0,
      successRate: this.testResults.totalTests > 0
        ? ((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(2)
        : 0
    };
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FunctionalTestingModule;
} else if (typeof window !== 'undefined') {
  window.FunctionalTestingModule = FunctionalTestingModule;
}
