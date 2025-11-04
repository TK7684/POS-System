# Comprehensive Test Suite Guide

## Overview

This guide provides instructions for running the comprehensive test suite for the POS System. The test suite validates all functionality including sheet structure, API endpoints, functional flows, data integrity, performance, cross-browser compatibility, PWA capabilities, security, error handling, and reporting accuracy.

## Quick Start

### Running All Tests

1. Open `test-comprehensive.html` in your web browser
2. Click the **"Run All Tests"** button in the header
3. Wait for all test modules to complete (typically 3-5 minutes)
4. Review the results in the interface or download reports

### Running Individual Test Categories

Click the **"Run Tests"** button in any specific test category section:

- **Sheet Verification** - Validates Google Sheets structure
- **API Testing** - Tests all API endpoints
- **Functional Testing** - Tests core business flows
- **Data Integrity** - Validates data consistency
- **Performance Testing** - Measures system performance
- **Cross-Browser Testing** - Tests browser compatibility
- **PWA Testing** - Tests offline and PWA capabilities
- **Security Testing** - Tests authentication and authorization
- **Error Handling** - Tests error recovery mechanisms
- **Reporting Testing** - Tests report accuracy

## Test Categories

### 1. Sheet Verification Module

**What it tests:**
- Validates that all 21 required sheets exist
- Verifies column names match SHEET_STRUCTURE_REFERENCE.md
- Checks data types (numeric, date, text columns)
- Generates comprehensive sheet mapping report
- Validates sample data and statistics

**Requirements covered:** 1.1, 1.2, 1.3, 1.4, 1.5

**How to run:**
```javascript
// In browser console
const sheetModule = new SheetVerificationModule(config);
const results = await sheetModule.verifyAllSheets();
console.log(results);
```

**Expected output:**
- List of all sheets with validation status
- Column mapping details for each sheet
- Data type validation results
- Sample data from each sheet
- Any discrepancies or missing elements

### 2. API Testing Module

**What it tests:**
- Tests all 7 API endpoints (getBootstrapData, searchIngredients, getIngredientMap, addPurchase, addSale, getReport, getLowStockHTML)
- Validates required parameters
- Tests error handling for invalid actions
- Tests missing parameter handling
- Measures API response times

**Requirements covered:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10

**How to run:**
```javascript
// In browser console
const apiModule = new APITestingModule(config.environment.apiUrl);
const results = await apiModule.testAllEndpoints();
console.log(results);
```

**Expected output:**
- Status for each endpoint (passed/failed)
- Response time for each request
- Validation of expected fields in responses
- Error handling test results

### 3. Functional Testing Module

**What it tests:**
- Purchase flow: recording purchases, stock updates, lot creation
- Sales flow: recording sales, COGS calculation, profit calculation
- Menu management: CRUD operations, recipe management, cost calculation
- Stock management: stock updates, low stock alerts
- User permissions: role-based access control (OWNER, PARTNER, STAFF)
- Platform fee calculations

**Requirements covered:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10

**How to run:**
```javascript
// In browser console
const functionalModule = new FunctionalTestingModule(config);
const results = await functionalModule.runAllTests();
console.log(results);
```

**Expected output:**
- Purchase flow validation results
- Sales flow validation results
- Menu management test results
- Stock management test results
- Permission test results

### 4. Data Integrity Module

**What it tests:**
- Referential integrity: validates foreign key relationships
- Ingredient references in Purchases, MenuRecipes
- Menu references in Sales, MenuRecipes, Batches
- Lot references in Purchases
- User references across sheets
- Calculation validation (unit_price, net, profit)
- Required field validation
- Orphaned record detection

**Requirements covered:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10

**How to run:**
```javascript
// In browser console
const integrityModule = new DataIntegrityModule(config);
const results = await integrityModule.checkReferentialIntegrity();
console.log(results);
```

**Expected output:**
- Referential integrity check results
- List of invalid references (if any)
- Calculation validation results
- Missing required fields (if any)
- Orphaned records (if any)

### 5. Performance Testing Module

**What it tests:**
- Cache performance: 10 operations < 10ms
- API response times: < 2000ms
- Sheet read operations: < 100ms
- Report generation: 30-day reports < 1000ms
- Offline mode: cached data load < 500ms
- PWA installation: < 3 seconds
- Search functionality: < 300ms
- Load testing with 1000+ records
- Concurrent operations

**Requirements covered:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10

**How to run:**
```javascript
// In browser console
const perfModule = new PerformanceTestingModule(config);
const results = await perfModule.runAllTests();
console.log(results);
```

**Expected output:**
- Performance metrics for each operation
- Comparison against thresholds
- 95th and 99th percentile response times
- Load test results
- Performance recommendations

### 6. Cross-Browser Testing Module

**What it tests:**
- Browser compatibility: Chrome, Firefox, Safari, Edge
- Mobile browsers: Chrome (Android), Safari (iOS)
- Tablet compatibility
- Responsive layout adaptation
- Touch interactions
- Device-specific features
- Viewport testing

**Requirements covered:** 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10

**How to run:**
```javascript
// In browser console
const browserModule = new CrossBrowserTestingModule(config);
const results = await browserModule.testBrowserCompatibility();
console.log(results);
```

**Expected output:**
- Compatibility status for each browser
- Device-specific test results
- Responsive layout validation
- Touch interaction test results
- Browser-specific issues (if any)

### 7. PWA Testing Module

**What it tests:**
- Service worker registration and updates
- Offline indicator display
- Viewing cached data offline
- Recording offline transactions
- Automatic sync when connection restored
- Sync conflict resolution
- Cache strategy effectiveness
- Background sync functionality
- PWA installability

**Requirements covered:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10

**How to run:**
```javascript
// In browser console
const pwaModule = new PWATestingModule(config);
const results = await pwaModule.runAllTests();
console.log(results);
```

**Expected output:**
- Service worker status
- Offline capability test results
- Cache strategy validation
- Sync functionality test results
- PWA installation test results

### 8. Security Testing Module

**What it tests:**
- User authentication
- Role-based access control (OWNER, PARTNER, STAFF)
- Inactive user access denial
- Input validation and sanitization
- SQL injection prevention
- XSS (Cross-Site Scripting) prevention
- CSRF protection
- CORS handling

**Requirements covered:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10

**How to run:**
```javascript
// In browser console
const securityModule = new SecurityTestingModule(config);
const results = await securityModule.runAllTests();
console.log(results);
```

**Expected output:**
- Authentication test results
- Authorization test results for each role
- Input validation test results
- Security vulnerability test results
- Security recommendations

### 9. Error Handling Module

**What it tests:**
- Network error handling (timeout, unavailable API)
- Validation error display
- Field highlighting for errors
- Retry mechanisms with exponential backoff
- Data conflict resolution
- Cache corruption recovery
- Storage full notification
- JavaScript error handling
- Timeout error handling

**Requirements covered:** 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10

**How to run:**
```javascript
// In browser console
const errorModule = new ErrorHandlingModule(config);
const results = await errorModule.runAllTests();
console.log(results);
```

**Expected output:**
- Network error handling test results
- Validation error test results
- Recovery mechanism test results
- Error message validation
- Error handling recommendations

### 10. Reporting Testing Module

**What it tests:**
- Daily report accuracy (sales, costs, profit)
- Weekly report aggregation (7-day periods)
- Monthly report aggregation (30-day periods)
- Platform analysis (sales breakdown by platform)
- Menu performance ranking
- Ingredient usage calculation
- Cost trend analysis
- Profit margin calculation
- Export functionality (Excel, PDF)

**Requirements covered:** 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10

**How to run:**
```javascript
// In browser console
const reportingModule = new ReportingTestingModule(config);
const results = await reportingModule.runAllTests();
console.log(results);
```

**Expected output:**
- Report accuracy validation results
- Calculation verification results
- Export functionality test results
- Report generation performance metrics

## Running Tests from Command Line

While the primary interface is the HTML test runner, you can also run tests programmatically:

### Using Node.js (for automated testing)

```javascript
const ComprehensiveTestSuite = require('./test/automated-testing-suite.js');
const config = require('./test/comprehensive-test-config.js');

async function runTests() {
  const suite = new ComprehensiveTestSuite(config);
  const results = await suite.runAllTests();
  console.log(JSON.stringify(results, null, 2));
}

runTests();
```

### Running Specific Test Categories

```javascript
// Run only API tests
const results = await suite.runTestCategory('apiTesting');

// Run only performance tests
const results = await suite.runTestCategory('performance');

// Run multiple categories
const results = await suite.runTestCategories(['sheetVerification', 'dataIntegrity']);
```

## Viewing Test Reports

### HTML Reports

1. After tests complete, click **"Download HTML Report"**
2. Open the downloaded HTML file in your browser
3. Navigate through sections using the table of contents
4. Expand/collapse sections for detailed information

### JSON Reports

1. Click **"Download JSON Report"**
2. Use for automated processing or integration with CI/CD
3. Parse with any JSON-compatible tool

### CSV Reports

1. Click **"Download CSV Report"**
2. Open in Excel or Google Sheets for analysis
3. Filter and sort test results
4. Create custom visualizations

### Viewing Test History

1. Click **"View Test History"** in the interface
2. Browse previous test runs
3. Compare results over time
4. Identify trends and regressions

## Test Data

### Test Environment Setup

The test suite uses test data defined in `test/test-fixtures.js`:

- **Test Ingredients**: Sample ingredients for testing
- **Test Menus**: Sample menu items with recipes
- **Test Purchases**: Sample purchase records
- **Test Sales**: Sample sales records
- **Test Users**: Test user accounts with different roles

### Using Custom Test Data

To use custom test data:

1. Edit `test/test-fixtures.js`
2. Add your test data following the existing format
3. Ensure data references are valid (ingredient_id, menu_id, etc.)
4. Save and reload the test interface

## Interpreting Test Results

### Test Status Indicators

- ✅ **Passed**: Test completed successfully, all assertions passed
- ❌ **Failed**: Test failed, one or more assertions failed
- ⚠️ **Warning**: Test passed but with warnings or performance issues
- ⏭️ **Skipped**: Test was skipped (configuration or dependency issue)

### Success Rate

- **95%+**: Excellent - System is functioning correctly
- **90-95%**: Good - Minor issues that should be addressed
- **80-90%**: Fair - Several issues requiring attention
- **<80%**: Poor - Significant issues requiring immediate attention

### Performance Metrics

- **Green**: Performance meets or exceeds thresholds
- **Yellow**: Performance is acceptable but close to thresholds
- **Red**: Performance does not meet thresholds

## Best Practices

### Before Running Tests

1. **Backup your data**: Tests may modify data in test mode
2. **Check configuration**: Ensure API URL and Spreadsheet ID are correct
3. **Use test environment**: Don't run tests against production data
4. **Clear cache**: Clear browser cache for accurate results
5. **Close other tabs**: Minimize browser resource usage

### During Test Execution

1. **Don't navigate away**: Stay on the test page during execution
2. **Monitor console**: Check browser console for detailed logs
3. **Watch for errors**: Note any error messages that appear
4. **Be patient**: Full test suite takes 3-5 minutes

### After Test Completion

1. **Review all results**: Check each test category
2. **Download reports**: Save reports for documentation
3. **Address failures**: Investigate and fix failed tests
4. **Track trends**: Compare with previous test runs
5. **Update documentation**: Document any issues found

## Continuous Testing

### Scheduled Testing

For automated testing on a schedule:

1. Set up a CI/CD pipeline (GitHub Actions, Jenkins, etc.)
2. Configure to run tests daily or on each commit
3. Set up notifications for test failures
4. Archive test reports for historical analysis

### Integration with CI/CD

Example GitHub Actions workflow:

```yaml
name: Comprehensive Tests
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: node test/run-tests.js
      - name: Upload Reports
        uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: test/reports/
```

## Getting Help

### Common Issues

See the troubleshooting guide in `TEST_TROUBLESHOOTING.md` for solutions to common problems.

### Support

- Check the requirements document: `.kiro/specs/comprehensive-testing-verification/requirements.md`
- Check the design document: `.kiro/specs/comprehensive-testing-verification/design.md`
- Review test module source code in `test/` directory
- Check browser console for detailed error messages

## Next Steps

After running tests:

1. Review the comprehensive test report
2. Address any failed tests or warnings
3. Verify requirement coverage is 100%
4. Run tests regularly to catch regressions
5. Update tests when requirements change
