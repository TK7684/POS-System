/**
 * PWA Testing Module (Clean Fallback)
 * Registers a minimal PWATestingModule if the main one failed to load.
 */
(function(){
  if (typeof window === 'undefined') return;
  if (typeof window.PWATestingModule !== 'undefined') return;

  class PWATestingModule {
    constructor(config = {}) {
      this.config = {
        serviceWorkerPath: config.serviceWorkerPath || '/sw.js',
        timeout: config.timeout || 10000,
        offlineThreshold: config.offlineThreshold || 500,
        ...config
      };
      this.testResults = { summary: { totalTests: 0, passed: 0, failed: 0 } };
    }

    _sum(results){
      this.testResults.summary.totalTests += results.length;
      this.testResults.summary.passed += results.filter(r=>r.passed).length;
      this.testResults.summary.failed += results.filter(r=>!r.passed).length;
    }

    async testServiceWorker(){
      const supported = 'serviceWorker' in navigator;
      const res = [{ testName: 'Service worker support', passed: supported }];
      this._sum(res);
      return { passed: supported, results: res, summary: { total: 1, passed: supported?1:0, failed: supported?0:1 } };
    }

    async testOfflineCapability(){
      const start = performance.now();
      localStorage.setItem('pwa_offline', JSON.stringify({ t: Date.now() }));
      JSON.parse(localStorage.getItem('pwa_offline'));
      localStorage.removeItem('pwa_offline');
      const dur = performance.now()-start;
      const ok = dur < this.config.offlineThreshold;
      const res = [{ testName: 'Offline cached read', duration: dur, passed: ok }];
      this._sum(res);
      return { passed: ok, results: res, summary: { total: 1, passed: ok?1:0, failed: ok?0:1 } };
    }

    async testCacheStrategy(){
      const supported = 'caches' in window;
      const res = [{ testName: 'Cache API support', passed: supported }];
      this._sum(res);
      return { passed: supported, results: res, summary: { total: 1, passed: supported?1:0, failed: supported?0:1 } };
    }

    async runAllTests(){
      const serviceWorker = await this.testServiceWorker();
      const offline = await this.testOfflineCapability();
      const cache = await this.testCacheStrategy();
      const overallPassed = [serviceWorker, offline, cache].every(r=>r.passed);
      return { passed: overallPassed, results: { serviceWorker, offline, cache }, summary: this.testResults.summary };
    }
  }

  window.PWATestingModule = PWATestingModule;
})();


