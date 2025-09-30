/**
 * QuickActionsIntegration - Integration layer for Quick Actions and Accessibility
 * Initializes and coordinates QuickActionManager and AccessibilityManager
 */

class QuickActionsIntegration {
  constructor() {
    this.quickActionManager = null;
    this.accessibilityManager = null;
    this.initialized = false;
    
    this.init();
  }

  async init() {
    try {
      // Load CSS dependencies
      await this.loadCSS();
      
      // Initialize managers
      await this.initializeManagers();
      
      // Setup integration
      this.setupIntegration();
      
      this.initialized = true;
      console.log('[QuickActions] Integration initialized successfully');
      
      // Announce to screen reader
      if (this.accessibilityManager) {
        this.accessibilityManager.announceToScreenReader(
          'ระบบการเข้าถึงและปุ่มลัดพร้อมใช้งาน กด Ctrl+Q เพื่อเปิดเมนูด่วน'
        );
      }
      
    } catch (error) {
      console.error('[QuickActions] Failed to initialize integration:', error);
    }
  }

  async loadCSS() {
    const cssFiles = [
      'css/quick-actions.css',
      'css/accessibility.css',
      'css/keyboard-help.css'
    ];

    const loadPromises = cssFiles.map(file => this.loadCSSFile(file));
    await Promise.all(loadPromises);
  }

  loadCSSFile(href) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  async initializeManagers() {
    // Initialize AccessibilityManager first (provides foundation)
    const AccessibilityManager = await import('./AccessibilityManager.js');
    this.accessibilityManager = new (AccessibilityManager.default || AccessibilityManager)();

    // Initialize FormAccessibilityEnhancer
    const FormAccessibilityEnhancer = await import('./FormAccessibilityEnhancer.js');
    this.formEnhancer = new (FormAccessibilityEnhancer.default || FormAccessibilityEnhancer)();

    // Initialize QuickActionManager
    const QuickActionManager = await import('./QuickActionManager.js');
    this.quickActionManager = new (QuickActionManager.default || QuickActionManager)();

    // Make managers globally available
    window.accessibilityManager = this.accessibilityManager;
    window.formEnhancer = this.formEnhancer;
    window.quickActionManager = this.quickActionManager;
  }

  setupIntegration() {
    // Integrate accessibility features with quick actions
    this.integrateAccessibilityWithQuickActions();
    
    // Setup voice commands if supported
    this.setupVoiceCommands();
    
    // Setup gesture support
    this.setupGestureSupport();
    
    // Setup context-aware features
    this.setupContextAwareness();
  }

  integrateAccessibilityWithQuickActions() {
    if (!this.quickActionManager || !this.accessibilityManager) return;

    // Add accessibility-specific quick actions
    this.quickActionManager.addCustomAction({
      id: 'toggle-high-contrast',
      label: 'เปลี่ยนความคมชัด',
      icon: '🌓',
      shortcut: 'Ctrl+Alt+C',
      action: () => {
        this.accessibilityManager.toggleHighContrast();
      }
    });

    this.quickActionManager.addCustomAction({
      id: 'increase-font-size',
      label: 'เพิ่มขนาดตัวอักษร',
      icon: '🔤',
      shortcut: 'Ctrl+Plus',
      action: () => {
        this.accessibilityManager.cycleFontSize();
      }
    });

    this.quickActionManager.addCustomAction({
      id: 'toggle-reduced-motion',
      label: 'ลดการเคลื่อนไหว',
      icon: '🎭',
      shortcut: 'Ctrl+Alt+M',
      action: () => {
        this.accessibilityManager.toggleReducedMotion();
      }
    });

    // Add keyboard shortcuts for accessibility features
    this.addAccessibilityKeyboardShortcuts();
  }

  addAccessibilityKeyboardShortcuts() {
    const shortcuts = {
      'ctrl+alt+c': () => this.accessibilityManager.toggleHighContrast(),
      'ctrl+plus': () => this.accessibilityManager.cycleFontSize(),
      'ctrl+minus': () => this.accessibilityManager.cycleFontSize(), // Could implement decrease
      'ctrl+alt+m': () => this.accessibilityManager.toggleReducedMotion(),
      'ctrl+alt+f': () => this.accessibilityManager.toggleFocusOutlines(),
      'f1': () => this.accessibilityManager.showKeyboardShortcuts(),
      'ctrl+alt+h': () => this.showAccessibilityHelp()
    };

    // Register shortcuts with QuickActionManager
    Object.entries(shortcuts).forEach(([key, action]) => {
      if (this.quickActionManager.keyboardShortcuts) {
        this.quickActionManager.keyboardShortcuts.set(key, action);
      }
    });
  }

  setupVoiceCommands() {
    // Check for Speech Recognition support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechRecognition = new SpeechRecognition();
    
    this.speechRecognition.continuous = false;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = 'th-TH';

    // Voice commands mapping
    const voiceCommands = {
      'เปิดเมนูด่วน': () => this.quickActionManager.openMenu(),
      'ปิดเมนู': () => this.quickActionManager.closeMenu(),
      'ขายด่วน': () => this.quickActionManager.executeAction('quick-sale'),
      'ซื้อด่วน': () => this.quickActionManager.executeAction('quick-purchase'),
      'หน้าหลัก': () => this.quickActionManager.executeAction('home'),
      'รายงาน': () => this.quickActionManager.executeAction('daily-report'),
      'จัดการเมนู': () => this.quickActionManager.executeAction('menu-management'),
      'ซิงค์ข้อมูล': () => this.quickActionManager.executeAction('sync-data'),
      'เพิ่มความคมชัด': () => this.accessibilityManager.toggleHighContrast(),
      'เพิ่มขนาดตัวอักษร': () => this.accessibilityManager.cycleFontSize(),
      'ลดการเคลื่อนไหว': () => this.accessibilityManager.toggleReducedMotion()
    };

    this.speechRecognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase().trim();
      const action = voiceCommands[command];
      
      if (action) {
        action();
        if (this.accessibilityManager) {
          this.accessibilityManager.announceToScreenReader(`ดำเนินการ: ${command}`);
        }
      } else {
        if (this.accessibilityManager) {
          this.accessibilityManager.announceToScreenReader('ไม่เข้าใจคำสั่ง กรุณาลองใหม่');
        }
      }
    };

    this.speechRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    // Add voice control toggle to quick actions
    this.quickActionManager.addCustomAction({
      id: 'toggle-voice-control',
      label: 'เปิด/ปิดการควบคุมด้วยเสียง',
      icon: '🎤',
      shortcut: 'Ctrl+Alt+V',
      action: () => this.toggleVoiceControl()
    });
  }

  toggleVoiceControl() {
    if (!this.speechRecognition) {
      if (this.accessibilityManager) {
        this.accessibilityManager.announceToScreenReader('ไม่รองรับการควบคุมด้วยเสียง');
      }
      return;
    }

    if (this.voiceControlActive) {
      this.speechRecognition.stop();
      this.voiceControlActive = false;
      if (this.accessibilityManager) {
        this.accessibilityManager.announceToScreenReader('ปิดการควบคุมด้วยเสียง');
      }
    } else {
      this.speechRecognition.start();
      this.voiceControlActive = true;
      if (this.accessibilityManager) {
        this.accessibilityManager.announceToScreenReader('เปิดการควบคุมด้วยเสียง พูดคำสั่งได้เลย');
      }
    }
  }

  setupGestureSupport() {
    // Setup touch gestures for mobile accessibility
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchDuration = Date.now() - touchStartTime;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Three-finger tap for accessibility menu
        if (e.changedTouches.length === 3 && distance < 50 && touchDuration < 500) {
          this.showAccessibilityMenu();
        }

        // Two-finger swipe up for quick actions
        if (e.changedTouches.length === 2 && deltaY < -100 && touchDuration < 500) {
          this.quickActionManager.openMenu();
        }

        // Two-finger swipe down to close
        if (e.changedTouches.length === 2 && deltaY > 100 && touchDuration < 500) {
          this.quickActionManager.closeMenu();
        }
      }
    }, { passive: true });
  }

  setupContextAwareness() {
    // Monitor screen changes to provide contextual help
    const originalRouteTo = window.routeTo;
    window.routeTo = (screenName) => {
      if (originalRouteTo) {
        originalRouteTo(screenName);
      }
      
      // Provide contextual accessibility hints
      this.provideContextualHints(screenName);
    };

    // Monitor form interactions
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this.provideFormHints(e.target);
      }
    });
  }

  provideContextualHints(screenName) {
    if (!this.accessibilityManager) return;

    const hints = {
      home: 'หน้าหลัก: ดู KPI และสต๊อกต่ำ กด Ctrl+S เพื่อขายด่วน หรือ Ctrl+P เพื่อซื้อด่วน',
      purchase: 'หน้าซื้อ: บันทึกการซื้อวัตถุดิบ กรอกข้อมูลตามลำดับ กด Tab เพื่อไปฟิลด์ถัดไป',
      sale: 'หน้าขาย: บันทึกการขาย เลือกแพลตฟอร์มและเมนู กด Ctrl+Enter เพื่อบันทึกเร็ว',
      menu: 'หน้าเมนู: จัดการ BOM และต้นทุน เลือกเมนูก่อนเพิ่มวัตถุดิบ',
      reports: 'หน้ารายงาน: ดูกำไรและยอดขาย เลือกช่วงวันที่แล้วกดสร้างรายงาน'
    };

    const hint = hints[screenName];
    if (hint) {
      setTimeout(() => {
        this.accessibilityManager.announceToScreenReader(hint);
      }, 1000);
    }
  }

  provideFormHints(element) {
    if (!this.accessibilityManager) return;

    const hints = {
      'p_ing': 'เลือกวัตถุดิบ: พิมพ์เพื่อค้นหา หรือใช้ลูกศรเพื่อเลือก',
      's_platform': 'เลือกแพลตฟอร์ม: Walk-in สำหรับลูกค้าหน้าร้าน',
      's_menu': 'เลือกเมนู: เมนูที่มี BOM จะแสดงต้นทุนอัตโนมัติ',
      'p_qty': 'จำนวน: ใส่ทศนิยมได้ เช่น 1.5',
      'p_total_price': 'ราคารวม: ระบบจะคำนวณราคาต่อหน่วยให้อัตโนมัติ'
    };

    const hint = hints[element.id];
    if (hint) {
      setTimeout(() => {
        this.accessibilityManager.announceToScreenReader(hint);
      }, 500);
    }
  }

  showAccessibilityMenu() {
    // Create and show accessibility quick menu
    const menu = document.createElement('div');
    menu.className = 'accessibility-quick-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'เมนูการเข้าถึงด่วน');
    
    menu.innerHTML = `
      <div class="a11y-menu-header">
        <h3>การเข้าถึง</h3>
        <button class="a11y-menu-close" aria-label="ปิดเมนู">×</button>
      </div>
      <div class="a11y-menu-content">
        <button class="a11y-menu-item" data-action="font-size">
          <span>🔤</span> ขนาดตัวอักษร
        </button>
        <button class="a11y-menu-item" data-action="contrast">
          <span>🌓</span> ความคมชัด
        </button>
        <button class="a11y-menu-item" data-action="motion">
          <span>🎭</span> ลดการเคลื่อนไหว
        </button>
        <button class="a11y-menu-item" data-action="voice">
          <span>🎤</span> ควบคุมด้วยเสียง
        </button>
        <button class="a11y-menu-item" data-action="shortcuts">
          <span>⌨️</span> คีย์ลัด
        </button>
      </div>
    `;

    document.body.appendChild(menu);

    // Handle menu interactions
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.a11y-menu-item');
      const closeBtn = e.target.closest('.a11y-menu-close');
      
      if (closeBtn) {
        menu.remove();
      } else if (item) {
        const action = item.dataset.action;
        this.handleAccessibilityMenuAction(action);
        menu.remove();
      }
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (menu.parentNode) {
        menu.remove();
      }
    }, 10000);

    // Focus first item
    const firstItem = menu.querySelector('.a11y-menu-item');
    if (firstItem) {
      firstItem.focus();
    }
  }

  handleAccessibilityMenuAction(action) {
    switch (action) {
      case 'font-size':
        this.accessibilityManager.cycleFontSize();
        break;
      case 'contrast':
        this.accessibilityManager.toggleHighContrast();
        break;
      case 'motion':
        this.accessibilityManager.toggleReducedMotion();
        break;
      case 'voice':
        this.toggleVoiceControl();
        break;
      case 'shortcuts':
        this.accessibilityManager.showKeyboardShortcuts();
        break;
    }
  }

  showAccessibilityHelp() {
    const helpText = `
      การเข้าถึงและคีย์ลัด:
      
      การนำทาง:
      - Tab: ไปฟิลด์ถัดไป
      - Shift+Tab: ไปฟิลด์ก่อนหน้า
      - Alt+1-5: เปลี่ยนแท็บ
      - F6: เปลี่ยนพื้นที่โฟกัส
      
      ปุ่มลัด:
      - Ctrl+Q: เมนูด่วน
      - Ctrl+S: ขายด่วน
      - Ctrl+P: ซื้อด่วน
      - Ctrl+M: จัดการเมนู
      - Ctrl+R: รายงาน
      
      การเข้าถึง:
      - Ctrl+Alt+C: เปลี่ยนความคมชัด
      - Ctrl+Plus: เพิ่มขนาดตัวอักษร
      - Ctrl+Alt+M: ลดการเคลื่อนไหว
      - Ctrl+Alt+V: ควบคุมด้วยเสียง
      
      ท่าทาง (มือถือ):
      - แตะ 3 นิ้ว: เมนูการเข้าถึง
      - ปัด 2 นิ้วขึ้น: เมนูด่วน
    `;

    if (this.accessibilityManager) {
      this.accessibilityManager.announceToScreenReader(helpText);
    }

    // Could also show a modal with the help text
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast('ดูคอนโซลสำหรับคำแนะนำการใช้งาน');
    }
    
    console.log(helpText);
  }

  // Public API
  isInitialized() {
    return this.initialized;
  }

  getQuickActionManager() {
    return this.quickActionManager;
  }

  getAccessibilityManager() {
    return this.accessibilityManager;
  }

  // Cleanup
  destroy() {
    if (this.quickActionManager) {
      this.quickActionManager.destroy();
    }
    
    if (this.accessibilityManager) {
      this.accessibilityManager.destroy();
    }
    
    if (this.formEnhancer) {
      this.formEnhancer.destroy();
    }
    
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }

    // Remove global references
    delete window.quickActionManager;
    delete window.accessibilityManager;
    delete window.formEnhancer;
    delete window.quickActionsIntegration;
  }
}

export default QuickActionsIntegration;