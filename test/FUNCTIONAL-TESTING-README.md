# Functional Testing Module

## Overview

The Functional Testing Module provides comprehensive end-to-end testing for the POS System's core business functionality. It tests purchase flows, sales flows, menu management, stock management, and user permissions.

## Requirements Coverage

This module implements testing for the following requirements:

- **3.1**: Purchase recording with all fields
- **3.2**: Sales recording and calculations
- **3.3**: Menu CRUD operations
- **3.4**: Stock management
- **3.5**: Stock updates after purchases and sales
- **3.6**: Low stock alerts
- **3.7**: Cost calculation with latest prices
- **3.8**: Platform fee calculation
- **3.9**: FIFO lot tracking
- **3.10**: Role-based access control

## Features

### 1. Purchase Flow Testing
- Add purchase records with all required fields
- Validate stock updates after purchases
- Test lot creation and tracking
- Verify FIFO (First-In-First-Out) lot consumption

### 2. Sales Flow Testing
- Record sale transactions
- Verify calculations (gross, net, COGS, profit)
- Test platform fee calculations for different platforms
- Validate COGS calculation using FIFO

### 3. Menu Management Testing
- Create new menus
- Read/retrieve menu details
- Update menu information
- Add recipes to menus
- Calculate menu costs automatically
- Verify cost uses latest ingredient prices

### 4. Stock Management Testing
- Update stock levels after purchases
- Update stock levels after sales
- Identify low stock ingredients
- Generate low stock HTML alerts
- Test real-time stock updates

### 5. User Permissions Testing
- Test OWNER role (full access)
- Test PARTNER role (limited access)
- Test STAFF role (restricted access)
- Verify inactive users are denied access

## Usage

### Basic Usage

```javascript
// Initialize the module
const testModule = new FunctionalTestingModule({
  apiUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  timeout: 10000,
  retries: 3
});

// Run all tests
const report = await testModule.runAllTests();
console.log(report);
```

### Run Individual Test Categories

```javascript
// Test purchase flow
const purchaseResults = await testModule.testPurchaseFlow();

// Test sales flow
const salesResults = await testModule.testSalesFlow();

// Test menu management
const menuResults = await testModule.testMenuManagement();

// Test stock management
const stockResults = await testModule.testStockManagement();

// Test user permissions
const permissionResults = await testModule.testUserPermissions();
```

### Using the HTML Test Runner

1. Open `test-functional-module.html` in a web browser
2. Enter your API URL
3. Click "Run All Tests" or select individual test categories
4. View results with detailed pass/fail information

## Test Results Structure

```javascript
{
  timestamp: "2024-10-02T10:30:00.000Z",
  testCategories: [
    {
      name: "Purchase Flow",
      passed: true,
      results: [
        {
          testName: "Add purchase with all fields",
          passed: true,
          responseTime: 245.5,
          requirement: "3.1",
          message: "Purchase added successfully with lot_id: LOT123"
        }
      ],
      summary: {
        total: 4,
        passed: 4,
        failed: 0
      }
    }
  ],
  totalTests: 20,
  passed: 18,
  failed: 2,
  warnings: 0,
  successRate: "90.00",
  generatedAt: "2024-10-02T10:35:00.000Z"
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | string | '' | Google Apps Script API endpoint URL |
| `timeout` | number | 10000 | Request timeout in milliseconds |
| `retries` | number | 3 | Number of retry attempts for failed requests |

## Test Scenarios

### Purchase Flow Tests

1. **Add purchase with all fields**: Tests adding a complete purchase record
2. **Validate stock updates**: Verifies stock increases after purchase
3. **Verify lot creation**: Checks lot is created with correct details
4. **Test FIFO tracking**: Validates oldest lots are consumed first

### Sales Flow Tests

1. **Record sale transaction**: Tests basic sale recording
2. **Verify sale calculations**: Checks gross, net, COGS, and profit calculations
3. **Test platform fees**: Validates fee calculations for different platforms
4. **Verify COGS calculation**: Ensures COGS uses FIFO lot pricing

### Menu Management Tests

1. **Create new menu**: Tests menu creation
2. **Read menu details**: Verifies menu retrieval
3. **Update menu**: Tests menu modification
4. **Add recipe**: Tests adding ingredients to menu
5. **Calculate menu cost**: Verifies automatic cost calculation
6. **Verify latest prices**: Ensures costs reflect current ingredient prices

### Stock Management Tests

1. **Update stock after purchase**: Verifies stock increases
2. **Update stock after sale**: Verifies stock decreases
3. **Identify low stock**: Tests low stock detection
4. **Generate low stock HTML**: Validates alert generation
5. **Real-time updates**: Tests immediate stock updates

### User Permission Tests

1. **OWNER full access**: Verifies OWNER can perform all operations
2. **PARTNER limited access**: Tests PARTNER restrictions
3. **STAFF restricted access**: Validates STAFF limitations
4. **Inactive user denied**: Ensures inactive users cannot access system

## Error Handling

The module handles various error scenarios:

- **Network errors**: Timeout and connection failures
- **API errors**: Invalid responses and error statuses
- **Validation errors**: Missing or invalid parameters
- **Permission errors**: Unauthorized access attempts

## Best Practices

1. **Run tests in a test environment**: Don't run against production data
2. **Use test data**: Create dedicated test ingredients, menus, and users
3. **Clean up after tests**: Remove test data to avoid clutter
4. **Monitor performance**: Check response times stay within thresholds
5. **Review failures**: Investigate failed tests to identify issues

## Integration with Test Suite

This module integrates with the comprehensive test suite:

```javascript
// In comprehensive-test-suite.js
const functionalModule = new FunctionalTestingModule(config);
const results = await functionalModule.runAllTests();

// Include in overall report
testReport.functional = results;
```

## Troubleshooting

### Tests Timing Out

- Increase the `timeout` configuration value
- Check network connectivity
- Verify API endpoint is accessible

### Permission Tests Failing

- Ensure test users exist in Users sheet
- Verify user roles are correctly set
- Check active status of test users

### Stock Tests Failing

- Verify Stocks sheet exists and is accessible
- Check ingredient IDs match between sheets
- Ensure buy_to_stock_ratio is correctly configured

### FIFO Tests Failing

- Verify Lots sheet is properly maintained
- Check lot dates are in correct order
- Ensure lot quantities are being updated

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Include requirement references
3. Add descriptive test names and messages
4. Handle errors gracefully
5. Update this README with new test descriptions

## Related Modules

- **Sheet Verification Module**: Tests sheet structure and data integrity
- **API Testing Module**: Tests API endpoints and responses
- **Performance Testing Module**: Tests system performance metrics
- **Security Testing Module**: Tests authentication and authorization

## License

Part of the POS System Comprehensive Testing Suite
