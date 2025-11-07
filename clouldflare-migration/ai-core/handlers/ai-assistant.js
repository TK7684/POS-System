/**
 * Unified AI Assistant Handler
 * Complete database access with no restrictions
 * Supports natural language to database operations
 * Enhanced with comprehensive logging for debugging and optimization
 */

import { DatabaseManager } from '../database/database-manager.js';
import { AIProvider } from '../ai-providers/ai-provider.js';

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
    const intentPrompt = `Analyze the user's request and determine their intent. You have FULL DATABASE ACCESS - no restrictions.

Database Schema:
${JSON.stringify(this.context.databaseSchema, null, 2)}

User Request: "${userInput}"

Respond with JSON in this format:
{
  "type": "read|create|update|delete|analyze|export|import|custom",
  "entity": "table_name_or_entity",
  "parameters": {
    "filters": {},
    "data": {},
    "operations": []
  },
  "confidence": 0.9,
  "explanation": "Brief explanation of what the user wants"
}

Common operations include:
- Reading data from any table
- Creating new records (sales, purchases, expenses, menu items, etc.)
- Updating existing records
- Deleting records
- Running analytics and reports
- Calculating costs and profits
- Managing inventory
- Importing/exporting data
- Custom queries and calculations`;

    const response = await this.aiProvider.generateCompletion(intentPrompt, {
      temperature: 0.1,
      maxTokens: 512
    });

    try {
      return JSON.parse(response);
    } catch (error) {
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

  async _executeReadOperation(intent) {
    const { entity, parameters } = intent;

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
    // Return comprehensive schema definition
    return {
      tables: {
        users: ['id', 'email', 'display_name', 'role', 'created_at'],
        platforms: ['id', 'name', 'commission_rate', 'is_active'],
        categories: ['id', 'name', 'type'],
        ingredients: ['id', 'name', 'unit', 'current_stock', 'min_stock', 'cost_per_unit', 'supplier'],
        menus: ['id', 'menu_id', 'name', 'price', 'is_active', 'is_available'],
        menu_recipes: ['id', 'menu_id', 'ingredient_id', 'quantity_per_serve', 'unit'],
        sales: ['id', 'menu_id', 'platform_id', 'quantity', 'unit_price', 'total_amount', 'order_date', 'order_time'],
        purchases: ['id', 'ingredient_id', 'quantity', 'unit', 'unit_price', 'total_amount', 'vendor', 'purchase_date'],
        expenses: ['id', 'description', 'amount', 'expense_date', 'category', 'payment_method', 'vendor'],
        stock_transactions: ['id', 'ingredient_id', 'transaction_type', 'quantity_change', 'created_at'],
        labor_logs: ['id', 'employee_name', 'date', 'hours_worked', 'rate_per_hour', 'total_amount'],
        waste: ['id', 'ingredient_id', 'quantity', 'reason', 'date']
      }
    };
  }

  async _getRecentDataSnapshot() {
    try {
      // Get quick snapshots of key data for context
      const [menuCount, ingredientCount, todaySales] = await Promise.all([
        this.db.read('menus', { columns: 'id', limit: 1000 }),
        this.db.read('ingredients', { columns: 'id', limit: 1000 }),
        this.db.read('sales', {
          filters: { order_date: new Date().toISOString().split('T')[0] },
          limit: 100
        })
      ]);

      return {
        menuCount: menuCount.length,
        ingredientCount: ingredientCount.length,
        todaySalesCount: todaySales.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
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
