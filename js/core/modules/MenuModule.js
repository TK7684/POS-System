/**
 * Menu Module - Lazy loaded for menu management functionality
 * Contains menu BOM management and cost calculation
 */

class MenuModule {
  constructor() {
    this.initialized = false;
    this.menuCache = new Map();
    this.costCache = new Map();
  }

  /**
   * Initialize menu module
   */
  init() {
    if (this.initialized) return;
    
    this.setupEventListeners();
    this.loadMenuIngredients();
    this.initialized = true;
    
    console.log('Menu module initialized');
  }

  /**
   * Setup event listeners for menu form
   */
  setupEventListeners() {
    const form = document.getElementById('menu-screen');
    if (!form) return;

    // Menu selection change
    const menuSelect = document.getElementById('m_menu');
    if (menuSelect) {
      menuSelect.addEventListener('change', this.onMenuChange.bind(this));
    }

    // Ingredient selection change
    const ingredientSelect = document.getElementById('m_ingredient');
    if (ingredientSelect) {
      ingredientSelect.addEventListener('change', this.onIngredientChange.bind(this));
    }

    // Form submission
    const submitBtn = form.querySelector('.btn.brand');
    if (submitBtn) {
      submitBtn.addEventListener('click', this.addMenuIngredient.bind(this));
    }

    // Cost calculation button
    const costBtn = form.querySelector('button[onclick="calculateMenuCost()"]');
    if (costBtn) {
      costBtn.removeAttribute('onclick');
      costBtn.addEventListener('click', this.calculateMenuCost.bind(this));
    }
  }

  /**
   * Handle menu selection change
   */
  onMenuChange(event) {
    const menuId = event.target.value;
    this.loadMenuIngredients(menuId);
  }

  /**
   * Handle ingredient selection change
   */
  onIngredientChange(event) {
    const ingredientId = event.target.value;
    if (!ingredientId) return;

    // Load ingredient unit information
    this.loadIngredientUnit(ingredientId);
  }

  /**
   * Load ingredient unit information
   */
  loadIngredientUnit(ingredientId) {
    // This would typically fetch from API or cache
    // For now, we'll use a simple mapping
    const unitInput = document.getElementById('m_unit');
    if (unitInput) {
      const commonUnits = {
        'กุ้ง': 'ตัว',
        'หมู': 'กรัม',
        'ไก่': 'กรัม',
        'น้ำปลา': 'มล.',
        'น้ำตาล': 'กรัม',
        'มะนาว': 'ลูก'
      };
      
      unitInput.value = commonUnits[ingredientId] || 'กรัม';
    }
  }

  /**
   * Add ingredient to menu
   */
  async addMenuIngredient() {
    const payload = this.collectFormData();
    
    if (!this.validateMenuData(payload)) {
      return;
    }

    try {
      window.POS.critical.loading(true);
      
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        await new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler(res => {
              window.POS.critical.loading(false);
              window.POS.critical.toast(`✅ เพิ่มวัตถุดิบในเมนูแล้ว: ${payload.ingredient_id}`);
              this.resetForm();
              this.loadMenuIngredients();
              this.clearCostCache(payload.menu_id);
              resolve(res);
            })
            .withFailureHandler(err => {
              window.POS.critical.loading(false);
              window.POS.critical.toast(`❌ ${err.message || 'เกิดข้อผิดพลาด'}`);
              reject(err);
            })
            .addMenuIngredient(payload);
        });
      } else {
        window.POS.critical.loading(false);
        window.POS.critical.toast('❌ ไม่สามารถเชื่อมต่อกับ Google Sheets ได้');
      }
    } catch (error) {
      window.POS.critical.loading(false);
      console.error('Menu ingredient addition failed:', error);
    }
  }

  /**
   * Collect form data
   */
  collectFormData() {
    return {
      menu_id: document.getElementById('m_menu')?.value,
      ingredient_id: document.getElementById('m_ingredient')?.value,
      qty: Number(document.getElementById('m_qty')?.value || 0)
    };
  }

  /**
   * Validate menu data
   */
  validateMenuData(payload) {
    if (!payload.menu_id) {
      window.POS.critical.toast('กรุณาเลือกเมนู');
      return false;
    }
    if (!payload.ingredient_id) {
      window.POS.critical.toast('กรุณาเลือกวัตถุดิบ');
      return false;
    }
    if (payload.qty <= 0) {
      window.POS.critical.toast('กรุณาใส่จำนวนให้ถูกต้อง');
      return false;
    }
    return true;
  }

  /**
   * Reset menu form
   */
  resetForm() {
    window.POS.critical.resetMenuForm();
  }

  /**
   * Load menu ingredients
   */
  async loadMenuIngredients(menuId = null) {
    const selectedMenuId = menuId || document.getElementById('m_menu')?.value;
    const contentElement = document.getElementById('menu-ingredients-content');
    
    if (!contentElement) return;

    if (!selectedMenuId) {
      contentElement.innerHTML = '<div class="muted">เลือกเมนูเพื่อดูวัตถุดิบ</div>';
      return;
    }

    // Check cache first
    if (this.menuCache.has(selectedMenuId)) {
      contentElement.innerHTML = this.menuCache.get(selectedMenuId);
      return;
    }

    try {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        await new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler(html => {
              const content = html || '<div class="muted">ไม่มีวัตถุดิบในเมนูนี้</div>';
              contentElement.innerHTML = content;
              
              // Cache the result
              this.menuCache.set(selectedMenuId, content);
              
              // Add delete buttons functionality
              this.setupDeleteButtons();
              
              resolve(html);
            })
            .withFailureHandler(err => {
              contentElement.innerHTML = '<div class="muted">ไม่สามารถโหลดข้อมูลได้</div>';
              reject(err);
            })
            .getMenuIngredientsHTML(selectedMenuId);
        });
      }
    } catch (error) {
      console.error('Failed to load menu ingredients:', error);
      contentElement.innerHTML = '<div class="muted">ไม่สามารถโหลดข้อมูลได้</div>';
    }
  }

  /**
   * Setup delete buttons for menu ingredients
   */
  setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('[data-delete-ingredient]');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', this.deleteMenuIngredient.bind(this));
    });
  }

  /**
   * Delete menu ingredient
   */
  async deleteMenuIngredient(event) {
    const button = event.target;
    const ingredientId = button.dataset.deleteIngredient;
    const menuId = document.getElementById('m_menu')?.value;
    
    if (!ingredientId || !menuId) return;

    if (!confirm(`ต้องการลบ ${ingredientId} ออกจากเมนูหรือไม่?`)) {
      return;
    }

    try {
      window.POS.critical.loading(true);
      
      // Clear cache
      this.menuCache.delete(menuId);
      this.clearCostCache(menuId);
      
      // Reload ingredients
      await this.loadMenuIngredients();
      
      window.POS.critical.loading(false);
      window.POS.critical.toast(`✅ ลบ ${ingredientId} ออกจากเมนูแล้ว`);
      
    } catch (error) {
      window.POS.critical.loading(false);
      console.error('Failed to delete menu ingredient:', error);
      window.POS.critical.toast('❌ ไม่สามารถลบวัตถุดิบได้');
    }
  }

  /**
   * Calculate menu cost
   */
  async calculateMenuCost() {
    const menuId = document.getElementById('m_menu')?.value;
    if (!menuId) {
      window.POS.critical.toast('กรุณาเลือกเมนู');
      return;
    }

    // Check cache first
    if (this.costCache.has(menuId)) {
      this.displayCostResult(this.costCache.get(menuId));
      return;
    }

    try {
      window.POS.critical.loading(true);
      
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        await new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler(result => {
              window.POS.critical.loading(false);
              
              // Cache the result
              this.costCache.set(menuId, result);
              
              this.displayCostResult(result);
              resolve(result);
            })
            .withFailureHandler(err => {
              window.POS.critical.loading(false);
              window.POS.critical.toast(`❌ ${err.message || 'ไม่สามารถคำนวณต้นทุนได้'}`);
              reject(err);
            })
            .calculateMenuCost(menuId);
        });
      } else {
        window.POS.critical.loading(false);
        window.POS.critical.toast('❌ ไม่สามารถเชื่อมต่อกับ Google Sheets ได้');
      }
    } catch (error) {
      window.POS.critical.loading(false);
      console.error('Cost calculation failed:', error);
    }
  }

  /**
   * Display cost calculation result
   */
  displayCostResult(result) {
    if (!result) return;

    const costInfo = document.createElement('div');
    costInfo.className = 'cost-result';
    costInfo.style.cssText = `
      margin-top: 16px;
      padding: 16px;
      background: var(--card);
      border: 2px solid var(--brand);
      border-radius: var(--radius);
      font-weight: 600;
    `;
    
    costInfo.innerHTML = `
      <div style="color: var(--brand); font-size: var(--fs-lg); margin-bottom: 8px;">
        💰 ต้นทุนต่อเสิร์ฟ: ${result.cost?.toFixed(2) || 0} บาท
      </div>
      <div style="font-size: var(--fs-sm); color: var(--muted);">
        คำนวณจาก ${result.ingredients || 0} รายการวัตถุดิบ
      </div>
      ${result.margin ? `
        <div style="font-size: var(--fs-sm); margin-top: 8px;">
          📊 แนะนำราคาขาย: ${(result.cost * result.margin).toFixed(2)} บาท (กำไร ${((result.margin - 1) * 100).toFixed(0)}%)
        </div>
      ` : ''}
    `;

    // Remove existing cost result
    const existing = document.querySelector('.cost-result');
    if (existing) {
      existing.remove();
    }

    // Add new result
    const contentElement = document.getElementById('menu-ingredients-content');
    if (contentElement) {
      contentElement.appendChild(costInfo);
    }

    window.POS.critical.toast(`✅ คำนวณต้นทุนแล้ว: ${result.cost?.toFixed(2) || 0} บาท`);
  }

  /**
   * Clear cost cache for a menu
   */
  clearCostCache(menuId) {
    if (menuId) {
      this.costCache.delete(menuId);
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.menuCache.clear();
    this.costCache.clear();
  }

  /**
   * Get module info
   */
  getInfo() {
    return {
      name: 'MenuModule',
      version: '1.0.0',
      initialized: this.initialized,
      cachedMenus: this.menuCache.size,
      cachedCosts: this.costCache.size
    };
  }
}

export default MenuModule;