/**
 * Optimized WebApp Chatbot Handler with Full AI Capabilities
 * Complete database access with no restrictions
 * Rich UI integration and real-time updates
 */

import { AIAssistant } from './ai-assistant.js';

export class WebAppHandler {
  constructor(config) {
    this.ai = new AIAssistant(config);
    this.initialized = false;
    this.sessionContexts = new Map();
  }

  async initialize() {
    try {
      await this.ai.initialize();
      this.initialized = true;
      console.log('WebApp Handler initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebApp Handler:', error);
      throw error;
    }
  }

  /**
   * Process chat message from web interface
   */
  async processMessage(message, sessionId, userId) {
    try {
      // Get or create session context
      const sessionContext = this._getOrCreateSession(sessionId, userId);

      // Add user message to history
      sessionContext.history.push({
        type: 'user',
        message,
        timestamp: new Date().toISOString()
      });

      // Create context for AI processing
      const context = {
        platform: 'webapp',
        userId: userId || 'anonymous',
        sessionId: sessionId,
        sessionHistory: sessionContext.history,
        userPreferences: sessionContext.preferences,
        timestamp: new Date().toISOString()
      };

      // Process with AI assistant
      const result = await this.ai.processRequest(message, context);

      // Add AI response to history
      sessionContext.history.push({
        type: 'assistant',
        message: result.response,
        data: result.data,
        timestamp: new Date().toISOString()
      });

      // Format response for web UI
      const webResponse = await this._formatWebResponse(result, sessionContext);

      return {
        success: true,
        response: webResponse,
        sessionId: sessionId,
        metadata: result.metadata
      };

    } catch (error) {
      console.error('Error processing webapp message:', error);

      return {
        success: false,
        error: error.message,
        suggestion: await this._generateErrorHelp(error, message),
        sessionId: sessionId
      };
    }
  }

  /**
   * Format response for rich web UI
   */
  async _formatWebResponse(result, sessionContext) {
    if (!result.success) {
      return {
        type: 'error',
        message: result.error,
        suggestion: result.suggestion,
        actions: this._getErrorActions()
      };
    }

    const { response, data, intent } = result;

    // Base response
    const webResponse = {
      type: 'message',
      message: response,
      intent: intent,
      data: data,
      actions: []
    };

    // Add rich components based on data and intent
    if (data && (data.data || data.length !== undefined)) {
      webResponse.components = await this._createDataComponents(data, intent);
      webResponse.actions = this._createDataActions(intent, data);
    }

    // Add quick actions
    webResponse.quickActions = this._getQuickActions(intent, sessionContext);

    // Add visualization suggestions
    if (intent?.type === 'analyze') {
      webResponse.visualizations = this._suggestVisualizations(data, intent);
    }

    return webResponse;
  }

  /**
   * Create rich data components for web UI
   */
  async _createDataComponents(data, intent) {
    const components = [];

    // Table component for tabular data
    if (data.data || Array.isArray(data)) {
      const records = data.data || data;
      if (records.length > 0) {
        components.push({
          type: 'table',
          title: 'ข้อมูลที่พบ',
          data: records,
          pagination: {
            currentPage: 1,
            pageSize: Math.min(records.length, 50),
            totalRecords: records.length
          },
          columns: this._generateTableColumns(records[0])
        });
      }
    }

    // Summary cards for analytics
    if (intent?.type === 'analyze') {
      components.push({
        type: 'summary-cards',
        cards: this._createSummaryCards(data, intent)
      });
    }

    // Chart data for analytics
    if (intent?.entity === 'sales' || intent?.entity === 'inventory') {
      components.push({
        type: 'chart',
        chartType: this._suggestChartType(intent),
        data: this._prepareChartData(data, intent),
        title: `${intent.entity} Analysis`
      });
    }

    // Form components for create/update operations
    if (intent?.type === 'create' || intent?.type === 'update') {
      components.push({
        type: 'form',
        title: `เพิ่ม${intent.entity === 'expenses' ? 'ค่าใช้จ่าย' : 'ข้อมูล'}`,
        fields: this._generateFormFields(intent),
        submitText: 'บันทึก',
        apiEndpoint: `/api/${intent.entity}`
      });
    }

    return components;
  }

  /**
   * Generate table columns dynamically
   */
  _generateTableColumns(sampleRecord) {
    if (!sampleRecord) return [];

    const columns = [];
    const fieldMap = {
      id: { label: 'ID', width: 80, sortable: true },
      name: { label: 'ชื่อ', width: 200, sortable: true },
      menu_id: { label: 'รหัสเมนู', width: 100, sortable: true },
      price: { label: 'ราคา', width: 120, sortable: true, format: 'currency' },
      quantity: { label: 'จำนวน', width: 100, sortable: true },
      total_amount: { label: 'ยอดรวม', width: 120, sortable: true, format: 'currency' },
      current_stock: { label: 'สต็อกปัจจุบัน', width: 120, sortable: true },
      min_stock: { label: 'สต็อกขั้นต่ำ', width: 120, sortable: true },
      order_date: { label: 'วันที่', width: 120, sortable: true, format: 'date' },
      created_at: { label: 'สร้างเมื่อ', width: 150, sortable: true, format: 'datetime' },
      status: { label: 'สถานะ', width: 100, sortable: true },
      category: { label: 'หมวดหมู่', width: 150, sortable: true },
      vendor: { label: 'ผู้ขาย', width: 150, sortable: true }
    };

    Object.keys(sampleRecord).forEach(key => {
      if (key.includes('_id') && key !== 'id') return; // Skip foreign keys

      const fieldInfo = fieldMap[key] || {
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        width: 120,
        sortable: true
      };

      columns.push({
        key,
        ...fieldInfo,
        type: this._getColumnType(sampleRecord[key])
      });
    });

    return columns;
  }

  /**
   * Create summary cards for analytics
   */
  _createSummaryCards(data, intent) {
    const cards = [];

    switch (intent.entity) {
      case 'sales':
        if (data.summary) {
          cards.push(
            {
              title: 'ยอดขายรวม',
              value: data.summary.totalRevenue || 0,
              format: 'currency',
              icon: '💰',
              color: 'green'
            },
            {
              title: 'จำนวนการขาย',
              value: data.summary.totalSales || 0,
              icon: '📊',
              color: 'blue'
            },
            {
              title: 'กำไรขั้นต้น',
              value: data.summary.grossProfit || 0,
              format: 'currency',
              icon: '📈',
              color: 'purple'
            }
          );
        }
        break;

      case 'inventory':
        if (data.stock_health_score) {
          cards.push(
            {
              title: 'สุขภาพสต็อก',
              value: `${data.stock_health_score}%`,
              icon: '✅',
              color: data.stock_health_score >= 80 ? 'green' : data.stock_health_score >= 60 ? 'yellow' : 'red'
            },
            {
              title: 'สินค้าใกล้หมด',
              value: data.critical_stock?.length || 0,
              icon: '⚠️',
              color: 'red'
            },
            {
              title: 'มูลค่าสต็อกทั้งหมด',
              value: data.total_inventory_value || 0,
              format: 'currency',
              icon: '📦',
              color: 'blue'
            }
          );
        }
        break;

      case 'expenses':
        if (data.summary) {
          cards.push(
            {
              title: 'ค่าใช้จ่ายรวม',
              value: data.summary.totalExpenses || 0,
              format: 'currency',
              icon: '💸',
              color: 'red'
            },
            {
              title: 'จำนวนรายการ',
              value: data.summary.totalTransactions || 0,
              icon: '📝',
              color: 'blue'
            },
            {
              title: 'ค่าใช้จ่ายเฉลี่ย',
              value: data.summary.totalExpenses / (data.summary.totalTransactions || 1),
              format: 'currency',
              icon: '📊',
              color: 'purple'
            }
          );
        }
        break;
    }

    return cards;
  }

  /**
   * Create data actions
   */
  _createDataActions(intent, data) {
    const actions = [];

    // Universal actions
    actions.push({
      type: 'export',
      label: 'ส่งออกข้อมูล',
      icon: '📥',
      endpoint: `/api/export/${intent.entity}`
    });

    // Entity-specific actions
    switch (intent.entity) {
      case 'sales':
        actions.push(
          {
            type: 'analytics',
            label: 'วิเคราะห์เพิ่มเติม',
            icon: '📊',
            endpoint: `/analytics/sales`
          },
          {
            type: 'create',
            label: 'เพิ่มการขาย',
            icon: '➕',
            endpoint: '/sales/new'
          }
        );
        break;

      case 'ingredients':
        actions.push(
          {
            type: 'bulk-update',
            label: 'อัพเดทสต็อก',
            icon: '📦',
            endpoint: '/ingredients/bulk-update'
          },
          {
            type: 'order',
            label: 'สั่งซื้อวัตถุดิบ',
            icon: '🛒',
            endpoint: '/purchases/new'
          }
        );
        break;

      case 'expenses':
        actions.push(
          {
            type: 'create',
            label: 'เพิ่มค่าใช้จ่าย',
            icon: '➕',
            endpoint: '/expenses/new'
          },
          {
            type: 'report',
            label: 'รายงานค่าใช้จ่าย',
            icon: '📄',
            endpoint: '/reports/expenses'
          }
        );
        break;
    }

    return actions;
  }

  /**
   * Get context-aware quick actions
   */
  _getQuickActions(intent, sessionContext) {
    const baseActions = [
      { label: '📈 สรุปยอดวันนี้', action: 'summary_today' },
      { label: '📦 ตรวจสต็อก', action: 'check_inventory' },
      { label: '💰 ค่าใช้จ่าย', action: 'show_expenses' },
      { label: '🍽️ เมนูยอดนิยม', action: 'popular_menus' }
    ];

    // Add contextual actions
    if (intent?.type === 'read' && intent?.entity === 'sales') {
      baseActions.push({ label: '📊 วิเคราะห์ขาย', action: 'analyze_sales' });
    }

    if (intent?.type === 'create') {
      baseActions.push({ label: '➕ เพิ่มอีก', action: 'add_another' });
    }

    return baseActions;
  }

  /**
   * Suggest visualizations for analytics
   */
  _suggestVisualizations(data, intent) {
    const visualizations = [];

    switch (intent.entity) {
      case 'sales':
        visualizations.push(
          {
            type: 'line-chart',
            title: 'ยอดขายรายวัน',
            dataKey: 'daily_sales'
          },
          {
            type: 'pie-chart',
            title: 'ยอดขายตามแพลตฟอร์ม',
            dataKey: 'platform_performance'
          },
          {
            type: 'bar-chart',
            title: 'เมนูขายดี',
            dataKey: 'best_sellers'
          }
        );
        break;

      case 'inventory':
        visualizations.push(
          {
            type: 'doughnut-chart',
            title: 'สัดส่วนสต็อก',
            dataKey: 'stock_levels'
          },
          {
            type: 'bar-chart',
            title: 'มูลค่าสต็อกตามผู้จัดจำหน่าย',
            dataKey: 'supplier_analysis'
          }
        );
        break;
    }

    return visualizations;
  }

  /**
   * Generate form fields for create/update
   */
  _generateFormFields(intent) {
    const formFields = {
      sales: [
        { name: 'menu_id', label: 'เมนู', type: 'select', required: true },
        { name: 'platform_id', label: 'แพลตฟอร์ม', type: 'select', required: true },
        { name: 'quantity', label: 'จำนวน', type: 'number', required: true },
        { name: 'unit_price', label: 'ราคาต่อหน่วย', type: 'number', required: true },
        { name: 'payment_method', label: 'วิธีชำระ', type: 'select', required: true }
      ],
      expenses: [
        { name: 'description', label: 'รายการ', type: 'text', required: true },
        { name: 'amount', label: 'จำนวนเงิน', type: 'number', required: true },
        { name: 'category', label: 'หมวดหมู่', type: 'select', required: true },
        { name: 'vendor', label: 'ผู้จำหน่าย', type: 'text' },
        { name: 'expense_date', label: 'วันที่', type: 'date', required: true },
        { name: 'payment_method', label: 'วิธีชำระ', type: 'select', required: true }
      ],
      purchases: [
        { name: 'ingredient_id', label: 'วัตถุดิบ', type: 'select', required: true },
        { name: 'quantity', label: 'จำนวน', type: 'number', required: true },
        { name: 'unit', label: 'หน่วย', type: 'text', required: true },
        { name: 'unit_price', label: 'ราคาต่อหน่วย', type: 'number', required: true },
        { name: 'vendor', label: 'ผู้จำหน่าย', type: 'text', required: true },
        { name: 'purchase_date', label: 'วันที่ซื้อ', type: 'date', required: true }
      ]
    };

    return formFields[intent.entity] || [];
  }

  /**
   * Helper methods
   */
  _getOrCreateSession(sessionId, userId) {
    if (!this.sessionContexts.has(sessionId)) {
      this.sessionContexts.set(sessionId, {
        userId: userId || 'anonymous',
        history: [],
        preferences: {
          language: 'th',
          theme: 'light'
        },
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
    }

    const session = this.sessionContexts.get(sessionId);
    session.lastActivity = new Date().toISOString();
    return session;
  }

  _getColumnType(value) {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'number' : 'currency';
    }
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date';
      if (value.match(/^\d{4}-\d{2}-\d{2}T/)) return 'datetime';
    }
    return 'text';
  }

  _suggestChartType(intent) {
    const chartTypes = {
      sales: 'line',
      inventory: 'bar',
      expenses: 'pie'
    };
    return chartTypes[intent.entity] || 'bar';
  }

  _prepareChartData(data, intent) {
    // Transform data for chart consumption
    return data;
  }

  _getErrorActions() {
    return [
      {
        type: 'retry',
        label: 'ลองใหม่',
        icon: '🔄'
      },
      {
        type: 'help',
        label: 'ขอความช่วยเหลือ',
        icon: '❓'
      }
    ];
  }

  async _generateErrorHelp(error, originalMessage) {
    try {
      const helpPrompt = `User encountered this error: "${error.message}"
      when trying to: "${originalMessage}"

      Provide a helpful suggestion to:
      1. Fix the immediate issue
      2. Reformat their request properly
      3. Achieve their goal in a different way

      Be specific and constructive.`;

      return await this.ai.aiProvider.generateCompletion(helpPrompt, {
        temperature: 0.3,
        maxTokens: 256
      });
    } catch (error) {
      return 'กรุณาตรวจสอบคำสั่งและลองใหม่อีกครั้ง';
    }
  }

  /**
   * Export data in various formats
   */
  async exportData(sessionId, format = 'json', options = {}) {
    const sessionContext = this.sessionContexts.get(sessionId);
    if (!sessionContext) {
      throw new Error('Session not found');
    }

    // Get the last query result
    const lastAssistantMessage = sessionContext.history
      .filter(m => m.type === 'assistant')
      .pop();

    if (!lastAssistantMessage || !lastAssistantMessage.data) {
      throw new Error('No data to export');
    }

    const data = lastAssistantMessage.data.data || lastAssistantMessage.data;

    return await this.ai.db.exportData(data, format, options);
  }

  /**
   * Get session history
   */
  getSessionHistory(sessionId) {
    const session = this.sessionContexts.get(sessionId);
    return session ? session.history : [];
  }

  /**
   * Clear session history
   */
  clearSession(sessionId) {
    this.sessionContexts.delete(sessionId);
  }

  /**
   * Update user preferences
   */
  updatePreferences(sessionId, preferences) {
    const session = this.sessionContexts.get(sessionId);
    if (session) {
      session.preferences = { ...session.preferences, ...preferences };
    }
  }
}

export default WebAppHandler;
