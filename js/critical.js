/**
 * Critical JavaScript - Loaded immediately for core functionality
 * Contains essential features needed for initial page load and basic navigation
 */

// ---------- 1) Reliable 100vh on iOS + Android ----------
function setVH(){
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// ---------- 2) Soft keyboard handling ----------
function initKeyboardHandling() {
  let focused = false;
  const app = document.getElementById('app');
  const screen = document.getElementById('screen');
  
  function onFocusIn(e){
    if(e.target.matches('input, textarea, select')){
      focused = true;
      app.style.minHeight = 'auto';
      screen.style.paddingBottom = '16px';
    }
  }
  
  function onFocusOut(e){
    if(e.target.matches('input, textarea, select')){
      focused = false;
      app.style.minHeight = 'calc(var(--vh) * 100)';
      screen.style.paddingBottom = 'calc(12px + var(--tabbar-h) + max(var(--sa-b), 0px))';
    }
  }
  
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
}

// ---------- 3) Fast tab routing ----------
function initRouting() {
  const screen = document.getElementById('screen');
  
  window.routeTo = function(name) {
    // Hide all screens
    document.querySelectorAll('[id$="-screen"]').forEach(s => s.classList.add('hide'));
    
    // Show target screen
    const targetScreen = document.getElementById(name + '-screen');
    if (targetScreen) {
      targetScreen.classList.remove('hide');
    }
    
    // Update tab states
    [...document.querySelectorAll('.tabbtn')].forEach(b=>b.setAttribute('aria-current','false'));
    const active = document.querySelector(`.tabbtn[data-route="${name}"]`);
    if(active) active.setAttribute('aria-current','page');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Load screen-specific functionality
    loadScreenModule(name);
  };

  // Event listeners for navigation
  document.querySelectorAll('[data-route]').forEach(el=>{
    el.addEventListener('click', ()=> routeTo(el.dataset.route));
  });
}

// ---------- 4) Core utility functions ----------
const $ = (id) => document.getElementById(id);

function toast(msg) { 
  const t = $('toast'); 
  t.textContent = msg; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), 3000);
}

function loading(show) {
  $('loading').classList.toggle('show', show);
}

// ---------- 5) Screen module loading ----------
async function loadScreenModule(screenName) {
  if (!window.moduleLoader) {
    // Initialize module loader if not already done
    await initModuleLoader();
  }

  const moduleMap = {
    'home': null, // Home screen is always loaded
    'purchase': 'purchase',
    'sale': 'sale', 
    'menu': 'menu',
    'reports': 'reports'
  };

  const moduleName = moduleMap[screenName];
  if (moduleName) {
    try {
      const ModuleClass = await window.moduleLoader.loadModule(moduleName);
      if (ModuleClass) {
        // Create module instance if not exists
        const instanceKey = `${moduleName}Instance`;
        if (!window[instanceKey]) {
          window[instanceKey] = new ModuleClass();
        }
        
        // Initialize the module
        if (window[instanceKey].init) {
          window[instanceKey].init();
        }
      }
    } catch (error) {
      console.error(`Failed to load ${screenName} module:`, error);
      toast(`ไม่สามารถโหลดหน้า ${screenName} ได้`);
    }
  }

  // Load screen-specific data
  loadScreenData(screenName);
}

// ---------- 6) Screen data loading ----------
function loadScreenData(screenName) {
  switch (screenName) {
    case 'home':
      refreshLowStock();
      // Initialize dashboard module for enhanced analytics
      initializeDashboard();
      break;
    case 'menu':
      loadMenuIngredients();
      break;
    case 'reports':
      // Initialize reports module with export functionality
      initializeReportsModule();
      break;
    // Other screens will load their data via their modules
  }
}

// ---------- 7) Basic form functions (critical for immediate use) ----------
function resetPurchase() {
  ['p_date', 'p_ing', 'p_qty', 'p_unit', 'p_actual_yield', 'p_total_price', 'p_price', 'p_note']
    .forEach(id => $(id).value = '');
}

function resetSale() {
  ['s_date', 's_platform', 's_menu', 's_qty', 's_price'].forEach(id => $(id).value = '');
  $('s_qty').value = '1';
}

function resetMenuForm() {
  ['m_menu', 'm_ingredient', 'm_qty', 'm_unit'].forEach(id => $(id).value = '');
}

function resetReportForm() {
  ['rp_from', 'rp_to'].forEach(id => $(id).value = '');
}

// ---------- 8) Critical API functions ----------
function refreshLowStock() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.withSuccessHandler(html => {
      const content = $('low-stock-content');
      if (content) {
        content.innerHTML = html || '<div class="muted">ไม่มีวัตถุดิบใกล้หมด</div>';
      }
      
      // Update KPI
      const matches = (html || '').match(/class="badge"/g);
      const count = matches ? matches.length : 0;
      const kpiElement = $('kpi-low');
      if (kpiElement) {
        kpiElement.textContent = count;
      }
    }).withFailureHandler(err => {
      console.error('Failed to refresh low stock:', err);
      const content = $('low-stock-content');
      if (content) {
        content.innerHTML = '<div class="muted">ไม่สามารถโหลดข้อมูลได้</div>';
      }
    }).getLowStockHTML();
  }
}

// ---------- 9) Service worker initialization ----------
async function initServiceWorker() {
  try {
    // Load and initialize service worker manager
    const ServiceWorkerManager = await import('./core/ServiceWorkerManager.js');
    window.swManager = new (ServiceWorkerManager.default || ServiceWorkerManager)();
    
    // Setup offline/online handlers
    window.swManager.onOffline(() => {
      console.log('[App] Switched to offline mode');
      // Enable offline features
      enableOfflineMode();
    });
    
    window.swManager.onOnline(() => {
      console.log('[App] Back online');
      // Disable offline mode and sync data
      disableOfflineMode();
      syncOfflineData();
    });
    
    // Setup update handler
    window.swManager.onUpdate(() => {
      console.log('[App] Service worker update available');
    });
    
    console.log('[App] Service worker manager initialized');
  } catch (error) {
    console.error('[App] Failed to initialize service worker:', error);
  }
}

// ---------- 10) Module loader initialization ----------
async function initModuleLoader() {
  try {
    // Load the module loader
    const ModuleLoader = await import('./core/ModuleLoader.js');
    window.moduleLoader = new (ModuleLoader.default || ModuleLoader)();
    
    // Initialize CSS management
    if (!window.cssManager) {
      const CSSManager = await import('./core/CSSManager.js');
      window.cssManager = new (CSSManager.default || CSSManager)();
    }
    
    // Preload likely-to-be-used modules
    const currentHour = new Date().getHours();
    const likelyModules = [];
    
    // Business logic: preload based on time of day
    if (currentHour >= 9 && currentHour <= 11) {
      // Morning: likely to record purchases
      likelyModules.push('purchase');
    } else if (currentHour >= 11 && currentHour <= 14) {
      // Lunch time: likely to record sales
      likelyModules.push('sale');
    } else if (currentHour >= 17 && currentHour <= 21) {
      // Dinner time: likely to record sales and check reports
      likelyModules.push('sale', 'reports');
    }
    
    if (likelyModules.length > 0) {
      window.moduleLoader.preloadModules(likelyModules, 'low');
    }
    
  } catch (error) {
    console.error('Failed to initialize module loader:', error);
  }
}

// ---------- 11) Offline mode handling ----------
function enableOfflineMode() {
  // Add offline indicator to UI
  document.body.classList.add('offline');
  
  // Show offline status in app bar
  const appBar = document.querySelector('.appbar .title');
  if (appBar && !appBar.textContent.includes('(ออฟไลน์)')) {
    appBar.textContent += ' (ออฟไลน์)';
  }
  
  // Disable features that require network
  const syncBtn = $('syncBtn');
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.style.opacity = '0.5';
  }
}

function disableOfflineMode() {
  // Remove offline indicator from UI
  document.body.classList.remove('offline');
  
  // Remove offline status from app bar
  const appBar = document.querySelector('.appbar .title');
  if (appBar) {
    appBar.textContent = appBar.textContent.replace(' (ออฟไลน์)', '');
  }
  
  // Re-enable network features
  const syncBtn = $('syncBtn');
  if (syncBtn) {
    syncBtn.disabled = false;
    syncBtn.style.opacity = '1';
  }
}

function syncOfflineData() {
  // This will be implemented by individual modules
  // For now, just refresh critical data
  refreshLowStock();
  
  // Notify modules to sync their offline data
  if (window.purchaseInstance && window.purchaseInstance.syncOfflineData) {
    window.purchaseInstance.syncOfflineData();
  }
  
  if (window.saleInstance && window.saleInstance.syncOfflineData) {
    window.saleInstance.syncOfflineData();
  }
}

// ---------- 12) Theme handling ----------
function initTheme() {
  const themeBtn = $('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark-theme');
      themeBtn.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      themeBtn.textContent = '☀️';
    }
  }
}

// ---------- 13) Sync button handling ----------
function initSync() {
  const syncBtn = $('syncBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      // Check if we're offline
      if (window.swManager && window.swManager.offline) {
        toast('ไม่มีการเชื่อมต่ออินเทอร์เน็ต');
        return;
      }
      
      syncBtn.style.animation = 'spin 1s linear infinite';
      
      try {
        // Refresh critical data
        refreshLowStock();
        
        // Clear expired cache if service worker is available
        if (window.swManager) {
          await window.swManager.clearCache();
        }
        
        // Sync offline data
        syncOfflineData();
        
        toast('ข้อมูลได้รับการอัปเดตแล้ว');
      } catch (error) {
        console.error('Sync failed:', error);
        toast('ไม่สามารถซิงค์ข้อมูลได้');
      } finally {
        setTimeout(() => {
          syncBtn.style.animation = '';
        }, 1000);
      }
    });
  }
  
  // Notification button handling
  const notificationBtn = $('notificationBtn');
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      toggleNotificationPanel();
    });
  }
}

// ---------- 19) Utility functions for dynamic loading ----------
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadCSS(href) {
  return new Promise((resolve, reject) => {
    // Check if CSS is already loaded
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

// ---------- 20) PWA initialization ----------
function initPWA() {
  // Load PWA CSS
  loadCSS('css/pwa.css');
  
  // Initialize PWA installer
  loadScript('js/core/PWAInstaller.js').then(() => {
    if (window.PWAInstaller) {
      window.pwaInstaller = new window.PWAInstaller();
    }
  });
  
  // Initialize notification manager
  loadScript('js/core/NotificationManager.js').then(() => {
    if (window.NotificationManager) {
      window.notificationManager = new window.NotificationManager();
    }
  });
}

// ---------- 21) Notification panel handling ----------
function toggleNotificationPanel() {
  if (window.notificationManager) {
    window.notificationManager.showNotificationPanel();
  } else {
    // Load notification manager if not loaded
    loadScript('js/core/NotificationManager.js').then(() => {
      if (window.NotificationManager) {
        window.notificationManager = new window.NotificationManager();
        window.notificationManager.showNotificationPanel();
      }
    });
  }
}

// ---------- 14) Initialize critical functionality ----------
function initCritical() {
  setVH();
  initKeyboardHandling();
  initRouting();
  initTheme();
  initSync();
  initPWA();
  
  // Handle viewport changes
  window.addEventListener('resize', () => {
    setVH();
  });
  
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      setVH();
    }, 250);
  });
  
  // Initialize responsive layout system (high priority)
  setTimeout(initResponsiveLayout, 25);
  
  // Initialize service worker first (highest priority)
  setTimeout(initServiceWorker, 50);
  
  // Initialize module loader after service worker
  setTimeout(initModuleLoader, 100);
  
  // Initialize quick actions and accessibility (after basic setup)
  setTimeout(initQuickActions, 200);
  
  // Initialize final optimizations (after core systems are ready)
  setTimeout(initializeFinalOptimizations, 300);
}

// ---------- 15) Initialize Responsive Layout System ----------
async function initResponsiveLayout() {
  try {
    // Load responsive layout dependencies
    await Promise.all([
      import('./core/DeviceManager.js'),
      import('./core/DesktopEnhancementManager.js'),
      import('./core/ResponsiveLayoutManager.js')
    ]);
    
    // Initialize responsive layout manager
    if (window.ResponsiveLayoutManager) {
      window.responsiveLayoutManager = new window.ResponsiveLayoutManager();
      console.log('[App] Responsive layout system initialized');
    }
  } catch (error) {
    console.error('[App] Failed to initialize responsive layout system:', error);
  }
}

// ---------- 17) Initialize Quick Actions and Accessibility ----------
async function initQuickActions() {
  try {
    const QuickActionsIntegration = await import('./core/QuickActionsIntegration.js');
    window.quickActionsIntegration = new (QuickActionsIntegration.default || QuickActionsIntegration)();
    console.log('[App] Quick actions and accessibility initialized');
  } catch (error) {
    console.error('[App] Failed to initialize quick actions:', error);
  }
}

// ---------- 18) Initialize Dashboard Module ----------
async function initializeDashboard() {
  try {
    if (!window.dashboardModule) {
      const DashboardModule = await import('./core/modules/DashboardModule.js');
      window.dashboardModule = new (DashboardModule.default || DashboardModule)();
    }
  } catch (error) {
    console.error('[App] Failed to initialize dashboard:', error);
  }
}

// ---------- 19) Initialize Reports Module ----------
async function initializeReportsModule() {
  try {
    if (!window.reportsModule) {
      // Load required dependencies first
      await Promise.all([
        import('./core/ExportManager.js'),
        import('./core/ReportTemplateManager.js')
      ]);
      
      const ReportsModule = await import('./core/modules/ReportsModule.js');
      window.reportsModule = new (ReportsModule.default || ReportsModule)();
      await window.reportsModule.init();
    }
  } catch (error) {
    console.error('[App] Failed to initialize reports module:', error);
  }
}

// ---------- 20) Initialize Final Optimization Manager ----------
async function initializeFinalOptimizations() {
  try {
    // Load final optimization CSS
    await loadCSS('css/final-optimizations.css');
    
    // Initialize final optimization manager
    const FinalOptimizationManager = await import('./core/FinalOptimizationManager.js');
    window.finalOptimizationManager = new (FinalOptimizationManager.default || FinalOptimizationManager)();
    
    console.log('[App] Final optimizations initialized');
  } catch (error) {
    console.error('[App] Failed to initialize final optimizations:', error);
  }
}

// ---------- 15) DOM ready initialization ----------
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCritical);
} else {
  initCritical();
}

// ---------- 16) Export critical functions for modules ----------
window.POS = window.POS || {};
window.POS.critical = {
  $,
  toast,
  loading,
  routeTo: window.routeTo,
  resetPurchase,
  resetSale,
  resetMenuForm,
  resetReportForm,
  refreshLowStock,
  enableOfflineMode,
  disableOfflineMode,
  syncOfflineData,
  // Responsive layout utilities
  getResponsiveLayoutManager: () => window.responsiveLayoutManager,
  getCurrentBreakpoint: () => window.responsiveLayoutManager?.getCurrentBreakpoint() || 'unknown',
  isMobile: () => window.responsiveLayoutManager?.isMobile() || false,
  isTablet: () => window.responsiveLayoutManager?.isTablet() || false,
  isDesktop: () => window.responsiveLayoutManager?.isDesktop() || false
};