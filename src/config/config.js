/**
 * Central Configuration Module for POS System
 * Consolidates all configuration settings in one place
 */

export const API = {
  BASE_URL: process.env.API_BASE_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

export const CACHE = {
  TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  MEMORY_LIMIT: 50, // Maximum items in memory cache
  STORAGE_PREFIX: 'pos_',
  CLEANUP_INTERVAL: 10 * 60 * 1000 // 10 minutes
};

export const BUSINESS = {
  PLATFORMS: {
    'ร้าน': { fee: 0, name: 'Walk-in' },
    'Line Man': { fee: 0.15, name: 'LineMan' },
    'Food Panda': { fee: 0.18, name: 'FoodPanda' },
    'Grab Food': { fee: 0.20, name: 'Grab' },
    'Shopee Food': { fee: 0.15, name: 'ShopeeFood' }
  },
  DEFAULT_UNITS: {
    STOCK: 'หน่วย',
    BUY: 'หน่วย',
    RATIO: 1
  },
  VALIDATION: {
    MIN_QUANTITY: 0.01,
    MAX_QUANTITY: 999999,
    MIN_PRICE: 0.01,
    MAX_PRICE: 999999
  }
};

export const UI = {
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200
  },
  ANIMATION: {
    DURATION: 300,
    EASING: 'ease-in-out'
  },
  DEBOUNCE_DELAY: 300,
  SEARCH_MIN_LENGTH: 2
};

export const SHEETS = {
  NAMES: {
    SALES: 'Sales',
    PURCHASES: 'Purchases',
    MENUS: 'Menus',
    COGS: 'COGS',
    INGREDIENTS: 'Ingredients',
    MENU_RECIPES: 'MenuRecipes',
    USERS: 'Users',
    COST_CENTERS: 'CostCenters',
    PACKAGING: 'Packaging',
    LOTS: 'Lots',
    PLATFORMS: 'Platforms',
    STOCKS: 'Stocks',
    LABOR: 'LaborLogs',
    WASTE: 'Waste',
    MARKET_RUNS: 'MarketRuns',
    MARKET_RUN_ITEMS: 'MarketRunItems',
    PACKING: 'Packing',
    PACKING_PURCHASES: 'PackingPurchases',
    OVERHEADS: 'Overheads',
    MENU_EXTRAS: 'MenuExtras',
    BATCH_COST_LINES: 'BatchCostLines',
    BATCHES: 'Batches',
    EXPENSES: 'Expenses'
  },
  HEADERS: {
    SALES: ['date', 'platform', 'menu_id', 'qty', 'price_per_unit', 'net_per_unit', 'gross', 'net', 'cogs', 'profit'],
    PURCHASES: ['date', 'ingredient_id', 'qty_buy', 'unit', 'total_price', 'unit_price', 'supplier_note', 'actual_yield', 'lot_id'],
    MENUS: ['id', 'name', 'price', 'category'],
    INGREDIENTS: ['id', 'name', 'stock_unit', 'buy_unit', 'buy_to_stock_ratio', 'min_stock'],
    MENU_RECIPES: ['menu_id', 'ingredient_id', 'qty_per_serve', 'unit']
  }
};

export const ERRORS = {
  NETWORK: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
  TIMEOUT: 'การเชื่อมต่อหมดเวลา',
  VALIDATION: 'ข้อมูลไม่ถูกต้อง',
  PERMISSION: 'ไม่มีสิทธิ์ดำเนินการ',
  NOT_FOUND: 'ไม่พบข้อมูล',
  SERVER_ERROR: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์'
};

export const LOGGING = {
  LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  CURRENT_LEVEL: process.env.NODE_ENV === 'production' ? 1 : 3
};

export const AI_AGENT = {
  COMMANDS: {
    BUY: ['ซื้อ', 'ซื้อเข้า', 'จัดซื้อ'],
    SELL: ['ขาย', 'ขายออก', 'จำหน่าย'],
    UPDATE_STOCK: ['อัปเดตสต็อก', 'ปรับสต็อก', 'แก้ไขสต็อก'],
    LOW_STOCK: ['วัตถุดิบใกล้หมด', 'สต็อกต่ำ', 'เตือนสต็อก'],
    PRICE_SUGGEST: ['แนะนำราคา', 'ราคาแนะนำ', 'ราคาเหมาะสม'],
    SELL_MENU: ['ขายเมนู', 'จำหน่ายเมนู']
  },
  DEFAULT_QUICK_REPLIES: [
    'ซื้อ กุ้ง 1 kg 120 บาท',
    'วัตถุดิบใกล้หมด',
    'อัปเดตวัตถุดิบ น้ำปลา min_stock 5',
    'ขาย กุ้ง 0.5 kg @ 220 บาท ที่ Shopee',
    'แนะนำราคา กุ้ง สำหรับ Shopee',
    'ขายเมนู กะเพราไก่ 2 @ 89 บาท ที่ Grab'
  ]
};

export const PERFORMANCE = {
  BATCH_SIZE: 100,
  PREFETCH_THRESHOLD: 0.8,
  IDLE_TIMEOUT: 5000,
  MAX_CONCURRENT_REQUESTS: 5
};

export default {
  API,
  CACHE,
  BUSINESS,
  UI,
  SHEETS,
  ERRORS,
  LOGGING,
  AI_AGENT,
  PERFORMANCE
};
