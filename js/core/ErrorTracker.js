/**
 * Error Tracking and Monitoring System
 * Provides comprehensive error tracking with Sentry-like functionality
 */

class ErrorTracker {
    constructor(config = {}) {
        this.config = {
            dsn: config.dsn || null, // Sentry DSN or similar service endpoint
            environment: config.environment || 'production',
            release: config.release || '1.0.0',
            userId: config.userId || null,
            enableConsoleCapture: config.enableConsoleCapture !== false,
            enableNetworkCapture: config.enableNetworkCapture !== false,
            maxBreadcrumbs: config.maxBreadcrumbs || 100,
            beforeSend: config.beforeSend || null,
            ...config
        };

        this.breadcrumbs = [];
        this.context = {};
        this.tags = {};
        this.user = {};
        this.isInitialized = false;

        this.init();
    }

    /**
     * Initialize error tracking
     */
    init() {
        if (this.isInitialized) return;

        // Set up global error handlers
        this.setupGlobalErrorHandlers();
        
        // Set up console capture
        if (this.config.enableConsoleCapture) {
            this.setupConsoleCapture();
        }

        // Set up network monitoring
        if (this.config.enableNetworkCapture) {
            this.setupNetworkCapture();
        }

        // Set up performance monitoring
        this.setupPerformanceMonitoring();

        this.isInitialized = true;
        this.addBreadcrumb('ErrorTracker initialized', 'info');
    }

    /**
     * Set up global error handlers
     */
    setupGlobalErrorHandlers() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            this.captureException(event.error || new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'javascript'
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureException(event.reason, {
                type: 'unhandledrejection'
            });
        });

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.captureMessage(`Resource failed to load: ${event.target.src || event.target.href}`, 'error', {
                    type: 'resource',
                    element: event.target.tagName,
                    source: event.target.src || event.target.href
                });
            }
        }, true);
    }

    /**
     * Set up console capture
     */
    setupConsoleCapture() {
        const originalConsole = { ...console };
        
        ['log', 'info', 'warn', 'error', 'debug'].forEach(level => {
            console[level] = (...args) => {
                // Call original console method
                originalConsole[level](...args);
                
                // Capture for monitoring
                if (level === 'error') {
                    this.captureMessage(args.join(' '), 'error', { source: 'console' });
                } else if (level === 'warn') {
                    this.addBreadcrumb(args.join(' '), 'warning');
                } else {
                    this.addBreadcrumb(args.join(' '), 'info');
                }
            };
        });
    }

    /**
     * Set up network monitoring
     */
    setupNetworkCapture() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = Date.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const duration = Date.now() - startTime;
                
                this.addBreadcrumb(`HTTP ${response.status} ${url}`, 'http', {
                    url,
                    status: response.status,
                    duration
                });
                
                if (!response.ok) {
                    this.captureMessage(`HTTP Error: ${response.status} ${url}`, 'error', {
                        type: 'http',
                        status: response.status,
                        url,
                        duration
                    });
                }
                
                return response;
            } catch (error) {
                const duration = Date.now() - startTime;
                this.captureException(error, {
                    type: 'http',
                    url,
                    duration
                });
                throw error;
            }
        };

        // Monitor XMLHttpRequest
        const originalXHR = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            this._startTime = Date.now();
            this._url = url;
            this._method = method;
            
            this.addEventListener('load', () => {
                const duration = Date.now() - this._startTime;
                window.errorTracker?.addBreadcrumb(`XHR ${this.status} ${method} ${url}`, 'http', {
                    method,
                    url,
                    status: this.status,
                    duration
                });
            });
            
            this.addEventListener('error', () => {
                const duration = Date.now() - this._startTime;
                window.errorTracker?.captureMessage(`XHR Error: ${method} ${url}`, 'error', {
                    type: 'xhr',
                    method,
                    url,
                    duration
                });
            });
            
            return originalXHR.apply(this, arguments);
        };
    }

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.captureMessage('Page Load Performance', 'info', {
                        type: 'performance',
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        firstPaint: this.getFirstPaint(),
                        firstContentfulPaint: this.getFirstContentfulPaint()
                    });
                }
            }, 0);
        });

        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) { // Tasks longer than 50ms
                            this.captureMessage('Long Task Detected', 'warning', {
                                type: 'performance',
                                duration: entry.duration,
                                startTime: entry.startTime
                            });
                        }
                    }
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // PerformanceObserver not supported
            }
        }
    }

    /**
     * Capture an exception
     */
    captureException(error, extra = {}) {
        const errorData = {
            message: error.message || 'Unknown error',
            stack: error.stack,
            type: error.name || 'Error',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            breadcrumbs: [...this.breadcrumbs],
            context: { ...this.context },
            tags: { ...this.tags },
            user: { ...this.user },
            extra: { ...extra },
            level: 'error'
        };

        this.sendToService(errorData);
        this.addBreadcrumb(`Error: ${error.message}`, 'error');
    }

    /**
     * Capture a message
     */
    captureMessage(message, level = 'info', extra = {}) {
        const messageData = {
            message,
            level,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            breadcrumbs: [...this.breadcrumbs],
            context: { ...this.context },
            tags: { ...this.tags },
            user: { ...this.user },
            extra: { ...extra }
        };

        if (level === 'error' || level === 'warning') {
            this.sendToService(messageData);
        }
        
        this.addBreadcrumb(message, level);
    }

    /**
     * Add breadcrumb
     */
    addBreadcrumb(message, level = 'info', data = {}) {
        const breadcrumb = {
            message,
            level,
            timestamp: new Date().toISOString(),
            data: { ...data }
        };

        this.breadcrumbs.push(breadcrumb);
        
        // Keep only the last N breadcrumbs
        if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
            this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
        }
    }

    /**
     * Set user context
     */
    setUser(user) {
        this.user = { ...user };
    }

    /**
     * Set tags
     */
    setTag(key, value) {
        this.tags[key] = value;
    }

    /**
     * Set context
     */
    setContext(key, value) {
        this.context[key] = value;
    }

    /**
     * Send data to monitoring service
     */
    async sendToService(data) {
        try {
            // Apply beforeSend filter if configured
            if (this.config.beforeSend) {
                data = this.config.beforeSend(data);
                if (!data) return; // Filtered out
            }

            // Store locally for offline scenarios
            this.storeLocally(data);

            // Send to external service if DSN is configured
            if (this.config.dsn) {
                await this.sendToExternalService(data);
            } else {
                // Fallback to console logging in development
                console.group(`🚨 ${data.level.toUpperCase()}: ${data.message}`);
                console.log('Data:', data);
                console.groupEnd();
            }
        } catch (error) {
            console.error('Failed to send error data:', error);
        }
    }

    /**
     * Send to external monitoring service (Sentry, etc.)
     */
    async sendToExternalService(data) {
        const payload = {
            ...data,
            environment: this.config.environment,
            release: this.config.release,
            platform: 'javascript'
        };

        await fetch(this.config.dsn, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
    }

    /**
     * Store error data locally for offline scenarios
     */
    storeLocally(data) {
        try {
            const stored = JSON.parse(localStorage.getItem('errorTracker_errors') || '[]');
            stored.push(data);
            
            // Keep only last 50 errors locally
            const trimmed = stored.slice(-50);
            localStorage.setItem('errorTracker_errors', JSON.stringify(trimmed));
        } catch (e) {
            // Storage failed, ignore
        }
    }

    /**
     * Get stored errors
     */
    getStoredErrors() {
        try {
            return JSON.parse(localStorage.getItem('errorTracker_errors') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * Clear stored errors
     */
    clearStoredErrors() {
        try {
            localStorage.removeItem('errorTracker_errors');
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Get performance metrics
     */
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    }

    /**
     * Manual error reporting for try-catch blocks
     */
    withErrorTracking(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.captureException(error, { context, args });
                throw error;
            }
        };
    }
}

// Initialize global error tracker
window.errorTracker = new ErrorTracker({
    environment: 'production',
    release: '1.0.0',
    enableConsoleCapture: true,
    enableNetworkCapture: true
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorTracker;
}