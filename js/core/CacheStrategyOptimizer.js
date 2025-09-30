/**
 * Cache Strategy Optimizer
 * Fine-tunes caching strategies based on usage patterns and test results
 * Requirements: 2.3, 2.6, 8.5
 */

class CacheStrategyOptimizer {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.usagePatterns = new Map();
        this.accessFrequency = new Map();
        this.cacheHitRates = new Map();
        this.optimizationHistory = [];
        
        this.strategies = {
            'cache-first': { priority: 1, description: 'Serve from cache, fallback to network' },
            'network-first': { priority: 2, description: 'Try network first, fallback to cache' },
            'stale-while-revalidate': { priority: 3, description: 'Serve stale content while updating' },
            'network-only': { priority: 4, description: 'Always fetch from network' },
            'cache-only': { priority: 5, description: 'Only serve from cache' }
        };
        
        this.dataTypes = {
            'ingredients': { volatility: 'low', importance: 'high', defaultStrategy: 'cache-first' },
            'menus': { volatility: 'low', importance: 'high', defaultStrategy: 'cache-first' },
            'sales': { volatility: 'high', importance: 'high', defaultStrategy: 'network-first' },
            'purchases': { volatility: 'medium', importance: 'high', defaultStrategy: 'stale-while-revalidate' },
            'reports': { volatility: 'medium', importance: 'medium', defaultStrategy: 'stale-while-revalidate' },
            'users': { volatility: 'low', importance: 'medium', defaultStrategy: 'cache-first' },
            'settings': { volatility: 'low', importance: 'low', defaultStrategy: 'cache-first' }
        };
    }

    /**
     * Initialize cache strategy optimizer
     */
    async initialize() {
        console.log('🚀 Initializing Cache Strategy Optimizer...');
        
        try {
            // Load historical usage patterns
            await this.loadUsagePatterns();
            
            // Analyze current cache performance
            await this.analyzeCachePerformance();
            
            // Set up usage tracking
            this.setupUsageTracking();
            
            console.log('✅ Cache Strategy Optimizer initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize cache optimizer:', error);
            return false;
        }
    }

    /**
     * Optimize cache strategies based on usage patterns
     */
    async optimizeStrategies() {
        console.log('⚡ Optimizing cache strategies...');
        
        const optimizations = {
            timestamp: new Date().toISOString(),
            changes: [],
            improvements: {},
            recommendations: []
        };
        
        try {
            // Analyze usage patterns for each data type
            for (const [dataType, config] of Object.entries(this.dataTypes)) {
                const pattern = this.usagePatterns.get(dataType);
                const frequency = this.accessFrequency.get(dataType) || 0;
                const hitRate = this.cacheHitRates.get(dataType) || 0;
                
                const currentStrategy = config.defaultStrategy;
                const recommendedStrategy = this.recommendStrategy(dataType, pattern, frequency, hitRate);
                
                if (currentStrategy !== recommendedStrategy) {
                    optimizations.changes.push({
                        dataType,
                        from: currentStrategy,
                        to: recommendedStrategy,
                        reason: this.getOptimizationReason(dataType, pattern, frequency, hitRate)
                    });
                    
                    // Apply the optimization
                    await this.applyCacheStrategy(dataType, recommendedStrategy);
                }
            }
            
            // Optimize cache sizes based on usage
            await this.optimizeCacheSizes();
            
            // Optimize cache TTL based on data volatility
            await this.optimizeCacheTTL();
            
            // Generate performance improvements report
            optimizations.improvements = await this.measureImprovements();
            optimizations.recommendations = this.generateRecommendations();
            
            // Store optimization history
            this.optimizationHistory.push(optimizations);
            
            console.log('✅ Cache strategies optimized');
            console.log(`📊 Applied ${optimizations.changes.length} strategy changes`);
            
            return optimizations;
            
        } catch (error) {
            console.error('❌ Failed to optimize cache strategies:', error);
            throw error;
        }
    }

    /**
     * Load historical usage patterns from storage
     */
    async loadUsagePatterns() {
        try {
            const storedPatterns = localStorage.getItem('cache-usage-patterns');
            if (storedPatterns) {
                const patterns = JSON.parse(storedPatterns);
                Object.entries(patterns).forEach(([key, value]) => {
                    this.usagePatterns.set(key, value);
                });
            }
            
            const storedFrequency = localStorage.getItem('cache-access-frequency');
            if (storedFrequency) {
                const frequency = JSON.parse(storedFrequency);
                Object.entries(frequency).forEach(([key, value]) => {
                    this.accessFrequency.set(key, value);
                });
            }
            
            console.log(`📊 Loaded usage patterns for ${this.usagePatterns.size} data types`);
            
        } catch (error) {
            console.warn('Failed to load usage patterns:', error);
        }
    }

    /**
     * Analyze current cache performance
     */
    async analyzeCachePerformance() {
        if (!this.cacheManager) return;
        
        try {
            const stats = await this.cacheManager.getStats();
            
            Object.entries(stats).forEach(([dataType, stat]) => {
                if (stat.hits && stat.requests) {
                    const hitRate = (stat.hits / stat.requests) * 100;
                    this.cacheHitRates.set(dataType, hitRate);
                }
            });
            
            console.log(`📊 Analyzed cache performance for ${this.cacheHitRates.size} data types`);
            
        } catch (error) {
            console.warn('Failed to analyze cache performance:', error);
        }
    }

    /**
     * Set up usage tracking for cache optimization
     */
    setupUsageTracking() {
        if (!this.cacheManager) return;
        
        // Track cache access patterns
        const originalGet = this.cacheManager.get.bind(this.cacheManager);
        this.cacheManager.get = async (key, options = {}) => {
            const dataType = this.extractDataType(key);
            this.trackAccess(dataType, 'get');
            
            const startTime = performance.now();
            const result = await originalGet(key, options);
            const endTime = performance.now();
            
            this.trackPerformance(dataType, endTime - startTime, !!result);
            
            return result;
        };
        
        // Track cache set patterns
        const originalSet = this.cacheManager.set.bind(this.cacheManager);
        this.cacheManager.set = async (key, value, options = {}) => {
            const dataType = this.extractDataType(key);
            this.trackAccess(dataType, 'set');
            
            return await originalSet(key, value, options);
        };
        
        // Periodically save usage patterns
        setInterval(() => {
            this.saveUsagePatterns();
        }, 60000); // Save every minute
        
        console.log('✅ Cache usage tracking enabled');
    }

    /**
     * Track cache access for optimization
     */
    trackAccess(dataType, operation) {
        if (!dataType) return;
        
        // Update access frequency
        const currentFreq = this.accessFrequency.get(dataType) || 0;
        this.accessFrequency.set(dataType, currentFreq + 1);
        
        // Update usage patterns
        const pattern = this.usagePatterns.get(dataType) || {
            totalAccess: 0,
            getOperations: 0,
            setOperations: 0,
            lastAccess: null,
            accessTimes: []
        };
        
        pattern.totalAccess++;
        pattern[`${operation}Operations`]++;
        pattern.lastAccess = Date.now();
        pattern.accessTimes.push(Date.now());
        
        // Keep only recent access times (last 1000)
        if (pattern.accessTimes.length > 1000) {
            pattern.accessTimes = pattern.accessTimes.slice(-1000);
        }
        
        this.usagePatterns.set(dataType, pattern);
    }

    /**
     * Track cache performance metrics
     */
    trackPerformance(dataType, responseTime, cacheHit) {
        if (!dataType) return;
        
        const pattern = this.usagePatterns.get(dataType) || {};
        
        if (!pattern.performance) {
            pattern.performance = {
                averageResponseTime: 0,
                hitRate: 0,
                totalRequests: 0,
                totalHits: 0
            };
        }
        
        pattern.performance.totalRequests++;
        if (cacheHit) {
            pattern.performance.totalHits++;
        }
        
        // Update average response time
        const perf = pattern.performance;
        perf.averageResponseTime = ((perf.averageResponseTime * (perf.totalRequests - 1)) + responseTime) / perf.totalRequests;
        perf.hitRate = (perf.totalHits / perf.totalRequests) * 100;
        
        this.usagePatterns.set(dataType, pattern);
    }

    /**
     * Extract data type from cache key
     */
    extractDataType(key) {
        if (typeof key !== 'string') return null;
        
        const lowerKey = key.toLowerCase();
        
        for (const dataType of Object.keys(this.dataTypes)) {
            if (lowerKey.includes(dataType)) {
                return dataType;
            }
        }
        
        // Try to extract from key patterns
        if (lowerKey.includes('ingredient')) return 'ingredients';
        if (lowerKey.includes('menu')) return 'menus';
        if (lowerKey.includes('sale')) return 'sales';
        if (lowerKey.includes('purchase')) return 'purchases';
        if (lowerKey.includes('report')) return 'reports';
        if (lowerKey.includes('user')) return 'users';
        if (lowerKey.includes('setting')) return 'settings';
        
        return 'unknown';
    }

    /**
     * Recommend optimal cache strategy based on patterns
     */
    recommendStrategy(dataType, pattern, frequency, hitRate) {
        const config = this.dataTypes[dataType];
        if (!config || !pattern) return config?.defaultStrategy || 'cache-first';
        
        const { volatility, importance } = config;
        const accessFreq = frequency || 0;
        const cacheHitRate = hitRate || 0;
        
        // High frequency, high hit rate -> cache-first
        if (accessFreq > 100 && cacheHitRate > 80) {
            return 'cache-first';
        }
        
        // High volatility, high importance -> network-first
        if (volatility === 'high' && importance === 'high') {
            return 'network-first';
        }
        
        // Medium volatility, good hit rate -> stale-while-revalidate
        if (volatility === 'medium' && cacheHitRate > 60) {
            return 'stale-while-revalidate';
        }
        
        // Low frequency, low hit rate -> network-first
        if (accessFreq < 10 && cacheHitRate < 30) {
            return 'network-first';
        }
        
        // Low volatility, high frequency -> cache-first
        if (volatility === 'low' && accessFreq > 50) {
            return 'cache-first';
        }
        
        return config.defaultStrategy;
    }

    /**
     * Get optimization reason for strategy change
     */
    getOptimizationReason(dataType, pattern, frequency, hitRate) {
        const reasons = [];
        
        if (frequency > 100) {
            reasons.push('high access frequency');
        }
        
        if (hitRate > 80) {
            reasons.push('high cache hit rate');
        } else if (hitRate < 30) {
            reasons.push('low cache hit rate');
        }
        
        if (pattern?.performance?.averageResponseTime > 100) {
            reasons.push('slow response time');
        }
        
        const config = this.dataTypes[dataType];
        if (config?.volatility === 'high') {
            reasons.push('high data volatility');
        }
        
        return reasons.join(', ') || 'optimization based on usage patterns';
    }

    /**
     * Apply cache strategy to data type
     */
    async applyCacheStrategy(dataType, strategy) {
        if (!this.cacheManager || !this.cacheManager.setStrategy) {
            console.warn('Cache manager does not support strategy setting');
            return;
        }
        
        try {
            await this.cacheManager.setStrategy(dataType, strategy);
            
            // Update data type configuration
            if (this.dataTypes[dataType]) {
                this.dataTypes[dataType].defaultStrategy = strategy;
            }
            
            console.log(`✅ Applied ${strategy} strategy to ${dataType}`);
            
        } catch (error) {
            console.error(`Failed to apply strategy to ${dataType}:`, error);
        }
    }

    /**
     * Optimize cache sizes based on usage patterns
     */
    async optimizeCacheSizes() {
        const sizeOptimizations = {};
        
        for (const [dataType, pattern] of this.usagePatterns.entries()) {
            const frequency = this.accessFrequency.get(dataType) || 0;
            const config = this.dataTypes[dataType];
            
            if (!config) continue;
            
            // Calculate optimal cache size based on frequency and importance
            let optimalSize;
            
            if (frequency > 1000 && config.importance === 'high') {
                optimalSize = 'large'; // 10MB
            } else if (frequency > 100 && config.importance === 'medium') {
                optimalSize = 'medium'; // 5MB
            } else {
                optimalSize = 'small'; // 1MB
            }
            
            sizeOptimizations[dataType] = optimalSize;
            
            // Apply size optimization if cache manager supports it
            if (this.cacheManager.setCacheSize) {
                await this.cacheManager.setCacheSize(dataType, optimalSize);
            }
        }
        
        console.log('✅ Cache sizes optimized:', sizeOptimizations);
        return sizeOptimizations;
    }

    /**
     * Optimize cache TTL based on data volatility
     */
    async optimizeCacheTTL() {
        const ttlOptimizations = {};
        
        for (const [dataType, config] of Object.entries(this.dataTypes)) {
            const pattern = this.usagePatterns.get(dataType);
            
            let optimalTTL;
            
            switch (config.volatility) {
                case 'high':
                    optimalTTL = 5 * 60 * 1000; // 5 minutes
                    break;
                case 'medium':
                    optimalTTL = 30 * 60 * 1000; // 30 minutes
                    break;
                case 'low':
                    optimalTTL = 24 * 60 * 60 * 1000; // 24 hours
                    break;
                default:
                    optimalTTL = 60 * 60 * 1000; // 1 hour
            }
            
            // Adjust based on access patterns
            if (pattern && pattern.performance) {
                const hitRate = pattern.performance.hitRate;
                
                if (hitRate > 90) {
                    // High hit rate, can extend TTL
                    optimalTTL *= 1.5;
                } else if (hitRate < 50) {
                    // Low hit rate, reduce TTL
                    optimalTTL *= 0.5;
                }
            }
            
            ttlOptimizations[dataType] = optimalTTL;
            
            // Apply TTL optimization if cache manager supports it
            if (this.cacheManager.setTTL) {
                await this.cacheManager.setTTL(dataType, optimalTTL);
            }
        }
        
        console.log('✅ Cache TTL optimized:', ttlOptimizations);
        return ttlOptimizations;
    }

    /**
     * Measure performance improvements after optimization
     */
    async measureImprovements() {
        const improvements = {
            hitRateImprovement: {},
            responseTimeImprovement: {},
            overallImprovement: 0
        };
        
        // Wait a bit for optimizations to take effect
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Re-analyze cache performance
        await this.analyzeCachePerformance();
        
        // Compare with previous performance
        for (const [dataType, currentHitRate] of this.cacheHitRates.entries()) {
            const pattern = this.usagePatterns.get(dataType);
            
            if (pattern?.performance) {
                const previousHitRate = pattern.performance.hitRate;
                const hitRateImprovement = currentHitRate - previousHitRate;
                
                improvements.hitRateImprovement[dataType] = {
                    before: previousHitRate,
                    after: currentHitRate,
                    improvement: hitRateImprovement
                };
            }
        }
        
        // Calculate overall improvement
        const hitRateImprovements = Object.values(improvements.hitRateImprovement)
            .map(imp => imp.improvement)
            .filter(imp => !isNaN(imp));
        
        if (hitRateImprovements.length > 0) {
            improvements.overallImprovement = hitRateImprovements.reduce((a, b) => a + b, 0) / hitRateImprovements.length;
        }
        
        return improvements;
    }

    /**
     * Generate optimization recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        for (const [dataType, pattern] of this.usagePatterns.entries()) {
            const frequency = this.accessFrequency.get(dataType) || 0;
            const hitRate = this.cacheHitRates.get(dataType) || 0;
            const config = this.dataTypes[dataType];
            
            if (!config) continue;
            
            // Low hit rate recommendations
            if (hitRate < 50) {
                recommendations.push({
                    type: 'cache-strategy',
                    priority: 'high',
                    dataType,
                    issue: `Low cache hit rate (${hitRate.toFixed(1)}%) for ${dataType}`,
                    recommendation: 'Consider switching to network-first strategy or reviewing cache invalidation logic'
                });
            }
            
            // High frequency, low cache utilization
            if (frequency > 100 && hitRate < 70) {
                recommendations.push({
                    type: 'cache-optimization',
                    priority: 'medium',
                    dataType,
                    issue: `High access frequency but low cache utilization for ${dataType}`,
                    recommendation: 'Increase cache size or extend TTL for better performance'
                });
            }
            
            // Performance recommendations
            if (pattern.performance?.averageResponseTime > 200) {
                recommendations.push({
                    type: 'performance',
                    priority: 'medium',
                    dataType,
                    issue: `Slow average response time (${pattern.performance.averageResponseTime.toFixed(1)}ms) for ${dataType}`,
                    recommendation: 'Consider preloading frequently accessed data or optimizing cache strategy'
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Save usage patterns to storage
     */
    saveUsagePatterns() {
        try {
            const patternsObj = {};
            this.usagePatterns.forEach((value, key) => {
                patternsObj[key] = value;
            });
            localStorage.setItem('cache-usage-patterns', JSON.stringify(patternsObj));
            
            const frequencyObj = {};
            this.accessFrequency.forEach((value, key) => {
                frequencyObj[key] = value;
            });
            localStorage.setItem('cache-access-frequency', JSON.stringify(frequencyObj));
            
        } catch (error) {
            console.warn('Failed to save usage patterns:', error);
        }
    }

    /**
     * Get optimization report
     */
    getOptimizationReport() {
        return {
            timestamp: new Date().toISOString(),
            usagePatterns: Object.fromEntries(this.usagePatterns),
            accessFrequency: Object.fromEntries(this.accessFrequency),
            cacheHitRates: Object.fromEntries(this.cacheHitRates),
            currentStrategies: Object.fromEntries(
                Object.entries(this.dataTypes).map(([type, config]) => [type, config.defaultStrategy])
            ),
            optimizationHistory: this.optimizationHistory,
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Reset optimization data (for testing)
     */
    resetOptimizationData() {
        this.usagePatterns.clear();
        this.accessFrequency.clear();
        this.cacheHitRates.clear();
        this.optimizationHistory = [];
        
        localStorage.removeItem('cache-usage-patterns');
        localStorage.removeItem('cache-access-frequency');
        
        console.log('✅ Cache optimization data reset');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheStrategyOptimizer;
} else if (typeof window !== 'undefined') {
    window.CacheStrategyOptimizer = CacheStrategyOptimizer;
}