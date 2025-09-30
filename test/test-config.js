/**
 * Test Configuration for POS System
 * Centralized configuration for all testing frameworks
 */

const TestConfig = {
  // Test environment settings
  environment: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    timeout: 10000,
    retries: 3
  },

  // Performance thresholds
  performance: {
    initialLoad: 2000,        // 2 seconds on 3G
    dataOperations: 500,      // 500ms for save/search/calculate
    cacheAccess: 50,          // Instant cache access
    navigationTransition: 100, // Instant transitions
    renderTime: 16.67,        // 60fps = 16.67ms per frame
    memoryLimit: 50 * 1024 * 1024 // 50MB memory limit
  },

  // Device profiles for cross-device testing
  devices: [
    {
      name: 'Mobile Low-end',
      viewport: { width: 360, height: 640 },
      userAgent: 'Mozilla/5.0 (Linux; Android 8.0; SM-G960F) AppleWebKit/537.36',
      connection: '3g',
      memory: 2048,
      cpu: 2
    },
    {
      name: 'Mobile High-end',
      viewport: { width: 414, height: 896 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      connection: '4g',
      memory: 4096,
      cpu: 4
    },
    {
      name: 'Tablet',
      viewport: { width: 768, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      connection: 'wifi',
      memory: 8192,
      cpu: 6
    },
    {
      name: 'Desktop',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      connection: 'wifi',
      memory: 16384,
      cpu: 8
    }
  ],

  // Test scenarios for user workflows
  scenarios: [
    {
      name: 'add_purchase',
      description: 'Add a new purchase transaction',
      maxSteps: 3,
      expectedTime: 5000,
      requirements: ['1.1', '1.3', '5.1', '5.2']
    },
    {
      name: 'record_sale',
      description: 'Record a new sale transaction',
      maxSteps: 3,
      expectedTime: 4000,
      requirements: ['1.1', '1.3', '4.1', '4.2']
    },
    {
      name: 'search_ingredients',
      description: 'Search for ingredients',
      maxSteps: 2,
      expectedTime: 2000,
      requirements: ['9.1', '9.2', '9.4']
    },
    {
      name: 'generate_report',
      description: 'Generate sales report',
      maxSteps: 4,
      expectedTime: 8000,
      requirements: ['7.1', '7.2', '7.6']
    },
    {
      name: 'navigate_screens',
      description: 'Navigate between different screens',
      maxSteps: 5,
      expectedTime: 3000,
      requirements: ['1.1', '3.2', '3.5']
    },
    {
      name: 'offline_sync',
      description: 'Work offline and sync data',
      maxSteps: 6,
      expectedTime: 10000,
      requirements: ['8.1', '8.2', '8.4']
    }
  ],

  // Accessibility testing configuration
  accessibility: {
    standards: 'WCAG21AA',
    rules: {
      'color-contrast': { level: 'AA' },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true },
      'screen-reader': { enabled: true },
      'touch-targets': { minSize: 44 }
    },
    excludeSelectors: ['.test-element', '[data-test]']
  },

  // Visual regression testing
  visualRegression: {
    threshold: 0.2,
    screenshotDir: 'test/screenshots',
    baselineDir: 'test/baselines',
    diffDir: 'test/diffs',
    viewports: [
      { width: 360, height: 640, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ]
  },

  // Test data
  testData: {
    ingredients: [
      { id: 'test-001', name: 'กุ้ง', stockUnit: 'กิโลกรัม', buyUnit: 'กิโลกรัม', ratio: 1, minStock: 5 },
      { id: 'test-002', name: 'ข้าวสวย', stockUnit: 'จาน', buyUnit: 'กิโลกรัม', ratio: 20, minStock: 10 },
      { id: 'test-003', name: 'พริกแกง', stockUnit: 'กรัม', buyUnit: 'กิโลกรัม', ratio: 1000, minStock: 500 }
    ],
    menus: [
      { id: 'menu-001', name: 'ผัดไทยกุ้ง', price: 80, ingredients: ['test-001', 'test-002'] },
      { id: 'menu-002', name: 'แกงเขียวหวานไก่', price: 70, ingredients: ['test-003', 'test-002'] }
    ],
    transactions: [
      { id: 'txn-001', type: 'sale', amount: 80, items: [{ menuId: 'menu-001', quantity: 1 }] },
      { id: 'txn-002', type: 'purchase', amount: 200, items: [{ ingredientId: 'test-001', quantity: 2 }] }
    ]
  },

  // Mock API responses
  mockResponses: {
    getAllIngredients: () => TestConfig.testData.ingredients,
    getAllMenus: () => TestConfig.testData.menus,
    getRecentTransactions: (limit = 10) => TestConfig.testData.transactions.slice(0, limit),
    searchIngredients: (query) => TestConfig.testData.ingredients.filter(i => 
      i.name.toLowerCase().includes(query.toLowerCase())
    )
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestConfig;
} else if (typeof window !== 'undefined') {
  window.TestConfig = TestConfig;
}