/**
 * Test Configuration for POS System
 * Centralized configuration for all testing parameters and thresholds
 * Requirements: 2.1, 2.2, 2.4
 */

const TestConfig = {
    // Performance thresholds based on requirements
    performance: {
        // Requirement 2.1: Initial load within 2 seconds on 3G
        initialLoad: {
            target: 2000, // 2 seconds
            warning: 1500, // 1.5 seconds
            critical: 3000 // 3 seconds
        },
        
        // Requirement 2.2: Data operations under 500ms
        dataOperations: {
            target: 500, // 500ms
            warning: 300, // 300ms
            critical: 1000 // 1 second
        },
        
        // Cache access should be instant
        cacheAccess: {
            target: 50, // 50ms
            warning: 25, // 25ms
            critical: 100 // 100ms
        },
        
        // Navigation transitions should be instant
        navigationTransition: {
            target: 100, // 100ms
            warning: 50, // 50ms
            critical: 200 // 200ms
        },
        
        // Core Web Vitals thresholds
        coreWebVitals: {
            LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
            FID: { good: 100, needsImprovement: 300 }, // First Input Delay
            CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
            FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
            TTI: { good: 3800, needsImprovement: 7300 } // Time to Interactive
        }
    },

    // Device profiles for cross-device testing
    devices: [
        {
            name: 'Mobile Low-end',
            viewport: { width: 360, height: 640 },
            connection: '3g',
            memory: '1GB',
            cpu: 'slow',
            touchEnabled: true
        },
        {
            name: 'Mobile High-end',
            viewport: { width: 414, height: 896 },
            connection: '4g',
            memory: '4GB',
            cpu: 'fast',
            touchEnabled: true
        },
        {
            name: 'Tablet',
            viewport: { width: 768, height: 1024 },
            connection: 'wifi',
            memory: '4GB',
            cpu: 'medium',
            touchEnabled: true
        },
        {
            name: 'Desktop',
            viewport: { width: 1920, height: 1080 },
            connection: 'wifi',
            memory: '8GB',
            cpu: 'fast',
            touchEnabled: false
        }
    ],

    // Network conditions for testing
    networkConditions: {
        'wifi': { latency: 10, downloadSpeed: 50000, uploadSpeed: 10000 },
        '4g': { latency: 50, downloadSpeed: 10000, uploadSpeed: 2000 },
        '3g': { latency: 200, downloadSpeed: 1500, uploadSpeed: 500 },
        'slow-3g': { latency: 500, downloadSpeed: 500, uploadSpeed: 250 },
        'offline': { latency: 0, downloadSpeed: 0, uploadSpeed: 0 }
    },

    // User acceptance testing scenarios
    userScenarios: [
        {
            name: 'Add Purchase',
            description: 'User adds a new ingredient purchase',
            maxSteps: 3,
            maxTime: 30000, // 30 seconds
            steps: [
                'Navigate to purchase screen',
                'Select ingredient',
                'Enter details and save'
            ]
        },
        {
            name: 'Record Sale',
            description: 'User records a menu item sale',
            maxSteps: 3,
            maxTime: 20000, // 20 seconds
            steps: [
                'Navigate to sale screen',
                'Select menu item',
                'Confirm sale'
            ]
        },
        {
            name: 'Search Ingredient',
            description: 'User searches for an ingredient',
            maxSteps: 2,
            maxTime: 10000, // 10 seconds
            steps: [
                'Enter search query',
                'View results'
            ]
        },
        {
            name: 'Generate Report',
            description: 'User generates a business report',
            maxSteps: 4,
            maxTime: 60000, // 60 seconds
            steps: [
                'Navigate to reports',
                'Select date range',
                'Select report type',
                'Generate report'
            ]
        }
    ],

    // Accessibility testing configuration
    accessibility: {
        // WCAG 2.1 compliance levels
        wcagLevel: 'AA',
        
        // Color contrast ratios
        colorContrast: {
            normal: 4.5, // WCAG AA for normal text
            large: 3.0   // WCAG AA for large text
        },
        
        // Touch target sizes (44px minimum for mobile)
        touchTargets: {
            minimum: 44, // pixels
            recommended: 48 // pixels
        },
        
        // Keyboard navigation requirements
        keyboardNavigation: {
            tabOrder: true,
            focusVisible: true,
            noKeyboardTraps: true,
            skipLinks: true
        },
        
        // Screen reader requirements
        screenReader: {
            altText: true,
            ariaLabels: true,
            headingStructure: true,
            landmarks: true
        }
    },

    // Load testing configuration
    loadTesting: {
        // Concurrent user simulation
        concurrentUsers: [1, 5, 10, 20, 50],
        
        // Data volume testing
        dataVolumes: [100, 500, 1000, 5000, 10000],
        
        // Memory usage thresholds
        memoryUsage: {
            warning: 50 * 1024 * 1024, // 50MB
            critical: 100 * 1024 * 1024 // 100MB
        },
        
        // Network stress testing
        networkStress: {
            requestCount: 50,
            concurrentRequests: 10,
            successRateThreshold: 0.95 // 95% success rate
        }
    },

    // Test data configuration
    testData: {
        // Mock data sizes
        ingredients: 50,
        menus: 20,
        purchases: 100,
        sales: 200,
        
        // Search test queries
        searchQueries: [
            'กุ้ง', 'ข้าว', 'พริก', 'น้ำ', 'ผัก',
            'หมู', 'ไก่', 'ปลา', 'เนื้อ', 'ไข่'
        ],
        
        // Test user data
        testUsers: [
            { role: 'admin', permissions: ['all'] },
            { role: 'manager', permissions: ['read', 'write'] },
            { role: 'staff', permissions: ['read'] }
        ]
    },

    // Reporting configuration
    reporting: {
        // Score thresholds for overall rating
        scoreThresholds: {
            excellent: 90,
            good: 75,
            fair: 60,
            poor: 0
        },
        
        // Report formats
        formats: ['html', 'json', 'csv'],
        
        // Historical data retention
        historyRetention: 30, // days
        
        // Comparison metrics
        comparisonMetrics: [
            'overallScore',
            'performanceScore',
            'accessibilityScore',
            'testCount',
            'executionTime'
        ]
    },

    // Test environment configuration
    environment: {
        // Test URLs for different environments
        urls: {
            development: 'http://localhost:3000',
            staging: 'https://staging.pos-system.com',
            production: 'https://pos-system.com'
        },
        
        // Browser configurations
        browsers: [
            { name: 'Chrome', version: 'latest' },
            { name: 'Firefox', version: 'latest' },
            { name: 'Safari', version: 'latest' },
            { name: 'Edge', version: 'latest' }
        ],
        
        // Test timeouts
        timeouts: {
            pageLoad: 30000, // 30 seconds
            elementWait: 10000, // 10 seconds
            testSuite: 600000 // 10 minutes
        }
    },

    // Integration configuration
    integration: {
        // External services
        services: {
            lighthouse: {
                enabled: true,
                categories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa']
            },
            
            webPageTest: {
                enabled: false,
                apiKey: null
            },
            
            browserStack: {
                enabled: false,
                username: null,
                accessKey: null
            }
        },
        
        // CI/CD integration
        cicd: {
            failOnScore: 70, // Fail build if overall score below 70%
            failOnCritical: true, // Fail build on critical issues
            generateArtifacts: true // Generate test artifacts
        }
    },

    // Monitoring configuration
    monitoring: {
        // Real-time monitoring
        realTime: {
            enabled: true,
            interval: 60000, // 1 minute
            metrics: ['performance', 'errors', 'usage']
        },
        
        // Alerting thresholds
        alerts: {
            performanceDegradation: 20, // 20% degradation
            errorRateIncrease: 5, // 5% error rate increase
            availabilityDrop: 99 // Below 99% availability
        },
        
        // Data retention
        dataRetention: {
            realTime: 24, // hours
            daily: 30, // days
            weekly: 12, // weeks
            monthly: 12 // months
        }
    },

    // Feature flags for testing
    features: {
        performanceTesting: true,
        accessibilityTesting: true,
        crossDeviceTesting: true,
        loadTesting: true,
        userAcceptanceTesting: true,
        lighthouseAudit: true,
        visualRegression: false,
        securityTesting: false
    },

    // Utility functions
    utils: {
        /**
         * Get performance threshold for a metric
         */
        getPerformanceThreshold(metric, level = 'target') {
            return this.performance[metric] ? this.performance[metric][level] : null;
        },

        /**
         * Get device profile by name
         */
        getDeviceProfile(name) {
            return this.devices.find(device => device.name === name);
        },

        /**
         * Get network condition by type
         */
        getNetworkCondition(type) {
            return this.networkConditions[type];
        },

        /**
         * Get user scenario by name
         */
        getUserScenario(name) {
            return this.userScenarios.find(scenario => scenario.name === name);
        },

        /**
         * Calculate score rating
         */
        getScoreRating(score) {
            const thresholds = this.reporting.scoreThresholds;
            if (score >= thresholds.excellent) return 'excellent';
            if (score >= thresholds.good) return 'good';
            if (score >= thresholds.fair) return 'fair';
            return 'poor';
        },

        /**
         * Check if feature is enabled
         */
        isFeatureEnabled(feature) {
            return this.features[feature] === true;
        },

        /**
         * Get environment URL
         */
        getEnvironmentUrl(env = 'development') {
            return this.environment.urls[env] || this.environment.urls.development;
        }
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestConfig;
} else if (typeof window !== 'undefined') {
    window.TestConfig = TestConfig;
}