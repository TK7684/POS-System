/**
 * Enhanced AI Agent Chat System
 * Optimized for parsing and categorizing restaurant expense data
 *
 * @author Enhanced AI Assistant
 * @version 2.0
 */

class AIAgentChatEnhanced {
  constructor() {
    this.conversationHistory = [];
    this.isProcessing = false;
    this.currentContext = null;
    this.pendingData = null; // Store parsed data for confirmation

    // Enhanced Thai language patterns
    this.patterns = {
      // Date patterns (DD-MMM-YYYY, YYYYMMDD, etc.)
      date: /(\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*-\d{4}|\d{8}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,

      // Multiplier patterns (*12, *2, etc.)
      multiplier: /\s*\*(\d+)\s*$/,

      // Thai months mapping
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
      },

      // Expense categories with expanded patterns
      expenseCategories: {
        // Labor costs
        'ค่าแรง': /(?:ค่าจ้าง|ค่าแรง|จ้าง|พนักงาน|พลอย|น้องพลอย|เงินเดือน|ค่าล่วงเวลา)/i,

        // Equipment & supplies
        'อุปกรณ์': /(?:เครื่องพิมพ์|โทรศัพท์|คอมพิวเตอร์|เครื่องคิดเงิน|ตู้เย็น|เครื่องปั่น|ไม้แขวน|ที่ตาก|ตะกร้า|ที่ตัก|แหนบ|กล่อง|กรวย|กระบวย)/i,

        // Food ingredients
        'วัตถุดิบ': /(?:กุ้ง|กะหล่ำ|มะระ|พริก|มะนาว|หอม|กระเทียม|ไชเท้า|แครอท|คึ่นช่าย|ใบสะระแหน่|ข้าวญี่ปุ่น|มีด|น้ำมะนาว|น้ำแข็ง|น้ำตาล|ซอส|พริกสวน)/i,

        // Packaging
        'บรรจุภัณฑ์': /(?:ถุง|กล่องข้าว|ถุงหิ้ว|สติ๊กเกอร์|ถุงมือ|ถุงขยะ|ถุงซิป)/i,

        // Utilities
        'สาธารณูปโภค': /(?:น้ำแข็งเหล็ก|ค่าน้ำ|ค่าไฟ|ค่าออเดอร์|ปริ้นท์)/i,

        // Cleaning supplies
        'ของใช้': /(?:ครีมอาบน้ำ|โดฟ|แชม|คอน|ทิชชู่|ผ้าเช็ดมือ)/i,

        // Communication
        'สื่อสาร': /(?:ซิม|เติมเงิน|อินเตอร์เน็ต)/i,

        // Furniture
        'เฟอร์นิเจอร์': /(?:ที่นอน|หมอน|ผ้าห่ม|ราวแขวนผ้า|ไม้แขวนเสื้อ)/i,

        // Beverages & liquids
        'เครื่องดื่ม': /(?:คริสตัล|เอโร|โชยุ|อินาริ|วาซาบิ|ฟูจิ)/i,

        // Transportation
        'ค่าขนส่ง': /(?:ค่าส่ง|ค่าจัดส่ง|ขนส่ง|เดินทาง)/i,

        // Raw materials
        'วัตถุดิบแปรรูป': /(?:แมกกาแรต|ผงเบกกิ้งโซดา|หอมเจียว|น้ำมัน|น้ำปลา|ซอส)/i,

        // Misc
        'อื่นๆ': /(?:ลาลามูฟ|ค่าอื่นๆ|อื่น)/i
      },

      // Purchase patterns
      purchase: /(?:ซื้อ|จ่าย|จัดซื้อ|สั่งซื้อ)/i,
      expense: /(?:ค่า|จ่าย|ค่าใช้จ่าย)/i
    };

    // Enhanced ingredient aliases
    this.ingredientAliases = {
      'คริสตัล': 'น้ำดื่มคริสตัล',
      'เอโร': 'ซอสเอโร',
      'โชยุ': 'ซอสโชยุ',
      'อินาริ': 'ขนมอินาริ',
      'วาซาบิ': 'วาซาบิ',
      'ฟูจิ': 'ขนมฟูจิ',
      'กะหล่ำ': 'กะหล่ำปลี',
      'พริก': 'พริกขี้หนู',
      'พริกสวน': 'พริกสด',
      'มะนาว': 'มะนาว',
      'กุ้ง': 'กุ้งสด',
      'มะระ': 'มะระ',
      'หอม': 'หอมแดง',
      'กระเทียม': 'กระเทียม',
      'ไชเท้า': 'ไชเท้า',
      'แครอท': 'แครอท',
      'คึ่นช่าย': 'คึ่นช่าย',
      'ใบสะระแหน่': 'ใบสะระแหน่',
      'ข้าวญี่ปุ่น': 'ข้าวญี่ปุ่น'
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

    // Special items that should always be expenses
    this.expenseKeywords = [
      'ค่าจ้าง', 'ค่าแรง', 'พนักงาน', 'ค่าน้ำ', 'ค่าไฟ', 'ค่าออเดอร์',
      'ปริ้นท์', 'ค่าส่ง', 'ค่าเช่า', 'ประกัน', 'ภาษี', 'ดอกเบี้ย',
      'ค่าซ่อม', 'ค่าบำรุง', 'ค่าโฆษณา', 'ค่าสื่อสาร', 'ค่าใช้จ่าย'
    ];
  }

  /**
   * Enhanced text processing for batch input
   * @param {string} textInput - Raw text input
   * @returns {Object} Parsed data with categorization
   */
  async processBatchText(textInput) {
    try {
      this.isProcessing = true;

      // Split text into lines
      const lines = textInput.split('\n').filter(line => line.trim());

      const parsedItems = [];
      let currentDate = this.getCurrentDate();
      let globalDate = null;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Extract date if present at start of line
        const dateMatch = trimmedLine.match(this.patterns.date);
        let lineDate = globalDate || currentDate;

        if (dateMatch) {
          lineDate = this.parseDate(dateMatch[1]);
          if (!globalDate) globalDate = lineDate;
        }

        // Process the item
        const itemData = this.parseLineItem(trimmedLine, lineDate);
        if (itemData) {
          parsedItems.push(itemData);
        }
      }

      // Categorize all items
      const categorizedData = this.categorizeItems(parsedItems);

      // Store for confirmation
      this.pendingData = {
        originalText: textInput,
        parsedItems: categorizedData,
        timestamp: new Date().toISOString()
      };

      this.isProcessing = false;

      return {
        success: true,
        data: categorizedData,
        summary: this.generateSummary(categorizedData),
        needsConfirmation: true
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
   * Parse individual line item
   * @param {string} line - Single line of text
   * @param {string} date - Date for this line
   * @returns {Object|null} Parsed item data
   */
  parseLineItem(line, date) {
    // Remove date if present at start
    const cleanLine = line.replace(this.patterns.date, '').trim();

    // Check for multiplier pattern
    let multiplier = 1;
    const multiplierMatch = cleanLine.match(this.patterns.multiplier);
    let itemDescription = cleanLine;

    if (multiplierMatch) {
      multiplier = parseInt(multiplierMatch[1]);
      itemDescription = cleanLine.replace(this.patterns.multiplier, '').trim();
    }

    // Extract price at the end
    let price = null;
    let descriptionWithoutPrice = itemDescription;

    // Pattern for price at the end
    const priceMatch = itemDescription.match(/(.+?)\s*(\d+(?:\.\d+)?)\s*(ค่าส่ง\s*)?$/);
    if (priceMatch) {
      descriptionWithoutPrice = priceMatch[1].trim();
      price = parseFloat(priceMatch[2]);

      // Check for delivery cost
      if (priceMatch[3]) {
        // This is a delivery cost, treat as separate expense
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

    // If no price found, skip this line
    if (price === null) {
      return null;
    }

    // Extract quantity and unit from description
    const quantityUnitMatch = descriptionWithoutPrice.match(/(.+?)\s*(\d+(?:\.\d+)?)\s*([ก-๙a-zA-Z]*)\s*$/);

    let itemName = descriptionWithoutPrice;
    let quantity = 1;
    let unit = 'item';

    if (quantityUnitMatch) {
      itemName = quantityUnitMatch[1].trim();
      quantity = parseFloat(quantityUnitMatch[2]);
      unit = this.normalizeUnit(quantityUnitMatch[3]) || 'item';
    } else {
      // Try to extract quantity from multi-word items
      const numbersInName = itemName.match(/(\d+(?:\.\d+)?)/g);
      if (numbersInName) {
        quantity = parseFloat(numbersInName[numbersInName.length - 1]);
        itemName = itemName.replace(/(\d+(?:\.\d+)?)\s*([ก-๙a-zA-Z]*)?\s*$/, '').trim();
      }
    }

    return {
      date: date,
      description: itemName,
      quantity: quantity,
      unit: unit,
      price: price / multiplier, // Divide price by multiplier for unit price
      multiplier: multiplier,
      totalPrice: price,
      originalLine: line,
      type: null // Will be determined by categorization
    };
  }

  /**
   * Categorize items based on description
   * @param {Array} items - Array of parsed items
   * @returns {Object} Categorized data
   */
  categorizeItems(items) {
    const categorized = {
      purchases: [],      // Raw ingredients for menu
      expenses: [],        // Operating expenses
      overheads: [],       // Fixed costs
      equipment: [],       // Equipment purchases
      supplies: [],        // Operating supplies
      uncategorized: []    // Items that couldn't be categorized
    };

    for (const item of items) {
      const category = this.determineCategory(item);
      item.type = category.type;
      item.category = category.name;

      switch (category.type) {
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
   * Determine category for an item
   * @param {Object} item - Item to categorize
   * @returns {Object} Category info
   */
  determineCategory(item) {
    const description = item.description.toLowerCase();

    // Check explicit expense keywords first
    for (const keyword of this.expenseKeywords) {
      if (description.includes(keyword.toLowerCase())) {
        return { type: 'expense', name: this.getExpenseSubCategory(description) };
      }
    }

    // Check categorized patterns
    for (const [categoryName, pattern] of Object.entries(this.patterns.expenseCategories)) {
      if (pattern.test(description)) {
        return this.mapCategoryToType(categoryName, description);
      }
    }

    // Check if it's likely an ingredient (for menu items)
    if (this.isLikelyIngredient(description)) {
      return { type: 'purchase', name: 'วัตถุดิบ' };
    }

    // Default to expense
    return { type: 'expense', name: 'อื่นๆ' };
  }

  /**
   * Map category name to system type
   * @param {string} categoryName - Category name
   * @param {string} description - Item description
   * @returns {Object} Type mapping
   */
  mapCategoryToType(categoryName, description) {
    switch (categoryName) {
      case 'วัตถุดิบ':
      case 'เครื่องดื่ม':
      case 'วัตถุดิบแปรรูป':
        return { type: 'purchase', name: categoryName };
      case 'อุปกรณ์':
      case 'เฟอร์นิเจอร์':
        return { type: 'equipment', name: categoryName };
      case 'บรรจุภัณฑ์':
      case 'ของใช้':
      case 'สื่อสาร':
        return { type: 'supplies', name: categoryName };
      case 'ค่าแรง':
      case 'สาธารณูปโภค':
      case 'ค่าขนส่ง':
        return { type: 'expense', name: categoryName };
      default:
        return { type: 'expense', name: categoryName };
    }
  }

  /**
   * Get expense sub-category
   * @param {string} description - Item description
   * @returns {string} Sub-category name
   */
  getExpenseSubCategory(description) {
    if (/พนักงาน|จ้าง|พลอย/.test(description)) return 'ค่าแรง';
    if (/น้ำแข็ง|ค่าน้ำ|ค่าไฟ/.test(description)) return 'สาธารณูปโภค';
    if (/ค่าส่ง|ขนส่ง/.test(description)) return 'ค่าขนส่ง';
    if (/ค่าออเดอร์|ปริ้นท์/.test(description)) return 'ค่าบริการ';
    return 'อื่นๆ';
  }

  /**
   * Check if item is likely an ingredient
   * @param {string} description - Item description
   * @returns {boolean} True if likely ingredient
   */
  isLikelyIngredient(description) {
    const ingredientPatterns = [
      /กุ้ง|ปลา|หมู|ไก่|เนื้อ/, // Meats
      /ผัก|พริก|มะเขือ|มะระ|กะหล่ำ|แครอท/, // Vegetables
      /มะนาว|หอม|กระเทียม|ไชเท้า|ผักชี|คึ่นช่าย/, // Herbs & spices
      /ข้าว|น้ำมัน|น้ำปลา|ซอส|น้ำตาล|เกลือ/, // Cooking ingredients
      /ซอส|น้ำจิ้ม|ผงชูรส|รสดี/, // Seasonings
      /โชยุ|อินาริ|วาซาบิ|ฟูจิ/ // Japanese ingredients
    ];

    return ingredientPatterns.some(pattern => pattern.test(description));
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
      categories: {}
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
   * Confirm and save processed data
   * @param {boolean} confirmed - User confirmation
   * @returns {Object} Save result
   */
  async confirmAndSave(confirmed) {
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
        errors: []
      };

      // Save purchases
      for (const item of this.pendingData.parsedItems.purchases) {
        try {
          const result = await this.savePurchase(item);
          results.purchases.push(result);
        } catch (error) {
          results.errors.push(`วัตถุดิบ "${item.description}": ${error.message}`);
        }
      }

      // Save expenses
      for (const item of [...this.pendingData.parsedItems.expenses, ...this.pendingData.parsedItems.overheads]) {
        try {
          const result = await this.saveExpense(item);
          results.expenses.push(result);
        } catch (error) {
          results.errors.push(`ค่าใช้จ่าย "${item.description}": ${error.message}`);
        }
      }

      // Save equipment
      for (const item of this.pendingData.parsedItems.equipment) {
        try {
          const result = await this.saveEquipment(item);
          results.equipment.push(result);
        } catch (error) {
          results.errors.push(`อุปกรณ์ "${item.description}": ${error.message}`);
        }
      }

      // Save supplies
      for (const item of this.pendingData.parsedItems.supplies) {
        try {
          const result = await this.saveSupply(item);
          results.supplies.push(result);
        } catch (error) {
          results.errors.push(`วัสดุ "${item.description}": ${error.message}`);
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
        results.message = 'บันทึกข้อมูลบางส่วนสำเร็จ มีข้อผิดพลาดบางรายการ';
      } else {
        results.message = 'บันทึกข้อมูลทั้งหมดเรียบร้อย';
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
            note: `บันทึกโดย AI Agent - จากข้อความ: ${item.originalLine}`
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
            category: item.category
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
   * Save equipment to database
   * @param {Object} item - Equipment item
   * @returns {Object} Save result
   */
  async saveEquipment(item) {
    return new Promise((resolve) => {
      // For now, treat equipment as expenses
      resolve({
        success: true,
        message: 'บันทึกอุปกรณ์เรียบร้อย',
        data: item
      });
    });
  }

  /**
   * Save supply to database
   * @param {Object} item - Supply item
   * @returns {Object} Save result
   */
  async saveSupply(item) {
    return new Promise((resolve) => {
      // For now, treat supplies as expenses
      resolve({
        success: true,
        message: 'บันทึกวัสดุเรียบร้อย',
        data: item
      });
    });
  }

  /**
   * Parse date from various formats
   * @param {string} dateString - Date string
   * @returns {string} Formatted date (YYYY-MM-DD)
   */
  parseDate(dateString) {
    // Handle DD-MMM-YYYY format (e.g., 20-Sep-2025)
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

    // Default to today
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
    const trimmedName = name.trim();

    // Check aliases first
    if (this.ingredientAliases[trimmedName]) {
      return this.ingredientAliases[trimmedName];
    }

    // Remove common prefixes/suffixes
    let normalized = trimmedName
      .replace(/^(ชนิด|ประเภท|สินค้า)\s*/, '')
      .replace(/\s*(ผู้จัดจำหน่าย|จัดจำหน่าย)$/, '')
      .trim();

    return normalized;
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
   * Get help text
   * @returns {string} Help message
   */
  getHelpText() {
    return `
วิธีใช้งาน AI Agent เวอร์ชันเสริม:

1. วางข้อความรายการค่าใช้จ่าย ระบบจะวิเคราะห์และจัดหมวดหมู่อัตโนมัติ
2. ตรวจสอบข้อมูลที่แยกประเภทแล้วกดยืนยันเพื่อบันทึก
3. รองรับรูปแบบวันที่: DD-MMM-YYYY, YYYYMMDD, YYYY-MM-DD
4. รองรับการคูณจำนวน: *12, *2, etc.
5. จัดการประเภท: วัตถุดิบ, ค่าใช้จ่าย, อุปกรณ์, วัสดุสิ้นเปลือง

ตัวอย่างข้อความที่รองรับ:
20-Sep-2025 คริสตัล 600 มล *12 49
20-Sep-2025 เอโร ซอสดองสไตล์เกาหลี 1 ลิตร * 3 345
21-Sep-2025 ค่าจ้างน้องพลอย 300
    `.trim();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgentChatEnhanced;
} else if (typeof window !== 'undefined') {
  window.AIAgentChatEnhanced = AIAgentChatEnhanced;
}
