/**
 * PWA Installation Manager
 * Handles app installation prompts, onboarding flow, and update notifications
 */

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.installButton = null;
    this.updateAvailable = false;
    this.registration = null;
    
    this.init();
  }
  
  init() {
    this.checkInstallationStatus();
    this.setupEventListeners();
    this.createInstallButton();
    this.setupUpdateHandling();
  }
  
  /**
   * Check if app is already installed
   */
  checkInstallationStatus() {
    // Check if running in standalone mode (installed)
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true;
    
    // Check if installed via Chrome's criteria
    if ('getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then(relatedApps => {
        this.isInstalled = this.isInstalled || relatedApps.length > 0;
        this.updateInstallUI();
      });
    }
    
    this.updateInstallUI();
  }
  
  /**
   * Setup event listeners for PWA events
   */
  setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      this.updateInstallUI();
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', (e) => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.updateInstallUI();
      this.showInstallSuccessMessage();
      
      // Track installation
      this.trackInstallation('success');
    });
    
    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      this.isInstalled = e.matches;
      this.updateInstallUI();
    });
  }
  
  /**
   * Create install button in the UI
   */
  createInstallButton() {
    // Create install button element
    this.installButton = document.createElement('button');
    this.installButton.className = 'btn brand install-btn';
    this.installButton.innerHTML = '📱 ติดตั้งแอป';
    this.installButton.setAttribute('aria-label', 'ติดตั้งแอปพลิเคชัน');
    this.installButton.style.display = 'none';
    
    // Add click handler
    this.installButton.addEventListener('click', () => {
      this.showInstallPrompt();
    });
    
    // Add to header
    const header = document.querySelector('.appbar');
    if (header) {
      header.insertBefore(this.installButton, header.querySelector('.spacer'));
    }
  }
  
  /**
   * Update install UI based on current state
   */
  updateInstallUI() {
    if (!this.installButton) return;
    
    if (this.isInstalled) {
      this.installButton.style.display = 'none';
    } else if (this.deferredPrompt) {
      this.installButton.style.display = 'inline-flex';
    } else {
      // Show manual install instructions for iOS
      if (this.isIOS() && !this.isInstalled) {
        this.installButton.innerHTML = '📱 วิธีติดตั้ง';
        this.installButton.style.display = 'inline-flex';
      } else {
        this.installButton.style.display = 'none';
      }
    }
  }
  
  /**
   * Show install prompt
   */
  async showInstallPrompt() {
    if (this.deferredPrompt) {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('[PWA] Install prompt outcome:', outcome);
      
      if (outcome === 'accepted') {
        this.trackInstallation('accepted');
      } else {
        this.trackInstallation('dismissed');
      }
      
      // Clear the deferred prompt
      this.deferredPrompt = null;
      this.updateInstallUI();
    } else if (this.isIOS()) {
      // Show iOS install instructions
      this.showIOSInstallInstructions();
    } else {
      // Show general install instructions
      this.showGeneralInstallInstructions();
    }
  }
  
  /**
   * Show iOS install instructions
   */
  showIOSInstallInstructions() {
    const modal = this.createInstructionModal(
      'ติดตั้งแอป POS บน iOS',
      [
        '1. แตะปุ่ม "แชร์" (📤) ที่ด้านล่างของ Safari',
        '2. เลื่อนลงและแตะ "เพิ่มที่หน้าจอหลัก"',
        '3. แตะ "เพิ่ม" เพื่อติดตั้งแอป',
        '4. แอปจะปรากฏบนหน้าจอหลักของคุณ'
      ],
      '📱 Safari เท่านั้น'
    );
    
    document.body.appendChild(modal);
  }
  
  /**
   * Show general install instructions
   */
  showGeneralInstallInstructions() {
    const modal = this.createInstructionModal(
      'ติดตั้งแอป POS',
      [
        '1. เปิดเมนูของเบราว์เซอร์ (⋮)',
        '2. มองหา "ติดตั้งแอป" หรือ "เพิ่มที่หน้าจอหลัก"',
        '3. ทำตามขั้นตอนเพื่อติดตั้ง',
        '4. แอปจะปรากฏในรายการแอปของคุณ'
      ],
      '💡 Chrome หรือ Edge แนะนำ'
    );
    
    document.body.appendChild(modal);
  }
  
  /**
   * Create instruction modal
   */
  createInstructionModal(title, steps, note) {
    const modal = document.createElement('div');
    modal.className = 'pwa-modal';
    modal.innerHTML = `
      <div class="pwa-modal-content">
        <div class="pwa-modal-header">
          <h3>${title}</h3>
          <button class="pwa-modal-close" aria-label="ปิด">×</button>
        </div>
        <div class="pwa-modal-body">
          <div class="install-steps">
            ${steps.map(step => `<div class="install-step">${step}</div>`).join('')}
          </div>
          ${note ? `<div class="install-note">${note}</div>` : ''}
        </div>
        <div class="pwa-modal-footer">
          <button class="btn" onclick="this.closest('.pwa-modal').remove()">เข้าใจแล้ว</button>
        </div>
      </div>
    `;
    
    // Add close functionality
    modal.querySelector('.pwa-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    return modal;
  }
  
  /**
   * Setup service worker update handling
   */
  setupUpdateHandling() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        this.registration = registration;
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.updateAvailable = true;
              this.showUpdateNotification();
            }
          });
        });
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data || {};
        
        if (type === 'sw-updated') {
          this.updateAvailable = true;
          this.showUpdateNotification();
        }
      });
    }
  }
  
  /**
   * Show update notification
   */
  showUpdateNotification() {
    // Create update notification
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <div class="update-icon">🔄</div>
        <div class="update-text">
          <div class="update-title">อัปเดตใหม่พร้อมใช้งาน</div>
          <div class="update-message">รีเฟรชเพื่อใช้เวอร์ชันล่าสุด</div>
        </div>
        <div class="update-actions">
          <button class="btn update-btn" onclick="window.pwaInstaller.applyUpdate()">อัปเดต</button>
          <button class="btn ghost update-dismiss" onclick="this.closest('.update-notification').remove()">ภายหลัง</button>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-show after a delay
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
  }
  
  /**
   * Apply update
   */
  applyUpdate() {
    if (this.registration && this.registration.waiting) {
      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to use the new service worker
      window.location.reload();
    } else {
      // Fallback: just reload
      window.location.reload();
    }
  }
  
  /**
   * Show install success message
   */
  showInstallSuccessMessage() {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = '🎉 ติดตั้งแอปสำเร็จ! ตอนนี้คุณสามารถใช้งานแบบออฟไลน์ได้';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 5000);
    }
  }
  
  /**
   * Check if running on iOS
   */
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }
  
  /**
   * Track installation events
   */
  trackInstallation(outcome) {
    console.log('[PWA] Installation tracked:', outcome);
    
    // Here you could send analytics data
    // For now, just log to console
    const event = {
      type: 'pwa_install',
      outcome: outcome,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      standalone: this.isInstalled
    };
    
    // Store in localStorage for later analysis
    const events = JSON.parse(localStorage.getItem('pwa_events') || '[]');
    events.push(event);
    localStorage.setItem('pwa_events', JSON.stringify(events.slice(-50))); // Keep last 50 events
  }
  
  /**
   * Get installation statistics
   */
  getInstallStats() {
    const events = JSON.parse(localStorage.getItem('pwa_events') || '[]');
    const installEvents = events.filter(e => e.type === 'pwa_install');
    
    return {
      totalPrompts: installEvents.length,
      accepted: installEvents.filter(e => e.outcome === 'accepted').length,
      dismissed: installEvents.filter(e => e.outcome === 'dismissed').length,
      successful: installEvents.filter(e => e.outcome === 'success').length,
      isCurrentlyInstalled: this.isInstalled
    };
  }
}

// Export for use in other modules
window.PWAInstaller = PWAInstaller;