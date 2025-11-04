# Sheet Verification Module

## Overview

The Sheet Verification Module validates Google Sheets structure, column mappings, and data types for the POS System. It ensures all 21 required sheets exist with correct column names and data types as documented in `SHEET_STRUCTURE_REFERENCE.md`.

## Requirements Coverage

- **Requirement 1.1**: Validates that all 21 required sheets exist
- **Requirement 1.2**: Verifies column names match SHEET_STRUCTURE_REFERENCE.md
- **Requirement 1.3**: Validates data types (numeric, date, text, boolean)
- **Requirement 1.4**: Generates comprehensive sheet mapping report
- **Requirement 1.5**: Extracts sample data and calculates statistics

## Features

### 1. Sheet Existence Verification
- Checks all 21 required sheets: Ingredients, Menus, MenuRecipes, Purchases, Sales, Users, CostCenters, Packaging, Lots, Platforms, Stocks, LaborLogs, Waste, MarketRuns, MarketRunItems, Packing, PackingPurchases, Overheads, MenuExtras, BatchCostLines, Batches
- Reports missing sheets with severity levels

### 2. Column Mapping Validation
- Verifies expected columns exist in each sheet
- Identifies missing required columns
- Detects extra columns not in specification
- Provides detailed column-by-column comparison

### 3. Data Type Validation
- Validates numeric columns (prices, quantities, ratios)
- Validates date columns (dates, timestamps)
- Validates text columns (names, descriptions, notes)
- Validates boolean columns (active flags)
- Reports invalid data with row numbers

### 4. Sheet Mapping Report
- Generates comprehensive mapping of all sheets
- Includes column information (name, index, data type, required status)
- Identifies foreign key relationships
- Calculates statistics (row counts, null counts, unique values)
- Maps relationships between sheets

## Usage

### Basic Usage

```javascript
// Initialize the module
const verifier = new SheetVerificationModule({
  apiUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  timeout: 10000
});

// Verify all sheets
const result = await verifier.verifyAllSheets();
console.log('Verification passed:', result.passed);
console.log('Summary:', result.summary);

// Get detailed report
const report = verifier.getVerificationReport();
console.log('Full report:', report);
```

### Verify Individual Sheet

```javascript
// Verify specific sheet structure
const sheetResult = await verifier.verifySheetStructure('Ingredients');
console.log('Sheet exists:', sheetResult.exists);
console.log('Status:', sheetResult.status);
console.log('Issues:', sheetResult.issues);
```

### Verify Column Mappings

```javascript
// Verify columns match expected structure
const actualColumns = ['id', 'name', 'stock_unit', 'unit_buy', 'buy_to_stock_ratio', 'min_stock'];
const columnResult = await verifier.verifyColumnMappings('Ingredients', actualColumns);
console.log('Matched:', columnResult.matched);
console.log('Missing:', columnResult.missing);
console.log('Extra:', columnResult.extra);
```

### Verify Data Types

```javascript
// Verify data types in sample data
const sampleData = [
  { id: 'ING0001', name: 'กุ้ง', min_stock: 5 },
  { id: 'ING0002', name: 'ข้าวสวย', min_stock: 100 }
];
const typeResult = await verifier.verifyDataTypes('Ingredients', sampleData);
console.log('Validations passed:', typeResult.validationsPassed);
console.log('Validations failed:', typeResult.validationsFailed);
```

### Generate Sheet Map

```javascript
// Generate comprehensive mapping report
const sheetMap = await verifier.generateSheetMap();
console.log('Total sheets:', sheetMap.totalSheets);
console.log('Total columns:', sheetMap.statistics.totalColumns);
console.log('Relationships:', sheetMap.relationships);
```

## Testing

Open `test-sheet-verification.html` in a browser to run interactive tests:

1. **Run All Tests**: Executes all verification tests
2. **Test Verify All Sheets**: Tests sheet existence verification
3. **Test Sheet Structure**: Tests individual sheet structure validation
4. **Test Column Mappings**: Tests column mapping verification
5. **Test Data Types**: Tests data type validation
6. **Test Generate Sheet Map**: Tests comprehensive mapping generation

## Output Format

### Verification Result

```javascript
{
  passed: true,
  results: [
    {
      sheetName: 'Ingredients',
      exists: true,
      columns: [...],
      rowCount: 150,
      issues: [],
      warnings: [],
      status: 'passed'
    }
  ],
  summary: {
    totalSheets: 21,
    sheetsFound: 21,
    sheetsMissing: 0,
    totalColumns: 150,
    columnsMatched: 150,
    columnsMissing: 0
  }
}
```

### Sheet Map

```javascript
{
  timestamp: '2024-10-02T10:30:00.000Z',
  totalSheets: 21,
  sheets: [
    {
      name: 'Ingredients',
      columns: [
        {
          name: 'id',
          index: 0,
          dataType: 'text',
          required: true,
          foreignKey: null
        }
      ],
      sampleData: [...],
      statistics: {
        rowCount: 150,
        columnCount: 6,
        nullCounts: { id: 0, name: 0 },
        uniqueCounts: { id: 150, name: 148 }
      }
    }
  ],
  relationships: [
    {
      fromSheet: 'Purchases',
      fromColumn: 'ingredient_id',
      toSheet: 'Ingredients',
      toColumn: 'id',
      type: 'many-to-one'
    }
  ],
  statistics: {
    totalColumns: 150,
    totalSheets: 21,
    sheetsWithData: 15,
    averageColumnsPerSheet: 7.14
  }
}
```

## Integration

The module can be integrated into:

1. **Automated Test Suite**: Run as part of CI/CD pipeline
2. **Manual Testing**: Use HTML test interface for manual verification
3. **Monitoring Dashboard**: Display verification status in real-time
4. **Deployment Validation**: Verify sheet structure before deployment

## Error Handling

The module handles various error scenarios:

- **Missing Sheets**: Reports as critical issues
- **Missing Columns**: Reports as issues with requirement references
- **Invalid Data Types**: Reports with row numbers and reasons
- **API Errors**: Catches and reports connection/timeout errors

## Future Enhancements

- Real API integration for fetching actual sheet data
- Performance optimization for large datasets
- Visual diff for column changes
- Automated fix suggestions
- Historical comparison of sheet structures
