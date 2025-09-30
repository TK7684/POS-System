/**
 * Dynamic Module Loader for Code Splitting
 * Handles lazy loading of non-critical components with loading states
 */
class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.loadingStates = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Dynamically import a module with loading state management
   */
  async loadModule(moduleName, showLoading = true) {
    // Return cached module if already loaded
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    // Show loading state
    if (showLoading) {
      this.setLoadingState(moduleName, true);
    }

    // Create loading promise
    const loadingPromise = this.importWithRetry(moduleName);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      const module = await loadingPromise;
      
      // Cache the loaded module
      this.loadedModules.set(moduleName, module);
      
      // Clear loading state
      this.setLoadingState(moduleName, false);
      this.loadingPromises.delete(moduleName);
      this.retryAttempts.delete(moduleName);
      
      return module;
      
    } catch (error) {
      // Clear loading state on error
      this.setLoadingState(moduleName, false);
      this.loadingPromises.delete(moduleName);
      
      console.error(`Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Import module with retry logic
   */
  async importWithRetry(moduleName) {
    const attempts = this.retryAttempts.get(moduleName) || 0;
    
    try {
      const module = await this.dynamicImport(moduleName);
      return module;
      
    } catch (error) {
      if (attempts < this.maxRetries) {
        this.retryAttempts.set(moduleName, attempts + 1);
        
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * (attempts + 1))
        );
        
        return this.importWithRetry(moduleName);
      }
      
      throw error;
    }
  }

  /**
   * Dynamic import with fallback for different environments
   */
  async dynamicImport(moduleName) {
    const moduleMap = {
      'purchase': () => import('./modules/PurchaseModule.js'),
      'sale': () => import('./modules/SaleModule.js'),
      'menu': () => import('./modules/MenuModule.js'),
      'reports': () => import('./modules/ReportsModule.js'),
      'analytics': () => import('./modules/AnalyticsModule.js'),
      'export': () => import('./modules/ExportModule.js'),
      'search': () => import('./modules/SearchModule.js'),
      'notifications': () => import('./modules/NotificationsModule.js'),
      'charts': () => import('./modules/ChartsModule.js'),
      'offline': () => import('./modules/OfflineModule.js'),
      'user-analytics': () => import('./UserAnalytics.js'),
      'performance-monitor': () => import('./PerformanceMonitor.js'),
      'performance-dashboard': () => import('./PerformanceDashboard.js')
    };

    const importFunction = moduleMap[moduleName];
    if (!importFunction) {
      throw new Error(`Unknown module: ${moduleName}`);
    }

    const module = await importFunction();
    return module.default || module;
  }

  /**
   * Set loading state and update UI
   */
  setLoadingState(moduleName, isLoading) {
    this.loadingStates.set(moduleName, isLoading);
    
    // Update UI loading indicators
    this.updateLoadingUI(moduleName, isLoading);
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('moduleLoadingStateChange', {
      detail: { moduleName, isLoading }
    }));
  }

  /**
   * Update loading UI elements
   */
  updateLoadingUI(moduleName, isLoading) {
    const loadingElements = document.querySelectorAll(`[data-loading-for="${moduleName}"]`);
    
    loadingElements.forEach(element => {
      if (isLoading) {
        element.classList.add('loading');
        element.innerHTML = this.getLoadingHTML(moduleName);
      } else {
        element.classList.remove('loading');
      }
    });
  }

  /**
   * Get loading HTML for different modules
   */
  getLoadingHTML(moduleName) {
    const loadingMessages = {
      'purchase': 'กำลังโหลดหน้าซื้อ...',
      'sale': 'กำลังโหลดหน้าขาย...',
      'menu': 'กำลังโหลดจัดการเมนู...',
      'reports': 'กำลังโหลดรายงาน...',
      'analytics': 'กำลังโหลดการวิเคราะห์...',
      'export': 'กำลังเตรียมการส่งออก...',
      'search': 'กำลังโหลดการค้นหา...',
      'notifications': 'กำลังโหลดการแจ้งเตือน...',
      'charts': 'กำลังโหลดกราฟ...',
      'offline': 'กำลังเตรียมโหมดออฟไลน์...',
      'user-analytics': 'กำลังโหลดระบบวิเคราะห์ผู้ใช้...',
      'performance-monitor': 'กำลังโหลดตัวตรวจสอบประสิทธิภาพ...',
      'performance-dashboard': 'กำลังโหลดแดชบอร์ดประสิทธิภาพ...'
    };

    const message = loadingMessages[moduleName] || 'กำลังโหลด...';
    
    return `
      <div class="module-loading">
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
      </div>
    `;
  }

  /**
   * Preload modules that are likely to be used soon
   */
  async preloadModules(moduleNames, priority = 'low') {
    const preloadPromises = moduleNames.map(async (moduleName) => {
      try {
        // Use requestIdleCallback for low priority preloading
        if (priority === 'low' && window.requestIdleCallback) {
          return new Promise(resolve => {
            window.requestIdleCallback(async () => {
              try {
                await this.loadModule(moduleName, false);
                resolve();
              } catch (error) {
                console.warn(`Preload failed for ${moduleName}:`, error);
                resolve();
              }
            });
          });
        } else {
          // High priority preloading
          await this.loadModule(moduleName, false);
        }
      } catch (error) {
        console.warn(`Preload failed for ${moduleName}:`, error);
      }
    });

    return Promise.allSettled(preloadPromises);
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Check if module is currently loading
   */
  isModuleLoading(moduleName) {
    return this.loadingStates.get(moduleName) || false;
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      loadedModules: Array.from(this.loadedModules.keys()),
      loadingModules: Array.from(this.loadingStates.entries())
        .filter(([, isLoading]) => isLoading)
        .map(([moduleName]) => moduleName),
      failedModules: Array.from(this.retryAttempts.entries())
        .filter(([, attempts]) => attempts >= this.maxRetries)
        .map(([moduleName]) => moduleName)
    };
  }

  /**
   * Clear all cached modules (useful for development)
   */
  clearCache() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.loadingStates.clear();
    this.retryAttempts.clear();
  }

  /**
   * Lazy load component when it becomes visible
   */
  async loadOnIntersection(element, moduleName, options = {}) {
    const defaultOptions = {
      rootMargin: '50px',
      threshold: 0.1
    };

    const observerOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const observer = new IntersectionObserver(async (entries) => {
        const entry = entries[0];
        
        if (entry.isIntersecting) {
          observer.disconnect();
          
          try {
            const module = await this.loadModule(moduleName);
            resolve(module);
          } catch (error) {
            reject(error);
          }
        }
      }, observerOptions);

      observer.observe(element);
    });
  }

  /**
   * Load module when user interacts with element
   */
  loadOnInteraction(element, moduleName, events = ['click', 'touchstart']) {
    return new Promise((resolve, reject) => {
      const loadModule = async () => {
        // Remove event listeners
        events.forEach(event => {
          element.removeEventListener(event, loadModule);
        });

        try {
          const module = await this.loadModule(moduleName);
          resolve(module);
        } catch (error) {
          reject(error);
        }
      };

      // Add event listeners
      events.forEach(event => {
        element.addEventListener(event, loadModule, { once: true });
      });
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuleLoader;
} else if (typeof window !== 'undefined') {
  window.ModuleLoader = ModuleLoader;
}