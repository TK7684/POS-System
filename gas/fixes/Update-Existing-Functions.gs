/**
 * Updates for Existing Apps Script Functions
 * Apply these changes to your existing gas/Code.gs file to fix AI functionality
 *
 * @author Backend Fix Specialist
 * @version 1.0
 */

// ===== REPLACE EXISTING FUNCTIONS WITH THESE IMPROVED VERSIONS =====

/**
 * IMPROVED VERSION: Replace addPurchaseFromAI in gas/Code.gs around line 2863
 */
function addPurchaseFromAI(params) {
  const startTime = Date.now();

  try {
    const { date, ingredient, qty, unit, total_price, note } = params;

    // Input validation
    if (!ingredient || !qty || !total_price) {
      return {
        success: false,
        message: '❌ กรุณาระบุชื่อวัตถุดิบ จำนวน และราคาให้ครบถ้วน',
        error: 'MISSING_REQUIRED_FIELDS'
      };
    }

    // Validate numeric values
    if (isNaN(qty) || isNaN(total_price) || qty <= 0 || total_price <= 0) {
      return {
        success: false,
        message: '❌ จำนวนและราคาต้องเป็นตัวเลขที่มากกว่า 0',
        error: 'INVALID_NUMERIC_VALUES'
      };
    }

    // Find ingredient with better error handling
    const ingredientData = _findIngredientByName(ingredient);
    if (!ingredientData) {
      // Get suggestions instead of just failing
      const suggestions = _getIngredientSuggestions(ingredient);
      return {
        success: false,
        message: `❌ ไม่พบวัตถุดิบ "${ingredient}" ในระบบ`,
        suggestions: suggestions,
        error: 'INGREDIENT_NOT_FOUND'
      };
    }

    // Check for duplicates in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = Utilities.formatDate(yesterday, 'Asia/Bangkok', 'yyyy-MM-dd');

    if (_hasRecentPurchase(ingredientData.id, yesterdayStr, qty, total_price)) {
      return {
        success: false,
        message: '⚠️ พบการบันทึกซ้ำที่คล้ายกันใน 24 ชั่วโมงที่ผ่านมา',
        error: 'DUPLICATE_PURCHASE'
      };
    }

    // Calculate unit price
    const unitPrice = qty > 0 ? (total_price / qty) : 0;

    // Normalize unit
    const normalizedUnit = _normalizeUnit(unit);

    // Add purchase with enhanced error handling
    const result = _safeAddPurchase({
      userKey: 'AI_AGENT',
      date: date,
      ingredient_id: ingredientData.id,
      qty_buy: qty,
      unit: normalizedUnit,
      total_price: total_price,
      supplier_note: note || `บันทึกโดย AI Agent - ${new Date().toLocaleString('th-TH')}`,
      actual_yield: null
    });

    const processingTime = Date.now() - startTime;
    Logger.log(`[AI Agent] Purchase added successfully in ${processingTime}ms: ${ingredient} ${qty} ${normalizedUnit}`);

    return {
      success: true,
      message: `✅ บันทึกการซื้อ ${ingredient} ${qty} ${normalizedUnit} ราคา ${total_price} บาท`,
      data: {
        ingredient: ingredient,
        actualName: ingredientData.name,
        quantity: qty,
        unit: normalizedUnit,
        totalPrice: total_price,
        unitPrice: unitPrice.toFixed(2),
        purchaseId: result.id,
        processingTime: processingTime
      }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    Logger.log(`[AI Agent] Purchase processing error in ${processingTime}ms: ${error.message}`);

    // Return specific error messages
    let errorMessage = '❌ ไม่สามารถบันทึกการซื้อได้';
    if (error.message.includes('SHEET_NOT_FOUND')) {
      errorMessage = '📊 ไม่พบชีตข้อมูลการซื้อ ตรวจสอบการเชื่อมต่อ Google Sheets';
    } else if (error.message.includes('PERMISSION')) {
      errorMessage = '🔒 ไม่มีสิทธิ์ในการเขียนข้อมูล ตรวจสอบสิทธิ์การใช้งาน';
    }

    return {
      success: false,
      message: errorMessage,
      error: error.message,
      processingTime: processingTime
    };
  }
}

/**
 * IMPROVED VERSION: Replace addExpenseFromAI in gas/Code.gs around line 2910
 */
function addExpenseFromAI(params) {
  const startTime = Date.now();

  try {
    const { date, description, amount, category } = params;

    // Input validation
    if (!description || !amount) {
      return {
        success: false,
        message: '❌ กรุณาระบุรายการค่าใช้จ่ายและจำนวนเงินให้ครบถ้วน',
        error: 'MISSING_REQUIRED_FIELDS'
      };
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: '❌ จำนวนเงินต้องเป็นตัวเลขที่มากกว่า 0',
        error: 'INVALID_AMOUNT'
      };
    }

    // Auto-categorize if not provided
    const finalCategory = category || _autoCategorizeExpense(description);

    // Ensure Expenses sheet exists with validation
    const sh = _ensureExpensesSheet();

    // Add expense with proper error handling
    const expenseData = [
      date,
      description,
      amount,
      finalCategory,
      new Date().toISOString(),
      'AI_AGENT',
      Utilities.getUuid() // Add unique ID for tracking
    ];

    sh.appendRow(expenseData);

    const processingTime = Date.now() - startTime;
    Logger.log(`[AI Agent] Expense added successfully in ${processingTime}ms: ${description} ${amount} บาท`);

    return {
      success: true,
      message: `✅ บันทึกค่าใช้จ่าย "${description}" ${amount} บาท (${finalCategory})`,
      data: {
        description: description,
        amount: amount,
        category: finalCategory,
        expenseId: expenseData[6],
        processingTime: processingTime
      }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    Logger.log(`[AI Agent] Expense processing error in ${processingTime}ms: ${error.message}`);

    let errorMessage = '❌ ไม่สามารถบันทึกค่าใช้จ่ายได้';
    if (error.message.includes('SHEET_NOT_FOUND')) {
      errorMessage = '📊 ไม่พบชีตข้อมูลค่าใช้จ่าย ตรวจสอบการเชื่อมต่อ Google Sheets';
    } else if (error.message.includes('PERMISSION')) {
      errorMessage = '🔒 ไม่มีสิทธิ์ในการเขียนข้อมูล ตรวจสอบสิทธิ์การใช้งาน';
    }

    return {
      success: false,
      message: errorMessage,
      error: error.message,
      processingTime: processingTime
    };
  }
}

/**
 * IMPROVED VERSION: Replace getMenuByName in gas/Code.gs (add this function if missing)
 */
function getMenuByName(params) {
  try {
    const { name } = params;

    if (!name) {
      return {
        success: false,
        message: '❌ กรุณาระบุชื่อเมนู',
        error: 'MISSING_MENU_NAME'
      };
    }

    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_MENU);
    if (!sheet) {
      return {
        success: false,
        message: '❌ ไม่พบข้อมูลเมนูอาหาร',
        error: 'MENU_SHEET_NOT_FOUND'
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find column indices
    const nameIdx = headers.indexOf('name') || headers.indexOf('ชื่อเมนู') || 0;
    const idIdx = headers.indexOf('id') || headers.indexOf('รหัส') || 1;
    const priceIdx = headers.indexOf('price') || headers.indexOf('ราคา') || 2;

    // Search for menu with fuzzy matching
    let foundMenu = null;
    let bestMatch = 0;

    for (let i = 1; i < data.length; i++) {
      const menuName = String(data[i][nameIdx] || '').toLowerCase();
      const searchName = name.toLowerCase();

      // Calculate similarity score
      const similarity = _calculateSimilarity(menuName, searchName);
      if (similarity > bestMatch && similarity > 0.6) { // 60% similarity threshold
        bestMatch = similarity;
        foundMenu = {
          id: data[i][idIdx],
          name: data[i][nameIdx],
          price: data[i][priceIdx],
          similarity: similarity
        };
      }
    }

    if (foundMenu) {
      return {
        success: true,
        message: `✅ พบเมนู "${foundMenu.name}"`,
        data: foundMenu
      };
    } else {
      // Get suggestions
      const suggestions = _getMenuSuggestions(name);
      return {
        success: false,
        message: `❌ ไม่พบเมนู "${name}"`,
        suggestions: suggestions,
        error: 'MENU_NOT_FOUND'
      };
    }

  } catch (error) {
    Logger.log('[AI Agent] Error getting menu: ' + error.message);
    return {
      success: false,
      message: '❌ ไม่สามารถค้นหาข้อมูลเมนูได้',
      error: error.message
    };
  }
}

// ===== NEW HELPER FUNCTIONS TO ADD =====

/**
 * Safely add purchase with error handling
 */
function _safeAddPurchase(purchaseData) {
  try {
    return addPurchase(purchaseData);
  } catch (error) {
    Logger.log('[AI Agent] Safe purchase error: ' + error.message);
    throw error;
  }
}

/**
 * Ensure Expenses sheet exists with proper structure
 */
function _ensureExpensesSheet() {
  try {
    let sh = SpreadsheetApp.getActive().getSheetByName(SHEET_EXPENSES);

    if (!sh) {
      // Create sheet if doesn't exist
      sh = SpreadsheetApp.getActive().insertSheet(SHEET_EXPENSES);
    }

    // Check headers
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const requiredHeaders = ['date', 'description', 'amount', 'category', 'created_at', 'created_by', 'id'];

    if (headers.length < requiredHeaders.length ||
        !requiredHeaders.every(header => headers.includes(header))) {
      // Add missing headers
      sh.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
      sh.getRange("A1:G1").setFontWeight("bold");
    }

    return sh;

  } catch (error) {
    Logger.log('[AI Agent] Error ensuring expenses sheet: ' + error.message);
    throw new Error('SHEET_NOT_FOUND: ไม่สามารถสร้างหรือเข้าถึงชีตค่าใช้จ่ายได้');
  }
}

/**
 * Check for recent duplicate purchases
 */
function _hasRecentPurchase(ingredientId, dateStr, qty, totalPrice) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_PUR);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const dateIdx = headers.indexOf('date') || 0;
    const ingredientIdx = headers.indexOf('ingredient_id') || 1;
    const qtyIdx = headers.indexOf('qty_buy') || 2;
    const priceIdx = headers.indexOf('total_price') || 3;

    // Check last 50 rows for duplicates
    const recentData = data.slice(-50);

    for (let i = 1; i < recentData.length; i++) {
      const row = recentData[i];
      const rowDate = String(row[dateIdx] || '');
      const rowIngredientId = String(row[ingredientIdx] || '');
      const rowQty = Number(row[qtyIdx] || 0);
      const rowPrice = Number(row[priceIdx] || 0);

      // Check for exact match within tolerance
      if (rowIngredientId === String(ingredientId) &&
          rowDate >= dateStr &&
          Math.abs(rowQty - qty) < 0.1 &&
          Math.abs(rowPrice - totalPrice) < 1) {
        return true;
      }
    }

    return false;

  } catch (error) {
    Logger.log('[AI Agent] Error checking duplicate purchase: ' + error.message);
    return false;
  }
}

/**
 * Calculate string similarity for fuzzy matching
 */
function _calculateSimilarity(str1, str2) {
  try {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = _levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;

  } catch (error) {
    Logger.log('[AI Agent] Error calculating similarity: ' + error.message);
    return 0;
  }
}

/**
 * Levenshtein distance calculation for string similarity
 */
function _levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Get menu suggestions based on input
 */
function _getMenuSuggestions(input) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_MENU);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const suggestions = [];
    const inputLower = input.toLowerCase();

    // Find column index for menu name
    const headers = data[0];
    const nameIdx = headers.indexOf('name') || headers.indexOf('ชื่อเมนู') || 0;

    // Get top 5 similar menus
    for (let i = 1; i < Math.min(data.length, 51); i++) {
      const menuName = String(data[i][nameIdx] || '');
      const similarity = _calculateSimilarity(menuName.toLowerCase(), inputLower);

      if (similarity > 0.3) { // 30% similarity threshold
        suggestions.push({
          name: menuName,
          similarity: similarity
        });
      }
    }

    // Sort by similarity and return top 5
    suggestions.sort((a, b) => b.similarity - a.similarity);
    return suggestions.slice(0, 5).map(s => s.name);

  } catch (error) {
    Logger.log('[AI Agent] Error getting menu suggestions: ' + error.message);
    return [];
  }
}

/**
 * Get ingredient suggestions based on input
 */
function _getIngredientSuggestions(input) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName('Ingredients');
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const suggestions = [];
    const inputLower = input.toLowerCase();

    // Find column index for ingredient name
    const headers = data[0];
    const nameIdx = headers.indexOf('name') || headers.indexOf('ชื่อวัตถุดิบ') || 1;

    // Get top 5 similar ingredients
    for (let i = 1; i < Math.min(data.length, 51); i++) {
      const ingredientName = String(data[i][nameIdx] || '');
      const similarity = _calculateSimilarity(ingredientName.toLowerCase(), inputLower);

      if (similarity > 0.3) { // 30% similarity threshold
        suggestions.push({
          name: ingredientName,
          similarity: similarity
        });
      }
    }

    // Sort by similarity and return top 5
    suggestions.sort((a, b) => b.similarity - a.similarity);
    return suggestions.slice(0, 5).map(s => s.name);

  } catch (error) {
    Logger.log('[AI Agent] Error getting ingredient suggestions: ' + error.message);
    return [];
  }
}

/**
 * Auto-categorize expense based on description
 */
function _autoCategorizeExpense(description) {
  const categories = {
    'ค่าแรง': ['แรง', 'จ้าง', 'พนักงาน', 'เงินเดือน', 'เบี้ยขยัน'],
    'สาธารณูปโภค': ['น้ำ', 'ไฟ', 'ไฟฟ้า', 'ประปา', 'อินเตอร์เน็ต', 'wifi'],
    'ค่าขนส่ง': ['ส่ง', 'ขนส่ง', 'รถ', 'เดินทาง', 'น้ำมัน', 'เดลิเวอรี่'],
    'วัตถุดิบ': ['พริก', 'กระเทียม', 'มะนาว', 'กะหล่ำ', 'หอม', 'ผัก'],
    'อุปกรณ์': ['จาน', 'ช้อน', 'ถ้วย', 'หม้อ', 'ตะเกียบ', 'ที่ครัว'],
    'สื่อสาร': ['โทร', 'โทรศัพท์', 'ค่าส่ง', 'แอพ', 'แอปพลิเคชัน'],
    'บำรุงรักษา': ['ซ่อม', 'บำรุง', 'ซ่อมบำรุง', 'ซ่อมแซม'],
    'การตลาด': ['โฆษณา', 'ประชาสัมพันธ์', 'โปรโมชั่น', 'โฆษณา'],
    'อื่นๆ': [] // Default category
  };

  const descriptionLower = description.toLowerCase();

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (descriptionLower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'อื่นๆ';
}

/**
 * Add test functions for validation
 */
function testAIProcessing() {
  try {
    const result = processAIMessage({
      message: "ซื้อพริก 2 กิโล 100 บาท",
      context: {}
    });
    Logger.log('AI Processing Test Result: ' + JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    Logger.log('AI Processing Test Error: ' + error.message);
    return { success: false, error: error.message };
  }
}

function testPurchaseFlow() {
  try {
    const result = addPurchaseFromAI({
      date: Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd'),
      ingredient: 'พริกขี้หนู',
      qty: 2,
      unit: 'กิโล',
      total_price: 100,
      note: 'Test purchase'
    });
    Logger.log('Purchase Flow Test Result: ' + JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    Logger.log('Purchase Flow Test Error: ' + error.message);
    return { success: false, error: error.message };
  }
}

function testExpenseFlow() {
  try {
    const result = addExpenseFromAI({
      date: Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd'),
      description: 'ค่าไฟฟ้า',
      amount: 500,
      category: 'สาธารณูปโภค'
    });
    Logger.log('Expense Flow Test Result: ' + JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    Logger.log('Expense Flow Test Error: ' + error.message);
    return { success: false, error: error.message };
  }
}

function testErrorHandling() {
  try {
    const result = processAIMessage({
      message: "invalid command xyz123",
      context: {}
    });
    Logger.log('Error Handling Test Result: ' + JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    Logger.log('Error Handling Test Error: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Performance monitoring function
 */
function getAIPerformanceMetrics() {
  try {
    const cache = CacheService.getScriptCache();
    const metrics = cache.get('ai_performance_metrics');

    if (metrics) {
      const parsed = JSON.parse(metrics);
      Logger.log('AI Performance Metrics: ' + JSON.stringify(parsed, null, 2));
      return parsed;
    } else {
      return { message: 'No performance metrics available' };
    }
  } catch (error) {
    Logger.log('Error getting performance metrics: ' + error.message);
    return { error: error.message };
  }
}

/**
 * Clear AI cache for debugging
 */
function clearAICache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove('ai_processing_flag');
    cache.remove('ai_processing_start_time');
    cache.remove('ai_performance_metrics');
    Logger.log('AI Cache cleared successfully');
    return { success: true, message: 'AI Cache cleared' };
  } catch (error) {
    Logger.log('Error clearing AI cache: ' + error.message);
    return { success: false, error: error.message };
  }
}
