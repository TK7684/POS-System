/**
 * Optimized Cache Manager for POS System
 * Enhanced with intelligent caching strategies and performance optimizations
 */

import { CACHE, PERFORMANCE } from '../config/config.js';
import { logError, logWarn, logInfo, logDebug, safeJsonParse, safeJsonStringify } from '../utils/utils.js';

/**
 * Enhanced Cache Manager with multiple storage layers
 */
export class CacheManager {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.sessionStorageAvailable = this.checkStorageAvailability('sessionStorage');
    this.indexedDBAvailable = this.checkIndexedDBAvailability();
    this.dbName = options.dbName || 'POSCache';
    this.dbVersion = options.dbVersion || 1;
    this.db = null;

    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0
    };

    // Initialize IndexedDB if available
    if (this.indexedDBAvailable) {
      this.initializeIndexedDB();
    }

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Get data from cache with fallback strategy
   * @param {string} key - Cache key
   * @param {Object} options - Cache options
   * @returns {Promise<any>} Cached data
   */
  async get(key, options = {}) {
    const strategy = options.strategy || 'cacheFirst';
    const ttl = options.ttl || CACHE.TTL;

    try {
      switch (strategy) {
        case 'cacheFirst':
          return await this.getCacheFirst(key, ttl);
        case 'networkFirst':
          return await this.getNetworkFirst(key, options.fetchFn, ttl);
        case 'staleWhileRevalidate':
          return await this.getStaleWhileRevalidate(key, options.fetchFn, ttl);
        default:
          return await this.getCacheFirst(key, ttl);
      }
    } catch (error) {
      logError('Cache get failed:', { key, error: error.message });
      return null;
    }
  }

  /**
   * Cache-first strategy: Try cache first, then network
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>} Cached data
   */
  async getCacheFirst(key, ttl) {
    // Try memory cache first
    const memoryData = this.getFromMemory(key);
    if (memoryData !== null && !this.isExpired(memoryData, ttl)) {
      this.metrics.hits++;
      return memoryData.data;
    }

    // Try sessionStorage
    if (this.sessionStorageAvailable) {
      const sessionData = this.getFromSession(key);
      if (sessionData !== null && !this.isExpired(sessionData, ttl)) {
        this.metrics.hits++;
        // Store in memory for faster access
        this.setInMemory(key, sessionData);
        return sessionData.data;
      }
    }

    // Try IndexedDB
    if (this.indexedDBAvailable && this.db) {
      try {
        const dbData = await this.getFromIndexedDB(key);
        if (dbData !== null && !this.isExpired(dbData, ttl)) {
          this.metrics.hits++;
          // Store in memory and sessionStorage for faster access
          this.setInMemory(key, dbData);
          if (this.sessionStorageAvailable) {
            this.setInSession(key, dbData);
          }
          return dbData.data;
        }
      } catch (error) {
        logError('IndexedDB get failed:', { key, error: error.message });
      }
    }

    this.metrics.misses++;
    return null;
  }

  /**
   * Network-first strategy: Try network first, then cache
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch fresh data
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>} Fresh data
   */
  async getNetworkFirst(key, fetchFn, ttl) {
    try {
      const freshData = await fetchFn();
      await this.set(key, freshData, ttl);
      return freshData;
    } catch (error) {
      logWarn('Network fetch failed, trying cache:', { key, error: error.message });
      return await this.getCacheFirst(key, ttl);
    }
  }

  /**
   * Stale-while-revalidate strategy
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch fresh data
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>} Cached data (stale or fresh)
   */
  async getStaleWhileRevalidate(key, fetchFn, ttl) {
    const cachedData = await this.getCacheFirst(key, ttl * 2); // Allow stale data

    // Revalidate in background
    if (fetchFn) {
      fetchFn().then(freshData => {
        this.set(key, freshData, ttl);
      }).catch(error => {
        logError('Background revalidation failed:', { key, error: error.message });
      });
    }

    return cachedData;
  }

  /**
   * Set data in cache with intelligent storage
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<void>}
   */
  async set(key, data, ttl = CACHE.TTL) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      size: this.calculateSize(data)
    };

    try {
      // Store in memory
      this.setInMemory(key, cacheEntry);

      // Store in sessionStorage for persistence
      if (this.sessionStorageAvailable && cacheEntry.size < 5 * 1024 * 1024) { // 5MB limit
        this.setInSession(key, cacheEntry);
      }

      // Store in IndexedDB for large data and persistence
      if (this.indexedDBAvailable && this.db) {
        await this.setInIndexedDB(key, cacheEntry);
      }

      this.metrics.sets++;
      this.updateSize();

    } catch (error) {
      logError('Cache set failed:', { key, error: error.message });
    }
  }

  /**
   * Remove data from cache
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async remove(key) {
    try {
      this.memoryCache.delete(key);

      if (this.sessionStorageAvailable) {
        sessionStorage.removeItem(`${CACHE.STORAGE_PREFIX}${key}`);
      }

      if (this.indexedDBAvailable && this.db) {
        await this.removeFromIndexedDB(key);
      }

      this.metrics.deletes++;
      this.updateSize();

    } catch (error) {
      logError('Cache remove failed:', { key, error: error.message });
    }
  }

  /**
   * Clear expired entries
   * @returns {Promise<number>} Number of cleared entries
   */
  async clearExpired() {
    let clearedCount = 0;

    try {
      // Clear memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
          clearedCount++;
        }
      }

      // Clear sessionStorage
      if (this.sessionStorageAvailable) {
        clearedCount += this.clearExpiredFromSession();
      }

      // Clear IndexedDB
      if (this.indexedDBAvailable && this.db) {
        clearedCount += await this.clearExpiredFromIndexedDB();
      }

      this.metrics.evictions += clearedCount;
      this.updateSize();

      logInfo(`Cleared ${clearedCount} expired cache entries`);

    } catch (error) {
      logError('Cache cleanup failed:', { error: error.message });
    }

    return clearedCount;
  }

  /**
   * Clear all cache data
   * @returns {Promise<void>}
   */
  async clearAll() {
    try {
      this.memoryCache.clear();

      if (this.sessionStorageAvailable) {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.startsWith(CACHE.STORAGE_PREFIX)) {
            sessionStorage.removeItem(key);
          }
        });
      }

      if (this.indexedDBAvailable && this.db) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await store.clear();
      }

      // Reset metrics
      this.metrics = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        size: 0
      };

      logInfo('All cache data cleared');

    } catch (error) {
      logError('Cache clear all failed:', { error: error.message });
    }
  }

  /**
   * Batch set operations
   * @param {Array} entries - Array of {key, data, ttl} objects
   * @returns {Promise<void>}
   */
  async batchSet(entries) {
    const promises = entries.map(({ key, data, ttl }) =>
      this.set(key, data, ttl)
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      logError('Batch cache set failed:', { error: error.message });
    }
  }

  /**
   * Batch get operations
   * @param {Array} keys - Array of cache keys
   * @param {Object} options - Get options
   * @returns {Promise<Array>} Array of cached data
   */
  async batchGet(keys, options = {}) {
    const promises = keys.map(key =>
      this.get(key, options)
    );

    try {
      return await Promise.all(promises);
    } catch (error) {
      logError('Batch cache get failed:', { error: error.message });
      return keys.map(() => null);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
      : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      memorySize: this.memoryCache.size,
      storageAvailable: {
        sessionStorage: this.sessionStorageAvailable,
        indexedDB: this.indexedDBAvailable
      }
    };
  }

  /**
   * Prefetch data based on usage patterns
   * @param {Array} items - Items to prefetch
   * @param {Function} fetchFn - Function to fetch data
   * @returns {Promise<void>}
   */
  async prefetch(items, fetchFn) {
    const promises = items.map(async (item) => {
      try {
        const exists = await this.get(item.key);
        if (exists === null) {
          const data = await fetchFn(item);
          await this.set(item.key, data, item.ttl);
        }
      } catch (error) {
        logError('Prefetch failed:', { key: item.key, error: error.message });
      }
    });

    await Promise.allSettled(promises);
  }

  // ===== Private Methods =====

  /**
   * Check storage availability
   * @param {string} type - Storage type ('localStorage' or 'sessionStorage')
   * @returns {boolean} True if available
   */
  checkStorageAvailability(type) {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check IndexedDB availability
   * @returns {boolean} True if available
   */
  checkIndexedDBAvailability() {
    return 'indexedDB' in window && indexedDB !== null;
  }

  /**
   * Initialize IndexedDB
   * @returns {Promise<void>}
   */
  async initializeIndexedDB() {
    try {
      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('cache')) {
            const store = db.createObjectStore('cache', { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('ttl', 'ttl', { unique: false });
          }
        };
      });

      logDebug('IndexedDB initialized successfully');

    } catch (error) {
      logError('IndexedDB initialization failed:', { error: error.message });
      this.indexedDBAvailable = false;
    }
  }

  /**
   * Get data from memory cache
   * @param {string} key - Cache key
   * @returns {*} Cached data or null
   */
  getFromMemory(key) {
    const entry = this.memoryCache.get(key);
    return entry || null;
  }

  /**
   * Set data in memory cache
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  setInMemory(key, data) {
    // Evict oldest entries if memory limit exceeded
    if (this.memoryCache.size >= CACHE.MEMORY_LIMIT) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, data);
  }

  /**
   * Get data from sessionStorage
   * @param {string} key - Cache key
   * @returns {*} Cached data or null
   */
  getFromSession(key) {
    if (!this.sessionStorageAvailable) return null;

    try {
      const stored = sessionStorage.getItem(`${CACHE.STORAGE_PREFIX}${key}`);
      return stored ? safeJsonParse(stored) : null;
    } catch (error) {
      logError('SessionStorage get failed:', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set data in sessionStorage
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  setInSession(key, data) {
    if (!this.sessionStorageAvailable) return;

    try {
      sessionStorage.setItem(`${CACHE.STORAGE_PREFIX}${key}`, safeJsonStringify(data));
    } catch (error) {
      logError('SessionStorage set failed:', { key, error: error.message });
    }
  }

  /**
   * Get data from IndexedDB
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached data or null
   */
  async getFromIndexedDB(key) {
    if (!this.db) return null;

    try {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const result = await store.get(key);
      return result || null;
    } catch (error) {
      logError('IndexedDB get failed:', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set data in IndexedDB
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  async setInIndexedDB(key, data) {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.put({ key, ...data });
    } catch (error) {
      logError('IndexedDB set failed:', { key, error: error.message });
    }
  }

  /**
   * Remove data from IndexedDB
   * @param {string} key - Cache key
   */
  async removeFromIndexedDB(key) {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.delete(key);
    } catch (error) {
      logError('IndexedDB remove failed:', { key, error: error.message });
    }
  }

  /**
   * Check if cache entry is expired
   * @param {*} entry - Cache entry
   * @param {number} customTtl - Custom TTL override
   * @returns {boolean} True if expired
   */
  isExpired(entry, customTtl) {
    if (!entry || !entry.timestamp) return true;

    const ttl = customTtl || entry.ttl || CACHE.TTL;
    return Date.now() - entry.timestamp > ttl;
  }

  /**
   * Calculate data size in bytes
   * @param {*} data - Data to measure
   * @returns {number} Size in bytes
   */
  calculateSize(data) {
    return new Blob([safeJsonStringify(data)]).size;
  }

  /**
   * Update cache size metric
   */
  updateSize() {
    let totalSize = 0;

    for (const entry of this.memoryCache.values()) {
      totalSize += entry.size || 0;
    }

    this.metrics.size = totalSize;
  }

  /**
   * Clear expired entries from sessionStorage
   * @returns {number} Number of cleared entries
   */
  clearExpiredFromSession() {
    if (!this.sessionStorageAvailable) return 0;

    let clearedCount = 0;
    const keys = Object.keys(sessionStorage);

    keys.forEach(key => {
      if (key.startsWith(CACHE.STORAGE_PREFIX)) {
        try {
          const data = safeJsonParse(sessionStorage.getItem(key));
          if (data && this.isExpired(data)) {
            sessionStorage.removeItem(key);
            clearedCount++;
          }
        } catch (error) {
          // Remove invalid entries
          sessionStorage.removeItem(key);
          clearedCount++;
        }
      }
    });

    return clearedCount;
  }

  /**
   * Clear expired entries from IndexedDB
   * @returns {Promise<number>} Number of cleared entries
   */
  async clearExpiredFromIndexedDB() {
    if (!this.db) return 0;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.openCursor();
      let clearedCount = 0;

      await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            if (this.isExpired(cursor.value)) {
              cursor.delete();
              clearedCount++;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });

      return clearedCount;

    } catch (error) {
      logError('IndexedDB cleanup failed:', { error: error.message });
      return 0;
    }
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.clearExpired();
    }, CACHE.CLEANUP_INTERVAL);
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Export for use in other modules
export default cacheManager;
