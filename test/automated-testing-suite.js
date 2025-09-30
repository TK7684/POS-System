/**
 * Automated Testing Suite Integration
 * Orchestrates accessibility, performance, and cross-browser testing
 * Requirements: 10.1, 10.2, 10.3, 2.1, 2.2
 */

class AutomatedTestingSuite {
    constructor() {
        this.testModules = {
            accessibility: null,
            performance: null,
            crossBrowser: null
        };
        
        this.testResults = {
            accessibility: null,
            performance: null,
            crossBrowser: null,
            summary: null,
            timestamp: null
        };
        
        this.config = {
            runAccessibility: true,
            runPerformance: true,
            runCrossBrowser: true,
            generateReports: true,
            saveResults: true,
            continuousMonitoring: false
        };
    }

    /**
     * Initialize all testing modules
     */
    async initializeTestModules() {
        console.log('🔧 Initializing automated testing modules...');
        
        try {
            // Initialize accessibility testing
            if (this.config.runAccessibility) {
                if (typeof AxeAccessibilityTester !== 'undefined') {
                    this.testModules.accessibility = new AxeAccessibilityTester();
                } else {
                    await this.loadTestModule('accessibility');
                    this.testModules.accessibility = new AxeAccessibilityTester();
                }
            }
            
            // Initialize performance testing
            if (this.config.runPerformance) {
                if (typeof LighthouseCITester !== 'undefined') {
                    this.testModules.performance = new LighthouseCITester();
                } else {
                    await this.loadTestModule('performance');
                    this.testModules.performance = new LighthouseCITester();
                }
            }
            
            // Initialize cross-browser testing
            if (this.config.runCrossBrowser) {
                if (typeof CrossBrowserTester !== 'undefined') {
                    this.testModules.crossBrowser = new CrossBrowserTester();
                } else {
                    await this.loadTestModule('crossBrowser');
                    this.testModules.crossBrowser = new CrossBrowserTester();
                }
            }
            
            console.log('✅ All testing modules initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize testing modules:', error);
            throw error;
        }
    }

    /**
     * Load test module dynamically
     */
    async loadTestModule(moduleType) {
        const moduleMap = {
            accessibility: 'test/accessibility/axe-accessibility.test.js',
            performance: 'test/performance/lighthouse-ci.test.js',
            crossBrowser: 'test/cross-browser/browser-automation.test.js'
        };
        
        const modulePath = moduleMap[moduleType];
        if (!modulePath) {
            throw new Error(`Unknown module type: ${moduleType}`);
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = modulePath;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Run comprehensive automated testing suite
     */
    async runComprehensiveTests(options = {}) {
        console.log('🚀 Starting comprehensive automated testing suite...');
        
        // Merge options with default config
        this.config = { ...this.config, ...options };
        
        const startTime = performance.now();
        this.testResults.timestamp = new Date().toISOString();
        
        try {
            // Initialize test modules
            await this.initializeTestModules();
            
            // Run tests in parallel for better performance
            const testPromises = [];
            
            // Accessibility testing
            if (this.config.runAccessibility && this.testModules.accessibility) {
                console.log('♿ Starting accessibility testing...');
                testPromises.push(
                    this.testModules.accessibility.runAllAccessibilityTests()
                        .then(result => {
                            this.testResults.accessibility = result;
                            console.log('♿ Accessibility testing completed');
                        })
                        .catch(error => {
                            console.error('❌ Accessibility testing failed:', error);
                            this.testResults.accessibility = { error: error.message };
                        })
                );
            }
            
            // Performance testing
            if (this.config.runPerformance && this.testModules.performance) {
                console.log('⚡ Starting performance testing...');
                testPromises.push(
                    this.testModules.performance.runLighthouseAudit()
                        .then(result => {
                            this.testResults.performance = result;
                            console.log('⚡ Performance testing completed');
                        })
                        .catch(error => {
                            console.error('❌ Performance testing failed:', error);
                            this.testResults.performance = { error: error.message };
                        })
                );
            }
            
            // Cross-browser testing
            if (this.config.runCrossBrowser && this.testModules.crossBrowser) {
                console.log('🌐 Starting cross-browser testing...');
                testPromises.push(
                    this.testModules.crossBrowser.runCrossBrowserTests()
                        .then(result => {
                            this.testResults.crossBrowser = result;
                            console.log('🌐 Cross-browser testing completed');
                        })
                        .catch(error => {
                            console.error('❌ Cross-browser testing failed:', error);
                            this.testResults.crossBrowser = { error: error.message };
                        })
                );
            }
            
            // Wait for all tests to complete
            await Promise.all(testPromises);
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            // Generate comprehensive summary
            this.testResults.summary = this.generateComprehensiveSummary(totalTime);
            
            // Generate reports if requested
            if (this.config.generateReports) {
                await this.generateComprehensiveReports();
            }
            
            // Save results if requested
            if (this.config.saveResults) {
                await this.saveTestResults();
            }
            
            console.log(`🎉 Comprehensive testing completed in ${totalTime.toFixed(2)}ms:`);
            console.log(`   ♿ Accessibility: ${this.getTestStatus('accessibility')}`);
            console.log(`   ⚡ Performance: ${this.getTestStatus('performance')}`);
            console.log(`   🌐 Cross-browser: ${this.getTestStatus('crossBrowser')}`);
            console.log(`   🏆 Overall: ${this.testResults.summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
            
            return this.testResults;
            
        } catch (error) {
            console.error('❌ Comprehensive testing failed:', error);
            this.testResults.error = error.message;
            return this.testResults;
        }
    }

    /**
     * Get test status for display
     */
    getTestStatus(testType) {
        const result = this.testResults[testType];
        if (!result) return '⏭️ SKIPPED';
        if (result.error) return '❌ ERROR';
        
        switch (testType) {
            case 'accessibility':
                return result.overallPassed ? '✅ PASSED' : '❌ FAILED';
            case 'performance':
                return result.summary.passed ? '✅ PASSED' : '❌ FAILED';
            case 'crossBrowser':
                return result.summary.successRate >= 90 ? '✅ PASSED' : '❌ FAILED';
            default:
                return '❓ UNKNOWN';
        }
    }

    /**
     * Generate comprehensive summary
     */
    generateComprehensiveSummary(totalTime) {
        const summary = {
            timestamp: this.testResults.timestamp,
            totalExecutionTime: totalTime,
            testsRun: [],
            overallPassed: true,
            scores: {},
            issues: [],
            recommendations: []
        };
        
        // Process accessibility results
        if (this.testResults.accessibility && !this.testResults.accessibility.error) {
            summary.testsRun.push('accessibility');
            summary.scores.accessibility = this.testResults.accessibility.axeAudit?.summary?.overallScore || 0;
            
            if (!this.testResults.accessibility.overallPassed) {
                summary.overallPassed = false;
                summary.issues.push(...(this.testResults.accessibility.axeAudit?.recommendations || []));
            }
        }
        
        // Process performance results
        if (this.testResults.performance && !this.testResults.performance.error) {
            summary.testsRun.push('performance');
            summary.scores.performance = this.testResults.performance.summary?.overallScore || 0;
            
            if (!this.testResults.performance.summary?.passed) {
                summary.overallPassed = false;
                summary.issues.push(...(this.testResults.performance.recommendations || []));
            }
        }
        
        // Process cross-browser results
        if (this.testResults.crossBrowser && !this.testResults.crossBrowser.error) {
            summary.testsRun.push('crossBrowser');
            summary.scores.crossBrowser = this.testResults.crossBrowser.summary?.successRate || 0;
            
            if (this.testResults.crossBrowser.summary?.successRate < 90) {
                summary.overallPassed = false;
                summary.issues.push(...(this.testResults.crossBrowser.summary?.issues || []));
            }
        }
        
        // Generate overall recommendations
        summary.recommendations = this.generateOverallRecommendations();
        
        return summary;
    }

    /**
     * Generate overall recommendations
     */
    generateOverallRecommendations() {
        const recommendations = [];
        
        // Accessibility recommendations
        if (this.testResults.accessibility && this.testResults.accessibility.axeAudit) {
            const accessibilityScore = this.testResults.accessibility.axeAudit.summary.overallScore;
            if (accessibilityScore < 95) {
                recommendations.push({
                    category: 'Accessibility',
                    priority: 'high',
                    issue: `Accessibility score below threshold: ${accessibilityScore}%`,
                    solution: 'Review accessibility violations and implement fixes',
                    requirements: ['10.1', '10.2', '10.3']
                });
            }
        }
        
        // Performance recommendations
        if (this.testResults.performance && this.testResults.performance.summary) {
            const performanceScore = this.testResults.performance.summary.overallScore;
            if (performanceScore < 90) {
                recommendations.push({
                    category: 'Performance',
                    priority: 'high',
                    issue: `Performance score below threshold: ${performanceScore}%`,
                    solution: 'Optimize Core Web Vitals and implement performance best practices',
                    requirements: ['2.1', '2.2']
                });
            }
        }
        
        // Cross-browser recommendations
        if (this.testResults.crossBrowser && this.testResults.crossBrowser.summary) {
            const successRate = this.testResults.crossBrowser.summary.successRate;
            if (successRate < 90) {
                recommendations.push({
                    category: 'Cross-browser Compatibility',
                    priority: 'medium',
                    issue: `Cross-browser success rate below threshold: ${successRate}%`,
                    solution: 'Implement browser-specific fixes and polyfills',
                    requirements: ['2.1', '2.2']
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Generate comprehensive reports
     */
    async generateComprehensiveReports() {
        console.log('📊 Generating comprehensive test reports...');
        
        const reports = {
            html: await this.generateHTMLReport(),
            json: await this.generateJSONReport(),
            csv: await this.generateCSVReport()
        };
        
        return reports;
    }

    /**
     * Generate HTML report
     */
    async generateHTMLReport() {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Automated Testing Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .card.passed { border-left-color: #28a745; }
        .card.failed { border-left-color: #dc3545; }
        .card.warning { border-left-color: #ffc107; }
        .score { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .details { margin-top: 30px; }
        .section { margin-bottom: 30px; }
        .section h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .issues { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .recommendations { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .status-passed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Automated Testing Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Total execution time: ${this.testResults.summary.totalExecutionTime.toFixed(2)}ms</p>
        </div>
        
        <div class="summary">
            ${this.generateSummaryCards()}
        </div>
        
        <div class="details">
            ${this.generateDetailedSections()}
        </div>
    </div>
</body>
</html>`;
        
        return html;
    }

    /**
     * Generate summary cards for HTML report
     */
    generateSummaryCards() {
        let cards = '';
        
        // Overall status card
        const overallStatus = this.testResults.summary.overallPassed ? 'passed' : 'failed';
        cards += `
            <div class="card ${overallStatus}">
                <h3>🏆 Overall Status</h3>
                <div class="score ${overallStatus}">${this.testResults.summary.overallPassed ? 'PASSED' : 'FAILED'}</div>
                <p>Tests run: ${this.testResults.summary.testsRun.join(', ')}</p>
            </div>
        `;
        
        // Accessibility card
        if (this.testResults.accessibility && !this.testResults.accessibility.error) {
            const score = this.testResults.accessibility.axeAudit?.summary?.overallScore || 0;
            const status = score >= 95 ? 'passed' : 'failed';
            cards += `
                <div class="card ${status}">
                    <h3>♿ Accessibility</h3>
                    <div class="score">${score}%</div>
                    <p>WCAG 2.1 AA Compliance</p>
                </div>
            `;
        }
        
        // Performance card
        if (this.testResults.performance && !this.testResults.performance.error) {
            const score = this.testResults.performance.summary?.overallScore || 0;
            const status = score >= 90 ? 'passed' : 'failed';
            cards += `
                <div class="card ${status}">
                    <h3>⚡ Performance</h3>
                    <div class="score">${score}%</div>
                    <p>Lighthouse Audit</p>
                </div>
            `;
        }
        
        // Cross-browser card
        if (this.testResults.crossBrowser && !this.testResults.crossBrowser.error) {
            const score = this.testResults.crossBrowser.summary?.successRate || 0;
            const status = score >= 90 ? 'passed' : 'failed';
            cards += `
                <div class="card ${status}">
                    <h3>🌐 Cross-browser</h3>
                    <div class="score">${score}%</div>
                    <p>Browser Compatibility</p>
                </div>
            `;
        }
        
        return cards;
    }

    /**
     * Generate detailed sections for HTML report
     */
    generateDetailedSections() {
        let sections = '';
        
        // Recommendations section
        if (this.testResults.summary.recommendations.length > 0) {
            sections += `
                <div class="section">
                    <h3>📋 Recommendations</h3>
                    <div class="recommendations">
                        ${this.testResults.summary.recommendations.map(rec => `
                            <div style="margin-bottom: 15px;">
                                <strong>${rec.category} (${rec.priority} priority):</strong><br>
                                <em>Issue:</em> ${rec.issue}<br>
                                <em>Solution:</em> ${rec.solution}<br>
                                <em>Requirements:</em> ${rec.requirements?.join(', ') || 'N/A'}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Issues section
        if (this.testResults.summary.issues.length > 0) {
            sections += `
                <div class="section">
                    <h3>⚠️ Issues Found</h3>
                    <div class="issues">
                        ${this.testResults.summary.issues.slice(0, 10).map(issue => `
                            <div style="margin-bottom: 10px;">
                                <strong>${issue.priority || 'medium'} priority:</strong> ${issue.issue || issue.message || JSON.stringify(issue)}
                            </div>
                        `).join('')}
                        ${this.testResults.summary.issues.length > 10 ? `<p><em>... and ${this.testResults.summary.issues.length - 10} more issues</em></p>` : ''}
                    </div>
                </div>
            `;
        }
        
        return sections;
    }

    /**
     * Generate JSON report
     */
    async generateJSONReport() {
        return JSON.stringify(this.testResults, null, 2);
    }

    /**
     * Generate CSV report
     */
    async generateCSVReport() {
        const csvData = [];
        
        // Header
        csvData.push(['Test Type', 'Status', 'Score', 'Issues', 'Timestamp']);
        
        // Accessibility row
        if (this.testResults.accessibility) {
            const score = this.testResults.accessibility.axeAudit?.summary?.overallScore || 0;
            const status = this.testResults.accessibility.overallPassed ? 'PASSED' : 'FAILED';
            const issues = this.testResults.accessibility.axeAudit?.summary?.totalViolations || 0;
            csvData.push(['Accessibility', status, score, issues, this.testResults.timestamp]);
        }
        
        // Performance row
        if (this.testResults.performance) {
            const score = this.testResults.performance.summary?.overallScore || 0;
            const status = this.testResults.performance.summary?.passed ? 'PASSED' : 'FAILED';
            const issues = this.testResults.performance.recommendations?.length || 0;
            csvData.push(['Performance', status, score, issues, this.testResults.timestamp]);
        }
        
        // Cross-browser row
        if (this.testResults.crossBrowser) {
            const score = this.testResults.crossBrowser.summary?.successRate || 0;
            const status = score >= 90 ? 'PASSED' : 'FAILED';
            const issues = this.testResults.crossBrowser.summary?.issues?.length || 0;
            csvData.push(['Cross-browser', status, score, issues, this.testResults.timestamp]);
        }
        
        return csvData.map(row => row.join(',')).join('\n');
    }

    /**
     * Save test results
     */
    async saveTestResults() {
        console.log('💾 Saving test results...');
        
        try {
            // Save to localStorage for persistence
            const resultsKey = `automated-test-results-${Date.now()}`;
            localStorage.setItem(resultsKey, JSON.stringify(this.testResults));
            
            // Keep only last 10 test results
            const allKeys = Object.keys(localStorage).filter(key => key.startsWith('automated-test-results-'));
            if (allKeys.length > 10) {
                allKeys.sort().slice(0, -10).forEach(key => localStorage.removeItem(key));
            }
            
            console.log(`💾 Test results saved with key: ${resultsKey}`);
            
        } catch (error) {
            console.error('❌ Failed to save test results:', error);
        }
    }

    /**
     * Load previous test results
     */
    async loadTestResults(key = null) {
        try {
            if (!key) {
                // Get the most recent results
                const allKeys = Object.keys(localStorage).filter(key => key.startsWith('automated-test-results-'));
                if (allKeys.length === 0) return null;
                key = allKeys.sort().pop();
            }
            
            const results = localStorage.getItem(key);
            return results ? JSON.parse(results) : null;
            
        } catch (error) {
            console.error('❌ Failed to load test results:', error);
            return null;
        }
    }

    /**
     * Start continuous monitoring
     */
    async startContinuousMonitoring(interval = 300000) { // 5 minutes default
        console.log(`🔄 Starting continuous automated testing (${interval}ms interval)...`);
        
        const monitoringResults = [];
        
        const runMonitoringCycle = async () => {
            try {
                console.log('🔄 Running monitoring cycle...');
                const results = await this.runComprehensiveTests({
                    generateReports: false,
                    saveResults: true
                });
                
                monitoringResults.push(results);
                
                // Keep only last 24 hours of results
                if (monitoringResults.length > 288) { // Assuming 5-minute intervals
                    monitoringResults.shift();
                }
                
                // Check for regressions
                if (monitoringResults.length > 1) {
                    const previous = monitoringResults[monitoringResults.length - 2];
                    const current = monitoringResults[monitoringResults.length - 1];
                    
                    this.checkForRegressions(previous, current);
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
            stop: () => {
                clearInterval(intervalId);
                console.log('🛑 Continuous monitoring stopped');
            },
            getResults: () => monitoringResults
        };
    }

    /**
     * Check for regressions between test runs
     */
    checkForRegressions(previous, current) {
        const regressions = [];
        
        // Check accessibility regression
        if (previous.accessibility && current.accessibility) {
            const prevScore = previous.accessibility.axeAudit?.summary?.overallScore || 0;
            const currScore = current.accessibility.axeAudit?.summary?.overallScore || 0;
            if (currScore < prevScore - 5) { // 5% threshold
                regressions.push({
                    type: 'accessibility',
                    previous: prevScore,
                    current: currScore,
                    change: currScore - prevScore
                });
            }
        }
        
        // Check performance regression
        if (previous.performance && current.performance) {
            const prevScore = previous.performance.summary?.overallScore || 0;
            const currScore = current.performance.summary?.overallScore || 0;
            if (currScore < prevScore - 5) { // 5% threshold
                regressions.push({
                    type: 'performance',
                    previous: prevScore,
                    current: currScore,
                    change: currScore - prevScore
                });
            }
        }
        
        // Check cross-browser regression
        if (previous.crossBrowser && current.crossBrowser) {
            const prevScore = previous.crossBrowser.summary?.successRate || 0;
            const currScore = current.crossBrowser.summary?.successRate || 0;
            if (currScore < prevScore - 5) { // 5% threshold
                regressions.push({
                    type: 'crossBrowser',
                    previous: prevScore,
                    current: currScore,
                    change: currScore - prevScore
                });
            }
        }
        
        if (regressions.length > 0) {
            console.warn('⚠️  Regressions detected:', regressions);
            // In production, this could trigger alerts or notifications
        }
    }

    /**
     * Get test history
     */
    async getTestHistory(limit = 10) {
        const allKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('automated-test-results-'))
            .sort()
            .slice(-limit);
        
        const history = [];
        for (const key of allKeys) {
            const results = await this.loadTestResults(key);
            if (results) {
                history.push({
                    key: key,
                    timestamp: results.timestamp,
                    summary: results.summary
                });
            }
        }
        
        return history;
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedTestingSuite;
} else if (typeof window !== 'undefined') {
    window.AutomatedTestingSuite = AutomatedTestingSuite;
}