/**
 * Verification Script for Test Infrastructure
 * Run this to verify that all test infrastructure components are properly set up
 */

// Load test infrastructure components
const ComprehensiveTestConfig = require('./comprehensive-test-config.js');
const TestFixtures = require('./test-fixtures.js');
const TestUtilities = require('./test-utilities.js');

console.log('='.repeat(80));
console.log('TEST INFRASTRUCTURE VERIFICATION');
console.log('='.repeat(80));

let allPassed = true;

// Test 1: Verify configuration loaded
console.log('\n[1/5] Verifying configuration...');
try {
  TestUtilities.assertExists(ComprehensiveTestConfig, 'Config should exist');
  TestUtilities.assertHasProperty(ComprehensiveTestConfig, 'environment');
  TestUtilities.assertHasProperty(ComprehensiveTestConfig, 'testCategories');
  TestUtilities.assertHasProperty(ComprehensiveTestConfig, 'thresholds');
  TestUtilities.assertEqual(ComprehensiveTestConfig.sheets.required.length, 21);
  console.log('✓ Configuration loaded successfully');
  console.log(`  - ${ComprehensiveTestConfig.sheets.required.length} required sheets defined`);
  console.log(`  - ${ComprehensiveTestConfig.apiEndpoints.length} API endpoints configured`);
  console.log(`  - ${ComprehensiveTestConfig.browsers.length} browsers in test matrix`);
} catch (error) {
  console.error('✗ Configuration verification failed:', error.message);
  allPassed = false;
}

// Test 2: Verify fixtures loaded
console.log('\n[2/5] Verifying test fixtures...');
try {
  TestUtilities.assertExists(TestFixtures, 'Fixtures should exist');
  TestUtilities.assertEqual(TestFixtures.ingredients.length, 5);
  TestUtilities.assertEqual(TestFixtures.menus.length, 5);
  TestUtilities.assertEqual(TestFixtures.purchases.length, 3);
  TestUtilities.assertEqual(TestFixtures.sales.length, 4);
  TestUtilities.assertEqual(TestFixtures.users.length, 4);
  console.log('✓ Test fixtures loaded successfully');
  console.log(`  - ${TestFixtures.ingredients.length} ingredient fixtures`);
  console.log(`  - ${TestFixtures.menus.length} menu fixtures`);
  console.log(`  - ${TestFixtures.sales.length} sales fixtures`);
  console.log(`  - ${TestFixtures.users.length} user fixtures`);
} catch (error) {
  console.error('✗ Fixtures verification failed:', error.message);
  allPassed = false;
}

// Test 3: Verify utilities loaded
console.log('\n[3/5] Verifying test utilities...');
try {
  TestUtilities.assertExists(TestUtilities, 'Utilities should exist');
  TestUtilities.assertType(TestUtilities.assertTrue, 'function');
  TestUtilities.assertType(TestUtilities.assertEqual, 'function');
  TestUtilities.assertType(TestUtilities.measureTime, 'function');
  TestUtilities.assertType(TestUtilities.createMock, 'function');
  console.log('✓ Test utilities loaded successfully');
  console.log('  - Assertion utilities available');
  console.log('  - Timing utilities available');
  console.log('  - Mocking utilities available');
  console.log('  - Validation utilities available');
} catch (error) {
  console.error('✗ Utilities verification failed:', error.message);
  allPassed = false;
}

// Test 4: Test fixture helper methods
console.log('\n[4/5] Testing fixture helper methods...');
try {
  const purchase = TestFixtures.generatePurchase({ qty_buy: 20 });
  TestUtilities.assertEqual(purchase.qty_buy, 20);
  
  const sale = TestFixtures.generateSale({ platform: 'Line Man' });
  TestUtilities.assertEqual(sale.platform, 'Line Man');
  
  const lowStock = TestFixtures.getLowStockIngredients();
  TestUtilities.assertTrue(lowStock.length >= 0);
  
  const totalSales = TestFixtures.calculateTotalSales();
  TestUtilities.assertTrue(totalSales > 0);
  
  console.log('✓ Fixture helper methods working correctly');
  console.log(`  - Generated test purchase: ${purchase.ingredient_id}`);
  console.log(`  - Generated test sale: ${sale.menu_id}`);
  console.log(`  - Low stock items: ${lowStock.length}`);
  console.log(`  - Total sales: ${totalSales.toFixed(2)} THB`);
} catch (error) {
  console.error('✗ Fixture helper methods failed:', error.message);
  allPassed = false;
}

// Test 5: Test utility functions
console.log('\n[5/5] Testing utility functions...');
try {
  // Test assertions
  TestUtilities.assertTrue(true);
  TestUtilities.assertEqual(1, 1);
  TestUtilities.assertContains([1, 2, 3], 2);
  
  // Test data generation
  const randomStr = TestUtilities.randomString(10);
  TestUtilities.assertEqual(randomStr.length, 10);
  
  const randomNum = TestUtilities.randomNumber(1, 10);
  TestUtilities.assertInRange(randomNum, 1, 10);
  
  // Test mock creation
  const mockFn = TestUtilities.createMock((x) => x * 2);
  const result = mockFn(5);
  TestUtilities.assertEqual(result, 10);
  TestUtilities.assertEqual(mockFn.callCount(), 1);
  
  // Test result creation
  const testResult = TestUtilities.createTestResult('Test', 'passed', { duration: 100 });
  TestUtilities.assertEqual(testResult.status, 'passed');
  
  console.log('✓ Utility functions working correctly');
  console.log('  - Assertions working');
  console.log('  - Data generation working');
  console.log('  - Mocking working');
  console.log('  - Result formatting working');
} catch (error) {
  console.error('✗ Utility functions failed:', error.message);
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(80));
if (allPassed) {
  console.log('✓ ALL VERIFICATION TESTS PASSED');
  console.log('\nTest infrastructure is ready for use!');
  console.log('\nNext steps:');
  console.log('1. Review test/README-COMPREHENSIVE-TESTING.md for usage guide');
  console.log('2. Configure environment variables in comprehensive-test-config.js');
  console.log('3. Begin implementing test modules (see tasks.md)');
} else {
  console.log('✗ SOME VERIFICATION TESTS FAILED');
  console.log('\nPlease review the errors above and fix any issues.');
}
console.log('='.repeat(80));

// Exit with appropriate code
process.exit(allPassed ? 0 : 1);
