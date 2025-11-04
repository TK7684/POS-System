/**
 * AI Agent Chat System
 * Natural Language Processing for Thai Commands
 * Automatically manages POS data and provides insights
 * 
 * @version 1.0
 */

class AIAgentChat {
  constructor() {
    this.conversationHistory = [];
    this.isProcessing = false;
    this.currentContext = null;
    
    // Thai language patterns for command recognition
    this.patterns = {
      purchase: /(?:ซื้อ|จ่าย|ซื้อวัตถุดิบ|จ่ายค่า)/i,
      expense: /(?:ค่าจ้าง|ค่า|จ้าง|พนักงาน|น้ำแข็ง|ไฟฟ้า|น้ำประปา)/i,
      menu: /(?:เมนู|สูตร|ต้นทุน|คำนวน)/i,
      price: /(?:ราคา|บาท|฿)/i,
      quantity: /(?:กิโล|กก\.|kg|ตัว|ชิ้น|ลูก|แพ็ค|กล่อง)/i,
      date: /(\d{8}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/,
      update: /(?:เพิ่ม|แก้|เปลี่ยน|ปรับ|อัพเดท)/i
    };
    
    // Ingredient aliases (Thai common names)
    this.ingredientAliases = {
      'กะหล่ำ': 'กะหล่ำปลี',
      'พริก': 'พริกขี้หนู',
      'มะนาว': 'มะนาว',
      'กุ้ง': 'กุ้งสด',
      'น้ำปลา': 'น้ำปลา',
      'น้ำตาล': 'น้ำตาลทราย',
      'กระเทียม': 'กระเทียม',
      'หอม': 'หอมแดง',
      'น้ำมัน': 'น้ำมันพืช',
      'ผักชี': 'ผักชี'
    };
    
    // Unit conversions
    this.unitMap = {
      'กิโล': 'kg',
      'กิโลกรัม': 'kg',
      'กก.': 'kg',
      'กก': 'kg',
      'ตัว': 'piece',
      'ชิ้น': 'piece',
      'ลูก': 'piece',
      'แพ็ค': 'pack',
      'กล่อง': 'box',
      'ถุง': 'bag',
      'ขวด': 'bottle',
      'ลิตร': 'liter',
      'L': 'liter'
    };
  }
  
  /**
   * Process user message
   * @param {string} message - User's Thai language command
   * @returns {Promise<Object>} Response with actions and insights
   */
  async processMessage(message) {
    if (this.isProcessing) {
      return { 
        success: false, 
        message: 'กำลังประมวลผลคำสั่งก่อนหน้า กรุณารอสักครู่...' 
      };
    }
    
    this.isProcessing = true;
    
    try {
      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        message: message,
        timestamp: new Date()
      });
      
      // Detect command type
      const commandType = this.detectCommandType(message);
      
      let response;
      switch (commandType) {
        case 'purchase':
          response = await this.processPurchaseCommand(message);
          break;
        case 'expense':
          response = await this.processExpenseCommand(message);
          break;
        case 'menu_cost':
          response = await this.processMenuCostCommand(message);
          break;
        case 'price_update':
          response = await this.processPriceUpdateCommand(message);
          break;
        case 'query':
          response = await this.processQueryCommand(message);
          break;
        default:
          response = this.getHelpResponse();
      }
      
      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        message: response.message,
        timestamp: new Date(),
        data: response.data
      });
      
      return response;
      
    } catch (error) {
      console.error('[AI Agent] Error processing message:', error);
      return {
        success: false,
        message: '❌ เกิดข้อผิดพลาด: ' + error.message,
        error: error
      };
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Detect command type from message
   * @param {string} message - User message
   * @returns {string} Command type
   */
  detectCommandType(message) {
    // Check if it's a purchase command
    if (this.patterns.purchase.test(message) && this.patterns.price.test(message)) {
      return 'purchase';
    }
    
    // Check if it's an expense command
    if (this.patterns.expense.test(message) && this.patterns.price.test(message)) {
      return 'expense';
    }
    
    // Check if it's a menu cost calculation
    if (this.patterns.menu.test(message) && /(?:คำนวน|ต้นทุน)/.test(message)) {
      return 'menu_cost';
    }
    
    // Check if it's a price update
    if (this.patterns.update.test(message) && this.patterns.price.test(message)) {
      return 'price_update';
    }
    
    // Default to query
    return 'query';
  }
  
  /**
   * Process purchase command
   * Example: "20251008 ซื้อ กะหล่ำ 2 กิโลกรัม 80 บาท ค่าจ้างพนักงาน 300 บาท"
   */
  async processPurchaseCommand(message) {
    const purchases = [];
    const expenses = [];
    
    // Extract date
    const dateMatch = message.match(this.patterns.date);
    const date = dateMatch ? this.parseDate(dateMatch[0]) : new Date().toISOString().slice(0, 10);
    
    // Split message into individual items
    const items = this.extractPurchaseItems(message);
    
    for (const item of items) {
      if (item.isExpense) {
        expenses.push({
          date: date,
          description: item.name,
          amount: item.price,
          category: item.category || 'อื่นๆ'
        });
      } else {
        purchases.push({
          date: date,
          ingredient: item.name,
          quantity: item.quantity,
          unit: item.unit,
          totalPrice: item.price,
          unitPrice: item.quantity > 0 ? (item.price / item.quantity).toFixed(2) : 0
        });
      }
    }
    
    // Save to Google Sheets
    const results = {
      purchases: [],
      expenses: [],
      errors: []
    };
    
    // Process purchases
    for (const purchase of purchases) {
      try {
        const result = await this.savePurchaseToSheet(purchase);
        results.purchases.push(result);
      } catch (error) {
        results.errors.push({
          item: purchase,
          error: error.message
        });
      }
    }
    
    // Process expenses
    for (const expense of expenses) {
      try {
        const result = await this.saveExpenseToSheet(expense);
        results.expenses.push(result);
      } catch (error) {
        results.errors.push({
          item: expense,
          error: error.message
        });
      }
    }
    
    // Generate response message
    let responseMessage = '✅ บันทึกข้อมูลเรียบร้อยแล้ว!\n\n';
    
    if (results.purchases.length > 0) {
      responseMessage += `📦 **การซื้อวัตถุดิบ (${results.purchases.length} รายการ):**\n`;
      results.purchases.forEach(p => {
        responseMessage += `• ${p.ingredient}: ${p.quantity} ${p.unit} = ${p.totalPrice} บาท (${p.unitPrice} บาท/${p.unit})\n`;
      });
      responseMessage += '\n';
    }
    
    if (results.expenses.length > 0) {
      responseMessage += `💰 **ค่าใช้จ่าย (${results.expenses.length} รายการ):**\n`;
      results.expenses.forEach(e => {
        responseMessage += `• ${e.description}: ${e.amount} บาท\n`;
      });
      responseMessage += '\n';
    }
    
    if (results.errors.length > 0) {
      responseMessage += `⚠️ **รายการที่ไม่สามารถบันทึกได้ (${results.errors.length} รายการ):**\n`;
      results.errors.forEach(e => {
        responseMessage += `• ${e.item.ingredient || e.item.description}: ${e.error}\n`;
      });
    }
    
    // Add insights
    const insights = await this.generateInsights(results);
    if (insights) {
      responseMessage += `\n💡 **ข้อมูลเชิงลึก:**\n${insights}`;
    }
    
    return {
      success: true,
      message: responseMessage,
      data: results
    };
  }
  
  /**
   * Extract purchase items from message
   */
  extractPurchaseItems(message) {
    const items = [];
    
    // Pattern: วัตถุดิบ/ค่าใช้จ่าย + จำนวน + หน่วย + ราคา
    // Example: "กะหล่ำ 2 กิโลกรัม 80 บาท"
    // Example: "ค่าจ้างพนักงาน 300 บาท"
    
    const itemPattern = /([ก-๙a-zA-Z\s]+?)\s*(\d+(?:\.\d+)?)\s*(กิโล(?:กรัม)?|กก\.?|ตัว|ชิ้น|ลูก|แพ็ค|กล่อง|kg)?\s*(\d+(?:\.\d+)?)\s*บาท/gi;
    
    let match;
    while ((match = itemPattern.exec(message)) !== null) {
      const name = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unit = match[3] ? this.normalizeUnit(match[3]) : 'piece';
      const price = parseFloat(match[4]);
      
      // Check if it's an expense
      const isExpense = this.patterns.expense.test(name);
      
      items.push({
        name: this.normalizeIngredientName(name),
        quantity: isExpense ? 1 : quantity,
        unit: isExpense ? 'item' : unit,
        price: price,
        isExpense: isExpense,
        category: this.categorizeExpense(name)
      });
    }
    
    // Also try simpler pattern for expenses without quantity
    // Example: "ค่าจ้างพนักงาน 300 บาท"
    const expensePattern = /([ก-๙a-zA-Z\s]+?)\s*(\d+(?:\.\d+)?)\s*บาท/gi;
    const foundNames = new Set(items.map(i => i.name));
    
    let expenseMatch;
    while ((expenseMatch = expensePattern.exec(message)) !== null) {
      const name = expenseMatch[1].trim();
      if (!foundNames.has(name) && this.patterns.expense.test(name)) {
        const price = parseFloat(expenseMatch[2]);
        items.push({
          name: name,
          quantity: 1,
          unit: 'item',
          price: price,
          isExpense: true,
          category: this.categorizeExpense(name)
        });
        foundNames.add(name);
      }
    }
    
    return items;
  }
  
  /**
   * Process menu cost calculation command
   * Example: "เมนูกุ้งแช่น้ำปลา 7-8 ตัว ราคาพริก 120 บาท มะนาว 200 บาท ช่วยคำนวนต้นทุน"
   */
  async processMenuCostCommand(message) {
    // Extract menu name
    const menuMatch = message.match(/เมนู([ก-๙a-zA-Z\s]+?)(?:\s+\d+|ราคา|ช่วย)/i);
    const menuName = menuMatch ? menuMatch[1].trim() : null;
    
    if (!menuName) {
      return {
        success: false,
        message: '❌ ไม่พบชื่อเมนู กรุณาระบุชื่อเมนูที่ต้องการคำนวณ'
      };
    }
    
    // Extract ingredient price updates
    const priceUpdates = this.extractPriceUpdates(message);
    
    // Get menu from database
    const menuData = await this.getMenuByName(menuName);
    if (!menuData) {
      return {
        success: false,
        message: `❌ ไม่พบเมนู "${menuName}" ในระบบ`
      };
    }
    
    // Extract portion size if mentioned
    const portionMatch = message.match(/(\d+(?:-\d+)?)\s*ตัว/);
    const portionSize = portionMatch ? portionMatch[1] : null;
    
    // Calculate cost with updated prices
    const costCalculation = await this.calculateMenuCostWithUpdates(
      menuData.menu_id,
      priceUpdates
    );
    
    // Generate response
    let responseMessage = `📊 **การคำนวณต้นทุนเมนู: ${menuName}**\n\n`;
    
    if (portionSize) {
      responseMessage += `🍤 ขนาดกุ้ง: ${portionSize} ตัว\n\n`;
    }
    
    responseMessage += `**วัตถุดิบ:**\n`;
    costCalculation.ingredients.forEach(ing => {
      const priceLabel = ing.updated ? ' (ราคาใหม่)' : '';
      responseMessage += `• ${ing.name}: ${ing.quantity} ${ing.unit} × ${ing.pricePerUnit}฿ = ${ing.totalCost.toFixed(2)}฿${priceLabel}\n`;
    });
    
    responseMessage += `\n**สรุป:**\n`;
    responseMessage += `• ต้นทุนรวม: ${costCalculation.totalCost.toFixed(2)} บาท\n`;
    responseMessage += `• ราคาขายแนะนำ (GP 60%): ${costCalculation.suggestedPrice.toFixed(2)} บาท\n`;
    responseMessage += `• กำไรต่อจาน: ${(costCalculation.suggestedPrice - costCalculation.totalCost).toFixed(2)} บาท\n`;
    
    if (priceUpdates.length > 0) {
      responseMessage += `\n💡 **หมายเหตุ:** ราคาบางรายการถูกอัพเดทตามที่ระบุ คุณต้องการบันทึกราคาใหม่เหล่านี้ไหม?`;
    }
    
    return {
      success: true,
      message: responseMessage,
      data: {
        menuName: menuName,
        costCalculation: costCalculation,
        priceUpdates: priceUpdates,
        portionSize: portionSize
      }
    };
  }
  
  /**
   * Extract price updates from message
   */
  extractPriceUpdates(message) {
    const updates = [];
    
    // Pattern: วัตถุดิบ + ราคา + จำนวน + หน่วย
    // Example: "ราคาพริก 120 บาท ต่อ กิโลกรัม"
    const pricePattern = /(?:ราคา)?([ก-๙a-zA-Z]+)\s+(?:เพิ่มเป็น|เป็น)?\s*(\d+(?:\.\d+)?)\s*บาท(?:\s*ต่อ\s*(\S+))?/gi;
    
    let match;
    while ((match = pricePattern.exec(message)) !== null) {
      const ingredient = this.normalizeIngredientName(match[1]);
      const price = parseFloat(match[2]);
      const unit = match[3] ? this.normalizeUnit(match[3]) : 'kg';
      
      updates.push({
        ingredient: ingredient,
        price: price,
        unit: unit
      });
    }
    
    return updates;
  }
  
  /**
   * Process expense command
   */
  async processExpenseCommand(message) {
    const expenses = this.extractExpenses(message);
    
    if (expenses.length === 0) {
      return {
        success: false,
        message: '❌ ไม่พบรายการค่าใช้จ่ายในข้อความ'
      };
    }
    
    const results = [];
    const errors = [];
    
    for (const expense of expenses) {
      try {
        const result = await this.saveExpenseToSheet(expense);
        results.push(result);
      } catch (error) {
        errors.push({
          expense: expense,
          error: error.message
        });
      }
    }
    
    let responseMessage = '✅ บันทึกค่าใช้จ่ายเรียบร้อยแล้ว!\n\n';
    results.forEach(e => {
      responseMessage += `• ${e.description}: ${e.amount} บาท (${e.category})\n`;
    });
    
    if (errors.length > 0) {
      responseMessage += `\n⚠️ รายการที่ไม่สามารถบันทึกได้:\n`;
      errors.forEach(e => {
        responseMessage += `• ${e.expense.description}: ${e.error}\n`;
      });
    }
    
    return {
      success: true,
      message: responseMessage,
      data: { results, errors }
    };
  }
  
  /**
   * Extract expenses from message
   */
  extractExpenses(message) {
    const expenses = [];
    const dateMatch = message.match(this.patterns.date);
    const date = dateMatch ? this.parseDate(dateMatch[0]) : new Date().toISOString().slice(0, 10);
    
    // Pattern for expenses: ค่า... จำนวน บาท
    const expensePattern = /(ค่า[ก-๙a-zA-Z\s]+?)\s*(\d+(?:\.\d+)?)\s*บาท/gi;
    
    let match;
    while ((match = expensePattern.exec(message)) !== null) {
      const description = match[1].trim();
      const amount = parseFloat(match[2]);
      
      expenses.push({
        date: date,
        description: description,
        amount: amount,
        category: this.categorizeExpense(description)
      });
    }
    
    return expenses;
  }
  
  /**
   * Process price update command
   */
  async processPriceUpdateCommand(message) {
    const updates = this.extractPriceUpdates(message);
    
    if (updates.length === 0) {
      return {
        success: false,
        message: '❌ ไม่พบรายการอัพเดทราคาในข้อความ'
      };
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateIngredientPrice(update);
        results.push(result);
      } catch (error) {
        errors.push({
          update: update,
          error: error.message
        });
      }
    }
    
    let responseMessage = '✅ อัพเดทราคาเรียบร้อยแล้ว!\n\n';
    results.forEach(r => {
      responseMessage += `• ${r.ingredient}: ${r.newPrice} บาท/${r.unit}\n`;
    });
    
    if (errors.length > 0) {
      responseMessage += `\n⚠️ รายการที่ไม่สามารถอัพเดทได้:\n`;
      errors.forEach(e => {
        responseMessage += `• ${e.update.ingredient}: ${e.error}\n`;
      });
    }
    
    return {
      success: true,
      message: responseMessage,
      data: { results, errors }
    };
  }
  
  /**
   * Process query command (questions, status checks, etc.)
   */
  async processQueryCommand(message) {
    // Simple query processing
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('สต๊อก') || lowerMessage.includes('คงเหลือ')) {
      return await this.queryStock(message);
    }
    
    if (lowerMessage.includes('ยอดขาย') || lowerMessage.includes('รายได้')) {
      return await this.querySales(message);
    }
    
    if (lowerMessage.includes('กำไร')) {
      return await this.queryProfit(message);
    }
    
    return this.getHelpResponse();
  }
  
  /**
   * Helper: Get help response
   */
  getHelpResponse() {
    return {
      success: true,
      message: `🤖 **AI Agent ช่วยอะไรคุณได้บ้าง?**

ฉันสามารถช่วยคุณ:

📦 **บันทึกการซื้อ:**
"20251008 ซื้อ กะหล่ำ 2 กิโลกรัม 80 บาท พริก 1 กิโล 90 บาท"

💰 **บันทึกค่าใช้จ่าย:**
"ค่าจ้างพนักงาน 300 บาท ค่าน้ำแข็ง 50 บาท"

🍲 **คำนวณต้นทุนเมนู:**
"เมนูกุ้งแช่น้ำปลา ราคาพริก 120 บาท ต่อกิโล ช่วยคำนวนต้นทุน"

📊 **ตรวจสอบสต๊อก:**
"สต๊อกพริกเหลือเท่าไหร่"

💡 **เคล็ดลับ:** พิมพ์คำสั่งเป็นภาษาไทยตามธรรมชาติได้เลย!`
    };
  }
  
  // ========== BACKEND INTEGRATION FUNCTIONS ==========
  
  /**
   * Save purchase to Google Sheets
   */
  async savePurchaseToSheet(purchase) {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(result => resolve(result))
          .withFailureHandler(error => reject(new Error(error.message || 'ไม่สามารถบันทึกการซื้อได้')))
          .addPurchaseFromAI({
            date: purchase.date,
            ingredient: purchase.ingredient,
            qty: purchase.quantity,
            unit: purchase.unit,
            total_price: purchase.totalPrice,
            note: 'บันทึกโดย AI Agent'
          });
      } else {
        // Mock for testing
        console.log('[AI Agent] Mock save purchase:', purchase);
        resolve(purchase);
      }
    });
  }
  
  /**
   * Save expense to Google Sheets
   */
  async saveExpenseToSheet(expense) {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(result => resolve(result))
          .withFailureHandler(error => reject(new Error(error.message || 'ไม่สามารถบันทึกค่าใช้จ่ายได้')))
          .addExpenseFromAI({
            date: expense.date,
            description: expense.description,
            amount: expense.amount,
            category: expense.category
          });
      } else {
        // Mock for testing
        console.log('[AI Agent] Mock save expense:', expense);
        resolve(expense);
      }
    });
  }
  
  /**
   * Get menu by name
   */
  async getMenuByName(menuName) {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(result => resolve(result))
          .withFailureHandler(error => reject(new Error(error.message || 'ไม่พบเมนูในระบบ')))
          .getMenuByName({ name: menuName });
      } else {
        // Mock for testing
        console.log('[AI Agent] Mock get menu:', menuName);
        resolve({
          menu_id: 'M001',
          name: menuName,
          ingredients: []
        });
      }
    });
  }
  
  /**
   * Calculate menu cost with price updates
   */
  async calculateMenuCostWithUpdates(menuId, priceUpdates) {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(result => resolve(result))
          .withFailureHandler(error => reject(new Error(error.message || 'ไม่สามารถคำนวณต้นทุนได้')))
          .calculateMenuCostWithUpdates({
            menu_id: menuId,
            price_updates: priceUpdates,
            target_gp: 60
          });
      } else {
        // Mock for testing
        console.log('[AI Agent] Mock calculate cost:', menuId, priceUpdates);
        resolve({
          totalCost: 45.50,
          suggestedPrice: 113.75,
          ingredients: priceUpdates.map(u => ({
            name: u.ingredient,
            quantity: 1,
            unit: u.unit,
            pricePerUnit: u.price,
            totalCost: u.price,
            updated: true
          }))
        });
      }
    });
  }
  
  /**
   * Update ingredient price
   */
  async updateIngredientPrice(update) {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(result => resolve(result))
          .withFailureHandler(error => reject(new Error(error.message || 'ไม่สามารถอัพเดทราคาได้')))
          .updateIngredientPriceFromAI({
            ingredient: update.ingredient,
            price: update.price,
            unit: update.unit
          });
      } else {
        // Mock for testing
        console.log('[AI Agent] Mock update price:', update);
        resolve({
          ingredient: update.ingredient,
          newPrice: update.price,
          unit: update.unit
        });
      }
    });
  }
  
  /**
   * Query stock levels
   */
  async queryStock(message) {
    // Extract ingredient name from message
    const ingredientMatch = message.match(/(?:สต๊อก|คงเหลือ)([ก-๙a-zA-Z]+)/);
    const ingredient = ingredientMatch ? ingredientMatch[1] : null;
    
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(result => {
            let message = '📊 **สต๊อกวัตถุดิบ**\n\n';
            result.forEach(item => {
              const status = item.current < item.min ? '⚠️' : '✅';
              message += `${status} ${item.name}: ${item.current} ${item.unit}`;
              if (item.current < item.min) {
                message += ` (น้อยกว่าขั้นต่ำ ${item.min})`;
              }
              message += '\n';
            });
            resolve({ success: true, message: message, data: result });
          })
          .withFailureHandler(error => reject(new Error(error.message || 'ไม่สามารถดึงข้อมูลสต๊อกได้')))
          .getStockLevels({ ingredient: ingredient });
      } else {
        resolve({
          success: true,
          message: '📊 ข้อมูลสต๊อก (ตัวอย่าง)\n\n✅ พริก: 5.2 kg\n✅ มะนาว: 45 ลูก\n⚠️ กุ้ง: 2.5 kg (น้อยกว่าขั้นต่ำ 5 kg)'
        });
      }
    });
  }
  
  /**
   * Query sales
   */
  async querySales(message) {
    // Extract date range if any
    const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/g);
    
    return {
      success: true,
      message: '📈 กำลังพัฒนาฟังก์ชันนี้...'
    };
  }
  
  /**
   * Query profit
   */
  async queryProfit(message) {
    return {
      success: true,
      message: '💰 กำลังพัฒนาฟังก์ชันนี้...'
    };
  }
  
  /**
   * Generate insights from processed data
   */
  async generateInsights(results) {
    let insights = '';
    
    // Check for unusual prices
    if (results.purchases && results.purchases.length > 0) {
      const avgPrices = {};
      results.purchases.forEach(p => {
        if (!avgPrices[p.ingredient]) {
          avgPrices[p.ingredient] = [];
        }
        avgPrices[p.ingredient].push(parseFloat(p.unitPrice));
      });
      
      // Add price trend insights
      for (const [ingredient, prices] of Object.entries(avgPrices)) {
        if (prices.length > 1) {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          const latest = prices[prices.length - 1];
          const diff = ((latest - avg) / avg * 100).toFixed(1);
          
          if (Math.abs(diff) > 10) {
            insights += `• ราคา${ingredient}${diff > 0 ? 'สูงกว่า' : 'ต่ำกว่า'}ค่าเฉลี่ย ${Math.abs(diff)}%\n`;
          }
        }
      }
    }
    
    return insights || null;
  }
  
  // ========== HELPER FUNCTIONS ==========
  
  /**
   * Parse date from various formats
   */
  parseDate(dateStr) {
    // Format: YYYYMMDD
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    
    // Format: YYYY-MM-DD (already correct)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Format: DD/MM/YYYY or DD/MM/YY
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateStr)) {
      const parts = dateStr.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) {
        year = '20' + year;
      }
      return `${year}-${month}-${day}`;
    }
    
    // Default to today
    return new Date().toISOString().slice(0, 10);
  }
  
  /**
   * Normalize ingredient name
   */
  normalizeIngredientName(name) {
    const cleanName = name.trim();
    return this.ingredientAliases[cleanName] || cleanName;
  }
  
  /**
   * Normalize unit
   */
  normalizeUnit(unit) {
    const cleanUnit = unit.trim();
    return this.unitMap[cleanUnit] || cleanUnit;
  }
  
  /**
   * Categorize expense
   */
  categorizeExpense(description) {
    if (/พนักงาน|จ้าง/.test(description)) return 'ค่าแรง';
    if (/น้ำแข็ง/.test(description)) return 'วัสดุสิ้นเปลือง';
    if (/ไฟฟ้า/.test(description)) return 'สาธารณูปโภค';
    if (/น้ำประปา/.test(description)) return 'สาธารณูปโภค';
    if (/เช่า/.test(description)) return 'ค่าเช่า';
    if (/ขนส่ง|เดินทาง/.test(description)) return 'ค่าขนส่ง';
    return 'อื่นๆ';
  }
  
  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }
  
  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.AIAgentChat = AIAgentChat;
}

