/**
 * Data Integrity Module
 * Validates data consistency and referential integrity across sheets
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10
 */

class DataIntegrityModule {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || '',
      timeout: config.timeout || 10000,
      ...config
    };
    
    // Define foreign key relationships
    this.foreignKeyRelationships = [
      {
        fromSheet: 'Purchases',
        fromColumn: 'ingredient_id',
        toSheet: 'Ingredients',
        toColumn: 'id',
        description: 'Purchase must reference valid ingredient',
        requirement: '4.1'
      },
      {
        fromSheet: 'MenuRecipes',
        fromColumn: 'ingredient_id',
        toSheet: 'Ingredients',
        toColumn: 'id',
        description: 'Recipe must reference valid ingredient',
        requirement: '4.1'
      },
      {
        fromSheet: 'Sales',
        fromColumn: 'menu_id',
        toSheet: 'Menus',
        toColumn: 'menu_id',
        description: 'Sale must reference valid menu',
        requirement: '4.2'
      },
      {
        fromSheet: 'MenuRecipes',
        fromColumn: 'menu_id',
        toSheet: 'Menus',
        toColumn: 'menu_id',
        description: 'Recipe must reference valid menu',
        requirement: '4.2'
      },
      {
        fromSheet: 'Batches',
        fromColumn: 'menu_id',
        toSheet: 'Menus',
        toColumn: 'menu_id',
        description: 'Batch must reference valid menu',
        requirement: '4.2'
      },
      {
        fromSheet: 'Purchases',
        fromColumn: 'lot_id',
        toSheet: 'Lots',
        toColumn: 'lot_id',
        description: 'Purchase must reference valid lot',
        requirement: '4.3'
      },
      {
        fromSheet: 'MenuRecipes',
        fromColumn: 'user_key',
        toSheet: 'Users',
        toColumn: 'user_key',
        description: 'Recipe must reference valid user',
        requirement: '4.4'
      },
      {
        fromSheet: 'LaborLogs',
        fromColumn: 'user_key',
        toSheet: 'Users',
        toColumn: 'user_key',
        description: 'Labor log must reference valid user',
        requirement: '4.4'
      },
      {
        fromSheet: 'Batches',
        fromColumn: 'user_key',
        toSheet: 'Users',
        toColumn: 'user_key',
        description: 'Batch must reference valid user',
        requirement: '4.4'
      }
    ];
    
    // Define required fields for each sheet
    this.requiredFields = {
      'Ingredients': ['id', 'name'],
      'Menus': ['menu_id', 'name'],
      'MenuRecipes': ['menu_id', 'ingredient_id', 'qty_per_serve'],
      'Purchases': ['date', 'ingredient_id', 'qty_buy', 'total_price'],
      'Sales': ['date', 'platform', 'menu_id', 'qty', 'price_per_unit'],
      'Users': ['user_key', 'role', 'name'],
      'Lots': ['lot_id', 'ingredient_id', 'date'],
      'Platforms': ['platform'],
      'Stocks': ['ingredient_id']
    };
    
    // Define calculated fields and their formulas
    this.calculatedFields = {
      'Purchases': [
        {
          field: 'unit_price',
          formula: (row) => row.total_price / row.qty_buy,
          description: 'Unit price = total_price ÷ qty_buy',
          requirement: '4.5'
        },
        {
          field: 'cost_per_stock',
          formula: (row) => row.total_price / row.qty_stock,
          description: 'Cost per stock = total_price ÷ qty_stock',
          requirement: '4.5'
        }
      ],
      'Sales': [
        {
          field: 'gross',
          formula: (row) => row.qty * row.price_per_unit,
          description: 'Gross = qty × price_per_unit',
          requirement: '4.5'
        },
        {
          field: 'net',
          formula: (row) => row.qty * row.net_per_unit,
          description: 'Net = qty × net_per_unit',
          requirement: '4.5'
        },
        {
          field: 'profit',
          formula: (row) => row.net - row.cogs,
          description: 'Profit = net - cogs',
          requirement: '4.5'
        }
      ]
    };
    
    this.integrityResults = {
      timestamp: null,
      checksPerformed: [],
      issues: [],
      warnings: [],
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  /**
   * Check referential integrity for all foreign key relationships
   * Requirement: 4.1, 4.2, 4.3, 4.4
   */
  async checkReferentialIntegrity() {
    console.log('Checking referential integrity...');
    this.integrityResults.timestamp = new Date().toISOString();
    
    const results = [];
    
    for (const relationship of this.foreignKeyRelationships) {
      try {
        console.log(`Checking ${relationship.fromSheet}.${relationship.fromColumn} -> ${relationship.toSheet}.${relationship.toColumn}`);
        
        const result = await this.validateForeignKey(relationship);
        results.push(result);
        
        this.integrityResults.summary.totalChecks++;
        
        if (result.passed) {
          this.integrityResults.summary.passed++;
        } else {
          this.integrityResults.summary.failed++;
          this.integrityResults.issues.push({
            severity: 'high',
            type: 'referential_integrity',
            relationship: `${relationship.fromSheet}.${relationship.fromColumn}`,
            issue: result.message,
            invalidCount: result.invalidReferences?.length || 0,
            requirement: relationship.requirement
          });
        }
        
      } catch (error) {
        console.error(`Error checking ${relationship.fromSheet}.${relationship.fromColumn}:`, error);
        results.push({
          relationship: relationship,
          passed: false,
          error: error.message,
          requirement: relationship.requirement
        });
        this.integrityResults.summary.totalChecks++;
        this.integrityResults.summary.failed++;
      }
    }
    
    this.integrityResults.checksPerformed.push({
      checkType: 'referential_integrity',
      results: results
    });
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Validate a single foreign key relationship
   */
  async validateForeignKey(relationship) {
    const result = {
      relationship: relationship,
      fromSheet: relationship.fromSheet,
      fromColumn: relationship.fromColumn,
      toSheet: relationship.toSheet,
      toColumn: relationship.toColumn,
      passed: true,
      message: '',
      invalidReferences: [],
      totalReferences: 0,
      validReferences: 0,
      requirement: relationship.requirement
    };
    
    try {
      // Fetch data from both sheets
      const fromData = await this.fetchSheetData(relationship.fromSheet);
      const toData = await this.fetchSheetData(relationship.toSheet);
      
      if (!fromData || !toData) {
        result.passed = false;
        result.message = 'Unable to fetch sheet data';
        return result;
      }
      
      // Build set of valid IDs from target sheet
      const validIds = new Set();
      toData.forEach(row => {
        const id = row[relationship.toColumn];
        if (id !== null && id !== undefined && id !== '') {
          validIds.add(String(id));
        }
      });
      
      // Check each reference in source sheet
      fromData.forEach((row, index) => {
        const refValue = row[relationship.fromColumn];
        
        // Skip empty references
        if (refValue === null || refValue === undefined || refValue === '') {
          return;
        }
        
        result.totalReferences++;
        
        if (validIds.has(String(refValue))) {
          result.validReferences++;
        } else {
          result.invalidReferences.push({
            rowIndex: index + 2, // +2 for header and 0-index
            value: refValue,
            row: row
          });
        }
      });
      
      // Determine if check passed
      if (result.invalidReferences.length > 0) {
        result.passed = false;
        result.message = `Found ${result.invalidReferences.length} invalid references in ${relationship.fromSheet}.${relationship.fromColumn}`;
      } else {
        result.message = `All ${result.totalReferences} references are valid`;
      }
      
    } catch (error) {
      result.passed = false;
      result.message = `Error validating foreign key: ${error.message}`;
    }
    
    return result;
  }


  /**
   * Validate calculations for computed fields
   * Requirement: 4.5
   */
  async validateCalculations() {
    console.log('Validating calculated fields...');
    
    const results = [];
    
    for (const [sheetName, calculations] of Object.entries(this.calculatedFields)) {
      try {
        console.log(`Validating calculations in ${sheetName}`);
        
        const sheetData = await this.fetchSheetData(sheetName);
        
        if (!sheetData) {
          results.push({
            sheet: sheetName,
            passed: false,
            message: 'Unable to fetch sheet data'
          });
          continue;
        }
        
        for (const calc of calculations) {
          const calcResult = await this.validateCalculation(sheetName, sheetData, calc);
          results.push(calcResult);
          
          this.integrityResults.summary.totalChecks++;
          
          if (calcResult.passed) {
            this.integrityResults.summary.passed++;
          } else {
            this.integrityResults.summary.failed++;
            this.integrityResults.issues.push({
              severity: 'medium',
              type: 'calculation_error',
              sheet: sheetName,
              field: calc.field,
              issue: calcResult.message,
              errorCount: calcResult.errors?.length || 0,
              requirement: calc.requirement
            });
          }
        }
        
      } catch (error) {
        console.error(`Error validating calculations in ${sheetName}:`, error);
        results.push({
          sheet: sheetName,
          passed: false,
          error: error.message
        });
        this.integrityResults.summary.totalChecks++;
        this.integrityResults.summary.failed++;
      }
    }
    
    this.integrityResults.checksPerformed.push({
      checkType: 'calculation_validation',
      results: results
    });
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Validate a single calculated field
   */
  async validateCalculation(sheetName, sheetData, calculation) {
    const result = {
      sheet: sheetName,
      field: calculation.field,
      description: calculation.description,
      passed: true,
      message: '',
      errors: [],
      totalRows: 0,
      validRows: 0,
      requirement: calculation.requirement
    };
    
    const tolerance = 0.01; // Allow 1 cent difference for rounding
    
    sheetData.forEach((row, index) => {
      // Skip rows with missing required data
      if (!this.hasRequiredDataForCalculation(row, calculation)) {
        return;
      }
      
      result.totalRows++;
      
      try {
        const expectedValue = calculation.formula(row);
        const actualValue = row[calculation.field];
        
        // Check if values match within tolerance
        if (actualValue === null || actualValue === undefined) {
          result.errors.push({
            rowIndex: index + 2,
            issue: 'Missing calculated value',
            expected: expectedValue,
            actual: actualValue
          });
        } else if (Math.abs(expectedValue - actualValue) > tolerance) {
          result.errors.push({
            rowIndex: index + 2,
            issue: 'Calculation mismatch',
            expected: expectedValue,
            actual: actualValue,
            difference: Math.abs(expectedValue - actualValue)
          });
        } else {
          result.validRows++;
        }
        
      } catch (error) {
        result.errors.push({
          rowIndex: index + 2,
          issue: `Calculation error: ${error.message}`,
          row: row
        });
      }
    });
    
    if (result.errors.length > 0) {
      result.passed = false;
      result.message = `Found ${result.errors.length} calculation errors in ${sheetName}.${calculation.field}`;
    } else {
      result.message = `All ${result.totalRows} calculations are correct`;
    }
    
    return result;
  }

  /**
   * Check if row has required data for calculation
   */
  hasRequiredDataForCalculation(row, calculation) {
    // Extract field names from formula by checking which fields are accessed
    const formulaStr = calculation.formula.toString();
    
    // Common required fields for calculations
    const commonFields = ['qty', 'price', 'total_price', 'qty_buy', 'qty_stock', 
                          'price_per_unit', 'net_per_unit', 'cogs', 'net'];
    
    for (const field of commonFields) {
      if (formulaStr.includes(`row.${field}`) || formulaStr.includes(`row['${field}']`)) {
        if (row[field] === null || row[field] === undefined || row[field] === '') {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Validate required fields are not missing
   * Requirement: 4.6, 4.7
   */
  async validateRequiredFields() {
    console.log('Validating required fields...');
    
    const results = [];
    
    for (const [sheetName, requiredFields] of Object.entries(this.requiredFields)) {
      try {
        console.log(`Validating required fields in ${sheetName}`);
        
        const sheetData = await this.fetchSheetData(sheetName);
        
        if (!sheetData) {
          results.push({
            sheet: sheetName,
            passed: false,
            message: 'Unable to fetch sheet data'
          });
          continue;
        }
        
        const fieldResult = {
          sheet: sheetName,
          requiredFields: requiredFields,
          passed: true,
          message: '',
          missingData: [],
          totalRows: sheetData.length,
          validRows: 0,
          requirement: '4.6'
        };
        
        sheetData.forEach((row, index) => {
          let rowValid = true;
          const missingFields = [];
          
          requiredFields.forEach(field => {
            const value = row[field];
            if (value === null || value === undefined || value === '') {
              rowValid = false;
              missingFields.push(field);
            }
          });
          
          if (!rowValid) {
            fieldResult.missingData.push({
              rowIndex: index + 2,
              missingFields: missingFields,
              row: row
            });
          } else {
            fieldResult.validRows++;
          }
        });
        
        if (fieldResult.missingData.length > 0) {
          fieldResult.passed = false;
          fieldResult.message = `Found ${fieldResult.missingData.length} rows with missing required fields`;
          
          this.integrityResults.issues.push({
            severity: 'high',
            type: 'missing_required_fields',
            sheet: sheetName,
            issue: fieldResult.message,
            affectedRows: fieldResult.missingData.length,
            requirement: '4.6'
          });
        } else {
          fieldResult.message = `All ${fieldResult.totalRows} rows have required fields`;
        }
        
        results.push(fieldResult);
        this.integrityResults.summary.totalChecks++;
        
        if (fieldResult.passed) {
          this.integrityResults.summary.passed++;
        } else {
          this.integrityResults.summary.failed++;
        }
        
      } catch (error) {
        console.error(`Error validating required fields in ${sheetName}:`, error);
        results.push({
          sheet: sheetName,
          passed: false,
          error: error.message
        });
        this.integrityResults.summary.totalChecks++;
        this.integrityResults.summary.failed++;
      }
    }
    
    this.integrityResults.checksPerformed.push({
      checkType: 'required_fields',
      results: results
    });
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }


  /**
   * Find orphaned records with invalid foreign key references
   * Requirement: 4.8
   */
  async findOrphanedRecords() {
    console.log('Finding orphaned records...');
    
    const results = [];
    
    for (const relationship of this.foreignKeyRelationships) {
      try {
        const orphanResult = await this.findOrphansForRelationship(relationship);
        results.push(orphanResult);
        
        this.integrityResults.summary.totalChecks++;
        
        if (orphanResult.orphanedRecords.length === 0) {
          this.integrityResults.summary.passed++;
        } else {
          this.integrityResults.summary.warnings++;
          this.integrityResults.warnings.push({
            type: 'orphaned_records',
            relationship: `${relationship.fromSheet}.${relationship.fromColumn}`,
            count: orphanResult.orphanedRecords.length,
            requirement: '4.8'
          });
        }
        
      } catch (error) {
        console.error(`Error finding orphans for ${relationship.fromSheet}:`, error);
        results.push({
          relationship: relationship,
          orphanedRecords: [],
          error: error.message
        });
        this.integrityResults.summary.totalChecks++;
        this.integrityResults.summary.failed++;
      }
    }
    
    this.integrityResults.checksPerformed.push({
      checkType: 'orphaned_records',
      results: results
    });
    
    return {
      passed: true, // Orphans are warnings, not failures
      results,
      summary: {
        total: results.length,
        totalOrphans: results.reduce((sum, r) => sum + r.orphanedRecords.length, 0)
      }
    };
  }

  /**
   * Find orphaned records for a specific relationship
   */
  async findOrphansForRelationship(relationship) {
    const result = {
      relationship: relationship,
      fromSheet: relationship.fromSheet,
      fromColumn: relationship.fromColumn,
      toSheet: relationship.toSheet,
      toColumn: relationship.toColumn,
      orphanedRecords: [],
      requirement: '4.8'
    };
    
    try {
      // Fetch data from both sheets
      const fromData = await this.fetchSheetData(relationship.fromSheet);
      const toData = await this.fetchSheetData(relationship.toSheet);
      
      if (!fromData || !toData) {
        return result;
      }
      
      // Build set of valid IDs
      const validIds = new Set();
      toData.forEach(row => {
        const id = row[relationship.toColumn];
        if (id !== null && id !== undefined && id !== '') {
          validIds.add(String(id));
        }
      });
      
      // Find orphaned records
      fromData.forEach((row, index) => {
        const refValue = row[relationship.fromColumn];
        
        if (refValue !== null && refValue !== undefined && refValue !== '') {
          if (!validIds.has(String(refValue))) {
            result.orphanedRecords.push({
              rowIndex: index + 2,
              foreignKeyValue: refValue,
              row: row
            });
          }
        }
      });
      
    } catch (error) {
      result.error = error.message;
    }
    
    return result;
  }

  /**
   * Validate numeric and date data types
   * Requirement: 4.9
   */
  async validateDataTypes() {
    console.log('Validating data types...');
    
    const results = [];
    
    // Define sheets and their numeric/date columns
    const dataTypeValidations = {
      'Purchases': {
        numeric: ['qty_buy', 'total_price', 'unit_price', 'qty_stock', 'cost_per_stock', 'remaining_stock'],
        date: ['date']
      },
      'Sales': {
        numeric: ['qty', 'price_per_unit', 'net_per_unit', 'gross', 'net', 'cogs', 'profit'],
        date: ['date']
      },
      'Ingredients': {
        numeric: ['buy_to_stock_ratio', 'min_stock'],
        date: []
      },
      'MenuRecipes': {
        numeric: ['qty_per_serve'],
        date: ['created_at']
      },
      'Lots': {
        numeric: ['qty_initial', 'qty_remaining', 'cost_per_unit'],
        date: ['date']
      }
    };
    
    for (const [sheetName, columns] of Object.entries(dataTypeValidations)) {
      try {
        console.log(`Validating data types in ${sheetName}`);
        
        const sheetData = await this.fetchSheetData(sheetName);
        
        if (!sheetData) {
          results.push({
            sheet: sheetName,
            passed: false,
            message: 'Unable to fetch sheet data'
          });
          continue;
        }
        
        const typeResult = {
          sheet: sheetName,
          passed: true,
          message: '',
          invalidData: [],
          totalRows: sheetData.length,
          validRows: 0,
          requirement: '4.9'
        };
        
        sheetData.forEach((row, index) => {
          let rowValid = true;
          const invalidFields = [];
          
          // Validate numeric columns
          columns.numeric.forEach(field => {
            const value = row[field];
            if (value !== null && value !== undefined && value !== '') {
              if (isNaN(Number(value))) {
                rowValid = false;
                invalidFields.push({
                  field: field,
                  value: value,
                  expectedType: 'number'
                });
              }
            }
          });
          
          // Validate date columns
          columns.date.forEach(field => {
            const value = row[field];
            if (value !== null && value !== undefined && value !== '') {
              const date = new Date(value);
              if (isNaN(date.getTime())) {
                rowValid = false;
                invalidFields.push({
                  field: field,
                  value: value,
                  expectedType: 'date'
                });
              }
            }
          });
          
          if (!rowValid) {
            typeResult.invalidData.push({
              rowIndex: index + 2,
              invalidFields: invalidFields
            });
          } else {
            typeResult.validRows++;
          }
        });
        
        if (typeResult.invalidData.length > 0) {
          typeResult.passed = false;
          typeResult.message = `Found ${typeResult.invalidData.length} rows with invalid data types`;
          
          this.integrityResults.issues.push({
            severity: 'medium',
            type: 'invalid_data_types',
            sheet: sheetName,
            issue: typeResult.message,
            affectedRows: typeResult.invalidData.length,
            requirement: '4.9'
          });
        } else {
          typeResult.message = `All ${typeResult.totalRows} rows have valid data types`;
        }
        
        results.push(typeResult);
        this.integrityResults.summary.totalChecks++;
        
        if (typeResult.passed) {
          this.integrityResults.summary.passed++;
        } else {
          this.integrityResults.summary.failed++;
        }
        
      } catch (error) {
        console.error(`Error validating data types in ${sheetName}:`, error);
        results.push({
          sheet: sheetName,
          passed: false,
          error: error.message
        });
        this.integrityResults.summary.totalChecks++;
        this.integrityResults.summary.failed++;
      }
    }
    
    this.integrityResults.checksPerformed.push({
      checkType: 'data_types',
      results: results
    });
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Fetch sheet data from API or mock data
   */
  async fetchSheetData(sheetName) {
    // In production, this would call the API to get sheet data
    // For testing, return mock data or empty array
    
    // Mock implementation - would be replaced with actual API call
    if (this.config.mockData && this.config.mockData[sheetName]) {
      return this.config.mockData[sheetName];
    }
    
    // Return empty array for now
    return [];
  }

  /**
   * Get comprehensive data integrity report
   * Requirement: 4.10
   */
  getIntegrityReport() {
    const report = {
      ...this.integrityResults,
      generatedAt: new Date().toISOString(),
      passed: this.integrityResults.summary.failed === 0,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  /**
   * Generate recommendations based on integrity issues
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Recommendations for referential integrity issues
    const refIntegrityIssues = this.integrityResults.issues.filter(
      i => i.type === 'referential_integrity'
    );
    if (refIntegrityIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'referential_integrity',
        recommendation: 'Fix invalid foreign key references by either updating the references or adding missing records to target sheets',
        affectedChecks: refIntegrityIssues.length
      });
    }
    
    // Recommendations for calculation errors
    const calcIssues = this.integrityResults.issues.filter(
      i => i.type === 'calculation_error'
    );
    if (calcIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'calculations',
        recommendation: 'Recalculate computed fields to ensure accuracy. Consider adding formulas in Google Sheets for automatic calculation',
        affectedChecks: calcIssues.length
      });
    }
    
    // Recommendations for missing required fields
    const missingFieldIssues = this.integrityResults.issues.filter(
      i => i.type === 'missing_required_fields'
    );
    if (missingFieldIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'required_fields',
        recommendation: 'Fill in missing required fields or remove incomplete records',
        affectedChecks: missingFieldIssues.length
      });
    }
    
    // Recommendations for data type issues
    const dataTypeIssues = this.integrityResults.issues.filter(
      i => i.type === 'invalid_data_types'
    );
    if (dataTypeIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'data_types',
        recommendation: 'Correct data type mismatches. Use data validation in Google Sheets to prevent future issues',
        affectedChecks: dataTypeIssues.length
      });
    }
    
    // Recommendations for orphaned records
    const orphanWarnings = this.integrityResults.warnings.filter(
      w => w.type === 'orphaned_records'
    );
    if (orphanWarnings.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'orphaned_records',
        recommendation: 'Review and clean up orphaned records that reference non-existent entities',
        affectedChecks: orphanWarnings.length
      });
    }
    
    return recommendations;
  }

  /**
   * Reset integrity results
   */
  reset() {
    this.integrityResults = {
      timestamp: null,
      checksPerformed: [],
      issues: [],
      warnings: [],
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  /**
   * Run all data integrity checks so the comprehensive executor can call runAllTests()
   */
  async runAllTests() {
    try {
      const refs = await this.checkReferentialIntegrity();
      const calcs = await this.validateCalculations();
      const required = await this.validateRequiredFields();
      const orphans = await this.findOrphanedRecords();
      const types = await this.validateDataTypes();

      const totals = [refs, calcs, required, types].reduce((acc, r) => {
        acc.total += r.summary.total || 0;
        acc.passed += r.summary.passed || 0;
        acc.failed += r.summary.failed || 0;
        return acc;
      }, { total: 0, passed: 0, failed: 0 });

      return {
        passed: totals.failed === 0,
        totalTests: totals.total,
        passedTests: totals.passed,
        failedTests: totals.failed,
        details: { refs, calcs, required, orphans, types },
        requirementCoverage: {
          '4.1': 'partial',
          '4.2': 'partial',
          '4.3': 'partial',
          '4.4': 'partial',
          '4.5': 'partial',
          '4.6': 'partial',
          '4.7': 'partial',
          '4.8': 'partial',
          '4.9': 'partial',
          '4.10': 'partial'
        }
      };
    } catch (error) {
      return {
        passed: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        error: error.message
      };
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataIntegrityModule;
} else if (typeof window !== 'undefined') {
  window.DataIntegrityModule = DataIntegrityModule;
}
