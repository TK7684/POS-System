/**
 * Comprehensive Test Execution Script
 * Executes all test modules and validates results against requirements
 * Task 16.2: Run complete test suite and validate results
 */

class ComprehensiveTestExecutor {
    constructor() {
        this.testModules = [];
        this.testResults = {};
        this.requirementCoverage = {};
        this.startTime = null;
        this.endTime = null;
        this.config = null;
    }

    /**
     * Initialize test executor
     */
    async initialize() {
        console.log('🚀 Initializing Comprehensive Test Executor...');
        
        // Load configuration
        if (typeof ComprehensiveTestConfig !== 'undefined') {
            this.config = ComprehensiveTestConfig;
        } else {
            throw new Error('ComprehensiveTestConfig not found');
        }

        // Register all test modules
        this.registerTestModules();
        
        console.log(`✅ Initialized with ${this.testModules.length} test modules`);
    }

    /**
     * Register all available test modules
     */
    registerTestModules() {
        this.testModules = [
            {
                name: 'Sheet Verification',
                category: 'sheetVerification',
                module: 'SheetVerificationModule',
                requirements: ['1.1', '1.2', '1.3', '1.4', '1.5'],
                enabled: this.config.testCategories.sheetVerification
            },
            {
                name: 'API Testing',
                category: 'apiTesting',
                module: 'APITestingModule',
                requirements: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '2.10'],
                enabled: this.config.testCategories.apiTesting
            },
            {
                name: 'Functional Testing',
                category: 'functionalTesting',
                module: 'FunctionalTestingModule',
                requirements: ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9', '3.10'],
                enabled: this.config.testCategories.functionalTesting
            },
            {
                name: 'Data Integrity',
                category: 'dataIntegrity',
                module: 'DataIntegrityModule',
                requirements: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '4.10'],
                enabled: this.config.testCategories.dataIntegrity
            },
            {
                name: 'Performance Testing',
                category: 'performance',
                module: 'PerformanceTestingModule',
                requirements: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9', '5.10'],
                enabled: this.config.testCategories.performance
            },
            {
                name: 'Cross-Browser Testing',
                category: 'crossBrowser',
                module: 'CrossBrowserTestingModule',
                requirements: ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '6.10'],
                enabled: this.config.testCategories.crossBrowser
            },
            {
                name: 'PWA Testing',
                category: 'pwa',
                module: 'PWATestingModule',
                requirements: ['7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '7.10'],
                enabled: this.config.testCategories.pwa
            },
            {
                name: 'Security Testing',
                category: 'security',
                module: 'SecurityTestingModule',
                requirements: ['8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10'],
                enabled: this.config.testCategories.security
            },
            {
                name: 'Error Handling',
                category: 'errorHandling',
                module: 'ErrorHandlingModule',
                requirements: ['9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10'],
                enabled: this.config.testCategories.errorHandling
            },
            {
                name: 'Reporting Testing',
                category: 'reporting',
                module: 'ReportingTestingModule',
                requirements: ['10.1', '10.2', '10.3', '10.4', '10.5', '10.6', '10.7', '10.8', '10.9', '10.10'],
                enabled: this.config.testCategories.reporting
            }
        ];
    }

    /**
     * Execute all tests
     */
    async executeAllTests() {
        console.log('\n🧪 ========================================');
        console.log('   COMPREHENSIVE TEST SUITE EXECUTION');
        console.log('========================================\n');
        
        this.startTime = Date.now();
        const results = {
            timestamp: new Date().toISOString(),
            environment: this.config.environment,
            modules: {},
            summary: {
                totalModules: 0,
                passedModules: 0,
                failedModules: 0,
                skippedModules: 0,
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                totalDuration: 0,
                overallScore: 0
            },
            requirementCoverage: {},
            gaps: [],
            recommendations: []
        };

        // Execute each test module
        for (const module of this.testModules) {
            if (!module.enabled) {
                console.log(`⏭️  Skipping ${module.name} (disabled)`);
                results.modules[module.category] = {
                    status: 'skipped',
                    reason: 'disabled in configuration'
                };
                results.summary.skippedModules++;
                continue;
            }

            console.log(`\n📦 Executing ${module.name}...`);
            results.summary.totalModules++;

            try {
                const moduleResult = await this.executeModule(module);
                results.modules[module.category] = moduleResult;

                // Update summary
                if (moduleResult.status === 'passed') {
                    results.summary.passedModules++;
                } else if (moduleResult.status === 'failed') {
                    results.summary.failedModules++;
                }

                results.summary.totalTests += moduleResult.totalTests || 0;
                results.summary.passedTests += moduleResult.passedTests || 0;
                results.summary.failedTests += moduleResult.failedTests || 0;

                // Track requirement coverage
                module.requirements.forEach(req => {
                    if (!results.requirementCoverage[req]) {
                        results.requirementCoverage[req] = [];
                    }
                    results.requirementCoverage[req].push({
                        module: module.name,
                        status: moduleResult.status,
                        coverage: moduleResult.requirementCoverage?.[req] || 'partial'
                    });
                });

                console.log(`   ✅ ${module.name} completed: ${moduleResult.status}`);

            } catch (error) {
                console.error(`   ❌ ${module.name} failed:`, error.message);
                results.modules[module.category] = {
                    status: 'error',
                    error: error.message,
                    stack: error.stack
                };
                results.summary.failedModules++;
            }
        }

        this.endTime = Date.now();
        results.summary.totalDuration = this.endTime - this.startTime;

        // Calculate overall score
        results.summary.overallScore = this.calculateOverallScore(results);

        // Analyze requirement coverage
        results.gaps = this.analyzeRequirementGaps(results.requirementCoverage);

        // Generate recommendations
        results.recommendations = this.generateRecommendations(results);

        // Store results
        this.testResults = results;

        // Print summary
        this.printSummary(results);

        return results;
    }

    /**
     * Execute a single test module
     */
    async executeModule(module) {
        const moduleStartTime = Date.now();
        
        // Check if module class exists
        if (typeof window[module.module] === 'undefined') {
            return {
                status: 'skipped',
                reason: `Module ${module.module} not loaded`,
                duration: 0
            };
        }

        try {
            // Instantiate module
            const ModuleClass = window[module.module];
            const instance = new ModuleClass(this.config.environment);

            // Execute module tests
            let result;
            if (typeof instance.runAllTests === 'function') {
                result = await instance.runAllTests();
            } else if (typeof instance.run === 'function') {
                result = await instance.run();
            } else {
                throw new Error(`Module ${module.module} has no runAllTests() or run() method`);
            }

            const duration = Date.now() - moduleStartTime;

            return {
                status: result.passed ? 'passed' : 'failed',
                totalTests: result.totalTests || result.tests?.length || 0,
                passedTests: result.passedTests || result.tests?.filter(t => t.passed).length || 0,
                failedTests: result.failedTests || result.tests?.filter(t => !t.passed).length || 0,
                duration: duration,
                details: result,
                requirementCoverage: result.requirementCoverage || {}
            };

        } catch (error) {
            const duration = Date.now() - moduleStartTime;
            return {
                status: 'error',
                error: error.message,
                duration: duration
            };
        }
    }

    calculateOverallScore(results) {
        const { totalTests, passedTests } = results.summary;
        if (totalTests === 0) return 0;
        return Math.round((passedTests / totalTests) * 100);
    }

    analyzeRequirementGaps(requirementCoverage) {
        const gaps = [];
        const allRequirements = Object.keys(this.config.requirements);

        for (const req of allRequirements) {
            if (!requirementCoverage[req] || requirementCoverage[req].length === 0) {
                gaps.push({
                    requirement: req,
                    description: this.config.requirements[req],
                    issue: 'No test coverage',
                    severity: 'high'
                });
            } else {
                const allFailed = requirementCoverage[req].every(cov => cov.status === 'failed');
                if (allFailed) {
                    gaps.push({
                        requirement: req,
                        description: this.config.requirements[req],
                        issue: 'All tests failed',
                        severity: 'critical'
                    });
                }
            }
        }

        return gaps;
    }

    generateRecommendations(results) {
        const recommendations = [];

        if (results.summary.overallScore < this.config.thresholds.successRate) {
            recommendations.push({
                priority: 'high',
                category: 'Overall Quality',
                issue: `Overall score ${results.summary.overallScore}% is below threshold ${this.config.thresholds.successRate}%`,
                recommendation: 'Review and fix failing tests to improve overall quality',
                requirements: []
            });
        }

        if (results.summary.failedModules > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Module Failures',
                issue: `${results.summary.failedModules} module(s) failed`,
                recommendation: 'Investigate and fix failing test modules',
                requirements: []
            });
        }

        if (results.gaps.length > 0) {
            const criticalGaps = results.gaps.filter(g => g.severity === 'critical');
            if (criticalGaps.length > 0) {
                recommendations.push({
                    priority: 'critical',
                    category: 'Requirement Coverage',
                    issue: `${criticalGaps.length} requirement(s) have no passing tests`,
                    recommendation: 'Implement or fix tests for critical requirements',
                    requirements: criticalGaps.map(g => g.requirement)
                });
            }
        }

        if (results.summary.totalDuration > 300000) {
            recommendations.push({
                priority: 'medium',
                category: 'Performance',
                issue: `Test suite took ${(results.summary.totalDuration / 1000).toFixed(2)}s (> 5 minutes)`,
                recommendation: 'Optimize test execution time or run tests in parallel',
                requirements: []
            });
        }

        return recommendations;
    }

    printSummary(results) {
        console.log('\n\n📊 ========================================');
        console.log('   TEST EXECUTION SUMMARY');
        console.log('========================================\n');
        
        console.log(`⏱️  Total Duration: ${(results.summary.totalDuration / 1000).toFixed(2)}s`);
        console.log(`📦 Modules: ${results.summary.totalModules} total, ${results.summary.passedModules} passed, ${results.summary.failedModules} failed`);
        console.log(`🧪 Tests: ${results.summary.totalTests} total, ${results.summary.passedTests} passed, ${results.summary.failedTests} failed`);
        console.log(`🎯 Overall Score: ${results.summary.overallScore}%`);
        console.log(`📋 Coverage: ${Object.keys(results.requirementCoverage).length}/${Object.keys(this.config.requirements).length} requirements`);
        console.log(`⚠️  Gaps: ${results.gaps.length} requirement gaps found`);

        if (results.recommendations.length > 0) {
            console.log('\n💡 Top Recommendations:');
            results.recommendations.slice(0, 3).forEach(rec => {
                console.log(`   ${rec.priority.toUpperCase()}: ${rec.issue}`);
            });
        }

        console.log('\n========================================\n');
    }

    generateRequirementTraceabilityMatrix() {
        const matrix = {
            timestamp: new Date().toISOString(),
            totalRequirements: Object.keys(this.config.requirements).length,
            coveredRequirements: 0,
            requirements: {}
        };

        for (const [reqId, reqDesc] of Object.entries(this.config.requirements)) {
            const coverage = this.testResults.requirementCoverage[reqId] || [];
            const isCovered = coverage.length > 0;
            const hasPassing = coverage.some(c => c.status === 'passed');

            matrix.requirements[reqId] = {
                id: reqId,
                description: reqDesc,
                covered: isCovered,
                passing: hasPassing,
                testModules: coverage.map(c => c.module),
                status: !isCovered ? 'uncovered' : (hasPassing ? 'passing' : 'failing')
            };

            if (isCovered) matrix.coveredRequirements++;
        }

        matrix.coveragePercentage = Math.round((matrix.coveredRequirements / matrix.totalRequirements) * 100);
        return matrix;
    }

    async exportResults(formats = ['html', 'json', 'csv']) {
        const exports = {};
        if (formats.includes('json')) exports.json = await this.exportJSON();
        if (formats.includes('csv')) exports.csv = await this.exportCSV();
        return exports;
    }

    async exportJSON() {
        return JSON.stringify({
            testResults: this.testResults,
            requirementTraceabilityMatrix: this.generateRequirementTraceabilityMatrix()
        }, null, 2);
    }

    async exportCSV() {
        const matrix = this.generateRequirementTraceabilityMatrix();
        const rows = [['Requirement ID', 'Description', 'Status', 'Covered', 'Passing', 'Test Modules']];

        for (const req of Object.values(matrix.requirements)) {
            rows.push([
                req.id,
                req.description,
                req.status,
                req.covered ? 'Yes' : 'No',
                req.passing ? 'Yes' : 'No',
                req.testModules.join('; ')
            ]);
        }

        return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComprehensiveTestExecutor;
} else if (typeof window !== 'undefined') {
    window.ComprehensiveTestExecutor = ComprehensiveTestExecutor;
}
