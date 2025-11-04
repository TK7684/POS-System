# Data Integrity Module

## Overview

The Data Integrity Module validates data consistency and referential integrity across all Google Sheets in the POS system. It ensures that foreign key relationships are valid, calculated fields are accurate, required fields are populated, and data types are correct.

## Requirements Coverage

This module implements the following requirements from the specification:

- **4.1**: Validate ingredient_id references in Purchases, MenuRecipes
- **4.2**: Validate menu_id references in Sales, MenuRecipes, Batches
- **4.3**: Validate lot_id references in Purchases
- **4.4**: Validate user_key references across sheets
- **4.5**: Validate calculated fields (unit_price, net, profit)
- **4.6**: Identify missing required fields
- **4.7**: Validate required field completeness
- **4.8**: Find orphaned records with invalid references
- **4.9**: Validate numeric and date data types
- **4.10**: Generate comprehensive data integrity report

## Features

### 1. Referential Integrity Checks

Validates foreign key relationships across sheets:

- **Purchases → Ingredients**: Ensures all ingredient_id values exist
- **MenuRecipes → Ingredients**: Validates recipe ingredients
- **Sales → Menus**: Ensures all menu_id values exist
- **MenuRecipes → Menus**: Validates recipe menus
- **Batches → Menus**: Validates batch menus
- **Purchases → Lots**: Ensures all lot_id values exist
- **User References**: Validates user_key across multiple sheets

### 2. Calculation Validation

Verifies computed fields are calculated correctly:

**Purchases Sheet:**
- `unit_price = total_price ÷ qty_buy`
- `cost_per_stock = total_price ÷ qty_stock`

**Sales Sheet:**
- `gross = qty × price_per_unit`
- `net = qty × net_per_unit`
- `profit = net - cogs`

### 3. Required Fields Validation

Checks that required fields are populated:

- **Ingredients**: id, name
- **Menus**: menu_id, name
- **MenuRecipes**: menu_id, ingredient_id, qty_per_serve
- **Purchases**: date, ingredient_id, qty_buy, total_price
- **Sales**: date, platform, menu_id, qty, price_per_unit
- **Users**: user_key, role, name
- **Lots**: lot_id, ingredient_id, date

### 4. Orphaned Records Detection

Identifies records that reference non-existent entities, helping to clean up data inconsistencies.

### 5. Data Type Validation

Validates that:
- Numeric fields contain valid numbers
- Date fields contain valid dates
- Data types match expected formats

## Usage

### Basic Usage

```javascript
// Initialize the module
const integrityModule = new DataIntegrityModule({
  apiUrl: 'YOUR_API_URL',
  timeout: 10000
});

// Run all integrity checks
async function runAllChecks() {
  // Check referential integrity
  const refIntegrity = await integrityModule.checkReferentialIntegrity();
  console.log('Referential Integrity:', refIntegrity);
  
  // Validate calculations
  const calculations = await integrityModule.validateCalculations();
  console.log('Calculations:', calculations);
  
  // Validate required fields
  const requiredFields = await integrityModule.validateRequiredFields();
  console.log('Required Fields:', requiredFields);
  
  // Find orphaned records
  const orphans = await integrityModule.findOrphanedRecords();
  console.log('Orphaned Records:', orphans);
  
  // Validate data types
  const dataTypes = await integrityModule.validateDataTypes();
  console.log('Data Types:', dataTypes);
  
  // Get comprehensive report
  const report = integrityModule.getIntegrityReport();
  console.log('Integrity Report:', report);
}

runAllChecks();
```

### With Mock Data

```javascript
// Initialize with mock data for testing
const mockData = {
  'Ingredients': [
    { id: 'ING001', name: 'กุ้ง', stock_unit: 'กิโลกรัม', unit_buy: 'กิโลกรัม', buy_to_stock_ratio: 1, min_stock: 5 }
  ],
  'Purchases': [
    { date: '2024-01-01', ingredient_id: 'ING001', qty_buy: 10, total_price: 1000, unit_price: 100 }
  ]
};

const integrityModule = new DataIntegrityModule({
  mockData: mockData
});
```

## API Reference

### Constructor

```javascript
new DataIntegrityModule(config)
```

**Parameters:**
- `config.apiUrl` (string): API endpoint URL
- `config.timeout` (number): Request timeout in milliseconds
- `config.mockData` (object): Mock data for testing

### Methods

#### checkReferentialIntegrity()

Validates all foreign key relationships.

**Returns:** Promise<Object>
```javascript
{
  passed: boolean,
  results: Array,
  summary: {
    total: number,
    passed: number,
    failed: number
  }
}
```

#### validateCalculations()

Validates computed fields are calculated correctly.

**Returns:** Promise<Object>

#### validateRequiredFields()

Checks that required fields are populated.

**Returns:** Promise<Object>

#### findOrphanedRecords()

Identifies records with invalid foreign key references.

**Returns:** Promise<Object>

#### validateDataTypes()

Validates numeric and date data types.

**Returns:** Promise<Object>

#### getIntegrityReport()

Generates comprehensive integrity report with recommendations.

**Returns:** Object
```javascript
{
  timestamp: string,
  checksPerformed: Array,
  issues: Array,
  warnings: Array,
  summary: {
    totalChecks: number,
    passed: number,
    failed: number,
    warnings: number
  },
  passed: boolean,
  recommendations: Array
}
```

#### reset()

Resets all integrity results.

## Report Structure

### Issues

Issues are categorized by severity:

- **High**: Referential integrity violations, missing required fields
- **Medium**: Calculation errors, data type mismatches
- **Low**: Orphaned records

### Recommendations

The module provides actionable recommendations:

```javascript
{
  priority: 'high' | 'medium' | 'low',
  category: string,
  recommendation: string,
  affectedChecks: number
}
```

## Testing

To test the module:

1. Open `test-data-integrity.html` in a browser
2. Configure your API URL or use mock data
3. Click "Run All Checks" to execute all validations
4. Review the detailed report

## Integration

### With Test Suite

```javascript
// In comprehensive test suite
const integrityModule = new DataIntegrityModule(config);
const results = await integrityModule.checkReferentialIntegrity();

if (!results.passed) {
  console.error('Data integrity issues found:', results);
}
```

### Scheduled Validation

```javascript
// Run integrity checks daily
setInterval(async () => {
  const integrityModule = new DataIntegrityModule(config);
  const report = await runAllChecks();
  
  if (!report.passed) {
    sendAlertToAdmin(report);
  }
}, 24 * 60 * 60 * 1000); // Daily
```

## Best Practices

1. **Run regularly**: Schedule integrity checks to run daily or after bulk data imports
2. **Fix high-priority issues first**: Address referential integrity and missing required fields immediately
3. **Monitor trends**: Track integrity metrics over time to identify recurring issues
4. **Use in CI/CD**: Integrate checks into deployment pipeline
5. **Document exceptions**: If certain orphaned records are expected, document why

## Troubleshooting

### No data returned

- Verify API URL is correct
- Check that sheets exist and are accessible
- Ensure proper authentication

### False positives

- Check data type conversions (e.g., string vs number)
- Verify calculation tolerance settings
- Review empty value handling

### Performance issues

- Limit data fetching to recent records
- Use pagination for large datasets
- Cache sheet data when running multiple checks

## Future Enhancements

- Cross-sheet calculation validation
- Historical data integrity tracking
- Automated data repair suggestions
- Real-time integrity monitoring
- Integration with Google Sheets API for direct validation
