/**
 * Unified AI Assistant Handler
 * Complete database access with no restrictions
 * Supports natural language to database operations
 * Enhanced with comprehensive logging for debugging and optimization
 */

import { DatabaseManager } from '../database/database-manager.js';
import { AIProvider } from '../ai-providers/ai-provider.js';
import { SYSTEM_PROMPT_TH } from '../system-prompt.js';

// Simple logging utility for server-side
const log = {
  info: (category, message, data) => console.log(`[INFO] [${category}] ${message}`, data || ''),
  error: (category, message, error) => console.error(`[ERROR] [${category}] ${message}`, error || ''),
  debug: (category, message, data) => console.log(`[DEBUG] [${category}] ${message}`, data || ''),
  warn: (category, message, data) => console.warn(`[WARN] [${category}] ${message}`, data || '')
};

export class AIAssistant {
  constructor(config) {
    log.info('AI', 'Initializing AI Assistant', { provider: config.aiProvider.type });
    this.db = new DatabaseManager(config.supabaseUrl, config.supabaseKey);
    this.aiProvider = new AIProvider(config.aiProvider.type, config.aiProvider.config);
    this.context = {};
    this.initialized = false;
    this.requestCount = 0;
  }

  async initialize() {
    const startTime = Date.now();
    try {
      log.info('AI', '→ Initializing AI provider...');
      await this.aiProvider.initialize();
      
      log.info('AI', '→ Loading database schema...');
      this.context.databaseSchema = await this._getDatabaseSchema();
      
      log.info('AI', '→ Loading recent data snapshot...');
      this.context.recentData = await this._getRecentDataSnapshot();
      
      this.initialized = true;
      const duration = Date.now() - startTime;
      log.info('AI', `✓ AI Assistant initialized successfully in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('AI', `✗ AI Assistant initialization failed after ${duration}ms`, error);
      throw new Error(`AI Assistant initialization failed: ${error.message}`);
    }
  }

  /**
   * Main processing endpoint - handles any request
   */
  async processRequest(userInput, context = {}) {
    this.requestCount++;
    const requestId = `REQ_${this.requestCount}_${Date.now()}`;
    const startTime = Date.now();
    
    log.info('AI', `→ Processing request ${requestId}`, { 
      userInput: userInput.substring(0, 100) + (userInput.length > 100 ? '...' : ''),
      contextKeys: Object.keys(context)
    });

    if (!this.initialized) {
      log.warn('AI', 'AI Assistant not initialized, initializing now...');
      await this.initialize();
    }

    const requestContext = {
      ...this.context,
      ...context,
      userInput,
      timestamp: new Date().toISOString(),
      requestId
    };

    try {
      // Analyze intent
      log.debug('AI', `→ Analyzing intent for ${requestId}...`);
      const intentStartTime = Date.now();
      const intent = await this._analyzeIntent(userInput);
      const intentDuration = Date.now() - intentStartTime;
      log.info('AI', `✓ Intent analyzed in ${intentDuration}ms`, { intent: intent.type });

      // Execute the appropriate operation
      log.debug('AI', `→ Executing operation for ${requestId}...`, { operation: intent.type });
      const opStartTime = Date.now();
      const result = await this._executeOperation(intent, requestContext);
      const opDuration = Date.now() - opStartTime;
      log.info('AI', `✓ Operation completed in ${opDuration}ms`);

      // Generate natural language response
      log.debug('AI', `→ Generating response for ${requestId}...`);
      const responseStartTime = Date.now();
      const response = await this._generateResponse(result, intent, requestContext);
      const responseDuration = Date.now() - responseStartTime;
      log.info('AI', `✓ Response generated in ${responseDuration}ms`);

      const totalDuration = Date.now() - startTime;
      log.info('AI', `✓ Request ${requestId} completed successfully in ${totalDuration}ms`, {
        intentDuration,
        opDuration,
        responseDuration,
        totalDuration,
        operationType: intent.type
      });

      return {
        success: true,
        response,
        data: result,
        intent,
        metadata: {
          timestamp: new Date().toISOString(),
          operationType: intent.type,
          affectedRecords: result?.affectedRecords || 0,
          performanceMs: {
            intent: intentDuration,
            operation: opDuration,
            response: responseDuration,
            total: totalDuration
          }
        }
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      log.error('AI', `✗ Request ${requestId} failed after ${totalDuration}ms`, error);
      
      return {
        success: false,
        error: error.message,
        suggestion: await this._generateErrorSuggestion(error, userInput)
      };
    }
  }

  // ==================== Intent Analysis ====================

  async _analyzeIntent(userInput) {
    // Handle conversational messages (greetings, help, etc.)
    const conversationalPatterns = /^(hi|hello|hey|สวัสดี|what can you do|help|คุณทำอะไรได้บ้าง|ช่วยอะไรได้บ้าง)/i;
    if (conversationalPatterns.test(userInput.trim())) {
      return {
        type: 'conversation',
        entity: null,
        parameters: {},
        confidence: 1.0,
        explanation: 'User wants to chat or learn about capabilities'
      };
    }

    // Special handling for recipe/ingredient addition commands
    const recipePatterns = [
      /เพิ่มวัตถุดิบ(?:ลงใน|ให้|ใน)?\s*(?:เมนู\s*)?([^\s]+)/i,
      /(?:เพิ่ม|ใส่|บันทึก)\s*(?:วัตถุดิบ|ส่วนผสม|สูตร)\s*(?:ลงใน|ให้|ใน)?\s*(?:เมนู\s*)?([^\s]+)/i,
      /(?:เมนู\s*)?([^\s]+)\s+(?:ใช้|มี|ใส่)\s*(?:วัตถุดิบ|ส่วนผสม)/i
    ];

    for (const pattern of recipePatterns) {
      const match = userInput.match(pattern);
      if (match) {
        const menuName = match[1];
        // Check if the input contains ingredient list with quantities
        const hasIngredientList = /(\d+)\s*(?:กรัม|กก|มล|ช้อน|หัว|ต้น|กำ|ขวด|ชิ้น|ซอง|ถ้วย)/i.test(userInput);
        
        if (hasIngredientList) {
          log.info('AI', `Detected recipe addition command for menu: ${menuName}`);
          return {
            type: 'custom',
            entity: 'menu_recipes',
            parameters: {
              operation: 'add_recipe_ingredients',
              menuName: menuName,
              rawInput: userInput,
              filters: {},
              data: {},
              operations: []
            },
            confidence: 0.95,
            explanation: `User wants to add ingredients to menu ${menuName}`
          };
        }
      }
    }

    // Use comprehensive Thai system prompt
    const intentPrompt = `${SYSTEM_PROMPT_TH}

---

## Current Context

Database Schema:
${JSON.stringify(this.context.databaseSchema, null, 2)}

Recent Data Snapshot:
${JSON.stringify(this.context.recentData || {}, null, 2)}

---

## Current User Request

"${userInput}"

---

## Task: Analyze Intent

วิเคราะห์คำสั่งของผู้ใช้และระบุ intent ที่ถูกต้อง

⚠️ สำคัญมาก:
1. ถ้าผู้ใช้ต้องการ "เพิ่มวัตถุดิบลงในเมนู" พร้อมรายการวัตถุดิบและปริมาณ → ใช้ type: "custom", operation: "add_recipe_ingredients"
2. ถ้าผู้ใช้ต้องการ "บันทึกการซื้อ" หรือ "ซื้อ" พร้อมรายการวัตถุดิบ → ใช้ type: "create", entity: "purchases"
3. ถ้าผู้ใช้ต้องการ "บันทึกค่าใช้จ่าย" → ใช้ type: "create", entity: "expenses"
4. ถ้าผู้ใช้ต้องการ "อ่าน/ดู/แสดง" → ใช้ type: "read"
5. ถ้าผู้ใช้ต้องการ "แก้ไข/อัปเดต" → ใช้ type: "update"
6. ถ้าผู้ใช้ต้องการ "สร้าง/เพิ่ม" → ใช้ type: "create"
7. entity ต้องเป็นชื่อตารางที่ถูกต้องจาก schema

Respond with JSON ONLY in this format:
{
  "type": "read|create|update|delete|analyze|export|import|custom|conversation",
  "entity": "exact_table_name_from_schema_or_null",
  "parameters": {
    "filters": {},
    "data": {},
    "operations": [],
    "operation": "add_recipe_ingredients|bulk_price_update|stock_reconciliation|etc",
    "menuName": "menu_name_if_applicable",
    "rawInput": "original_user_input_if_needed"
  },
  "confidence": 0.9,
  "explanation": "Brief explanation in Thai"
}`;

    const response = await this.aiProvider.generateCompletion(intentPrompt, {
      temperature: 0.1,
      maxTokens: 1024
    });

    try {
      const parsed = JSON.parse(response);
      log.info('AI', `Intent analyzed: ${parsed.type} for ${parsed.entity}`, { confidence: parsed.confidence });
      return parsed;
    } catch (error) {
      log.warn('AI', 'Failed to parse AI intent response, using fallback', error);
      // Fallback intent analysis
      return {
        type: this._detectIntentType(userInput),
        entity: this._detectEntity(userInput),
        parameters: this._extractParameters(userInput),
        confidence: 0.5,
        explanation: "Detected intent through pattern matching"
      };
    }
  }

  // ==================== Operation Execution ====================

  async _executeOperation(intent, context) {
    switch (intent.type) {
      case 'conversation':
        return await this._executeConversationOperation(intent, context);

      case 'read':
        return await this._executeReadOperation(intent);

      case 'create':
        return await this._executeCreateOperation(intent);

      case 'update':
        return await this._executeUpdateOperation(intent);

      case 'delete':
        return await this._executeDeleteOperation(intent);

      case 'analyze':
        return await this._executeAnalyzeOperation(intent);

      case 'export':
        return await this._executeExportOperation(intent);

      case 'import':
        return await this._executeImportOperation(intent);

      case 'custom':
        return await this._executeCustomOperation(intent, context);

      default:
        throw new Error(`Unsupported operation type: ${intent.type}`);
    }
  }

  async _executeConversationOperation(intent, context) {
    // Handle greetings, help requests, and general conversation
    const capabilities = `สวัสดีครับ! ผม เป็น POS AI Assistant ที่พร้อมช่วยคุณจัดการร้านอาหาร

🎯 ความสามารถของผม:

📊 **การวิเคราะห์และรายงาน**
- ดูยอดขาย, กำไร, รายได้ประจำวัน/เดือน
- วิเคราะห์เมนูขายดี
- ติดตามต้นทุนและกำไรขั้นต้น

📦 **การจัดการสต็อก**
- เช็คสต็อกวัตถุดิบ
- แจ้งเตือนสต็อกต่ำ
- บันทึกการสั่งซื้อ

🍜 **การจัดการเมนู**
- เพิ่ม/แก้ไข/ลบเมนู
- คำนวณต้นทุนเมนู
- จัดการสูตรอาหาร

💰 **การจัดการการเงิน**
- บันทึกรายได้/รายจ่าย
- ติดตามค่าใช้จ่าย
- คำนวณกำไร-ขาดทุน

💬 **ตัวอย่างคำสั่ง:**
- "แสดงเมนูทั้งหมด"
- "เช็คสต็อกวัตถุดิบ"
- "ยอดขายวันนี้เท่าไหร่"
- "เมนูไหนขายดีที่สุด"
- "วัตถุดิบอะไรต้องสั่งเพิ่ม"

ลองถามผมได้เลยครับ! 😊`;

    return {
      message: capabilities,
      type: 'conversation',
      affectedRecords: 0
    };
  }

  async _executeReadOperation(intent) {
    let { entity, parameters } = intent;

    // Resolve table name using aliases
    entity = this._resolveTableName(entity);

    // Special handlers for complex queries
    switch (entity) {
      case 'menu_cost':
        return await this.db.calculateCompleteMenuCost(parameters.menuId);

      case 'sales_analytics':
        return await this.db.getSalesAnalytics(parameters.dateRange);

      case 'inventory_analytics':
        return await this.db.getInventoryAnalytics();

      default:
        // Standard read operation
        const data = await this.db.read(entity, parameters);
        return {
          data,
          count: data.length,
          affectedRecords: data.length
        };
    }
  }

  _resolveTableName(tableName) {
    // Check if it's already a valid table
    const schema = this.context.databaseSchema;
    if (schema.tables[tableName]) {
      return tableName;
    }

    // Try to resolve from aliases
    if (schema.aliases && schema.aliases[tableName]) {
      log.info('AI', `Resolved table alias: ${tableName} → ${schema.aliases[tableName]}`);
      return schema.aliases[tableName];
    }

    // Handle generic queries
    if (tableName === 'data' || !tableName) {
      // For generic "data" queries, default to most commonly accessed table
      log.info('AI', `Resolving generic query "${tableName}" → menus`);
      return 'menus';
    }

    // Return original if no match (will fail gracefully with clear error)
    log.warn('AI', `Unknown table name: ${tableName}, available tables: ${Object.keys(schema.tables).join(', ')}`);
    return tableName;
  }

  async _executeCreateOperation(intent) {
    const { entity, parameters } = intent;

    // Validate required fields
    if (!parameters.data || Object.keys(parameters.data).length === 0) {
      throw new Error('No data provided for creation');
    }

    const result = await this.db.create(entity, parameters.data);
    return {
      created: result,
      count: result.length,
      affectedRecords: result.length
    };
  }

  async _executeUpdateOperation(intent) {
    const { entity, parameters } = intent;

    if (!parameters.filters || Object.keys(parameters.filters).length === 0) {
      throw new Error('No filters specified for update operation');
    }

    if (!parameters.data || Object.keys(parameters.data).length === 0) {
      throw new Error('No data provided for update');
    }

    const result = await this.db.update(entity, parameters.data, parameters.filters);
    return {
      updated: result,
      count: result.length,
      affectedRecords: result.length
    };
  }

  async _executeDeleteOperation(intent) {
    const { entity, parameters } = intent;

    if (!parameters.filters || Object.keys(parameters.filters).length === 0) {
      throw new Error('No filters specified for delete operation');
    }

    const result = await this.db.delete(entity, parameters.filters);
    return {
      deleted: result,
      count: result.length,
      affectedRecords: result.length
    };
  }

  async _executeAnalyzeOperation(intent) {
    const { entity, parameters } = intent;

    switch (entity) {
      case 'sales':
        return await this.db.getSalesAnalytics(parameters);

      case 'inventory':
        return await this.db.getInventoryAnalytics();

      case 'menu_performance':
        return await this._analyzeMenuPerformance(parameters);

      case 'profitability':
        return await this._analyzeProfitability(parameters);

      case 'trends':
        return await this._analyzeTrends(parameters);

      default:
        throw new Error(`Unknown analytics entity: ${entity}`);
    }
  }

  async _executeExportOperation(intent) {
    const { entity, parameters } = intent;

    const data = await this.db.exportData(entity, parameters.format || 'json', parameters);
    return {
      exported: data,
      format: parameters.format || 'json',
      recordCount: Array.isArray(data) ? data.length : 1
    };
  }

  async _executeImportOperation(intent) {
    const { entity, parameters } = intent;

    if (!parameters.data) {
      throw new Error('No data provided for import');
    }

    const result = await this.db.importData(entity, parameters.data, parameters.options);
    return {
      imported: result,
      count: result.length,
      affectedRecords: result.length
    };
  }

  async _executeCustomOperation(intent, context) {
    // Handle complex, multi-step operations
    const { parameters } = intent;

    switch (parameters.operation) {
      case 'add_recipe_ingredients':
        return await this._addRecipeIngredients(parameters, context);

      case 'bulk_price_update':
        return await this._bulkPriceUpdate(parameters);

      case 'stock_reconciliation':
        return await this._stockReconciliation(parameters);

      case 'financial_report':
        return await this._generateFinancialReport(parameters);

      case 'menu_optimization':
        return await this._optimizeMenu(parameters);

      default:
        // Use AI to generate custom SQL or operation sequence
        return await this._executeAIGeneratedOperation(intent, context);
    }
  }

  /**
   * Add ingredients to a menu recipe
   * Handles commands like "เพิ่มวัตถุดิบลงในเมนู O พริกสวน 100 กรัม..."
   */
  async _addRecipeIngredients(parameters, context) {
    const { menuName, rawInput } = parameters;
    
    log.info('AI', `Adding recipe ingredients to menu: ${menuName}`, { rawInput });

    // Step 1: Find the menu by name
    const menus = await this.db.read('menus', {
      filters: {
        name: { ilike: `%${menuName}%` }
      }
    });

    if (!menus || menus.length === 0) {
      throw new Error(`ไม่พบเมนู "${menuName}" ในระบบ กรุณาตรวจสอบชื่อเมนู`);
    }

    if (menus.length > 1) {
      log.warn('AI', `Multiple menus found for "${menuName}"`, menus.map(m => m.name));
    }

    const menu = menus[0];
    log.info('AI', `Found menu: ${menu.name} (ID: ${menu.id})`);

    // Step 2: Parse ingredient list from raw input
    const ingredients = this._parseIngredientList(rawInput);
    log.info('AI', `Parsed ${ingredients.length} ingredients from input`);

    if (ingredients.length === 0) {
      throw new Error('ไม่พบรายการวัตถุดิบในคำสั่ง กรุณาระบุวัตถุดิบพร้อมปริมาณ เช่น "พริกสวน 100 กรัม"');
    }

    // Step 3: Match ingredients to database
    const allIngredients = await this.db.read('ingredients', {
      filters: { is_active: true }
    });

    const recipeItems = [];
    const notFound = [];

    for (const ing of ingredients) {
      // Try to find ingredient by name (fuzzy match)
      const matched = this._findIngredientByName(ing.name, allIngredients);
      
      if (!matched) {
        notFound.push(ing.name);
        continue;
      }

      recipeItems.push({
        menu_id: menu.id,
        ingredient_id: matched.id,
        quantity_per_serve: ing.quantity,
        unit: ing.unit || matched.unit,
        cost_per_unit: matched.cost_per_unit || 0
      });
    }

    if (notFound.length > 0) {
      log.warn('AI', `Some ingredients not found: ${notFound.join(', ')}`);
    }

    if (recipeItems.length === 0) {
      throw new Error(`ไม่พบวัตถุดิบที่ตรงกับรายการที่ระบุ กรุณาตรวจสอบชื่อวัตถุดิบ`);
    }

    // Step 4: Delete existing recipes for this menu (optional - could also merge)
    log.info('AI', `Deleting existing recipes for menu ${menu.id}`);
    await this.db.delete('menu_recipes', {
      menu_id: menu.id
    });

    // Step 5: Insert new recipe items
    log.info('AI', `Inserting ${recipeItems.length} recipe items`);
    const created = await this.db.create('menu_recipes', recipeItems);

    // Step 6: Calculate new menu cost
    const menuCost = await this._calculateMenuCost(menu.id);

    return {
      menu: {
        id: menu.id,
        name: menu.name
      },
      ingredientsAdded: recipeItems.length,
      ingredientsNotFound: notFound,
      recipeItems: created,
      newCost: menuCost,
      message: `เพิ่มวัตถุดิบ ${recipeItems.length} รายการให้เมนู "${menu.name}" เรียบร้อย\nต้นทุนต่อเสิร์ฟ: ฿${menuCost.toFixed(2)}`
    };
  }

  /**
   * Parse ingredient list from natural language input
   * Example: "พริกสวน 100 กรัม ผักชี ราก+ต้น 75 กรัม กระเทียมไทย 50 กรัม"
   */
  _parseIngredientList(input) {
    const ingredients = [];
    
    // Pattern to match: ingredient_name quantity unit
    // Handles Thai units: กรัม, กก, มล, ช้อน, หัว, ต้น, กำ, ขวด, ชิ้น, ซอง, ถ้วย
    const pattern = /([^\d]+?)\s+(\d+(?:\.\d+)?)\s*(กรัม|กก|ก\.ก\.|มล|มล\.|ช้อน|หัว|ต้น|กำ|ขวด|ชิ้น|ซอง|ถ้วย|kilo|gram|ml|piece|unit)/gi;
    
    let match;
    while ((match = pattern.exec(input)) !== null) {
      const name = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unit = match[3].toLowerCase();
      
      // Normalize units
      const normalizedUnit = this._normalizeUnit(unit);
      
      ingredients.push({
        name: name.trim(),
        quantity: quantity,
        unit: normalizedUnit
      });
    }

    return ingredients;
  }

  /**
   * Normalize unit names to standard format
   */
  _normalizeUnit(unit) {
    const unitMap = {
      'กก': 'kg',
      'ก.ก.': 'kg',
      'kilo': 'kg',
      'กรัม': 'g',
      'gram': 'g',
      'มล': 'ml',
      'มล.': 'ml',
      'ml': 'ml',
      'ช้อน': 'spoon',
      'หัว': 'head',
      'ต้น': 'stalk',
      'กำ': 'bunch',
      'ขวด': 'bottle',
      'ชิ้น': 'piece',
      'ซอง': 'pack',
      'ถ้วย': 'cup'
    };

    return unitMap[unit.toLowerCase()] || unit.toLowerCase();
  }

  /**
   * Find ingredient by name using fuzzy matching
   */
  _findIngredientByName(searchName, ingredients) {
    const normalizedSearch = searchName.toLowerCase().trim();
    
    // Exact match first
    let match = ingredients.find(ing => 
      ing.name.toLowerCase() === normalizedSearch
    );
    
    if (match) return match;

    // Partial match
    match = ingredients.find(ing => 
      ing.name.toLowerCase().includes(normalizedSearch) ||
      normalizedSearch.includes(ing.name.toLowerCase())
    );
    
    if (match) return match;

    // Handle variations (e.g., "ผักชี ราก+ต้น" vs "ผักชี")
    const baseName = normalizedSearch.split(/\s+/)[0];
    match = ingredients.find(ing => 
      ing.name.toLowerCase().startsWith(baseName) ||
      baseName.startsWith(ing.name.toLowerCase().split(/\s+/)[0])
    );
    
    return match;
  }

  /**
   * Calculate menu cost from recipes
   */
  async _calculateMenuCost(menuId) {
    const recipes = await this.db.read('menu_recipes', {
      filters: { menu_id: menuId }
    });

    if (!recipes || recipes.length === 0) {
      return 0;
    }

    // Get ingredient costs
    const ingredientIds = recipes.map(r => r.ingredient_id).filter(Boolean);
    
    // Fetch ingredients one by one if array filter not supported, or use batch query
    let ingredients = [];
    if (ingredientIds.length > 0) {
      // Try batch query first
      try {
        ingredients = await this.db.read('ingredients', {
          filters: { id: { in: ingredientIds } }
        });
      } catch (error) {
        // Fallback: fetch individually
        log.warn('AI', 'Batch ingredient query failed, fetching individually', error);
        for (const id of ingredientIds) {
          const ing = await this.db.read('ingredients', {
            filters: { id: id },
            limit: 1
          });
          if (ing && ing.length > 0) {
            ingredients.push(ing[0]);
          }
        }
      }
    }

    const ingredientMap = Object.fromEntries(
      ingredients.map(ing => [ing.id, ing])
    );

    let totalCost = 0;
    for (const recipe of recipes) {
      const ingredient = ingredientMap[recipe.ingredient_id];
      if (!ingredient) continue;

      const quantity = parseFloat(recipe.quantity_per_serve) || 0;
      const costPerUnit = parseFloat(ingredient.cost_per_unit) || 0;
      
      // Convert units if needed (simplified - assumes same unit for now)
      totalCost += quantity * costPerUnit;
    }

    return totalCost;
  }

  // ==================== Specialized Operations ====================

  async _analyzeMenuPerformance(parameters) {
    const { dateRange } = parameters;

    // Get sales data with menu details
    const sales = await this.db.read('sales', {
      columns: 'menu_id, quantity, total_amount, order_date',
      joins: [{ table: 'menus', columns: 'name, price, cost_per_unit' }],
      filters: dateRange || {}
    });

    const menuPerformance = {};

    sales.forEach(sale => {
      const menuName = sale.menus.name;
      if (!menuPerformance[menuName]) {
        menuPerformance[menuName] = {
          name: menuName,
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
      }

      menuPerformance[menuName].quantity += sale.quantity;
      menuPerformance[menuName].revenue += sale.total_amount;
      menuPerformance[menuName].cost += (sale.menus.cost_per_unit || 0) * sale.quantity;
    });

    // Calculate profit and ranking
    Object.values(menuPerformance).forEach(menu => {
      menu.profit = menu.revenue - menu.cost;
      menu.profitMargin = menu.revenue > 0 ? (menu.profit / menu.revenue * 100) : 0;
    });

    const sorted = Object.values(menuPerformance).sort((a, b) => b.revenue - a.revenue);

    return {
      topPerformers: sorted.slice(0, 10),
      bottomPerformers: sorted.slice(-5).reverse(),
      totalMenus: sorted.length,
      totalRevenue: sorted.reduce((sum, menu) => sum + menu.revenue, 0),
      totalProfit: sorted.reduce((sum, menu) => sum + menu.profit, 0)
    };
  }

  async _analyzeProfitability(parameters) {
    const { dateRange, breakdown = 'category' } = parameters;

    // Get comprehensive financial data
    const [sales, expenses, purchases] = await Promise.all([
      this.db.read('sales', { filters: dateRange || {} }),
      this.db.read('expenses', { filters: dateRange || {} }),
      this.db.read('purchases', { filters: dateRange || {} })
    ]);

    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalCostOfGoods = purchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);

    const grossProfit = totalRevenue - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;

    return {
      revenue: totalRevenue,
      costOfGoods: totalCostOfGoods,
      expenses: totalExpenses,
      grossProfit,
      netProfit,
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0,
      netMargin: totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0,
      breakdown: await this._getProfitBreakdown(breakdown, dateRange)
    };
  }

  async _bulkPriceUpdate(parameters) {
    const { updates, strategy } = parameters;

    let updatedCount = 0;

    if (strategy === 'percentage') {
      // Apply percentage increase/decrease
      for (const update of updates) {
        const menus = await this.db.read('menus', { filters: update.filters });
        const updatedMenus = menus.map(menu => ({
          ...menu,
          price: menu.price * (1 + (update.percentage / 100))
        }));

        for (const updatedMenu of updatedMenus) {
          await this.db.update('menus', { price: updatedMenu.price }, { id: updatedMenu.id });
          updatedCount++;
        }
      }
    } else {
      // Fixed price updates
      for (const update of updates) {
        await this.db.update('menus', update.data, update.filters);
        updatedCount += (await this.db.read('menus', { filters: update.filters })).length;
      }
    }

    return { updatedCount, message: `Updated ${updatedCount} menu prices` };
  }

  async _stockReconciliation(parameters) {
    const { adjustments } = parameters;

    const results = [];

    for (const adjustment of adjustments) {
      // Get current stock
      const ingredient = await this.db.read('ingredients', {
        filters: { id: adjustment.ingredientId },
        limit: 1
      });

      if (ingredient.length === 0) {
        results.push({ success: false, error: 'Ingredient not found', adjustment });
        continue;
      }

      const currentStock = ingredient[0].current_stock;
      const adjustmentAmount = adjustment.newStock - currentStock;

      // Update stock
      await this.db.update('ingredients', {
        current_stock: adjustment.newStock
      }, { id: adjustment.ingredientId });

      // Create stock transaction record
      await this.db.create('stock_transactions', {
        ingredient_id: adjustment.ingredientId,
        transaction_type: 'reconciliation',
        quantity_change: adjustmentAmount,
        created_at: new Date().toISOString()
      });

      results.push({
        success: true,
        ingredientId: adjustment.ingredientId,
        previousStock: currentStock,
        newStock: adjustment.newStock,
        adjustmentAmount
      });
    }

    return results;
  }

  async _generateFinancialReport(parameters) {
    const { period, format = 'summary' } = parameters;

    // Get all financial data for the period
    const [sales, expenses, purchases, labor] = await Promise.all([
      this.db.read('sales', { filters: period }),
      this.db.read('expenses', { filters: period }),
      this.db.read('purchases', { filters: period }),
      this.db.read('labor_logs', { filters: period })
    ]);

    const report = {
      period,
      generated: new Date().toISOString(),
      summary: {
        totalRevenue: sales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
        totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        costOfGoods: purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0),
        laborCost: labor.reduce((sum, l) => sum + (l.total_amount || 0), 0),
        totalSales: sales.length,
        totalTransactions: sales.length + expenses.length + purchases.length
      },
      details: {
        sales,
        expenses,
        purchases,
        labor
      }
    };

    // Calculate profitability
    report.summary.grossProfit = report.summary.totalRevenue - report.summary.costOfGoods;
    report.summary.netProfit = report.summary.grossProfit - report.summary.totalExpenses - report.summary.laborCost;

    if (format === 'detailed') {
      report.analytics = await this._analyzeProfitability(period);
    }

    return report;
  }

  // ==================== Response Generation ====================

  async _generateResponse(result, intent, context) {
    // For conversation type, return the message directly
    if (intent.type === 'conversation') {
      return result.message || result;
    }

    // For custom operations with recipe addition
    if (intent.type === 'custom' && intent.parameters?.operation === 'add_recipe_ingredients') {
      if (result.message) {
        return result.message;
      }
      
      let response = `✅ **เพิ่มวัตถุดิบให้เมนู "${result.menu.name}" เรียบร้อย**\n\n`;
      response += `📋 **เพิ่ม ${result.ingredientsAdded} รายการ:**\n`;
      
      if (result.recipeItems && result.recipeItems.length > 0) {
        // Get ingredient names for display
        const ingredientIds = result.recipeItems.map(r => r.ingredient_id).filter(Boolean);
        
        // Fetch ingredients (with fallback for batch queries)
        let ingredients = [];
        try {
          ingredients = await this.db.read('ingredients', {
            filters: { id: { in: ingredientIds } }
          });
        } catch (error) {
          // Fallback: fetch individually
          for (const id of ingredientIds) {
            const ing = await this.db.read('ingredients', {
              filters: { id: id },
              limit: 1
            });
            if (ing && ing.length > 0) {
              ingredients.push(ing[0]);
            }
          }
        }
        
        const ingredientMap = Object.fromEntries(ingredients.map(ing => [ing.id, ing]));
        
        result.recipeItems.forEach((item, i) => {
          const ing = ingredientMap[item.ingredient_id];
          if (ing) {
            response += `${i + 1}. ${ing.name}: ${item.quantity_per_serve} ${item.unit}\n`;
          }
        });
      }
      
      if (result.newCost !== undefined) {
        response += `\n💰 **ต้นทุนต่อเสิร์ฟ: ฿${result.newCost.toFixed(2)}**\n`;
      }
      
      if (result.ingredientsNotFound && result.ingredientsNotFound.length > 0) {
        response += `\n⚠️ **ไม่พบวัตถุดิบ:** ${result.ingredientsNotFound.join(', ')}\n`;
        response += `กรุณาตรวจสอบชื่อวัตถุดิบและเพิ่มในระบบก่อน`;
      }
      
      return response;
    }

    // For read operations with data, format nicely first
    if (intent.type === 'read' && result.data && Array.isArray(result.data)) {
      return this._formatReadResponse(result, intent, context);
    }

    const responsePrompt = `Generate a natural language response for the user based on this operation result.

User Request: "${context.userInput}"
Operation: ${intent.type} on ${intent.entity}

Result Data:
${JSON.stringify(result, null, 2)}

Generate a helpful, conversational response that:
1. Clearly states what was done
2. Shows key results in an easy-to-understand format
3. Provides insights or recommendations if relevant
4. Uses Thai when appropriate for business terms
5. Is concise but comprehensive

Respond in a natural, helpful tone.`;

    return await this.aiProvider.generateCompletion(responsePrompt, {
      temperature: 0.3,
      maxTokens: 1024
    });
  }

  _formatReadResponse(result, intent, context) {
    const { data, count } = result;
    let entity = intent.entity;

    // Resolve entity name (might be an alias)
    entity = this._resolveTableName(entity);

    // Don't show more than 10 items by default
    const displayLimit = 10;
    const hasMore = count > displayLimit;
    const displayData = data.slice(0, displayLimit);

    // Build formatted response
    let response = `✅ **พบข้อมูล ${count} รายการ**\n\n`;

    if (count === 0) {
      return `❌ ไม่พบข้อมูลที่ค้นหา\n\n💡 ลองค้นหาด้วยคำอื่น หรือตรวจสอบว่ามีข้อมูลในระบบหรือไม่`;
    }

    // Detect entity type from data structure if entity name is unclear
    if (!entity || entity === 'data') {
      // Try to detect from first item
      if (displayData.length > 0) {
        const firstItem = displayData[0];
        if (firstItem.name && (firstItem.price !== undefined || firstItem.cost_per_unit !== undefined)) {
          entity = 'menus';
        } else if (firstItem.name && (firstItem.current_stock !== undefined || firstItem.unit)) {
          entity = 'ingredients';
        } else if (firstItem.transaction_type || firstItem.total_amount) {
          entity = 'stock_transactions';
        }
      }
    }

    // Format based on entity type
    switch (entity) {
      case 'ingredients':
      case 'inventory':
      case 'stock':
        response += this._formatIngredients(displayData);
        break;
      case 'menus':
      case 'products':
      case 'dishes':
        response += this._formatMenus(displayData);
        break;
      case 'stock_transactions':
      case 'transactions':
      case 'sales':
      case 'purchases':
        response += this._formatTransactions(displayData);
        break;
      case 'platforms':
        response += this._formatPlatforms(displayData);
        break;
      default:
        // Generic formatting
        response += this._formatGeneric(displayData);
    }

    if (hasMore) {
      response += `\n\n📋 *แสดง ${displayLimit} จาก ${count} รายการ*`;
    }

    return response;
  }

  _formatIngredients(items) {
    let output = '**📦 วัตถุดิบ**\n\n';
    items.forEach((item, i) => {
      const stock = item.current_stock || 0;
      const min = item.min_stock || 0;
      const warning = stock < min ? ' ⚠️ **ต่ำกว่าขั้นต่ำ!**' : '';
      const status = stock < min ? '🔴' : stock < min * 1.5 ? '🟡' : '🟢';
      
      output += `**${i + 1}. ${item.name}**${warning}\n`;
      output += `   ${status} คงเหลือ: **${stock.toLocaleString('th-TH')} ${item.unit}**`;
      if (min > 0) output += ` | ขั้นต่ำ: ${min.toLocaleString('th-TH')} ${item.unit}`;
      if (item.cost_per_unit) {
        output += `\n   💰 ราคา: ฿${item.cost_per_unit.toLocaleString('th-TH')}/${item.unit}`;
        const totalValue = stock * item.cost_per_unit;
        output += ` | มูลค่ารวม: ฿${totalValue.toLocaleString('th-TH')}`;
      }
      output += '\n\n';
    });
    return output;
  }

  _formatMenus(items) {
    let output = '**🍽️ เมนูอาหาร**\n\n';
    items.forEach((item, i) => {
      const status = item.is_available === false ? ' 🔴 ไม่พร้อมขาย' : ' 🟢 พร้อมขาย';
      const price = item.price || 0;
      const cost = item.cost_per_unit || 0;
      const profit = price - cost;
      
      output += `**${i + 1}. ${item.name}**${status}\n`;
      
      // Price information
      output += `   💰 ราคาขาย: **฿${price.toLocaleString('th-TH')}**\n`;
      
      // Cost and profit if available
      if (cost > 0) {
        output += `   📊 ต้นทุน: ฿${cost.toLocaleString('th-TH')} | กำไร: ฿${profit.toLocaleString('th-TH')}\n`;
      }
      
      // Description if available
      if (item.description) {
        output += `   📝 ${item.description}\n`;
      }
      
      output += '\n';
    });
    return output;
  }

  _formatTransactions(items) {
    let output = '**💰 รายการล่าสุด**\n';
    items.forEach((item, i) => {
      const type = item.transaction_type || 'unknown';
      const icon = type === 'sale' ? '📤' : type === 'purchase' ? '📥' : '🔄';
      const date = item.transaction_date || item.created_at;
      const dateStr = date ? new Date(date).toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '';
      
      output += `${i + 1}. ${icon} **${type.toUpperCase()}**\n`;
      output += `   └ จำนวน: ${item.quantity} ${item.unit}`;
      if (item.total_amount) output += ` | ยอด: ${item.total_amount} บาท`;
      if (dateStr) output += ` | ${dateStr}`;
      output += '\n\n';
    });
    return output;
  }

  _formatPlatforms(items) {
    let output = '**🏪 แพลตฟอร์ม**\n';
    items.forEach((item, i) => {
      const active = item.is_active ? '✅' : '❌';
      output += `${i + 1}. **${item.name}** ${active}\n`;
      if (item.commission_rate) {
        output += `   └ ค่าคอมมิชชั่น: ${item.commission_rate}%\n`;
      }
      output += '\n';
    });
    return output;
  }

  _formatGeneric(items) {
    // For unknown entities, show first few fields in a clean format
    let output = '';
    items.forEach((item, i) => {
      // Filter out technical/internal fields
      const keys = Object.keys(item).filter(k => 
        !k.includes('id') && 
        !k.includes('created') && 
        !k.includes('updated') &&
        !k.includes('_at') &&
        item[k] !== null &&
        item[k] !== undefined &&
        item[k] !== ''
      );
      
      if (keys.length === 0) return; // Skip empty items
      
      const mainField = keys[0];
      const value = item[mainField];
      
      // Format main field
      output += `${i + 1}. **${value}**\n`;
      
      // Show up to 3 more important fields (skip null/empty)
      const importantFields = keys.slice(1, 4).filter(key => {
        const val = item[key];
        return val !== null && val !== undefined && val !== '';
      });
      
      importantFields.forEach(key => {
        let displayValue = item[key];
        // Format numbers
        if (typeof displayValue === 'number') {
          if (key.includes('price') || key.includes('cost') || key.includes('amount')) {
            displayValue = `฿${displayValue.toFixed(2)}`;
          } else {
            displayValue = displayValue.toLocaleString();
          }
        }
        // Format dates
        if (key.includes('date') && typeof displayValue === 'string') {
          try {
            displayValue = new Date(displayValue).toLocaleDateString('th-TH');
          } catch (e) {
            // Keep original if parsing fails
          }
        }
        output += `   └ ${key}: ${displayValue}\n`;
      });
      output += '\n';
    });
    return output;
  }

  async _generateErrorSuggestion(error, userInput) {
    const suggestionPrompt = `The following error occurred while processing a user request. Provide a helpful suggestion.

Error: ${error.message}
User Request: "${userInput}"

Provide a constructive suggestion to help the user:
1. Fix the issue
2. Reformat their request
3. Achieve their goal in a different way

Be specific and helpful.`;

    return await this.aiProvider.generateCompletion(suggestionPrompt, {
      temperature: 0.3,
      maxTokens: 256
    });
  }

  // ==================== Helper Methods ====================

  async _getDatabaseSchema() {
    // Return ACTUAL database schema matching Supabase tables
    return {
      tables: {
        // Core tables (confirmed to exist)
        ingredients: ['id', 'name', 'description', 'unit', 'current_stock', 'min_stock', 'cost_per_unit', 'category_id', 'created_at'],
        menus: ['id', 'menu_id', 'name', 'price', 'cost_per_unit', 'description', 'image_url', 'is_active', 'is_available', 'created_at'],
        platforms: ['id', 'name', 'description', 'commission_rate', 'is_active', 'created_at'],
        stock_transactions: ['id', 'ingredient_id', 'menu_id', 'platform_id', 'user_id', 'transaction_type', 'quantity', 'unit', 'unit_price', 'total_amount', 'reference_id', 'notes', 'transaction_date', 'created_at'],
        menu_recipes: ['id', 'menu_id', 'ingredient_id', 'quantity_per_serve', 'unit', 'notes', 'created_at']
      },
      // Table name aliases for user queries
      aliases: {
        'inventory': 'ingredients',
        'stock': 'ingredients',
        'items': 'ingredients',
        'products': 'menus',
        'dishes': 'menus',
        'food': 'menus',
        'transactions': 'stock_transactions',
        'sales': 'stock_transactions',
        'purchases': 'stock_transactions',
        'orders': 'stock_transactions',
        'recipes': 'menu_recipes',
        'ingredients_list': 'menu_recipes'
      }
    };
  }

  async _getRecentDataSnapshot() {
    try {
      // Get quick snapshots of key data for context (using actual tables)
      const [menuCount, ingredientCount, transactionCount] = await Promise.all([
        this.db.read('menus', { columns: 'id', limit: 1000 }),
        this.db.read('ingredients', { columns: 'id', limit: 1000 }),
        this.db.read('stock_transactions', {
          columns: 'id',
          limit: 100,
          orderBy: { column: 'created_at', ascending: false }
        })
      ]);

      return {
        menuCount: menuCount.length,
        ingredientCount: ingredientCount.length,
        recentTransactionCount: transactionCount.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      log.warn('AI', 'Failed to load data snapshot', { error: error.message });
      return { error: error.message };
    }
  }

  _detectIntentType(input) {
    const patterns = {
      create: /\b(สร้าง|เพิ่ม|บันทึก|ใส่|add|create|insert|new)\b/i,
      update: /\b(อัพเดท|แก้ไข|เปลี่ยน|update|modify|edit|change)\b/i,
      delete: /\b(ลบ|ลบทิ้ง|delete|remove|clear)\b/i,
      analyze: /\b(วิเคราะห์|สรุป|รายงาน|analyze|report|summary)\b/i,
      read: /\b(แสดง|ดู|ค้นหา|show|display|find|search|get|list)\b/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(input)) return type;
    }

    return 'read'; // Default to read
  }

  _detectEntity(input) {
    const entities = {
      sales: /\b(ขาย|ยอดขาย|sale|sales|revenue)\b/i,
      purchases: /\b(ซื้อ|จัดซื้อ|purchase|buy|procurement)\b/i,
      expenses: /\b(ค่าใช้จ่าย|expense|cost)\b/i,
      menus: /\b(เมนู|menu|food|dish)\b/i,
      ingredients: /\b(วัตถุดิบ|ส่วนผสม|ingredient|material)\b/i,
      inventory: /\b(สต็อก|คลัง|stock|inventory)\b/i
    };

    for (const [entity, pattern] of Object.entries(entities)) {
      if (pattern.test(input)) return entity;
    }

    return 'data';
  }

  _extractParameters(input) {
    // Simple parameter extraction - can be enhanced with AI
    const params = {};

    // Extract dates
    const dateMatch = input.match(/\b(\d{4}-\d{2}-\d{2}|วันนี้|เมื่อวาน|เดือนนี้|ปีนี้)\b/);
    if (dateMatch) params.date = dateMatch[1];

    // Extract numbers
    const numbers = input.match(/\b(\d+(?:\.\d+)?)\b/g);
    if (numbers) params.numbers = numbers.map(n => parseFloat(n));

    return params;
  }
}

export default AIAssistant;
