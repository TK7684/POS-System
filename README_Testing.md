# Cost-POS System Testing Guide

This guide explains how to use the mock data and testing functions to validate your Cost-POS system.

## Files Created

1. **MockData.gs.js** - Contains all mock data and data population functions
2. **TestRunner.gs.js** - Contains test execution functions
3. **README_Testing.md** - This guide

## Quick Start

### 1. Populate Mock Data
Run this function to populate your spreadsheet with realistic test data:

```javascript
populateAllMockData()
```

This will create:
- 10 ingredients (กุ้งสด, ข้าวสวย, พริกขี้หนู, etc.)
- 7 menu items (กุ้งแซ่บ, ส้มตำไทย, ลาบหมู, etc.)
- 30 days of purchase history
- 30 days of sales data
- Labor logs, waste records, and more

### 2. Run Quick Test
Test all basic functions:

```javascript
quickTest()
```

### 3. Run Full System Test
Comprehensive testing with performance metrics:

```javascript
fullSystemTest()
```

## Available Test Functions

### Data Population
- `populateAllMockData()` - Populate all sheets with mock data
- `populateIngredients()` - Populate ingredients sheet only
- `populateMenus()` - Populate menus sheet only
- `populatePurchases()` - Populate purchases sheet only
- `populateSales()` - Populate sales sheet only
- `cleanupMockData()` - Remove all mock data

### Testing Functions
- `quickTest()` - Basic function testing
- `testAllFunctions()` - Test all system functions
- `testIndividualFunctions()` - Test specific functions
- `performanceBenchmark()` - Performance testing
- `dataValidationTest()` - Data integrity validation
- `runCompleteSystemTest()` - Full system test

### Test Reports
- `generateTestReport()` - Generate comprehensive test report
- `runAllTests()` - Run all tests and generate report

## Mock Data Details

### Ingredients (10 items)
- กุ้งสด, ข้าวสวย, พริกขี้หนู, กระเทียม, หอมแดง
- มะนาว, น้ำปลา, น้ำตาล, ผักกะหล่ำ, แครอท
- Realistic units and conversion ratios

### Menus (7 items)
- กุ้งแซ่บ (120฿), ส้มตำไทย (80฿), ลาบหมู (90฿)
- ข้าวผัดกุ้ง (100฿), ต้มยำกุ้ง (150฿)
- น้ำมะนาว (25฿), น้ำส้ม (30฿)

### Sales Data (30 days)
- 5-20 sales per day across different platforms
- Line Man, Food Panda, Grab Food, Shopee Food
- Realistic platform commissions

### Purchase Data (30 days)
- 1-3 purchases per day
- Various suppliers and realistic pricing
- FIFO lot tracking

## Testing Scenarios

### 1. Basic Functionality
- Add purchases
- Calculate menu costs
- Generate reports
- Check low stock

### 2. Advanced Features
- Labor cost tracking
- Waste management
- User permissions
- Platform analysis

### 3. Performance Testing
- Cache performance
- Report generation speed
- Sheet access optimization
- Memory usage

### 4. Data Validation
- Data integrity checks
- Required field validation
- Business rule validation
- Consistency checks

## Example Usage

```javascript
// 1. Set up test data
populateAllMockData();

// 2. Test a specific function
const menuCost = calculateMenuCost({
  menu_id: 'MENU001',
  targetGP: 60
});
console.log('Menu cost:', menuCost);

// 3. Generate a report
const report = getReport({
  from: '2024-01-01',
  to: '2024-01-31',
  granularity: 'day'
});
console.log('Report rows:', report.rows.length);

// 4. Check performance
const perfTest = performanceBenchmark();
console.log('Performance:', perfTest);

// 5. Clean up when done
cleanupMockData();
```

## Expected Results

### Successful Test Output
- ✅ Mock data populated successfully
- ✅ All functions tested without errors
- ✅ Performance benchmarks within acceptable ranges
- ✅ Data validation passed

### Performance Benchmarks
- Cache performance: < 10ms for 10 iterations
- Report generation: < 1000ms for 30 days of data
- Sheet access: < 100ms for typical operations

## Troubleshooting

### Common Issues
1. **Sheet not found errors** - Run `populateAllMockData()` first
2. **Permission errors** - Ensure user has proper roles in Users sheet
3. **Cache issues** - Run `_clearCache()` to reset cache
4. **Data inconsistencies** - Run `cleanupMockData()` then `populateAllMockData()`

### Debug Functions
- `testSheetAccess()` - Check sheet availability
- `debugSheetStructure()` - Examine sheet structure
- `checkUserPermissions()` - Verify user permissions

## Next Steps

After running tests:
1. Review test results in console
2. Fix any failing tests
3. Optimize performance if needed
4. Add custom test scenarios
5. Integrate with your actual data

## Customization

You can modify the mock data in `MockData.gs.js`:
- Add more ingredients
- Create new menu items
- Adjust pricing and quantities
- Add new test scenarios

The system is designed to be flexible and easily customizable for your specific needs.
