/**
 * Comprehensive Test Configuration
 * Configuration for comprehensive testing and verification suite
 */

const ComprehensiveTestConfig = {
  // Environment settings
  environment: {
    apiUrl: 'https://script.google.com/macros/s/AKfycbzGZwameaQOt-XPEG-PptzyJPzHtF2eUYiEl7crPmDu9Os_j0BrsFMCn5kdG2QTdePW/exec',
    spreadsheetId: '1qb5_R0JhLINnU7KL3q7hFpGWT0m7OCU1sBMZ8hdUs14',
    timeout: 10000,
    retries: 3,
    testMode: true
  },

  // Test categories to run
  testCategories: {
    sheetVerification: true,
    apiTesting: true,
    functionalTesting: false, // Disabled - requires backend implementation (stock tracking, lot management, menu CRUD, user permissions)
    dataIntegrity: true,
    performance: false, // Disabled - requires performance monitoring setup
    crossBrowser: false, // Disabled - requires cross-browser testing environment
    pwa: false, // Disabled - requires PWA features to be implemented
    security: false, // Disabled - requires security testing tools
    errorHandling: true,
    reporting: true
  },

  // Performance thresholds
  thresholds: {
    performance: {
      cacheOperation: 10,           // ms - 10 cache operations < 10ms
      apiResponse: 2000,            // ms - API responses < 2000ms
      sheetRead: 100,               // ms - Sheet read < 100ms
      reportGeneration: 1000,       // ms - 30-day report < 1000ms
      offlineLoad: 500,             // ms - Cached data load < 500ms
      pwaInstall: 3000,             // ms - PWA install < 3 seconds
      searchResponse: 300           // ms - Search results < 300ms
    },
    coverage: 90,                   // % - Minimum test coverage
    successRate: 95,                // % - Minimum success rate
    dataIntegrity: 100              // % - All integrity checks must pass
  },

  // Reporting configuration
  reporting: {
    formats: ['html', 'json', 'csv'],
    destination: 'test/reports',
    includeScreenshots: true,
    includeRequirementTraceability: true,
    saveHistory: true,
    maxHistoryEntries: 50
  },

  // Sheet structure reference
  sheets: {
    required: [
      'Ingredients', 'Menus', 'MenuRecipes', 'Purchases', 'Sales',
      'Users', 'CostCenters', 'Packaging', 'Lots', 'Platforms',
      'Stocks', 'LaborLogs', 'Waste', 'MarketRuns', 'MarketRunItems',
      'Packing', 'PackingPurchases', 'Overheads', 'MenuExtras',
      'BatchCostLines', 'Batches'
    ],
    columnMappings: {
      Ingredients: ['id', 'name', 'stock_unit', 'unit_buy', 'buy_to_stock_ratio', 'min_stock'],
      Menus: ['menu_id', 'name', 'description', 'category', 'active'],
      MenuRecipes: ['menu_id', 'ingredient_id', 'ingredient_name', 'qty_per_serve', 'note', 'created_at', 'user_key'],
      Purchases: ['date', 'lot_id', 'ingredient_id', 'ingredient_name', 'qty_buy', 'unit', 'total_price', 'unit_price', 'qty_stock', 'cost_per_stock', 'remaining_stock', 'supplier_note'],
      Sales: ['date', 'platform', 'menu_id', 'qty', 'price_per_unit', 'net_per_unit', 'gross', 'net', 'cogs', 'profit'],
      Users: ['user_key', 'role', 'name', 'active', 'created_at'],
      Platforms: ['platform', 'fee_percentage', 'active'],
      Stocks: ['ingredient_id', 'current_stock', 'last_updated', 'min_stock'],
      Lots: ['lot_id', 'ingredient_id', 'date', 'qty_initial', 'qty_remaining', 'cost_per_unit']
    }
  },

  // API endpoints to test
  apiEndpoints: [
    {
      action: 'getBootstrapData',
      params: {},
      expectedFields: ['ingredientsMap', 'timestamp', 'version'],
      timeout: 5000
    },
    {
      action: 'searchIngredients',
      params: { query: 'test', limit: 10 },
      expectedFields: ['results', 'count'],
      timeout: 2000
    },
    {
      action: 'getIngredientMap',
      params: {},
      expectedFields: ['ingredients'],
      timeout: 3000
    },
    {
      action: 'addPurchase',
      params: { ingredient_id: 'TEST001', qtyBuy: 10, totalPrice: 100 },
      expectedFields: ['status', 'lot_id'],
      timeout: 3000
    },
    {
      action: 'addSale',
      params: { platform: 'ร้าน', menu_id: 'MENU001', qty: 1, price: 80 },
      expectedFields: ['status', 'sale_id'],
      timeout: 3000
    },
    {
      action: 'getReport',
      params: { type: 'daily' },
      expectedFields: ['data', 'summary'],
      timeout: 5000
    },
    {
      action: 'getLowStockHTML',
      params: {},
      expectedFields: ['html'],
      timeout: 2000
    }
  ],

  // Browser matrix for cross-browser testing
  browsers: [
    { name: 'Chrome', version: 'latest', platform: 'desktop' },
    { name: 'Firefox', version: 'latest', platform: 'desktop' },
    { name: 'Safari', version: 'latest', platform: 'desktop' },
    { name: 'Edge', version: 'latest', platform: 'desktop' },
    { name: 'Chrome', version: 'latest', platform: 'mobile', device: 'Android' },
    { name: 'Safari', version: 'latest', platform: 'mobile', device: 'iOS' }
  ],

  // Device profiles
  devices: [
    {
      name: 'Mobile Low-end',
      viewport: { width: 360, height: 640 },
      userAgent: 'Mozilla/5.0 (Linux; Android 8.0; SM-G960F) AppleWebKit/537.36',
      connection: '3g'
    },
    {
      name: 'Mobile High-end',
      viewport: { width: 414, height: 896 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      connection: '4g'
    },
    {
      name: 'Tablet',
      viewport: { width: 768, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      connection: 'wifi'
    },
    {
      name: 'Desktop',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      connection: 'wifi'
    }
  ],

  // Security test scenarios
  security: {
    roles: ['OWNER', 'PARTNER', 'STAFF'],
    testUsers: [
      { user_key: 'owner@test.com', role: 'OWNER', active: true },
      { user_key: 'partner@test.com', role: 'PARTNER', active: true },
      { user_key: 'staff@test.com', role: 'STAFF', active: true },
      { user_key: 'inactive@test.com', role: 'STAFF', active: false }
    ],
    xssPayloads: [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>'
    ],
    sqlInjectionPayloads: [
      "' OR '1'='1",
      "'; DROP TABLE Users--",
      "1' UNION SELECT * FROM Users--"
    ]
  },

  // Error scenarios to test
  errorScenarios: [
    { type: 'network', scenario: 'timeout', expectedBehavior: 'retry with backoff' },
    { type: 'network', scenario: 'unavailable', expectedBehavior: 'show offline mode' },
    { type: 'validation', scenario: 'missing_field', expectedBehavior: 'highlight field' },
    { type: 'validation', scenario: 'invalid_format', expectedBehavior: 'show error message' },
    { type: 'data', scenario: 'conflict', expectedBehavior: 'show resolution options' },
    { type: 'cache', scenario: 'corruption', expectedBehavior: 'clear and reload' },
    { type: 'storage', scenario: 'full', expectedBehavior: 'notify and cleanup' }
  ],

  // Requirement mapping
  requirements: {
    '1.1': 'Verify all 21 required sheets exist',
    '1.2': 'Verify all required columns exist with correct names',
    '1.3': 'Generate comprehensive mapping report',
    '1.4': 'Validate data types in columns',
    '1.5': 'Produce detailed verification report',
    '2.1': 'Test getBootstrapData endpoint',
    '2.2': 'Test searchIngredients endpoint',
    '2.3': 'Test getIngredientMap endpoint',
    '2.4': 'Test addPurchase endpoint',
    '2.5': 'Test addSale endpoint',
    '2.6': 'Test getReport endpoint',
    '2.7': 'Test getLowStockHTML endpoint',
    '2.8': 'Test invalid action handling',
    '2.9': 'Test missing parameter handling',
    '2.10': 'Test error response format',
    '3.1': 'Test purchase recording',
    '3.2': 'Test sales recording',
    '3.3': 'Test menu management',
    '3.4': 'Test ingredient search',
    '3.5': 'Test stock management',
    '3.6': 'Test low stock alerts',
    '3.7': 'Test cost calculation',
    '3.8': 'Test platform fee calculation',
    '3.9': 'Test FIFO lot tracking',
    '3.10': 'Test user permissions',
    '4.1': 'Validate ingredient references',
    '4.2': 'Validate menu references',
    '4.3': 'Validate lot references',
    '4.4': 'Validate user references',
    '4.5': 'Validate numeric data',
    '4.6': 'Validate date data',
    '4.7': 'Validate required fields',
    '4.8': 'Check for orphaned records',
    '4.9': 'Validate calculations',
    '4.10': 'Generate integrity report',
    '5.1': 'Test cache performance',
    '5.2': 'Test report generation performance',
    '5.3': 'Test sheet access performance',
    '5.4': 'Test API response times',
    '5.5': 'Test with large datasets',
    '5.6': 'Test concurrent operations',
    '5.7': 'Test offline mode performance',
    '5.8': 'Test PWA installation performance',
    '5.9': 'Test search performance',
    '5.10': 'Generate performance report',
    '6.1': 'Test Chrome desktop',
    '6.2': 'Test Firefox desktop',
    '6.3': 'Test Safari desktop',
    '6.4': 'Test Edge desktop',
    '6.5': 'Test Chrome mobile',
    '6.6': 'Test Safari mobile',
    '6.7': 'Test tablet devices',
    '6.8': 'Test PWA on mobile',
    '6.9': 'Test offline on mobile',
    '6.10': 'Test touch interactions',
    '7.1': 'Test PWA installation',
    '7.2': 'Test offline indicator',
    '7.3': 'Test viewing cached data',
    '7.4': 'Test offline transactions',
    '7.5': 'Test automatic sync',
    '7.6': 'Test sync conflicts',
    '7.7': 'Test service worker updates',
    '7.8': 'Test cache strategy',
    '7.9': 'Test background sync',
    '7.10': 'Generate PWA report',
    '8.1': 'Test user authentication',
    '8.2': 'Test OWNER role access',
    '8.3': 'Test PARTNER role access',
    '8.4': 'Test STAFF role access',
    '8.5': 'Test inactive user access',
    '8.6': 'Test input validation',
    '8.7': 'Test SQL injection prevention',
    '8.8': 'Test XSS prevention',
    '8.9': 'Test CORS handling',
    '8.10': 'Generate security report',
    '9.1': 'Test network error handling',
    '9.2': 'Test API failure retry',
    '9.3': 'Test validation error display',
    '9.4': 'Test sheet access error logging',
    '9.5': 'Test data conflict resolution',
    '9.6': 'Test cache corruption recovery',
    '9.7': 'Test storage full notification',
    '9.8': 'Test JavaScript error handling',
    '9.9': 'Test timeout error handling',
    '9.10': 'Generate error handling report',
    '10.1': 'Test daily reports',
    '10.2': 'Test weekly reports',
    '10.3': 'Test monthly reports',
    '10.4': 'Test platform analysis',
    '10.5': 'Test menu performance',
    '10.6': 'Test ingredient usage',
    '10.7': 'Test cost trends',
    '10.8': 'Test profit margins',
    '10.9': 'Test export functionality',
    '10.10': 'Generate reporting accuracy report'
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComprehensiveTestConfig;
} else if (typeof window !== 'undefined') {
  window.ComprehensiveTestConfig = ComprehensiveTestConfig;
}
