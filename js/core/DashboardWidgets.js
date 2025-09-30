/**
 * Dashboard Widget Manager
 * Handles customizable dashboard widgets with drag-and-drop functionality
 */

class DashboardWidgets {
  constructor(chartEngine, analytics) {
    this.chartEngine = chartEngine;
    this.analytics = analytics;
    this.widgets = new Map();
    this.widgetContainer = null;
    this.draggedWidget = null;
    this.touchStartPos = null;
    
    // Widget configurations
    this.availableWidgets = {
      'sales-trend': {
        title: 'แนวโน้มยอดขาย',
        type: 'chart',
        chartType: 'line',
        size: 'large',
        refreshInterval: 30000
      },
      'revenue-bars': {
        title: 'รายได้รายวัน',
        type: 'chart',
        chartType: 'bar',
        size: 'medium',
        refreshInterval: 60000
      },
      'top-products': {
        title: 'สินค้าขายดี',
        type: 'chart',
        chartType: 'donut',
        size: 'medium',
        refreshInterval: 120000
      },
      'kpi-summary': {
        title: 'สรุป KPI',
        type: 'kpi',
        size: 'large',
        refreshInterval: 30000
      },
      'low-stock-alert': {
        title: 'แจ้งเตือนสต๊อกต่ำ',
        type: 'alert',
        size: 'medium',
        refreshInterval: 60000
      },
      'quick-stats': {
        title: 'สถิติด่วน',
        type: 'stats',
        size: 'small',
        refreshInterval: 30000
      },
      'profit-margin': {
        title: 'อัตรากำไร',
        type: 'gauge',
        size: 'small',
        refreshInterval: 60000
      },
      'recent-transactions': {
        title: 'ธุรกรรมล่าสุด',
        type: 'list',
        size: 'medium',
        refreshInterval: 15000
      }
    };
    
    this.initializeWidgets();
  }

  /**
   * Initialize widget system
   */
  initializeWidgets() {
    this.loadWidgetPreferences();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for analytics updates
    document.addEventListener('pos:kpiUpdated', (event) => {
      this.updateWidgetData(event.detail);
    });
    
    // Listen for data updates
    document.addEventListener('pos:dataUpdated', (event) => {
      this.refreshRelevantWidgets(event.detail.type);
    });
  }

  /**
   * Initialize dashboard with widgets
   */
  initializeDashboard(container) {
    this.widgetContainer = container;
    this.createWidgetGrid();
    this.renderActiveWidgets();
    this.setupDragAndDrop();
  }

  /**
   * Create widget grid layout
   */
  createWidgetGrid() {
    if (!this.widgetContainer) return;
    
    this.widgetContainer.innerHTML = `
      <div class="dashboard-header">
        <div class="dashboard-title">
          <h2>แดชบอร์ด</h2>
          <div class="dashboard-controls">
            <button class="btn ghost" id="customize-dashboard" title="ปรับแต่งแดชบอร์ด">
              ⚙️
            </button>
            <button class="btn ghost" id="refresh-dashboard" title="รีเฟรชข้อมูล">
              🔄
            </button>
          </div>
        </div>
        <div class="dashboard-filters">
          <select id="dashboard-period" class="select">
            <option value="today">วันนี้</option>
            <option value="week">สัปดาห์นี้</option>
            <option value="month">เดือนนี้</option>
            <option value="quarter">ไตรมาสนี้</option>
          </select>
        </div>
      </div>
      <div class="widget-grid" id="widget-grid">
        <!-- Widgets will be rendered here -->
      </div>
      <div class="widget-customizer hide" id="widget-customizer">
        <div class="customizer-header">
          <h3>ปรับแต่งแดชบอร์ด</h3>
          <button class="btn ghost" id="close-customizer">✕</button>
        </div>
        <div class="available-widgets" id="available-widgets">
          <!-- Available widgets will be listed here -->
        </div>
      </div>
    `;
    
    this.setupDashboardControls();
  }

  /**
   * Setup dashboard controls
   */
  setupDashboardControls() {
    const customizeBtn = document.getElementById('customize-dashboard');
    const refreshBtn = document.getElementById('refresh-dashboard');
    const periodSelect = document.getElementById('dashboard-period');
    const closeCustomizer = document.getElementById('close-customizer');
    
    if (customizeBtn) {
      customizeBtn.addEventListener('click', () => this.showCustomizer());
    }
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshAllWidgets());
    }
    
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        this.changePeriod(e.target.value);
      });
    }
    
    if (closeCustomizer) {
      closeCustomizer.addEventListener('click', () => this.hideCustomizer());
    }
  }

  /**
   * Render active widgets
   */
  renderActiveWidgets() {
    const grid = document.getElementById('widget-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Get active widgets from preferences
    const activeWidgets = this.getActiveWidgets();
    
    activeWidgets.forEach(widgetId => {
      const widget = this.createWidget(widgetId);
      if (widget) {
        grid.appendChild(widget);
        this.loadWidgetData(widgetId);
      }
    });
  }

  /**
   * Create a widget element
   */
  createWidget(widgetId) {
    const config = this.availableWidgets[widgetId];
    if (!config) return null;
    
    const widget = document.createElement('div');
    widget.className = `widget widget-${config.size} widget-${config.type}`;
    widget.dataset.widgetId = widgetId;
    widget.draggable = true;
    
    widget.innerHTML = `
      <div class="widget-header">
        <h3 class="widget-title">${config.title}</h3>
        <div class="widget-controls">
          <button class="widget-refresh" title="รีเฟรช">🔄</button>
          <button class="widget-remove" title="ลบ">✕</button>
        </div>
      </div>
      <div class="widget-content" id="widget-content-${widgetId}">
        <div class="widget-loading">กำลังโหลด...</div>
      </div>
    `;
    
    this.setupWidgetControls(widget, widgetId);
    return widget;
  }

  /**
   * Setup widget controls
   */
  setupWidgetControls(widget, widgetId) {
    const refreshBtn = widget.querySelector('.widget-refresh');
    const removeBtn = widget.querySelector('.widget-remove');
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.refreshWidget(widgetId);
      });
    }
    
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeWidget(widgetId);
      });
    }
  }

  /**
   * Load widget data
   */
  async loadWidgetData(widgetId) {
    const config = this.availableWidgets[widgetId];
    const contentElement = document.getElementById(`widget-content-${widgetId}`);
    
    if (!config || !contentElement) return;
    
    try {
      contentElement.innerHTML = '<div class="widget-loading">กำลังโหลด...</div>';
      
      switch (config.type) {
        case 'chart':
          await this.loadChartWidget(widgetId, config, contentElement);
          break;
        case 'kpi':
          await this.loadKPIWidget(widgetId, config, contentElement);
          break;
        case 'alert':
          await this.loadAlertWidget(widgetId, config, contentElement);
          break;
        case 'stats':
          await this.loadStatsWidget(widgetId, config, contentElement);
          break;
        case 'gauge':
          await this.loadGaugeWidget(widgetId, config, contentElement);
          break;
        case 'list':
          await this.loadListWidget(widgetId, config, contentElement);
          break;
        default:
          contentElement.innerHTML = '<div class="widget-error">ไม่สามารถโหลดข้อมูลได้</div>';
      }
    } catch (error) {
      console.error(`Failed to load widget ${widgetId}:`, error);
      contentElement.innerHTML = '<div class="widget-error">เกิดข้อผิดพลาด</div>';
    }
  }

  /**
   * Load chart widget
   */
  async loadChartWidget(widgetId, config, contentElement) {
    const data = await this.getWidgetData(widgetId);
    
    contentElement.innerHTML = '<div class="chart-container"></div>';
    const chartContainer = contentElement.querySelector('.chart-container');
    
    const chartOptions = {
      type: config.chartType,
      animate: true,
      color: '#0f766e'
    };
    
    if (config.chartType === 'line') {
      this.chartEngine.createLineChart(chartContainer, data, chartOptions);
    } else if (config.chartType === 'bar') {
      this.chartEngine.createBarChart(chartContainer, data, chartOptions);
    } else if (config.chartType === 'donut') {
      this.chartEngine.createDonutChart(chartContainer, data, chartOptions);
    }
  }

  /**
   * Load KPI widget
   */
  async loadKPIWidget(widgetId, config, contentElement) {
    const kpis = await this.getKPIData();
    
    contentElement.innerHTML = `
      <div class="kpi-grid">
        ${kpis.map(kpi => `
          <div class="kpi-item">
            <div class="kpi-value">${kpi.value}</div>
            <div class="kpi-label">${kpi.label}</div>
            ${kpi.trend ? `<div class="kpi-trend ${kpi.trend}">${kpi.change}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Load alert widget
   */
  async loadAlertWidget(widgetId, config, contentElement) {
    const alerts = await this.getAlertData();
    
    if (alerts.length === 0) {
      contentElement.innerHTML = '<div class="no-alerts">ไม่มีการแจ้งเตือน</div>';
      return;
    }
    
    contentElement.innerHTML = `
      <div class="alert-list">
        ${alerts.map(alert => `
          <div class="alert-item ${alert.priority}">
            <div class="alert-icon">${alert.icon}</div>
            <div class="alert-content">
              <div class="alert-title">${alert.title}</div>
              <div class="alert-message">${alert.message}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Load stats widget
   */
  async loadStatsWidget(widgetId, config, contentElement) {
    const stats = await this.getStatsData();
    
    contentElement.innerHTML = `
      <div class="stats-grid">
        ${stats.map(stat => `
          <div class="stat-item">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-content">
              <div class="stat-value">${stat.value}</div>
              <div class="stat-label">${stat.label}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Load gauge widget
   */
  async loadGaugeWidget(widgetId, config, contentElement) {
    const gaugeData = await this.getGaugeData(widgetId);
    
    contentElement.innerHTML = '<div class="gauge-container"></div>';
    const gaugeContainer = contentElement.querySelector('.gauge-container');
    
    this.createGauge(gaugeContainer, gaugeData);
  }

  /**
   * Load list widget
   */
  async loadListWidget(widgetId, config, contentElement) {
    const listData = await this.getListData(widgetId);
    
    contentElement.innerHTML = `
      <div class="list-container">
        ${listData.map(item => `
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-title">${item.title}</div>
              <div class="list-item-subtitle">${item.subtitle}</div>
            </div>
            <div class="list-item-value">${item.value}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Create gauge visualization
   */
  createGauge(container, data) {
    const { value, max, label, color } = data;
    const percentage = (value / max) * 100;
    
    container.innerHTML = `
      <div class="gauge">
        <svg viewBox="0 0 200 120" class="gauge-svg">
          <path d="M 20 100 A 80 80 0 0 1 180 100" 
                stroke="#e2e8f0" 
                stroke-width="20" 
                fill="none"/>
          <path d="M 20 100 A 80 80 0 0 1 180 100" 
                stroke="${color || '#0f766e'}" 
                stroke-width="20" 
                fill="none"
                stroke-dasharray="${percentage * 2.51} 251"
                stroke-linecap="round"/>
          <text x="100" y="90" text-anchor="middle" class="gauge-value">${value}%</text>
        </svg>
        <div class="gauge-label">${label}</div>
      </div>
    `;
  }

  /**
   * Show widget customizer
   */
  showCustomizer() {
    const customizer = document.getElementById('widget-customizer');
    const availableWidgets = document.getElementById('available-widgets');
    
    if (!customizer || !availableWidgets) return;
    
    // Populate available widgets
    availableWidgets.innerHTML = Object.entries(this.availableWidgets)
      .map(([id, config]) => `
        <div class="available-widget" data-widget-id="${id}">
          <div class="widget-preview">
            <h4>${config.title}</h4>
            <p>ประเภท: ${config.type} | ขนาด: ${config.size}</p>
          </div>
          <button class="btn ${this.isWidgetActive(id) ? 'danger' : 'brand'}" 
                  onclick="dashboardWidgets.toggleWidget('${id}')">
            ${this.isWidgetActive(id) ? 'ลบ' : 'เพิ่ม'}
          </button>
        </div>
      `).join('');
    
    customizer.classList.remove('hide');
  }

  /**
   * Hide widget customizer
   */
  hideCustomizer() {
    const customizer = document.getElementById('widget-customizer');
    if (customizer) {
      customizer.classList.add('hide');
    }
  }

  /**
   * Toggle widget active state
   */
  toggleWidget(widgetId) {
    if (this.isWidgetActive(widgetId)) {
      this.removeWidget(widgetId);
    } else {
      this.addWidget(widgetId);
    }
    
    this.saveWidgetPreferences();
    this.showCustomizer(); // Refresh customizer
  }

  /**
   * Add widget to dashboard
   */
  addWidget(widgetId) {
    const activeWidgets = this.getActiveWidgets();
    if (!activeWidgets.includes(widgetId)) {
      activeWidgets.push(widgetId);
      this.setActiveWidgets(activeWidgets);
      this.renderActiveWidgets();
    }
  }

  /**
   * Remove widget from dashboard
   */
  removeWidget(widgetId) {
    const activeWidgets = this.getActiveWidgets();
    const index = activeWidgets.indexOf(widgetId);
    if (index > -1) {
      activeWidgets.splice(index, 1);
      this.setActiveWidgets(activeWidgets);
      this.renderActiveWidgets();
    }
  }

  /**
   * Refresh specific widget
   */
  async refreshWidget(widgetId) {
    const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (widget) {
      const refreshBtn = widget.querySelector('.widget-refresh');
      if (refreshBtn) {
        refreshBtn.style.animation = 'spin 1s linear infinite';
      }
      
      await this.loadWidgetData(widgetId);
      
      if (refreshBtn) {
        refreshBtn.style.animation = '';
      }
    }
  }

  /**
   * Refresh all widgets
   */
  async refreshAllWidgets() {
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.style.animation = 'spin 1s linear infinite';
    }
    
    const activeWidgets = this.getActiveWidgets();
    await Promise.all(activeWidgets.map(widgetId => this.loadWidgetData(widgetId)));
    
    if (refreshBtn) {
      refreshBtn.style.animation = '';
    }
  }

  /**
   * Change dashboard period
   */
  changePeriod(period) {
    // Update all widgets with new period
    this.currentPeriod = period;
    this.refreshAllWidgets();
  }

  /**
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    const grid = document.getElementById('widget-grid');
    if (!grid) return;
    
    // Mouse events
    grid.addEventListener('dragstart', this.handleDragStart.bind(this));
    grid.addEventListener('dragover', this.handleDragOver.bind(this));
    grid.addEventListener('drop', this.handleDrop.bind(this));
    grid.addEventListener('dragend', this.handleDragEnd.bind(this));
    
    // Touch events for mobile
    grid.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    grid.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    grid.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  handleDragStart(e) {
    if (e.target.classList.contains('widget')) {
      this.draggedWidget = e.target;
      e.target.style.opacity = '0.5';
    }
  }

  handleDragOver(e) {
    e.preventDefault();
  }

  handleDrop(e) {
    e.preventDefault();
    if (this.draggedWidget && e.target.classList.contains('widget')) {
      this.swapWidgets(this.draggedWidget, e.target);
    }
  }

  handleDragEnd(e) {
    if (e.target.classList.contains('widget')) {
      e.target.style.opacity = '';
    }
    this.draggedWidget = null;
  }

  handleTouchStart(e) {
    if (e.target.closest('.widget')) {
      this.draggedWidget = e.target.closest('.widget');
      this.touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }

  handleTouchMove(e) {
    if (this.draggedWidget && this.touchStartPos) {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.touchStartPos.x;
      const deltaY = touch.clientY - this.touchStartPos.y;
      
      // Move widget visually
      this.draggedWidget.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      this.draggedWidget.style.zIndex = '1000';
    }
  }

  handleTouchEnd(e) {
    if (this.draggedWidget) {
      // Find widget under touch point
      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetWidget = elementBelow?.closest('.widget');
      
      if (targetWidget && targetWidget !== this.draggedWidget) {
        this.swapWidgets(this.draggedWidget, targetWidget);
      }
      
      // Reset widget position
      this.draggedWidget.style.transform = '';
      this.draggedWidget.style.zIndex = '';
      this.draggedWidget = null;
      this.touchStartPos = null;
    }
  }

  swapWidgets(widget1, widget2) {
    const parent = widget1.parentNode;
    const sibling = widget1.nextSibling === widget2 ? widget1 : widget1.nextSibling;
    
    widget2.parentNode.insertBefore(widget1, widget2);
    parent.insertBefore(widget2, sibling);
    
    this.saveWidgetOrder();
  }

  // Data fetching methods
  async getWidgetData(widgetId) {
    // Mock data for different widget types
    switch (widgetId) {
      case 'sales-trend':
        return this.generateTrendData();
      case 'revenue-bars':
        return this.generateBarData();
      case 'top-products':
        return this.generateDonutData();
      default:
        return [];
    }
  }

  async getKPIData() {
    return [
      { label: 'ยอดขายวันนี้', value: '฿12,450', trend: 'up', change: '+8.5%' },
      { label: 'กำไรวันนี้', value: '฿3,680', trend: 'up', change: '+12.3%' },
      { label: 'ออเดอร์วันนี้', value: '47', trend: 'down', change: '-2.1%' },
      { label: 'สต๊อกต่ำ', value: '3', trend: 'stable', change: '' }
    ];
  }

  async getAlertData() {
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

  async getStatsData() {
    return [
      { icon: '💰', label: 'รายได้', value: '฿45.2K' },
      { icon: '📊', label: 'ออเดอร์', value: '234' },
      { icon: '📈', label: 'เติบโต', value: '+12%' },
      { icon: '⭐', label: 'คะแนน', value: '4.8' }
    ];
  }

  async getGaugeData(widgetId) {
    return {
      value: 78,
      max: 100,
      label: 'อัตรากำไร',
      color: '#059669'
    };
  }

  async getListData(widgetId) {
    return [
      { title: 'กุ้งแซ่บ', subtitle: '2 นาทีที่แล้ว', value: '฿120' },
      { title: 'ส้มตำ', subtitle: '5 นาทีที่แล้ว', value: '฿80' },
      { title: 'ลาบ', subtitle: '8 นาทีที่แล้ว', value: '฿100' }
    ];
  }

  generateTrendData() {
    const data = [];
    for (let i = 0; i < 7; i++) {
      data.push({
        label: `Day ${i + 1}`,
        value: Math.random() * 5000 + 1000
      });
    }
    return data;
  }

  generateBarData() {
    return [
      { label: 'จ', value: 3200 },
      { label: 'อ', value: 4100 },
      { label: 'พ', value: 2800 },
      { label: 'พฤ', value: 5200 },
      { label: 'ศ', value: 4800 },
      { label: 'ส', value: 6100 },
      { label: 'อา', value: 5500 }
    ];
  }

  generateDonutData() {
    return [
      { label: 'กุ้งแซ่บ', value: 45, color: '#0f766e' },
      { label: 'ส้มตำ', value: 30, color: '#14b8a6' },
      { label: 'ลาบ', value: 15, color: '#059669' },
      { label: 'อื่นๆ', value: 10, color: '#64748b' }
    ];
  }

  // Preference management
  getActiveWidgets() {
    const saved = localStorage.getItem('dashboard-widgets');
    return saved ? JSON.parse(saved) : ['kpi-summary', 'sales-trend', 'low-stock-alert', 'quick-stats'];
  }

  setActiveWidgets(widgets) {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }

  isWidgetActive(widgetId) {
    return this.getActiveWidgets().includes(widgetId);
  }

  saveWidgetPreferences() {
    // Save current widget configuration
    const widgets = Array.from(document.querySelectorAll('.widget')).map(widget => 
      widget.dataset.widgetId
    );
    this.setActiveWidgets(widgets);
  }

  saveWidgetOrder() {
    this.saveWidgetPreferences();
  }

  loadWidgetPreferences() {
    // Widget preferences are loaded when rendering
  }

  /**
   * Update widget data when analytics change
   */
  updateWidgetData(kpiData) {
    // Update relevant widgets based on KPI changes
    const { kpiId, value, metadata } = kpiData;
    
    // Find widgets that should be updated
    this.getActiveWidgets().forEach(widgetId => {
      if (this.shouldUpdateWidget(widgetId, kpiId)) {
        this.refreshWidget(widgetId);
      }
    });
  }

  /**
   * Check if widget should be updated based on KPI change
   */
  shouldUpdateWidget(widgetId, kpiId) {
    const updateMap = {
      'kpi-summary': true, // Always update KPI summary
      'sales-trend': kpiId.includes('sales'),
      'revenue-bars': kpiId.includes('sales') || kpiId.includes('revenue'),
      'low-stock-alert': kpiId.includes('stock') || kpiId.includes('inventory'),
      'quick-stats': true, // Always update quick stats
      'profit-margin': kpiId.includes('profit') || kpiId.includes('margin')
    };
    
    return updateMap[widgetId] || false;
  }

  /**
   * Refresh widgets based on data type
   */
  refreshRelevantWidgets(dataType) {
    const relevantWidgets = {
      'sale': ['sales-trend', 'revenue-bars', 'kpi-summary', 'quick-stats', 'recent-transactions'],
      'purchase': ['low-stock-alert', 'kpi-summary', 'quick-stats'],
      'stock': ['low-stock-alert', 'kpi-summary']
    };
    
    const widgetsToRefresh = relevantWidgets[dataType] || [];
    widgetsToRefresh.forEach(widgetId => {
      if (this.isWidgetActive(widgetId)) {
        this.refreshWidget(widgetId);
      }
    });
  }

  /**
   * Cleanup when component is destroyed
   */
  destroy() {
    this.widgets.clear();
    if (this.widgetContainer) {
      this.widgetContainer.innerHTML = '';
    }
  }
}

export default DashboardWidgets;