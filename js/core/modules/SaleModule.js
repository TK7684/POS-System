/**
 * Sale Module - Lazy loaded for sale screen functionality
 * Contains sale-specific logic and form handling
 */

class SaleModule {
  constructor(dropdownManager = null) {
    this.dropdownManager = dropdownManager;
    this.initialized = false;
    this.recentMenus = new Set();
    this.platformPreferences = new Map();
    this.quickQuantities = [1, 2, 3, 5, 10];
  }

  /**
   * Initialize sale module
   */
  async init() {
    if (this.initialized) return;
    
    try {
      // Initialize dropdowns if dropdownManager is available
      if (this.dropdownManager) {
        await this.initializeDropdowns();
      }
      
      this.setupEventListeners();
      this.loadRecentData();
      this.setupSmartSuggestions();
      this.setupQuickActions();
      this.initialized = true;
      
      console.log('Sale module initialized');
    } catch (error) {
      console.error('Failed to initialize Sale module:', error);
      this.showInitializationError();
    }
  }

  /**
   * Initialize dropdowns on Sale screen
   */
  async initializeDropdowns() {
    try {
      const menuSelect = document.getElementById('s_menu');
      const platformSelect = document.getElementById('s_platform');
      
      if (!menuSelect || !platformSelect) {
        console.warn('Menu or Platform dropdown not found on Sale screen');
        return;
      }
      
      // Populate menu dropdown
      await this.dropdownManager.populateMenus(menuSelect, {
        includePlaceholder: true,
        forceRefresh: false
      });
      
      // Populate platform dropdown
      await this.dropdownManager.populatePlatforms(platformSelect);
      
      // Set up menu change handler for auto-populating price
      this.dropdownManager.onMenuChange(menuSelect, (menuData) => {
        this.handleMenuChange(menuData);
      });
      
      console.log('Sale screen dropdowns initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sale screen dropdowns:', error);
      this.showDropdownError('ไม่สามารถโหลดข้อมูลเมนูและแพลตฟอร์มได้ กรุณาลองใหม่อีกครั้ง');
      throw error;
    }
  }

  /**
   * Handle menu selection change - auto-populate price field
   */
  handleMenuChange(menuData) {
    try {
      const priceInput = document.getElementById('s_price');
      
      if (!priceInput) {
        console.warn('Price input not found');
        return;
      }
      
      // Auto-populate price if available and field is empty
      if (menuData.price && !priceInput.value) {
        priceInput.value = menuData.price;
      }
      
      // Add to recent menus for smart suggestions
      this.recentMenus.add(menuData.id);
      this.saveRecentData();
      
      console.log(`Price auto-populated for menu: ${menuData.name} (${menuData.price} บาท)`);
    } catch (error) {
      console.error('Error handling menu change:', error);
      this.showDropdownError('เกิดข้อผิดพลาดในการเลือกเมนู');
    }
  }

  /**
   * Show initialization error message
   */
  showInitializationError() {
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast('⚠️ ไม่สามารถเริ่มต้นหน้าจอการขายได้ กรุณาลองใหม่อีกครั้ง');
    }
  }

  /**
   * Show dropdown error message
   */
  showDropdownError(message) {
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast(`❌ ${message}`);
    }
  }

  /**
   * Setup event listeners for sale form
   */
  setupEventListeners() {
    const form = document.getElementById('sale-screen');
    if (!form) return;

    // Platform selection
    const platformSelect = document.getElementById('s_platform');
    if (platformSelect) {
      platformSelect.addEventListener('change', this.onPlatformChange.bind(this));
    }

    // Menu selection
    const menuSelect = document.getElementById('s_menu');
    if (menuSelect) {
      menuSelect.addEventListener('change', this.onMenuChange.bind(this));
    }

    // Form submission
    const submitBtn = form.querySelector('.btn.brand');
    if (submitBtn) {
      submitBtn.addEventListener('click', this.onAddSale.bind(this));
    }
  }

  /**
   * Handle platform selection change
   */
  onPlatformChange(event) {
    const platform = event.target.value;
    if (!platform) return;

    // Load suggested price for this platform
    this.loadPlatformSuggestions(platform);
  }

  /**
   * Handle menu selection change (legacy event handler)
   * Note: This is kept for backward compatibility with existing code
   */
  onMenuChange(event) {
    const menuId = event.target.value;
    if (!menuId) return;

    // Add to recent menus
    this.recentMenus.add(menuId);
    this.saveRecentData();

    // Load suggested price
    this.loadMenuSuggestions(menuId);
  }

  /**
   * Load platform-specific suggestions
   */
  loadPlatformSuggestions(platform) {
    const preferences = this.platformPreferences.get(platform);
    if (preferences) {
      // Auto-suggest common menu for this platform
      const menuSelect = document.getElementById('s_menu');
      if (menuSelect && preferences.commonMenu && !menuSelect.value) {
        menuSelect.value = preferences.commonMenu;
        this.onMenuChange({ target: menuSelect });
      }
    }
  }

  /**
   * Load menu-specific suggestions
   */
  loadMenuSuggestions(menuId) {
    // This would typically load from cache or API
    // For now, we'll use a simple price suggestion system
    const priceInput = document.getElementById('s_price');
    if (priceInput && !priceInput.value) {
      // Simple price suggestion based on menu ID
      const suggestedPrices = {
        'กุ้งแซ่บ': 120,
        'กุ้งทอด': 100,
        'ส้มตำ': 80,
        'ลาบ': 90
      };
      
      const suggested = suggestedPrices[menuId];
      if (suggested) {
        priceInput.value = suggested;
      }
    }
  }

  /**
   * Setup quick action buttons
   */
  setupQuickActions() {
    const qtyInput = document.getElementById('s_qty');
    if (!qtyInput) return;

    // Create quick quantity buttons
    const quickBtns = document.createElement('div');
    quickBtns.className = 'quick-qty-btns';
    quickBtns.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    `;

    this.quickQuantities.forEach(qty => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.style.cssText = `
        min-height: 36px;
        padding: 8px 12px;
        font-size: 14px;
        flex: 0 0 auto;
      `;
      btn.textContent = qty;
      btn.addEventListener('click', () => {
        qtyInput.value = qty;
        btn.style.background = 'var(--brand)';
        btn.style.color = 'white';
        setTimeout(() => {
          btn.style.background = '';
          btn.style.color = '';
        }, 200);
      });
      quickBtns.appendChild(btn);
    });

    // Insert after quantity input
    qtyInput.parentNode.appendChild(quickBtns);
  }

  /**
   * Handle sale form submission
   */
  async onAddSale() {
    const payload = this.collectFormData();
    
    if (!this.validateSaleData(payload)) {
      return;
    }

    // Save preferences
    this.savePlatformPreference(payload.platform, payload.menu_id);
    this.saveRecentData();

    try {
      window.POS.critical.loading(true);
      
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        await new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler(res => {
              window.POS.critical.loading(false);
              window.POS.critical.toast(`✅ บันทึกการขายแล้ว: ${payload.menu_id} x${payload.qty}`);
              this.resetForm();
              resolve(res);
            })
            .withFailureHandler(err => {
              window.POS.critical.loading(false);
              window.POS.critical.toast(`❌ ${err.message || 'เกิดข้อผิดพลาด'}`);
              reject(err);
            })
            .addSale(payload);
        });
      } else {
        window.POS.critical.loading(false);
        window.POS.critical.toast('❌ ไม่สามารถเชื่อมต่อกับ Google Sheets ได้');
      }
    } catch (error) {
      window.POS.critical.loading(false);
      console.error('Sale submission failed:', error);
    }
  }

  /**
   * Collect form data
   */
  collectFormData() {
    return {
      date: document.getElementById('s_date')?.value || null,
      platform: document.getElementById('s_platform')?.value,
      menu_id: document.getElementById('s_menu')?.value,
      qty: Number(document.getElementById('s_qty')?.value || 0),
      price: Number(document.getElementById('s_price')?.value || 0)
    };
  }

  /**
   * Validate sale data
   */
  validateSaleData(payload) {
    if (!payload.platform) {
      window.POS.critical.toast('กรุณาเลือกแพลตฟอร์ม');
      return false;
    }
    if (!payload.menu_id) {
      window.POS.critical.toast('กรุณาเลือกเมนู');
      return false;
    }
    if (payload.qty <= 0) {
      window.POS.critical.toast('กรุณาใส่จำนวนให้ถูกต้อง');
      return false;
    }
    if (payload.price <= 0) {
      window.POS.critical.toast('กรุณาใส่ราคาให้ถูกต้อง');
      return false;
    }
    return true;
  }

  /**
   * Reset sale form
   */
  resetForm() {
    window.POS.critical.resetSale();
  }

  /**
   * Save platform preference
   */
  savePlatformPreference(platform, menuId) {
    const current = this.platformPreferences.get(platform) || {};
    current.commonMenu = menuId;
    current.lastUsed = Date.now();
    this.platformPreferences.set(platform, current);
  }

  /**
   * Setup smart suggestions for menus and platforms
   */
  setupSmartSuggestions() {
    this.reorderMenuOptions();
    this.addPlatformSuggestions();
  }

  /**
   * Reorder menu options to show recent ones first
   */
  reorderMenuOptions() {
    const menuSelect = document.getElementById('s_menu');
    if (!menuSelect) return;

    const options = Array.from(menuSelect.options);
    const recentOptions = [];
    const otherOptions = [];

    options.forEach(option => {
      if (option.value && this.recentMenus.has(option.value)) {
        recentOptions.push(option);
      } else {
        otherOptions.push(option);
      }
    });

    // Clear and rebuild
    menuSelect.innerHTML = '';
    
    // Add placeholder
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'เลือกเมนู...';
    menuSelect.appendChild(placeholder);

    // Add recent menus first
    if (recentOptions.length > 0) {
      const recentGroup = document.createElement('optgroup');
      recentGroup.label = '🕒 ขายล่าสุด';
      recentOptions.forEach(option => recentGroup.appendChild(option));
      menuSelect.appendChild(recentGroup);
    }

    // Add other menus
    if (otherOptions.length > 0) {
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = '🍢 เมนูทั้งหมด';
      otherOptions.forEach(option => otherGroup.appendChild(option));
      menuSelect.appendChild(otherGroup);
    }
  }

  /**
   * Add platform suggestions based on time
   */
  addPlatformSuggestions() {
    const platformSelect = document.getElementById('s_platform');
    if (!platformSelect) return;

    const currentHour = new Date().getHours();
    let suggestedPlatform = '';

    // Business logic for platform suggestions
    if (currentHour >= 11 && currentHour <= 14) {
      suggestedPlatform = 'grab'; // Lunch time
    } else if (currentHour >= 17 && currentHour <= 21) {
      suggestedPlatform = 'lineman'; // Dinner time
    } else if (currentHour >= 9 && currentHour <= 11) {
      suggestedPlatform = 'walkin'; // Morning walk-ins
    }

    if (suggestedPlatform && !platformSelect.value) {
      platformSelect.value = suggestedPlatform;
      this.onPlatformChange({ target: platformSelect });
    }
  }

  /**
   * Load recent data from localStorage
   */
  loadRecentData() {
    try {
      const recentData = localStorage.getItem('pos_recent_menus');
      if (recentData) {
        this.recentMenus = new Set(JSON.parse(recentData));
      }

      const platformData = localStorage.getItem('pos_platform_preferences');
      if (platformData) {
        this.platformPreferences = new Map(JSON.parse(platformData));
      }
    } catch (error) {
      console.warn('Failed to load recent data:', error);
    }
  }

  /**
   * Save recent data to localStorage
   */
  saveRecentData() {
    try {
      localStorage.setItem('pos_recent_menus', 
        JSON.stringify(Array.from(this.recentMenus).slice(-10))); // Keep last 10
      
      localStorage.setItem('pos_platform_preferences', 
        JSON.stringify(Array.from(this.platformPreferences.entries())));
    } catch (error) {
      console.warn('Failed to save recent data:', error);
    }
  }

  /**
   * Get module info
   */
  getInfo() {
    return {
      name: 'SaleModule',
      version: '1.0.0',
      initialized: this.initialized,
      recentMenus: this.recentMenus.size,
      platformPreferences: this.platformPreferences.size
    };
  }
}

export default SaleModule;