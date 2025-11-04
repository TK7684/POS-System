/**
 * Performance Testing Module (Clean)
 * Minimal, reliable implementation to unblock browser test runner
 */

class PerformanceTestingModule {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || '',
      timeout: config.timeout || 10000,
      cacheThreshold: 10,
      apiThreshold: 2000,
      sheetThreshold: 100,
      offlineThreshold: 500,
      searchThreshold: 300,
      ...config
    };

    this.testResults = {
      summary: { totalTests: 0, passed: 0, failed: 0 },
      performanceMetrics: { cache: {}, api: {}, sheets: {} }
    };
  }

  updateSummary(results) {
    this.testResults.summary.totalTests += results.length;
    this.testResults.summary.passed += results.filter(r => r.passed).length;
    this.testResults.summary.failed += results.filter(r => !r.passed).length;
  }

  async testCachePerformance() {
    const ops = 10;
    const results = [];
    const startW = performance.now();
    for (let i = 0; i < ops; i++) {
      localStorage.setItem(`perf_cache_${i}`, JSON.stringify({ i }));
    }
    const durW = performance.now() - startW;
    results.push({ testName: 'Cache writes', operations: ops, duration: durW, passed: durW < this.config.cacheThreshold });

    const startR = performance.now();
    for (let i = 0; i < ops; i++) {
      JSON.parse(localStorage.getItem(`perf_cache_${i}`));
    }
    const durR = performance.now() - startR;
    results.push({ testName: 'Cache reads', operations: ops, duration: durR, passed: durR < this.config.cacheThreshold });

    for (let i = 0; i < ops; i++) localStorage.removeItem(`perf_cache_${i}`);

    this.testResults.performanceMetrics.cache = { writeMs: durW, readMs: durR };
    this.updateSummary(results);
    return { passed: results.every(r => r.passed), results, summary: { total: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length } };
  }

  async makeApiCall(action, params = {}) {
    if (!this.config.apiUrl) throw new Error('API URL not configured');
    const url = new URL(this.config.apiUrl);
    Object.entries({ action, ...params }).forEach(([k, v]) => url.searchParams.append(k, v));
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.config.timeout);
    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { clearTimeout(t); throw e; }
  }

  async testAPIResponseTimes() {
    const endpoints = [
      { action: 'getBootstrapData' },
      { action: 'getLowStockHTML' }
    ];
    const results = [];
    for (const ep of endpoints) {
      const start = performance.now();
      try {
        await this.makeApiCall(ep.action, ep.params || {});
        const dur = performance.now() - start;
        results.push({ testName: `API ${ep.action}`, duration: dur, passed: dur < this.config.apiThreshold });
      } catch (e) {
        // treat as failed but don't throw
        const dur = performance.now() - start;
        results.push({ testName: `API ${ep.action}`, duration: dur, passed: false, error: e.message });
      }
    }
    this.updateSummary(results);
    return { passed: results.every(r => r.passed), results, summary: { total: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length } };
  }

  async testSheetAccess() {
    const results = [];
    const start = performance.now();
    // simulate read
    const sample = JSON.stringify({ rows: 100 });
    JSON.parse(sample);
    const dur = performance.now() - start;
    results.push({ testName: 'Sheet read simulation', duration: dur, passed: dur < this.config.sheetThreshold });
    this.testResults.performanceMetrics.sheets = { readMs: dur };
    this.updateSummary(results);
    return { passed: results.every(r => r.passed), results, summary: { total: 1, passed: results[0].passed ? 1 : 0, failed: results[0].passed ? 0 : 1 } };
  }

  async testLoadPerformance() {
    const count = 1000;
    const data = Array.from({ length: count }, (_, i) => ({ i, v: Math.random() }));
    const start = performance.now();
    localStorage.setItem('perf_large', JSON.stringify(data));
    const loaded = JSON.parse(localStorage.getItem('perf_large'));
    const sum = loaded.reduce((s, x) => s + x.v, 0);
    localStorage.removeItem('perf_large');
    const dur = performance.now() - start;
    const result = { testName: 'Load 1k records', duration: dur, sum, passed: dur < 1000 };
    this.updateSummary([result]);
    return { passed: result.passed, results: [result], summary: { total: 1, passed: result.passed ? 1 : 0, failed: result.passed ? 0 : 1 } };
  }

  async testOfflineMode() {
    const start = performance.now();
    localStorage.setItem('perf_offline', JSON.stringify({ t: Date.now() }));
    JSON.parse(localStorage.getItem('perf_offline'));
    localStorage.removeItem('perf_offline');
    const dur = performance.now() - start;
    const result = { testName: 'Offline cached read', duration: dur, passed: dur < this.config.offlineThreshold };
    this.updateSummary([result]);
    return { passed: result.passed, results: [result], summary: { total: 1, passed: result.passed ? 1 : 0, failed: result.passed ? 0 : 1 } };
  }

  async testPWAInstallation() {
    // Lightweight checks that won’t throw in non-PWA contexts
    const supported = 'serviceWorker' in navigator;
    const result = { testName: 'Service worker support', passed: supported };
    this.updateSummary([result]);
    return { passed: result.passed, results: [result], summary: { total: 1, passed: result.passed ? 1 : 0, failed: result.passed ? 0 : 1 } };
  }

  async testSearchPerformance() {
    const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
    const start = performance.now();
    const found = items.filter(x => x.includes('99'));
    const dur = performance.now() - start;
    const result = { testName: 'Search 1k items', duration: dur, found: found.length, passed: dur < this.config.searchThreshold };
    this.updateSummary([result]);
    return { passed: result.passed, results: [result], summary: { total: 1, passed: result.passed ? 1 : 0, failed: result.passed ? 0 : 1 } };
  }

  async runAllTests() {
    const cache = await this.testCachePerformance();
    const api = this.config.apiUrl ? await this.testAPIResponseTimes() : { passed: false, results: [], summary: { total: 0, passed: 0, failed: 0 } };
    const sheets = await this.testSheetAccess();
    const load = await this.testLoadPerformance();
    const offline = await this.testOfflineMode();
    const pwa = await this.testPWAInstallation();
    const search = await this.testSearchPerformance();
    const all = [cache, api, sheets, load, offline, pwa, search];
    const overallPassed = all.every(r => r.passed || r.summary.total === 0);
    return { passed: overallPassed, results: { cache, api, sheets, load, offline, pwa, search }, summary: this.testResults.summary, report: { performanceMetrics: this.testResults.performanceMetrics } };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceTestingModule;
} else if (typeof window !== 'undefined') {
  window.PerformanceTestingModule = PerformanceTestingModule;
}


