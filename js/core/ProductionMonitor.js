/**
 * Production Performance and Health Monitoring System
 * Real-time monitoring dashboard for production environment
 */

class ProductionMonitor {
    constructor(config = {}) {
        this.config = {
            updateInterval: config.updateInterval || 30000, // 30 seconds
            metricsRetention: config.metricsRetention || 24 * 60 * 60 * 1000, // 24 hours
            alertThresholds: {
                errorRate: config.errorRate || 0.05, // 5%
                responseTime: config.responseTime || 2000, // 2 seconds
                memoryUsage: config.memoryUsage || 100 * 1024 * 1024, // 100MB
                ...config.alertThresholds
            },
            endpoints: config.endpoints || [],
            ...config
        };

        this.metrics = {
            performance: [],
            errors: [],
            network: [],
            user: [],
            system: []
        };

        this.alerts = [];
        this.isMonitoring = false;
        this.monitoringInterval = null;

        this.init();
    }

    /**
     * Initialize monitoring system
     */
    init() {
        this.setupPerformanceObserver();
        this.setupNetworkMonitoring();
        this.setupUserActivityMonitoring();
        this.setupSystemMonitoring();
        this.startMonitoring();
    }

    /**
     * Start continuous monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.checkAlerts();
            this.cleanupOldMetrics();
        }, this.config.updateInterval);

        console.log('🔍 Production monitoring started');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        console.log('⏹️ Production monitoring stopped');
    }

    /**
     * Set up performance observer
     */
    setupPerformanceObserver() {
        if (!('PerformanceObserver' in window)) return;

        try {
            // Monitor navigation timing
            const navObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric('performance', {
                        type: 'navigation',
                        loadTime: entry.loadEventEnd - entry.loadEventStart,
                        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                        firstByte: entry.responseStart - entry.requestStart,
                        timestamp: Date.now()
                    });
                }
            });
            navObserver.observe({ entryTypes: ['navigation'] });

            // Monitor paint timing
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric('performance', {
                        type: 'paint',
                        name: entry.name,
                        startTime: entry.startTime,
                        timestamp: Date.now()
                    });
                }
            });
            paintObserver.observe({ entryTypes: ['paint'] });

            // Monitor long tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric('performance', {
                        type: 'longtask',
                        duration: entry.duration,
                        startTime: entry.startTime,
                        timestamp: Date.now()
                    });

                    // Alert for very long tasks
                    if (entry.duration > 100) {
                        this.createAlert('performance', `Long task detected: ${entry.duration}ms`, 'warning');
                    }
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });

        } catch (error) {
            console.warn('Performance observer setup failed:', error);
        }
    }

    /**
     * Set up network monitoring
     */
    setupNetworkMonitoring() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];

            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - startTime;

                this.recordMetric('network', {
                    type: 'fetch',
                    url,
                    status: response.status,
                    duration,
                    success: response.ok,
                    timestamp: Date.now()
                });

                // Alert for slow requests
                if (duration > this.config.alertThresholds.responseTime) {
                    this.createAlert('network', `Slow request: ${url} (${duration}ms)`, 'warning');
                }

                // Alert for error responses
                if (!response.ok) {
                    this.createAlert('network', `HTTP Error: ${response.status} ${url}`, 'error');
                }

                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                
                this.recordMetric('network', {
                    type: 'fetch',
                    url,
                    duration,
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });

                this.createAlert('network', `Network error: ${url} - ${error.message}`, 'error');
                throw error;
            }
        };
    }

    /**
     * Set up user activity monitoring
     */
    setupUserActivityMonitoring() {
        let sessionStart = Date.now();
        let lastActivity = Date.now();
        let pageViews = 0;
        let interactions = 0;

        // Track page views
        pageViews++;
        this.recordMetric('user', {
            type: 'pageview',
            url: window.location.href,
            timestamp: Date.now()
        });

        // Track user interactions
        ['click', 'touchstart', 'keydown'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                lastActivity = Date.now();
                interactions++;
            }, { passive: true });
        });

        // Track session metrics periodically
        setInterval(() => {
            const sessionDuration = Date.now() - sessionStart;
            const timeSinceLastActivity = Date.now() - lastActivity;

            this.recordMetric('user', {
                type: 'session',
                duration: sessionDuration,
                interactions,
                timeSinceLastActivity,
                timestamp: Date.now()
            });
        }, 60000); // Every minute
    }

    /**
     * Set up system monitoring
     */
    setupSystemMonitoring() {
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = performance.memory;
                this.recordMetric('system', {
                    type: 'memory',
                    used: memInfo.usedJSHeapSize,
                    total: memInfo.totalJSHeapSize,
                    limit: memInfo.jsHeapSizeLimit,
                    timestamp: Date.now()
                });

                // Alert for high memory usage
                if (memInfo.usedJSHeapSize > this.config.alertThresholds.memoryUsage) {
                    this.createAlert('system', `High memory usage: ${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)}MB`, 'warning');
                }
            }, 30000); // Every 30 seconds
        }

        // Monitor connection status
        window.addEventListener('online', () => {
            this.recordMetric('system', {
                type: 'connection',
                status: 'online',
                timestamp: Date.now()
            });
        });

        window.addEventListener('offline', () => {
            this.recordMetric('system', {
                type: 'connection',
                status: 'offline',
                timestamp: Date.now()
            });
            this.createAlert('system', 'Connection lost - working offline', 'warning');
        });
    }

    /**
     * Collect current metrics
     */
    collectMetrics() {
        const now = Date.now();
        
        // Collect current performance metrics
        const perfEntries = performance.getEntriesByType('measure');
        const recentEntries = perfEntries.filter(entry => 
            now - entry.startTime < this.config.updateInterval
        );

        // Calculate error rate
        const recentErrors = this.metrics.errors.filter(error => 
            now - error.timestamp < this.config.updateInterval
        );
        const totalRequests = this.metrics.network.filter(req => 
            now - req.timestamp < this.config.updateInterval
        ).length;
        const errorRate = totalRequests > 0 ? recentErrors.length / totalRequests : 0;

        // Record aggregated metrics
        this.recordMetric('system', {
            type: 'health',
            errorRate,
            totalRequests,
            totalErrors: recentErrors.length,
            timestamp: now
        });
    }

    /**
     * Record a metric
     */
    recordMetric(category, data) {
        if (!this.metrics[category]) {
            this.metrics[category] = [];
        }

        this.metrics[category].push({
            ...data,
            id: this.generateId(),
            timestamp: data.timestamp || Date.now()
        });

        // Emit event for real-time updates
        this.emit('metric', { category, data });
    }

    /**
     * Create an alert
     */
    createAlert(category, message, severity = 'info') {
        const alert = {
            id: this.generateId(),
            category,
            message,
            severity,
            timestamp: Date.now(),
            acknowledged: false
        };

        this.alerts.push(alert);
        
        // Emit alert event
        this.emit('alert', alert);

        // Log to console based on severity
        const logMethod = severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'info';
        console[logMethod](`🚨 [${category.toUpperCase()}] ${message}`);

        return alert;
    }

    /**
     * Check alert conditions
     */
    checkAlerts() {
        const now = Date.now();
        const timeWindow = 5 * 60 * 1000; // 5 minutes

        // Check error rate
        const recentErrors = this.metrics.errors.filter(error => 
            now - error.timestamp < timeWindow
        );
        const recentRequests = this.metrics.network.filter(req => 
            now - req.timestamp < timeWindow
        );
        const errorRate = recentRequests.length > 0 ? recentErrors.length / recentRequests.length : 0;

        if (errorRate > this.config.alertThresholds.errorRate) {
            this.createAlert('system', `High error rate: ${(errorRate * 100).toFixed(1)}%`, 'error');
        }

        // Check response times
        const slowRequests = this.metrics.network.filter(req => 
            now - req.timestamp < timeWindow && 
            req.duration > this.config.alertThresholds.responseTime
        );

        if (slowRequests.length > 5) {
            this.createAlert('performance', `Multiple slow requests detected: ${slowRequests.length}`, 'warning');
        }
    }

    /**
     * Clean up old metrics
     */
    cleanupOldMetrics() {
        const cutoff = Date.now() - this.config.metricsRetention;

        Object.keys(this.metrics).forEach(category => {
            this.metrics[category] = this.metrics[category].filter(
                metric => metric.timestamp > cutoff
            );
        });

        // Clean up old alerts
        this.alerts = this.alerts.filter(alert => 
            alert.timestamp > cutoff || !alert.acknowledged
        );
    }

    /**
     * Get dashboard data
     */
    getDashboardData() {
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);

        return {
            summary: this.getSummaryMetrics(),
            performance: this.getPerformanceMetrics(hourAgo),
            network: this.getNetworkMetrics(hourAgo),
            errors: this.getErrorMetrics(hourAgo),
            alerts: this.getActiveAlerts(),
            system: this.getSystemMetrics(hourAgo)
        };
    }

    /**
     * Get summary metrics
     */
    getSummaryMetrics() {
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);

        const recentRequests = this.metrics.network.filter(req => req.timestamp > hourAgo);
        const recentErrors = this.metrics.errors.filter(error => error.timestamp > hourAgo);
        const successfulRequests = recentRequests.filter(req => req.success);

        return {
            totalRequests: recentRequests.length,
            successfulRequests: successfulRequests.length,
            errorRate: recentRequests.length > 0 ? (recentErrors.length / recentRequests.length) * 100 : 0,
            averageResponseTime: this.calculateAverageResponseTime(recentRequests),
            uptime: this.calculateUptime(),
            activeAlerts: this.alerts.filter(alert => !alert.acknowledged).length
        };
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics(since) {
        const perfMetrics = this.metrics.performance.filter(m => m.timestamp > since);
        
        return {
            loadTimes: perfMetrics.filter(m => m.type === 'navigation').map(m => m.loadTime),
            paintTimes: perfMetrics.filter(m => m.type === 'paint'),
            longTasks: perfMetrics.filter(m => m.type === 'longtask').length
        };
    }

    /**
     * Get network metrics
     */
    getNetworkMetrics(since) {
        const networkMetrics = this.metrics.network.filter(m => m.timestamp > since);
        
        return {
            requests: networkMetrics.length,
            successful: networkMetrics.filter(m => m.success).length,
            failed: networkMetrics.filter(m => !m.success).length,
            averageResponseTime: this.calculateAverageResponseTime(networkMetrics),
            slowRequests: networkMetrics.filter(m => m.duration > this.config.alertThresholds.responseTime).length
        };
    }

    /**
     * Get error metrics
     */
    getErrorMetrics(since) {
        return this.metrics.errors.filter(error => error.timestamp > since);
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.alerts.filter(alert => !alert.acknowledged)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get system metrics
     */
    getSystemMetrics(since) {
        const systemMetrics = this.metrics.system.filter(m => m.timestamp > since);
        const memoryMetrics = systemMetrics.filter(m => m.type === 'memory');
        
        return {
            memoryUsage: memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1] : null,
            connectionStatus: navigator.onLine ? 'online' : 'offline'
        };
    }

    /**
     * Helper methods
     */
    calculateAverageResponseTime(requests) {
        if (requests.length === 0) return 0;
        const total = requests.reduce((sum, req) => sum + (req.duration || 0), 0);
        return Math.round(total / requests.length);
    }

    calculateUptime() {
        // Simple uptime calculation based on when monitoring started
        return Date.now() - (this.startTime || Date.now());
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Simple event emitter
     */
    emit(event, data) {
        if (this.listeners && this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    on(event, callback) {
        if (!this.listeners) this.listeners = {};
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = Date.now();
        }
    }

    /**
     * Export metrics for external analysis
     */
    exportMetrics(format = 'json') {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            alerts: this.alerts,
            config: this.config
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            // Convert to CSV format for spreadsheet analysis
            return this.convertToCSV(data);
        }

        return data;
    }

    convertToCSV(data) {
        // Simple CSV conversion for metrics
        let csv = 'Category,Type,Timestamp,Value\n';
        
        Object.keys(data.metrics).forEach(category => {
            data.metrics[category].forEach(metric => {
                csv += `${category},${metric.type},${new Date(metric.timestamp).toISOString()},${JSON.stringify(metric)}\n`;
            });
        });

        return csv;
    }
}

// Initialize production monitor
window.productionMonitor = new ProductionMonitor({
    updateInterval: 30000,
    alertThresholds: {
        errorRate: 0.05,
        responseTime: 2000,
        memoryUsage: 100 * 1024 * 1024
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionMonitor;
}