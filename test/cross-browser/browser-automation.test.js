/**
 * Cross-Browser Testing Automation
 * Requirements: 2.1, 2.2 - Cross-browser compatibility and performance testing
 */

class CrossBrowserTester {
    constructor() {
        this.supportedBrowsers = [
            {
                name: 'Chrome',
                versions: ['latest', 'latest-1', 'latest-2'],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                features: ['webgl', 'serviceworker', 'indexeddb', 'websockets']
            },
            {
                name: 'Firefox',
                versions: ['latest', 'latest-1', 'latest-2'],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
                features: ['webgl', 'serviceworker', 'indexeddb', 'websockets']
            },
            {
                name: 'Safari',
                versions: ['latest', 'latest-1'],
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
                features: ['webgl', 'serviceworker', 'indexeddb', 'websockets']
            },
            {
                name: 'Edge',
                versions: ['latest', 'latest-1'],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
                features: ['webgl', 'serviceworker', 'indexeddb', 'websockets']
            }
        ];
        
        this.mobileDevices = [
            {
                name: 'iPhone 14',
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                viewport: { width: 390, height: 844 },
                devicePixelRatio: 3
            },
            {
                name: 'Samsung Galaxy S23',
                userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
                viewport: { width: 360, height: 780 },
                devicePixelRatio: 3
            },
            {
                name: 'iPad Pro',
                userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                viewport: { width: 1024, height: 1366 },
                devicePixelRatio: 2
            }
        ];
        
        this.testScenarios = [
            'basic_functionality',
            'responsive_design',
            'performance_metrics',
            'feature_compatibility',
            'user_interactions',
            'offline_functionality'
        ];
        
        this.testResults = {
            browsers: {},
            devices: {},
            summary: {},
            timestamp: null
        };
    }

    /**
     * Run comprehensive cross-browser testing
     */
    async runCrossBrowserTests() {
        console.log('🌐 Starting comprehensive cross-browser testing...');
        
        const startTime = performance.now();
        this.testResults.timestamp = new Date().toISOString();
        
        try {
            // Test desktop browsers
            console.log('💻 Testing desktop browsers...');
            for (const browser of this.supportedBrowsers) {
                this.testResults.browsers[browser.name] = await this.testBrowser(browser);
            }
            
            // Test mobile devices
            console.log('📱 Testing mobile devices...');
            for (const device of this.mobileDevices) {
                this.testResults.devices[device.name] = await this.testMobileDevice(device);
            }
            
            // Generate summary
            this.testResults.summary = this.generateTestSummary();
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            console.log(`🌐 Cross-browser testing completed in ${totalTime.toFixed(2)}ms:`);
            console.log(`   💻 Desktop browsers: ${Object.keys(this.testResults.browsers).length}`);
            console.log(`   📱 Mobile devices: ${Object.keys(this.testResults.devices).length}`);
            console.log(`   ✅ Overall success rate: ${this.testResults.summary.successRate}%`);
            
            return this.testResults;
            
        } catch (error) {
            console.error('❌ Cross-browser testing failed:', error);
            throw error;
        }
    }

    /**
     * Test specific browser
     */
    async testBrowser(browser) {
        console.log(`🔍 Testing ${browser.name}...`);
        
        const results = {
            browser: browser.name,
            userAgent: browser.userAgent,
            features: {},
            scenarios: {},
            performance: {},
            compatibility: {},
            passed: true,
            issues: []
        };
        
        try {
            // Simulate browser environment
            await this.simulateBrowserEnvironment(browser);
            
            // Test browser features
            results.features = await this.testBrowserFeatures(browser);
            
            // Test scenarios
            for (const scenario of this.testScenarios) {
                results.scenarios[scenario] = await this.testScenario(scenario, browser);
            }
            
            // Test performance
            results.performance = await this.testBrowserPerformance(browser);
            
            // Test compatibility
            results.compatibility = await this.testBrowserCompatibility(browser);
            
            // Determine overall pass/fail
            results.passed = this.evaluateBrowserResults(results);
            
        } catch (error) {
            results.passed = false;
            results.issues.push({
                type: 'error',
                message: error.message,
                scenario: 'browser_initialization'
            });
        }
        
        return results;
    }

    /**
     * Test mobile device
     */
    async testMobileDevice(device) {
        console.log(`📱 Testing ${device.name}...`);
        
        const results = {
            device: device.name,
            userAgent: device.userAgent,
            viewport: device.viewport,
            devicePixelRatio: device.devicePixelRatio,
            scenarios: {},
            performance: {},
            touchInteractions: {},
            responsiveDesign: {},
            passed: true,
            issues: []
        };
        
        try {
            // Simulate mobile environment
            await this.simulateMobileEnvironment(device);
            
            // Test mobile-specific scenarios
            const mobileScenarios = [
                'responsive_design',
                'touch_interactions',
                'performance_metrics',
                'offline_functionality'
            ];
            
            for (const scenario of mobileScenarios) {
                results.scenarios[scenario] = await this.testMobileScenario(scenario, device);
            }
            
            // Test touch interactions
            results.touchInteractions = await this.testTouchInteractions(device);
            
            // Test responsive design
            results.responsiveDesign = await this.testResponsiveDesign(device);
            
            // Test mobile performance
            results.performance = await this.testMobilePerformance(device);
            
            // Determine overall pass/fail
            results.passed = this.evaluateMobileResults(results);
            
        } catch (error) {
            results.passed = false;
            results.issues.push({
                type: 'error',
                message: error.message,
                scenario: 'mobile_initialization'
            });
        }
        
        return results;
    }

    /**
     * Simulate browser environment
     */
    async simulateBrowserEnvironment(browser) {
        // Simulate user agent
        Object.defineProperty(navigator, 'userAgent', {
            value: browser.userAgent,
            configurable: true
        });
        
        // Simulate browser-specific behaviors
        await this.simulateBrowserSpecificBehaviors(browser);
    }

    /**
     * Simulate browser-specific behaviors
     */
    async simulateBrowserSpecificBehaviors(browser) {
        switch (browser.name) {
            case 'Safari':
                // Safari-specific behaviors
                this.simulateSafariBehaviors();
                break;
            case 'Firefox':
                // Firefox-specific behaviors
                this.simulateFirefoxBehaviors();
                break;
            case 'Edge':
                // Edge-specific behaviors
                this.simulateEdgeBehaviors();
                break;
            default:
                // Chrome behaviors (default)
                this.simulateChromeBehaviors();
        }
    }

    /**
     * Simulate Safari-specific behaviors
     */
    simulateSafariBehaviors() {
        // Safari has stricter security policies
        // Simulate Safari's handling of third-party cookies
        if (typeof document !== 'undefined') {
            const originalCookie = document.cookie;
            Object.defineProperty(document, 'cookie', {
                get: () => originalCookie,
                set: (value) => {
                    // Safari blocks third-party cookies by default
                    if (!value.includes('SameSite=None')) {
                        console.warn('Safari: Third-party cookie blocked');
                    }
                }
            });
        }
    }

    /**
     * Simulate Firefox-specific behaviors
     */
    simulateFirefoxBehaviors() {
        // Firefox has enhanced tracking protection
        // Simulate Firefox's strict privacy settings
        if (typeof navigator !== 'undefined') {
            Object.defineProperty(navigator, 'doNotTrack', {
                value: '1',
                configurable: true
            });
        }
    }

    /**
     * Simulate Edge-specific behaviors
     */
    simulateEdgeBehaviors() {
        // Edge has similar behavior to Chrome but with some differences
        // Simulate Edge's enhanced security features
        if (typeof window !== 'undefined') {
            window.MSInputMethodContext = {};
        }
    }

    /**
     * Simulate Chrome behaviors
     */
    simulateChromeBehaviors() {
        // Chrome default behaviors
        // Most permissive for testing
    }

    /**
     * Test browser features
     */
    async testBrowserFeatures(browser) {
        const features = {};
        
        for (const feature of browser.features) {
            features[feature] = await this.testFeature(feature);
        }
        
        return features;
    }

    /**
     * Test specific feature
     */
    async testFeature(feature) {
        const result = {
            supported: false,
            version: null,
            issues: []
        };
        
        try {
            switch (feature) {
                case 'webgl':
                    result.supported = this.testWebGL();
                    break;
                case 'serviceworker':
                    result.supported = 'serviceWorker' in navigator;
                    break;
                case 'indexeddb':
                    result.supported = 'indexedDB' in window;
                    break;
                case 'websockets':
                    result.supported = 'WebSocket' in window;
                    break;
                default:
                    result.supported = false;
            }
        } catch (error) {
            result.issues.push(error.message);
        }
        
        return result;
    }

    /**
     * Test WebGL support
     */
    testWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return gl !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Test scenario in browser context
     */
    async testScenario(scenario, browser) {
        const result = {
            scenario: scenario,
            browser: browser.name,
            passed: true,
            duration: 0,
            issues: []
        };
        
        const startTime = performance.now();
        
        try {
            switch (scenario) {
                case 'basic_functionality':
                    await this.testBasicFunctionality(browser);
                    break;
                case 'responsive_design':
                    await this.testResponsiveDesignBrowser(browser);
                    break;
                case 'performance_metrics':
                    await this.testPerformanceMetrics(browser);
                    break;
                case 'feature_compatibility':
                    await this.testFeatureCompatibility(browser);
                    break;
                case 'user_interactions':
                    await this.testUserInteractions(browser);
                    break;
                case 'offline_functionality':
                    await this.testOfflineFunctionality(browser);
                    break;
                default:
                    throw new Error(`Unknown scenario: ${scenario}`);
            }
        } catch (error) {
            result.passed = false;
            result.issues.push(error.message);
        }
        
        const endTime = performance.now();
        result.duration = endTime - startTime;
        
        return result;
    }

    /**
     * Test basic functionality
     */
    async testBasicFunctionality(browser) {
        // Test DOM manipulation
        const testElement = document.createElement('div');
        testElement.textContent = 'Test';
        document.body.appendChild(testElement);
        
        if (!document.body.contains(testElement)) {
            throw new Error('DOM manipulation failed');
        }
        
        document.body.removeChild(testElement);
        
        // Test event handling
        let eventFired = false;
        const button = document.createElement('button');
        button.addEventListener('click', () => {
            eventFired = true;
        });
        
        button.click();
        
        if (!eventFired) {
            throw new Error('Event handling failed');
        }
        
        // Test local storage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('test', 'value');
            if (localStorage.getItem('test') !== 'value') {
                throw new Error('Local storage failed');
            }
            localStorage.removeItem('test');
        }
    }

    /**
     * Test responsive design in browser
     */
    async testResponsiveDesignBrowser(browser) {
        const viewports = [
            { width: 360, height: 640 },  // Mobile
            { width: 768, height: 1024 }, // Tablet
            { width: 1920, height: 1080 } // Desktop
        ];
        
        for (const viewport of viewports) {
            // Simulate viewport change
            Object.defineProperty(window, 'innerWidth', {
                value: viewport.width,
                configurable: true
            });
            Object.defineProperty(window, 'innerHeight', {
                value: viewport.height,
                configurable: true
            });
            
            // Trigger resize event
            window.dispatchEvent(new Event('resize'));
            
            // Wait for layout to settle
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if layout adapted
            const elements = document.querySelectorAll('*');
            for (const element of elements) {
                const rect = element.getBoundingClientRect();
                if (rect.width > viewport.width) {
                    console.warn(`Element overflow detected at ${viewport.width}px width`);
                }
            }
        }
    }

    /**
     * Test performance metrics
     */
    async testPerformanceMetrics(browser) {
        const metrics = {
            domContentLoaded: 0,
            loadComplete: 0,
            firstPaint: 0,
            memoryUsage: 0
        };
        
        // Measure DOM content loaded
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
            metrics.loadComplete = navigation.loadEventEnd - navigation.fetchStart;
        }
        
        // Measure first paint
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        if (firstPaint) {
            metrics.firstPaint = firstPaint.startTime;
        }
        
        // Measure memory usage (if available)
        if ('memory' in performance) {
            metrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
        
        return metrics;
    }

    /**
     * Test feature compatibility
     */
    async testFeatureCompatibility(browser) {
        const features = {
            es6: this.testES6Support(),
            css3: this.testCSS3Support(),
            html5: this.testHTML5Support(),
            apis: this.testModernAPIs()
        };
        
        return features;
    }

    /**
     * Test ES6 support
     */
    testES6Support() {
        try {
            // Test arrow functions
            const arrow = () => true;
            
            // Test template literals
            const template = `test ${arrow()}`;
            
            // Test destructuring
            const [a, b] = [1, 2];
            
            // Test classes
            class TestClass {
                constructor() {
                    this.value = true;
                }
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Test CSS3 support
     */
    testCSS3Support() {
        const testElement = document.createElement('div');
        const style = testElement.style;
        
        const features = {
            flexbox: 'flex' in style,
            grid: 'grid' in style,
            transforms: 'transform' in style,
            transitions: 'transition' in style,
            animations: 'animation' in style
        };
        
        return features;
    }

    /**
     * Test HTML5 support
     */
    testHTML5Support() {
        const features = {
            canvas: 'getContext' in document.createElement('canvas'),
            video: 'play' in document.createElement('video'),
            audio: 'play' in document.createElement('audio'),
            localStorage: 'localStorage' in window,
            sessionStorage: 'sessionStorage' in window
        };
        
        return features;
    }

    /**
     * Test modern APIs
     */
    testModernAPIs() {
        const features = {
            fetch: 'fetch' in window,
            promises: 'Promise' in window,
            serviceWorker: 'serviceWorker' in navigator,
            webWorkers: 'Worker' in window,
            geolocation: 'geolocation' in navigator,
            notifications: 'Notification' in window
        };
        
        return features;
    }

    /**
     * Test user interactions
     */
    async testUserInteractions(browser) {
        // Test click events
        let clickHandled = false;
        const button = document.createElement('button');
        button.addEventListener('click', () => {
            clickHandled = true;
        });
        document.body.appendChild(button);
        
        button.click();
        
        if (!clickHandled) {
            throw new Error('Click event not handled');
        }
        
        document.body.removeChild(button);
        
        // Test keyboard events
        let keyHandled = false;
        const input = document.createElement('input');
        input.addEventListener('keydown', () => {
            keyHandled = true;
        });
        document.body.appendChild(input);
        
        const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        input.dispatchEvent(keyEvent);
        
        if (!keyHandled) {
            throw new Error('Keyboard event not handled');
        }
        
        document.body.removeChild(input);
    }

    /**
     * Test offline functionality
     */
    async testOfflineFunctionality(browser) {
        // Test service worker registration
        if ('serviceWorker' in navigator) {
            try {
                // Check if service worker is already registered
                const registrations = await navigator.serviceWorker.getRegistrations();
                if (registrations.length === 0) {
                    console.warn('No service worker registered for offline functionality');
                }
            } catch (error) {
                throw new Error('Service worker test failed: ' + error.message);
            }
        } else {
            throw new Error('Service worker not supported');
        }
        
        // Test cache API
        if ('caches' in window) {
            try {
                const cache = await caches.open('test-cache');
                await cache.put('/test', new Response('test'));
                const response = await cache.match('/test');
                if (!response) {
                    throw new Error('Cache API test failed');
                }
                await caches.delete('test-cache');
            } catch (error) {
                throw new Error('Cache API test failed: ' + error.message);
            }
        }
    }

    /**
     * Simulate mobile environment
     */
    async simulateMobileEnvironment(device) {
        // Set viewport
        Object.defineProperty(window, 'innerWidth', {
            value: device.viewport.width,
            configurable: true
        });
        Object.defineProperty(window, 'innerHeight', {
            value: device.viewport.height,
            configurable: true
        });
        
        // Set device pixel ratio
        Object.defineProperty(window, 'devicePixelRatio', {
            value: device.devicePixelRatio,
            configurable: true
        });
        
        // Set user agent
        Object.defineProperty(navigator, 'userAgent', {
            value: device.userAgent,
            configurable: true
        });
        
        // Simulate touch events
        this.simulateTouchEvents();
    }

    /**
     * Simulate touch events
     */
    simulateTouchEvents() {
        if (typeof TouchEvent === 'undefined') {
            // Create TouchEvent constructor if not available
            window.TouchEvent = class TouchEvent extends Event {
                constructor(type, options = {}) {
                    super(type, options);
                    this.touches = options.touches || [];
                    this.targetTouches = options.targetTouches || [];
                    this.changedTouches = options.changedTouches || [];
                }
            };
        }
    }

    /**
     * Test mobile scenario
     */
    async testMobileScenario(scenario, device) {
        const result = {
            scenario: scenario,
            device: device.name,
            passed: true,
            duration: 0,
            issues: []
        };
        
        const startTime = performance.now();
        
        try {
            switch (scenario) {
                case 'responsive_design':
                    await this.testMobileResponsiveDesign(device);
                    break;
                case 'touch_interactions':
                    await this.testMobileTouchInteractions(device);
                    break;
                case 'performance_metrics':
                    await this.testMobilePerformanceMetrics(device);
                    break;
                case 'offline_functionality':
                    await this.testMobileOfflineFunctionality(device);
                    break;
                default:
                    throw new Error(`Unknown mobile scenario: ${scenario}`);
            }
        } catch (error) {
            result.passed = false;
            result.issues.push(error.message);
        }
        
        const endTime = performance.now();
        result.duration = endTime - startTime;
        
        return result;
    }

    /**
     * Test mobile responsive design
     */
    async testMobileResponsiveDesign(device) {
        // Check if elements fit within viewport
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (rect.width > device.viewport.width) {
                throw new Error(`Element overflow on ${device.name}: ${rect.width}px > ${device.viewport.width}px`);
            }
        }
        
        // Check touch target sizes
        const interactiveElements = document.querySelectorAll('button, input, select, a, [onclick]');
        for (const element of interactiveElements) {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                console.warn(`Touch target too small on ${device.name}: ${rect.width}x${rect.height}px`);
            }
        }
    }

    /**
     * Test mobile touch interactions
     */
    async testMobileTouchInteractions(device) {
        // Test touch events
        const testElement = document.createElement('div');
        testElement.style.width = '100px';
        testElement.style.height = '100px';
        document.body.appendChild(testElement);
        
        let touchStartHandled = false;
        let touchEndHandled = false;
        
        testElement.addEventListener('touchstart', () => {
            touchStartHandled = true;
        });
        
        testElement.addEventListener('touchend', () => {
            touchEndHandled = true;
        });
        
        // Simulate touch events
        const touchStart = new TouchEvent('touchstart', {
            touches: [{ clientX: 50, clientY: 50 }]
        });
        const touchEnd = new TouchEvent('touchend', {
            changedTouches: [{ clientX: 50, clientY: 50 }]
        });
        
        testElement.dispatchEvent(touchStart);
        testElement.dispatchEvent(touchEnd);
        
        if (!touchStartHandled || !touchEndHandled) {
            throw new Error('Touch events not handled properly');
        }
        
        document.body.removeChild(testElement);
    }

    /**
     * Test mobile performance metrics
     */
    async testMobilePerformanceMetrics(device) {
        const metrics = await this.testPerformanceMetrics({ name: device.name });
        
        // Mobile-specific performance checks
        if (metrics.domContentLoaded > 3000) {
            throw new Error(`DOM content loaded too slow on ${device.name}: ${metrics.domContentLoaded}ms`);
        }
        
        if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
            console.warn(`High memory usage on ${device.name}: ${metrics.memoryUsage} bytes`);
        }
        
        return metrics;
    }

    /**
     * Test mobile offline functionality
     */
    async testMobileOfflineFunctionality(device) {
        // Same as desktop offline functionality
        await this.testOfflineFunctionality({ name: device.name });
    }

    /**
     * Test touch interactions
     */
    async testTouchInteractions(device) {
        const results = {
            touchEvents: false,
            gestureSupport: false,
            touchTargetSizes: true,
            issues: []
        };
        
        // Test touch event support
        results.touchEvents = 'ontouchstart' in window || 'TouchEvent' in window;
        
        // Test gesture support
        results.gestureSupport = 'ongesturestart' in window;
        
        // Test touch target sizes
        const interactiveElements = document.querySelectorAll('button, input, select, a, [onclick]');
        for (const element of interactiveElements) {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                results.touchTargetSizes = false;
                results.issues.push(`Touch target too small: ${rect.width}x${rect.height}px`);
            }
        }
        
        return results;
    }

    /**
     * Test responsive design
     */
    async testResponsiveDesign(device) {
        const results = {
            viewportFits: true,
            textReadable: true,
            navigationAccessible: true,
            issues: []
        };
        
        // Check viewport fit
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (rect.width > device.viewport.width) {
                results.viewportFits = false;
                results.issues.push(`Element overflow: ${rect.width}px > ${device.viewport.width}px`);
            }
        }
        
        // Check text readability
        const textElements = document.querySelectorAll('p, span, div, button, input');
        for (const element of textElements) {
            const styles = window.getComputedStyle(element);
            const fontSize = parseFloat(styles.fontSize);
            if (fontSize < 14) {
                results.textReadable = false;
                results.issues.push(`Text too small: ${fontSize}px`);
            }
        }
        
        return results;
    }

    /**
     * Test mobile performance
     */
    async testMobilePerformance(device) {
        const performance = await this.testPerformanceMetrics({ name: device.name });
        
        // Add mobile-specific performance metrics
        performance.batteryImpact = Math.random() * 30; // Mock battery impact
        performance.networkEfficiency = Math.random() * 100; // Mock network efficiency
        
        return performance;
    }

    /**
     * Test browser performance
     */
    async testBrowserPerformance(browser) {
        return await this.testPerformanceMetrics(browser);
    }

    /**
     * Test browser compatibility
     */
    async testBrowserCompatibility(browser) {
        const compatibility = {
            css: await this.testCSS3Support(),
            javascript: await this.testES6Support(),
            html: await this.testHTML5Support(),
            apis: await this.testModernAPIs()
        };
        
        return compatibility;
    }

    /**
     * Evaluate browser test results
     */
    evaluateBrowserResults(results) {
        // Check if critical features are supported
        const criticalFeatures = ['serviceworker', 'indexeddb'];
        for (const feature of criticalFeatures) {
            if (results.features[feature] && !results.features[feature].supported) {
                return false;
            }
        }
        
        // Check if scenarios passed
        for (const scenario in results.scenarios) {
            if (!results.scenarios[scenario].passed) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Evaluate mobile test results
     */
    evaluateMobileResults(results) {
        // Check if scenarios passed
        for (const scenario in results.scenarios) {
            if (!results.scenarios[scenario].passed) {
                return false;
            }
        }
        
        // Check responsive design
        if (!results.responsiveDesign.viewportFits) {
            return false;
        }
        
        // Check touch interactions
        if (!results.touchInteractions.touchEvents) {
            return false;
        }
        
        return true;
    }

    /**
     * Generate test summary
     */
    generateTestSummary() {
        const summary = {
            totalBrowsers: Object.keys(this.testResults.browsers).length,
            totalDevices: Object.keys(this.testResults.devices).length,
            passedBrowsers: 0,
            passedDevices: 0,
            failedBrowsers: [],
            failedDevices: [],
            successRate: 0,
            issues: []
        };
        
        // Count passed browsers
        for (const [browserName, result] of Object.entries(this.testResults.browsers)) {
            if (result.passed) {
                summary.passedBrowsers++;
            } else {
                summary.failedBrowsers.push(browserName);
                summary.issues.push(...result.issues);
            }
        }
        
        // Count passed devices
        for (const [deviceName, result] of Object.entries(this.testResults.devices)) {
            if (result.passed) {
                summary.passedDevices++;
            } else {
                summary.failedDevices.push(deviceName);
                summary.issues.push(...result.issues);
            }
        }
        
        // Calculate success rate
        const totalTests = summary.totalBrowsers + summary.totalDevices;
        const passedTests = summary.passedBrowsers + summary.passedDevices;
        summary.successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        return summary;
    }

    /**
     * Generate compatibility report
     */
    generateCompatibilityReport() {
        const report = {
            timestamp: this.testResults.timestamp,
            summary: this.testResults.summary,
            browsers: {},
            devices: {},
            recommendations: []
        };
        
        // Process browser results
        for (const [browserName, result] of Object.entries(this.testResults.browsers)) {
            report.browsers[browserName] = {
                passed: result.passed,
                features: result.features,
                performance: result.performance,
                issues: result.issues
            };
        }
        
        // Process device results
        for (const [deviceName, result] of Object.entries(this.testResults.devices)) {
            report.devices[deviceName] = {
                passed: result.passed,
                performance: result.performance,
                responsiveDesign: result.responsiveDesign,
                issues: result.issues
            };
        }
        
        // Generate recommendations
        report.recommendations = this.generateCompatibilityRecommendations();
        
        return report;
    }

    /**
     * Generate compatibility recommendations
     */
    generateCompatibilityRecommendations() {
        const recommendations = [];
        
        // Check for common issues
        if (this.testResults.summary.failedBrowsers.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Browser Compatibility',
                issue: `Failed browsers: ${this.testResults.summary.failedBrowsers.join(', ')}`,
                solution: 'Review browser-specific issues and implement polyfills or fallbacks'
            });
        }
        
        if (this.testResults.summary.failedDevices.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Mobile Compatibility',
                issue: `Failed devices: ${this.testResults.summary.failedDevices.join(', ')}`,
                solution: 'Optimize responsive design and touch interactions'
            });
        }
        
        if (this.testResults.summary.successRate < 90) {
            recommendations.push({
                priority: 'medium',
                category: 'Overall Compatibility',
                issue: `Success rate below 90%: ${this.testResults.summary.successRate}%`,
                solution: 'Conduct thorough testing and implement progressive enhancement'
            });
        }
        
        return recommendations;
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossBrowserTester;
} else if (typeof window !== 'undefined') {
    window.CrossBrowserTester = CrossBrowserTester;
}