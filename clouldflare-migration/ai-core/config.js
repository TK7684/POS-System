/**
 * AI Core System Configuration
 * Central configuration for both LINE Bot and WebApp chatbot
 * Full database access with no restrictions
 */

// Environment-based configuration
const ENV = {
  // Supabase Configuration
  SUPABASE_URL: typeof window !== 'undefined' && window.SUPABASE_URL ?
    window.SUPABASE_URL :
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ?
    process.env.SUPABASE_URL :
    'https://rtfreafhlelpxqwohspq.supabase.co',

  SUPABASE_ANON_KEY: typeof window !== 'undefined' && window.SUPABASE_ANON_KEY ?
    window.SUPABASE_ANON_KEY :
    (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ?
    process.env.SUPABASE_ANON_KEY :
    null,

  SUPABASE_SERVICE_ROLE_KEY: typeof window !== 'undefined' && window.SUPABASE_SERVICE_ROLE_KEY ?
    window.SUPABASE_SERVICE_ROLE_KEY :
    (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) ?
    process.env.SUPABASE_SERVICE_ROLE_KEY :
    null,

  // AI Provider Configuration
  GEMINI_API_KEY: typeof window !== 'undefined' && window.GEMINI_API_KEY ?
    window.GEMINI_API_KEY :
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ?
    process.env.GEMINI_API_KEY :
    null,

  HUGGINGFACE_API_KEY: typeof window !== 'undefined' && window.HUGGINGFACE_API_KEY ?
    window.HUGGINGFACE_API_KEY :
    (typeof process !== 'undefined' && process.env?.HUGGINGFACE_API_KEY) ?
    process.env.HUGGINGFACE_API_KEY :
    null,

  OPENAI_API_KEY: typeof window !== 'undefined' && window.OPENAI_API_KEY ?
    window.OPENAI_API_KEY :
    (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) ?
    process.env.OPENAI_API_KEY :
    null,

  // LINE Bot Configuration
  LINE_CHANNEL_ACCESS_TOKEN: typeof window !== 'undefined' && window.LINE_CHANNEL_ACCESS_TOKEN ?
    window.LINE_CHANNEL_ACCESS_TOKEN :
    (typeof process !== 'undefined' && process.env?.LINE_CHANNEL_ACCESS_TOKEN) ?
    process.env.LINE_CHANNEL_ACCESS_TOKEN :
    null,

  LINE_CHANNEL_SECRET: typeof window !== 'undefined' && window.LINE_CHANNEL_SECRET ?
    window.LINE_CHANNEL_SECRET :
    (typeof process !== 'undefined' && process.env?.LINE_CHANNEL_SECRET) ?
    process.env.LINE_CHANNEL_SECRET :
    null,

  // Google Cloud (for additional features)
  GOOGLE_CLOUD_API_KEY: typeof window !== 'undefined' && window.GOOGLE_CLOUD_API_KEY ?
    window.GOOGLE_CLOUD_API_KEY :
    (typeof process !== 'undefined' && process.env?.GOOGLE_CLOUD_API_KEY) ?
    process.env.GOOGLE_CLOUD_API_KEY :
    null,
};

// AI System Configuration
export const AI_CONFIG = {
  // Primary AI provider (gemini, openai, huggingface)
  primaryProvider: 'gemini',

  // Fallback providers in order of preference
  fallbackProviders: [
    {
      type: 'openai',
      config: {
        apiKey: ENV.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo'
      }
    },
    {
      type: 'huggingface',
      config: {
        apiKey: ENV.HUGGINGFACE_API_KEY,
        model: 'mistralai/Mistral-7B-Instruct-v0.2'
      }
    }
  ],

  // AI Settings
  aiSettings: {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
    enableStreaming: true,
    enableChainOfThought: true,
    enableBatchProcessing: true,
    enableContextMemory: true,
    maxContextLength: 10, // Keep last 10 interactions
  },

  // Database Configuration
  databaseConfig: {
    maxBatchSize: 100,
    enableCaching: true,
    cacheTimeout: 300000, // 5 minutes
    enableRealTimeUpdates: true,
    enableAutoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  },

  // Features Configuration
  features: {
    // Analytics
    enableAdvancedAnalytics: true,
    enableRealTimeStats: true,
    enablePredictiveAnalysis: true,

    // Natural Language Processing
    enableIntentRecognition: true,
    enableEntityExtraction: true,
    enableSentimentAnalysis: true,
    enableLanguageDetection: true,

    // Data Operations
    enableCRUDOperations: true,
    enableBulkOperations: true,
    enableDataImportExport: true,
    enableDataValidation: true,

    // Notifications
    enableProactiveNotifications: true,
    enableLowStockAlerts: true,
    enableDailySummaries: true,
    enableScheduledReports: true,

    // UI Features (WebApp only)
    enableRichComponents: true,
    enableDataVisualization: true,
    enableInteractiveTables: true,
    enableQuickActions: true,

    // LINE Bot Features
    enableQuickReplies: true,
    enableFollowUpQuestions: true,
    enableImageProcessing: false, // Disabled for now, needs OCR integration
    enableConfirmationFlow: true,

    // Learning System
    enableLearningSystem: true,
    enablePatternRecognition: true,
    enablePreferenceLearning: true,
    enableAdaptiveResponses: true,
  },

  // Security Settings
  security: {
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
    enableInputSanitization: true,
    enableSqlInjectionProtection: true,
    enableXssProtection: true,
    maxMessageLength: 4000,
    allowedDomains: [
      'supabase.co',
      'googleapis.com',
      'api.openai.com',
      'huggingface.co',
      'line.me'
    ]
  },

  // Logging and Monitoring
  logging: {
    enableDebugLogging: true,
    enablePerformanceLogging: true,
    enableErrorTracking: true,
    enableUserAnalytics: true,
    logLevel: 'INFO', // DEBUG, INFO, WARN, ERROR
    maxLogSize: 1000,
    enableLogExport: true,
  },

  // Performance Optimization
  performance: {
    enableLazyLoading: true,
    enableDebouncing: true,
    enableThrottling: true,
    enableRequestOptimization: true,
    maxConcurrentRequests: 5,
    requestTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
};

// Platform-specific configurations
export const PLATFORM_CONFIG = {
  // LINE Bot Configuration
  line: {
    webhookEndpoint: '/api/line-webhook',
    messageLengthLimit: 2000,
    quickReplyLimit: 13,
    richMessageTypes: ['text', 'image', 'video', 'audio'],
    supportedActions: ['message', 'postback', 'uri'],
    dailySummaryTime: '09:00', // 9 AM
    enableFollowUpMessages: true,
    enableProactiveAlerts: true,
  },

  // WebApp Configuration
  webapp: {
    maxSessionDuration: 3600000, // 1 hour
    maxHistoryLength: 50,
    enableAutoSave: true,
    enableAutoRefresh: true,
    supportedChartTypes: ['line', 'bar', 'pie', 'doughnut', 'radar'],
    supportedExportFormats: ['json', 'csv', 'excel', 'pdf'],
    enableDarkMode: true,
    enableThemeSwitching: true,
  },

  // Cloudflare Workers Configuration
  cloudflare: {
    maxExecutionTime: 30000, // 30 seconds
    maxMemoryUsage: 128, // 128 MB
    enableEdgeCaching: true,
    cacheTTL: 3600, // 1 hour
    enableCompressedResponses: true,
    enableEnvironmentSpecificConfig: true,
  },
};

// Database schema for AI context
export const DATABASE_SCHEMA = {
  tables: {
    users: {
      description: "User accounts and authentication",
      columns: ["id", "email", "display_name", "role", "created_at"],
      relationships: [],
      permissions: ["read:own", "write:own"],
    },
    platforms: {
      description: "Delivery platforms (ร้าน, Grab, FoodPanda, Line Man)",
      columns: ["id", "name", "commission_rate", "is_active"],
      relationships: [],
      permissions: ["read:all", "write:admin"],
    },
    categories: {
      description: "Categories for ingredients and menus",
      columns: ["id", "name", "type"],
      relationships: [],
      permissions: ["read:all", "write:admin"],
    },
    ingredients: {
      description: "Ingredient inventory with stock levels and costs",
      columns: ["id", "name", "unit", "current_stock", "min_stock", "cost_per_unit", "supplier", "category_id"],
      relationships: ["category_id -> categories"],
      permissions: ["read:all", "write:all"],
    },
    menus: {
      description: "Menu items with pricing and availability",
      columns: ["id", "menu_id", "name", "description", "price", "is_active", "is_available", "preparation_time_minutes", "category_id"],
      relationships: ["category_id -> categories"],
      permissions: ["read:all", "write:all"],
    },
    menu_recipes: {
      description: "Menu ingredient relationships and quantities",
      columns: ["id", "menu_id", "ingredient_id", "quantity_per_serve", "unit"],
      relationships: ["menu_id -> menus", "ingredient_id -> ingredients"],
      permissions: ["read:all", "write:all"],
    },
    sales: {
      description: "Sales transactions with platform and payment info",
      columns: ["id", "menu_id", "platform_id", "quantity", "unit_price", "total_amount", "order_date", "order_time", "payment_method", "user_id"],
      relationships: ["menu_id -> menus", "platform_id -> platforms", "user_id -> users"],
      permissions: ["read:all", "write:all"],
    },
    purchases: {
      description: "Ingredient purchases with vendor details",
      columns: ["id", "ingredient_id", "quantity", "unit", "unit_price", "total_amount", "vendor", "purchase_date", "purchase_time", "user_id"],
      relationships: ["ingredient_id -> ingredients", "user_id -> users"],
      permissions: ["read:all", "write:all"],
    },
    expenses: {
      description: "Business expenses with categories and payment methods",
      columns: ["id", "description", "amount", "expense_date", "category", "subcategory", "payment_method", "vendor", "status", "user_id"],
      relationships: ["user_id -> users"],
      permissions: ["read:all", "write:all"],
    },
    stock_transactions: {
      description: "Stock movement audit trail",
      columns: ["id", "ingredient_id", "transaction_type", "quantity_change", "created_at", "user_id"],
      relationships: ["ingredient_id -> ingredients", "user_id -> users"],
      permissions: ["read:all", "write:all"],
    },
    labor_logs: {
      description: "Employee time tracking and payroll",
      columns: ["id", "employee_name", "date", "hours_worked", "rate_per_hour", "total_amount", "user_id"],
      relationships: ["user_id -> users"],
      permissions: ["read:all", "write:all"],
    },
    waste: {
      description: "Waste tracking for ingredients and menus",
      columns: ["id", "ingredient_id", "quantity", "reason", "date", "user_id"],
      relationships: ["ingredient_id -> ingredients", "user_id -> users"],
      permissions: ["read:all", "write:all"],
    },
  },

  views: {
    low_stock_view: "Items needing reorder (current_stock < min_stock)",
    recent_transactions_view: "Recent sales and purchases",
    daily_sales_summary: "Daily revenue by platform",
    profit_loss_statement: "Monthly profit and loss summary",
    ingredient_usage_report: "Ingredient consumption analysis",
  },

  procedures: {
    calculate_menu_cost: "Calculate total cost for a menu including all ingredients",
    update_stock_levels: "Update current stock based on transactions",
    generate_daily_report: "Create comprehensive daily business report",
    check_low_stock: "Identify ingredients below minimum threshold",
    calculate_profitability: "Analyze profit margins by menu and period",
  },
};

// Intent patterns for natural language processing
export const INTENT_PATTERNS = {
  // Query Intents
  query: [
    /(?:show|display|list|get|ดู|แสดง|รายการ)\s+(.+?)/i,
    /(?:what|who|how many|อะไร|ใคร|กี่|จำนวน)\s+(.+?)(?:\?|$)/i,
    /(?:find|search|ค้นหา|หา)\s+(.+?)/i,
    /(?:recent|latest|ล่าสุด|มาสุด)\s+(.+?)/i,
    /(?:top|best|สูงสุด|ดีที่สุด)\s+(.+?)/i,
    /(?:low|minimum|ต่ำสุด|น้อยที่สุด)\s+(.+?)/i,
  ],

  // Create Intents
  create: [
    /(?:add|create|new|insert|เพิ่ม|สร้าง|ใส่|บันทึก)\s+(.+?)/i,
    /(?:record|log|บันทึก|จด|ทำรายการ)\s+(.+?)/i,
    /(?:buy|purchase|ซื้อ|จัดซื้อ)\s+(.+?)/i,
    /(?:sell|sale|ขาย|จำหน่าย)\s+(.+?)/i,
  ],

  // Update Intents
  update: [
    /(?:update|modify|edit|change|แก้ไข|อัพเดท|เปลี่ยน)\s+(.+?)/i,
    /(?:adjust|fix|ปรับ|แก้ไข)\s+(.+?)/i,
    /(?:set|configure|ตั้งค่า|กำหนด)\s+(.+?)/i,
  ],

  // Delete Intents
  delete: [
    /(?:delete|remove|del|ลบ|ลบทิ้ง|ยกเลิก)\s+(.+?)/i,
    /(?:cancel|void|ยกเลิก|เพิกถอน)\s+(.+?)/i,
  ],

  // Analyze Intents
  analyze: [
    /(?:analyze|analysis|report|summary|สรุป|วิเคราะห์|รายงาน)\s+(.+?)/i,
    /(?:compare|comparison|เปรียบเทียบ|เทียบ)\s+(.+?)/i,
    /(?:profit|margin|cost|กำไร|ขอดทุน|ต้นทุน)\s+(.+?)/i,
    /(?:performance|stats|statistics|สถิติ|สถานะ)\s+(.+?)/i,
    /(?:trend|forecast|predict|ทิศทะ|ทำนาย|พยากรณ์)\s+(.+?)/i,
  ],

  // Export/Import Intents
  export: [
    /(?:export|save|download|backup|ส่งออก|บันทึก|ดาวนโหลด)\s+(.+?)/i,
    /(?:generate|create|สร้าง|สร้าง)\s+(?:report|รายงาน|csv|excel|pdf)\s*(.+?)/i,
  ],

  import: [
    /(?:import|upload|load|นำเข้า|อัพโหลด|โหลด)\s+(.+?)/i,
    /(?:bulk|batch|หลาย|มากมาย)\s+(.+?)/i,
  ],

  // Help Intents
  help: [
    /(?:help|command|usage|how to|วิธีใช้|ช่วยเหลือ|คู่มือ|คำสั่ง)/i,
    /(?:what can you|capabilities|features|ทำอะไร|มีฟังก์ชัน|ฟีเจอร์)/i,
  ],
};

// System prompts for AI
export const SYSTEM_PROMPTS = {
  // Main system prompt
  main: `You are an advanced AI assistant for a Point of Sale (POS) and inventory management system.

Your capabilities include:
- Complete database access: Read, write, update, delete any data
- Advanced analytics: Generate reports, insights, and predictions
- Natural language understanding: Parse and respond to user requests conversationally
- Multi-language support: Thai and English
- Real-time data: Access up-to-date information from all tables

Database tables available:
${Object.entries(DATABASE_SCHEMA.tables).map(([table, info]) =>
  `- ${table}: ${info.description}`
).join('\n')}

Key features:
1. No restrictions - you can access and modify any data
2. Intelligent query generation from natural language
3. Context-aware responses based on user history
4. Proactive suggestions for business optimization
5. Support for complex multi-table operations

Rules:
- Always validate data before writing to database
- Provide clear explanations for operations performed
- Ask for clarification when requests are ambiguous
- Format responses in user-friendly, conversational style
- Use Thai language primarily with English for technical terms
- Include relevant data and insights in responses
- Suggest follow-up actions when helpful

You have FULL permissions - no limitations on what you can read, write, or analyze.`,

  // Analytics prompt
  analytics: `Generate comprehensive business analytics and insights. Include:
- Key metrics and KPIs
- Trend analysis and patterns
- Performance indicators
- Recommendations for optimization
- Visual data presentation suggestions`,

  // Data operations prompt
  dataOperations: `Handle database operations with precision:
- Validate all inputs before operations
- Maintain data integrity
- Provide confirmation for critical operations
- Include error handling and recovery suggestions
- Log all operations for audit trail`,

  // Error handling prompt
  errorHandling: `Handle errors gracefully:
- Provide clear error explanations
- Offer alternative solutions
- Guide users through recovery steps
- Maintain context and state after errors
- Learn from errors to improve future responses`,

  // Proactive assistance prompt
  proactive: `Offer proactive assistance based on context:
- Suggest relevant actions before being asked
- Provide timely notifications and alerts
- Anticipate user needs based on patterns
- Offer optimization opportunities
- Flag potential issues before they become problems`,
};

// Error messages
export const ERROR_MESSAGES = {
  databaseConnection: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่',
  apiKeyMissing: 'API keys ไม่ได้รับการตั้งค่า กรุณาตรวจสอบการตั้งค่าในระบบ',
  insufficientPermissions: 'คุณไม่มีสิทธิพอเพียงพอในการดำเนินการนี้',
  dataValidationFailed: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่',
  operationTimeout: 'การดำเนินการใช้เวลานานเกินไป กรุณาลองใหม่',
  networkError: 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ต',
  unexpectedError: 'เกิดข้อผิดพลาดที่ไม่คาดคาด กรุณาลองใหม่',
  aiServiceUnavailable: 'บริการ AI ไม่พร้อมใช้งานในขณะนี้ กรุณาลองใหม่ภายหลัง',
};

// Success messages
export const SUCCESS_MESSAGES = {
  dataSaved: 'บันทึกข้อมูลเรียบร้อย',
  dataUpdated: 'อัปเดทข้อมูลเรียบร้อย',
  dataDeleted: 'ลบข้อมูลเรียบร้อย',
  operationComplete: 'ดำเนินการเสร็จ',
  analysisComplete: 'วิเคราะห์เสร็จสมบูรณ์',
  exportComplete: 'ส่งออกข้อมูลเรียบร้อย',
  importComplete: 'นำเข้าข้อมูลเรียบร้อย',
};

export default {
  ENV,
  AI_CONFIG,
  PLATFORM_CONFIG,
  DATABASE_SCHEMA,
  INTENT_PATTERNS,
  SYSTEM_PROMPTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
