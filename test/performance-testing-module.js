/**
 * Performance Testing Module (Slim)
 * Replaced with clean implementation to resolve prior file corruption.
 * For full implementation see git history or specs; this version keeps required API for UI runner.
 */

class PerformanceTestingModule {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || '',
      timeout: config.timeout || 10000,
      cacheThreshold: config.cacheThreshold || 10, // 10ms for cache operations
      apiThreshold: config.apiThreshold || 2000, // 2000ms for API responses
      sheetThreshold: config.sheetThreshold || 100, // 100ms for sheet access
      offlineThreshold: config.offlineThreshold || 500, // 500ms for offline mode
      searchThreshold: config.searchThreshold || 300, // 300ms for search
      pwaInstallThreshold: config.pwaInstallThreshold || 3000, // 3s for PWA install
      ...config
    };
    
    this.testResults = {
      timestamp: null,
      cacheTests: [],
      apiTests: [],
      sheetTests: [],
      loadTests: [],
      concurrentTests: [],
      offlineTests: [],
      pwaTests: [],
      searchTests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      performanceMetrics: {
        cache: {},
        api: {},
        sheets: {},
        load: {},
        concurrent: {},
        offline: {},
        pwa: {},
        search: {}
      }
    };
  }

  /**
   * Test cache performance - 10 operations should complete in < 10ms
   * Requirement: 5.1
   */
  async testCachePerformance() {
    console.log('Testing cache performance...');
    
    const results = [];
    const cacheOperations = 10;
    const testData = {
      ingredients: this.generateTestIngredients(100),
      menus: this.generateTestMenus(50),
      sales: this.generateTestSales(200)
    };
    
    // Test 1: Cache write performance
    try {
      const startTime = performance.now();
      
      for (let i = 0; i < cacheOperations; i++) {
        localStorage.setItem(`test_cache_${i}`, JSON.stringify(testData));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.cacheThreshold;
      
      results.push({
        testName: 'Cache write performance',
        operations: cacheOperations,
        duration: duration,
        threshold: this.config.cacheThreshold,
        passed: passed,
        requirement: '5.1',
        message: passed
          ? `${cacheOperations} cache writes completed in ${duration.toFixed(2)}ms`
          : `${cacheOperations} cache writes took ${duration.toFixed(2)}ms, exceeds ${this.config.cacheThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.cache.write = {
        duration,
        operations: cacheOperations,
        avgPerOperation: duration / cacheOperations
      };
      
    } catch (error) {
      results.push({
        testName: 'Cache write performance',
        passed: false,
        error: error.message,
        requirement: '5.1'
      });
    }
    
    // Test 2: Cache read performance
    try {
      const startTime = performance.now();
      
      for (let i = 0; i < cacheOperations; i++) {
        const data = localStorage.getItem(`test_cache_${i}`);
        JSON.parse(data);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.cacheThreshold;
      
      results.push({
        testName: 'Cache read performance',
        operations: cacheOperations,
        duration: duration,
        threshold: this.config.cacheThreshold,
        passed: passed,
        requirement: '5.1',
        message: passed
          ? `${cacheOperations} cache reads completed in ${duration.toFixed(2)}ms`
          : `${cacheOperations} cache reads took ${duration.toFixed(2)}ms, exceeds ${this.config.cacheThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.cache.read = {
        duration,
        operations: cacheOperations,
        avgPerOperation: duration / cacheOperations
      };
      
    } catch (error) {
      results.push({
        testName: 'Cache read performance',
        passed: false,
        error: error.message,
        requirement: '5.1'
      });
    }
    
    // Test 3: Cache update performance
    try {
      const startTime = performance.now();
      
      for (let i = 0; i < cacheOperations; i++) {
        const data = JSON.parse(localStorage.getItem(`test_cache_${i}`));
        data.updated = Date.now();
        localStorage.setItem(`test_cache_${i}`, JSON.stringify(data));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.cacheThreshold;
      
      results.push({
        testName: 'Cache update performance',
        operations: cacheOperations,
        duration: duration,
        threshold: this.config.cacheThreshold,
        passed: passed,
        requirement: '5.1',
        message: passed
          ? `${cacheOperations} cache updates completed in ${duration.toFixed(2)}ms`
          : `${cacheOperations} cache updates took ${duration.toFixed(2)}ms, exceeds ${this.config.cacheThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.cache.update = {
        duration,
        operations: cacheOperations,
        avgPerOperation: duration / cacheOperations
      };
      
    } catch (error) {
      results.push({
        testName: 'Cache update performance',
        passed: false,
        error: error.message,
        requirement: '5.1'
      });
    }
    
    // Test 4: Cache delete performance
    try {
      const startTime = performance.now();
      
      for (let i = 0; i < cacheOperations; i++) {
        localStorage.removeItem(`test_cache_${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.cacheThreshold;
      
      results.push({
        testName: 'Cache delete performance',
        operations: cacheOperations,
        duration: duration,
        threshold: this.config.cacheThreshold,
        passed: passed,
        requirement: '5.1',
        message: passed
          ? `${cacheOperations} cache deletes completed in ${duration.toFixed(2)}ms`
          : `${cacheOperations} cache deletes took ${duration.toFixed(2)}ms, exceeds ${this.config.cacheThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.cache.delete = {
        duration,
        operations: cacheOperations,
        avgPerOperation: duration / cacheOperations
      };
      
    } catch (error) {
      results.push({
        testName: 'Cache delete performance',
        passed: false,
        error: error.message,
        requirement: '5.1'
      });
    }
    
    this.testResults.cacheTests = results;
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
   * Test API response times - all responses should be < 2000ms
   * Requirement: 5.2, 5.4
   */
  async testAPIResponseTimes() {
    console.log('Testing API response times...');
    
    const results = [];
    
    // Define API endpoints to test
    const endpoints = [
      { action: 'getBootstrapData', params: {} },
      { action: 'searchIngredients', params: { query: 'test', limit: 10 } },
      { action: 'getIngredientMap', params: {} },
      { action: 'getReport', params: { type: 'daily' } },
      { action: 'getLowStockHTML', params: {} }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const measurements = [];
        const iterations = 3; // Test each endpoint 3 times
        
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          
          try {
            await this.makeApiCall(endpoint.action, endpoint.params);
            const endTime = performance.now();
            measurements.push(endTime - startTime);
          } catch (error) {
            // API might not be available, record as failed
            measurements.push(null);
          }
        }
        
        // Calculate average response time
        const validMeasurements = measurements.filter(m => m !== null);
        
        if (validMeasurements.length > 0) {
          const avgResponseTime = validMeasurements.reduce((a, b) => a + b, 0) / validMeasurements.length;
          const minResponseTime = Math.min(...validMeasurements);
          const maxResponseTime = Math.max(...validMeasurements);
          const passed = avgResponseTime < this.config.apiThreshold;
          
          results.push({
            testName: `API response time - ${endpoint.action}`,
            endpoint: endpoint.action,
            avgResponseTime: avgResponseTime,
            minResponseTime: minResponseTime,
            maxResponseTime: maxResponseTime,
            threshold: this.config.apiThreshold,
            passed: passed,
            requirement: '5.2',
            message: passed
              ? `Average response time ${avgResponseTime.toFixed(2)}ms within ${this.config.apiThreshold}ms threshold`
              : `Average response time ${avgResponseTime.toFixed(2)}ms exceeds ${this.config.apiThreshold}ms threshold`
          });
          
          this.testResults.performanceMetrics.api[endpoint.action] = {
            avg: avgResponseTime,
            min: minResponseTime,
            max: maxResponseTime
          };
        } else {
          results.push({
            testName: `API response time - ${endpoint.action}`,
            endpoint: endpoint.action,
            passed: false,
            requirement: '5.2',
            message: 'API endpoint not available or all requests failed'
          });
        }
        
      } catch (error) {
        results.push({
          testName: `API response time - ${endpoint.action}`,
          endpoint: endpoint.action,
          passed: false,
          error: error.message,
          requirement: '5.2'
        });
      }
    }
    
    this.testResults.apiTests = results;
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
   * Test sheet access performance - read operations should be < 100ms
   * Requirement: 5.3
   */
  async testSheetAccess() {
    console.log('Testing sheet access performance...');
    
    const results = [];
    
    // Test 1: Read ingredients data
    try {
      const startTime = performance.now();
      
      // Simulate sheet read by accessing cached data or making API call
      const data = await this.readSheetData('Ingredients');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.sheetThreshold;
      
      results.push({
        testName: 'Sheet read - Ingredients',
        duration: duration,
        threshold: this.config.sheetThreshold,
        recordCount: data ? data.length : 0,
        passed: passed,
        requirement: '5.3',
        message: passed
          ? `Sheet read completed in ${duration.toFixed(2)}ms`
          : `Sheet read took ${duration.toFixed(2)}ms, exceeds ${this.config.sheetThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.sheets.ingredients = {
        duration,
        recordCount: data ? data.length : 0
      };
      
    } catch (error) {
      results.push({
        testName: 'Sheet read - Ingredients',
        passed: false,
        error: error.message,
        requirement: '5.3'
      });
    }
    
    // Test 2: Read menus data
    try {
      const startTime = performance.now();
      
      const data = await this.readSheetData('Menus');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.sheetThreshold;
      
      results.push({
        testName: 'Sheet read - Menus',
        duration: duration,
        threshold: this.config.sheetThreshold,
        recordCount: data ? data.length : 0,
        passed: passed,
        requirement: '5.3',
        message: passed
          ? `Sheet read completed in ${duration.toFixed(2)}ms`
          : `Sheet read took ${duration.toFixed(2)}ms, exceeds ${this.config.sheetThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.sheets.menus = {
        duration,
        recordCount: data ? data.length : 0
      };
      
    } catch (error) {
      results.push({
        testName: 'Sheet read - Menus',
        passed: false,
        error: error.message,
        requirement: '5.3'
      });
    }
    
    // Test 3: Read sales data
    try {
      const startTime = performance.now();
      
      const data = await this.readSheetData('Sales');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.sheetThreshold;
      
      results.push({
        testName: 'Sheet read - Sales',
        duration: duration,
        threshold: this.config.sheetThreshold,
        recordCount: data ? data.length : 0,
        passed: passed,
        requirement: '5.3',
        message: passed
          ? `Sheet read completed in ${duration.toFixed(2)}ms`
          : `Sheet read took ${duration.toFixed(2)}ms, exceeds ${this.config.sheetThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.sheets.sales = {
        duration,
        recordCount: data ? data.length : 0
      };
      
    } catch (error) {
      results.push({
        testName: 'Sheet read - Sales',
        passed: false,
        error: error.message,
        requirement: '5.3'
      });
    }
    
    this.testResults.sheetTests = results;
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
   * Make API call helper
   */
  async makeApiCall(action, params = {}) {
    if (!this.config.apiUrl) {
      throw new Error('API URL not configured');
    }
    
    const url = new URL(this.config.apiUrl);
    const requestParams = { action, ...params };
    
    Object.keys(requestParams).forEach(key => {
      url.searchParams.append(key, requestParams[key]);
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Read sheet data helper
   */
  async readSheetData(sheetName) {
    // Try to read from cache first
    const cacheKey = `sheet_${sheetName}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // If not in cache, try API call
    try {
      const response = await this.makeApiCall('getBootstrapData', {});
      if (response && response.data) {
        return response.data[sheetName.toLowerCase()] || [];
      }
    } catch (error) {
      // Return empty array if API fails
      return [];
    }
    
    return [];
  }

  /**
   * Generate test ingredients
   */
  generateTestIngredients(count) {
    const ingredients = [];
    for (let i = 0; i < count; i++) {
      ingredients.push({
        id: `TEST_ING_${i}`,
        name: `Test Ingredient ${i}`,
        stock_unit: 'kg',
        unit_buy: 'kg',
        buy_to_stock_ratio: 1,
        min_stock: 5,
        current_stock: Math.random() * 100
      });
    }
    return ingredients;
  }

  /**
   * Generate test menus
   */
  generateTestMenus(count) {
    const menus = [];
    for (let i = 0; i < count; i++) {
      menus.push({
        menu_id: `TEST_MENU_${i}`,
        name: `Test Menu ${i}`,
        description: `Description for menu ${i}`,
        category: 'Test',
        active: true,
        price: 50 + Math.random() * 100
      });
    }
    return menus;
  }

  /**
   * Generate test sales
   */
  generateTestSales(count) {
    const sales = [];
    const platforms = ['Grab', 'Foodpanda', 'Lineman', 'ShopeeFood'];
    
    for (let i = 0; i < count; i++) {
      const price = 50 + Math.random() * 100;
      const qty = Math.floor(Math.random() * 5) + 1;
      const gross = price * qty;
      const net = gross * 0.85; // 15% platform fee
      const cogs = gross * 0.3;
      const profit = net - cogs;
      
      sales.push({
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        menu_id: `TEST_MENU_${Math.floor(Math.random() * 50)}`,
        qty: qty,
        price_per_unit: price,
        net_per_unit: price * 0.85,
        gross: gross,
        net: net,
        cogs: cogs,
        profit: profit
      });
    }
    return sales;
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
   * Get performance test report
   */
  getPerformanceReport() {
    return {
      ...this.testResults,
      generatedAt: new Date().toISOString(),
      passed: this.testResults.summary.failed === 0,
      overallMetrics: this.calculateOverallMetrics()
    };
  }

  /**
   * Calculate overall performance metrics
   */
  calculateOverallMetrics() {
    const metrics = {
      cache: {
        avgWrite: this.testResults.performanceMetrics.cache.write?.avgPerOperation || 0,
        avgRead: this.testResults.performanceMetrics.cache.read?.avgPerOperation || 0,
        avgUpdate: this.testResults.performanceMetrics.cache.update?.avgPerOperation || 0,
        avgDelete: this.testResults.performanceMetrics.cache.delete?.avgPerOperation || 0
      },
      api: {},
      sheets: {}
    };
    
    // Calculate API averages
    const apiEndpoints = Object.keys(this.testResults.performanceMetrics.api);
    if (apiEndpoints.length > 0) {
      const avgTimes = apiEndpoints.map(ep => this.testResults.performanceMetrics.api[ep].avg);
      metrics.api.overall = avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length;
    }
    
    // Calculate sheet access averages
    const sheets = Object.keys(this.testResults.performanceMetrics.sheets);
    if (sheets.length > 0) {
      const durations = sheets.map(s => this.testResults.performanceMetrics.sheets[s].duration);
      metrics.sheets.overall = durations.reduce((a, b) => a + b, 0) / durations.length;
    }
    
    return metrics;
  }

  /**
   * Reset test results
   */
  reset() {
    this.testResults = {
      timestamp: null,
      cacheTests: [],
      apiTests: [],
      sheetTests: [],
      loadTests: [],
      concurrentTests: [],
      offlineTests: [],
      pwaTests: [],
      searchTests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      performanceMetrics: {
        cache: {},
        api: {},
        sheets: {},
        load: {},
        concurrent: {},
        offline: {},
        pwa: {},
        search: {}
      }
    };
  }
}

  /**
   * Test load performance with 1000+ records
   * Requirement: 5.5
   */
  async testLoadPerformance() {
    console.log('Testing load performance with large datasets...');
    
    const results = [];
    const recordCounts = [1000, 2000, 5000];
    
    for (const count of recordCounts) {
      // Test 1: Load large ingredient dataset
      try {
        const ingredients = this.generateTestIngredients(count);
        
        const startTime = performance.now();
        
        // Simulate loading and processing data
        localStorage.setItem('test_large_ingredients', JSON.stringify(ingredients));
        const loaded = JSON.parse(localStorage.getItem('test_large_ingredients'));
        
        // Simulate filtering/searching
        const filtered = loaded.filter(ing => ing.current_stock < ing.min_stock);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const passed = duration < 1000; // Should complete in < 1 second
        
        results.push({
          testName: `Load ${count} ingredients`,
          recordCount: count,
          duration: duration,
          threshold: 1000,
          passed: passed,
          requirement: '5.5',
          message: passed
            ? `Loaded and processed ${count} records in ${duration.toFixed(2)}ms`
            : `Loading ${count} records took ${duration.toFixed(2)}ms, exceeds 1000ms threshold`
        });
        
        // Cleanup
        localStorage.removeItem('test_large_ingredients');
        
      } catch (error) {
        results.push({
          testName: `Load ${count} ingredients`,
          recordCount: count,
          passed: false,
          error: error.message,
          requirement: '5.5'
        });
      }
      
      // Test 2: Load large sales dataset
      try {
        const sales = this.generateTestSales(count);
        
        const startTime = performance.now();
        
        localStorage.setItem('test_large_sales', JSON.stringify(sales));
        const loaded = JSON.parse(localStorage.getItem('test_large_sales'));
        
        // Simulate aggregation
        const totalSales = loaded.reduce((sum, sale) => sum + sale.gross, 0);
        const avgProfit = loaded.reduce((sum, sale) => sum + sale.profit, 0) / loaded.length;
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const passed = duration < 1000;
        
        results.push({
          testName: `Load ${count} sales records`,
          recordCount: count,
          duration: duration,
          threshold: 1000,
          passed: passed,
          requirement: '5.5',
          message: passed
            ? `Loaded and aggregated ${count} records in ${duration.toFixed(2)}ms`
            : `Loading ${count} records took ${duration.toFixed(2)}ms, exceeds 1000ms threshold`
        });
        
        // Cleanup
        localStorage.removeItem('test_large_sales');
        
      } catch (error) {
        results.push({
          testName: `Load ${count} sales records`,
          recordCount: count,
          passed: false,
          error: error.message,
          requirement: '5.5'
        });
      }
      
      // Test 3: Render performance with large dataset
      try {
        const largeDataset = this.generateTestSales(1000);
        
        const startTime = performance.now();
        
        // Simulate rendering by creating DOM elements
        const fragment = document.createDocumentFragment();
        largeDataset.slice(0, 100).forEach(sale => {
          const div = document.createElement('div');
          div.textContent = `${sale.date} - ${sale.menu_id} - $${sale.gross}`;
          fragment.appendChild(div);
        });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const passed = duration < 500;
        
        results.push({
          testName: 'Render 100 items from large dataset',
          recordCount: 100,
          duration: duration,
          threshold: 500,
          passed: passed,
          requirement: '5.5',
          message: passed
            ? `Rendered 100 items in ${duration.toFixed(2)}ms`
            : `Rendering took ${duration.toFixed(2)}ms, exceeds 500ms threshold`
        });
        
      } catch (error) {
        results.push({
          testName: 'Render 100 items from large dataset',
          passed: false,
          error: error.message,
          requirement: '5.5'
        });
      }
    }
    
    this.testResults.loadTests = results;
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
   * Test concurrent operations
   * Requirement: 5.6
   */
  async testConcurrentOperations() {
    console.log('Testing concurrent operations...');
    
    const results = [];
    
    // Test 1: Concurrent API calls
    try {
      const concurrentRequests = 5;
      const endpoints = [
        { action: 'getBootstrapData', params: {} },
        { action: 'searchIngredients', params: { query: 'test', limit: 10 } },
        { action: 'getIngredientMap', params: {} },
        { action: 'getReport', params: { type: 'daily' } },
        { action: 'getLowStockHTML', params: {} }
      ];
      
      const startTime = performance.now();
      
      const promises = endpoints.map(endpoint => 
        this.makeApiCall(endpoint.action, endpoint.params).catch(err => ({ error: err.message }))
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const successCount = responses.filter(r => !r.error).length;
      const passed = successCount >= 3; // At least 3 should succeed
      
      results.push({
        testName: 'Concurrent API calls',
        concurrentRequests: concurrentRequests,
        successCount: successCount,
        duration: duration,
        passed: passed,
        requirement: '5.6',
        message: passed
          ? `${successCount}/${concurrentRequests} concurrent requests succeeded in ${duration.toFixed(2)}ms`
          : `Only ${successCount}/${concurrentRequests} concurrent requests succeeded`
      });
      
      this.testResults.performanceMetrics.concurrent.api = {
        requests: concurrentRequests,
        successful: successCount,
        duration: duration
      };
      
    } catch (error) {
      results.push({
        testName: 'Concurrent API calls',
        passed: false,
        error: error.message,
        requirement: '5.6'
      });
    }
    
    // Test 2: Concurrent cache operations
    try {
      const operations = 10;
      
      const startTime = performance.now();
      
      const promises = [];
      for (let i = 0; i < operations; i++) {
        promises.push(new Promise(resolve => {
          const data = { id: i, value: Math.random() };
          localStorage.setItem(`concurrent_test_${i}`, JSON.stringify(data));
          const retrieved = JSON.parse(localStorage.getItem(`concurrent_test_${i}`));
          localStorage.removeItem(`concurrent_test_${i}`);
          resolve(retrieved);
        }));
      }
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < 50; // Should be very fast
      
      results.push({
        testName: 'Concurrent cache operations',
        operations: operations,
        duration: duration,
        threshold: 50,
        passed: passed,
        requirement: '5.6',
        message: passed
          ? `${operations} concurrent cache operations completed in ${duration.toFixed(2)}ms`
          : `Concurrent cache operations took ${duration.toFixed(2)}ms, exceeds 50ms threshold`
      });
      
      this.testResults.performanceMetrics.concurrent.cache = {
        operations: operations,
        duration: duration
      };
      
    } catch (error) {
      results.push({
        testName: 'Concurrent cache operations',
        passed: false,
        error: error.message,
        requirement: '5.6'
      });
    }
    
    this.testResults.concurrentTests = results;
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
   * Test offline mode performance - cached data loading should be < 500ms
   * Requirement: 5.7
   */
  async testOfflineMode() {
    console.log('Testing offline mode performance...');
    
    const results = [];
    
    // Setup: Store test data in cache
    const testData = {
      ingredients: this.generateTestIngredients(100),
      menus: this.generateTestMenus(50),
      sales: this.generateTestSales(200),
      timestamp: Date.now()
    };
    
    localStorage.setItem('offline_test_data', JSON.stringify(testData));
    
    // Test 1: Load cached data
    try {
      const startTime = performance.now();
      
      const cached = localStorage.getItem('offline_test_data');
      const data = JSON.parse(cached);
      
      // Simulate processing cached data
      const ingredientCount = data.ingredients.length;
      const menuCount = data.menus.length;
      const salesCount = data.sales.length;
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.offlineThreshold;
      
      results.push({
        testName: 'Load cached data in offline mode',
        duration: duration,
        threshold: this.config.offlineThreshold,
        recordsLoaded: ingredientCount + menuCount + salesCount,
        passed: passed,
        requirement: '5.7',
        message: passed
          ? `Loaded ${ingredientCount + menuCount + salesCount} cached records in ${duration.toFixed(2)}ms`
          : `Loading cached data took ${duration.toFixed(2)}ms, exceeds ${this.config.offlineThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.offline.load = {
        duration: duration,
        recordsLoaded: ingredientCount + menuCount + salesCount
      };
      
    } catch (error) {
      results.push({
        testName: 'Load cached data in offline mode',
        passed: false,
        error: error.message,
        requirement: '5.7'
      });
    }
    
    // Test 2: Offline data filtering
    try {
      const startTime = performance.now();
      
      const cached = localStorage.getItem('offline_test_data');
      const data = JSON.parse(cached);
      
      // Simulate filtering operations
      const lowStockIngredients = data.ingredients.filter(ing => ing.current_stock < ing.min_stock);
      const recentSales = data.sales.filter(sale => {
        const saleDate = new Date(sale.date);
        const daysDiff = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.offlineThreshold;
      
      results.push({
        testName: 'Filter cached data in offline mode',
        duration: duration,
        threshold: this.config.offlineThreshold,
        passed: passed,
        requirement: '5.7',
        message: passed
          ? `Filtered cached data in ${duration.toFixed(2)}ms`
          : `Filtering cached data took ${duration.toFixed(2)}ms, exceeds ${this.config.offlineThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.offline.filter = {
        duration: duration
      };
      
    } catch (error) {
      results.push({
        testName: 'Filter cached data in offline mode',
        passed: false,
        error: error.message,
        requirement: '5.7'
      });
    }
    
    // Cleanup
    localStorage.removeItem('offline_test_data');
    
    this.testResults.offlineTests = results;
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
   * Test PWA installation and search functionality performance
   * Requirements: 5.8, 5.9
   */
  async testPWAInstallation() {
    console.log('Testing PWA installation performance...');
    
    const results = [];
    
    // Test 1: Service worker registration
    try {
      if ('serviceWorker' in navigator) {
        const startTime = performance.now();
        
        // Check if service worker is already registered
        const registration = await navigator.serviceWorker.getRegistration();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const passed = duration < 1000;
        
        results.push({
          testName: 'Service worker check',
          duration: duration,
          threshold: 1000,
          registered: !!registration,
          passed: passed,
          requirement: '5.8',
          message: passed
            ? `Service worker check completed in ${duration.toFixed(2)}ms`
            : `Service worker check took ${duration.toFixed(2)}ms, exceeds 1000ms threshold`
        });
        
        this.testResults.performanceMetrics.pwa.serviceWorkerCheck = {
          duration: duration,
          registered: !!registration
        };
      } else {
        results.push({
          testName: 'Service worker check',
          passed: false,
          requirement: '5.8',
          message: 'Service workers not supported in this browser'
        });
      }
    } catch (error) {
      results.push({
        testName: 'Service worker check',
        passed: false,
        error: error.message,
        requirement: '5.8'
      });
    }
    
    // Test 2: PWA manifest validation
    try {
      const startTime = performance.now();
      
      const response = await fetch('/manifest.json');
      const manifest = await response.json();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < 500 && manifest.name && manifest.icons;
      
      results.push({
        testName: 'PWA manifest validation',
        duration: duration,
        threshold: 500,
        passed: passed,
        requirement: '5.8',
        message: passed
          ? `Manifest loaded and validated in ${duration.toFixed(2)}ms`
          : `Manifest validation took ${duration.toFixed(2)}ms or failed validation`
      });
      
      this.testResults.performanceMetrics.pwa.manifest = {
        duration: duration,
        valid: passed
      };
      
    } catch (error) {
      results.push({
        testName: 'PWA manifest validation',
        passed: false,
        error: error.message,
        requirement: '5.8'
      });
    }
    
    // Test 3: Cache storage performance
    try {
      if ('caches' in window) {
        const startTime = performance.now();
        
        const cacheNames = await caches.keys();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const passed = duration < 100;
        
        results.push({
          testName: 'Cache storage check',
          duration: duration,
          threshold: 100,
          cacheCount: cacheNames.length,
          passed: passed,
          requirement: '5.8',
          message: passed
            ? `Cache storage checked in ${duration.toFixed(2)}ms (${cacheNames.length} caches)`
            : `Cache storage check took ${duration.toFixed(2)}ms, exceeds 100ms threshold`
        });
        
        this.testResults.performanceMetrics.pwa.cacheStorage = {
          duration: duration,
          cacheCount: cacheNames.length
        };
      } else {
        results.push({
          testName: 'Cache storage check',
          passed: false,
          requirement: '5.8',
          message: 'Cache API not supported in this browser'
        });
      }
    } catch (error) {
      results.push({
        testName: 'Cache storage check',
        passed: false,
        error: error.message,
        requirement: '5.8'
      });
    }
    
    this.testResults.pwaTests = results;
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
   * Test search functionality performance
   * Requirements: 5.9, 5.10
   */
  async testSearchPerformance() {
    console.log('Testing search functionality performance...');
    
    const results = [];
    
    // Setup: Create large dataset for searching
    const largeIngredientSet = this.generateTestIngredients(1000);
    localStorage.setItem('search_test_ingredients', JSON.stringify(largeIngredientSet));
    
    // Test 1: Simple text search
    try {
      const searchQuery = 'Test';
      const startTime = performance.now();
      
      const ingredients = JSON.parse(localStorage.getItem('search_test_ingredients'));
      const results_search = ingredients.filter(ing => 
        ing.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.searchThreshold;
      
      results.push({
        testName: 'Simple text search (1000 records)',
        duration: duration,
        threshold: this.config.searchThreshold,
        resultsFound: results_search.length,
        passed: passed,
        requirement: '5.9',
        message: passed
          ? `Search completed in ${duration.toFixed(2)}ms, found ${results_search.length} results`
          : `Search took ${duration.toFixed(2)}ms, exceeds ${this.config.searchThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.search.simple = {
        duration: duration,
        resultsFound: results_search.length
      };
      
    } catch (error) {
      results.push({
        testName: 'Simple text search (1000 records)',
        passed: false,
        error: error.message,
        requirement: '5.9'
      });
    }
    
    // Test 2: Fuzzy search with multiple criteria
    try {
      const startTime = performance.now();
      
      const ingredients = JSON.parse(localStorage.getItem('search_test_ingredients'));
      const results_search = ingredients.filter(ing => {
        const matchesName = ing.name.toLowerCase().includes('test');
        const matchesStock = ing.current_stock < ing.min_stock;
        const matchesUnit = ing.stock_unit === 'kg';
        return matchesName || matchesStock || matchesUnit;
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.searchThreshold;
      
      results.push({
        testName: 'Multi-criteria search (1000 records)',
        duration: duration,
        threshold: this.config.searchThreshold,
        resultsFound: results_search.length,
        passed: passed,
        requirement: '5.9',
        message: passed
          ? `Multi-criteria search completed in ${duration.toFixed(2)}ms, found ${results_search.length} results`
          : `Multi-criteria search took ${duration.toFixed(2)}ms, exceeds ${this.config.searchThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.search.multiCriteria = {
        duration: duration,
        resultsFound: results_search.length
      };
      
    } catch (error) {
      results.push({
        testName: 'Multi-criteria search (1000 records)',
        passed: false,
        error: error.message,
        requirement: '5.9'
      });
    }
    
    // Test 3: Real-time search simulation (typing)
    try {
      const searchQueries = ['T', 'Te', 'Tes', 'Test', 'Test I'];
      const durations = [];
      
      for (const query of searchQueries) {
        const startTime = performance.now();
        
        const ingredients = JSON.parse(localStorage.getItem('search_test_ingredients'));
        const results_search = ingredients.filter(ing => 
          ing.name.toLowerCase().includes(query.toLowerCase())
        );
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const passed = maxDuration < this.config.searchThreshold;
      
      results.push({
        testName: 'Real-time search simulation',
        avgDuration: avgDuration,
        maxDuration: maxDuration,
        threshold: this.config.searchThreshold,
        searches: searchQueries.length,
        passed: passed,
        requirement: '5.9',
        message: passed
          ? `Real-time search avg ${avgDuration.toFixed(2)}ms, max ${maxDuration.toFixed(2)}ms`
          : `Real-time search max ${maxDuration.toFixed(2)}ms exceeds ${this.config.searchThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.search.realTime = {
        avgDuration: avgDuration,
        maxDuration: maxDuration,
        searches: searchQueries.length
      };
      
    } catch (error) {
      results.push({
        testName: 'Real-time search simulation',
        passed: false,
        error: error.message,
        requirement: '5.9'
      });
    }
    
    // Test 4: Search with sorting
    try {
      const startTime = performance.now();
      
      const ingredients = JSON.parse(localStorage.getItem('search_test_ingredients'));
      const results_search = ingredients
        .filter(ing => ing.name.toLowerCase().includes('test'))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const passed = duration < this.config.searchThreshold;
      
      results.push({
        testName: 'Search with sorting',
        duration: duration,
        threshold: this.config.searchThreshold,
        resultsFound: results_search.length,
        passed: passed,
        requirement: '5.9',
        message: passed
          ? `Search with sorting completed in ${duration.toFixed(2)}ms`
          : `Search with sorting took ${duration.toFixed(2)}ms, exceeds ${this.config.searchThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.search.withSorting = {
        duration: duration,
        resultsFound: results_search.length
      };
      
    } catch (error) {
      results.push({
        testName: 'Search with sorting',
        passed: false,
        error: error.message,
        requirement: '5.9'
      });
    }
    
    // Cleanup
    localStorage.removeItem('search_test_ingredients');
    
    this.testResults.searchTests = results;
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
   * Run all load and performance tests
   * Requirements: 5.5, 5.6, 5.7, 5.8, 5.9, 5.10
   */
  async runAllLoadTests() {
    console.log('Running all load and performance tests...');
    
    this.reset();
    this.testResults.timestamp = new Date().toISOString();
    
    const allResults = {
      loadPerformance: await this.testLoadPerformance(),
      concurrentOperations: await this.testConcurrentOperations(),
      offlineMode: await this.testOfflineMode(),
      pwaInstallation: await this.testPWAInstallation(),
      searchPerformance: await this.testSearchPerformance()
    };
    
    const overallPassed = Object.values(allResults).every(result => result.passed);
    
    return {
      passed: overallPassed,
      timestamp: this.testResults.timestamp,
      summary: this.testResults.summary,
      results: allResults,
      performanceMetrics: this.testResults.performanceMetrics
    };
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceTestingModule;
} else if (typeof window !== 'undefined') {
  window.PerformanceTestingModule = PerformanceTestingModule;
}

      results.push({
        testName: 'Simple search in 500 ingredients',
        query: searchQuery,
        duration: duration,
        threshold: this.config.searchThreshold,
        resultsFound: searchResults.length,
        passed: passed,
        requirement: '5.9',
        message: passed
          ? `Search completed in ${duration.toFixed(2)}ms, found ${searchResults.length} results`
          : `Search took ${duration.toFixed(2)}ms, exceeds ${this.config.searchThreshold}ms threshold`
      });
      
      this.testResults.performanceMetrics.search.simple = {
        duration: duration,
        resultsFound: searchResults.length
      };
      
    } catch (error) {
      results.push({
        testName: 'Simple search in 500 ingredients',
        passed: false,
        error: error.message,
        requirement: '5.9'
      });
    }
    
    this.testResults.searchTests = results;
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
   * Run all performance tests
   * Requirement: 5.1-5.10
   */
  async runAllTests() {
    console.log('Running all performance tests...');
    
    this.reset();
    this.testResults.timestamp = new Date().toISOString();
    
    const allResults = {
      cache: await this.testCachePerformance(),
      api: await this.testAPIResponseTimes(),
      sheets: await this.testSheetAccess(),
      load: await this.testLoadPerformance(),
      concurrent: await this.testConcurrentOperations(),
      offline: await this.testOfflineMode(),
      pwa: await this.testPWAInstallation(),
      search: await this.testSearchPerformance()
    };
    
    const overallPassed = Object.values(allResults).every(result => result.passed);
    
    return {
      passed: overallPassed,
      results: allResults,
      summary: this.testResults.summary,
      report: this.getPerformanceReport()
    };
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceTestingModule;
} else if (typeof window !== 'undefined') {
  window.PerformanceTestingModule = PerformanceTestingModule;
}
  async testLoadPerformance() {
    console.log('Testing load performance with large datasets...');
    
    const results = [];
    const recordCounts = [1000, 2000, 5000];
    
    for (const count of recordCounts) {
      // Test 1: Load large ingredient dataset
      try {
        const ingr
  }

    };port()anceRePerform: this.get     reportsummary,
 Results.is.test: thmmary      sulResults,
ts: alesul    rPassed,
  ed: overall
      pass    return {
    
t.passed);=> resulsult .every(reesults)es(allRvalud = Object.llPasse const overa;
    
       }ance()
archPerformthis.testSeh: await searcn(),
      AInstallatiotPWhis.tes t  pwa: await
    de(),eMostOfflinthis.tene: await   offlins(),
    Operatiooncurrentt this.testCrrent: awai    concue(),
  erformancLoadPt this.test awai    load:
  s(),SheetAccesis.testts: await th   shees(),
   eTimetAPIResponsthis.tespi: await ,
      a()anceachePerforms.testCwait thi    cache: as = {
  ltonst allResu    c);
    
String(toISOate().amp = new D.timeststResults    this.tes.reset();
thi
    
     tests...');anceperformRunning all le.log('so {
    connAllTests()ruc   */
  asyn.10
 -5ment: 5.1quirests
   * Rence temaerfor Run all p *
  /**
  ];
  }
1.lengthstrh][.lengttrix[str2n maetur    r    
  }
    }

           }      );
 j] + 1
    x[i - 1][      matri     + 1,
  j - 1]ix[i][    matr    + 1,
     [j - 1] - 1]trix[i ma         
  ath.min([i][j] = Mmatrix        {
  lse   } e
      ][j - 1];trix[i - 1 = matrix[i][j]          ma)) {
- 1(j r1.charAt= st - 1) ==rAt(i (str2.cha   if      {
+).length; j+ str1 j = 1; j <= (let  for++) {
    length; i <= str2.1; iet i =   for (l      

    }
[j] = j;  matrix[0]{
    +) .length; j+j <= str1let j = 0; or (
    
    f    }= [i];
[i]     matrixi++) {
  tr2.length; i <= s; let i = 0for (
    
     [];nst matrix =co) {
    e(str1, str2istanchteinD  levens */

  earch for fuzzy sdistanceenshtein  Lev * Calculate
  }

  /**   };
    }
 
    thassed).leng(r => !r.psults.filter: reled  fai    length,
  ssed). => r.palts.filter(rd: resu      passeength,
  .ll: results   tota {
     y:ummar    ss,
  ult
      res,assed) => r.pults.every(rsed: res   pas  n {
   retur;
    
  esults)teSummary(r   this.updaults;
  resests =ults.searchTResthis.test 
    
     }
      });'
  5.9 'ment: require       age,
rror.mess   error: e    
 d: false,   passe     ts',
redienngin 500 ih rc-field sea: 'MultiestName t       push({
esults. r {
     error)ch (  } cat     
  
       };s.length
archResultltsFound: seresu  ,
      urationuration: d{
        deld = ultiFich.msearrics.nceMetformats.pers.testResul 
      thi  });
     ld`
    threshoreshold}ms earchThonfig.s{this.cs, exceeds $2)}mixed(ation.toFk ${dur tood searchMulti-fiel: `         ts`
 } resulgths.lenulteshRd ${searcoun}ms, fd(2)ation.toFixed in ${dur completechield sear ? `Multi-f        
 age: passed      mess '5.9',
  equirement:
        rassed, pd:se       pasgth,
 lts.lenarchResu seound:ultsF res   old,
    eshThrrchnfig.seas.cod: thiesholhr
        ton, duratiuration:,
        dQueryarchuery: se      qts',
  00 ingredienn 5earch iulti-field stName: 'M   tes  .push({
        results  
 ;
    oldshchThreonfig.searion < this.c = durat passed   consttTime;
   me - starTition = end dura     const
 ance.now();rformndTime = pe     const e
      
 
      );erCase())ry.toLowarchQues(se().includetoLowerCasestock_unit.g.       in()) ||
 werCasechQuery.toLoes(searincludrCase().ng.id.toLowe       i
 se()) ||LowerCarchQuery.toudes(searCase().incle.toLowe ing.nam
       >  =s.filter(ingedientts = ingrearchResul const s         
 ();
 rmance.nowfo per =rtTime sta  const        
 'test';
  ry =t searchQue  cons
     {  tryarch
  field se: Multi-Test 3
    //    }
    ;
 9'
      })ement: '5.     requir  sage,
 r: error.mes       erro
 false,   passed: nts',
     ingrediein 500 zzy search : 'Fu   testName{
     lts.push(resu      (error) {
 } catch       
       };
length
  esults.earchRnd: sultsFou
        resduration,on:       duratiuzzy = {
  search.fanceMetrics..performtstResul.tes  this   
    
         });threshold`
d}ms rchThresholseag.s.confieeds ${thi, exc2)}msed(toFixtion.took ${duraarch  `Fuzzy se    :s`
      } resultsults.lengthrchReund ${sea2)}ms, foixed(ration.toFed in ${duetearch compluzzy s `F   ?ed
       sage: pass   mes5.9',
     uirement: '  req     passed,
 ssed:        pa,
 sults.length: searchReultsFound       res,
 hresholdig.searchTthis.confd: ol    threshion,
    ation: duratur   d   ,
  chQuerysearery:         quts',
dienn 500 ingreh i searc 'Fuzzy  testName:      
.push({  results
          
chThreshold;.config.searis< thon urati= dsed st pason;
      c startTimedTime -en duration = 
      constce.now();formandTime = peren    const 
      
  
      }); 2; query) <=(name,ncetaenshteinDisthis.levy) || s(querncludeme.ireturn na       
 Case();Lowerery.to = searchQuryueconst q     
   ();owerCaseing.name.toLonst name =  c     g => {
  iner(s.filt= ingredienthResults rconst seae
      cancin distenshteith Levsearch wte fuzzy   // Simula         
 w();
ce.noerforman pime =onst startT
      c    
  ry = 'tst';t searchQue  cons
    y {h
    trFuzzy searc 2:     // Test   

    }
  });'5.9'
     irement:         requge,
or.messaor: err err
       sed: false, pas      ,
 ts'edienin 500 ingrple search 'Sim: ametN       tesush({
 esults.p
      ror) {erratch (   
    } c  };
   length
    ults.: searchResltsFound    resuation,
    tion: dur   dura    = {
 le mpearch.sitrics.srformanceMestResults.pe  this.te     
    });
    d`
   ols threshshold}mrchThrefig.sea{this.conceeds $2)}ms, exion.toFixed(uratch took ${d : `Sear     ults`
    ength} reschResults.lund ${sear)}ms, fon.toFixed(2{duratioted in $earch comple  ? `Sd
         passege:sa  mes  
    9',rement: '5.qui      reassed,
  ssed: p
        palts.length,: searchResultsFoundesu    r   old,
 chThreshearg.ss.confihold: thi   threson,
     : duratition  dura
      ery, searchQu  query:      ,
ngredients' i500ch in Simple searestName: '{
        ts.push(     result
      
 shold;chThreconfig.searhis.on < t = duratiassed     const pe;
 Tim startdTime -ion = enratt du
      consow();rmance.nperfot endTime = 
      cons      );
   ase())
   owerCry.toLQuesearch.includes(oLowerCase()ame.t ing.n 
       ing =>ts.filter(= ingredienResults search const 
     ();
      ance.nowperformtartTime = const s       
  test';
   = 'searchQuery      const 
 y {h
    trle searcTest 1: Simp   // 
  
   00);edients(5ateTestIngrhis.geners = t ingredientconstta
    est daetup t    // S 
= [];
   esults onst r c   
   e...');
 y performancctionalitung search f('Testinnsole.log
    co() {ancearchPerformasync testSe */
  9
  ent: 5.uirem * Req
  cermanfoonality perch functit sear
   * Tes}

  /**   };
        }
 gth
sed).len!r.paser(r => s.filt: resultailed    f,
    engthsed).l(r => r.pas.filterltsassed: resu p    ngth,
   lts.lel: resutato   
      summary: {   results,
    
    assed),r.pvery(r => ults.e passed: res
     rn {
    retu);
    ry(resultsteSummas.upda
    thi results;aTests =esults.pwis.testR    th
    
);
    }
      }.8'irement: '5       requessage,
 r: error.m      erroalse,
   fd:asse    p
    e',B performancndexedDName: 'I        tests.push({
esult   r
   r) {tch (erro    } ca  
       };
n
   ion: duratio   durat    
 dDb = {ndexerics.pwa.ietperformanceMResults.test  this.     
    ;
   })`
    ms threshold500, exceeds ixed(2)}ms.toFrationook ${dus terationexedDB op     : `Ind    )}ms`
 ixed(2oFration.teted in ${duons compledDB operati `Index      ?passed
    ge:        messa'5.8',
 irement:    reqused,
      passed: pas0,
       : 50   threshold
     : duration,   duration    ',
 anceperform 'IndexedDB  testName:
       lts.push({      resu     
 500;
 tion <assed = duraconst p;
      Timestartme - Tion = endduratit 
      consnce.now();rformaendTime = pe    const    
     });
   ;
         }});
   'id' { keyPath:st', 'teObjectStore( db.create  
       .result;t.target evenb = const d        {
  t) =>evened = (radeneednupgst.oreque      rror);
  t.eect(reques = () => rejerrorequest.on   r };
           ();
 resolve        
  (dbName);atabaseedDB.deleteD       index();
   close         db.
 sult;st.re db = reque   const   > {
     = () =onsuccess request.       ct) => {
solve, reje Promise((reawait new         
e, 1);
   n(dbNamB.opexedDest = indequonst reb';
      ct-d'tese = onst dbNam      cs
ionoperat basic ndbility a availadexedDB// Test In
            .now();
rformancee = pestartTimt     cons  try {
  ance
  rmdDB perfoxeTest 3: Inde   
    //  }
 );
   
      }'5.8ent: ' requiremge,
       .messarror eor:rr      e  false,
passed: 
        ance',rformche API pe 'Came:Naest
        ts.push({    result  
 (error) {
    } catch;
      }  })    r'
   this browseed int supportche API no: 'Ca  message,
         '5.8'ment:require         d: false,
 se     pas     ',
erformance API pme: 'Cache   testNa
       lts.push({su     re   else {

      } 
        };n: durationduratio       
   pi = {pwa.cacheArics.rformanceMetsults.pehis.testRe  t  
         });
           old`
s thresh 100ms, exceedsFixed(2)}mation.todur ${ookoperations tI : `Cache AP         
   s`)}mxed(2toFi ${duration.ompleted intions che API opera  ? `Cac         e: passed
 messag          nt: '5.8',
eme     requir    sed,
 ed: pas   pass0,
       : 10shold   thre      ion,
 ation: durat       dur,
   ance'rforme API peame: 'CachestN         t{
 ush(s.p   result    
         on < 100;
d = durationst passe    cme;
     - startTi endTimeation =urnst d
        co();nce.now= performame onst endTi
        c        eName);
ches.delete(cat cach        awai('/test');
he.matchawait cacse = pon const res       ));
st data'esponse('tew Rnet', e.put('/tes cachait   awme);
     cacheNaes.open( cachait awe =achonst c
        c     .now();
   cerformanartTime = peonst st c     
  
        1';che-vt-came = 'tes cacheNa     constndow) {
   aches' in wif ('c {
      i
    tryrmancerfoe API peest 2: Cach T    //

    }
    );      }'
5.8nt: 'reme  requie,
      sages: error.m  error
      e,assed: fals
        pker check',rvice wortName: 'Se        tespush({
ts.      resulr) {
tch (erro  } ca  

      } });    ser'
   this browd in porters not supke wore: 'Servicessag          me
ent: '5.8', requirem        : false,
 sed   pas,
       ck'orker chervice wstName: 'Se          te{
ts.push(  resul
      } else {
            };stration
  !regiistered: !eg r
         : duration,   duration  k = {
     WorkerChecvicepwa.serMetrics.formanceperResults.sthis.te      t        
  ;
       })reshold`
 00ms th exceeds 10ed(2)}ms,ration.toFixck took ${dur cheorkervice w : `Se           `
2)}mstoFixed(${duration.mpleted in r check coorkeService w      ? `      ge: passed
messa      
    .8',rement: '5equi  r    
    passed,assed:     p   ration,
    !!registered:st    regi    00,
  old: 10sh        threon,
  : durati duration       
   check', workerrvice'Se testName: 
         sh({results.pu     
   ;
        1000duration <  = t passed       cons
 tartTime;endTime - son = onst durati       c
 w();e.noformancme = per endTiconst     
    
       ration();RegistetceWorker.ggator.serviit navion = awaatistrnst regi
        co registeredreadyr is alce workeif servi  // Check          
   
  .now();ceerformanime = ptTarstst         contor) {
r' in navigarke'serviceWo   if (  try {
   ration
  orker registService w// Test 1:  
     [];
   lts = resu   const');
    
 formance...n perio installat'Testing PWAlog(console.    ation() {
WAInstallc testP */
  asyn 5.8
  t:uiremen* Reqce
   rformantion peallaPWA inst Test /**
   *  }

   }
    };
     ).length
ssed!r.paer(r => ults.filt resd:faile       ).length,
 r.passedter(r => s.filltassed: resu   pngth,
     lts.lesutotal: re      mmary: {
  
      suts,      resuld),
=> r.passe(r everyts.d: resulpassern {
       retu 
   ts);
   resulateSummary(s.upd   thiesults;
 s = reTestlinsults.offis.testReth   
    ta');
 st_daffline_tetem('oremoveIlStorage.p
    locanuClea //    
      }
   });
 '5.7'
    irement:     requ,
    ssageror.meerror: er  e,
      passed: fals,
        hed data'egate cacnd aggr 'Filter atestName:     .push({
        results {
  (error) } catch  
   };
        ngth
  .le.sales: cachedProcessedecords     r,
   ationon: durrati
        du = {aggregatene..offlianceMetricsormts.perfulestRes  this.t
    
          });shold`
  ms threld}lineThresho.config.offceeds ${thisd(2)}ms, ex.toFixeurationtook ${drocessing     : `P}ms`
      n.toFixed(2){duratiorecords in $} sales.lengthhed.d ${cac ? `Processed
         ssage: passe    me
    ,5.7'irement: '  requ,
      d: passedpasse  
      ngth,ales.lehed.s cacsed:ocesPrecords  rold,
      reshThoffline.config.: thiseshold  thr
      ration,ration: du du     ,
  ched data'aggregate calter and 'FitName:     tes{
    lts.push(  resu      
    shold;
hreflineTfig.of.conthisation < assed = duronst p
      ctartTime;- se ion = endTim duratst    con
  ow();rformance.nndTime = pest econ      
    
  it, 0);sale.profe) => sum + m, salsus.reduce((daySalelProfit = to const tota);
     ale.gross, 0 + sum> sle) =um, sae((sucdaySales.redtoRevenue = alnst tot      co      
      });
tring();
eSy.toDat === toda()oDateStringe.tDatreturn sale       w Date();
  today = nest    con
    (sale.date);= new DatesaleDate onst {
        cter(sale => .fild.saleses = cache todaySal
      constadatcached  from erationt genlate repor // Simu   
     
   ow();nce.nformaerime = ponst startT  
      ca'));
    datest_'offline_te.getItem(ocalStoragSON.parse(lached = J const c     {
 
    tryed datacachgregate lter and agFi3: Test   //  }
    
  );
   .7'
      }ent: '5    requiremssage,
    rror.me  error: e  se,
     passed: fal       data',
 cached  iname: 'Search    testNsh({
    lts.puresu{
      (error) } catch  
      };
     
    ts.lengthuld: searchResresultsFoun       on,
 : duratiduration     
   .search = {ics.offlinemanceMetrsults.perfor this.testRe    
     );
        }
eshold`ds 100ms three}ms, exc(2).toFixedrationh took ${du`Searc     : ts`
     esuls.length} rarchResultd ${ses, foun(2)}mon.toFixedatiurn ${dleted iearch comp ? `Sd
         passesage: 
        mes,t: '5.7' requiremen
       d: passed,      passegth,
  lts.lenarchResultsFound: se   resu
     0,10shold: thre     ion,
   ion: durat  durat     
 data',hed  in cace: 'SearchNam test    sh({
   lts.pu      resu    
   very fast
 should bech100; // Seartion < urat passed = dcons
      Time;ime - start endT =iononst durat      cow();
formance.nime = perdTnst en   co
   );
      ())
      aseery.toLowerCdes(searchQu).incluerCase(name.toLowg.    in> 
    r(ing =ts.filteengredied.in= cachults hResrc sea     constest';
  = 'tearchQueryt sns
      co);
      w(e.no= performancTime nst startco    
      a'));
  test_datine_tem('offle.getIoraglocalStON.parse( JSst cached =
      contry {    ata
cached dch in SearTest 2:    //  
  }
      ;

      })t: '5.7'menequire,
        rmessager: error.     erro
    false,  passed:de',
      n offline moata i dhedac'Load ctName:   tes     push({
  results.
     ) {h (error
    } catc };
          Count
 alesuCount + s + menntCountd: ingredieLoadecords  re
      n,ion: duratiourat       d
 d = {e.loaofflinnceMetrics.formatResults.per    this.tes    
  ;
   })old`
     d}ms threshhresholeTfflin.config.oeds ${this exces,oFixed(2)}muration.t${d data took ng cached    : `Loadi
      s`ixed(2)}muration.toFs in ${dd recordCount} cacheles + saenuCount+ mientCount ingredoaded ${  ? `L        
assed: pagemess
        t: '5.7',iremen        requd,
asse passed: p      
 Count,nt + salesuCouount + men ingredientCed: recordsLoadd,
       esholeThrfling.of this.confild:ho      thresion,
  rattion: du     duraode',
   line m data in offhedd cacName: 'Loa        test({
esults.push  
      r   reshold;
 ig.offlineTh.confation < thisd = durconst passe;
      imestartT-  = endTime st duration     con.now();
 ormancerfime = pendT  const e  
       .length;
 = data.salesnt st salesCouon      cength;
a.menus.lnt = datuCounst men      co.length;
ntsdie.ingre = datadientCountingrest 
      condatad sing cachecesimulate pro/ S
      /
      rse(cached);SON.pat data = J  cons;
    t_data')line_tes'offtItem(lStorage.geched = locanst ca  
      co    e.now();
erformancrtTime = ponst sta    c
   {  try  ata
ched dd caest 1: Loa
    // T    Data));
stingify(testrJSON.test_data', ne_m('offliage.setItealStor 
    loc  };
   now()
  stamp: Date.
      timees(200),rateTestSals: this.gene   sale(50),
   MenusstenerateTe: this.gus men     0),
redients(10TestIng.generate thisients:   ingred= {
   ta st testDa
    conachea in ct dattore tes Setup:  
    // S = [];
  st results    con  
...');
  cemande perforine mong offl('Testinsole.log() {
    cotOfflineModeesc tyn  */
  as
 : 5.7equirementms
   * R500ld be < ading shoud data lohe - cac performanceoffline modet Tes /**
   * }

 ;
     }    }
 length
  sed).(r => !r.pasults.filter: res failed   th,
    d).lengpasselter(r => r.s.fisult passed: re   ,
    gth.lentstal: resul
        toy: {summar
      ,sults),
      repassed(r => r.ery: results.evsed     paseturn {
   r
    
  ults);Summary(reste this.upda
   s;= resultentTests rrcuons.csulthis.testRe t   
    
    }    });
 '5.6'
  ent:    requiremssage,
    : error.meerror    lse,
      passed: fa,
      ng'ocessient data prncurr: 'Co    testNameh({
    lts.pus
      resu) {rorh (er
    } catc});
           hreshold`
 s 100ms t)}ms, exceedoFixed(2{duration.tok $g tosinoces prncurrent `Co    :`
      2)}msFixed({duration.toin $rrently ts concuase} datasets.lengthatocessed ${dPr  ? `        e: passed
  messag
      nt: '5.6',  requireme      d: passed,
    passe0,
    hold: 10 thres,
       on: duration    durati
    ngth,ets.lesets: datas     data',
   rocessing pcurrent data: 'Coname       testN
 ults.push({    res      
  
00;ation < 1passed = dur   const ime;
   tTTime - star= endn nst duratio      co
nce.now();performa= st endTime   con 
    ses);
     miproll(ise.aromawait P  
      ;
     })
      )    );
   cessedve(pro     resol }));
     d: trueocessetem, pr{ ...i => (.map(itemed = datasett process  consng
        ocessi prte  // Simula
        e => {se(resolv Promiew  n     
 (dataset => s.mapsetses = data promi     const     
 .now();
 performanceme = tartTi   const s  
      
 )
      ];Sales(200nerateTestis.ge        thenus(50),
rateTestMgeneis.      th00),
  ents(1ngredirateTestIene   this.g
     asets = [onst dat      c{
    try sing
data procesent rrt 3: Concues
    // T    }
    ;

      }).6': '5ent    requirem
    .message,: error   erroralse,
     : f   passed
     tions',e operacachrent e: 'ConcurestNam
        tush({ts.psul    re  {
h (error) atc   
    } c
       };
  n: durationratiodu
        perations, oons:ati        oper.cache = {
oncurrentcs.ceMetriformancults.perstRess.te      thi   
   });
   
   shold`hre txceeds 50msed(2)}ms, eration.toFix{du took $ operationsrrent cache: `Concu
          d(2)}ms`Fixetion.to${durain s completed e operationt cachen concurroperations}      ? `${    passed
 ssage:   me      '5.6',
ent:  requirem
      assed,ssed: p      pa: 50,
    threshold      ,
n: durationio     durations,
   operat: ns  operations',
      ratiopecache orent 'ConcurstName:      teh({
   ults.pus      res  
st
     fa verybe; // Should ration < 50assed = dust p   con   Time;
artdTime - stration = en  const du    ow();
rmance.n = perfo endTime const    
 );
      all(promisesit Promise.   awa      
   ;
      }
     )      })
       rieved);
e(ret   resolv    ;
     _test_${i}`)ncurrent`coeItem(orage.removStal   loc       
  }`));_${itesturrent_nc`coe.getItem(lStoragse(locaparJSON.ed = evst retri   con;
         fy(data))JSON.stringi}`, nt_test_${icurretItem(`conage.selocalStor            ndom() };
th.ra Mae:alu { id: i, v data =onst   c   
      solve => {se(re   new Promi  
     h(.pusomises
        pr) { i++operations; i <  0;et i =      for (l];
omises = [pronst  
      c;
     now()e.formancrtTime = pert sta   cons 
       
 ns = 10;ratioope  const 
        try {rations
he opecurrent cacest 2: Con
    // T   }
    
  });
     ment: '5.6'require   e,
     sag error.mesror:
        er: false,ssed pa      I calls',
  AP 'Concurrentme:  testNa   push({
    results. {
     (error)catch 
    }      };
   ation
    : durtiondura     ount,
   ccessCul: susfsucces
        equests,oncurrentR crequests:       pi = {
 .aoncurrentcs.cMetrierformanceestResults.p  this.t      
    ;
  })   ded`
 sts succeequecurrent re conentRequests}currt}/${conCouness ${succ  : `Only
        )}ms`n.toFixed(2uratio{dn $ed iucceedt requests s concurrenquests}urrentRencunt}/${cosuccessCo`${? 
          passedmessage: ',
        t: '5.6equiremen,
        rsed: passedpas     n,
   ioduratation:       dur  ,
ountt: successCun   successCoests,
     urrentRequts: concquesurrentRe   conc    ',
 API callsConcurrent stName: '
        tepush({ results.   
     
   cceedould sut least 3 sh // A 3;Count >=cesspassed = suc const 
     .length;ror)r(r => !r.erponses.filte resssCount =nst succe
      co      e;
rtTimdTime - sta= enation onst dur;
      cnce.now()orma perfe =dTim en     const
      
 (promises);romise.alles = await Pnst responsco     
      
 );)
      age })r.mess: error{ er => (h(err).catcint.params, endpoctiondpoint.aApiCall(enkethis.ma     => 
   p(endpoint ndpoints.mapromises = est  con
          ;
 ()formance.nowme = pernst startTi      co  
   ];
      : {} }
 paramsHTML', LowStock'get{ action:      } },
   ly' daiype: 'ms: { tt', paraRepor 'gettion:ac
        { ms: {} },aradientMap', ptIngre 'ge   { action:     },
 10 }', limit: testuery: 'params: { qedients', rchIngr: 'seaion     { act },
   arams: {}ata', papDotstrtBo'gection:       { ants = [
  endpoi    const ;
  ts = 5estRequennst concurr    co
  y {lls
    trt API cacurrenest 1: Con   // T
    
 s = [];t result  
    cons;
  rations...') opeurrentncing costole.log('Te{
    consns() rentOperatiour testConc */
  async
   5.6rement:  * Requi
 tionst operaenurrest conc
   * T
  /** };
  }
   }
   ngth
   ed).ler => !r.passlts.filter(ed: resu   failth,
     d).lengasser.per(r => ts.filtesulpassed: rh,
        esults.lengttotal: r
        ummary: {ts,
      s     resulpassed),
 r..every(r => tsesulsed: r   pasurn {
     
    ret
  esults);mmary(rupdateSuis.   th
  results;Tests =adsults.loestRe
    this.t    }
         });
: '5.5'
 ntequireme        rmessage,
r.rro eerror:    false,
     passed:     ',
   rge dataset la items fromr 100deene: 'RNam       testh({
 s.puslt      resu{
or)  catch (err    }  
    );
 }   shold`
  thres ceeds 500m ex)}ms,toFixed(2 ${duration.ng tooknderi       : `Re`
   xed(2)}ms.toFitionin ${duratems ered 100 iend  ? `R
        ge: passed  messa      '5.5',
: ementir       requ: passed,
   passed
      ld: 500,resho  th     
 ation,uration: dur
        dt: 100,rdCoun  reco',
      atasetge dm lar froemsitder 100 'RentestName:     push({
    ts.
      resul     0;
 ration < 50 = dust passed  con   e;
 - startTim endTime ration =   const du;
   w()mance.noe = perforconst endTim
      
         });   v);
Child(dippendnt.a  fragme}`;
      sale.grossenu_id} - ${{sale.mdate} - $ = `${sale.Contentdiv.text
        t('div');en.createElemv = documentt di    cons> {
    e =salEach(0).forlice(0, 10et.slargeDatas     agment();
 mentFrt.createDocu = document fragment      conselements
g DOM  creatinbyendering  rulate  // Sim     
    now();
 mance.= perfore artTim    const st  
  
    es(1000);rateTestSalene= this.gt  largeDataseconst    y {
     trtaset
 arge dath lformance wipernder  Test 3: Re 
    //
    }
   
      }     });5.5'
   ement: '      requir
    e,ror.messagrror: er        e
  e,ssed: fals          pa
unt,t: cocordCoun  re,
        s records`{count} sale`Load $testName:      ush({
     .p    resultsror) {
    atch (er
      } c;
        s')e_salet_largtem('tesge.removeItora      localSup
  lean  // C    
         });
     old`
    s thresh1000mexceeds s, toFixed(2)}m${duration. took dsrecorunt} oading ${co     : `L
       `(2)}msion.toFixed${duratn cords irecount} ated ${d aggreg `Loaded an ?         passed
   age:     mess.5',
     ment: '5   requireed,
       sspassed: pa  
        00,old: 10esh   thr     
  : duration,on      durati
    t,nt: coun  recordCou`,
        cordssales recount}  ${ame: `Load     testN{
     sults.push(     re
         
   1000;ation < = dursedconst pas
        Time;rt - stadTimeration = en const du
       );e.now(ancperformndTime = st e
        con;
        .length loadedit, 0) /rofe.p=> sum + sale) saleduce((sum, .r = loadedofitst avgPr      con0);
  ale.gross,  => sum + s((sum, sale)oaded.reducelSales = lonst tota   con
     aggregati Simulate  //       
        
es'));sale_largtItem('test_.getoragelSparse(locaed = JSON.oad const l    ales));
   ngify(s, JSON.striarge_sales'_l('testge.setItemoraalSt       loc 
      
  .now();ormanceperfime = t startTns  co   
      nt);
     es(couSalstateTe.gener= thisales  const s       y {
    tr  s dataset
alerge s 2: Load la     // Test    
     }
  
        });'5.5'
  irement:     requ
      sage,mesrror: error.       ee,
   ssed: fals         pa count,
 cordCount:        rets`,
  gredient} inLoad ${counstName: `        te({
  results.push       {
 r) ch (erro cat  
      }    
  nts');ingredietest_large_eItem('emovStorage.rlocalp
        // Cleanu 
            
        });shold`
   000ms thres 1)}ms, exceedn.toFixed(2${duratioords took {count} recLoading $ `   :`
         }ms.toFixed(2)tions in ${durarecord ${count} ocessedoaded and pr? `L       d
     semessage: pas
          : '5.5',irement        requ,
  sed pas  passed:        d: 1000,
   threshol,
       n: durationuratio       d,
   ntnt: courecordCou       s`,
   ntediecount} ingre: `Load ${am    testN      lts.push({
      resu        
  1 second
e in <  completouldSh0; // < 100duration assed = st pcon
        tartTime; - s = endTimest duration      con();
  ce.nowman perfore =st endTim con   
       
     stock);n_ ing.miock <.current_stng => ingilter(iloaded.fered = const filt        searching
e filtering// Simulat   /     
     ));
   edients'large_ingrtItem('test_.gegealStoraparse(loc = JSON.loadedonst 
        cents));edi(ingringifyON.strdients', JSe_ingreest_largm('tItege.setcalStora  lota
       dangsiprocesding and loalate     // Simu  
    w();
      mance.no perforTime = const start         
  nt);
    dients(coutIngreesateT this.generedients =