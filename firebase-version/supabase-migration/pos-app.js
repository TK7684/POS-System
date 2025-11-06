/**
 * POS Application Main JavaScript
 * Handles authentication, UI interactions, and Firebase operations
 *
 * Logging System:
 * - log(): General operation logging
 * - logAuth(): Authentication events
 * - logDB(): Database operations
 * - logUI(): UI interactions
 * - logError(): Error tracking
 * - logPerformance(): Performance metrics
 */

// Enhanced Logging System
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    this.currentLevel = LogLevel.DEBUG;
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs
  }

  log(level, category, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: Object.keys(LogLevel)[level],
      category,
      message,
      data: data ? JSON.stringify(data, null, 2) : null,
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const formattedMessage = `[${timestamp}] [${logEntry.level}] [${category}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || "");
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || "");
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || "");
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data || "");
        break;
    }

    // Store logs in localStorage for debugging
    try {
      localStorage.setItem("pos_logs", JSON.stringify(this.logs.slice(-100)));
    } catch (e) {
      console.warn("Failed to save logs to localStorage:", e);
    }
  }

  debug(category, message, data) {
    this.log(LogLevel.DEBUG, category, message, data);
  }
  info(category, message, data) {
    this.log(LogLevel.INFO, category, message, data);
  }
  warn(category, message, data) {
    this.log(LogLevel.WARN, category, message, data);
  }
  error(category, message, data) {
    this.log(LogLevel.ERROR, category, message, data);
  }

  // Specialized logging methods
  auth(message, data) {
    this.info("AUTH", message, data);
  }
  db(message, data) {
    this.info("DB", message, data);
  }
  ui(message, data) {
    this.debug("UI", message, data);
  }
  performance(message, data) {
    this.info("PERF", message, data);
  }
  error(category, message, error) {
    this.log(LogLevel.ERROR, category, message, {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
  }

  getLogs(category = null, level = null) {
    let filtered = this.logs;
    if (category) {
      filtered = filtered.filter((log) => log.category === category);
    }
    if (level !== null) {
      filtered = filtered.filter((log) => LogLevel[log.level] === level);
    }
    return filtered;
  }

  exportLogs() {
    const exportData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.logs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pos-logs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const logger = new Logger();

// Performance monitoring
const perf = {
  start: (operation) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      logger.performance(operation, { duration: `${duration.toFixed(2)}ms` });
      return duration;
    };
  },
};

// Global state
let currentUser = null;
let menuData = [];
let ingredientData = [];

// Application state tracking
const appState = {
  initialized: false,
  firebaseConnected: false, // Keep name for compatibility but track Supabase
  supabaseConnected: false,
  currentView: "auth",
  activeModals: [],
  lastDataRefresh: null,
  operationQueue: [],
};

logger.info("APP", "POS Application starting...", {
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString(),
  url: window.location.href,
});

// ---------- Initialize Application ----------
async function initializeApp() {
  logger.info("APP", "Starting application initialization...");
  const initTimer = perf.start("app_initialization");

  try {
    // Wait for Supabase to be ready
    if (!window.supabaseLoaded) {
      await new Promise((resolve) => {
        if (window.supabaseLoaded) {
          resolve();
        } else {
          window.addEventListener('supabase-loaded', resolve, { once: true });
          // Timeout after 5 seconds
          setTimeout(resolve, 5000);
        }
      });
    }

    // Wait for POS to be ready
    if (!window.POS || !window.POS.auth) {
      await new Promise((resolve) => {
        if (window.POS && window.POS.auth) {
          resolve();
        } else {
          window.addEventListener('pos-ready', resolve, { once: true });
          // Timeout after 5 seconds
          setTimeout(resolve, 5000);
        }
      });
    }

    // Initialize UI elements
    logger.ui("Initializing event listeners...");
    initializeEventListeners();

    // Check Supabase connection (wait a bit for it to be fully ready)
    logger.db("Checking Supabase connection...");
    setTimeout(() => {
      checkSupabaseConnection();
    }, 1000);

    // Set up auth state listener
    if (window.POS && window.POS.auth) {
      logger.auth("Setting up auth state listener...");
      window.POS.auth.onAuthStateChanged(handleAuthStateChange);
      
      // Check current auth state immediately
      const currentUser = await window.POS.auth.getCurrentUser();
      handleAuthStateChange(currentUser);
    } else {
      logger.error(
        "APP",
        "POS auth not available",
        new Error("Authentication system not loaded"),
      );
      showError("Authentication system not loaded");
      // Still show auth screen
      showAuthScreen();
    }

    appState.initialized = true;
    initTimer();
    logger.info("APP", "Application initialization completed successfully");
  } catch (error) {
    logger.error("APP", "Application initialization failed", error);
    initTimer();
    // Show auth screen on error
    showAuthScreen();
  }
}

// Handle OAuth callback redirect mismatch
// If we're on localhost:3000 but should be on Cloudflare Pages, redirect back
function handleOAuthRedirectMismatch() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  // If we have an OAuth code but we're on localhost:3000
  // This means Supabase redirected to the wrong URL
  if (code && window.location.hostname === 'localhost' && window.location.port === '3000') {
    // Check if we have a stored target URL (from when we initiated OAuth)
    const targetUrl = sessionStorage.getItem('oauth_target_url');
    
    if (targetUrl && targetUrl !== window.location.href) {
      console.log('🔄 Detected OAuth redirect mismatch. Redirecting to:', targetUrl);
      console.log('⚠️ IMPORTANT: Make sure your Cloudflare Pages URL in Supabase includes https:// prefix!');
      // Redirect to the correct URL with the code
      window.location.href = targetUrl + '?code=' + code;
      return true;
    } else {
      // Try to detect Cloudflare Pages URL from referrer or other sources
      const possibleUrls = [
        'https://pos-admin-bho.pages.dev',
        'https://' + document.referrer?.match(/https?:\/\/([^\/]+)/)?.[1] || '',
      ].filter(url => url && url.includes('pages.dev'));
      
      if (possibleUrls.length > 0) {
        const redirectUrl = possibleUrls[0] + '?code=' + code;
        console.log('🔄 Attempting automatic redirect to:', redirectUrl);
        window.location.href = redirectUrl;
        return true;
      }
      
      // Show error message if we can't redirect
      console.error('❌ OAuth redirect mismatch detected!');
      console.error('You were redirected to localhost:3000 but should be on Cloudflare Pages.');
      console.error('');
      console.error('⚠️ IMPORTANT: Your redirect URLs in Supabase must include https:// prefix!');
      console.error('');
      console.error('Please update Supabase Dashboard:');
      console.error('1. Go to: https://supabase.com/dashboard');
      console.error('2. Select project: rtfreafhlelpxqwohspq');
      console.error('3. Go to: Authentication → URL Configuration');
      console.error('4. Update your redirect URLs to include https:// prefix:');
      console.error('   ❌ WRONG: pos-admin-bho.pages.dev');
      console.error('   ✅ CORRECT: https://pos-admin-bho.pages.dev');
      console.error('   ❌ WRONG: pos-admin-bho.pages.dev/*');
      console.error('   ✅ CORRECT: https://pos-admin-bho.pages.dev/*');
      console.error('5. Click Save and wait 1-2 minutes');
      
      // Show user-friendly error
      alert('OAuth Redirect Error!\n\nYou were redirected to localhost:3000.\n\n⚠️ IMPORTANT: Your redirect URLs in Supabase must include "https://" prefix!\n\nCurrent (WRONG):\n- pos-admin-bho.pages.dev\n\nShould be (CORRECT):\n- https://pos-admin-bho.pages.dev\n- https://pos-admin-bho.pages.dev/*\n\nPlease update in Supabase Dashboard → Authentication → URL Configuration');
    }
  }
  
  return false;
}

// Check for redirect mismatch immediately
if (handleOAuthRedirectMismatch()) {
  // Redirect is happening, don't continue initialization
} else {
  // Start initialization when DOM is ready
  document.addEventListener("DOMContentLoaded", initializeApp);
}

// ---------- Supabase Connection Status ----------
function checkSupabaseConnection() {
  const statusEl = document.getElementById("supabase-status");
  const connTimer = perf.start("supabase_connection_test");

  logger.db("Starting Supabase connection test...");

  if (!window.supabase) {
    logger.error(
      "DB",
      "Supabase not initialized",
      new Error("window.supabase is undefined"),
    );
    if (statusEl) {
      statusEl.textContent = "🔴 Supabase not initialized";
      statusEl.className = "supabase-status disconnected";
    }
    appState.firebaseConnected = false;
    // Retry after a short delay
    setTimeout(() => {
      if (window.supabase) {
        checkSupabaseConnection();
      }
    }, 2000);
    return;
  }

  // Test connection with a simple query
  window.supabase
    .from("platforms")
    .select("count")
    .limit(1)
    .then(({ data, error }) => {
      const duration = connTimer();
      if (error) {
        logger.error("DB", "Supabase connection failed", error);
        if (statusEl) {
          statusEl.textContent = "🔴 Connection error";
          statusEl.className = "supabase-status disconnected";
        }
        appState.firebaseConnected = false;
      } else {
        logger.db("Supabase connection successful", {
          duration: `${duration.toFixed(2)}ms`,
        });
        if (statusEl) {
          statusEl.textContent = `🟢 Connected (${duration.toFixed(0)}ms)`;
          statusEl.className = "supabase-status connected";
        }
        appState.firebaseConnected = true;
      }
    })
    .catch((error) => {
      const duration = connTimer();
      logger.error("DB", "Supabase connection failed", error);
      if (statusEl) {
        statusEl.textContent = "🔴 Connection error";
        statusEl.className = "supabase-status disconnected";
      }
      appState.firebaseConnected = false;
    });
}

// ---------- Event Listeners ----------
function initializeEventListeners() {
  logger.ui("Setting up event listeners...");

  // Google Sign-In button
  const googleBtn = document.getElementById("google-signin-btn");
  if (googleBtn) {
    logger.ui("Adding Google Sign-In button listener");
    googleBtn.addEventListener("click", signInWithGoogle);
  } else {
    logger.warn("UI", "Google Sign-In button not found");
  }

  // Email/Password login form
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    logger.ui("Adding login form listener");
    loginForm.addEventListener("submit", handleEmailLogin);
  } else {
    logger.warn("UI", "Login form not found");
  }

  // Sale form
  const saleForm = document.getElementById("sale-form");
  if (saleForm) {
    logger.ui("Adding sale form listener");
    saleForm.addEventListener("submit", handleSaleSubmit);
  } else {
    logger.warn("UI", "Sale form not found");
  }

  // Purchase form
  const purchaseForm = document.getElementById("purchase-form");
  if (purchaseForm) {
    logger.ui("Adding purchase form listener");
    purchaseForm.addEventListener("submit", handlePurchaseSubmit);
  } else {
    logger.warn("UI", "Purchase form not found");
  }

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "l") {
      logger.ui("Export logs shortcut triggered");
      logger.exportLogs();
    }
  });

  logger.info("UI", "Event listeners setup completed");
}

// ---------- Authentication ----------
function handleAuthStateChange(user) {
  const authTimer = perf.start("auth_state_change");

  currentUser = user;

  if (user) {
    // User is signed in
    // Supabase user object structure differs from Firebase
    const displayName = user.user_metadata?.display_name || 
                        user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split("@")[0] || 
                        "User";
    
    logger.auth("User signed in successfully", {
      uid: user.id, // Supabase uses 'id' instead of 'uid'
      email: user.email,
      displayName: displayName,
      emailVerified: !!user.email_confirmed_at, // Supabase uses email_confirmed_at
      lastSignInTime: user.last_sign_in_at || user.updated_at,
      creationTime: user.created_at,
    });

    // Clean up OAuth callback URL parameters
    if (window.location.search.includes('code=') || window.location.search.includes('access_token=')) {
      // Remove OAuth callback parameters from URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      logger.auth("Cleaned OAuth callback URL");
      
      // Clear stored OAuth target URL
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('oauth_target_url');
      }
    }

    appState.currentView = "main";
    showMainApp();
    loadInitialData();
    updateUserInfo(user);
  } else {
    // User is signed out
    logger.auth("User signed out");
    appState.currentView = "auth";
    showAuthScreen();
  }

  authTimer();
}

async function signInWithGoogle() {
  const googleTimer = perf.start("google_signin");
  const btn = document.getElementById("google-signin-btn");
  
  if (!btn) {
    logger.error("AUTH", "Google sign-in button not found");
    showError("Google sign-in button not found. Please refresh the page.");
    return;
  }

  const originalText = btn.innerHTML;

  try {
    logger.auth("Starting Google sign-in process");

    // Show loading state
    btn.innerHTML =
      '<div class="spinner" style="width:20px;height:20px;border:2px solid #ccc;border-top-color:#0891b2;border-radius:50%;animation:spin 1s linear infinite;display:inline-block;margin-right:8px;"></div> Signing in...';
    btn.disabled = true;

    // Wait for Supabase to be ready (with retries)
    let retries = 0;
    while (!window.supabase && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }
    
    if (!window.supabase) {
      throw new Error("Supabase not initialized. Please wait a moment and try again.");
    }

    // Check if POS auth is available
    if (!window.POS || !window.POS.auth) {
      // Try to initialize if not available
      if (window.supabase && !window.POS) {
        // POS should be initialized in supabase-config.js
        logger.warn("AUTH", "POS not initialized, waiting...");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!window.POS || !window.POS.auth) {
        throw new Error("Authentication system not ready. Please refresh the page.");
      }
    }

    logger.auth("Calling Supabase Google sign-in...");
    const result = await window.POS.auth.signInWithGoogle();

    googleTimer();
    logger.auth("Google sign-in initiated", {
      redirecting: result.redirecting,
      note: "OAuth redirect in progress - user will be redirected and returned automatically",
    });

    // OAuth redirects immediately, so show a message
    btn.innerHTML = '🔄 Redirecting to Google...';
    
    // The auth state change listener will handle the actual sign-in when user returns
  } catch (error) {
    googleTimer();
    logger.error("AUTH", "Google sign-in failed", error);
    
    // Show error message
    const errorDiv = document.getElementById("login-error");
    if (errorDiv) {
      errorDiv.textContent = "Google sign-in failed: " + error.message;
      errorDiv.classList.remove("hidden");
    } else {
      alert("Google sign-in failed: " + error.message);
    }

    // Restore button
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function handleEmailLogin(event) {
  event.preventDefault();
  const loginTimer = perf.start("email_login");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const errorDiv = document.getElementById("login-error");
  const btnText = document.getElementById("login-btn-text");
  const spinner = document.getElementById("login-spinner");

  logger.auth("Starting email login", { email });

  // Show loading state
  btnText.classList.add("hidden");
  spinner.classList.remove("hidden");
  submitBtn.disabled = true;
  errorDiv.classList.add("hidden");

  try {
    if (!window.POS || !window.POS.auth) {
      throw new Error("Authentication not available");
    }

    logger.auth("Calling Supabase email login...");
    await window.POS.auth.signIn(email, password);

    loginTimer();
    logger.auth("Email login successful", { email });
  } catch (error) {
    loginTimer();
    logger.error("AUTH", "Email login failed", error);
    errorDiv.textContent = "Login failed: " + error.message;
    errorDiv.classList.remove("hidden");

    // Restore button
    btnText.classList.remove("hidden");
    spinner.classList.add("hidden");
    submitBtn.disabled = false;
  }
}

async function logout() {
  const logoutTimer = perf.start("logout");

  try {
    logger.auth("Starting logout process");

    if (window.POS && window.POS.auth) {
      await window.POS.auth.signOut();
      logoutTimer();
      logger.auth("Logout successful");
    } else {
      logger.warn("AUTH", "Logout attempted but auth not available");
    }
  } catch (error) {
    logoutTimer();
    logger.error("AUTH", "Logout failed", error);
    showError("Logout failed: " + error.message);
  }
}

// ---------- UI Management ----------
function showAuthScreen() {
  logger.ui("Showing authentication screen");
  appState.currentView = "auth";
  
  const authScreen = document.getElementById("auth-screen");
  const posApp = document.getElementById("pos-app");
  
  if (authScreen) {
    authScreen.classList.remove("hidden");
    authScreen.style.display = "block";
  }
  
  if (posApp) {
    posApp.classList.add("hidden");
    posApp.style.display = "none";
  }
  
  // Hide navigation menus on login page
  const topBar = document.getElementById("app-topbar");
  const bottomNav = document.getElementById("app-bottomnav");
  if (topBar) {
    topBar.style.display = "none";
  }
  if (bottomNav) {
    bottomNav.style.display = "none";
  }
  
  // Ensure all menu sections are also hidden
  const menusPage = document.getElementById("menus-page");
  const expensesHistoryPage = document.getElementById("expenses-history-page");
  if (menusPage) {
    menusPage.classList.add("hidden");
    menusPage.style.display = "none";
  }
  if (expensesHistoryPage) {
    expensesHistoryPage.classList.add("hidden");
    expensesHistoryPage.style.display = "none";
  }
  
  logger.ui("Auth screen displayed", { 
    authVisible: !authScreen?.classList.contains("hidden"),
    posHidden: posApp?.classList.contains("hidden")
  });
}

function showMainApp() {
  logger.ui("Showing main POS application");
  appState.currentView = "main";
  
  const authScreen = document.getElementById("auth-screen");
  const posApp = document.getElementById("pos-app");
  
  if (authScreen) {
    authScreen.classList.add("hidden");
    authScreen.style.display = "none";
  }
  
  if (posApp) {
    posApp.classList.remove("hidden");
    posApp.style.display = "block";
    // Ensure menu buttons are visible
    loadInitialData();
  }
  
  // Show navigation menus when logged in
  const topBar = document.getElementById("app-topbar");
  const bottomNav = document.getElementById("app-bottomnav");
  if (topBar) {
    topBar.style.display = "block";
  }
  if (bottomNav) {
    bottomNav.style.display = "block";
  }
  
  // Hide any other pages
  const menusPage = document.getElementById("menus-page");
  const expensesHistoryPage = document.getElementById("expenses-history-page");
  if (menusPage) {
    menusPage.classList.add("hidden");
    menusPage.style.display = "none";
  }
  if (expensesHistoryPage) {
    expensesHistoryPage.classList.add("hidden");
    expensesHistoryPage.style.display = "none";
  }
  
  logger.ui("Main app displayed", { 
    authHidden: authScreen?.classList.contains("hidden"),
    posVisible: !posApp?.classList.contains("hidden")
  });
}

function updateUserInfo(user) {
  logger.ui("Updating user info display", { email: user.email });
  const userEmailEl = document.getElementById("user-email");
  if (userEmailEl) {
    userEmailEl.textContent = user.email;
  } else {
    logger.warn("UI", "User email element not found");
  }
}

// ---------- Data Loading ----------
let isLoadingData = false; // Guard to prevent multiple simultaneous calls
async function loadInitialData() {
  // Prevent multiple simultaneous calls
  if (isLoadingData) {
    logger.warn("DB", "loadInitialData already in progress, skipping duplicate call");
    return;
  }
  
  isLoadingData = true;
  const dataLoadTimer = perf.start("initial_data_load");
  logger.db("Starting initial data load...");

  try {
    // Load menus for sale dropdown
    logger.db("Loading menus...");
    await loadMenus();

    // Load ingredients for purchase dropdown
    logger.db("Loading ingredients...");
    await loadIngredients();

    // Check if data exists, if not create seed data
    if (menuData.length === 0 || ingredientData.length === 0) {
      logger.warn("DB", "No data found, creating seed data...", {
        menuCount: menuData.length,
        ingredientCount: ingredientData.length,
      });
      await createSeedData();
      // Reload after seeding
      logger.db("Reloading data after seeding...");
      await loadMenus();
      await loadIngredients();
    }

    // Set up real-time listeners
    logger.db("Setting up real-time listeners...");
    setupRealtimeListeners();

    appState.lastDataRefresh = new Date();
    dataLoadTimer();
    logger.db("Initial data load completed successfully", {
      menuCount: menuData.length,
      ingredientCount: ingredientData.length,
      loadTime: dataLoadTimer(),
    });
  } catch (error) {
    dataLoadTimer();
    logger.error("DB", "Error loading initial data", error);
    showError("Failed to load data: " + error.message);

    // Fallback to demo data if Supabase fails
    logger.warn("DB", "Falling back to demo data");
    loadDemoData();
  }
}

async function loadMenus() {
  const menuTimer = perf.start("load_menus");
  logger.db("Loading menus from database...");

  try {
    const snapshot = await window.POS.database.menus.get();
    menuData = [];

    const selectEl = document.getElementById("sale-menu");
    if (!selectEl) {
      logger.warn("UI", "Sale menu select element not found");
      return;
    }

    selectEl.innerHTML = '<option value="">เลือกเมนู...</option>';

    snapshot.forEach((doc) => {
      const menu = { id: doc.id, ...doc.data() };
      menuData.push(menu);
      logger.debug("DB", "Loaded menu item", menu);

      const option = document.createElement("option");
      option.value = menu.id;
      option.textContent = `${menu.name} - ฿${menu.price}`;
      selectEl.appendChild(option);
    });

    // Add price input listener
    selectEl.addEventListener("change", function () {
      const selectedMenu = menuData.find((m) => m.id === this.value);
      if (selectedMenu) {
        document.getElementById("sale-price").value = selectedMenu.price;
        logger.ui("Menu selected", {
          menuId: selectedMenu.id,
          menuName: selectedMenu.name,
          price: selectedMenu.price,
        });
      }
    });

    menuTimer();
    logger.db("Menus loaded successfully", {
      count: menuData.length,
      loadTime: menuTimer(),
    });
  } catch (error) {
    menuTimer();
    logger.error("DB", "Error loading menus", error);
  }
}

async function loadIngredients() {
  const ingredientTimer = perf.start("load_ingredients");
  logger.db("Loading ingredients from database...");

  try {
    const snapshot = await window.POS.database.ingredients.get();
    ingredientData = [];

    const selectEl = document.getElementById("purchase-ingredient");
    if (!selectEl) {
      logger.warn("UI", "Purchase ingredient select element not found");
      return;
    }

    selectEl.innerHTML = '<option value="">เลือกวัตถุดิบ...</option>';

    snapshot.forEach((doc) => {
      const ingredient = { id: doc.id, ...doc.data() };
      ingredientData.push(ingredient);
      logger.debug("DB", "Loaded ingredient", ingredient);

      const option = document.createElement("option");
      option.value = ingredient.id;
      option.textContent = `${ingredient.name} (${ingredient.unit})`;
      selectEl.appendChild(option);
    });

    ingredientTimer();
    logger.db("Ingredients loaded successfully", {
      count: ingredientData.length,
      loadTime: ingredientTimer(),
    });
  } catch (error) {
    ingredientTimer();
    logger.error("DB", "Error loading ingredients", error);
  }
}

function setupRealtimeListeners() {
  logger.db("Setting up real-time listeners");
  const listenerTimer = perf.start("setup_listeners");

  // Listen for low stock items
  logger.db("Setting up low stock listener");
  window.POS.database.subscribeToLowStock((snapshot) => {
    const lowStockTimer = perf.start("low_stock_update");
    logger.debug("DB", "Low stock snapshot received", {
      empty: snapshot.empty,
      docCount: snapshot.docs ? snapshot.docs.length : 0,
    });

    const lowStockList = document.getElementById("low-stock-list");
    if (!lowStockList) {
      logger.warn("UI", "Low stock list element not found");
      return;
    }

    if (snapshot.empty) {
      lowStockList.innerHTML =
        '<p class="text-gray-500">ไม่มีวัตถุดิบใกล้หมด</p>';
      logger.debug("DB", "No low stock items to display");
      lowStockTimer();
      return;
    }

    let html = "";
    let lowStockCount = 0;
    snapshot.forEach((doc) => {
      const item = doc.data();
      lowStockCount++;
      logger.debug("DB", "Low stock item", item);
      html += `
                <div class="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span>${item.name}</span>
                    <span class="text-sm text-red-600">${item.current_stock} ${item.unit || ""}</span>
                </div>
            `;
    });

    lowStockList.innerHTML = html;
    lowStockTimer();
    logger.debug("DB", "Low stock UI updated", { count: lowStockCount });
  });

  // Listen for recent transactions
  logger.db("Setting up recent transactions listener");
  window.POS.database.subscribeToPurchases((snapshot) => {
    const transTimer = perf.start("transactions_update");
    logger.debug("DB", "Transactions snapshot received", {
      empty: snapshot.empty,
      docCount: snapshot.docs ? snapshot.docs.length : 0,
    });

    const transactionsList = document.getElementById("recent-transactions");
    if (!transactionsList) {
      logger.warn("UI", "Recent transactions list element not found");
      return;
    }

    if (snapshot.empty) {
      transactionsList.innerHTML =
        '<p class="text-gray-500">ไม่มีธุรกรรมล่าสุด</p>';
      logger.debug("DB", "No recent transactions to display");
      transTimer();
      return;
    }

    let html = "";
    let transCount = 0;
    snapshot.forEach((doc) => {
      const transaction = doc.data();
      transCount++;
      logger.debug("DB", "Transaction item", transaction);
      const type = transaction.type || "purchase";
      const icon = type === "sale" ? "🛒" : "📦";

      // Show ingredient name for purchases, menu name for sales
      const displayName = transaction.type === "sale" 
        ? (transaction.menu_name || "Unknown Menu")
        : (transaction.item_name || "Unknown Ingredient");
      
      html += `
                <div class="flex justify-between items-center p-2 border-b">
                    <span>${icon} ${displayName}</span>
                    <span class="text-sm">฿${transaction.total_amount || 0}</span>
                </div>
            `;
    });

    transactionsList.innerHTML = html;
    transTimer();
    logger.debug("DB", "Transactions UI updated", { count: transCount });
  });

  listenerTimer();
  logger.db("Real-time listeners setup completed", {
    setupTime: listenerTimer(),
  });
}

// ---------- Form Handlers ----------
async function handleSaleSubmit(event) {
  event.preventDefault();

  const menuId = document.getElementById("sale-menu").value;
  const platform = document.getElementById("sale-platform").value;
  const qty = parseInt(document.getElementById("sale-qty").value);
  const price = parseFloat(document.getElementById("sale-price").value);

  if (!menuId) {
    showError("กรุณาเลือกเมนู");
    return;
  }

  try {
    const selectedMenu = menuData.find((m) => m.id === menuId);

    const saleData = {
      menu_id: menuId,
      menu_name: selectedMenu.name,
      platform: platform,
      quantity: qty,
      unit_price: price,
      total_amount: price * qty,
      type: "sale",
      date: new Date().toISOString(),
    };

    const result = await window.POS.functions.processSale(saleData);

    if (result.success) {
      showToast("บันทึกการขายสำเร็จ");
      closeSaleModal();
      document.getElementById("sale-form").reset();
    } else {
      showError("บันทึกการขายล้มเหลว: " + result.error);
    }
  } catch (error) {
    console.error("Sale error:", error);
    showError("บันทึกการขายล้มเหลว: " + error.message);
  }
}

async function handlePurchaseSubmit(event) {
  event.preventDefault();

  const ingredientId = document.getElementById("purchase-ingredient").value;
  const qty = parseFloat(document.getElementById("purchase-qty").value);
  const price = parseFloat(document.getElementById("purchase-price").value);
  const unit = document.getElementById("purchase-unit").value;

  if (!ingredientId) {
    showError("กรุณาเลือกวัตถุดิบ");
    return;
  }

  try {
    const selectedIngredient = ingredientData.find(
      (i) => i.id === ingredientId,
    );

    const purchaseData = {
      ingredient_id: ingredientId,
      ingredient_name: selectedIngredient.name,
      quantity: qty,
      unit: unit || selectedIngredient.unit,
      total_amount: price,
      type: "purchase",
      date: new Date().toISOString(),
    };

    const result = await window.POS.functions.processPurchase(purchaseData);

    if (result.success) {
      showToast("บันทึกการซื้อสำเร็จ");
      
      // Refresh ingredients and low stock list after successful purchase
      await loadIngredients();
      
      // Manually refresh low stock list (trigger real-time update)
      if (window._refreshLowStock) {
        await window._refreshLowStock();
      }
      
      // Manually refresh transactions list to show the new purchase
      if (window._refreshTransactions) {
        await window._refreshTransactions();
      }
      
      closePurchaseModal();
      document.getElementById("purchase-form").reset();
    } else {
      showError("บันทึกการซื้อล้มเหลว: " + result.error);
    }
  } catch (error) {
    console.error("Purchase error:", error);
    showError("บันทึกการซื้อล้มเหลว: " + error.message);
  }
}

// ---------- Modal Functions ----------
function openSaleModal() {
  document.getElementById("sale-modal").classList.remove("hidden");
}

function closeSaleModal() {
  document.getElementById("sale-modal").classList.add("hidden");
}

function openPurchaseModal() {
  document.getElementById("purchase-modal").classList.remove("hidden");
}

function closePurchaseModal() {
  document.getElementById("purchase-modal").classList.add("hidden");
}

function showReports() {
  showToast("รายงานกำลังพัฒนา");
}

// ---------- Utility Functions ----------
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("opacity-0");
  toast.classList.add("opacity-100");

  setTimeout(() => {
    toast.classList.remove("opacity-100");
    toast.classList.add("opacity-0");
  }, 3000);
}

function showError(message) {
  // Show as toast for now, could enhance to show in specific error containers
  showToast("❌ " + message);
  console.error(message);
}

// ---------- Google Sheets Integration ----------
class GoogleSheetsAPI {
  constructor() {
    this.apiKey = null;
    this.clientId = null;
    this.spreadsheetId = null;
    this.isAuthenticated = false;
    this.gapiInited = false;
    this.gisInited = false;
  }

  async initialize() {
    logger.info("SHEETS", "Initializing Google Sheets API...");

    // Load Google APIs
    await this.loadGAPI();
    await this.loadGIS();

    logger.info("SHEETS", "Google Sheets API initialized");
  }

  async loadGAPI() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        gapi.load("client:auth2", () => {
          gapi.client
            .init({
              apiKey: this.apiKey,
              clientId: this.clientId,
              discoveryDocs: [
                "https://sheets.googleapis.com/$discovery/rest?version=v4",
              ],
              scope: "https://www.googleapis.com/auth/spreadsheets",
            })
            .then(() => {
              this.gapiInited = true;
              logger.info("SHEETS", "GAPI initialized");
              resolve();
            }, reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async loadGIS() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/platform.js";
      script.onload = () => {
        gapi.load("auth2", () => {
          this.gisInited = true;
          logger.info("SHEETS", "GIS initialized");
          resolve();
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async authenticate() {
    if (!this.gapiInited || !this.gisInited) {
      throw new Error("Google APIs not initialized");
    }

    try {
      const GoogleAuth = gapi.auth2.getAuthInstance();
      const user = await GoogleAuth.signIn();
      this.isAuthenticated = true;
      logger.auth("Google Sheets authenticated", {
        email: user.getBasicProfile().getEmail(),
      });
      return user;
    } catch (error) {
      logger.error("SHEETS", "Authentication failed", error);
      throw error;
    }
  }

  async readSheet(range = "Sheet1!A:Z") {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: range,
    });

    logger.db("Sheet data read", {
      range,
      rowCount: response.result.values ? response.result.values.length : 0,
    });

    return response.result.values;
  }

  async writeSheet(range, values) {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const response = await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: range,
      valueInputOption: "USER_ENTERED",
      resource: { values },
    });

    logger.db("Sheet data written", {
      range,
      valueCount: values.length,
    });

    return response.result;
  }

  async appendSheet(range, values) {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const response = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: range,
      valueInputOption: "USER_ENTERED",
      resource: { values },
    });

    logger.db("Sheet data appended", {
      range,
      valueCount: values.length,
    });

    return response.result;
  }
}

// ---------- Line Bot Integration ----------
class LineBotIntegration {
  constructor() {
    this.channelAccessToken = null;
    this.webhookUrl = null;
    this.userId = null;
    this.groupId = null;
  }

  async initialize() {
    logger.info("LINE", "Initializing Line Bot integration...");

    // Set up webhook listener
    this.setupWebhook();

    // Start polling for messages from Supabase
    if (window.supabase) {
      this.startPolling();
    }

    logger.info("LINE", "Line Bot integration initialized");
  }

  setupWebhook() {
    // This would typically be handled by a backend service
    // For frontend demonstration, we'll simulate the functionality
    logger.info("LINE", "Webhook listener setup completed");
  }

  async processMessage(message, source, imageUrl = null) {
    const processTimer = perf.start("process_line_message");
    logger.info("LINE", "Processing Line message", { message, source, imageUrl });

    try {
      // Check for confirmation responses first
      if (this.isConfirmationResponse(message)) {
        await this.handleConfirmationResponse(message);
        return;
      }

      // Check message type and process accordingly
      if (this.isPurchaseSlip(message) || imageUrl) {
        await this.processSlipPurchase(message, imageUrl);
      } else if (this.isSaleMessage(message)) {
        await this.processSaleMessage(message);
      } else if (this.isIngredientPurchase(message)) {
        await this.processIngredientPurchase(message, imageUrl);
      } else if (this.isPurchaseText(message)) {
        await this.processTextPurchase(message);
      } else if (this.isExpenseMessage(message)) {
        await this.processExpenseMessage(message);
      }

      processTimer();
      logger.info("LINE", "Message processed successfully");
    } catch (error) {
      processTimer();
      logger.error("LINE", "Error processing message", error);

      // Send error message back
      await this.replyMessage("เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่");
    }
  }

  isConfirmationResponse(message) {
    const text = message.toLowerCase().trim();
    return text === "ยืนยัน" || 
           text === "confirm" || 
           text === "ใช่" ||
           text === "แก้ไข" ||
           text === "edit" ||
           text === "ไม่ใช่" ||
           text === "no";
  }

  async handleConfirmationResponse(message) {
    const text = message.toLowerCase().trim();
    const isConfirm = text === "ยืนยัน" || text === "confirm" || text === "ใช่";

    // Find the most recent pending confirmation
    if (!this.pendingConfirmations || Object.keys(this.pendingConfirmations).length === 0) {
      await this.replyMessage("ไม่พบข้อมูลที่ต้องการยืนยัน");
      return;
    }

    const confirmationIds = Object.keys(this.pendingConfirmations);
    const latestId = confirmationIds.sort().reverse()[0]; // Most recent
    const pending = this.pendingConfirmations[latestId];

    if (isConfirm) {
      // Confirm and save
      try {
        if (pending.type === "purchase") {
          await this.saveIngredientPurchases(pending.data);
          await this.learnFromTransaction(pending.data);
          await this.replyMessage(
            `✅ ยืนยันและบันทึกเรียบร้อย\n` +
            `${this.formatPurchaseSummary(pending.data)}`
          );
        } else if (pending.type === "sale") {
          await this.saveSale(pending.data);
          await this.replyMessage(
            `✅ ยืนยันและบันทึกการขายเรียบร้อย\n` +
            `💰 ฿${pending.data.totalAmount}`
          );
        }
        
        delete this.pendingConfirmations[latestId];
      } catch (error) {
        logger.error("LINE", "Error confirming transaction", error);
        await this.replyMessage("เกิดข้อผิดพลาดในการบันทึก");
      }
    } else {
      // Cancel or edit
      delete this.pendingConfirmations[latestId];
      await this.replyMessage("❌ ยกเลิกการบันทึก กรุณาระบุข้อมูลใหม่");
    }
  }

  isPurchaseSlip(message) {
    const slipKeywords = ["slip", "สลิป", "โอนเงิน", "transfer", "รูปสลิป"];
    return slipKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  isPurchaseText(message) {
    const purchaseKeywords = [
      "ซื้อ",
      "จัดซื้อ",
      "ซื้อวัตถุดิบ",
      "จัดหา",
      "สั่ง",
    ];
    return purchaseKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  isExpenseMessage(message) {
    const expenseKeywords = [
      "ค่าใช้จ่าย",
      "ค่า",
      "จ่าย",
      "ค่าไฟ",
      "ค่าน้ำ",
      "ค่าเช่า",
      "ค่าแรง",
      "ค่าโทร",
      "ค่าเน็ต",
      "expense",
      "paid",
      "จ่ายเงิน",
    ];
    const text = message.toLowerCase();
    return expenseKeywords.some((keyword) => text.includes(keyword.toLowerCase())) ||
           /ค่า[\s]*[ก-ฮ]+\s+\d+/.test(text) || // ค่าXXX จำนวน
           /\d+[\s]*บาท[\s]*(ค่า|จ่าย)/.test(text); // จำนวนบาท ค่า/จ่าย
  }

  isIngredientPurchase(message) {
    // Patterns like: "น้ำแข็ง 2 กระสอบ 110 บาท"
    const patterns = [
      /[ก-ฮ]+\s+\d+\s+[ก-ฮ]+/i, // Thai word + number + Thai word (unit)
      /\d+\s*[ก-ฮ]+\s+[ก-ฮ]+/i, // number + unit + ingredient
    ];
    const text = message.toLowerCase();
    // Check if it contains ingredient-like patterns and price
    return (patterns.some(p => p.test(text)) && 
            (/\d+[\s]*บาท/.test(text) || /\d+[\s]*฿/.test(text))) ||
           /[ก-ฮ]+\s*\d+[\s]*[ก-ฮ]*\s*\d+[\s]*(บาท|฿)/i.test(text);
  }

  isSaleMessage(message) {
    // Patterns indicating sales like "จ่ายสด", "ขาย", menu items
    const saleIndicators = [
      "จ่ายสด",
      "ขาย",
      "ข้าว",
      "สาหร่าย",
      "กุ้งแช่",
      "แซลมอน",
      "ชุด",
      "xL",
      "XL",
    ];
    const text = message.toLowerCase();
    return saleIndicators.some(indicator => text.includes(indicator)) ||
           /จ่าย[\s]*\d+[\s]*[+=\d\s]*\d+[\s]*บาท/.test(text); // "จ่ายสด 478+80 =558 บาท"
  }

  async processSlipPurchase(message) {
    logger.info("LINE", "Processing slip purchase");

    // Simulate slip parsing
    const purchaseData = this.parseSlipData(message);

    if (purchaseData) {
      // Save to Google Sheets
      await this.savePurchaseToSheet(purchaseData);

      // Update Firebase
      await this.updateSupabasePurchase(purchaseData);

      // Send confirmation
      await this.sendPurchaseConfirmation(purchaseData);
    } else {
      await this.replyMessage(
        "ไม่สามารถอ่านข้อมูลจากรูปภาพได้ กรุณาแน่ใจว่าภาพชัดเจน",
      );
    }
  }

  async processTextPurchase(message) {
    logger.info("LINE", "Processing text purchase");

    // Parse text purchase
    const purchaseData = this.parseTextPurchase(message);

    if (purchaseData) {
      // Save to Google Sheets
      await this.savePurchaseToSheet(purchaseData);

      // Update Firebase
      await this.updateSupabasePurchase(purchaseData);

      // Send confirmation
      await this.sendPurchaseConfirmation(purchaseData);
    } else {
      await this.replyMessage(
        "ไม่สามารถอ่านข้อมูลการซื้อได้ กรุณาระบุข้อมูลให้ชัดเจน",
      );
    }
  }

  parseSlipData(message) {
    // Simulate slip data parsing
    logger.debug("LINE", "Parsing slip data");

    return {
      type: "slip",
      amount: Math.floor(Math.random() * 5000) + 500,
      vendor: "ทดสอบร้านค้า",
      date: new Date().toISOString(),
      items: ["วัตถุดิบทดสอบ"],
      slipImage: message,
    };
  }

  parseTextPurchase(message) {
    // Simulate text parsing
    logger.debug("LINE", "Parsing text purchase");

    return {
      type: "text",
      amount: Math.floor(Math.random() * 2000) + 200,
      vendor: "ทดสอบร้านค้า",
      date: new Date().toISOString(),
      items: ["วัตถุดิบทดสอบ"],
      originalMessage: message,
    };
  }

  async savePurchaseToSheet(purchaseData) {
    const sheetsTimer = perf.start("save_to_sheets");
    logger.info("SHEETS", "Saving purchase to Google Sheets", purchaseData);

    try {
      if (window.googleSheets && window.googleSheets.isAuthenticated) {
        const values = [
          [
            new Date().toLocaleString("th-TH"),
            purchaseData.vendor || "",
            purchaseData.amount || 0,
            purchaseData.items?.join(", ") || "",
            purchaseData.type || "",
            purchaseData.date || "",
          ],
        ];

        await window.googleSheets.appendSheet("Purchases!A:F", values);

        sheetsTimer();
        logger.db("Purchase saved to Google Sheets", purchaseData);
      } else {
        logger.warn("SHEETS", "Google Sheets not authenticated");
      }
    } catch (error) {
      sheetsTimer();
      logger.error("SHEETS", "Failed to save to Google Sheets", error);
    }
  }

  async updateSupabasePurchase(purchaseData) {
    const supabaseTimer = perf.start("update_supabase_purchase");
    logger.db("Updating Supabase with purchase data", purchaseData);

    try {
      const user = await window.POS.auth.getCurrentUser();
      if (window.supabase && user) {
        const purchaseDoc = {
          ...purchaseData,
          source: "line_bot",
          user_id: user.id,
          purchase_date: new Date().toISOString().split("T")[0],
          purchase_time: new Date().toTimeString().split(" ")[0],
          status: "pending_review",
        };

        await window.supabase.from("purchases").insert([purchaseDoc]);

        supabaseTimer();
        logger.db("Purchase saved to Supabase", purchaseDoc);
      } else {
        logger.warn("DB", "Supabase not available or user not authenticated");
      }
    } catch (error) {
      supabaseTimer();
      logger.error("DB", "Failed to save to Supabase", error);
    }
  }

  async sendPurchaseConfirmation(purchaseData) {
    const confirmTimer = perf.start("send_confirmation");
    logger.info("LINE", "Sending purchase confirmation");

    try {
      const message =
        `✅ บันทึกข้อมูลการซื้อเรียบร้อย\n` +
        `📋 ร้าน: ${purchaseData.vendor}\n` +
        `💰 จำนวน: ฿${purchaseData.amount}\n` +
        `📦 รายการ: ${purchaseData.items?.join(", ")}\n` +
        `🕐 เวลา: ${new Date().toLocaleString("th-TH")}`;

      await this.replyMessage(message);

      confirmTimer();
      logger.info("LINE", "Confirmation sent", { message });
    } catch (error) {
      confirmTimer();
      logger.error("LINE", "Failed to send confirmation", error);
    }
  }

  async replyMessage(message, replyToken = null) {
    logger.info("LINE", "Reply message prepared", { message, replyToken });
    
    // If we have a reply token, send via LINE API
    if (replyToken && this.channelAccessToken) {
      try {
        const response = await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.channelAccessToken}`,
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [{
              type: 'text',
              text: message,
            }],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error("LINE", "Failed to send LINE reply", { status: response.status, error: errorText });
          showToast(`Line Bot: ${message}`);
        } else {
          logger.info("LINE", "Reply sent successfully");
        }
      } catch (error) {
        logger.error("LINE", "Error sending LINE reply", error);
        showToast(`Line Bot: ${message}`);
      }
    } else {
      // Fallback: show toast
      showToast(`Line Bot: ${message}`);
    }
  }

  // Send push message to LINE group
  async sendPushMessage(groupId, message) {
    if (!this.channelAccessToken || !groupId) {
      logger.warn("LINE", "Cannot send push message - missing token or group ID");
      return;
    }

    try {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: groupId,
          messages: [{
            type: 'text',
            text: message,
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("LINE", "Failed to send push message", { status: response.status, error: errorText });
      } else {
        logger.info("LINE", "Push message sent successfully");
      }
    } catch (error) {
      logger.error("LINE", "Error sending push message", error);
    }
  }

  // Expense processing methods
  async processExpenseMessage(message) {
    logger.info("LINE", "Processing expense message", { message });

    try {
      // Parse expense data from message
      const expenseData = this.parseExpenseText(message);

      if (!expenseData) {
        await this.replyMessage("ไม่สามารถอ่านข้อมูลค่าใช้จ่ายได้ กรุณาระบุข้อมูลให้ชัดเจน เช่น: ค่าไฟ 500 บาท");
        return;
      }

      // Compare with database and update if needed
      const result = await this.compareAndUpdateExpense(expenseData);

      if (result.action === "created") {
        await this.replyMessage(
          `✅ บันทึกค่าใช้จ่ายใหม่\n` +
          `📋 ${expenseData.description}\n` +
          `💰 ฿${expenseData.amount}\n` +
          `📅 ${expenseData.date || "วันนี้"}`
        );
      } else if (result.action === "updated") {
        await this.replyMessage(
          `🔄 อัปเดตค่าใช้จ่าย\n` +
          `📋 ${expenseData.description}\n` +
          `💰 ฿${expenseData.amount} (เดิม: ฿${result.oldAmount})\n` +
          `📅 ${expenseData.date || "วันนี้"}`
        );
      } else if (result.action === "duplicate") {
        await this.replyMessage(
          `ℹ️ พบค่าใช้จ่ายที่คล้ายกันอยู่แล้ว\n` +
          `📋 ${result.existing.description}\n` +
          `💰 ฿${result.existing.amount}\n` +
          `📅 ${result.existing.expense_date}`
        );
      }
    } catch (error) {
      logger.error("LINE", "Error processing expense", error);
      await this.replyMessage("เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย");
    }
  }

  parseExpenseText(message) {
    logger.debug("LINE", "Parsing expense text", { message });

    const text = message.trim();
    
    // Extract amount (various patterns)
    const amountPatterns = [
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*฿/,
      /฿\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      /ราคา[\s:]*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    ];

    let amount = null;
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ""));
        if (amount > 0) break;
      }
    }

    if (!amount || amount <= 0) {
      return null;
    }

    // Extract category
    let category = "other";
    let subcategory = null;
    const categoryMap = {
      "ค่าไฟ": { category: "utility", subcategory: "electric" },
      "ค่าไฟฟ้า": { category: "utility", subcategory: "electric" },
      "ค่าน้ำ": { category: "utility", subcategory: "water" },
      "ค่าเช่า": { category: "rental", subcategory: null },
      "ค่าแรง": { category: "labor", subcategory: null },
      "ค่าโทร": { category: "utility", subcategory: null },
      "ค่าเน็ต": { category: "utility", subcategory: null },
      "ค่าสาธารณูปโภค": { category: "utility", subcategory: null },
    };

    for (const [keyword, cat] of Object.entries(categoryMap)) {
      if (text.includes(keyword)) {
        category = cat.category;
        subcategory = cat.subcategory;
        break;
      }
    }

    // Extract description
    let description = text;
    // Remove amount from description
    description = description.replace(/\d+(?:,\d{3})*(?:\.\d{2})?\s*(บาท|฿)/g, "").trim();
    // Use first 100 characters
    description = description.substring(0, 100) || category;

    // Extract date (default to today)
    const today = new Date().toISOString().split("T")[0];
    let expenseDate = today;
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /วันนี้|today/i,
      /เมื่อวาน|yesterday/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[0].toLowerCase().includes("วันนี้") || match[0].toLowerCase().includes("today")) {
          expenseDate = today;
        } else if (match[0].toLowerCase().includes("เมื่อวาน") || match[0].toLowerCase().includes("yesterday")) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          expenseDate = yesterday.toISOString().split("T")[0];
        } else if (match[1] && match[2] && match[3]) {
          // Format: DD/MM/YYYY or YYYY-MM-DD
          if (pattern.source.includes("\\d{4}")) {
            expenseDate = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
          } else {
            expenseDate = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
          }
        }
        break;
      }
    }

    // Extract payment method
    let paymentMethod = "cash";
    if (text.includes("โอน") || text.includes("transfer")) {
      paymentMethod = "transfer";
    } else if (text.includes("บัตร") || text.includes("card")) {
      paymentMethod = "credit_card";
    }

    // Extract vendor
    let vendor = null;
    const vendorPatterns = [
      /ร้าน[\s]*([^\n]+)/i,
      /จาก[\s]*([^\n]+)/i,
      /ที่[\s]*([^\n]+)/i,
    ];

    for (const pattern of vendorPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        vendor = match[1].trim().substring(0, 100);
        break;
      }
    }

    return {
      category,
      subcategory,
      description,
      amount,
      expense_date: expenseDate,
      payment_method: paymentMethod,
      vendor,
      source: "line_bot",
      original_message: message,
    };
  }

  async compareAndUpdateExpense(expenseData) {
    logger.info("LINE", "Comparing expense with database", expenseData);

    try {
      if (!window.supabase || !window.POS) {
        throw new Error("Supabase not available");
      }

      // Look for similar expenses in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split("T")[0];

      const { data: recentExpenses, error } = await window.supabase
        .from("expenses")
        .select("*")
        .eq("category", expenseData.category)
        .gte("expense_date", startDate)
        .lte("expense_date", expenseData.expense_date)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        logger.error("LINE", "Error querying expenses", error);
        throw error;
      }

      // Check for similar expenses (same category, same date, similar amount)
      const similarExpenses = (recentExpenses || []).filter((exp) => {
        const sameDate = exp.expense_date === expenseData.expense_date;
        const sameCategory = exp.category === expenseData.category;
        const sameSubcategory = (exp.subcategory || null) === (expenseData.subcategory || null);
        const similarAmount = Math.abs(exp.amount - expenseData.amount) <= 10; // Within 10 baht
        
        // Check description similarity
        const descSimilarity = this.calculateSimilarity(
          (exp.description || "").toLowerCase(),
          (expenseData.description || "").toLowerCase()
        );

        return sameDate && sameCategory && sameSubcategory && similarAmount && descSimilarity > 0.5;
      });

      if (similarExpenses.length > 0) {
        // Found similar expense - check if should update
        const mostSimilar = similarExpenses[0];
        const amountDiff = Math.abs(mostSimilar.amount - expenseData.amount);
        
        // If amount is different by more than 1%, update it
        if (amountDiff > mostSimilar.amount * 0.01) {
          const { data: updated, error: updateError } = await window.supabase
            .from("expenses")
            .update({
              amount: expenseData.amount,
              description: expenseData.description,
              vendor: expenseData.vendor || mostSimilar.vendor,
              payment_method: expenseData.payment_method,
              updated_at: new Date().toISOString(),
            })
            .eq("id", mostSimilar.id)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          logger.info("LINE", "Expense updated", { old: mostSimilar, new: updated });
          return {
            action: "updated",
            expense: updated,
            oldAmount: mostSimilar.amount,
          };
        } else {
          // Very similar, treat as duplicate
          return {
            action: "duplicate",
            existing: mostSimilar,
          };
        }
      } else {
        // No similar expense found - create new
        const { data: { user } } = await window.supabase.auth.getUser();
        
        const newExpense = {
          user_id: user?.id,
          category: expenseData.category,
          subcategory: expenseData.subcategory,
          description: expenseData.description,
          amount: expenseData.amount,
          expense_date: expenseData.expense_date,
          payment_method: expenseData.payment_method,
          vendor: expenseData.vendor,
          notes: `บันทึกจาก Line Bot: ${expenseData.original_message}`,
          status: "approved",
        };

        const { data: created, error: createError } = await window.supabase
          .from("expenses")
          .insert([newExpense])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        logger.info("LINE", "Expense created", created);
        return {
          action: "created",
          expense: created,
        };
      }
    } catch (error) {
      logger.error("LINE", "Error comparing/updating expense", error);
      throw error;
    }
  }

  calculateSimilarity(str1, str2) {
    // Simple similarity calculation using common words
    const words1 = str1.split(/\s+/).filter(w => w.length > 2);
    const words2 = str2.split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(w => words2.includes(w));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // Levenshtein distance for fuzzy matching
  levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  // Find closest ingredient match using fuzzy matching and learning data
  async findClosestIngredient(searchName) {
    try {
      if (!window.POS || !window.POS.database) {
        return null;
      }

      // Check learning data for known mappings first
      const learningKey = "line_bot_learning";
      const learning = JSON.parse(localStorage.getItem(learningKey) || "{}");
      
      if (learning.ingredientMappings && learning.ingredientMappings[searchName]) {
        const mappedName = learning.ingredientMappings[searchName];
        logger.info("LINE", "Using learned mapping", { search: searchName, mapped: mappedName });
        searchName = mappedName; // Use the mapped name
      }

      // Get all ingredients
      const snapshot = await window.POS.database.ingredients.get();
      const ingredients = [];
      snapshot.forEach((doc) => {
        ingredients.push({ id: doc.id, name: doc.data().name });
      });

      if (ingredients.length === 0) return null;

      // Calculate similarity scores
      const scores = ingredients.map(ing => {
        const distance = this.levenshteinDistance(
          searchName.toLowerCase(),
          ing.name.toLowerCase()
        );
        const maxLen = Math.max(searchName.length, ing.name.length);
        const similarity = 1 - (distance / maxLen);
        return { ingredient: ing, similarity, distance };
      });

      // Sort by similarity (highest first)
      scores.sort((a, b) => b.similarity - a.similarity);

      // Return best match if similarity > 0.6 (60%)
      const bestMatch = scores[0];
      if (bestMatch && bestMatch.similarity > 0.6) {
        logger.info("LINE", "Fuzzy matched ingredient", {
          search: searchName,
          found: bestMatch.ingredient.name,
          similarity: bestMatch.similarity,
        });
        return bestMatch.ingredient;
      }

      return null;
    } catch (error) {
      logger.error("LINE", "Error finding ingredient", error);
      return null;
    }
  }

  // Parse ingredient purchase message
  async parseIngredientPurchase(message, imageUrl = null) {
    logger.debug("LINE", "Parsing ingredient purchase", { message, imageUrl });

    const text = message.trim();
    const items = [];
    const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);

    // Pattern 1: "น้ำแข็ง 2 กระสอบ 110 บาท" (single line)
    const pattern1 = /([ก-ฮ]+)\s+(\d+(?:\.\d+)?)\s+([ก-ฮ]+)\s+(\d+(?:\.\d+)?)\s*บาท/i;
    
    // Pattern 2: Multi-line format
    // "น้ำแข็ง 2 กระสอบ\n110 บาท"
    if (lines.length >= 2) {
      // Check if first line is ingredient and second is price
      const line1 = lines[0];
      const line2 = lines[1];
      
      const ingredientPattern = /([ก-ฮ]+)\s+(\d+(?:\.\d+)?)\s+([ก-ฮ]+)/i;
      const pricePattern = /(\d+(?:\.\d+)?)\s*บาท/i;
      
      const ingMatch = line1.match(ingredientPattern);
      const priceMatch = line2.match(pricePattern);
      
      if (ingMatch && priceMatch) {
        const ingredientName = ingMatch[1].trim();
        const quantity = parseFloat(ingMatch[2]);
        const unit = ingMatch[3].trim();
        const price = parseFloat(priceMatch[1]);
        
        const matchedIngredient = await this.findClosestIngredient(ingredientName);
        
        items.push({
          ingredientName: matchedIngredient?.name || ingredientName,
          ingredientId: matchedIngredient?.id || null,
          quantity,
          unit,
          price,
          confidence: matchedIngredient ? 0.9 : 0.7,
          originalText: `${line1} ${line2}`,
        });
      }
    }

    // Pattern 3: Single line "น้ำแข็ง 2 กระสอบ 110 บาท"
    let match1 = text.match(pattern1);
    if (match1 && items.length === 0) {
      const ingredientName = match1[1].trim();
      const quantity = parseFloat(match1[2]);
      const unit = match1[3].trim();
      const price = parseFloat(match1[4]);
      
      const matchedIngredient = await this.findClosestIngredient(ingredientName);
      
      items.push({
        ingredientName: matchedIngredient?.name || ingredientName,
        ingredientId: matchedIngredient?.id || null,
        quantity,
        unit,
        price,
        confidence: matchedIngredient ? 0.9 : 0.7,
        originalText: match1[0],
      });
    }

    // Pattern 4: Multiple items with total price or missing prices
    // "หอมเจีย 1 โล + ค่าส่ง" (missing price, need to extract from image)
    if (items.length === 0) {
      const pattern2 = /([ก-ฮ]+)\s+(\d+(?:\.\d+)?)\s+([ก-ฮ]+)/gi;
      const matches2 = [...text.matchAll(pattern2)];
      
      if (matches2.length > 0) {
        // Try to extract prices from image if available
        let prices = [];
        if (imageUrl) {
          prices = await this.extractPricesFromImage(imageUrl);
        }
        
        // Also try to find prices in the message text
        const pricePattern = /(\d+(?:\.\d+)?)\s*บาท/g;
        const priceMatches = [...text.matchAll(pricePattern)];
        const textPrices = priceMatches.map(m => parseFloat(m[1]));
        
        // Combine prices from image and text
        prices = prices.length > 0 ? prices : textPrices;
        
        // Use for...of loop instead of forEach to properly handle await
        for (let index = 0; index < matches2.length; index++) {
          const match = matches2[index];
          const ingredientName = match[1].trim();
          const quantity = parseFloat(match[2]);
          const unit = match[3].trim();
          const price = prices[index] || null;
          
          const matchedIngredient = await this.findClosestIngredient(ingredientName);
          
          items.push({
            ingredientName: matchedIngredient?.name || ingredientName,
            ingredientId: matchedIngredient?.id || null,
            quantity,
            unit,
            price,
            confidence: price ? (matchedIngredient ? 0.8 : 0.6) : 0.5,
            originalText: match[0],
            needsConfirmation: !price || !matchedIngredient,
          });
        }
      }
    }

    // Extract total price if available
    const totalPattern = /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/i;
    const totalMatch = text.match(totalPattern);
    const totalPrice = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, "")) : null;

    return {
      items,
      totalPrice,
      vendor: this.extractVendor(text),
      date: this.extractDate(text),
      originalMessage: message,
      imageUrl,
      confidence: items.length > 0 ? Math.min(...items.map(i => i.confidence)) : 0,
    };
  }

  // Extract prices from image/slip (simplified - would need OCR in production)
  async extractPricesFromImage(imageUrl) {
    // Placeholder for OCR integration
    // In production, this would call an OCR service
    logger.info("LINE", "Extracting prices from image", { imageUrl });
    
    // For now, return empty array - would need actual OCR service
    // This could integrate with Google Cloud Vision API, Tesseract, etc.
    return [];
  }

  // Process ingredient purchase
  async processIngredientPurchase(message, imageUrl = null) {
    logger.info("LINE", "Processing ingredient purchase", { message, imageUrl });

    try {
      const purchaseData = await this.parseIngredientPurchase(message, imageUrl);

      if (!purchaseData || purchaseData.items.length === 0) {
        await this.replyMessage("ไม่สามารถอ่านข้อมูลการซื้อได้ กรุณาระบุข้อมูลให้ชัดเจน");
        return;
      }

      // Check if needs confirmation
      if (purchaseData.confidence < 0.7 || purchaseData.items.some(i => i.needsConfirmation)) {
        const confirmationId = this.requestConfirmation(purchaseData);
        await this.replyMessage(
          `❓ ต้องการยืนยันข้อมูล:\n` +
          `${this.formatPurchaseForConfirmation(purchaseData)}\n` +
          `พิมพ์ "ยืนยัน" หรือ "แก้ไข" เพื่อดำเนินการ`
        );
        return;
      }

      // Save purchase
      await this.saveIngredientPurchases(purchaseData);
      
      // Learn from this transaction
      await this.learnFromTransaction(purchaseData);

      await this.replyMessage(
        `✅ บันทึกการซื้อวัตถุดิบเรียบร้อย\n` +
        `${this.formatPurchaseSummary(purchaseData)}`
      );
    } catch (error) {
      logger.error("LINE", "Error processing ingredient purchase", error);
      await this.replyMessage("เกิดข้อผิดพลาดในการบันทึกการซื้อ");
    }
  }

  // Process sale message
  async processSaleMessage(message) {
    logger.info("LINE", "Processing sale message", { message });

    try {
      const saleData = this.parseSaleMessage(message);

      if (!saleData) {
        await this.replyMessage("ไม่สามารถอ่านข้อมูลการขายได้");
        return;
      }

      // Check if needs confirmation
      if (saleData.confidence < 0.7) {
        const confirmationId = this.requestConfirmation(saleData, "sale");
        await this.replyMessage(
          `❓ ต้องการยืนยันข้อมูลการขาย:\n` +
          `${this.formatSaleForConfirmation(saleData)}\n` +
          `พิมพ์ "ยืนยัน" หรือ "แก้ไข" เพื่อดำเนินการ`
        );
        return;
      }

      // Save sale
      await this.saveSale(saleData);

      await this.replyMessage(
        `✅ บันทึกการขายเรียบร้อย\n` +
        `💰 ฿${saleData.totalAmount}\n` +
        `📋 ${saleData.items.length} รายการ`
      );
    } catch (error) {
      logger.error("LINE", "Error processing sale", error);
      await this.replyMessage("เกิดข้อผิดพลาดในการบันทึกการขาย");
    }
  }

  // Parse sale message
  parseSaleMessage(message) {
    const text = message.trim();
    
    // Pattern: "จ่ายสด 478+80 =558 บาท ข้าว2 สาหร่าย1 กุ้งแช่ 12-13 ตัว 1 ชุด แซลมอนดอง xL 150 กรัม"
    const totalMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/i);
    const totalAmount = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, "")) : null;

    // Extract menu items
    const items = [];
    
    // Match menu patterns
    const menuPatterns = [
      /(ข้าว)\s*(\d+)/i,
      /(สาหร่าย)\s*(\d+)/i,
      /(กุ้งแช่)\s*(\d+)[-]?(\d+)?\s*(ตัว|ชุด)/i,
      /(แซลมอนดอง)\s*(xL|XL)\s*(\d+)\s*(กรัม)/i,
    ];

    menuPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        const menuName = match[1];
        const quantity = parseFloat(match[2] || match[3] || 1);
        items.push({ menuName, quantity });
      }
    });

    return {
      items,
      totalAmount,
      paymentMethod: "cash",
      date: new Date().toISOString().split("T")[0],
      confidence: totalAmount && items.length > 0 ? 0.8 : 0.5,
      originalMessage: message,
    };
  }

  // Request confirmation for uncertain data
  requestConfirmation(data, type = "purchase") {
    const confirmationId = `confirm_${Date.now()}`;
    
    // Store pending confirmation
    if (!this.pendingConfirmations) {
      this.pendingConfirmations = {};
    }
    
    this.pendingConfirmations[confirmationId] = {
      data,
      type,
      timestamp: new Date().toISOString(),
    };

    // Auto-expire after 5 minutes
    setTimeout(() => {
      delete this.pendingConfirmations[confirmationId];
    }, 5 * 60 * 1000);

    return confirmationId;
  }

  // Format purchase for confirmation
  formatPurchaseForConfirmation(purchaseData) {
    return purchaseData.items.map(item => 
      `- ${item.ingredientName} ${item.quantity} ${item.unit} ${item.price ? `฿${item.price}` : '(ราคาไม่ระบุ)'}`
    ).join("\n") + 
    (purchaseData.totalPrice ? `\n💰 รวม: ฿${purchaseData.totalPrice}` : "");
  }

  // Format sale for confirmation
  formatSaleForConfirmation(saleData) {
    return saleData.items.map(item => 
      `- ${item.menuName} x${item.quantity}`
    ).join("\n") + 
    `\n💰 รวม: ฿${saleData.totalAmount}`;
  }

  // Save ingredient purchases
  async saveIngredientPurchases(purchaseData) {
    try {
      for (const item of purchaseData.items) {
        if (!item.ingredientId) {
          // Try to find ingredient again
          const found = await this.findClosestIngredient(item.ingredientName);
          if (found) item.ingredientId = found.id;
        }

        if (item.ingredientId && item.price) {
          await window.POS.functions.processPurchase({
            ingredient_id: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit,
            total_amount: item.price,
            vendor: purchaseData.vendor || "Unknown",
          });
        }
      }
    } catch (error) {
      logger.error("LINE", "Error saving purchases", error);
      throw error;
    }
  }

  // Save sale
  async saveSale(saleData) {
    try {
      // Find menu IDs
      for (const item of saleData.items) {
        const { data: menus } = await window.supabase
          .from("menus")
          .select("id, price")
          .ilike("name", `%${item.menuName}%`)
          .limit(1);

        if (menus && menus.length > 0) {
          const menu = menus[0];
          await window.POS.functions.processSale({
            menu_id: menu.id,
            quantity: item.quantity,
            unit_price: menu.price,
            platform: "ร้าน",
          });
        }
      }
    } catch (error) {
      logger.error("LINE", "Error saving sale", error);
      throw error;
    }
  }

  // Learn from transaction to improve future parsing
  async learnFromTransaction(transactionData) {
    try {
      // Store learning data in local storage or database
      const learningKey = "line_bot_learning";
      let learning = JSON.parse(localStorage.getItem(learningKey) || "{}");

      // Update ingredient name mappings
      transactionData.items.forEach(item => {
        if (item.ingredientId && item.originalText) {
          const originalName = item.originalText.match(/[ก-ฮ]+/)?.[0];
          if (originalName && originalName !== item.ingredientName) {
            if (!learning.ingredientMappings) learning.ingredientMappings = {};
            learning.ingredientMappings[originalName] = item.ingredientName;
          }
        }
      });

      // Update pattern recognition
      if (!learning.patterns) learning.patterns = [];
      learning.patterns.push({
        message: transactionData.originalMessage,
        parsed: transactionData,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 100 patterns
      if (learning.patterns.length > 100) {
        learning.patterns = learning.patterns.slice(-100);
      }

      localStorage.setItem(learningKey, JSON.stringify(learning));
      logger.info("LINE", "Learned from transaction", learning);
    } catch (error) {
      logger.error("LINE", "Error learning from transaction", error);
    }
  }

  // Helper methods
  extractVendor(text) {
    const vendorPatterns = [
      /ร้าน[\s]*([^\n]+)/i,
      /จาก[\s]*([^\n]+)/i,
      /ที่[\s]*([^\n]+)/i,
    ];
    for (const pattern of vendorPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 100);
      }
    }
    return null;
  }

  extractDate(text) {
    const today = new Date().toISOString().split("T")[0];
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
    ];
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[2] && match[3]) {
        if (pattern.source.includes("\\d{4}")) {
          return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
        } else {
          return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
        }
      }
    }
    return today;
  }

  formatPurchaseSummary(purchaseData) {
    return purchaseData.items.map(item => 
      `📦 ${item.ingredientName} ${item.quantity} ${item.unit} ฿${item.price || 0}`
    ).join("\n") + 
    (purchaseData.totalPrice ? `\n💰 รวม: ฿${purchaseData.totalPrice}` : "");
  }

  // Poll for new LINE messages from Supabase and check for unrecorded expenses
  async pollLineMessages() {
    try {
      if (!window.supabase) return;

      // Get unprocessed messages
      const { data: messages, error } = await window.supabase
        .from('line_messages')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        logger.error('LINE', 'Error fetching LINE messages', error);
        return;
      }

      // Process each message
      for (const msg of messages || []) {
        try {
          const messageText = msg.message_text || '';
          
          // Check if it's an expense message and not already recorded
          if (this.isExpenseMessage(messageText)) {
            const expenseRecorded = await this.checkIfExpenseRecorded(messageText);
            if (!expenseRecorded) {
              // Process and record the expense
              await this.processExpenseMessage(messageText);
            }
          } else {
            // Process other types of messages
            await this.processMessage(
              messageText,
              msg.source_type || 'user',
              msg.image_url || null
            );
          }

          // Mark as processed
          await window.supabase
            .from('line_messages')
            .update({ 
              processed: true,
              processed_at: new Date().toISOString()
            })
            .eq('id', msg.id);
        } catch (processError) {
          logger.error('LINE', 'Error processing message', processError);
          // Mark as processed even on error to avoid infinite loop
          await window.supabase
            .from('line_messages')
            .update({ 
              processed: true,
              processed_at: new Date().toISOString()
            })
            .eq('id', msg.id);
        }
      }
    } catch (error) {
      logger.error('LINE', 'Error polling LINE messages', error);
    }
  }

  // Check if expense is already recorded in database
  async checkIfExpenseRecorded(messageText) {
    try {
      const expenseData = this.parseExpenseText(messageText);
      if (!expenseData || !expenseData.amount) {
        return false;
      }

      // Check recent expenses (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const { data: expenses, error } = await window.supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('expense_date', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('LINE', 'Error checking expenses', error);
        return false;
      }

      // Check for duplicates
      const duplicate = this.findDuplicateInExpenses(expenseData, expenses || []);
      return !!duplicate;
    } catch (error) {
      logger.error('LINE', 'Error checking if expense recorded', error);
      return false;
    }
  }

  // Find duplicate in expenses list
  findDuplicateInExpenses(newExpense, existingExpenses) {
    if (!existingExpenses || existingExpenses.length === 0) {
      return null;
    }

    const amountTolerance = 10; // Within 10 baht
    const similarityThreshold = 0.7; // 70% similarity

    for (const existing of existingExpenses) {
      // Check amount similarity
      const amountDiff = Math.abs(parseFloat(existing.amount) - newExpense.amount);
      if (amountDiff > amountTolerance) {
        continue;
      }

      // Check description similarity
      const similarity = this.calculateSimilarity(
        (newExpense.description || '').toLowerCase(),
        (existing.description || '').toLowerCase()
      );

      if (similarity >= similarityThreshold) {
        // Check date similarity (within 3 days)
        const existingDate = new Date(existing.expense_date);
        const newDate = newExpense.expense_date ? new Date(newExpense.expense_date) : new Date();
        const daysDiff = Math.abs((existingDate - newDate) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 3) {
          return existing;
        }
      }
    }

    return null;
  }

  // Start polling for messages
  startPolling() {
    // Poll every 5 seconds
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    
    this.pollInterval = setInterval(() => {
      this.pollLineMessages();
    }, 5000);

    // Also poll immediately
    this.pollLineMessages();
    
    logger.info("LINE", "Started polling for messages");
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    logger.info("LINE", "Stopped polling for messages");
  }
}

// ---------- Initialize Integrations ----------
window.googleSheets = new GoogleSheetsAPI();
window.lineBot = new LineBotIntegration();

// ---------- Integration Initialization Functions ----------
async function initializeGoogleSheets() {
  const sheetsTimer = perf.start("google_sheets_init");
  logger.info("SHEETS", "Starting Google Sheets initialization...");

  try {
    // Configuration - these should be set in your Firebase Console or environment
    window.googleSheets.apiKey = "YOUR_API_KEY_HERE"; // Replace with your API key
    window.googleSheets.clientId = "YOUR_CLIENT_ID_HERE"; // Replace with your client ID
    window.googleSheets.spreadsheetId =
      "1qb5_R0JhLINnU7KL3q7hFpGWT0m7OCU1sBMZ8hdUs14"; // Your Google Sheet ID

    await window.googleSheets.initialize();

    // Test connection
    const testData = await window.googleSheets.readSheet("Purchases!A1:Z1");

    sheetsTimer();
    logger.info("SHEETS", "Google Sheets initialized successfully", {
      connected: true,
      testRow: testData ? testData[0] : null,
    });

    showToast("📊 Google Sheets connected successfully");
    return true;
  } catch (error) {
    sheetsTimer();
    logger.error("SHEETS", "Google Sheets initialization failed", error);
    showToast("❌ Google Sheets connection failed: " + error.message);
    return false;
  }
}

async function initializeLineBot() {
  const lineTimer = perf.start("line_bot_init");
  logger.info("LINE", "Starting Line Bot initialization...");

  try {
    // Get configuration from config/integrations.js or use defaults
    const config = window.LINE_BOT_CONFIG || {};
    
    window.lineBot.channelAccessToken = config.CHANNEL_ACCESS_TOKEN || 
      process.env?.LINE_CHANNEL_ACCESS_TOKEN || 
      "YOUR_LINE_CHANNEL_ACCESS_TOKEN";
    
    window.lineBot.channelSecret = config.CHANNEL_SECRET || 
      process.env?.LINE_CHANNEL_SECRET || 
      "YOUR_LINE_CHANNEL_SECRET";
    
    window.lineBot.webhookUrl = config.WEBHOOK_URL || 
      process.env?.LINE_WEBHOOK_URL || 
      "YOUR_WEBHOOK_URL";
    
    window.lineBot.groupId = (config.GROUP_IDS && config.GROUP_IDS[0]) || 
      process.env?.LINE_GROUP_ID || 
      "YOUR_LINE_GROUP_ID";

    await window.lineBot.initialize();

    lineTimer();
    logger.info("LINE", "Line Bot initialized successfully", {
      connected: true,
      webhookConfigured: !!window.lineBot.webhookUrl && window.lineBot.webhookUrl !== "YOUR_WEBHOOK_URL",
      hasToken: !!window.lineBot.channelAccessToken && window.lineBot.channelAccessToken !== "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
    });

    if (window.lineBot.webhookUrl === "YOUR_WEBHOOK_URL") {
      showToast("⚠️ Line Bot: Please configure webhook URL in config/integrations.js");
    } else if (window.lineBot.channelAccessToken === "YOUR_LINE_CHANNEL_ACCESS_TOKEN") {
      showToast("⚠️ Line Bot: Please configure Channel Access Token");
    } else {
      showToast("💬 Line Bot initialized successfully");
    }
    
    return true;
  } catch (error) {
    lineTimer();
    logger.error("LINE", "Line Bot initialization failed", error);
    showToast("❌ Line Bot initialization failed: " + error.message);
    return false;
  }
}

// ---------- Enhanced Functions with Integrations ----------
async function enhancedSaleProcessing(saleData) {
  const saleTimer = perf.start("enhanced_sale_processing");
  logger.info("SALE", "Starting enhanced sale processing", saleData);

  try {
    // 1. Process normal sale
    const result = await window.POS.functions.processSale(saleData);

    if (result.success) {
      // 2. Update Google Sheets
      if (window.googleSheets?.isAuthenticated) {
        await updateSalesSheet(saleData);
      }

      // 3. Send Line notification (optional)
      if (window.lineBot?.groupId) {
        await sendSaleNotification(saleData);
      }

      saleTimer();
      logger.info("SALE", "Enhanced sale processing completed", {
        saleId: result.saleId,
        sheetsUpdated: window.googleSheets?.isAuthenticated,
        lineNotified: !!window.lineBot?.groupId,
      });
    }

    return result;
  } catch (error) {
    saleTimer();
    logger.error("SALE", "Enhanced sale processing failed", error);
    throw error;
  }
}

async function updateSalesSheet(saleData) {
  const updateTimer = perf.start("update_sales_sheet");
  logger.info("SHEETS", "Updating sales sheet", saleData);

  try {
    const values = [
      [
        new Date().toLocaleString("th-TH"),
        saleData.menu_name || "",
        saleData.platform || "",
        saleData.quantity || 0,
        saleData.unit_price || 0,
        saleData.total_amount || 0,
        saleData.user_email || "",
        saleData.status || "completed",
      ],
    ];

    await window.googleSheets.appendSheet("Sales!A:H", values);

    updateTimer();
    logger.db("Sales sheet updated successfully");
  } catch (error) {
    updateTimer();
    logger.error("SHEETS", "Failed to update sales sheet", error);
  }
}

async function sendSaleNotification(saleData) {
  const notifTimer = perf.start("send_sale_notification");
  logger.info("LINE", "Sending sale notification", saleData);

  try {
    const message =
      `🛒 การขายใหม่\n` +
      `📋 ${saleData.menu_name}\n` +
      `📍 ${saleData.platform}\n` +
      `💰 ฿${saleData.total_amount}\n` +
      `👤 ${saleData.user_email}\n` +
      `🕐 ${new Date().toLocaleString("th-TH")}`;

    await window.lineBot.replyMessage(message);

    notifTimer();
    logger.info("LINE", "Sale notification sent");
  } catch (error) {
    notifTimer();
    logger.error("LINE", "Failed to send sale notification", error);
  }
}

// ---------- AI Chatbot Functions ----------
function openAIChatbot() {
  const modal = document.getElementById("ai-chatbot-modal");
  if (modal) {
    modal.classList.remove("hidden");
    document.getElementById("chat-input")?.focus();
  }
}

function closeAIChatbot() {
  const modal = document.getElementById("ai-chatbot-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function addChatMessage(message, isUser = false) {
  const messagesContainer = document.getElementById("chat-messages");
  if (!messagesContainer) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`;
  
  if (isUser) {
    messageDiv.innerHTML = `
      <div class="flex-1 bg-teal-500 text-white p-3 rounded-lg shadow-sm">
        <p class="text-sm">${message}</p>
      </div>
      <div class="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-bold">
        คุณ
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold">
        AI
      </div>
      <div class="flex-1 bg-white p-3 rounded-lg shadow-sm">
        <p class="text-sm">${message}</p>
      </div>
    `;
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Helper function to calculate menu cost from ingredients
async function calculateMenuCostFromDB(menuId) {
  try {
    // Try using the RPC function first
    const cost = await window.POS.functions.calculateMenuCost(menuId);
    if (cost && cost > 0) return cost;
    
    // Fallback: calculate manually from menu_recipes and ingredients
    const { data: recipes, error } = await window.supabase
      .from("menu_recipes")
      .select(`
        quantity_per_serve,
        ingredient_id,
        ingredients:ingredient_id (
          cost_per_unit
        )
      `)
      .eq("menu_id", menuId);
    
    if (error || !recipes || recipes.length === 0) {
      return null;
    }
    
    let totalCost = 0;
    for (const recipe of recipes) {
      const quantity = parseFloat(recipe.quantity_per_serve) || 0;
      const costPerUnit = parseFloat(recipe.ingredients?.cost_per_unit) || 0;
      totalCost += quantity * costPerUnit;
    }
    
    return totalCost;
  } catch (error) {
    console.error("Error calculating menu cost:", error);
    return null;
  }
}

// Helper function to calculate profitable price
function calculateProfitablePrice(costPrice, platformFeePercent = 55) {
  // Platform fee: 50-60% (use 55% as default)
  // We want to maintain a profit margin after platform fees
  // Formula: sellingPrice = costPrice / (1 - platformFeePercent/100 - desiredProfitMargin/100)
  // For a 20% profit margin after platform fees:
  const desiredProfitMargin = 20; // 20% profit margin after all fees
  const totalDeductionPercent = platformFeePercent + desiredProfitMargin;
  
  if (totalDeductionPercent >= 100) {
    // Can't be profitable with such high fees
    return null;
  }
  
  const sellingPrice = costPrice / (1 - totalDeductionPercent / 100);
  
  // Calculate breakdown
  const platformFee = sellingPrice * (platformFeePercent / 100);
  const profit = sellingPrice * (desiredProfitMargin / 100);
  const netRevenue = sellingPrice - platformFee;
  const actualProfit = netRevenue - costPrice;
  const actualProfitMargin = (actualProfit / netRevenue) * 100;
  
  return {
    suggestedPrice: Math.ceil(sellingPrice),
    costPrice: costPrice,
    platformFee: platformFee,
    platformFeePercent: platformFeePercent,
    netRevenue: netRevenue,
    profit: actualProfit,
    profitMargin: actualProfitMargin,
    breakdown: {
      sellingPrice: sellingPrice,
      cost: costPrice,
      platformFee: platformFee,
      netAfterFee: netRevenue,
      profitAfterCost: actualProfit,
    }
  };
}

async function processAIMessage(userMessage) {
  const message = userMessage.toLowerCase().trim();
  
  // ========== MENU COST QUERIES ==========
  // Patterns: "ต้นทุนเมนู X", "ค่าใช้จ่ายเมนู X", "cost of menu X", "ราคาทุน X"
  // Also handle: "ต้นทุน A2", "ต้นทุน A2 คือเท่าไหร่"
  const costQueryPatterns = [
    /ต้นทุน(?:ของ)?\s*(?:เมนู)?\s*(.+?)(?:\s+(?:คือ|เท่าไหร่|คือเท่าไหร่|ราคา|cost|คืออะไร))?$/i,
    /ค่าใช้จ่าย(?:ของ)?\s*(?:เมนู)?\s*(.+?)(?:\s+(?:คือ|เท่าไหร่|คือเท่าไหร่|ราคา|cost|คืออะไร))?$/i,
    /ราคาทุน(?:ของ)?\s*(?:เมนู)?\s*(.+?)(?:\s+(?:คือ|เท่าไหร่|คือเท่าไหร่|ราคา|cost|คืออะไร))?$/i,
    /cost\s+(?:of\s+)?(.+?)(?:\s+(?:of|is|for))?$/i,
  ];
  
  for (const pattern of costQueryPatterns) {
    const match = message.match(pattern);
    if (match) {
      let menuName = match[1].trim();
      // Remove any trailing question words that might have been captured
      menuName = menuName.replace(/\s+(?:คือ|เท่าไหร่|คือเท่าไหร่|ราคา|cost|คืออะไร).*$/i, '').trim();
      
      // Try to find menu - prioritize exact menu_id match first (e.g., "A2", "B1", "SetC1")
      let menu = menuData.find(m => 
        m.menu_id && m.menu_id.toLowerCase() === menuName.toLowerCase()
      );
      
      // If no exact menu_id match, try partial menu_id match (for cases like "Set" matching "SetB1")
      if (!menu && menuName.length <= 10 && /^[A-Za-z0-9]+$/.test(menuName)) { // Menu IDs are usually alphanumeric and short
        menu = menuData.find(m => 
          m.menu_id && m.menu_id.toLowerCase().startsWith(menuName.toLowerCase())
        );
      }
      
      // If still no match, try name matching
      if (!menu) {
        menu = menuData.find(m => 
          m.name && (
            m.name.toLowerCase().includes(menuName) ||
            menuName.includes(m.name.toLowerCase())
          )
        );
      }
      
      if (!menu) {
        addChatMessage(`ไม่พบเมนู "${menuName}" ในระบบค่ะ`);
        return;
      }
      
      addChatMessage(`กำลังคำนวณต้นทุนเมนู "${menu.name}"...`);
      
      const costPrice = await calculateMenuCostFromDB(menu.id);
      
      if (costPrice === null) {
        addChatMessage(
          `⚠️ ไม่สามารถคำนวณต้นทุนได้\n` +
          `อาจเป็นเพราะยังไม่มีข้อมูลสูตร (menu_recipes) หรือราคาวัตถุดิบไม่ครบ\n\n` +
          `กรุณาตรวจสอบ:\n` +
          `1. มีสูตรเมนูในระบบหรือไม่\n` +
          `2. วัตถุดิบมีราคา (cost_per_unit) หรือไม่`
        );
        return;
      }
      
      const currentPrice = menu.price || 0;
      const profit = currentPrice - costPrice;
      const profitMargin = currentPrice > 0 ? (profit / currentPrice) * 100 : 0;
      
      // Calculate platform breakdowns
      const platforms = [
        { name: "ร้าน", fee: 0, icon: "🏪" },
        { name: "Grab", fee: 55, icon: "🚗" },
        { name: "FoodPanda", fee: 55, icon: "🐼" },
        { name: "Line Man", fee: 60, icon: "📱" },
      ];
      
      const platformResults = platforms.map(platform => {
        if (platform.fee === 0) {
          return {
            ...platform,
            sellingPrice: currentPrice,
            platformFee: 0,
            netRevenue: currentPrice,
            profit: profit,
            profitMargin: profitMargin,
            isProfitable: profit >= 0
          };
        } else {
          const platformFeeAmount = currentPrice * (platform.fee / 100);
          const netRevenue = currentPrice - platformFeeAmount;
          const platformProfit = netRevenue - costPrice;
          const platformProfitMargin = netRevenue > 0 ? (platformProfit / netRevenue) * 100 : 0;
          
          return {
            ...platform,
            sellingPrice: currentPrice,
            platformFee: platformFeeAmount,
            netRevenue: netRevenue,
            profit: platformProfit,
            profitMargin: platformProfitMargin,
            isProfitable: platformProfit >= 0
          };
        }
      });
      
      // Check if any platform is profitable
      const anyProfitable = platformResults.some(p => p.isProfitable);
      const hasLoss = !anyProfitable;
      
      // Build response with better UX
      let response = `<div style="margin-bottom: 12px;"><strong>📊 ต้นทุนเมนู "${menu.name}" (${menu.menu_id})</strong></div>\n\n`;
      
      // Summary box
      response += `<div style="background: ${hasLoss ? '#fee2e2' : '#dcfce7'}; padding: 12px; border-radius: 8px; margin-bottom: 16px;">\n`;
      response += `<div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${hasLoss ? '⚠️ ขาดทุน' : '✅ มีกำไร'}</div>\n`;
      response += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">`;
      response += `<span>💰 ราคาต้นทุน:</span> <strong>฿${costPrice.toFixed(2)}</strong></div>\n`;
      response += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">`;
      response += `<span>💵 ราคาขาย:</span> <strong>฿${currentPrice.toFixed(2)}</strong></div>\n`;
      response += `<div style="display: flex; justify-content: space-between;">`;
      response += `<span>${profit >= 0 ? '📈' : '📉'} กำไร (ร้าน):</span> `;
      response += `<strong style="color: ${profit >= 0 ? '#059669' : '#dc2626'};">฿${profit.toFixed(2)} (${profitMargin >= 0 ? '+' : ''}${profitMargin.toFixed(1)}%)</strong></div>\n`;
      response += `</div>\n\n`;
      
      // Warning if losing money
      if (hasLoss) {
        response += `<div style="background: #fef3c7; padding: 10px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #f59e0b;">\n`;
        response += `⚠️ <strong>คำเตือน:</strong> เมนูนี้ขาดทุนในทุกช่องทางขาย!\n`;
        response += `แนะนำให้เพิ่มราคาหรือลดต้นทุน\n`;
        response += `</div>\n\n`;
      }
      
      // Platform breakdown
      response += `<div style="margin-bottom: 8px;"><strong>📱 คำนวณตาม Platform:</strong></div>\n`;
      
      for (const result of platformResults) {
        const statusIcon = result.isProfitable ? '✅' : '❌';
        const profitColor = result.isProfitable ? '#059669' : '#dc2626';
        
        response += `<div style="background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid ${result.isProfitable ? '#10b981' : '#ef4444'};">\n`;
        response += `<div style="font-weight: bold; margin-bottom: 6px;">${result.icon} ${result.name}${result.fee > 0 ? ` (Fee ${result.fee}%)` : ''}</div>\n`;
        
        if (result.fee > 0) {
          response += `<div style="font-size: 13px; color: #6b7280; margin-bottom: 2px;">💵 ราคาขาย: ฿${result.sellingPrice.toFixed(2)}</div>\n`;
          response += `<div style="font-size: 13px; color: #6b7280; margin-bottom: 2px;">💸 Platform Fee: ฿${result.platformFee.toFixed(2)}</div>\n`;
          response += `<div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">💰 รับจริง: ฿${result.netRevenue.toFixed(2)}</div>\n`;
        }
        
        response += `<div style="display: flex; justify-content: space-between; font-weight: bold;">`;
        response += `<span>${statusIcon} กำไรสุทธิ:</span> `;
        response += `<span style="color: ${profitColor};">฿${result.profit.toFixed(2)} (${result.profitMargin >= 0 ? '+' : ''}${result.profitMargin.toFixed(1)}%)</span>`;
        response += `</div>\n`;
        response += `</div>\n`;
      }
      
      // Action suggestion
      if (hasLoss) {
        response += `\n<div style="background: #eff6ff; padding: 10px; border-radius: 6px; margin-top: 12px;">\n`;
        response += `💡 <strong>คำแนะนำ:</strong>\n`;
        response += `• เพิ่มราคาขายเป็นอย่างน้อย ฿${Math.ceil(costPrice * 1.3)} บาท (ร้าน)\n`;
        response += `• หรือลดต้นทุนวัตถุดิบ\n`;
        response += `• พิมพ์ "แนะนำราคา ${menu.menu_id}" เพื่อดูราคาที่แนะนำ\n`;
        response += `</div>\n`;
      }
      
      addChatMessage(response);
      return;
    }
  }
  
  // ========== PRICE SUGGESTION QUERIES ==========
  // Patterns: "แนะนำราคา X", "suggest price for X", "ควรขาย X เท่าไหร่", "ราคาที่ควรขาย X"
  const priceSuggestionPatterns = [
    /แนะนำราคา(?:สำหรับ|ของ)?\s*(?:เมนู)?\s*(.+?)(?:\s+บน\s+(.+))?$/i,
    /ควรขาย\s*(.+?)\s*(?:เท่าไหร่|ราคาเท่าไหร่)(?:\s+บน\s+(.+))?$/i,
    /ราคาที่ควรขาย\s*(.+?)(?:\s+บน\s+(.+))?$/i,
    /suggest\s+price\s+(?:for\s+)?(.+?)(?:\s+on\s+(.+))?$/i,
    /แนะนำราคา\s*(.+)/i,
  ];
  
  for (const pattern of priceSuggestionPatterns) {
    const match = message.match(pattern);
    if (match) {
      let menuName = match[1].trim();
      const platformName = match[2] ? match[2].trim().toLowerCase() : null;
      
      // Remove question words
      menuName = menuName.replace(/\s+(?:คือ|เท่าไหร่|คือเท่าไหร่).*$/i, '').trim();
      
      // Prioritize exact menu_id match
      let menu = menuData.find(m => 
        m.menu_id.toLowerCase() === menuName.toLowerCase()
      );
      
      if (!menu) {
        menu = menuData.find(m => 
          m.name.toLowerCase().includes(menuName) ||
          menuName.includes(m.name.toLowerCase())
        );
      }
      
      if (!menu) {
        addChatMessage(`ไม่พบเมนู "${menuName}" ในระบบค่ะ`);
        return;
      }
      
      addChatMessage(`กำลังคำนวณราคาที่แนะนำสำหรับ "${menu.name}"...`);
      
      const costPrice = await calculateMenuCostFromDB(menu.id);
      
      if (costPrice === null) {
        addChatMessage(
          `⚠️ ไม่สามารถคำนวณได้\n` +
          `กรุณาตรวจสอบว่ามีสูตรเมนูและราคาวัตถุดิบครบถ้วน`
        );
        return;
      }
      
      // Determine platform fee
      let platformFeePercent = 55; // Default for delivery platforms
      let platformNameDisplay = "Platform";
      
      if (platformName) {
        if (platformName.includes("grab")) {
          platformFeePercent = 55;
          platformNameDisplay = "Grab";
        } else if (platformName.includes("foodpanda") || platformName.includes("panda")) {
          platformFeePercent = 55;
          platformNameDisplay = "FoodPanda";
        } else if (platformName.includes("line") || platformName.includes("lineman")) {
          platformFeePercent = 60;
          platformNameDisplay = "Line Man";
        } else if (platformName.includes("ร้าน") || platformName.includes("store")) {
          platformFeePercent = 0;
          platformNameDisplay = "ร้าน";
        }
      }
      
      const suggestion = calculateProfitablePrice(costPrice, platformFeePercent);
      
      if (!suggestion) {
        addChatMessage(`❌ ไม่สามารถคำนวณราคาที่แนะนำได้ เนื่องจาก Platform Fee สูงเกินไป`);
        return;
      }
      
      let response = `💰 คำแนะนำราคาสำหรับ "${menu.name}"`;
      if (platformFeePercent > 0) {
        response += ` บน ${platformNameDisplay}`;
      }
      response += `:\n\n`;
      
      response += `📊 ราคาต้นทุน: ฿${suggestion.costPrice.toFixed(2)}\n`;
      response += `💡 ราคาที่แนะนำ: ฿${suggestion.suggestedPrice}\n\n`;
      
      if (platformFeePercent > 0) {
        response += `📱 Breakdown (${platformNameDisplay} Fee ${platformFeePercent}%):\n`;
        response += `   💵 ราคาขาย: ฿${suggestion.suggestedPrice}\n`;
        response += `   💸 Platform Fee (${platformFeePercent}%): ฿${suggestion.platformFee.toFixed(2)}\n`;
        response += `   💰 รับจริง: ฿${suggestion.netRevenue.toFixed(2)}\n`;
        response += `   ✅ กำไรสุทธิ: ฿${suggestion.profit.toFixed(2)} (${suggestion.profitMargin.toFixed(1)}%)\n\n`;
      } else {
        response += `💰 กำไร: ฿${(suggestion.suggestedPrice - costPrice).toFixed(2)}\n`;
        response += `📊 มาร์จิ้น: ${(((suggestion.suggestedPrice - costPrice) / suggestion.suggestedPrice) * 100).toFixed(1)}%\n\n`;
      }
      
      // Compare with current price
      const currentPrice = menu.price || 0;
      if (currentPrice > 0) {
        if (platformFeePercent > 0) {
          const currentPlatformFee = currentPrice * (platformFeePercent / 100);
          const currentNetRevenue = currentPrice - currentPlatformFee;
          const currentProfit = currentNetRevenue - costPrice;
          
          response += `📊 เปรียบเทียบกับราคาปัจจุบัน (฿${currentPrice}):\n`;
          response += `   💸 Platform Fee: ฿${currentPlatformFee.toFixed(2)}\n`;
          response += `   💰 รับจริง: ฿${currentNetRevenue.toFixed(2)}\n`;
          response += `   ${currentProfit >= 0 ? '✅' : '❌'} กำไร: ฿${currentProfit.toFixed(2)}\n`;
          
          if (currentProfit < 0) {
            response += `\n⚠️ ราคาปัจจุบันขาดทุนเมื่อขายบน ${platformNameDisplay}!`;
          } else if (currentProfit < suggestion.profit) {
            response += `\n💡 ราคาที่แนะนำจะได้กำไรมากกว่า ฿${(suggestion.profit - currentProfit).toFixed(2)}`;
          }
        } else {
          const currentProfit = currentPrice - costPrice;
          response += `📊 ราคาปัจจุบัน: ฿${currentPrice} → กำไร ฿${currentProfit.toFixed(2)}\n`;
          if (suggestion.suggestedPrice > currentPrice) {
            response += `💡 เพิ่มราคาเป็น ฿${suggestion.suggestedPrice} จะได้กำไรเพิ่มอีก ฿${(suggestion.suggestedPrice - currentPrice).toFixed(2)}`;
          }
        }
      }
      
      addChatMessage(response);
      return;
    }
  }
  
  // ========== PROFITABILITY CHECK ==========
  const profitabilityPatterns = [
    /(?:เมนู|menu)\s*(.+?)\s*(?:มีกำไร|กำไร|profit)/i,
    /(?:เมนู|menu)\s*(.+?)\s*(?:คุ้ม|คุ้มทุน|คุ้มค่า)/i,
    /is\s+(.+?)\s+profitable/i,
  ];
  
  for (const pattern of profitabilityPatterns) {
    const match = message.match(pattern);
    if (match) {
      let menuName = match[1].trim();
      // Remove question words
      menuName = menuName.replace(/\s+(?:คือ|เท่าไหร่|คือเท่าไหร่).*$/i, '').trim();
      
      // Prioritize exact menu_id match
      let menu = menuData.find(m => 
        m.menu_id.toLowerCase() === menuName.toLowerCase()
      );
      
      if (!menu) {
        menu = menuData.find(m => 
          m.name.toLowerCase().includes(menuName) ||
          menuName.includes(m.name.toLowerCase())
        );
      }
      
      if (!menu) {
        addChatMessage(`ไม่พบเมนู "${menuName}" ในระบบค่ะ`);
        return;
      }
      
      const costPrice = await calculateMenuCostFromDB(menu.id);
      const currentPrice = menu.price || 0;
      
      if (costPrice === null) {
        addChatMessage(`ไม่สามารถคำนวณได้ กรุณาตรวจสอบข้อมูลสูตรและราคาวัตถุดิบ`);
        return;
      }
      
      let response = `📊 การวิเคราะห์ความคุ้มทุนของ "${menu.name}":\n\n`;
      response += `💰 ต้นทุน: ฿${costPrice.toFixed(2)}\n`;
      response += `💵 ราคาขาย: ฿${currentPrice.toFixed(2)}\n\n`;
      
      // Check for different platforms
      const platforms = [
        { name: "ร้าน", fee: 0 },
        { name: "Grab", fee: 55 },
        { name: "FoodPanda", fee: 55 },
        { name: "Line Man", fee: 60 },
      ];
      
      for (const platform of platforms) {
        if (platform.fee === 0) {
          const profit = currentPrice - costPrice;
          const isProfitable = profit >= 0;
          response += `${isProfitable ? '✅' : '❌'} ${platform.name}: กำไร ฿${profit.toFixed(2)}\n`;
        } else {
          const platformFee = currentPrice * (platform.fee / 100);
          const netRevenue = currentPrice - platformFee;
          const profit = netRevenue - costPrice;
          const isProfitable = profit >= 0;
          response += `${isProfitable ? '✅' : '❌'} ${platform.name} (${platform.fee}%): กำไร ฿${profit.toFixed(2)} (รับจริง ฿${netRevenue.toFixed(2)})\n`;
        }
      }
      
      addChatMessage(response);
      return;
    }
  }
  
  // Extract purchase information from natural language
  const purchasePatterns = [
    /ซื้อ\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(ตัว|กก|kg|กรัม|ลิตร|ขวด|ชิ้น|ซอง)\s*(?:ราคา|ราคา|บาท)?\s*(\d+(?:\.\d+)?)?/i,
    /บันทึกการซื้อ\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(ตัว|กก|kg|กรัม|ลิตร|ขวด|ชิ้น|ซอง)\s*(?:ราคา|ราคา|บาท)?\s*(\d+(?:\.\d+)?)?/i,
    /เพิ่มสต็อก\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(ตัว|กก|kg|กรัม|ลิตร|ขวด|ชิ้น|ซอง)\s*(?:ราคา|ราคา|บาท)?\s*(\d+(?:\.\d+)?)?/i,
  ];

  for (const pattern of purchasePatterns) {
    const match = message.match(pattern);
    if (match) {
      const ingredientName = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unit = match[3].trim();
      const price = match[4] ? parseFloat(match[4]) : null;

      // Find matching ingredient
      const ingredient = ingredientData.find(ing => 
        ing.name.toLowerCase().includes(ingredientName) ||
        ingredientName.includes(ing.name.toLowerCase())
      );

      if (!ingredient) {
        addChatMessage(
          `ไม่พบวัตถุดิบ "${ingredientName}" ในระบบค่ะ\n` +
          `กรุณาเลือกจากรายการที่มีอยู่ หรือตรวจสอบการสะกดอีกครั้งค่ะ`
        );
        return;
      }

      if (!price) {
        addChatMessage(
          `กรุณาระบุราคา เช่น "ซื้อ ${ingredient.name} ${quantity} ${unit} ราคา XXX บาท"`
        );
        return;
      }

      // Process the purchase
      addChatMessage(`กำลังบันทึกการซื้อ ${ingredient.name}...`);
      
      try {
        const purchaseData = {
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          quantity: quantity,
          unit: unit,
          total_amount: price,
          type: "purchase",
          date: new Date().toISOString(),
        };

        const result = await window.POS.functions.processPurchase(purchaseData);

        if (result.success) {
          // Refresh data
          await loadIngredients();
          if (window._refreshLowStock) {
            await window._refreshLowStock();
          }
          if (window._refreshTransactions) {
            await window._refreshTransactions();
          }

          addChatMessage(
            `✅ บันทึกการซื้อสำเร็จ!\n\n` +
            `📦 วัตถุดิบ: ${ingredient.name}\n` +
            `📊 จำนวน: ${quantity} ${unit}\n` +
            `💰 ราคา: ฿${price}\n` +
            `\nสต็อกได้ถูกอัพเดทเรียบร้อยแล้วค่ะ!`
          );
        } else {
          addChatMessage(`❌ เกิดข้อผิดพลาด: ${result.error}`);
        }
      } catch (error) {
        addChatMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`);
      }
      return;
    }
  }

  // Check for stock update requests
  const stockUpdatePattern = /อัพเดทสต็อก|ปรับสต็อก|เปลี่ยนสต็อก/i;
  if (stockUpdatePattern.test(message)) {
    addChatMessage(
      `สำหรับการอัพเดทสต็อกโดยตรง กรุณาใช้ฟอร์ม "📦 ซื้อวัตถุดิบ" หรือ\n` +
      `พิมพ์ "ซื้อ [ชื่อวัตถุดิบ] [จำนวน] [หน่วย] ราคา [ราคา] บาท" ค่ะ`
    );
    return;
  }

  // ========== DATA DIAGNOSTICS ==========
  // Patterns: "ตรวจสอบข้อมูล", "check data", "ตรวจสอบสูตร", "check recipes"
  const diagnosticPatterns = [
    /ตรวจสอบ(?:ข้อมูล|สูตร|ต้นทุน|cost)/i,
    /check\s+(?:data|recipes|cost)/i,
    /ข้อมูล(?:มี|ครบ)/i,
    /สูตร(?:มี|ครบ)/i,
  ];
  
  for (const pattern of diagnosticPatterns) {
    if (pattern.test(message)) {
      addChatMessage(`กำลังตรวจสอบข้อมูล...`);
      
      try {
        // Check menu_recipes
        const { data: recipes, error: recipesError } = await window.supabase
          .from("menu_recipes")
          .select("id, menu_id")
          .limit(1);
        
        // Check ingredients with cost
        const { data: ingredientsWithCost, error: costError } = await window.supabase
          .from("ingredients")
          .select("id, name, cost_per_unit")
          .not("cost_per_unit", "is", null)
          .gt("cost_per_unit", 0);
        
        // Check ingredients without cost
        const { data: ingredientsWithoutCost } = await window.supabase
          .from("ingredients")
          .select("id, name, cost_per_unit")
          .or("cost_per_unit.is.null,cost_per_unit.eq.0");
        
        // Get total counts
        const { count: totalMenus } = await window.supabase
          .from("menus")
          .select("*", { count: "exact", head: true });
        
        const { count: totalIngredients } = await window.supabase
          .from("ingredients")
          .select("*", { count: "exact", head: true });
        
        // Count menus with recipes
        const { data: menusWithRecipes } = await window.supabase
          .from("menu_recipes")
          .select("menu_id", { count: "exact" });
        
        const uniqueMenusWithRecipes = new Set((menusWithRecipes || []).map(r => r.menu_id)).size;
        
        let response = `📊 สรุปสถานะข้อมูล:\n\n`;
        
        // Menu recipes status
        if (recipesError || !recipes || recipes.length === 0) {
          response += `❌ <strong>Menu Recipes:</strong> ไม่พบข้อมูลสูตรเมนู\n`;
          response += `   กรุณาเพิ่มสูตรเมนูในตาราง menu_recipes\n\n`;
        } else {
          response += `✅ <strong>Menu Recipes:</strong> มีข้อมูลสูตร ${recipes.length}+ รายการ\n`;
          response += `   เมนูที่มีสูตร: ${uniqueMenusWithRecipes}/${totalMenus || 0} เมนู\n\n`;
        }
        
        // Ingredient cost status
        const withCostCount = ingredientsWithCost?.length || 0;
        const withoutCostCount = ingredientsWithoutCost?.length || 0;
        const totalIngCount = totalIngredients || 0;
        
        response += `💰 <strong>Ingredient Costs:</strong>\n`;
        response += `   ✅ มีราคา: ${withCostCount}/${totalIngCount} วัตถุดิบ\n`;
        response += `   ${withoutCostCount > 0 ? '❌' : '✅'} ขาดราคา: ${withoutCostCount} วัตถุดิบ\n\n`;
        
        if (withoutCostCount > 0) {
          response += `⚠️ <strong>วัตถุดิบที่ขาดราคา:</strong>\n`;
          const missingList = (ingredientsWithoutCost || []).slice(0, 10).map(i => `   • ${i.name}`).join('\n');
          response += missingList;
          if (withoutCostCount > 10) {
            response += `\n   ... และอีก ${withoutCostCount - 10} รายการ`;
          }
          response += `\n\n`;
          response += `💡 <strong>วิธีแก้ไข:</strong>\n`;
          response += `   1. บันทึกการซื้อวัตถุดิบ (จะอัพเดท cost_per_unit อัตโนมัติ)\n`;
          response += `   2. รัน SQL: UPDATE ingredients SET cost_per_unit = ... FROM purchases\n`;
          response += `   3. หรือใช้ script: fix-ingredient-costs.sql\n`;
        }
        
        // Overall status
        if (recipesError || !recipes || recipes.length === 0) {
          response += `\n❌ <strong>สถานะ:</strong> ไม่สามารถคำนวณต้นทุนได้ (ไม่มีสูตรเมนู)`;
        } else if (withoutCostCount > 0) {
          response += `\n⚠️ <strong>สถานะ:</strong> บางเมนูอาจคำนวณต้นทุนไม่ได้ (วัตถุดิบขาดราคา)`;
        } else {
          response += `\n✅ <strong>สถานะ:</strong> พร้อมคำนวณต้นทุนเมนูได้แล้ว!`;
        }
        
        addChatMessage(response);
        return;
      } catch (error) {
        addChatMessage(`❌ เกิดข้อผิดพลาดในการตรวจสอบ: ${error.message}`);
        return;
      }
    }
  }
  
  // Help message
  const helpPatterns = [/ช่วยเหลือ|วิธีใช้|help|คู่มือ|commands|ฟังก์ชัน/i];
  if (helpPatterns.some(p => p.test(message))) {
    addChatMessage(
      `📚 คู่มือการใช้งาน AI Assistant:\n\n` +
      `🛒 <strong>บันทึกการซื้อ:</strong>\n` +
      `   • "ซื้อ กุ้งสด 100 ตัว ราคา 500 บาท"\n` +
      `   • "บันทึกการซื้อ แซลม่อนสด 1kg ราคา 300 บาท"\n\n` +
      `💰 <strong>ตรวจสอบต้นทุน:</strong>\n` +
      `   • "ต้นทุนเมนู กุ้งแช่น้ำปลา"\n` +
      `   • "ค่าใช้จ่ายของเมนู A1"\n` +
      `   • "cost of menu กุ้งดอง"\n\n` +
      `💡 <strong>แนะนำราคา:</strong>\n` +
      `   • "แนะนำราคา กุ้งแช่น้ำปลา"\n` +
      `   • "ควรขาย กุ้งดอง เท่าไหร่"\n` +
      `   • "แนะนำราคา A1 บน Grab"\n` +
      `   • "suggest price for กุ้งสดลาบ"\n\n` +
      `📊 <strong>ตรวจสอบความคุ้มทุน:</strong>\n` +
      `   • "เมนู กุ้งแช่น้ำปลา มีกำไรไหม"\n` +
      `   • "is menu A1 profitable"\n\n` +
      `📦 <strong>ตรวจสอบสต็อก:</strong>\n` +
      `   ดูรายการ "🚨 สต๊อกใกล้หมด" ด้านซ้าย\n\n` +
      `🔍 <strong>ตรวจสอบข้อมูล:</strong>\n` +
      `   • "ตรวจสอบข้อมูล" - ตรวจสอบสูตรและราคาวัตถุดิบ\n` +
      `   • "check data" - Check if data is ready for cost calculation\n\n` +
      `💡 <strong>หน่วยที่รองรับ:</strong>\n` +
      `   ตัว, กก, kg, กรัม, ลิตร, ขวด, ชิ้น, ซอง`
    );
    return;
  }

  // Default response
  addChatMessage(
    `ไม่เข้าใจคำสั่งของคุณค่ะ 😅\n\n` +
    `ลองพิมพ์:\n` +
    `• "ซื้อ [ชื่อวัตถุดิบ] [จำนวน] [หน่วย] ราคา [ราคา] บาท"\n` +
    `• "ช่วยเหลือ" เพื่อดูวิธีใช้\n\n` +
    `ตัวอย่าง: "ซื้อ กุ้งสด 100 ตัว ราคา 500 บาท"`
  );
}

// Set up chat form handler
document.addEventListener("DOMContentLoaded", function() {
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      
      if (!message) return;

      // Add user message
      addChatMessage(message, true);
      chatInput.value = "";

      // Process message
      await processAIMessage(message);
    });
  }

  // Close chatbot on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("ai-chatbot-modal");
      if (modal && !modal.classList.contains("hidden")) {
        closeAIChatbot();
      }
    }
  });
});

// ---------- Auto-initialization on load ----------
document.addEventListener("DOMContentLoaded", function () {
  // Auto-connect if credentials are available
  setTimeout(async () => {
    if (localStorage.getItem("google_sheets_connected") === "true") {
      logger.info("SHEETS", "Auto-connecting to Google Sheets...");
      await initializeGoogleSheets();
    }

    if (localStorage.getItem("line_bot_connected") === "true") {
      logger.info("LINE", "Auto-connecting Line Bot...");
      await initializeLineBot();
    }
  }, 2000);
});

// Keyboard and Viewport Handling ----------
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

// Handle viewport changes
window.addEventListener("resize", setVH);
window.addEventListener("orientationchange", setVH);
setVH();

// Close modals on escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeSaleModal();
    closePurchaseModal();
    closeAdjustModal();
    closeWasteModal();
    closeIngredientModal();
    closeExpensesModal();
    closeLaborModal();
  }
});

// ---------- Calendar Monthly Summary ----------
async function getMonthlyRevenue(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;
  const { data, error } = await window.supabase
    .from("sales")
    .select("total_amount, order_date")
    .gte("order_date", startDate)
    .lte("order_date", endDate);
  if (error) return { sum: 0, byDay: {} };
  const byDay = {};
  const sum = (data || []).reduce((acc, row) => {
    const d = row.order_date;
    const amt = Number(row.total_amount || 0);
    byDay[d] = (byDay[d] || 0) + amt;
    return acc + amt;
  }, 0);
  return { sum, byDay };
}

async function refreshMonthlySummary() {
  const monthInput = document.getElementById("summary-month");
  const value = monthInput.value || new Date().toISOString().slice(0,7);
  const [yearStr, monthStr] = value.split("-");
  const year = Number(yearStr), month = Number(monthStr);

  // Revenue
  const revenue = await getMonthlyRevenue(year, month);

  // Expenses + Labor
  const ops = await window.POS.functions.getMonthlyOperationalCosts(year, month);
  const expensesTotal = ops.success ? (ops.summary.utilities.electric + ops.summary.utilities.water + ops.summary.utilities.other + ops.summary.rental + ops.summary.other_expenses) : 0;
  const laborTotal = ops.success ? ops.summary.labor.total_pay : 0;

  // Approx profit (revenue - expenses - labor)
  const profit = revenue.sum - expensesTotal - laborTotal;

  // Update UI
  document.getElementById("sum-revenue").textContent = `฿${revenue.sum.toFixed(2)}`;
  document.getElementById("sum-expenses").textContent = `฿${expensesTotal.toFixed(2)}`;
  document.getElementById("sum-labor").textContent = `฿${laborTotal.toFixed(2)}`;
  document.getElementById("sum-profit").textContent = `฿${profit.toFixed(2)}`;

  // Breakdown
  const breakdownEl = document.getElementById("expenses-breakdown");
  if (ops.success) {
    breakdownEl.innerHTML = `
      <div class="flex justify-between"><span>⚡ ไฟฟ้า</span><span>฿${ops.summary.utilities.electric.toFixed(2)}</span></div>
      <div class="flex justify-between"><span>💧 น้ำ</span><span>฿${ops.summary.utilities.water.toFixed(2)}</span></div>
      <div class="flex justify-between"><span>🔌 อื่นๆ (ยูทิลิตี้)</span><span>฿${ops.summary.utilities.other.toFixed(2)}</span></div>
      <div class="flex justify-between"><span>🏠 ค่าเช่า</span><span>฿${ops.summary.rental.toFixed(2)}</span></div>
      <div class="flex justify-between"><span>📋 อื่นๆ</span><span>฿${ops.summary.other_expenses.toFixed(2)}</span></div>
    `;
  } else {
    breakdownEl.textContent = "ไม่พบข้อมูลค่าใช้จ่าย";
  }

  // Revenue by day
  const byDayEl = document.getElementById("revenue-by-day");
  const days = Object.entries(revenue.byDay).sort((a,b) => a[0].localeCompare(b[0]));
  byDayEl.innerHTML = days.map(([d, amt]) => `<div class="flex justify-between"><span>${d}</span><span>฿${amt.toFixed(2)}</span></div>`).join("") || "-";
}

function openCalendarModal() {
  const modal = document.getElementById("calendar-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  const monthInput = document.getElementById("summary-month");
  if (monthInput) monthInput.value = new Date().toISOString().slice(0,7);
  refreshMonthlySummary();
}
function closeCalendarModal() {
  document.getElementById("calendar-modal")?.classList.add("hidden");
}

// ---------- Debug Panel ----------
function showDebugPanel() {
  logger.info("UI", "Opening debug panel");

  const debugInfo = {
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    appState: appState,
    menuCount: menuData.length,
    ingredientCount: ingredientData.length,
    currentUser: currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
        }
      : null,
    firebaseConnected: appState.firebaseConnected,
    logs: logger.getLogs().slice(-20), // Last 20 logs
  };

  // Create debug modal
  const debugModal = document.createElement("div");
  debugModal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  debugModal.innerHTML = `
    <div class="card max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">🔍 Debug Panel</h3>
        <button onclick="this.closest('.fixed').remove()" class="btn ghost">✕</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-semibold mb-2">App State</h4>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(debugInfo.appState, null, 2)}</pre>
        </div>
        <div>
          <h4 class="font-semibold mb-2">User Info</h4>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">${JSON.stringify(debugInfo.currentUser, null, 2)}</pre>
        </div>
        <div>
          <h4 class="font-semibold mb-2">Data Counts</h4>
          <pre class="text-xs bg-gray-100 p-2 rounded">Menus: ${debugInfo.menuCount}\nIngredients: ${debugInfo.ingredientCount}</pre>
        </div>
        <div>
          <h4 class="font-semibold mb-2">Recent Logs</h4>
          <div class="text-xs bg-gray-100 p-2 rounded h-48 overflow-auto">
            ${debugInfo.logs
              .map(
                (log) =>
                  `<div class="mb-1">[${log.timestamp}] [${log.level}] [${log.category}] ${log.message}</div>`,
              )
              .join("")}
          </div>
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <button onclick="logger.exportLogs()" class="btn brand">📥 Export Logs</button>
        <button onclick="window.location.reload()" class="btn ghost">🔄 Reload</button>
        <button onclick="this.closest('.fixed').remove()" class="btn ghost">✕ Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(debugModal);
}

// Add debug button (Ctrl+Shift+D)
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === "D") {
    e.preventDefault();
    showDebugPanel();
  }
});

// ---------- Seed Data Functions ----------
async function initializeSeedData() {
  const seedTimer = perf.start("seed_data_initialization");
  logger.db("Starting seed data initialization");

  if (!window.POS || !window.POS.admin) {
    logger.error(
      "DB",
      "POS admin functions not available",
      new Error("window.POS.admin is undefined"),
    );
    return;
  }

  try {
    // Seed basic platforms
    logger.db("Seeding platforms...");
    await window.POS.admin.seedPlatforms();

    // Seed complete menu data from user's menu
    logger.db("Seeding complete menu data...");
    await window.POS.admin.seedMenus(MENU_DATA);

    // Seed ingredients based on recipes
    logger.db("Seeding ingredients from recipes...");
    await window.POS.admin.seedIngredients(INGREDIENT_DATA);

    seedTimer();
    logger.db("Seed data initialized successfully", {
      menuCount: MENU_DATA.length,
      ingredientCount: INGREDIENT_DATA.length,
      initTime: seedTimer(),
    });
    showToast("Database initialized with complete menu data");
  } catch (error) {
    seedTimer();
    logger.error("DB", "Error initializing seed data", error);
    // If Firebase seeding fails, load demo data
    logger.warn("DB", "Falling back to demo data due to seed failure");
    loadDemoData();
  }
}

// Complete Menu Data from User's Menu
const MENU_DATA = [
  {
    menu_id: "A1",
    name: "กุ้งแช่น้ำปลาแซ่บซี๊ด 7 ตัว",
    price: 139,
    category: "กุ้งแช่น้ำปลา",
    ingredients: [
      "กุ้งสด",
      "กะหล่ำซอย",
      "มะระ",
      "กระเทียมหั่น",
      "ผักชี",
      "คึ่นช่าย",
      "สะหระแน่",
      "น้ำจิ้มซีฟู้ดเล็ก",
      "หอมเจียวเล็ก",
    ],
  },
  {
    menu_id: "A2",
    name: "กุ้งแช่น้ำปลาแซ่บซี๊ด 12 ตัว",
    price: 179,
    category: "กุ้งแช่น้ำปลา",
    ingredients: [
      "กุ้งสด",
      "กะหล่ำซอย",
      "มะระ",
      "กระเทียมหั่น",
      "ผักชี",
      "คึ่นช่าย",
      "สะหระแน่",
      "น้ำจิ้มซีฟู้ดใหญ่",
      "หอมเจียวใหญ่",
    ],
  },
  {
    menu_id: "B1",
    name: "กุ้งดองซีอิ๊วสไตล์เกาหลี 7 ตัว",
    price: 139,
    category: "กุ้งดอง",
    ingredients: [
      "กุ้งสด",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
    ],
  },
  {
    menu_id: "B2",
    name: "กุ้งดองซีอิ๊วสไตล์เกาหลี 12 ตัว",
    price: 192,
    category: "กุ้งดอง",
    ingredients: [
      "กุ้งสด",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
    ],
  },
  {
    menu_id: "SetB1",
    name: "เซ็ต กุ้งดองซีอิ๊วสไตล์เกาหลี 7 ตัว",
    price: 149,
    category: "เซ็ตกุ้งดอง",
    ingredients: [
      "กุ้งสด",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
      "สาหร่าย",
    ],
  },
  {
    menu_id: "SetB2",
    name: "เซ็ต กุ้งดองซีอิ๊วสไตล์เกาหลี 12 ตัว",
    price: 215,
    category: "เซ็ตกุ้งดอง",
    ingredients: [
      "กุ้งสด",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
      "สาหร่าย",
    ],
  },
  {
    menu_id: "SetB3",
    name: "เซ็ตแซ่บคุ้ม กุ้งดองซีอิ๊ว 7 ตัว + ข้าวญี่ปุ่น + สาหร่าย",
    price: 169,
    category: "เซ็ตแซ่บคุ้ม",
    ingredients: [
      "กุ้งสด",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
      "สาหร่าย",
      "ข้าวญี่ปุ่น",
    ],
  },
  {
    menu_id: "SetB4",
    name: "เซ็ตแซ่บคุ้ม กุ้งดองซีอิ๊ว 12 ตัว + ข้าวญี่ปุ่น + สาหร่าย",
    price: 219,
    category: "เซ็ตแซ่บคุ้ม",
    ingredients: [
      "กุ้งสด",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
      "สาหร่าย",
      "ข้าวญี่ปุ่น",
    ],
  },
  {
    menu_id: "C1",
    name: "แซลมอนดองซีอิ๊วเกาหลี เซ็ตเล็ก",
    price: 256,
    category: "แซลมอน",
    ingredients: [
      "แซลมอนสด",
      "น้ำดอง",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
    ],
  },
  {
    menu_id: "C2",
    name: "แซลมอนดองซีอิ๋วเกาหลี เซ็ตใหญ่",
    price: 299,
    category: "แซลมอน",
    ingredients: [
      "แซลมอนสด",
      "น้ำดอง",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
    ],
  },
  {
    menu_id: "SetC1",
    name: "เซ็ตแซ่บคุ้ม แซลแม่อนดองซีอิ๊ว L + ข้าวญี่ปุ่น + สาหร่าย",
    price: 239,
    category: "เซ็ตแซ่บคุ้มแซลมอน",
    ingredients: [
      "แซลมอนสด",
      "น้ำดอง",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
      "ข้าวญี่ปุ่น",
      "สาหร่าย",
    ],
  },
  {
    menu_id: "SetC2",
    name: "เซ็ตแซ่บคุ้ม แซลมอนดองซีอิ๊ว XL + ข้าวญี่ปุ่น + สาหร่าย",
    price: 319,
    category: "เซ็ตแซ่บคุ้มแซลมอน",
    ingredients: [
      "แซลมอนสด",
      "น้ำดอง",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
      "ข้าวญี่ปุ่น",
      "สาหร่าย",
    ],
  },
  {
    menu_id: "B1C1",
    name: "แซลมอน + กุ้ง ดองซีอิ๊วเกาหลี",
    price: 239,
    category: "คอมโบ",
    ingredients: [
      "กุ้งสด",
      "แซลมอนสด",
      "น้ำดอง",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
    ],
  },
  {
    menu_id: "SetB1C1",
    name: "เซ็ตแซ่บคุ้ม แซลม่อน+กุ้งดองซีอิ๊ว + ข้าวญี่ปุ่น + สาหร่าย",
    price: 279,
    category: "เซ็ตคอมโบ",
    ingredients: [
      "กุ้งสด",
      "แซลมอนสด",
      "น้ำดอง",
      "พริกแดงจินดา",
      "กระเทียมหั่น",
      "งาขาว",
      "น้ำจิ้มซีฟู้ดเล็ก",
      "ข้าวญี่ปุ่น",
      "สาหร่าย",
    ],
  },
  {
    menu_id: "D",
    name: "กุ้งแช่น้ำปลาแซ่บซี๊ด 70 ตัว",
    price: 1179,
    category: "กุ้งแช่น้ำปลา",
    ingredients: [
      "กุ้งสด",
      "กะหล่ำซอย",
      "มะระ",
      "กระเทียมหั่น",
      "ผักชี",
      "คึ่นช่าย",
      "สะหระแน่",
      "น้ำจิ้มซีฟู้ดใหญ่",
      "หอมเจียว",
    ],
  },
  {
    menu_id: "E1",
    name: "กุ้งสด ลุยสวน 7 ตัว",
    price: 139,
    category: "กุ้งลุยสวน",
    ingredients: [
      "กุ้งสด",
      "น้ำจิ้มซีฟู้ด",
      "พริกสดปั่น",
      "หอมแดง",
      "ผักชีฝรั่ง",
      "ตะไคร้",
      "น้ำมะนาว",
      "น้ำเชื่อม",
      "น้ำปลา",
      "ชูรส",
    ],
  },
  {
    menu_id: "E2",
    name: "กุ้งสุก ลุยสวน 7 ตัว",
    price: 149,
    category: "กุ้งลุยสวน",
    ingredients: [
      "กุ้งสุก",
      "น้ำจิ้มซีฟู้ด",
      "พริกสดปั่น",
      "หอมแดง",
      "ผักชีฝรั่ง",
      "ตะไคร้",
      "น้ำมะนาว",
      "น้ำเชื่อม",
      "น้ำปลา",
      "ชูรส",
    ],
  },
  {
    menu_id: "F1",
    name: "กุ้งสด ลาบ 7 ตัว",
    price: 139,
    category: "กุ้งลาบ",
    ingredients: [
      "กุ้งสด",
      "น้ำปลา",
      "น้ำเชื่อม",
      "น้ำมะขาวเปียก",
      "ข้ามชั่ว",
      "พริกป่น",
      "ผงลาบ",
      "น้ำมะนาว",
      "ชูรส",
    ],
  },
  {
    menu_id: "F2",
    name: "กุ้งสุก ลาบ 7 ตัว",
    price: 149,
    category: "กุ้งลาบ",
    ingredients: [
      "กุ้งสุก",
      "น้ำปลา",
      "น้ำเชื่อม",
      "น้ำมะขาวเปียก",
      "ข้ามชั่ว",
      "พริกป่น",
      "ผงลาบ",
      "น้ำมะนาว",
      "ชูรส",
    ],
  },
  {
    menu_id: "G",
    name: "ปูอัดสดเด้ง + น้ำจิ้มซีฟู้ดจี๊ดจ๊าด 8 ชิ้น",
    price: 79,
    category: "เมนูเสริม",
    ingredients: ["ปูอัดสด", "น้ำจิ้มซีฟู้ด"],
  },
  {
    menu_id: "S",
    name: "สาหร่ายอบกรอบ",
    price: 25,
    category: "ข้าวทาม",
    ingredients: ["สาหร่าย"],
  },
  {
    menu_id: "L",
    name: "หอมเจียว",
    price: 20,
    category: "ข้าวทาม",
    ingredients: ["หอมเจียว"],
  },
  {
    menu_id: "M",
    name: "มะระหั่นแว่น",
    price: 15,
    category: "ข้าวทาม",
    ingredients: ["มะระ"],
  },
  {
    menu_id: "N",
    name: "กะหล่ำปลีซอย",
    price: 15,
    category: "ข้าวทาม",
    ingredients: ["กะหล่ำ"],
  },
  {
    menu_id: "O",
    name: "น้ำจิ้มซีฟู้ด",
    price: 25,
    category: "ซอส",
    ingredients: [
      "พริกสวน",
      "ผักชี",
      "กระเทียมไทย",
      "กระเทียมจีน",
      "น้ำตาลมะพร้าว",
      "น้ำตาลทรายขาว",
      "เกลือป่น",
      "ผงชูรส",
      "ตะไคร้ซอย",
      "เนื้อกระเทียมดอง",
      "น้ำปลา",
      "น้ำกระเทียมดอง",
      "มะนาวขวด",
      "มะนาวจริง",
    ],
  },
  {
    menu_id: "P",
    name: "โค้ก ขนาด 325 มล.",
    price: 30,
    category: "เครื่องดื่ม",
    ingredients: ["โค้ก"],
  },
  {
    menu_id: "Q",
    name: "น้ำดื่ม คริสตัล ขนาด 600 มล.",
    price: 25,
    category: "เครื่องดื่ม",
    ingredients: ["น้ำดื่มคริสตัล"],
  },
  {
    menu_id: "R",
    name: "เป๊ปซี่ กระป๋อง 325 มล",
    price: 30,
    category: "เครื่องดื่ม",
    ingredients: ["เป๊ปซี่"],
  },
];

// Ingredient Data based on recipes and menu analysis
const INGREDIENT_DATA = [
  {
    name: "กุ้งสด",
    unit: "ตัว",
    min_stock: 50,
    current_stock: 100,
    category: "หลัก",
  },
  {
    name: "แซลมอนสด",
    unit: "กรัม",
    min_stock: 500,
    current_stock: 1000,
    category: "หลัก",
  },
  {
    name: "ปูอัดสด",
    unit: "ชิ้น",
    min_stock: 20,
    current_stock: 50,
    category: "หลัก",
  },
  {
    name: "พริกแดงจินดา",
    unit: "กรัม",
    min_stock: 200,
    current_stock: 500,
    category: "เครื่องเทศ",
  },
  {
    name: "พริกสวน",
    unit: "กรัม",
    min_stock: 200,
    current_stock: 500,
    category: "เครื่องเทศ",
  },
  {
    name: "กระเทียมหั่น",
    unit: "กรัม",
    min_stock: 300,
    current_stock: 600,
    category: "เครื่องเทศ",
  },
  {
    name: "กระเทียมไทย",
    unit: "หัว",
    min_stock: 10,
    current_stock: 20,
    category: "เครื่องเทศ",
  },
  {
    name: "กระเทียมจีน",
    unit: "หัว",
    min_stock: 10,
    current_stock: 20,
    category: "เครื่องเทศ",
  },
  {
    name: "มะระ",
    unit: "ถ้วย",
    min_stock: 5,
    current_stock: 10,
    category: "ผัก",
  },
  {
    name: "ผักชี",
    unit: "กำ",
    min_stock: 5,
    current_stock: 10,
    category: "ผัก",
  },
  {
    name: "คึ่นช่าย",
    unit: "กำ",
    min_stock: 5,
    current_stock: 10,
    category: "ผัก",
  },
  {
    name: "สะหระแน่",
    unit: "กำ",
    min_stock: 5,
    current_stock: 10,
    category: "ผัก",
  },
  {
    name: "ผักชีฝรั่ง",
    unit: "กำ",
    min_stock: 3,
    current_stock: 8,
    category: "ผัก",
  },
  {
    name: "ตะไคร้",
    unit: "ต้น",
    min_stock: 5,
    current_stock: 15,
    category: "ผัก",
  },
  {
    name: "ตะไคร้ซอย",
    unit: "ต้น",
    min_stock: 3,
    current_stock: 10,
    category: "ผัก",
  },
  {
    name: "สาหร่าย",
    unit: "ซอง",
    min_stock: 10,
    current_stock: 30,
    category: "ข้าวทาม",
  },
  {
    name: "หอมเจียว",
    unit: "หัว",
    min_stock: 10,
    current_stock: 20,
    category: "เครื่องเทศ",
  },
  {
    name: "หอมแดง",
    unit: "หัว",
    min_stock: 10,
    current_stock: 20,
    category: "เครื่องเทศ",
  },
  {
    name: "งาขาว",
    unit: "กรัม",
    min_stock: 100,
    current_stock: 300,
    category: "เครื่องเทศ",
  },
  {
    name: "ข้าวญี่ปุ่น",
    unit: "ถ้วย",
    min_stock: 20,
    current_stock: 50,
    category: "ข้าวทาม",
  },
  {
    name: "น้ำจิ้มซีฟู้ด",
    unit: "ขวด",
    min_stock: 5,
    current_stock: 15,
    category: "ซอส",
  },
  {
    name: "น้ำจิ้มซีฟู้ดเล็ก",
    unit: "ช้อน",
    min_stock: 10,
    current_stock: 30,
    category: "ซอส",
  },
  {
    name: "น้ำจิ้มซีฟู้ดใหญ่",
    unit: "ช้อน",
    min_stock: 5,
    current_stock: 20,
    category: "ซอส",
  },
  {
    name: "น้ำดอง",
    unit: "มล.",
    min_stock: 1000,
    current_stock: 2000,
    category: "ซอส",
  },
  {
    name: "น้ำปลา",
    unit: "ช้อน",
    min_stock: 10,
    current_stock: 30,
    category: "ซอส",
  },
  {
    name: "น้ำกระเทียมดอง",
    unit: "มล.",
    min_stock: 500,
    current_stock: 1500,
    category: "ซอส",
  },
  {
    name: "น้ำเชื่อม",
    unit: "ช้อน",
    min_stock: 5,
    current_stock: 20,
    category: "ซอส",
  },
  {
    name: "น้ำมะนาว",
    unit: "ช้อน",
    min_stock: 5,
    current_stock: 20,
    category: "ซอส",
  },
  {
    name: "มะนาวขวด",
    unit: "ขวด",
    min_stock: 5,
    current_stock: 15,
    category: "ซอส",
  },
  {
    name: "มะนาวจริง",
    unit: "ขวด",
    min_stock: 5,
    current_stock: 15,
    category: "ซอส",
  },
  {
    name: "น้ำตาลมะพร้าว",
    unit: "กรัม",
    min_stock: 500,
    current_stock: 1000,
    category: "ซอส",
  },
  {
    name: "น้ำตาลทรายขาว",
    unit: "กรัม",
    min_stock: 200,
    current_stock: 500,
    category: "ซอส",
  },
  {
    name: "เกลือป่น",
    unit: "กรัม",
    min_stock: 100,
    current_stock: 300,
    category: "ซอส",
  },
  {
    name: "ผงชูรส",
    unit: "กรัม",
    min_stock: 50,
    current_stock: 200,
    category: "ซอส",
  },
  {
    name: "เนื้อกระเทียมดอง",
    unit: "หัว",
    min_stock: 5,
    current_stock: 15,
    category: "ซอส",
  },
  {
    name: "น้ำมันงา",
    unit: "ช้อน",
    min_stock: 5,
    current_stock: 15,
    category: "ซอส",
  },
  {
    name: "ข้าวสารหนึ่ง",
    unit: "กรัม",
    min_stock: 500,
    current_stock: 1000,
    category: "ข้าวทาม",
  },
  {
    name: "น้ำมะขาวเปียก",
    unit: "ช้อน",
    min_stock: 3,
    current_stock: 10,
    category: "ซอส",
  },
  {
    name: "ข้ามชั่ว",
    unit: "ช้อน",
    min_stock: 3,
    current_stock: 10,
    category: "ซอส",
  },
  {
    name: "พริกป่น",
    unit: "ช้อน",
    min_stock: 3,
    current_stock: 10,
    category: "ซอส",
  },
  {
    name: "ผงลาบ",
    unit: "ช้อน",
    min_stock: 3,
    current_stock: 10,
    category: "ซอส",
  },
  {
    name: "ชูรส",
    unit: "ช้อน",
    min_stock: 3,
    current_stock: 10,
    category: "ซอส",
  },
  {
    name: "โค้ก",
    unit: "ขวด",
    min_stock: 10,
    current_stock: 30,
    category: "เครื่องดื่ม",
  },
  {
    name: "น้ำดื่มคริสตัล",
    unit: "ขวด",
    min_stock: 10,
    current_stock: 30,
    category: "เครื่องดื่ม",
  },
  {
    name: "เป๊ปซี่",
    unit: "ขวด",
    min_stock: 10,
    current_stock: 30,
    category: "เครื่องดื่ม",
  },
];

async function createSeedData() {
  // Use Supabase admin functions
  if (!window.POS || !window.POS.admin) {
    logger.error("DB", "POS admin functions not available");
    return;
  }

  const seedTimer = perf.start("create_seed_data_supabase");
  logger.db("Creating seed data via Supabase...");

  try {
    // Seed platforms first
    logger.db("Seeding platforms...");
    await window.POS.admin.seedPlatforms();

    // Seed ingredients
    logger.db("Seeding ingredients...");
    const ingResult = await window.POS.admin.seedIngredients(INGREDIENT_DATA);
    if (!ingResult.success) {
      logger.warn("DB", "Error seeding ingredients", ingResult.error);
    }

    // Seed menus
    logger.db("Seeding menus...");
    const menuResult = await window.POS.admin.seedMenus(MENU_DATA);
    if (!menuResult.success) {
      logger.warn("DB", "Error seeding menus", menuResult.error);
    }

    seedTimer();
    logger.db("Seed data created successfully", {
      ingredientCount: INGREDIENT_DATA.length,
      menuCount: MENU_DATA.length,
      batchTime: seedTimer(),
    });
  } catch (error) {
    seedTimer();
    logger.error("DB", "Error creating seed data", error);
    throw error;
  }
}

function loadDemoData() {
  const demoTimer = perf.start("load_demo_data");
  logger.warn("DB", "Loading demo data as fallback");

  // Demo ingredients from our complete list
  ingredientData = INGREDIENT_DATA.map((item, index) => ({
    id: `demo_ingredient_${index}`,
    ...item,
  }));

  // Demo menus from our complete list
  menuData = MENU_DATA.map((item, index) => ({
    id: `demo_menu_${index}`,
    ...item,
  }));

  // Populate dropdowns with demo data
  logger.ui("Populating dropdowns with demo data");
  populateIngredientDropdown();
  populateMenuDropdown();

  // Show demo status
  const statusEl = document.getElementById("supabase-status");
  if (statusEl) {
    statusEl.textContent = "🟡 Demo Mode";
    statusEl.className = "supabase-status demo";
  }

  // Show demo messages
  const lowStockEl = document.getElementById("low-stock-list");
  if (lowStockEl) {
    lowStockEl.innerHTML =
      '<p class="text-yellow-600">🟡 Demo Mode - Supabase connection issues</p>';
  }

  const transEl = document.getElementById("recent-transactions");
  if (transEl) {
    transEl.innerHTML =
      '<p class="text-yellow-600">🟡 Demo Mode - No live transactions</p>';
  }

  demoTimer();
  logger.warn("UI", "Demo mode activated", {
    ingredientCount: ingredientData.length,
    menuCount: menuData.length,
    loadTime: demoTimer(),
  });
  showToast("⚠️ Running in Demo Mode - Supabase connection issues");
}

function populateIngredientDropdown() {
  const selectEl = document.getElementById("purchase-ingredient");
  selectEl.innerHTML = '<option value="">เลือกวัตถุดิบ...</option>';

  ingredientData.forEach((ingredient) => {
    const option = document.createElement("option");
    option.value = ingredient.id;
    option.textContent = `${ingredient.name} (${ingredient.unit})`;
    selectEl.appendChild(option);
  });
}

function populateMenuDropdown() {
  const selectEl = document.getElementById("sale-menu");
  selectEl.innerHTML = '<option value="">เลือกเมนู...</option>';

  menuData.forEach((menu) => {
    const option = document.createElement("option");
    option.value = menu.id;
    option.textContent = `${menu.name} - ฿${menu.price}`;
    selectEl.appendChild(option);
  });
}

// ---------- Stock Management ----------
let stockState = { page: 1, pageSize: 25, total: 0, search: "", items: [] };
let stockSearchDebounce;

async function loadStockPage(page = 1) {
  const tableEl = document.getElementById("stock-table");
  const infoEl = document.getElementById("stock-page-info");
  if (tableEl) tableEl.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';

  const result = await window.POS.functions.listIngredientsPaginated({
    search: stockState.search,
    page,
    pageSize: stockState.pageSize,
  });

  if (!result.success) {
    if (tableEl) tableEl.innerHTML = `<div class="text-red-600 text-sm">โหลดข้อมูลล้มเหลว: ${result.error}</div>`;
    return;
  }

  stockState.page = result.page;
  stockState.pageSize = result.pageSize;
  stockState.total = result.total;
  stockState.items = result.items;

  renderStockTable();
  renderStockPagination();
}

function renderStockTable() {
  const tableEl = document.getElementById("stock-table");
  if (!tableEl) return;

  const rows = stockState.items.map(item => {
    const low = Number(item.current_stock) <= Number(item.min_stock);
    return `
      <tr class="border-b ${low ? 'bg-red-50' : ''}">
        <td class="p-2 whitespace-nowrap">${item.name}</td>
        <td class="p-2 text-right">${(item.current_stock ?? 0).toFixed(2)} ${item.unit || ''}</td>
        <td class="p-2 text-right">${(item.min_stock ?? 0).toFixed(2)}</td>
        <td class="p-2 text-right">${item.cost_per_unit != null ? item.cost_per_unit.toFixed(2) : '-'}</td>
        <td class="p-2 text-right">
          <div class="flex gap-2 justify-end">
            <button class="btn ghost text-sm" onclick="openAdjustModal('${item.id}','${item.name.replace(/'/g, "&#39;")}', '${item.unit || ''}')">ปรับ</button>
            <button class="btn ghost text-sm" onclick="openWasteModal('${item.id}','${item.name.replace(/'/g, "&#39;")}', '${item.unit || ''}')">ทิ้ง</button>
            <button class="btn ghost text-sm" onclick="openQuickPurchase('${item.id}')">ซื้อ</button>
            <button class="btn brand text-sm" onclick="openIngredientModal('${item.id}','${item.name.replace(/'/g, "&#39;")}', '${item.unit || ''}', '${item.min_stock ?? ''}', '${item.current_stock ?? ''}', '${item.cost_per_unit ?? ''}')">แก้ไข</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  tableEl.innerHTML = `
    <table class="min-w-full text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="text-left p-2">วัตถุดิบ</th>
          <th class="text-right p-2">สต๊อก</th>
          <th class="text-right p-2">ขั้นต่ำ</th>
          <th class="text-right p-2">ราคาต่อหน่วย</th>
          <th class="text-right p-2">จัดการ</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5" class="p-3 text-center text-gray-500">ไม่มีข้อมูล</td></tr>`}</tbody>
    </table>`;
}

function renderStockPagination() {
  const infoEl = document.getElementById("stock-page-info");
  const prevEl = document.getElementById("stock-prev");
  const nextEl = document.getElementById("stock-next");
  const totalPages = Math.max(1, Math.ceil(stockState.total / stockState.pageSize));
  if (infoEl) infoEl.textContent = `หน้า ${stockState.page} / ${totalPages} · ทั้งหมด ${stockState.total} รายการ`;
  if (prevEl) prevEl.disabled = stockState.page <= 1;
  if (nextEl) nextEl.disabled = stockState.page >= totalPages;
}

// Event bindings for stock UI
document.addEventListener("DOMContentLoaded", function () {
  const searchEl = document.getElementById("stock-search");
  const refreshEl = document.getElementById("stock-refresh");
  const addEl = document.getElementById("stock-add-ingredient");
  const prevEl = document.getElementById("stock-prev");
  const nextEl = document.getElementById("stock-next");

  if (searchEl) {
    searchEl.addEventListener("input", () => {
      clearTimeout(stockSearchDebounce);
      stockSearchDebounce = setTimeout(() => {
        stockState.search = searchEl.value.trim();
        loadStockPage(1);
      }, 250);
    });
  }
  if (refreshEl) refreshEl.addEventListener("click", () => loadStockPage(stockState.page));
  if (addEl) addEl.addEventListener("click", () => openIngredientModal());
  if (prevEl) prevEl.addEventListener("click", () => loadStockPage(Math.max(1, stockState.page - 1)));
  if (nextEl) nextEl.addEventListener("click", () => loadStockPage(stockState.page + 1));

  // Initial load
  loadStockPage(1);
});

// Modals and actions
function openAdjustModal(id, name, unit) {
  document.getElementById("adjust-ingredient-id").value = id;
  document.getElementById("adjust-ingredient-name").textContent = `${name} (${unit || ''})`;
  document.getElementById("adjust-qty").value = '';
  document.getElementById("adjust-reason").value = '';
  document.getElementById("adjust-modal").classList.remove("hidden");
}
function closeAdjustModal() {
  document.getElementById("adjust-modal").classList.add("hidden");
}

function openWasteModal(id, name, unit) {
  document.getElementById("waste-ingredient-id").value = id;
  document.getElementById("waste-ingredient-name").textContent = `${name} (${unit || ''})`;
  document.getElementById("waste-qty").value = '';
  document.getElementById("waste-reason").value = '';
  document.getElementById("waste-modal").classList.remove("hidden");
}
function closeWasteModal() {
  document.getElementById("waste-modal").classList.add("hidden");
}

function openIngredientModal(id = '', name = '', unit = '', min = '', stock = '', cost = '') {
  document.getElementById("ingredient-id").value = id || '';
  document.getElementById("ingredient-name").value = name || '';
  document.getElementById("ingredient-unit").value = unit || '';
  document.getElementById("ingredient-min").value = min || '';
  document.getElementById("ingredient-stock").value = stock || '';
  document.getElementById("ingredient-cost").value = cost || '';
  document.getElementById("ingredient-modal-title").textContent = id ? 'แก้วัตถุดิบ' : 'เพิ่มวัตถุดิบ';
  document.getElementById("ingredient-modal").classList.remove("hidden");
}
function closeIngredientModal() {
  document.getElementById("ingredient-modal").classList.add("hidden");
}

function openQuickPurchase(ingredientId) {
  const select = document.getElementById("purchase-ingredient");
  if (select) select.value = ingredientId;
  openPurchaseModal();
}

// Submit handlers
document.addEventListener("DOMContentLoaded", function () {
  const adjustForm = document.getElementById("adjust-form");
  if (adjustForm) {
    adjustForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("adjust-ingredient-id").value;
      const qty = parseFloat(document.getElementById("adjust-qty").value || '0');
      const reason = document.getElementById("adjust-reason").value || null;
      const unit = (stockState.items.find(i => i.id === id)?.unit) || null;
      const res = await window.POS.functions.createStockAdjustment({ ingredient_id: id, quantity_change: qty, unit, reason });
      if (res.success) {
        showToast("ปรับสต๊อกเรียบร้อย");
        closeAdjustModal();
        await loadStockPage(stockState.page);
        if (window._refreshLowStock) await window._refreshLowStock();
      } else {
        showError("ปรับสต๊อกล้มเหลว: " + res.error);
      }
    });
  }

  const wasteForm = document.getElementById("waste-form");
  if (wasteForm) {
    wasteForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("waste-ingredient-id").value;
      const qty = parseFloat(document.getElementById("waste-qty").value || '0');
      const reason = document.getElementById("waste-reason").value || null;
      const unit = (stockState.items.find(i => i.id === id)?.unit) || null;
      const res = await window.POS.functions.createWaste({ ingredient_id: id, quantity: qty, unit, reason });
      if (res.success) {
        showToast("บันทึกของเสียแล้ว");
        closeWasteModal();
        await loadStockPage(stockState.page);
        if (window._refreshLowStock) await window._refreshLowStock();
      } else {
        showError("บันทึกของเสียล้มเหลว: " + res.error);
      }
    });
  }

  const ingForm = document.getElementById("ingredient-form");
  if (ingForm) {
    ingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById("ingredient-id").value || undefined,
        name: document.getElementById("ingredient-name").value,
        unit: document.getElementById("ingredient-unit").value,
        min_stock: parseFloat(document.getElementById("ingredient-min").value || '0'),
        current_stock: document.getElementById("ingredient-stock").value === '' ? undefined : parseFloat(document.getElementById("ingredient-stock").value),
        cost_per_unit: document.getElementById("ingredient-cost").value === '' ? undefined : parseFloat(document.getElementById("ingredient-cost").value),
      };
      const res = await window.POS.functions.upsertIngredient(payload);
      if (res.success) {
        showToast("บันทึกวัตถุดิบเรียบร้อย");
        closeIngredientModal();
        await loadStockPage(stockState.page);
        if (window._refreshLowStock) await window._refreshLowStock();
      } else {
        showError("บันทึกวัตถุดิบล้มเหลว: " + res.error);
      }
    });
  }

  // Expenses form handler
  const expensesForm = document.getElementById("expenses-form");
  if (expensesForm) {
    const categorySelect = document.getElementById("expense-category");
    const subcategoryContainer = document.getElementById("expense-subcategory-container");
    
    // Show subcategory for utilities
    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        if (e.target.value === "utility") {
          subcategoryContainer.style.display = "block";
        } else {
          subcategoryContainer.style.display = "none";
        }
      });
    }

    expensesForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        category: document.getElementById("expense-category").value,
        subcategory: document.getElementById("expense-subcategory").value || null,
        description: document.getElementById("expense-description").value,
        amount: parseFloat(document.getElementById("expense-amount").value),
        date: document.getElementById("expense-date").value,
        payment_method: document.getElementById("expense-payment").value,
        notes: document.getElementById("expense-notes").value || null,
      };
      const res = await window.POS.functions.createExpense(payload);
      if (res.success) {
        showToast("บันทึกค่าใช้จ่ายเรียบร้อย");
        closeExpensesModal();
      } else {
        showError("บันทึกค่าใช้จ่ายล้มเหลว: " + res.error);
      }
    });
  }

  // Labor form handler
  const laborForm = document.getElementById("labor-form");
  if (laborForm) {
    const hoursInput = document.getElementById("labor-hours");
    const rateInput = document.getElementById("labor-rate");
    const totalDisplay = document.getElementById("labor-total");

    // Auto-calculate total
    const updateLaborTotal = () => {
      const hours = parseFloat(hoursInput?.value || 0);
      const rate = parseFloat(rateInput?.value || 0);
      const total = hours * rate;
      if (totalDisplay) {
        totalDisplay.textContent = `฿${total.toFixed(2)}`;
      }
    };
    
    if (hoursInput) hoursInput.addEventListener("input", updateLaborTotal);
    if (rateInput) rateInput.addEventListener("input", updateLaborTotal);

    laborForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        employee_name: document.getElementById("labor-employee").value,
        date: document.getElementById("labor-date").value,
        hours: parseFloat(document.getElementById("labor-hours").value),
        hourly_rate: parseFloat(document.getElementById("labor-rate").value),
        role: document.getElementById("labor-role").value || null,
        notes: document.getElementById("labor-notes").value || null,
      };
      const res = await window.POS.functions.createLaborLog(payload);
      if (res.success) {
        showToast("บันทึกค่าแรงเรียบร้อย");
        closeLaborModal();
      } else {
        showError("บันทึกค่าแรงล้มเหลว: " + res.error);
      }
    });
  }
});

// Expenses modal functions
function openExpensesModal() {
  const modal = document.getElementById("expenses-modal");
  if (modal) {
    modal.classList.remove("hidden");
    document.getElementById("expense-date").value = new Date().toISOString().split('T')[0];
    document.getElementById("expense-category").value = "";
    document.getElementById("expense-subcategory-container").style.display = "none";
  }
}
function closeExpensesModal() {
  document.getElementById("expenses-modal")?.classList.add("hidden");
}

// Menu Listing Page Functions
let menusState = {
  search: "",
  status: "all",
};

function openMenusPage() {
  document.getElementById("pos-app")?.classList.add("hidden");
  document.getElementById("menus-page")?.classList.remove("hidden");
  loadMenus();
}

function closeMenusPage() {
  document.getElementById("menus-page")?.classList.add("hidden");
  document.getElementById("pos-app")?.classList.remove("hidden");
}

let menuSearchTimeout;
function debounceMenuSearch() {
  clearTimeout(menuSearchTimeout);
  menuSearchTimeout = setTimeout(() => {
    loadMenus();
  }, 500);
}

async function loadMenus() {
  const tableBody = document.getElementById("menus-table");
  if (!tableBody) return;

  // Update state from filters
  menusState.search = document.getElementById("menu-search")?.value || "";
  menusState.status = document.getElementById("menu-filter-status")?.value || "all";

  // Show loading
  tableBody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center p-8">
        <div class="spinner" style="margin: 20px auto"></div>
      </td>
    </tr>
  `;

  try {
    const isActive = menusState.status === "all" ? null : menusState.status === "active";
    const result = await window.POS.functions.getMenusWithAvailability({
      search: menusState.search,
      isActive: isActive,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to load menus");
    }

    const menus = result.menus || [];

    // Calculate summary stats
    const totalMenus = menus.length;
    const availableMenus = menus.filter(m => m.available_dishes !== null && m.available_dishes > 0).length;
    const outOfStockMenus = menus.filter(m => m.available_dishes !== null && m.available_dishes === 0).length;
    const menusWithProfit = menus.filter(m => m.profit !== null && !isNaN(m.profit));
    const avgProfit = menusWithProfit.length > 0 
      ? menusWithProfit.reduce((sum, m) => sum + (m.profit || 0), 0) / menusWithProfit.length 
      : 0;

    // Update summary
    document.getElementById("menu-total-count").textContent = totalMenus;
    document.getElementById("menu-available-count").textContent = availableMenus;
    document.getElementById("menu-out-of-stock-count").textContent = outOfStockMenus;
    document.getElementById("menu-avg-profit").textContent = `฿${avgProfit.toFixed(2)}`;

    // Render table
    if (menus.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center p-8 text-gray-500">
            ไม่พบข้อมูลเมนู
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = menus.map(menu => {
        const price = parseFloat(menu.price) || 0;
        const cost = menu.calculated_cost || 0;
        const profit = menu.profit || 0;
        const profitMargin = menu.profit_margin || 0;
        const availableDishes = menu.available_dishes;

        // Format available dishes
        let availableDisplay = "-";
        let availableClass = "";
        if (availableDishes !== null) {
          if (availableDishes === 0) {
            availableDisplay = '<span class="text-red-600 font-bold">0</span>';
            availableClass = "text-red-600";
          } else if (availableDishes < 5) {
            availableDisplay = `<span class="text-yellow-600 font-bold">${availableDishes}</span>`;
            availableClass = "text-yellow-600";
          } else {
            availableDisplay = `<span class="text-green-600 font-bold">${availableDishes}</span>`;
            availableClass = "text-green-600";
          }
        }

        // Profit color
        const profitClass = profit >= 0 ? "text-green-600" : "text-red-600";
        const profitMarginClass = profitMargin >= 30 ? "text-green-600" : 
                                   profitMargin >= 15 ? "text-yellow-600" : "text-red-600";

        // Status badge
        const statusBadge = menu.is_active && menu.is_available
          ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">พร้อมขาย</span>'
          : !menu.is_active
          ? '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">ไม่ใช้งาน</span>'
          : '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">ไม่พร้อมขาย</span>';

        return `
          <tr class="border-b hover:bg-gray-50">
            <td class="p-2 text-sm font-mono">${menu.menu_id || "-"}</td>
            <td class="p-2 text-sm">
              <div class="font-medium">${menu.name || "-"}</div>
              ${menu.description ? `<div class="text-xs text-gray-500">${menu.description}</div>` : ""}
              ${menu.recipe_count > 0 ? `<div class="text-xs text-gray-400">มี ${menu.recipe_count} วัตถุดิบ</div>` : "<div class=\"text-xs text-gray-400\">ไม่มีสูตร</div>"}
            </td>
            <td class="p-2 text-sm text-right font-semibold">฿${price.toFixed(2)}</td>
            <td class="p-2 text-sm text-right text-gray-600">฿${cost.toFixed(2)}</td>
            <td class="p-2 text-sm text-right font-semibold ${profitClass}">฿${profit.toFixed(2)}</td>
            <td class="p-2 text-sm text-right font-semibold ${profitMarginClass}">${profitMargin.toFixed(1)}%</td>
            <td class="p-2 text-sm text-center ${availableClass}">${availableDisplay}</td>
            <td class="p-2 text-sm text-center">${statusBadge}</td>
          </tr>
        `;
      }).join("");
    }
  } catch (error) {
    console.error("Error loading menus:", error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center p-8 text-red-500">
          เกิดข้อผิดพลาด: ${error.message}
        </td>
      </tr>
    `;
  }
}

// Expense History Page Functions
let expensesHistoryState = {
  page: 1,
  pageSize: 50,
  total: 0,
  search: "",
  category: "",
  startDate: null,
  endDate: null,
};

function openExpensesHistory() {
  document.getElementById("pos-app")?.classList.add("hidden");
  document.getElementById("expenses-history-page")?.classList.remove("hidden");
  expensesHistoryState.page = 1;
  loadExpensesHistory();
}

function closeExpensesHistory() {
  document.getElementById("expenses-history-page")?.classList.add("hidden");
  document.getElementById("pos-app")?.classList.remove("hidden");
}

let expenseSearchTimeout;
function debounceExpenseSearch() {
  clearTimeout(expenseSearchTimeout);
  expenseSearchTimeout = setTimeout(() => {
    expensesHistoryState.page = 1;
    loadExpensesHistory();
  }, 500);
}

function resetExpenseFilters() {
  document.getElementById("expense-search").value = "";
  document.getElementById("expense-filter-category").value = "";
  document.getElementById("expense-filter-start").value = "";
  document.getElementById("expense-filter-end").value = "";
  expensesHistoryState.search = "";
  expensesHistoryState.category = "";
  expensesHistoryState.startDate = null;
  expensesHistoryState.endDate = null;
  expensesHistoryState.page = 1;
  loadExpensesHistory();
}

async function loadExpensesHistory() {
  const tableBody = document.getElementById("expenses-history-table");
  if (!tableBody) return;

  // Update state from filters
  expensesHistoryState.search = document.getElementById("expense-search")?.value || "";
  expensesHistoryState.category = document.getElementById("expense-filter-category")?.value || "";
  const startDateInput = document.getElementById("expense-filter-start")?.value;
  const endDateInput = document.getElementById("expense-filter-end")?.value;
  expensesHistoryState.startDate = startDateInput || null;
  expensesHistoryState.endDate = endDateInput || null;

  // Show loading
  tableBody.innerHTML = `
    <tr>
      <td colspan="9" class="text-center p-8">
        <div class="spinner" style="margin: 20px auto"></div>
      </td>
    </tr>
  `;

  try {
    const result = await window.POS.functions.getExpensesHistory({
      search: expensesHistoryState.search,
      category: expensesHistoryState.category,
      page: expensesHistoryState.page,
      pageSize: expensesHistoryState.pageSize,
      startDate: expensesHistoryState.startDate,
      endDate: expensesHistoryState.endDate,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to load expenses");
    }

    expensesHistoryState.total = result.total || 0;
    const expenses = result.expenses || [];
    const totalAmount = result.totalAmount !== undefined ? result.totalAmount : 
                        expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Update summary
    document.getElementById("expense-total-count").textContent = expensesHistoryState.total;
    document.getElementById("expense-total-amount").textContent = `฿${totalAmount.toFixed(2)}`;
    document.getElementById("expense-page-count").textContent = expenses.length;
    document.getElementById("expense-current-page").textContent = expensesHistoryState.page;

    // Render table
    if (expenses.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center p-8 text-gray-500">
            ไม่พบข้อมูลค่าใช้จ่าย
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = expenses.map(expense => {
        const categoryLabels = {
          utility: "⚡ ค่าสาธารณูปโภค",
          rental: "🏠 ค่าเช่า",
          labor: "👷 ค่าแรง",
          other: "📋 อื่นๆ",
        };
        const categoryLabel = categoryLabels[expense.category] || expense.category;
        const subcategoryLabel = expense.subcategory === "electric" ? "ค่าไฟฟ้า" : 
                                 expense.subcategory === "water" ? "ค่าน้ำ" : 
                                 expense.subcategory || "";
        
        const paymentMethodLabels = {
          cash: "เงินสด",
          transfer: "โอนเงิน",
          credit_card: "บัตรเครดิต",
        };
        const paymentLabel = paymentMethodLabels[expense.payment_method] || expense.payment_method;

        const expenseDate = new Date(expense.expense_date);
        const formattedDate = expenseDate.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        const updatedDate = expense.updated_at ? new Date(expense.updated_at) : null;
        const formattedUpdated = updatedDate ? updatedDate.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) : "-";

        const statusBadge = expense.status === "approved" 
          ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">อนุมัติ</span>'
          : expense.status === "pending"
          ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">รอตรวจสอบ</span>'
          : '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">' + (expense.status || "อื่นๆ") + "</span>";

        return `
          <tr class="border-b hover:bg-gray-50">
            <td class="p-2 text-sm">${formattedDate}</td>
            <td class="p-2 text-sm">
              <div>${categoryLabel}</div>
              ${subcategoryLabel ? `<div class="text-xs text-gray-500">${subcategoryLabel}</div>` : ""}
            </td>
            <td class="p-2 text-sm">
              <div class="font-medium">${expense.description || "-"}</div>
              ${expense.notes ? `<div class="text-xs text-gray-500">${expense.notes}</div>` : ""}
            </td>
            <td class="p-2 text-sm text-right font-semibold">฿${parseFloat(expense.amount || 0).toFixed(2)}</td>
            <td class="p-2 text-sm">${expense.vendor || "-"}</td>
            <td class="p-2 text-sm">${paymentLabel}</td>
            <td class="p-2 text-sm">
              <div>${expense.created_by_name || "Unknown"}</div>
              <div class="text-xs text-gray-500">${new Date(expense.created_at).toLocaleDateString("th-TH")}</div>
            </td>
            <td class="p-2 text-sm text-xs text-gray-500">${formattedUpdated}</td>
            <td class="p-2 text-sm">${statusBadge}</td>
          </tr>
        `;
      }).join("");
    }

    // Update pagination
    updateExpensesPagination();
  } catch (error) {
    console.error("Error loading expenses history:", error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center p-8 text-red-500">
          เกิดข้อผิดพลาด: ${error.message}
        </td>
      </tr>
    `;
  }
}

function updateExpensesPagination() {
  const totalPages = Math.max(1, Math.ceil(expensesHistoryState.total / expensesHistoryState.pageSize));
  const pageInfo = document.getElementById("expenses-page-info");
  const prevBtn = document.getElementById("expenses-prev");
  const nextBtn = document.getElementById("expenses-next");

  if (pageInfo) {
    pageInfo.textContent = `หน้า ${expensesHistoryState.page} จาก ${totalPages} (ทั้งหมด ${expensesHistoryState.total} รายการ)`;
  }

  if (prevBtn) {
    prevBtn.disabled = expensesHistoryState.page <= 1;
    if (expensesHistoryState.page <= 1) {
      prevBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      prevBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }
  
  if (nextBtn) {
    nextBtn.disabled = expensesHistoryState.page >= totalPages;
    if (expensesHistoryState.page >= totalPages) {
      nextBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      nextBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }
}

function expensesPrevPage() {
  if (expensesHistoryState.page > 1) {
    expensesHistoryState.page--;
    loadExpensesHistory();
  }
}

function expensesNextPage() {
  const totalPages = Math.max(1, Math.ceil(expensesHistoryState.total / expensesHistoryState.pageSize));
  if (expensesHistoryState.page < totalPages) {
    expensesHistoryState.page++;
    loadExpensesHistory();
  }
}

// Labor modal functions
function openLaborModal() {
  const modal = document.getElementById("labor-modal");
  if (modal) {
    modal.classList.remove("hidden");
    document.getElementById("labor-date").value = new Date().toISOString().split('T')[0];
    document.getElementById("labor-total").textContent = "฿0.00";
  }
}
function closeLaborModal() {
  document.getElementById("labor-modal")?.classList.add("hidden");
}

// ---------- Backfill Expenses Panel ----------
async function showBackfillPanel() {
  logger.info("UI", "Opening backfill panel");

  const backfillModal = document.createElement("div");
  backfillModal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  backfillModal.innerHTML = `
    <div class="card max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">📥 Backfill Expenses</h3>
        <button onclick="this.closest('.fixed').remove()" class="btn ghost">✕</button>
      </div>
      
      <div class="space-y-4">
        <div class="card bg-blue-50">
          <h4 class="font-semibold mb-2">📊 Import from Google Sheets</h4>
          <p class="text-sm text-gray-600 mb-4">
            Import expenses from your Google Sheet. Make sure to copy the data in the correct format:
          </p>
          <textarea
            id="sheets-data"
            class="w-full p-2 border rounded"
            rows="10"
            placeholder='Paste Google Sheets data here (CSV format):\nวันที่,ชื่อค่าใช้จ่าย,จำนวนค่าใช้จ่าย,กลุ่มค่าใช้จ่าย\n27-Aug-2025,สูตรน้ำจิ้ม 1,349,อื่นๆ\n27-Aug-2025,เครื่องปั่น,2241,ค่าพนักงาน'
          ></textarea>
          <button
            onclick="importFromSheets()"
            class="btn brand mt-2 w-full"
          >
            📥 Import from Sheets Data
          </button>
        </div>

        <div class="card bg-green-50">
          <h4 class="font-semibold mb-2">📱 Process Old LINE Messages</h4>
          <p class="text-sm text-gray-600 mb-4">
            Process all unprocessed LINE messages and extract expenses automatically.
          </p>
          <button
            onclick="processOldMessages()"
            class="btn brand w-full"
          >
            🔄 Process Old Messages
          </button>
        </div>

        <div id="backfill-results" class="hidden">
          <div class="card bg-gray-50">
            <h4 class="font-semibold mb-2">📊 Results</h4>
            <pre id="backfill-output" class="text-xs bg-white p-2 rounded overflow-auto"></pre>
          </div>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button onclick="this.closest('.fixed').remove()" class="btn ghost">✕ Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(backfillModal);
}

async function importFromSheets() {
  const textarea = document.getElementById("sheets-data");
  const data = textarea.value.trim();
  
  if (!data) {
    alert("Please paste the Google Sheets data first");
    return;
  }

  try {
    // Parse CSV data
    const lines = data.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const expenses = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 3) {
        const expense = {};
        headers.forEach((header, idx) => {
          expense[header] = values[idx] || '';
        });
        expenses.push(expense);
      }
    }

    if (expenses.length === 0) {
      alert("No valid expenses found in the data");
      return;
    }

    const resultsDiv = document.getElementById("backfill-results");
    const outputDiv = document.getElementById("backfill-output");
    resultsDiv.classList.remove("hidden");
    outputDiv.textContent = `Processing ${expenses.length} expenses...`;

    if (window.backfillExpenses && window.backfillExpenses.fromGoogleSheets) {
      const results = await window.backfillExpenses.fromGoogleSheets(expenses);
      outputDiv.textContent = JSON.stringify(results, null, 2);
      alert(`Import complete!\n✅ Imported: ${results.imported}\n↩️ Skipped (duplicates): ${results.skipped}\n❌ Errors: ${results.errors}`);
    } else {
      throw new Error("Backfill functions not loaded. Please refresh the page.");
    }
  } catch (error) {
    console.error("Import error:", error);
    alert("Error importing expenses: " + error.message);
  }
}

async function processOldMessages() {
  const resultsDiv = document.getElementById("backfill-results");
  const outputDiv = document.getElementById("backfill-output");
  resultsDiv.classList.remove("hidden");
  outputDiv.textContent = "Processing old LINE messages...";

  try {
    if (window.backfillExpenses && window.backfillExpenses.processOldLineMessages) {
      const results = await window.backfillExpenses.processOldLineMessages();
      outputDiv.textContent = JSON.stringify(results, null, 2);
      alert(`Processing complete!\n✅ Processed: ${results.processed}\n💰 Expenses found: ${results.expensesFound}\n❌ Errors: ${results.errors}`);
    } else {
      throw new Error("Backfill functions not loaded. Please refresh the page.");
    }
  } catch (error) {
    console.error("Processing error:", error);
    alert("Error processing messages: " + error.message);
  }
}


