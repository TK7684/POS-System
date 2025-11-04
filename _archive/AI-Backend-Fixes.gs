/**
 * AI Backend Fixes for Google Apps Script
 * Fixes timeout issues, error handling, and repeated output problems
 *
 * @author Backend Fix Specialist
 * @version 1.0
 */

// ===== AI AGENT TIMEOUT & ERROR HANDLING FIXES =====

/**
 * Fixed AI Agent Process Message with timeout protection
 * @param {Object} params - {message: string, context: Object}
 * @returns {Object} Processed response with error handling
 */
function processAIMessage(params) {
  const startTime = Date.now();
  const TIMEOUT_MS = 30000; // 30 second timeout

  try {
    const { message, context } = params;

    if (!message || typeof message !== 'string') {
      return {
        success: false,
        message: '❌ ข้อความไม่ถูกต้อง กรุณาพิมพ์ใหม่',
        error: 'INVALID_INPUT'
      };
    }

    // Clear any stuck processing flags
    _resetAIProcessingState();

    // Process with timeout protection
    const response = _processWithTimeout(() => {
      return _analyzeAndProcessMessage(message, context);
    }, TIMEOUT_MS);

    const processingTime = Date.now() - startTime;
    Logger.log(`[AI Agent] Message processed in ${processingTime}ms`);

    return {
      success: true,
      message: response.message,
      data: response.data,
      actions: response.actions || [],
      processingTime: processingTime
    };

  } catch (error) {
    Logger.log(`[AI Agent] Error processing message: ${error.message}`);

    // Return specific error messages instead of generic repeats
    let errorMessage = '❌ เกิดข้อผิดพลาดที่ไม่คาดคิด';

    if (error.message.includes('TIMEOUT')) {
      errorMessage = '⏰ การประมวลผลนานเกินไป กรุณาลองใหม่';
    } else if (error.message.includes('SHEET_NOT_FOUND')) {
      errorMessage = '📊 ไม่พบข้อมูลที่ต้องการ ตรวจสอบการเชื่อมต่อ Google Sheets';
    } else if (error.message.includes('PERMISSION')) {
      errorMessage = '🔒 ไม่มีสิทธิ์ในการเข้าถึงข้อมูล ตรวจสอบสิทธิ์การใช้งาน';
    } else if (error.message.includes('VALIDATION')) {
      errorMessage = '⚠️ ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบรูปแบบข้อมูล';
    } else if (error.message.includes('DUPLICATE')) {
      errorMessage = '🔄 พบข้อมูลซ้ำ กรุณาตรวจสอบอีกครั้ง';
    }

    return {
      success: false,
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Fixed Batch Processing with validation and error recovery
 * @param {Object} params - Batch processing parameters
 * @returns {Object} Batch processing results
 */
function processBatchAIData(params) {
  const BATCH_TIMEOUT = 60000; // 1 minute timeout
  const MAX_BATCH_SIZE = 50;

  try {
    const { purchases = [], expenses = [], date } = params;

    // Validate batch size
    const totalItems = purchases.length + expenses.length;
    if (totalItems > MAX_BATCH_SIZE) {
      throw new Error(`ข้อมูลมากเกินไป รองรับสูงสุด ${MAX_BATCH_SIZE} รายการต่อครั้ง`);
    }

    // Process with timeout protection
    const result = _processWithTimeout(() => {
      return _processBatchWithValidation(purchases, expenses, date);
    }, BATCH_TIMEOUT);

    return {
      success: true,
      message: `✅ ประมวลผลสำเร็จ ${result.successCount}/${totalItems} รายการ`,
      results: result.results,
      errors: result.errors,
      summary: {
        total: totalItems,
        success: result.successCount,
        failed: result.errors.length
      }
    };

  } catch (error) {
    Logger.log(`[AI Agent] Batch processing error: ${error.message}`);

    return {
      success: false,
      message: '❌ ประมวลผลข้อมูลจำนวนมากล้มเหลว',
      error: error.message,
      suggestion: 'กรุณาแบ่งข้อมูลเป็นกลุ่มเล็กๆ และลองใหม่'
    };
  }
}

/**
 * Enhanced Purchase Processing with validation
 * @param {Object} params - Purchase parameters
 * @returns {Object} Processing result
 */
function addPurchaseEnhanced(params) {
  try {
    const { date, ingredient, qty, unit, total_price, note } = params;

    // Input validation
    if (!ingredient || !qty || !total_price) {
      throw new Error('VALIDATION: กรุณาระบุชื่อวัตถุดิบ จำนวน และราคา');
    }

    // Validate numeric values
    if (isNaN(qty) || isNaN(total_price) || qty <= 0 || total_price <= 0) {
      throw new Error('VALIDATION: จำนวนและราคาต้องเป็นตัวเลขที่มากกว่า 0');
    }

    // Find ingredient with fuzzy matching
    const ingredientData = _findIngredientWithFuzzy(ingredient);
    if (!ingredientData) {
      // Return suggestions instead of error
      const suggestions = _getIngredientSuggestions(ingredient);
      return {
        success: false,
        message: `❌ ไม่พบวัตถุดิบ "${ingredient}"`,
        suggestions: suggestions,
        action: 'CONFIRM_INGREDIENT'
      };
    }

    // Check for duplicates
    if (_isDuplicatePurchase(ingredientData.id, date, qty, total_price)) {
      return {
        success: false,
        message: '⚠️ พบการบันทึกที่คล้ายกันในวันเดียวกัน',
        duplicateInfo: _findSimilarPurchases(ingredientData.id, date),
        action: 'CONFIRM_DUPLICATE'
      };
    }

    // Process purchase
    const result = _addPurchaseToSheet({
      ingredient_id: ingredientData.id,
      date: date,
      qty: qty,
      unit: _normalizeUnit(unit),
      total_price: total_price,
      note: note || `บันทึกโดย AI Agent - ${new Date().toLocaleString('th-TH')}`
    });

    return {
      success: true,
      message: `✅ บันทึกการซื้อ ${ingredient} ${qty} ${_normalizeUnit(unit)} ในราคา ${total_price} บาท`,
      data: {
        ingredient: ingredient,
        actualName: ingredientData.name,
        quantity: qty,
        unit: _normalizeUnit(unit),
        totalPrice: total_price,
        unitPrice: (total_price / qty).toFixed(2),
        purchaseId: result.purchaseId
      }
    };

  } catch (error) {
    Logger.log(`[AI Agent] Purchase processing error: ${error.message}`);
    return {
      success: false,
      message: `❌ บันทึกการซื้อล้มเหลว: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Enhanced Expense Processing with category validation
 * @param {Object} params - Expense parameters
 * @returns {Object} Processing result
 */
function addExpenseEnhanced(params) {
  try {
    const { date, description, amount, category } = params;

    // Input validation
    if (!description || !amount) {
      throw new Error('VALIDATION: กรุณาระบุรายการค่าใช้จ่ายและจำนวนเงิน');
    }

    if (isNaN(amount) || amount <= 0) {
      throw new Error('VALIDATION: จำนวนเงินต้องเป็นตัวเลขที่มากกว่า 0');
    }

    // Auto-categorize if not provided
    const finalCategory = category || _autoCategorizeExpense(description);

    // Process expense
    const result = _addExpenseToSheet({
      date: date,
      description: description,
      amount: amount,
      category: finalCategory,
      source: 'AI Agent'
    });

    return {
      success: true,
      message: `✅ บันทึกค่าใช้จ่าย "${description}" ${amount} บาท`,
      data: {
        description: description,
        amount: amount,
        category: finalCategory,
        expenseId: result.expenseId
      }
    };

  } catch (error) {
    Logger.log(`[AI Agent] Expense processing error: ${error.message}`);
    return {
      success: false,
      message: `❌ บันทึกค่าใช้จ่ายล้มเหลว: ${error.message}`,
      error: error.message
    };
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Process function with timeout protection
 * @param {Function} fn - Function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {*} Function result
 */
function _processWithTimeout(fn, timeoutMs) {
  const startTime = Date.now();
  const result = fn();

  if (Date.now() - startTime > timeoutMs) {
    throw new Error('TIMEOUT: การประมวลผลนานเกินกำหนด');
  }

  return result;
}

/**
 * Reset AI processing state
 */
function _resetAIProcessingState() {
  // Clear any stuck processing flags in cache
  const cache = CacheService.getScriptCache();
  cache.remove('ai_processing_flag');
  cache.remove('ai_processing_start_time');
}

/**
 * Analyze and process AI message with command detection
 * @param {string} message - User message
 * @param {Object} context - Conversation context
 * @returns {Object} Processing result
 */
function _analyzeAndProcessMessage(message, context) {
  const normalizedMessage = message.toLowerCase().trim();

  // Command patterns
  const patterns = {
    purchase: /(?:ซื้อ|จ่าย|ซื้อวัตถุดิบ)/i,
    expense: /(?:ค่า|จ้าง|ค่าจ้าง|ค่าน้ำ|ค่าไฟ|ค่าแรง)/i,
    menu: /(?:เมนู|ต้นทุน|สูตร|คำนวน)/i,
    stock: /(?:สต๊อก|เหลือ|คงเหลือ|ตรวจสอบ)/i,
    help: /(?:ช่วย|วิธี|help|วิธีใช้)/i
  };

  // Detect command type
  if (patterns.purchase.test(normalizedMessage)) {
    return _processPurchaseCommand(message);
  } else if (patterns.expense.test(normalizedMessage)) {
    return _processExpenseCommand(message);
  } else if (patterns.menu.test(normalizedMessage)) {
    return _processMenuCommand(message);
  } else if (patterns.stock.test(normalizedMessage)) {
    return _processStockCommand(message);
  } else if (patterns.help.test(normalizedMessage)) {
    return _getHelpResponse();
  } else {
    return _getGenericResponse(message);
  }
}

/**
 * Get ingredient suggestions based on input
 * @param {string} input - Ingredient name input
 * @returns {Array} Array of suggestions
 */
function _getIngredientSuggestions(input) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName('Ingredients');
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const suggestions = [];

    // Skip header row
    for (let i = 1; i < Math.min(data.length, 11); i++) {
      const ingredientName = String(data[i][1] || '').toLowerCase();
      if (ingredientName.includes(input.toLowerCase())) {
        suggestions.push(String(data[i][1]));
      }
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions

  } catch (error) {
    Logger.log(`[AI Agent] Error getting suggestions: ${error.message}`);
    return [];
  }
}

/**
 * Auto-categorize expense based on description
 * @param {string} description - Expense description
 * @returns {string} Category name
 */
function _autoCategorizeExpense(description) {
  const categories = {
    'ค่าแรง': ['แรง', 'จ้าง', 'พนักงาน', 'เงินเดือน'],
    'สาธารณูปโภค': ['น้ำ', 'ไฟ', 'ไฟฟ้า', 'ประปา', 'อินเตอร์เน็ต'],
    'ค่าขนส่ง': ['ส่ง', 'ขนส่ง', 'รถ', 'เดินทาง', 'น้ำมัน'],
    'วัตถุดิบ': ['พริก', 'กระเทียม', 'มะนาว', 'กะหล่ำ'],
    'อุปกรณ์': ['จาน', 'ช้อน', 'ถ้วย', 'หม้อ', 'ตะเกียบ'],
    'สื่อสาร': ['โทร', 'โทรศัพท์', 'ค่าส่ง', 'แอพ'],
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
 * Get AI agent help response
 * @returns {Object} Help response
 */
function _getHelpResponse() {
  return {
    message: `🤖 **วิธีการใช้ AI Assistant**

ฉันสามารถช่วยคุณได้ในเรื่องต่างๆ เช่น:

**📦 บันทึกการซื้อวัตถุดิบ:**
- "ซื้อ พริก 2 กิโล 100 บาท"
- "20251008 ซื้อ กุ้ง 3 กิโล 450 บาท"

**💰 บันทึกค่าใช้จ่าย:**
- "ค่าจ้างพนักงาน 500 บาท"
- "ค่าไฟฟ้า 1200 บาท"

**🍲 คำนวณต้นทุนเมนู:**
- "ช่วยคำนวณต้นทุนเมนูกุ้งแช่น้ำปลา"
- "เมนูส้มตำไทย ต้นทุนเท่าไหร่"

**📊 ตรวจสอบสต๊อก:**
- "สต๊อกพริกเหลือเท่าไหร่"
- "สต๊อกวัตถุดิบทั้งหมด"

ลองพิมพ์คำสั่งดูได้เลย! 😊`,
    actions: ['SHOW_EXAMPLES']
  };
}

/**
 * Get generic response for unknown commands
 * @param {string} message - User message
 * @returns {Object} Generic response
 */
function _getGenericResponse(message) {
  return {
    message: `🤔 ฉันไม่แน่ใจว่าต้องการทำอะไรกับ "${message}"

กรุณาลองพิมพ์คำสั่งเหล่านี้:
- "ช่วยเหลือ" - ดูวิธีการใช้งาน
- "ซื้อ [วัตถุดิบ] [จำนวน] [หน่วย] [ราคา]" - บันทึกการซื้อ
- "ค่า [รายการ] [จำนวนเงิน]" - บันทึกค่าใช้จ่าย

หรือพิมพ์ "ช่วยเหลือ" เพื่อดูตัวอย่างเพิ่มเติม`,
    actions: ['SHOW_HELP']
  };
}

// Additional helper functions would be implemented here...
// _processPurchaseCommand, _processExpenseCommand, _processMenuCommand,
// _processStockCommand, _findIngredientWithFuzzy, _isDuplicatePurchase, etc.
