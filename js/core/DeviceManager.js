/**
 * Device Manager
 * Handles device detection, optimization, and responsive behavior
 * Provides device-specific enhancements and adaptive UI features
 */

class DeviceManager {
  constructor() {
    this.device = this.detectDevice();
    this.orientation = this.getOrientation();
    this.capabilities = this.detectCapabilities();
    this.initialized = false;
    
    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    this.init();
  }
  
  init() {
    if (this.initialized) return;
    
    // Set initial device classes
    this.updateDeviceClasses();
    
    // Set up event listeners
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('orientationchange', this.handleOrientationChange, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange, { passive: true });
    
    // Initialize device-specific optimizations
    this.initializeOptimizations();
    
    // Set up viewport height fix for mobile
    this.setupViewportFix();
    
    this.initialized = true;
    console.log('[DeviceManager] Initialized for:', this.device.type, this.device.os);
  }
  
  detectDevice() {
    const ua = navigator.userAgent;
    const screen = window.screen;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Device type detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || 
                    viewport.width <= 480;
    const isTablet = /iPad|Android/i.test(ua) && viewport.width > 480 && viewport.width <= 1024;
    const isDesktop = !isMobile && !isTablet && viewport.width > 1024;
    
    // OS detection
    let os = 'unknown';
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'ios';
    else if (/Android/i.test(ua)) os = 'android';
    else if (/Windows/i.test(ua)) os = 'windows';
    else if (/Mac/i.test(ua)) os = 'macos';
    else if (/Linux/i.test(ua)) os = 'linux';
    
    // Browser detection
    let browser = 'unknown';
    if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = 'chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'safari';
    else if (/Firefox/i.test(ua)) browser = 'firefox';
    else if (/Edge/i.test(ua)) browser = 'edge';
    
    // Device characteristics
    const pixelRatio = window.devicePixelRatio || 1;
    const isHighDPI = pixelRatio > 1.5;
    const isRetina = pixelRatio >= 2;
    
    return {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      os,
      browser,
      viewport,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight
      },
      pixelRatio,
      isHighDPI,
      isRetina,
      isMobile,
      isTablet,
      isDesktop,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      userAgent: ua
    };
  }
  
  detectCapabilities() {
    return {
      // Storage capabilities
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      indexedDB: 'indexedDB' in window,
      
      // Network capabilities
      onLine: navigator.onLine,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
      
      // Hardware capabilities
      vibration: 'vibrate' in navigator,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      
      // Browser capabilities
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      webShare: 'share' in navigator,
      clipboard: 'clipboard' in navigator,
      
      // Performance capabilities
      requestIdleCallback: 'requestIdleCallback' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      
      // CSS capabilities
      cssGrid: CSS.supports('display', 'grid'),
      cssFlexbox: CSS.supports('display', 'flex'),
      cssCustomProperties: CSS.supports('--test', 'value'),
      cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(1px)'),
      
      // Input capabilities
      keyboard: this.device.isDesktop,
      mouse: this.device.isDesktop,
      touch: this.device.hasTouch,
      pointer: 'PointerEvent' in window
    };
  }
  
  getOrientation() {
    const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
    if (orientation) {
      return orientation.type || orientation;
    }
    
    // Fallback based on dimensions
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }
  
  updateDeviceClasses() {
    const body = document.body;
    const html = document.documentElement;
    
    // Remove existing device classes
    const existingClasses = Array.from(body.classList).filter(cls => 
      cls.startsWith('device-') || cls.startsWith('os-') || cls.startsWith('browser-') || 
      cls.startsWith('orientation-') || cls.startsWith('dpr-')
    );
    body.classList.remove(...existingClasses);
    
    // Add current device classes
    body.classList.add(
      `device-${this.device.type}`,
      `os-${this.device.os}`,
      `browser-${this.device.browser}`,
      `orientation-${this.orientation}`,
      `dpr-${Math.floor(this.device.pixelRatio)}`
    );
    
    // Add capability classes
    if (this.device.hasTouch) body.classList.add('has-touch');
    if (this.device.isHighDPI) body.classList.add('high-dpi');
    if (this.device.isRetina) body.classList.add('retina');
    if (this.device.isStandalone) body.classList.add('standalone');
    if (this.capabilities.onLine) body.classList.add('online');
    else body.classList.add('offline');
    
    // Set CSS custom properties for responsive design
    html.style.setProperty('--device-width', `${this.device.viewport.width}px`);
    html.style.setProperty('--device-height', `${this.device.viewport.height}px`);
    html.style.setProperty('--pixel-ratio', this.device.pixelRatio);
    html.style.setProperty('--is-mobile', this.device.isMobile ? '1' : '0');
    html.style.setProperty('--is-tablet', this.device.isTablet ? '1' : '0');
    html.style.setProperty('--is-desktop', this.device.isDesktop ? '1' : '0');
  }
  
  initializeOptimizations() {
    // Mobile optimizations
    if (this.device.isMobile) {
      this.initializeMobileOptimizations();
    }
    
    // Tablet optimizations
    if (this.device.isTablet) {
      this.initializeTabletOptimizations();
    }
    
    // Desktop optimizations
    if (this.device.isDesktop) {
      this.initializeDesktopOptimizations();
    }
    
    // Touch optimizations
    if (this.device.hasTouch) {
      this.initializeTouchOptimizations();
    }
    
    // Performance optimizations
    this.initializePerformanceOptimizations();
  }
  
  initializeMobileOptimizations() {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.style.fontSize) {
        input.style.fontSize = '16px';
      }
    });
    
    // Add mobile-specific event listeners
    document.addEventListener('touchstart', () => {}, { passive: true });
    
    // Optimize scroll behavior
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Add mobile-specific classes to interactive elements
    const interactiveElements = document.querySelectorAll('button, .btn, .tile, .tabbtn');
    interactiveElements.forEach(el => {
      el.classList.add('mobile-optimized');
    });
  }
  
  initializeTabletOptimizations() {
    // Add tablet-specific classes
    document.body.classList.add('tablet-enhanced');
    
    // Enable hover effects for tablet
    if (this.capabilities.pointer) {
      document.body.classList.add('hover-enabled');
    }
    
    // Optimize touch targets for tablet
    const touchTargets = document.querySelectorAll('.btn, .tile, .tabbtn');
    touchTargets.forEach(el => {
      el.classList.add('tablet-touch-target');
    });
    
    // Add tablet-specific navigation enhancements
    const navElements = document.querySelectorAll('.tabbar, .adaptive-nav');
    navElements.forEach(nav => {
      nav.classList.add('tablet-nav-enhanced');
    });
  }
  
  initializeDesktopOptimizations() {
    // Enable desktop-specific features
    document.body.classList.add('desktop-enhanced');
    
    // Add hover effects
    document.body.classList.add('hover-enabled');
    
    // Initialize keyboard navigation
    this.initializeKeyboardNavigation();
    
    // Add desktop-specific classes to elements
    const cards = document.querySelectorAll('.card, .tile');
    cards.forEach(card => {
      card.classList.add('desktop-hover');
    });
  }
  
  initializeTouchOptimizations() {
    // Add touch-specific classes
    document.body.classList.add('touch-enabled');
    
    // Optimize touch events
    const touchElements = document.querySelectorAll('.btn, .tile, .tabbtn');
    touchElements.forEach(el => {
      el.addEventListener('touchstart', () => {}, { passive: true });
      el.addEventListener('touchend', () => {}, { passive: true });
    });
    
    // Add touch feedback
    if (this.capabilities.vibration) {
      touchElements.forEach(el => {
        el.addEventListener('touchstart', () => {
          navigator.vibrate(10);
        }, { passive: true });
      });
    }
  }
  
  initializePerformanceOptimizations() {
    // Use Intersection Observer for lazy loading if available
    if (this.capabilities.intersectionObserver) {
      this.setupLazyLoading();
    }
    
    // Use requestIdleCallback for non-critical tasks
    if (this.capabilities.requestIdleCallback) {
      this.scheduleIdleTasks();
    }
    
    // Optimize animations based on device capabilities
    if (this.device.isMobile && this.device.pixelRatio < 2) {
      document.body.classList.add('reduced-animations');
    }
  }
  
  initializeKeyboardNavigation() {
    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
      // Tab navigation
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
      
      // Arrow key navigation for tabs
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const activeTab = document.querySelector('.tabbtn[aria-current="page"]');
        if (activeTab) {
          const tabs = Array.from(document.querySelectorAll('.tabbtn'));
          const currentIndex = tabs.indexOf(activeTab);
          let nextIndex;
          
          if (e.key === 'ArrowLeft') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          } else {
            nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          }
          
          tabs[nextIndex].click();
          tabs[nextIndex].focus();
          e.preventDefault();
        }
      }
    });
    
    // Remove keyboard navigation class on mouse use
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }
  
  setupLazyLoading() {
    const lazyElements = document.querySelectorAll('[data-lazy]');
    if (lazyElements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const src = element.dataset.lazy;
          if (src) {
            element.src = src;
            element.removeAttribute('data-lazy');
            observer.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px'
    });
    
    lazyElements.forEach(el => observer.observe(el));
  }
  
  scheduleIdleTasks() {
    const idleTasks = [
      () => this.preloadCriticalResources(),
      () => this.optimizeImages(),
      () => this.cleanupUnusedElements()
    ];
    
    idleTasks.forEach(task => {
      requestIdleCallback(task, { timeout: 5000 });
    });
  }
  
  setupViewportFix() {
    // Fix viewport height on mobile devices
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH, { passive: true });
    
    // Handle orientation change with delay for mobile
    if (this.device.isMobile) {
      window.addEventListener('orientationchange', () => {
        setTimeout(setVH, 250);
      }, { passive: true });
    }
  }
  
  handleResize() {
    // Update device info
    this.device.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Update device type if needed
    const oldType = this.device.type;
    const newDevice = this.detectDevice();
    
    if (newDevice.type !== oldType) {
      this.device = newDevice;
      this.updateDeviceClasses();
      this.initializeOptimizations();
    }
    
    // Update CSS custom properties
    document.documentElement.style.setProperty('--device-width', `${this.device.viewport.width}px`);
    document.documentElement.style.setProperty('--device-height', `${this.device.viewport.height}px`);
    
    // Emit custom event for other components
    window.dispatchEvent(new CustomEvent('deviceResize', {
      detail: { device: this.device }
    }));
  }
  
  handleOrientationChange() {
    setTimeout(() => {
      this.orientation = this.getOrientation();
      this.updateDeviceClasses();
      
      // Emit custom event
      window.dispatchEvent(new CustomEvent('orientationChanged', {
        detail: { orientation: this.orientation }
      }));
    }, 250);
  }
  
  handleVisibilityChange() {
    if (document.hidden) {
      // App is hidden - pause non-critical operations
      this.pauseNonCriticalOperations();
    } else {
      // App is visible - resume operations
      this.resumeOperations();
    }
  }
  
  pauseNonCriticalOperations() {
    // Pause animations, timers, etc.
    document.body.classList.add('app-hidden');
  }
  
  resumeOperations() {
    // Resume operations
    document.body.classList.remove('app-hidden');
  }
  
  preloadCriticalResources() {
    // Preload critical CSS and JS
    const criticalResources = [
      'css/components.css',
      'css/dashboard.css',
      'js/core/modules/PurchaseModule.js',
      'js/core/modules/SaleModule.js'
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = resource.endsWith('.css') ? 'style' : 'script';
      link.href = resource;
      document.head.appendChild(link);
    });
  }
  
  optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });
  }
  
  cleanupUnusedElements() {
    // Remove unused elements to free memory
    const unusedElements = document.querySelectorAll('[data-cleanup]');
    unusedElements.forEach(el => {
      if (!el.offsetParent && !el.dataset.keepAlive) {
        el.remove();
      }
    });
  }
  
  testLocalStorage() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  testSessionStorage() {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Public API methods
  getDevice() {
    return { ...this.device };
  }
  
  getCapabilities() {
    return { ...this.capabilities };
  }
  
  getOrientation() {
    return this.orientation;
  }
  
  isMobile() {
    return this.device.isMobile;
  }
  
  isTablet() {
    return this.device.isTablet;
  }
  
  isDesktop() {
    return this.device.isDesktop;
  }
  
  hasTouch() {
    return this.device.hasTouch;
  }
  
  isOnline() {
    return this.capabilities.onLine;
  }
  
  supportsFeature(feature) {
    return this.capabilities[feature] || false;
  }
  
  // Utility methods for responsive behavior
  adaptToDevice(mobileConfig, tabletConfig, desktopConfig) {
    if (this.device.isMobile) return mobileConfig;
    if (this.device.isTablet) return tabletConfig;
    return desktopConfig;
  }
  
  getOptimalImageSize() {
    const baseSize = this.adaptToDevice(320, 768, 1200);
    return Math.min(baseSize * this.device.pixelRatio, 2400);
  }
  
  getOptimalChunkSize() {
    return this.adaptToDevice(10, 25, 50);
  }
  
  shouldUseAnimation() {
    return !document.body.classList.contains('reduced-animations') &&
           !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  destroy() {
    if (!this.initialized) return;
    
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    this.initialized = false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeviceManager;
} else {
  window.DeviceManager = DeviceManager;
}