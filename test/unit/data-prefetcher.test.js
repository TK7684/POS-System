/**
 * Unit Tests for DataPrefetcher
 * Tests intelligent prefetching and user pattern analysis
 */

describe('DataPrefetcher', () => {
  let dataPrefetcher;
  let mockCacheManager;
  let mockApiClient;

  beforeEach(() => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      warmCache: jest.fn()
    };

    mockApiClient = {
      getIngredient: jest.fn(),
      getMenu: jest.fn(),
      getFrequentIngredients: jest.fn(),
      getPopularMenus: jest.fn(),
      getRecentTransactions: jest.fn(),
      getLowStockIngredients: jest.fn(),
      getTodaySummary: jest.fn(),
      getRecentPriceUpdates: jest.fn()
    };

    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    dataPrefetcher = new DataPrefetcher(mockCacheManager, mockApiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Pattern Tracking', () => {
    test('should track user actions with context', () => {
      const action = 'add_purchase';
      const data = { ingredientId: 'test-001', quantity: 2 };
      
      dataPrefetcher.trackUserAction(action, data);
      
      expect(dataPrefetcher.userPatterns.size).toBeGreaterThan(0);
      expect(dataPrefetcher.usageStats.has('ingredient_test-001')).toBe(true);
    });

    test('should update usage statistics correctly', () => {
      const data = { ingredientId: 'test-001', quantity: 2 };
      
      dataPrefetcher.updateUsageStats('add_purchase', data);
      
      const stats = dataPrefetcher.usageStats.get('ingredient_test-001');
      expect(stats.count).toBe(1);
      expect(stats.lastUsed).toBeGreaterThan(0);
      expect(stats.recentUses).toHaveLength(1);
    });

    test('should increment usage statistics for multiple uses', () => {
      const data = { ingredientId: 'test-001' };
      
      dataPrefetcher.updateUsageStats('add_purchase', data);
      dataPrefetcher.updateUsageStats('add_sale', data);
      
      const stats = dataPrefetcher.usageStats.get('ingredient_test-001');
      expect(stats.count).toBe(2);
      expect(stats.recentUses).toHaveLength(2);
    });

    test('should calculate frequency correctly', () => {
      const data = { ingredientId: 'test-001' };
      
      // Add multiple uses
      for (let i = 0; i < 7; i++) {
        dataPrefetcher.updateUsageStats('add_purchase', data);
      }
      
      const stats = dataPrefetcher.usageStats.get('ingredient_test-001');
      expect(stats.frequency).toBe(1); // 7 uses in 7 days = 1 per day
    });
  });

  describe('Context Analysis', () => {
    test('should determine time of day correctly', () => {
      // Mock different hours
      const originalDate = Date;
      global.Date = jest.fn(() => ({ getHours: () => 10 }));
      
      const timeOfDay = dataPrefetcher.getTimeOfDay();
      expect(timeOfDay).toBe('morning');
      
      global.Date = originalDate;
    });

    test('should detect weekend correctly', () => {
      const originalDate = Date;
      global.Date = jest.fn(() => ({ getDay: () => 0 })); // Sunday
      
      const isWeekend = dataPrefetcher.isWeekend();
      expect(isWeekend).toBe(true);
      
      global.Date = originalDate;
    });

    test('should get current context with all properties', () => {
      const context = dataPrefetcher.getCurrentContext();
      
      expect(context).toHaveProperty('screen');
      expect(context).toHaveProperty('timeOfDay');
      expect(context).toHaveProperty('isWeekend');
      expect(context).toHaveProperty('recentActions');
    });
  });

  describe('Prediction Generation', () => {
    test('should generate time-based predictions', () => {
      const currentPattern = {
        action: 'add_purchase',
        hour: 10,
        dayOfWeek: 1,
        context: { recentActions: [] }
      };
      
      // Add some historical patterns
      dataPrefetcher.userPatterns.set('add_purchase_10_1', [
        { action: 'add_purchase', timestamp: Date.now() - 1000 }
      ]);
      
      const predictions = dataPrefetcher.getTimeBasedPredictions(currentPattern);
      
      expect(Array.isArray(predictions)).toBe(true);
    });

    test('should generate frequency-based predictions', () => {
      // Set up usage statistics
      dataPrefetcher.usageStats.set('ingredient_test-001', {
        count: 10,
        lastUsed: Date.now(),
        frequency: 2,
        recentUses: [Date.now()]
      });
      
      const predictions = dataPrefetcher.getFrequencyBasedPredictions();
      
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);
    });

    test('should generate sequential predictions', () => {
      const recentActions = ['add_purchase', 'search_ingredient'];
      
      // Set up some historical sequences
      dataPrefetcher.userPatterns.set('test_pattern', [
        { action: 'add_purchase', timestamp: Date.now() - 2000 },
        { action: 'search_ingredient', timestamp: Date.now() - 1000 }
      ]);
      
      const predictions = dataPrefetcher.getSequentialPredictions(recentActions);
      
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe('Prefetch Queue Management', () => {
    test('should queue items for prefetching', async () => {
      const prediction = {
        type: 'ingredients',
        id: 'test-001',
        confidence: 0.8,
        reason: 'frequency-based'
      };
      
      mockCacheManager.get.mockResolvedValue(null); // Not cached
      
      await dataPrefetcher.queuePrefetch(prediction);
      
      expect(dataPrefetcher.prefetchQueue.length).toBeGreaterThan(0);
    });

    test('should not queue items that are already cached', async () => {
      const prediction = {
        type: 'ingredients',
        id: 'test-001',
        confidence: 0.8
      };
      
      mockCacheManager.get.mockResolvedValue({ cached: 'data' }); // Already cached
      
      await dataPrefetcher.queuePrefetch(prediction);
      
      expect(dataPrefetcher.prefetchQueue.length).toBe(0);
    });

    test('should sort queue by priority and confidence', async () => {
      const predictions = [
        { type: 'ingredients', confidence: 0.6, priority: 2 },
        { type: 'menus', confidence: 0.8, priority: 1 },
        { type: 'ingredients', confidence: 0.9, priority: 2 }
      ];
      
      mockCacheManager.get.mockResolvedValue(null);
      
      for (const prediction of predictions) {
        await dataPrefetcher.queuePrefetch(prediction);
      }
      
      // Should be sorted by priority first, then confidence
      expect(dataPrefetcher.prefetchQueue[0].priority).toBe(1);
      expect(dataPrefetcher.prefetchQueue[1].confidence).toBeGreaterThan(
        dataPrefetcher.prefetchQueue[2].confidence
      );
    });
  });

  describe('Prefetch Processing', () => {
    test('should prefetch ingredients correctly', async () => {
      const item = {
        type: 'ingredients',
        id: 'test-001',
        confidence: 0.8
      };
      
      mockApiClient.getIngredient.mockResolvedValue({ id: 'test-001', name: 'Test Ingredient' });
      
      await dataPrefetcher.prefetchItem(item);
      
      expect(mockApiClient.getIngredient).toHaveBeenCalledWith('test-001');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'ingredient_test-001',
        { id: 'test-001', name: 'Test Ingredient' },
        'ingredients'
      );
    });

    test('should prefetch menus correctly', async () => {
      const item = {
        type: 'menus',
        id: 'menu-001',
        confidence: 0.7
      };
      
      mockApiClient.getMenu.mockResolvedValue({ id: 'menu-001', name: 'Test Menu' });
      
      await dataPrefetcher.prefetchItem(item);
      
      expect(mockApiClient.getMenu).toHaveBeenCalledWith('menu-001');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'menu_menu-001',
        { id: 'menu-001', name: 'Test Menu' },
        'menus'
      );
    });

    test('should handle prefetch errors gracefully', async () => {
      const item = {
        type: 'ingredients',
        id: 'test-001',
        confidence: 0.8
      };
      
      mockApiClient.getIngredient.mockRejectedValue(new Error('Network error'));
      
      // Should not throw
      await expect(dataPrefetcher.prefetchItem(item)).resolves.toBeUndefined();
    });
  });

  describe('Cache Warming', () => {
    test('should warm cache with frequent items', async () => {
      // Set up frequent items
      dataPrefetcher.usageStats.set('ingredient_test-001', {
        count: 10,
        frequency: 2,
        lastUsed: Date.now()
      });
      dataPrefetcher.usageStats.set('menu_menu-001', {
        count: 8,
        frequency: 1.5,
        lastUsed: Date.now()
      });
      
      await dataPrefetcher.warmCacheWithFrequentItems();
      
      expect(mockCacheManager.warmCache).toHaveBeenCalledTimes(2);
    });
  });

  describe('Background Sync', () => {
    test('should sync critical data', async () => {
      mockApiClient.getLowStockIngredients.mockResolvedValue([]);
      mockApiClient.getTodaySummary.mockResolvedValue({});
      mockApiClient.getRecentPriceUpdates.mockResolvedValue([]);
      
      await dataPrefetcher.syncCriticalData();
      
      expect(mockApiClient.getLowStockIngredients).toHaveBeenCalled();
      expect(mockApiClient.getTodaySummary).toHaveBeenCalled();
      expect(mockApiClient.getRecentPriceUpdates).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledTimes(3);
    });

    test('should handle sync errors gracefully', async () => {
      mockApiClient.getLowStockIngredients.mockRejectedValue(new Error('Network error'));
      
      // Should not throw
      await expect(dataPrefetcher.syncCriticalData()).resolves.toBeUndefined();
    });
  });

  describe('Data Persistence', () => {
    test('should save user patterns to localStorage', () => {
      dataPrefetcher.userPatterns.set('test-pattern', [{ action: 'test' }]);
      
      dataPrefetcher.saveUserPatterns();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pos_user_patterns',
        expect.stringContaining('test-pattern')
      );
    });

    test('should load user patterns from localStorage', () => {
      const mockPatterns = [['test-pattern', [{ action: 'test' }]]];
      localStorage.getItem.mockReturnValue(JSON.stringify(mockPatterns));
      
      dataPrefetcher.loadUserPatterns();
      
      expect(dataPrefetcher.userPatterns.has('test-pattern')).toBe(true);
    });

    test('should handle localStorage errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw
      expect(() => dataPrefetcher.loadUserPatterns()).not.toThrow();
    });
  });

  describe('Statistics and Analytics', () => {
    test('should return prefetching statistics', () => {
      dataPrefetcher.prefetchQueue = [{ type: 'ingredients' }];
      dataPrefetcher.userPatterns.set('pattern1', []);
      dataPrefetcher.usageStats.set('ingredient_test-001', { frequency: 2 });
      
      const stats = dataPrefetcher.getStats();
      
      expect(stats.queueLength).toBe(1);
      expect(stats.patternsCount).toBe(1);
      expect(stats.usageStatsCount).toBe(1);
      expect(stats.frequentIngredients).toBeDefined();
      expect(stats.frequentMenus).toBeDefined();
    });

    test('should get most frequent items correctly', () => {
      dataPrefetcher.usageStats.set('ingredient_test-001', { frequency: 3 });
      dataPrefetcher.usageStats.set('ingredient_test-002', { frequency: 1 });
      dataPrefetcher.usageStats.set('menu_menu-001', { frequency: 2 });
      
      const frequentIngredients = dataPrefetcher.getMostFrequentItems('ingredient', 2);
      
      expect(frequentIngredients).toHaveLength(2);
      expect(frequentIngredients[0].frequency).toBe(3);
      expect(frequentIngredients[1].frequency).toBe(1);
    });
  });

  describe('Data Management', () => {
    test('should clear all data', () => {
      dataPrefetcher.userPatterns.set('pattern1', []);
      dataPrefetcher.usageStats.set('stat1', {});
      dataPrefetcher.prefetchQueue = [{ type: 'test' }];
      
      dataPrefetcher.clearAllData();
      
      expect(dataPrefetcher.userPatterns.size).toBe(0);
      expect(dataPrefetcher.usageStats.size).toBe(0);
      expect(dataPrefetcher.prefetchQueue).toHaveLength(0);
      expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
    });
  });
});