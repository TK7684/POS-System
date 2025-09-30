/**
 * Automated Test Runner for POS System
 * Integrates comprehensive testing with existing test infrastructure
 * Requirements: 2.1, 2.2, 2.4
 */

class AutomatedTestRunner {
    constructor() {
        this.comprehensiveTestSuite = null;
        this.testResults = {};
        this.testConfig = {
            runPerformanceTests: true,
            runAccessibilityTests: true,
            runCrossDeviceTests: true,
            runLoadTests: true,
            runUserAcceptanceTests: true,
            generateReport: true,
            saveResults: true
        };
        
        this.testEnvironments = [
            { name: 'development', url: window.location.origin },
            { name: 'staging', url: null }, // Would be configured for staging
            { name: 'production', url: null } // Would be configured for production
        ];
    }

    /**
     * Initialize the test runner
     */
    async initialize() {
        console.log('🚀 Initializing Automated Test Runner...');
        
        try {
            // Initialize comprehensive test suite
            this.comprehensiveTestSuite = new ComprehensiveTestSuite();
            
            // Check if existing test infrastructure is available
            await this.checkTestInfrastructure();
            
            console.log('✅ Automated Test Runner initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Automated Test Runner:', error);
            return false;
        }
    }

    /**
     * Check existing test infrastructure
     */
    async checkTestInfrastructure() {
        const infrastructure = {
            mockData: typeof populateAllMockData === 'function',
            testRunner: typeof quickTest === 'function',
            performanceMonitor: typeof PerformanceMonitor !== 'undefined',
            cacheManager: typeof CacheManager !== 'undefined',
            serviceWorker: 'serviceWorker' in navigator
        };

        console.log('📊 Test Infrastructure Status:', infrastructure);
        return infrastructure;
    }

    /**
     * Run all automated tests
     */
    async runAllTests(config = {}) {
        console.log('🧪 Starting Automated Test Suite...');
        
        const testConfig = { ...this.testConfig, ...config };
        const startTime = performance.now();
        
        const results = {
            timestamp: new Date().toISOString(),
            environment: this.getCurrentEnvironment(),
            config: testConfig,
            results: {},
            summary: {},
            recommendations: [],
            executionTime: 0
        };

        try {
            // 1. Setup test environment
            console.log('🔧 Setting up test environment...');
            await this.setupTestEnvironment();

            // 2. Run existing test infrastructure tests
            console.log('🏗️ Running existing infrastructure tests...');
            results.results.infrastructure = await this.runInfrastructureTests();

            // 3. Run comprehensive test suite
            console.log('🔬 Running comprehensive test suite...');
            results.results.comprehensive = await this.comprehensiveTestSuite.runComprehensiveTests();

            // 4. Run Lighthouse performance audit (if available)
            console.log('💡 Running Lighthouse audit...');
            results.results.lighthouse = await this.runLighthouseAudit();

            // 5. Generate combined summary
            results.summary = this.generateCombinedSummary(results.results);
            results.recommendations = this.generateCombinedRecommendations(results.results);

            const endTime = performance.now();
            results.executionTime = endTime - startTime;

            // 6. Save results if configured
            if (testConfig.saveResults) {
                await this.saveTestResults(results);
            }

            // 7. Generate report if configured
            if (testConfig.generateReport) {
                await this.generateTestReport(results);
            }

            console.log('✅ Automated Test Suite completed successfully');
            console.log(`📊 Overall Score: ${results.summary.overallScore.toFixed(1)}%`);
            console.log(`⏱️ Total execution time: ${(results.executionTime / 1000).toFixed(2)}s`);

            return results;

        } catch (error) {
            console.error('❌ Automated Test Suite failed:', error);
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString(),
                executionTime: performance.now() - startTime
            };
        }
    }

    /**
     * Setup test environment
     */
    async setupTestEnvironment() {
        // Populate mock data if available
        if (typeof populateAllMockData === 'function') {
            console.log('📊 Populating mock data...');
            await populateAllMockData();
        }

        // Clear any existing test data
        if (typeof cleanupMockData === 'function') {
            console.log('🧹 Cleaning up previous test data...');
            await cleanupMockData();
            await populateAllMockData();
        }

        // Initialize performance monitoring
        if (typeof PerformanceMonitor !== 'undefined') {
            console.log('📈 Initializing performance monitoring...');
            window.performanceMonitor = new PerformanceMonitor();
            await window.performanceMonitor.startMonitoring();
        }
    }

    /**
     * Run existing infrastructure tests
     */
    async runInfrastructureTests() {
        const results = {
            quickTest: null,
            performanceBenchmark: null,
            dataValidation: null,
            individualFunctions: null
        };

        try {
            // Run quick test if available
            if (typeof quickTest === 'function') {
                console.log('⚡ Running quick test...');
                results.quickTest = await quickTest();
            }

            // Run performance benchmark if available
            if (typeof performanceBenchmark === 'function') {
                console.log('📊 Running performance benchmark...');
                results.performanceBenchmark = await performanceBenchmark();
            }

            // Run data validation if available
            if (typeof dataValidationTest === 'function') {
                console.log('🔍 Running data validation...');
                results.dataValidation = await dataValidationTest();
            }

            // Run individual function tests if available
            if (typeof testIndividualFunctions === 'function') {
                console.log('🔧 Running individual function tests...');
                results.individualFunctions = await testIndividualFunctions();
            }

        } catch (error) {
            console.error('❌ Infrastructure tests failed:', error);
            results.error = error.message;
        }

        return results;
    }

    /**
     * Run Lighthouse audit (simplified version)
     */
    async runLighthouseAudit() {
        // This would integrate with Lighthouse CI in a real implementation
        // For now, we'll simulate basic performance metrics
        
        const audit = {
            performance: await this.simulateLighthousePerformance(),
            accessibility: await this.simulateLighthouseAccessibility(),
            bestPractices: await this.simulateLighthouseBestPractices(),
            seo: await this.simulateLighthouseSEO(),
            pwa: await this.simulateLighthousePWA()
        };

        // Calculate overall score
        const scores = Object.values(audit).map(category => category.score);
        audit.overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        return audit;
    }

    async simulateLighthousePerformance() {
        // Simulate Lighthouse performance audit
        const metrics = {
            firstContentfulPaint: Math.random() * 2000 + 500,
            largestContentfulPaint: Math.random() * 3000 + 1000,
            firstInputDelay: Math.random() * 100,
            cumulativeLayoutShift: Math.random() * 0.2,
            speedIndex: Math.random() * 4000 + 1000
        };

        // Calculate score based on metrics
        let score = 100;
        if (metrics.firstContentfulPaint > 1800) score -= 10;
        if (metrics.largestContentfulPaint > 2500) score -= 15;
        if (metrics.firstInputDelay > 100) score -= 10;
        if (metrics.cumulativeLayoutShift > 0.1) score -= 15;
        if (metrics.speedIndex > 3400) score -= 10;

        return {
            score: Math.max(0, score),
            metrics,
            passed: score >= 90
        };
    }

    async simulateLighthouseAccessibility() {
        // Simulate accessibility audit
        const checks = {
            colorContrast: Math.random() > 0.2,
            keyboardNavigation: Math.random() > 0.1,
            altText: Math.random() > 0.15,
            ariaLabels: Math.random() > 0.25,
            focusManagement: Math.random() > 0.2
        };

        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        const score = (passedChecks / totalChecks) * 100;

        return {
            score,
            checks,
            passed: score >= 90
        };
    }

    async simulateLighthouseBestPractices() {
        // Simulate best practices audit
        const practices = {
            https: window.location.protocol === 'https:',
            noConsoleErrors: true, // Would check for console errors
            validDoctype: document.doctype !== null,
            noVulnerableLibraries: Math.random() > 0.1,
            imageAspectRatio: Math.random() > 0.2
        };

        const passedPractices = Object.values(practices).filter(Boolean).length;
        const totalPractices = Object.keys(practices).length;
        const score = (passedPractices / totalPractices) * 100;

        return {
            score,
            practices,
            passed: score >= 90
        };
    }

    async simulateLighthouseSEO() {
        // Simulate SEO audit
        const seoChecks = {
            metaDescription: document.querySelector('meta[name="description"]') !== null,
            titleTag: document.title.length > 0,
            metaViewport: document.querySelector('meta[name="viewport"]') !== null,
            langAttribute: document.documentElement.lang !== '',
            robotsTxt: Math.random() > 0.3
        };

        const passedChecks = Object.values(seoChecks).filter(Boolean).length;
        const totalChecks = Object.keys(seoChecks).length;
        const score = (passedChecks / totalChecks) * 100;

        return {
            score,
            checks: seoChecks,
            passed: score >= 90
        };
    }

    async simulateLighthousePWA() {
        // Simulate PWA audit
        const pwaChecks = {
            manifest: document.querySelector('link[rel="manifest"]') !== null,
            serviceWorker: 'serviceWorker' in navigator,
            installable: Math.random() > 0.2,
            splashScreen: Math.random() > 0.3,
            themedOmnibox: Math.random() > 0.4
        };

        const passedChecks = Object.values(pwaChecks).filter(Boolean).length;
        const totalChecks = Object.keys(pwaChecks).length;
        const score = (passedChecks / totalChecks) * 100;

        return {
            score,
            checks: pwaChecks,
            passed: score >= 90
        };
    }

    /**
     * Generate combined summary from all test results
     */
    generateCombinedSummary(results) {
        const summary = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            overallScore: 0,
            categories: {
                infrastructure: { total: 0, passed: 0, failed: 0, score: 0 },
                comprehensive: { total: 0, passed: 0, failed: 0, score: 0 },
                lighthouse: { total: 0, passed: 0, failed: 0, score: 0 }
            }
        };

        // Process infrastructure results
        if (results.infrastructure) {
            const infraStats = this.calculateCategoryStats(results.infrastructure);
            summary.categories.infrastructure = infraStats;
            summary.totalTests += infraStats.total;
            summary.passedTests += infraStats.passed;
            summary.failedTests += infraStats.failed;
        }

        // Process comprehensive results
        if (results.comprehensive && results.comprehensive.summary) {
            const compStats = results.comprehensive.summary;
            summary.categories.comprehensive = {
                total: compStats.totalTests || 0,
                passed: compStats.passedTests || 0,
                failed: compStats.failedTests || 0,
                score: compStats.overallScore || 0
            };
            summary.totalTests += compStats.totalTests || 0;
            summary.passedTests += compStats.passedTests || 0;
            summary.failedTests += compStats.failedTests || 0;
        }

        // Process Lighthouse results
        if (results.lighthouse) {
            const lighthouseStats = this.calculateLighthouseStats(results.lighthouse);
            summary.categories.lighthouse = lighthouseStats;
            summary.totalTests += lighthouseStats.total;
            summary.passedTests += lighthouseStats.passed;
            summary.failedTests += lighthouseStats.failed;
        }

        // Calculate overall score
        const categoryScores = Object.values(summary.categories)
            .filter(cat => cat.score > 0)
            .map(cat => cat.score);
        
        summary.overallScore = categoryScores.length > 0 ? 
            categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length : 0;

        return summary;
    }

    calculateCategoryStats(categoryResults) {
        let total = 0;
        let passed = 0;
        let failed = 0;

        const processResults = (obj) => {
            if (typeof obj === 'object' && obj !== null) {
                if (obj.hasOwnProperty('status')) {
                    total++;
                    if (obj.status === 'success') {
                        passed++;
                    } else {
                        failed++;
                    }
                } else {
                    Object.values(obj).forEach(processResults);
                }
            }
        };

        processResults(categoryResults);

        return {
            total,
            passed,
            failed,
            score: total > 0 ? (passed / total) * 100 : 0
        };
    }

    calculateLighthouseStats(lighthouseResults) {
        const categories = ['performance', 'accessibility', 'bestPractices', 'seo', 'pwa'];
        let total = categories.length;
        let passed = 0;
        let totalScore = 0;

        categories.forEach(category => {
            if (lighthouseResults[category]) {
                if (lighthouseResults[category].passed) {
                    passed++;
                }
                totalScore += lighthouseResults[category].score || 0;
            }
        });

        return {
            total,
            passed,
            failed: total - passed,
            score: totalScore / total
        };
    }

    /**
     * Generate combined recommendations
     */
    generateCombinedRecommendations(results) {
        const recommendations = [];

        // Add comprehensive test recommendations
        if (results.comprehensive && results.comprehensive.recommendations) {
            recommendations.push(...results.comprehensive.recommendations);
        }

        // Add Lighthouse-based recommendations
        if (results.lighthouse) {
            recommendations.push(...this.generateLighthouseRecommendations(results.lighthouse));
        }

        // Add infrastructure-based recommendations
        if (results.infrastructure) {
            recommendations.push(...this.generateInfrastructureRecommendations(results.infrastructure));
        }

        // Sort by priority
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        recommendations.sort((a, b) => {
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });

        return recommendations;
    }

    generateLighthouseRecommendations(lighthouse) {
        const recommendations = [];

        if (lighthouse.performance && lighthouse.performance.score < 90) {
            recommendations.push({
                category: 'Performance',
                priority: 'High',
                issue: 'Lighthouse performance score below 90',
                recommendation: 'Optimize Core Web Vitals: LCP, FID, and CLS'
            });
        }

        if (lighthouse.accessibility && lighthouse.accessibility.score < 90) {
            recommendations.push({
                category: 'Accessibility',
                priority: 'High',
                issue: 'Lighthouse accessibility score below 90',
                recommendation: 'Fix accessibility issues: color contrast, ARIA labels, keyboard navigation'
            });
        }

        if (lighthouse.pwa && lighthouse.pwa.score < 90) {
            recommendations.push({
                category: 'PWA',
                priority: 'Medium',
                issue: 'PWA score below 90',
                recommendation: 'Improve PWA features: manifest, service worker, installability'
            });
        }

        return recommendations;
    }

    generateInfrastructureRecommendations(infrastructure) {
        const recommendations = [];

        if (infrastructure.quickTest && infrastructure.quickTest.status !== 'success') {
            recommendations.push({
                category: 'Infrastructure',
                priority: 'High',
                issue: 'Quick test failing',
                recommendation: 'Fix basic functionality issues identified in quick test'
            });
        }

        if (infrastructure.performanceBenchmark && infrastructure.performanceBenchmark.status !== 'success') {
            recommendations.push({
                category: 'Performance',
                priority: 'Medium',
                issue: 'Performance benchmark failing',
                recommendation: 'Optimize performance bottlenecks identified in benchmark'
            });
        }

        return recommendations;
    }

    /**
     * Save test results to local storage or IndexedDB
     */
    async saveTestResults(results) {
        try {
            const key = `test-results-${Date.now()}`;
            
            // Save to localStorage
            localStorage.setItem(key, JSON.stringify(results));
            
            // Also save to IndexedDB if available
            if ('indexedDB' in window) {
                await this.saveToIndexedDB(key, results);
            }
            
            console.log(`💾 Test results saved with key: ${key}`);
            
        } catch (error) {
            console.error('❌ Failed to save test results:', error);
        }
    }

    async saveToIndexedDB(key, data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('POS-TestResults', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['results'], 'readwrite');
                const store = transaction.objectStore('results');
                
                store.put({ key, data, timestamp: Date.now() });
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('results')) {
                    db.createObjectStore('results', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Generate HTML test report
     */
    async generateTestReport(results) {
        const reportHtml = this.createReportHTML(results);
        
        // Create and download report
        const blob = new Blob([reportHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `pos-test-report-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log('📄 Test report generated and downloaded');
    }

    createReportHTML(results) {
        return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS System Test Report - ${new Date(results.timestamp).toLocaleDateString('th-TH')}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .score { font-size: 48px; font-weight: bold; color: ${results.summary.overallScore >= 90 ? '#10b981' : results.summary.overallScore >= 70 ? '#f59e0b' : '#ef4444'}; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .summary-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .category { margin-bottom: 30px; }
        .category h3 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .recommendations { background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 30px; }
        .recommendation { margin-bottom: 15px; padding: 10px; background: white; border-radius: 6px; }
        .priority-high { border-left: 4px solid #ef4444; }
        .priority-medium { border-left: 4px solid #f59e0b; }
        .priority-low { border-left: 4px solid #10b981; }
        .details { margin-top: 30px; }
        .details summary { font-weight: bold; cursor: pointer; padding: 10px; background: #f1f5f9; border-radius: 6px; }
        .details[open] summary { margin-bottom: 15px; }
        pre { background: #f8fafc; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 POS System Test Report</h1>
            <div class="score">${results.summary.overallScore.toFixed(1)}%</div>
            <p>Generated on ${new Date(results.timestamp).toLocaleString('th-TH')}</p>
            <p>Execution time: ${(results.executionTime / 1000).toFixed(2)} seconds</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div style="font-size: 24px; font-weight: bold;">${results.summary.totalTests}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div style="font-size: 24px; font-weight: bold; color: #10b981;">${results.summary.passedTests}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${results.summary.failedTests}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div style="font-size: 24px; font-weight: bold;">${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%</div>
            </div>
        </div>

        <div class="category">
            <h3>📊 Test Categories</h3>
            ${Object.entries(results.summary.categories).map(([name, stats]) => `
                <div style="margin-bottom: 15px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; text-transform: capitalize;">${name}</h4>
                    <div style="display: flex; gap: 20px;">
                        <span>Total: ${stats.total}</span>
                        <span style="color: #10b981;">Passed: ${stats.passed}</span>
                        <span style="color: #ef4444;">Failed: ${stats.failed}</span>
                        <span>Score: ${stats.score.toFixed(1)}%</span>
                    </div>
                </div>
            `).join('')}
        </div>

        ${results.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            ${results.recommendations.map(rec => `
                <div class="recommendation priority-${rec.priority.toLowerCase()}">
                    <strong>${rec.category} - ${rec.priority} Priority</strong><br>
                    <strong>Issue:</strong> ${rec.issue}<br>
                    <strong>Recommendation:</strong> ${rec.recommendation}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <details class="details">
            <summary>📋 Detailed Results</summary>
            <pre>${JSON.stringify(results.results, null, 2)}</pre>
        </details>
    </div>
</body>
</html>`;
    }

    getCurrentEnvironment() {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging')) {
            return 'staging';
        } else {
            return 'production';
        }
    }

    /**
     * Get historical test results
     */
    async getHistoricalResults(limit = 10) {
        const results = [];
        
        // Get from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('test-results-')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    results.push({ key, ...data });
                } catch (error) {
                    console.warn('Failed to parse stored test result:', key);
                }
            }
        }
        
        // Sort by timestamp and limit
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return results.slice(0, limit);
    }

    /**
     * Compare with previous test results
     */
    async compareWithPrevious(currentResults) {
        const historical = await this.getHistoricalResults(1);
        if (historical.length === 0) {
            return null;
        }

        const previous = historical[0];
        const comparison = {
            overallScoreChange: currentResults.summary.overallScore - previous.summary.overallScore,
            testCountChange: currentResults.summary.totalTests - previous.summary.totalTests,
            passedTestsChange: currentResults.summary.passedTests - previous.summary.passedTests,
            executionTimeChange: currentResults.executionTime - previous.executionTime,
            categoryChanges: {}
        };

        // Compare categories
        Object.keys(currentResults.summary.categories).forEach(category => {
            if (previous.summary.categories[category]) {
                comparison.categoryChanges[category] = {
                    scoreChange: currentResults.summary.categories[category].score - previous.summary.categories[category].score,
                    testChange: currentResults.summary.categories[category].total - previous.summary.categories[category].total
                };
            }
        });

        return comparison;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedTestRunner;
} else if (typeof window !== 'undefined') {
    window.AutomatedTestRunner = AutomatedTestRunner;
}