/**
 * Responsive Layout Manager
 * Manages responsive layout behavior, device-specific optimizations,
 * and dynamic layout adjustments based on screen size and device capabilities
 */

class ResponsiveLayoutManager {
  constructor() {
    this.deviceManager = null;
    this.desktopEnhancementManager = null;
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.layoutObservers = new Map();
    this.initialized = false;
    
    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
    
    this.init();
  }
  
  init() {
    if (this.initialized) return;
    
    // Initialize device manager if available
    if (window.DeviceManager) {
      this.deviceManager = new DeviceManager();
    }
    
    // Initialize desktop enhancements if on desktop
    if (window.DeviceManager && this.deviceManager.isDesktop()) {
      if (window.DesktopEnhancementManager) {
        this.desktopEnhancementManager = new DesktopEnhancementManager();
      }
    }
    
    // Set up responsive layout classes
    this.updateLayoutClasses();
    
    // Initialize layout observers
    this.initializeLayoutObservers();
    
    // Set up event listeners
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('orientationchange', this.handleOrientationChange, { passive: true });
    
    // Listen for device manager events
    window.addEventListener('deviceResize', this.handleDeviceResize.bind(this));
    window.addEventListener('orientationChanged', this.handleOrientationChanged.bind(this));
    
    // Initialize responsive components
    this.initializeResponsiveComponents();
    
    this.initialized = true;
    console.log('[ResponsiveLayoutManager] Initialized for breakpoint:', this.currentBreakpoint);
  }
  
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width <= 480) return 'mobile';
    if (width <= 1024) return 'tablet';
    if (width <= 1440) return 'desktop';
    return 'large-desktop';
  }
  
  updateLayoutClasses() {
    const body = document.body;
    const html = document.documentElement;
    
    // Remove existing breakpoint classes
    const existingClasses = Array.from(body.classList).filter(cls => 
      cls.startsWith('bp-') || cls.startsWith('layout-')
    );
    body.classList.remove(...existingClasses);
    
    // Add current breakpoint class
    body.classList.add(`bp-${this.currentBreakpoint}`);
    
    // Add layout-specific classes
    if (this.currentBreakpoint === 'mobile') {
      body.classList.add('layout-mobile', 'layout-touch');
    } else if (this.currentBreakpoint === 'tablet') {
      body.classList.add('layout-tablet', 'layout-touch', 'layout-hover');
    } else {
      body.classList.add('layout-desktop', 'layout-hover', 'layout-keyboard');
    }
    
    // Set CSS custom properties for layout
    html.style.setProperty('--current-breakpoint', this.currentBreakpoint);
    html.style.setProperty('--is-mobile', this.currentBreakpoint === 'mobile' ? '1' : '0');
    html.style.setProperty('--is-tablet', this.currentBreakpoint === 'tablet' ? '1' : '0');
    html.style.setProperty('--is-desktop', this.currentBreakpoint === 'desktop' || this.currentBreakpoint === 'large-desktop' ? '1' : '0');
  }
  
  initializeLayoutObservers() {
    // Intersection Observer for lazy layout initialization
    if ('IntersectionObserver' in window) {
      this.setupLazyLayoutObserver();
    }
    
    // Resize Observer for container queries fallback
    if ('ResizeObserver' in window) {
      this.setupContainerObserver();
    }
  }
  
  setupLazyLayoutObserver() {
    const lazyLayoutElements = document.querySelectorAll('[data-lazy-layout]');
    if (lazyLayoutElements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const layoutType = element.dataset.lazyLayout;
          this.initializeElementLayout(element, layoutType);
          observer.unobserve(element);
        }
      });
    }, {
      rootMargin: '100px'
    });
    
    lazyLayoutElements.forEach(el => observer.observe(el));
    this.layoutObservers.set('intersection', observer);
  }
  
  setupContainerObserver() {
    const containerElements = document.querySelectorAll('.container-responsive');
    if (containerElements.length === 0) return;
    
    const observer = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target;
        const width = entry.contentRect.width;
        
        // Update container size classes
        element.classList.remove('container-sm', 'container-md', 'container-lg', 'container-xl');
        
        if (width >= 1200) element.classList.add('container-xl');
        else if (width >= 992) element.classList.add('container-lg');
        else if (width >= 768) element.classList.add('container-md');
        else if (width >= 576) element.classList.add('container-sm');
        
        // Trigger custom event
        element.dispatchEvent(new CustomEvent('containerResize', {
          detail: { width, element }
        }));
      });
    });
    
    containerElements.forEach(el => observer.observe(el));
    this.layoutObservers.set('resize', observer);
  }
  
  initializeResponsiveComponents() {
    // Initialize responsive navigation
    this.initializeResponsiveNavigation();
    
    // Initialize responsive tables
    this.initializeResponsiveTables();
    
    // Initialize responsive forms
    this.initializeResponsiveForms();
    
    // Initialize responsive grids
    this.initializeResponsiveGrids();
    
    // Initialize responsive cards
    this.initializeResponsiveCards();
  }
  
  initializeResponsiveNavigation() {
    const tabbar = document.querySelector('.tabbar');
    if (!tabbar) return;
    
    // Add responsive classes based on breakpoint
    tabbar.classList.remove('mobile-nav', 'tablet-nav', 'desktop-nav');
    
    if (this.currentBreakpoint === 'mobile') {
      tabbar.classList.add('mobile-nav');
    } else if (this.currentBreakpoint === 'tablet') {
      tabbar.classList.add('tablet-nav', 'tablet-nav-enhanced');
    } else {
      tabbar.classList.add('desktop-nav', 'desktop-horizontal');
    }
    
    // Initialize swipe gestures for mobile/tablet
    if (this.currentBreakpoint === 'mobile' || this.currentBreakpoint === 'tablet') {
      this.initializeSwipeNavigation(tabbar);
    }
  }
  
  initializeSwipeNavigation(tabbar) {
    let startX = 0;
    let startY = 0;
    let isSwipe = false;
    
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwipe = false;
    };
    
    const handleTouchMove = (e) => {
      if (!startX || !startY) return;
      
      const diffX = Math.abs(e.touches[0].clientX - startX);
      const diffY = Math.abs(e.touches[0].clientY - startY);
      
      if (diffX > diffY && diffX > 50) {
        isSwipe = true;
      }
    };
    
    const handleTouchEnd = (e) => {
      if (!isSwipe || !startX) return;
      
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      
      if (Math.abs(diff) > 50) {
        const tabs = Array.from(tabbar.querySelectorAll('.tabbtn'));
        const activeTab = tabbar.querySelector('.tabbtn[aria-current="page"]');
        const currentIndex = tabs.indexOf(activeTab);
        
        let nextIndex = -1;
        
        if (diff > 0 && currentIndex < tabs.length - 1) {
          // Swipe left - next tab
          nextIndex = currentIndex + 1;
        } else if (diff < 0 && currentIndex > 0) {
          // Swipe right - previous tab
          nextIndex = currentIndex - 1;
        }
        
        if (nextIndex !== -1) {
          tabs[nextIndex].click();
        }
      }
      
      startX = 0;
      startY = 0;
      isSwipe = false;
    };
    
    tabbar.addEventListener('touchstart', handleTouchStart, { passive: true });
    tabbar.addEventListener('touchmove', handleTouchMove, { passive: true });
    tabbar.addEventListener('touchend', handleTouchEnd, { passive: true });
  }
  
  initializeResponsiveTables() {
    const tables = document.querySelectorAll('.table, .responsive-table');
    
    tables.forEach(table => {
      // Add responsive wrapper if not exists
      if (!table.closest('.responsive-table-container')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'responsive-table-container';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
      
      // Add data labels for mobile card view
      if (this.currentBreakpoint === 'mobile') {
        this.addTableDataLabels(table);
      }
      
      // Add tablet-specific enhancements
      if (this.currentBreakpoint === 'tablet') {
        table.classList.add('tablet-table-enhanced');
      }
    });
  }
  
  addTableDataLabels(table) {
    const headers = Array.from(table.querySelectorAll('th'));
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headers[index] && !cell.dataset.label) {
          cell.dataset.label = headers[index].textContent.trim();
        }
      });
    });
  }
  
  initializeResponsiveForms() {
    const forms = document.querySelectorAll('form, .responsive-form');
    
    forms.forEach(form => {
      // Add responsive classes
      form.classList.add('responsive-form');
      
      if (this.currentBreakpoint === 'tablet') {
        form.classList.add('tablet-form-enhanced');
        
        // Convert form rows to tablet layout
        const rows = form.querySelectorAll('.row');
        rows.forEach(row => {
          if (row.children.length > 1) {
            row.classList.add('tablet-horizontal');
          }
        });
      }
      
      // Initialize smart input behaviors
      this.initializeSmartInputs(form);
    });
  }
  
  initializeSmartInputs(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      // Add responsive input classes
      input.classList.add('responsive-input');
      
      // Tablet-specific enhancements
      if (this.currentBreakpoint === 'tablet') {
        input.classList.add('tablet-input-enhanced');
        
        // Add input groups for better layout
        const field = input.closest('.field');
        if (field && !field.classList.contains('tablet-input-group')) {
          field.classList.add('tablet-input-group');
        }
      }
      
      // Mobile-specific optimizations
      if (this.currentBreakpoint === 'mobile') {
        // Ensure proper input types for mobile keyboards
        if (input.type === 'number' || input.inputMode === 'decimal') {
          input.style.fontSize = '16px'; // Prevent zoom on iOS
        }
      }
    });
  }
  
  initializeResponsiveGrids() {
    const grids = document.querySelectorAll('.grid, .adaptive-grid');
    
    grids.forEach(grid => {
      // Add responsive grid classes
      grid.classList.add('responsive-grid');
      
      // Apply breakpoint-specific grid layouts
      if (this.currentBreakpoint === 'mobile') {
        grid.classList.add('mobile-grid');
      } else if (this.currentBreakpoint === 'tablet') {
        grid.classList.add('tablet-grid', 'tablet-card-grid');
      } else {
        grid.classList.add('desktop-grid');
      }
      
      // Initialize grid item observers
      this.initializeGridItemObserver(grid);
    });
  }
  
  initializeGridItemObserver(grid) {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const item = entry.target;
        if (entry.isIntersecting) {
          item.classList.add('grid-item-visible');
          
          // Add staggered animation delay
          const index = Array.from(grid.children).indexOf(item);
          item.style.animationDelay = `${index * 0.1}s`;
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
    
    Array.from(grid.children).forEach(item => {
      item.classList.add('grid-item');
      observer.observe(item);
    });
  }
  
  initializeResponsiveCards() {
    const cards = document.querySelectorAll('.card, .tile');
    
    cards.forEach(card => {
      // Add responsive card classes
      card.classList.add('responsive-card');
      
      if (this.currentBreakpoint === 'tablet') {
        card.classList.add('tablet-card-enhanced');
        
        // Add card actions for tablet
        this.addCardActions(card);
      }
      
      if (this.currentBreakpoint === 'desktop') {
        card.classList.add('desktop-hover');
      }
    });
  }
  
  addCardActions(card) {
    if (card.querySelector('.card-actions')) return;
    
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    
    // Add common actions
    const actionButtons = [
      { icon: '⋯', action: 'menu', title: 'เมนู' },
      { icon: '↗', action: 'expand', title: 'ขยาย' }
    ];
    
    actionButtons.forEach(({ icon, action, title }) => {
      const button = document.createElement('button');
      button.className = 'card-action';
      button.innerHTML = icon;
      button.title = title;
      button.dataset.action = action;
      
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleCardAction(card, action);
      });
      
      actions.appendChild(button);
    });
    
    card.appendChild(actions);
  }
  
  handleCardAction(card, action) {
    switch (action) {
      case 'menu':
        this.showCardMenu(card);
        break;
      case 'expand':
        this.expandCard(card);
        break;
    }
  }
  
  showCardMenu(card) {
    // Implementation for card context menu
    console.log('Showing card menu for:', card);
  }
  
  expandCard(card) {
    card.classList.toggle('expanded');
  }
  
  initializeElementLayout(element, layoutType) {
    switch (layoutType) {
      case 'grid':
        element.classList.add('adaptive-grid');
        this.initializeResponsiveGrids();
        break;
      case 'table':
        element.classList.add('responsive-table');
        this.initializeResponsiveTables();
        break;
      case 'form':
        element.classList.add('responsive-form');
        this.initializeResponsiveForms();
        break;
    }
    
    element.removeAttribute('data-lazy-layout');
  }
  
  handleResize() {
    const newBreakpoint = this.getCurrentBreakpoint();
    
    if (newBreakpoint !== this.currentBreakpoint) {
      const oldBreakpoint = this.currentBreakpoint;
      this.currentBreakpoint = newBreakpoint;
      
      this.updateLayoutClasses();
      this.reinitializeComponents(oldBreakpoint, newBreakpoint);
      
      // Emit custom event
      window.dispatchEvent(new CustomEvent('breakpointChange', {
        detail: { 
          oldBreakpoint, 
          newBreakpoint,
          width: window.innerWidth,
          height: window.innerHeight
        }
      }));
    }
  }
  
  handleOrientationChange() {
    setTimeout(() => {
      this.handleResize();
      this.updateLayoutClasses();
    }, 250);
  }
  
  handleDeviceResize(e) {
    // Handle device manager resize events
    this.handleResize();
  }
  
  handleOrientationChanged(e) {
    // Handle device manager orientation change events
    this.updateLayoutClasses();
  }
  
  reinitializeComponents(oldBreakpoint, newBreakpoint) {
    console.log(`[ResponsiveLayoutManager] Breakpoint changed: ${oldBreakpoint} → ${newBreakpoint}`);
    
    // Reinitialize components that need breakpoint-specific behavior
    this.initializeResponsiveNavigation();
    this.initializeResponsiveTables();
    this.initializeResponsiveForms();
    this.initializeResponsiveGrids();
    this.initializeResponsiveCards();
    
    // Initialize/destroy desktop enhancements
    if (newBreakpoint === 'desktop' || newBreakpoint === 'large-desktop') {
      if (!this.desktopEnhancementManager && window.DesktopEnhancementManager) {
        this.desktopEnhancementManager = new DesktopEnhancementManager();
      }
    } else if (this.desktopEnhancementManager) {
      this.desktopEnhancementManager.destroy();
      this.desktopEnhancementManager = null;
    }
  }
  
  // Public API methods
  getCurrentBreakpoint() {
    return this.currentBreakpoint;
  }
  
  isMobile() {
    return this.currentBreakpoint === 'mobile';
  }
  
  isTablet() {
    return this.currentBreakpoint === 'tablet';
  }
  
  isDesktop() {
    return this.currentBreakpoint === 'desktop' || this.currentBreakpoint === 'large-desktop';
  }
  
  getDeviceManager() {
    return this.deviceManager;
  }
  
  getDesktopEnhancementManager() {
    return this.desktopEnhancementManager;
  }
  
  // Utility methods for responsive behavior
  adaptToBreakpoint(mobileConfig, tabletConfig, desktopConfig) {
    if (this.isMobile()) return mobileConfig;
    if (this.isTablet()) return tabletConfig;
    return desktopConfig;
  }
  
  getOptimalColumns() {
    return this.adaptToBreakpoint(1, 2, 3);
  }
  
  getOptimalCardWidth() {
    return this.adaptToBreakpoint('100%', '300px', '350px');
  }
  
  getOptimalGap() {
    return this.adaptToBreakpoint('12px', '16px', '20px');
  }
  
  // Layout manipulation methods
  forceLayout(element, layoutType) {
    this.initializeElementLayout(element, layoutType);
  }
  
  refreshLayout() {
    this.initializeResponsiveComponents();
  }
  
  destroy() {
    if (!this.initialized) return;
    
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    
    // Destroy observers
    this.layoutObservers.forEach(observer => {
      observer.disconnect();
    });
    this.layoutObservers.clear();
    
    // Destroy managers
    if (this.deviceManager) {
      this.deviceManager.destroy();
    }
    
    if (this.desktopEnhancementManager) {
      this.desktopEnhancementManager.destroy();
    }
    
    this.initialized = false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveLayoutManager;
} else {
  window.ResponsiveLayoutManager = ResponsiveLayoutManager;
}