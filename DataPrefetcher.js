/**
 * Intelligent Data Prefetching System for POS
 * Implements predictive loading based on user patterns and usage frequency
 */
class DataPrefetcher {
  constructor(cacheManager, apiClient) {
    this.cache = cacheManager;
    this.api = apiClient;
    this.userPatterns = new Map();
    this.usageStats = new Map();
    this.prefetchQueue = [];
    this.isProcessing = false;
    this.maxConcurrentRequests = 3;
    this.patternStorageKey = 'pos_user_patterns';
    this.statsStorageKey = 'pos_usage_stats';
    
    // Configuration for different data types
    this.prefetchConfigs = {
      ingredients: {
        enabled: true,
        priority: 1,
        batchSize: 20,
        triggerThreshold: 0.7, // Prefetch when 70% likely to be used
        maxAge: 60 * 60 * 1000 // 1 hour
      },
      menus: {
        enabled: true,
        priority: 2,
        batchSize: 15,
        triggerThreshold: 0.6,
        maxAge: 60 * 60 * 1000 // 1 hour
      },
      recentTransactions: {
        enabled: true,
        priority: 3,
        batchSize: 10,
        triggerThreshold: 0.5,
        maxAge: 30 * 60 * 1000 // 30 minutes
      }
    };

    this.loadUserPatterns();
    this.loadUsageStats();
    this.startBackgroundSync();
  }

  /**
   * Track user interaction patterns
   */
  trackUserAction(action, data) {
    const timestamp = Date.now();
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    const pattern = {
      action,
      data,
      timestamp,
      hour,
      dayOfWeek,
      context: this.getCurrentContext()
    };

    // Store in user patterns
    const patternKey = `${action}_${hour}_${dayOfWeek}`;
    if (!this.userPatterns.has(patternKey)) {
      this.userPatterns.set(patternKey, []);
    }
    
    const patterns = this.userPatterns.get(patternKey);
    patterns.push(pattern);
    
    // Keep only recent patterns (last 30 days)
    const thirtyDaysAgo = timestamp - (30 * 24 * 60 * 60 * 1000);
    this.userPatterns.set(patternKey, 
      patterns.filter(p => p.timestamp > thirtyDaysAgo)
    );

    // Update usage statistics
    this.updateUsageStats(action, data);
    
    // Trigger predictive prefetching
    this.triggerPredictivePrefetch(pattern);
    
    // Persist patterns
    this.saveUserPatterns();
  }

  /**
   * Update usage statistics for items
   */
  updateUsageStats(action, data) {
    if (data.ingredientId) {
      this.incrementUsageStat('ingredient', data.ingredientId);
    }
    if (data.menuId) {
      this.incrementUsageStat('menu', data.menuId);
    }
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        if (item.ingredientId) {
          this.incrementUsageStat('ingredient', item.ingredientId);
        }
      });
    }
  }

  /**
   * Increment usage statistics for an item
   */
  incrementUsageStat(type, id) {
    const key = `${type}_${id}`;
    const current = this.usageStats.get(key) || {
      count: 0,
      lastUsed: 0,
      frequency: 0,
      recentUses: []
    };

    current.count++;
    current.lastUsed = Date.now();
    current.recentUses.push(Date.now());
    
    // Keep only recent uses (last 7 days)
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    current.recentUses = current.recentUses.filter(time => time > weekAgo);
    
    // Calculate frequency (uses per day)
    current.frequency = current.recentUses.length / 7;
    
    this.usageStats.set(key, current);
    this.saveUsageStats();
  }

  /**
   * Get current context for pattern analysis
   */
  getCurrentContext() {
    return {
      screen: this.getCurrentScreen(),
      timeOfDay: this.getTimeOfDay(),
      isWeekend: this.isWeekend(),
      recentActions: this.getRecentActions()
    };
  }

  getCurrentScreen() {
    // This would be implemented based on your app's routing
    return window.location.hash || 'home';
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }

  getRecentActions() {
    // Return last 5 actions from patterns
    const recent = [];
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    for (const patterns of this.userPatterns.values()) {
      patterns.forEach(pattern => {
        if (pattern.timestamp > fiveMinutesAgo) {
          recent.push(pattern.action);
        }
      });
    }
    
    return recent.slice(-5);
  }

  /**
   * Trigger predictive prefetching based on current pattern
   */
  async triggerPredictivePrefetch(currentPattern) {
    const predictions = this.generatePredictions(currentPattern);
    
    for (const prediction of predictions) {
      if (prediction.confidence >= this.prefetchConfigs[prediction.type]?.triggerThreshold) {
        await this.queuePrefetch(prediction);
      }
    }
  }

  /**
   * Generate predictions based on patterns and usage stats
   */
  generatePredictions(currentPattern) {
    const predictions = [];
    const context = currentPattern.context;
    
    // Predict based on time patterns
    const timeBasedPredictions = this.getTimeBasedPredictions(currentPattern);
    predictions.push(...timeBasedPredictions);
    
    // Predict based on usage frequency
    const frequencyPredictions = this.getFrequencyBasedPredictions();
    predictions.push(...frequencyPredictions);
    
    // Predict based on sequential patterns
    const sequentialPredictions = this.getSequentialPredictions(context.recentActions);
    predictions.push(...sequentialPredictions);
    
    // Sort by confidence and return top predictions
    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  /**
   * Get predictions based on time patterns
   */
  getTimeBasedPredictions(currentPattern) {
    const predictions = [];
    const patternKey = `${currentPattern.action}_${currentPattern.hour}_${currentPattern.dayOfWeek}`;
    const similarPatterns = this.userPatterns.get(patternKey) || [];
    
    // Analyze what typically happens after this pattern
    const followUpActions = new Map();
    
    similarPatterns.forEach(pattern => {
      // Look for actions that happened within 10 minutes after this pattern
      const tenMinutesLater = pattern.timestamp + (10 * 60 * 1000);
      
      for (const [key, patterns] of this.userPatterns.entries()) {
        patterns.forEach(followUp => {
          if (followUp.timestamp > pattern.timestamp && 
              followUp.timestamp <= tenMinutesLater) {
            const actionKey = followUp.action;
            followUpActions.set(actionKey, (followUpActions.get(actionKey) || 0) + 1);
          }
        });
      }
    });
    
    // Convert to predictions
    const totalSimilarPatterns = similarPatterns.length;
    if (totalSimilarPatterns > 0) {
      for (const [action, count] of followUpActions.entries()) {
        const confidence = count / totalSimilarPatterns;
        if (confidence > 0.3) { // At least 30% confidence
          predictions.push({
            type: this.getDataTypeFromAction(action),
            action,
            confidence,
            reason: 'time-pattern'
          });
        }
      }
    }
    
    return predictions;
  }  
/**
   * Get predictions based on usage frequency
   */
  getFrequencyBasedPredictions() {
    const predictions = [];
    const now = Date.now();
    
    // Get most frequently used items
    const frequentItems = Array.from(this.usageStats.entries())
      .filter(([key, stats]) => {
        // Only consider items used in the last 24 hours
        const dayAgo = now - (24 * 60 * 60 * 1000);
        return stats.lastUsed > dayAgo && stats.frequency > 0.5; // Used at least 0.5 times per day
      })
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, 20);
    
    frequentItems.forEach(([key, stats]) => {
      const [type, id] = key.split('_');
      const confidence = Math.min(stats.frequency / 5, 0.9); // Cap at 90%
      
      predictions.push({
        type: type === 'ingredient' ? 'ingredients' : 'menus',
        id,
        confidence,
        reason: 'frequency-based',
        stats
      });
    });
    
    return predictions;
  }

  /**
   * Get predictions based on sequential action patterns
   */
  getSequentialPredictions(recentActions) {
    const predictions = [];
    
    if (recentActions.length < 2) return predictions;
    
    // Look for common sequences in historical data
    const sequences = new Map();
    
    for (const patterns of this.userPatterns.values()) {
      for (let i = 0; i < patterns.length - 1; i++) {
        const current = patterns[i];
        const next = patterns[i + 1];
        
        // Check if actions happened within 5 minutes of each other
        if (next.timestamp - current.timestamp <= 5 * 60 * 1000) {
          const sequenceKey = `${current.action}->${next.action}`;
          sequences.set(sequenceKey, (sequences.get(sequenceKey) || 0) + 1);
        }
      }
    }
    
    // Check if current sequence matches any historical patterns
    const currentSequence = recentActions.slice(-2).join('->');
    const matchingSequences = Array.from(sequences.entries())
      .filter(([seq]) => seq.startsWith(currentSequence.split('->')[0]))
      .sort((a, b) => b[1] - a[1]);
    
    matchingSequences.slice(0, 5).forEach(([sequence, count]) => {
      const nextAction = sequence.split('->')[1];
      const confidence = Math.min(count / 10, 0.8); // Cap at 80%
      
      predictions.push({
        type: this.getDataTypeFromAction(nextAction),
        action: nextAction,
        confidence,
        reason: 'sequential-pattern'
      });
    });
    
    return predictions;
  }

  /**
   * Map action to data type
   */
  getDataTypeFromAction(action) {
    if (action.includes('ingredient')) return 'ingredients';
    if (action.includes('menu')) return 'menus';
    if (action.includes('sale') || action.includes('purchase')) return 'recentTransactions';
    return 'ingredients'; // Default
  }

  /**
   * Queue item for prefetching
   */
  async queuePrefetch(prediction) {
    const config = this.prefetchConfigs[prediction.type];
    if (!config || !config.enabled) return;
    
    // Check if already cached and fresh
    const cacheKey = prediction.id || `${prediction.type}_list`;
    const cached = await this.cache.get(cacheKey, prediction.type);
    
    if (cached) {
      // Already cached, no need to prefetch
      return;
    }
    
    // Add to prefetch queue
    this.prefetchQueue.push({
      ...prediction,
      priority: config.priority,
      queuedAt: Date.now()
    });
    
    // Sort queue by priority and confidence
    this.prefetchQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority number = higher priority
      }
      return b.confidence - a.confidence;
    });
    
    // Process queue
    this.processPrefetchQueue();
  }

  /**
   * Process the prefetch queue
   */
  async processPrefetchQueue() {
    if (this.isProcessing || this.prefetchQueue.length === 0) return;
    
    this.isProcessing = true;
    const concurrentPromises = [];
    
    while (this.prefetchQueue.length > 0 && concurrentPromises.length < this.maxConcurrentRequests) {
      const item = this.prefetchQueue.shift();
      
      // Skip if item is too old (queued more than 5 minutes ago)
      if (Date.now() - item.queuedAt > 5 * 60 * 1000) {
        continue;
      }
      
      const promise = this.prefetchItem(item);
      concurrentPromises.push(promise);
    }
    
    if (concurrentPromises.length > 0) {
      await Promise.allSettled(concurrentPromises);
    }
    
    this.isProcessing = false;
    
    // Continue processing if there are more items
    if (this.prefetchQueue.length > 0) {
      setTimeout(() => this.processPrefetchQueue(), 1000);
    }
  }

  /**
   * Prefetch a specific item
   */
  async prefetchItem(item) {
    try {
      const config = this.prefetchConfigs[item.type];
      let data;
      
      switch (item.type) {
        case 'ingredients':
          if (item.id) {
            data = await this.api.getIngredient(item.id);
            await this.cache.set(`ingredient_${item.id}`, data, 'ingredients');
          } else {
            data = await this.api.getFrequentIngredients(config.batchSize);
            await this.cache.set('frequent_ingredients', data, 'ingredients');
          }
          break;
          
        case 'menus':
          if (item.id) {
            data = await this.api.getMenu(item.id);
            await this.cache.set(`menu_${item.id}`, data, 'menus');
          } else {
            data = await this.api.getPopularMenus(config.batchSize);
            await this.cache.set('popular_menus', data, 'menus');
          }
          break;
          
        case 'recentTransactions':
          data = await this.api.getRecentTransactions(config.batchSize);
          await this.cache.set('recent_transactions', data, 'recentTransactions');
          break;
      }
      
      console.log(`Prefetched ${item.type}:`, item.id || 'batch', `(confidence: ${item.confidence})`);
      
    } catch (error) {
      console.warn(`Prefetch failed for ${item.type}:`, error);
    }
  }

  /**
   * Warm cache with most frequently used items
   */
  async warmCacheWithFrequentItems() {
    const frequentIngredients = this.getMostFrequentItems('ingredient', 20);
    const frequentMenus = this.getMostFrequentItems('menu', 15);
    
    // Prefetch frequent ingredients
    if (frequentIngredients.length > 0) {
      await this.cache.warmCache(
        'ingredients',
        frequentIngredients.map(item => `ingredient_${item.id}`),
        (key) => {
          const id = key.replace('ingredient_', '');
          return this.api.getIngredient(id);
        }
      );
    }
    
    // Prefetch frequent menus
    if (frequentMenus.length > 0) {
      await this.cache.warmCache(
        'menus',
        frequentMenus.map(item => `menu_${item.id}`),
        (key) => {
          const id = key.replace('menu_', '');
          return this.api.getMenu(id);
        }
      );
    }
  }

  /**
   * Get most frequently used items of a specific type
   */
  getMostFrequentItems(type, limit = 10) {
    const items = Array.from(this.usageStats.entries())
      .filter(([key]) => key.startsWith(`${type}_`))
      .map(([key, stats]) => ({
        id: key.replace(`${type}_`, ''),
        ...stats
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
    
    return items;
  }

  /**
   * Start background sync for critical data
   */
  startBackgroundSync() {
    // Sync every 5 minutes
    setInterval(async () => {
      await this.syncCriticalData();
    }, 5 * 60 * 1000);
    
    // Initial sync
    setTimeout(() => this.syncCriticalData(), 2000);
  }

  /**
   * Sync critical data in background
   */
  async syncCriticalData() {
    try {
      // Sync ingredient stock levels (critical for operations)
      const lowStockIngredients = await this.api.getLowStockIngredients();
      await this.cache.set('low_stock_ingredients', lowStockIngredients, 'ingredients');
      
      // Sync today's sales summary
      const todaySummary = await this.api.getTodaySummary();
      await this.cache.set('today_summary', todaySummary, 'reports');
      
      // Sync recent price changes
      const priceUpdates = await this.api.getRecentPriceUpdates();
      await this.cache.set('recent_price_updates', priceUpdates, 'ingredients');
      
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }

  /**
   * Load user patterns from storage
   */
  loadUserPatterns() {
    try {
      const stored = localStorage.getItem(this.patternStorageKey);
      if (stored) {
        const patterns = JSON.parse(stored);
        this.userPatterns = new Map(patterns);
      }
    } catch (error) {
      console.warn('Failed to load user patterns:', error);
    }
  }

  /**
   * Save user patterns to storage
   */
  saveUserPatterns() {
    try {
      const patterns = Array.from(this.userPatterns.entries());
      localStorage.setItem(this.patternStorageKey, JSON.stringify(patterns));
    } catch (error) {
      console.warn('Failed to save user patterns:', error);
    }
  }

  /**
   * Load usage statistics from storage
   */
  loadUsageStats() {
    try {
      const stored = localStorage.getItem(this.statsStorageKey);
      if (stored) {
        const stats = JSON.parse(stored);
        this.usageStats = new Map(stats);
      }
    } catch (error) {
      console.warn('Failed to load usage stats:', error);
    }
  }

  /**
   * Save usage statistics to storage
   */
  saveUsageStats() {
    try {
      const stats = Array.from(this.usageStats.entries());
      localStorage.setItem(this.statsStorageKey, JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save usage stats:', error);
    }
  }

  /**
   * Get prefetching statistics
   */
  getStats() {
    return {
      queueLength: this.prefetchQueue.length,
      isProcessing: this.isProcessing,
      patternsCount: this.userPatterns.size,
      usageStatsCount: this.usageStats.size,
      frequentIngredients: this.getMostFrequentItems('ingredient', 5),
      frequentMenus: this.getMostFrequentItems('menu', 5)
    };
  }

  /**
   * Clear all patterns and statistics
   */
  clearAllData() {
    this.userPatterns.clear();
    this.usageStats.clear();
    this.prefetchQueue = [];
    
    try {
      localStorage.removeItem(this.patternStorageKey);
      localStorage.removeItem(this.statsStorageKey);
    } catch (error) {
      console.warn('Failed to clear stored data:', error);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataPrefetcher;
} else if (typeof window !== 'undefined') {
  window.DataPrefetcher = DataPrefetcher;
}