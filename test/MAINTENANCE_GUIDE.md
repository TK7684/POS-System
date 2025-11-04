# Test Infrastructure Maintenance Guide

## Overview

This guide provides instructions for maintaining the comprehensive test infrastructure over time. It covers updating tests when requirements change, managing test data, interpreting results, and ensuring long-term reliability.

## Regular Maintenance Tasks

### Daily Tasks

**1. Review Test Results**
- Check latest test run status
- Review any failures or warnings
- Verify success rate meets threshold (>95%)
- Check performance metrics

**2. Monitor Test Execution**
- Verify scheduled tests are running
- Check execution time trends
- Monitor resource usage
- Review error logs

**3. Address Failures**
- Investigate failed tests
- Determine if failure is test or system issue
- Create tickets for system issues
- Update tests if needed

### Weekly Tasks

**1. Analyze Test Trends**
- Review success rate trends
- Identify flaky tests
- Check performance degradation
- Review requirement coverage

**2. Update Test Data**
- Refresh test fixtures if needed
- Clean up old test data
- Verify test data integrity
- Update test scenarios

**3. Review Test Reports**
- Analyze comprehensive reports
- Identify patterns in failures
- Review performance trends
- Check requirement traceability

### Monthly Tasks

**1. Test Infrastructure Review**
- Review test configuration
- Update thresholds based on trends
- Optimize slow tests
- Remove obsolete tests

**2. Documentation Update**
- Update test documentation
- Document new test scenarios
- Update troubleshooting guide
- Review deployment procedures

**3. Capacity Planning**
- Review storage usage for reports
- Check test execution time trends
- Plan for scaling if needed
- Archive old reports

### Quarterly Tasks

**1. Comprehensive Review**
- Full audit of test coverage
- Review all test modules
- Update test strategy
- Plan improvements

**2. Performance Optimization**
- Identify and optimize slow tests
- Review resource usage
- Optimize test data
- Improve test execution speed

**3. Security Review**
- Review test user permissions
- Update security test scenarios
- Audit access to test infrastructure
- Review sensitive data handling

## Updating Tests When Requirements Change

### Process for Requirement Changes

**Step 1: Identify Impact**

When a requirement changes:

1. Review the requirement document:
   ```
   .kiro/specs/comprehensive-testing-verification/requirements.md
   ```

2. Identify affected tests:
   ```bash
   # Search for requirement references
   grep -r "Requirements: X.Y" test/
   ```

3. List all test modules that need updates:
   - Sheet Verification (if sheet structure changes)
   - API Testing (if endpoints change)
   - Functional Testing (if business logic changes)
   - Data Integrity (if data relationships change)
   - Security (if permissions change)

**Step 2: Update Requirements Document**

1. Open requirements document
2. Update the specific requirement
3. Update acceptance criteria
4. Document the change date and reason
5. Commit changes to version control

**Step 3: Update Design Document**

1. Open design document:
   ```
   .kiro/specs/comprehensive-testing-verification/design.md
   ```

2. Update affected sections
3. Update component interfaces if needed
4. Update data models if needed
5. Document design decisions

**Step 4: Update Test Implementation**

Follow this checklist for each affected test module:

```markdown
## Test Update Checklist

### For Sheet Verification Module
- [ ] Update sheet structure expectations
- [ ] Update column mapping validations
- [ ] Update data type validations
- [ ] Update sample data expectations
- [ ] Test the updated module

### For API Testing Module
- [ ] Update endpoint definitions
- [ ] Update parameter validations
- [ ] Update expected response fields
- [ ] Update error handling tests
- [ ] Test the updated module

### For Functional Testing Module
- [ ] Update business flow tests
- [ ] Update calculation validations
- [ ] Update permission tests
- [ ] Update integration tests
- [ ] Test the updated module

### For Data Integrity Module
- [ ] Update referential integrity checks
- [ ] Update calculation validations
- [ ] Update required field checks
- [ ] Update orphaned record detection
- [ ] Test the updated module

### For Other Modules
- [ ] Review and update as needed
- [ ] Test the updated module
```

**Step 5: Update Test Configuration**

If thresholds or expectations change:

1. Edit `test/comprehensive-test-config.js`
2. Update relevant thresholds
3. Update test categories if needed
4. Document the changes
5. Test with new configuration

**Step 6: Update Test Documentation**

1. Update TEST_GUIDE.md with new test scenarios
2. Update TEST_CONFIGURATION.md if config changed
3. Update TEST_TROUBLESHOOTING.md with new issues
4. Update requirement traceability matrix

**Step 7: Validate Changes**

1. Run affected test modules individually
2. Run full test suite
3. Verify all tests pass
4. Review test reports
5. Check requirement coverage

### Example: Adding a New API Endpoint

**Scenario:** New endpoint `getInventoryReport` is added

**Step 1: Update Requirements**

Add to requirements.md:
```markdown
7. WHEN testing getInventoryReport endpoint THEN the system SHALL return inventory data with stock levels, values, and alerts
```

**Step 2: Update API Testing Module**

Edit `test/api-testing-module.js`:

```javascript
// Add new test case
async testGetInventoryReport() {
  const testName = 'Get Inventory Report';
  console.log(`Testing: ${testName}`);
  
  try {
    const params = {
      action: 'getInventoryReport',
      dateRange: '30days'
    };
    
    const response = await this.makeAPICall(params);
    
    // Validate response
    const assertions = [
      {
        description: 'Response has success status',
        expected: 'success',
        actual: response.status,
        passed: response.status === 'success'
      },
      {
        description: 'Response contains inventory data',
        expected: 'array',
        actual: typeof response.inventory,
        passed: Array.isArray(response.inventory)
      },
      {
        description: 'Inventory items have required fields',
        expected: true,
        actual: this.validateInventoryFields(response.inventory),
        passed: this.validateInventoryFields(response.inventory)
      }
    ];
    
    return {
      testName,
      status: assertions.every(a => a.passed) ? 'passed' : 'failed',
      assertions,
      responseTime: response.responseTime
    };
    
  } catch (error) {
    return {
      testName,
      status: 'failed',
      error: error.message
    };
  }
}

validateInventoryFields(inventory) {
  return inventory.every(item => 
    item.hasOwnProperty('ingredient_id') &&
    item.hasOwnProperty('stock_level') &&
    item.hasOwnProperty('stock_value') &&
    item.hasOwnProperty('alert_status')
  );
}
```

**Step 3: Update Test Configuration**

Add to `test/comprehensive-test-config.js`:

```javascript
apiEndpoints: [
  // ... existing endpoints
  {
    action: 'getInventoryReport',
    params: { dateRange: '30days' },
    expectedFields: ['inventory', 'summary', 'alerts'],
    timeout: 3000
  }
]
```

**Step 4: Update Documentation**

Add to TEST_GUIDE.md:
```markdown
8. WHEN testing getInventoryReport endpoint THEN the system SHALL return inventory data with stock levels, values, and alerts
```

**Step 5: Test and Validate**

```javascript
// Run API tests
const apiModule = new APITestingModule(config.environment.apiUrl);
const results = await apiModule.testAllEndpoints();
console.log(results);
```

### Example: Modifying Sheet Structure

**Scenario:** Adding a new column `discount_rate` to Sales sheet

**Step 1: Update Requirements**

Update requirement 1.2 in requirements.md to include new column

**Step 2: Update Sheet Verification Module**

Edit `test/sheet-verification-module.js`:

```javascript
// Update column mappings
const SHEET_STRUCTURE = {
  Sales: {
    requiredColumns: [
      'sale_id',
      'date',
      'platform',
      'menu_id',
      'qty',
      'price',
      'discount_rate',  // NEW COLUMN
      'gross',
      'fee_percent',
      'fee',
      'net',
      'cogs',
      'profit'
    ],
    dataTypes: {
      sale_id: 'number',
      date: 'date',
      platform: 'string',
      menu_id: 'number',
      qty: 'number',
      price: 'number',
      discount_rate: 'number',  // NEW COLUMN
      gross: 'number',
      fee_percent: 'number',
      fee: 'number',
      net: 'number',
      cogs: 'number',
      profit: 'number'
    }
  }
};
```

**Step 3: Update Functional Tests**

Update sales flow tests to include discount calculations:

```javascript
async testSalesFlowWithDiscount() {
  // Test sale with discount
  const saleData = {
    platform: 'Grab',
    menu_id: 1,
    qty: 2,
    price: 100,
    discount_rate: 0.1  // 10% discount
  };
  
  const result = await this.recordSale(saleData);
  
  // Validate discount calculation
  const expectedGross = saleData.qty * saleData.price * (1 - saleData.discount_rate);
  const assertions = [
    {
      description: 'Gross amount includes discount',
      expected: expectedGross,
      actual: result.gross,
      passed: Math.abs(result.gross - expectedGross) < 0.01
    }
  ];
  
  return { testName: 'Sales Flow with Discount', assertions };
}
```

**Step 4: Update Data Integrity Module**

Add validation for discount_rate:

```javascript
async validateDiscountRates() {
  const sales = await this.getSheetData('Sales');
  const issues = [];
  
  sales.forEach((sale, index) => {
    if (sale.discount_rate < 0 || sale.discount_rate > 1) {
      issues.push({
        row: index + 2,
        issue: 'Invalid discount rate',
        value: sale.discount_rate,
        expected: 'Between 0 and 1'
      });
    }
  });
  
  return {
    testName: 'Discount Rate Validation',
    status: issues.length === 0 ? 'passed' : 'failed',
    issues
  };
}
```

## Test Data Management

### Test Data Lifecycle

**1. Creation**
- Create test data programmatically
- Use realistic but anonymized data
- Ensure data relationships are valid
- Document test data scenarios

**2. Maintenance**
- Update test data when requirements change
- Refresh stale test data
- Add new test scenarios
- Remove obsolete test data

**3. Cleanup**
- Clean up after each test run
- Archive old test data
- Remove temporary test records
- Reset test environment

### Test Data Best Practices

**1. Use Test Fixtures**

Maintain test data in `test/test-fixtures.js`:

```javascript
const TestFixtures = {
  ingredients: [
    {
      id: 1,
      name: 'Test Ingredient 1',
      stock_unit: 'kg',
      unit_buy: 'kg',
      buy_to_stock_ratio: 1,
      min_stock: 10,
      current_stock: 50,
      unit_price: 100
    },
    // More test ingredients
  ],
  
  menus: [
    {
      menu_id: 1,
      name: 'Test Menu 1',
      description: 'Test menu item',
      category: 'Main',
      active: true,
      price: 150
    },
    // More test menus
  ],
  
  // More test data
};
```

**2. Isolate Test Data**

- Use separate test spreadsheet
- Prefix test data with "TEST_"
- Use specific test user accounts
- Mark test records clearly

**3. Automate Test Data Setup**

Create setup script:

```javascript
async function setupTestData() {
  console.log('Setting up test data...');
  
  // Clear existing test data
  await clearTestData();
  
  // Create test ingredients
  for (const ingredient of TestFixtures.ingredients) {
    await createIngredient(ingredient);
  }
  
  // Create test menus
  for (const menu of TestFixtures.menus) {
    await createMenu(menu);
  }
  
  // Create test users
  for (const user of TestFixtures.users) {
    await createUser(user);
  }
  
  console.log('Test data setup complete');
}
```

**4. Cleanup After Tests**

```javascript
async function cleanupTestData() {
  console.log('Cleaning up test data...');
  
  // Delete test records
  await deleteTestRecords('Purchases', 'WHERE supplier_note LIKE "TEST_%"');
  await deleteTestRecords('Sales', 'WHERE platform = "TEST"');
  
  // Reset test user states
  await resetTestUsers();
  
  // Clear test cache
  await clearTestCache();
  
  console.log('Cleanup complete');
}
```

### Managing Test Data Growth

**1. Archive Old Test Data**

```javascript
async function archiveOldTestData() {
  const archiveDate = new Date();
  archiveDate.setDate(archiveDate.getDate() - 90);  // 90 days ago
  
  // Export old test data
  const oldData = await getTestDataBefore(archiveDate);
  await exportToArchive(oldData, `test-data-archive-${archiveDate.toISOString()}.json`);
  
  // Delete archived data
  await deleteTestDataBefore(archiveDate);
  
  console.log(`Archived test data older than ${archiveDate}`);
}
```

**2. Rotate Test Reports**

```javascript
async function rotateTestReports() {
  const reportsDir = 'test/reports';
  const maxReports = 100;
  
  // Get all report files
  const reports = await getReportFiles(reportsDir);
  
  // Sort by date
  reports.sort((a, b) => b.timestamp - a.timestamp);
  
  // Keep only latest maxReports
  if (reports.length > maxReports) {
    const toDelete = reports.slice(maxReports);
    for (const report of toDelete) {
      await deleteFile(report.path);
    }
    console.log(`Deleted ${toDelete.length} old reports`);
  }
}
```

## Interpreting Test Results and Taking Action

### Understanding Test Results

**1. Success Rate Analysis**

```
Success Rate >= 98%: Excellent
- System is functioning optimally
- No immediate action needed
- Continue monitoring

Success Rate 95-98%: Good
- System is functioning well
- Minor issues present
- Review warnings and address non-critical issues

Success Rate 90-95%: Fair
- Several issues present
- Requires attention
- Investigate failures and create action plan

Success Rate < 90%: Poor
- Significant issues
- Immediate action required
- Escalate to development team
```

**2. Performance Metrics**

```
All metrics green: Excellent
- Performance meets all thresholds
- No optimization needed

Some metrics yellow: Acceptable
- Performance close to thresholds
- Monitor trends
- Plan optimization if degrading

Any metrics red: Action Required
- Performance below thresholds
- Investigate bottlenecks
- Optimize or adjust thresholds
```

**3. Requirement Coverage**

```
Coverage 100%: Complete
- All requirements tested
- Maintain coverage

Coverage 95-99%: Nearly Complete
- Identify gaps
- Add missing tests

Coverage < 95%: Incomplete
- Significant gaps
- Prioritize adding tests
```

### Action Matrix

| Issue Type | Severity | Action | Timeline |
|------------|----------|--------|----------|
| API endpoint failure | Critical | Investigate immediately, notify team | < 1 hour |
| Data integrity issue | Critical | Investigate immediately, fix data | < 2 hours |
| Security vulnerability | Critical | Investigate immediately, patch | < 4 hours |
| Performance degradation | High | Investigate, optimize | < 1 day |
| Functional test failure | High | Investigate, fix or update test | < 1 day |
| Flaky test | Medium | Investigate, stabilize test | < 3 days |
| Documentation gap | Low | Update documentation | < 1 week |
| Test optimization | Low | Optimize when convenient | < 1 month |

### Response Procedures

**For Critical Failures (Success Rate < 90%)**

1. **Immediate Response**
   ```
   - Stop any deployments
   - Notify development team
   - Review failed tests
   - Check system status
   ```

2. **Investigation**
   ```
   - Identify root cause
   - Determine if system or test issue
   - Check recent changes
   - Review error logs
   ```

3. **Resolution**
   ```
   - Fix system issues
   - Update tests if needed
   - Re-run tests
   - Verify resolution
   ```

4. **Follow-up**
   ```
   - Document incident
   - Update runbook
   - Prevent recurrence
   - Review with team
   ```

**For Performance Issues**

1. **Identify Bottleneck**
   ```javascript
   // Review performance test results
   const perfResults = testResults.categories.find(c => c.name === 'Performance');
   const slowTests = perfResults.tests.filter(t => t.duration > threshold);
   console.log('Slow tests:', slowTests);
   ```

2. **Analyze Trends**
   ```javascript
   // Compare with historical data
   const history = await getTestHistory();
   const perfTrend = history.map(h => ({
     date: h.timestamp,
     avgDuration: h.categories.performance.avgDuration
   }));
   console.log('Performance trend:', perfTrend);
   ```

3. **Optimize**
   ```
   - Optimize slow queries
   - Add caching
   - Reduce data volume
   - Parallelize operations
   ```

4. **Verify Improvement**
   ```
   - Re-run performance tests
   - Compare results
   - Update thresholds if needed
   ```

**For Flaky Tests**

1. **Identify Flaky Tests**
   ```javascript
   // Track test stability
   function identifyFlakyTests(history) {
     const testResults = {};
     
     history.forEach(run => {
       run.tests.forEach(test => {
         if (!testResults[test.name]) {
           testResults[test.name] = { passed: 0, failed: 0 };
         }
         if (test.status === 'passed') {
           testResults[test.name].passed++;
         } else {
           testResults[test.name].failed++;
         }
       });
     });
     
     // Flaky if passes sometimes and fails sometimes
     const flakyTests = Object.entries(testResults)
       .filter(([name, results]) => results.passed > 0 && results.failed > 0)
       .map(([name, results]) => ({
         name,
         stability: results.passed / (results.passed + results.failed)
       }));
     
     return flakyTests;
   }
   ```

2. **Stabilize Tests**
   ```
   - Add proper waits/delays
   - Improve test isolation
   - Fix race conditions
   - Add retry logic for network operations
   ```

3. **Monitor Stability**
   ```
   - Track test results over time
   - Verify stability improves
   - Remove from flaky list when stable
   ```

## Continuous Improvement

### Monthly Review Process

**1. Collect Metrics**
```javascript
async function collectMonthlyMetrics() {
  const lastMonth = await getTestHistory(30);
  
  return {
    avgSuccessRate: calculateAverage(lastMonth.map(r => r.successRate)),
    avgDuration: calculateAverage(lastMonth.map(r => r.duration)),
    totalRuns: lastMonth.length,
    failureRate: calculateFailureRate(lastMonth),
    flakyTests: identifyFlakyTests(lastMonth),
    performanceTrends: analyzePerformanceTrends(lastMonth),
    requirementCoverage: calculateCoverage(lastMonth[0])
  };
}
```

**2. Analyze Trends**
- Success rate trends
- Performance trends
- Failure patterns
- Test execution time
- Resource usage

**3. Identify Improvements**
- Tests to optimize
- Tests to add
- Tests to remove
- Configuration to adjust
- Documentation to update

**4. Create Action Plan**
- Prioritize improvements
- Assign owners
- Set deadlines
- Track progress

### Optimization Strategies

**1. Reduce Test Execution Time**
```javascript
// Parallelize independent tests
async function runTestsInParallel(tests) {
  const results = await Promise.all(
    tests.map(test => test.run())
  );
  return results;
}

// Cache expensive operations
const cache = new Map();
async function getCachedData(key, fetchFn) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = await fetchFn();
  cache.set(key, data);
  return data;
}
```

**2. Improve Test Reliability**
```javascript
// Add retry logic
async function runWithRetry(testFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await testFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * Math.pow(2, i));  // Exponential backoff
    }
  }
}

// Add proper waits
async function waitForCondition(condition, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) return true;
    await delay(100);
  }
  return false;
}
```

**3. Enhance Test Coverage**
```javascript
// Identify untested code paths
function analyzeTestCoverage(requirements, tests) {
  const coveredRequirements = new Set();
  
  tests.forEach(test => {
    test.requirements.forEach(req => coveredRequirements.add(req));
  });
  
  const uncovered = requirements.filter(req => !coveredRequirements.has(req));
  
  return {
    coverage: (coveredRequirements.size / requirements.length) * 100,
    uncovered
  };
}
```

## Troubleshooting Common Maintenance Issues

### Issue: Tests Becoming Slower Over Time

**Diagnosis:**
```javascript
// Analyze test duration trends
const history = await getTestHistory(90);
const durationTrend = history.map(h => ({
  date: h.timestamp,
  duration: h.duration
}));
console.log('Duration trend:', durationTrend);
```

**Solutions:**
1. Optimize slow tests
2. Clean up test data
3. Add caching
4. Parallelize tests
5. Upgrade infrastructure

### Issue: Increasing Failure Rate

**Diagnosis:**
```javascript
// Analyze failure patterns
const failures = history.flatMap(h => 
  h.tests.filter(t => t.status === 'failed')
);
const failuresByTest = groupBy(failures, 'testName');
console.log('Most common failures:', failuresByTest);
```

**Solutions:**
1. Fix flaky tests
2. Update tests for requirement changes
3. Improve test isolation
4. Fix system issues
5. Update test data

### Issue: Test Reports Growing Too Large

**Solutions:**
1. Implement report rotation
2. Archive old reports
3. Reduce screenshot capture
4. Compress reports
5. Use external storage

### Issue: Test Environment Drift

**Diagnosis:**
```javascript
// Compare test and production environments
async function compareEnvironments() {
  const testEnv = await getEnvironmentInfo('test');
  const prodEnv = await getEnvironmentInfo('production');
  
  return {
    sheetStructureDiff: compareSheetStructures(testEnv, prodEnv),
    dataDiff: compareDataVolumes(testEnv, prodEnv),
    configDiff: compareConfigurations(testEnv, prodEnv)
  };
}
```

**Solutions:**
1. Sync test environment with production
2. Update test data
3. Update configuration
4. Document differences
5. Automate environment sync

## Best Practices

### 1. Version Control
- Commit all test changes
- Use meaningful commit messages
- Tag releases
- Maintain changelog

### 2. Documentation
- Keep documentation up to date
- Document all changes
- Maintain runbooks
- Share knowledge with team

### 3. Communication
- Notify team of test changes
- Share test results regularly
- Escalate issues promptly
- Conduct regular reviews

### 4. Automation
- Automate repetitive tasks
- Use CI/CD for testing
- Automate reporting
- Automate cleanup

### 5. Monitoring
- Monitor test health
- Track trends
- Set up alerts
- Review regularly

## Maintenance Schedule Template

```markdown
# Test Infrastructure Maintenance Schedule

## Daily (Automated)
- [ ] Run scheduled tests
- [ ] Review test results
- [ ] Check for failures
- [ ] Monitor performance

## Weekly (Manual)
- [ ] Review test trends
- [ ] Update test data
- [ ] Address failures
- [ ] Review reports

## Monthly (Manual)
- [ ] Infrastructure review
- [ ] Documentation update
- [ ] Capacity planning
- [ ] Optimization

## Quarterly (Manual)
- [ ] Comprehensive review
- [ ] Performance optimization
- [ ] Security review
- [ ] Strategy update
```

## Getting Help

For issues not covered in this guide:
1. Check TEST_TROUBLESHOOTING.md
2. Review test module source code
3. Check browser console for errors
4. Review test execution logs
5. Contact development team

## Next Steps

1. Set up maintenance schedule
2. Assign maintenance responsibilities
3. Create monitoring dashboard
4. Establish review process
5. Document team-specific procedures

For deployment procedures, see `DEPLOYMENT_GUIDE.md`.
For troubleshooting, see `TEST_TROUBLESHOOTING.md`.
