/**
 * Advanced Multi-Level Cache Manager for POS System
 * Supports memory, sessionStorage, and IndexedDB with intelligent strategies
 */
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.dbName = 'POSCache';
    this.dbVersion = 1;
    this.db = null;
    this.maxMemorySize = 50; // Maximum items in memory cache
    this.defaultTTL = 30 * 60 * 1000; // 30 minutes default TTL
    
    // Cache strategies
    this.strategies = {
      CACHE_FIRST: 'cache-first',
      NETWORK_FIRST: 'network-first',
      STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
    };
    
    // Data type configurations
    this.dataConfigs = {
      ingredients: {
        strategy: this.strategies.CACHE_FIRST,
        ttl: 60 * 60 * 1000, // 1 hour
        storage: ['memory', 'session', 'indexeddb']
      },
      menus: {
        strategy: this.strategies.CACHE_FIRST,
        ttl: 60 * 60 * 1000, // 1 hour
        storage: ['memory', 'session', 'indexeddb']
      },
      sales: {
        strategy: this.strategies.NETWORK_FIRST,
        ttl: 5 * 60 * 1000, // 5 minutes
        storage: ['memory', 'session']
      },
      reports: {
        strategy: this.strategies.STALE_WHILE_REVALIDATE,
        ttl: 15 * 60 * 1000, // 15 minutes
        storage: ['memory', 'indexeddb']
      }
    };
    
    this.initializeIndexedDB();
    this.startCleanupTimer();
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  async initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for different data types
        Object.keys(this.dataConfigs).forEach(dataType => {
          if (!db.objectStoreNames.contains(dataType)) {
            const store = db.createObjectStore(dataType, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('expires', 'expires', { unique: false });
          }
        });
      };
    });
  }

  /**
   * Get data using the configured strategy for the data type
   */
  async get(key, dataType = 'default', fetchFunction = null) {
    const config = this.dataConfigs[dataType] || {
      strategy: this.strategies.CACHE_FIRST,
      ttl: this.defaultTTL,
      storage: ['memory', 'session']
    };

    switch (config.strategy) {
      case this.strategies.CACHE_FIRST:
        return await this.getCacheFirst(key, dataType, fetchFunction);
      case this.strategies.NETWORK_FIRST:
        return await this.getNetworkFirst(key, dataType, fetchFunction);
      case this.strategies.STALE_WHILE_REVALIDATE:
        return await this.getStaleWhileRevalidate(key, dataType, fetchFunction);
      default:
        return await this.getCacheFirst(key, dataType, fetchFunction);
    }
  }

  /**
   * Cache-first strategy: Check cache first, fallback to network
   */
  async getCacheFirst(key, dataType, fetchFunction) {
    // Try memory cache first
    const memoryData = this.getFromMemory(key);
    if (memoryData && !this.isExpired(memoryData)) {
      return memoryData.value;
    }

    // Try session storage
    const sessionData = this.getFromSession(key);
    if (sessionData && !this.isExpired(sessionData)) {
      // Promote to memory cache
      this.setInMemory(key, sessionData.value, sessionData.expires);
      return sessionData.value;
    }

    // Try IndexedDB
    const dbData = await this.getFromIndexedDB(key, dataType);
    if (dbData && !this.isExpired(dbData)) {
      // Promote to higher level caches
      this.setInMemory(key, dbData.value, dbData.expires);
      this.setInSession(key, dbData.value, dbData.expires);
      return dbData.value;
    }

    // Fallback to network
    if (fetchFunction) {
      try {
        const networkData = await fetchFunction();
        await this.set(key, networkData, dataType);
        return networkData;
      } catch (error) {
        console.warn('Network fetch failed:', error);
        // Return stale data if available
        return (dbData && dbData.value) || (sessionData && sessionData.value) || (memoryData && memoryData.value) || null;
      }
    }

    return null;
  }  /**

   * Network-first strategy: Try network first, fallback to cache
   */
  async getNetworkFirst(key, dataType, fetchFunction) {
    if (fetchFunction) {
      try {
        const networkData = await fetchFunction();
        await this.set(key, networkData, dataType);
        return networkData;
      } catch (error) {
        console.warn('Network fetch failed, falling back to cache:', error);
      }
    }

    // Fallback to cache
    return await this.getCacheFirst(key, dataType, null);
  }

  /**
   * Stale-while-revalidate strategy: Return cache immediately, update in background
   */
  async getStaleWhileRevalidate(key, dataType, fetchFunction) {
    // Get cached data immediately
    const cachedData = await this.getCacheFirst(key, dataType, null);
    
    // If we have cached data, return it and update in background
    if (cachedData && fetchFunction) {
      // Background update
      setTimeout(async () => {
        try {
          const freshData = await fetchFunction();
          await this.set(key, freshData, dataType);
        } catch (error) {
          console.warn('Background update failed:', error);
        }
      }, 0);
      
      return cachedData;
    }

    // No cached data, fetch synchronously
    if (fetchFunction) {
      try {
        const networkData = await fetchFunction();
        await this.set(key, networkData, dataType);
        return networkData;
      } catch (error) {
        console.warn('Network fetch failed:', error);
      }
    }

    return null;
  }

  /**
   * Set data in appropriate storage levels based on configuration
   */
  async set(key, value, dataType = 'default', customTTL = null) {
    const config = this.dataConfigs[dataType] || {
      ttl: this.defaultTTL,
      storage: ['memory', 'session']
    };

    const ttl = customTTL || config.ttl;
    const expires = Date.now() + ttl;

    // Store in configured storage levels
    if (config.storage.includes('memory')) {
      this.setInMemory(key, value, expires);
    }
    
    if (config.storage.includes('session')) {
      this.setInSession(key, value, expires);
    }
    
    if (config.storage.includes('indexeddb')) {
      await this.setInIndexedDB(key, value, expires, dataType);
    }
  }

  /**
   * Memory cache operations
   */
  getFromMemory(key) {
    return this.memoryCache.get(key);
  }

  setInMemory(key, value, expires) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expires,
      timestamp: Date.now()
    });
  }

  /**
   * Session storage operations
   */
  getFromSession(key) {
    try {
      const data = sessionStorage.getItem(`pos_cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Session storage read error:', error);
      return null;
    }
  }

  setInSession(key, value, expires) {
    try {
      const data = {
        value,
        expires,
        timestamp: Date.now()
      };
      sessionStorage.setItem(`pos_cache_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Session storage write error:', error);
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        this.clearExpiredFromSession();
      }
    }
  }

  /**
   * IndexedDB operations
   */
  async getFromIndexedDB(key, dataType) {
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([dataType], 'readonly');
        const store = transaction.objectStore(dataType);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          console.warn('IndexedDB read error:', request.error);
          resolve(null);
        };
      } catch (error) {
        console.warn('IndexedDB transaction error:', error);
        resolve(null);
      }
    });
  }

  async setInIndexedDB(key, value, expires, dataType) {
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([dataType], 'readwrite');
        const store = transaction.objectStore(dataType);
        
        const data = {
          key,
          value,
          expires,
          timestamp: Date.now()
        };

        const request = store.put(data);

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.warn('IndexedDB write error:', request.error);
          resolve(false);
        };
      } catch (error) {
        console.warn('IndexedDB transaction error:', error);
        resolve(false);
      }
    });
  }  /**
  
 * Check if cached data is expired
   */
  isExpired(data) {
    return data && data.expires && Date.now() > data.expires;
  }

  /**
   * Remove specific key from all cache levels
   */
  async remove(key, dataType = 'default') {
    // Remove from memory
    this.memoryCache.delete(key);

    // Remove from session storage
    try {
      sessionStorage.removeItem(`pos_cache_${key}`);
    } catch (error) {
      console.warn('Session storage remove error:', error);
    }

    // Remove from IndexedDB
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const transaction = this.db.transaction([dataType], 'readwrite');
          const store = transaction.objectStore(dataType);
          const request = store.delete(key);

          request.onsuccess = () => resolve(true);
          request.onerror = () => {
            console.warn('IndexedDB delete error:', request.error);
            resolve(false);
          };
        } catch (error) {
          console.warn('IndexedDB transaction error:', error);
          resolve(false);
        }
      });
    }
  }

  /**
   * Clear all expired entries from all cache levels
   */
  async clearExpired() {
    const now = Date.now();

    // Clear expired from memory cache
    for (const [key, data] of this.memoryCache.entries()) {
      if (this.isExpired(data)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear expired from session storage
    this.clearExpiredFromSession();

    // Clear expired from IndexedDB
    await this.clearExpiredFromIndexedDB();
  }

  /**
   * Clear expired entries from session storage
   */
  clearExpiredFromSession() {
    const keysToRemove = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('pos_cache_')) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key));
          if (this.isExpired(data)) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Remove corrupted entries
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn('Session storage cleanup error:', error);
      }
    });
  }

  /**
   * Clear expired entries from IndexedDB
   */
  async clearExpiredFromIndexedDB() {
    if (!this.db) return;

    const now = Date.now();
    
    for (const dataType of Object.keys(this.dataConfigs)) {
      try {
        const transaction = this.db.transaction([dataType], 'readwrite');
        const store = transaction.objectStore(dataType);
        const index = store.index('expires');
        
        // Get all entries that have expired
        const range = IDBKeyRange.upperBound(now);
        const request = index.openCursor(range);

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } catch (error) {
        console.warn(`IndexedDB cleanup error for ${dataType}:`, error);
      }
    }
  }

  /**
   * Clear all cache data
   */
  async clearAll() {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear session storage
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('pos_cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));

    // Clear IndexedDB
    if (this.db) {
      for (const dataType of Object.keys(this.dataConfigs)) {
        try {
          const transaction = this.db.transaction([dataType], 'readwrite');
          const store = transaction.objectStore(dataType);
          store.clear();
        } catch (error) {
          console.warn(`IndexedDB clear error for ${dataType}:`, error);
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.maxMemorySize
      },
      session: {
        size: 0,
        totalSize: 0
      },
      indexeddb: {}
    };

    // Session storage stats
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('pos_cache_')) {
        stats.session.size++;
        try {
          const data = sessionStorage.getItem(key);
          stats.session.totalSize += data.length;
        } catch (error) {
          // Ignore errors
        }
      }
    }

    // IndexedDB stats
    if (this.db) {
      for (const dataType of Object.keys(this.dataConfigs)) {
        try {
          const count = await this.countIndexedDBEntries(dataType);
          stats.indexeddb[dataType] = count;
        } catch (error) {
          stats.indexeddb[dataType] = 0;
        }
      }
    }

    return stats;
  }

  /**
   * Count entries in IndexedDB store
   */
  async countIndexedDBEntries(dataType) {
    if (!this.db) return 0;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([dataType], 'readonly');
        const store = transaction.objectStore(dataType);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      } catch (error) {
        resolve(0);
      }
    });
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanupTimer() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.clearExpired();
    }, 5 * 60 * 1000);
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(dataType, keys, fetchFunction) {
    if (!Array.isArray(keys) || !fetchFunction) return;

    const promises = keys.map(async (key) => {
      try {
        // Check if already cached and not expired
        const cached = await this.get(key, dataType);
        if (!cached) {
          // Fetch and cache the data
          const data = await fetchFunction(key);
          if (data) {
            await this.set(key, data, dataType);
          }
        }
      } catch (error) {
        console.warn(`Cache warming failed for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Batch operations for better performance
   */
  async batchSet(entries, dataType = 'default') {
    const promises = entries.map(({ key, value, ttl }) => 
      this.set(key, value, dataType, ttl)
    );
    
    return Promise.allSettled(promises);
  }

  async batchGet(keys, dataType = 'default', fetchFunction = null) {
    const promises = keys.map(key => 
      this.get(key, dataType, fetchFunction ? () => fetchFunction(key) : null)
    );
    
    return Promise.allSettled(promises);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CacheManager;
} else if (typeof window !== 'undefined') {
  window.CacheManager = CacheManager;
}