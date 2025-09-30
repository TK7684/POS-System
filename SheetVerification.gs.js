/**
 * Comprehensive Sheet Verification for Cost-POS System
 * This function checks all sheets and provides detailed counts
 */

/**
 * Get comprehensive sheet verification with exact counts
 * @return {Object} Detailed verification results
 */
function getComprehensiveSheetVerification() {
  console.log('🔍 Starting comprehensive sheet verification...');
  
  const results = {
    timestamp: nowStr(),
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1qb5_R0JhLINnU7KL3q7hFpGWT0m7OCU1sBMZ8hdUs14/edit',
    sheets: {},
    summary: {
      totalSheets: 0,
      populatedSheets: 0,
      emptySheets: 0,
      errorSheets: 0,
      totalRows: 0
    }
  };
  
  // Define all expected sheets with their details
  const expectedSheets = [
    {
      name: 'Ingredients',
      sheetName: SHEET_ING,
      expectedMin: 10,
      description: 'Raw materials and ingredients'
    },
    {
      name: 'Menus',
      sheetName: SHEET_MENU,
      expectedMin: 7,
      description: 'Menu items and pricing'
    },
    {
      name: 'Menu Recipes',
      sheetName: SHEET_MENU_RECIPES,
      expectedMin: 15,
      description: 'Bill of materials for each menu'
    },
    {
      name: 'Users',
      sheetName: SHEET_USERS,
      expectedMin: 4,
      description: 'User accounts and permissions'
    },
    {
      name: 'Cost Centers',
      sheetName: SHEET_COST_CENTERS,
      expectedMin: 3,
      description: 'Labor cost centers'
    },
    {
      name: 'Purchases',
      sheetName: SHEET_PUR,
      expectedMin: 50,
      description: 'Ingredient purchase records'
    },
    {
      name: 'Sales',
      sheetName: SHEET_SALE,
      expectedMin: 100,
      description: 'Sales transactions'
    },
    {
      name: 'COGS',
      sheetName: SHEET_COGS,
      expectedMin: 20,
      description: 'Cost of goods sold'
    },
    {
      name: 'Labor Logs',
      sheetName: SHEET_LABOR,
      expectedMin: 30,
      description: 'Labor time tracking'
    },
    {
      name: 'Waste',
      sheetName: SHEET_WASTE,
      expectedMin: 10,
      description: 'Waste and spoilage records'
    },
    {
      name: 'Packaging',
      sheetName: SHEET_PACKAGING,
      expectedMin: 4,
      description: 'Packaging materials catalog'
    },
    {
      name: 'Market Runs',
      sheetName: SHEET_MARKET_RUNS,
      expectedMin: 3,
      description: 'Market shopping trips'
    },
    {
      name: 'Market Run Items',
      sheetName: SHEET_MARKET_RUN_ITEMS,
      expectedMin: 6,
      description: 'Items purchased in market runs'
    },
    {
      name: 'Packaging Purchases',
      sheetName: SHEET_PACKING_PURCHASES,
      expectedMin: 4,
      description: 'Packaging material purchases'
    },
    {
      name: 'Overheads',
      sheetName: SHEET_OVERHEADS,
      expectedMin: 3,
      description: 'Overhead cost configuration'
    },
    {
      name: 'Menu Extras',
      sheetName: SHEET_MENU_EXTRAS,
      expectedMin: 5,
      description: 'Additional menu items'
    },
    {
      name: 'Batches',
      sheetName: SHEET_BATCHES,
      expectedMin: 3,
      description: 'Production batches'
    },
    {
      name: 'Batch Cost Lines',
      sheetName: SHEET_BATCH_COST_LINES,
      expectedMin: 5,
      description: 'Detailed batch cost breakdown'
    }
  ];
  
  try {
    // Check each sheet
    expectedSheets.forEach(sheetInfo => {
      try {
        const {rows, idx, sh} = byHeader(sheetInfo.sheetName);
        const rowCount = rows.length;
        const isPopulated = rowCount >= sheetInfo.expectedMin;
        const isEmpty = rowCount === 0;
        
        // Get sample data for verification
        const sampleData = rows.length > 0 ? rows.slice(0, 3) : [];
        const headers = Object.keys(idx);
        
        results.sheets[sheetInfo.name] = {
          sheetName: sheetInfo.sheetName,
          description: sheetInfo.description,
          rowCount: rowCount,
          expectedMin: sheetInfo.expectedMin,
          isPopulated: isPopulated,
          isEmpty: isEmpty,
          status: isEmpty ? '❌ Empty' : isPopulated ? '✅ Populated' : '⚠️ Insufficient',
          headers: headers,
          sampleData: sampleData,
          lastModified: sh ? sh.getLastRow() : 'Unknown'
        };
        
        results.summary.totalSheets++;
        results.summary.totalRows += rowCount;
        
        if (isEmpty) {
          results.summary.emptySheets++;
        } else if (isPopulated) {
          results.summary.populatedSheets++;
        } else {
          results.summary.emptySheets++; // Count as empty if insufficient
        }
        
      } catch (error) {
        results.sheets[sheetInfo.name] = {
          sheetName: sheetInfo.sheetName,
          description: sheetInfo.description,
          error: error.message,
          status: '❌ Error',
          rowCount: 0
        };
        
        results.summary.totalSheets++;
        results.summary.errorSheets++;
      }
    });
    
    // Calculate overall status
    results.summary.overallStatus = results.summary.emptySheets === 0 && results.summary.errorSheets === 0 
      ? '✅ All sheets populated successfully' 
      : `⚠️ ${results.summary.emptySheets} empty sheets, ${results.summary.errorSheets} errors`;
    
    // Generate detailed report
    results.detailedReport = generateDetailedReport(results);
    
    console.log('=== COMPREHENSIVE SHEET VERIFICATION COMPLETE ===');
    console.log('Overall Status:', results.summary.overallStatus);
    console.log('Total Sheets:', results.summary.totalSheets);
    console.log('Populated Sheets:', results.summary.populatedSheets);
    console.log('Empty Sheets:', results.summary.emptySheets);
    console.log('Error Sheets:', results.summary.errorSheets);
    console.log('Total Rows:', results.summary.totalRows);
    
    return results;
    
  } catch (error) {
    console.error('❌ Comprehensive verification failed:', error);
    return {
      status: 'error',
      message: 'Comprehensive verification failed',
      error: error.toString()
    };
  }
}

/**
 * Generate detailed report from verification results
 * @param {Object} results - Verification results
 * @return {Object} Detailed report
 */
function generateDetailedReport(results) {
  const report = {
    populatedSheets: [],
    emptySheets: [],
    errorSheets: [],
    recommendations: []
  };
  
  Object.entries(results.sheets).forEach(([name, sheet]) => {
    if (sheet.status === '✅ Populated') {
      report.populatedSheets.push({
        name: name,
        rowCount: sheet.rowCount,
        expectedMin: sheet.expectedMin,
        headers: sheet.headers.length
      });
    } else if (sheet.status === '❌ Empty' || sheet.status === '⚠️ Insufficient') {
      report.emptySheets.push({
        name: name,
        rowCount: sheet.rowCount,
        expectedMin: sheet.expectedMin,
        sheetName: sheet.sheetName
      });
    } else if (sheet.status === '❌ Error') {
      report.errorSheets.push({
        name: name,
        error: sheet.error,
        sheetName: sheet.sheetName
      });
    }
  });
  
  // Generate recommendations
  if (report.emptySheets.length > 0) {
    report.recommendations.push('Run populateAllMockData() to populate empty sheets');
  }
  
  if (report.errorSheets.length > 0) {
    report.recommendations.push('Check sheet names and permissions for error sheets');
  }
  
  if (report.populatedSheets.length === results.summary.totalSheets) {
    report.recommendations.push('All sheets are properly populated - system ready for testing');
  }
  
  return report;
}

/**
 * Quick sheet count check
 * @return {Object} Quick summary
 */
function quickSheetCount() {
  console.log('📊 Quick sheet count check...');
  
  const sheets = [
    SHEET_ING, SHEET_MENU, SHEET_MENU_RECIPES, SHEET_USERS,
    SHEET_COST_CENTERS, SHEET_PUR, SHEET_SALE, SHEET_COGS,
    SHEET_LABOR, SHEET_WASTE, SHEET_PACKAGING, SHEET_MARKET_RUNS,
    SHEET_MARKET_RUN_ITEMS, SHEET_PACKING_PURCHASES, SHEET_OVERHEADS,
    SHEET_MENU_EXTRAS, SHEET_BATCHES, SHEET_BATCH_COST_LINES
  ];
  
  const counts = {};
  let totalRows = 0;
  
  sheets.forEach(sheetName => {
    try {
      const {rows} = byHeader(sheetName);
      counts[sheetName] = rows.length;
      totalRows += rows.length;
    } catch (error) {
      counts[sheetName] = 'ERROR';
    }
  });
  
  const result = {
    timestamp: nowStr(),
    sheetCounts: counts,
    totalRows: totalRows,
    totalSheets: sheets.length
  };
  
  console.log('Sheet Counts:', counts);
  console.log('Total Rows:', totalRows);
  
  return result;
}

/**
 * Verify specific sheet with detailed info
 * @param {string} sheetName - Name of sheet to verify
 * @return {Object} Detailed sheet info
 */
function verifySpecificSheet(sheetName) {
  console.log(`🔍 Verifying sheet: ${sheetName}`);
  
  try {
    const {rows, idx, sh} = byHeader(sheetName);
    
    const result = {
      sheetName: sheetName,
      rowCount: rows.length,
      columnCount: Object.keys(idx).length,
      headers: Object.keys(idx),
      sampleData: rows.slice(0, 5),
      lastRow: sh ? sh.getLastRow() : 'Unknown',
      lastColumn: sh ? sh.getLastColumn() : 'Unknown',
      isEmpty: rows.length === 0,
      status: rows.length > 0 ? '✅ Has Data' : '❌ Empty'
    };
    
    console.log(`Sheet ${sheetName}:`, result);
    
    return result;
    
  } catch (error) {
    console.error(`Error verifying sheet ${sheetName}:`, error);
    return {
      sheetName: sheetName,
      error: error.message,
      status: '❌ Error'
    };
  }
}

/**
 * Get all sheet names in the spreadsheet
 * @return {Object} All available sheets
 */
function getAllSheetNames() {
  console.log('📋 Getting all sheet names...');
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheets = ss.getSheets();
    
    const sheetInfo = sheets.map(sh => ({
      name: sh.getName(),
      lastRow: sh.getLastRow(),
      lastColumn: sh.getLastColumn(),
      hasData: sh.getLastRow() > 1
    }));
    
    const result = {
      timestamp: nowStr(),
      totalSheets: sheets.length,
      sheets: sheetInfo,
      sheetsWithData: sheetInfo.filter(s => s.hasData).length,
      emptySheets: sheetInfo.filter(s => !s.hasData).length
    };
    
    console.log('All Sheets:', result);
    
    return result;
    
  } catch (error) {
    console.error('Error getting sheet names:', error);
    return {
      error: error.message
    };
  }
}

/**
 * Compare expected vs actual sheet data
 * @return {Object} Comparison results
 */
function compareExpectedVsActual() {
  console.log('⚖️ Comparing expected vs actual sheet data...');
  
  const expected = {
    'Ingredients': 10,
    'Menus': 7,
    'MenuRecipes': 15,
    'Users': 4,
    'CostCenters': 3,
    'Purchases': 50,
    'Sales': 100,
    'COGS': 20,
    'LaborLogs': 30,
    'Waste': 10,
    'Packaging': 4,
    'MarketRuns': 3,
    'MarketRunItems': 6,
    'PackingPurchases': 4,
    'Overheads': 3,
    'MenuExtras': 5,
    'Batches': 3,
    'BatchCostLines': 5
  };
  
  const actual = {};
  const comparison = {};
  
  Object.entries(expected).forEach(([sheetName, expectedCount]) => {
    try {
      const {rows} = byHeader(sheetName);
      actual[sheetName] = rows.length;
      
      comparison[sheetName] = {
        expected: expectedCount,
        actual: rows.length,
        difference: rows.length - expectedCount,
        status: rows.length >= expectedCount ? '✅ Meets Expectation' : '⚠️ Below Expectation',
        percentage: Math.round((rows.length / expectedCount) * 100)
      };
    } catch (error) {
      actual[sheetName] = 0;
      comparison[sheetName] = {
        expected: expectedCount,
        actual: 0,
        difference: -expectedCount,
        status: '❌ Error',
        percentage: 0,
        error: error.message
      };
    }
  });
  
  const result = {
    timestamp: nowStr(),
    expected: expected,
    actual: actual,
    comparison: comparison,
    summary: {
      totalExpected: Object.values(expected).reduce((a, b) => a + b, 0),
      totalActual: Object.values(actual).reduce((a, b) => a + b, 0),
      sheetsMeetingExpectation: Object.values(comparison).filter(c => c.status === '✅ Meets Expectation').length,
      sheetsBelowExpectation: Object.values(comparison).filter(c => c.status === '⚠️ Below Expectation').length,
      errorSheets: Object.values(comparison).filter(c => c.status === '❌ Error').length
    }
  };
  
  console.log('Comparison Results:', result);
  
  return result;
}
