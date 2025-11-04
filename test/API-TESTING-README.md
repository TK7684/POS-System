# API Testing Module

## Overview

The API Testing Module provides comprehensive testing for all POS System API endpoints, including functionality validation, error handling, parameter validation, input validation, and performance measurement.

## Requirements Coverage

This module implements the following requirements from the specification:

- **2.1**: Test getBootstrapData endpoint
- **2.2**: Test searchIngredients endpoint
- **2.3**: Test getIngredientMap endpoint
- **2.4**: Test addPurchase endpoint with parameter validation
- **2.5**: Test addSale endpoint with parameter validation
- **2.6**: Test getReport endpoint
- **2.7**: Test getLowStockHTML endpoint
- **2.8**: Test error handling for invalid actions
- **2.9**: Test parameter validation and missing parameters
- **2.10**: Test response times and timeout handling

## Files

- `test/api-testing-module.js` - Main API testing module class
- `test/test-api-module.html` - Interactive test runner UI
- `test/API-TESTING-README.md` - This documentation file

## Usage

### Using the Interactive Test Runner

1. Open `test/test-api-module.html` in a web browser
2. Enter your API URL in the configuration field
3. Click one of the test buttons:
   - **Run All Endpoint Tests** - Tests all 7 API endpoints
   - **Test Error Handling** - Tests invalid actions and error responses
   - **Test Parameter Validation** - Tests missing required parameters
   - **Test Input Validation** - Tests invalid data types and values
   - **Test Response Times** - Tests performance and timeout handling

### Programmatic Usage

```javascript
// Initialize the API tester
const apiTester = new APITestingModule({
  apiUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  timeout: 10000,
  retries: 3
});

// Test all endpoints
const allResults = await apiTester.testAllEndpoints();
console.log('All tests:', allResults);

// Test specific endpoint
const endpoint = {
  action: 'getBootstrapData',
  requiredParams: [],
  expectedFields: ['status', 'data', 'timestamp']
};
const result = await apiTester.testEndpoint(endpoint);
console.log('Endpoint test:', result);

// Test error handling
const errorResults = await apiTester.testErrorHandling();
console.log('Error handling:', errorResults);

// Test parameter validation
const paramResults = await apiTester.testParameterValidation();
console.log('Parameter validation:', paramResults);

// Test input validation
const inputResults = await apiTester.testInputValidation();
console.log('Input validation:', inputResults);

// Test response times
const timeResults = await apiTester.testResponseTimeAndTimeout();
console.log('Response times:', timeResults);

// Get comprehensive report
const report = apiTester.getAPITestReport();
console.log('Full report:', report);
```

## API Endpoints Tested

### 1. getBootstrapData
- **Method**: GET
- **Required Parameters**: None
- **Expected Response**: ingredients map, timestamp, version
- **Requirement**: 2.1

### 2. searchIngredients
- **Method**: GET
- **Required Parameters**: query
- **Optional Parameters**: limit
- **Expected Response**: data array, count
- **Requirement**: 2.2

### 3. getIngredientMap
- **Method**: GET
- **Required Parameters**: None
- **Expected Response**: ingredient map object
- **Requirement**: 2.3

### 4. addPurchase
- **Method**: POST
- **Required Parameters**: ingredient_id, qtyBuy, totalPrice
- **Optional Parameters**: date, unit, unitPrice, supplierNote, actualYield
- **Expected Response**: status, message, lot_id
- **Requirement**: 2.4

### 5. addSale
- **Method**: POST
- **Required Parameters**: platform, menu_id, qty, price
- **Optional Parameters**: date
- **Expected Response**: status, message
- **Requirement**: 2.5

### 6. getReport
- **Method**: GET
- **Required Parameters**: type
- **Optional Parameters**: startDate, endDate
- **Expected Response**: status, data
- **Requirement**: 2.6

### 7. getLowStockHTML
- **Method**: GET
- **Required Parameters**: None
- **Expected Response**: status, html
- **Requirement**: 2.7

## Test Categories

### Endpoint Functionality Tests
Tests that each endpoint:
- Returns proper response structure
- Includes all expected fields
- Returns success status for valid requests
- Processes parameters correctly

### Error Handling Tests
Tests that the API:
- Returns error status for invalid actions
- Provides list of available actions
- Returns error for missing required parameters
- Includes specific parameter names in error messages
- Handles timeouts gracefully
- Returns properly formatted error responses with timestamps

### Parameter Validation Tests
Tests that the API:
- Validates required parameters for addPurchase
- Validates required parameters for addSale
- Returns specific error messages for missing parameters
- Identifies which parameters are missing

### Input Validation Tests
Tests that the API:
- Validates numeric fields (qtyBuy, totalPrice, qty, price)
- Handles invalid data types appropriately
- Rejects empty string parameters
- Validates negative numbers
- Sanitizes user input

### Response Time Tests
Tests that the API:
- Responds within 2000ms threshold (Requirement 2.10)
- Implements timeout mechanism correctly
- Measures response times accurately
- Identifies slowest and fastest endpoints

## Test Results

### Result Structure

```javascript
{
  passed: boolean,           // Overall pass/fail status
  results: [                 // Individual test results
    {
      endpoint: string,      // Endpoint name
      status: string,        // 'passed', 'failed', 'warning', 'error'
      responseTime: number,  // Response time in milliseconds
      assertions: [          // Individual assertions
        {
          description: string,
          passed: boolean,
          message: string
        }
      ],
      error: string          // Error message if failed
    }
  ],
  summary: {
    total: number,           // Total tests run
    passed: number,          // Tests passed
    failed: number,          // Tests failed
    warnings: number         // Tests with warnings
  },
  averageResponseTime: number,
  slowestEndpoint: object,
  fastestEndpoint: object
}
```

## Performance Metrics

The module tracks:
- Response time for each endpoint
- Average response time across all endpoints
- Slowest endpoint (highest response time)
- Fastest endpoint (lowest response time)
- Timeout handling effectiveness

## Configuration Options

```javascript
{
  apiUrl: string,      // API endpoint URL (required)
  timeout: number,     // Request timeout in ms (default: 10000)
  retries: number      // Number of retries for failed requests (default: 3)
}
```

## Best Practices

1. **Test in Isolation**: Run tests against a test environment, not production
2. **Use Test Data**: Use dedicated test data that can be safely modified
3. **Monitor Performance**: Track response times over time to identify degradation
4. **Automate Testing**: Integrate into CI/CD pipeline for continuous validation
5. **Review Failures**: Investigate all test failures promptly
6. **Update Tests**: Keep tests synchronized with API changes

## Troubleshooting

### Tests Timing Out
- Check API URL is correct and accessible
- Verify network connectivity
- Increase timeout value in configuration
- Check if API server is running

### All Tests Failing
- Verify API URL is correct
- Check CORS configuration on API
- Ensure API is deployed and accessible
- Review browser console for errors

### Specific Endpoint Failing
- Check endpoint implementation in Apps Script
- Verify required parameters are correct
- Review API logs for errors
- Test endpoint manually with curl or Postman

### Performance Issues
- Check API server resources
- Review database query performance
- Optimize data processing logic
- Consider caching strategies

## Integration with Comprehensive Test Suite

This module is part of the larger comprehensive testing framework. It can be integrated with:

- Sheet Verification Module
- Functional Testing Module
- Data Integrity Module
- Performance Testing Module
- Security Testing Module

See `test/INFRASTRUCTURE-SUMMARY.md` for overall testing architecture.

## Future Enhancements

- Add authentication testing
- Implement rate limiting tests
- Add load testing capabilities
- Support for batch endpoint testing
- Enhanced error categorization
- Automated regression detection
- Performance trend analysis
- Test data generation utilities

## Support

For issues or questions:
1. Check this documentation
2. Review test results and error messages
3. Check browser console for detailed errors
4. Review API logs in Google Apps Script
5. Consult the main testing documentation

## Version History

- **v1.0** - Initial implementation with all 7 endpoints
  - Basic endpoint testing
  - Error handling tests
  - Parameter validation
  - Input validation
  - Response time measurement
