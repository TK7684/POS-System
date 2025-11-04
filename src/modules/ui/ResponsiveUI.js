/**
 * Responsive UI Management Module
 * Handles responsive behavior, touch optimization, and device adaptation
 */

import { debounce, throttle, isMobile, isTablet } from '../utils/utils.js';
import { addClass, removeClass, hasClass, toggleClass } from '../utils/dom.js';

/**
 * Responsive UI Manager
 */
export class ResponsiveUIManager {
  constructor() {
    this.breakpoints = {
      xs: 375,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    };

    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.orientation = this.getOrientation();
    this.isTouch = 'ontouchstart' in window;
    this.isHighDensity = this.getPixelRatio() > 1;

    this.listeners = new Map();
    this.state = {
      isMobile: this.currentBreakpoint < this.breakpoints.md,
      isTablet: this.currentBreakpoint >= this.breakpoints.md && this.currentBreakpoint < this.breakpoints.lg,
      isDesktop: this.currentBreakpoint >= this.breakpoints.lg,
      isLandscape: this.orientation === 'landscape',
      isPortrait: this.orientation === 'portrait'
    };

    this.init();
  }

  /**
   * Initialize responsive manager
   */
  init() {
    this.setupEventListeners();
    this.updateDeviceClasses();
    this.setupViewportOptimizations();
    this.setupTouchOptimizations();

    console.log('Responsive UI Manager initialized', {
      breakpoint: this.currentBreakpoint,
      state: this.state
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Resize handling with debouncing
    const handleResize = debounce(() => {
      this.handleResize();
    }, 150);

    // Orientation change handling
    const handleOrientationChange = () => {
      this.handleOrientationChange();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Store cleanup functions
    this.listeners.set('resize', () => {
      window.removeEventListener('resize', handleResize);
    });
    this.listeners.set('orientation', () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const oldBreakpoint = this.currentBreakpoint;
    const oldState = { ...this.state };

    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.updateState();

    // Update device classes
    this.updateDeviceClasses();

    // Emit breakpoint change if different
    if (oldBreakpoint !== this.currentBreakpoint) {
      this.emit('breakpointChange', {
        old: oldBreakpoint,
        new: this.currentBreakpoint,
        oldState,
        newState: this.state
      });
    }
  }

  /**
   * Handle orientation change
   */
  handleOrientationChange() {
    const oldOrientation = this.orientation;
    this.orientation = this.getOrientation();

    if (oldOrientation !== this.orientation) {
      this.updateState();
      this.updateDeviceClasses();

      this.emit('orientationChange', {
        old: oldOrientation,
        new: this.orientation,
        state: this.state
      });
    }
  }

  /**
   * Update state object
   */
  updateState() {
    this.state = {
      isMobile: this.currentBreakpoint < this.breakpoints.md,
      isTablet: this.currentBreakpoint >= this.breakpoints.md && this.currentBreakpoint < this.breakpoints.lg,
      isDesktop: this.currentBreakpoint >= this.breakpoints.lg,
      isLandscape: this.orientation === 'landscape',
      isPortrait: this.orientation === 'portrait'
    };
  }

  /**
   * Update device-specific CSS classes
   */
  updateDeviceClasses() {
    const body = document.body;

    // Remove all device classes
    removeClass(body, ['device-xs', 'device-sm', 'device-md', 'device-lg', 'device-xl', 'device-2xl']);
    removeClass(body, ['orientation-landscape', 'orientation-portrait']);
    removeClass(body, ['touch-enabled', 'touch-disabled']);
    removeClass(body, ['high-density', 'normal-density']);

    // Add current breakpoint class
    addClass(body, `device-${this.getBreakpointName()}`);

    // Add orientation class
    addClass(body, `orientation-${this.orientation}`);

    // Add touch class
    addClass(body, this.isTouch ? 'touch-enabled' : 'touch-disabled');

    // Add density class
    addClass(body, this.isHighDensity ? 'high-density' : 'normal-density');
  }

  /**
   * Setup viewport optimizations
   */
  setupViewportOptimizations() {
    const viewport = document.querySelector('meta[name="viewport"]');

    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = this.getViewportContent();
      document.head.appendChild(meta);
    } else {
      viewport.setAttribute('content', this.getViewportContent());
    }

    // Prevent double-tap zoom on touch devices
    if (this.isTouch) {
      this.preventDoubleTapZoom();
    }
  }

  /**
   * Setup touch optimizations
   */
  setupTouchOptimizations() {
    if (!this.isTouch) return;

    // Add touch-specific CSS classes
    addClass(document.body, 'touch-optimized');

    // Optimize touch targets
    this.optimizeTouchTargets();

    // Add touch feedback
    this.addTouchFeedback();

    // Optimize scrolling
    this.optimizeScrolling();
  }

  /**
   * Get current breakpoint name
   * @returns {string} Breakpoint name
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;

    if (width < this.breakpoints.xs) return 'xs';
    if (width < this.breakpoints.sm) return 'sm';
    if (width < this.breakpoints.md) return 'md';
    if (width < this.breakpoints.lg) return 'lg';
    if (width < this.breakpoints.xl) return 'xl';
    return '2xl';
  }

  /**
   * Get breakpoint name for CSS classes
   * @returns {string} Breakpoint name
   */
  getBreakpointName() {
    const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const values = Object.values(this.breakpoints);
    const width = window.innerWidth;

    for (let i = 0; i < values.length - 1; i++) {
      if (width < values[i + 1]) {
        return names[i];
      }
    }
    return names[names.length - 1];
  }

  /**
   * Get device orientation
   * @returns {string} Orientation
   */
  getOrientation() {
    if (window.orientation) {
      const angle = window.orientation;
      if (angle === 0 || angle === 180) return 'portrait';
      if (angle === 90 || angle === 270) return 'landscape';
    }

    // Fallback to window dimensions
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  /**
   * Get pixel ratio
   * @returns {number} Pixel ratio
   */
  getPixelRatio() {
    return window.devicePixelRatio || 1;
  }

  /**
   * Get viewport meta content
   * @returns {string} Viewport content
   */
  getViewportContent() {
    const base = 'width=device-width, initial-scale=1';
    const additions = [];

    // Prevent zoom on input focus (iOS)
    if (this.isTouch) {
      additions.push('shrink-to-fit=no');
      additions.push('viewport-fit=cover');
    }

    // Maximum scale control
    if (this.isHighDensity) {
      additions.push('maximum-scale=2.0');
    }

    return base + (additions.length > 0 ? ', ' + additions.join(', ') : '');
  }

  /**
   * Prevent double-tap zoom
   */
  preventDoubleTapZoom() {
    let lastTouchEnd = 0;

    document.addEventListener('touchend', (event) => {
      const now = Date.now();

      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }

      lastTouchEnd = now;
    }, false);
  }

  /**
   * Optimize touch targets
   */
  optimizeTouchTargets() {
    // Ensure minimum touch target size
    const touchTargets = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');

    touchTargets.forEach(target => {
      const rect = target.getBoundingClientRect();
      const minSize = 44; // Apple's recommended minimum

      if (rect.width < minSize || rect.height < minSize) {
        // Add padding if needed
        const currentPadding = parseInt(getComputedStyle(target).padding) || 0;
        const neededPadding = Math.max(0, Math.ceil((minSize - Math.min(rect.width, rect.height)) / 2));

        if (neededPadding > currentPadding) {
          target.style.padding = `${neededPadding}px`;
          target.style.minHeight = `${minSize}px`;
          target.style.minWidth = `${minSize}px`;
        }
      }
    });
  }

  /**
   * Add touch feedback
   */
  addTouchFeedback() {
    const style = document.createElement('style');
    style.textContent = `
      @media (hover: none) {
        .btn:active,
        .nav-item:active,
        .card:active,
        input:focus,
        select:focus,
        textarea:focus {
          transform: scale(0.95);
          transition: transform 0.1s ease-out;
        }
      }

      .touch-optimized * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }

      .touch-optimized input,
      .touch-optimized textarea {
        -webkit-user-select: text;
        user-select: text;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize scrolling behavior
   */
  optimizeScrolling() {
    // Enable momentum scrolling on iOS
    const style = document.createElement('style');
    style.textContent = `
      .touch-optimized {
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
      }

      .touch-optimized .scrollable {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get responsive value based on breakpoint
   * @param {Object} values - Values object with breakpoint keys
   * @param {*} defaultValue - Default value if no match
   * @returns {*} Responsive value
   */
  getResponsiveValue(values = {}, defaultValue = null) {
    const breakpointNames = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

    // Find the largest breakpoint that's less than or equal to current
    for (let i = breakpointNames.length - 1; i >= 0; i--) {
      const bp = breakpointNames[i];
      if (this.currentBreakpoint <= this.breakpoints[bp] && values[bp] !== undefined) {
        return values[bp];
      }
    }

    return defaultValue;
  }

  /**
   * Check if device matches query
   * @param {string} query - Device query
   * @returns {boolean} Match result
   */
  matches(query) {
    const queries = {
      'mobile': () => this.state.isMobile,
      'tablet': () => this.state.isTablet,
      'desktop': () => this.state.isDesktop,
      'touch': () => this.isTouch,
      'landscape': () => this.state.isLandscape,
      'portrait': () => this.state.isPortrait,
      'highDensity': () => this.isHighDensity
    };

    return queries[query] ? queries[query]() : false;
  }

  /**
   * Add media query listener
   * @param {string} query - Media query
   * @param {Function} callback - Callback function
   * @returns {Function} Cleanup function
   */
  onMediaQuery(query, callback) {
    const mql = window.matchMedia(query);

    const handleChange = (e) => {
      callback(e.matches);
    };

    mql.addListener(handleChange);
    callback(mql.matches);

    return () => {
      mql.removeListener(handleChange);
    };
  }

  /**
   * Get safe area insets for notched screens
   * @returns {Object} Safe area insets
   */
  getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);
    const safeAreaTop = style.getPropertyValue('safe-area-inset-top');
    const safeAreaRight = style.getPropertyValue('safe-area-inset-right');
    const safeAreaBottom = style.getPropertyValue('safe-area-inset-bottom');
    const safeAreaLeft = style.getPropertyValue('safe-area-inset-left');

    return {
      top: safeAreaTop ? parseInt(safeAreaTop) : 0,
      right: safeAreaRight ? parseInt(safeAreaRight) : 0,
      bottom: safeAreaBottom ? parseInt(safeAreaBottom) : 0,
      left: safeAreaLeft ? parseInt(safeAreaLeft) : 0
    };
  }

  /**
   * Apply safe area padding to element
   * @param {HTMLElement} element - Element to apply padding to
   * @param {Object} options - Padding options
   */
  applySafeAreaPadding(element, options = {}) {
    const insets = this.getSafeAreaInsets();
    const defaults = {
      top: insets.top,
      right: insets.right,
      bottom: insets.bottom,
      left: insets.left
    };

    const padding = { ...defaults, ...options };

    element.style.padding = `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
  }

  /**
   * Create responsive navigation handler
   * @param {HTMLElement} nav - Navigation element
   * @param {Object} options - Navigation options
   * @returns {Object} Navigation controller
   */
  createResponsiveNav(nav, options = {}) {
    const defaults = {
      mobileBreakpoint: 'md',
      mobileIcon: '☰',
      closeIcon: '✕',
      overlay: true,
      pushContent: true
    };

    const config = { ...defaults, ...options };
    let isOpen = false;

    // Create mobile menu button
    const mobileBtn = document.createElement('button');
    mobileBtn.className = 'nav-mobile-toggle hidden-lg';
    mobileBtn.innerHTML = config.mobileIcon;
    mobileBtn.setAttribute('aria-label', 'Toggle navigation');

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay hidden';

    if (nav.parentNode) {
      nav.parentNode.insertBefore(mobileBtn, nav);
      nav.parentNode.appendChild(overlay);
    }

    const updateNavLayout = () => {
      const isMobile = this.matches('mobile');

      if (isMobile) {
        addClass(nav, 'nav-mobile');
        removeClass(nav, 'nav-desktop');
        addClass(mobileBtn, 'visible');
      } else {
        addClass(nav, 'nav-desktop');
        removeClass(nav, 'nav-mobile');
        removeClass(mobileBtn, 'visible');
        closeNav();
      }
    };

    const openNav = () => {
      if (!isOpen) {
        isOpen = true;
        addClass(nav, 'nav-open');
        addClass(mobileBtn, 'active');

        if (config.overlay) {
          removeClass(overlay, 'hidden');
        }

        if (config.pushContent) {
          document.body.style.overflow = 'hidden';
        }

        this.emit('navOpen');
      }
    };

    const closeNav = () => {
      if (isOpen) {
        isOpen = false;
        removeClass(nav, 'nav-open');
        removeClass(mobileBtn, 'active');

        if (config.overlay) {
          addClass(overlay, 'hidden');
        }

        if (config.pushContent) {
          document.body.style.overflow = '';
        }

        this.emit('navClose');
      }
    };

    // Event listeners
    mobileBtn.addEventListener('click', () => isOpen ? closeNav() : openNav());

    if (config.overlay) {
      overlay.addEventListener('click', closeNav);
    }

    // Handle resize
    this.onMediaQuery(`(max-width: ${this.breakpoints[config.mobileBreakpoint] - 1}px)`, updateNavLayout);

    // Initial setup
    updateNavLayout();

    return {
      open: openNav,
      close: closeNav,
      toggle: () => isOpen ? closeNav() : openNav(),
      isOpen: () => isOpen
    };
  }

  /**
   * Create responsive table handler
   * @param {HTMLElement} table - Table element
   * @param {Object} options - Table options
   * @returns {Object} Table controller
   */
  createResponsiveTable(table, options = {}) {
    const defaults = {
      mobileBreakpoint: 'md',
      stackOnMobile: true,
      cardOnMobile: false
    };

    const config = { ...defaults, ...options };
    let isResponsive = false;

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = Array.from(table.querySelectorAll('tbody tr'));

    const createMobileCard = (row) => {
      const card = document.createElement('div');
      card.className = 'responsive-table-card';

      const cells = Array.from(row.querySelectorAll('td'));
      headers.forEach((header, index) => {
        const cell = cells[index];
        if (cell) {
          const field = document.createElement('div');
          field.className = 'responsive-table-field';

          const label = document.createElement('div');
          label.className = 'responsive-table-label';
          label.textContent = header;

          const value = document.createElement('div');
          value.className = 'responsive-table-value';
          value.innerHTML = cell.innerHTML;

          field.appendChild(label);
          field.appendChild(value);
          card.appendChild(field);
        }
      });

      return card;
    };

    const updateTableLayout = () => {
      const isMobile = this.matches('mobile');

      if (isMobile && !isResponsive) {
        isResponsive = true;

        if (config.cardOnMobile) {
          // Convert to cards
          const container = document.createElement('div');
          container.className = 'responsive-table-container';

          rows.forEach(row => {
            container.appendChild(createMobileCard(row));
          });

          table.parentNode.insertBefore(container, table);
          table.style.display = 'none';
        } else if (config.stackOnMobile) {
          // Stack table rows
          addClass(table, 'responsive-table-stacked');
        }
      } else if (!isMobile && isResponsive) {
        isResponsive = false;

        // Restore original table
        removeClass(table, 'responsive-table-stacked');
        table.style.display = '';

        // Remove card container if it exists
        const container = table.previousElementSibling;
        if (container && container.classList.contains('responsive-table-container')) {
          container.remove();
        }
      }
    };

    // Handle resize
    this.onMediaQuery(`(max-width: ${this.breakpoints[config.mobileBreakpoint] - 1}px)`, updateTableLayout);

    // Initial setup
    updateTableLayout();

    return {
      update: updateTableLayout,
      isResponsive: () => isResponsive
    };
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`ResponsiveUI event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Remove listener function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    return () => {
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get current breakpoint
   * @returns {string} Current breakpoint
   */
  getCurrentBreakpoint() {
    return this.currentBreakpoint;
  }

  /**
   * Destroy responsive manager
   */
  destroy() {
    // Clean up event listeners
    this.listeners.forEach((callbacks, event) => {
      const cleanup = this.listeners.get(event);
      if (cleanup) {
        cleanup();
      }
    });
    this.listeners.clear();

    // Remove device classes
    const body = document.body;
    removeClass(body, [
      'device-xs', 'device-sm', 'device-md', 'device-lg', 'device-xl', 'device-2xl',
      'orientation-landscape', 'orientation-portrait',
      'touch-enabled', 'touch-disabled',
      'high-density', 'normal-density',
      'touch-optimized'
    ]);
  }
}

/**
 * Responsive utility functions
 */

/**
 * Create responsive breakpoint checker
 * @param {string} breakpoint - Breakpoint name
 * @returns {Function} Checker function
 */
export function createBreakpointChecker(breakpoint) {
  const sizes = {
    xs: 375,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };

  return () => window.innerWidth >= sizes[breakpoint];
}

/**
 * Create media query checker
 * @param {string} query - Media query string
 * @returns {Function} Checker function
 */
export function createMediaQueryChecker(query) {
  return () => window.matchMedia(query).matches;
}

/**
 * Get responsive spacing value
 * @param {number} base - Base spacing value
 * @param {Object} multipliers - Multipliers per breakpoint
 * @returns {string} Responsive spacing value
 */
export function getResponsiveSpacing(base, multipliers = {}) {
  const defaults = {
    xs: 0.5,
    sm: 0.75,
    md: 1,
    lg: 1.25,
    xl: 1.5,
    '2xl': 2
  };

  const width = window.innerWidth;
  let breakpoint = 'xs';

  if (width >= 1536) breakpoint = '2xl';
  else if (width >= 1280) breakpoint = 'xl';
  else if (width >= 1024) breakpoint = 'lg';
  else if (width >= 768) breakpoint = 'md';
  else if (width >= 640) breakpoint = 'sm';

  const multiplier = multipliers[breakpoint] || defaults[breakpoint];
  const value = base * multiplier;

  return `${value}px`;
}

// Create singleton instance
export const responsiveUI = new ResponsiveUIManager();

// Export utilities
export default ResponsiveUIManager;
