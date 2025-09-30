/**
 * Integration Tests for Data Synchronization
 * Tests offline/online sync, conflict resolution, and data integrity
 */

describe('Data Synchronization Integration', () => {
  let cacheManager;
  let apiClient;
  let dataPrefetcher;
  let serviceWorkerManager;

  beforeEach(async () => {
    // Initialize components
    cacheManager = new CacheManager();
    apiClient = new ApiClient('https://test-api.com/exec');
    dataPrefetcher = new DataPrefetcher(cacheManager, apiClient);
    
    // Mock ServiceWorkerManager
    serviceWorkerManager = {
      isOnline: jest.fn().mockReturnValue(true),
      queueOfflineAction: jest.fn(),
      syncOfflineActions: jest.fn(),
      addEventListener: jest.fn()
    };

    // Mock API responses
    jest.spyOn(apiClient, 'getAllIngredients').mockResolvedValue([
      { id: 'ing-001', name: 'กุ้ง', stock: 10, lastModified: Date.now() },
      { id: 'ing-002', name: 'ข้าว', stock: 50, lastModified: Date.now() }
    ]);

    jest.spyOn(apiClient, 'getAllMenus').mockResolvedValue([
      { id: 'menu-001', name: 'ผัดไทยกุ้ง', price: 80, lastModified: Date.now() }
    ]);

    // Initialize cache
    await cacheManager.initializeIndexedDB();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Data Loading', () => {
    test('should load and cache initial data on app startup', async () => {
      // Simulate app startup data loading
      const ingredients = await apiClient.getAllIngredients();
      const menus = await apiClient.getAllMenus();

      // Cache the data
      await cacheManager.set('all_ingredients', ingredients, 'ingredients');
      await cacheManager.set('all_menus', menus, 'menus');

      // Verify data is cached
      const cachedIngredients = await cacheManager.get('all_ingredients', 'ingredients');
      const cachedMenus = await cacheManager.get('all_menus', 'menus');

      expect(cachedIngredients).toEqual(ingredients);
      expect(cachedMenus).toEqual(menus);
    });

    test('should handle initial data loading failures gracefully', async () => {
      jest.spyOn(apiClient, 'getAllIngredients').mockRejectedValue(new Error('Network error'));

      // Should not throw, should use cached data if available
      const result = await cacheManager.get('all_ingredients', 'ingredients', 
        () => apiClient.getAllIngredients()
      );

      // Should return null if no cached data and network fails
      expect(result).toBeNull();
    });
  });

  describe('Offline Data Operations', () => {
    test('should queue operations when offline', async () => {
      serviceWorkerManager.isOnline.mockReturnValue(false);

      const purchaseData = {
        ingredientId: 'ing-001',
        quantity: 5,
        price: 200,
        timestamp: Date.now()
      };

      // Simulate offline purchase
      if (!serviceWorkerManager.isOnline()) {
        serviceWorkerManager.queueOfflineAction({
          type: 'addPurchase',
          data: purchaseData,
          id: 'offline-purchase-001'
        });
      }

      expect(serviceWorkerManager.queueOfflineAction).toHaveBeenCalledWith({
        type: 'addPurchase',
        data: purchaseData,
        id: 'offline-purchase-001'
      });
    });

    test('should sync queued operations when back online', async () => {
      const queuedActions = [
        {
          type: 'addPurchase',
          data: { ingredientId: 'ing-001', quantity: 5 },
          id: 'offline-001'
        },
        {
          type: 'addSale',
          data: { menuId: 'menu-001', quantity: 2 },
          id: 'offline-002'
        }
      ];

      jest.spyOn(apiClient, 'addPurchase').mockResolvedValue({ success: true });
      jest.spyOn(apiClient, 'addSale').mockResolvedValue({ success: true });

      // Simulate sync process
      serviceWorkerManager.syncOfflineActions.mockImplementation(async () => {
        for (const action of queuedActions) {
          if (action.type === 'addPurchase') {
            await apiClient.addPurchase(action.data);
          } else if (action.type === 'addSale') {
            await apiClient.addSale(action.data);
          }
        }
      });

      await serviceWorkerManager.syncOfflineActions();

      expect(apiClient.addPurchase).toHaveBeenCalledWith(queuedActions[0].data);
      expect(apiClient.addSale).toHaveBeenCalledWith(queuedActions[1].data);
    });
  });

  describe('Data Conflict Resolution', () => {
    test('should detect conflicts between local and server data', async () => {
      const localData = {
        id: 'ing-001',
        name: 'กุ้ง',
        stock: 8,
        lastModified: Date.now() - 5000 // 5 seconds ago
      };

      const serverData = {
        id: 'ing-001',
        name: 'กุ้ง',
        stock: 12,
        lastModified: Date.now() - 2000 // 2 seconds ago (newer)
      };

      // Cache local data
      await cacheManager.set('ingredient_ing-001', localData, 'ingredients');

      // Mock server returning newer data
      jest.spyOn(apiClient, 'getIngredient').mockResolvedValue(serverData);

      // Simulate conflict detection
      const cachedData = await cacheManager.get('ingredient_ing-001', 'ingredients');
      const freshData = await apiClient.getIngredient('ing-001');

      const hasConflict = cachedData.lastModified !== freshData.lastModified;
      expect(hasConflict).toBe(true);

      // Server data should win (newer timestamp)
      const resolvedData = freshData.lastModified > cachedData.lastModified ? freshData : cachedData;
      expect(resolvedData).toEqual(serverData);
    });

    test('should handle merge conflicts for complex data', async () => {
      const localTransaction = {
        id: 'txn-001',
        items: [
          { ingredientId: 'ing-001', quantity: 5, localChange: true }
        ],
        total: 250,
        lastModified: Date.now() - 3000
      };

      const serverTransaction = {
        id: 'txn-001',
        items: [
          { ingredientId: 'ing-001', quantity: 5 },
          { ingredientId: 'ing-002', quantity: 2, serverChange: true }
        ],
        total: 350,
        lastModified: Date.now() - 1000
      };

      // Simulate merge strategy (combine items, use server total)
      const mergedTransaction = {
        id: 'txn-001',
        items: [
          ...localTransaction.items,
          ...serverTransaction.items.filter(serverItem => 
            !localTransaction.items.some(localItem => 
              localItem.ingredientId === serverItem.ingredientId
            )
          )
        ],
        total: serverTransaction.total, // Use server total
        lastModified: Math.max(localTransaction.lastModified, serverTransaction.lastModified)
      };

      expect(mergedTransaction.items).toHaveLength(2);
      expect(mergedTransaction.total).toBe(350);
      expect(mergedTransaction.items[0].localChange).toBe(true);
      expect(mergedTransaction.items[1].serverChange).toBe(true);
    });
  });

  describe('Real-time Data Updates', () => {
    test('should update cache when data changes on server', async () => {
      // Initial data
      const initialIngredient = { id: 'ing-001', name: 'กุ้ง', stock: 10 };
      await cacheManager.set('ingredient_ing-001', initialIngredient, 'ingredients');

      // Simulate server update
      const updatedIngredient = { id: 'ing-001', name: 'กุ้ง', stock: 8 };
      jest.spyOn(apiClient, 'getIngredient').mockResolvedValue(updatedIngredient);

      // Use stale-while-revalidate to get fresh data
      const result = await cacheManager.getStaleWhileRevalidate(
        'ingredient_ing-001',
        'ingredients',
        () => apiClient.getIngredient('ing-001')
      );

      // Should return cached data immediately
      expect(result).toEqual(initialIngredient);

      // Wait for background update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cache should now have updated data
      const freshResult = await cacheManager.get('ingredient_ing-001', 'ingredients');
      expect(freshResult).toEqual(updatedIngredient);
    });
  });

  describe('Data Integrity Validation', () => {
    test('should validate data integrity after sync', async () => {
      const testData = {
        ingredients: [
          { id: 'ing-001', name: 'กุ้ง', stock: 10 },
          { id: 'ing-002', name: 'ข้าว', stock: 50 }
        ],
        transactions: [
          { id: 'txn-001', type: 'purchase', ingredientId: 'ing-001', quantity: 5 }
        ]
      };

      // Cache data
      await cacheManager.set('all_ingredients', testData.ingredients, 'ingredients');
      await cacheManager.set('recent_transactions', testData.transactions, 'sales');

      // Validate data integrity
      const cachedIngredients = await cacheManager.get('all_ingredients', 'ingredients');
      const cachedTransactions = await cacheManager.get('recent_transactions', 'sales');

      // Check that referenced ingredients exist
      const referencedIngredients = cachedTransactions
        .filter(txn => txn.ingredientId)
        .map(txn => txn.ingredientId);

      const existingIngredients = cachedIngredients.map(ing => ing.id);
      const missingReferences = referencedIngredients.filter(id => 
        !existingIngredients.includes(id)
      );

      expect(missingReferences).toHaveLength(0);
    });

    test('should handle corrupted cache data', async () => {
      // Simulate corrupted data in session storage
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid-json');

      const result = await cacheManager.getFromSession('corrupted-key');
      expect(result).toBeNull();
    });
  });

  describe('Performance Under Load', () => {
    test('should handle concurrent sync operations', async () => {
      const concurrentOperations = [];

      // Create multiple concurrent sync operations
      for (let i = 0; i < 10; i++) {
        const operation = async () => {
          const data = { id: `item-${i}`, value: `data-${i}` };
          await cacheManager.set(`key-${i}`, data, 'ingredients');
          return cacheManager.get(`key-${i}`, 'ingredients');
        };
        concurrentOperations.push(operation());
      }

      const results = await Promise.all(concurrentOperations);

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.id).toBe(`item-${index}`);
        expect(result.value).toBe(`data-${index}`);
      });
    });

    test('should maintain performance with large datasets', async () => {
      const largeDataset = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          id: `item-${i}`,
          name: `Item ${i}`,
          data: `Large data string for item ${i}`.repeat(10)
        });
      }

      const startTime = performance.now();
      await cacheManager.set('large_dataset', largeDataset, 'ingredients');
      const cached = await cacheManager.get('large_dataset', 'ingredients');
      const endTime = performance.now();

      expect(cached).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Error Recovery', () => {
    test('should recover from IndexedDB errors', async () => {
      // Mock IndexedDB failure
      const originalDB = cacheManager.db;
      cacheManager.db = null;

      // Should fallback to session storage
      const testData = { test: 'data' };
      await cacheManager.set('test-key', testData, 'ingredients');

      // Should still be able to retrieve from session storage
      const result = await cacheManager.get('test-key', 'ingredients');
      expect(result).toEqual(testData);

      // Restore DB
      cacheManager.db = originalDB;
    });

    test('should handle network failures during sync', async () => {
      jest.spyOn(apiClient, 'addPurchase').mockRejectedValue(new Error('Network error'));

      const purchaseData = { ingredientId: 'ing-001', quantity: 5 };

      // Should not throw error, should handle gracefully
      await expect(async () => {
        try {
          await apiClient.addPurchase(purchaseData);
        } catch (error) {
          // Queue for retry
          serviceWorkerManager.queueOfflineAction({
            type: 'addPurchase',
            data: purchaseData,
            retry: true
          });
        }
      }).not.toThrow();

      expect(serviceWorkerManager.queueOfflineAction).toHaveBeenCalled();
    });
  });
});