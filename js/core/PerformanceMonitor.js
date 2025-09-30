/**
 * Performance Monitor - Tracks CSS and JavaScript performance metrics
 * Monitors Core Web Vitals and provides optimization insights
 * Enhanced with real-time monitoring, alerts, and POS-specific metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // Core Web Vitals
      lcp: null,
      fid: null,
      cls: null,
      
      // CSS Performance
      criticalCSSTime: null,
      nonCriticalCSSTime: null,
      totalCSSSize: 0,
      
      // JavaScript Performance
      jsLoadTime: null,
      moduleLoadTimes: new Map(),
      
      // General Performance
      domContentLoaded: null,
      windowLoaded: null,
      firstPaint: null,
      firstContentfulPaint: null,
      
      // POS-specific metrics
      posOperations: new Map(),
      dataLoadTimes: new Map(),
      searchPerformance: [],
      cacheHitRate: 0,
      offlineOperations: 0,
      syncPerformance: []
    };
    
    this.observers = [];
    this.startTime = performance.now();
    this.alertThresholds = {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      apiResponse: 1000,
      searchTime: 300,
      tabSwitch: 200
    };
    this.alertCallbacks = [];
    this.isMonitoring = true;
    this.reportingInterval = null;
    
    this.init();
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    this.measureBasicMetrics();
    this.setupCoreWebVitals();
    this.setupResourceTiming();
    this.setupNavigationTiming();
    this.setupCustomMetrics();
    this.setupPOSMetrics();
    this.setupRealTimeMonitoring();
    this.setupPerformanceAlerts();
  }

  /**
   * Measure basic performance metrics
   */
  measureBasicMetrics() {
    // DOM Content Loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.metrics.domContentLoaded = performance.now() - this.startTime;
      });
    } else {
      this.metrics.domContentLoaded = 0; // Already loaded
    }

    // Window Load
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        this.metrics.windowLoaded = performance.now() - this.startTime;
      });
    } else {
      this.metrics.windowLoaded = 0; // Already loaded
    }

    // Paint Timing
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (entry.name === 'first-paint') {
              this.metrics.firstPaint = entry.startTime;
            }
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            }
          });
        });

        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (error) {
        console.warn('Paint timing not available:', error);
      }
    }
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  setupCoreWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

    } catch (error) {
      console.warn('Core Web Vitals monitoring not available:', error);
    }
  }

  /**
   * Setup resource timing monitoring
   */
  setupResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.initiatorType === 'css' || entry.name.endsWith('.css')) {
            this.trackCSSResource(entry);
          } else if (entry.initiatorType === 'script' || entry.name.endsWith('.js')) {
            this.trackJSResource(entry);
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource timing not available:', error);
    }
  }

  /**
   * Track CSS resource performance
   */
  trackCSSResource(entry) {
    const loadTime = entry.responseEnd - entry.startTime;
    this.metrics.totalCSSSize += entry.transferSize || 0;

    if (entry.name.includes('critical.css') || entry.name.includes('inline')) {
      this.metrics.criticalCSSTime = loadTime;
    } else {
      this.metrics.nonCriticalCSSTime = loadTime;
    }

    console.log(`CSS loaded: ${entry.name} in ${loadTime.toFixed(2)}ms`);
  }

  /**
   * Track JavaScript resource performance
   */
  trackJSResource(entry) {
    const loadTime = entry.responseEnd - entry.startTime;
    
    if (entry.name.includes('critical.js')) {
      this.metrics.jsLoadTime = loadTime;
    } else {
      // Track module load times
      const moduleName = this.extractModuleName(entry.name);
      this.metrics.moduleLoadTimes.set(moduleName, loadTime);
    }

    console.log(`JS loaded: ${entry.name} in ${loadTime.toFixed(2)}ms`);
  }

  /**
   * Extract module name from URL
   */
  extractModuleName(url) {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace('.js', '');
  }

  /**
   * Setup navigation timing
   */
  setupNavigationTiming() {
    if (!performance.getEntriesByType) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.metrics.navigationTiming = {
        domainLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
        domComplete: navigation.domComplete - navigation.domContentLoadedEventStart
      };
    }
  }

  /**
   * Setup custom metrics for POS-specific performance
   */
  setupCustomMetrics() {
    // Track tab switching performance
    this.trackTabSwitching();
    
    // Track form interaction performance
    this.trackFormPerformance();
    
    // Track API response times
    this.trackAPIPerformance();
  }

  /**
   * Track tab switching performance
   */
  trackTabSwitching() {
    const tabButtons = document.querySelectorAll('.tabbtn');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const startTime = performance.now();
        const route = button.dataset.route;
        
        // Use requestAnimationFrame to measure after render
        requestAnimationFrame(() => {
          const endTime = performance.now();
          const switchTime = endTime - startTime;
          
          console.log(`Tab switch to ${route}: ${switchTime.toFixed(2)}ms`);
          
          // Store in custom metrics
          if (!this.metrics.tabSwitchTimes) {
            this.metrics.tabSwitchTimes = new Map();
          }
          this.metrics.tabSwitchTimes.set(route, switchTime);
        });
      });
    });
  }

  /**
   * Track form performance
   */
  trackFormPerformance() {
    const forms = document.querySelectorAll('form, .card');
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          const startTime = performance.now();
          
          input.addEventListener('blur', () => {
            const endTime = performance.now();
            const interactionTime = endTime - startTime;
            
            if (!this.metrics.formInteractionTimes) {
              this.metrics.formInteractionTimes = [];
            }
            this.metrics.formInteractionTimes.push(interactionTime);
          }, { once: true });
        });
      });
    });
  }

  /**
   * Track API performance
   */
  trackAPIPerformance() {
    // Override fetch to track API calls
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const apiTime = endTime - startTime;
        
        if (!this.metrics.apiTimes) {
          this.metrics.apiTimes = [];
        }
        this.metrics.apiTimes.push({
          url: args[0],
          time: apiTime,
          status: response.status
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const apiTime = endTime - startTime;
        
        if (!this.metrics.apiErrors) {
          this.metrics.apiErrors = [];
        }
        this.metrics.apiErrors.push({
          url: args[0],
          time: apiTime,
          error: error.message
        });
        
        throw error;
      }
    };
  }

  /**
   * Get performance report
   */
  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      scores: this.calculateScores(),
      recommendations: this.getRecommendations()
    };

    // Convert Maps to Objects for JSON serialization
    if (this.metrics.moduleLoadTimes) {
      report.metrics.moduleLoadTimes = Object.fromEntries(this.metrics.moduleLoadTimes);
    }
    if (this.metrics.tabSwitchTimes) {
      report.metrics.tabSwitchTimes = Object.fromEntries(this.metrics.tabSwitchTimes);
    }

    return report;
  }

  /**
   * Calculate performance scores
   */
  calculateScores() {
    const scores = {};

    // LCP Score (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
    if (this.metrics.lcp !== null) {
      if (this.metrics.lcp < 2500) scores.lcp = 'good';
      else if (this.metrics.lcp < 4000) scores.lcp = 'needs-improvement';
      else scores.lcp = 'poor';
    }

    // FID Score (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    if (this.metrics.fid !== null) {
      if (this.metrics.fid < 100) scores.fid = 'good';
      else if (this.metrics.fid < 300) scores.fid = 'needs-improvement';
      else scores.fid = 'poor';
    }

    // CLS Score (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (this.metrics.cls !== null) {
      if (this.metrics.cls < 0.1) scores.cls = 'good';
      else if (this.metrics.cls < 0.25) scores.cls = 'needs-improvement';
      else scores.cls = 'poor';
    }

    return scores;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const scores = this.calculateScores();

    if (scores.lcp === 'poor' || scores.lcp === 'needs-improvement') {
      recommendations.push('Consider optimizing images and critical CSS to improve LCP');
    }

    if (scores.fid === 'poor' || scores.fid === 'needs-improvement') {
      recommendations.push('Reduce JavaScript execution time to improve FID');
    }

    if (scores.cls === 'poor' || scores.cls === 'needs-improvement') {
      recommendations.push('Add size attributes to images and reserve space for dynamic content');
    }

    if (this.metrics.criticalCSSTime > 1000) {
      recommendations.push('Critical CSS is taking too long to load - consider inlining');
    }

    if (this.metrics.totalCSSSize > 50000) {
      recommendations.push('CSS bundle is large - consider code splitting');
    }

    return recommendations;
  }

  /**
   * Log performance summary
   */
  logSummary() {
    const report = this.getReport();
    
    console.group('🚀 Performance Summary');
    console.log('Core Web Vitals:', report.scores);
    console.log('Load Times:', {
      'DOM Content Loaded': `${this.metrics.domContentLoaded?.toFixed(2)}ms`,
      'Window Loaded': `${this.metrics.windowLoaded?.toFixed(2)}ms`,
      'First Contentful Paint': `${this.metrics.firstContentfulPaint?.toFixed(2)}ms`,
      'Largest Contentful Paint': `${this.metrics.lcp?.toFixed(2)}ms`
    });
    console.log('CSS Performance:', {
      'Critical CSS': `${this.metrics.criticalCSSTime?.toFixed(2)}ms`,
      'Non-Critical CSS': `${this.metrics.nonCriticalCSSTime?.toFixed(2)}ms`,
      'Total CSS Size': `${(this.metrics.totalCSSSize / 1024).toFixed(2)}KB`
    });
    if (report.recommendations.length > 0) {
      console.log('Recommendations:', report.recommendations);
    }
    console.groupEnd();
  }

  /**
   * Setup POS-specific performance metrics
   */
  setupPOSMetrics() {
    // Track ingredient search performance
    this.trackIngredientSearch();
    
    // Track data operations (save, load, sync)
    this.trackDataOperations();
    
    // Track cache performance
    this.trackCachePerformance();
    
    // Track offline operations
    this.trackOfflineOperations();
  }

  /**
   * Track ingredient search performance
   */
  trackIngredientSearch() {
    // Monitor search input performance
    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-search="ingredients"], [data-search="menu"]')) {
        const startTime = performance.now();
        
        // Use requestAnimationFrame to measure after search results render
        requestAnimationFrame(() => {
          const endTime = performance.now();
          const searchTime = endTime - startTime;
          
          this.metrics.searchPerformance.push({
            type: e.target.dataset.search,
            time: searchTime,
            query: e.target.value,
            timestamp: Date.now()
          });
          
          // Alert if search is too slow
          if (searchTime > this.alertThresholds.searchTime) {
            this.triggerAlert('slow-search', {
              time: searchTime,
              threshold: this.alertThresholds.searchTime,
              type: e.target.dataset.search
            });
          }
        });
      }
    });
  }

  /**
   * Track data operations performance
   */
  trackDataOperations() {
    // Track save operations
    this.trackOperation('save');
    
    // Track load operations
    this.trackOperation('load');
    
    // Track sync operations
    this.trackOperation('sync');
  }

  /**
   * Track specific operation performance
   */
  trackOperation(operationType) {
    const originalMethod = window[`${operationType}Data`];
    if (typeof originalMethod === 'function') {
      window[`${operationType}Data`] = async (...args) => {
        const startTime = performance.now();
        
        try {
          const result = await originalMethod.apply(this, args);
          const endTime = performance.now();
          const operationTime = endTime - startTime;
          
          if (!this.metrics.posOperations.has(operationType)) {
            this.metrics.posOperations.set(operationType, []);
          }
          
          this.metrics.posOperations.get(operationType).push({
            time: operationTime,
            timestamp: Date.now(),
            success: true
          });
          
          return result;
        } catch (error) {
          const endTime = performance.now();
          const operationTime = endTime - startTime;
          
          this.metrics.posOperations.get(operationType).push({
            time: operationTime,
            timestamp: Date.now(),
            success: false,
            error: error.message
          });
          
          throw error;
        }
      };
    }
  }

  /**
   * Track cache performance
   */
  trackCachePerformance() {
    let cacheHits = 0;
    let cacheMisses = 0;
    
    // Override cache methods if they exist
    if (window.CacheManager) {
      const originalGet = window.CacheManager.get;
      window.CacheManager.get = function(key) {
        const result = originalGet.call(this, key);
        if (result !== null && result !== undefined) {
          cacheHits++;
        } else {
          cacheMisses++;
        }
        
        // Update cache hit rate
        const total = cacheHits + cacheMisses;
        window.performanceMonitor.metrics.cacheHitRate = total > 0 ? (cacheHits / total) * 100 : 0;
        
        return result;
      };
    }
  }

  /**
   * Track offline operations
   */
  trackOfflineOperations() {
    // Listen for online/offline events
    window.addEventListener('offline', () => {
      this.metrics.offlineOperations++;
    });
    
    // Track operations performed while offline
    if (window.ServiceWorkerManager) {
      window.ServiceWorkerManager.onOfflineOperation = () => {
        this.metrics.offlineOperations++;
      };
    }
  }

  /**
   * Setup real-time monitoring
   */
  setupRealTimeMonitoring() {
    // Start continuous monitoring
    this.reportingInterval = setInterval(() => {
      this.generateRealTimeReport();
    }, 30000); // Report every 30 seconds
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor network conditions
    this.monitorNetworkConditions();
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };
        
        // Alert if memory usage is high
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          this.triggerAlert('high-memory-usage', {
            usage: usagePercent,
            used: memory.usedJSHeapSize,
            limit: memory.jsHeapSizeLimit
          });
        }
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Monitor network conditions
   */
  monitorNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      this.metrics.networkConditions = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
      
      // Listen for network changes
      connection.addEventListener('change', () => {
        this.metrics.networkConditions = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          timestamp: Date.now()
        };
        
        // Alert on slow network
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.triggerAlert('slow-network', {
            type: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          });
        }
      });
    }
  }

  /**
   * Setup performance alerts
   */
  setupPerformanceAlerts() {
    // Monitor Core Web Vitals in real-time
    setInterval(() => {
      this.checkCoreWebVitalsAlerts();
    }, 5000);
    
    // Monitor API response times
    this.monitorAPIResponseTimes();
  }

  /**
   * Check Core Web Vitals for alerts
   */
  checkCoreWebVitalsAlerts() {
    if (this.metrics.lcp && this.metrics.lcp > this.alertThresholds.lcp) {
      this.triggerAlert('poor-lcp', {
        value: this.metrics.lcp,
        threshold: this.alertThresholds.lcp
      });
    }
    
    if (this.metrics.fid && this.metrics.fid > this.alertThresholds.fid) {
      this.triggerAlert('poor-fid', {
        value: this.metrics.fid,
        threshold: this.alertThresholds.fid
      });
    }
    
    if (this.metrics.cls && this.metrics.cls > this.alertThresholds.cls) {
      this.triggerAlert('poor-cls', {
        value: this.metrics.cls,
        threshold: this.alertThresholds.cls
      });
    }
  }

  /**
   * Monitor API response times
   */
  monitorAPIResponseTimes() {
    // This enhances the existing API tracking with alerts
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const apiTime = endTime - startTime;
        
        if (!this.metrics.apiTimes) {
          this.metrics.apiTimes = [];
        }
        this.metrics.apiTimes.push({
          url: args[0],
          time: apiTime,
          status: response.status,
          timestamp: Date.now()
        });
        
        // Alert on slow API responses
        if (apiTime > this.alertThresholds.apiResponse) {
          this.triggerAlert('slow-api-response', {
            url: args[0],
            time: apiTime,
            threshold: this.alertThresholds.apiResponse
          });
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const apiTime = endTime - startTime;
        
        if (!this.metrics.apiErrors) {
          this.metrics.apiErrors = [];
        }
        this.metrics.apiErrors.push({
          url: args[0],
          time: apiTime,
          error: error.message,
          timestamp: Date.now()
        });
        
        this.triggerAlert('api-error', {
          url: args[0],
          error: error.message,
          time: apiTime
        });
        
        throw error;
      }
    };
  }

  /**
   * Trigger performance alert
   */
  triggerAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type)
    };
    
    console.warn(`🚨 Performance Alert: ${type}`, data);
    
    // Call registered alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in performance alert callback:', error);
      }
    });
    
    // Store alert in metrics
    if (!this.metrics.alerts) {
      this.metrics.alerts = [];
    }
    this.metrics.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }
  }

  /**
   * Get alert severity level
   */
  getAlertSeverity(type) {
    const severityMap = {
      'poor-lcp': 'high',
      'poor-fid': 'high',
      'poor-cls': 'medium',
      'slow-api-response': 'medium',
      'api-error': 'high',
      'slow-search': 'low',
      'high-memory-usage': 'high',
      'slow-network': 'medium'
    };
    
    return severityMap[type] || 'low';
  }

  /**
   * Register alert callback
   */
  onAlert(callback) {
    if (typeof callback === 'function') {
      this.alertCallbacks.push(callback);
    }
  }

  /**
   * Generate real-time performance report
   */
  generateRealTimeReport() {
    if (!this.isMonitoring) return;
    
    const report = {
      timestamp: Date.now(),
      coreWebVitals: {
        lcp: this.metrics.lcp,
        fid: this.metrics.fid,
        cls: this.metrics.cls
      },
      posMetrics: {
        cacheHitRate: this.metrics.cacheHitRate,
        offlineOperations: this.metrics.offlineOperations,
        averageSearchTime: this.getAverageSearchTime(),
        recentAPITimes: this.getRecentAPITimes()
      },
      systemMetrics: {
        memoryUsage: this.metrics.memoryUsage,
        networkConditions: this.metrics.networkConditions
      },
      recommendations: this.getOptimizationRecommendations()
    };
    
    // Send to analytics if available
    if (window.UserAnalytics) {
      window.UserAnalytics.trackPerformance(report);
    }
    
    return report;
  }

  /**
   * Get average search time
   */
  getAverageSearchTime() {
    if (this.metrics.searchPerformance.length === 0) return 0;
    
    const recentSearches = this.metrics.searchPerformance.slice(-10);
    const totalTime = recentSearches.reduce((sum, search) => sum + search.time, 0);
    return totalTime / recentSearches.length;
  }

  /**
   * Get recent API times
   */
  getRecentAPITimes() {
    if (!this.metrics.apiTimes || this.metrics.apiTimes.length === 0) return [];
    
    return this.metrics.apiTimes.slice(-5).map(api => ({
      url: api.url,
      time: api.time,
      status: api.status
    }));
  }

  /**
   * Get optimization recommendations based on current metrics
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    
    // Cache performance recommendations
    if (this.metrics.cacheHitRate < 70) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        message: 'Cache hit rate is low. Consider preloading frequently used data.',
        action: 'improve-caching'
      });
    }
    
    // Search performance recommendations
    const avgSearchTime = this.getAverageSearchTime();
    if (avgSearchTime > 200) {
      recommendations.push({
        type: 'search',
        priority: 'medium',
        message: 'Search performance is slow. Consider implementing search indexing.',
        action: 'optimize-search'
      });
    }
    
    // Memory usage recommendations
    if (this.metrics.memoryUsage && this.metrics.memoryUsage.used > this.metrics.memoryUsage.limit * 0.7) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Memory usage is high. Consider implementing data cleanup.',
        action: 'optimize-memory'
      });
    }
    
    // Network recommendations
    if (this.metrics.networkConditions && this.metrics.networkConditions.effectiveType === 'slow-2g') {
      recommendations.push({
        type: 'network',
        priority: 'high',
        message: 'Slow network detected. Enable data saving mode.',
        action: 'enable-data-saving'
      });
    }
    
    return recommendations;
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    this.isMonitoring = true;
    if (!this.reportingInterval) {
      this.setupRealTimeMonitoring();
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
  }

  /**
   * Clean up observers
   */
  destroy() {
    this.stopMonitoring();
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
    this.alertCallbacks = [];
  }
}

// Auto-initialize performance monitoring
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor = new PerformanceMonitor();
    
    // Log summary after everything is loaded
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.performanceMonitor.logSummary();
      }, 1000);
    });
  });
} else {
  window.performanceMonitor = new PerformanceMonitor();
  
  setTimeout(() => {
    window.performanceMonitor.logSummary();
  }, 1000);
}

export default PerformanceMonitor;