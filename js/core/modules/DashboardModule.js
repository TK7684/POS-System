/**
 * Dashboard Module
 * Main module for enhanced dashboard with real-time analytics and interactive charts
 */

class DashboardModule {
  constructor() {
    this.chartEngine = null;
    this.analytics = null;
    this.widgets = null;
    this.initialized = false;
    this.updateInterval = null;
    
    // Dashboard state
    this.currentPeriod = 'today';
    this.isVisible = false;
    
    this.init();
  }

  /**
   * Initialize dashboard module
   */
  async init() {
    if (this.initialized) return;
    
    try {
      // Load dependencies
      await this.loadDependencies();
      
      // Initialize components
      this.initializeComponents();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize dashboard UI
      this.initializeDashboard();
      
      this.initialized = true;
      console.log('[Dashboard] Module initialized successfully');
      
    } catch (error) {
      console.error('[Dashboard] Failed to initialize:', error);
    }
  }

  /**
   * Load required dependencies
   */
  async loadDependencies() {
    try {
      // Load chart engine
      const ChartEngine = await import('../ChartEngine.js');
      this.chartEngine = new (ChartEngine.default || ChartEngine)();
      
      // Load analytics manager
      const DashboardAnalytics = await import('../DashboardAnalytics.js');
      this.analytics = new (DashboardAnalytics.default || DashboardAnalytics)();
      
      // Load smart alerts system
      const SmartAlerts = await import('../SmartAlerts.js');
      this.smartAlerts = new (SmartAlerts.default || SmartAlerts)();
      
      // Load widget manager
      const DashboardWidgets = await import('../DashboardWidgets.js');
      this.widgets = new (DashboardWidgets.default || DashboardWidgets)(
        this.chartEngine, 
        this.analytics
      );
      
    } catch (error) {
      console.error('[Dashboard] Failed to load dependencies:', error);
      throw error;
    }
  }

  /**
   * Initialize components
   */
  initializeComponents() {
    // Start real-time analytics updates
    this.analytics.startRealTimeUpdates();
    
    // Set up global references for other modules
    window.dashboardModule = this;
    window.dashboardWidgets = this.widgets;
    window.smartAlerts = this.smartAlerts;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for route changes
    document.addEventListener('pos:routeChanged', (event) => {
      if (event.detail.route === 'home') {
        this.onDashboardVisible();
      } else {
        this.onDashboardHidden();
      }
    });
    
    // Listen for data updates from other modules
    document.addEventListener('pos:dataUpdated', (event) => {
      this.handleDataUpdate(event.detail);
    });
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseUpdates();
      } else if (this.isVisible) {
        this.resumeUpdates();
      }
    });
    
    // Listen for window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Initialize dashboard UI
   */
  initializeDashboard() {
    // Find dashboard container in home screen
    const homeScreen = document.getElementById('home-screen');
    if (!homeScreen) return;
    
    // Create enhanced dashboard section
    this.createDashboardSection(homeScreen);
    
    // Initialize widgets
    const dashboardContainer = document.getElementById('enhanced-dashboard');
    if (dashboardContainer) {
      this.widgets.initializeDashboard(dashboardContainer);
    }
  }

  /**
   * Create dashboard section in home screen
   */
  createDashboardSection(homeScreen) {
    // Find existing KPI section
    const existingKPIs = homeScreen.querySelector('.grid');
    
    // Create enhanced dashboard section
    const dashboardSection = document.createElement('section');
    dashboardSection.id = 'enhanced-dashboard';
    dashboardSection.className = 'enhanced-dashboard';
    
    // Insert after existing KPIs
    if (existingKPIs) {
      existingKPIs.parentNode.insertBefore(dashboardSection, existingKPIs.nextSibling);
    } else {
      homeScreen.appendChild(dashboardSection);
    }
  }

  /**
   * Handle dashboard becoming visible
   */
  onDashboardVisible() {
    this.isVisible = true;
    
    // Resume updates if paused
    this.resumeUpdates();
    
    // Refresh dashboard data
    this.refreshDashboard();
    
    // Start periodic updates
    this.startPeriodicUpdates();
  }

  /**
   * Handle dashboard becoming hidden
   */
  onDashboardHidden() {
    this.isVisible = false;
    
    // Pause updates to save resources
    this.pauseUpdates();
    
    // Stop periodic updates
    this.stopPeriodicUpdates();
  }

  /**
   * Handle data updates from other modules
   */
  handleDataUpdate(updateInfo) {
    const { type, data } = updateInfo;
    
    // Update analytics
    if (this.analytics) {
      this.analytics.handleDataUpdate(updateInfo);
    }
    
    // Update relevant dashboard components
    this.updateDashboardComponents(type, data);
  }

  /**
   * Update dashboard components based on data type
   */
  updateDashboardComponents(type, data) {
    switch (type) {
      case 'sale':
        this.updateSalesComponents(data);
        break;
      case 'purchase':
        this.updatePurchaseComponents(data);
        break;
      case 'stock':
        this.updateStockComponents(data);
        break;
      default:
        this.refreshDashboard();
    }
  }

  /**
   * Update sales-related components
   */
  updateSalesComponents(data) {
    // Update sales trend chart
    this.updateSalesTrendChart();
    
    // Update revenue metrics
    this.updateRevenueMetrics();
    
    // Update recent transactions
    this.updateRecentTransactions();
  }

  /**
   * Update purchase-related components
   */
  updatePurchaseComponents(data) {
    // Update inventory metrics
    this.updateInventoryMetrics();
    
    // Update cost analysis
    this.updateCostAnalysis();
  }

  /**
   * Update stock-related components
   */
  updateStockComponents(data) {
    // Update stock alerts
    this.updateStockAlerts();
    
    // Update inventory status
    this.updateInventoryStatus();
  }

  /**
   * Update sales trend chart
   */
  async updateSalesTrendChart() {
    const chartContainer = document.querySelector('[data-widget-id="sales-trend"] .chart-container');
    if (!chartContainer) return;
    
    try {
      const salesData = await this.getSalesTrendData();
      this.chartEngine.updateChart(chartContainer, salesData, {
        type: 'line',
        animate: true,
        color: '#0f766e'
      });
    } catch (error) {
      console.error('Failed to update sales trend chart:', error);
    }
  }

  /**
   * Update revenue metrics
   */
  async updateRevenueMetrics() {
    try {
      const revenueData = await this.getRevenueData();
      
      // Update revenue KPIs
      this.updateKPI('today-revenue', revenueData.today);
      this.updateKPI('week-revenue', revenueData.week);
      this.updateKPI('month-revenue', revenueData.month);
      
    } catch (error) {
      console.error('Failed to update revenue metrics:', error);
    }
  }

  /**
   * Update recent transactions
   */
  async updateRecentTransactions() {
    const listContainer = document.querySelector('[data-widget-id="recent-transactions"] .list-container');
    if (!listContainer) return;
    
    try {
      const transactions = await this.getRecentTransactions();
      
      listContainer.innerHTML = transactions.map(transaction => `
        <div class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">${transaction.title}</div>
            <div class="list-item-subtitle">${transaction.time}</div>
          </div>
          <div class="list-item-value">${transaction.amount}</div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Failed to update recent transactions:', error);
    }
  }

  /**
   * Update inventory metrics
   */
  async updateInventoryMetrics() {
    try {
      const inventoryData = await this.getInventoryMetrics();
      
      // Update inventory KPIs
      this.updateKPI('inventory-value', inventoryData.totalValue);
      this.updateKPI('low-stock-count', inventoryData.lowStockCount);
      this.updateKPI('inventory-turnover', inventoryData.turnoverRate);
      
    } catch (error) {
      console.error('Failed to update inventory metrics:', error);
    }
  }

  /**
   * Update cost analysis
   */
  async updateCostAnalysis() {
    const chartContainer = document.querySelector('[data-widget-id="cost-analysis"] .chart-container');
    if (!chartContainer) return;
    
    try {
      const costData = await this.getCostAnalysisData();
      this.chartEngine.updateChart(chartContainer, costData, {
        type: 'bar',
        animate: true,
        color: '#d97706'
      });
    } catch (error) {
      console.error('Failed to update cost analysis:', error);
    }
  }

  /**
   * Update stock alerts
   */
  async updateStockAlerts() {
    const alertContainer = document.querySelector('[data-widget-id="low-stock-alert"] .alert-list');
    if (!alertContainer) return;
    
    try {
      const alerts = await this.getStockAlerts();
      
      if (alerts.length === 0) {
        alertContainer.innerHTML = '<div class="no-alerts">ไม่มีการแจ้งเตือนสต๊อก</div>';
        return;
      }
      
      alertContainer.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.priority}">
          <div class="alert-icon">${alert.icon}</div>
          <div class="alert-content">
            <div class="alert-title">${alert.title}</div>
            <div class="alert-message">${alert.message}</div>
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Failed to update stock alerts:', error);
    }
  }

  /**
   * Update KPI display
   */
  updateKPI(kpiId, value) {
    const kpiElement = document.getElementById(`kpi-${kpiId}`);
    if (kpiElement) {
      kpiElement.textContent = this.formatKPIValue(value, kpiId);
    }
  }

  /**
   * Format KPI value for display
   */
  formatKPIValue(value, kpiId) {
    if (typeof value !== 'number') return value;
    
    // Currency values
    if (kpiId.includes('revenue') || kpiId.includes('sales') || kpiId.includes('value')) {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    // Percentage values
    if (kpiId.includes('rate') || kpiId.includes('margin')) {
      return `${value.toFixed(1)}%`;
    }
    
    // Count values
    return Math.round(value).toLocaleString('th-TH');
  }

  /**
   * Refresh entire dashboard
   */
  async refreshDashboard() {
    if (!this.isVisible) return;
    
    try {
      // Refresh all widgets
      if (this.widgets) {
        await this.widgets.refreshAllWidgets();
      }
      
      // Update analytics
      if (this.analytics) {
        await this.analytics.updateAllKPIs();
      }
      
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }

  /**
   * Start periodic updates
   */
  startPeriodicUpdates() {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      if (this.isVisible) {
        this.refreshDashboard();
      }
    }, 60000); // Update every minute
  }

  /**
   * Stop periodic updates
   */
  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Pause updates
   */
  pauseUpdates() {
    if (this.analytics) {
      this.analytics.pauseUpdates();
    }
    this.stopPeriodicUpdates();
  }

  /**
   * Resume updates
   */
  resumeUpdates() {
    if (this.analytics) {
      this.analytics.resumeUpdates();
    }
    if (this.isVisible) {
      this.startPeriodicUpdates();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Debounce resize handling
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.refreshCharts();
    }, 250);
  }

  /**
   * Refresh all charts after resize
   */
  refreshCharts() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
      const widget = container.closest('.widget');
      if (widget) {
        const widgetId = widget.dataset.widgetId;
        if (this.widgets) {
          this.widgets.refreshWidget(widgetId);
        }
      }
    });
  }

  // Data fetching methods
  async getSalesTrendData() {
    // Mock data - replace with actual API call
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        label: date.toLocaleDateString('th-TH', { weekday: 'short' }),
        value: Math.random() * 5000 + 2000
      });
    }
    return data;
  }

  async getRevenueData() {
    // Mock data - replace with actual API call
    return {
      today: Math.random() * 10000 + 5000,
      week: Math.random() * 50000 + 25000,
      month: Math.random() * 200000 + 100000
    };
  }

  async getRecentTransactions() {
    // Mock data - replace with actual API call
    return [
      { title: 'กุ้งแซ่บ', time: '2 นาทีที่แล้ว', amount: '฿120' },
      { title: 'ส้มตำ', time: '5 นาทีที่แล้ว', amount: '฿80' },
      { title: 'ลาบ', time: '8 นาทีที่แล้ว', amount: '฿100' },
      { title: 'น้ำส้ม', time: '12 นาทีที่แล้ว', amount: '฿25' }
    ];
  }

  async getInventoryMetrics() {
    // Mock data - replace with actual API call
    return {
      totalValue: Math.random() * 50000 + 25000,
      lowStockCount: Math.floor(Math.random() * 10) + 1,
      turnoverRate: Math.random() * 20 + 10
    };
  }

  async getCostAnalysisData() {
    // Mock data - replace with actual API call
    return [
      { label: 'วัตถุดิบ', value: 15000 },
      { label: 'แรงงาน', value: 8000 },
      { label: 'ค่าใช้จ่าย', value: 3000 },
      { label: 'อื่นๆ', value: 2000 }
    ];
  }

  async getStockAlerts() {
    // Mock data - replace with actual API call
    return [
      {
        priority: 'high',
        icon: '⚠️',
        title: 'สต๊อกต่ำ',
        message: 'กุ้งเหลือเพียง 15 กก.'
      },
      {
        priority: 'medium',
        icon: '📦',
        title: 'ต้องสั่งซื้อ',
        message: 'มะละกอเหลือ 5 กก.'
      }
    ];
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(format = 'json') {
    try {
      const dashboardData = {
        timestamp: new Date().toISOString(),
        period: this.currentPeriod,
        kpis: Array.from(this.analytics.kpis.entries()),
        widgets: this.widgets.getActiveWidgets()
      };
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(dashboardData, null, 2)], {
          type: 'application/json'
        });
        this.downloadFile(blob, `dashboard-${Date.now()}.json`);
      }
      
    } catch (error) {
      console.error('Failed to export dashboard data:', error);
    }
  }

  /**
   * Download file helper
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get dashboard performance metrics
   */
  getPerformanceMetrics() {
    return {
      initialized: this.initialized,
      isVisible: this.isVisible,
      updateInterval: this.updateInterval !== null,
      widgetCount: this.widgets ? this.widgets.getActiveWidgets().length : 0,
      lastUpdate: this.analytics ? this.analytics.lastUpdate : null
    };
  }

  /**
   * Cleanup when module is destroyed
   */
  destroy() {
    // Stop all updates
    this.pauseUpdates();
    
    // Cleanup components
    if (this.analytics) {
      this.analytics.destroy();
    }
    
    if (this.widgets) {
      this.widgets.destroy();
    }
    
    if (this.smartAlerts) {
      this.smartAlerts.destroy();
    }
    
    // Clear references
    this.chartEngine = null;
    this.analytics = null;
    this.widgets = null;
    this.smartAlerts = null;
    
    // Remove global references
    delete window.dashboardModule;
    delete window.dashboardWidgets;
    delete window.smartAlerts;
    
    this.initialized = false;
  }
}

export default DashboardModule;