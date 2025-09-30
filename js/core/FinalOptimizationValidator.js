/**
 * Final Optimization Validator - Validates that all optimizations are working correctly
 * Tests critical rendering path, caching strategies, and UI/UX improvements
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

class FinalOptimizationValidator {
  constructor() {
    this.validationResults = {
      criticalPath: {},
      caching: {},
      uiux: {},
      performance: {},
      overall: {}
    };
    
    this.testSuite = [
      { category: 'criticalPath', test: 'validateCriticalCSS', name: 'Critical CSS Inlined' },
      { category: 'criticalPath', test: 'validateResourceHints', name: 'Resource Hints Present' },
      { category: 'criticalPath', test: 'validateFontOptimization', name: 'Font Loading Optimized' },
      { category: 'criticalPath', test: 'validateLayoutStability', name: 'Layout Stability Optimized' },
      
      { category: 'caching', test: 'validateCacheConfigurations', name: 'Cache Configurations Optimized' },
      { category: 'caching', test: 'validateIntelligentPrefetching', name: 'Intelligent Prefetching Active' },
      { category: 'caching', test: 'validateCacheEviction', name: 'Cache Eviction Optimized' },
      { category: 'caching', test: 'validateCacheWarming', name: 'Cache Warming Implemented' },
      
      { category: 'uiux', test: 'validateLoadingStates', name: 'Enhanced Loading States' },
      { category: 'uiux', test: 'validateVisualFeedback', name: 'Improved Visual Feedback' },
      { category: 'uiux', test: 'validateTouchOptimizations', name: 'Touch Interactions Optimized' },
      { category: 'uiux', test: 'validateAccessibility', name: 'Accessibility Enhanced' },
      { category: 'uiux', test: 'validateProgressiveDisclosure', name: 'Progressive Disclosure Implemented' },
      
      { category: 'performance', test: 'validateJavaScriptOptimization', name: 'JavaScript Execution Optimized' },
      { category: 'performance', test: 'validateVirtualScrolling', name: 'Virtual Scrolling Implemented' },
      { category: 'performance', test: 'validateImageOptimization', name: 'Image Loading Optimized' },
      { category: 'performance', test: 'validateRequestBatching', name: 'Request Batching Active' },
      { category: 'performance', test: 'validatePerformanceAlerts', name: 'Performance Alerts Configured' }
    ];
  }

  /**
   * Run complete validation suite
   */
  async runValidation() {
    console.log('🔍 Starting Final Optimization Validation...');
    
    const startTime = performance.now();
    let passedTests = 0;
    let totalTests = this.testSuite.length;
    
    for (const testConfig of this.testSuite) {
      try {
        const result = await this[testConfig.test]();
        this.validationResults[testConfig.category][testConfig.test] = {
          name: testConfig.name,
          passed: result.passed,
          details: result.details,
          timestamp: Date.now()
        };
        
        if (result.passed) {
          passedTests++;
          console.log(`✅ ${testConfig.name}`);
        } else {
          console.warn(`❌ ${testConfig.name}:`, result.details);
        }
      } catch (error) {
        console.error(`💥 ${testConfig.name} failed:`, error);
        this.validationResults[testConfig.category][testConfig.test] = {
          name: testConfig.name,
          passed: false,
          details: error.message,
          timestamp: Date.now()
        };
      }
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Calculate overall results
    this.validationResults.overall = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: (passedTests / totalTests) * 100,
      duration,
      timestamp: Date.now()
    };
    
    console.log(`🏁 Validation completed: ${passedTests}/${totalTests} tests passed (${this.validationResults.overall.successRate.toFixed(1)}%)`);
    console.log(`⏱️ Duration: ${duration.toFixed(2)}ms`);
    
    return this.validationResults;
  }

  /**
   * Validate critical CSS inlining
   */
  async validateCriticalCSS() {
    const inlineStyle = document.querySelector('style[data-critical]');
    const hasCriticalCSS = inlineStyle && inlineStyle.textContent.length > 0;
    
    return {
      passed: hasCriticalCSS,
      details: hasCriticalCSS ? 
        `Critical CSS inlined (${inlineStyle.textContent.length} chars)` :
        'Critical CSS not found or empty'
    };
  }

  /**
   * Validate resource hints
   */
  async validateResourceHints() {
    const dnsPrefetch = document.querySelectorAll('link[rel="dns-prefetch"]');
    const preconnect = document.querySelectorAll('link[rel="preconnect"]');
    const preload = document.querySelectorAll('link[rel="preload"]');
    
    const hasResourceHints = dnsPrefetch.length > 0 || preconnect.length > 0 || preload.length > 0;
    
    return {
      passed: hasResourceHints,
      details: {
        dnsPrefetch: dnsPrefetch.length,
        preconnect: preconnect.length,
        preload: preload.length
      }
    };
  }

  /**
   * Validate font optimization
   */
  async validateFontOptimization() {
    const fontLinks = document.querySelectorAll('link[href*="font"]');
    const optimizedFonts = Array.from(fontLinks).filter(link => 
      link.dataset.fontDisplay === 'swap' || link.dataset.optimized === 'true'
    );
    
    return {
      passed: optimizedFonts.length > 0 || fontLinks.length === 0,
      details: `${optimizedFonts.length}/${fontLinks.length} fonts optimized`
    };
  }

  /**
   * Validate layout stability optimizations
   */
  async validateLayoutStability() {
    const images = document.querySelectorAll('img');
    const imagesWithDimensions = Array.from(images).filter(img => 
      img.width || img.height || img.style.aspectRatio || img.style.width
    );
    
    const containers = document.querySelectorAll('.card, .tile, .appbar, .tabbar');
    const containedElements = Array.from(containers).filter(el => 
      el.style.contain && el.style.contain.includes('layout')
    );
    
    const layoutOptimized = (imagesWithDimensions.length === images.length || images.length === 0) &&
                           containedElements.length > 0;
    
    return {
      passed: layoutOptimized,
      details: {
        imagesWithDimensions: `${imagesWithDimensions.length}/${images.length}`,
        containedElements: containedElements.length
      }
    };
  }  /**
   * 
Validate cache configurations
   */
  async validateCacheConfigurations() {
    const cacheManager = window.cacheManager;
    if (!cacheManager) {
      return { passed: false, details: 'CacheManager not available' };
    }
    
    const hasOptimizedConfigs = cacheManager.dataConfigs &&
      cacheManager.dataConfigs.ingredients &&
      cacheManager.dataConfigs.ingredients.ttl > 60 * 60 * 1000; // Should be > 1 hour
    
    return {
      passed: hasOptimizedConfigs,
      details: hasOptimizedConfigs ? 
        'Cache configurations optimized with extended TTL' :
        'Cache configurations not optimized'
    };
  }

  /**
   * Validate intelligent prefetching
   */
  async validateIntelligentPrefetching() {
    const prefetchManager = window.prefetchManager;
    const hasIntelligentPrefetching = prefetchManager && 
      typeof prefetchManager.trackPattern === 'function' &&
      typeof prefetchManager.getLikelyNext === 'function';
    
    return {
      passed: hasIntelligentPrefetching,
      details: hasIntelligentPrefetching ?
        'Intelligent prefetching system active' :
        'Intelligent prefetching not implemented'
    };
  }

  /**
   * Validate cache eviction optimization
   */
  async validateCacheEviction() {
    const cacheManager = window.cacheManager;
    if (!cacheManager) {
      return { passed: false, details: 'CacheManager not available' };
    }
    
    // Test if LRU with frequency tracking is implemented
    const originalSetInMemory = cacheManager.setInMemory.toString();
    const hasFrequencyTracking = originalSetInMemory.includes('frequency');
    
    return {
      passed: hasFrequencyTracking,
      details: hasFrequencyTracking ?
        'Cache eviction optimized with frequency tracking' :
        'Cache eviction not optimized'
    };
  }

  /**
   * Validate cache warming
   */
  async validateCacheWarming() {
    const cacheManager = window.cacheManager;
    if (!cacheManager || typeof cacheManager.warmCache !== 'function') {
      return { passed: false, details: 'Cache warming not available' };
    }
    
    // Check if cache has been warmed (has some cached data)
    const stats = await cacheManager.getStats();
    const hasCachedData = stats.memory.size > 0 || 
      stats.session.size > 0 || 
      Object.values(stats.indexeddb).some(count => count > 0);
    
    return {
      passed: hasCachedData,
      details: hasCachedData ?
        `Cache warmed with data: ${JSON.stringify(stats)}` :
        'Cache not warmed'
    };
  }

  /**
   * Validate enhanced loading states
   */
  async validateLoadingStates() {
    const skeletonLoaders = document.querySelectorAll('.skeleton-loader');
    const enhancedButtons = document.querySelectorAll('button[data-feedback-added], .btn[data-feedback-added]');
    const rippleElements = document.querySelectorAll('[data-ripple-added]');
    
    const hasEnhancedLoading = skeletonLoaders.length > 0 || 
      enhancedButtons.length > 0 || 
      rippleElements.length > 0;
    
    return {
      passed: hasEnhancedLoading,
      details: {
        skeletonLoaders: skeletonLoaders.length,
        enhancedButtons: enhancedButtons.length,
        rippleElements: rippleElements.length
      }
    };
  }

  /**
   * Validate improved visual feedback
   */
  async validateVisualFeedback() {
    // Check if toast function is enhanced
    const toastEnhanced = window.toast && window.toast.toString().includes('type');
    
    // Check for progress indicators
    const progressBars = document.querySelectorAll('.progress-bar');
    
    // Check for enhanced form validation
    const validationEnhanced = document.querySelectorAll('input[data-validation-enhanced]').length > 0;
    
    const hasImprovedFeedback = toastEnhanced || progressBars.length > 0 || validationEnhanced;
    
    return {
      passed: hasImprovedFeedback,
      details: {
        toastEnhanced,
        progressBars: progressBars.length,
        validationEnhanced
      }
    };
  }

  /**
   * Validate touch optimizations
   */
  async validateTouchOptimizations() {
    const touchTargets = document.querySelectorAll('button, .btn, .tabbtn, input, select');
    const optimizedTargets = Array.from(touchTargets).filter(target => {
      const rect = target.getBoundingClientRect();
      const styles = window.getComputedStyle(target);
      return rect.width >= 44 && rect.height >= 44 || 
        parseFloat(styles.minWidth) >= 44 || 
        parseFloat(styles.minHeight) >= 44;
    });
    
    const scrollOptimized = document.querySelectorAll('[style*="webkit-overflow-scrolling"]').length > 0 ||
      document.body.style.overscrollBehavior === 'none';
    
    return {
      passed: optimizedTargets.length > 0 && scrollOptimized,
      details: {
        optimizedTargets: `${optimizedTargets.length}/${touchTargets.length}`,
        scrollOptimized
      }
    };
  }

  /**
   * Validate accessibility enhancements
   */
  async validateAccessibility() {
    const skipLinks = document.querySelectorAll('.skip-link');
    const ariaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]');
    const focusEnhanced = document.querySelectorAll('[data-focus-enhanced]');
    const keyboardShortcuts = document.querySelectorAll('.keyboard-shortcuts-info');
    
    const accessibilityEnhanced = skipLinks.length > 0 || 
      ariaLabels.length > 0 || 
      focusEnhanced.length > 0 || 
      keyboardShortcuts.length > 0;
    
    return {
      passed: accessibilityEnhanced,
      details: {
        skipLinks: skipLinks.length,
        ariaLabels: ariaLabels.length,
        focusEnhanced: focusEnhanced.length,
        keyboardShortcuts: keyboardShortcuts.length
      }
    };
  }

  /**
   * Validate progressive disclosure
   */
  async validateProgressiveDisclosure() {
    const progressiveToggles = document.querySelectorAll('.progressive-toggle');
    const advancedSections = document.querySelectorAll('[data-progressive-added]');
    
    return {
      passed: progressiveToggles.length > 0 || advancedSections.length > 0,
      details: {
        progressiveToggles: progressiveToggles.length,
        advancedSections: advancedSections.length
      }
    };
  }

  /**
   * Validate JavaScript optimization
   */
  async validateJavaScriptOptimization() {
    const debouncedInputs = document.querySelectorAll('input[data-debounced]');
    const throttledScroll = window.onscroll && window.onscroll.toString().includes('setTimeout');
    
    return {
      passed: debouncedInputs.length > 0 || throttledScroll,
      details: {
        debouncedInputs: debouncedInputs.length,
        throttledScroll: !!throttledScroll
      }
    };
  }

  /**
   * Validate virtual scrolling
   */
  async validateVirtualScrolling() {
    const virtualScrollElements = document.querySelectorAll('[data-virtual-scroll-added]');
    const virtualScrollContainers = document.querySelectorAll('.virtual-scroll-container');
    
    return {
      passed: virtualScrollElements.length > 0 || virtualScrollContainers.length > 0,
      details: {
        virtualScrollElements: virtualScrollElements.length,
        virtualScrollContainers: virtualScrollContainers.length
      }
    };
  }

  /**
   * Validate image optimization
   */
  async validateImageOptimization() {
    const images = document.querySelectorAll('img');
    const lazyImages = Array.from(images).filter(img => img.loading === 'lazy');
    const asyncImages = Array.from(images).filter(img => img.decoding === 'async');
    
    const imageOptimized = lazyImages.length > 0 || asyncImages.length > 0 || images.length === 0;
    
    return {
      passed: imageOptimized,
      details: {
        totalImages: images.length,
        lazyImages: lazyImages.length,
        asyncImages: asyncImages.length
      }
    };
  }

  /**
   * Validate request batching
   */
  async validateRequestBatching() {
    const requestBatcher = window.requestBatcher;
    const batchingActive = requestBatcher && 
      typeof requestBatcher.addRequest === 'function' &&
      typeof requestBatcher.executeBatch === 'function';
    
    // Check if fetch is overridden for batching
    const fetchOverridden = window.fetch.toString().includes('requestBatcher');
    
    return {
      passed: batchingActive && fetchOverridden,
      details: {
        batchingActive,
        fetchOverridden
      }
    };
  }

  /**
   * Validate performance alerts
   */
  async validatePerformanceAlerts() {
    const performanceMonitor = window.performanceMonitor;
    const finalOptimizationManager = window.finalOptimizationManager;
    
    const alertsConfigured = performanceMonitor && 
      performanceMonitor.alertCallbacks &&
      performanceMonitor.alertCallbacks.length > 0;
    
    const optimizationManagerActive = finalOptimizationManager &&
      typeof finalOptimizationManager.handlePerformanceAlert === 'function';
    
    return {
      passed: alertsConfigured && optimizationManagerActive,
      details: {
        alertsConfigured,
        optimizationManagerActive,
        alertCallbacks: performanceMonitor?.alertCallbacks?.length || 0
      }
    };
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.validationResults.overall,
      categories: {
        criticalPath: this.calculateCategoryScore('criticalPath'),
        caching: this.calculateCategoryScore('caching'),
        uiux: this.calculateCategoryScore('uiux'),
        performance: this.calculateCategoryScore('performance')
      },
      details: this.validationResults,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  /**
   * Calculate score for a category
   */
  calculateCategoryScore(category) {
    const tests = this.validationResults[category];
    const testKeys = Object.keys(tests);
    
    if (testKeys.length === 0) {
      return { score: 0, passed: 0, total: 0 };
    }
    
    const passed = testKeys.filter(key => tests[key].passed).length;
    const total = testKeys.length;
    const score = (passed / total) * 100;
    
    return { score, passed, total };
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check each category for failures
    Object.keys(this.validationResults).forEach(category => {
      if (category === 'overall') return;
      
      const categoryTests = this.validationResults[category];
      Object.keys(categoryTests).forEach(testKey => {
        const test = categoryTests[testKey];
        if (!test.passed) {
          recommendations.push({
            category,
            test: test.name,
            issue: test.details,
            priority: this.getRecommendationPriority(category, testKey),
            action: this.getRecommendationAction(category, testKey)
          });
        }
      });
    });
    
    return recommendations;
  }

  /**
   * Get recommendation priority
   */
  getRecommendationPriority(category, testKey) {
    const highPriority = [
      'validateCriticalCSS',
      'validateCacheConfigurations',
      'validateAccessibility',
      'validatePerformanceAlerts'
    ];
    
    return highPriority.includes(testKey) ? 'high' : 'medium';
  }

  /**
   * Get recommendation action
   */
  getRecommendationAction(category, testKey) {
    const actions = {
      validateCriticalCSS: 'Ensure critical CSS is properly inlined in the document head',
      validateResourceHints: 'Add dns-prefetch, preconnect, and preload hints for critical resources',
      validateCacheConfigurations: 'Verify CacheManager is loaded and configured with optimized TTL values',
      validateAccessibility: 'Add ARIA labels, skip links, and keyboard navigation support',
      validatePerformanceAlerts: 'Configure performance monitoring with alert callbacks'
    };
    
    return actions[testKey] || 'Review and implement the missing optimization';
  }

  /**
   * Log validation summary
   */
  logSummary() {
    const report = this.generateReport();
    
    console.group('🔍 Final Optimization Validation Summary');
    console.log(`Overall Score: ${report.summary.successRate.toFixed(1)}% (${report.summary.passedTests}/${report.summary.totalTests})`);
    
    Object.keys(report.categories).forEach(category => {
      const cat = report.categories[category];
      console.log(`${category}: ${cat.score.toFixed(1)}% (${cat.passed}/${cat.total})`);
    });
    
    if (report.recommendations.length > 0) {
      console.log('Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`- [${rec.priority.toUpperCase()}] ${rec.test}: ${rec.action}`);
      });
    }
    
    console.groupEnd();
    
    return report;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinalOptimizationValidator;
} else if (typeof window !== 'undefined') {
  window.FinalOptimizationValidator = FinalOptimizationValidator;
}

export default FinalOptimizationValidator;