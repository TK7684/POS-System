# Performance Testing Module

## Overview

The Performance Testing Module provides comprehensive performance testing capabilities for the POS System. It tests various aspects of system performance including cache operations, API response times, sheet access, load handling, concurrent operations, offline mode, PWA capabilities, and search functionality.

## Requirements Coverage

This module implements the following requirements from the comprehensive testing specification:

- **5.1**: Cache performance - 10 operations should complete in < 10ms
- **5.2**: API response times - all responses should be < 2000ms
- **5.3**: Sheet access - read operations should be < 100ms
- **5.4**: API response time validation
- **5.5**: Load performance with 1000+ records
- **5.6**: Concurrent operations handling
- **5.7**: Offline mode - cached data loading < 500ms
- **5.8**: PWA installation performance < 3 seconds
- **5.9**: Search functionality performance < 300ms
- **5.10**: Performance benchmark report generation

## Features

### 1. Cache Performance Testing
Tests the performance of browser localStorage operations:
- **Write operations**: Measures time to write data to cache
- **Read operations**: Measures time to read data from cache
- **Update operations**: Measures time to update cached data
- **Delete operations**: Measures time to remove data from cache

**Threshold**: All operations should complete in < 10ms for 10 operations

### 2. API Response Time Testing
Tests the response times of all API endpoints:
- getBootstrapData
- searchIngredients
- getIngredientMap
- getReport
- getLowStockHTML

**Threshold**: All API responses should be < 2000ms

### 3. Sheet Access Testing
Tests the performance of reading data from Google Sheets:
- Ingredients sheet
- Menus sheet
- Sales sheet

**Threshold**: Read operations should complete in < 100ms

### 4. Load Performance Testing
Tests system performance with large datasets:
- Loading 1000, 2000, and 5000 records
- Processing and filtering large datasets
- Rendering performance with large datasets

**Threshold**: Operations should complete in < 1000ms

### 5. Concurrent Operations Testing
Tests the system's ability to handle multiple simultaneous operations:
- Concurrent API calls (5 simultaneous requests)
- Concurrent cache operations
- Concurrent data processing

**Threshold**: At least 3 out of 5 concurrent API calls should succeed

### 6. Offline Mode Testing
Tests performance when working offline with cached data:
- Loading cached data
- Searching in cached data
- Filtering and aggregating cached data

**Threshold**: Cached data loading should be < 500ms

### 7. PWA Installation Testing
Tests Progressive Web App capabilities:
- Service worker registration check
- Cache API performance
- IndexedDB performance

**Threshold**: Service worker check should complete in < 1000ms

### 8. Search Performance Testing
Tests search functionality performance:
- Simple text search
- Fuzzy search with Levenshtein distance
- Multi-field search

**Threshold**: Search operations should complete in < 300ms

## Usage

### Basic Usage

```javascript
// Initialize the module
const performanceTests = new PerformanceTestingModule({
  apiUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  timeout: 10000
});

// Run all tests
const results = await performanceTests.runAllTests();
console.log('Overall passed:', results.passed);
console.log('Summary:', results.summary);
```

### Running Individual Test Categories

```javascript
// Test cache performance
const cacheResults = await performanceTests.testCachePerformance();

// Test API response times
const apiResults = await performanceTests.testAPIResponseTimes();

// Test sheet access
const sheetResults = await performanceTests.testSheetAccess();

// Test load performance
const loadResults = await performanceTests.testLoadPerformance();

// Test concurrent operations
const concurrentResults = await performanceTests.testConcurrentOperations();

// Test offline mode
const offlineResults = await performanceTests.testOfflineMode();

// Test PWA installation
const pwaResults = await performanceTests.testPWAInstallation();

// Test search performance
const searchResults = await performanceTests.testSearchPerformance();
```

### Configuration Options

```javascript
const config = {
  apiUrl: '',                    // API endpoint URL
  timeout: 10000,                // Request timeout in ms
  cacheThreshold: 10,            // Cache operations threshold (ms)
  apiThreshold: 2000,            // API response threshold (ms)
  sheetThreshold: 100,           // Sheet access threshold (ms)
  offlineThreshold: 500,         // Offline mode threshold (ms)
  searchThreshold: 300,          // Search operations threshold (ms)
  pwaInstallThreshold: 3000      // PWA installation threshold (ms)
};

const performanceTests = new PerformanceTestingModule(config);
```

### Getting Performance Report

```javascript
// Run tests
await performanceTests.runAllTests();

// Get detailed report
const report = performanceTests.getPerformanceReport();

console.log('Timestamp:', report.timestamp);
console.log('Summary:', report.summary);
console.log('Performance Metrics:', report.performanceMetrics);
console.log('Overall Metrics:', report.overallMetrics);
```

## Test Results Structure

Each test returns results in the following format:

```javascript
{
  passed: boolean,              // Overall pass/fail status
  results: [                    // Array of individual test results
    {
      testName: string,         // Name of the test
      duration: number,         // Time taken in ms
      threshold: number,        // Performance threshold
      passed: boolean,          // Test pass/fail status
      requirement: string,      // Requirement ID (e.g., '5.1')
      message: string,          // Descriptive message
      // Additional test-specific fields
    }
  ],
  summary: {
    total: number,              // Total number of tests
    passed: number,             // Number of passed tests
    failed: number              // Number of failed tests
  }
}
```

## HTML Test Runner

The module includes an HTML test runner (`test-performance-module.html`) that provides:

- Visual interface for running tests
- Configuration options for API URL and timeout
- Individual test category buttons
- Real-time results display with color-coded pass/fail indicators
- Summary statistics
- Detailed metrics for each test

### Using the HTML Test Runner

1. Open `test-performance-module.html` in a web browser
2. Configure the API URL and timeout settings
3. Click on individual test buttons or "Run All Tests"
4. View results with detailed metrics and pass/fail status

## Performance Metrics

The module tracks the following performance metrics:

### Cache Metrics
- Average write time per operation
- Average read time per operation
- Average update time per operation
- Average delete time per operation

### API Metrics
- Average response time per endpoint
- Minimum response time
- Maximum response time

### Sheet Access Metrics
- Duration for each sheet read
- Record count per sheet

### Load Performance Metrics
- Time to load different dataset sizes
- Processing time for large datasets

### Concurrent Operations Metrics
- Number of successful concurrent requests
- Total duration for concurrent operations

### Offline Mode Metrics
- Cached data loading time
- Search performance in cached data
- Aggregation performance

### PWA Metrics
- Service worker check duration
- Cache API operation time
- IndexedDB operation time

### Search Metrics
- Simple search duration
- Fuzzy search duration
- Multi-field search duration

## Best Practices

1. **Run tests in a consistent environment**: Performance can vary based on browser, device, and network conditions
2. **Test with realistic data volumes**: Use data sizes similar to production
3. **Run tests multiple times**: Average results over multiple runs for more accurate measurements
4. **Monitor trends**: Track performance metrics over time to identify degradation
5. **Set appropriate thresholds**: Adjust thresholds based on your specific requirements
6. **Test on target devices**: Run tests on the actual devices your users will use

## Troubleshooting

### Tests Failing Due to API Unavailability
- Ensure the API URL is correctly configured
- Check that the API is accessible from your test environment
- Verify network connectivity

### Cache Tests Failing
- Check browser localStorage availability
- Ensure sufficient storage space
- Clear cache and try again

### Performance Thresholds Not Met
- Consider the device capabilities (mobile vs desktop)
- Check for background processes affecting performance
- Review and optimize code if consistently failing
- Adjust thresholds if they're unrealistic for your environment

## Integration with CI/CD

The module can be integrated into automated testing pipelines:

```javascript
// Example: Node.js test script
const PerformanceTestingModule = require('./performance-testing-module');

async function runTests() {
  const tests = new PerformanceTestingModule({
    apiUrl: process.env.API_URL,
    timeout: 10000
  });
  
  const results = await tests.runAllTests();
  
  if (!results.passed) {
    console.error('Performance tests failed!');
    process.exit(1);
  }
  
  console.log('All performance tests passed!');
  process.exit(0);
}

runTests();
```

## Future Enhancements

Potential improvements for future versions:

1. **Memory profiling**: Track memory usage during tests
2. **Network throttling**: Simulate different network conditions
3. **Visual regression**: Compare rendering performance
4. **Custom metrics**: Allow defining custom performance metrics
5. **Historical tracking**: Store and compare results over time
6. **Automated alerts**: Notify when performance degrades
7. **Device-specific thresholds**: Different thresholds for mobile/desktop

## Related Modules

- **Sheet Verification Module**: Tests sheet structure and data integrity
- **API Testing Module**: Tests API functionality and error handling
- **Functional Testing Module**: Tests business logic and workflows
- **Data Integrity Module**: Validates data consistency

## Support

For issues or questions about the Performance Testing Module:

1. Check the test results for specific error messages
2. Review the configuration settings
3. Consult the main testing documentation
4. Check browser console for additional error details
