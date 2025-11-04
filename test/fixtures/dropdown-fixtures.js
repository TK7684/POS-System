/**
 * Dropdown-specific fixtures for unit tests
 */

const DropdownFixtures = {
  ingredients: [
    { id: 'ing1', name: 'กุ้ง', stock_unit: 'กิโลกรัม', buy_unit: 'กิโลกรัม', buy_to_stock_ratio: 1 },
    { id: 'ing2', name: 'ข้าวสวย', stock_unit: 'จาน', buy_unit: 'กิโลกรัม', buy_to_stock_ratio: 20 },
    { id: 'ing3', name: 'พริกแกง', stock_unit: 'กรัม', buy_unit: 'กิโลกรัม', buy_to_stock_ratio: 1000 }
  ],

  menus: [
    { id: 'm1', name: 'ผัดไทยกุ้ง', price: 80 },
    { id: 'm2', name: 'แกงเขียวหวานไก่', price: 70 }
  ],

  // Map of menuId -> ingredients list
  menuIngredientsByMenu: {
    m1: [
      { ingredient_id: 'ing1', qty_per_serve: 0.15 },
      { ingredient_id: 'ing2', qty_per_serve: 1 }
    ],
    m2: [
      { ingredient_id: 'ing3', qty_per_serve: 30 },
      { ingredient_id: 'ing2', qty_per_serve: 1 }
    ]
  },

  platforms: [
    { id: 'walkin', name: 'Walk-in' },
    { id: 'grab', name: 'Grab' },
    { id: 'lineman', name: 'Line Man' }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DropdownFixtures;
} else if (typeof window !== 'undefined') {
  window.DropdownFixtures = DropdownFixtures;
}


