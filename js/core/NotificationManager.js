/**
 * Push Notification Manager
 * Handles push notifications, user preferences, and notification scheduling
 */

class NotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.preferences = this.loadPreferences();
    this.notificationQueue = [];
    this.isProcessing = false;
    
    this.init();
  }
  
  async init() {
    await this.setupServiceWorker();
    this.setupPermissions();
    this.setupNotificationHandlers();
    this.createNotificationPanel();
  }
  
  /**
   * Setup service worker for push notifications
   */
  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready;
        console.log('[Notifications] Service worker ready');
      } catch (error) {
        console.error('[Notifications] Service worker setup failed:', error);
      }
    }
  }
  
  /**
   * Setup notification permissions
   */
  setupPermissions() {
    // Check current permission status
    if ('Notification' in window) {
      console.log('[Notifications] Permission status:', Notification.permission);
      
      // Update UI based on permission
      this.updatePermissionUI();
    }
  }
  
  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('[Notifications] Browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      this.showPermissionDeniedMessage();
      return false;
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('[Notifications] Permission granted');
      this.updatePermissionUI();
      this.setupPushSubscription();
      return true;
    } else {
      console.log('[Notifications] Permission denied');
      this.updatePermissionUI();
      return false;
    }
  }
  
  /**
   * Setup push subscription for server notifications
   */
  async setupPushSubscription() {
    if (!this.registration || !('pushManager' in this.registration)) {
      console.warn('[Notifications] Push messaging not supported');
      return;
    }
    
    try {
      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (!this.subscription) {
        // Create new subscription
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.getVapidKey()
        });
        
        console.log('[Notifications] Push subscription created');
        
        // Send subscription to server (if needed)
        this.sendSubscriptionToServer(this.subscription);
      }
    } catch (error) {
      console.error('[Notifications] Push subscription failed:', error);
    }
  }
  
  /**
   * Get VAPID key for push subscriptions
   */
  getVapidKey() {
    // For demo purposes, using a placeholder
    // In production, this should be your actual VAPID public key
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnKJuLFSUjNTahbeZ6-2Xj7u6tJXBd6sFBJQTjA6q-0hnB71w';
  }
  
  /**
   * Send subscription to server
   */
  sendSubscriptionToServer(subscription) {
    // Store subscription locally for now
    // In production, send to your push notification server
    localStorage.setItem('push_subscription', JSON.stringify(subscription));
    console.log('[Notifications] Subscription stored locally');
  }
  
  /**
   * Setup notification event handlers
   */
  setupNotificationHandlers() {
    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data || {};
        
        switch (type) {
          case 'notification-click':
            this.handleNotificationClick(payload);
            break;
          case 'notification-close':
            this.handleNotificationClose(payload);
            break;
        }
      });
    }
  }
  
  /**
   * Show local notification
   */
  async showNotification(title, options = {}) {
    if (!await this.checkPermission()) {
      console.warn('[Notifications] Permission not granted');
      return;
    }
    
    const defaultOptions = {
      icon: '/manifest.json', // Will use app icon
      badge: '/manifest.json',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false,
      ...options
    };
    
    // Apply user preferences
    const finalOptions = this.applyPreferences(defaultOptions);
    
    try {
      if (this.registration) {
        // Use service worker to show notification
        await this.registration.showNotification(title, finalOptions);
      } else {
        // Fallback to browser notification
        new Notification(title, finalOptions);
      }
      
      console.log('[Notifications] Notification shown:', title);
    } catch (error) {
      console.error('[Notifications] Failed to show notification:', error);
    }
  }
  
  /**
   * Show critical alert notification
   */
  async showCriticalAlert(message, data = {}) {
    await this.showNotification('🚨 แจ้งเตือนสำคัญ', {
      body: message,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      tag: 'critical-alert',
      data: { type: 'critical', ...data }
    });
  }
  
  /**
   * Show low stock alert
   */
  async showLowStockAlert(ingredient, currentStock) {
    if (!this.preferences.lowStock) return;
    
    await this.showNotification('📦 วัตถุดิบใกล้หมด', {
      body: `${ingredient} เหลือ ${currentStock} หน่วย`,
      icon: '📦',
      tag: 'low-stock',
      data: { 
        type: 'low-stock', 
        ingredient, 
        currentStock,
        action: 'view-inventory'
      }
    });
  }
  
  /**
   * Show sales milestone notification
   */
  async showSalesMilestone(amount, period) {
    if (!this.preferences.sales) return;
    
    await this.showNotification('🎉 ยอดขายเป้าหมาย', {
      body: `ยอดขาย${period}ถึง ${amount.toLocaleString()} บาทแล้ว!`,
      icon: '🎉',
      tag: 'sales-milestone',
      data: { 
        type: 'sales', 
        amount, 
        period,
        action: 'view-reports'
      }
    });
  }
  
  /**
   * Show daily summary notification
   */
  async showDailySummary(summary) {
    if (!this.preferences.dailySummary) return;
    
    await this.showNotification('📊 สรุปยอดขายวันนี้', {
      body: `ขาย ${summary.orders} รายการ รวม ${summary.revenue.toLocaleString()} บาท`,
      icon: '📊',
      tag: 'daily-summary',
      data: { 
        type: 'summary', 
        ...summary,
        action: 'view-reports'
      }
    });
  }
  
  /**
   * Schedule notification
   */
  scheduleNotification(title, options, delay) {
    setTimeout(() => {
      this.showNotification(title, options);
    }, delay);
  }
  
  /**
   * Schedule recurring notification
   */
  scheduleRecurringNotification(title, options, interval) {
    const scheduleNext = () => {
      this.showNotification(title, options);
      setTimeout(scheduleNext, interval);
    };
    
    setTimeout(scheduleNext, interval);
  }
  
  /**
   * Check notification permission
   */
  async checkPermission() {
    if (!('Notification' in window)) {
      return false;
    }
    
    return Notification.permission === 'granted';
  }
  
  /**
   * Apply user preferences to notification options
   */
  applyPreferences(options) {
    const prefs = this.preferences;
    
    return {
      ...options,
      silent: !prefs.sound,
      vibrate: prefs.vibration ? options.vibrate : [],
      requireInteraction: prefs.persistent ? true : options.requireInteraction
    };
  }
  
  /**
   * Handle notification click
   */
  handleNotificationClick(payload) {
    const { data } = payload || {};
    
    if (data?.action) {
      switch (data.action) {
        case 'view-inventory':
          this.navigateToRoute('purchase');
          break;
        case 'view-reports':
          this.navigateToRoute('reports');
          break;
        case 'view-sales':
          this.navigateToRoute('sale');
          break;
        default:
          this.navigateToRoute('home');
      }
    }
  }
  
  /**
   * Handle notification close
   */
  handleNotificationClose(payload) {
    console.log('[Notifications] Notification closed:', payload);
  }
  
  /**
   * Navigate to specific route
   */
  navigateToRoute(route) {
    if (window.routeTo) {
      window.routeTo(route);
    }
    
    // Focus window if app is installed
    if (window.focus) {
      window.focus();
    }
  }
  
  /**
   * Create notification preferences panel
   */
  createNotificationPanel() {
    const panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.className = 'notification-panel hide';
    panel.innerHTML = `
      <div class="notification-panel-content">
        <div class="notification-panel-header">
          <h3>การแจ้งเตือน</h3>
          <button class="notification-panel-close" aria-label="ปิด">×</button>
        </div>
        <div class="notification-panel-body">
          <div class="notification-permission">
            <div class="permission-status">
              <span class="permission-icon">🔔</span>
              <div class="permission-text">
                <div class="permission-title">สิทธิ์การแจ้งเตือน</div>
                <div class="permission-desc" id="permission-status">กำลังตรวจสอบ...</div>
              </div>
              <button class="btn brand permission-btn" id="permission-btn">เปิดใช้งาน</button>
            </div>
          </div>
          
          <div class="notification-preferences">
            <h4>ประเภทการแจ้งเตือน</h4>
            <div class="preference-group">
              <label class="preference-item">
                <input type="checkbox" id="pref-low-stock" ${this.preferences.lowStock ? 'checked' : ''}>
                <span class="preference-label">📦 วัตถุดิบใกล้หมด</span>
              </label>
              <label class="preference-item">
                <input type="checkbox" id="pref-sales" ${this.preferences.sales ? 'checked' : ''}>
                <span class="preference-label">💰 ยอดขายเป้าหมาย</span>
              </label>
              <label class="preference-item">
                <input type="checkbox" id="pref-daily-summary" ${this.preferences.dailySummary ? 'checked' : ''}>
                <span class="preference-label">📊 สรุปรายวัน</span>
              </label>
              <label class="preference-item">
                <input type="checkbox" id="pref-system" ${this.preferences.system ? 'checked' : ''}>
                <span class="preference-label">⚙️ ระบบและอัปเดต</span>
              </label>
            </div>
            
            <h4>การตั้งค่า</h4>
            <div class="preference-group">
              <label class="preference-item">
                <input type="checkbox" id="pref-sound" ${this.preferences.sound ? 'checked' : ''}>
                <span class="preference-label">🔊 เสียงแจ้งเตือน</span>
              </label>
              <label class="preference-item">
                <input type="checkbox" id="pref-vibration" ${this.preferences.vibration ? 'checked' : ''}>
                <span class="preference-label">📳 การสั่น</span>
              </label>
              <label class="preference-item">
                <input type="checkbox" id="pref-persistent" ${this.preferences.persistent ? 'checked' : ''}>
                <span class="preference-label">📌 แจ้งเตือนแบบถาวร</span>
              </label>
            </div>
          </div>
          
          <div class="notification-test">
            <button class="btn" id="test-notification">ทดสอบการแจ้งเตือน</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.setupPanelEventListeners();
    this.updatePermissionUI();
  }
  
  /**
   * Setup event listeners for notification panel
   */
  setupPanelEventListeners() {
    const panel = document.getElementById('notification-panel');
    
    // Close button
    panel.querySelector('.notification-panel-close').addEventListener('click', () => {
      this.hideNotificationPanel();
    });
    
    // Permission button
    document.getElementById('permission-btn').addEventListener('click', () => {
      this.requestPermission();
    });
    
    // Preference checkboxes
    const preferences = ['lowStock', 'sales', 'dailySummary', 'system', 'sound', 'vibration', 'persistent'];
    preferences.forEach(pref => {
      const checkbox = document.getElementById(`pref-${pref.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.preferences[pref] = e.target.checked;
          this.savePreferences();
        });
      }
    });
    
    // Test notification button
    document.getElementById('test-notification').addEventListener('click', () => {
      this.showNotification('🧪 ทดสอบการแจ้งเตือน', {
        body: 'การแจ้งเตือนทำงานปกติ!',
        tag: 'test'
      });
    });
    
    // Close on backdrop click
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        this.hideNotificationPanel();
      }
    });
  }
  
  /**
   * Show notification panel
   */
  showNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (panel) {
      panel.classList.remove('hide');
      this.updatePermissionUI();
    }
  }
  
  /**
   * Hide notification panel
   */
  hideNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (panel) {
      panel.classList.add('hide');
    }
  }
  
  /**
   * Update permission UI
   */
  updatePermissionUI() {
    const statusEl = document.getElementById('permission-status');
    const btnEl = document.getElementById('permission-btn');
    
    if (!statusEl || !btnEl) return;
    
    if (!('Notification' in window)) {
      statusEl.textContent = 'เบราว์เซอร์ไม่รองรับการแจ้งเตือน';
      btnEl.style.display = 'none';
      return;
    }
    
    switch (Notification.permission) {
      case 'granted':
        statusEl.textContent = 'เปิดใช้งานแล้ว';
        btnEl.style.display = 'none';
        break;
      case 'denied':
        statusEl.textContent = 'ถูกปฏิเสธ - เปิดในการตั้งค่าเบราว์เซอร์';
        btnEl.style.display = 'none';
        break;
      default:
        statusEl.textContent = 'ยังไม่ได้เปิดใช้งาน';
        btnEl.style.display = 'inline-flex';
        btnEl.textContent = 'เปิดใช้งาน';
    }
  }
  
  /**
   * Show permission denied message
   */
  showPermissionDeniedMessage() {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'การแจ้งเตือนถูกปฏิเสธ กรุณาเปิดในการตั้งค่าเบราว์เซอร์';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 5000);
    }
  }
  
  /**
   * Load user preferences
   */
  loadPreferences() {
    const defaultPrefs = {
      lowStock: true,
      sales: true,
      dailySummary: false,
      system: true,
      sound: true,
      vibration: true,
      persistent: false
    };
    
    try {
      const saved = localStorage.getItem('notification_preferences');
      return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
    } catch (error) {
      console.error('[Notifications] Failed to load preferences:', error);
      return defaultPrefs;
    }
  }
  
  /**
   * Save user preferences
   */
  savePreferences() {
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
      console.log('[Notifications] Preferences saved');
    } catch (error) {
      console.error('[Notifications] Failed to save preferences:', error);
    }
  }
  
  /**
   * Get notification statistics
   */
  getNotificationStats() {
    // This could track notification engagement
    return {
      permission: Notification.permission,
      preferences: this.preferences,
      subscribed: !!this.subscription,
      supported: 'Notification' in window
    };
  }
}

// Export for use in other modules
window.NotificationManager = NotificationManager;