/**
 * Responsive Layout Components
 * Mobile-first, adaptive, and performance-optimized layouts
 */

import { createElement } from '../utils/dom.js';
import { debounce, throttle } from '../utils/utils.js';

/**
 * Grid Layout Component
 */
export class Grid {
  constructor(options = {}) {
    this.options = {
      columns: 'auto', // auto, 1-12, or responsive object
      gap: 'md', // xs, sm, md, lg, xl
      autoFit: false,
      autoFill: false,
      minColumnWidth: 280,
      maxColumnWidth: null,
      className: '',
      ...options
    };

    this.element = null;
    this.resizeObserver = null;
  }

  /**
   * Create grid element
   * @returns {HTMLElement} Grid element
   */
  render() {
    const grid = createElement('div', {
      className: this.getGridClasses()
    });

    // Set custom properties for responsive behavior
    this.setGridProperties(grid);

    this.element = grid;
    return grid;
  }

  /**
   * Get grid CSS classes
   * @returns {string} CSS classes
   */
  getGridClasses() {
    const classes = ['grid'];

    // Gap
    classes.push(`gap-${this.options.gap}`);

    // Auto-fit/auto-fill
    if (this.options.autoFit) {
      classes.push('grid-auto-fit');
    } else if (this.options.autoFill) {
      classes.push('grid-auto-fill');
    }

    // Columns
    if (typeof this.options.columns === 'string' && this.options.columns !== 'auto') {
      classes.push(`grid-cols-${this.options.columns}`);
    } else if (typeof this.options.columns === 'object') {
      // Responsive columns
      Object.entries(this.options.columns).forEach(([breakpoint, cols]) => {
        classes.push(`grid-cols-${breakpoint}-${cols}`);
      });
    }

    // Custom classes
    if (this.options.className) {
      classes.push(this.options.className);
    }

    return classes.join(' ');
  }

  /**
   * Set grid custom properties
   * @param {HTMLElement} grid - Grid element
   */
  setGridProperties(grid) {
    if (this.options.minColumnWidth) {
      grid.style.setProperty('--grid-min-width', `${this.options.minColumnWidth}px`);
    }

    if (this.options.maxColumnWidth) {
      grid.style.setProperty('--grid-max-width', `${this.options.maxColumnWidth}px`);
    }
  }

  /**
   * Update responsive columns
   * @param {Object} columns - Responsive column configuration
   */
  updateColumns(columns) {
    this.options.columns = columns;
    if (this.element) {
      this.element.className = this.getGridClasses();
    }
  }

  /**
   * Add item to grid
   * @param {HTMLElement} item - Item to add
   */
  addItem(item) {
    if (this.element && item) {
      this.element.appendChild(item);
    }
  }

  /**
   * Remove all items from grid
   */
  clearItems() {
    if (this.element) {
      this.element.innerHTML = '';
    }
  }
}

/**
 * Flex Layout Component
 */
export class Flex {
  constructor(options = {}) {
    this.options = {
      direction: 'row', // row, column, row-reverse, column-reverse
      wrap: 'nowrap', // wrap, nowrap, wrap-reverse
      justify: 'start', // start, center, end, between, around, evenly
      align: 'stretch', // start, center, end, stretch, baseline
      gap: 'md', // xs, sm, md, lg, xl
      responsive: false, // Enable responsive behavior
      className: '',
      ...options
    };

    this.element = null;
    this.breakpoint = 'md';
    this.resizeObserver = null;
  }

  /**
   * Create flex element
   * @returns {HTMLElement} Flex element
   */
  render() {
    const flex = createElement('div', {
      className: this.getFlexClasses()
    });

    this.element = flex;

    // Setup responsive behavior
    if (this.options.responsive) {
      this.setupResponsiveBehavior();
    }

    return flex;
  }

  /**
   * Get flex CSS classes
   * @returns {string} CSS classes
   */
  getFlexClasses() {
    const classes = ['flex'];

    // Direction
    if (this.options.direction !== 'row') {
      classes.push(`flex-${this.options.direction}`);
    }

    // Wrap
    if (this.options.wrap !== 'nowrap') {
      classes.push(`flex-${this.options.wrap}`);
    }

    // Justify content
    if (this.options.justify !== 'start') {
      classes.push(`justify-${this.options.justify}`);
    }

    // Align items
    if (this.options.align !== 'stretch') {
      classes.push(`items-${this.options.align}`);
    }

    // Gap
    classes.push(`gap-${this.options.gap}`);

    // Responsive classes
    if (this.options.responsive) {
      classes.push(...this.getResponsiveClasses());
    }

    // Custom classes
    if (this.options.className) {
      classes.push(this.options.className);
    }

    return classes.join(' ');
  }

  /**
   * Get responsive classes
   * @returns {Array} Responsive CSS classes
   */
  getResponsiveClasses() {
    const classes = [];

    if (this.options.responsive.mobile) {
      classes.push('flex-col', 'flex-md-row');
    }

    if (this.options.responsive.tablet) {
      classes.push('flex-md-col', 'flex-lg-row');
    }

    return classes;
  }

  /**
   * Setup responsive behavior
   */
  setupResponsiveBehavior() {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const oldBreakpoint = this.breakpoint;

      if (width < 640) {
        this.breakpoint = 'sm';
      } else if (width < 768) {
        this.breakpoint = 'md';
      } else if (width < 1024) {
        this.breakpoint = 'lg';
      } else {
        this.breakpoint = 'xl';
      }

      if (oldBreakpoint !== this.breakpoint) {
        this.updateForBreakpoint();
      }
    };

    const debouncedUpdate = debounce(updateBreakpoint, 150);
    window.addEventListener('resize', debouncedUpdate);
    updateBreakpoint();
  }

  /**
   * Update layout for current breakpoint
   */
  updateForBreakpoint() {
    if (!this.element) return;

    // Apply breakpoint-specific classes
    this.element.className = this.getFlexClasses();

    // Emit breakpoint change event
    this.emit('breakpointChange', { breakpoint: this.breakpoint });
  }

  /**
   * Add item to flex container
   * @param {HTMLElement} item - Item to add
   * @param {Object} options - Item options
   */
  addItem(item, options = {}) {
    if (this.element && item) {
      const wrapper = createElement('div', {
        className: `flex-item ${options.className || ''}`
      });

      if (options.flex) {
        wrapper.style.flex = options.flex;
      }

      if (options.order) {
        wrapper.style.order = options.order;
      }

      wrapper.appendChild(item);
      this.element.appendChild(wrapper);
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    this.element?.dispatchEvent(customEvent);
  }
}

/**
 * Container Component
 */
export class Container {
  constructor(options = {}) {
    this.options = {
      size: 'fluid', // xs, sm, md, lg, xl, 2xl, fluid
      center: true,
      padding: 'md', // xs, sm, md, lg, xl, none
      responsive: false,
      className: '',
      ...options
    };

    this.element = null;
  }

  /**
   * Create container element
   * @returns {HTMLElement} Container element
   */
  render() {
    const container = createElement('div', {
      className: this.getContainerClasses()
    });

    this.element = container;
    return container;
  }

  /**
   * Get container CSS classes
   * @returns {string} CSS classes
   */
  getContainerClasses() {
    const classes = [];

    // Container size
    if (this.options.size === 'fluid') {
      classes.push('container-fluid');
    } else {
      classes.push('container');
      if (this.options.size !== 'lg') {
        classes.push(`container-${this.options.size}`);
      }
    }

    // Center alignment
    if (this.options.center) {
      classes.push('mx-auto');
    }

    // Padding
    if (this.options.padding !== 'md') {
      if (this.options.padding === 'none') {
        classes.push('px-0');
      } else {
        classes.push(`px-${this.options.padding}`);
      }
    }

    // Responsive behavior
    if (this.options.responsive) {
      classes.push('container-responsive');
    }

    // Custom classes
    if (this.options.className) {
      classes.push(this.options.className);
    }

    return classes.join(' ');
  }
}

/**
 * Sidebar Layout Component
 */
export class Sidebar {
  constructor(options = {}) {
    this.options = {
      position: 'left', // left, right
      width: '280px', // CSS width value
      collapsible: true,
      collapsed: false,
      overlay: true,
      pushContent: true,
      breakpoint: 'md', // Breakpoint for auto-collapse
      className: '',
      onToggle: null,
      ...options
    };

    this.element = null;
    this.sidebarElement = null;
    this.contentElement = null;
    this.overlayElement = null;
    this.isOpen = !this.options.collapsed;
    this.isMobile = window.innerWidth < 768;
    this.boundHandlers = {};
  }

  /**
   * Create sidebar layout
   * @returns {HTMLElement} Layout element
   */
  render() {
    const layout = createElement('div', {
      className: `sidebar-layout ${this.options.position === 'right' ? 'sidebar-right' : 'sidebar-left'} ${this.options.className}`
    });

    // Create sidebar
    this.sidebarElement = createElement('aside', {
      className: this.getSidebarClasses(),
      style: { width: this.options.width }
    });

    // Create content area
    this.contentElement = createElement('main', {
      className: 'sidebar-content'
    });

    // Create overlay
    if (this.options.overlay) {
      this.overlayElement = createElement('div', {
        className: 'sidebar-overlay',
        style: { display: 'none' }
      });
    }

    // Assemble layout
    if (this.options.position === 'right') {
      layout.appendChild(this.contentElement);
      layout.appendChild(this.sidebarElement);
    } else {
      layout.appendChild(this.sidebarElement);
      layout.appendChild(this.contentElement);
    }

    if (this.overlayElement) {
      layout.appendChild(this.overlayElement);
    }

    this.element = layout;
    this.setupEventListeners();
    this.updateLayout();

    return layout;
  }

  /**
   * Get sidebar CSS classes
   * @returns {string} CSS classes
   */
  getSidebarClasses() {
    const classes = ['sidebar'];

    if (!this.isOpen) {
      classes.push('sidebar-collapsed');
    }

    if (this.isMobile) {
      classes.push('sidebar-mobile');
    }

    return classes.join(' ');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Window resize handler
    const handleResize = throttle(() => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 768;

      if (wasMobile !== this.isMobile) {
        this.updateLayout();
      }
    }, 150);

    window.addEventListener('resize', handleResize);
    this.boundHandlers.resize = handleResize;

    // Overlay click handler
    if (this.overlayElement) {
      this.boundHandlers.overlayClick = () => {
        if (this.isMobile) {
          this.close();
        }
      };
      this.overlayElement.addEventListener('click', this.boundHandlers.overlayClick);
    }

    // Touch events for mobile
    if ('ontouchstart' in window) {
      this.setupTouchGestures();
    }

    // Keyboard navigation
    this.boundHandlers.keydown = (event) => {
      if (event.key === 'Escape' && this.isOpen && this.isMobile) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.boundHandlers.keydown);
  }

  /**
   * Setup touch gestures
   */
  setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event) => {
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchEndY - touchStartY);

      // Only handle horizontal swipes
      if (Math.abs(deltaX) > 50 && deltaY < 100) {
        if (this.options.position === 'left') {
          if (deltaX > 0) {
            this.open();
          } else {
            this.close();
          }
        } else {
          if (deltaX < 0) {
            this.open();
          } else {
            this.close();
          }
        }
      }
    };

    this.element.addEventListener('touchstart', handleTouchStart);
    this.element.addEventListener('touchend', handleTouchEnd);
  }

  /**
   * Update layout based on state
   */
  updateLayout() {
    if (!this.element) return;

    const sidebar = this.sidebarElement;
    const content = this.contentElement;
    const overlay = this.overlayElement;

    // Update sidebar classes
    sidebar.className = this.getSidebarClasses();

    // Update content margin
    if (this.options.pushContent && !this.isMobile) {
      if (this.isOpen) {
        content.style.marginLeft = this.options.position === 'left' ? this.options.width : '0';
        content.style.marginRight = this.options.position === 'right' ? this.options.width : '0';
      } else {
        content.style.marginLeft = '0';
        content.style.marginRight = '0';
      }
    } else {
      content.style.marginLeft = '0';
      content.style.marginRight = '0';
    }

    // Update overlay
    if (overlay) {
      overlay.style.display = (this.isOpen && this.isMobile) ? 'block' : 'none';
    }

    // Emit layout update event
    this.emit('layoutUpdate', {
      isOpen: this.isOpen,
      isMobile: this.isMobile
    });
  }

  /**
   * Open sidebar
   */
  open() {
    this.isOpen = true;
    this.updateLayout();
    this.emit('toggle', { isOpen: true });

    if (this.options.onToggle) {
      this.options.onToggle(true);
    }
  }

  /**
   * Close sidebar
   */
  close() {
    this.isOpen = false;
    this.updateLayout();
    this.emit('toggle', { isOpen: false });

    if (this.options.onToggle) {
      this.options.onToggle(false);
    }
  }

  /**
   * Toggle sidebar
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Set sidebar content
   * @param {HTMLElement|string} content - Content to set
   */
  setSidebarContent(content) {
    if (this.sidebarElement) {
      this.sidebarElement.innerHTML = '';
      if (typeof content === 'string') {
        this.sidebarElement.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.sidebarElement.appendChild(content);
      }
    }
  }

  /**
   * Set main content
   * @param {HTMLElement|string} content - Content to set
   */
  setContent(content) {
    if (this.contentElement) {
      this.contentElement.innerHTML = '';
      if (typeof content === 'string') {
        this.contentElement.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.contentElement.appendChild(content);
      }
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    this.element?.dispatchEvent(customEvent);
  }

  /**
   * Destroy sidebar
   */
  destroy() {
    // Remove event listeners
    if (this.boundHandlers.resize) {
      window.removeEventListener('resize', this.boundHandlers.resize);
    }
    if (this.boundHandlers.overlayClick && this.overlayElement) {
      this.overlayElement.removeEventListener('click', this.boundHandlers.overlayClick);
    }
    if (this.boundHandlers.keydown) {
      document.removeEventListener('keydown', this.boundHandlers.keydown);
    }

    // Clean up references
    this.element = null;
    this.sidebarElement = null;
    this.contentElement = null;
    this.overlayElement = null;
    this.boundHandlers = {};
  }
}

/**
 * Responsive Tabs Component
 */
export class Tabs {
  constructor(options = {}) {
    this.options = {
      tabs: [],
      activeTab: 0,
      vertical: false,
      responsive: true,
      scrollable: false,
      className: '',
      onChange: null,
      ...options
    };

    this.element = null;
    this.activeIndex = this.options.activeTab;
    this.tabPanels = [];
    this.tabButtons = [];
  }

  /**
   * Create tabs element
   * @returns {HTMLElement} Tabs element
   */
  render() {
    const container = createElement('div', {
      className: `tabs ${this.options.vertical ? 'tabs-vertical' : 'tabs-horizontal'} ${this.options.className}`
    });

    // Create tab navigation
    const tabNavigation = createElement('div', {
      className: `tabs-nav ${this.options.scrollable ? 'tabs-nav-scrollable' : ''} ${this.options.responsive ? 'tabs-nav-responsive' : ''}`,
      role: 'tablist'
    });

    // Create tab list
    const tabList = createElement('div', {
      className: 'tabs-list'
    });

    // Create tab buttons
    this.options.tabs.forEach((tab, index) => {
      const tabButton = createElement('button', {
        type: 'button',
        className: `tabs-tab ${index === this.activeIndex ? 'active' : ''}`,
        role: 'tab',
        'aria-selected': index === this.activeIndex,
        'aria-controls': `tab-panel-${index}`,
        id: `tab-${index}`
      });

      tabButton.innerHTML = `
        ${tab.icon ? `<span class="tabs-tab-icon">${tab.icon}</span>` : ''}
        <span class="tabs-tab-label">${tab.label || `Tab ${index + 1}`}</span>
        ${tab.badge ? `<span class="tabs-tab-badge">${tab.badge}</span>` : ''}
      `;

      tabButton.addEventListener('click', () => this.setActiveTab(index));
      tabList.appendChild(tabButton);
      this.tabButtons.push(tabButton);
    });

    tabNavigation.appendChild(tabList);

    // Create tab panels container
    const panelsContainer = createElement('div', {
      className: 'tabs-panels'
    });

    // Create tab panels
    this.options.tabs.forEach((tab, index) => {
      const panel = createElement('div', {
        className: `tabs-panel ${index === this.activeIndex ? 'active' : ''}`,
        role: 'tabpanel',
        'aria-labelledby': `tab-${index}`,
        id: `tab-panel-${index}`,
        style: { display: index === this.activeIndex ? 'block' : 'none' }
      });

      if (typeof tab.content === 'string') {
        panel.innerHTML = tab.content;
      } else if (tab.content instanceof HTMLElement) {
        panel.appendChild(tab.content);
      } else if (typeof tab.content === 'function') {
        const content = tab.content();
        if (content instanceof HTMLElement) {
          panel.appendChild(content);
        }
      }

      panelsContainer.appendChild(panel);
      this.tabPanels.push(panel);
    });

    container.appendChild(tabNavigation);
    container.appendChild(panelsContainer);

    this.element = container;

    // Setup responsive behavior
    if (this.options.responsive) {
      this.setupResponsiveTabs();
    }

    return container;
  }

  /**
   * Setup responsive tab behavior
   */
  setupResponsiveTabs() {
    const handleResize = debounce(() => {
      const isMobile = window.innerWidth < 768;

      if (isMobile && !this.options.vertical) {
        this.convertToDropdown();
      } else {
        this.convertToTabs();
      }
    }, 150);

    window.addEventListener('resize', handleResize);
    handleResize();
  }

  /**
   * Convert tabs to dropdown for mobile
   */
  convertToDropdown() {
    const tabNavigation = this.element.querySelector('.tabs-nav');

    if (!tabNavigation.classList.contains('tabs-dropdown')) {
      // Create dropdown
      const dropdown = createElement('select', {
        className: 'form-select tabs-dropdown',
        'aria-label': 'Select tab'
      });

      this.options.tabs.forEach((tab, index) => {
        const option = createElement('option', {
          value: index,
          selected: index === this.activeIndex
        });
        option.textContent = tab.label || `Tab ${index + 1}`;
        dropdown.appendChild(option);
      });

      dropdown.addEventListener('change', (event) => {
        this.setActiveTab(parseInt(event.target.value));
      });

      // Replace tab navigation with dropdown
      tabNavigation.innerHTML = '';
      tabNavigation.classList.add('tabs-dropdown');
      tabNavigation.appendChild(dropdown);
    }
  }

  /**
   * Convert dropdown back to tabs
   */
  convertToTabs() {
    const tabNavigation = this.element.querySelector('.tabs-nav');

    if (tabNavigation.classList.contains('tabs-dropdown')) {
      // Recreate tab navigation
      const tabList = createElement('div', {
        className: 'tabs-list'
      });

      this.tabButtons.forEach((button, index) => {
        button.className = `tabs-tab ${index === this.activeIndex ? 'active' : ''}`;
        button.setAttribute('aria-selected', index === this.activeIndex);
        tabList.appendChild(button);
      });

      tabNavigation.innerHTML = '';
      tabNavigation.classList.remove('tabs-dropdown');
      tabNavigation.appendChild(tabList);
    }
  }

  /**
   * Set active tab
   * @param {number} index - Tab index to activate
   */
  setActiveTab(index) {
    if (index < 0 || index >= this.options.tabs.length || index === this.activeIndex) {
      return;
    }

    // Update previous active tab
    if (this.tabButtons[this.activeIndex]) {
      this.tabButtons[this.activeIndex].classList.remove('active');
      this.tabButtons[this.activeIndex].setAttribute('aria-selected', 'false');
    }
    if (this.tabPanels[this.activeIndex]) {
      this.tabPanels[this.activeIndex].classList.remove('active');
      this.tabPanels[this.activeIndex].style.display = 'none';
    }

    // Update new active tab
    this.activeIndex = index;
    this.tabButtons[index].classList.add('active');
    this.tabButtons[index].setAttribute('aria-selected', 'true');
    this.tabPanels[index].classList.add('active');
    this.tabPanels[index].style.display = 'block';

    // Emit change event
    this.emit('change', {
      activeIndex: index,
      activeTab: this.options.tabs[index],
      previousIndex: this.activeIndex
    });

    if (this.options.onChange) {
      this.options.onChange(index, this.options.tabs[index]);
    }
  }

  /**
   * Get active tab index
   * @returns {number} Active tab index
   */
  getActiveTab() {
    return this.activeIndex;
  }

  /**
   * Add new tab
   * @param {Object} tab - Tab configuration
   */
  addTab(tab) {
    this.options.tabs.push(tab);

    // Re-render if element exists
    if (this.element) {
      // This is a simplified implementation
      // In production, you'd want to add without full re-render
      this.render();
    }
  }

  /**
   * Remove tab
   * @param {number} index - Tab index to remove
   */
  removeTab(index) {
    if (index >= 0 && index < this.options.tabs.length) {
      this.options.tabs.splice(index, 1);

      // Adjust active index if needed
      if (this.activeIndex >= index) {
        this.activeIndex = Math.max(0, this.activeIndex - 1);
      }

      // Re-render if element exists
      if (this.element) {
        this.render();
      }
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    this.element?.dispatchEvent(customEvent);
  }
}

// Layout factory functions
export function createResponsiveGrid(options = {}) {
  return new Grid({
    autoFit: true,
    minColumnWidth: 280,
    gap: 'md',
    responsive: true,
    ...options
  });
}

export function createMobileFirstLayout(options = {}) {
  return new Flex({
    direction: 'column',
    responsive: {
      mobile: true
    },
    gap: 'md',
    ...options
  });
}

export function createSidebarLayout(sidebarOptions = {}, contentOptions = {}) {
  return new Sidebar({
    width: '280px',
    collapsible: true,
    breakpoint: 'md',
    ...sidebarOptions
  });
}

export function createTabContainer(tabs, options = {}) {
  return new Tabs({
    tabs,
    responsive: true,
    scrollable: true,
    ...options
  });
}

export default {
  Grid,
  Flex,
  Container,
  Sidebar,
  Tabs,
  createResponsiveGrid,
  createMobileFirstLayout,
  createSidebarLayout,
  createTabContainer
};
