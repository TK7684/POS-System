/**
 * AccessibilityManager - Comprehensive accessibility support
 * Handles keyboard navigation, screen reader support, and accessibility features
 */

class AccessibilityManager {
  constructor() {
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.skipLinks = [];
    this.announcements = [];
    this.highContrastMode = false;
    this.fontSize = 'normal';
    this.reducedMotion = false;
    
    this.init();
  }

  init() {
    this.setupARIALabels();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupAccessibilityPreferences();
    this.setupSkipLinks();
    this.setupFocusManagement();
    this.setupAccessibilityToolbar();
    this.loadAccessibilityPreferences();
  }

  setupARIALabels() {
    // Add comprehensive ARIA labels to existing elements
    const elementsToLabel = [
      { selector: '#app', role: 'application', label: 'POS ร้านกุ้งแซ่บ - ระบบจุดขาย' },
      { selector: '.appbar', role: 'banner', label: 'แถบหัวเรื่อง' },
      { selector: '.tabbar', role: 'tablist', label: 'เมนูหลัก' },
      { selector: 'main', role: 'main', label: 'เนื้อหาหลัก' },
      { selector: '#home-screen', role: 'tabpanel', label: 'หน้าหลัก' },
      { selector: '#purchase-screen', role: 'tabpanel', label: 'บันทึกการซื้อ' },
      { selector: '#sale-screen', role: 'tabpanel', label: 'บันทึกการขาย' },
      { selector: '#menu-screen', role: 'tabpanel', label: 'จัดการเมนู' },
      { selector: '#reports-screen', role: 'tabpanel', label: 'รายงาน' }
    ];

    elementsToLabel.forEach(({ selector, role, label }) => {
      const element = document.querySelector(selector);
      if (element) {
        if (role) element.setAttribute('role', role);
        if (label) element.setAttribute('aria-label', label);
      }
    });

    // Add labels to form elements
    this.setupFormLabels();
    
    // Add labels to buttons
    this.setupButtonLabels();
    
    // Add labels to navigation
    this.setupNavigationLabels();
  }

  setupFormLabels() {
    const formElements = [
      { id: 'p_date', label: 'วันที่ซื้อวัตถุดิบ' },
      { id: 'p_ing', label: 'เลือกวัตถุดิบ' },
      { id: 'p_qty', label: 'จำนวนที่ซื้อ' },
      { id: 'p_unit', label: 'หน่วยของวัตถุดิบ' },
      { id: 'p_actual_yield', label: 'จำนวนจริงที่ได้รับ' },
      { id: 'p_total_price', label: 'ราคารวมทั้งหมด' },
      { id: 'p_price', label: 'ราคาต่อหน่วย คำนวณอัตโนมัติ' },
      { id: 'p_note', label: 'ผู้ขายหรือหมายเหตุ' },
      { id: 's_date', label: 'วันที่ขาย' },
      { id: 's_platform', label: 'แพลตฟอร์มการขาย' },
      { id: 's_menu', label: 'เมนูที่ขาย' },
      { id: 's_qty', label: 'จำนวนเสิร์ฟ' },
      { id: 's_price', label: 'ราคาขาย' },
      { id: 'm_menu', label: 'เลือกเมนู' },
      { id: 'm_ingredient', label: 'เลือกวัตถุดิบ' },
      { id: 'm_qty', label: 'จำนวนต่อเสิร์ฟ' },
      { id: 'm_unit', label: 'หน่วยสต๊อก' },
      { id: 'rp_from', label: 'วันที่เริ่มต้นรายงาน' },
      { id: 'rp_to', label: 'วันที่สิ้นสุดรายงาน' }
    ];

    formElements.forEach(({ id, label }) => {
      const element = document.getElementById(id);
      if (element) {
        element.setAttribute('aria-label', label);
        
        // Add required indicator for required fields
        if (element.hasAttribute('required')) {
          element.setAttribute('aria-required', 'true');
          element.setAttribute('aria-label', `${label} (จำเป็น)`);
        }
        
        // Add invalid state handling
        element.addEventListener('invalid', () => {
          element.setAttribute('aria-invalid', 'true');
          this.announceToScreenReader(`${label} ไม่ถูกต้อง กรุณาตรวจสอบข้อมูล`);
        });
        
        element.addEventListener('input', () => {
          if (element.hasAttribute('aria-invalid')) {
            element.removeAttribute('aria-invalid');
          }
        });
      }
    });
  }

  setupButtonLabels() {
    const buttons = [
      { selector: '#themeBtn', label: 'เปลี่ยนธีม' },
      { selector: '#syncBtn', label: 'ซิงค์ข้อมูล' },
      { selector: 'button[onclick="resetPurchase()"]', label: 'ล้างฟอร์มการซื้อ' },
      { selector: 'button[onclick="onAddPurchase()"]', label: 'บันทึกการซื้อวัตถุดิบ' },
      { selector: 'button[onclick="resetSale()"]', label: 'ล้างฟอร์มการขาย' },
      { selector: 'button[onclick="onAddSale()"]', label: 'บันทึกการขาย' },
      { selector: 'button[onclick="resetMenuForm()"]', label: 'ล้างฟอร์มเมนู' },
      { selector: 'button[onclick="addMenuIngredient()"]', label: 'เพิ่มวัตถุดิบในเมนู' },
      { selector: 'button[onclick="calculateMenuCost()"]', label: 'คำนวณต้นทุนเมนู' },
      { selector: 'button[onclick="resetReportForm()"]', label: 'ล้างฟอร์มรายงาน' },
      { selector: 'button[onclick="generateReport()"]', label: 'สร้างรายงาน' },
      { selector: 'button[onclick="exportReport()"]', label: 'ส่งออกรายงาน' },
      { selector: 'button[onclick="refreshLowStock()"]', label: 'รีเฟรชข้อมูลสต๊อกต่ำ' }
    ];

    buttons.forEach(({ selector, label }) => {
      const button = document.querySelector(selector);
      if (button && !button.getAttribute('aria-label')) {
        button.setAttribute('aria-label', label);
      }
    });
  }

  setupNavigationLabels() {
    const tabButtons = document.querySelectorAll('.tabbtn');
    const tabLabels = ['หน้าหลัก', 'บันทึกการซื้อ', 'บันทึกการขาย', 'จัดการเมนู', 'รายงาน'];
    
    tabButtons.forEach((button, index) => {
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-label', tabLabels[index]);
      button.setAttribute('tabindex', button.getAttribute('aria-current') === 'page' ? '0' : '-1');
    });
  }

  setupKeyboardNavigation() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Skip if user is typing in an input
      if (this.isInputFocused()) return;

      switch (e.key) {
        case 'Tab':
          this.handleTabNavigation(e);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          if (e.target.classList.contains('tabbtn')) {
            this.handleTabArrowNavigation(e);
          }
          break;
        case 'Home':
          if (e.ctrlKey) {
            e.preventDefault();
            this.focusFirstElement();
          }
          break;
        case 'End':
          if (e.ctrlKey) {
            e.preventDefault();
            this.focusLastElement();
          }
          break;
        case 'Escape':
          this.handleEscapeKey(e);
          break;
        case 'F6':
          e.preventDefault();
          this.cycleFocusRegions();
          break;
      }
    });

    // Setup roving tabindex for tab navigation
    this.setupRovingTabindex();
  }

  setupRovingTabindex() {
    const tabButtons = document.querySelectorAll('.tabbtn');
    
    tabButtons.forEach((button, index) => {
      button.addEventListener('keydown', (e) => {
        let newIndex = index;
        
        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            newIndex = index > 0 ? index - 1 : tabButtons.length - 1;
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            newIndex = index < tabButtons.length - 1 ? index + 1 : 0;
            break;
          case 'Home':
            e.preventDefault();
            newIndex = 0;
            break;
          case 'End':
            e.preventDefault();
            newIndex = tabButtons.length - 1;
            break;
        }
        
        if (newIndex !== index) {
          // Update tabindex
          tabButtons.forEach((btn, i) => {
            btn.setAttribute('tabindex', i === newIndex ? '0' : '-1');
          });
          
          // Focus new button
          tabButtons[newIndex].focus();
        }
      });
    });
  }

  handleTabNavigation(e) {
    // Custom tab navigation logic
    this.updateFocusableElements();
    
    if (e.shiftKey) {
      // Shift+Tab - previous element
      if (this.currentFocusIndex > 0) {
        this.currentFocusIndex--;
      } else {
        this.currentFocusIndex = this.focusableElements.length - 1;
      }
    } else {
      // Tab - next element
      if (this.currentFocusIndex < this.focusableElements.length - 1) {
        this.currentFocusIndex++;
      } else {
        this.currentFocusIndex = 0;
      }
    }
  }

  handleTabArrowNavigation(e) {
    e.preventDefault();
    const tabButtons = document.querySelectorAll('.tabbtn');
    const currentIndex = Array.from(tabButtons).indexOf(e.target);
    let newIndex;

    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
    } else {
      newIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
    }

    tabButtons[newIndex].focus();
    tabButtons[newIndex].click();
  }

  handleEscapeKey(e) {
    // Close any open modals, menus, or return to main content
    const activeElement = document.activeElement;
    
    if (activeElement && activeElement.closest('.fab-menu')) {
      // Close FAB menu if open
      if (window.quickActionManager) {
        window.quickActionManager.closeMenu();
      }
    } else {
      // Focus main content
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.focus();
      }
    }
  }

  cycleFocusRegions() {
    const regions = [
      document.querySelector('.appbar'),
      document.querySelector('main'),
      document.querySelector('.tabbar')
    ];

    const currentRegion = regions.find(region => 
      region && region.contains(document.activeElement)
    );

    let nextIndex = 0;
    if (currentRegion) {
      const currentIndex = regions.indexOf(currentRegion);
      nextIndex = (currentIndex + 1) % regions.length;
    }

    const nextRegion = regions[nextIndex];
    if (nextRegion) {
      const focusableInRegion = nextRegion.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableInRegion) {
        focusableInRegion.focus();
      } else {
        nextRegion.focus();
      }
    }
  }

  setupScreenReaderSupport() {
    // Create live region for announcements
    this.createLiveRegion();
    
    // Setup form validation announcements
    this.setupFormValidationAnnouncements();
    
    // Setup loading state announcements
    this.setupLoadingAnnouncements();
    
    // Setup success/error announcements
    this.setupStatusAnnouncements();
  }

  createLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);

    // Create assertive live region for urgent announcements
    const assertiveLiveRegion = document.createElement('div');
    assertiveLiveRegion.id = 'assertive-live-region';
    assertiveLiveRegion.setAttribute('aria-live', 'assertive');
    assertiveLiveRegion.setAttribute('aria-atomic', 'true');
    assertiveLiveRegion.className = 'sr-only';
    document.body.appendChild(assertiveLiveRegion);
  }

  announceToScreenReader(message, priority = 'polite') {
    const liveRegionId = priority === 'assertive' ? 'assertive-live-region' : 'live-region';
    const liveRegion = document.getElementById(liveRegionId);
    
    if (liveRegion) {
      // Clear previous message
      liveRegion.textContent = '';
      
      // Add new message after a brief delay to ensure it's announced
      setTimeout(() => {
        liveRegion.textContent = message;
      }, 100);
      
      // Clear message after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 5000);
    }
  }

  setupFormValidationAnnouncements() {
    // Monitor form submissions and validation
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const invalidFields = form.querySelectorAll(':invalid');
      
      if (invalidFields.length > 0) {
        const fieldNames = Array.from(invalidFields).map(field => 
          field.getAttribute('aria-label') || field.name || 'ฟิลด์'
        );
        
        this.announceToScreenReader(
          `พบข้อผิดพลาด ${invalidFields.length} ฟิลด์: ${fieldNames.join(', ')}`,
          'assertive'
        );
      }
    });
  }

  setupLoadingAnnouncements() {
    // Monitor loading states
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const isLoading = loadingElement.classList.contains('show');
            if (isLoading) {
              this.announceToScreenReader('กำลังโหลด กรุณารอสักครู่');
            } else {
              this.announceToScreenReader('โหลดเสร็จสิ้น');
            }
          }
        });
      });
      
      observer.observe(loadingElement, { attributes: true });
    }
  }

  setupStatusAnnouncements() {
    // Monitor toast messages
    const toastElement = document.getElementById('toast');
    if (toastElement) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const message = toastElement.textContent.trim();
            if (message && toastElement.classList.contains('show')) {
              this.announceToScreenReader(message, 'assertive');
            }
          }
        });
      });
      
      observer.observe(toastElement, { 
        childList: true, 
        characterData: true, 
        subtree: true 
      });
    }
  }

  setupAccessibilityPreferences() {
    // Detect user preferences
    this.detectPreferences();
    
    // Setup preference controls
    this.setupPreferenceControls();
  }

  detectPreferences() {
    // Detect reduced motion preference
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Detect high contrast preference
    this.highContrastMode = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      this.applyMotionPreferences();
    });
    
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.highContrastMode = e.matches;
      this.applyContrastPreferences();
    });
  }

  setupPreferenceControls() {
    // These will be added to the accessibility toolbar
    this.preferenceControls = {
      fontSize: {
        label: 'ขนาดตัวอักษร',
        options: ['small', 'normal', 'large', 'extra-large'],
        current: 'normal'
      },
      contrast: {
        label: 'ความคมชัด',
        options: ['normal', 'high'],
        current: 'normal'
      },
      motion: {
        label: 'การเคลื่อนไหว',
        options: ['normal', 'reduced'],
        current: 'normal'
      }
    };
  }

  setupSkipLinks() {
    const skipLinks = [
      { href: '#main', text: 'ข้ามไปยังเนื้อหาหลัก' },
      { href: '#navigation', text: 'ข้ามไปยังเมนูนำทาง' },
      { href: '#search', text: 'ข้ามไปยังการค้นหา' }
    ];

    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.className = 'skip-links';
    skipLinksContainer.innerHTML = skipLinks.map(link => 
      `<a href="${link.href}" class="skip-link">${link.text}</a>`
    ).join('');

    document.body.insertBefore(skipLinksContainer, document.body.firstChild);

    // Handle skip link clicks
    skipLinksContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('skip-link')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const target = document.getElementById(targetId) || document.querySelector(`[role="main"]`);
        
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
          this.announceToScreenReader(`ข้ามไปยัง${e.target.textContent}`);
        }
      }
    });
  }

  setupFocusManagement() {
    // Track focus changes
    document.addEventListener('focusin', (e) => {
      this.updateFocusableElements();
      this.currentFocusIndex = this.focusableElements.indexOf(e.target);
    });

    // Ensure main content is focusable
    const mainContent = document.querySelector('main');
    if (mainContent && !mainContent.hasAttribute('tabindex')) {
      mainContent.setAttribute('tabindex', '-1');
    }
  }

  setupAccessibilityToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'accessibility-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'เครื่องมือการเข้าถึง');
    
    toolbar.innerHTML = `
      <button class="a11y-btn" data-action="font-size" aria-label="เปลี่ยนขนาดตัวอักษร">
        <span class="a11y-icon">🔤</span>
      </button>
      <button class="a11y-btn" data-action="contrast" aria-label="เปลี่ยนความคมชัด">
        <span class="a11y-icon">🌓</span>
      </button>
      <button class="a11y-btn" data-action="motion" aria-label="ลดการเคลื่อนไหว">
        <span class="a11y-icon">🎭</span>
      </button>
      <button class="a11y-btn" data-action="focus-outline" aria-label="แสดงกรอบโฟกัส">
        <span class="a11y-icon">🎯</span>
      </button>
      <button class="a11y-btn" data-action="shortcuts" aria-label="แสดงคีย์ลัด">
        <span class="a11y-icon">⌨️</span>
      </button>
    `;

    // Add to page
    document.body.appendChild(toolbar);

    // Handle toolbar actions
    toolbar.addEventListener('click', (e) => {
      const button = e.target.closest('.a11y-btn');
      if (button) {
        const action = button.dataset.action;
        this.handleAccessibilityAction(action);
      }
    });
  }

  handleAccessibilityAction(action) {
    switch (action) {
      case 'font-size':
        this.cycleFontSize();
        break;
      case 'contrast':
        this.toggleHighContrast();
        break;
      case 'motion':
        this.toggleReducedMotion();
        break;
      case 'focus-outline':
        this.toggleFocusOutlines();
        break;
      case 'shortcuts':
        this.showKeyboardShortcuts();
        break;
    }
  }

  cycleFontSize() {
    const sizes = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    this.fontSize = sizes[nextIndex];
    
    document.documentElement.setAttribute('data-font-size', this.fontSize);
    this.announceToScreenReader(`ขนาดตัวอักษร: ${this.getFontSizeLabel(this.fontSize)}`);
    this.saveAccessibilityPreferences();
  }

  toggleHighContrast() {
    this.highContrastMode = !this.highContrastMode;
    document.documentElement.classList.toggle('high-contrast', this.highContrastMode);
    this.announceToScreenReader(`ความคมชัดสูง: ${this.highContrastMode ? 'เปิด' : 'ปิด'}`);
    this.saveAccessibilityPreferences();
  }

  toggleReducedMotion() {
    this.reducedMotion = !this.reducedMotion;
    document.documentElement.classList.toggle('reduced-motion', this.reducedMotion);
    this.announceToScreenReader(`ลดการเคลื่อนไหว: ${this.reducedMotion ? 'เปิด' : 'ปิด'}`);
    this.saveAccessibilityPreferences();
  }

  toggleFocusOutlines() {
    const showOutlines = !document.documentElement.classList.contains('show-focus-outlines');
    document.documentElement.classList.toggle('show-focus-outlines', showOutlines);
    this.announceToScreenReader(`กรอบโฟกัส: ${showOutlines ? 'แสดง' : 'ซ่อน'}`);
  }

  async showKeyboardShortcuts() {
    try {
      // Initialize keyboard shortcuts help if not already done
      if (!this.keyboardHelp) {
        const KeyboardShortcutsHelp = await import('./KeyboardShortcutsHelp.js');
        this.keyboardHelp = new (KeyboardShortcutsHelp.default || KeyboardShortcutsHelp)();
      }
      
      // Show the help modal
      this.keyboardHelp.show();
      
      this.announceToScreenReader('เปิดความช่วยเหลือคีย์ลัด');
    } catch (error) {
      console.error('Failed to load keyboard shortcuts help:', error);
      
      // Fallback to simple announcement
      const shortcuts = [
        'Ctrl+Q: เปิด/ปิดเมนูด่วน',
        'Ctrl+S: ขายด่วน',
        'Ctrl+P: ซื้อด่วน',
        'Ctrl+M: จัดการเมนู',
        'Ctrl+R: รายงานรายวัน',
        'Ctrl+H: หน้าหลัก',
        'Alt+1-5: เปลี่ยนแท็บ',
        'F6: เปลี่ยนพื้นที่โฟกัส',
        'Escape: ปิดเมนู/กลับ',
        'Tab: นำทางถัดไป',
        'Shift+Tab: นำทางก่อนหน้า'
      ];

      const shortcutText = shortcuts.join(', ');
      this.announceToScreenReader(`คีย์ลัดที่ใช้ได้: ${shortcutText}`);
      
      if (window.POS && window.POS.critical && window.POS.critical.toast) {
        window.POS.critical.toast('กดปุ่ม F1 เพื่อดูคีย์ลัดทั้งหมด');
      }
    }
  }

  // Utility methods
  updateFocusableElements() {
    this.focusableElements = Array.from(document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    )).filter(el => {
      return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.closest('.hide');
    });
  }

  focusFirstElement() {
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
      this.currentFocusIndex = 0;
    }
  }

  focusLastElement() {
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      const lastIndex = this.focusableElements.length - 1;
      this.focusableElements[lastIndex].focus();
      this.currentFocusIndex = lastIndex;
    }
  }

  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.contentEditable === 'true'
    );
  }

  getFontSizeLabel(size) {
    const labels = {
      'normal': 'ปกติ',
      'large': 'ใหญ่',
      'extra-large': 'ใหญ่พิเศษ'
    };
    return labels[size] || size;
  }

  applyMotionPreferences() {
    document.documentElement.classList.toggle('reduced-motion', this.reducedMotion);
  }

  applyContrastPreferences() {
    document.documentElement.classList.toggle('high-contrast', this.highContrastMode);
  }

  // Persistence
  loadAccessibilityPreferences() {
    try {
      const saved = localStorage.getItem('accessibilityPreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        this.fontSize = preferences.fontSize || 'normal';
        this.highContrastMode = preferences.highContrastMode || false;
        this.reducedMotion = preferences.reducedMotion || false;
        
        // Apply preferences
        document.documentElement.setAttribute('data-font-size', this.fontSize);
        document.documentElement.classList.toggle('high-contrast', this.highContrastMode);
        document.documentElement.classList.toggle('reduced-motion', this.reducedMotion);
      }
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error);
    }
  }

  saveAccessibilityPreferences() {
    try {
      const preferences = {
        fontSize: this.fontSize,
        highContrastMode: this.highContrastMode,
        reducedMotion: this.reducedMotion
      };
      localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    }
  }

  // Public API
  setFontSize(size) {
    if (['normal', 'large', 'extra-large'].includes(size)) {
      this.fontSize = size;
      document.documentElement.setAttribute('data-font-size', size);
      this.saveAccessibilityPreferences();
    }
  }

  setHighContrast(enabled) {
    this.highContrastMode = enabled;
    document.documentElement.classList.toggle('high-contrast', enabled);
    this.saveAccessibilityPreferences();
  }

  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
    document.documentElement.classList.toggle('reduced-motion', enabled);
    this.saveAccessibilityPreferences();
  }

  // Cleanup
  destroy() {
    // Remove event listeners and elements
    const toolbar = document.querySelector('.accessibility-toolbar');
    if (toolbar) toolbar.remove();
    
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) liveRegion.remove();
    
    const assertiveLiveRegion = document.getElementById('assertive-live-region');
    if (assertiveLiveRegion) assertiveLiveRegion.remove();
    
    const skipLinks = document.querySelector('.skip-links');
    if (skipLinks) skipLinks.remove();
  }
}

export default AccessibilityManager;