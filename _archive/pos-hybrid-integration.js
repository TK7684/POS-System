/**
 * POS Hybrid Integration
 * Connects frontend PWA with Google Apps Script backend
 */

class PosHybridSystem {
  constructor() {
    this.apiClient = null;
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.config = {
      apiUrl: '', // Will be set during initialization
      enableOffline: true,
      syncInterval: 30000 // 30 seconds
    };
    
    this.init();
  }

  /**
   * Initialize the hybrid system
   */
  async init() {
    try {
      // Load configuration
      await this.loadConfig();
      
      // Initialize API client
      this.apiClient = new PosApiClient(this.config.apiUrl);
      
      // Setup offline handling
      this.setupOfflineHandling();
      
      // Test connection
      await this.testConnection();
      
      // Start sync if online
      if (this.isOnline) {
        this.startPeriodicSync();
      }
      
      console.log('✅ POS Hybrid System initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize POS Hybrid System:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Load configuration (from localStorage or default)
   */
  async loadConfig() {
    const savedConfig = localStorage.getItem('pos-config');
    if (savedConfig) {
      this.config = { ...this.config, ...JSON.parse(savedConfig) };
    }
    
    // If no API URL configured, prompt user or use default
    if (!this.config.apiUrl) {
      this.config.apiUrl = this.promptForApiUrl();
      this.saveConfig();
    }
  }

  /**
   * Prompt user for API URL (for first-time setup)
   */
  promptForApiUrl() {
    const savedUrl = localStorage.getItem('pos-api-url');
    if (savedUrl) return savedUrl;
    
    const url = prompt(
      'กรุณาใส่ URL ของ Google Apps Script API:\n' +
      'ตัวอย่าง: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
    );
    
    if (url) {
      localStorage.setItem('pos-api-url', url);
      return url;
    }
    
    throw new Error('API URL is required');
  }

  /**
   * Save configuration
   */
  saveConfig() {
    localStorage.setItem('pos-config', JSON.stringify(this.config));
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const result = await this.apiClient.testConnection();
      if (result.status === 'success') {
        console.log('✅ API connection successful');
        this.showConnectionStatus(true);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.warn('⚠️ API connection failed:', error.message);
      this.showConnectionStatus(false);
      throw error;
    }
  }

  /**
   * Setup offline handling
   */
  setupOfflineHandling() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online');
      this.isOnline = true;
      this.showConnectionStatus(true);
      this.syncOfflineQueue();
      this.startPeriodicSync();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Gone offline');
      this.isOnline = false;
      this.showConnectionStatus(false);
      this.stopPeriodicSync();
    });
  }

  /**
   * Show connection status in UI
   */
  showConnectionStatus(isOnline) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
      statusElement.textContent = isOnline ? '🌐 เชื่อมต่อแล้ว' : '📴 ออฟไลน์';
    }
    
    // Update toast
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      const message = isOnline ? 
        '🌐 เชื่อมต่อกับเซิร์ฟเวอร์แล้ว' : 
        '📴 ทำงานในโหมดออฟไลน์';
      window.POS.critical.toast(message);
    }
  }

  /**
   * Add purchase (with offline support)
   */
  async addPurchase(purchaseData) {
    try {
      if (this.isOnline) {
        const result = await this.apiClient.addPurchase(purchaseData);
        this.showSuccessMessage('✅ บันทึกการซื้อแล้ว');
        return result;
      } else {
        // Queue for offline sync
        this.queueOfflineOperation('addPurchase', purchaseData);
        this.showSuccessMessage('📴 บันทึกออฟไลน์แล้ว (จะซิงค์เมื่อออนไลน์)');
        return { status: 'queued', message: 'Queued for sync' };
      }
    } catch (error) {
      this.handleApiError('การซื้อ', error);
      throw error;
    }
  }

  /**
   * Add sale (with offline support)
   */
  async addSale(saleData) {
    try {
      if (this.isOnline) {
        const result = await this.apiClient.addSale(saleData);
        this.showSuccessMessage('✅ บันทึกการขายแล้ว');
        return result;
      } else {
        // Queue for offline sync
        this.queueOfflineOperation('addSale', saleData);
        this.showSuccessMessage('📴 บันทึกออฟไลน์แล้ว (จะซิงค์เมื่อออนไลน์)');
        return { status: 'queued', message: 'Queued for sync' };
      }
    } catch (error) {
      this.handleApiError('การขาย', error);
      throw error;
    }
  }

  /**
   * Get report (cached when offline)
   */
  async getReport(reportParams) {
    try {
      if (this.isOnline) {
        return await this.apiClient.getReport(reportParams);
      } else {
        // Try to get from cache
        const cached = this.getCachedReport(reportParams);
        if (cached) {
          this.showInfoMessage('📴 แสดงรายงานจากแคช');
          return cached;
        } else {
          throw new Error('ไม่มีรายงานในแคชสำหรับโหมดออฟไลน์');
        }
      }
    } catch (error) {
      this.handleApiError('รายงาน', error);
      throw error;
    }
  }

  /**
   * Queue operation for offline sync
   */
  queueOfflineOperation(action, data) {
    this.offlineQueue.push({
      id: Date.now(),
      action,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Save to localStorage
    localStorage.setItem('pos-offline-queue', JSON.stringify(this.offlineQueue));
    
    // Update UI counter
    this.updateOfflineCounter();
  }

  /**
   * Sync offline queue when back online
   */
  async syncOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    
    console.log(`🔄 Syncing ${this.offlineQueue.length} offline operations...`);
    
    const results = [];
    const failedOperations = [];
    
    for (const operation of this.offlineQueue) {
      try {
        let result;
        switch (operation.action) {
          case 'addPurchase':
            result = await this.apiClient.addPurchase(operation.data);
            break;
          case 'addSale':
            result = await this.apiClient.addSale(operation.data);
            break;
          default:
            throw new Error(`Unknown operation: ${operation.action}`);
        }
        
        results.push({ operation, result, status: 'success' });
        
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        failedOperations.push(operation);
        results.push({ operation, error, status: 'failed' });
      }
    }
    
    // Update queue with failed operations only
    this.offlineQueue = failedOperations;
    localStorage.setItem('pos-offline-queue', JSON.stringify(this.offlineQueue));
    
    // Show sync results
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    if (successCount > 0) {
      this.showSuccessMessage(`✅ ซิงค์สำเร็จ ${successCount} รายการ`);
    }
    
    if (failedCount > 0) {
      this.showErrorMessage(`❌ ซิงค์ล้มเหลว ${failedCount} รายการ`);
    }
    
    this.updateOfflineCounter();
  }

  /**
   * Update offline counter in UI
   */
  updateOfflineCounter() {
    const counter = document.getElementById('offline-counter');
    if (counter) {
      const count = this.offlineQueue.length;
      counter.textContent = count > 0 ? count : '';
      counter.style.display = count > 0 ? 'block' : 'none';
    }
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    if (this.syncInterval) return; // Already running
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.offlineQueue.length > 0) {
        this.syncOfflineQueue();
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Handle API errors
   */
  handleApiError(operation, error) {
    console.error(`API Error (${operation}):`, error);
    
    const message = error.message.includes('timeout') ? 
      `⏱️ ${operation}ใช้เวลานานเกินไป กรุณาลองใหม่` :
      `❌ เกิดข้อผิดพลาดในการ${operation}: ${error.message}`;
    
    this.showErrorMessage(message);
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    const message = `❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้: ${error.message}`;
    this.showErrorMessage(message);
    
    // Show setup instructions
    this.showSetupInstructions();
  }

  /**
   * Show setup instructions
   */
  showSetupInstructions() {
    const instructions = `
      📋 วิธีตั้งค่า API:
      1. เปิด Google Apps Script
      2. Deploy เป็น Web App
      3. คัดลอก URL ที่ได้
      4. รีเฟรชหน้านี้และใส่ URL
    `;
    
    alert(instructions);
  }

  // UI Helper methods
  showSuccessMessage(message) {
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast(message);
    } else {
      console.log(message);
    }
  }

  showErrorMessage(message) {
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast(message);
    } else {
      console.error(message);
    }
  }

  showInfoMessage(message) {
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast(message);
    } else {
      console.info(message);
    }
  }

  /**
   * Get cached report (placeholder)
   */
  getCachedReport(params) {
    // Implement report caching logic
    return null;
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      apiUrl: this.config.apiUrl,
      offlineQueueSize: this.offlineQueue.length,
      cacheStats: this.apiClient ? this.apiClient.getCacheStats() : null
    };
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.posHybridSystem = new PosHybridSystem();
});

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PosHybridSystem;
} else if (typeof window !== 'undefined') {
  window.PosHybridSystem = PosHybridSystem;
}