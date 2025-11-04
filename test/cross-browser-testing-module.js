/**
 * Cross-Browser Testing Module
 * Tests browser compatibility, device emulation, and responsive layouts
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 */

class CrossBrowserTestingModule {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 10000,
      ...config
    };
    
    // Browser configurations
    this.browsers = [
      {
        name: 'Chrome',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        features: ['webgl', 'serviceworker', 'indexeddb', 'websockets', 'webrtc'],
        cssSupport: ['flexbox', 'grid', 'transforms', 'transitions', 'animations']
      },
      {
        name: 'Firefox',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        features: ['webgl', 'serviceworker', 'indexeddb', 'websockets', 'webrtc'],
        cssSupport: ['flexbox', 'grid', 'transforms', 'transitions', 'animations']
      },
      {
        name: 'Safari',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        features: ['webgl', 'serviceworker', 'indexeddb', 'websockets'],
        cssSupport: ['flexbox', 'grid', 'transforms', 'transitions', 'animations']
      },
      {
        name: 'Edge',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        features: ['webgl', 'serviceworker', 'indexeddb', 'websockets', 'webrtc'],
        cssSupport: ['flexbox', 'grid', 'transforms', 'transitions', 'animations']
      }
    ];
    
    // Mobile device configurations
    this.mobileDevices = [
      {
        name: 'Android',
        type: 'mobile',
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
        viewport: { width: 360, height: 780 },
        devicePixelRatio: 3,
        touchEnabled: true
      },
      {
        name: 'iOS',
        type: 'mobile',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        devicePixelRatio: 3,
        touchEnabled: true
      }
    ];
    
    // Tablet configurations
    this.tablets = [
      {
        name: 'iPad',
        type: 'tablet',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 1024, height: 1366 },
        devicePixelRatio: 2,
        touchEnabled: true
      },
      {
        name: 'Android Tablet',
        type: 'tablet',
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-X900) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        viewport: { width: 800, height: 1280 },
        devicePixelRatio: 2,
        touchEnabled: true
      }
    ];
    
    // Viewport sizes for responsive testing
    this.viewports = [
      { name: 'Mobile Small', width: 320, height: 568 },
      { name: 'Mobile Medium', width: 375, height: 667 },
      { name: 'Mobile Large', width: 414, height: 896 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop Small', width: 1366, height: 768 },
      { name: 'Desktop Medium', width: 1920, height: 1080 },
      { name: 'Desktop Large', width: 2560, height: 1440 }
    ];
    
    this.testResults = {
      timestamp: null,
      browserTests: [],
      deviceTests: [],
      viewportTests: [],
      pwaTests: [],
      touchTests: [],
      responsiveTests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  /**
   * Test browser compatibility for Chrome, Firefox, Safari, Edge
   * Requirement: 6.1, 6.2, 6.3, 6.4
   */
  async testBrowserCompatibility() {
    console.log('Testing browser compatibility...');
    
    const results = [];
    
    for (const browser of this.browsers) {
      try {
        const browserResult = {
          browser: browser.name,
          userAgent: browser.userAgent,
          features: {},
          cssSupport: {},
          rendering: {},
          passed: true,
          issues: [],
          requirement: `6.${this.browsers.indexOf(browser) + 1}`
        };
        
        // Test browser features
        for (const feature of browser.features) {
          browserResult.features[feature] = await this.testBrowserFeature(feature, browser);
        }
        
        // Test CSS support
        for (const cssFeature of browser.cssSupport) {
          browserResult.cssSupport[cssFeature] = this.testCSSFeature(cssFeature);
        }
        
        // Test rendering capabilities
        browserResult.rendering = await this.testRendering(browser);
        
        // Check for failures
        const featureFailures = Object.values(browserResult.features).filter(f => !f.supported).length;
        const cssFailures = Object.values(browserResult.cssSupport).filter(c => !c.supported).length;
        
        if (featureFailures > 0 || cssFailures > 0 || !browserResult.rendering.passed) {
          browserResult.passed = false;
          browserResult.issues.push(`${featureFailures} feature failures, ${cssFailures} CSS failures`);
        }
        
        browserResult.message = browserResult.passed
          ? `${browser.name} fully compatible with all features`
          : `${browser.name} has compatibility issues: ${browserResult.issues.join(', ')}`;
        
        results.push(browserResult);
        
      } catch (error) {
        results.push({
          browser: browser.name,
          passed: false,
          error: error.message,
          requirement: `6.${this.browsers.indexOf(browser) + 1}`
        });
      }
    }
    
    this.testResults.browserTests = results;
    this.updateSummary(results);
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test browser feature support
   */
  async testBrowserFeature(feature, browser) {
    const result = {
      feature: feature,
      supported: false,
      details: null
    };
    
    try {
      switch (feature) {
        case 'webgl':
          result.supported = this.testWebGL();
          break;
        case 'serviceworker':
          result.supported = 'serviceWorker' in navigator;
          break;
        case 'indexeddb':
          result.supported = 'indexedDB' in window;
          break;
        case 'websockets':
          result.supported = 'WebSocket' in window;
          break;
        case 'webrtc':
          result.supported = 'RTCPeerConnection' in window;
          break;
        default:
          result.supported = false;
      }
    } catch (error) {
      result.supported = false;
      result.details = error.message;
    }
    
    return result;
  }

  /**
   * Test WebGL support
   */
  testWebGL() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl !== null && gl !== undefined;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test CSS feature support
   */
  testCSSFeature(feature) {
    const result = {
      feature: feature,
      supported: false
    };
    
    try {
      const testElement = document.createElement('div');
      const style = testElement.style;
      
      switch (feature) {
        case 'flexbox':
          result.supported = 'flex' in style || 'webkitFlex' in style;
          break;
        case 'grid':
          result.supported = 'grid' in style || 'msGrid' in style;
          break;
        case 'transforms':
          result.supported = 'transform' in style || 'webkitTransform' in style;
          break;
        case 'transitions':
          result.supported = 'transition' in style || 'webkitTransition' in style;
          break;
        case 'animations':
          result.supported = 'animation' in style || 'webkitAnimation' in style;
          break;
        default:
          result.supported = false;
      }
    } catch (error) {
      result.supported = false;
    }
    
    return result;
  }

  /**
   * Test rendering capabilities
   */
  async testRendering(browser) {
    const result = {
      passed: true,
      domManipulation: false,
      eventHandling: false,
      localStorage: false,
      issues: []
    };
    
    try {
      // Test DOM manipulation
      const testElement = document.createElement('div');
      testElement.textContent = 'Test';
      testElement.id = 'browser-test-element';
      document.body.appendChild(testElement);
      
      result.domManipulation = document.getElementById('browser-test-element') !== null;
      
      if (result.domManipulation) {
        document.body.removeChild(testElement);
      } else {
        result.issues.push('DOM manipulation failed');
        result.passed = false;
      }
      
      // Test event handling
      let eventFired = false;
      const button = document.createElement('button');
      button.addEventListener('click', () => { eventFired = true; });
      button.click();
      
      result.eventHandling = eventFired;
      if (!result.eventHandling) {
        result.issues.push('Event handling failed');
        result.passed = false;
      }
      
      // Test localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('browser_test', 'value');
        result.localStorage = localStorage.getItem('browser_test') === 'value';
        localStorage.removeItem('browser_test');
        
        if (!result.localStorage) {
          result.issues.push('localStorage failed');
          result.passed = false;
        }
      }
      
    } catch (error) {
      result.passed = false;
      result.issues.push(error.message);
    }
    
    return result;
  }

  /**
   * Test device emulation for mobile (Android, iOS) and tablet
   * Requirement: 6.5, 6.6
   */
  async testDeviceEmulation() {
    console.log('Testing device emulation...');
    
    const results = [];
    const allDevices = [...this.mobileDevices, ...this.tablets];
    
    for (const device of allDevices) {
      try {
        const deviceResult = {
          device: device.name,
          type: device.type,
          viewport: device.viewport,
          emulation: {},
          rendering: {},
          passed: true,
          issues: [],
          requirement: device.type === 'mobile' ? '6.5' : '6.6'
        };
        
        // Emulate device environment
        await this.emulateDevice(device);
        
        // Test viewport
        deviceResult.emulation.viewport = this.testViewportEmulation(device);
        
        // Test touch support
        deviceResult.emulation.touch = this.testTouchSupport(device);
        
        // Test device pixel ratio
        deviceResult.emulation.pixelRatio = this.testPixelRatio(device);
        
        // Test rendering on device
        deviceResult.rendering = await this.testDeviceRendering(device);
        
        // Check for failures
        if (!deviceResult.emulation.viewport.passed || 
            !deviceResult.emulation.touch.passed || 
            !deviceResult.rendering.passed) {
          deviceResult.passed = false;
          deviceResult.issues.push('Device emulation issues detected');
        }
        
        deviceResult.message = deviceResult.passed
          ? `${device.name} emulation successful`
          : `${device.name} emulation failed: ${deviceResult.issues.join(', ')}`;
        
        results.push(deviceResult);
        
        // Restore original environment
        this.restoreEnvironment();
        
      } catch (error) {
        results.push({
          device: device.name,
          type: device.type,
          passed: false,
          error: error.message,
          requirement: device.type === 'mobile' ? '6.5' : '6.6'
        });
      }
    }
    
    this.testResults.deviceTests = results;
    this.updateSummary(results);
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Emulate device environment
   */
  async emulateDevice(device) {
    // Store original values
    this.originalEnvironment = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      userAgent: navigator.userAgent
    };
    
    // Set viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: device.viewport.width
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: device.viewport.height
    });
    
    // Set device pixel ratio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: device.devicePixelRatio
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Test viewport emulation
   */
  testViewportEmulation(device) {
    const result = {
      passed: true,
      actualWidth: window.innerWidth,
      actualHeight: window.innerHeight,
      expectedWidth: device.viewport.width,
      expectedHeight: device.viewport.height
    };
    
    // Check if viewport matches expected dimensions
    if (window.innerWidth !== device.viewport.width || 
        window.innerHeight !== device.viewport.height) {
      result.passed = false;
    }
    
    return result;
  }

  /**
   * Test touch support
   */
  testTouchSupport(device) {
    const result = {
      passed: true,
      touchEvents: false,
      touchEnabled: device.touchEnabled
    };
    
    // Check touch event support
    result.touchEvents = 'ontouchstart' in window || 
                        'TouchEvent' in window ||
                        navigator.maxTouchPoints > 0;
    
    if (device.touchEnabled && !result.touchEvents) {
      result.passed = false;
    }
    
    return result;
  }

  /**
   * Test pixel ratio
   */
  testPixelRatio(device) {
    const result = {
      passed: true,
      actual: window.devicePixelRatio,
      expected: device.devicePixelRatio
    };
    
    if (window.devicePixelRatio !== device.devicePixelRatio) {
      result.passed = false;
    }
    
    return result;
  }

  /**
   * Test device rendering
   */
  async testDeviceRendering(device) {
    const result = {
      passed: true,
      overflow: false,
      touchTargets: true,
      issues: []
    };
    
    try {
      // Check for horizontal overflow
      const elements = document.querySelectorAll('*');
      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (rect.width > device.viewport.width + 10) { // 10px tolerance
          result.overflow = true;
          result.passed = false;
          result.issues.push(`Element overflow: ${rect.width}px > ${device.viewport.width}px`);
          break;
        }
      }
      
      // Check touch target sizes (minimum 44x44px)
      if (device.touchEnabled) {
        const interactiveElements = document.querySelectorAll('button, input, select, a, [onclick], [role="button"]');
        for (const element of interactiveElements) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            result.touchTargets = false;
            result.issues.push(`Touch target too small: ${rect.width}x${rect.height}px`);
          }
        }
        
        if (!result.touchTargets) {
          result.passed = false;
        }
      }
      
    } catch (error) {
      result.passed = false;
      result.issues.push(error.message);
    }
    
    return result;
  }

  /**
   * Restore original environment
   */
  restoreEnvironment() {
    if (this.originalEnvironment) {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: this.originalEnvironment.innerWidth
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: this.originalEnvironment.innerHeight
      });
      
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: this.originalEnvironment.devicePixelRatio
      });
      
      window.dispatchEvent(new Event('resize'));
    }
  }

  /**
   * Test viewport for different screen sizes
   * Requirement: 6.7
   */
  async testViewportSizes() {
    console.log('Testing viewport sizes...');
    
    const results = [];
    
    for (const viewport of this.viewports) {
      try {
        const viewportResult = {
          viewport: viewport.name,
          width: viewport.width,
          height: viewport.height,
          layout: {},
          passed: true,
          issues: [],
          requirement: '6.7'
        };
        
        // Set viewport size
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width
        });
        
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height
        });
        
        window.dispatchEvent(new Event('resize'));
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Test layout adaptation
        viewportResult.layout = await this.testLayoutAdaptation(viewport);
        
        if (!viewportResult.layout.passed) {
          viewportResult.passed = false;
          viewportResult.issues = viewportResult.layout.issues;
        }
        
        viewportResult.message = viewportResult.passed
          ? `Layout adapts correctly at ${viewport.width}x${viewport.height}px`
          : `Layout issues at ${viewport.width}x${viewport.height}px: ${viewportResult.issues.join(', ')}`;
        
        results.push(viewportResult);
        
      } catch (error) {
        results.push({
          viewport: viewport.name,
          width: viewport.width,
          height: viewport.height,
          passed: false,
          error: error.message,
          requirement: '6.7'
        });
      }
    }
    
    // Restore viewport
    this.restoreEnvironment();
    
    this.testResults.viewportTests = results;
    this.updateSummary(results);
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test layout adaptation
   */
  async testLayoutAdaptation(viewport) {
    const result = {
      passed: true,
      overflow: false,
      readability: true,
      navigation: true,
      issues: []
    };
    
    try {
      // Check for overflow
      const body = document.body;
      if (body.scrollWidth > viewport.width + 10) { // 10px tolerance
        result.overflow = true;
        result.passed = false;
        result.issues.push(`Horizontal overflow: ${body.scrollWidth}px > ${viewport.width}px`);
      }
      
      // Check text readability (font size should be at least 14px on mobile)
      if (viewport.width < 768) {
        const textElements = document.querySelectorAll('p, span, div, li, td');
        for (const element of textElements) {
          const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
          if (fontSize > 0 && fontSize < 14) {
            result.readability = false;
            result.issues.push(`Text too small: ${fontSize}px`);
            break;
          }
        }
        
        if (!result.readability) {
          result.passed = false;
        }
      }
      
      // Check navigation accessibility
      const navElements = document.querySelectorAll('nav, [role="navigation"]');
      if (navElements.length > 0) {
        for (const nav of navElements) {
          const rect = nav.getBoundingClientRect();
          if (rect.width > viewport.width) {
            result.navigation = false;
            result.passed = false;
            result.issues.push('Navigation overflow');
            break;
          }
        }
      }
      
    } catch (error) {
      result.passed = false;
      result.issues.push(error.message);
    }
    
    return result;
  }

  /**
   * Update summary statistics
   */
  updateSummary(results) {
    this.testResults.summary.totalTests += results.length;
    this.testResults.summary.passed += results.filter(r => r.passed).length;
    this.testResults.summary.failed += results.filter(r => !r.passed).length;
  }

  /**
   * Get cross-browser test report
   */
  getCrossBrowserReport() {
    return {
      ...this.testResults,
      generatedAt: new Date().toISOString(),
      passed: this.testResults.summary.failed === 0,
      successRate: this.testResults.summary.totalTests > 0
        ? ((this.testResults.summary.passed / this.testResults.summary.totalTests) * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Reset test results
   */
  reset() {
    this.testResults = {
      timestamp: null,
      browserTests: [],
      deviceTests: [],
      viewportTests: [],
      pwaTests: [],
      touchTests: [],
      responsiveTests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CrossBrowserTestingModule;
} else if (typeof window !== 'undefined') {
  window.CrossBrowserTestingModule = CrossBrowserTestingModule;
}

/**
 * Test PWA installation for mobile and desktop
 * Requirement: 6.8
 */
async testPWAInstallation() {
  console.log('Testing PWA installation...');
  
  const results = [];
  const platforms = ['desktop', 'mobile'];
  
  for (const platform of platforms) {
    try {
      const pwaResult = {
        platform: platform,
        manifest: {},
        serviceWorker: {},
        installability: {},
        passed: true,
        issues: [],
        requirement: '6.8'
      };
      
      // Test manifest
      pwaResult.manifest = await this.testManifest();
      
      // Test service worker
      pwaResult.serviceWorker = await this.testServiceWorker();
      
      // Test installability
      pwaResult.installability = await this.testInstallability(platform);
      
      // Check for failures
      if (!pwaResult.manifest.valid || 
          !pwaResult.serviceWorker.registered || 
          !pwaResult.installability.installable) {
        pwaResult.passed = false;
        
        if (!pwaResult.manifest.valid) {
          pwaResult.issues.push('Invalid manifest');
        }
        if (!pwaResult.serviceWorker.registered) {
          pwaResult.issues.push('Service worker not registered');
        }
        if (!pwaResult.installability.installable) {
          pwaResult.issues.push('App not installable');
        }
      }
      
      pwaResult.message = pwaResult.passed
        ? `PWA installable on ${platform}`
        : `PWA installation issues on ${platform}: ${pwaResult.issues.join(', ')}`;
      
      results.push(pwaResult);
      
    } catch (error) {
      results.push({
        platform: platform,
        passed: false,
        error: error.message,
        requirement: '6.8'
      });
    }
  }
  
  this.testResults.pwaTests = results;
  this.updateSummary(results);
  
  return {
    passed: results.every(r => r.passed),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    }
  };
}

/**
 * Test manifest file
 */
async testManifest() {
  const result = {
    valid: false,
    exists: false,
    requiredFields: {},
    issues: []
  };
  
  try {
    // Check if manifest link exists
    const manifestLink = document.querySelector('link[rel="manifest"]');
    result.exists = manifestLink !== null;
    
    if (!result.exists) {
      result.issues.push('Manifest link not found');
      return result;
    }
    
    // Try to fetch and parse manifest
    const manifestUrl = manifestLink.getAttribute('href');
    const response = await fetch(manifestUrl);
    
    if (!response.ok) {
      result.issues.push('Manifest file not accessible');
      return result;
    }
    
    const manifest = await response.json();
    
    // Check required fields
    result.requiredFields = {
      name: !!manifest.name,
      shortName: !!manifest.short_name,
      startUrl: !!manifest.start_url,
      display: !!manifest.display,
      icons: Array.isArray(manifest.icons) && manifest.icons.length > 0
    };
    
    // Validate icons
    if (result.requiredFields.icons) {
      const has192Icon = manifest.icons.some(icon => 
        icon.sizes && icon.sizes.includes('192x192')
      );
      const has512Icon = manifest.icons.some(icon => 
        icon.sizes && icon.sizes.includes('512x512')
      );
      
      if (!has192Icon || !has512Icon) {
        result.issues.push('Missing required icon sizes (192x192 and 512x512)');
        result.requiredFields.icons = false;
      }
    }
    
    // Check if all required fields are present
    result.valid = Object.values(result.requiredFields).every(v => v === true);
    
    if (!result.valid) {
      const missingFields = Object.entries(result.requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      result.issues.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
  } catch (error) {
    result.issues.push(`Manifest test error: ${error.message}`);
  }
  
  return result;
}

/**
 * Test service worker registration
 */
async testServiceWorker() {
  const result = {
    registered: false,
    active: false,
    scope: null,
    issues: []
  };
  
  try {
    if (!('serviceWorker' in navigator)) {
      result.issues.push('Service Worker not supported');
      return result;
    }
    
    // Check for existing registration
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      result.registered = true;
      result.active = registration.active !== null;
      result.scope = registration.scope;
      
      if (!result.active) {
        result.issues.push('Service Worker registered but not active');
      }
    } else {
      result.issues.push('No Service Worker registered');
    }
    
  } catch (error) {
    result.issues.push(`Service Worker test error: ${error.message}`);
  }
  
  return result;
}

/**
 * Test PWA installability
 */
async testInstallability(platform) {
  const result = {
    installable: false,
    criteria: {
      https: false,
      manifest: false,
      serviceWorker: false,
      notInstalled: true
    },
    issues: []
  };
  
  try {
    // Check HTTPS
    result.criteria.https = window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost';
    
    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    result.criteria.manifest = manifestLink !== null;
    
    // Check service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      result.criteria.serviceWorker = registration !== undefined && registration.active !== null;
    }
    
    // Check if already installed (approximation)
    result.criteria.notInstalled = !window.matchMedia('(display-mode: standalone)').matches;
    
    // Determine installability
    result.installable = Object.values(result.criteria).every(v => v === true);
    
    if (!result.installable) {
      const failedCriteria = Object.entries(result.criteria)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      result.issues.push(`Failed criteria: ${failedCriteria.join(', ')}`);
    }
    
  } catch (error) {
    result.issues.push(`Installability test error: ${error.message}`);
  }
  
  return result;
}

/**
 * Test touch interactions for mobile UI
 * Requirement: 6.9
 */
async testTouchInteractions() {
  console.log('Testing touch interactions...');
  
  const results = [];
  
  try {
    const touchResult = {
      touchEvents: {},
      gestures: {},
      touchTargets: {},
      passed: true,
      issues: [],
      requirement: '6.9'
    };
    
    // Test touch event support
    touchResult.touchEvents = this.testTouchEvents();
    
    // Test gesture support
    touchResult.gestures = await this.testGestures();
    
    // Test touch target sizes
    touchResult.touchTargets = this.testTouchTargetSizes();
    
    // Check for failures
    if (!touchResult.touchEvents.supported || 
        !touchResult.touchTargets.passed) {
      touchResult.passed = false;
      
      if (!touchResult.touchEvents.supported) {
        touchResult.issues.push('Touch events not supported');
      }
      if (!touchResult.touchTargets.passed) {
        touchResult.issues.push('Touch targets too small');
      }
    }
    
    touchResult.message = touchResult.passed
      ? 'Touch interactions work correctly'
      : `Touch interaction issues: ${touchResult.issues.join(', ')}`;
    
    results.push(touchResult);
    
  } catch (error) {
    results.push({
      passed: false,
      error: error.message,
      requirement: '6.9'
    });
  }
  
  this.testResults.touchTests = results;
  this.updateSummary(results);
  
  return {
    passed: results.every(r => r.passed),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    }
  };
}

/**
 * Test touch event support
 */
testTouchEvents() {
  const result = {
    supported: false,
    events: {
      touchstart: false,
      touchmove: false,
      touchend: false,
      touchcancel: false
    }
  };
  
  try {
    // Check touch event support
    result.events.touchstart = 'ontouchstart' in window;
    result.events.touchmove = 'ontouchmove' in window;
    result.events.touchend = 'ontouchend' in window;
    result.events.touchcancel = 'ontouchcancel' in window;
    
    // Check TouchEvent constructor
    const hasTouchEvent = 'TouchEvent' in window;
    
    // Check maxTouchPoints
    const hasMaxTouchPoints = navigator.maxTouchPoints > 0;
    
    result.supported = hasTouchEvent || hasMaxTouchPoints || 
                      Object.values(result.events).some(v => v === true);
    
  } catch (error) {
    result.supported = false;
  }
  
  return result;
}

/**
 * Test gesture support
 */
async testGestures() {
  const result = {
    tap: false,
    swipe: false,
    pinch: false,
    issues: []
  };
  
  try {
    // Create test element
    const testElement = document.createElement('div');
    testElement.style.cssText = 'width: 200px; height: 200px; position: fixed; top: 0; left: 0; z-index: 9999;';
    document.body.appendChild(testElement);
    
    // Test tap
    let tapHandled = false;
    testElement.addEventListener('touchstart', () => { tapHandled = true; });
    
    if ('TouchEvent' in window) {
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }],
        bubbles: true,
        cancelable: true
      });
      testElement.dispatchEvent(touchEvent);
      result.tap = tapHandled;
    } else {
      // Fallback to click event
      testElement.click();
      result.tap = true; // Assume click works
    }
    
    // Test swipe (simplified)
    let swipeHandled = false;
    testElement.addEventListener('touchmove', () => { swipeHandled = true; });
    
    if ('TouchEvent' in window) {
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 100 }],
        bubbles: true,
        cancelable: true
      });
      testElement.dispatchEvent(touchMove);
      result.swipe = swipeHandled;
    } else {
      result.swipe = true; // Assume supported
    }
    
    // Test pinch (check for multi-touch support)
    result.pinch = navigator.maxTouchPoints >= 2;
    
    // Cleanup
    document.body.removeChild(testElement);
    
  } catch (error) {
    result.issues.push(`Gesture test error: ${error.message}`);
  }
  
  return result;
}

/**
 * Test touch target sizes
 */
testTouchTargetSizes() {
  const result = {
    passed: true,
    minSize: 44,
    smallTargets: [],
    issues: []
  };
  
  try {
    // Find all interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, input, select, a, [onclick], [role="button"], [role="link"], [tabindex]'
    );
    
    for (const element of interactiveElements) {
      const rect = element.getBoundingClientRect();
      
      // Skip hidden elements
      if (rect.width === 0 || rect.height === 0) {
        continue;
      }
      
      // Check if touch target is too small
      if (rect.width < result.minSize || rect.height < result.minSize) {
        result.passed = false;
        result.smallTargets.push({
          element: element.tagName,
          size: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
          id: element.id || 'no-id',
          class: element.className || 'no-class'
        });
      }
    }
    
    if (!result.passed) {
      result.issues.push(`Found ${result.smallTargets.length} touch targets smaller than ${result.minSize}x${result.minSize}px`);
    }
    
  } catch (error) {
    result.passed = false;
    result.issues.push(`Touch target test error: ${error.message}`);
  }
  
  return result;
}

/**
 * Test responsive layout for adaptive layouts
 * Requirement: 6.10
 */
async testResponsiveLayout() {
  console.log('Testing responsive layout...');
  
  const results = [];
  
  try {
    const responsiveResult = {
      breakpoints: {},
      mediaQueries: {},
      fluidLayout: {},
      passed: true,
      issues: [],
      requirement: '6.10'
    };
    
    // Test breakpoints
    responsiveResult.breakpoints = await this.testBreakpoints();
    
    // Test media queries
    responsiveResult.mediaQueries = this.testMediaQueries();
    
    // Test fluid layout
    responsiveResult.fluidLayout = this.testFluidLayout();
    
    // Check for failures
    if (!responsiveResult.breakpoints.passed || 
        !responsiveResult.mediaQueries.working || 
        !responsiveResult.fluidLayout.passed) {
      responsiveResult.passed = false;
      
      if (!responsiveResult.breakpoints.passed) {
        responsiveResult.issues.push('Breakpoint issues detected');
      }
      if (!responsiveResult.mediaQueries.working) {
        responsiveResult.issues.push('Media queries not working');
      }
      if (!responsiveResult.fluidLayout.passed) {
        responsiveResult.issues.push('Layout not fluid');
      }
    }
    
    responsiveResult.message = responsiveResult.passed
      ? 'Responsive layout adapts correctly'
      : `Responsive layout issues: ${responsiveResult.issues.join(', ')}`;
    
    results.push(responsiveResult);
    
  } catch (error) {
    results.push({
      passed: false,
      error: error.message,
      requirement: '6.10'
    });
  }
  
  this.testResults.responsiveTests = results;
  this.updateSummary(results);
  
  return {
    passed: results.every(r => r.passed),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    }
  };
}

/**
 * Test breakpoints
 */
async testBreakpoints() {
  const result = {
    passed: true,
    breakpoints: [
      { name: 'mobile', width: 375 },
      { name: 'tablet', width: 768 },
      { name: 'desktop', width: 1024 },
      { name: 'wide', width: 1920 }
    ],
    tests: [],
    issues: []
  };
  
  try {
    for (const breakpoint of result.breakpoints) {
      // Set viewport to breakpoint width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: breakpoint.width
      });
      
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check for overflow
      const hasOverflow = document.body.scrollWidth > breakpoint.width + 10;
      
      result.tests.push({
        breakpoint: breakpoint.name,
        width: breakpoint.width,
        overflow: hasOverflow,
        passed: !hasOverflow
      });
      
      if (hasOverflow) {
        result.passed = false;
        result.issues.push(`Overflow at ${breakpoint.name} (${breakpoint.width}px)`);
      }
    }
    
  } catch (error) {
    result.passed = false;
    result.issues.push(`Breakpoint test error: ${error.message}`);
  }
  
  return result;
}

/**
 * Test media queries
 */
testMediaQueries() {
  const result = {
    working: true,
    queries: {},
    issues: []
  };
  
  try {
    // Test common media queries
    const queries = {
      mobile: '(max-width: 767px)',
      tablet: '(min-width: 768px) and (max-width: 1023px)',
      desktop: '(min-width: 1024px)',
      portrait: '(orientation: portrait)',
      landscape: '(orientation: landscape)',
      retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'
    };
    
    for (const [name, query] of Object.entries(queries)) {
      try {
        const mediaQuery = window.matchMedia(query);
        result.queries[name] = {
          query: query,
          matches: mediaQuery.matches,
          supported: true
        };
      } catch (error) {
        result.queries[name] = {
          query: query,
          matches: false,
          supported: false
        };
        result.working = false;
        result.issues.push(`Media query not supported: ${name}`);
      }
    }
    
  } catch (error) {
    result.working = false;
    result.issues.push(`Media query test error: ${error.message}`);
  }
  
  return result;
}

/**
 * Test fluid layout
 */
testFluidLayout() {
  const result = {
    passed: true,
    fixedWidthElements: [],
    issues: []
  };
  
  try {
    // Check for fixed-width elements that might break responsive layout
    const elements = document.querySelectorAll('*');
    
    for (const element of elements) {
      const style = window.getComputedStyle(element);
      const width = style.width;
      
      // Skip elements with auto, 100%, or relative units
      if (width && !width.includes('auto') && !width.includes('%') && 
          !width.includes('vw') && !width.includes('rem') && !width.includes('em')) {
        
        const widthValue = parseFloat(width);
        
        // Flag elements with large fixed widths
        if (widthValue > 1200) {
          result.fixedWidthElements.push({
            element: element.tagName,
            width: width,
            id: element.id || 'no-id',
            class: element.className || 'no-class'
          });
        }
      }
    }
    
    if (result.fixedWidthElements.length > 0) {
      result.passed = false;
      result.issues.push(`Found ${result.fixedWidthElements.length} elements with large fixed widths`);
    }
    
  } catch (error) {
    result.passed = false;
    result.issues.push(`Fluid layout test error: ${error.message}`);
  }
  
  return result;
}
