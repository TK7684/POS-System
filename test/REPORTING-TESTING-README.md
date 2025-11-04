# Reporting Testing Module

## Overview

The Reporting Testing Module validates the accuracy of all reporting and analytics features in the POS system. It ensures that reports generate correct data, calculations are accurate, and export functionality works as expected.

## Features

- ✅ Daily, weekly, and monthly report testing
- ✅ Platform analysis with fee calculations
- ✅ Menu performance ranking validation
- ✅ Ingredient usage tracking
- ✅ Cost trend analysis
- ✅ Profit margin calculations
- ✅ Export functionality testing
- ✅ Comprehensive test reporting

## Quick Start

### 1. Using the HTML Test Runner

The easiest way to run tests is using the interactive HTML test runner:

```bash
# Open in your browser
open test/test-reporting-module.html
```

**Steps:**
1. Enter your API URL
2. Click "Run All Tests" or select individual test categories
3. View results with expandable categories
4. Check summary statistics

### 2. Using JavaScript

```javascript
// Import the module
const ReportingTestingModule = require('./reporting-testing-module.js');

// Initialize
const reportingTests = new ReportingTestingModule({
  apiUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  timeout: 10000
});

// Run all tests
const results = await reportingTests.runAllReportingTests();
console.log('Test Results:', results);

// Check if all tests passed
if (results.passed) {
  console.log('✅ All tests passed!');
} else {
  console.log('❌ Some tests failed');
  console.log('Issues:', results.issues);
}
```

### 3. Running Individual Test Categories

```javascript
// Test daily reports
const dailyResults = await reportingTests.testDailyReports();

// Test weekly reports
const weeklyResults = await reportingTests.testWeeklyReports();

// Test monthly reports
const monthlyResults = await reportingTests.testMonthlyReports();

// Test platform analysis
const platformResults = await reportingTests.testPlatformAnalysis();

// Test menu performance
const menuResults = await reportingTests.testMenuPerformance();

// Test ingredient usage
const ingredientResults = await reportingTests.testIngredientUsage();

// Test cost trends
const costResults = await reportingTests.testCostTrends();

// Test profit margins
const marginResults = await reportingTests.testProfitMargins();

// Test export functionality
const exportResults = await reportingTests.testExportFunctionality();
```

## Test Categories

### 1. Daily Reports
Tests daily sales, costs, and profit calculations.

**What it tests:**
- Report retrieval from API
- Data structure validation
- Sales accuracy
- Cost accuracy
- Profit calculation (Sales - Costs)

**Requirements:** 10.1

### 2. Weekly Reports
Tests 7-day aggregation of sales data.

**What it tests:**
- Weekly report retrieval
- 7-day period validation
- Aggregated totals
- Date range accuracy

**Requirements:** 10.2

### 3. Monthly Reports
Tests 30-day aggregation of sales data.

**What it tests:**
- Monthly report retrieval
- 30-day period validation
- Aggregated totals
- Reasonability checks

**Requirements:** 10.3

### 4. Platform Analysis
Tests sales breakdown by delivery platform.

**What it tests:**
- Platform data retrieval
- Fee calculations (0-30% of sales)
- Net sales (Sales - Fees)
- Multi-platform aggregation

**Requirements:** 10.4

### 5. Menu Performance
Tests menu item ranking by sales and profit.

**What it tests:**
- Performance data retrieval
- Sales volume ranking
- Profit calculations
- Performance metrics

**Requirements:** 10.5

### 6. Ingredient Usage
Tests ingredient consumption tracking.

**What it tests:**
- Usage data retrieval
- Consumption calculations
- Unit tracking
- Usage patterns

**Requirements:** 10.6

### 7. Cost Trends
Tests ingredient price changes over time.

**What it tests:**
- Trend data retrieval
- Price change calculations
- Historical comparisons
- Trend analysis

**Requirements:** 10.7

### 8. Profit Margins
Tests profit margin calculations per menu item.

**What it tests:**
- Margin data retrieval
- Margin formula: (Sales - Cost) / Sales × 100
- Accuracy validation
- Per-item calculations

**Requirements:** 10.8

### 9. Export Functionality
Tests report export capabilities.

**What it tests:**
- Excel export availability
- PDF export availability
- CSV export availability
- Data format validation

**Requirements:** 10.9

## Configuration

### Constructor Options

```javascript
const config = {
  apiUrl: 'https://your-api-url.com',  // Required: API endpoint
  timeout: 10000                        // Optional: Request timeout in ms (default: 10000)
};

const reportingTests = new ReportingTestingModule(config);
```

### API Requirements

Your API must support the `getReport` action with the following parameters:

**Daily Reports:**
```javascript
{
  action: 'getReport',
  type: 'daily',
  date: '2024-01-01'
}
```

**Weekly Reports:**
```javascript
{
  action: 'getReport',
  type: 'weekly',
  startDate: '2024-01-01',
  endDate: '2024-01-07'
}
```

**Monthly Reports:**
```javascript
{
  action: 'getReport',
  type: 'monthly',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
}
```

**Platform Analysis:**
```javascript
{
  action: 'getReport',
  type: 'platform_analysis'
}
```

**Menu Performance:**
```javascript
{
  action: 'getReport',
  type: 'menu_performance'
}
```

**Ingredient Usage:**
```javascript
{
  action: 'getReport',
  type: 'ingredient_usage'
}
```

**Cost Trends:**
```javascript
{
  action: 'getReport',
  type: 'cost_trends'
}
```

**Profit Margins:**
```javascript
{
  action: 'getReport',
  type: 'profit_margins'
}
```

### Expected Response Format

```javascript
{
  status: 'success',
  data: {
    // Report-specific data
  },
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

## Test Results

### Result Structure

```javascript
{
  passed: true,              // Overall pass/fail
  results: [                 // Array of category results
    {
      category: 'Daily Reports',
      passed: true,
      results: [             // Individual test results
        {
          testName: 'Daily report retrieval',
          passed: true,
          message: 'Daily report retrieved successfully',
          requirement: '10.1',
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      ],
      summary: {
        total: 5,
        passed: 5,
        failed: 0
      }
    }
  ],
  summary: {
    total: 45,
    passed: 43,
    failed: 2,
    warnings: 0,
    successRate: '95.56'
  },
  issues: [
    {
      category: 'Export Functionality',
      severity: 'high',
      message: '2 test(s) failed in Export Functionality'
    }
  ]
}
```

### Interpreting Results

**Success Rate:**
- 100%: All tests passed ✅
- 90-99%: Minor issues ⚠️
- 80-89%: Significant issues ⚠️
- <80%: Critical issues ❌

**Issue Severity:**
- `critical`: Test execution failed
- `high`: Test assertion failed
- `medium`: Warning or partial failure
- `low`: Minor issue or recommendation

## Examples

### Example 1: Basic Test Execution

```javascript
const reportingTests = new ReportingTestingModule({
  apiUrl: 'https://script.google.com/macros/s/ABC123/exec'
});

const results = await reportingTests.runAllReportingTests();

console.log(`Total Tests: ${results.summary.total}`);
console.log(`Passed: ${results.summary.passed}`);
console.log(`Failed: ${results.summary.failed}`);
console.log(`Success Rate: ${results.summary.successRate}%`);
```

### Example 2: Testing Specific Categories

```javascript
// Test only daily and weekly reports
const dailyResults = await reportingTests.testDailyReports();
const weeklyResults = await reportingTests.testWeeklyReports();

if (dailyResults.passed && weeklyResults.passed) {
  console.log('✅ Time-based reports are working correctly');
} else {
  console.log('❌ Issues found in time-based reports');
}
```

### Example 3: Handling Failures

```javascript
const results = await reportingTests.runAllReportingTests();

if (!results.passed) {
  console.log('Test failures detected:');
  
  results.issues.forEach(issue => {
    console.log(`- [${issue.severity}] ${issue.category}: ${issue.message}`);
  });
  
  // Get detailed results for failed categories
  results.results.forEach(category => {
    if (!category.passed) {
      console.log(`\nFailed tests in ${category.category}:`);
      category.results
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.testName}: ${test.error || test.message}`);
        });
    }
  });
}
```

### Example 4: Continuous Monitoring

```javascript
// Run tests every hour
setInterval(async () => {
  const results = await reportingTests.runAllReportingTests();
  
  if (!results.passed) {
    // Send alert
    sendAlert({
      subject: 'Reporting Tests Failed',
      message: `${results.summary.failed} tests failed`,
      details: results.issues
    });
  }
  
  // Log results
  logTestResults(results);
}, 3600000); // 1 hour
```

## Troubleshooting

### Common Issues

**1. API URL not configured**
```
Error: API URL not configured
```
**Solution:** Provide apiUrl in constructor config

**2. Request timeout**
```
Error: Request timeout after 10000ms
```
**Solution:** Increase timeout or check API availability

**3. Invalid response format**
```
Error: Response is not a valid object
```
**Solution:** Ensure API returns proper JSON format

**4. Missing required fields**
```
Error: Missing expected fields: sales, costs, profit
```
**Solution:** Check API response includes all required fields

### Debug Mode

Enable detailed logging:

```javascript
// Add console logging
const originalMakeApiCall = reportingTests.makeApiCall;
reportingTests.makeApiCall = async function(...args) {
  console.log('API Call:', args);
  const result = await originalMakeApiCall.apply(this, args);
  console.log('API Response:', result);
  return result;
};
```

## Best Practices

1. **Run tests regularly** - Schedule automated test runs
2. **Monitor success rate** - Track trends over time
3. **Investigate failures** - Don't ignore failed tests
4. **Test in staging first** - Validate before production
5. **Keep API updated** - Ensure compatibility with tests
6. **Review test results** - Check for patterns in failures
7. **Document issues** - Track known problems and fixes

## Integration

### With Comprehensive Test Suite

```javascript
// In comprehensive-test-suite.js
const reportingModule = new ReportingTestingModule(config);
const reportingResults = await reportingModule.runAllReportingTests();

// Add to overall results
allResults.reporting = reportingResults;
```

### With CI/CD Pipeline

```yaml
# .github/workflows/test.yml
- name: Run Reporting Tests
  run: |
    node -e "
    const ReportingTestingModule = require('./test/reporting-testing-module.js');
    const tests = new ReportingTestingModule({ apiUrl: process.env.API_URL });
    tests.runAllReportingTests().then(results => {
      if (!results.passed) process.exit(1);
    });
    "
```

## Requirements Traceability

| Test Method | Requirements | Description |
|-------------|--------------|-------------|
| testDailyReports() | 10.1 | Daily sales, costs, profit |
| testWeeklyReports() | 10.2 | 7-day aggregation |
| testMonthlyReports() | 10.3 | 30-day aggregation |
| testPlatformAnalysis() | 10.4 | Platform breakdown |
| testMenuPerformance() | 10.5 | Menu ranking |
| testIngredientUsage() | 10.6 | Consumption calculation |
| testCostTrends() | 10.7 | Price changes |
| testProfitMargins() | 10.8 | Margin calculations |
| testExportFunctionality() | 10.9 | Export capabilities |
| runAllReportingTests() | 10.1-10.10 | All reporting tests |

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test results for specific error messages
3. Verify API configuration and availability
4. Check requirements documentation

## License

Part of the POS System Comprehensive Testing Suite
