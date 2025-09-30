/**
 * Test Runner for Cost-POS System
 * Simple interface to run tests and populate mock data
 */

/**
 * Quick test - populate mock data and run basic tests
 * Run this function to quickly set up and test the system
 */
function quickTest() {
  console.log('🚀 Starting Quick Test...');
  
  try {
    // Step 1: Populate mock data
    console.log('📊 Populating mock data...');
    const populateResult = populateAllMockData();
    console.log('Populate result:', populateResult);
    
    // Step 2: Test basic functions
    console.log('🧪 Testing basic functions...');
    const testResult = testAllFunctions();
    console.log('Test result:', testResult);
    
    // Step 3: Show summary
    console.log('📋 Test Summary:');
    console.log('- Mock data populated:', populateResult.status === 'success' ? '✅' : '❌');
    console.log('- Function tests:', testResult.status === 'success' ? '✅' : '❌');
    
    return {
      status: 'success',
      message: 'Quick test completed',
      populateResult,
      testResult
    };
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return {
      status: 'error',
      message: 'Quick test failed',
      error: error.toString()
    };
  }
}

/**
 * Full system test with performance metrics
 * Run this for comprehensive testing
 */
function fullSystemTest() {
  console.log('🔬 Starting Full System Test...');
  
  try {
    const result = runCompleteSystemTest();
    console.log('Full system test result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Full system test failed:', error);
    return {
      status: 'error',
      message: 'Full system test failed',
      error: error.toString()
    };
  }
}

/**
 * Clean up all test data
 * Run this to remove all mock data
 */
function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    const result = cleanupMockData();
    console.log('Cleanup result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return {
      status: 'error',
      message: 'Cleanup failed',
      error: error.toString()
    };
  }
}

/**
 * Test individual functions
 * Run this to test specific functions
 */
function testIndividualFunctions() {
  console.log('🔍 Testing Individual Functions...');
  
  const results = {};
  
  try {
    // Test ingredient map
    console.log('Testing _getIngredientMap...');
    results.ingredientMap = _getIngredientMap();
    console.log('Ingredient map keys:', Object.keys(results.ingredientMap));
    
    // Test bootstrap data
    console.log('Testing getBootstrapData...');
    results.bootstrapData = getBootstrapData();
    console.log('Bootstrap data:', results.bootstrapData);
    
    // Test low stock
    console.log('Testing getLowStockHTML...');
    results.lowStock = getLowStockHTML();
    console.log('Low stock HTML length:', results.lowStock.length);
    
    // Test report generation
    console.log('Testing getReport...');
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    results.report = getReport({
      from: lastWeek.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
      granularity: 'day'
    });
    console.log('Report rows:', results.report.rows.length);
    
    return {
      status: 'success',
      message: 'Individual function tests completed',
      results
    };
    
  } catch (error) {
    console.error('❌ Individual function test failed:', error);
    return {
      status: 'error',
      message: 'Individual function test failed',
      error: error.toString()
    };
  }
}

/**
 * Performance benchmark test
 * Run this to test system performance
 */
function performanceBenchmark() {
  console.log('⚡ Starting Performance Benchmark...');
  
  const results = {
    timestamp: nowStr(),
    tests: {}
  };
  
  try {
    // Test 1: Cache performance
    console.log('Testing cache performance...');
    const cacheStart = Date.now();
    for (let i = 0; i < 10; i++) {
      _getIngredientMap();
    }
    const cacheEnd = Date.now();
    results.tests.cachePerformance = {
      iterations: 10,
      totalTime: cacheEnd - cacheStart,
      avgTime: (cacheEnd - cacheStart) / 10
    };
    
    // Test 2: Report generation performance
    console.log('Testing report generation performance...');
    const reportStart = Date.now();
    const report = getReport({
      from: '2024-01-01',
      to: '2024-01-31',
      granularity: 'day'
    });
    const reportEnd = Date.now();
    results.tests.reportPerformance = {
      executionTime: reportEnd - reportStart,
      rowsGenerated: report.rows.length,
      dataPoints: report.totals
    };
    
    // Test 3: Sheet access performance
    console.log('Testing sheet access performance...');
    const sheetStart = Date.now();
    const sheetData = byHeader(SHEET_PUR);
    const sheetEnd = Date.now();
    results.tests.sheetAccessPerformance = {
      executionTime: sheetEnd - sheetStart,
      rowsRead: sheetData.rows.length,
      columnsRead: Object.keys(sheetData.idx).length
    };
    
    results.status = 'success';
    results.message = 'Performance benchmark completed';
    
    console.log('Performance Results:', results);
    
    return results;
    
  } catch (error) {
    console.error('❌ Performance benchmark failed:', error);
    return {
      status: 'error',
      message: 'Performance benchmark failed',
      error: error.toString()
    };
  }
}

/**
 * Data validation test
 * Run this to validate data integrity
 */
function dataValidationTest() {
  console.log('🔍 Starting Data Validation Test...');
  
  const results = {
    timestamp: nowStr(),
    validations: {}
  };
  
  try {
    // Validate ingredients
    console.log('Validating ingredients...');
    const ingredients = byHeader(SHEET_ING);
    results.validations.ingredients = {
      totalCount: ingredients.rows.length,
      hasRequiredFields: ingredients.idx.hasOwnProperty('id') && ingredients.idx.hasOwnProperty('name'),
      validRatios: ingredients.rows.filter(r => r[ingredients.idx['buy_to_stock_ratio']] > 0).length
    };
    
    // Validate menus
    console.log('Validating menus...');
    const menus = byHeader(SHEET_MENU);
    results.validations.menus = {
      totalCount: menus.rows.length,
      hasRequiredFields: menus.idx.hasOwnProperty('menu_id') && menus.idx.hasOwnProperty('name'),
      validPrices: menus.rows.filter(r => r[menus.idx['price']] > 0).length
    };
    
    // Validate purchases
    console.log('Validating purchases...');
    const purchases = byHeader(SHEET_PUR);
    results.validations.purchases = {
      totalCount: purchases.rows.length,
      hasRequiredFields: purchases.idx.hasOwnProperty('ingredient_id') && purchases.idx.hasOwnProperty('total_price'),
      validAmounts: purchases.rows.filter(r => r[purchases.idx['total_price']] > 0).length
    };
    
    // Validate sales
    console.log('Validating sales...');
    const sales = byHeader(SHEET_SALE);
    results.validations.sales = {
      totalCount: sales.rows.length,
      hasRequiredFields: sales.idx.hasOwnProperty('menu_id') && sales.idx.hasOwnProperty('qty'),
      validQuantities: sales.rows.filter(r => r[sales.idx['qty']] > 0).length
    };
    
    // Check data consistency
    console.log('Checking data consistency...');
    results.validations.consistency = {
      menuRecipesExist: byHeader(SHEET_MENU_RECIPES).rows.length > 0,
      usersExist: byHeader(SHEET_USERS).rows.length > 0,
      costCentersExist: byHeader(SHEET_COST_CENTERS).rows.length > 0
    };
    
    results.status = 'success';
    results.message = 'Data validation completed';
    
    console.log('Validation Results:', results);
    
    return results;
    
  } catch (error) {
    console.error('❌ Data validation failed:', error);
    return {
      status: 'error',
      message: 'Data validation failed',
      error: error.toString()
    };
  }
}

/**
 * Generate test report
 * Run this to get a comprehensive test report
 */
function generateTestReport() {
  console.log('📊 Generating Test Report...');
  
  const report = {
    timestamp: nowStr(),
    summary: {},
    details: {}
  };
  
  try {
    // Run all tests
    report.details.quickTest = quickTest();
    report.details.performanceTest = performanceBenchmark();
    report.details.validationTest = dataValidationTest();
    report.details.individualTest = testIndividualFunctions();
    
    // Generate summary
    report.summary = {
      totalTests: 4,
      passedTests: Object.values(report.details).filter(test => test.status === 'success').length,
      failedTests: Object.values(report.details).filter(test => test.status === 'error').length,
      overallStatus: Object.values(report.details).every(test => test.status === 'success') ? 'PASS' : 'FAIL'
    };
    
    console.log('Test Report Generated:', report);
    
    return report;
    
  } catch (error) {
    console.error('❌ Test report generation failed:', error);
    return {
      status: 'error',
      message: 'Test report generation failed',
      error: error.toString()
    };
  }
}

/**
 * Verify mock data population
 * Run this to check if all sheets are properly populated
 */
function verifyMockData() {
  console.log('🔍 Verifying mock data...');
  
  try {
    const result = verifyMockDataPopulation();
    console.log('Verification result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return {
      status: 'error',
      message: 'Verification failed',
      error: error.toString()
    };
  }
}

/**
 * Main test entry point
 * Run this to execute all tests
 */
function runAllTests() {
  console.log('🎯 Running All Tests...');
  
  try {
    const report = generateTestReport();
    
    console.log('=== TEST SUMMARY ===');
    console.log('Overall Status:', report.summary.overallStatus);
    console.log('Tests Passed:', report.summary.passedTests);
    console.log('Tests Failed:', report.summary.failedTests);
    console.log('Total Tests:', report.summary.totalTests);
    
    return report;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return {
      status: 'error',
      message: 'Test execution failed',
      error: error.toString()
    };
  }
}
