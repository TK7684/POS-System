/**
 * Dashboard Analytics Manager
 * Handles real-time KPI updates, data aggregation, and analytics calculations
 */

class DashboardAnalytics {
  constructor() {
    this.kpis = new Map();
    this.charts = new Map();
    this.updateInterval = null;
    this.refreshRate = 30000; // 30 seconds
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Initialize event listeners
    this.initEventListeners();
  }

  /**
   * Initialize event listeners for data changes
   */
  initEventListeners() {
    // Listen for data updates from other modules
    document.addEventListener('pos:dataUpdated', (event) => {
      this.handleDataUpdate(event.detail);
    });
    
    // Listen for visibility changes to pause/resume updates
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseUpdates();
      } else {
        this.resumeUpdates();
      }
    });
  }

  /**
   * Start real-time updates
   */
  startRealTimeUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateAllKPIs();
    }, this.refreshRate);
    
    // Initial update
    this.updateAllKPIs();
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Pause updates (when tab is hidden)
   */
  pauseUpdates() {
    this.stopRealTimeUpdates();
  }

  /**
   * Resume updates (when tab becomes visible)
   */
  resumeUpdates() {
    this.startRealTimeUpdates();
  }

  /**
   * Handle data updates from other modules
   */
  handleDataUpdate(updateInfo) {
    const { type, data } = updateInfo;
    
    // Clear relevant cache
    this.clearCacheByType(type);
    
    // Update specific KPIs based on data type
    switch (type) {
      case 'sale':
        this.updateSalesKPIs();
        this.updateRevenueChart();
        break;
      case 'purchase':
        this.updateInventoryKPIs();
        this.updateCostChart();
        break;
      case 'stock':
        this.updateStockKPIs();
        break;
      default:
        this.updateAllKPIs();
    }
  }

  /**
   * Update all KPIs
   */
  async updateAllKPIs() {
    try {
      await Promise.all([
        this.updateSalesKPIs(),
        this.updateInventoryKPIs(),
        this.updateStockKPIs(),
        this.updateProfitKPIs()
      ]);
    } catch (error) {
      console.error('Failed to update KPIs:', error);
    }
  }

  /**
   * Update sales-related KPIs
   */
  async updateSalesKPIs() {
    try {
      const salesData = await this.getSalesData();
      
      // Today's sales
      const todaySales = this.calculateTodaySales(salesData);
      this.updateKPI('today-sales', todaySales.total, {
        change: todaySales.change,
        trend: todaySales.trend
      });
      
      // This week's sales
      const weekSales = this.calculateWeekSales(salesData);
      this.updateKPI('week-sales', weekSales.total, {
        change: weekSales.change,
        trend: weekSales.trend
      });
      
      // Average order value
      const avgOrder = this.calculateAverageOrderValue(salesData);
      this.updateKPI('avg-order', avgOrder.value, {
        change: avgOrder.change,
        trend: avgOrder.trend
      });
      
      // Top selling items
      const topItems = this.calculateTopSellingItems(salesData);
      this.updateKPI('top-items', topItems.length, {
        items: topItems
      });
      
    } catch (error) {
      console.error('Failed to update sales KPIs:', error);
    }
  }

  /**
   * Update inventory-related KPIs
   */
  async updateInventoryKPIs() {
    try {
      const inventoryData = await this.getInventoryData();
      
      // Low stock items
      const lowStock = this.calculateLowStockItems(inventoryData);
      this.updateKPI('low-stock', lowStock.count, {
        items: lowStock.items,
        critical: lowStock.critical
      });
      
      // Total inventory value
      const inventoryValue = this.calculateInventoryValue(inventoryData);
      this.updateKPI('inventory-value', inventoryValue.total, {
        change: inventoryValue.change,
        trend: inventoryValue.trend
      });
      
      // Inventory turnover
      const turnover = this.calculateInventoryTurnover(inventoryData);
      this.updateKPI('inventory-turnover', turnover.rate, {
        change: turnover.change,
        trend: turnover.trend
      });
      
    } catch (error) {
      console.error('Failed to update inventory KPIs:', error);
    }
  }

  /**
   * Update stock-related KPIs
   */
  async updateStockKPIs() {
    try {
      const stockData = await this.getStockData();
      
      // Stock alerts
      const alerts = this.calculateStockAlerts(stockData);
      this.updateKPI('stock-alerts', alerts.count, {
        alerts: alerts.items
      });
      
      // Stock efficiency
      const efficiency = this.calculateStockEfficiency(stockData);
      this.updateKPI('stock-efficiency', efficiency.score, {
        change: efficiency.change,
        trend: efficiency.trend
      });
      
    } catch (error) {
      console.error('Failed to update stock KPIs:', error);
    }
  }

  /**
   * Update profit-related KPIs
   */
  async updateProfitKPIs() {
    try {
      const [salesData, costData] = await Promise.all([
        this.getSalesData(),
        this.getCostData()
      ]);
      
      // Today's profit
      const todayProfit = this.calculateTodayProfit(salesData, costData);
      this.updateKPI('today-profit', todayProfit.total, {
        margin: todayProfit.margin,
        change: todayProfit.change,
        trend: todayProfit.trend
      });
      
      // This month's profit
      const monthProfit = this.calculateMonthProfit(salesData, costData);
      this.updateKPI('month-profit', monthProfit.total, {
        margin: monthProfit.margin,
        change: monthProfit.change,
        trend: monthProfit.trend
      });
      
    } catch (error) {
      console.error('Failed to update profit KPIs:', error);
    }
  }

  /**
   * Update KPI display
   */
  updateKPI(kpiId, value, metadata = {}) {
    const kpiElement = document.getElementById(`kpi-${kpiId}`);
    if (kpiElement) {
      // Update value
      const valueElement = kpiElement.querySelector('.v') || kpiElement;
      valueElement.textContent = this.formatKPIValue(value, kpiId);
      
      // Update trend indicator
      if (metadata.trend) {
        this.updateTrendIndicator(kpiElement, metadata.trend, metadata.change);
      }
      
      // Store KPI data
      this.kpis.set(kpiId, {
        value,
        metadata,
        lastUpdated: Date.now()
      });
      
      // Trigger update event
      document.dispatchEvent(new CustomEvent('pos:kpiUpdated', {
        detail: { kpiId, value, metadata }
      }));
    }
  }

  /**
   * Update trend indicator
   */
  updateTrendIndicator(element, trend, change) {
    let indicator = element.querySelector('.trend-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'trend-indicator';
      element.appendChild(indicator);
    }
    
    const arrow = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
    const color = trend === 'up' ? '#059669' : trend === 'down' ? '#dc2626' : '#64748b';
    const changeText = change ? ` ${Math.abs(change).toFixed(1)}%` : '';
    
    indicator.innerHTML = `<span style="color: ${color}; font-size: 12px;">${arrow}${changeText}</span>`;
  }

  /**
   * Format KPI value for display
   */
  formatKPIValue(value, kpiId) {
    if (typeof value !== 'number') return value;
    
    // Currency values
    if (kpiId.includes('sales') || kpiId.includes('profit') || kpiId.includes('value')) {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    // Percentage values
    if (kpiId.includes('margin') || kpiId.includes('efficiency') || kpiId.includes('turnover')) {
      return `${value.toFixed(1)}%`;
    }
    
    // Count values
    return Math.round(value).toLocaleString('th-TH');
  }

  /**
   * Get sales data with caching
   */
  async getSalesData() {
    const cacheKey = 'sales-data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const data = await this.fetchSalesData();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      return [];
    }
  }

  /**
   * Get inventory data with caching
   */
  async getInventoryData() {
    const cacheKey = 'inventory-data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const data = await this.fetchInventoryData();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      return [];
    }
  }

  /**
   * Get stock data with caching
   */
  async getStockData() {
    const cacheKey = 'stock-data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const data = await this.fetchStockData();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
      return [];
    }
  }

  /**
   * Get cost data with caching
   */
  async getCostData() {
    const cacheKey = 'cost-data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const data = await this.fetchCostData();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch cost data:', error);
      return [];
    }
  }

  /**
   * Fetch sales data from API
   */
  async fetchSalesData() {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getSalesAnalyticsData();
      } else {
        // Fallback with mock data for development
        resolve(this.getMockSalesData());
      }
    });
  }

  /**
   * Fetch inventory data from API
   */
  async fetchInventoryData() {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getInventoryAnalyticsData();
      } else {
        // Fallback with mock data for development
        resolve(this.getMockInventoryData());
      }
    });
  }

  /**
   * Fetch stock data from API
   */
  async fetchStockData() {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getStockAnalyticsData();
      } else {
        // Fallback with mock data for development
        resolve(this.getMockStockData());
      }
    });
  }

  /**
   * Fetch cost data from API
   */
  async fetchCostData() {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getCostAnalyticsData();
      } else {
        // Fallback with mock data for development
        resolve(this.getMockCostData());
      }
    });
  }

  // Calculation methods for various KPIs
  calculateTodaySales(salesData) {
    const today = new Date().toDateString();
    const todaySales = salesData.filter(sale => 
      new Date(sale.date).toDateString() === today
    );
    
    const total = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
    
    // Calculate change from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySales = salesData.filter(sale => 
      new Date(sale.date).toDateString() === yesterday.toDateString()
    );
    const yesterdayTotal = yesterdaySales.reduce((sum, sale) => sum + sale.amount, 0);
    
    const change = yesterdayTotal > 0 ? ((total - yesterdayTotal) / yesterdayTotal) * 100 : 0;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { total, change, trend };
  }

  calculateWeekSales(salesData) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSales = salesData.filter(sale => 
      new Date(sale.date) >= weekAgo
    );
    
    const total = weekSales.reduce((sum, sale) => sum + sale.amount, 0);
    
    // Calculate change from previous week
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const prevWeekSales = salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= twoWeeksAgo && saleDate < weekAgo;
    });
    const prevWeekTotal = prevWeekSales.reduce((sum, sale) => sum + sale.amount, 0);
    
    const change = prevWeekTotal > 0 ? ((total - prevWeekTotal) / prevWeekTotal) * 100 : 0;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { total, change, trend };
  }

  calculateAverageOrderValue(salesData) {
    if (salesData.length === 0) return { value: 0, change: 0, trend: 'stable' };
    
    const total = salesData.reduce((sum, sale) => sum + sale.amount, 0);
    const value = total / salesData.length;
    
    // Calculate change (simplified - could be more sophisticated)
    const change = Math.random() * 10 - 5; // Mock change for now
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { value, change, trend };
  }

  calculateTopSellingItems(salesData) {
    const itemCounts = {};
    
    salesData.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
      }
    });
    
    return Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  calculateLowStockItems(inventoryData) {
    const lowStockItems = inventoryData.filter(item => 
      item.currentStock <= item.minStock
    );
    
    const critical = lowStockItems.filter(item => 
      item.currentStock <= item.minStock * 0.5
    );
    
    return {
      count: lowStockItems.length,
      items: lowStockItems,
      critical: critical.length
    };
  }

  calculateInventoryValue(inventoryData) {
    const total = inventoryData.reduce((sum, item) => 
      sum + (item.currentStock * item.unitCost), 0
    );
    
    // Mock change calculation
    const change = Math.random() * 10 - 5;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { total, change, trend };
  }

  calculateInventoryTurnover(inventoryData) {
    // Simplified turnover calculation
    const rate = Math.random() * 20 + 10; // Mock rate between 10-30%
    const change = Math.random() * 5 - 2.5;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { rate, change, trend };
  }

  calculateStockAlerts(stockData) {
    const alerts = stockData.filter(item => 
      item.alert || item.currentStock <= item.reorderPoint
    );
    
    return {
      count: alerts.length,
      items: alerts
    };
  }

  calculateStockEfficiency(stockData) {
    // Mock efficiency calculation
    const score = Math.random() * 30 + 70; // Score between 70-100%
    const change = Math.random() * 5 - 2.5;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { score, change, trend };
  }

  calculateTodayProfit(salesData, costData) {
    const todaySales = this.calculateTodaySales(salesData);
    const todayCosts = costData.filter(cost => 
      new Date(cost.date).toDateString() === new Date().toDateString()
    );
    
    const totalCosts = todayCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const total = todaySales.total - totalCosts;
    const margin = todaySales.total > 0 ? (total / todaySales.total) * 100 : 0;
    
    // Mock change calculation
    const change = Math.random() * 20 - 10;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { total, margin, change, trend };
  }

  calculateMonthProfit(salesData, costData) {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const monthSales = salesData.filter(sale => 
      new Date(sale.date) >= monthAgo
    );
    const monthCosts = costData.filter(cost => 
      new Date(cost.date) >= monthAgo
    );
    
    const totalSales = monthSales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCosts = monthCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const total = totalSales - totalCosts;
    const margin = totalSales > 0 ? (total / totalSales) * 100 : 0;
    
    // Mock change calculation
    const change = Math.random() * 15 - 7.5;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { total, margin, change, trend };
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCacheByType(type) {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.includes(type)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clearAllCache() {
    this.cache.clear();
  }

  // Mock data for development
  getMockSalesData() {
    const data = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString(),
        amount: Math.random() * 5000 + 1000,
        items: [
          { name: 'กุ้งแซ่บ', quantity: Math.floor(Math.random() * 5) + 1 },
          { name: 'ส้มตำ', quantity: Math.floor(Math.random() * 3) + 1 }
        ]
      });
    }
    return data;
  }

  getMockInventoryData() {
    return [
      { name: 'กุ้ง', currentStock: 15, minStock: 20, unitCost: 200 },
      { name: 'มะละกอ', currentStock: 5, minStock: 10, unitCost: 30 },
      { name: 'น้ำปลา', currentStock: 25, minStock: 15, unitCost: 45 },
      { name: 'มะนาว', currentStock: 8, minStock: 12, unitCost: 25 }
    ];
  }

  getMockStockData() {
    return [
      { name: 'กุ้ง', currentStock: 15, reorderPoint: 20, alert: true },
      { name: 'มะละกอ', currentStock: 5, reorderPoint: 10, alert: true },
      { name: 'น้ำปลา', currentStock: 25, reorderPoint: 15, alert: false }
    ];
  }

  getMockCostData() {
    const data = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString(),
        amount: Math.random() * 2000 + 500
      });
    }
    return data;
  }

  /**
   * Cleanup when component is destroyed
   */
  destroy() {
    this.stopRealTimeUpdates();
    this.clearAllCache();
    this.kpis.clear();
    this.charts.clear();
  }
}

export default DashboardAnalytics;