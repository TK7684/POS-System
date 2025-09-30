/**
 * Quick Test Functions for Cost-POS System
 * Simple functions to test the fixed constants
 */

/**
 * Test the fixed packaging purchase function
 * @return {Object} Test result
 */
function testPackagingPurchase() {
  console.log('🧪 Testing addPackagingPurchase function...');
  
  try {
    const result = addPackagingPurchase({
      userKey: 'owner@restaurant.com',
      date: '2024-01-20',
      pkg_id: 'PKG001',
      qtyBuy: 50,
      unitPrice: 2.5,
      note: 'Test packaging purchase'
    });
    
    console.log('✅ addPackagingPurchase test passed:', result);
    return {
      status: 'success',
      message: 'addPackagingPurchase function works correctly',
      result: result
    };
    
  } catch (error) {
    console.error('❌ addPackagingPurchase test failed:', error);
    return {
      status: 'error',
      message: 'addPackagingPurchase function failed',
      error: error.toString()
    };
  }
}

/**
 * Test the fixed market run function
 * @return {Object} Test result
 */
function testMarketRun() {
  console.log('🧪 Testing startMarketRun function...');
  
  try {
    const result = startMarketRun({
      userKey: 'owner@restaurant.com',
      date: '2024-01-20',
      buyer: 'Test Buyer',
      note: 'Test market run'
    });
    
    console.log('✅ startMarketRun test passed:', result);
    return {
      status: 'success',
      message: 'startMarketRun function works correctly',
      result: result
    };
    
  } catch (error) {
    console.error('❌ startMarketRun test failed:', error);
    return {
      status: 'error',
      message: 'startMarketRun function failed',
      error: error.toString()
    };
  }
}

/**
 * Test the fixed batch function
 * @return {Object} Test result
 */
function testBatch() {
  console.log('🧪 Testing addBatch function...');
  
  try {
    const result = addBatch({
      userKey: 'owner@restaurant.com',
      date: '2024-01-20',
      menu_id: 'MENU001',
      plan_qty: 25,
      note: 'Test batch',
      run_id: 'RUN001'
    });
    
    console.log('✅ addBatch test passed:', result);
    return {
      status: 'success',
      message: 'addBatch function works correctly',
      result: result
    };
    
  } catch (error) {
    console.error('❌ addBatch test failed:', error);
    return {
      status: 'error',
      message: 'addBatch function failed',
      error: error.toString()
    };
  }
}

/**
 * Test all fixed functions
 * @return {Object} Combined test results
 */
function testAllFixedFunctions() {
  console.log('🎯 Testing all fixed functions...');
  
  const results = {
    timestamp: nowStr(),
    tests: {}
  };
  
  try {
    // Test 1: Packaging Purchase
    results.tests.packagingPurchase = testPackagingPurchase();
    
    // Test 2: Market Run
    results.tests.marketRun = testMarketRun();
    
    // Test 3: Batch
    results.tests.batch = testBatch();
    
    // Test 4: Overheads Config
    console.log('🧪 Testing getOverheadsConfig function...');
    try {
      results.tests.overheadsConfig = getOverheadsConfig();
      console.log('✅ getOverheadsConfig test passed');
    } catch (error) {
      console.error('❌ getOverheadsConfig test failed:', error);
      results.tests.overheadsConfig = {
        status: 'error',
        error: error.toString()
      };
    }
    
    // Calculate overall status
    const allPassed = Object.values(results.tests).every(test => test.status === 'success');
    results.overallStatus = allPassed ? '✅ All tests passed' : '❌ Some tests failed';
    
    console.log('=== TEST RESULTS ===');
    console.log('Overall Status:', results.overallStatus);
    Object.entries(results.tests).forEach(([name, test]) => {
      console.log(`${name}:`, test.status === 'success' ? '✅' : '❌');
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return {
      status: 'error',
      message: 'Test execution failed',
      error: error.toString()
    };
  }
}

/**
 * Quick verification that all constants are defined
 * @return {Object} Verification result
 */
function verifyConstants() {
  console.log('🔍 Verifying all sheet constants are defined...');
  
  const constants = [
    'SHEET_ING', 'SHEET_MENU', 'SHEET_MENU_RECIPES', 'SHEET_USERS',
    'SHEET_COST_CENTERS', 'SHEET_PUR', 'SHEET_SALE', 'SHEET_COGS',
    'SHEET_LABOR', 'SHEET_WASTE', 'SHEET_PACKAGING', 'SHEET_MARKET_RUNS',
    'SHEET_MARKET_RUN_ITEMS', 'SHEET_PACKING_PURCHASES', 'SHEET_OVERHEADS',
    'SHEET_MENU_EXTRAS', 'SHEET_BATCHES', 'SHEET_BATCH_COST_LINES'
  ];
  
  const results = {
    timestamp: nowStr(),
    constants: {},
    undefined: [],
    defined: []
  };
  
  constants.forEach(constantName => {
    try {
      const value = eval(constantName);
      results.constants[constantName] = value;
      results.defined.push(constantName);
    } catch (error) {
      results.constants[constantName] = 'UNDEFINED';
      results.undefined.push(constantName);
    }
  });
  
  results.summary = {
    total: constants.length,
    defined: results.defined.length,
    undefined: results.undefined.length,
    status: results.undefined.length === 0 ? '✅ All constants defined' : '❌ Some constants undefined'
  };
  
  console.log('Constants Verification:', results);
  
  return results;
}
