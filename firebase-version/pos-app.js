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
document.addEventListener("DOMContentLoaded", function () {
  logger.info("APP", "DOM Content Loaded, starting initialization...");
  const initTimer = perf.start("app_initialization");

  try {
    // Initialize UI elements
    logger.ui("Initializing event listeners...");
    initializeEventListeners();

    // Check Supabase connection
    logger.db("Checking Supabase connection...");
    checkSupabaseConnection();

    // Set up auth state listener
    if (window.POS && window.POS.auth) {
      logger.auth("Setting up auth state listener...");
      window.POS.auth.onAuthStateChanged(handleAuthStateChange);
    } else {
      logger.error(
        "APP",
        "POS auth not available",
        new Error("Authentication system not loaded"),
      );
      showError("Authentication system not loaded");
    }

    appState.initialized = true;
    initTimer();
    logger.info("APP", "Application initialization completed successfully");
  } catch (error) {
    logger.error("APP", "Application initialization failed", error);
    initTimer();
  }
});

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
    logger.auth("User signed in successfully", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      lastSignInTime: user.metadata.lastSignInTime,
      creationTime: user.metadata.creationTime,
    });

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
  const originalText = btn.innerHTML;

  try {
    logger.auth("Starting Google sign-in process");

    // Show loading state
    btn.innerHTML =
      '<div class="spinner" style="width:20px;height:20px;"></div> Signing in...';
    btn.disabled = true;

    if (!window.POS || !window.POS.auth) {
      throw new Error("Authentication not available");
    }

    logger.auth("Calling Supabase Google sign-in...");
    const result = await window.POS.auth.signInWithGoogle();

    googleTimer();
    logger.auth("Google sign-in successful", {
      user: result.user
        ? {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
          }
        : null,
      credential: result.credential ? "present" : "absent",
    });
  } catch (error) {
    googleTimer();
    logger.error("AUTH", "Google sign-in failed", error);
    showError("Google sign-in failed: " + error.message);

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
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("pos-app").classList.add("hidden");
}

function showMainApp() {
  logger.ui("Showing main POS application");
  appState.currentView = "main";
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("pos-app").classList.remove("hidden");
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
async function loadInitialData() {
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

      html += `
                <div class="flex justify-between items-center p-2 border-b">
                    <span>${icon} ${transaction.item_name || transaction.menu_name || "N/A"}</span>
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

    logger.info("LINE", "Line Bot integration initialized");
  }

  setupWebhook() {
    // This would typically be handled by a backend service
    // For frontend demonstration, we'll simulate the functionality
    logger.info("LINE", "Webhook listener setup completed");
  }

  async processMessage(message, source) {
    const processTimer = perf.start("process_line_message");
    logger.info("LINE", "Processing Line message", { message, source });

    try {
      // Check if message contains slip or purchase information
      if (this.isPurchaseSlip(message)) {
        await this.processSlipPurchase(message);
      } else if (this.isPurchaseText(message)) {
        await this.processTextPurchase(message);
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

  async replyMessage(message) {
    // Simulate Line reply - in production this would call Line API
    logger.info("LINE", "Reply message prepared", { message });
    showToast(`Line Bot: ${message}`);
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
    // Configuration - these should be set in your Firebase Functions or environment
    window.lineBot.channelAccessToken = "YOUR_LINE_CHANNEL_ACCESS_TOKEN"; // Replace with your Line channel access token
    window.lineBot.webhookUrl = "YOUR_WEBHOOK_URL"; // Replace with your webhook URL
    window.lineBot.groupId = "YOUR_LINE_GROUP_ID"; // Replace with your Line group ID

    await window.lineBot.initialize();

    lineTimer();
    logger.info("LINE", "Line Bot initialized successfully", {
      connected: true,
      webhookConfigured: !!window.lineBot.webhookUrl,
    });

    showToast("💬 Line Bot initialized successfully");
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
  }
});

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
