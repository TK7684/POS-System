/**
 * POS Integrations Configuration
 * Google Sheets API and Line Bot configuration settings
 */

// ---------- Google Sheets Configuration ----------
const GOOGLE_SHEETS_CONFIG = {
  // Get these from Google Cloud Console
  API_KEY:
    (typeof process !== "undefined" && process.env?.GOOGLE_SHEETS_API_KEY) ||
    "1qb5_R0JhLINnU7KL3q7hFpGWT0m7OCU1sBMZ8hdUs14",
  CLIENT_ID:
    (typeof process !== "undefined" && process.env?.GOOGLE_SHEETS_CLIENT_ID) ||
    "475732756255-t80b46ohqc54uf93fdq08cu5mgm39vt1.apps.googleusercontent.com",

  // Your Google Sheet ID (from the URL)
  SPREADSHEET_ID: "1qb5_R0JhLINnU7KL3q7hFpGWT0m7OCU1sBMZ8hdUs14",

  // Sheet names and ranges
  SHEETS: {
    SALES: "Sales!A:H",
    PURCHASES: "Purchases!A:F",
    INVENTORY: "Inventory!A:Z",
    INGREDIENTS: "Ingredients!A:Z",
    RECIPES: "Recipes!A:Z",
    EXPENSES: "Expenses!A:F",
    REPORTS: "Reports!A:Z",
  },

  // Scopes required
  SCOPES: ["https://www.googleapis.com/auth/spreadsheets"],

  // Discovery document
  DISCOVERY_DOCS: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
};

// ---------- Line Bot Configuration ----------
const LINE_BOT_CONFIG = {
  // Get these from Line Developers Console
  CHANNEL_ACCESS_TOKEN:
    (typeof process !== "undefined" && process.env?.LINE_CHANNEL_ACCESS_TOKEN) ||
    "r/DiyiGj+YDZ5VBLH4GUcRBahv4TIAj3naSZKlCjmwwnsfyzSYLAg3ZoEI7WXBkE0cZzsTDtKJnkNF5ZZ4mZHIrnHn1DETTfIVAIEIW2bqOu7Vd/pNWYrA2Ub2PifQM5b07S/GBp5S+YQPQ47Fqy1AdB04t89/1O/w1cDnyilFU=",
  CHANNEL_SECRET:
    (typeof process !== "undefined" && process.env?.LINE_CHANNEL_SECRET) ||
    "5b2672bda43572ec8f2d5c4cb96c53d9",

  // Webhook configuration
  WEBHOOK_URL: (typeof process !== "undefined" && process.env?.LINE_WEBHOOK_URL) || "https://jade-cannoli-b0d851.netlify.app/.netlify/functions/line-webhook",

  // Your Line Group/Room IDs
  GROUP_IDS: [
    (typeof process !== "undefined" && process.env?.LINE_GROUP_ID_1) || "YOUR_LINE_GROUP_ID",
    // Add more group IDs as needed
  ],

  // Message processing settings
  MESSAGE_PROCESSING: {
    ENABLE_SLIP_PROCESSING: true,
    ENABLE_TEXT_PURCHASE: true,
    ENABLE_AUTO_CONFIRM: true,
    CONFIRMATION_DELAY: 1000, // ms
    MAX_RETRY_ATTEMPTS: 3,
  },

  // OCR/Slip processing
  SLIP_PROCESSING: {
    ENABLE_OCR: true,
    OCR_CONFIDENCE_THRESHOLD: 0.8,
    SUPPORTED_BANKS: [
      "kbank",
      "scb",
      "bbl",
      "ktb",
      "bay",
      "gsb",
      "tmb",
      "cba",
      "ghb",
    ],
    KEYWORDS: ["slip", "สลิป", "โอนเงิน", "transfer", "รูปสลิป", "receipt"],
    AMOUNT_PATTERNS: [
      /฿\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
      /amount[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    ],
  },

  // Text purchase processing
  TEXT_PURCHASE: {
    KEYWORDS: [
      "ซื้อ",
      "จัดซื้อ",
      "ซื้อวัตถุดิบ",
      "จัดหา",
      "สั่ง",
      "order",
      "buy",
    ],
    VENDOR_PATTERNS: [
      /ร้าน[\s]*([^\n]+)/i,
      /จาก[\s]*([^\n]+)/i,
      /ที่[\s]*([^\n]+)/i,
    ],
    AMOUNT_PATTERNS: [
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
      /ราคา[\s]*[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    ],
  },

  // Expense processing
  EXPENSE_PROCESSING: {
    KEYWORDS: [
      "ค่าใช้จ่าย",
      "ค่า",
      "จ่าย",
      "ค่าไฟ",
      "ค่าน้ำ",
      "ค่าเช่า",
      "ค่าแรง",
      "ค่าโทร",
      "ค่าเน็ต",
      "expense",
      "paid",
      "จ่ายเงิน",
    ],
    CATEGORY_MAPPING: {
      "ค่าไฟ": { category: "utility", subcategory: "electric" },
      "ค่าไฟฟ้า": { category: "utility", subcategory: "electric" },
      "ค่าน้ำ": { category: "utility", subcategory: "water" },
      "ค่าเช่า": { category: "rental", subcategory: null },
      "ค่าแรง": { category: "labor", subcategory: null },
      "ค่าโทร": { category: "utility", subcategory: null },
      "ค่าเน็ต": { category: "utility", subcategory: null },
      "ค่าสาธารณูปโภค": { category: "utility", subcategory: null },
    },
    AMOUNT_PATTERNS: [
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*฿/,
      /฿\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      /ราคา[\s:]*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    ],
    SIMILARITY_THRESHOLD: 0.5, // 50% similarity to consider duplicate
    AMOUNT_TOLERANCE: 10, // Within 10 baht to consider similar
    UPDATE_THRESHOLD: 0.01, // 1% difference to trigger update
  },
};

// ---------- Firebase Cloud Functions Configuration ----------
const FIREBASE_FUNCTIONS_CONFIG = {
  // Function URLs (replace with your deployed functions)
  BASE_URL:
    (typeof process !== "undefined" && process.env?.FUNCTIONS_BASE_URL) ||
    "https://your-region-your-project.cloudfunctions.net",

  ENDPOINTS: {
    PROCESS_LINE_WEBHOOK: "/processLineWebhook",
    SAVE_PURCHASE: "/savePurchase",
    UPDATE_INVENTORY: "/updateInventory",
    GENERATE_REPORT: "/generateReport",
    OCR_SLIP: "/processSlipOCR",
  },

  // Security settings
  SECURITY: {
    ENABLE_CORS: true,
    ALLOWED_ORIGINS: [
      "https://your-domain.firebaseapp.com",
      "https://your-domain.web.app",
      "http://localhost:3000",
    ],
    RATE_LIMITING: {
      ENABLED: true,
      MAX_REQUESTS_PER_MINUTE: 60,
      MAX_REQUESTS_PER_HOUR: 1000,
    },
  },
};

// ---------- App Configuration ----------
const APP_CONFIG = {
  // General settings
  APP_NAME: "POS & Inventory System",
  VERSION: "2.0.0",
  DEBUG_MODE: (typeof process !== "undefined" && process.env?.NODE_ENV === "development") || false,

  // UI Settings
  UI: {
    THEME: "light",
    LANGUAGE: "th",
    CURRENCY: "฿",
    DATE_FORMAT: "DD/MM/YYYY HH:mm",
    ITEMS_PER_PAGE: 20,
  },

  // Feature flags
  FEATURES: {
    ENABLE_GOOGLE_SHEETS: true,
    ENABLE_LINE_BOT: true,
    ENABLE_OFFLINE_MODE: true,
    ENABLE_REAL_TIME_SYNC: true,
    ENABLE_ADVANCED_ANALYTICS: true,
    ENABLE_BARCODE_SCANNING: false,
    ENABLE_PRINTING: false,
  },

  // Performance settings
  PERFORMANCE: {
    CACHE_DURATION: 300000, // 5 minutes
    SYNC_INTERVAL: 30000, // 30 seconds
    BATCH_SIZE: 100,
    TIMEOUT_DURATION: 10000, // 10 seconds
  },
};

// ---------- Database Collections ----------
const COLLECTIONS = {
  SALES: "sales",
  PURCHASES: "purchases",
  INVENTORY: "inventory",
  INGREDIENTS: "ingredients",
  MENUS: "menus",
  RECIPES: "menuRecipes",
  USERS: "users",
  LINE_PURCHASES: "line_purchases",
  AUDIT_LOG: "auditLog",
  SETTINGS: "settings",
};

// ---------- Validation Rules ----------
const VALIDATION_RULES = {
  MENU: {
    NAME_MAX_LENGTH: 100,
    PRICE_MIN: 0,
    PRICE_MAX: 99999,
    DESCRIPTION_MAX_LENGTH: 500,
  },

  INGREDIENT: {
    NAME_MAX_LENGTH: 100,
    MIN_STOCK_MIN: 0,
    MIN_STOCK_MAX: 999999,
    CURRENT_STOCK_MIN: 0,
    CURRENT_STOCK_MAX: 999999,
    UNIT_MAX_LENGTH: 20,
  },

  PURCHASE: {
    AMOUNT_MIN: 0,
    AMOUNT_MAX: 999999,
    VENDOR_NAME_MAX_LENGTH: 100,
    NOTES_MAX_LENGTH: 1000,
  },

  SALE: {
    QUANTITY_MIN: 1,
    QUANTITY_MAX: 999,
    UNIT_PRICE_MIN: 0,
    UNIT_PRICE_MAX: 99999,
  },
};

// ---------- Export Configuration ----------
if (typeof module !== "undefined" && module.exports) {
  // Node.js environment
  module.exports = {
    GOOGLE_SHEETS_CONFIG,
    LINE_BOT_CONFIG,
    FIREBASE_FUNCTIONS_CONFIG,
    APP_CONFIG,
    COLLECTIONS,
    VALIDATION_RULES,
  };
} else {
  // Browser environment
  window.GOOGLE_SHEETS_CONFIG = GOOGLE_SHEETS_CONFIG;
  window.LINE_BOT_CONFIG = LINE_BOT_CONFIG;
  window.FIREBASE_FUNCTIONS_CONFIG = FIREBASE_FUNCTIONS_CONFIG;
  window.APP_CONFIG = APP_CONFIG;
  window.COLLECTIONS = COLLECTIONS;
  window.VALIDATION_RULES = VALIDATION_RULES;
}

// ---------- Development Helper Functions ----------
if (APP_CONFIG.DEBUG_MODE) {
  console.log("🔧 Configuration loaded:");
  console.log("Google Sheets:", GOOGLE_SHEETS_CONFIG);
  console.log("Line Bot:", LINE_BOT_CONFIG);
  console.log("App Config:", APP_CONFIG);

  // Auto-fill demo values in development
  if (GOOGLE_SHEETS_CONFIG.API_KEY === "YOUR_API_KEY_HERE") {
    console.warn("⚠️ Google Sheets API key not configured");
  }

  if (
    LINE_BOT_CONFIG.CHANNEL_ACCESS_TOKEN === "YOUR_LINE_CHANNEL_ACCESS_TOKEN"
  ) {
    console.warn("⚠️ Line Bot access token not configured");
  }
}
