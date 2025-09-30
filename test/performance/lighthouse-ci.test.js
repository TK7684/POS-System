/**
 * Lighthouse CI Performance Testing
 * Requirements: 2.1, 2.2 - Performance optimization and monitoring
 */

class LighthouseCITester {
    constructor() {
        this.performanceThresholds = {
            performance: 90,
            accessibility: 95,
            bestPractices: 90,
            seo: 80,
            pwa: 80,
            // Core Web Vitals thresholds
            firstContentfulPaint: 1800,
            largestContentfulPaint: 2500,
            firstInputDelay: 100,
            cumulativeLayoutShift: 0.1,
            speedIndex: 3000,
            timeToInteractive: 3800
        };
        
        this.testConfig = {
            extends: 'lighthouse:default',
            settings: {
                formFactor: 'mobile',
                throttling: {
                    rttMs: 150,
                    throughputKbps: 1638.4,
                    cpuSlowdownMultiplier: 4
                },
                screenEmulation: {
                    mobile: true,
                    width: 360,
                    height: 640,
                    deviceScaleFactor: 2
                },
                emulatedUserAgent: 'Mozilla/5.0 (Linux; Android 8.0; SM-G960F) AppleWebKit/537.36'
            }
        };
        
        this.testResults = {
            performance: null,
            accessibility: null,
            bestPractices: null,
            seo: null,
            pwa: null,
            audits: {},
            timestamp: null
        };
    }

    /**
     * Initialize Lighthouse testing environment
     */
    async initializeLighthouse() {
        console.log('🚨 Initializing Lighthouse CI testing...');
        
        // Check if running in supported environment
        if (typeof window === 'undefined') {
            throw new Error('Lighthouse CI testing requires browser environment');
        }
        
        // Load Lighthouse if not available (for client-side testing)
        if (typeof lighthouse === 'undefined') {
            console.log('📦 Loading Lighthouse library...');
            await this.loadLighthouseLibrary();
        }
        
        console.log('✅ Lighthouse CI initialized');
    }

    /**
     * Load Lighthouse library dynamically
     */
    async loadLighthouseLibrary() {
        // Note: In production, Lighthouse would typically run server-side
        // This is a simplified client-side implementation for demonstration
        return new Promise((resolve) => {
            // Mock Lighthouse for client-side demo
            window.lighthouse = {
                run: this.mockLighthouseRun.bind(this)
            };
            resolve();
        });
    }

    /**
     * Run comprehensive Lighthouse audit
     */
    async runLighthouseAudit(url = window.location.href) {
        console.log(`🚨 Running Lighthouse audit for: ${url}`);
        
        try {
            await this.initializeLighthouse();
            
            const startTime = performance.now();
            
            // Run Lighthouse audit
            const results = await this.performLighthouseAudit(url);
            
            const endTime = performance.now();
            const auditTime = endTime - startTime;
            
            // Process and store results
            this.testResults = {
                ...results,
                timestamp: new Date().toISOString(),
                auditTime: auditTime,
                url: url
            };
            
            // Generate performance report
            const report = this.generatePerformanceReport();
            
            console.log(`🚨 Lighthouse audit completed in ${auditTime.toFixed(2)}ms:`);
            console.log(`   ⚡ Performance: ${results.performance}%`);
            console.log(`   ♿ Accessibility: ${results.accessibility}%`);
            console.log(`   ✅ Best Practices: ${results.bestPractices}%`);
            console.log(`   🔍 SEO: ${results.seo}%`);
            console.log(`   📱 PWA: ${results.pwa}%`);
            
            return report;
            
        } catch (error) {
            console.error('❌ Lighthouse audit failed:', error);
            throw error;
        }
    }

    /**
     * Perform actual Lighthouse audit
     */
    async performLighthouseAudit(url) {
        // In production, this would call actual Lighthouse
        // For demo purposes, we'll simulate with real performance measurements
        
        const performanceMetrics = await this.measureRealPerformanceMetrics();
        const accessibilityScore = await this.measureAccessibilityScore();
        const bestPracticesScore = await this.measureBestPracticesScore();
        const seoScore = await this.measureSEOScore();
        const pwaScore = await this.measurePWAScore();
        
        return {
            performance: performanceMetrics.score,
            accessibility: accessibilityScore,
            bestPractices: bestPracticesScore,
            seo: seoScore,
            pwa: pwaScore,
            audits: {
                ...performanceMetrics.audits,
                'first-contentful-paint': performanceMetrics.fcp,
                'largest-contentful-paint': performanceMetrics.lcp,
                'first-input-delay': performanceMetrics.fid,
                'cumulative-layout-shift': performanceMetrics.cls,
                'speed-index': performanceMetrics.speedIndex,
                'time-to-interactive': performanceMetrics.tti
            }
        };
    }

    /**
     * Measure real performance metrics using browser APIs
     */
    async measureRealPerformanceMetrics() {
        const metrics = {
            fcp: null,
            lcp: null,
            fid: null,
            cls: null,
            speedIndex: null,
            tti: null,
            score: 0,
            audits: {}
        };

        // Measure using Performance Observer API
        if ('PerformanceObserver' in window) {
            await this.measureCoreWebVitals(metrics);
        }

        // Measure using Navigation Timing API
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            metrics.audits['dom-content-loaded'] = navigation.domContentLoadedEventEnd - navigation.fetchStart;
            metrics.audits['load-event'] = navigation.loadEventEnd - navigation.fetchStart;
            metrics.tti = navigation.loadEventEnd - navigation.fetchStart;
        }

        // Calculate performance score based on metrics
        metrics.score = this.calculatePerformanceScore(metrics);

        return metrics;
    }

    /**
     * Measure Core Web Vitals
     */
    async measureCoreWebVitals(metrics) {
        return new Promise((resolve) => {
            let observersCompleted = 0;
            const totalObservers = 3;

            // Measure LCP
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                metrics.lcp = lastEntry.startTime;
                observersCompleted++;
                if (observersCompleted === totalObservers) resolve();
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // Measure FID
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (entry.name === 'first-input') {
                        metrics.fid = entry.processingStart - entry.startTime;
                    }
                });
                observersCompleted++;
                if (observersCompleted === totalObservers) resolve();
            }).observe({ entryTypes: ['first-input'] });

            // Measure CLS
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                metrics.cls = clsValue;
                observersCompleted++;
                if (observersCompleted === totalObservers) resolve();
            }).observe({ entryTypes: ['layout-shift'] });

            // Measure FCP using paint timing
            const paintEntries = performance.getEntriesByType('paint');
            const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
                metrics.fcp = fcpEntry.startTime;
            }

            // Fallback timeout
            setTimeout(() => {
                resolve();
            }, 3000);
        });
    }

    /**
     * Calculate performance score based on metrics
     */
    calculatePerformanceScore(metrics) {
        let score = 100;
        
        // Deduct points based on thresholds
        if (metrics.fcp > this.performanceThresholds.firstContentfulPaint) {
            score -= 15;
        }
        if (metrics.lcp > this.performanceThresholds.largestContentfulPaint) {
            score -= 20;
        }
        if (metrics.fid > this.performanceThresholds.firstInputDelay) {
            score -= 15;
        }
        if (metrics.cls > this.performanceThresholds.cumulativeLayoutShift) {
            score -= 20;
        }
        if (metrics.tti > this.performanceThresholds.timeToInteractive) {
            score -= 15;
        }
        
        return Math.max(0, score);
    }

    /**
     * Measure accessibility score
     */
    async measureAccessibilityScore() {
        // Simplified accessibility scoring
        let score = 100;
        
        // Check for basic accessibility features
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.hasAttribute('alt'));
        if (imagesWithoutAlt.length > 0) {
            score -= (imagesWithoutAlt.length / images.length) * 20;
        }
        
        // Check for form labels
        const inputs = document.querySelectorAll('input, select, textarea');
        const inputsWithoutLabels = Array.from(inputs).filter(input => 
            !input.labels || input.labels.length === 0
        );
        if (inputsWithoutLabels.length > 0) {
            score -= (inputsWithoutLabels.length / inputs.length) * 15;
        }
        
        // Check for heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            score -= 10;
        }
        
        return Math.max(0, Math.round(score));
    }

    /**
     * Measure best practices score
     */
    async measureBestPracticesScore() {
        let score = 100;
        
        // Check HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            score -= 20;
        }
        
        // Check for console errors
        const originalConsoleError = console.error;
        let errorCount = 0;
        console.error = (...args) => {
            errorCount++;
            originalConsoleError.apply(console, args);
        };
        
        // Restore console.error after a brief period
        setTimeout(() => {
            console.error = originalConsoleError;
        }, 1000);
        
        if (errorCount > 0) {
            score -= Math.min(30, errorCount * 5);
        }
        
        // Check for deprecated APIs (simplified)
        if (document.querySelectorAll('[onclick]').length > 0) {
            score -= 5;
        }
        
        return Math.max(0, Math.round(score));
    }

    /**
     * Measure SEO score
     */
    async measureSEOScore() {
        let score = 100;
        
        // Check for title tag
        if (!document.title || document.title.trim().length === 0) {
            score -= 20;
        }
        
        // Check for meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription || !metaDescription.content.trim()) {
            score -= 15;
        }
        
        // Check for viewport meta tag
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            score -= 15;
        }
        
        // Check for heading tags
        const h1Tags = document.querySelectorAll('h1');
        if (h1Tags.length === 0) {
            score -= 10;
        } else if (h1Tags.length > 1) {
            score -= 5;
        }
        
        return Math.max(0, Math.round(score));
    }

    /**
     * Measure PWA score
     */
    async measurePWAScore() {
        let score = 0;
        
        // Check for web app manifest
        const manifest = document.querySelector('link[rel="manifest"]');
        if (manifest) {
            score += 25;
        }
        
        // Check for service worker
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length > 0) {
                score += 25;
            }
        }
        
        // Check for HTTPS
        if (location.protocol === 'https:' || location.hostname === 'localhost') {
            score += 20;
        }
        
        // Check for responsive design
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport && viewport.content.includes('width=device-width')) {
            score += 15;
        }
        
        // Check for offline capability (simplified)
        if (window.caches) {
            score += 15;
        }
        
        return Math.min(100, score);
    }

    /**
     * Run performance regression testing
     */
    async runPerformanceRegressionTest(baselineResults = null) {
        console.log('📈 Running performance regression testing...');
        
        const currentResults = await this.runLighthouseAudit();
        
        if (!baselineResults) {
            console.log('📊 No baseline results provided, storing current results as baseline');
            return {
                baseline: currentResults,
                current: currentResults,
                regression: false,
                improvements: [],
                regressions: []
            };
        }
        
        const comparison = this.comparePerformanceResults(baselineResults, currentResults);
        
        console.log('📈 Performance regression test completed:');
        console.log(`   📊 Improvements: ${comparison.improvements.length}`);
        console.log(`   📉 Regressions: ${comparison.regressions.length}`);
        console.log(`   🎯 Overall: ${comparison.regression ? '❌ REGRESSION DETECTED' : '✅ NO REGRESSION'}`);
        
        return comparison;
    }

    /**
     * Compare performance results for regression detection
     */
    comparePerformanceResults(baseline, current) {
        const comparison = {
            baseline: baseline,
            current: current,
            regression: false,
            improvements: [],
            regressions: [],
            threshold: 5 // 5% threshold for regression detection
        };
        
        const metrics = ['performance', 'accessibility', 'bestPractices', 'seo', 'pwa'];
        
        for (const metric of metrics) {
            const baselineValue = baseline[metric] || 0;
            const currentValue = current[metric] || 0;
            const change = currentValue - baselineValue;
            const changePercent = baselineValue > 0 ? (change / baselineValue) * 100 : 0;
            
            if (Math.abs(changePercent) >= comparison.threshold) {
                if (changePercent > 0) {
                    comparison.improvements.push({
                        metric: metric,
                        baseline: baselineValue,
                        current: currentValue,
                        change: change,
                        changePercent: changePercent
                    });
                } else {
                    comparison.regressions.push({
                        metric: metric,
                        baseline: baselineValue,
                        current: currentValue,
                        change: change,
                        changePercent: changePercent
                    });
                    comparison.regression = true;
                }
            }
        }
        
        return comparison;
    }

    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport() {
        const report = {
            summary: {
                timestamp: this.testResults.timestamp,
                url: this.testResults.url,
                auditTime: this.testResults.auditTime,
                overallScore: this.calculateOverallScore(),
                passed: this.checkPerformanceThresholds()
            },
            scores: {
                performance: this.testResults.performance,
                accessibility: this.testResults.accessibility,
                bestPractices: this.testResults.bestPractices,
                seo: this.testResults.seo,
                pwa: this.testResults.pwa
            },
            coreWebVitals: {
                fcp: this.testResults.audits['first-contentful-paint'],
                lcp: this.testResults.audits['largest-contentful-paint'],
                fid: this.testResults.audits['first-input-delay'],
                cls: this.testResults.audits['cumulative-layout-shift'],
                speedIndex: this.testResults.audits['speed-index'],
                tti: this.testResults.audits['time-to-interactive']
            },
            recommendations: this.generatePerformanceRecommendations(),
            thresholds: this.performanceThresholds
        };
        
        return report;
    }

    /**
     * Calculate overall performance score
     */
    calculateOverallScore() {
        const scores = [
            this.testResults.performance,
            this.testResults.accessibility,
            this.testResults.bestPractices,
            this.testResults.seo,
            this.testResults.pwa
        ].filter(score => score !== null);
        
        if (scores.length === 0) return 0;
        
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }

    /**
     * Check if performance meets thresholds
     */
    checkPerformanceThresholds() {
        return this.testResults.performance >= this.performanceThresholds.performance &&
               this.testResults.accessibility >= this.performanceThresholds.accessibility &&
               this.testResults.bestPractices >= this.performanceThresholds.bestPractices &&
               this.testResults.seo >= this.performanceThresholds.seo &&
               this.testResults.pwa >= this.performanceThresholds.pwa;
    }

    /**
     * Generate performance recommendations
     */
    generatePerformanceRecommendations() {
        const recommendations = [];
        
        if (this.testResults.performance < this.performanceThresholds.performance) {
            recommendations.push({
                category: 'Performance',
                priority: 'high',
                issue: 'Performance score below threshold',
                suggestion: 'Optimize images, minify CSS/JS, implement caching',
                impact: 'High'
            });
        }
        
        if (this.testResults.accessibility < this.performanceThresholds.accessibility) {
            recommendations.push({
                category: 'Accessibility',
                priority: 'high',
                issue: 'Accessibility score below threshold',
                suggestion: 'Add alt texts, improve keyboard navigation, enhance ARIA labels',
                impact: 'High'
            });
        }
        
        if (this.testResults.pwa < this.performanceThresholds.pwa) {
            recommendations.push({
                category: 'PWA',
                priority: 'medium',
                issue: 'PWA score below threshold',
                suggestion: 'Add web app manifest, implement service worker, ensure HTTPS',
                impact: 'Medium'
            });
        }
        
        return recommendations;
    }

    /**
     * Mock Lighthouse run for client-side demo
     */
    async mockLighthouseRun(url, config) {
        // Simulate Lighthouse audit delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Return mock results based on actual measurements
        return await this.performLighthouseAudit(url);
    }

    /**
     * Run continuous performance monitoring
     */
    async runContinuousMonitoring(interval = 300000) { // 5 minutes default
        console.log(`🔄 Starting continuous performance monitoring (${interval}ms interval)...`);
        
        const monitoringResults = [];
        
        const runMonitoringCycle = async () => {
            try {
                const results = await this.runLighthouseAudit();
                monitoringResults.push(results);
                
                // Keep only last 24 hours of results (assuming 5-minute intervals)
                if (monitoringResults.length > 288) {
                    monitoringResults.shift();
                }
                
                // Check for performance degradation
                if (monitoringResults.length > 1) {
                    const previous = monitoringResults[monitoringResults.length - 2];
                    const current = monitoringResults[monitoringResults.length - 1];
                    
                    const regression = this.comparePerformanceResults(previous, current);
                    if (regression.regression) {
                        console.warn('⚠️  Performance regression detected:', regression.regressions);
                    }
                }
                
            } catch (error) {
                console.error('❌ Monitoring cycle failed:', error);
            }
        };
        
        // Run initial cycle
        await runMonitoringCycle();
        
        // Set up interval
        const intervalId = setInterval(runMonitoringCycle, interval);
        
        return {
            stop: () => clearInterval(intervalId),
            getResults: () => monitoringResults
        };
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LighthouseCITester;
} else if (typeof window !== 'undefined') {
    window.LighthouseCITester = LighthouseCITester;
}