/**
 * Purchase Module - Lazy loaded for purchase screen functionality
 * Contains purchase-specific logic and form handling
 */

class PurchaseModule {
  constructor() {
    this.initialized = false;
    this.recentIngredients = new Set();
    this.priceMemory = new Map();
  }

  /**
   * Initialize purchase module
   */
  init() {
    if (this.initialized) return;
    
    this.setupEventListeners();
    this.loadRecentData();
    this.setupSmartSuggestions();
    this.initialized = true;
    
    console.log('Purchase module initialized');
  }

  /**
   * Setup event listeners for purchase form
   */
  setupEventListeners() {
    const form = document.getElementById('purchase-screen');
    if (!form) return;

    // Auto-calculate price per unit
    const totalPriceInput = document.getElementById('p_total_price');
    if (totalPriceInput) {
      totalPriceInput.addEventListener('input', this.calculatePricePerUnit.bind(this));
    }

    // Smart ingredient selection
    const ingredientSelect = document.getElementById('p_ing');
    if (ingredientSelect) {
      ingredientSelect.addEventListener('change', this.onIngredientChange.bind(this));
    }

    // Form submission
    const submitBtn = form.querySelector('.btn.brand');
    if (submitBtn) {
      submitBtn.addEventListener('click', this.onAddPurchase.bind(this));
    }
  }

  /**
   * Calculate price per unit automatically
   */
  calculatePricePerUnit() {
    const qty = Number(document.getElementById('p_qty')?.value || 0);
    const totalPrice = Number(document.getElementById('p_total_price')?.value || 0);
    const priceInput = document.getElementById('p_price');
    
    if (qty > 0 && totalPrice > 0 && priceInput) {
      priceInput.value = (totalPrice / qty).toFixed(2);
    }
  }

  /**
   * Handle ingredient selection change
   */
  onIngredientChange(event) {
    const ingredientId = event.target.value;
    if (!ingredientId) return;

    // Add to recent ingredients
    this.recentIngredients.add(ingredientId);
    this.saveRecentData();

    // Load suggested price if available
    this.loadSuggestedPrice(ingredientId);
  }

  /**
   * Load suggested price from memory
   */
  loadSuggestedPrice(ingredientId) {
    const suggestedPrice = this.priceMemory.get(ingredientId);
    if (suggestedPrice) {
      const totalPriceInput = document.getElementById('p_total_price');
      if (totalPriceInput && !totalPriceInput.value) {
        totalPriceInput.value = suggestedPrice.toFixed(2);
        this.calculatePricePerUnit();
      }
    }
  }

  /**
   * Handle purchase form submission
   */
  async onAddPurchase() {
    const payload = this.collectFormData();
    
    if (!this.validatePurchaseData(payload)) {
      return;
    }

    // Save price to memory
    this.priceMemory.set(payload.ingredient_id, payload.totalPrice);
    this.saveRecentData();

    try {
      window.POS.critical.loading(true);
      
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        await new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler(res => {
              window.POS.critical.loading(false);
              window.POS.critical.toast(`✅ บันทึกการซื้อแล้ว: ${payload.ingredient_id} (ล็อต ${res.lot_id})`);
              this.resetForm();
              window.POS.critical.refreshLowStock();
              resolve(res);
            })
            .withFailureHandler(err => {
              window.POS.critical.loading(false);
              window.POS.critical.toast(`❌ ${err.message || 'เกิดข้อผิดพลาด'}`);
              reject(err);
            })
            .addPurchase(payload);
        });
      } else {
        window.POS.critical.loading(false);
        window.POS.critical.toast('❌ ไม่สามารถเชื่อมต่อกับ Google Sheets ได้');
      }
    } catch (error) {
      window.POS.critical.loading(false);
      console.error('Purchase submission failed:', error);
    }
  }

  /**
   * Collect form data
   */
  collectFormData() {
    return {
      date: document.getElementById('p_date')?.value || null,
      ingredient_id: document.getElementById('p_ing')?.value,
      qtyBuy: Number(document.getElementById('p_qty')?.value || 0),
      unit: document.getElementById('p_unit')?.value || '',
      totalPrice: Number(document.getElementById('p_total_price')?.value || 0),
      unitPrice: Number(document.getElementById('p_price')?.value || 0),
      supplierNote: document.getElementById('p_note')?.value || '',
      actualYield: Number(document.getElementById('p_actual_yield')?.value || 0) || null
    };
  }

  /**
   * Validate purchase data
   */
  validatePurchaseData(payload) {
    if (!payload.ingredient_id) {
      window.POS.critical.toast('กรุณาเลือกวัตถุดิบ');
      return false;
    }
    if (payload.qtyBuy <= 0) {
      window.POS.critical.toast('กรุณาใส่จำนวนให้ถูกต้อง');
      return false;
    }
    if (payload.totalPrice <= 0) {
      window.POS.critical.toast('กรุณาใส่ราคารวมให้ถูกต้อง');
      return false;
    }
    return true;
  }

  /**
   * Reset purchase form
   */
  resetForm() {
    window.POS.critical.resetPurchase();
  }

  /**
   * Setup smart suggestions
   */
  setupSmartSuggestions() {
    const ingredientSelect = document.getElementById('p_ing');
    if (!ingredientSelect) return;

    // Move recent ingredients to top
    this.reorderIngredientOptions(ingredientSelect);
  }

  /**
   * Reorder ingredient options to show recent ones first
   */
  reorderIngredientOptions(selectElement) {
    const options = Array.from(selectElement.options);
    const recentOptions = [];
    const otherOptions = [];

    options.forEach(option => {
      if (option.value && this.recentIngredients.has(option.value)) {
        recentOptions.push(option);
      } else {
        otherOptions.push(option);
      }
    });

    // Clear and rebuild
    selectElement.innerHTML = '';
    
    // Add placeholder
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'เลือกวัตถุดิบ...';
    selectElement.appendChild(placeholder);

    // Add recent ingredients first
    if (recentOptions.length > 0) {
      const recentGroup = document.createElement('optgroup');
      recentGroup.label = '🕒 ใช้ล่าสุด';
      recentOptions.forEach(option => recentGroup.appendChild(option));
      selectElement.appendChild(recentGroup);
    }

    // Add other ingredients
    if (otherOptions.length > 0) {
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = '📦 วัตถุดิบทั้งหมด';
      otherOptions.forEach(option => otherGroup.appendChild(option));
      selectElement.appendChild(otherGroup);
    }
  }

  /**
   * Load recent data from localStorage
   */
  loadRecentData() {
    try {
      const recentData = localStorage.getItem('pos_recent_ingredients');
      if (recentData) {
        this.recentIngredients = new Set(JSON.parse(recentData));
      }

      const priceData = localStorage.getItem('pos_price_memory');
      if (priceData) {
        this.priceMemory = new Map(JSON.parse(priceData));
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
      localStorage.setItem('pos_recent_ingredients', 
        JSON.stringify(Array.from(this.recentIngredients).slice(-10))); // Keep last 10
      
      localStorage.setItem('pos_price_memory', 
        JSON.stringify(Array.from(this.priceMemory.entries()).slice(-20))); // Keep last 20
    } catch (error) {
      console.warn('Failed to save recent data:', error);
    }
  }

  /**
   * Get module info
   */
  getInfo() {
    return {
      name: 'PurchaseModule',
      version: '1.0.0',
      initialized: this.initialized,
      recentIngredients: this.recentIngredients.size,
      priceMemory: this.priceMemory.size
    };
  }
}

export default PurchaseModule;