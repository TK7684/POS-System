/**
 * Performance Dashboard - Administrative interface for monitoring system performance
 * Provides real-time metrics, alerts, and optimization recommendations
 */

class PerformanceDashboard {
  constructor() {
    this.isVisible = false;
    this.updateInterval = null;
    this.charts = new Map();
    this.alertHistory = [];
    this.performanceHistory = [];
    
    this.init();
  }

  /**
   * Initialize performance dashboard
   */
  init() {
    this.createDashboard();
    this.setupEventListeners();
    this.startRealTimeUpdates();
  }

  /**
   * Create dashboard UI
   */
  createDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'performance-dashboard';
    dashboard.innerHTML = `
      <div class="dashboard-header">
        <h2>Performance Dashboard</h2>
        <div class="dashboard-controls">
          <button class="refresh-btn">🔄 Refresh</button>
          <button class="export-btn">📊 Export</button>
          <button class="close-btn">✕</button>
        </div>
      </div>
      
      <div class="dashboard-content">
        <div class="metrics-grid">
          <!-- Core Web Vitals -->
          <div class="metric-card">
            <h3>Core Web Vitals</h3>
            <div class="vitals-container">
              <div class="vital-item">
                <span class="vital-label">LCP</span>
                <span class="vital-value" id="lcp-value">-</span>
                <span class="vital-status" id="lcp-status"></span>
              </div>
              <div class="vital-item">
                <span class="vital-label">FID</span>
                <span class="vital-value" id="fid-value">-</span>
                <span class="vital-status" id="fid-status"></span>
              </div>
              <div class="vital-item">
                <span class="vital-label">CLS</span>
                <span class="vital-value" id="cls-value">-</span>
                <span class="vital-status" id="cls-status"></span>
              </div>
            </div>
          </div>

          <!-- POS Metrics -->
          <div class="metric-card">
            <h3>POS Performance</h3>
            <div class="pos-metrics">
              <div class="pos-metric">
                <span class="metric-label">Cache Hit Rate</span>
                <span class="metric-value" id="cache-hit-rate">-</span>
              </div>
              <div class="pos-metric">
                <span class="metric-label">Avg Search Time</span>
                <span class="metric-value" id="avg-search-time">-</span>
              </div>
              <div class="pos-metric">
                <span class="metric-label">API Response</span>
                <span class="metric-value" id="avg-api-time">-</span>
              </div>
              <div class="pos-metric">
                <span class="metric-label">Offline Operations</span>
                <span class="metric-value" id="offline-ops">-</span>
              </div>
            </div>
          </div>

          <!-- System Resources -->
          <div class="metric-card">
            <h3>System Resources</h3>
            <div class="resource-metrics">
              <div class="resource-item">
                <span class="resource-label">Memory Usage</span>
                <div class="progress-bar">
                  <div class="progress-fill" id="memory-progress"></div>
                </div>
                <span class="resource-value" id="memory-value">-</span>
              </div>
              <div class="resource-item">
                <span class="resource-label">Network</span>
                <span class="resource-value" id="network-type">-</span>
              </div>
            </div>
          </div>

          <!-- Recent Alerts -->
          <div class="metric-card">
            <h3>Recent Alerts</h3>
            <div class="alerts-container" id="alerts-container">
              <p class="no-alerts">No recent alerts</p>
            </div>
          </div>
        </div>

        <!-- Performance Charts -->
        <div class="charts-section">
          <div class="chart-container">
            <h3>Performance Trends</h3>
            <canvas id="performance-chart" width="800" height="300"></canvas>
          </div>
          
          <div class="chart-container">
            <h3>API Response Times</h3>
            <canvas id="api-chart" width="800" height="200"></canvas>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="recommendations-section">
          <h3>Optimization Recommendations</h3>
          <div class="recommendations-list" id="recommendations-list">
            <p class="no-recommendations">No recommendations at this time</p>
          </div>
        </div>

        <!-- User Analytics Summary -->
        <div class="analytics-section">
          <h3>User Analytics Summary</h3>
          <div class="analytics-grid">
            <div class="analytics-card">
              <h4>Active Users</h4>
              <span class="analytics-value" id="active-users">-</span>
            </div>
            <div class="analytics-card">
              <h4>Popular Features</h4>
              <div class="feature-list" id="popular-features">-</div>
            </div>
            <div class="analytics-card">
              <h4>User Feedback</h4>
              <div class="feedback-summary" id="feedback-summary">-</div>
            </div>
            <div class="analytics-card">
              <h4>A/B Tests</h4>
              <div class="ab-tests-list" id="ab-tests-list">-</div>
            </div>
          </div>
        </div>
      </div>
    `;

    dashboard.style.display = 'none';
    document.body.appendChild(dashboard);
    
    this.dashboardElement = dashboard;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const dashboard = this.dashboardElement;
    
    // Close button
    dashboard.querySelector('.close-btn').addEventListener('click', () => {
      this.hide();
    });
    
    // Refresh button
    dashboard.querySelector('.refresh-btn').addEventListener('click', () => {
      this.refreshData();
    });
    
    // Export button
    dashboard.querySelector('.export-btn').addEventListener('click', () => {
      this.exportData();
    });
    
    // Keyboard shortcut to toggle dashboard (Ctrl+Shift+P)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.toggle();
      }
    });
    
    // Listen for performance alerts
    if (window.performanceMonitor) {
      window.performanceMonitor.onAlert((alert) => {
        this.addAlert(alert);
      });
    }
  }

  /**
   * Start real-time updates
   */
  startRealTimeUpdates() {
    this.updateInterval = setInterval(() => {
      if (this.isVisible) {
        this.updateMetrics();
        this.updateCharts();
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Show dashboard
   */
  show() {
    this.isVisible = true;
    this.dashboardElement.style.display = 'block';
    this.refreshData();
    
    // Add to body class for styling
    document.body.classList.add('performance-dashboard-open');
  }

  /**
   * Hide dashboard
   */
  hide() {
    this.isVisible = false;
    this.dashboardElement.style.display = 'none';
    document.body.classList.remove('performance-dashboard-open');
  }

  /**
   * Toggle dashboard visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Refresh all data
   */
  refreshData() {
    this.updateMetrics();
    this.updateCharts();
    this.updateRecommendations();
    this.updateAnalyticsSummary();
  }

  /**
   * Update performance metrics
   */
  updateMetrics() {
    if (!window.performanceMonitor) return;
    
    const metrics = window.performanceMonitor.metrics;
    const scores = window.performanceMonitor.calculateScores();
    
    // Update Core Web Vitals
    this.updateVital('lcp', metrics.lcp, scores.lcp);
    this.updateVital('fid', metrics.fid, scores.fid);
    this.updateVital('cls', metrics.cls, scores.cls);
    
    // Update POS metrics
    document.getElementById('cache-hit-rate').textContent = 
      metrics.cacheHitRate ? `${metrics.cacheHitRate.toFixed(1)}%` : '-';
    
    const avgSearchTime = window.performanceMonitor.getAverageSearchTime();
    document.getElementById('avg-search-time').textContent = 
      avgSearchTime ? `${avgSearchTime.toFixed(0)}ms` : '-';
    
    const recentAPITimes = window.performanceMonitor.getRecentAPITimes();
    if (recentAPITimes.length > 0) {
      const avgAPITime = recentAPITimes.reduce((sum, api) => sum + api.time, 0) / recentAPITimes.length;
      document.getElementById('avg-api-time').textContent = `${avgAPITime.toFixed(0)}ms`;
    }
    
    document.getElementById('offline-ops').textContent = metrics.offlineOperations || '0';
    
    // Update system resources
    if (metrics.memoryUsage) {
      const memoryPercent = (metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100;
      document.getElementById('memory-progress').style.width = `${memoryPercent}%`;
      document.getElementById('memory-value').textContent = 
        `${(metrics.memoryUsage.used / 1024 / 1024).toFixed(1)}MB`;
      
      // Color code memory usage
      const progressBar = document.getElementById('memory-progress');
      if (memoryPercent > 80) {
        progressBar.className = 'progress-fill high';
      } else if (memoryPercent > 60) {
        progressBar.className = 'progress-fill medium';
      } else {
        progressBar.className = 'progress-fill low';
      }
    }
    
    if (metrics.networkConditions) {
      document.getElementById('network-type').textContent = 
        `${metrics.networkConditions.effectiveType} (${metrics.networkConditions.downlink}Mbps)`;
    }
  }

  /**
   * Update individual vital metric
   */
  updateVital(vitalName, value, score) {
    const valueElement = document.getElementById(`${vitalName}-value`);
    const statusElement = document.getElementById(`${vitalName}-status`);
    
    if (value !== null && value !== undefined) {
      if (vitalName === 'cls') {
        valueElement.textContent = value.toFixed(3);
      } else {
        valueElement.textContent = `${value.toFixed(0)}ms`;
      }
      
      statusElement.textContent = score || 'unknown';
      statusElement.className = `vital-status ${score}`;
    } else {
      valueElement.textContent = '-';
      statusElement.textContent = '';
      statusElement.className = 'vital-status';
    }
  }

  /**
   * Add alert to dashboard
   */
  addAlert(alert) {
    this.alertHistory.unshift(alert);
    
    // Keep only last 10 alerts
    if (this.alertHistory.length > 10) {
      this.alertHistory = this.alertHistory.slice(0, 10);
    }
    
    this.updateAlertsDisplay();
  }

  /**
   * Update alerts display
   */
  updateAlertsDisplay() {
    const container = document.getElementById('alerts-container');
    
    if (this.alertHistory.length === 0) {
      container.innerHTML = '<p class="no-alerts">No recent alerts</p>';
      return;
    }
    
    container.innerHTML = this.alertHistory.map(alert => `
      <div class="alert-item ${alert.severity}">
        <div class="alert-header">
          <span class="alert-type">${alert.type.replace(/-/g, ' ')}</span>
          <span class="alert-time">${new Date(alert.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="alert-details">${this.formatAlertData(alert.data)}</div>
      </div>
    `).join('');
  }

  /**
   * Format alert data for display
   */
  formatAlertData(data) {
    if (!data) return '';
    
    const formatted = [];
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number') {
        formatted.push(`${key}: ${value.toFixed(2)}`);
      } else {
        formatted.push(`${key}: ${value}`);
      }
    }
    
    return formatted.join(', ');
  }

  /**
   * Update performance charts
   */
  updateCharts() {
    this.updatePerformanceChart();
    this.updateAPIChart();
  }

  /**
   * Update main performance chart
   */
  updatePerformanceChart() {
    const canvas = document.getElementById('performance-chart');
    const ctx = canvas.getContext('2d');
    
    // Store performance data point
    if (window.performanceMonitor) {
      const metrics = window.performanceMonitor.metrics;
      this.performanceHistory.push({
        timestamp: Date.now(),
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls * 1000, // Scale CLS for visibility
        cacheHitRate: metrics.cacheHitRate
      });
      
      // Keep only last 50 data points
      if (this.performanceHistory.length > 50) {
        this.performanceHistory = this.performanceHistory.slice(-50);
      }
    }
    
    // Simple line chart implementation
    this.drawLineChart(ctx, canvas, this.performanceHistory);
  }

  /**
   * Update API response times chart
   */
  updateAPIChart() {
    const canvas = document.getElementById('api-chart');
    const ctx = canvas.getContext('2d');
    
    if (window.performanceMonitor && window.performanceMonitor.metrics.apiTimes) {
      const recentAPITimes = window.performanceMonitor.metrics.apiTimes.slice(-20);
      this.drawAPIChart(ctx, canvas, recentAPITimes);
    }
  }

  /**
   * Draw simple line chart
   */
  drawLineChart(ctx, canvas, data) {
    if (data.length === 0) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw LCP line
    if (data.some(d => d.lcp)) {
      this.drawMetricLine(ctx, data, 'lcp', '#ff6b6b', padding, chartWidth, chartHeight, 0, 5000);
    }
    
    // Draw cache hit rate line
    if (data.some(d => d.cacheHitRate)) {
      this.drawMetricLine(ctx, data, 'cacheHitRate', '#4ecdc4', padding, chartWidth, chartHeight, 0, 100);
    }
    
    // Draw legend
    this.drawLegend(ctx, canvas);
  }

  /**
   * Draw metric line on chart
   */
  drawMetricLine(ctx, data, metric, color, padding, chartWidth, chartHeight, minValue, maxValue) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let firstPoint = true;
    data.forEach((point, index) => {
      if (point[metric] !== null && point[metric] !== undefined) {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const normalizedValue = (point[metric] - minValue) / (maxValue - minValue);
        const y = padding + chartHeight - (normalizedValue * chartHeight);
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    
    ctx.stroke();
  }

  /**
   * Draw chart legend
   */
  drawLegend(ctx, canvas) {
    const legends = [
      { color: '#ff6b6b', label: 'LCP (ms)' },
      { color: '#4ecdc4', label: 'Cache Hit Rate (%)' }
    ];
    
    ctx.font = '12px Arial';
    legends.forEach((legend, index) => {
      const x = canvas.width - 150;
      const y = 20 + index * 20;
      
      ctx.fillStyle = legend.color;
      ctx.fillRect(x, y - 8, 12, 12);
      
      ctx.fillStyle = '#333';
      ctx.fillText(legend.label, x + 20, y);
    });
  }

  /**
   * Draw API response times chart
   */
  drawAPIChart(ctx, canvas, apiTimes) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (apiTimes.length === 0) return;
    
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / apiTimes.length;
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Find max time for scaling
    const maxTime = Math.max(...apiTimes.map(api => api.time));
    
    // Draw bars
    apiTimes.forEach((api, index) => {
      const x = padding + index * barWidth;
      const barHeight = (api.time / maxTime) * chartHeight;
      const y = canvas.height - padding - barHeight;
      
      // Color based on response time
      if (api.time > 1000) {
        ctx.fillStyle = '#ff6b6b';
      } else if (api.time > 500) {
        ctx.fillStyle = '#ffa726';
      } else {
        ctx.fillStyle = '#66bb6a';
      }
      
      ctx.fillRect(x, y, barWidth - 2, barHeight);
    });
  }

  /**
   * Update recommendations
   */
  updateRecommendations() {
    if (!window.performanceMonitor) return;
    
    const recommendations = window.performanceMonitor.getOptimizationRecommendations();
    const container = document.getElementById('recommendations-list');
    
    if (recommendations.length === 0) {
      container.innerHTML = '<p class="no-recommendations">No recommendations at this time</p>';
      return;
    }
    
    container.innerHTML = recommendations.map(rec => `
      <div class="recommendation-item ${rec.priority}">
        <div class="recommendation-header">
          <span class="recommendation-type">${rec.type}</span>
          <span class="recommendation-priority">${rec.priority}</span>
        </div>
        <p class="recommendation-message">${rec.message}</p>
        <button class="recommendation-action" data-action="${rec.action}">
          Apply Fix
        </button>
      </div>
    `).join('');
    
    // Add event listeners for recommendation actions
    container.querySelectorAll('.recommendation-action').forEach(button => {
      button.addEventListener('click', (e) => {
        this.applyRecommendation(e.target.dataset.action);
      });
    });
  }

  /**
   * Apply recommendation
   */
  applyRecommendation(action) {
    switch (action) {
      case 'improve-caching':
        this.improveCaching();
        break;
      case 'optimize-search':
        this.optimizeSearch();
        break;
      case 'optimize-memory':
        this.optimizeMemory();
        break;
      case 'enable-data-saving':
        this.enableDataSaving();
        break;
      default:
        console.log('Unknown recommendation action:', action);
    }
  }

  /**
   * Improve caching implementation
   */
  improveCaching() {
    if (window.CacheManager) {
      window.CacheManager.preloadFrequentData();
      this.showNotification('Cache optimization applied', 'success');
    }
  }

  /**
   * Optimize search implementation
   */
  optimizeSearch() {
    // Enable search indexing if available
    if (window.SearchInterface) {
      window.SearchInterface.enableIndexing();
      this.showNotification('Search optimization applied', 'success');
    }
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory() {
    // Trigger garbage collection and cleanup
    if (window.gc) {
      window.gc();
    }
    
    // Clear old cache entries
    if (window.CacheManager) {
      window.CacheManager.cleanup();
    }
    
    this.showNotification('Memory optimization applied', 'success');
  }

  /**
   * Enable data saving mode
   */
  enableDataSaving() {
    localStorage.setItem('data-saving-mode', 'true');
    this.showNotification('Data saving mode enabled', 'success');
  }

  /**
   * Update analytics summary
   */
  updateAnalyticsSummary() {
    if (!window.UserAnalytics) return;
    
    const summary = window.UserAnalytics.getSummary();
    
    // Update active users (simplified - in real app would come from server)
    document.getElementById('active-users').textContent = '1';
    
    // Update popular features
    this.updatePopularFeatures();
    
    // Update feedback summary
    this.updateFeedbackSummary();
    
    // Update A/B tests
    this.updateABTestsSummary(summary.activeABTests);
  }

  /**
   * Update popular features display
   */
  updatePopularFeatures() {
    // This would typically come from analytics data
    const features = [
      { name: 'Quick Actions', usage: 85 },
      { name: 'Search', usage: 72 },
      { name: 'Export', usage: 45 }
    ];
    
    const container = document.getElementById('popular-features');
    container.innerHTML = features.map(feature => `
      <div class="feature-item">
        <span class="feature-name">${feature.name}</span>
        <span class="feature-usage">${feature.usage}%</span>
      </div>
    `).join('');
  }

  /**
   * Update feedback summary
   */
  updateFeedbackSummary() {
    // This would typically come from feedback data
    const summary = {
      averageRating: 4.2,
      totalFeedback: 15,
      recentFeedback: 3
    };
    
    const container = document.getElementById('feedback-summary');
    container.innerHTML = `
      <div class="feedback-stat">
        <span class="stat-label">Avg Rating:</span>
        <span class="stat-value">${summary.averageRating}/5</span>
      </div>
      <div class="feedback-stat">
        <span class="stat-label">Total:</span>
        <span class="stat-value">${summary.totalFeedback}</span>
      </div>
    `;
  }

  /**
   * Update A/B tests summary
   */
  updateABTestsSummary(abTests) {
    const container = document.getElementById('ab-tests-list');
    
    if (abTests.length === 0) {
      container.innerHTML = '<p>No active A/B tests</p>';
      return;
    }
    
    container.innerHTML = abTests.map(test => `
      <div class="ab-test-item">
        <span class="test-name">${test.name}</span>
        <span class="test-variant">${test.variant || 'Control'}</span>
      </div>
    `).join('');
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `dashboard-notification ${type}`;
    notification.textContent = message;
    
    this.dashboardElement.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Export performance data
   */
  exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: window.performanceMonitor ? window.performanceMonitor.getReport() : {},
      analytics: window.UserAnalytics ? window.UserAnalytics.getSummary() : {},
      alerts: this.alertHistory,
      performanceHistory: this.performanceHistory
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    this.showNotification('Performance report exported', 'success');
  }

  /**
   * Destroy dashboard
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.dashboardElement) {
      this.dashboardElement.remove();
    }
    
    document.body.classList.remove('performance-dashboard-open');
  }
}

// Auto-initialize performance dashboard for admin users
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only initialize for admin users (you would check user permissions here)
    const isAdmin = localStorage.getItem('user-role') === 'admin' || 
                   window.location.search.includes('admin=true');
    
    if (isAdmin) {
      window.PerformanceDashboard = new PerformanceDashboard();
    }
  });
} else {
  const isAdmin = localStorage.getItem('user-role') === 'admin' || 
                 window.location.search.includes('admin=true');
  
  if (isAdmin) {
    window.PerformanceDashboard = new PerformanceDashboard();
  }
}

export default PerformanceDashboard;