/**
 * Integration example showing how to use CacheManager and DataPrefetcher together
 * This demonstrates the complete caching and prefetching system
 */
class POSCacheSystem {
  constructor(apiBaseUrl) {
    // Initialize components
    this.api = new ApiClient(apiBaseUrl);
    this.cache = new CacheManager();
    this.prefetcher = new DataPrefetcher(this.cache, this.api);
    
    // Initialize the system
    this.initialize();
  }

  /**
   * Initialize the caching system
   */
  async initialize() {
    try {
      // Wait for IndexedDB to be ready
      await this.cache.initializeIndexedDB();
      
      // Warm cache with frequently used data
      await this.warmInitialCache();
      
      // Set up event listeners for user actions
      this.setupEventListeners();
      
      console.log('POS Cache System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize cache system:', error);
    }
  }

  /**
   * Warm cache with essential data on app startup
   */
  async warmInitialCache() {
    try {
      // Warm cache with frequent items based on usage patterns
      await this.prefetcher.warmCacheWithFrequentItems();
      
      // Cache critical data that's always needed
      await this.cacheEssentialData();
      
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  }

  /**
   * Cache essential data that's always needed
   */
  async cacheEssentialData() {
    const essentialPromises = [
      // Cache today's summary
      this.getCachedData('today_summary', 'reports', () => this.api.getTodaySummary()),
      
      // Cache low stock ingredients
      this.getCachedData('low_stock_ingredients', 'ingredients', () => this.api.getLowStockIngredients()),
      
      // Cache recent transactions
      this.getCachedData('recent_transactions', 'recentTransactions', () => this.api.getRecentTransactions(20))
    ];

    await Promise.allSettled(essentialPromises);
  }

  /**
   * Get data with caching - main method for data access
   */
  async getCachedData(key, dataType, fetchFunction) {
    return await this.cache.get(key, dataType, fetchFunction);
  }

  /**
   * Get ingredient with intelligent caching and prefetching
   */
  async getIngredient(id) {
    // Track user action for prefetching
    this.prefetcher.trackUserAction('view_ingredient', { ingredientId: id });
    
    // Get data with caching
    return await this.getCachedData(
      `ingredient_${id}`,
      'ingredients',
      () => this.api.getIngredient(id)
    );
  }

  /**
   * Get menu with intelligent caching and prefetching
   */
  async getMenu(id) {
    // Track user action for prefetching
    this.prefetcher.trackUserAction('view_menu', { menuId: id });
    
    // Get data with caching
    return await this.getCachedData(
      `menu_${id}`,
      'menus',
      () => this.api.getMenu(id)
    );
  }

  /**
   * Get ingredients list with smart caching
   */
  async getIngredients(limit = 50) {
    this.prefetcher.trackUserAction('list_ingredients', { limit });
    
    return await this.getCachedData(
      'ingredients_list',
      'ingredients',
      () => this.api.getAllIngredients()
    );
  }

  /**
   * Get menus list with smart caching
   */
  async getMenus(limit = 30) {
    this.prefetcher.trackUserAction('list_menus', { limit });
    
    return await this.getCachedData(
      'menus_list',
      'menus',
      () => this.api.getAllMenus()
    );
  }

  /**
   * Add purchase with cache invalidation
   */
  async addPurchase(purchaseData) {
    try {
      // Track user action
      this.prefetcher.trackUserAction('add_purchase', purchaseData);
      
      // Make API call
      const result = await this.api.addPurchase(purchaseData);
      
      // Invalidate related cache entries
      await this.invalidateRelatedCache('purchase', purchaseData);
      
      return result;
    } catch (error) {
      console.error('Failed to add purchase:', error);
      throw error;
    }
  }

  /**
   * Add sale with cache invalidation
   */
  async addSale(saleData) {
    try {
      // Track user action
      this.prefetcher.trackUserAction('add_sale', saleData);
      
      // Make API call
      const result = await this.api.addSale(saleData);
      
      // Invalidate related cache entries
      await this.invalidateRelatedCache('sale', saleData);
      
      return result;
    } catch (error) {
      console.error('Failed to add sale:', error);
      throw error;
    }
  }

  /**
   * Search ingredients with caching
   */
  async searchIngredients(query, limit = 10) {
    this.prefetcher.trackUserAction('search_ingredients', { query, limit });
    
    // Use query as cache key
    const cacheKey = `search_ingredients_${query.toLowerCase()}_${limit}`;
    
    return await this.getCachedData(
      cacheKey,
      'ingredients',
      () => this.api.searchIngredients(query, limit)
    );
  }

  /**
   * Search menus with caching
   */
  async searchMenus(query, limit = 10) {
    this.prefetcher.trackUserAction('search_menus', { query, limit });
    
    // Use query as cache key
    const cacheKey = `search_menus_${query.toLowerCase()}_${limit}`;
    
    return await this.getCachedData(
      cacheKey,
      'menus',
      () => this.api.searchMenus(query, limit)
    );
  }

  /**
   * Invalidate cache entries related to an operation
   */
  async invalidateRelatedCache(operation, data) {
    const keysToInvalidate = [];
    
    if (operation === 'purchase') {
      // Invalidate ingredient-related caches
      keysToInvalidate.push(
        'ingredients_list',
        'low_stock_ingredients',
        'today_summary',
        'recent_transactions'
      );
      
      // Invalidate specific ingredient caches
      if (data.items) {
        data.items.forEach(item => {
          if (item.ingredientId) {
            keysToInvalidate.push(`ingredient_${item.ingredientId}`);
          }
        });
      }
    }
    
    if (operation === 'sale') {
      // Invalidate sales-related caches
      keysToInvalidate.push(
        'today_summary',
        'recent_transactions',
        'menus_list'
      );
      
      // Invalidate specific menu caches
      if (data.items) {
        data.items.forEach(item => {
          if (item.menuId) {
            keysToInvalidate.push(`menu_${item.menuId}`);
          }
        });
      }
    }
    
    // Remove invalidated entries
    const promises = keysToInvalidate.map(key => 
      this.cache.remove(key, this.getDataTypeFromKey(key))
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Get data type from cache key
   */
  getDataTypeFromKey(key) {
    if (key.includes('ingredient')) return 'ingredients';
    if (key.includes('menu')) return 'menus';
    if (key.includes('transaction')) return 'recentTransactions';
    if (key.includes('summary') || key.includes('report')) return 'reports';
    return 'default';
  }

  /**
   * Set up event listeners for tracking user actions
   */
  setupEventListeners() {
    // Track page navigation
    window.addEventListener('hashchange', () => {
      this.prefetcher.trackUserAction('navigate', {
        from: this.previousPage || 'unknown',
        to: window.location.hash
      });
      this.previousPage = window.location.hash;
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.dataset.trackAction) {
        this.prefetcher.trackUserAction(form.dataset.trackAction, {
          formId: form.id,
          formData: new FormData(form)
        });
      }
    });

    // Track button clicks
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-track-action]');
      if (button) {
        this.prefetcher.trackUserAction(button.dataset.trackAction, {
          buttonId: button.id,
          buttonText: button.textContent
        });
      }
    });
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const [cacheStats, prefetchStats] = await Promise.all([
      this.cache.getStats(),
      Promise.resolve(this.prefetcher.getStats())
    ]);

    return {
      cache: cacheStats,
      prefetch: prefetchStats,
      timestamp: Date.now()
    };
  }

  /**
   * Clear all cache and prefetch data
   */
  async clearAllData() {
    await Promise.all([
      this.cache.clearAll(),
      Promise.resolve(this.prefetcher.clearAllData())
    ]);
  }

  /**
   * Export cache data for backup
   */
  async exportCacheData() {
    const stats = await this.getSystemStats();
    const patterns = this.prefetcher.userPatterns;
    const usageStats = this.prefetcher.usageStats;
    
    return {
      timestamp: Date.now(),
      version: '1.0',
      stats,
      patterns: Array.from(patterns.entries()),
      usageStats: Array.from(usageStats.entries())
    };
  }

  /**
   * Import cache data from backup
   */
  async importCacheData(backupData) {
    try {
      if (backupData.patterns) {
        this.prefetcher.userPatterns = new Map(backupData.patterns);
        this.prefetcher.saveUserPatterns();
      }
      
      if (backupData.usageStats) {
        this.prefetcher.usageStats = new Map(backupData.usageStats);
        this.prefetcher.saveUsageStats();
      }
      
      console.log('Cache data imported successfully');
    } catch (error) {
      console.error('Failed to import cache data:', error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = POSCacheSystem;
} else if (typeof window !== 'undefined') {
  window.POSCacheSystem = POSCacheSystem;
}