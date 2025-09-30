/**
 * Desktop Enhancement Manager
 * Provides desktop-specific enhancements including hover states, keyboard shortcuts,
 * context menus, multi-window support, and mouse interactions
 */

class DesktopEnhancementManager {
  constructor() {
    this.isDesktop = window.innerWidth > 1024 && !('ontouchstart' in window);
    this.shortcuts = new Map();
    this.contextMenus = new Map();
    this.initialized = false;
    
    // Bind methods
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleResize = this.handleResize.bind(this);
    
    if (this.isDesktop) {
      this.init();
    }
  }
  
  init() {
    if (this.initialized || !this.isDesktop) return;
    
    // Add desktop-specific classes
    document.body.classList.add('desktop-enhanced', 'hover-enabled');
    
    // Initialize desktop features
    this.initializeKeyboardShortcuts();
    this.initializeContextMenus();
    this.initializeHoverEffects();
    this.initializeMouseInteractions();
    this.initializeMultiWindowSupport();
    this.initializeDesktopNavigation();
    
    // Set up event listeners
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('resize', this.handleResize, { passive: true });
    
    this.initialized = true;
    console.log('[DesktopEnhancementManager] Desktop enhancements initialized');
  }
  
  initializeKeyboardShortcuts() {
    // Define default keyboard shortcuts
    const defaultShortcuts = {
      // Navigation shortcuts
      'ctrl+1': () => this.navigateToTab('home'),
      'ctrl+2': () => this.navigateToTab('purchase'),
      'ctrl+3': () => this.navigateToTab('sale'),
      'ctrl+4': () => this.navigateToTab('menu'),
      'ctrl+5': () => this.navigateToTab('reports'),
      
      // Action shortcuts
      'ctrl+n': () => this.triggerQuickAction('new'),
      'ctrl+s': () => this.triggerQuickAction('save'),
      'ctrl+p': () => this.triggerQuickAction('print'),
      'ctrl+f': () => this.triggerQuickAction('search'),
      'ctrl+r': () => this.triggerQuickAction('refresh'),
      
      // Form shortcuts
      'ctrl+enter': () => this.submitActiveForm(),
      'escape': () => this.closeActiveModal(),
      
      // Quick entry shortcuts
      'alt+p': () => this.quickPurchaseEntry(),
      'alt+s': () => this.quickSaleEntry(),
      'alt+m': () => this.quickMenuEntry(),
      
      // Utility shortcuts
      'f1': () => this.showKeyboardHelp(),
      'f5': () => this.refreshData(),
      'ctrl+/': () => this.showKeyboardHelp()
    };
    
    // Register default shortcuts
    Object.entries(defaultShortcuts).forEach(([key, action]) => {
      this.registerShortcut(key, action);
    });
    
    // Add visual indicators for shortcuts
    this.addShortcutIndicators();
  }
  
  initializeContextMenus() {
    // Define context menus for different elements
    const contextMenuConfigs = {
      '.tile': [
        { label: 'เปิดในแท็บใหม่', action: 'openInNewTab' },
        { label: 'เพิ่มในรายการโปรด', action: 'addToFavorites' },
        { separator: true },
        { label: 'คัดลอกลิงก์', action: 'copyLink' }
      ],
      
      '.btn': [
        { label: 'คัดลอก', action: 'copy' },
        { label: 'วาง', action: 'paste' },
        { separator: true },
        { label: 'รีเซ็ต', action: 'reset' }
      ],
      
      '.table tr': [
        { label: 'แก้ไข', action: 'edit' },
        { label: 'ลบ', action: 'delete' },
        { separator: true },
        { label: 'ส่งออก', action: 'export' },
        { label: 'พิมพ์', action: 'print' }
      ],
      
      '.card': [
        { label: 'รีเฟรช', action: 'refresh' },
        { label: 'ขยาย', action: 'expand' },
        { separator: true },
        { label: 'ซ่อน', action: 'hide' }
      ]
    };
    
    // Register context menus
    Object.entries(contextMenuConfigs).forEach(([selector, items]) => {
      this.registerContextMenu(selector, items);
    });
  }
  
  initializeHoverEffects() {
    // Enhanced hover effects for desktop
    const hoverElements = document.querySelectorAll('.tile, .btn, .card, .table tr');
    
    hoverElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        if (!element.classList.contains('hover-disabled')) {
          element.classList.add('desktop-hover');
          
          // Add subtle animation
          if (element.classList.contains('tile')) {
            element.style.transform = 'translateY(-4px)';
            element.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
          }
        }
      }, { passive: true });
      
      element.addEventListener('mouseleave', (e) => {
        element.classList.remove('desktop-hover');
        
        // Reset animation
        if (element.classList.contains('tile')) {
          element.style.transform = '';
          element.style.boxShadow = '';
        }
      }, { passive: true });
    });
    
    // Add hover effects to navigation
    const navItems = document.querySelectorAll('.tabbtn');
    navItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        if (!item.hasAttribute('aria-current') || item.getAttribute('aria-current') !== 'page') {
          item.style.backgroundColor = 'var(--line)';
          item.style.borderRadius = 'var(--radius)';
        }
      }, { passive: true });
      
      item.addEventListener('mouseleave', () => {
        if (!item.hasAttribute('aria-current') || item.getAttribute('aria-current') !== 'page') {
          item.style.backgroundColor = '';
          item.style.borderRadius = '';
        }
      }, { passive: true });
    });
  }
  
  initializeMouseInteractions() {
    // Enhanced mouse interactions
    document.addEventListener('mousedown', (e) => {
      // Add active state for better feedback
      if (e.target.matches('.btn, .tile, .tabbtn')) {
        e.target.classList.add('mouse-active');
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      // Remove active state
      document.querySelectorAll('.mouse-active').forEach(el => {
        el.classList.remove('mouse-active');
      });
    });
    
    // Middle click support for tiles (open in new window)
    document.addEventListener('mousedown', (e) => {
      if (e.button === 1 && e.target.closest('.tile')) { // Middle click
        e.preventDefault();
        const tile = e.target.closest('.tile');
        const route = tile.dataset.route;
        if (route) {
          this.openInNewWindow(route);
        }
      }
    });
    
    // Mouse wheel support for horizontal scrolling
    const horizontalScrollElements = document.querySelectorAll('.table-container, .grid');
    horizontalScrollElements.forEach(element => {
      element.addEventListener('wheel', (e) => {
        if (e.shiftKey) {
          e.preventDefault();
          element.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    });
  }
  
  initializeMultiWindowSupport() {
    // Add support for opening sections in new windows
    this.addNewWindowButtons();
    
    // Handle window communication
    window.addEventListener('message', (e) => {
      if (e.origin === window.location.origin) {
        this.handleWindowMessage(e.data);
      }
    });
    
    // Store window references
    this.childWindows = new Set();
    
    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      this.childWindows.forEach(win => {
        if (!win.closed) {
          win.close();
        }
      });
    });
  }
  
  initializeDesktopNavigation() {
    // Add desktop-specific navigation enhancements
    const tabbar = document.querySelector('.tabbar');
    if (tabbar) {
      // Convert to horizontal layout for desktop
      tabbar.classList.add('desktop-horizontal');
      
      // Add keyboard navigation
      tabbar.addEventListener('keydown', (e) => {
        const tabs = Array.from(tabbar.querySelectorAll('.tabbtn'));
        const currentTab = document.activeElement;
        const currentIndex = tabs.indexOf(currentTab);
        
        let nextIndex = -1;
        
        switch (e.key) {
          case 'ArrowLeft':
            nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            break;
          case 'ArrowRight':
            nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            break;
          case 'Home':
            nextIndex = 0;
            break;
          case 'End':
            nextIndex = tabs.length - 1;
            break;
        }
        
        if (nextIndex !== -1) {
          e.preventDefault();
          tabs[nextIndex].focus();
        }
      });
    }
    
    // Add breadcrumb navigation for desktop
    this.addBreadcrumbNavigation();
  }
  
  registerShortcut(key, action) {
    const normalizedKey = this.normalizeShortcutKey(key);
    this.shortcuts.set(normalizedKey, action);
  }
  
  registerContextMenu(selector, items) {
    this.contextMenus.set(selector, items);
  }
  
  handleKeydown(e) {
    const key = this.getShortcutKey(e);
    const action = this.shortcuts.get(key);
    
    if (action) {
      // Don't prevent default for certain keys in input fields
      const isInputField = e.target.matches('input, textarea, select');
      const isEditableContent = e.target.isContentEditable;
      
      if (!isInputField && !isEditableContent) {
        e.preventDefault();
        action();
      } else if (key === 'escape' || key === 'f1' || key.startsWith('ctrl+')) {
        e.preventDefault();
        action();
      }
    }
  }
  
  handleContextMenu(e) {
    // Find matching context menu
    for (const [selector, items] of this.contextMenus) {
      if (e.target.matches(selector) || e.target.closest(selector)) {
        e.preventDefault();
        this.showContextMenu(e, items, e.target.closest(selector));
        break;
      }
    }
  }
  
  handleMouseMove(e) {
    // Update cursor position for context menus
    this.lastMousePosition = { x: e.clientX, y: e.clientY };
  }
  
  handleResize() {
    // Check if still desktop
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth > 1024 && !('ontouchstart' in window);
    
    if (wasDesktop && !this.isDesktop) {
      this.disable();
    } else if (!wasDesktop && this.isDesktop) {
      this.init();
    }
  }
  
  showContextMenu(e, items, targetElement) {
    // Remove existing context menu
    this.hideContextMenu();
    
    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'desktop-context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${e.clientY}px;
      left: ${e.clientX}px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      z-index: 1000;
      min-width: 180px;
      padding: 8px 0;
      font-size: 14px;
    `;
    
    // Add menu items
    items.forEach(item => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.style.cssText = `
          height: 1px;
          background: var(--line);
          margin: 4px 0;
        `;
        menu.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.label;
        menuItem.style.cssText = `
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.2s ease;
        `;
        
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.background = 'var(--line)';
        });
        
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.background = '';
        });
        
        menuItem.addEventListener('click', () => {
          this.executeContextMenuAction(item.action, targetElement);
          this.hideContextMenu();
        });
        
        menu.appendChild(menuItem);
      }
    });
    
    document.body.appendChild(menu);
    this.activeContextMenu = menu;
    
    // Position menu to stay within viewport
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${e.clientX - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${e.clientY - rect.height}px`;
    }
    
    // Hide menu on click outside
    setTimeout(() => {
      document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
    }, 0);
  }
  
  hideContextMenu() {
    if (this.activeContextMenu) {
      this.activeContextMenu.remove();
      this.activeContextMenu = null;
    }
  }
  
  executeContextMenuAction(action, targetElement) {
    switch (action) {
      case 'openInNewTab':
        if (targetElement.dataset.route) {
          this.openInNewWindow(targetElement.dataset.route);
        }
        break;
      case 'addToFavorites':
        this.addToFavorites(targetElement);
        break;
      case 'copyLink':
        this.copyElementLink(targetElement);
        break;
      case 'copy':
        this.copyElementContent(targetElement);
        break;
      case 'paste':
        this.pasteToElement(targetElement);
        break;
      case 'reset':
        this.resetElement(targetElement);
        break;
      case 'edit':
        this.editElement(targetElement);
        break;
      case 'delete':
        this.deleteElement(targetElement);
        break;
      case 'export':
        this.exportElement(targetElement);
        break;
      case 'print':
        this.printElement(targetElement);
        break;
      case 'refresh':
        this.refreshElement(targetElement);
        break;
      case 'expand':
        this.expandElement(targetElement);
        break;
      case 'hide':
        this.hideElement(targetElement);
        break;
    }
  }
  
  navigateToTab(tabName) {
    const tab = document.querySelector(`.tabbtn[data-route="${tabName}"]`);
    if (tab) {
      tab.click();
    }
  }
  
  triggerQuickAction(action) {
    switch (action) {
      case 'new':
        this.showNewItemDialog();
        break;
      case 'save':
        this.saveCurrentForm();
        break;
      case 'print':
        window.print();
        break;
      case 'search':
        this.focusSearchField();
        break;
      case 'refresh':
        this.refreshCurrentScreen();
        break;
    }
  }
  
  submitActiveForm() {
    const activeForm = document.querySelector('form:focus-within') || 
                     document.querySelector('.card:focus-within');
    if (activeForm) {
      const submitBtn = activeForm.querySelector('.btn.brand, [type="submit"]');
      if (submitBtn) {
        submitBtn.click();
      }
    }
  }
  
  closeActiveModal() {
    const modal = document.querySelector('.modal, .dialog');
    if (modal) {
      const closeBtn = modal.querySelector('.btn-close, [data-dismiss]');
      if (closeBtn) {
        closeBtn.click();
      } else {
        modal.remove();
      }
    }
  }
  
  quickPurchaseEntry() {
    this.navigateToTab('purchase');
    setTimeout(() => {
      const firstInput = document.querySelector('#purchase-screen input, #purchase-screen select');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }
  
  quickSaleEntry() {
    this.navigateToTab('sale');
    setTimeout(() => {
      const firstInput = document.querySelector('#sale-screen input, #sale-screen select');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }
  
  quickMenuEntry() {
    this.navigateToTab('menu');
    setTimeout(() => {
      const firstInput = document.querySelector('#menu-screen input, #menu-screen select');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }
  
  showKeyboardHelp() {
    // Show keyboard shortcuts help dialog
    if (window.KeyboardShortcutsHelp) {
      new KeyboardShortcutsHelp().show();
    } else {
      // Fallback: show simple alert
      const shortcuts = Array.from(this.shortcuts.keys()).slice(0, 10);
      alert(`คีย์บอร์ดช็อตคัต:\n${shortcuts.join('\n')}`);
    }
  }
  
  refreshData() {
    // Trigger data refresh
    if (window.cacheManager) {
      window.cacheManager.clearCache();
    }
    location.reload();
  }
  
  openInNewWindow(route) {
    const url = `${window.location.origin}${window.location.pathname}#${route}`;
    const newWindow = window.open(url, `pos-${route}`, 'width=1200,height=800');
    this.childWindows.add(newWindow);
    
    // Remove from set when window closes
    const checkClosed = setInterval(() => {
      if (newWindow.closed) {
        this.childWindows.delete(newWindow);
        clearInterval(checkClosed);
      }
    }, 1000);
  }
  
  addNewWindowButtons() {
    const screens = document.querySelectorAll('[id$="-screen"]');
    screens.forEach(screen => {
      const header = screen.querySelector('.card:first-child');
      if (header) {
        const newWindowBtn = document.createElement('button');
        newWindowBtn.className = 'btn ghost desktop-only';
        newWindowBtn.innerHTML = '🗗';
        newWindowBtn.title = 'เปิดในหน้าต่างใหม่';
        newWindowBtn.style.cssText = 'position: absolute; top: 16px; right: 16px;';
        
        const screenId = screen.id.replace('-screen', '');
        newWindowBtn.addEventListener('click', () => {
          this.openInNewWindow(screenId);
        });
        
        header.style.position = 'relative';
        header.appendChild(newWindowBtn);
      }
    });
  }
  
  addBreadcrumbNavigation() {
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'breadcrumb desktop-only';
    breadcrumb.style.cssText = `
      padding: 8px 16px;
      font-size: 14px;
      color: var(--muted);
      border-bottom: 1px solid var(--line);
    `;
    
    const appbar = document.querySelector('.appbar');
    if (appbar) {
      appbar.insertAdjacentElement('afterend', breadcrumb);
    }
    
    // Update breadcrumb on navigation
    this.updateBreadcrumb();
    
    // Listen for route changes
    window.addEventListener('hashchange', () => {
      this.updateBreadcrumb();
    });
  }
  
  updateBreadcrumb() {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;
    
    const currentTab = document.querySelector('.tabbtn[aria-current="page"]');
    if (currentTab) {
      const tabText = currentTab.querySelector('span').textContent;
      breadcrumb.innerHTML = `หน้าหลัก > ${tabText}`;
    }
  }
  
  addShortcutIndicators() {
    // Add keyboard shortcut indicators to buttons and menu items
    const shortcutMap = {
      '[data-route="home"]': 'Ctrl+1',
      '[data-route="purchase"]': 'Ctrl+2',
      '[data-route="sale"]': 'Ctrl+3',
      '[data-route="menu"]': 'Ctrl+4',
      '[data-route="reports"]': 'Ctrl+5'
    };
    
    Object.entries(shortcutMap).forEach(([selector, shortcut]) => {
      const element = document.querySelector(selector);
      if (element) {
        element.title = `${element.title || element.textContent} (${shortcut})`;
      }
    });
  }
  
  normalizeShortcutKey(key) {
    return key.toLowerCase().replace(/\s+/g, '');
  }
  
  getShortcutKey(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (e.metaKey) parts.push('meta');
    
    const key = e.key.toLowerCase();
    if (key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta') {
      parts.push(key);
    }
    
    return parts.join('+');
  }
  
  // Context menu action implementations
  addToFavorites(element) {
    try {
      const favorites = JSON.parse(localStorage.getItem('pos-favorites') || '[]');
      const item = {
        id: element.id || Date.now().toString(),
        route: element.dataset.route,
        title: element.querySelector('.title')?.textContent || element.textContent.trim(),
        timestamp: Date.now()
      };
      
      if (!favorites.find(fav => fav.route === item.route)) {
        favorites.push(item);
        localStorage.setItem('pos-favorites', JSON.stringify(favorites));
        this.showToast('เพิ่มในรายการโปรดแล้ว');
      } else {
        this.showToast('มีในรายการโปรดอยู่แล้ว');
      }
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      this.showToast('ไม่สามารถเพิ่มในรายการโปรดได้');
    }
  }
  
  copyElementLink(element) {
    if (navigator.clipboard && element.dataset.route) {
      const url = `${window.location.origin}${window.location.pathname}#${element.dataset.route}`;
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('คัดลอกลิงก์แล้ว');
      }).catch(() => {
        this.showToast('ไม่สามารถคัดลอกลิงก์ได้');
      });
    }
  }
  
  copyElementContent(element) {
    if (navigator.clipboard) {
      const text = element.textContent || element.value || '';
      if (text.trim()) {
        navigator.clipboard.writeText(text.trim()).then(() => {
          this.showToast('คัดลอกข้อความแล้ว');
        }).catch(() => {
          this.showToast('ไม่สามารถคัดลอกได้');
        });
      }
    }
  }
  
  pasteToElement(element) {
    if (navigator.clipboard && element.matches('input, textarea')) {
      navigator.clipboard.readText().then(text => {
        element.value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        this.showToast('วางข้อความแล้ว');
      }).catch(() => {
        this.showToast('ไม่สามารถวางข้อความได้');
      });
    }
  }
  
  resetElement(element) {
    if (element.matches('form')) {
      element.reset();
      this.showToast('รีเซ็ตฟอร์มแล้ว');
    } else if (element.matches('input, textarea, select')) {
      const oldValue = element.value;
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      if (oldValue) {
        this.showToast('ล้างข้อมูลแล้ว');
      }
    }
  }
  
  editElement(element) {
    // Find the closest editable element or trigger edit mode
    const editableElement = element.closest('[data-editable]') || 
                           element.querySelector('input, textarea, select') ||
                           element.closest('.card').querySelector('input, textarea, select');
    
    if (editableElement) {
      editableElement.focus();
      if (editableElement.select) {
        editableElement.select();
      }
      this.showToast('เข้าสู่โหมดแก้ไข');
    } else {
      this.showToast('ไม่สามารถแก้ไขรายการนี้ได้');
    }
  }
  
  deleteElement(element) {
    const itemName = element.querySelector('.title')?.textContent || 
                    element.textContent.trim().substring(0, 30) || 'รายการนี้';
    
    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบ "${itemName}"?`)) {
      // Add fade out animation
      element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      element.style.opacity = '0';
      element.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        element.remove();
        this.showToast('ลบรายการแล้ว');
      }, 300);
    }
  }
  
  exportElement(element) {
    try {
      // Try to find export functionality in the element or its parent
      const exportBtn = element.querySelector('[onclick*="export"]') ||
                       element.closest('.card').querySelector('[onclick*="export"]') ||
                       document.querySelector('#exportBtn');
      
      if (exportBtn) {
        exportBtn.click();
      } else {
        // Fallback: export element content as text
        const content = this.extractElementContent(element);
        this.downloadAsFile(content, 'export.txt', 'text/plain');
        this.showToast('ส่งออกข้อมูลแล้ว');
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.showToast('ไม่สามารถส่งออกได้');
    }
  }
  
  printElement(element) {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      const content = this.extractElementContent(element);
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>พิมพ์ - POS ร้านกุ้งแซ่บ</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: 'Sarabun', system-ui, sans-serif; 
                margin: 20px; 
                line-height: 1.6;
                color: #333;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 16px 0;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 8px 12px; 
                text-align: left; 
              }
              th {
                background: #f5f5f5;
                font-weight: 600;
              }
              .header {
                text-align: center;
                margin-bottom: 24px;
                border-bottom: 2px solid #0f766e;
                padding-bottom: 16px;
              }
              .title {
                font-size: 24px;
                font-weight: 700;
                color: #0f766e;
                margin: 0;
              }
              .subtitle {
                color: #666;
                margin: 8px 0 0 0;
              }
              .content {
                margin: 20px 0;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 16px;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">POS ร้านกุ้งแซ่บ</h1>
              <p class="subtitle">พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>สร้างโดยระบบ POS ร้านกุ้งแซ่บ</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      }, 500);
      
      this.showToast('เตรียมพิมพ์...');
    } catch (error) {
      console.error('Print failed:', error);
      this.showToast('ไม่สามารถพิมพ์ได้');
    }
  }
  
  refreshElement(element) {
    // Add loading state
    const originalContent = element.innerHTML;
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
    
    // Find and trigger refresh functionality
    const refreshBtn = element.querySelector('[onclick*="refresh"]') ||
                      element.closest('.card').querySelector('[onclick*="refresh"]') ||
                      document.querySelector('#syncBtn');
    
    if (refreshBtn) {
      refreshBtn.click();
    } else {
      // Fallback: simulate refresh
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        this.showToast('รีเฟรชแล้ว');
      }, 1000);
    }
  }
  
  expandElement(element) {
    element.classList.toggle('expanded');
    const isExpanded = element.classList.contains('expanded');
    
    if (isExpanded) {
      element.style.transform = 'scale(1.02)';
      element.style.zIndex = '10';
      element.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
      this.showToast('ขยายแล้ว');
    } else {
      element.style.transform = '';
      element.style.zIndex = '';
      element.style.boxShadow = '';
      this.showToast('ย่อแล้ว');
    }
  }
  
  hideElement(element) {
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    element.style.opacity = '0';
    element.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      element.style.display = 'none';
      this.showToast('ซ่อนรายการแล้ว');
    }, 300);
  }
  
  // Helper methods
  extractElementContent(element) {
    // Clone element to avoid modifying original
    const clone = element.cloneNode(true);
    
    // Remove action buttons and non-content elements
    const actionsToRemove = clone.querySelectorAll('.btn, .card-actions, .new-window-btn, script, style');
    actionsToRemove.forEach(el => el.remove());
    
    // Clean up classes for better printing
    clone.classList.remove('desktop-hover', 'tablet-card-enhanced');
    
    return clone.outerHTML;
  }
  
  downloadAsFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  showToast(message) {
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast(message);
    } else if (window.toast) {
      window.toast(message);
    } else {
      console.log('[DesktopEnhancement]', message);
    }
  }
  
  // Utility methods
  showNewItemDialog() {
    // Implementation for new item dialog
    console.log('Showing new item dialog');
  }
  
  saveCurrentForm() {
    const activeForm = document.querySelector('form:focus-within') || 
                     document.querySelector('.card:focus-within');
    if (activeForm) {
      const saveBtn = activeForm.querySelector('.btn.brand');
      if (saveBtn) {
        saveBtn.click();
      }
    }
  }
  
  focusSearchField() {
    const searchField = document.querySelector('input[type="search"], input[placeholder*="ค้นหา"]');
    if (searchField) {
      searchField.focus();
    }
  }
  
  refreshCurrentScreen() {
    const activeScreen = document.querySelector('[id$="-screen"]:not(.hide)');
    if (activeScreen) {
      // Trigger refresh for current screen
      const refreshBtn = activeScreen.querySelector('.btn[onclick*="refresh"]');
      if (refreshBtn) {
        refreshBtn.click();
      }
    }
  }
  
  handleWindowMessage(data) {
    // Handle messages from child windows
    console.log('Received window message:', data);
  }
  
  disable() {
    if (!this.initialized) return;
    
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    
    document.body.classList.remove('desktop-enhanced', 'hover-enabled');
    
    this.initialized = false;
  }
  
  destroy() {
    this.disable();
    
    // Close child windows
    this.childWindows.forEach(win => {
      if (!win.closed) {
        win.close();
      }
    });
    
    this.shortcuts.clear();
    this.contextMenus.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DesktopEnhancementManager;
} else {
  window.DesktopEnhancementManager = DesktopEnhancementManager;
}