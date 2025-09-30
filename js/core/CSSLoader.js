/**
 * CSS Loader - Handles lazy loading of non-critical CSS
 * Optimizes critical path rendering by loading styles on demand
 */

class CSSLoader {
  constructor() {
    this.loadedStyles = new Set();
    this.loadingPromises = new Map();
    this.criticalLoaded = false;
  }

  /**
   * Load critical CSS immediately (should be inlined in HTML)
   */
  loadCriticalCSS() {
    if (this.criticalLoaded) return Promise.resolve();

    return new Promise((resolve) => {
      // Critical CSS should already be inlined in HTML
      // This method is for fallback loading if needed
      const criticalLink = document.querySelector('link[data-critical]');
      if (criticalLink) {
        criticalLink.addEventListener('load', () => {
          this.criticalLoaded = true;
          resolve();
        });
      } else {
        // Critical CSS is inlined, mark as loaded
        this.criticalLoaded = true;
        resolve();
      }
    });
  }

  /**
   * Load non-critical CSS with priority and media query support
   */
  async loadCSS(href, options = {}) {
    const {
      priority = 'low',
      media = 'all',
      crossorigin = null,
      integrity = null,
      onLoad = null,
      onError = null
    } = options;

    // Return if already loaded
    if (this.loadedStyles.has(href)) {
      return Promise.resolve();
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(href)) {
      return this.loadingPromises.get(href);
    }

    const loadPromise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;
      
      if (crossorigin) link.crossOrigin = crossorigin;
      if (integrity) link.integrity = integrity;

      // Handle load success
      link.addEventListener('load', () => {
        this.loadedStyles.add(href);
        this.loadingPromises.delete(href);
        
        if (onLoad) onLoad();
        resolve();
      });

      // Handle load error
      link.addEventListener('error', (error) => {
        this.loadingPromises.delete(href);
        console.error(`Failed to load CSS: ${href}`, error);
        
        if (onError) onError(error);
        reject(error);
      });

      // Load with appropriate priority
      if (priority === 'high') {
        // High priority - load immediately
        document.head.appendChild(link);
      } else if (priority === 'low') {
        // Low priority - load when idle
        this.loadWhenIdle(() => {
          document.head.appendChild(link);
        });
      } else {
        // Medium priority - load after a short delay
        setTimeout(() => {
          document.head.appendChild(link);
        }, 100);
      }
    });

    this.loadingPromises.set(href, loadPromise);
    return loadPromise;
  }

  /**
   * Load CSS when browser is idle
   */
  loadWhenIdle(callback) {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(callback, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(callback, 1000)