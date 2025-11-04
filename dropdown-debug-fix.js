/**
 * Dropdown Debug and Fix Script
 * Add this to your Index.html to debug and fix dropdown issues
 */

// Debug function to check dropdown status
function debugDropdownStatus() {
  console.log('=== DROPDOWN DEBUG STATUS ===');
  
  // Check if DropdownManager exists
  console.log('1. DropdownManager available:', !!window.dropdownManager);
  
  // Check if CacheManager exists
  console.log('2. CacheManager available:', !!window.cacheManager);
  
  // Check if Google Apps Script is available
  console.log('3. Google Apps Script available:', !!(typeof google !== 'undefined' && google.script && google.script.run));
  
  // Check dropdown elements
  const dropdowns = {
    'Purchase - Ingredient': document.getElementById('p_ing'),
    'Purchase - Unit': document.getElementById('p_unit'),
    'Sale - Menu': document.getElementById('s_menu'),
    'Sale - Platform': document.getElementById('s_platform'),
    'Menu - Menu': document.getElementById('m_menu'),
    'Menu - Ingredient': document.getElementById('m_ingredient')
  };
  
  console.log('4. Dropdown elements:');
  Object.entries(dropdowns).forEach(([name, element]) => {
    console.log(`   ${name}:`, !!element, element ? `(${element.options.length} options)` : '');
  });
  
  // Check module instances
  console.log('5. Module instances:');
  console.log('   PurchaseModule:', !!window.purchaseInstance);
  console.log('   SaleModule:', !!window.saleInstance);
  console.log('   MenuModule:', !!window.menuInstance);
  
  // Test backend connection
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    console.log('6. Testing backend connection...');
    google.script.run
      .withSuccessHandler(result => {
        console.log('   Backend test successful:', result);
      })
      .withFailureHandler(error => {
        console.error('   Backend test failed:', error);
      })
      .testDropdownFunctions();
  } else {
    console.log('6. Backend connection: NOT AVAILABLE');
  }
  
  console.log('=== END DEBUG STATUS ===');
}

// Force initialize dropdowns
async function forceInitializeDropdowns() {
  console.log('🔧 Force initializing dropdowns...');
  
  try {
    // Ensure CacheManager exists
    if (!window.cacheManager) {
      console.log('Creating CacheManager...');
      if (typeof CacheManager !== 'undefined') {
        window.cacheManager = new CacheManager();
      } else {
        console.error('CacheManager class not found!');
        return;
      }
    }
    
    // Ensure DropdownManager exists
    if (!window.dropdownManager) {
      console.log('Creating DropdownManager...');
      if (typeof DropdownManager !== 'undefined') {
        window.dropdownManager = new DropdownManager(window.cacheManager);
      } else {
        console.error('DropdownManager class not found!');
        return;
      }
    }
    
    // Initialize dropdowns for current screen
    const activeScreen = document.querySelector('[id$="-screen"]:not(.hide)');
    if (!activeScreen) {
      console.log('No active screen found');
      return;
    }
    
    const screenName = activeScreen.id.replace('-screen', '');
    console.log(`Initializing dropdowns for ${screenName} screen...`);
    
    switch (screenName) {
      case 'purchase':
        await initializePurchaseDropdowns();
        break;
      case 'sale':
        await initializeSaleDropdowns();
        break;
      case 'menu':
        await initializeMenuDropdowns();
        break;
      default:
        console.log(`No dropdown initialization needed for ${screenName} screen`);
    }
    
    console.log('✅ Dropdown initialization completed');
    
  } catch (error) {
    console.error('❌ Failed to initialize dropdowns:', error);
  }
}

// Initialize Purchase screen dropdowns
async function initializePurchaseDropdowns() {
  const ingredientSelect = document.getElementById('p_ing');
  
  if (!ingredientSelect) {
    console.error('Purchase ingredient dropdown not found');
    return;
  }
  
  try {
    // Populate ingredient dropdown
    await window.dropdownManager.populateIngredients(ingredientSelect, {
      includePlaceholder: true,
      forceRefresh: true
    });
    
    // Set up ingredient change handler
    window.dropdownManager.onIngredientChange(ingredientSelect, (ingredientData) => {
      handlePurchaseIngredientChange(ingredientData);
    });
    
    console.log('✅ Purchase dropdowns initialized');
  } catch (error) {
    console.error('❌ Failed to initialize purchase dropdowns:', error);
  }
}

// Initialize Sale screen dropdowns
async function initializeSaleDropdowns() {
  const menuSelect = document.getElementById('s_menu');
  const platformSelect = document.getElementById('s_platform');
  
  if (!menuSelect || !platformSelect) {
    console.error('Sale dropdowns not found');
    return;
  }
  
  try {
    // Populate menu dropdown
    await window.dropdownManager.populateMenus(menuSelect, {
      includePlaceholder: true,
      forceRefresh: true
    });
    
    // Populate platform dropdown
    await window.dropdownManager.populatePlatforms(platformSelect);
    
    // Set up menu change handler
    window.dropdownManager.onMenuChange(menuSelect, (menuData) => {
      handleSaleMenuChange(menuData);
    });
    
    console.log('✅ Sale dropdowns initialized');
  } catch (error) {
    console.error('❌ Failed to initialize sale dropdowns:', error);
  }
}

// Initialize Menu screen dropdowns
async function initializeMenuDropdowns() {
  const menuSelect = document.getElementById('m_menu');
  const ingredientSelect = document.getElementById('m_ingredient');
  
  if (!menuSelect || !ingredientSelect) {
    console.error('Menu dropdowns not found');
    return;
  }
  
  try {
    // Populate menu dropdown
    await window.dropdownManager.populateMenus(menuSelect, {
      includePlaceholder: true,
      forceRefresh: true
    });
    
    // Populate ingredient dropdown
    await window.dropdownManager.populateIngredients(ingredientSelect, {
      includePlaceholder: true,
      forceRefresh: true
    });
    
    // Set up change handlers
    window.dropdownManager.onMenuChange(menuSelect, (menuData) => {
      handleMenuMenuChange(menuData);
    });
    
    window.dropdownManager.onIngredientChange(ingredientSelect, (ingredientData) => {
      handleMenuIngredientChange(ingredientData);
    });
    
    console.log('✅ Menu dropdowns initialized');
  } catch (error) {
    console.error('❌ Failed to initialize menu dropdowns:', error);
  }
}

// Handle ingredient change in Purchase screen
function handlePurchaseIngredientChange(ingredientData) {
  const unitSelect = document.getElementById('p_unit');
  if (!unitSelect) return;
  
  // Clear existing options
  unitSelect.innerHTML = '';
  
  // Add placeholder
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'เลือก...';
  unitSelect.appendChild(placeholderOption);
  
  // Add buy_unit as primary option
  if (ingredientData.buy_unit) {
    const buyUnitOption = document.createElement('option');
    buyUnitOption.value = ingredientData.buy_unit;
    buyUnitOption.textContent = ingredientData.buy_unit;
    buyUnitOption.selected = true;
    unitSelect.appendChild(buyUnitOption);
  }
  
  // Add stock_unit as alternative
  if (ingredientData.stock_unit && ingredientData.stock_unit !== ingredientData.buy_unit) {
    const stockUnitOption = document.createElement('option');
    stockUnitOption.value = ingredientData.stock_unit;
    stockUnitOption.textContent = ingredientData.stock_unit;
    unitSelect.appendChild(stockUnitOption);
  }
  
  console.log(`✅ Unit auto-populated for ingredient: ${ingredientData.name}`);
}

// Handle menu change in Sale screen
function handleSaleMenuChange(menuData) {
  const priceInput = document.getElementById('s_price');
  if (!priceInput) return;
  
  // Auto-populate price if available and field is empty
  if (menuData.price && !priceInput.value) {
    priceInput.value = menuData.price;
  }
  
  console.log(`✅ Price auto-populated for menu: ${menuData.name} (${menuData.price} บาท)`);
}

// Handle menu change in Menu screen
async function handleMenuMenuChange(menuData) {
  try {
    const menuIngredients = await window.dropdownManager.getMenuIngredients(menuData.id);
    
    // Display menu ingredients (you can customize this based on your UI)
    const contentDiv = document.getElementById('menu-ingredients-content');
    if (contentDiv) {
      if (menuIngredients.length > 0) {
        const html = menuIngredients.map(ing => 
          `<div class="ingredient-item">
            <strong>${ing.ingredient_name}</strong>: ${ing.quantity} ${ing.unit}
          </div>`
        ).join('');
        contentDiv.innerHTML = html;
      } else {
        contentDiv.innerHTML = '<div class="muted">ไม่มีส่วนผสมในเมนูนี้</div>';
      }
    }
    
    console.log(`✅ Menu ingredients loaded for: ${menuData.name}`);
  } catch (error) {
    console.error('Failed to load menu ingredients:', error);
  }
}

// Handle ingredient change in Menu screen
function handleMenuIngredientChange(ingredientData) {
  const unitInput = document.getElementById('m_unit');
  if (!unitInput) return;
  
  // Auto-populate unit field with stock_unit
  if (ingredientData.stock_unit) {
    unitInput.value = ingredientData.stock_unit;
  }
  
  console.log(`✅ Unit auto-populated for ingredient: ${ingredientData.name}`);
}

// Test individual dropdown functions
async function testDropdownFunctions() {
  console.log('🧪 Testing dropdown functions...');
  
  if (!window.dropdownManager) {
    console.error('DropdownManager not available');
    return;
  }
  
  try {
    // Test getIngredients
    console.log('Testing getIngredients...');
    const ingredients = await window.dropdownManager.getIngredients();
    console.log(`✅ Got ${ingredients.length} ingredients:`, ingredients.slice(0, 3));
    
    // Test getMenus
    console.log('Testing getMenus...');
    const menus = await window.dropdownManager.getMenus();
    console.log(`✅ Got ${menus.length} menus:`, menus.slice(0, 3));
    
    // Test getPlatforms
    console.log('Testing getPlatforms...');
    const platforms = await window.dropdownManager.getPlatforms();
    console.log(`✅ Got ${platforms.length} platforms:`, platforms);
    
    // Test getMenuIngredients (if menus exist)
    if (menus.length > 0) {
      console.log(`Testing getMenuIngredients for ${menus[0].id}...`);
      const menuIngredients = await window.dropdownManager.getMenuIngredients(menus[0].id);
      console.log(`✅ Got ${menuIngredients.length} menu ingredients:`, menuIngredients);
    }
    
    console.log('✅ All dropdown function tests completed');
    
  } catch (error) {
    console.error('❌ Dropdown function test failed:', error);
  }
}

// Quick fix function to run when dropdowns aren't working
async function quickFixDropdowns() {
  console.log('🚀 Running quick dropdown fix...');
  
  // Step 1: Debug current status
  debugDropdownStatus();
  
  // Step 2: Force initialize dropdowns
  await forceInitializeDropdowns();
  
  // Step 3: Test dropdown functions
  await testDropdownFunctions();
  
  // Step 4: Show success message
  if (window.POS && window.POS.critical && window.POS.critical.toast) {
    window.POS.critical.toast('🔧 Dropdown fix completed - check console for details');
  }
  
  console.log('✅ Quick dropdown fix completed');
}

// Auto-run fix when this script loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for other scripts to load
  setTimeout(() => {
    console.log('🔍 Auto-checking dropdown status...');
    debugDropdownStatus();
    
    // If dropdowns aren't working, offer to fix them
    if (!window.dropdownManager) {
      console.log('⚠️ DropdownManager not found - run quickFixDropdowns() to fix');
    }
  }, 2000);
});

// Make functions available globally for manual debugging
window.debugDropdownStatus = debugDropdownStatus;
window.forceInitializeDropdowns = forceInitializeDropdowns;
window.testDropdownFunctions = testDropdownFunctions;
window.quickFixDropdowns = quickFixDropdowns;