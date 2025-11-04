/**
 * Optimized State Manager for POS System
 * Centralized state management with reactive updates and persistence
 */

import { logError, logWarn, logInfo, logDebug, safeJsonParse, safeJsonStringify, deepClone } from '../utils/utils.js';
import { cacheManager } from './CacheManager.js';

/**
 * State Manager with reactive patterns
 */
export class StateManager {
  constructor(options = {}) {
    this.state = {};
    this.listeners = new Map();
    this.middleware = [];
    this.history = [];
    this.maxHistorySize = options.maxHistorySize || 50;
    this.persistenceKey = options.persistenceKey || 'pos_state';
    this.autoPersist = options.autoPersist !== false;
    this.batchTimeout = null;
    this.batchedUpdates = [];

    // Initialize with default state
    this.initializeDefaultState();

    // Load persisted state if available
    if (this.autoPersist) {
      this.loadPersistedState();
    }

    // Start batch processing
    this.startBatchProcessing();
  }

  /**
   * Initialize default application state
   */
  initializeDefaultState() {
    this.state = {
      // User and session state
      user: {
        id: null,
        name: null,
        permissions: [],
        preferences: {}
      },
      session: {
        id: this.generateSessionId(),
        startTime: Date.now(),
        lastActivity: Date.now()
      },

      // Data state
      data: {
        ingredients: [],
        menus: [],
        platforms: [],
        purchases: [],
        sales: [],
        lowStock: [],
        todaySummary: null,
        lastSync: null
      },

      // UI state
      ui: {
        currentScreen: 'dashboard',
        sidebarOpen: false,
        theme: 'light',
        language: 'th',
        loading: false,
        errors: [],
        notifications: []
      },

      // Form state
      forms: {
        purchase: {
          ingredient_id: '',
          quantity: '',
          unit: '',
          price: '',
          supplier_note: ''
        },
        sale: {
          platform: '',
          menu_id: '',
          quantity: '',
          price: ''
        }
      },

      // Cache state
      cache: {
        ingredients: null,
        menus: null,
        lastFetch: null,
        dirty: false
      },

      // Performance state
      performance: {
        apiCalls: 0,
        cacheHits: 0,
        averageResponseTime: 0,
        errors: 0
      }
    };
  }

  /**
   * Get current state or specific slice
   * @param {string} path - State path (optional)
   * @param {*} defaultValue - Default value if path not found
   * @returns {*} State value
   */
  getState(path = null, defaultValue = null) {
    if (!path) {
      return deepClone(this.state);
    }

    return this.getNestedValue(this.state, path, defaultValue);
  }

  /**
   * Update state with automatic reactivity
   * @param {string|Object} pathOrState - State path or state object
   * @param {*} value - Value to set (if path provided)
   * @param {Object} options - Update options
   */
  setState(pathOrState, value = null, options = {}) {
    const { silent = false, persist = true, batch = false } = options;

    if (typeof pathOrState === 'object' && pathOrState !== null) {
      // Batch update with object
      const updates = pathOrState;

      if (batch) {
        this.batchedUpdates.push({ updates, silent, persist });
        this.scheduleBatchUpdate();
      } else {
        this.performBatchUpdate(updates, silent, persist);
      }
    } else {
      // Single path update
      const update = { [pathOrState]: value };

      if (batch) {
        this.batchedUpdates.push({ updates: update, silent, persist });
        this.scheduleBatchUpdate();
      } else {
        this.performUpdate(pathOrState, value, silent, persist);
      }
    }
  }

  /**
   * Perform actual state update
   * @param {string} path - State path
   * @param {*} value - New value
   * @param {boolean} silent - Skip notifications
   * @param {boolean} persist - Persist to storage
   */
  performUpdate(path, value, silent = false, persist = true) {
    const oldValue = this.getNestedValue(this.state, path);
    const newValue = deepClone(value);

    // Apply middleware
    let finalValue = newValue;
    for (const middleware of this.middleware) {
      try {
        finalValue = middleware(path, finalValue, oldValue, this.state);
      } catch (error) {
        logError('State middleware error:', { path, error: error.message });
      }
    }

    // Update state
    this.setNestedValue(this.state, path, finalValue);

    // Add to history
    this.addToHistory(path, oldValue, finalValue);

    // Update session activity
    this.state.session.lastActivity = Date.now();

    // Persist if enabled
    if (persist && this.autoPersist) {
      this.persistState();
    }

    // Notify listeners
    if (!silent) {
      this.notifyListeners(path, finalValue, oldValue);
    }

    logDebug('State updated:', { path, oldValue, finalValue });
  }

  /**
   * Perform batch update
   * @param {Object} updates - Updates object
   * @param {boolean} silent - Skip notifications
   * @param {boolean} persist - Persist to storage
   */
  performBatchUpdate(updates, silent = false, persist = true) {
    const changes = [];

    for (const [path, value] of Object.entries(updates)) {
      const oldValue = this.getNestedValue(this.state, path);
      changes.push({ path, oldValue, newValue: value });
      this.setNestedValue(this.state, path, value);
    }

    // Update session activity
    this.state.session.lastActivity = Date.now();

    // Add to history
    for (const change of changes) {
      this.addToHistory(change.path, change.oldValue, change.newValue);
    }

    // Persist if enabled
    if (persist && this.autoPersist) {
      this.persistState();
    }

    // Notify listeners
    if (!silent) {
      for (const change of changes) {
        this.notifyListeners(change.path, change.newValue, change.oldValue);
      }
    }

    logDebug('Batch state updated:', { changes });
  }

  /**
   * Subscribe to state changes
   * @param {string|Function} pathOrCallback - State path or callback function
   * @param {Function} callback - Callback function (if path provided)
   * @returns {Function} Unsubscribe function
   */
  subscribe(pathOrCallback, callback = null) {
    let path, cb;

    if (typeof pathOrCallback === 'function') {
      // Subscribe to all changes
      path = '*';
      cb = pathOrCallback;
    } else {
      // Subscribe to specific path
      path = pathOrCallback;
      cb = callback;
    }

    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }

    this.listeners.get(path).add(cb);

    // Return unsubscribe function
    return () => {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        pathListeners.delete(cb);
        if (pathListeners.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }

  /**
   * Add middleware to state updates
   * @param {Function} middleware - Middleware function
   * @returns {Function} Remove middleware function
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);

    return () => {
      const index = this.middleware.indexOf(middleware);
      if (index > -1) {
        this.middleware.splice(index, 1);
      }
    };
  }

  /**
   * Reset state to default or specific value
   * @param {string} path - State path to reset (optional)
   * @param {*} value - Value to set (optional)
   */
  reset(path = null, value = null) {
    if (path) {
      if (value !== null) {
        this.setState(path, value);
      } else {
        // Reset to default
        const defaultState = this.getDefaultStateForPath(path);
        if (defaultState !== undefined) {
          this.setState(path, defaultState);
        }
      }
    } else {
      // Reset entire state
      const oldState = deepClone(this.state);
      this.initializeDefaultState();
      this.notifyListeners('*', this.state, oldState);

      if (this.autoPersist) {
        this.persistState();
      }
    }
  }

  /**
   * Get state history
   * @param {string} path - Filter by path (optional)
   * @param {number} limit - Number of entries to return
   * @returns {Array} History entries
   */
  getHistory(path = null, limit = 10) {
    let history = this.history;

    if (path) {
      history = this.history.filter(entry => entry.path === path);
    }

    return history.slice(-limit);
  }

  /**
   * Undo last state change
   * @returns {boolean} True if undo was successful
   */
  undo() {
    if (this.history.length === 0) {
      return false;
    }

    const lastChange = this.history.pop();
    this.setState(lastChange.path, lastChange.oldValue, {
      silent: false,
      persist: true,
      batch: false
    });

    // Remove the undo entry from history
    this.history.pop();

    return true;
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      stateSize: this.calculateStateSize(),
      historySize: this.history.length,
      listenersCount: Array.from(this.listeners.values())
        .reduce((total, set) => total + set.size, 0),
      middlewareCount: this.middleware.length,
      ...this.state.performance
    };
  }

  /**
   * Export state
   * @param {boolean} includeHistory - Include history in export
   * @returns {Object} Exported state
   */
  exportState(includeHistory = false) {
    return {
      state: deepClone(this.state),
      history: includeHistory ? deepClone(this.history) : [],
      timestamp: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Import state
   * @param {Object} exportedState - State to import
   * @param {boolean} merge - Merge with existing state
   */
  importState(exportedState, merge = false) {
    try {
      if (!exportedState || !exportedState.state) {
        throw new Error('Invalid exported state format');
      }

      const oldState = deepClone(this.state);

      if (merge) {
        this.state = this.deepMerge(this.state, exportedState.state);
      } else {
        this.state = deepClone(exportedState.state);
      }

      if (exportedState.history) {
        this.history = deepClone(exportedState.history);
      }

      this.notifyListeners('*', this.state, oldState);

      if (this.autoPersist) {
        this.persistState();
      }

      logInfo('State imported successfully');

    } catch (error) {
      logError('State import failed:', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear all state
   */
  clear() {
    const oldState = deepClone(this.state);
    this.initializeDefaultState();
    this.history = [];
    this.notifyListeners('*', this.state, oldState);

    if (this.autoPersist) {
      this.clearPersistedState();
    }
  }

  // ===== Private Methods =====

  /**
   * Get nested value from state
   * @param {Object} obj - Object to get value from
   * @param {string} path - Path to value
   * @param {*} defaultValue - Default value
   * @returns {*} Value at path
   */
  getNestedValue(obj, path, defaultValue = null) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Set nested value in state
   * @param {Object} obj - Object to set value in
   * @param {string} path - Path to set
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = deepClone(target);

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = deepClone(source[key]);
        }
      }
    }

    return result;
  }

  /**
   * Notify listeners of state changes
   * @param {string} path - Changed path
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  notifyListeners(path, newValue, oldValue) {
    // Notify specific path listeners
    const pathListeners = this.listeners.get(path);
    if (pathListeners) {
      pathListeners.forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          logError('State listener error:', { path, error: error.message });
        }
      });
    }

    // Notify global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          logError('Global state listener error:', { path, error: error.message });
        }
      });
    }
  }

  /**
   * Add change to history
   * @param {string} path - Changed path
   * @param {*} oldValue - Old value
   * @param {*} newValue - New value
   */
  addToHistory(path, oldValue, newValue) {
    this.history.push({
      path,
      oldValue: deepClone(oldValue),
      newValue: deepClone(newValue),
      timestamp: Date.now()
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Schedule batch update
   */
  scheduleBatchUpdate() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flushBatchedUpdates();
    }, 16); // ~60fps
  }

  /**
   * Flush all batched updates
   */
  flushBatchedUpdates() {
    if (this.batchedUpdates.length === 0) {
      return;
    }

    const updates = {};
    let silent = true;
    let persist = true;

    // Combine all batched updates
    for (const batchUpdate of this.batchedUpdates) {
      Object.assign(updates, batchUpdate.updates);
      silent = silent && batchUpdate.silent;
      persist = persist && batchUpdate.persist;
    }

    this.performBatchUpdate(updates, silent, persist);
    this.batchedUpdates = [];
  }

  /**
   * Start batch processing
   */
  startBatchProcessing() {
    // Process batched updates on each animation frame
    if (typeof requestAnimationFrame !== 'undefined') {
      const processBatch = () => {
        this.flushBatchedUpdates();
        requestAnimationFrame(processBatch);
      };
      requestAnimationFrame(processBatch);
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default state for specific path
   * @param {string} path - State path
   * @returns {*} Default value
   */
  getDefaultStateForPath(path) {
    const defaultState = {};
    this.initializeDefaultState();
    return this.getNestedValue(defaultState, path);
  }

  /**
   * Calculate state size in bytes
   * @returns {number} State size in bytes
   */
  calculateStateSize() {
    return new Blob([safeJsonStringify(this.state)]).size;
  }

  /**
   * Persist state to storage
   */
  async persistState() {
    try {
      await cacheManager.set(this.persistenceKey, this.state, {
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      });
    } catch (error) {
      logError('State persistence failed:', { error: error.message });
    }
  }

  /**
   * Load persisted state from storage
   */
  async loadPersistedState() {
    try {
      const persistedState = await cacheManager.get(this.persistenceKey);
      if (persistedState) {
        this.state = this.deepMerge(this.state, persistedState);
        logInfo('Persisted state loaded successfully');
      }
    } catch (error) {
      logError('Failed to load persisted state:', { error: error.message });
    }
  }

  /**
   * Clear persisted state
   */
  async clearPersistedState() {
    try {
      await cacheManager.remove(this.persistenceKey);
    } catch (error) {
      logError('Failed to clear persisted state:', { error: error.message });
    }
  }
}

// Create singleton instance
export const stateManager = new StateManager();

// Export for use in other modules
export default stateManager;

// Common state selectors
export const selectors = {
  getUser: state => state.user,
  getData: state => state.data,
  getUI: state => state.ui,
  getForms: state => state.forms,
  getCache: state => state.cache,
  getPerformance: state => state.performance,
  isAuthenticated: state => !!state.user.id,
  isLoading: state => state.ui.loading,
  hasErrors: state => state.ui.errors.length > 0,
  lowStockCount: state => state.data.lowStock?.length || 0
};

// Common state actions
export const actions = {
  setLoading: (loading) => stateManager.setState('ui.loading', loading),
  addError: (error) => {
    const errors = stateManager.getState('ui.errors', []);
    stateManager.setState('ui.errors', [...errors, error]);
  },
  clearErrors: () => stateManager.setState('ui.errors', []),
  setCurrentScreen: (screen) => stateManager.setState('ui.currentScreen', screen),
  updateData: (data) => stateManager.setState('data', data),
  updateCache: (cache) => stateManager.setState('cache', cache),
  updateUser: (user) => stateManager.setState('user', user)
};
