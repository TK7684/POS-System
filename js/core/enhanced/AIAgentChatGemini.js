/**
 * Gemini-Integrated Enhanced AI Agent Chat System
 * Combines rule-based parsing with Gemini AI for intelligent expense processing
 *
 * @author Gemini-Enhanced AI Assistant
 * @version 3.0
 */

class AIAgentChatGemini {
  constructor(apiKey) {
    this.gemini = new AIAgentGemini(apiKey);
    this.conversationHistory = [];
    this.isProcessing = false;
    this.currentContext = null;
    this.pendingData = null;
    this.useGemini = true;

    // Initialize Gemini
    this.initializeGemini();

    // Enhanced patterns (fallback)
    this.patterns = {
      date: /(\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*-\d{4}|\d{8}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      multiplier: /\s*\*(\d+)\s*$/,
      thaiMonths: {
        'มกรา': 'Jan', 'ม.ค.': 'Jan', 'มค': 'Jan',
        'กุมภา': 'Feb', 'ก.พ.': 'Feb', 'กพ': 'Feb',
        'มีนา': 'Mar', 'มี.ค.': 'Mar', 'มีค': 'Mar',
        'เมษา': 'Apr', 'เม.ย.': 'Apr', 'มย': 'Apr',
        'พฤษภา': 'May', 'พ.ค.': 'May', 'พค': 'May',
        'มิถุนา': 'Jun', 'มิ.ย.': 'Jun', 'มย': 'Jun',
        'กรกฎา': 'Jul', 'ก.ค.': 'Jul', 'กค': 'Jul',
        'สิงหา': 'Aug', 'ส.ค.': 'Aug', 'สค': 'Aug',
        'กันยา': 'Sep', 'ก.ย.': 'Sep', 'กย': 'Sep',
        'ตุลา': 'Oct', 'ต.ค.': 'Oct', 'ตค': 'Oct',
        'พฤศจิ': 'Nov', 'พ.ย.': 'Nov', 'พย': 'Nov',
        'ธันวา': 'Dec', 'ธ.ค.': 'Dec', 'ธค': 'Dec'
      }
    };

    // Unit mapping
    this.unitMap = {
      'มล': 'ml', 'มิลลิลิตร': 'ml', 'ml': 'ml',
      'ลิตร': 'liter', 'ลิตร': 'liter', 'l': 'liter', 'L': 'liter',
      'กิโล': 'kg', 'กิโลกรัม': 'kg', 'กก': 'kg', 'กก.': 'kg', 'kg': 'kg',
      'กรัม': 'g', 'กรัม': 'g', 'ก': 'g', 'g': 'g',
      'ตัว': 'piece', 'ชิ้น': 'piece', 'ลูก': 'piece', 'ชิ้น': 'piece',
      'แพ็ค': 'pack', 'แพ็ค': 'pack', 'pack': 'pack',
      'กล่อง': 'box', 'กล่อง': 'box', 'box': 'box',
      'ถุง': 'bag', 'ถุง': 'bag', 'bag': 'bag',
      'ขวด': 'bottle', 'ขวด': 'bottle', 'bottle': 'bottle',
      'ใบ': 'sheet', 'sheet': 'sheet',
      'เครื่อง': 'unit', 'หัว': 'piece'
    };
  }

  /**
   * Initialize Gemini API
   */
  async initializeGemini() {
    try {
      const isConnected = await this.gemini.initialize();
      if (!isConnected) {
        console.warn('Gemini API connection failed, falling back to rule-based parsing');
        this.useGemini = false;
      } else {
        console.log('Gemini API connected successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
      this.useGemini = false;
    }
  }

  /**
   * Enhanced batch text processing with Gemini
   * @param {string} textInput - Raw text input
   * @returns {Object} Parsed data with AI categorization
   */
  async processBatchTextGemini(textInput) {
    try {
      this.isProcessing = true;

      // Show processing message
      const processingMsg = this.useGemini ?
        '🤖 กำลังวิเคราะห์ด้วย Gemini AI...' :
        '🔍 กำลังวิเคราะห์ข้อมูล...';

      if (window.aiChatEnhancedUI) {
        window.aiChatEnhancedUI.addMessage('system', processingMsg);
      }

      let parsedItems;

      if (this.useGemini) {
        // Try Gemini parsing first
        try {
          const geminiResult = await this.gemini.parseExpenseText(textInput);
          parsedItems = geminiResult.items || [];
        } catch (error) {
          console.error('Gemini parsing failed, falling back:', error);
          parsedItems = this.parseWithRules(textInput);
        }
      } else {
        // Use rule-based parsing
        parsedItems = this.parseWithRules(textInput);
      }

      // Validate and correct data
      if (this.useGemini && parsedItems.length > 0) {
        try {
          parsedItems = await this.gemini.validateAndCorrect(parsedItems);
        } catch (error) {
          console.error('Gemini validation failed:', error);
        }
      }

      // Enhanced categorization
      if (this.useGemini && parsedItems.length > 0) {
        try {
          parsedItems = await this.gemini.categorizeItems(parsedItems);
        } catch (error) {
          console.error('Gemini categorization failed:', error);
          // Fallback to rule-based categorization
          parsedItems = this.categorizeWithRules(parsedItems);
        }
      } else {
        parsedItems = this.categorizeWithRules(parsedItems);
      }

      // Categorize items into groups
      const categorizedData = this.categorizeIntoGroups(parsedItems);

      // Store for confirmation
      this.pendingData = {
        originalText: textInput,
        parsedItems: categorizedData,
        timestamp: new Date().toISOString(),
        processedWithGemini: this.useGemini
      };

      this.isProcessing = false;

      return {
        success: true,
        data: categorizedData,
        summary: this.generateSummary(categorizedData),
        needsConfirmation: true,
        geminiEnhanced: this.useGemini
      };

    } catch (error) {
      this.isProcessing = false;
      return {
        success: false,
        error: error.message,
        message: 'ไม่สามารถวิเคราะห์ข้อมูลได้ กรุณาตรวจสอบรูปแบบข้อมูล'
      };
    }
  }

  /**
   * Rule-based parsing (fallback)
   * @param {string} textInput - Text to parse
   * @returns {Array} Parsed items
   */
  parseWithRules(textInput) {
    const lines = textInput.split('\n').filter(line => line.trim());
    const parsedItems = [];
    let currentDate = this.getCurrentDate();
    let globalDate = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Extract date
      const dateMatch = trimmedLine.match(this.patterns.date);
      let lineDate = globalDate || currentDate;

      if (dateMatch) {
        lineDate = this.parseDate(dateMatch[1]);
        if (!globalDate) globalDate = lineDate;
      }

      // Parse item
      const itemData = this.parseLineItem(trimmedLine, lineDate);
      if (itemData) {
        parsedItems.push(itemData);
      }
    }

    return parsedItems;
  }

  /**
   * Parse individual line item
   * @param {string} line - Single line
   * @param {string} date - Date for this line
   * @returns {Object|null} Parsed item
   */
  parseLineItem(line, date) {
    // Remove date if present
    const cleanLine = line.replace(this.patterns.date, '').trim();

    // Check multiplier
    let multiplier = 1;
    const multiplierMatch = cleanLine.match(this.patterns.multiplier);
    let itemDescription = cleanLine;

    if (multiplierMatch) {
      multiplier = parseInt(multiplierMatch[1]);
      itemDescription = cleanLine.replace(this.patterns.multiplier, '').trim();
    }

    // Extract price
    let price = null;
    let descriptionWithoutPrice = itemDescription;

    const priceMatch = itemDescription.match(/(.+?)\s*(\d+(?:\.\d+)?)\s*(ค่าส่ง\s*)?$/);
    if (priceMatch) {
      descriptionWithoutPrice = priceMatch[1].trim();
      price = parseFloat(priceMatch[2]);

      if (priceMatch[3]) {
        return {
          date: date,
          description: 'ค่าส่ง',
          category: 'ค่าขนส่ง',
          quantity: 1,
          unit: 'item',
          price: price,
          type: 'expense',
          multiplier: 1,
          originalLine: line
        };
      }
    }

    if (price === null) return null;

    // Extract quantity and unit
    const quantityUnitMatch = descriptionWithoutPrice.match(/(.+?)\s*(\d+(?:\.\d+)?)\s*([ก-๙a-zA-Z]*)\s*$/);

    let itemName = descriptionWithoutPrice;
    let quantity = 1;
    let unit = 'item';

    if (quantityUnitMatch) {
      itemName = quantityUnitMatch[1].trim();
      quantity = parseFloat(quantityUnitMatch[2]);
      unit = this.normalizeUnit(quantityUnitMatch[3]) || 'item';
    }

    return {
      date: date,
      description: itemName,
      quantity: quantity,
      unit: unit,
      price: price / multiplier,
      multiplier: multiplier,
      totalPrice: price,
      originalLine: line,
      type: null
    };
  }

  /**
   * Rule-based categorization
   * @param {Array} items - Items to categorize
   * @returns {Array} Categorized items
   */
  categorizeWithRules(items) {
    for (const item of items) {
      const category = this.determineCategoryRules(item.description);
      item.type = category.type;
      item.category = category.name;
    }
    return items;
  }

  /**
   * Determine category using rules
   * @param {string} description - Item description
   * @returns {Object} Category info
   */
  determineCategoryRules(description) {
    const desc = description.toLowerCase();

    if (/พนักงาน|จ้าง|พลอย/.test(desc)) return { type: 'expense', name: 'ค่าแรง' };
    if (/น้ำแข็ง|ค่าน้ำ|ค่าไฟ/.test(desc)) return { type: 'expense', name: 'สาธารณูปโภค' };
    if (/เครื่องพิมพ์|โทรศัพท์|คอม|เครื่องคิดเงิน|ที่นอน|หมอน|ผ้าห่ม/.test(desc)) return { type: 'equipment', name: 'อุปกรณ์' };
    if (/ถุง|กล่อง|สติ๊กเกอร์|ถุงมือ|ถุงขยะ/.test(desc)) return { type: 'supplies', name: 'บรรจุภัณฑ์' };
    if (/กุ้ง|ปลา|หมู|ไก่|เนื้อ|ผัก|พริก|มะเขือ|มะระ|กะหล่ำ|แครอท|มะนาว|หอม|กระเทียม|ไชเท้า|ผักชี/.test(desc)) return { type: 'purchase', name: 'วัตถุดิบ' };
    if (/คริสตัล|เอโร|โชยุ|อินาริ|วาซาบิ|ฟูจิ|น้ำดื่ม|เบียร์/.test(desc)) return { type: 'purchase', name: 'เครื่องดื่ม' };

    return { type: 'expense', name: 'อื่นๆ' };
  }

  /**
   * Categorize items into groups
   * @param {Array} items - Parsed and categorized items
   * @returns {Object} Grouped items
   */
  categorizeIntoGroups(items) {
    const categorized = {
      purchases: [],
      expenses: [],
      overheads: [],
      equipment: [],
      supplies: [],
      uncategorized: []
    };

    for (const item of items) {
      switch (item.type) {
        case 'purchase':
          categorized.purchases.push(item);
          break;
        case 'expense':
          categorized.expenses.push(item);
          break;
        case 'overhead':
          categorized.overheads.push(item);
          break;
        case 'equipment':
          categorized.equipment.push(item);
          break;
        case 'supplies':
          categorized.supplies.push(item);
          break;
        default:
          categorized.uncategorized.push(item);
      }
    }

    return categorized;
  }

  /**
   * Generate insights using Gemini
   * @param {Object} categorizedData - Categorized data
   * @returns {Object} Insights and recommendations
   */
  async generateInsights(categorizedData) {
    if (!this.useGemini) {
      return {
        summary: 'ไม่สามารถวิเคราะห์ข้อมูลได้ (Gemini API ไม่พร้อมใช้งาน)',
        recommendations: ['ตรวจสอบการเชื่อมต่อ Gemini API'],
        observations: []
      };
    }

    try {
      const summary = this.generateSummary(categorizedData);
      const insights = await this.gemini.generateInsights(summary);

      // Generate natural language summary
      const naturalSummary = await this.gemini.generateSummary(summary);

      return {
        ...insights,
        naturalSummary: naturalSummary,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return {
        summary: 'เกิดข้อผิดพลาดในการวิเคราะห์',
        recommendations: ['ลองใหม่อีกครั้ง'],
        observations: []
      };
    }
  }

  /**
   * Confirm and save with enhanced logging
   * @param {boolean} confirmed - User confirmation
   * @returns {Object} Save result
   */
  async confirmAndSaveGemini(confirmed) {
    if (!this.pendingData) {
      return {
        success: false,
        message: 'ไม่มีข้อมูลรอการยืนยัน'
      };
    }

    if (!confirmed) {
      this.pendingData = null;
      return {
        success: true,
        message: 'ยกเลิกการบันทึกข้อมูลเรียบร้อย'
      };
    }

    try {
      const results = {
        purchases: [],
        expenses: [],
        equipment: [],
        supplies: [],
        success: true,
        errors: [],
        insights: null
      };

      // Save each category
      const savePromises = [
        this.savePurchases(this.pendingData.parsedItems.purchases, results),
        this.saveExpenses([...this.pendingData.parsedItems.expenses, ...this.pendingData.parsedItems.overheads], results),
        this.saveEquipment(this.pendingData.parsedItems.equipment, results),
        this.saveSupplies(this.pendingData.parsedItems.supplies, results)
      ];

      await Promise.allSettled(savePromises);

      // Generate insights after successful save
      if (results.errors.length === 0 && this.useGemini) {
        try {
          results.insights = await this.generateInsights(this.pendingData.parsedItems);
        } catch (error) {
          console.error('Failed to generate insights after save:', error);
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
        results.message = 'บันทึกข้อมูลบางส่วนสำเร็จ มีข้อผิดพลาดบางรายการ';
      } else {
        results.message = 'บันทึกข้อมูลทั้งหมดเรียบร้อย';
        if (results.insights) {
          results.message += ' และสร้างข้อมูลเชิงลึกเรียบร้อย';
        }
      }

      this.pendingData = null;
      return results;

    } catch (error) {
      return {
        success: false,
        message: `เกิดข้อผิดพลาดในการบันทึก: ${error.message}`
      };
    }
  }

  /**
   * Save purchases
   * @param {Array} items - Purchase items
   * @param {Object} results - Results object
   */
  async savePurchases(items, results) {
    for (const item of items) {
      try {
        const result = await this.savePurchase(item);
        results.purchases.push(result);
      } catch (error) {
        results.errors.push(`วัตถุดิบ "${item.description}": ${error.message}`);
      }
    }
  }

  /**
   * Save expenses
   * @param {Array} items - Expense items
   * @param {Object} results - Results object
   */
  async saveExpenses(items, results) {
    for (const item of items) {
      try {
        const result = await this.saveExpense(item);
        results.expenses.push(result);
      } catch (error) {
        results.errors.push(`ค่าใช้จ่าย "${item.description}": ${error.message}`);
      }
    }
  }

  /**
   * Save equipment
   * @param {Array} items - Equipment items
   * @param {Object} results - Results object
   */
  async saveEquipment(items, results) {
    for (const item of items) {
      try {
        const result = await this.saveExpense({
          ...item,
          category: 'อุปกรณ์'
        });
        results.equipment.push(result);
      } catch (error) {
        results.errors.push(`อุปกรณ์ "${item.description}": ${error.message}`);
      }
    }
  }

  /**
   * Save supplies
   * @param {Array} items - Supply items
   * @param {Object} results - Results object
   */
  async saveSupplies(items, results) {
    for (const item of items) {
      try {
        const result = await this.saveExpense({
          ...item,
          category: 'วัสดุสิ้นเปลือง'
        });
        results.supplies.push(result);
      } catch (error) {
        results.errors.push(`วัสดุ "${item.description}": ${error.message}`);
      }
    }
  }

  /**
   * Save purchase to database
   * @param {Object} item - Purchase item
   * @returns {Object} Save result
   */
  async savePurchase(item) {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(result => resolve(result))
          .withFailureHandler(error => reject(new Error(error.message || 'ไม่สามารถบันทึกการซื้อได้')))
          .addPurchaseFromAI({
            date: item.date,
            ingredient: this.normalizeIngredientName(item.description),
            qty: item.quantity * item.multiplier,
            unit: item.unit,
            total_price: item.totalPrice,
            note: `บันทึกโดย AI Agent Gemini - ${item.originalLine}`
          });
      } else {
        resolve({
          success: true,
          message: 'จำลองการบันทึกวัตถุดิบ',
          data: item
        });
      }
    });
  }

  /**
   * Save expense to database
   * @param {Object} item - Expense item
   * @returns {Object} Save result
   */
  async saveExpense(item) {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(result => resolve(result))
          .withFailureHandler(error => reject(new Error(error.message || 'ไม่สามารถบันทึกค่าใช้จ่ายได้')))
          .addExpenseFromAI({
            date: item.date,
            description: item.description,
            amount: item.totalPrice,
            category: item.category || 'อื่นๆ'
          });
      } else {
        resolve({
          success: true,
          message: 'จำลองการบันทึกค่าใช้จ่าย',
          data: item
        });
      }
    });
  }

  /**
   * Generate summary of categorized data
   * @param {Object} categorizedData - Categorized items
   * @returns {Object} Summary statistics
   */
  generateSummary(categorizedData) {
    const summary = {
      totalItems: 0,
      totalAmount: 0,
      categories: {},
      timestamp: new Date().toISOString()
    };

    const categoryTypes = ['purchases', 'expenses', 'overheads', 'equipment', 'supplies', 'uncategorized'];
    const categoryNames = {
      purchases: 'วัตถุดิบ',
      expenses: 'ค่าใช้จ่าย',
      overheads: 'ค่าใช้จ่ายคงที่',
      equipment: 'อุปกรณ์',
      supplies: 'วัสดุสิ้นเปลือง',
      uncategorized: 'ไม่ได้จัดหมวด'
    };

    for (const type of categoryTypes) {
      const items = categorizedData[type];
      if (items.length > 0) {
        const amount = items.reduce((sum, item) => sum + item.totalPrice, 0);
        summary.categories[type] = {
          name: categoryNames[type],
          count: items.length,
          amount: amount
        };
        summary.totalItems += items.length;
        summary.totalAmount += amount;
      }
    }

    return summary;
  }

  /**
   * Parse date from various formats
   * @param {string} dateString - Date string
   * @returns {string} Formatted date (YYYY-MM-DD)
   */
  parseDate(dateString) {
    // Handle DD-MMM-YYYY format
    const ddmmyyyy = dateString.match(/(\d{1,2})-([a-zA-Z]{3})-?(\d{4})/);
    if (ddmmyyyy) {
      const months = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = months[ddmmyyyy[2]] || '01';
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }

    // Handle YYYYMMDD format
    const yyyymmdd = dateString.match(/(\d{4})(\d{2})(\d{2})/);
    if (yyyymmdd) {
      return `${yyyymmdd[1]}-${yyyymmdd[2]}-${yyyymmdd[3]}`;
    }

    // Handle YYYY-MM-DD format
    if (dateString.match(/\d{4}-\d{2}-\d{2}/)) {
      return dateString;
    }

    return this.getCurrentDate();
  }

  /**
   * Get current date in YYYY-MM-DD format
   * @returns {string} Current date
   */
  getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Normalize ingredient name
   * @param {string} name - Original name
   * @returns {string} Normalized name
   */
  normalizeIngredientName(name) {
    const ingredientAliases = {
      'คริสตัล': 'น้ำดื่มคริสตัล',
      'เอโร': 'ซอสเอโร',
      'โชยุ': 'ซอสโชยุ',
      'อินาริ': 'ขนมอินาริ',
      'วาซาบิ': 'วาซาบิ',
      'ฟูจิ': 'ขนมฟูจิ',
      'กะหล่ำ': 'กะหล่ำปลี',
      'พริก': 'พริกขี้หนู',
      'มะนาว': 'มะนาว',
      'กุ้ง': 'กุ้งสด'
    };

    const trimmedName = name.trim();
    return ingredientAliases[trimmedName] || trimmedName;
  }

  /**
   * Normalize unit
   * @param {string} unit - Original unit
   * @returns {string} Normalized unit
   */
  normalizeUnit(unit) {
    if (!unit) return 'piece';
    const normalized = unit.trim().toLowerCase();
    return this.unitMap[normalized] || normalized;
  }

  /**
   * Toggle Gemini usage
   * @param {boolean} useGemini - Whether to use Gemini
   */
  setGeminiUsage(useGemini) {
    this.useGemini = useGemini;
  }

  /**
   * Get system status
   * @returns {Object} System status
   */
  getSystemStatus() {
    return {
      geminiConnected: this.useGemini,
      cacheStats: this.useGemini ? this.gemini.getCacheStats() : null,
      version: '3.0',
      features: {
        geminiEnhanced: this.useGemini,
        batchProcessing: true,
        intelligentCategorization: this.useGemini,
        insightsGeneration: this.useGemini,
        fallbackMode: !this.useGemini
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    if (this.useGemini) {
      this.gemini.clearCache();
    }
  }

  /**
   * Test system connectivity
   * @returns {Object} Test results
   */
  async testSystem() {
    const results = {
      gemini: false,
      fallback: true,
      timestamp: new Date().toISOString()
    };

    if (this.useGemini) {
      try {
        results.gemini = await this.gemini.testConnection();
      } catch (error) {
        results.gemini = false;
      }
    }

    return results;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgentChatGemini;
} else if (typeof window !== 'undefined') {
  window.AIAgentChatGemini = AIAgentChatGemini;
}
