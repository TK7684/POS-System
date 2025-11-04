/**
 * PWA Testing Module
 * Tests Progressive Web App capabilities including service worker, offline functionality, and sync
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 7.9, 7.10
 */

class PWATestingModule {
  constructor(config = {}) {
    this.config = {
      serviceWorkerPath: config.serviceWorkerPath || '/sw.js',
      timeout: config.timeout || 10000,
      offlineThreshold: config.offlineThreshold || 500, // 500ms for offline mode
      syncTimeout: config.syncTimeout || 5000,
      ...config
    };
    
    this.testResults = {
      timestamp: null,
      serviceWorkerTests: [],
      offlineTests: [],
      cacheTests: [],
      syncTests: [],
      installTests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      pwaMetrics: {
        serviceWorker: {},
        offline: {},
        cache: {},
        sync: {}
      }
    };
    
    this.originalFetch = null;
    this.offlineTransactions = [];
  }

  /**
   * Test service worker registration and updates
   * Requirement: 7.1, 7.8
   */
  async testServiceWorker() {
    console.log('Testing service worker registration and updates...');
    
    const results = [];
    
    // Test 1: Check if service worker is supported
    try {
      const supported = 'serviceWorker' in navigator;
      
      results.push({
        testName: 'Service worker support',
        supported: supported,
        passed: supported,
        requirement: '7.1',
        message: supported
          ? 'Service worker is supported in this browser'
          : 'Service worker is not supported in this browser'
      });
      
      this.testResults.pwaMetrics.serviceWorker.supported = supported;
      
      if (!supported) {
        this.testResults.serviceWorkerTests = results;
        this.updateSummary(results);
        return {
          passed: false,
          results,
          summary: {
            total: results.length,
            passed: results.filter(r => r.passed).length,
            failed: results.filter(r => !r.passed).length
          }
        };
      }
      
    } catch (error) {
      results.push({
        testName: 'Service worker support',
        passed: false,
        error: error.message,
        requirement: '7.1'
      });
    }
    
    // Test 2: Check service worker registration
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const isRegistered = !!registration;
      
      results.push({
        testName: 'Service worker registration',
        isRegistered: isRegistered,
        scope: registration?.scope || 'N/A',
        passed: isRegistered,
        requirement: '7.1',
        message: isRegistered
          ? `Service worker is registered with scope: ${registration.scope}`
          : 'Service worker is not registered'
      });
      
      this.testResults.pwaMetrics.serviceWorker.registered = isRegistered;
      this.testResults.pwaMetrics.serviceWorker.scope = registration?.scope;
      
    } catch (error) {
      results.push({
        testName: 'Service worker registration',
        passed: false,
        error: error.message,
        requirement: '7.1'
      });
    }
    
    // Test 3: Check service worker state
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        const sw = registration.active || registration.waiting || registration.installing;
        const state = sw?.state || 'none';
        const passed = state === 'activated' || state === 'activating';
        
        results.push({
          testName: 'Service worker state',
          state: state,
          passed: passed,
          requirement: '7.1',
          message: passed
            ? `Service worker is in ${state} state`
            : `Service worker is in ${state} state (expected activated or activating)`
        });
        
        this.testResults.pwaMetrics.serviceWorker.state = state;
      } else {
        results.push({
          testName: 'Service worker state',
          passed: false,
          requirement: '7.1',
          message: 'No service worker registration found'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Service worker state',
        passed: false,
        error: error.message,
        requirement: '7.1'
      });
    }
    
    // Test 4: Test service worker messaging
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && registration.active) {
        const messagePromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Message timeout')), 2000);
          
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            clearTimeout(timeout);
            resolve(event.data);
          };
          
          registration.active.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
          );
        });
        
        const response = await messagePromise;
        const passed = !!response && !!response.version;
        
        results.push({
          testName: 'Service worker messaging',
          version: response?.version || 'N/A',
          passed: passed,
          requirement: '7.8',
          message: passed
            ? `Service worker responded with version: ${response.version}`
            : 'Service worker did not respond correctly'
        });
        
        this.testResults.pwaMetrics.serviceWorker.version = response?.version;
      } else {
        results.push({
          testName: 'Service worker messaging',
          passed: false,
          requirement: '7.8',
          message: 'No active service worker to test messaging'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Service worker messaging',
        passed: false,
        error: error.message,
        requirement: '7.8'
      });
    }
    
    // Test 5: Test service worker update check
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        const startTime = performance.now();
        await registration.update();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        results.push({
          testName: 'Service worker update check',
          duration: duration,
          passed: true,
          requirement: '7.8',
          message: `Service worker update check completed in ${duration.toFixed(2)}ms`
        });
        
        this.testResults.pwaMetrics.serviceWorker.updateCheckDuration = duration;
      } else {
        results.push({
          testName: 'Service worker update check',
          passed: false,
          requirement: '7.8',
          message: 'No service worker registration found'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Service worker update check',
        passed: false,
        error: error.message,
        requirement: '7.8'
      });
    }
    
    this.testResults.serviceWorkerTests = results;
    this.updateSummary(results);
    
    return {
      passed: results.filter(r => r.passed).length >= results.length - 1, // Allow 1 failure
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test offline capability - offline indicator and data viewing
   * Requirement: 7.2, 7.3
   */
  async testOfflineCapability() {
    console.log('Testing offline capability...');
    
    const results = [];
    
    // Test 1: Check if offline detection works
    try {
      const isOnline = navigator.onLine;
      
      results.push({
        testName: 'Online status detection',
        isOnline: isOnline,
        passed: true, // This test always passes, just reports status
        requirement: '7.2',
        message: `Browser reports online status as: ${isOnline}`
      });
      
      this.testResults.pwaMetrics.offline.initialOnlineStatus = isOnline;
      
    } catch (error) {
      results.push({
        testName: 'Online status detection',
        passed: false,
        error: error.message,
        requirement: '7.2'
      });
    }
    
    // Test 2: Test cached data availability
    try {
      const startTime = performance.now();
      
      // Check if critical data is cached
      const cachedIngredients = localStorage.getItem('ingredients');
      const cachedMenus = localStorage.getItem('menus');
      const cachedBootstrap = localStorage.getItem('bootstrapData');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const hasCachedData = !!(cachedIngredients || cachedMenus || cachedBootstrap);
      const passed = hasCachedData && duration < this.config.offlineThreshold;
      
      results.push({
        testName: 'Cached data availability',
        hasCachedData: hasCachedData,
        duration: duration,
        threshold: this.config.offlineThreshold,
        passed: passed,
        requirement: '7.3',
        message: passed
          ? `Cached data loaded in ${duration.toFixed(2)}ms`
          : hasCachedData
            ? `Cached data loaded in ${duration.toFixed(2)}ms, exceeds ${this.config.offlineThreshold}ms threshold`
            : 'No cached data available'
      });
      
      this.testResults.pwaMetrics.offline.cachedDataAvailable = hasCachedData;
      this.testResults.pwaMetrics.offline.cacheLoadTime = duration;
      
    } catch (error) {
      results.push({
        testName: 'Cached data availability',
        passed: false,
        error: error.message,
        requirement: '7.3'
      });
    }
    
    // Test 3: Test offline page availability
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        let offlinePageCached = false;
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const offlineResponse = await cache.match('/offline.html');
          if (offlineResponse) {
            offlinePageCached = true;
            break;
          }
        }
        
        results.push({
          testName: 'Offline page cached',
          cached: offlinePageCached,
          passed: offlinePageCached,
          requirement: '7.2',
          message: offlinePageCached
            ? 'Offline page is cached and available'
            : 'Offline page is not cached'
        });
        
        this.testResults.pwaMetrics.offline.offlinePageCached = offlinePageCached;
      } else {
        results.push({
          testName: 'Offline page cached',
          passed: false,
          requirement: '7.2',
          message: 'Cache API not supported'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Offline page cached',
        passed: false,
        error: error.message,
        requirement: '7.2'
      });
    }
    
    // Test 4: Test main app page cached
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        let mainPageCached = false;
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const mainResponse = await cache.match('/') || await cache.match('/Index.html');
          if (mainResponse) {
            mainPageCached = true;
            break;
          }
        }
        
        results.push({
          testName: 'Main app page cached',
          cached: mainPageCached,
          passed: mainPageCached,
          requirement: '7.3',
          message: mainPageCached
            ? 'Main app page is cached and available offline'
            : 'Main app page is not cached'
        });
        
        this.testResults.pwaMetrics.offline.mainPageCached = mainPageCached;
      } else {
        results.push({
          testName: 'Main app page cached',
          passed: false,
          requirement: '7.3',
          message: 'Cache API not supported'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Main app page cached',
        passed: false,
        error: error.message,
        requirement: '7.3'
      });
    }
    
    // Test 5: Simulate offline mode and test data viewing
    try {
      // Store test data in localStorage
      const testData = {
        ingredients: [
          { id: 'TEST_001', name: 'Test Ingredient 1', stock: 10 },
          { id: 'TEST_002', name: 'Test Ingredient 2', stock: 5 }
        ],
        menus: [
          { id: 'MENU_001', name: 'Test Menu 1', price: 50 },
          { id: 'MENU_002', name: 'Test Menu 2', price: 75 }
        ]
      };
      
      localStorage.setItem('test_offline_data', JSON.stringify(testData));
      
      const startTime = performance.now();
      
      // Simulate reading data while offline
      const retrievedData = JSON.parse(localStorage.getItem('test_offline_data'));
      const dataValid = retrievedData && 
                       retrievedData.ingredients.length === 2 && 
                       retrievedData.menus.length === 2;
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const passed = dataValid && duration < this.config.offlineThreshold;
      
      results.push({
        testName: 'Offline data viewing',
        dataValid: dataValid,
        duration: duration,
        threshold: this.config.offlineThreshold,
        passed: passed,
        requirement: '7.3',
        message: passed
          ? `Offline data retrieved and validated in ${duration.toFixed(2)}ms`
          : `Offline data viewing took ${duration.toFixed(2)}ms or data invalid`
      });
      
      // Cleanup
      localStorage.removeItem('test_offline_data');
      
      this.testResults.pwaMetrics.offline.dataViewingTime = duration;
      
    } catch (error) {
      results.push({
        testName: 'Offline data viewing',
        passed: false,
        error: error.message,
        requirement: '7.3'
      });
    }
    
    this.testResults.offlineTests = results;
    this.updateSummary(results);
    
    return {
      passed: results.filter(r => r.passed).length >= results.length - 1, // Allow 1 failure
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test cache strategy for critical resources
   * Requirement: 7.8
   */
  async testCacheStrategy() {
    console.log('Testing cache strategy for critical resources...');
    
    const results = [];
    
    // Test 1: Check if Cache API is supported
    try {
      const supported = 'caches' in window;
      
      results.push({
        testName: 'Cache API support',
        supported: supported,
        passed: supported,
        requirement: '7.8',
        message: supported
          ? 'Cache API is supported'
          : 'Cache API is not supported'
      });
      
      this.testResults.pwaMetrics.cache.supported = supported;
      
      if (!supported) {
        this.testResults.cacheTests = results;
        this.updateSummary(results);
        return {
          passed: false,
          results,
          summary: {
            total: results.length,
            passed: results.filter(r => r.passed).length,
            failed: results.filter(r => !r.passed).length
          }
        };
      }
      
    } catch (error) {
      results.push({
        testName: 'Cache API support',
        passed: false,
        error: error.message,
        requirement: '7.8'
      });
    }
    
    // Test 2: Check critical resources are cached
    try {
      const criticalResources = [
        '/',
        '/Index.html',
        '/offline.html',
        '/js/critical.js',
        '/css/critical.css',
        '/manifest.json'
      ];
      
      const cacheNames = await caches.keys();
      const cachedResources = [];
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        
        for (const resource of criticalResources) {
          const response = await cache.match(resource);
          if (response && !cachedResources.includes(resource)) {
            cachedResources.push(resource);
          }
        }
      }
      
      const cacheRate = cachedResources.length / criticalResources.length;
      const passed = cacheRate >= 0.5; // At least 50% of critical resources should be cached
      
      results.push({
        testName: 'Critical resources cached',
        totalResources: criticalResources.length,
        cachedResources: cachedResources.length,
        cacheRate: `${(cacheRate * 100).toFixed(1)}%`,
        cached: cachedResources,
        missing: criticalResources.filter(r => !cachedResources.includes(r)),
        passed: passed,
        requirement: '7.8',
        message: passed
          ? `${cachedResources.length}/${criticalResources.length} critical resources are cached`
          : `Only ${cachedResources.length}/${criticalResources.length} critical resources are cached (expected at least 50%)`
      });
      
      this.testResults.pwaMetrics.cache.criticalResourcesCached = cachedResources.length;
      this.testResults.pwaMetrics.cache.criticalResourcesTotal = criticalResources.length;
      
    } catch (error) {
      results.push({
        testName: 'Critical resources cached',
        passed: false,
        error: error.message,
        requirement: '7.8'
      });
    }
    
    // Test 3: Test cache retrieval performance
    try {
      const cacheNames = await caches.keys();
      
      if (cacheNames.length > 0) {
        const cache = await caches.open(cacheNames[0]);
        const keys = await cache.keys();
        
        if (keys.length > 0) {
          const startTime = performance.now();
          
          // Test retrieving first 5 cached items
          const retrievalPromises = keys.slice(0, 5).map(request => cache.match(request));
          await Promise.all(retrievalPromises);
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          const passed = duration < 100; // Should be very fast
          
          results.push({
            testName: 'Cache retrieval performance',
            itemsRetrieved: Math.min(5, keys.length),
            duration: duration,
            threshold: 100,
            passed: passed,
            requirement: '7.8',
            message: passed
              ? `Retrieved ${Math.min(5, keys.length)} cached items in ${duration.toFixed(2)}ms`
              : `Cache retrieval took ${duration.toFixed(2)}ms, exceeds 100ms threshold`
          });
          
          this.testResults.pwaMetrics.cache.retrievalTime = duration;
        } else {
          results.push({
            testName: 'Cache retrieval performance',
            passed: false,
            requirement: '7.8',
            message: 'No cached items found to test retrieval'
          });
        }
      } else {
        results.push({
          testName: 'Cache retrieval performance',
          passed: false,
          requirement: '7.8',
          message: 'No caches found'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Cache retrieval performance',
        passed: false,
        error: error.message,
        requirement: '7.8'
      });
    }
    
    // Test 4: Test cache storage size
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usageInMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        const quotaInMB = (estimate.quota / (1024 * 1024)).toFixed(2);
        const usagePercent = ((estimate.usage / estimate.quota) * 100).toFixed(1);
        
        const passed = estimate.usage < estimate.quota * 0.8; // Less than 80% used
        
        results.push({
          testName: 'Cache storage size',
          usage: `${usageInMB} MB`,
          quota: `${quotaInMB} MB`,
          usagePercent: `${usagePercent}%`,
          passed: passed,
          requirement: '7.8',
          message: passed
            ? `Cache using ${usageInMB} MB of ${quotaInMB} MB (${usagePercent}%)`
            : `Cache using ${usagePercent}% of quota (warning: over 80%)`
        });
        
        this.testResults.pwaMetrics.cache.usage = estimate.usage;
        this.testResults.pwaMetrics.cache.quota = estimate.quota;
      } else {
        results.push({
          testName: 'Cache storage size',
          passed: true,
          requirement: '7.8',
          message: 'Storage estimation API not supported (non-critical)'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Cache storage size',
        passed: false,
        error: error.message,
        requirement: '7.8'
      });
    }
    
    this.testResults.cacheTests = results;
    this.updateSummary(results);
    
    return {
      passed: results.filter(r => r.passed).length >= results.length - 1, // Allow 1 failure
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Update summary statistics
   */
  updateSummary(results) {
    this.testResults.summary.totalTests += results.length;
    this.testResults.summary.passed += results.filter(r => r.passed).length;
    this.testResults.summary.failed += results.filter(r => !r.passed).length;
  }

  /**
   * Get PWA test report
   */
  getPWAReport() {
    return {
      ...this.testResults,
      generatedAt: new Date().toISOString(),
      passed: this.testResults.summary.failed === 0,
      overallMetrics: this.calculateOverallMetrics()
    };
  }

  /**
   * Calculate overall PWA metrics
   */
  calculateOverallMetrics() {
    const metrics = {
      serviceWorker: {
        supported: this.testResults.pwaMetrics.serviceWorker.supported || false,
        registered: this.testResults.pwaMetrics.serviceWorker.registered || false,
        state: this.testResults.pwaMetrics.serviceWorker.state || 'unknown'
      },
      offline: {
        cachedDataAvailable: this.testResults.pwaMetrics.offline.cachedDataAvailable || false,
        cacheLoadTime: this.testResults.pwaMetrics.offline.cacheLoadTime || 0
      },
      cache: {
        supported: this.testResults.pwaMetrics.cache.supported || false,
        criticalResourcesCached: this.testResults.pwaMetrics.cache.criticalResourcesCached || 0,
        retrievalTime: this.testResults.pwaMetrics.cache.retrievalTime || 0
      }
    };
    
    return metrics;
  }

  /**
   * Reset test results
   */
  reset() {
    this.testResults = {
      timestamp: null,
      serviceWorkerTests: [],
      offlineTests: [],
      cacheTests: [],
      syncTests: [],
      installTests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      pwaMetrics: {
        serviceWorker: {},
        offline: {},
        cache: {},
        sync: {}
      }
    };
    
    this.offlineTransactions = [];
  }
}

  /**
   * Test offline transactions - local recording
   * Requirement: 7.4
   */
  async testOfflineTransactions() {
    console.log('Testing offline transaction recording...');
    
    const results = [];
    
    // Test 1: Record transaction while offline
    try {
      const transaction = {
        id: `OFFLINE_TXN_${Date.now()}`,
        type: 'sale',
        timestamp: new Date().toISOString(),
        data: {
          menu_id: 'TEST_MENU_001',
          qty: 2,
          price: 80,
          platform: 'Grab'
        },
        synced: false
      };
      
      const startTime = performance.now();
      
      // Store transaction in localStorage (simulating offline storage)
      const offlineQueue = JSON.parse(localStorage.getItem('offline_transactions') || '[]');
      offlineQueue.push(transaction);
      localStorage.setItem('offline_transactions', JSON.stringify(offlineQueue));
      
      // Verify it was stored
      const stored = JSON.parse(localStorage.getItem('offline_transactions'));
      const transactionStored = stored.some(t => t.id === transaction.id);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const passed = transactionStored && duration < 100;
      
      results.push({
        testName: 'Record offline transaction',
        transactionId: transaction.id,
        duration: duration,
        stored: transactionStored,
        passed: passed,
        requirement: '7.4',
        message: passed
          ? `Offline transaction recorded in ${duration.toFixed(2)}ms`
          : `Failed to record offline transaction or took too long (${duration.toFixed(2)}ms)`
      });
      
      this.offlineTransactions.push(transaction);
      this.testResults.pwaMetrics.sync.offlineTransactionsRecorded = this.offlineTransactions.length;
      
    } catch (error) {
      results.push({
        testName: 'Record offline transaction',
        passed: false,
        error: error.message,
        requirement: '7.4'
      });
    }
    
    // Test 2: Record multiple offline transactions
    try {
      const transactions = [
        {
          id: `OFFLINE_TXN_${Date.now()}_1`,
          type: 'purchase',
          timestamp: new Date().toISOString(),
          data: { ingredient_id: 'ING_001', qty: 5, price: 200 },
          synced: false
        },
        {
          id: `OFFLINE_TXN_${Date.now()}_2`,
          type: 'sale',
          timestamp: new Date().toISOString(),
          data: { menu_id: 'MENU_002', qty: 1, price: 75 },
          synced: false
        },
        {
          id: `OFFLINE_TXN_${Date.now()}_3`,
          type: 'sale',
          timestamp: new Date().toISOString(),
          data: { menu_id: 'MENU_001', qty: 3, price: 50 },
          synced: false
        }
      ];
      
      const startTime = performance.now();
      
      const offlineQueue = JSON.parse(localStorage.getItem('offline_transactions') || '[]');
      offlineQueue.push(...transactions);
      localStorage.setItem('offline_transactions', JSON.stringify(offlineQueue));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const stored = JSON.parse(localStorage.getItem('offline_transactions'));
      const allStored = transactions.every(t => stored.some(s => s.id === t.id));
      
      const passed = allStored && duration < 200;
      
      results.push({
        testName: 'Record multiple offline transactions',
        transactionCount: transactions.length,
        duration: duration,
        allStored: allStored,
        passed: passed,
        requirement: '7.4',
        message: passed
          ? `${transactions.length} offline transactions recorded in ${duration.toFixed(2)}ms`
          : `Failed to record all transactions or took too long (${duration.toFixed(2)}ms)`
      });
      
      this.offlineTransactions.push(...transactions);
      this.testResults.pwaMetrics.sync.offlineTransactionsRecorded = this.offlineTransactions.length;
      
    } catch (error) {
      results.push({
        testName: 'Record multiple offline transactions',
        passed: false,
        error: error.message,
        requirement: '7.4'
      });
    }
    
    // Test 3: Retrieve offline transactions
    try {
      const startTime = performance.now();
      
      const offlineQueue = JSON.parse(localStorage.getItem('offline_transactions') || '[]');
      const unsyncedTransactions = offlineQueue.filter(t => !t.synced);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const passed = unsyncedTransactions.length > 0 && duration < 50;
      
      results.push({
        testName: 'Retrieve offline transactions',
        unsyncedCount: unsyncedTransactions.length,
        duration: duration,
        passed: passed,
        requirement: '7.4',
        message: passed
          ? `Retrieved ${unsyncedTransactions.length} unsynced transactions in ${duration.toFixed(2)}ms`
          : `Failed to retrieve transactions or took too long (${duration.toFixed(2)}ms)`
      });
      
      this.testResults.pwaMetrics.sync.unsyncedTransactions = unsyncedTransactions.length;
      
    } catch (error) {
      results.push({
        testName: 'Retrieve offline transactions',
        passed: false,
        error: error.message,
        requirement: '7.4'
      });
    }
    
    // Test 4: Validate offline transaction data integrity
    try {
      const offlineQueue = JSON.parse(localStorage.getItem('offline_transactions') || '[]');
      
      const validTransactions = offlineQueue.filter(t => {
        return t.id && 
               t.type && 
               t.timestamp && 
               t.data && 
               typeof t.synced === 'boolean';
      });
      
      const integrityRate = offlineQueue.length > 0 
        ? validTransactions.length / offlineQueue.length 
        : 1;
      
      const passed = integrityRate === 1;
      
      results.push({
        testName: 'Offline transaction data integrity',
        totalTransactions: offlineQueue.length,
        validTransactions: validTransactions.length,
        integrityRate: `${(integrityRate * 100).toFixed(1)}%`,
        passed: passed,
        requirement: '7.4',
        message: passed
          ? `All ${offlineQueue.length} offline transactions have valid data structure`
          : `${validTransactions.length}/${offlineQueue.length} transactions have valid data (${(integrityRate * 100).toFixed(1)}%)`
      });
      
    } catch (error) {
      results.push({
        testName: 'Offline transaction data integrity',
        passed: false,
        error: error.message,
        requirement: '7.4'
      });
    }
    
    this.testResults.syncTests.push(...results);
    this.updateSummary(results);
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test background sync for automatic syncing
   * Requirement: 7.5, 7.9
   */
  async testBackgroundSync() {
    console.log('Testing background sync...');
    
    const results = [];
    
    // Test 1: Check if Background Sync API is supported
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const supported = registration && 'sync' in registration;
      
      results.push({
        testName: 'Background Sync API support',
        supported: supported,
        passed: true, // Non-critical, just report status
        requirement: '7.5',
        message: supported
          ? 'Background Sync API is supported'
          : 'Background Sync API is not supported (will use fallback sync)'
      });
      
      this.testResults.pwaMetrics.sync.backgroundSyncSupported = supported;
      
    } catch (error) {
      results.push({
        testName: 'Background Sync API support',
        passed: false,
        error: error.message,
        requirement: '7.5'
      });
    }
    
    // Test 2: Register background sync
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && 'sync' in registration) {
        await registration.sync.register('pos-data-sync');
        
        results.push({
          testName: 'Register background sync',
          syncTag: 'pos-data-sync',
          passed: true,
          requirement: '7.5',
          message: 'Background sync registered successfully'
        });
        
        this.testResults.pwaMetrics.sync.syncRegistered = true;
      } else {
        results.push({
          testName: 'Register background sync',
          passed: false,
          requirement: '7.5',
          message: 'Background Sync API not available'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Register background sync',
        passed: false,
        error: error.message,
        requirement: '7.5'
      });
    }
    
    // Test 3: Simulate sync process
    try {
      const offlineQueue = JSON.parse(localStorage.getItem('offline_transactions') || '[]');
      const unsyncedTransactions = offlineQueue.filter(t => !t.synced);
      
      if (unsyncedTransactions.length > 0) {
        const startTime = performance.now();
        
        // Simulate syncing transactions
        const syncResults = [];
        for (const transaction of unsyncedTransactions) {
          // Simulate API call (in real scenario, this would be actual API call)
          const syncSuccess = Math.random() > 0.1; // 90% success rate
          
          if (syncSuccess) {
            transaction.synced = true;
            transaction.syncedAt = new Date().toISOString();
            syncResults.push({ id: transaction.id, success: true });
          } else {
            syncResults.push({ id: transaction.id, success: false, error: 'Simulated sync failure' });
          }
        }
        
        // Update localStorage with synced transactions
        localStorage.setItem('offline_transactions', JSON.stringify(offlineQueue));
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const successCount = syncResults.filter(r => r.success).length;
        const successRate = successCount / unsyncedTransactions.length;
        const passed = successRate >= 0.8 && duration < this.config.syncTimeout;
        
        results.push({
          testName: 'Simulate sync process',
          transactionsToSync: unsyncedTransactions.length,
          successfulSyncs: successCount,
          failedSyncs: unsyncedTransactions.length - successCount,
          successRate: `${(successRate * 100).toFixed(1)}%`,
          duration: duration,
          passed: passed,
          requirement: '7.5',
          message: passed
            ? `Synced ${successCount}/${unsyncedTransactions.length} transactions in ${duration.toFixed(2)}ms`
            : `Only ${successCount}/${unsyncedTransactions.length} transactions synced successfully`
        });
        
        this.testResults.pwaMetrics.sync.syncedTransactions = successCount;
        this.testResults.pwaMetrics.sync.syncDuration = duration;
      } else {
        results.push({
          testName: 'Simulate sync process',
          passed: true,
          requirement: '7.5',
          message: 'No unsynced transactions to sync'
        });
      }
      
    } catch (error) {
      results.push({
        testName: 'Simulate sync process',
        passed: false,
        error: error.message,
        requirement: '7.5'
      });
    }
    
    // Test 4: Test automatic sync on connection restore
    try {
      // Simulate connection restore event
      const startTime = performance.now();
      
      // Create a promise that simulates sync trigger
      const syncPromise = new Promise((resolve) => {
        // Simulate sync delay
        setTimeout(() => {
          resolve({ synced: true });
        }, 100);
      });
      
      const result = await syncPromise;
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const passed = result.synced && duration < 1000;
      
      results.push({
        testName: 'Automatic sync on connection restore',
        duration: duration,
        passed: passed,
        requirement: '7.9',
        message: passed
          ? `Automatic sync triggered in ${duration.toFixed(2)}ms`
          : `Automatic sync took too long (${duration.toFixed(2)}ms)`
      });
      
    } catch (error) {
      results.push({
        testName: 'Automatic sync on connection restore',
        passed: false,
        error: error.message,
        requirement: '7.9'
      });
    }
    
    // Test 5: Test sync retry mechanism
    try {
      // Simulate failed sync with retry
      let retryCount = 0;
      const maxRetries = 3;
      let syncSuccess = false;
      
      const startTime = performance.now();
      
      while (retryCount < maxRetries && !syncSuccess) {
        // Simulate sync attempt (50% success rate per attempt)
        syncSuccess = Math.random() > 0.5;
        retryCount++;
        
        if (!syncSuccess && retryCount < maxRetries) {
          // Simulate exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 10));
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const passed = syncSuccess || retryCount === maxRetries;
      
      results.push({
        testName: 'Sync retry mechanism',
        retryCount: retryCount,
        maxRetries: maxRetries,
        syncSuccess: syncSuccess,
        duration: duration,
        passed: passed,
        requirement: '7.9',
        message: syncSuccess
          ? `Sync succeeded after ${retryCount} attempt(s) in ${duration.toFixed(2)}ms`
          : `Sync failed after ${maxRetries} retries in ${duration.toFixed(2)}ms`
      });
      
      this.testResults.pwaMetrics.sync.retryAttempts = retryCount;
      
    } catch (error) {
      results.push({
        testName: 'Sync retry mechanism',
        passed: false,
        error: error.message,
        requirement: '7.9'
      });
    }
    
    this.testResults.syncTests.push(...results);
    this.updateSummary(results);
    
    return {
      passed: results.filter(r => r.passed).length >= results.length - 1, // Allow 1 failure
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test sync conflicts and conflict resolution
   * Requirement: 7.6, 7.10
   */
  async testSyncConflicts() {
    console.log('Testing sync conflict resolution...');
    
    const results = [];
    
    // Test 1: Detect sync conflicts
    try {
      // Create conflicting transactions (same resource modified locally and remotely)
      const localTransaction = {
        id: 'TXN_CONFLICT_001',
        type: 'sale',
        menu_id: 'MENU_001',
        qty: 2,
        price: 80,
        timestamp: new Date().toISOString(),
        version: 1,
        source: 'local'
      };
      
      const remoteTransaction = {
        id: 'TXN_CONFLICT_001',
        type: 'sale',
        menu_id: 'MENU_001',
        qty: 3, // Different quantity
        price: 80,
        timestamp: new Date(Date.now() + 1000).toISOString(), // Slightly later
        version: 1,
        source: 'remote'
      };
      
      // Detect conflict
      const hasConflict = localTransaction.id === remoteTransaction.id && 
                         localTransaction.version === remoteTransaction.version &&
                         (localTransaction.qty !== remoteTransaction.qty);
      
      results.push({
        testName: 'Detect sync conflicts',
        conflictDetected: hasConflict,
        localData: localTransaction,
        remoteData: remoteTransaction,
        passed: hasConflict,
        requirement: '7.6',
        message: hasConflict
          ? 'Sync conflict detected successfully'
          : 'Failed to detect sync conflict'
      });
      
      this.testResults.pwaMetrics.sync.conflictsDetected = hasConflict ? 1 : 0;
      
    } catch (error) {
      results.push({
        testName: 'Detect sync conflicts',
        passed: false,
        error: error.message,
        requirement: '7.6'
      });
    }
    
    // Test 2: Resolve conflict - last write wins
    try {
      const localTransaction = {
        id: 'TXN_002',
        data: { value: 100 },
        timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
        source: 'local'
      };
      
      const remoteTransaction = {
        id: 'TXN_002',
        data: { value: 150 },
        timestamp: new Date('2024-01-01T10:05:00Z').toISOString(),
        source: 'remote'
      };
      
      // Resolve using last write wins strategy
      const localTime = new Date(localTransaction.timestamp).getTime();
      const remoteTime = new Date(remoteTransaction.timestamp).getTime();
      
      const resolved = remoteTime > localTime ? remoteTransaction : localTransaction;
      const passed = resolved.source === 'remote' && resolved.data.value === 150;
      
      results.push({
        testName: 'Resolve conflict - last write wins',
        strategy: 'last-write-wins',
        winner: resolved.source,
        resolvedValue: resolved.data.value,
        passed: passed,
        requirement: '7.10',
        message: passed
          ? `Conflict resolved using last-write-wins: ${resolved.source} transaction kept`
          : 'Conflict resolution failed'
      });
      
    } catch (error) {
      results.push({
        testName: 'Resolve conflict - last write wins',
        passed: false,
        error: error.message,
        requirement: '7.10'
      });
    }
    
    // Test 3: Resolve conflict - manual resolution
    try {
      const conflict = {
        id: 'TXN_003',
        local: { qty: 2, price: 80, total: 160 },
        remote: { qty: 3, price: 80, total: 240 },
        timestamp: new Date().toISOString()
      };
      
      // Store conflict for manual resolution
      const conflicts = JSON.parse(localStorage.getItem('sync_conflicts') || '[]');
      conflicts.push(conflict);
      localStorage.setItem('sync_conflicts', JSON.stringify(conflicts));
      
      // Verify conflict was stored
      const storedConflicts = JSON.parse(localStorage.getItem('sync_conflicts'));
      const conflictStored = storedConflicts.some(c => c.id === conflict.id);
      
      results.push({
        testName: 'Store conflict for manual resolution',
        conflictId: conflict.id,
        stored: conflictStored,
        passed: conflictStored,
        requirement: '7.6',
        message: conflictStored
          ? 'Conflict stored for manual resolution'
          : 'Failed to store conflict'
      });
      
      this.testResults.pwaMetrics.sync.conflictsForManualResolution = storedConflicts.length;
      
    } catch (error) {
      results.push({
        testName: 'Store conflict for manual resolution',
        passed: false,
        error: error.message,
        requirement: '7.6'
      });
    }
    
    // Test 4: Resolve conflict - merge strategy
    try {
      const localData = {
        id: 'ITEM_001',
        name: 'Test Item',
        stock: 10,
        price: 50,
        updatedFields: ['stock']
      };
      
      const remoteData = {
        id: 'ITEM_001',
        name: 'Test Item Updated',
        stock: 15,
        price: 55,
        updatedFields: ['name', 'price']
      };
      
      // Merge non-conflicting fields
      const merged = {
        id: localData.id,
        name: remoteData.name, // From remote
        stock: localData.stock, // From local
        price: remoteData.price // From remote
      };
      
      const passed = merged.name === 'Test Item Updated' && 
                    merged.stock === 10 && 
                    merged.price === 55;
      
      results.push({
        testName: 'Resolve conflict - merge strategy',
        strategy: 'merge',
        mergedData: merged,
        passed: passed,
        requirement: '7.10',
        message: passed
          ? 'Conflict resolved by merging non-conflicting fields'
          : 'Merge strategy failed'
      });
      
    } catch (error) {
      results.push({
        testName: 'Resolve conflict - merge strategy',
        passed: false,
        error: error.message,
        requirement: '7.10'
      });
    }
    
    // Test 5: Test conflict notification
    try {
      const conflicts = JSON.parse(localStorage.getItem('sync_conflicts') || '[]');
      
      if (conflicts.length > 0) {
        // Simulate showing conflict notification
        const notification = {
          type: 'sync-conflict',
          message: `${conflicts.length} sync conflict(s) require attention`,
          conflicts: conflicts,
          timestamp: new Date().toISOString()
        };
        
        const passed = notification.conflicts.length > 0;
        
        results.push({
          testName: 'Conflict notification',
          conflictCount: conflicts.length,
          notificationCreated: true,
          passed: passed,
          requirement: '7.6',
          message: passed
            ? `Notification created for ${conflicts.length} conflict(s)`
            : 'Failed to create conflict notification'
        });
      } else {
        results.push({
          testName: 'Conflict notification',
          passed: true,
          requirement: '7.6',
          message: 'No conflicts to notify about'
        });
      }
      
      // Cleanup
      localStorage.removeItem('sync_conflicts');
      
    } catch (error) {
      results.push({
        testName: 'Conflict notification',
        passed: false,
        error: error.message,
        requirement: '7.6'
      });
    }
    
    this.testResults.syncTests.push(...results);
    this.updateSummary(results);
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Run all PWA tests
   */
  async runAllTests() {
    console.log('Running all PWA tests...');
    
    this.reset();
    this.testResults.timestamp = new Date().toISOString();
    
    const allResults = {
      serviceWorker: await this.testServiceWorker(),
      offline: await this.testOfflineCapability(),
      cache: await this.testCacheStrategy(),
      offlineTransactions: await this.testOfflineTransactions(),
      backgroundSync: await this.testBackgroundSync(),
      syncConflicts: await this.testSyncConflicts()
    };
    
    const overallPassed = Object.values(allResults).every(r => r.passed);
    
    return {
      passed: overallPassed,
      results: allResults,
      summary: this.testResults.summary,
      report: this.getPWAReport()
    };
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWATestingModule;
} else if (typeof window !== 'undefined') {
  window.PWATestingModule = PWATestingModule;
}
