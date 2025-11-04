# Comprehensive Testing Infrastructure

This directory contains the comprehensive testing and verification infrastructure for the POS System.

## Overview

The comprehensive testing suite validates all aspects of the POS system including:
- Sheet structure verification
- API endpoint testing
- Functional testing
- Data integrity validation
- Performance benchmarking
- Cross-browser compatibility
- PWA capabilities
- Security auditing
- Error handling
- Reporting accuracy

## Files

### Configuration Files

#### `comprehensive-test-config.js`
Main configuration file for the comprehensive testing suite.

**Key Sections:**
- **Environment Settings**: API URLs, timeouts, retry logic
- **Test Categories**: Enable/disable specific test categories
- **Performance Thresholds**: Define acceptable performance limits
- **Sheet Structure**: Required sheets and column mappings
- **API Endpoints**: List of endpoints to test
- **Browser Matrix**: Browsers and devices to test
- **Security Tests**: Test users, XSS payloads, SQL injection tests
- **Error Scenarios**: Error conditions to test
- **Requirement Mapping**: Maps test requirements to descriptions

**Usage:**
```javascript
const config = ComprehensiveTestConfig;
console.log(config.thresholds.performance.apiResponse); // 2000ms
```

#### `test-config.js`
Existing test configuration for unit and integration tests.

### Test Data Files

#### `test-fixtures.js`
Provides realistic test data for all testing scenarios.

**Available Fixtures:**
- `ingredients`: Sample ingredient data (5 items)
- `menus`: Sample menu data (5 items)
- `menuRecipes`: Sample recipe data (4 items)
- `purchases`: Sample purchase transactions (3 items)
- `sales`: Sample sales transactions (4 items)
- `users`: Test user accounts (4 users with different roles)
- `platforms`: Delivery platform data (5 platforms)
- `stocks`: Current stock levels (5 items)
- `lots`: Lot tracking data (3 lots)

**Helper Methods:**
```javascript
// Generate test data
const purchase = TestFixtures.generatePurchase({ qty_buy: 20 });
const sale = TestFixtures.generateSale({ platform: 'Line Man' });
const ingredient = TestFixtures.generateIngredient();
const menu = TestFixtures.generateMenu();

// Query test data
const lowStock = TestFixtures.getLowStockIngredients();
const platformSales = TestFixtures.getSalesByPlatform('ร้าน');
const dateRangeSales = TestFixtures.getSalesByDateRange('2024-10-01', '2024-10-02');

// Calculate metrics
const totalSales = TestFixtures.calculateTotalSales();
const totalProfit = TestFixtures.calculateTotalProfit();
const menuCost = TestFixtures.getMenuCost('MENU001');

// Reset fixtures
TestFixtures.reset();
```

### Utility Files

#### `test-utilities.js`
Common utility functions for testing.

**Assertion Utilities:**
```javascript
// Basic assertions
TestUtilities.assertTrue(value, 'Should be true');
TestUtilities.assertFalse(value, 'Should be false');
TestUtilities.assertEqual(actual, expected);
TestUtilities.assertDeepEqual(obj1, obj2);

// Existence checks
TestUtilities.assertExists(value);
TestUtilities.assertNotExists(value);

// Collection assertions
TestUtilities.assertContains(array, value);
TestUtilities.assertHasProperty(obj, 'propertyName');

// Type and range assertions
TestUtilities.assertType(value, 'string');
TestUtilities.assertInRange(value, 0, 100);

// Error assertions
TestUtilities.assertThrows(() => { throw new Error(); });
```

**Timing Utilities:**
```javascript
// Measure execution time
const { result, duration } = await TestUtilities.measureTime(async () => {
  return await someOperation();
}, 'Operation Name');

// Assert timing constraints
await TestUtilities.assertTimingUnder(async () => {
  return await apiCall();
}, 2000, 'API Call');

// Wait utilities
await TestUtilities.wait(1000); // Wait 1 second
await TestUtilities.waitFor(() => condition === true, 5000);

// Retry with backoff
const result = await TestUtilities.retryWithBackoff(
  async () => await unreliableOperation(),
  3, // max retries
  100 // initial delay
);
```

**Mocking Utilities:**
```javascript
// Create mock function
const mockFn = TestUtilities.createMock((arg) => arg * 2);
mockFn(5); // Returns 10
console.log(mockFn.callCount()); // 1
console.log(mockFn.calledWith(5)); // true

// Mock API responses
const response = await TestUtilities.mockApiResponse({ data: 'test' }, 100);
const error = await TestUtilities.mockApiError('Network error', 100);

// Mock storage
const storage = TestUtilities.mockLocalStorage();
storage.setItem('key', 'value');
console.log(storage.getItem('key')); // 'value'

// Mock fetch
const fetchMock = TestUtilities.mockFetch({
  '/api/data': { data: { items: [] } }
});
// ... run tests ...
fetchMock.restore();
```

**Data Generation Utilities:**
```javascript
const str = TestUtilities.randomString(10);
const num = TestUtilities.randomNumber(1, 100);
const date = TestUtilities.randomDate();
const id = TestUtilities.generateId('TEST');
```

**Test Result Utilities:**
```javascript
// Create test result
const result = TestUtilities.createTestResult('Test Name', 'passed', {
  duration: 150,
  assertions: [{ passed: true }],
  metadata: { category: 'api' }
});

// Format results
const summary = TestUtilities.formatTestResults(results);
console.log(summary.successRate); // "95.00"

// Group by category
const grouped = TestUtilities.groupResultsByCategory(results);
```

**Validation Utilities:**
```javascript
// Validate required fields
const validation = TestUtilities.validateRequiredFields(obj, ['name', 'email']);
if (!validation.valid) {
  console.log('Missing fields:', validation.missing);
}

// Validate data types
const typeValidation = TestUtilities.validateDataTypes(obj, {
  name: 'string',
  age: 'number',
  active: 'boolean'
});

// Validate range
const rangeValidation = TestUtilities.validateRange(value, 0, 100);
```

**Logging Utilities:**
```javascript
// Create logger
const logger = TestUtilities.createLogger('MyTest');
logger.info('Test started');
logger.warn('Warning message');
logger.error('Error occurred');

// Log test execution
const wrappedTest = TestUtilities.logTestExecution('My Test', async () => {
  // Test code here
});
await wrappedTest();
```

## Usage Examples

### Basic Test Setup

```javascript
// Load dependencies
const config = ComprehensiveTestConfig;
const fixtures = TestFixtures;
const utils = TestUtilities;

// Configure test
const testConfig = {
  ...config,
  environment: {
    ...config.environment,
    apiUrl: 'https://your-api-url.com'
  }
};

// Run a simple test
async function testApiEndpoint() {
  const startTime = performance.now();
  
  try {
    // Make API call
    const response = await fetch(testConfig.environment.apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'getBootstrapData'
      })
    });
    
    const data = await response.json();
    
    // Assertions
    utils.assertEqual(data.status, 'success');
    utils.assertHasProperty(data, 'ingredientsMap');
    
    // Timing assertion
    const duration = performance.now() - startTime;
    utils.assertInRange(duration, 0, testConfig.thresholds.performance.apiResponse);
    
    return utils.createTestResult('API Endpoint Test', 'passed', {
      duration,
      assertions: [
        { description: 'Status is success', passed: true },
        { description: 'Has ingredientsMap', passed: true }
      ]
    });
    
  } catch (error) {
    return utils.createTestResult('API Endpoint Test', 'failed', {
      duration: performance.now() - startTime,
      error: error.message
    });
  }
}
```

### Using Test Fixtures

```javascript
// Test purchase flow with fixtures
async function testPurchaseFlow() {
  const purchase = fixtures.generatePurchase({
    ingredient_id: 'ING0001',
    qty_buy: 10,
    total_price: 1000
  });
  
  // Submit purchase
  const response = await submitPurchase(purchase);
  
  // Verify stock updated
  const stock = await getStock(purchase.ingredient_id);
  utils.assertEqual(stock.current_stock, 10);
  
  // Verify lot created
  const lot = await getLot(response.lot_id);
  utils.assertExists(lot);
  utils.assertEqual(lot.ingredient_id, purchase.ingredient_id);
}
```

### Performance Testing

```javascript
// Test cache performance
async function testCachePerformance() {
  const operations = [];
  
  for (let i = 0; i < 10; i++) {
    operations.push(async () => {
      return await utils.measureTime(async () => {
        return cache.get(`key${i}`);
      });
    });
  }
  
  const results = await Promise.all(operations.map(op => op()));
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  // Assert total time under threshold
  utils.assertInRange(
    totalDuration,
    0,
    config.thresholds.performance.cacheOperation
  );
}
```

## Configuration

### Environment Variables

Set these environment variables before running tests:

```bash
# API Configuration
API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
SPREADSHEET_ID=YOUR_SPREADSHEET_ID

# Test Configuration
TEST_TIMEOUT=10000
TEST_RETRIES=3
TEST_MODE=true
```

### Customizing Thresholds

Edit `comprehensive-test-config.js` to adjust performance thresholds:

```javascript
thresholds: {
  performance: {
    cacheOperation: 10,      // Adjust as needed
    apiResponse: 2000,       // Adjust as needed
    sheetRead: 100,          // Adjust as needed
    // ... other thresholds
  }
}
```

### Enabling/Disabling Test Categories

```javascript
testCategories: {
  sheetVerification: true,   // Enable/disable
  apiTesting: true,
  functionalTesting: true,
  dataIntegrity: true,
  performance: true,
  crossBrowser: false,       // Disable if not needed
  pwa: true,
  security: true,
  errorHandling: true,
  reporting: true
}
```

## Best Practices

1. **Use Fixtures**: Always use test fixtures instead of hardcoded data
2. **Clean Up**: Reset fixtures after each test
3. **Isolate Tests**: Each test should be independent
4. **Measure Performance**: Use timing utilities for performance-critical tests
5. **Mock External Calls**: Use mocking utilities for external dependencies
6. **Validate Results**: Use assertion utilities for clear test validation
7. **Log Appropriately**: Use logging utilities for debugging
8. **Handle Errors**: Always wrap tests in try-catch blocks
9. **Document Tests**: Add comments explaining test purpose
10. **Group Related Tests**: Organize tests by category

## Next Steps

After setting up the infrastructure, implement the test modules:

1. Sheet Verification Module (Task 2)
2. API Testing Module (Task 3)
3. Functional Testing Module (Task 4)
4. Data Integrity Module (Task 5)
5. Performance Testing Module (Task 6)
6. Cross-Browser Testing Module (Task 7)
7. PWA Testing Module (Task 8)
8. Security Testing Module (Task 9)
9. Error Handling Module (Task 10)
10. Reporting Testing Module (Task 11)
11. Report Generation Module (Task 12)
12. Test Orchestrator (Task 13)

## Support

For questions or issues with the testing infrastructure, refer to:
- Design document: `.kiro/specs/comprehensive-testing-verification/design.md`
- Requirements document: `.kiro/specs/comprehensive-testing-verification/requirements.md`
- Task list: `.kiro/specs/comprehensive-testing-verification/tasks.md`
