/**
 * Enhanced Backend Functions for AI Agent
 * Supports batch processing and advanced categorization
 *
 * @author Enhanced Backend Assistant
 * @version 2.0
 */

/**
 * Batch add multiple items from AI Agent
 * @param {Object} params - Batch parameters
 * @returns {Object} Batch results
 */
function batchAddFromAI(params) {
  try {
    const { purchases = [], expenses = [], equipment = [], supplies = [] } = params;

    const results = {
      purchases: [],
      expenses: [],
      equipment: [],
      supplies: [],
      errors: []
    };

    // Process purchases
    for (const item of purchases) {
      try {
        const result = addPurchaseFromAI({
          date: item.date,
          ingredient: item.description,
          qty: item.quantity * (item.multiplier || 1),
          unit: item.unit,
          total_price: item.totalPrice,
          note: `บันทึกโดย AI Agent Batch - ${item.originalLine || ''}`
        });
        results.purchases.push(result);
      } catch (error) {
        results.errors.push(`วัตถุดิบ "${item.description}": ${error.message}`);
      }
    }

    // Process expenses
    for (const item of expenses) {
      try {
        const result = addExpenseFromAI({
          date: item.date,
          description: item.description,
          amount: item.totalPrice,
          category: item.category
        });
        results.expenses.push(result);
      } catch (error) {
        results.errors.push(`ค่าใช้จ่าย "${item.description}": ${error.message}`);
      }
    }

    // Process equipment (treat as expenses with special category)
    for (const item of equipment) {
      try {
        const result = addExpenseFromAI({
          date: item.date,
          description: item.description,
          amount: item.totalPrice,
          category: 'อุปกรณ์'
        });
        results.equipment.push(result);
      } catch (error) {
        results.errors.push(`อุปกรณ์ "${item.description}": ${error.message}`);
      }
    }

    // Process supplies (treat as expenses with special category)
    for (const item of supplies) {
      try {
        const result = addExpenseFromAI({
          date: item.date,
          description: item.description,
          amount: item.totalPrice,
          category: 'วัสดุสิ้นเปลือง'
        });
        results.supplies.push(result);
      } catch (error) {
        results.errors.push(`วัสดุ "${item.description}": ${error.message}`);
      }
    }

    return {
      success: results.errors.length === 0,
      message: results.errors.length === 0 ?
        'บันทึกข้อมูลทั้งหมดเรียบร้อย' :
        'บันทึกข้อมูลบางส่วนสำเร็จ มีข้อผิดพลาดบางรายการ',
      results: results,
      totalErrors: results.errors.length
    };

  } catch (error) {
    Logger.log('[AI Agent] Error in batch add: ' + error.message);
    throw error;
  }
}

/**
 * Enhanced expense categorization
 * @param {string} description - Item description
 * @returns {Object} Category information
 */
function categorizeExpenseEnhanced(description) {
  const desc = description.toLowerCase();

  // Enhanced categorization patterns
  const categories = {
    'ค่าแรง': {
      patterns: [/ค่าจ้าง|ค่าแรง|จ้าง|พนักงาน|พลอย|น้องพลอย|เงินเดือน|ค่าล่วงเวลา/],
      subCategory: 'ค่าจ้างพนักงาน',
      type: 'expense'
    },
    'วัตถุดิบ': {
      patterns: [/กุ้ง|ปลา|หมู|ไก่|เนื้อ|ผัก|พริก|มะเขือ|มะระ|กะหล่ำ|แครอท|มะนาว|หอม|กระเทียม|ไชเท้า|ผักชี|คึ่นช่าย|ข้าว|น้ำมัน|น้ำปลา|ซอส|น้ำตาล|เกลือ|โชยุ|อินาริ|วาซาบิ|ฟูจิ/],
      subCategory: 'วัตถุดิบ',
      type: 'purchase'
    },
    'อุปกรณ์': {
      patterns: [/เครื่องพิมพ์|โทรศัพท์|คอมพิวเตอร์|เครื่องคิดเงิน|ตู้เย็น|เครื่องปั่น|ไม้แขวน|ที่ตาก|ตะกร้า|ที่ตัก|แหนบ|กล่อง|กรวย|กระบวย|ที่นอน|หมอน|ผ้าห่ม|ราวแขวนผ้า|มีด/],
      subCategory: 'อุปกรณ์และเครื่องใช้',
      type: 'equipment'
    },
    'บรรจุภัณฑ์': {
      patterns: [/ถุง|กล่องข้าว|ถุงหิ้ว|สติ๊กเกอร์|ถุงมือ|ถุงขยะ|ถุงซิป/],
      subCategory: 'บรรจุภัณฑ์',
      type: 'supplies'
    },
    'ของใช้': {
      patterns: [/ครีมอาบน้ำ|โดฟ|แชม|คอน|ทิชชู่|ผ้าเช็ดมือ|น้ำยาฆ่าเชื้อ|สบู่|เจลล้างมือ/],
      subCategory: 'ของใช้และวัสดุทำความสะอาด',
      type: 'supplies'
    },
    'สาธารณูปโภค': {
      patterns: [/น้ำแข็งเหล็ก|ค่าน้ำ|ค่าไฟ|ค่าออเดอร์|ปริ้นท์|ค่าอินเตอร์เน็ต/],
      subCategory: 'ค่าสาธารณูปโภคและบริการ',
      type: 'expense'
    },
    'สื่อสาร': {
      patterns: [/ซิม|เติมเงิน|อินเตอร์เน็ต|ค่าโทรศัพท์/],
      subCategory: 'ค่าสื่อสาร',
      type: 'expense'
    },
    'ค่าขนส่ง': {
      patterns: [/ค่าส่ง|ค่าจัดส่ง|ขนส่ง|เดินทาง/],
      subCategory: 'ค่าขนส่งและลำบาก',
      type: 'expense'
    },
    'เครื่องดื่ม': {
      patterns: [/คริสตัล|เอโร|น้ำดื่ม|เบียร์|เครื่องดื่ม|ชา|กาแฟ/],
      subCategory: 'เครื่องดื่ม',
      type: 'purchase'
    },
    'วัตถุดิบแปรรูป': {
      patterns: [/แมกกาแรต|ผงเบกกิ้งโซดา|หอมเจียว|น้ำมัน|น้ำปลา|ซอส|น้ำจิ้ม|ผงชูรส|รสดี/],
      subCategory: 'วัตถุดิบแปรรูป',
      type: 'purchase'
    }
  };

  // Check each category
  for (const [categoryName, categoryData] of Object.entries(categories)) {
    for (const pattern of categoryData.patterns) {
      if (pattern.test(desc)) {
        return {
          category: categoryName,
          subCategory: categoryData.subCategory,
          type: categoryData.type,
          confidence: 0.9
        };
      }
    }
  }

  // Default categorization
  return {
    category: 'อื่นๆ',
    subCategory: 'ค่าใช้จ่ายอื่นๆ',
    type: 'expense',
    confidence: 0.1
  };
}

/**
 * Get comprehensive statistics for dashboard
 * @param {Object} params - Date range parameters
 * @returns {Object} Statistics
 */
function getDashboardStatistics(params = {}) {
  try {
    const { startDate, endDate = nowStr().split('T')[0] } = params;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const stats = {
      totalPurchases: 0,
      totalExpenses: 0,
      purchasesByCategory: {},
      expensesByCategory: {},
      topExpenses: [],
      topIngredients: [],
      period: {
        start: startDate || '2025-01-01',
        end: endDate
      }
    };

    // Get purchases
    try {
      const purchasesSheet = ss.getSheetByName(SHEET_PUR);
      if (purchasesSheet) {
        const purchaseData = purchasesSheet.getDataRange().getValues();
        const headers = purchaseData.shift();

        const dateIndex = headers.indexOf('date');
        const priceIndex = headers.indexOf('total_price');
        const ingredientIndex = headers.indexOf('ingredient_name');

        for (const row of purchaseData) {
          const date = row[dateIndex];
          if (date >= (startDate || '2025-01-01') && date <= endDate) {
            const price = parseFloat(row[priceIndex]) || 0;
            const ingredient = row[ingredientIndex];

            stats.totalPurchases += price;

            // Categorize ingredient
            const category = categorizeExpenseEnhanced(ingredient);
            if (!stats.purchasesByCategory[category.category]) {
              stats.purchasesByCategory[category.category] = 0;
            }
            stats.purchasesByCategory[category.category] += price;

            // Track top ingredients
            if (ingredient) {
              stats.topIngredients.push({ name: ingredient, amount: price });
            }
          }
        }
      }
    } catch (e) {
      Logger.log('Error reading purchases: ' + e.message);
    }

    // Get expenses
    try {
      const expensesSheet = ss.getSheetByName(SHEET_EXPENSES);
      if (expensesSheet) {
        const expenseData = expensesSheet.getDataRange().getValues();
        const headers = expenseData.shift();

        const dateIndex = headers.indexOf('date');
        const amountIndex = headers.indexOf('amount');
        const categoryIndex = headers.indexOf('category');
        const descIndex = headers.indexOf('description');

        for (const row of expenseData) {
          const date = row[dateIndex];
          if (date >= (startDate || '2025-01-01') && date <= endDate) {
            const amount = parseFloat(row[amountIndex]) || 0;
            const category = row[categoryIndex] || 'อื่นๆ';
            const description = row[descIndex];

            stats.totalExpenses += amount;

            // Group by category
            if (!stats.expensesByCategory[category]) {
              stats.expensesByCategory[category] = 0;
            }
            stats.expensesByCategory[category] += amount;

            // Track top expenses
            if (description) {
              stats.topExpenses.push({ description, amount, category });
            }
          }
        }
      }
    } catch (e) {
      Logger.log('Error reading expenses: ' + e.message);
    }

    // Sort top items
    stats.topIngredients.sort((a, b) => b.amount - a.amount);
    stats.topIngredients = stats.topIngredients.slice(0, 10);

    stats.topExpenses.sort((a, b) => b.amount - a.amount);
    stats.topExpenses = stats.topExpenses.slice(0, 10);

    return {
      success: true,
      data: stats
    };

  } catch (error) {
    Logger.log('[AI Agent] Error getting dashboard stats: ' + error.message);
    throw error;
  }
}

/**
 * Search items across all sheets
 * @param {Object} params - Search parameters
 * @returns {Object} Search results
 */
function searchItemsAcrossSheets(params) {
  try {
    const { query, searchType = 'all' } = params;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const results = {
      ingredients: [],
      expenses: [],
      menus: [],
      total: 0
    };

    // Search ingredients/purchases
    if (searchType === 'all' || searchType === 'ingredients') {
      try {
        const purchasesSheet = ss.getSheetByName(SHEET_PUR);
        if (purchasesSheet) {
          const data = purchasesSheet.getDataRange().getValues();
          const headers = data.shift();

          const nameIndex = headers.indexOf('ingredient_name');
          const dateIndex = headers.indexOf('date');
          const priceIndex = headers.indexOf('total_price');

          for (const row of data) {
            const name = row[nameIndex];
            if (name && name.toLowerCase().includes(query.toLowerCase())) {
              results.ingredients.push({
                type: 'purchase',
                name: name,
                date: row[dateIndex],
                amount: parseFloat(row[priceIndex]) || 0
              });
            }
          }
        }
      } catch (e) {
        Logger.log('Error searching purchases: ' + e.message);
      }
    }

    // Search expenses
    if (searchType === 'all' || searchType === 'expenses') {
      try {
        const expensesSheet = ss.getSheetByName(SHEET_EXPENSES);
        if (expensesSheet) {
          const data = expensesSheet.getDataRange().getValues();
          const headers = data.shift();

          const descIndex = headers.indexOf('description');
          const dateIndex = headers.indexOf('date');
          const amountIndex = headers.indexOf('amount');
          const categoryIndex = headers.indexOf('category');

          for (const row of data) {
            const desc = row[descIndex];
            if (desc && desc.toLowerCase().includes(query.toLowerCase())) {
              results.expenses.push({
                type: 'expense',
                description: desc,
                date: row[dateIndex],
                amount: parseFloat(row[amountIndex]) || 0,
                category: row[categoryIndex]
              });
            }
          }
        }
      } catch (e) {
        Logger.log('Error searching expenses: ' + e.message);
      }
    }

    // Search menus
    if (searchType === 'all' || searchType === 'menus') {
      try {
        const menuSheet = ss.getSheetByName(SHEET_MENU);
        if (menuSheet) {
          const data = menuSheet.getDataRange().getValues();
          const headers = data.shift();

          const nameIndex = headers.indexOf('name');
          const idIndex = headers.indexOf('id');

          for (const row of data) {
            const name = row[nameIndex];
            if (name && name.toLowerCase().includes(query.toLowerCase())) {
              results.menus.push({
                type: 'menu',
                name: name,
                id: row[idIndex]
              });
            }
          }
        }
      } catch (e) {
        Logger.log('Error searching menus: ' + e.message);
      }
    }

    results.total = results.ingredients.length + results.expenses.length + results.menus.length;

    return {
      success: true,
      data: results,
      query: query
    };

  } catch (error) {
    Logger.log('[AI Agent] Error searching items: ' + error.message);
    throw error;
  }
}

/**
 * Generate monthly expense report
 * @param {Object} params - Report parameters
 * @returns {Object} Report data
 */
function generateMonthlyReport(params) {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = params;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Format date range
    const monthStr = month.toString().padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-31`;

    const report = {
      period: {
        year: year,
        month: month,
        startDate: startDate,
        endDate: endDate
      },
      summary: {
        totalPurchases: 0,
        totalExpenses: 0,
        total: 0,
        dailyAverage: 0
      },
      categories: {},
      dailyBreakdown: [],
      topExpenses: []
    };

    // Get expenses data
    const expensesSheet = ss.getSheetByName(SHEET_EXPENSES);
    if (expensesSheet) {
      const data = expensesSheet.getDataRange().getValues();
      const headers = data.shift();

      const dateIndex = headers.indexOf('date');
      const amountIndex = headers.indexOf('amount');
      const categoryIndex = headers.indexOf('category');
      const descIndex = headers.indexOf('description');

      // Group by date and category
      const dailyData = {};

      for (const row of data) {
        const date = row[dateIndex];
        if (date >= startDate && date <= endDate) {
          const amount = parseFloat(row[amountIndex]) || 0;
          const category = row[categoryIndex] || 'อื่นๆ';
          const description = row[descIndex];

          // Update totals
          report.summary.totalExpenses += amount;

          // Update category totals
          if (!report.categories[category]) {
            report.categories[category] = 0;
          }
          report.categories[category] += amount;

          // Update daily data
          if (!dailyData[date]) {
            dailyData[date] = { total: 0, expenses: [] };
          }
          dailyData[date].total += amount;
          dailyData[date].expenses.push({
            description,
            amount,
            category
          });

          // Track top expenses
          report.topExpenses.push({
            date,
            description,
            amount,
            category
          });
        }
      }

      // Sort and limit top expenses
      report.topExpenses.sort((a, b) => b.amount - a.amount);
      report.topExpenses = report.topExpenses.slice(0, 20);

      // Create daily breakdown
      for (const [date, data] of Object.entries(dailyData)) {
        report.dailyBreakdown.push({
          date,
          total: data.total,
          expenseCount: data.expenses.length
        });
      }

      report.dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date));
    }

    // Calculate summary
    report.summary.total = report.summary.totalPurchases + report.summary.totalExpenses;
    report.summary.dailyAverage = report.summary.total / 30; // Approximate

    return {
      success: true,
      data: report
    };

  } catch (error) {
    Logger.log('[AI Agent] Error generating monthly report: ' + error.message);
    throw error;
  }
}

/**
 * Validate and clean data before saving
 * @param {Array} items - Array of items to validate
 * @returns {Object} Validation results
 */
function validateDataBeforeSave(items) {
  try {
    const validation = {
      valid: [],
      invalid: [],
      duplicates: [],
      warnings: []
    };

    const seen = new Set();

    for (const item of items) {
      // Check required fields
      if (!item.date || !item.description || item.totalPrice === undefined) {
        validation.invalid.push({
          item,
          reason: 'Missing required fields (date, description, or price)'
        });
        continue;
      }

      // Check for duplicates
      const key = `${item.date}-${item.description}-${item.totalPrice}`;
      if (seen.has(key)) {
        validation.duplicates.push(item);
        continue;
      }
      seen.add(key);

      // Check price reasonableness
      if (item.totalPrice < 0 || item.totalPrice > 100000) {
        validation.warnings.push({
          item,
          reason: 'Unusual price amount'
        });
      }

      // Check date validity
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(item.date)) {
        validation.invalid.push({
          item,
          reason: 'Invalid date format (should be YYYY-MM-DD)'
        });
        continue;
      }

      validation.valid.push(item);
    }

    return {
      success: true,
      data: validation,
      totalValid: validation.valid.length,
      totalInvalid: validation.invalid.length,
      totalDuplicates: validation.duplicates.length
    };

  } catch (error) {
    Logger.log('[AI Agent] Error validating data: ' + error.message);
    throw error;
  }
}

/**
 * Get AI Agent configuration and settings
 * @returns {Object} Configuration
 */
function getAIAgentConfig() {
  try {
    const config = {
      version: '2.0',
      features: {
        batchProcessing: true,
        advancedCategorization: true,
        dataValidation: true,
        confirmationRequired: true,
        multiLanguageSupport: ['th', 'en']
      },
      categories: {
        purchases: ['วัตถุดิบ', 'เครื่องดื่ม', 'วัตถุดิบแปรรูป'],
        expenses: ['ค่าแรง', 'สาธารณูปโภค', 'ค่าขนส่ง', 'สื่อสาร'],
        equipment: ['อุปกรณ์และเครื่องใช้'],
        supplies: ['บรรจุภัณฑ์', 'ของใช้และวัสดุทำความสะอาด']
      },
      dateFormats: ['DD-MMM-YYYY', 'YYYYMMDD', 'YYYY-MM-DD'],
      supportedUnits: ['kg', 'g', 'liter', 'ml', 'piece', 'pack', 'box', 'bag', 'bottle'],
      maxBatchSize: 100,
      cacheDuration: 300
    };

    return {
      success: true,
      data: config
    };

  } catch (error) {
    Logger.log('[AI Agent] Error getting config: ' + error.message);
    throw error;
  }
}
