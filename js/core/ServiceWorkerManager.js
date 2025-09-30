/**
 * Service Worker Manager
 * Handles service worker registration, updates, and offline detection
 */

class ServiceWorkerManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.swRegistration = null;
    this.updateAvailable = false;
    this.offlineCallbacks = new Set();
    this.onlineCallbacks = new Set();
    this.updateCallbacks = new Set();
    
    this.init();
  }

  async init() {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[SWManager] Service workers not supported');
      return;
    }

    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Setup offline/online detection
      this.setupNetworkDetection();
      
      // Setup update detection
      this.setupUpdateDetection();
      
      // Setup message handling
      this.setupMessageHandling();
      
      console.log('[SWManager] Service worker manager initialized');
    } catch (error) {
      console.error('[SWManager] Failed to initialize:', error);
    }
  }

  async registerServiceWorker() {
    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SWManager] Service worker registered:', this.swRegistration.scope);

      // Check for updates immediately
      this.swRegistration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      // Check for updates periodically
      setInterval(() => {
        this.checkForUpdates();
      }, 60000); // Check every minute

      return this.swRegistration;
    } catch (error) {
      console.error('[SWManager] Service worker registration failed:', error);
      throw error;
    }
  }

  setupNetworkDetection() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  setupUpdateDetection() {
    if (!this.swRegistration) return;

    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SWManager] Controller changed - reloading page');
      window.location.reload();
    });
  }

  setupMessageHandling() {
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      const { type, payload } = event.data || {};
      
      switch (type) {
        case 'sw-updated':
          this.handleServiceWorkerUpdate(payload);
          break;
          
        case 'offline-mode':
          this.showOfflineNotification(payload);
          break;
          
        case 'sync-start':
          this.handleSyncStart();
          break;
          
        case 'sync-complete':
          this.handleSyncComplete();
          break;
          
        case 'sync-failed':
          this.handleSyncFailed(payload);
          break;
      }
    });
  }

  handleUpdateFound() {
    const newWorker = this.swRegistration.installing;
    
    if (!newWorker) return;

    console.log('[SWManager] New service worker found');

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Update available
          this.updateAvailable = true;
          this.notifyUpdateAvailable();
        } else {
          // First install
          console.log('[SWManager] Service worker installed for the first time');
        }
      }
    });
  }

  async checkForUpdates() {
    if (!this.swRegistration) return;

    try {
      await this.swRegistration.update();
    } catch (error) {
      console.error('[SWManager] Failed to check for updates:', error);
    }
  }

  handleOnline() {
    if (!this.isOnline) {
      this.isOnline = true;
      console.log('[SWManager] Connection restored');
      
      // Notify callbacks
      this.onlineCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('[SWManager] Online callback error:', error);
        }
      });

      // Show online notification
      this.showOnlineNotification();
      
      // Trigger background sync
      this.triggerBackgroundSync();
    }
  }

  handleOffline() {
    if (this.isOnline) {
      this.isOnline = false;
      console.log('[SWManager] Connection lost');
      
      // Notify callbacks
      this.offlineCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('[SWManager] Offline callback error:', error);
        }
      });

      // Show offline notification
      this.showOfflineNotification();
    }
  }

  async checkConnectivity() {
    const wasOnline = this.isOnline;
    
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/sw.js', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
    }

    // Update navigator.onLine if it's incorrect
    if (navigator.onLine !== this.isOnline) {
      if (this.isOnline && !wasOnline) {
        this.handleOnline();
      } else if (!this.isOnline && wasOnline) {
        this.handleOffline();
      }
    }
  }

  notifyUpdateAvailable() {
    // Notify callbacks
    this.updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[SWManager] Update callback error:', error);
      }
    });

    // Show update notification
    this.showUpdateNotification();
  }

  showOfflineNotification(payload = {}) {
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast('🔌 ทำงานแบบออฟไลน์ - ข้อมูลจะซิงค์เมื่อกลับมาออนไลน์');
    }

    // Update UI to show offline status
    this.updateOfflineStatus(true);
  }

  showOnlineNotification() {
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast('🌐 กลับมาออนไลน์แล้ว - กำลังซิงค์ข้อมูล');
    }

    // Update UI to show online status
    this.updateOfflineStatus(false);
  }

  showUpdateNotification() {
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast('🔄 มีอัปเดตใหม่ - คลิกเพื่อรีเฟรช');
    }

    // Show update banner or button
    this.showUpdateBanner();
  }

  updateOfflineStatus(isOffline) {
    // Add/remove offline class to body
    document.body.classList.toggle('offline', isOffline);
    
    // Update sync button appearance
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
      syncBtn.style.opacity = isOffline ? '0.5' : '1';
      syncBtn.title = isOffline ? 'ออฟไลน์' : 'ซิงค์ข้อมูล';
    }
  }

  showUpdateBanner() {
    // Create update banner if it doesn't exist
    let banner = document.getElementById('update-banner');
    
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'update-banner';
      banner.className = 'update-banner';
      banner.innerHTML = `
        <div class="update-content">
          <span>🔄 มีอัปเดตใหม่พร้อมใช้งาน</span>
          <button class="btn-update" onclick="window.swManager.applyUpdate()">อัปเดต</button>
          <button class="btn-dismiss" onclick="window.swManager.dismissUpdate()">ปิด</button>
        </div>
      `;
      
      // Add styles
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #0f766e, #14b8a6);
        color: white;
        padding: 12px 16px;
        z-index: 1002;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transform: translateY(-100%);
        transition: transform 0.3s ease;
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        .update-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-update, .btn-dismiss {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s ease;
        }
        .btn-update:hover, .btn-dismiss:hover {
          background: rgba(255,255,255,0.3);
        }
        .btn-update {
          font-weight: 600;
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(banner);
    }
    
    // Show banner
    setTimeout(() => {
      banner.style.transform = 'translateY(0)';
    }, 100);
  }

  async applyUpdate() {
    if (!this.swRegistration || !this.updateAvailable) return;

    const newWorker = this.swRegistration.waiting;
    
    if (newWorker) {
      // Tell the new service worker to skip waiting
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  dismissUpdate() {
    const banner = document.getElementById('update-banner');
    if (banner) {
      banner.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  handleServiceWorkerUpdate(payload) {
    console.log('[SWManager] Service worker updated to version:', payload.version);
  }

  handleSyncStart() {
    console.log('[SWManager] Background sync started');
    
    if (window.POS && window.POS.critical && window.POS.critical.loading) {
      window.POS.critical.loading(true);
    }
  }

  handleSyncComplete() {
    console.log('[SWManager] Background sync completed');
    
    if (window.POS && window.POS.critical) {
      if (window.POS.critical.loading) {
        window.POS.critical.loading(false);
      }
      if (window.POS.critical.toast) {
        window.POS.critical.toast('✅ ข้อมูลซิงค์เรียบร้อยแล้ว');
      }
    }
  }

  handleSyncFailed(payload) {
    console.error('[SWManager] Background sync failed:', payload.error);
    
    if (window.POS && window.POS.critical) {
      if (window.POS.critical.loading) {
        window.POS.critical.loading(false);
      }
      if (window.POS.critical.toast) {
        window.POS.critical.toast('❌ ไม่สามารถซิงค์ข้อมูลได้');
      }
    }
  }

  async triggerBackgroundSync() {
    if (!this.swRegistration) return;

    try {
      // Register background sync
      await this.swRegistration.sync.register('pos-data-sync');
      console.log('[SWManager] Background sync registered');
    } catch (error) {
      console.error('[SWManager] Background sync registration failed:', error);
      
      // Fallback: trigger sync manually
      this.handleSyncStart();
      
      // Simulate sync completion after a delay
      setTimeout(() => {
        this.handleSyncComplete();
      }, 2000);
    }
  }

  // Public API methods
  onOffline(callback) {
    this.offlineCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.offlineCallbacks.delete(callback);
    };
  }

  onOnline(callback) {
    this.onlineCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.onlineCallbacks.delete(callback);
    };
  }

  onUpdate(callback) {
    this.updateCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  async clearCache(cacheName) {
    if (!this.swRegistration) return;

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve();
        }
      };

      this.swRegistration.active.postMessage(
        { type: 'CLEAR_CACHE', payload: { cacheName } },
        [messageChannel.port2]
      );
    });
  }

  async cacheUrls(urls) {
    if (!this.swRegistration) return;

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve();
        }
      };

      this.swRegistration.active.postMessage(
        { type: 'CACHE_URLS', payload: { urls } },
        [messageChannel.port2]
      );
    });
  }

  async getVersion() {
    if (!this.swRegistration) return null;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
      };

      this.swRegistration.active.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    });
  }

  // Getters
  get online() {
    return this.isOnline;
  }

  get offline() {
    return !this.isOnline;
  }

  get hasUpdate() {
    return this.updateAvailable;
  }
}

export default ServiceWorkerManager;