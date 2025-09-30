/**
 * QuickActionManager - Floating Action Button System
 * Provides contextual quick actions based on current screen and user patterns
 */

class QuickActionManager {
  constructor() {
    this.isExpanded = false;
    this.currentScreen = 'home';
    this.userPreferences = this.loadPreferences();
    this.recentActions = this.loadRecentActions();
    this.fab = null;
    this.actionMenu = null;
    this.keyboardShortcuts = new Map();
    
    this.init();
  }

  init() {
    this.createFAB();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.updateContextualActions();
  }

  createFAB() {
    // Create main FAB container
    this.fab = document.createElement('div');
    this.fab.className = 'fab-container';
    this.fab.innerHTML = `
      <button class="fab-main" aria-label="Quick Actions" aria-expanded="false">
        <span class="fab-icon">⚡</span>
        <span class="fab-label">Quick Actions</span>
      </button>
      <div class="fab-menu" role="menu" aria-hidden="true">
        <div class="fab-actions"></div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(this.fab);
    this.actionMenu = this.fab.querySelector('.fab-actions');
  }

  setupEventListeners() {
    const mainButton = this.fab.querySelector('.fab-main');
    
    // Main FAB click
    mainButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.fab.contains(e.target) && this.isExpanded) {
        this.closeMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isExpanded) {
        this.closeMenu();
        mainButton.focus();
      }
    });

    // Listen for screen changes
    const originalRouteTo = window.routeTo;
    window.routeTo = (screenName) => {
      this.currentScreen = screenName;
      this.updateContextualActions();
      if (originalRouteTo) {
        originalRouteTo(screenName);
      }
    };

    // Handle touch gestures for mobile
    let touchStartY = 0;
    let touchStartTime = 0;

    this.fab.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    this.fab.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;
      const swipeDistance = touchStartY - touchEndY;

      // Swipe up to expand menu
      if (swipeDistance > 50 && touchDuration < 300 && !this.isExpanded) {
        e.preventDefault();
        this.openMenu();
      }
    }, { passive: false });
  }

  setupKeyboardShortcuts() {
    // Define keyboard shortcuts
    const shortcuts = {
      'ctrl+q': () => this.toggleMenu(),
      'ctrl+s': () => this.executeAction('quick-sale'),
      'ctrl+p': () => this.executeAction('quick-purchase'),
      'ctrl+m': () => this.executeAction('menu-management'),
      'ctrl+r': () => this.executeAction('daily-report'),
      'ctrl+h': () => this.executeAction('home'),
      'ctrl+shift+s': () => this.executeAction('sync-data'),
      'alt+1': () => window.routeTo('home'),
      'alt+2': () => window.routeTo('purchase'),
      'alt+3': () => window.routeTo('sale'),
      'alt+4': () => window.routeTo('menu'),
      'alt+5': () => window.routeTo('reports')
    };

    // Register shortcuts
    Object.entries(shortcuts).forEach(([key, action]) => {
      this.keyboardShortcuts.set(key, action);
    });

    // Listen for keyboard events
    document.addEventListener('keydown', (e) => {
      const key = this.getKeyCombo(e);
      const action = this.keyboardShortcuts.get(key);
      
      if (action && !this.isInputFocused()) {
        e.preventDefault();
        action();
      }
    });
  }

  getKeyCombo(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.contentEditable === 'true'
    );
  }

  toggleMenu() {
    if (this.isExpanded) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.isExpanded = true;
    this.fab.classList.add('expanded');
    
    const mainButton = this.fab.querySelector('.fab-main');
    const menu = this.fab.querySelector('.fab-menu');
    
    mainButton.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    
    // Focus first action
    const firstAction = this.actionMenu.querySelector('.fab-action');
    if (firstAction) {
      setTimeout(() => firstAction.focus(), 100);
    }

    // Add haptic feedback on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  closeMenu() {
    this.isExpanded = false;
    this.fab.classList.remove('expanded');
    
    const mainButton = this.fab.querySelector('.fab-main');
    const menu = this.fab.querySelector('.fab-menu');
    
    mainButton.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  }

  updateContextualActions() {
    const actions = this.getContextualActions();
    this.renderActions(actions);
  }

  getContextualActions() {
    const baseActions = [
      {
        id: 'quick-sale',
        label: 'ขายด่วน',
        icon: '🛒',
        shortcut: 'Ctrl+S',
        action: () => this.executeAction('quick-sale')
      },
      {
        id: 'quick-purchase',
        label: 'ซื้อด่วน',
        icon: '📦',
        shortcut: 'Ctrl+P',
        action: () => this.executeAction('quick-purchase')
      }
    ];

    // Add contextual actions based on current screen
    const contextualActions = this.getScreenSpecificActions();
    
    // Add recent actions
    const recentActions = this.getRecentActionsMenu();
    
    // Combine and prioritize
    const allActions = [...baseActions, ...contextualActions, ...recentActions];
    
    // Sort by user preferences and frequency
    return this.prioritizeActions(allActions);
  }

  getScreenSpecificActions() {
    const screenActions = {
      home: [
        {
          id: 'refresh-data',
          label: 'รีเฟรชข้อมูล',
          icon: '🔄',
          shortcut: 'Ctrl+R',
          action: () => this.executeAction('refresh-data')
        },
        {
          id: 'low-stock-check',
          label: 'เช็คสต๊อกต่ำ',
          icon: '⚠️',
          action: () => this.executeAction('low-stock-check')
        }
      ],
      purchase: [
        {
          id: 'recent-ingredients',
          label: 'วัตถุดิบล่าสุด',
          icon: '📋',
          action: () => this.executeAction('recent-ingredients')
        },
        {
          id: 'calculate-price',
          label: 'คำนวณราคา',
          icon: '🧮',
          action: () => this.executeAction('calculate-price')
        }
      ],
      sale: [
        {
          id: 'popular-menus',
          label: 'เมนูยอดนิยม',
          icon: '⭐',
          action: () => this.executeAction('popular-menus')
        },
        {
          id: 'quick-platforms',
          label: 'แพลตฟอร์มด่วน',
          icon: '📱',
          action: () => this.executeAction('quick-platforms')
        }
      ],
      menu: [
        {
          id: 'cost-calculator',
          label: 'คำนวณต้นทุน',
          icon: '💰',
          action: () => this.executeAction('cost-calculator')
        },
        {
          id: 'ingredient-usage',
          label: 'การใช้วัตถุดิบ',
          icon: '📊',
          action: () => this.executeAction('ingredient-usage')
        }
      ],
      reports: [
        {
          id: 'quick-report',
          label: 'รายงานด่วน',
          icon: '📈',
          action: () => this.executeAction('quick-report')
        },
        {
          id: 'export-data',
          label: 'ส่งออกข้อมูล',
          icon: '💾',
          action: () => this.executeAction('export-data')
        }
      ]
    };

    return screenActions[this.currentScreen] || [];
  }

  getRecentActionsMenu() {
    return this.recentActions.slice(0, 2).map(actionId => ({
      id: `recent-${actionId}`,
      label: `${this.getActionLabel(actionId)} (ล่าสุด)`,
      icon: '🕒',
      action: () => this.executeAction(actionId)
    }));
  }

  prioritizeActions(actions) {
    // Sort by user preferences and frequency
    return actions.sort((a, b) => {
      const aPreference = this.userPreferences[a.id] || 0;
      const bPreference = this.userPreferences[b.id] || 0;
      return bPreference - aPreference;
    }).slice(0, 6); // Limit to 6 actions for better UX
  }

  renderActions(actions) {
    this.actionMenu.innerHTML = actions.map(action => `
      <button class="fab-action" 
              data-action="${action.id}"
              aria-label="${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}"
              title="${action.label}${action.shortcut ? ` - ${action.shortcut}` : ''}">
        <span class="fab-action-icon">${action.icon}</span>
        <span class="fab-action-label">${action.label}</span>
        ${action.shortcut ? `<span class="fab-action-shortcut">${action.shortcut}</span>` : ''}
      </button>
    `).join('');

    // Add event listeners to action buttons
    this.actionMenu.querySelectorAll('.fab-action').forEach((button, index) => {
      const action = actions[index];
      button.addEventListener('click', (e) => {
        e.preventDefault();
        action.action();
        this.closeMenu();
        this.trackActionUsage(action.id);
      });

      // Keyboard navigation
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          action.action();
          this.closeMenu();
          this.trackActionUsage(action.id);
        }
      });
    });
  }

  executeAction(actionId) {
    switch (actionId) {
      case 'quick-sale':
        window.routeTo('sale');
        // Pre-fill today's date
        setTimeout(() => {
          const dateInput = document.getElementById('s_date');
          if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
          }
        }, 100);
        break;

      case 'quick-purchase':
        window.routeTo('purchase');
        // Pre-fill today's date
        setTimeout(() => {
          const dateInput = document.getElementById('p_date');
          if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
          }
        }, 100);
        break;

      case 'menu-management':
        window.routeTo('menu');
        break;

      case 'daily-report':
        window.routeTo('reports');
        // Pre-fill today's date range
        setTimeout(() => {
          const today = new Date().toISOString().split('T')[0];
          const fromInput = document.getElementById('rp_from');
          const toInput = document.getElementById('rp_to');
          if (fromInput && toInput) {
            fromInput.value = today;
            toInput.value = today;
          }
        }, 100);
        break;

      case 'home':
        window.routeTo('home');
        break;

      case 'sync-data':
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
          syncBtn.click();
        }
        break;

      case 'refresh-data':
        if (window.POS && window.POS.critical && window.POS.critical.refreshLowStock) {
          window.POS.critical.refreshLowStock();
        }
        break;

      case 'low-stock-check':
        window.routeTo('home');
        setTimeout(() => {
          const lowStockSection = document.querySelector('#low-stock-content');
          if (lowStockSection) {
            lowStockSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        break;

      case 'recent-ingredients':
        this.showRecentIngredients();
        break;

      case 'calculate-price':
        this.focusOnPriceCalculation();
        break;

      case 'popular-menus':
        this.showPopularMenus();
        break;

      case 'quick-platforms':
        this.showQuickPlatforms();
        break;

      case 'cost-calculator':
        this.focusOnCostCalculator();
        break;

      case 'ingredient-usage':
        this.showIngredientUsage();
        break;

      case 'quick-report':
        this.generateQuickReport();
        break;

      case 'export-data':
        this.exportCurrentData();
        break;

      default:
        console.warn(`Unknown action: ${actionId}`);
    }

    this.trackActionUsage(actionId);
  }

  // Helper methods for specific actions
  showRecentIngredients() {
    const ingredientSelect = document.getElementById('p_ing');
    if (ingredientSelect) {
      // Focus on ingredient selector and show recent items at top
      ingredientSelect.focus();
      if (window.POS && window.POS.critical) {
        window.POS.critical.toast('แสดงวัตถุดิบที่ใช้ล่าสุด');
      }
    }
  }

  focusOnPriceCalculation() {
    const totalPriceInput = document.getElementById('p_total_price');
    if (totalPriceInput) {
      totalPriceInput.focus();
      totalPriceInput.select();
    }
  }

  showPopularMenus() {
    const menuSelect = document.getElementById('s_menu');
    if (menuSelect) {
      menuSelect.focus();
      if (window.POS && window.POS.critical) {
        window.POS.critical.toast('แสดงเมนูยอดนิยม');
      }
    }
  }

  showQuickPlatforms() {
    const platformSelect = document.getElementById('s_platform');
    if (platformSelect) {
      platformSelect.focus();
      // Auto-select most common platform based on time
      const hour = new Date().getHours();
      let defaultPlatform = 'walkin';
      
      if (hour >= 11 && hour <= 14) {
        defaultPlatform = 'grab'; // Lunch time
      } else if (hour >= 17 && hour <= 21) {
        defaultPlatform = 'lineman'; // Dinner time
      }
      
      platformSelect.value = defaultPlatform;
    }
  }

  focusOnCostCalculator() {
    const calculateBtn = document.querySelector('button[onclick="calculateMenuCost()"]');
    if (calculateBtn) {
      calculateBtn.focus();
      if (window.POS && window.POS.critical) {
        window.POS.critical.toast('คลิกเพื่อคำนวณต้นทุนเมนู');
      }
    }
  }

  showIngredientUsage() {
    const menuIngredientsContent = document.getElementById('menu-ingredients-content');
    if (menuIngredientsContent) {
      menuIngredientsContent.scrollIntoView({ behavior: 'smooth' });
    }
  }

  generateQuickReport() {
    // Set date range to last 7 days
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const fromInput = document.getElementById('rp_from');
    const toInput = document.getElementById('rp_to');
    
    if (fromInput && toInput) {
      fromInput.value = weekAgo.toISOString().split('T')[0];
      toInput.value = today.toISOString().split('T')[0];
      
      // Trigger report generation
      setTimeout(() => {
        const generateBtn = document.querySelector('button[onclick="generateReport()"]');
        if (generateBtn) {
          generateBtn.click();
        }
      }, 100);
    }
  }

  exportCurrentData() {
    const exportBtn = document.querySelector('button[onclick="exportReport()"]');
    if (exportBtn) {
      exportBtn.click();
    } else {
      if (window.POS && window.POS.critical) {
        window.POS.critical.toast('ไม่มีข้อมูลให้ส่งออก');
      }
    }
  }

  // Utility methods
  trackActionUsage(actionId) {
    // Update usage frequency
    this.userPreferences[actionId] = (this.userPreferences[actionId] || 0) + 1;
    
    // Update recent actions
    this.recentActions = this.recentActions.filter(id => id !== actionId);
    this.recentActions.unshift(actionId);
    this.recentActions = this.recentActions.slice(0, 5); // Keep only 5 recent actions
    
    // Save preferences
    this.savePreferences();
    this.saveRecentActions();
  }

  getActionLabel(actionId) {
    const labels = {
      'quick-sale': 'ขายด่วน',
      'quick-purchase': 'ซื้อด่วน',
      'menu-management': 'จัดการเมนู',
      'daily-report': 'รายงานรายวัน',
      'home': 'หน้าหลัก',
      'sync-data': 'ซิงค์ข้อมูล',
      'refresh-data': 'รีเฟรชข้อมูล',
      'low-stock-check': 'เช็คสต๊อกต่ำ'
    };
    return labels[actionId] || actionId;
  }

  loadPreferences() {
    try {
      const saved = localStorage.getItem('quickActionPreferences');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load quick action preferences:', error);
      return {};
    }
  }

  savePreferences() {
    try {
      localStorage.setItem('quickActionPreferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      console.error('Failed to save quick action preferences:', error);
    }
  }

  loadRecentActions() {
    try {
      const saved = localStorage.getItem('recentQuickActions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load recent actions:', error);
      return [];
    }
  }

  saveRecentActions() {
    try {
      localStorage.setItem('recentQuickActions', JSON.stringify(this.recentActions));
    } catch (error) {
      console.error('Failed to save recent actions:', error);
    }
  }

  // Public API for customization
  addCustomAction(action) {
    // Allow modules to add custom actions
    this.customActions = this.customActions || [];
    this.customActions.push(action);
    this.updateContextualActions();
  }

  removeCustomAction(actionId) {
    if (this.customActions) {
      this.customActions = this.customActions.filter(action => action.id !== actionId);
      this.updateContextualActions();
    }
  }

  // Cleanup
  destroy() {
    if (this.fab) {
      this.fab.remove();
    }
    
    // Remove keyboard event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('click', this.handleOutsideClick);
  }
}

export default QuickActionManager;