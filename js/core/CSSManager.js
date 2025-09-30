/**
 * CSS Manager - Comprehensive CSS optimization and loading management
 * Handles critical path rendering, lazy loading, and performance optimization
 */

class CSSManager {
  constructor() {
    this.loadedStyles = new Set();
    this.loadingPromises = new Map();
    this.criticalLoaded = false;
    this.observer = null;
    this.performanceMetrics = {
      criticalLoadTime: 0,
      nonCriticalLoadTime: 0,
      totalStyles: 0,
      optimizedStyles: 0
    };
    
    this.init();
  }

  /**
   * Initialize CSS management
   */
  init() {
    this.measureCriticalLoadTime();
    this.setupLazyLoading();
    this.optimizeExistingStyles();
    this.setupPerformanceMonitoring();
  }

  /**
   * Measure critical CSS load time
   */
  measureCriticalLoadTime() {
    const startTime = performance.now();
    
    // Mark critical CSS as loaded when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.performanceMetrics.criticalLoadTime = performance.now() - startTime;
        this.criticalLoaded = true;
        this.loadNonCriticalCSS();
      });
    } else {
      this.performanceMetrics.criticalLoadTime = performance.now() - startTime;
      this.criticalLoaded = true;
      this.loadNonCriticalCSS();
    }
  }

  /**
   * Load non-critical CSS with optimal strategy
   */
  async loadNonCriticalCSS() {
    const startTime = performance.now();
    
    try {
      // Load component styles
      await this.loadCSS('css/components.css', {
        priority: 'high',
        strategy: 'idle'
      });

      // Load conditional styles based on device/preferences
      await this.loadConditionalStyles();

      this.performanceMetrics.nonCriticalLoadTime = performance.now() - startTime;
      this.performanceMetrics.totalStyles = this.loadedStyles.size;
      
      console.log('Non-critical CSS loaded in', this.performanceMetrics.nonCriticalLoadTime.toFixed(2), 'ms');
      
    } catch (error) {
      console.error('Failed to load non-critical CSS:', error);
    }
  }

  /**
   * Load conditional styles based on device and user preferences
   */
  async loadConditionalStyles() {
    const conditionalStyles = [];

    // Dark theme support
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      conditionalStyles.push({
        href: 'css/dark-theme.css',
        media: '(prefers-color-scheme: dark)'
      });
    }

    // High contrast support
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      conditionalStyles.push({
        href: 'css/high-contrast.css',
        media: '(prefers-contrast: high)'
      });
    }

    // Print styles
    conditionalStyles.push({
      href: 'css/print.css',
      media: 'print',
      priority: 'low'
    });

    // Load all conditional styles
    await Promise.allSettled(
      conditionalStyles.map(style => this.loadCSS(style.href, style))
    );
  }

  /**
   * Load CSS with advanced options
   */
  async loadCSS(href, options = {}) {
    const {
      priority = 'medium',
      strategy = 'immediate',
      media = 'all',
      crossorigin = null,
      integrity = null,
      timeout = 10000
    } = options;

    // Return if already loaded
    if (this.loadedStyles.has(href)) {
      return Promise.resolve();
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(href)) {
      return this.loadingPromises.get(href);
    }

    const loadPromise = this.createLoadPromise(href, options);
    this.loadingPromises.set(href, loadPromise);

    try {
      await loadPromise;
      this.loadedStyles.add(href);
      this.loadingPromises.delete(href);
      this.performanceMetrics.optimizedStyles++;
      
      return Promise.resolve();
    } catch (error) {
      this.loadingPromises.delete(href);
      throw error;
    }
  }

  /**
   * Create load promise based on strategy
   */
  createLoadPromise(href, options) {
    const { strategy, timeout } = options;

    switch (strategy) {
      case 'idle':
        return this.loadWhenIdle(href, options);
      case 'interaction':
        return this.loadOnInteraction(href, options);
      case 'visible':
        return this.loadWhenVisible(href, options);
      case 'media':
        return this.loadOnMediaMatch(href, options);
      default:
        return this.loadImmediate(href, options);
    }
  }

  /**
   * Load CSS when browser is idle
   */
  loadWhenIdle(href, options) {
    return new Promise((resolve, reject) => {
      const loadCSS = () => {
        this.loadImmediate(href, options)
          .then(resolve)
          .catch(reject);
      };

      if (window.requestIdleCallback) {
        window.requestIdleCallback(loadCSS, { timeout: 2000 });
      } else {
        setTimeout(loadCSS, 100);
      }
    });
  }

  /**
   * Load CSS on user interaction
   */
  loadOnInteraction(href, options) {
    return new Promise((resolve, reject) => {
      const events = ['click', 'touchstart', 'keydown', 'scroll'];
      let loaded = false;

      const loadCSS = () => {
        if (loaded) return;
        loaded = true;

        events.forEach(event => {
          document.removeEventListener(event, loadCSS, { passive: true });
        });

        this.loadImmediate(href, options)
          .then(resolve)
          .catch(reject);
      };

      events.forEach(event => {
        document.addEventListener(event, loadCSS, { passive: true, once: true });
      });

      // Fallback timeout
      setTimeout(loadCSS, 3000);
    });
  }

  /**
   * Load CSS when elements become visible
   */
  loadWhenVisible(href, options) {
    return new Promise((resolve, reject) => {
      const targets = document.querySelectorAll('[data-lazy-css]');
      
      if (targets.length === 0) {
        return this.loadImmediate(href, options).then(resolve).catch(reject);
      }

      let loaded = false;
      const loadCSS = () => {
        if (loaded) return;
        loaded = true;

        if (this.observer) {
          this.observer.disconnect();
        }

        this.loadImmediate(href, options)
          .then(resolve)
          .catch(reject);
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
   * Load CSS when media query matches
   */
  loadOnMediaMatch(href, options) {
    const { media = 'all' } = options;
    
    return new Promise((resolve, reject) => {
      if (media === 'all') {
        return this.loadImmediate(href, options).then(resolve).catch(reject);
      }

      const mediaQuery = window.matchMedia(media);
      
      if (mediaQuery.matches) {
        this.loadImmediate(href, options).then(resolve).catch(reject);
      } else {
        mediaQuery.addEventListener('change', (e) => {
          if (e.matches) {
            this.loadImmediate(href, options).then(resolve).catch(reject);
          }
        });
      }
    });
  }

  /**
   * Load CSS immediately
   */
  loadImmediate(href, options) {
    const {
      priority = 'medium',
      media = 'all',
      crossorigin = null,
      integrity = null,
      timeout = 10000
    } = options;

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;
      
      if (crossorigin) link.crossOrigin = crossorigin;
      if (integrity) link.integrity = integrity;
      if (priority === 'high') link.fetchPriority = 'high';
      if (priority === 'low') link.fetchPriority = 'low';

      // Timeout handling
      const timeoutId = setTimeout(() => {
        reject(new Error(`CSS load timeout: ${href}`));
      }, timeout);

      link.addEventListener('load', () => {
        clearTimeout(timeoutId);
        this.optimizeLoadedCSS(link);
        resolve();
      });

      link.addEventListener('error', (error) => {
        clearTimeout(timeoutId);
        console.error(`Failed to load CSS: ${href}`, error);
        reject(error);
      });

      document.head.appendChild(link);
    });
  }

  /**
   * Setup lazy loading for future elements
   */
  setupLazyLoading() {
    if (!window.IntersectionObserver) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const cssFile = element.dataset.lazyCss;
          
          if (cssFile && !this.loadedStyles.has(cssFile)) {
            this.loadCSS(cssFile, { strategy: 'immediate' });
            this.observer.unobserve(element);
          }
        }
      });
    }, { rootMargin: '100px' });

    // Observe existing elements
    document.querySelectorAll('[data-lazy-css]').forEach(el => {
      this.observer.observe(el);
    });
  }

  /**
   * Optimize loaded CSS for better performance
   */
  optimizeLoadedCSS(linkElement) {
    // Add performance hints
    linkElement.dataset.optimized = 'true';
    linkElement.dataset.loadTime = Date.now();

    // Preload related resources
    const href = linkElement.href;
    if (href.includes('components.css')) {
      this.preloadRelatedResources();
    }
  }

  /**
   * Preload related resources
   */
  preloadRelatedResources() {
    // Preload fonts that might be used
    const fonts = [
      '/fonts/system-ui.woff2'
    ];

    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = font;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize existing styles
   */
  optimizeExistingStyles() {
    // Add contain properties for better performance
    const containers = document.querySelectorAll('.appbar, .tabbar, main, .card');
    containers.forEach(container => {
      if (!container.style.contain) {
        container.style.contain = 'layout style';
      }
    });

    // Add will-change for animated elements
    const animatedElements = document.querySelectorAll('.tabbtn, .tile, .btn');
    animatedElements.forEach(element => {
      if (!element.style.willChange) {
        element.style.willChange = 'transform';
      }
    });
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (entry.entryType === 'largest-contentful-paint') {
              console.log('LCP:', entry.startTime);
            }
            if (entry.entryType === 'first-input') {
              console.log('FID:', entry.processingStart - entry.startTime);
            }
            if (entry.entryType === 'layout-shift') {
              console.log('CLS:', entry.value);
            }
          });
        });

        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      loadedStyles: Array.from(this.loadedStyles),
      loadingStyles: Array.from(this.loadingPromises.keys()),
      criticalLoaded: this.criticalLoaded
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
    this.loadingPromises.clear();
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cssManager = new CSSManager();
  });
} else {
  window.cssManager = new CSSManager();
}

export default CSSManager;