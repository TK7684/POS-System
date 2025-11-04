# Load Testing and Performance Benchmarks

## Overview

This document describes the load testing and performance benchmark implementation for the POS System comprehensive testing suite. The implementation covers requirements 5.5, 5.6, 5.7, 5.8, 5.9, and 5.10.

## Requirements Coverage

### Requirement 5.5: Load Performance with 1000+ Records
Tests system performance with large datasets to ensure the application can handle substantial amounts of data without degradation.

**Tests Implemented:**
- Load 1000, 2000, and 5000 ingredient records
- Load 1000, 2000, and 5000 sales records with aggregation
- Render 100 items from large dataset (DOM manipulation)

**Performance Threshold:** < 1000ms for data loading and processing

### Requirement 5.6: Concurrent Operations
Tests the system's ability to handle multiple simultaneous operations without errors or performance degradation.

**Tests Implemented:**
- 5 concurrent API calls to different endpoints
- 10 concurrent cache operations (read/write/delete)

**Success Criteria:** At least 3 out of 5 API calls succeed, cache operations complete in < 50ms

### Requirement 5.7: Offline Mode Performance
Tests cached data loading performance to ensure smooth offline experience.

**Tests Implemented:**
- Load cached data (ingredients, menus, sales)
- Filter cached data with multiple criteria
- Process cached data for display

**Performance Threshold:** < 500ms for cached data operations

### Requirement 5.8: PWA Installation Performance
Tests Progressive Web App capabilities and installation performance.

**Tests Implemented:**
- Service worker registration check
- PWA manifest validation
- Cache storage API check

**Performance Threshold:** < 1000ms for service worker check, < 500ms for manifest load

### Requirement 5.9: Search Functionality Performance
Tests search performance with large datasets to ensure responsive user experience.

**Tests Implemented:**
- Simple text search across 1000 records
- Multi-criteria search (name, stock level, unit)
- Real-time search simulation (typing)
- Search with sorting

**Performance Threshold:** < 300ms for all search operations

### Requirement 5.10: Overall Performance Benchmarks
Comprehensive performance metrics and benchmarking across all test categories.

**Metrics Tracked:**
- Cache operation times (read, write, update, delete)
- API response times per endpoint
- Concurrent operation success rates
- Offline data loading times
- Search performance metrics

## Implementation Details

### Module Structure

```javascript
class PerformanceTestingModule {
  // Core test methods
  async testLoadPerformance()          // Req 5.5
  async testConcurrentOperations()     // Req 5.6
  async testOfflineMode()              // Req 5.7
  async testPWAInstallation()          // Req 5.8, 5.9
  async testSearchPerformance()        // Req 5.9, 5.10
  
  // Orchestration
  async runAllLoadTests()              // Run all tests
  
  // Helper methods
  generateTestIngredients(count)
  generateTestMenus(count)
  generateTestSales(count)
  makeApiCall(action, params)
  readSheetData(sheetName)
}
```

### Test Data Generation

The module includes helper methods to generate realistic test data:

- **Ingredients:** ID, name, stock unit, buy unit, ratio, min stock, current stock
- **Menus:** Menu ID, name, description, category, active status, price
- **Sales:** Date, platform, menu ID, quantity, price, gross, net, COGS, profit

### Performance Metrics

All tests track detailed performance metrics:

```javascript
{
  cache: {
    write: { duration, operations, avgPerOperation },
    read: { duration, operations, avgPerOperation },
    update: { duration, operations, avgPerOperation },
    delete: { duration, operations, avgPerOperation }
  },
  api: {
    [endpoint]: { avg, min, max }
  },
  concurrent: {
    api: { requests, successful, duration },
    cache: { operations, duration }
  },
  offline: {
    load: { duration, recordsLoaded },
    filter: { duration }
  },
  pwa: {
    serviceWorkerCheck: { duration, registered },
    manifest: { duration, valid },
    cacheStorage: { duration, cacheCount }
  },
  search: {
    simple: { duration, resultsFound },
    multiCriteria: { duration, resultsFound },
    realTime: { avgDuration, maxDuration, searches },
    withSorting: { duration, resultsFound }
  }
}
```

## Usage

### Running Tests

#### Option 1: HTML Test Runner

Open `test/test-load-performance.html` in a browser:

```html
<!-- Run all tests -->
<button onclick="runAllTests()">Run All Tests</button>

<!-- Run individual test categories -->
<button onclick="runLoadTest()">Test Load Performance</button>
<button onclick="runConcurrentTest()">Test Concurrent Operations</button>
<button onclick="runOfflineTest()">Test Offline Mode</button>
<button onclick="runPWATest()">Test PWA Installation</button>
<button onclick="runSearchTest()">Test Search Performance</button>
```

#### Option 2: Programmatic Usage

```javascript
// Initialize module
const performanceModule = new PerformanceTestingModule({
  apiUrl: 'https://your-api-url.com',
  timeout: 10000,
  cacheThreshold: 10,
  apiThreshold: 2000,
  sheetThreshold: 100,
  offlineThreshold: 500,
  searchThreshold: 300,
  pwaInstallThreshold: 3000
});

// Run all tests
const results = await performanceModule.runAllLoadTests();

// Run individual tests
const loadResults = await performanceModule.testLoadPerformance();
const concurrentResults = await performanceModule.testConcurrentOperations();
const offlineResults = await performanceModule.testOfflineMode();
const pwaResults = await performanceModule.testPWAInstallation();
const searchResults = await performanceModule.testSearchPerformance();
```

### Configuration Options

```javascript
{
  apiUrl: string,              // API endpoint URL
  timeout: number,             // Request timeout in ms (default: 10000)
  cacheThreshold: number,      // Cache operation threshold in ms (default: 10)
  apiThreshold: number,        // API response threshold in ms (default: 2000)
  sheetThreshold: number,      // Sheet access threshold in ms (default: 100)
  offlineThreshold: number,    // Offline operation threshold in ms (default: 500)
  searchThreshold: number,     // Search operation threshold in ms (default: 300)
  pwaInstallThreshold: number  // PWA install threshold in ms (default: 3000)
}
```

## Test Results Format

### Individual Test Result

```javascript
{
  testName: string,
  duration: number,
  threshold: number,
  passed: boolean,
  requirement: string,
  message: string,
  // Optional fields
  recordCount: number,
  resultsFound: number,
  error: string
}
```

### Category Result

```javascript
{
  passed: boolean,
  results: Array<TestResult>,
  summary: {
    total: number,
    passed: number,
    failed: number
  }
}
```

### Complete Test Suite Result

```javascript
{
  passed: boolean,
  timestamp: string,
  summary: {
    totalTests: number,
    passed: number,
    failed: number,
    warnings: number
  },
  results: {
    loadPerformance: CategoryResult,
    concurrentOperations: CategoryResult,
    offlineMode: CategoryResult,
    pwaInstallation: CategoryResult,
    searchPerformance: CategoryResult
  },
  performanceMetrics: PerformanceMetrics
}
```

## Performance Thresholds

| Test Category | Threshold | Requirement |
|--------------|-----------|-------------|
| Cache Operations | < 10ms | 5.1 |
| API Response | < 2000ms | 5.2, 5.4 |
| Sheet Access | < 100ms | 5.3 |
| Load Performance | < 1000ms | 5.5 |
| Concurrent Cache | < 50ms | 5.6 |
| Offline Data Load | < 500ms | 5.7 |
| Service Worker Check | < 1000ms | 5.8 |
| Manifest Load | < 500ms | 5.8 |
| Search Operations | < 300ms | 5.9 |

## Best Practices

### 1. Test Data Cleanup
All tests clean up after themselves by removing test data from localStorage:

```javascript
localStorage.removeItem('test_large_ingredients');
localStorage.removeItem('test_large_sales');
localStorage.removeItem('offline_test_data');
localStorage.removeItem('search_test_ingredients');
```

### 2. Error Handling
All tests include comprehensive error handling:

```javascript
try {
  // Test execution
  const result = await performTest();
  results.push({ passed: true, ...result });
} catch (error) {
  results.push({
    testName: 'Test Name',
    passed: false,
    error: error.message,
    requirement: '5.x'
  });
}
```

### 3. Performance Measurement
Use `performance.now()` for accurate timing:

```javascript
const startTime = performance.now();
// ... operation ...
const endTime = performance.now();
const duration = endTime - startTime;
```

### 4. Realistic Test Data
Generate realistic test data that mimics production scenarios:

```javascript
const sales = this.generateTestSales(count);
// Includes: date, platform, menu_id, qty, price, gross, net, cogs, profit
```

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out
- Check API URL configuration
- Verify network connectivity
- Increase timeout threshold

#### 2. Cache Tests Failing
- Clear browser cache and localStorage
- Check browser storage quota
- Verify localStorage is enabled

#### 3. PWA Tests Failing
- Ensure service worker is registered
- Check manifest.json exists and is valid
- Verify HTTPS or localhost environment

#### 4. Search Tests Slow
- Reduce test dataset size
- Check browser performance
- Verify no other heavy operations running

### Debug Mode

Enable detailed logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true');

// Module will log detailed information
console.log('Test execution details...');
```

## Integration with CI/CD

### Automated Testing

```javascript
// Example CI/CD integration
async function runCITests() {
  const module = new PerformanceTestingModule(config);
  const results = await module.runAllLoadTests();
  
  if (!results.passed) {
    console.error('Performance tests failed');
    process.exit(1);
  }
  
  console.log('All performance tests passed');
  process.exit(0);
}
```

### Performance Regression Detection

Track metrics over time to detect performance regressions:

```javascript
const historicalMetrics = loadHistoricalMetrics();
const currentMetrics = results.performanceMetrics;

if (currentMetrics.search.simple.duration > historicalMetrics.search.simple.duration * 1.2) {
  console.warn('Search performance degraded by 20%');
}
```

## Future Enhancements

1. **Memory Profiling:** Track memory usage during tests
2. **Network Throttling:** Test under various network conditions
3. **CPU Throttling:** Simulate low-end devices
4. **Visual Regression:** Screenshot comparison for UI tests
5. **Real User Monitoring:** Collect performance data from production

## References

- Requirements Document: `.kiro/specs/comprehensive-testing-verification/requirements.md`
- Design Document: `.kiro/specs/comprehensive-testing-verification/design.md`
- Tasks Document: `.kiro/specs/comprehensive-testing-verification/tasks.md`
- Performance Testing Module: `test/performance-testing-module.js`
- Test Runner: `test/test-load-performance.html`

## Support

For issues or questions:
1. Check this documentation
2. Review test results and error messages
3. Check browser console for detailed logs
4. Verify configuration settings
5. Ensure all dependencies are loaded
