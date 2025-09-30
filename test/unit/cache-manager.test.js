/**
 * Unit Tests for CacheManager
 * Tests all caching strategies and storage levels
 */

describe('CacheManager', () => {
  let cacheManager;
  let mockIndexedDB;

  beforeEach(() => {
    // Mock IndexedDB
    mockIndexedDB = {
      open: jest.fn().mockResolvedValue({
        objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
        createObjectStore: jest.fn().mockReturnValue({
          createIndex: jest.fn()
        })
      }),
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn().mockResolvedValue(true),
          delete: jest.fn().mockResolvedValue(true)
        })
      })
    };

    global.indexedDB = mockIndexedDB;
    global.sessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn()
    };

    cacheManager = new CacheManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Memory Cache Operations', () => {
    test('should store and retrieve data from memory cache', () => {
      const testData = { test: 'data' };
      const expires = Date.now() + 60000;
      
      cacheManager.setInMemory('test-key', testData, expires);
      const retrieved = cacheManager.getFromMemory('test-key');
      
      expect(retrieved.value).toEqual(testData);
      expect(retrieved.expires).toBe(expires);
    });

    test('should implement LRU eviction when cache is full', () => {
      // Fill cache to max capacity
      for (let i = 0; i < cacheManager.maxMemorySize; i++) {
        cacheManager.setInMemory(`key-${i}`, `data-${i}`, Date.now() + 60000);
      }
      
      expect(cacheManager.memoryCache.size).toBe(cacheManager.maxMemorySize);
      
      // Add one more item to trigger eviction
      cacheManager.setInMemory('new-key', 'new-data', Date.now() + 60000);
      
      expect(cacheManager.memoryCache.size).toBe(cacheManager.maxMemorySize);
      expect(cacheManager.memoryCache.has('key-0')).toBe(false);
      expect(cacheManager.memoryCache.has('new-key')).toBe(true);
    });

    test('should handle expired data correctly', () => {
      const testData = { test: 'data' };
      const expiredTime = Date.now() - 1000; // 1 second ago
      
      cacheManager.setInMemory('expired-key', testData, expiredTime);
      const retrieved = cacheManager.getFromMemory('expired-key');
      
      expect(cacheManager.isExpired(retrieved)).toBe(true);
    });
  });

  describe('Session Storage Operations', () => {
    test('should store and retrieve data from session storage', () => {
      const testData = { test: 'data' };
      const expires = Date.now() + 60000;
      
      sessionStorage.getItem.mockReturnValue(JSON.stringify({
        value: testData,
        expires,
        timestamp: Date.now()
      }));
      
      cacheManager.setInSession('test-key', testData, expires);
      const retrieved = cacheManager.getFromSession('test-key');
      
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'pos_cache_test-key',
        expect.stringContaining('"test":"data"')
      );
      expect(retrieved.value).toEqual(testData);
    });

    test('should handle session storage quota exceeded error', () => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      sessionStorage.setItem.mockImplementation(() => {
        throw error;
      });
      
      const spy = jest.spyOn(cacheManager, 'clearExpiredFromSession');
      
      cacheManager.setInSession('test-key', 'test-data', Date.now() + 60000);
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Cache Strategies', () => {
    test('should implement cache-first strategy correctly', async () => {
      const testData = { test: 'data' };
      const mockFetch = jest.fn().mockResolvedValue(testData);
      
      // Set up memory cache with data
      cacheManager.setInMemory('test-key', testData, Date.now() + 60000);
      
      const result = await cacheManager.getCacheFirst('test-key', 'ingredients', mockFetch);
      
      expect(result).toEqual(testData);
      expect(mockFetch).not.toHaveBeenCalled(); // Should not fetch from network
    });

    test('should fallback to network when cache is empty', async () => {
      const networkData = { network: 'data' };
      const mockFetch = jest.fn().mockResolvedValue(networkData);
      
      const result = await cacheManager.getCacheFirst('missing-key', 'ingredients', mockFetch);
      
      expect(result).toEqual(networkData);
      expect(mockFetch).toHaveBeenCalled();
    });

    test('should implement network-first strategy correctly', async () => {
      const networkData = { network: 'data' };
      const cachedData = { cached: 'data' };
      const mockFetch = jest.fn().mockResolvedValue(networkData);
      
      // Set up cache with different data
      cacheManager.setInMemory('test-key', cachedData, Date.now() + 60000);
      
      const result = await cacheManager.getNetworkFirst('test-key', 'sales', mockFetch);
      
      expect(result).toEqual(networkData);
      expect(mockFetch).toHaveBeenCalled();
    });

    test('should implement stale-while-revalidate strategy', async () => {
      const cachedData = { cached: 'data' };
      const freshData = { fresh: 'data' };
      const mockFetch = jest.fn().mockResolvedValue(freshData);
      
      // Set up cache with stale data
      cacheManager.setInMemory('test-key', cachedData, Date.now() + 60000);
      
      const result = await cacheManager.getStaleWhileRevalidate('test-key', 'reports', mockFetch);
      
      expect(result).toEqual(cachedData); // Should return cached data immediately
      expect(mockFetch).toHaveBeenCalled(); // Should update in background
    });
  });

  describe('Data Type Configurations', () => {
    test('should use correct strategy for ingredients', async () => {
      const spy = jest.spyOn(cacheManager, 'getCacheFirst');
      
      await cacheManager.get('test-key', 'ingredients');
      
      expect(spy).toHaveBeenCalled();
    });

    test('should use correct strategy for sales', async () => {
      const spy = jest.spyOn(cacheManager, 'getNetworkFirst');
      
      await cacheManager.get('test-key', 'sales');
      
      expect(spy).toHaveBeenCalled();
    });

    test('should use correct strategy for reports', async () => {
      const spy = jest.spyOn(cacheManager, 'getStaleWhileRevalidate');
      
      await cacheManager.get('test-key', 'reports');
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Cache Cleanup', () => {
    test('should clear expired entries from memory cache', async () => {
      const validData = { valid: 'data' };
      const expiredData = { expired: 'data' };
      
      cacheManager.setInMemory('valid-key', validData, Date.now() + 60000);
      cacheManager.setInMemory('expired-key', expiredData, Date.now() - 1000);
      
      await cacheManager.clearExpired();
      
      expect(cacheManager.memoryCache.has('valid-key')).toBe(true);
      expect(cacheManager.memoryCache.has('expired-key')).toBe(false);
    });

    test('should clear all cache data', async () => {
      cacheManager.setInMemory('test-key', 'test-data', Date.now() + 60000);
      
      await cacheManager.clearAll();
      
      expect(cacheManager.memoryCache.size).toBe(0);
      expect(sessionStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    test('should handle batch set operations', async () => {
      const entries = [
        { key: 'key1', value: 'data1', ttl: 60000 },
        { key: 'key2', value: 'data2', ttl: 60000 },
        { key: 'key3', value: 'data3', ttl: 60000 }
      ];
      
      const results = await cacheManager.batchSet(entries, 'ingredients');
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });

    test('should handle batch get operations', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const mockFetch = jest.fn().mockResolvedValue('mock-data');
      
      const results = await cacheManager.batchGet(keys, 'ingredients', mockFetch);
      
      expect(results).toHaveLength(3);
    });
  });

  describe('Cache Statistics', () => {
    test('should return accurate cache statistics', async () => {
      cacheManager.setInMemory('test-key', 'test-data', Date.now() + 60000);
      
      const stats = await cacheManager.getStats();
      
      expect(stats.memory.size).toBe(1);
      expect(stats.memory.maxSize).toBe(cacheManager.maxMemorySize);
      expect(stats.session).toBeDefined();
      expect(stats.indexeddb).toBeDefined();
    });
  });

  describe('Cache Warming', () => {
    test('should warm cache with frequently accessed data', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const mockFetch = jest.fn().mockResolvedValue('fetched-data');
      
      await cacheManager.warmCache('ingredients', keys, mockFetch);
      
      expect(mockFetch).toHaveBeenCalledTimes(keys.length);
    });

    test('should not fetch data that is already cached', async () => {
      const keys = ['cached-key', 'missing-key'];
      const mockFetch = jest.fn().mockResolvedValue('fetched-data');
      
      // Pre-cache one key
      cacheManager.setInMemory('cached-key', 'existing-data', Date.now() + 60000);
      
      await cacheManager.warmCache('ingredients', keys, mockFetch);
      
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only for missing-key
    });
  });
});