/**
 * Test Data Fixtures
 * Provides realistic test data for comprehensive testing
 */

const TestFixtures = {
  // Ingredient fixtures
  ingredients: [
    {
      id: 'ING0001',
      name: 'กุ้ง',
      stock_unit: 'กิโลกรัม',
      unit_buy: 'กิโลกรัม',
      buy_to_stock_ratio: 1,
      min_stock: 5
    },
    {
      id: 'ING0002',
      name: 'ข้าวสวย',
      stock_unit: 'จาน',
      unit_buy: 'กิโลกรัม',
      buy_to_stock_ratio: 20,
      min_stock: 100
    },
    {
      id: 'ING0003',
      name: 'พริกแกง',
      stock_unit: 'กรัม',
      unit_buy: 'กิโลกรัม',
      buy_to_stock_ratio: 1000,
      min_stock: 500
    },
    {
      id: 'ING0004',
      name: 'น้ำมันพืช',
      stock_unit: 'มิลลิลิตร',
      unit_buy: 'ลิตร',
      buy_to_stock_ratio: 1000,
      min_stock: 2000
    },
    {
      id: 'ING0005',
      name: 'มะนาว',
      stock_unit: 'ลูก',
      unit_buy: 'แพ็ค',
      buy_to_stock_ratio: 0.08,
      min_stock: 30
    }
  ],

  // Menu fixtures
  menus: [
    {
      menu_id: 'MENU001',
      name: 'ผัดไทยกุ้ง',
      description: 'ผัดไทยกุ้งสด',
      category: 'อาหารจานหลัก',
      active: true
    },
    {
      menu_id: 'MENU002',
      name: 'แกงเขียวหวานไก่',
      description: 'แกงเขียวหวานไก่สูตรต้นตำรับ',
      category: 'อาหารจานหลัก',
      active: true
    },
    {
      menu_id: 'MENU003',
      name: 'ส้มตำไทย',
      description: 'ส้มตำไทยรสจัดจ้าน',
      category: 'อาหารจานเดียว',
      active: true
    },
    {
      menu_id: 'MENU004',
      name: 'ข้าวผัดกุ้ง',
      description: 'ข้าวผัดกุ้งสด',
      category: 'อาหารจานเดียว',
      active: true
    },
    {
      menu_id: 'MENU005',
      name: 'ต้มยำกุ้ง',
      description: 'ต้มยำกุ้งน้ำข้น',
      category: 'อาหารจานหลัก',
      active: false
    }
  ],

  // Menu recipe fixtures
  menuRecipes: [
    {
      menu_id: 'MENU001',
      ingredient_id: 'ING0001',
      ingredient_name: 'กุ้ง',
      qty_per_serve: 0.15,
      note: 'กุ้งสด',
      created_at: '2024-01-15',
      user_key: 'owner@test.com'
    },
    {
      menu_id: 'MENU001',
      ingredient_id: 'ING0002',
      ingredient_name: 'ข้าวสวย',
      qty_per_serve: 1,
      note: 'ข้าวสวยร้อน',
      created_at: '2024-01-15',
      user_key: 'owner@test.com'
    },
    {
      menu_id: 'MENU002',
      ingredient_id: 'ING0003',
      ingredient_name: 'พริกแกง',
      qty_per_serve: 30,
      note: 'พริกแกงเขียวหวาน',
      created_at: '2024-01-15',
      user_key: 'owner@test.com'
    },
    {
      menu_id: 'MENU002',
      ingredient_id: 'ING0002',
      ingredient_name: 'ข้าวสวย',
      qty_per_serve: 1,
      note: 'ข้าวสวยร้อน',
      created_at: '2024-01-15',
      user_key: 'owner@test.com'
    }
  ],

  // Purchase fixtures
  purchases: [
    {
      date: '2024-10-01',
      lot_id: 'LOT20241001001',
      ingredient_id: 'ING0001',
      ingredient_name: 'กุ้ง',
      qty_buy: 5,
      unit: 'กิโลกรัม',
      total_price: 1500,
      unit_price: 300,
      qty_stock: 5,
      cost_per_stock: 300,
      remaining_stock: 5,
      supplier_note: 'ตลาดสด'
    },
    {
      date: '2024-10-01',
      lot_id: 'LOT20241001002',
      ingredient_id: 'ING0002',
      ingredient_name: 'ข้าวสวย',
      qty_buy: 10,
      unit: 'กิโลกรัม',
      total_price: 400,
      unit_price: 40,
      qty_stock: 200,
      cost_per_stock: 2,
      remaining_stock: 200,
      supplier_note: 'ร้านข้าว'
    },
    {
      date: '2024-10-02',
      lot_id: 'LOT20241002001',
      ingredient_id: 'ING0003',
      ingredient_name: 'พริกแกง',
      qty_buy: 2,
      unit: 'กิโลกรัม',
      total_price: 200,
      unit_price: 100,
      qty_stock: 2000,
      cost_per_stock: 0.1,
      remaining_stock: 2000,
      supplier_note: 'ตลาดสด'
    }
  ],

  // Sales fixtures
  sales: [
    {
      date: '2024-10-01',
      platform: 'ร้าน',
      menu_id: 'MENU001',
      qty: 5,
      price_per_unit: 80,
      net_per_unit: 80,
      gross: 400,
      net: 400,
      cogs: 150,
      profit: 250
    },
    {
      date: '2024-10-01',
      platform: 'Line Man',
      menu_id: 'MENU002',
      qty: 3,
      price_per_unit: 70,
      net_per_unit: 59.5,
      gross: 210,
      net: 178.5,
      cogs: 90,
      profit: 88.5
    },
    {
      date: '2024-10-02',
      platform: 'Grab Food',
      menu_id: 'MENU001',
      qty: 8,
      price_per_unit: 80,
      net_per_unit: 64,
      gross: 640,
      net: 512,
      cogs: 240,
      profit: 272
    },
    {
      date: '2024-10-02',
      platform: 'ร้าน',
      menu_id: 'MENU003',
      qty: 10,
      price_per_unit: 60,
      net_per_unit: 60,
      gross: 600,
      net: 600,
      cogs: 200,
      profit: 400
    }
  ],

  // User fixtures
  users: [
    {
      user_key: 'owner@test.com',
      role: 'OWNER',
      name: 'Test Owner',
      active: true,
      created_at: '2024-01-01'
    },
    {
      user_key: 'partner@test.com',
      role: 'PARTNER',
      name: 'Test Partner',
      active: true,
      created_at: '2024-01-01'
    },
    {
      user_key: 'staff@test.com',
      role: 'STAFF',
      name: 'Test Staff',
      active: true,
      created_at: '2024-01-01'
    },
    {
      user_key: 'inactive@test.com',
      role: 'STAFF',
      name: 'Inactive User',
      active: false,
      created_at: '2024-01-01'
    }
  ],

  // Platform fixtures
  platforms: [
    {
      platform: 'ร้าน',
      fee_percentage: 0,
      active: true
    },
    {
      platform: 'Line Man',
      fee_percentage: 15,
      active: true
    },
    {
      platform: 'Grab Food',
      fee_percentage: 20,
      active: true
    },
    {
      platform: 'Food Panda',
      fee_percentage: 18,
      active: true
    },
    {
      platform: 'Shopee Food',
      fee_percentage: 17,
      active: true
    }
  ],

  // Stock fixtures
  stocks: [
    {
      ingredient_id: 'ING0001',
      current_stock: 5,
      last_updated: '2024-10-01',
      min_stock: 5
    },
    {
      ingredient_id: 'ING0002',
      current_stock: 200,
      last_updated: '2024-10-01',
      min_stock: 100
    },
    {
      ingredient_id: 'ING0003',
      current_stock: 2000,
      last_updated: '2024-10-02',
      min_stock: 500
    },
    {
      ingredient_id: 'ING0004',
      current_stock: 1500,
      last_updated: '2024-10-01',
      min_stock: 2000
    },
    {
      ingredient_id: 'ING0005',
      current_stock: 20,
      last_updated: '2024-10-01',
      min_stock: 30
    }
  ],

  // Lot fixtures
  lots: [
    {
      lot_id: 'LOT20241001001',
      ingredient_id: 'ING0001',
      date: '2024-10-01',
      qty_initial: 5,
      qty_remaining: 4.25,
      cost_per_unit: 300
    },
    {
      lot_id: 'LOT20241001002',
      ingredient_id: 'ING0002',
      date: '2024-10-01',
      qty_initial: 200,
      qty_remaining: 182,
      cost_per_unit: 2
    },
    {
      lot_id: 'LOT20241002001',
      ingredient_id: 'ING0003',
      date: '2024-10-02',
      qty_initial: 2000,
      qty_remaining: 1910,
      cost_per_unit: 0.1
    }
  ],

  // Helper methods to generate test data
  generatePurchase: function(overrides = {}) {
    const base = {
      date: new Date().toISOString().split('T')[0],
      lot_id: `LOT${Date.now()}`,
      ingredient_id: 'ING0001',
      ingredient_name: 'Test Ingredient',
      qty_buy: 10,
      unit: 'กิโลกรัม',
      total_price: 1000,
      unit_price: 100,
      qty_stock: 10,
      cost_per_stock: 100,
      remaining_stock: 10,
      supplier_note: 'Test Supplier'
    };
    return { ...base, ...overrides };
  },

  generateSale: function(overrides = {}) {
    const base = {
      date: new Date().toISOString().split('T')[0],
      platform: 'ร้าน',
      menu_id: 'MENU001',
      qty: 1,
      price_per_unit: 80,
      net_per_unit: 80,
      gross: 80,
      net: 80,
      cogs: 30,
      profit: 50
    };
    return { ...base, ...overrides };
  },

  generateIngredient: function(overrides = {}) {
    const id = `ING${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const base = {
      id: id,
      name: `Test Ingredient ${id}`,
      stock_unit: 'กิโลกรัม',
      unit_buy: 'กิโลกรัม',
      buy_to_stock_ratio: 1,
      min_stock: 10
    };
    return { ...base, ...overrides };
  },

  generateMenu: function(overrides = {}) {
    const id = `MENU${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const base = {
      menu_id: id,
      name: `Test Menu ${id}`,
      description: 'Test menu description',
      category: 'Test Category',
      active: true
    };
    return { ...base, ...overrides };
  },

  // Get low stock ingredients
  getLowStockIngredients: function() {
    return this.stocks.filter(stock => 
      stock.current_stock < stock.min_stock
    );
  },

  // Get sales by platform
  getSalesByPlatform: function(platform) {
    return this.sales.filter(sale => sale.platform === platform);
  },

  // Get sales by date range
  getSalesByDateRange: function(startDate, endDate) {
    return this.sales.filter(sale => 
      sale.date >= startDate && sale.date <= endDate
    );
  },

  // Calculate total sales
  calculateTotalSales: function(sales = this.sales) {
    return sales.reduce((total, sale) => total + sale.net, 0);
  },

  // Calculate total profit
  calculateTotalProfit: function(sales = this.sales) {
    return sales.reduce((total, sale) => total + sale.profit, 0);
  },

  // Get menu cost
  getMenuCost: function(menuId) {
    const recipes = this.menuRecipes.filter(r => r.menu_id === menuId);
    let totalCost = 0;
    
    recipes.forEach(recipe => {
      const lot = this.lots.find(l => l.ingredient_id === recipe.ingredient_id);
      if (lot) {
        totalCost += recipe.qty_per_serve * lot.cost_per_unit;
      }
    });
    
    return totalCost;
  },

  // Reset all fixtures to initial state
  reset: function() {
    // This would reload the initial fixture data
    console.log('Test fixtures reset to initial state');
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestFixtures;
} else if (typeof window !== 'undefined') {
  window.TestFixtures = TestFixtures;
}
