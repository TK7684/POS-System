/**
 * CSS Loader - Handles lazy loading of non-critical CSS
 * Optimizes critical path rendering by loading styles after initial render
 */

class CSSLoader {
  constructor() {
    this.loadedStyles = new Set();
    this.loadingPromises = new Map();
  }

  /**
   * Load CSS file asynchronously without blocking render
   * @param {string} href - CSS file path
   * @param {string} media - Media query (optional)
   * @returns {Promise} - Resolves when CSS is loaded
   */
  loadCSS(href, media = 'all') {
    // Return existing promise if already loading
    if (this.loadingPromises.has(href)) {
      return this.loadingPromises.get(href);
    }

    // Return resolved promise if already loaded
    if (this.loadedStyles.has(href)) {
      return Promise.resolve();
    }

    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;
      
      // Handle load success
      link.onload = () => {
        this.loadedStyles.add(href);
        this.loadingPromises.delete(href);
        resolve();
      };
      
      // Handle load error
      link.onerror = () => {
        this.loadingPromises.delete(href);
        reject(new Error(`Failed to load CSS: ${href}`));
      };
      
      // Insert into head
      document.head.appendChild(link);
    });

    this.loadingPromises.set(href, promise);
    return promise;
  }

  /**
   * Load multiple CSS files in parallel
   * @param {Array} cssFiles - Array of {href, media} objects
   * @returns {Promise} - Resolves when all CSS files are loaded
   */
  loadMultiple(cssFiles) {
    const promises = cssFiles.map(file => {
      if (typeof file === 'string') {
        return this.loadCSS(file);
      }
      return this.loadCSS(file.href, file.media);
    });
    
    return Promise.all(promises);
  }

  /**
   * Preload CSS for faster loading when needed
   * @param {string} href - CSS file path
   */
  preloadCSS(href) {
    if (this.loadedStyles.has(href) || this.loadingPromises.has(href)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  }

  /**
   * Load CSS based on media query match
   * @param {string} href - CSS file path
   * @param {string} mediaQuery - Media query to test
   */
  loadConditional(href, mediaQuery) {
    if (window.matchMedia(mediaQuery).matches) {
      return this.loadCSS(href);
    }
    return Promise.resolve();
  }

  /**
   * Load CSS when element becomes visible (intersection observer)
   * @param {string} href - CSS file path
   * @param {Element} element - Element to observe
   */
  loadOnVisible(href, element) {
    return new Promise((resolve) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            observer.unobserve(element);
            this.loadCSS(href).then(resolve);
          }
        });
      });
      
      observer.observe(element);
    });
  }

  /**
   * Remove unused CSS rules (basic implementation)
   * @param {string} selector - CSS selector to remove
   */
  removeUnusedCSS(selector) {
    try {
      const sheets = document.styleSheets;
      for (let sheet of sheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          for (let i = rules.length - 1; i >= 0; i--) {
            if (rules[i].selectorText && rules[i].selectorText.includes(selector)) {
              sheet.deleteRule(i);
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
          continue;
        }
      }
    } catch (error) {
      console.warn('Could not remove unused CSS:', error);
    }
  }

  /**
   * Get loading status
   */
  getStatus() {
    return {
      loaded: Array.from(this.loadedStyles),
      loading: Array.from(this.loadingPromises.keys())
    };
  }
}

// Create global instance
window.cssLoader = new CSSLoader();

// Auto-load non-critical CSS after initial render
document.addEventListener('DOMContentLoaded', () => {
  // Use requestIdleCallback for better performance
  const loadNonCriticalCSS = () => {
    window.cssLoader.loadCSS('css/components.css')
      .then(() => {
        console.log('Non-critical CSS loaded');
      })
      .catch(error => {
        console.warn('Failed to load non-critical CSS:', error);
      });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadNonCriticalCSS);
  } else {
    setTimeout(loadNonCriticalCSS, 100);
  }
});

export default CSSLoader;