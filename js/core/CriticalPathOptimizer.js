/**
 * Critical Path Optimizer - Optimizes CSS delivery and critical path rendering
 * Implements advanced techniques for better Core Web Vitals scores
 */

class CriticalPathOptimizer {
  constructor() {
    this.criticalCSS = null;
    this.nonCriticalCSS = [];
    this.loadedStyles = new Set();
    this.observer = null;
    this.mediaQueries = new Map();
    this.unusedSelectors = new Set();
    
    this.init();
  }

  /**
   * Initialize the optimizer
   */
  init() {
    this.setupIntersectionObserver();
    this.detectUnusedCSS();
    this.optimizeExistingStyles();
    this.setupMediaQueryOptimization();
  }

  /**
   * Extract and inline critical CSS for above-the-fold content
   */
  extractCriticalCSS() {
    const criticalSelectors = [
      // App shell
      '.app', '.appbar', '.tabbar', 'main',
      // Critical layout
      '.tabbtn', '.title', '.spacer',
      // Essential utilities
      '.hide', '.loading', '.spinner', '.toast',
      // Critical responsive
      '@media (max-width: 640px)',
      // Performance critical
      ':focus-visible', '@media (prefers-reduced-motion: reduce)'
    ];

    const criticalRules = [];
    
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          Array.from(sheet.cssRules || sheet.rules || []).forEach(rule => {
            if (this.isCriticalRule(rule, criticalSelectors)) {
              criticalRules.push(rule.cssText);
            }
          });
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      });
    } catch (error) {
      console.warn('Could not extract critical CSS:', error);
    }

    return criticalRules.join('\n');
  }

  /**
   * Check if a CSS rule is critical for above-the-fold rendering
   */
  isCriticalRule(rule, criticalSelectors) {
    if (!rule.selectorText) return false;
    
    return criticalSelectors.some(selector => {
      if (selector.startsWith('@media')) {
        return rule.media && rule.media.mediaText.includes(selector.slice(7));
      }
      return rule.selectorText.includes(selector);
    });
  }

  /**
   * Load non-critical CSS with different strategies
   */
  async loadNonCriticalCSS(strategy = 'idle') {
    const nonCriticalFiles = [
      { href: 'css/components.css', priority: 'high' },
      { href: 'css/animations.css', priority: 'low', media: '(prefers-reduced-motion: no-preference)' },
      { href: 'css/print.css', priority: 'low', media: 'print' }
    ];

    switch (strategy) {
      case 'idle':
        return this.loadWhenIdle(nonCriticalFiles);
      case 'interaction':
        return this.loadOnInteraction(nonCriticalFiles);
      case 'visible':
        return this.loadWhenVisible(nonCriticalFiles);
      default:
        return this.loadImmediate(nonCriticalFiles);
    }
  }

  /**
   * Load CSS when browser is idle
   */
  loadWhenIdle(cssFiles) {
    return new Promise(resolve => {
      const loadCSS = () => {
        Promise.all(cssFiles.map(file => this.loadCSSFile(file)))
          .then(resolve)
          .catch(error => {
            console.warn('Failed to load non-critical CSS:', error);
            resolve();
          });
      };

      if (window.requestIdleCallback) {
        window.requestIdleCallback(loadCSS, { timeout: 2000 });
      } else {
        setTimeout(loadCSS, 1000);
      }
    });
  }

  /**
   * Load CSS on user interaction
   */
  loadOnInteraction(cssFiles) {
    return new Promise(resolve => {
      const events = ['click', 'touchstart', 'keydown', 'scroll'];
      let loaded = false;

      const loadCSS = () => {
        if (loaded) return;
        loaded = true;

        // Remove event listeners
        events.forEach(event => {
          document.removeEventListener(event, loadCSS, { passive: true });
        });

        Promise.all(cssFiles.map(file => this.loadCSSFile(file)))
          .then(resolve)
          .catch(error => {
            console.warn('Failed to load non-critical CSS:', error);
            resolve();
          });
      };

      // Add event listeners
      events.forEach(event => {
        document.addEventListener(event, loadCSS, { passive: true, once: true });
      });

      // Fallback timeout
      setTimeout(loadCSS, 3000);
    });
  }

  /**
   * Load CSS when specific elements become visible
   */
  loadWhenVisible(cssFiles) {
    const targets = document.querySelectorAll('.card, .tile, .table');
    
    if (targets.length === 0) {
      return this.loadImmediate(cssFiles);
    }

    return new Promise(resolve => {
      let loaded = false;

      const loadCSS = () => {
        if (loaded) return;
        loaded = true;

        if (this.observer) {
          this.observer.disconnect();
        }

        Promise.all(cssFiles.map(file => this.loadCSSFile(file)))
          .then(resolve)
          .catch(error => {
            console.warn('Failed to load non-critical CSS:', error);
            resolve();
          });
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadCSS();
          }
        });
      }, { rootMargin: '50px' });

      targets.forEach(target => this.observer.observe(target));

      // Fallback timeout
      setTimeout(loadCSS, 2000);
    });
  }

  /**
   * Load CSS immediately
   */
  loadImmediate(cssFiles) {
    return Promise.all(cssFiles.map(file => this.loadCSSFile(file)));
  }

  /**
   * Load individual CSS file with optimizations
   */
  loadCSSFile(fileConfig) {
    const { href, priority = 'low', media = 'all', integrity, crossorigin } = fileConfig;

    if (this.loadedStyles.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;
      
      if (integrity) link.integrity = integrity;
      if (crossorigin) link.crossOrigin = crossorigin;

      // Optimize loading based on priority
      if (priority === 'high') {
        link.fetchPriority = 'high';
      } else if (priority === 'low') {
        link.fetchPriority = 'low';
      }

      link.addEventListener('load', () => {
        this.loadedStyles.add(href);
        this.optimizeLoadedCSS(link);
        resolve();
      });

      link.addEventListener('error', (error) => {
        console.error(`Failed to load CSS: ${href}`, error);
        reject(error);
      });

      document.head.appendChild(link);
    });
  }

  /**
   * Setup intersection observer for lazy loading
   */
  setupIntersectionObserver() {
    if (!window.IntersectionObserver) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const cssFile = element.dataset.lazyCSS;
          
          if (cssFile && !this.loadedStyles.has(cssFile)) {
            this.loadCSSFile({ href: cssFile });
          }
        }
      });
    }, { rootMargin: '100px' });
  }

  /**
   * Detect and remove unused CSS
   */
  detectUnusedCSS() {
    // This is a simplified implementation
    // In production, you might want to use a more sophisticated tool
    const selectors = this.getAllSelectors();
    const unusedSelectors = [];

    selectors.forEach(selector => {
      try {
        if (!document.querySelector(selector)) {
          unusedSelectors.push(selector);
        }
      } catch (e) {
        // Invalid selector
      }
    });

    this.unusedSelectors = new Set(unusedSelectors);
    
    // Remove unused selectors (be careful with this in production)
    if (this.unusedSelectors.size > 0) {
      console.log(`Found ${this.unusedSelectors.size} potentially unused selectors`);
    }
  }

  /**
   * Get all CSS selectors from loaded stylesheets
   */
  getAllSelectors() {
    const selectors = [];
    
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          Array.from(sheet.cssRules || sheet.rules || []).forEach(rule => {
            if (rule.selectorText) {
              selectors.push(rule.selectorText);
            }
          });
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      });
    } catch (error) {
      console.warn('Could not get selectors:', error);
    }

    return selectors;
  }

  /**
   * Optimize existing styles for better performance
   */
  optimizeExistingStyles() {
    // Add will-change properties for better performance
    const animatedElements = document.querySelectorAll('.tabbtn, .tile, .btn, .loading, .toast');
    animatedElements.forEach(element => {
      element.style.willChange = 'transform, opacity';
    });

    // Add contain properties for better layout performance
    const containers = document.querySelectorAll('.appbar, .tabbar, main, .card');
    containers.forEach(container => {
      container.style.contain = 'layout style';
    });
  }

  /**
   * Setup media query optimization
   */
  setupMediaQueryOptimization() {
    // Load CSS based on media query matches
    const mediaQueries = [
      { query: '(max-width: 640px)', css: 'css/mobile.css' },
      { query: '(min-width: 1024px)', css: 'css/desktop.css' },
      { query: '(prefers-color-scheme: dark)', css: 'css/dark-theme.css' },
      { query: 'print', css: 'css/print.css' }
    ];

    mediaQueries.forEach(({ query, css }) => {
      const mediaQuery = window.matchMedia(query);
      
      if (mediaQuery.matches) {
        this.loadCSSFile({ href: css, media: query });
      }

      mediaQuery.addEventListener('change', (e) => {
        if (e.matches) {
          this.loadCSSFile({ href: css, media: query });
        }
      });
    });
  }

  /**
   * Optimize loaded CSS for better performance
   */
  optimizeLoadedCSS(linkElement) {
    // Add performance hints
    linkElement.dataset.optimized = 'true';
    
    // Preload related resources if needed
    const href = linkElement.href;
    if (href.includes('components.css')) {
      this.preloadFonts();
    }
  }

  /**
   * Preload fonts used in CSS
   */
  preloadFonts() {
    const fonts = [
      { href: '/fonts/system-ui.woff2', type: 'font/woff2' }
    ];

    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = font.type;
      link.href = font.href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      loadedStyles: Array.from(this.loadedStyles),
      unusedSelectors: Array.from(this.unusedSelectors),
      mediaQueries: Array.from(this.mediaQueries.keys()),
      criticalCSSSize: this.criticalCSS ? this.criticalCSS.length : 0
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.loadedStyles.clear();
    this.unusedSelectors.clear();
    this.mediaQueries.clear();
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.criticalPathOptimizer = new CriticalPathOptimizer();
  });
} else {
  window.criticalPathOptimizer = new CriticalPathOptimizer();
}

export default CriticalPathOptimizer;