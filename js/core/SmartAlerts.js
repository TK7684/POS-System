/**
 * Smart Alerts and Notifications System
 * Priority-based notification system with smart thresholds and performance alerts
 */

class SmartAlerts {
  constructor() {
    this.alerts = new Map();
    this.notifications = new Map();
    this.alertRules = new Map();
    this.thresholds = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;
    
    // Alert priorities
    this.priorities = {
      CRITICAL: { level: 1, color: '#dc2626', icon: '🚨', sound: true },
      HIGH: { level: 2, color: '#ea580c', icon: '⚠️', sound: true },
      MEDIUM: { level: 3, color: '#d97706', icon: '⚡', sound: false },
      LOW: { level: 4, color: '#0891b2', icon: 'ℹ️', sound: false },
      INFO: { level: 5, color: '#059669', icon: '✅', sound: false }
    };
    
    // Default thresholds
    this.defaultThresholds = {
      lowStock: {
        critical: 0.1, // 10% of min stock
        high: 0.5,     // 50% of min stock
        medium: 0.8    // 80% of min stock
      },
      performance: {
        responseTime: 2000,    // 2 seconds
        errorRate: 0.05,       // 5%
        memoryUsage: 0.8       // 80%
      },
      sales: {
        dailyTarget: 10000,    // Daily sales target
        hourlyTarget: 500,     // Hourly sales target
        conversionRate: 0.3    // 30% conversion rate
      },
      inventory: {
        turnoverRate: 12,      // 12 times per year
        wastePercentage: 0.05, // 5% waste
        costVariance: 0.1      // 10% cost variance
      }
    };
    
    this.initializeAlerts();
  }

  /**
   * Initialize alert system
   */
  initializeAlerts() {
    this.loadThresholds();
    this.setupAlertRules();
    this.setupEventListeners();
    this.startAlertMonitoring();
  }

  /**
   * Load thresholds from storage or use defaults
   */
  loadThresholds() {
    const savedThresholds = localStorage.getItem('pos-alert-thresholds');
    if (savedThresholds) {
      try {
        const parsed = JSON.parse(savedThresholds);
        this.thresholds = new Map(Object.entries({
          ...this.defaultThresholds,
          ...parsed
        }));
      } catch (error) {
        console.error('Failed to load thresholds:', error);
        this.thresholds = new Map(Object.entries(this.defaultThresholds));
      }
    } else {
      this.thresholds = new Map(Object.entries(this.defaultThresholds));
    }
  }

  /**
   * Setup alert rules
   */
  setupAlertRules() {
    // Low stock alerts
    this.addAlertRule('low-stock', {
      check: (data) => this.checkLowStock(data),
      frequency: 300000, // Check every 5 minutes
      category: 'inventory',
      enabled: true
    });

    // Performance alerts
    this.addAlertRule('performance', {
      check: (data) => this.checkPerformance(data),
      frequency: 60000, // Check every minute
      category: 'system',
      enabled: true
    });

    // Sales target alerts
    this.addAlertRule('sales-target', {
      check: (data) => this.checkSalesTarget(data),
      frequency: 3600000, // Check every hour
      category: 'business',
      enabled: true
    });

    // Inventory turnover alerts
    this.addAlertRule('inventory-turnover', {
      check: (data) => this.checkInventoryTurnover(data),
      frequency: 86400000, // Check daily
      category: 'inventory',
      enabled: true
    });

    // Cost variance alerts
    this.addAlertRule('cost-variance', {
      check: (data) => this.checkCostVariance(data),
      frequency: 3600000, // Check every hour
      category: 'finance',
      enabled: true
    });

    // System health alerts
    this.addAlertRule('system-health', {
      check: (data) => this.checkSystemHealth(data),
      frequency: 120000, // Check every 2 minutes
      category: 'system',
      enabled: true
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for data updates
    document.addEventListener('pos:dataUpdated', (event) => {
      this.handleDataUpdate(event.detail);
    });

    // Listen for KPI updates
    document.addEventListener('pos:kpiUpdated', (event) => {
      this.handleKPIUpdate(event.detail);
    });

    // Listen for performance metrics
    document.addEventListener('pos:performanceUpdate', (event) => {
      this.handlePerformanceUpdate(event.detail);
    });

    // Listen for user interactions to dismiss notifications
    document.addEventListener('click', (event) => {
      if (event.target.closest('.notification')) {
        this.handleNotificationClick(event);
      }
    });
  }

  /**
   * Start alert monitoring
   */
  startAlertMonitoring() {
    // Start monitoring each alert rule
    for (const [ruleId, rule] of this.alertRules) {
      if (rule.enabled) {
        this.startRuleMonitoring(ruleId, rule);
      }
    }
  }

  /**
   * Start monitoring for a specific rule
   */
  startRuleMonitoring(ruleId, rule) {
    const interval = setInterval(async () => {
      try {
        const data = await this.getRelevantData(rule.category);
        const alerts = await rule.check(data);
        
        if (alerts && alerts.length > 0) {
          alerts.forEach(alert => this.createAlert(alert));
        }
      } catch (error) {
        console.error(`Alert rule ${ruleId} failed:`, error);
      }
    }, rule.frequency);

    // Store interval for cleanup
    rule.interval = interval;
  }

  /**
   * Add alert rule
   */
  addAlertRule(ruleId, rule) {
    this.alertRules.set(ruleId, {
      ...rule,
      id: ruleId,
      lastCheck: 0,
      interval: null
    });
  }

  /**
   * Create alert
   */
  createAlert(alertData) {
    const alertId = this.generateAlertId(alertData);
    
    // Check if alert already exists and is still valid
    if (this.alerts.has(alertId)) {
      const existingAlert = this.alerts.get(alertId);
      if (Date.now() - existingAlert.created < existingAlert.ttl) {
        return; // Don't create duplicate alerts
      }
    }

    const alert = {
      id: alertId,
      ...alertData,
      created: Date.now(),
      ttl: alertData.ttl || 3600000, // 1 hour default TTL
      dismissed: false,
      acknowledged: false
    };

    this.alerts.set(alertId, alert);
    this.createNotification(alert);
    
    // Trigger alert event
    document.dispatchEvent(new CustomEvent('pos:alertCreated', {
      detail: alert
    }));
  }

  /**
   * Create notification from alert
   */
  createNotification(alert) {
    const notification = {
      id: `notification-${alert.id}`,
      alertId: alert.id,
      title: alert.title,
      message: alert.message,
      priority: alert.priority,
      category: alert.category,
      actions: alert.actions || [],
      created: Date.now(),
      ttl: this.getNotificationTTL(alert.priority),
      dismissed: false,
      persistent: alert.persistent || false
    };

    this.notifications.set(notification.id, notification);
    this.queueNotification(notification);
  }

  /**
   * Queue notification for display
   */
  queueNotification(notification) {
    this.notificationQueue.push(notification);
    
    if (!this.isProcessing) {
      this.processNotificationQueue();
    }
  }

  /**
   * Process notification queue
   */
  async processNotificationQueue() {
    this.isProcessing = true;
    
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      await this.displayNotification(notification);
      
      // Delay between notifications to avoid overwhelming user
      if (this.notificationQueue.length > 0) {
        await this.delay(1000);
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Display notification
   */
  async displayNotification(notification) {
    const container = this.getNotificationContainer();
    const element = this.createNotificationElement(notification);
    
    container.appendChild(element);
    
    // Animate in
    requestAnimationFrame(() => {
      element.classList.add('show');
    });

    // Play sound if enabled
    if (this.priorities[notification.priority].sound) {
      this.playNotificationSound(notification.priority);
    }

    // Auto-dismiss if not persistent
    if (!notification.persistent) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, notification.ttl);
    }

    // Update notification display count
    this.updateNotificationBadge();
  }

  /**
   * Create notification element
   */
  createNotificationElement(notification) {
    const priority = this.priorities[notification.priority];
    const element = document.createElement('div');
    element.className = `notification notification-${notification.priority.toLowerCase()}`;
    element.dataset.notificationId = notification.id;
    
    element.innerHTML = `
      <div class="notification-icon" style="color: ${priority.color}">
        ${priority.icon}
      </div>
      <div class="notification-content">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        ${notification.actions.length > 0 ? `
          <div class="notification-actions">
            ${notification.actions.map(action => `
              <button class="notification-action" data-action="${action.id}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <button class="notification-dismiss" title="ปิด">✕</button>
    `;

    // Setup event listeners
    this.setupNotificationEvents(element, notification);
    
    return element;
  }

  /**
   * Setup notification event listeners
   */
  setupNotificationEvents(element, notification) {
    // Dismiss button
    const dismissBtn = element.querySelector('.notification-dismiss');
    dismissBtn.addEventListener('click', () => {
      this.dismissNotification(notification.id);
    });

    // Action buttons
    const actionBtns = element.querySelectorAll('.notification-action');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleNotificationAction(notification.id, btn.dataset.action);
      });
    });

    // Click to acknowledge
    element.addEventListener('click', (e) => {
      if (!e.target.closest('.notification-action') && !e.target.closest('.notification-dismiss')) {
        this.acknowledgeNotification(notification.id);
      }
    });
  }

  /**
   * Get notification container
   */
  getNotificationContainer() {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Dismiss notification
   */
  dismissNotification(notificationId) {
    const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (element) {
      element.classList.add('dismissing');
      setTimeout(() => {
        element.remove();
        this.updateNotificationBadge();
      }, 300);
    }

    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.dismissed = true;
      this.notifications.delete(notificationId);
    }
  }

  /**
   * Acknowledge notification
   */
  acknowledgeNotification(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.acknowledged = true;
      
      // Also acknowledge the related alert
      const alert = this.alerts.get(notification.alertId);
      if (alert) {
        alert.acknowledged = true;
      }
    }
  }

  /**
   * Handle notification action
   */
  handleNotificationAction(notificationId, actionId) {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    const action = notification.actions.find(a => a.id === actionId);
    if (!action) return;

    // Execute action
    if (action.handler) {
      action.handler(notification);
    }

    // Dismiss notification after action
    this.dismissNotification(notificationId);
  }

  /**
   * Update notification badge
   */
  updateNotificationBadge() {
    const activeNotifications = Array.from(this.notifications.values())
      .filter(n => !n.dismissed);
    
    const badge = document.getElementById('notification-badge');
    if (badge) {
      if (activeNotifications.length > 0) {
        badge.textContent = activeNotifications.length;
        badge.classList.add('show');
      } else {
        badge.classList.remove('show');
      }
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound(priority) {
    // Create audio context if not exists
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
        return;
      }
    }

    // Generate different tones for different priorities
    const frequencies = {
      CRITICAL: [800, 600, 800],
      HIGH: [600, 400],
      MEDIUM: [400],
      LOW: [300],
      INFO: [200]
    };

    const freq = frequencies[priority] || [400];
    this.playTone(freq);
  }

  /**
   * Play tone sequence
   */
  playTone(frequencies) {
    let time = this.audioContext.currentTime;
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, time);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.1, time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      
      oscillator.start(time);
      oscillator.stop(time + 0.2);
      
      time += 0.25;
    });
  }

  // Alert checking methods
  async checkLowStock(data) {
    const alerts = [];
    const thresholds = this.thresholds.get('lowStock');
    
    if (data.inventory) {
      data.inventory.forEach(item => {
        const stockRatio = item.currentStock / item.minStock;
        
        if (stockRatio <= thresholds.critical) {
          alerts.push({
            type: 'low-stock',
            priority: 'CRITICAL',
            title: 'สต๊อกหมดวิกฤต',
            message: `${item.name} เหลือเพียง ${item.currentStock} ${item.unit} (${(stockRatio * 100).toFixed(1)}% ของขั้นต่ำ)`,
            category: 'inventory',
            data: { item, stockRatio },
            actions: [
              {
                id: 'order-now',
                label: 'สั่งซื้อทันที',
                handler: (notification) => this.handleOrderNow(notification.data.item)
              },
              {
                id: 'set-reminder',
                label: 'ตั้งเตือน',
                handler: (notification) => this.handleSetReminder(notification.data.item)
              }
            ],
            persistent: true
          });
        } else if (stockRatio <= thresholds.high) {
          alerts.push({
            type: 'low-stock',
            priority: 'HIGH',
            title: 'สต๊อกต่ำ',
            message: `${item.name} เหลือ ${item.currentStock} ${item.unit} ควรสั่งซื้อเพิ่ม`,
            category: 'inventory',
            data: { item, stockRatio },
            actions: [
              {
                id: 'add-to-order',
                label: 'เพิ่มในรายการสั่งซื้อ',
                handler: (notification) => this.handleAddToOrder(notification.data.item)
              }
            ]
          });
        } else if (stockRatio <= thresholds.medium) {
          alerts.push({
            type: 'low-stock',
            priority: 'MEDIUM',
            title: 'สต๊อกใกล้หมด',
            message: `${item.name} เหลือ ${item.currentStock} ${item.unit}`,
            category: 'inventory',
            data: { item, stockRatio }
          });
        }
      });
    }
    
    return alerts;
  }

  async checkPerformance(data) {
    const alerts = [];
    const thresholds = this.thresholds.get('performance');
    
    if (data.performance) {
      const { responseTime, errorRate, memoryUsage } = data.performance;
      
      if (responseTime > thresholds.responseTime) {
        alerts.push({
          type: 'performance',
          priority: 'HIGH',
          title: 'ระบบตอบสนองช้า',
          message: `เวลาตอบสนอง ${responseTime}ms เกินกว่าที่กำหนด`,
          category: 'system',
          data: { responseTime }
        });
      }
      
      if (errorRate > thresholds.errorRate) {
        alerts.push({
          type: 'performance',
          priority: 'HIGH',
          title: 'อัตราข้อผิดพลาดสูง',
          message: `อัตราข้อผิดพลาด ${(errorRate * 100).toFixed(1)}%`,
          category: 'system',
          data: { errorRate }
        });
      }
      
      if (memoryUsage > thresholds.memoryUsage) {
        alerts.push({
          type: 'performance',
          priority: 'MEDIUM',
          title: 'การใช้หน่วยความจำสูง',
          message: `ใช้หน่วยความจำ ${(memoryUsage * 100).toFixed(1)}%`,
          category: 'system',
          data: { memoryUsage }
        });
      }
    }
    
    return alerts;
  }

  async checkSalesTarget(data) {
    const alerts = [];
    const thresholds = this.thresholds.get('sales');
    
    if (data.sales) {
      const { dailySales, hourlySales, conversionRate } = data.sales;
      
      // Check daily target
      if (dailySales < thresholds.dailyTarget * 0.5) {
        alerts.push({
          type: 'sales-target',
          priority: 'HIGH',
          title: 'ยอดขายต่ำกว่าเป้าหมาย',
          message: `ยอดขายวันนี้ ${dailySales.toLocaleString()} บาท (${((dailySales / thresholds.dailyTarget) * 100).toFixed(1)}% ของเป้าหมาย)`,
          category: 'business',
          data: { dailySales, target: thresholds.dailyTarget }
        });
      }
      
      // Check conversion rate
      if (conversionRate < thresholds.conversionRate * 0.7) {
        alerts.push({
          type: 'conversion-rate',
          priority: 'MEDIUM',
          title: 'อัตราการแปลงต่ำ',
          message: `อัตราการแปลง ${(conversionRate * 100).toFixed(1)}% ต่ำกว่าปกติ`,
          category: 'business',
          data: { conversionRate }
        });
      }
    }
    
    return alerts;
  }

  async checkInventoryTurnover(data) {
    const alerts = [];
    const thresholds = this.thresholds.get('inventory');
    
    if (data.inventory) {
      data.inventory.forEach(item => {
        if (item.turnoverRate < thresholds.turnoverRate * 0.5) {
          alerts.push({
            type: 'slow-moving',
            priority: 'MEDIUM',
            title: 'สินค้าหมุนเวียนช้า',
            message: `${item.name} หมุนเวียน ${item.turnoverRate} ครั้ง/ปี ต่ำกว่าเป้าหมาย`,
            category: 'inventory',
            data: { item }
          });
        }
      });
    }
    
    return alerts;
  }

  async checkCostVariance(data) {
    const alerts = [];
    const thresholds = this.thresholds.get('inventory');
    
    if (data.costs) {
      data.costs.forEach(cost => {
        if (Math.abs(cost.variance) > thresholds.costVariance) {
          alerts.push({
            type: 'cost-variance',
            priority: cost.variance > 0 ? 'HIGH' : 'MEDIUM',
            title: 'ต้นทุนผันแปร',
            message: `${cost.item} ต้นทุน${cost.variance > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${(Math.abs(cost.variance) * 100).toFixed(1)}%`,
            category: 'finance',
            data: { cost }
          });
        }
      });
    }
    
    return alerts;
  }

  async checkSystemHealth(data) {
    const alerts = [];
    
    if (data.system) {
      const { uptime, connectivity, syncStatus } = data.system;
      
      if (connectivity === false) {
        alerts.push({
          type: 'connectivity',
          priority: 'CRITICAL',
          title: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
          message: 'ระบบทำงานในโหมดออฟไลน์',
          category: 'system',
          persistent: true
        });
      }
      
      if (syncStatus === 'failed') {
        alerts.push({
          type: 'sync-failed',
          priority: 'HIGH',
          title: 'การซิงค์ข้อมูลล้มเหลว',
          message: 'ข้อมูลอาจไม่เป็นปัจจุบัน',
          category: 'system'
        });
      }
    }
    
    return alerts;
  }

  // Action handlers
  handleOrderNow(item) {
    // Navigate to purchase screen with pre-filled item
    if (window.routeTo) {
      window.routeTo('purchase');
      setTimeout(() => {
        const ingredientSelect = document.getElementById('p_ing');
        if (ingredientSelect) {
          ingredientSelect.value = item.id;
          ingredientSelect.dispatchEvent(new Event('change'));
        }
      }, 100);
    }
  }

  handleAddToOrder(item) {
    // Add to shopping list or order queue
    const orderList = JSON.parse(localStorage.getItem('pos-order-list') || '[]');
    orderList.push({
      id: item.id,
      name: item.name,
      suggestedQuantity: item.minStock * 2,
      addedAt: Date.now()
    });
    localStorage.setItem('pos-order-list', JSON.stringify(orderList));
    
    // Show confirmation
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast(`เพิ่ม ${item.name} ในรายการสั่งซื้อแล้ว`);
    }
  }

  handleSetReminder(item) {
    // Set reminder for later
    const reminders = JSON.parse(localStorage.getItem('pos-reminders') || '[]');
    reminders.push({
      id: Date.now(),
      type: 'stock-reminder',
      item: item.name,
      message: `ตรวจสอบสต๊อก ${item.name}`,
      remindAt: Date.now() + 3600000, // 1 hour from now
      created: Date.now()
    });
    localStorage.setItem('pos-reminders', JSON.stringify(reminders));
    
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast(`ตั้งเตือนสำหรับ ${item.name} แล้ว`);
    }
  }

  // Utility methods
  generateAlertId(alertData) {
    return `${alertData.type}-${alertData.category}-${Date.now()}`;
  }

  getNotificationTTL(priority) {
    const ttls = {
      CRITICAL: 0, // Never auto-dismiss
      HIGH: 30000, // 30 seconds
      MEDIUM: 15000, // 15 seconds
      LOW: 10000, // 10 seconds
      INFO: 5000 // 5 seconds
    };
    return ttls[priority] || 10000;
  }

  async getRelevantData(category) {
    // Mock data fetching - replace with actual API calls
    switch (category) {
      case 'inventory':
        return { inventory: await this.getInventoryData() };
      case 'system':
        return { 
          performance: await this.getPerformanceData(),
          system: await this.getSystemData()
        };
      case 'business':
        return { sales: await this.getSalesData() };
      case 'finance':
        return { costs: await this.getCostData() };
      default:
        return {};
    }
  }

  async getInventoryData() {
    // Mock inventory data
    return [
      { id: 1, name: 'กุ้ง', currentStock: 5, minStock: 20, unit: 'กก.', turnoverRate: 8 },
      { id: 2, name: 'มะละกอ', currentStock: 3, minStock: 10, unit: 'กก.', turnoverRate: 15 },
      { id: 3, name: 'น้ำปลา', currentStock: 25, minStock: 15, unit: 'ขวด', turnoverRate: 12 }
    ];
  }

  async getPerformanceData() {
    return {
      responseTime: Math.random() * 3000 + 500,
      errorRate: Math.random() * 0.1,
      memoryUsage: Math.random() * 0.9 + 0.1
    };
  }

  async getSystemData() {
    return {
      uptime: Date.now() - 86400000, // 24 hours
      connectivity: navigator.onLine,
      syncStatus: Math.random() > 0.9 ? 'failed' : 'success'
    };
  }

  async getSalesData() {
    return {
      dailySales: Math.random() * 15000 + 3000,
      hourlySales: Math.random() * 1000 + 200,
      conversionRate: Math.random() * 0.5 + 0.2
    };
  }

  async getCostData() {
    return [
      { item: 'กุ้ง', variance: (Math.random() - 0.5) * 0.3 },
      { item: 'มะละกอ', variance: (Math.random() - 0.5) * 0.2 }
    ];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Data update handlers
  handleDataUpdate(updateInfo) {
    // Trigger relevant alert checks immediately
    const { type } = updateInfo;
    
    if (type === 'purchase' || type === 'sale') {
      // Check inventory alerts
      this.triggerAlertCheck('low-stock');
    }
    
    if (type === 'sale') {
      // Check sales target alerts
      this.triggerAlertCheck('sales-target');
    }
  }

  handleKPIUpdate(kpiData) {
    // Check if KPI values trigger any alerts
    const { kpiId, value, metadata } = kpiData;
    
    if (kpiId.includes('stock') && value > 0) {
      this.triggerAlertCheck('low-stock');
    }
    
    if (kpiId.includes('sales') && metadata.trend === 'down') {
      this.triggerAlertCheck('sales-target');
    }
  }

  handlePerformanceUpdate(performanceData) {
    this.triggerAlertCheck('performance');
    this.triggerAlertCheck('system-health');
  }

  triggerAlertCheck(ruleId) {
    const rule = this.alertRules.get(ruleId);
    if (rule && rule.enabled) {
      // Trigger immediate check
      setTimeout(async () => {
        try {
          const data = await this.getRelevantData(rule.category);
          const alerts = await rule.check(data);
          
          if (alerts && alerts.length > 0) {
            alerts.forEach(alert => this.createAlert(alert));
          }
        } catch (error) {
          console.error(`Triggered alert check ${ruleId} failed:`, error);
        }
      }, 100);
    }
  }

  // Configuration methods
  updateThreshold(category, key, value) {
    const thresholds = this.thresholds.get(category) || {};
    thresholds[key] = value;
    this.thresholds.set(category, thresholds);
    this.saveThresholds();
  }

  saveThresholds() {
    const thresholdsObj = Object.fromEntries(this.thresholds);
    localStorage.setItem('pos-alert-thresholds', JSON.stringify(thresholdsObj));
  }

  enableAlertRule(ruleId) {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      this.startRuleMonitoring(ruleId, rule);
    }
  }

  disableAlertRule(ruleId) {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      if (rule.interval) {
        clearInterval(rule.interval);
        rule.interval = null;
      }
    }
  }

  // Cleanup
  destroy() {
    // Clear all intervals
    for (const [ruleId, rule] of this.alertRules) {
      if (rule.interval) {
        clearInterval(rule.interval);
      }
    }
    
    // Clear notifications
    const container = document.getElementById('notification-container');
    if (container) {
      container.remove();
    }
    
    // Clear data
    this.alerts.clear();
    this.notifications.clear();
    this.alertRules.clear();
    this.thresholds.clear();
    this.notificationQueue = [];
  }
}

export default SmartAlerts;