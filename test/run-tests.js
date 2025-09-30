/**
 * Test Runner for Automated Testing Suite
 * Entry point for running accessibility, performance, and cross-browser tests
 * Requirements: 10.1, 10.2, 10.3, 2.1, 2.2
 */

class TestRunner {
    constructor() {
        this.config = null;
        this.testSuite = null;
        this.results = null;
    }

    /**
     * Initialize test runner
     */
    async initialize() {
        console.log('🚀 Initializing Test Runner...');
        
        try {
            // Load configuration
            await this.loadConfiguration();
            
            // Initialize test suite
            this.testSuite = new AutomatedTestingSuite();
            
            console.log('✅ Test Runner initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Test Runner:', error);
            throw error;
        }
    }

    /**
     * Load test configuration
     */
    async loadConfiguration() {
        try {
            // Try to load from file first
            const response = await fetch('test/testing-config.json');
            if (response.ok) {
                this.config = await response.json();
            } else {
                // Fallback to default configuration
                this.config = this.getDefaultConfiguration();
            }
            
            console.log('📋 Configuration loaded:', Object.keys(this.config));
            
        } catch (error) {
            console.warn('⚠️  Failed to load configuration file, using defaults:', error);
            this.config = this.getDefaultConfiguration();
        }
    }

    /**
     * Get default configuration
     */
    getDefaultConfiguration() {
        return {
            accessibility: { enabled: true },
            performance: { enabled: true },
            crossBrowser: { enabled: true },
            reporting: { enabled: true, formats: ['html', 'json'] },
            environment: { timeout: 30000, retries: 3 }
        };
    }

    /**
     * Run all tests
     */
    async runAllTests(options = {}) {
        console.log('🧪 Starting comprehensive test execution...');
        
        try {
            await this.initialize();
            
            // Merge configuration with options
            const testOptions = {
                runAccessibility: this.config.accessibility?.enabled ?? true,
                runPerformance: this.config.performance?.enabled ?? true,
                runCrossBrowser: this.config.crossBrowser?.enabled ?? true,
                generateReports: this.config.reporting?.enabled ?? true,
                saveResults: this.config.reporting?.saveResults ?? true,
                ...options
            };
            
            // Run comprehensive tests
            this.results = await this.testSuite.runComprehensiveTests(testOptions);
            
            // Display results summary
            this.displayResultsSummary();
            
            // Handle CI/CD integration
            if (this.config.ci?.enabled) {
                await this.handleCIIntegration();
            }
            
            return this.results;
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            throw error;
        }
    }

    /**
     * Run specific test type
     */
    async runSpecificTest(testType, options = {}) {
        console.log(`🔍 Running ${testType} tests...`);
        
        try {
            await this.initialize();
            
            const testOptions = {
                runAccessibility: testType === 'accessibility',
                runPerformance: testType === 'performance',
                runCrossBrowser: testType === 'crossBrowser',
                generateReports: true,
                saveResults: true,
                ...options
            };
            
            this.results = await this.testSuite.runComprehensiveTests(testOptions);
            
            return this.results[testType];
            
        } catch (error) {
            console.error(`❌ ${testType} test failed:`, error);
            throw error;
        }
    }

    /**
     * Run accessibility tests only
     */
    async runAccessibilityTests(options = {}) {
        return await this.runSpecificTest('accessibility', options);
    }

    /**
     * Run performance tests only
     */
    async runPerformanceTests(options = {}) {
        return await this.runSpecificTest('performance', options);
    }

    /**
     * Run cross-browser tests only
     */
    async runCrossBrowserTests(options = {}) {
        return await this.runSpecificTest('crossBrowser', options);
    }

    /**
     * Display results summary
     */
    displayResultsSummary() {
        if (!this.results || !this.results.summary) {
            console.log('❓ No results to display');
            return;
        }
        
        const summary = this.results.summary;
        
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('========================');
        console.log(`🕐 Execution Time: ${summary.totalExecutionTime.toFixed(2)}ms`);
        console.log(`📅 Timestamp: ${summary.timestamp}`);
        console.log(`🧪 Tests Run: ${summary.testsRun.join(', ')}`);
        console.log(`🏆 Overall Status: ${summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
        
        // Display individual test scores
        if (summary.scores) {
            console.log('\n📈 INDIVIDUAL SCORES');
            console.log('====================');
            
            if (summary.scores.accessibility !== undefined) {
                console.log(`♿ Accessibility: ${summary.scores.accessibility}%`);
            }
            
            if (summary.scores.performance !== undefined) {
                console.log(`⚡ Performance: ${summary.scores.performance}%`);
            }
            
            if (summary.scores.crossBrowser !== undefined) {
                console.log(`🌐 Cross-browser: ${summary.scores.crossBrowser}%`);
            }
        }
        
        // Display recommendations
        if (summary.recommendations && summary.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS');
            console.log('==================');
            
            summary.recommendations.slice(0, 5).forEach((rec, index) => {
                console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.category}`);
                console.log(`   Issue: ${rec.issue}`);
                console.log(`   Solution: ${rec.solution}`);
                if (rec.requirements) {
                    console.log(`   Requirements: ${rec.requirements.join(', ')}`);
                }
                console.log('');
            });
            
            if (summary.recommendations.length > 5) {
                console.log(`   ... and ${summary.recommendations.length - 5} more recommendations`);
            }
        }
        
        // Display issues
        if (summary.issues && summary.issues.length > 0) {
            console.log('\n⚠️  ISSUES FOUND');
            console.log('================');
            
            summary.issues.slice(0, 3).forEach((issue, index) => {
                const issueText = issue.issue || issue.message || JSON.stringify(issue);
                console.log(`${index + 1}. ${issueText}`);
            });
            
            if (summary.issues.length > 3) {
                console.log(`   ... and ${summary.issues.length - 3} more issues`);
            }
        }
        
        console.log('\n========================\n');
    }

    /**
     * Handle CI/CD integration
     */
    async handleCIIntegration() {
        if (!this.config.ci) return;
        
        const ciConfig = this.config.ci;
        const summary = this.results.summary;
        
        // Check for regressions
        if (ciConfig.failOnRegression) {
            const previousResults = await this.testSuite.loadTestResults();
            if (previousResults) {
                const hasRegression = this.checkForRegression(previousResults, this.results);
                if (hasRegression) {
                    console.error('❌ Regression detected - failing CI build');
                    process.exit(1);
                }
            }
        }
        
        // Check required tests
        if (ciConfig.requiredTests) {
            const missingTests = ciConfig.requiredTests.filter(test => 
                !summary.testsRun.includes(test)
            );
            
            if (missingTests.length > 0) {
                console.error(`❌ Required tests not run: ${missingTests.join(', ')}`);
                process.exit(1);
            }
        }
        
        // Check overall pass/fail
        if (!summary.overallPassed) {
            console.error('❌ Tests failed - failing CI build');
            process.exit(1);
        }
        
        // Send webhooks
        if (summary.overallPassed && ciConfig.webhooks?.onSuccess) {
            await this.sendWebhook(ciConfig.webhooks.onSuccess, 'success');
        } else if (!summary.overallPassed && ciConfig.webhooks?.onFailure) {
            await this.sendWebhook(ciConfig.webhooks.onFailure, 'failure');
        }
        
        console.log('✅ CI integration checks passed');
    }

    /**
     * Check for regression between test runs
     */
    checkForRegression(previous, current) {
        const threshold = this.config.ci.regressionThreshold || 5;
        
        // Check accessibility regression
        if (previous.accessibility && current.accessibility) {
            const prevScore = previous.accessibility.axeAudit?.summary?.overallScore || 0;
            const currScore = current.accessibility.axeAudit?.summary?.overallScore || 0;
            if (currScore < prevScore - threshold) {
                console.warn(`⚠️  Accessibility regression: ${prevScore}% → ${currScore}%`);
                return true;
            }
        }
        
        // Check performance regression
        if (previous.performance && current.performance) {
            const prevScore = previous.performance.summary?.overallScore || 0;
            const currScore = current.performance.summary?.overallScore || 0;
            if (currScore < prevScore - threshold) {
                console.warn(`⚠️  Performance regression: ${prevScore}% → ${currScore}%`);
                return true;
            }
        }
        
        // Check cross-browser regression
        if (previous.crossBrowser && current.crossBrowser) {
            const prevScore = previous.crossBrowser.summary?.successRate || 0;
            const currScore = current.crossBrowser.summary?.successRate || 0;
            if (currScore < prevScore - threshold) {
                console.warn(`⚠️  Cross-browser regression: ${prevScore}% → ${currScore}%`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Send webhook notification
     */
    async sendWebhook(url, status) {
        try {
            const payload = {
                status: status,
                timestamp: this.results.timestamp,
                summary: this.results.summary,
                url: window.location.href
            };
            
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log(`📡 Webhook sent: ${status}`);
            
        } catch (error) {
            console.error('❌ Failed to send webhook:', error);
        }
    }

    /**
     * Start continuous monitoring
     */
    async startMonitoring(interval = 300000) {
        console.log('🔄 Starting continuous monitoring...');
        
        await this.initialize();
        
        return await this.testSuite.startContinuousMonitoring(interval);
    }

    /**
     * Get test history
     */
    async getTestHistory(limit = 10) {
        await this.initialize();
        return await this.testSuite.getTestHistory(limit);
    }

    /**
     * Generate reports
     */
    async generateReports() {
        if (!this.results) {
            console.error('❌ No test results available for report generation');
            return null;
        }
        
        console.log('📊 Generating test reports...');
        
        return await this.testSuite.generateComprehensiveReports();
    }

    /**
     * Export results
     */
    async exportResults(format = 'json') {
        if (!this.results) {
            console.error('❌ No test results available for export');
            return null;
        }
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(this.results, null, 2);
            case 'csv':
                return await this.testSuite.generateCSVReport();
            case 'html':
                return await this.testSuite.generateHTMLReport();
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
}

// CLI interface for Node.js environments
if (typeof process !== 'undefined' && process.argv) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const runner = new TestRunner();
    
    switch (command) {
        case 'all':
            runner.runAllTests().catch(console.error);
            break;
        case 'accessibility':
            runner.runAccessibilityTests().catch(console.error);
            break;
        case 'performance':
            runner.runPerformanceTests().catch(console.error);
            break;
        case 'cross-browser':
            runner.runCrossBrowserTests().catch(console.error);
            break;
        case 'monitor':
            const interval = parseInt(args[1]) || 300000;
            runner.startMonitoring(interval).catch(console.error);
            break;
        case 'history':
            const limit = parseInt(args[1]) || 10;
            runner.getTestHistory(limit).then(console.log).catch(console.error);
            break;
        default:
            console.log(`
Usage: node test/run-tests.js <command> [options]

Commands:
  all              Run all tests (accessibility, performance, cross-browser)
  accessibility    Run accessibility tests only
  performance      Run performance tests only
  cross-browser    Run cross-browser tests only
  monitor [ms]     Start continuous monitoring (default: 5 minutes)
  history [limit]  Show test history (default: 10 results)

Examples:
  node test/run-tests.js all
  node test/run-tests.js accessibility
  node test/run-tests.js monitor 600000
  node test/run-tests.js history 5
            `);
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestRunner;
} else if (typeof window !== 'undefined') {
    window.TestRunner = TestRunner;
}