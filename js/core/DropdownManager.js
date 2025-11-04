/**
 * DropdownManager - Centralized manager for all dropdown operations
 * 
 * This class provides comprehensive dropdown functionality for the POS system including:
 * - Automatic data fetching from Google Apps Script backend
 * - Intelligent caching with 5-minute TTL
 * - Offline support using cached data
 * - Error handling with user-friendly Thai messages
 * - Retry mechanisms with exponential backoff
 * - Performance optimizations for large datasets
 * - Time-based preloading
 * - Auto-population of related fields
 * 
 * @example Basic Usage:
 * ```javascript
 * const dropdownManager = new DropdownManager(cacheManager);
 * 
 * // Populate ingredient dropdown
 * await dropdownManager.populateIngredients(document.getElementById('p_ing'));
 * 
 * // Set up auto-population when ingredient changes
 * dropdownManager.onIngredientChange(document.getElementById('p_ing'), (ingredient) => {
 *   document.getElementById('p_unit').value = ingredient.buyUnit;
 * });
 * ```
 * 
 * @example Advanced Usage:
 * ```javascript
 * // Initialize preloading
 * dropdownManager.initializePreloading({ enabled: true });
 * 
 * // Handle large datasets with optimization
 * await dropdownManager.populateOptimized(selectElement, largeDataArray, {
 *   threshold: 100,
 *   enableSearch: true,
 *   batchSize: 50
 * });
 * 
 * // Manual retry all failed dropdowns
 * const results = await dropdownManager.retryAllFailed();
 * ```
 * 
 * @author POS System Development Team
 * @version 1.0.0
 * @since 2024
 */
class DropdownManager {
  constructor(cacheManager) {
    // Reference to CacheManager for caching operations
    this.cacheManager = cacheManager;
    
    // Cache version for handling data structure changes
    this.CACHE_VERSION = '1.0.0';
    this.CACHE_VERSION_KEY = 'dropdown_cache_version';
    
    // Cache keys for different data types
    this.CACHE_KEYS = {
      INGREDIENTS: 'dropdown_ingredients',
      MENUS: 'dropdown_menus',
      PLATFORMS: 'dropdown_platforms',
      MENU_INGREDIENTS_PREFIX: 'dropdown_menu_ingredients_'
    };
    
    // Cache TTL (Time To Live) - 5 minutes in milliseconds
    this.CACHE_TTL = 5 * 60 * 1000;
    
    // Internal state management for tracking loaded dropdowns
    this.state = {
      loadingDropdowns: new Set(), // Track which dropdowns are currently loading
      loadedDropdowns: new Map(),  // Track which dropdowns have been loaded
      errorDropdowns: new Map(),   // Track dropdowns with errors
      isOffline: false,            // Track offline status
      usingCachedData: new Set()   // Track which dropdowns are using cached data
    };
    
    // Retry configuration
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY_BASE = 1000; // Base delay for exponential backoff
    
    // Predefined units for unit dropdowns
    this.UNITS = {
      weight: ['kg', 'g', 'mg'],
      volume: ['l', 'ml'],
      piece: ['piece', 'pack', 'box'],
      all: ['kg', 'g', 'mg', 'l', 'ml', 'piece', 'pack', 'box']
    };
    
    // Predefined platforms (can be overridden by backend data)
    this.DEFAULT_PLATFORMS = [
      { id: 'walkin', name: 'Walk-in' },
      { id: 'grab', name: 'Grab' },
      { id: 'lineman', name: 'Line Man' },
      { id: 'shopee', name: 'Shopee Food' },
      { id: 'foodpanda', name: 'Foodpanda' }
    ];
    
    // Set up online/offline event listeners
    this._setupOfflineDetection();
    
    // Initialize cache versioning
    this._initializeCacheVersioning();
  }
  
  /**
   * Set up online/offline event listeners
   * @private
   */
  _setupOfflineDetection() {
    if (typeof window !== 'undefined') {
      // Initial state
      this.state.isOffline = !navigator.onLine;
      
      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('Connection restored - now online');
        this.state.isOffline = false;
        this._onConnectionRestored();
      });
      
      window.addEventListener('offline', () => {
        console.log('Connection lost - now offline');
        this.state.isOffline = true;
      });
    }
  }
  
  /**
   * Handle connection restoration
   * @private
   */
  async _onConnectionRestored() {
    // Optionally refresh data that was loaded from expired cache while offline
    console.log('Connection restored, cached data can be refreshed on next request');
  }
  
  /**
   * Check if currently online
   * @returns {boolean} True if online
   */
  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
  
  /**
   * Check if currently offline
   * @returns {boolean} True if offline
   */
  isOffline() {
    return !this.isOnline();
  }
  
  /**
   * Initialize cache versioning and clear old cache if version changed
   * @private
   */
  async _initializeCacheVersioning() {
    try {
      // Check stored cache version in localStorage
      const storedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
      
      if (storedVersion !== this.CACHE_VERSION) {
        console.log(`Cache version mismatch (stored: ${storedVersion}, current: ${this.CACHE_VERSION}). Clearing cache...`);
        
        // Clear all dropdown cache due to version change
        await this.clearCache();
        
        // Update stored version
        localStorage.setItem(this.CACHE_VERSION_KEY, this.CACHE_VERSION);
        
        console.log('Cache cleared and version updated');
      } else {
        console.log('Cache version matches, using existing cache');
      }
    } catch (error) {
      console.warn('Failed to initialize cache versioning:', error);
    }
  }
  
  /**
   * Load cached data from localStorage on initialization
   * This ensures dropdown data persists across sessions
   * @private
   */
  async _loadPersistedCache() {
    try {
      // The CacheManager already handles persistence through IndexedDB
      // This method is here for potential future enhancements
      console.log('Persisted cache loaded from IndexedDB via CacheManager');
    } catch (error) {
      console.warn('Failed to load persisted cache:', error);
    }
  }
  
  /**
   * Get cache version information
   * @returns {Object} Cache version info
   */
  getCacheVersionInfo() {
    const storedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
    return {
      currentVersion: this.CACHE_VERSION,
      storedVersion: storedVersion,
      isUpToDate: storedVersion === this.CACHE_VERSION
    };
  }
  
  /**
   * Manually update cache version (useful for testing or forced updates)
   * @param {string} newVersion - New version string
   */
  async updateCacheVersion(newVersion) {
    if (newVersion !== this.CACHE_VERSION) {
      console.log(`Updating cache version from ${this.CACHE_VERSION} to ${newVersion}`);
      this.CACHE_VERSION = newVersion;
      await this._initializeCacheVersioning();
    }
  }

  /**
   * Get ingredients with caching
   * @param {boolean} forceRefresh - Force refresh from backend, bypassing cache
   * @returns {Promise<Array>} Array of ingredient objects
   */
  async getIngredients(forceRefresh = false) {
    const cacheKey = this.CACHE_KEYS.INGREDIENTS;
    
    // If offline, always use cached data (even if expired)
    if (this.isOffline()) {
      const cached = await this._getCachedDataIgnoreExpiration(cacheKey, 'ingredients');
      if (cached) {
        console.log('Using cached ingredients (offline mode)');
        this.state.usingCachedData.add('ingredients');
        return cached;
      }
      throw new Error('No cached data available while offline');
    }
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cached = await this.cacheManager.get(cacheKey, 'ingredients');
      if (cached) {
        this.state.usingCachedData.delete('ingredients');
        return cached;
      }
    }
    
    // Fetch from backend with retry logic
    try {
      const data = await this._fetchWithRetry(
        () => this._callBackend('getIngredients'),
        'ingredients'
      );
      
      // Cache the result
      if (data && data.length > 0) {
        await this.cacheManager.set(cacheKey, data, 'ingredients', this.CACHE_TTL);
      }
      
      this.state.usingCachedData.delete('ingredients');
      return data || [];
    } catch (error) {
      // If fetch fails, try to use cached data even if expired
      console.warn('Failed to fetch ingredients, attempting to use cached data:', error);
      const cached = await this._getCachedDataIgnoreExpiration(cacheKey, 'ingredients');
      if (cached) {
        console.log('Using expired cached ingredients due to fetch failure');
        this.state.usingCachedData.add('ingredients');
        return cached;
      }
      throw error;
    }
  }
  
  /**
   * Get menus with caching
   * @param {boolean} forceRefresh - Force refresh from backend, bypassing cache
   * @returns {Promise<Array>} Array of menu objects
   */
  async getMenus(forceRefresh = false) {
    const cacheKey = this.CACHE_KEYS.MENUS;
    
    // If offline, always use cached data (even if expired)
    if (this.isOffline()) {
      const cached = await this._getCachedDataIgnoreExpiration(cacheKey, 'menus');
      if (cached) {
        console.log('Using cached menus (offline mode)');
        this.state.usingCachedData.add('menus');
        return cached;
      }
      throw new Error('No cached data available while offline');
    }
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cached = await this.cacheManager.get(cacheKey, 'menus');
      if (cached) {
        this.state.usingCachedData.delete('menus');
        return cached;
      }
    }
    
    // Fetch from backend with retry logic
    try {
      const data = await this._fetchWithRetry(
        () => this._callBackend('getMenus'),
        'menus'
      );
      
      // Cache the result
      if (data && data.length > 0) {
        await this.cacheManager.set(cacheKey, data, 'menus', this.CACHE_TTL);
      }
      
      this.state.usingCachedData.delete('menus');
      return data || [];
    } catch (error) {
      // If fetch fails, try to use cached data even if expired
      console.warn('Failed to fetch menus, attempting to use cached data:', error);
      const cached = await this._getCachedDataIgnoreExpiration(cacheKey, 'menus');
      if (cached) {
        console.log('Using expired cached menus due to fetch failure');
        this.state.usingCachedData.add('menus');
        return cached;
      }
      throw error;
    }
  }
  
  /**
   * Get ingredients for a specific menu with caching
   * @param {string} menuId - Menu ID
   * @returns {Promise<Array>} Array of menu ingredient objects
   */
  async getMenuIngredients(menuId) {
    if (!menuId) {
      return [];
    }
    
    const cacheKey = this.CACHE_KEYS.MENU_INGREDIENTS_PREFIX + menuId;
    
    // If offline, always use cached data (even if expired)
    if (this.isOffline()) {
      const cached = await this._getCachedDataIgnoreExpiration(cacheKey, 'menus');
      if (cached) {
        console.log(`Using cached menu ingredients for ${menuId} (offline mode)`);
        this.state.usingCachedData.add(`menu_ingredients_${menuId}`);
        return cached;
      }
      throw new Error('No cached data available while offline');
    }
    
    // Check cache first
    const cached = await this.cacheManager.get(cacheKey, 'menus');
    if (cached) {
      this.state.usingCachedData.delete(`menu_ingredients_${menuId}`);
      return cached;
    }
    
    // Fetch from backend with retry logic
    try {
      const data = await this._fetchWithRetry(
        () => this._callBackend('getMenuIngredients', menuId),
        'menu_ingredients'
      );
      
      // Cache the result
      if (data && data.length > 0) {
        await this.cacheManager.set(cacheKey, data, 'menus', this.CACHE_TTL);
      }
      
      this.state.usingCachedData.delete(`menu_ingredients_${menuId}`);
      return data || [];
    } catch (error) {
      // If fetch fails, try to use cached data even if expired
      console.warn(`Failed to fetch menu ingredients for ${menuId}, attempting to use cached data:`, error);
      const cached = await this._getCachedDataIgnoreExpiration(cacheKey, 'menus');
      if (cached) {
        console.log(`Using expired cached menu ingredients for ${menuId} due to fetch failure`);
        this.state.usingCachedData.add(`menu_ingredients_${menuId}`);
        return cached;
      }
      throw error;
    }
  }
  
  /**
   * Get platforms (can be hardcoded or fetched from backend)
   * @returns {Promise<Array>} Array of platform objects
   */
  async getPlatforms() {
    const cacheKey = this.CACHE_KEYS.PLATFORMS;
    
    // Check cache first
    const cached = await this.cacheManager.get(cacheKey, 'default');
    if (cached) {
      return cached;
    }
    
    // Try to fetch from backend, fallback to default platforms
    try {
      const data = await this._callBackend('getPlatforms');
      if (data && data.length > 0) {
        await this.cacheManager.set(cacheKey, data, 'default', this.CACHE_TTL);
        return data;
      }
    } catch (error) {
      console.warn('Failed to fetch platforms from backend, using defaults:', error);
    }
    
    // Use default platforms
    await this.cacheManager.set(cacheKey, this.DEFAULT_PLATFORMS, 'default', this.CACHE_TTL);
    return this.DEFAULT_PLATFORMS;
  }
  
  /**
   * Fetch data with retry logic and exponential backoff
   * @private
   * @param {Function} fetchFunction - Function that performs the fetch
   * @param {string} dataType - Type of data being fetched (for logging)
   * @param {Object} options - Retry options
   * @param {number} options.maxRetries - Maximum number of retries (default: this.MAX_RETRIES)
   * @param {number} options.baseDelay - Base delay for exponential backoff (default: this.RETRY_DELAY_BASE)
   * @param {Function} options.onRetry - Callback called before each retry
   * @returns {Promise<any>} Fetched data
   */
  async _fetchWithRetry(fetchFunction, dataType, options = {}) {
    const {
      maxRetries = this.MAX_RETRIES,
      baseDelay = this.RETRY_DELAY_BASE,
      onRetry = null
    } = options;
    
    let lastError = null;
    const retryableErrors = ['network', 'timeout', 'fetch', 'connection'];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
        });
        
        const fetchPromise = fetchFunction();
        const data = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Log successful retry if this wasn't the first attempt
        if (attempt > 0) {
          console.log(`✅ Successfully fetched ${dataType} on attempt ${attempt + 1}`);
        }
        
        return data;
        
      } catch (error) {
        lastError = error;
        const errorMessage = error.message.toLowerCase();
        
        console.warn(`❌ Fetch attempt ${attempt + 1}/${maxRetries} failed for ${dataType}:`, error.message);
        
        // Check if error is retryable
        const isRetryable = retryableErrors.some(keyword => errorMessage.includes(keyword));
        
        // Don't retry on last attempt or non-retryable errors
        if (attempt >= maxRetries - 1 || !isRetryable) {
          break;
        }
        
        // Calculate delay with jitter to prevent thundering herd
        const baseDelayMs = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * baseDelayMs; // Add up to 10% jitter
        const delayMs = Math.min(baseDelayMs + jitter, 10000); // Cap at 10 seconds
        
        console.log(`⏳ Retrying ${dataType} in ${Math.round(delayMs)}ms...`);
        
        // Call retry callback if provided
        if (onRetry && typeof onRetry === 'function') {
          try {
            await onRetry(attempt + 1, error, delayMs);
          } catch (callbackError) {
            console.warn('Error in retry callback:', callbackError);
          }
        }
        
        await this._delay(delayMs);
      }
    }
    
    // All retries failed or error is not retryable
    const finalError = new Error(
      `Failed to fetch ${dataType} after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
    finalError.originalError = lastError;
    finalError.dataType = dataType;
    finalError.attempts = maxRetries;
    
    throw finalError;
  }
  
  /**
   * Call backend function via google.script.run
   * @private
   * @param {string} functionName - Name of the backend function
   * @param {...any} args - Arguments to pass to the function
   * @returns {Promise<any>} Result from backend
   */
  _callBackend(functionName, ...args) {
    return new Promise((resolve, reject) => {
      // Check if google.script.run is available
      if (typeof google === 'undefined' || !google.script || !google.script.run) {
        reject(new Error('Google Apps Script API not available'));
        return;
      }
      
      // Set up success and failure handlers
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [functionName](...args);
    });
  }
  
  /**
   * Delay helper for retry logic
   * @private
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get cached data ignoring expiration (for offline mode)
   * @private
   * @param {string} key - Cache key
   * @param {string} dataType - Data type for storage selection
   * @returns {Promise<any>} Cached data or null
   */
  async _getCachedDataIgnoreExpiration(key, dataType) {
    // Try memory cache first
    const memoryData = this.cacheManager.getFromMemory(key);
    if (memoryData && memoryData.value) {
      return memoryData.value;
    }
    
    // Try session storage
    const sessionData = this.cacheManager.getFromSession(key);
    if (sessionData && sessionData.value) {
      return sessionData.value;
    }
    
    // Try IndexedDB
    const dbData = await this.cacheManager.getFromIndexedDB(key, dataType);
    if (dbData && dbData.value) {
      return dbData.value;
    }
    
    return null;
  }

  /**
   * Populate ingredient dropdown with fetched data
   * @param {HTMLSelectElement} selectElement - The select element to populate
   * @param {Object} options - Options for population
   * @param {boolean} options.includePlaceholder - Include "เลือก..." placeholder (default: true)
   * @param {boolean} options.forceRefresh - Force refresh from backend (default: false)
   * @returns {Promise<void>}
   */
  async populateIngredients(selectElement, options = {}) {
    const { includePlaceholder = true, forceRefresh = false } = options;
    
    if (!selectElement) {
      throw new Error('Select element is required');
    }
    
    try {
      // Show loading state
      this.showLoading(selectElement, { message: 'กำลังโหลดวัตถุดิบ...' });
      this.state.loadingDropdowns.add(selectElement.id);
      
      // Fetch ingredients with progress tracking
      const ingredients = await this._fetchWithProgress(
        () => this.getIngredients(forceRefresh),
        'ingredients',
        selectElement
      );
      
      // Clear existing options
      selectElement.innerHTML = '';
      
      // Add placeholder if requested
      if (includePlaceholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        // Show offline indicator if using cached data
        if (this.state.usingCachedData.has('ingredients')) {
          placeholderOption.textContent = '📴 เลือก... (ออฟไลน์)';
        } else {
          placeholderOption.textContent = 'เลือก...';
        }
        selectElement.appendChild(placeholderOption);
      }
      
      // Add ingredient options
      ingredients.forEach(ingredient => {
        const option = document.createElement('option');
        option.value = ingredient.id;
        option.textContent = ingredient.name;
        // Store additional data as data attributes
        option.dataset.stockUnit = ingredient.stock_unit || '';
        option.dataset.buyUnit = ingredient.buy_unit || '';
        option.dataset.buyToStockRatio = ingredient.buy_to_stock_ratio || '';
        selectElement.appendChild(option);
      });
      
      // Add offline class if using cached data
      if (this.state.usingCachedData.has('ingredients')) {
        selectElement.classList.add('dropdown-offline');
      } else {
        selectElement.classList.remove('dropdown-offline');
      }
      
      // Show success feedback
      this.showLoadingSuccess(selectElement, ingredients.length);
      
      // Update state
      this.state.loadedDropdowns.set(selectElement.id, 'ingredients');
      this.state.errorDropdowns.delete(selectElement.id);
      
    } catch (error) {
      console.error('Failed to populate ingredients:', error);
      this.showEnhancedError(selectElement, error, 'ingredients');
      this.state.errorDropdowns.set(selectElement.id, error);
      throw error;
    } finally {
      this.state.loadingDropdowns.delete(selectElement.id);
    }
  }
  
  /**
   * Populate menu dropdown with fetched data
   * @param {HTMLSelectElement} selectElement - The select element to populate
   * @param {Object} options - Options for population
   * @param {boolean} options.includePlaceholder - Include "เลือก..." placeholder (default: true)
   * @param {boolean} options.forceRefresh - Force refresh from backend (default: false)
   * @returns {Promise<void>}
   */
  async populateMenus(selectElement, options = {}) {
    const { includePlaceholder = true, forceRefresh = false } = options;
    
    if (!selectElement) {
      throw new Error('Select element is required');
    }
    
    try {
      // Show loading state
      this.showLoading(selectElement, { message: 'กำลังโหลดเมนู...' });
      this.state.loadingDropdowns.add(selectElement.id);
      
      // Fetch menus with progress tracking
      const menus = await this._fetchWithProgress(
        () => this.getMenus(forceRefresh),
        'menus',
        selectElement
      );
      
      // Clear existing options
      selectElement.innerHTML = '';
      
      // Add placeholder if requested
      if (includePlaceholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        // Show offline indicator if using cached data
        if (this.state.usingCachedData.has('menus')) {
          placeholderOption.textContent = '📴 เลือก... (ออฟไลน์)';
        } else {
          placeholderOption.textContent = 'เลือก...';
        }
        selectElement.appendChild(placeholderOption);
      }
      
      // Add menu options
      menus.forEach(menu => {
        const option = document.createElement('option');
        option.value = menu.id;
        option.textContent = menu.name;
        // Store price as data attribute
        option.dataset.price = menu.price || '';
        selectElement.appendChild(option);
      });
      
      // Add offline class if using cached data
      if (this.state.usingCachedData.has('menus')) {
        selectElement.classList.add('dropdown-offline');
      } else {
        selectElement.classList.remove('dropdown-offline');
      }
      
      // Show success feedback
      this.showLoadingSuccess(selectElement, menus.length);
      
      // Update state
      this.state.loadedDropdowns.set(selectElement.id, 'menus');
      this.state.errorDropdowns.delete(selectElement.id);
      
    } catch (error) {
      console.error('Failed to populate menus:', error);
      this.showEnhancedError(selectElement, error, 'menus');
      this.state.errorDropdowns.set(selectElement.id, error);
      throw error;
    } finally {
      this.state.loadingDropdowns.delete(selectElement.id);
    }
  }
  
  /**
   * Populate platform dropdown
   * @param {HTMLSelectElement} selectElement - The select element to populate
   * @returns {Promise<void>}
   */
  async populatePlatforms(selectElement) {
    if (!selectElement) {
      throw new Error('Select element is required');
    }
    
    try {
      // Show loading state
      this.showLoading(selectElement, { message: 'กำลังโหลดแพลตฟอร์ม...' });
      this.state.loadingDropdowns.add(selectElement.id);
      
      // Fetch platforms with progress tracking
      const platforms = await this._fetchWithProgress(
        () => this.getPlatforms(),
        'platforms',
        selectElement
      );
      
      // Clear existing options
      selectElement.innerHTML = '';
      
      // Add placeholder
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = 'เลือก...';
      selectElement.appendChild(placeholderOption);
      
      // Add platform options
      platforms.forEach(platform => {
        const option = document.createElement('option');
        option.value = platform.id;
        option.textContent = platform.name;
        selectElement.appendChild(option);
      });
      
      // Show success feedback
      this.showLoadingSuccess(selectElement, platforms.length);
      
      // Update state
      this.state.loadedDropdowns.set(selectElement.id, 'platforms');
      this.state.errorDropdowns.delete(selectElement.id);
      
    } catch (error) {
      console.error('Failed to populate platforms:', error);
      this.showEnhancedError(selectElement, error, 'platforms');
      this.state.errorDropdowns.set(selectElement.id, error);
      throw error;
    } finally {
      this.state.loadingDropdowns.delete(selectElement.id);
    }
  }
  
  /**
   * Populate unit dropdown with predefined units
   * @param {HTMLSelectElement} selectElement - The select element to populate
   * @param {string} unitType - Type of units to show ('weight', 'volume', 'piece', 'all')
   * @returns {void}
   */
  populateUnits(selectElement, unitType = 'all') {
    if (!selectElement) {
      throw new Error('Select element is required');
    }
    
    // Get units based on type
    const units = this.UNITS[unitType] || this.UNITS.all;
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Add placeholder
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'เลือก...';
    selectElement.appendChild(placeholderOption);
    
    // Add unit options
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      selectElement.appendChild(option);
    });
    
    // Update state
    this.state.loadedDropdowns.set(selectElement.id, 'units');
  }

  /**
   * Show loading indicator in dropdown with progress feedback
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {Object} options - Loading options
   * @param {string} options.message - Custom loading message
   * @param {boolean} options.showProgress - Show progress indicator
   * @param {number} options.progress - Progress percentage (0-100)
   * @returns {void}
   */
  showLoading(selectElement, options = {}) {
    if (!selectElement) return;
    
    const {
      message = 'กำลังโหลด...',
      showProgress = false,
      progress = 0
    } = options;
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Create animated loading text
    let loadingText = '⏳ ' + message;
    if (showProgress && progress > 0) {
      loadingText += ` (${Math.round(progress)}%)`;
    }
    
    // Add loading option
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = loadingText;
    loadingOption.disabled = true;
    loadingOption.selected = true;
    selectElement.appendChild(loadingOption);
    
    // Disable the select element during loading
    selectElement.disabled = true;
    
    // Add loading class for styling
    selectElement.classList.add('dropdown-loading');
    selectElement.classList.remove('dropdown-error');
    
    // Add loading animation
    this._addLoadingAnimation(selectElement);
    
    // Store loading start time for progress tracking
    selectElement.dataset.loadingStartTime = Date.now().toString();
  }
  
  /**
   * Add loading animation to dropdown
   * @private
   * @param {HTMLSelectElement} selectElement - The select element
   * @returns {void}
   */
  _addLoadingAnimation(selectElement) {
    // Add CSS animation if not exists
    if (!document.getElementById('dropdown-loading-styles')) {
      const style = document.createElement('style');
      style.id = 'dropdown-loading-styles';
      style.textContent = `
        .dropdown-loading {
          position: relative;
          background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%);
          background-size: 200% 100%;
          animation: dropdownShimmer 1.5s infinite;
        }
        
        .dropdown-loading::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 10px;
          width: 16px;
          height: 16px;
          border: 2px solid #dee2e6;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: dropdownSpin 1s linear infinite;
          transform: translateY(-50%);
        }
        
        @keyframes dropdownShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes dropdownSpin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
        
        .dropdown-success {
          background-color: #d4edda !important;
          border-color: #c3e6cb !important;
          animation: dropdownSuccess 0.5s ease-out;
        }
        
        @keyframes dropdownSuccess {
          0% { background-color: #d4edda; transform: scale(1.02); }
          100% { background-color: transparent; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Update loading progress
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Optional progress message
   * @returns {void}
   */
  updateLoadingProgress(selectElement, progress, message = null) {
    if (!selectElement || !selectElement.classList.contains('dropdown-loading')) {
      return;
    }
    
    const loadingOption = selectElement.querySelector('option');
    if (loadingOption) {
      const baseMessage = message || 'กำลังโหลด...';
      loadingOption.textContent = `⏳ ${baseMessage} (${Math.round(progress)}%)`;
    }
  }
  
  /**
   * Show success feedback after successful loading
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {number} itemCount - Number of items loaded
   * @returns {void}
   */
  showLoadingSuccess(selectElement, itemCount = 0) {
    if (!selectElement) return;
    
    // Add success class for animation
    selectElement.classList.add('dropdown-success');
    selectElement.classList.remove('dropdown-loading');
    
    // Show success message briefly
    if (itemCount > 0) {
      const successOption = document.createElement('option');
      successOption.value = '';
      successOption.textContent = `✅ โหลดสำเร็จ (${itemCount} รายการ)`;
      successOption.disabled = true;
      successOption.selected = true;
      
      // Temporarily show success message
      selectElement.innerHTML = '';
      selectElement.appendChild(successOption);
      
      // Remove success message after 1 second
      setTimeout(() => {
        selectElement.classList.remove('dropdown-success');
      }, 1000);
    } else {
      selectElement.classList.remove('dropdown-success');
    }
  }
  
  /**
   * Hide loading indicator from dropdown
   * @param {HTMLSelectElement} selectElement - The select element
   * @returns {void}
   */
  hideLoading(selectElement) {
    if (!selectElement) return;
    
    // Enable the select element
    selectElement.disabled = false;
    
    // Remove loading class
    selectElement.classList.remove('dropdown-loading');
  }
  
  /**
   * Show error state in dropdown with retry option
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {string} message - Error message to display
   * @param {Object} options - Error display options
   * @param {boolean} options.showRetryButton - Show separate retry button (default: false)
   * @param {number} options.retryAttempt - Current retry attempt number (default: 0)
   * @returns {void}
   */
  showError(selectElement, message = 'เกิดข้อผิดพลาด', options = {}) {
    if (!selectElement) return;
    
    const { showRetryButton = false, retryAttempt = 0 } = options;
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Create error message with retry attempt info
    let errorText = `❌ ${message}`;
    if (retryAttempt > 0) {
      errorText += ` (ครั้งที่ ${retryAttempt}/${this.MAX_RETRIES})`;
    }
    errorText += ' - คลิกเพื่อลองใหม่';
    
    // Add error option
    const errorOption = document.createElement('option');
    errorOption.value = '';
    errorOption.textContent = errorText;
    errorOption.disabled = true;
    errorOption.selected = true;
    selectElement.appendChild(errorOption);
    
    // Enable the select element so user can click to retry
    selectElement.disabled = false;
    
    // Add error class for styling
    selectElement.classList.add('dropdown-error');
    selectElement.classList.remove('dropdown-loading');
    
    // Store retry attempt count
    selectElement.dataset.retryAttempt = retryAttempt.toString();
    
    // Add click handler for retry
    const retryHandler = async () => {
      selectElement.removeEventListener('click', retryHandler);
      await this._handleRetry(selectElement);
    };
    
    selectElement.addEventListener('click', retryHandler, { once: true });
    
    // Optionally add separate retry button
    if (showRetryButton) {
      this._addRetryButton(selectElement);
    }
  }
  
  /**
   * Handle retry logic for failed dropdown operations
   * @private
   * @param {HTMLSelectElement} selectElement - The select element
   * @returns {Promise<void>}
   */
  async _handleRetry(selectElement) {
    const currentAttempt = parseInt(selectElement.dataset.retryAttempt || '0');
    const nextAttempt = currentAttempt + 1;
    
    // Check if we've exceeded max retries
    if (nextAttempt > this.MAX_RETRIES) {
      const maxRetriesError = new Error('Maximum retry attempts exceeded');
      this.showEnhancedError(selectElement, maxRetriesError, this._getDropdownTypeFromElement(selectElement), {
        retryAttempt: nextAttempt,
        showHint: true
      });
      return;
    }
    
    selectElement.classList.remove('dropdown-error');
    
    // Determine which type of dropdown to retry
    const dropdownType = this._getDropdownTypeFromElement(selectElement);
    
    try {
      // Add delay before retry (exponential backoff)
      if (nextAttempt > 1) {
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, nextAttempt - 2);
        await this._delay(delay);
      }
      
      switch (dropdownType) {
        case 'ingredients':
          await this.populateIngredients(selectElement, { forceRefresh: true });
          break;
        case 'menus':
          await this.populateMenus(selectElement, { forceRefresh: true });
          break;
        case 'platforms':
          await this.populatePlatforms(selectElement);
          break;
        default:
          console.warn('Unknown dropdown type for retry:', dropdownType);
          throw new Error('Unknown dropdown type');
      }
      
      // Success - clear retry attempt
      delete selectElement.dataset.retryAttempt;
      
    } catch (error) {
      console.error(`Retry attempt ${nextAttempt} failed:`, error);
      
      // Show enhanced error with updated attempt count
      this.showEnhancedError(selectElement, error, dropdownType, {
        retryAttempt: nextAttempt
      });
    }
  }
  
  /**
   * Add a separate retry button next to the dropdown
   * @private
   * @param {HTMLSelectElement} selectElement - The select element
   * @returns {void}
   */
  _addRetryButton(selectElement) {
    // Remove existing retry button if any
    const existingButton = selectElement.parentNode.querySelector('.dropdown-retry-btn');
    if (existingButton) {
      existingButton.remove();
    }
    
    // Create retry button
    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'dropdown-retry-btn';
    retryButton.innerHTML = '🔄 ลองใหม่';
    retryButton.style.cssText = `
      margin-left: 8px;
      padding: 4px 8px;
      border: 1px solid #dc3545;
      background: #fff;
      color: #dc3545;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    
    // Add click handler
    retryButton.addEventListener('click', async () => {
      retryButton.disabled = true;
      retryButton.innerHTML = '⏳ กำลังลองใหม่...';
      
      try {
        await this._handleRetry(selectElement);
        retryButton.remove();
      } catch (error) {
        retryButton.disabled = false;
        retryButton.innerHTML = '🔄 ลองใหม่';
      }
    });
    
    // Insert after the select element
    selectElement.parentNode.insertBefore(retryButton, selectElement.nextSibling);
  }
  
  /**
   * Get dropdown type from element attributes or ID
   * @private
   * @param {HTMLSelectElement} selectElement - The select element
   * @returns {string} Dropdown type
   */
  _getDropdownTypeFromElement(selectElement) {
    // Check data attribute first
    if (selectElement.dataset.dropdownType) {
      return selectElement.dataset.dropdownType;
    }
    
    // Infer from element ID
    const id = selectElement.id.toLowerCase();
    if (id.includes('ing') || id.includes('ingredient')) {
      return 'ingredients';
    } else if (id.includes('menu')) {
      return 'menus';
    } else if (id.includes('platform')) {
      return 'platforms';
    }
    
    // Check from state
    return this.state.loadedDropdowns.get(selectElement.id) || 'unknown';
  }
  
  /**
   * Get user-friendly error message based on error type
   * @private
   * @param {Error} error - The error object
   * @param {string} dataType - Type of data that failed to load
   * @returns {Object} Error message object with message and hint
   */
  _getErrorMessage(error, dataType = '') {
    const message = error.message.toLowerCase();
    const errorMessages = this._getErrorMessages();
    
    // Determine error type
    let errorType = 'unknown';
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      errorType = 'network';
    } else if (message.includes('timeout')) {
      errorType = 'timeout';
    } else if (message.includes('not found') || message.includes('404')) {
      errorType = 'notFound';
    } else if (message.includes('unauthorized') || message.includes('403')) {
      errorType = 'unauthorized';
    } else if (message.includes('server') || message.includes('500')) {
      errorType = 'server';
    } else if (message.includes('offline')) {
      errorType = 'offline';
    } else if (message.includes('empty') || message.includes('no data')) {
      errorType = 'empty';
    }
    
    // Get base error info
    const errorInfo = errorMessages[errorType] || errorMessages.unknown;
    
    // Customize message based on data type
    let customMessage = errorInfo.message;
    let customHint = errorInfo.hint;
    
    if (dataType) {
      const dataTypeMessages = this._getDataTypeMessages();
      const dataTypeInfo = dataTypeMessages[dataType];
      
      if (dataTypeInfo) {
        customMessage = dataTypeInfo.errorPrefix + errorInfo.message;
        customHint = dataTypeInfo.hint || errorInfo.hint;
      }
    }
    
    return {
      message: customMessage,
      hint: customHint,
      type: errorType,
      canRetry: errorInfo.canRetry
    };
  }
  
  /**
   * Get comprehensive error messages in Thai
   * @private
   * @returns {Object} Error messages configuration
   */
  _getErrorMessages() {
    return {
      network: {
        message: 'ไม่สามารถเชื่อมต่อได้',
        hint: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
        canRetry: true
      },
      timeout: {
        message: 'หมดเวลาการเชื่อมต่อ',
        hint: 'การเชื่อมต่อช้าเกินไป กรุณาลองใหม่',
        canRetry: true
      },
      notFound: {
        message: 'ไม่พบข้อมูล',
        hint: 'ข้อมูลอาจถูกลบหรือย้ายแล้ว',
        canRetry: false
      },
      unauthorized: {
        message: 'ไม่มีสิทธิ์เข้าถึง',
        hint: 'กรุณาเข้าสู่ระบบใหม่',
        canRetry: false
      },
      server: {
        message: 'เซิร์ฟเวอร์ขัดข้อง',
        hint: 'ระบบมีปัญหาชั่วคราว กรุณาลองใหม่ในภายหลัง',
        canRetry: true
      },
      offline: {
        message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
        hint: 'กำลังใช้ข้อมูลที่เก็บไว้ในเครื่อง',
        canRetry: true
      },
      empty: {
        message: 'ไม่มีข้อมูล',
        hint: 'ยังไม่มีข้อมูลในระบบ',
        canRetry: false
      },
      unknown: {
        message: 'เกิดข้อผิดพลาด',
        hint: 'กรุณาลองใหม่ หรือติดต่อผู้ดูแลระบบ',
        canRetry: true
      }
    };
  }
  
  /**
   * Get data type specific messages
   * @private
   * @returns {Object} Data type messages configuration
   */
  _getDataTypeMessages() {
    return {
      ingredients: {
        errorPrefix: 'โหลดวัตถุดิบไม่ได้: ',
        hint: 'ตรวจสอบว่ามีข้อมูลวัตถุดิบในระบบ',
        emptyMessage: 'ยังไม่มีวัตถุดิบในระบบ'
      },
      menus: {
        errorPrefix: 'โหลดเมนูไม่ได้: ',
        hint: 'ตรวจสอบว่ามีข้อมูลเมนูในระบบ',
        emptyMessage: 'ยังไม่มีเมนูในระบบ'
      },
      platforms: {
        errorPrefix: 'โหลดแพลตฟอร์มไม่ได้: ',
        hint: 'ระบบจะใช้แพลตฟอร์มเริ่มต้น',
        emptyMessage: 'ใช้แพลตฟอร์มเริ่มต้น'
      },
      menu_ingredients: {
        errorPrefix: 'โหลดส่วนผสมเมนูไม่ได้: ',
        hint: 'ตรวจสอบว่าเมนูนี้มีส่วนผสม',
        emptyMessage: 'เมนูนี้ยังไม่มีส่วนผสม'
      }
    };
  }
  
  /**
   * Show enhanced error with detailed message and hints
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {Error} error - The error object
   * @param {string} dataType - Type of data that failed
   * @param {Object} options - Display options
   * @returns {void}
   */
  showEnhancedError(selectElement, error, dataType = '', options = {}) {
    const errorInfo = this._getErrorMessage(error, dataType);
    const { retryAttempt = 0, showHint = true } = options;
    
    if (!selectElement) return;
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Create error message
    let errorText = `❌ ${errorInfo.message}`;
    if (retryAttempt > 0) {
      errorText += ` (ครั้งที่ ${retryAttempt}/${this.MAX_RETRIES})`;
    }
    
    // Add retry instruction if retryable
    if (errorInfo.canRetry) {
      errorText += ' - คลิกเพื่อลองใหม่';
    }
    
    // Add error option
    const errorOption = document.createElement('option');
    errorOption.value = '';
    errorOption.textContent = errorText;
    errorOption.disabled = true;
    errorOption.selected = true;
    selectElement.appendChild(errorOption);
    
    // Add hint option if requested
    if (showHint && errorInfo.hint) {
      const hintOption = document.createElement('option');
      hintOption.value = '';
      hintOption.textContent = `💡 ${errorInfo.hint}`;
      hintOption.disabled = true;
      hintOption.style.fontStyle = 'italic';
      hintOption.style.color = '#6c757d';
      selectElement.appendChild(hintOption);
    }
    
    // Set element state
    selectElement.disabled = !errorInfo.canRetry;
    selectElement.classList.add('dropdown-error');
    selectElement.classList.remove('dropdown-loading');
    
    // Store error info
    selectElement.dataset.retryAttempt = retryAttempt.toString();
    selectElement.dataset.errorType = errorInfo.type;
    selectElement.dataset.canRetry = errorInfo.canRetry.toString();
    
    // Add retry handler if retryable
    if (errorInfo.canRetry) {
      const retryHandler = async () => {
        selectElement.removeEventListener('click', retryHandler);
        await this._handleRetry(selectElement);
      };
      
      selectElement.addEventListener('click', retryHandler, { once: true });
    }
    
    // Show toast notification for critical errors
    if (['server', 'unauthorized'].includes(errorInfo.type)) {
      this._showErrorToast(errorInfo.message, errorInfo.hint);
    }
  }
  
  /**
   * Show error toast notification
   * @private
   * @param {string} message - Error message
   * @param {string} hint - Error hint
   * @returns {void}
   */
  _showErrorToast(message, hint) {
    // Check if toast container exists, create if not
    let toastContainer = document.getElementById('dropdown-error-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'dropdown-error-toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 350px;
      `;
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'dropdown-error-toast';
    toast.style.cssText = `
      background: #dc3545;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease-out;
    `;
    
    toast.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">❌ ${message}</div>
      <div style="font-size: 0.9em; opacity: 0.9;">💡 ${hint}</div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
      ">×</button>
    `;
    
    // Add CSS animation if not exists
    if (!document.getElementById('dropdown-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'dropdown-toast-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  /**
   * Set up ingredient change event handler
   * @param {HTMLSelectElement} selectElement - The ingredient select element
   * @param {Function} callback - Callback function to execute on change
   * @returns {void}
   */
  onIngredientChange(selectElement, callback) {
    if (!selectElement || typeof callback !== 'function') {
      throw new Error('Select element and callback function are required');
    }
    
    selectElement.addEventListener('change', async (event) => {
      const selectedOption = event.target.options[event.target.selectedIndex];
      
      if (!selectedOption || !selectedOption.value) {
        return;
      }
      
      // Extract ingredient data from option
      const ingredientData = {
        id: selectedOption.value,
        name: selectedOption.textContent,
        stockUnit: selectedOption.dataset.stockUnit || '',
        buyUnit: selectedOption.dataset.buyUnit || '',
        buyToStockRatio: parseFloat(selectedOption.dataset.buyToStockRatio) || 1
      };
      
      // Execute callback with error handling
      try {
        await callback(ingredientData);
      } catch (error) {
        console.error('Error in ingredient change callback:', error);
      }
    });
  }
  
  /**
   * Set up menu change event handler
   * @param {HTMLSelectElement} selectElement - The menu select element
   * @param {Function} callback - Callback function to execute on change
   * @returns {void}
   */
  onMenuChange(selectElement, callback) {
    if (!selectElement || typeof callback !== 'function') {
      throw new Error('Select element and callback function are required');
    }
    
    selectElement.addEventListener('change', async (event) => {
      const selectedOption = event.target.options[event.target.selectedIndex];
      
      if (!selectedOption || !selectedOption.value) {
        return;
      }
      
      // Extract menu data from option
      const menuData = {
        id: selectedOption.value,
        name: selectedOption.textContent,
        price: parseFloat(selectedOption.dataset.price) || 0
      };
      
      // Execute callback with error handling
      try {
        await callback(menuData);
      } catch (error) {
        console.error('Error in menu change callback:', error);
      }
    });
  }
  
  /**
   * Clear all cached dropdown data
   * @returns {Promise<void>}
   */
  async clearCache() {
    try {
      // Clear all dropdown-related cache entries
      await this.cacheManager.remove(this.CACHE_KEYS.INGREDIENTS, 'ingredients');
      await this.cacheManager.remove(this.CACHE_KEYS.MENUS, 'menus');
      await this.cacheManager.remove(this.CACHE_KEYS.PLATFORMS, 'default');
      
      // Clear menu ingredients cache (all entries with the prefix)
      // Note: This is a simplified approach. For production, you might want to track
      // all menu ingredient cache keys or implement a more sophisticated clearing mechanism
      const menuIds = await this._getCachedMenuIds();
      for (const menuId of menuIds) {
        const cacheKey = this.CACHE_KEYS.MENU_INGREDIENTS_PREFIX + menuId;
        await this.cacheManager.remove(cacheKey, 'menus');
      }
      
      // Clear internal state
      this.state.loadedDropdowns.clear();
      this.state.errorDropdowns.clear();
      
      console.log('Dropdown cache cleared successfully');
    } catch (error) {
      console.error('Error clearing dropdown cache:', error);
      throw error;
    }
  }
  
  /**
   * Get list of cached menu IDs (helper for cache clearing)
   * @private
   * @returns {Promise<Array<string>>} Array of menu IDs
   */
  async _getCachedMenuIds() {
    try {
      const menus = await this.cacheManager.get(this.CACHE_KEYS.MENUS, 'menus');
      if (menus && Array.isArray(menus)) {
        return menus.map(menu => menu.id);
      }
    } catch (error) {
      console.warn('Failed to get cached menu IDs:', error);
    }
    return [];
  }
  
  /**
   * Wrap async operations with error handling
   * @private
   * @param {Function} asyncFunction - Async function to wrap
   * @param {string} operationName - Name of the operation (for logging)
   * @returns {Function} Wrapped function
   */
  _wrapWithErrorHandling(asyncFunction, operationName) {
    return async (...args) => {
      try {
        return await asyncFunction(...args);
      } catch (error) {
        console.error(`Error in ${operationName}:`, error);
        throw error;
      }
    };
  }
  
  /**
   * Check if a dropdown is currently loading
   * @param {string} dropdownId - ID of the dropdown element
   * @returns {boolean} True if loading
   */
  isLoading(dropdownId) {
    return this.state.loadingDropdowns.has(dropdownId);
  }
  
  /**
   * Check if a dropdown has an error
   * @param {string} dropdownId - ID of the dropdown element
   * @returns {boolean} True if has error
   */
  hasError(dropdownId) {
    return this.state.errorDropdowns.has(dropdownId);
  }
  
  /**
   * Get the current state of a dropdown
   * @param {string} dropdownId - ID of the dropdown element
   * @returns {Object} State object with loading, error, and loaded status
   */
  getDropdownState(dropdownId) {
    return {
      isLoading: this.isLoading(dropdownId),
      hasError: this.hasError(dropdownId),
      isLoaded: this.state.loadedDropdowns.has(dropdownId),
      type: this.state.loadedDropdowns.get(dropdownId) || null,
      error: this.state.errorDropdowns.get(dropdownId) || null,
      retryAttempt: this._getRetryAttempt(dropdownId)
    };
  }
  
  /**
   * Get current retry attempt for a dropdown
   * @private
   * @param {string} dropdownId - ID of the dropdown element
   * @returns {number} Current retry attempt number
   */
  _getRetryAttempt(dropdownId) {
    const element = document.getElementById(dropdownId);
    return element ? parseInt(element.dataset.retryAttempt || '0') : 0;
  }
  
  /**
   * Retry all failed dropdowns
   * @returns {Promise<Object>} Results of retry operations
   */
  async retryAllFailed() {
    const results = {
      success: [],
      failed: [],
      total: 0
    };
    
    // Find all dropdowns with errors
    const failedDropdowns = [];
    this.state.errorDropdowns.forEach((error, dropdownId) => {
      const element = document.getElementById(dropdownId);
      if (element) {
        failedDropdowns.push({ element, dropdownId, error });
      }
    });
    
    results.total = failedDropdowns.length;
    
    if (failedDropdowns.length === 0) {
      console.log('No failed dropdowns to retry');
      return results;
    }
    
    console.log(`Retrying ${failedDropdowns.length} failed dropdowns...`);
    
    // Retry each failed dropdown
    const retryPromises = failedDropdowns.map(async ({ element, dropdownId }) => {
      try {
        await this._handleRetry(element);
        results.success.push(dropdownId);
        console.log(`✅ Successfully retried dropdown: ${dropdownId}`);
      } catch (error) {
        results.failed.push({ dropdownId, error: error.message });
        console.error(`❌ Failed to retry dropdown ${dropdownId}:`, error);
      }
    });
    
    await Promise.allSettled(retryPromises);
    
    console.log(`Retry completed: ${results.success.length} success, ${results.failed.length} failed`);
    return results;
  }
  
  /**
   * Set retry configuration
   * @param {Object} config - Retry configuration
   * @param {number} config.maxRetries - Maximum number of retries
   * @param {number} config.baseDelay - Base delay for exponential backoff
   * @returns {void}
   */
  setRetryConfig(config) {
    if (config.maxRetries && config.maxRetries > 0) {
      this.MAX_RETRIES = config.maxRetries;
    }
    if (config.baseDelay && config.baseDelay > 0) {
      this.RETRY_DELAY_BASE = config.baseDelay;
    }
    
    console.log(`Retry config updated: maxRetries=${this.MAX_RETRIES}, baseDelay=${this.RETRY_DELAY_BASE}ms`);
  }
  
  /**
   * Get current retry configuration
   * @returns {Object} Current retry configuration
   */
  getRetryConfig() {
    return {
      maxRetries: this.MAX_RETRIES,
      baseDelay: this.RETRY_DELAY_BASE
    };
  }
  
  /**
   * Initialize intelligent preloading based on time of day
   * @param {Object} options - Preloading options
   * @param {boolean} options.enabled - Enable preloading (default: true)
   * @param {Object} options.schedule - Custom schedule override
   * @returns {void}
   */
  initializePreloading(options = {}) {
    const { enabled = true, schedule = null } = options;
    
    if (!enabled) {
      console.log('Dropdown preloading disabled');
      return;
    }
    
    // Default preloading schedule
    this.preloadingSchedule = schedule || {
      // Morning hours - preload ingredients (purchase time)
      morning: {
        start: 9,  // 9 AM
        end: 11,   // 11 AM
        priority: ['ingredients', 'platforms']
      },
      // Lunch hours - preload menus (sale time)
      lunch: {
        start: 11, // 11 AM
        end: 14,   // 2 PM
        priority: ['menus', 'platforms']
      },
      // Dinner hours - preload menus (sale time)
      dinner: {
        start: 17, // 5 PM
        end: 21,   // 9 PM
        priority: ['menus', 'platforms']
      },
      // Off-peak hours - preload all (maintenance time)
      offPeak: {
        start: 22, // 10 PM
        end: 8,    // 8 AM
        priority: ['ingredients', 'menus', 'platforms']
      }
    };
    
    // Start preloading scheduler
    this._startPreloadingScheduler();
    
    console.log('Dropdown preloading initialized with schedule:', this.preloadingSchedule);
  }
  
  /**
   * Start the preloading scheduler
   * @private
   * @returns {void}
   */
  _startPreloadingScheduler() {
    // Check every 30 minutes
    const checkInterval = 30 * 60 * 1000; // 30 minutes
    
    // Initial check
    this._checkAndPreload();
    
    // Set up recurring checks
    this.preloadingInterval = setInterval(() => {
      this._checkAndPreload();
    }, checkInterval);
    
    console.log('Preloading scheduler started (checking every 30 minutes)');
  }
  
  /**
   * Stop the preloading scheduler
   * @returns {void}
   */
  stopPreloading() {
    if (this.preloadingInterval) {
      clearInterval(this.preloadingInterval);
      this.preloadingInterval = null;
      console.log('Preloading scheduler stopped');
    }
  }
  
  /**
   * Check current time and preload appropriate data
   * @private
   * @returns {Promise<void>}
   */
  async _checkAndPreload() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentPeriod = this._getCurrentTimePeriod(currentHour);
    
    if (!currentPeriod) {
      console.log('No preloading scheduled for current time');
      return;
    }
    
    console.log(`Current time period: ${currentPeriod.name} (${currentHour}:00)`);
    
    // Check if we should preload (avoid if user is actively using the app)
    if (this._isUserActive()) {
      console.log('User is active, skipping preloading');
      return;
    }
    
    // Use requestIdleCallback for non-blocking preloading
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        this._performPreloading(currentPeriod.priority);
      }, { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this._performPreloading(currentPeriod.priority);
      }, 100);
    }
  }
  
  /**
   * Get current time period based on hour
   * @private
   * @param {number} hour - Current hour (0-23)
   * @returns {Object|null} Time period configuration
   */
  _getCurrentTimePeriod(hour) {
    const schedule = this.preloadingSchedule;
    
    // Check morning period
    if (hour >= schedule.morning.start && hour < schedule.morning.end) {
      return { name: 'morning', ...schedule.morning };
    }
    
    // Check lunch period
    if (hour >= schedule.lunch.start && hour < schedule.lunch.end) {
      return { name: 'lunch', ...schedule.lunch };
    }
    
    // Check dinner period
    if (hour >= schedule.dinner.start && hour < schedule.dinner.end) {
      return { name: 'dinner', ...schedule.dinner };
    }
    
    // Check off-peak period (spans midnight)
    if (hour >= schedule.offPeak.start || hour < schedule.offPeak.end) {
      return { name: 'offPeak', ...schedule.offPeak };
    }
    
    return null;
  }
  
  /**
   * Check if user is currently active
   * @private
   * @returns {boolean} True if user is active
   */
  _isUserActive() {
    // Check if any dropdowns are currently loading
    if (this.state.loadingDropdowns.size > 0) {
      return true;
    }
    
    // Check if user has interacted recently (within last 5 minutes)
    const lastActivity = this._getLastUserActivity();
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    return lastActivity > fiveMinutesAgo;
  }
  
  /**
   * Get timestamp of last user activity
   * @private
   * @returns {number} Timestamp of last activity
   */
  _getLastUserActivity() {
    // Check localStorage for last activity timestamp
    const stored = localStorage.getItem('dropdown_last_activity');
    return stored ? parseInt(stored) : 0;
  }
  
  /**
   * Update last user activity timestamp
   * @returns {void}
   */
  updateUserActivity() {
    localStorage.setItem('dropdown_last_activity', Date.now().toString());
  }
  
  /**
   * Perform preloading for specified data types
   * @private
   * @param {Array<string>} dataTypes - Array of data types to preload
   * @returns {Promise<void>}
   */
  async _performPreloading(dataTypes) {
    console.log('Starting preloading for:', dataTypes);
    
    const preloadPromises = dataTypes.map(async (dataType) => {
      try {
        switch (dataType) {
          case 'ingredients':
            await this.getIngredients();
            console.log('✅ Preloaded ingredients');
            break;
          case 'menus':
            await this.getMenus();
            console.log('✅ Preloaded menus');
            break;
          case 'platforms':
            await this.getPlatforms();
            console.log('✅ Preloaded platforms');
            break;
          default:
            console.warn('Unknown data type for preloading:', dataType);
        }
      } catch (error) {
        console.warn(`Failed to preload ${dataType}:`, error.message);
      }
    });
    
    await Promise.allSettled(preloadPromises);
    console.log('Preloading completed');
  }
  
  /**
   * Manually trigger preloading for specific data types
   * @param {Array<string>} dataTypes - Data types to preload
   * @param {boolean} force - Force preload even if user is active
   * @returns {Promise<Object>} Preloading results
   */
  async manualPreload(dataTypes = ['ingredients', 'menus', 'platforms'], force = false) {
    if (!force && this._isUserActive()) {
      throw new Error('User is active. Use force=true to override.');
    }
    
    const results = {
      success: [],
      failed: [],
      startTime: Date.now()
    };
    
    console.log('Manual preloading started for:', dataTypes);
    
    for (const dataType of dataTypes) {
      try {
        await this._performPreloading([dataType]);
        results.success.push(dataType);
      } catch (error) {
        results.failed.push({ dataType, error: error.message });
      }
    }
    
    results.duration = Date.now() - results.startTime;
    console.log('Manual preloading completed:', results);
    
    return results;
  }
  
  /**
   * Get preloading statistics
   * @returns {Object} Preloading statistics
   */
  getPreloadingStats() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentPeriod = this._getCurrentTimePeriod(currentHour);
    
    return {
      enabled: !!this.preloadingInterval,
      currentHour,
      currentPeriod: currentPeriod?.name || 'none',
      nextPreloadTypes: currentPeriod?.priority || [],
      lastActivity: this._getLastUserActivity(),
      isUserActive: this._isUserActive(),
      schedule: this.preloadingSchedule
    };
  }
  
  /**
   * Populate dropdown with optimization for large datasets
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {Array} data - Data array to populate
   * @param {Object} options - Optimization options
   * @param {number} options.threshold - Threshold for enabling optimizations (default: 100)
   * @param {boolean} options.enableSearch - Enable search functionality (default: true)
   * @param {boolean} options.enableVirtualScrolling - Enable virtual scrolling (default: true)
   * @param {number} options.batchSize - Number of items to render in each batch (default: 50)
   * @param {Function} options.formatOption - Custom option formatter
   * @returns {Promise<void>}
   */
  async populateOptimized(selectElement, data, options = {}) {
    const {
      threshold = 100,
      enableSearch = true,
      enableVirtualScrolling = true,
      batchSize = 50,
      formatOption = null
    } = options;
    
    if (!selectElement || !Array.isArray(data)) {
      throw new Error('Select element and data array are required');
    }
    
    // Use standard population for small datasets
    if (data.length < threshold) {
      return this._populateStandard(selectElement, data, formatOption);
    }
    
    console.log(`Optimizing dropdown for ${data.length} items`);
    
    // Create optimized dropdown structure
    if (enableSearch) {
      this._addSearchFunctionality(selectElement, data, formatOption);
    }
    
    if (enableVirtualScrolling) {
      this._enableVirtualScrolling(selectElement, data, batchSize, formatOption);
    } else {
      this._populateInBatches(selectElement, data, batchSize, formatOption);
    }
  }
  
  /**
   * Standard population for small datasets
   * @private
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {Array} data - Data array
   * @param {Function} formatOption - Option formatter
   * @returns {void}
   */
  _populateStandard(selectElement, data, formatOption) {
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Add placeholder
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'เลือก...';
    selectElement.appendChild(placeholderOption);
    
    // Add all options
    data.forEach(item => {
      const option = document.createElement('option');
      if (formatOption) {
        formatOption(option, item);
      } else {
        option.value = item.id || item.value || item;
        option.textContent = item.name || item.text || item;
      }
      selectElement.appendChild(option);
    });
  }
  
  /**
   * Add search functionality to dropdown
   * @private
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {Array} data - Original data array
   * @param {Function} formatOption - Option formatter
   * @returns {void}
   */
  _addSearchFunctionality(selectElement, data, formatOption) {
    // Create search input container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'dropdown-search-container';
    searchContainer.style.cssText = `
      position: relative;
      margin-bottom: 8px;
    `;
    
    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'ค้นหา...';
    searchInput.className = 'dropdown-search-input';
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      font-size: var(--fs-sm);
      background: var(--card);
      color: var(--text);
    `;
    
    // Create results counter
    const resultsCounter = document.createElement('div');
    resultsCounter.className = 'dropdown-results-counter';
    resultsCounter.style.cssText = `
      font-size: var(--fs-xs);
      color: var(--muted);
      margin-top: 4px;
    `;
    
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(resultsCounter);
    
    // Insert search container before select element
    selectElement.parentNode.insertBefore(searchContainer, selectElement);
    
    // Store original data and current filtered data
    selectElement._originalData = data;
    selectElement._filteredData = data;
    
    // Add search functionality
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
          selectElement._filteredData = data;
        } else {
          selectElement._filteredData = data.filter(item => {
            const searchText = (item.name || item.text || item.toString()).toLowerCase();
            return searchText.includes(query);
          });
        }
        
        // Update results counter
        resultsCounter.textContent = `${selectElement._filteredData.length} รายการ`;
        
        // Re-populate dropdown with filtered data
        this._populateStandard(selectElement, selectElement._filteredData, formatOption);
        
      }, 300); // Debounce search
    });
    
    // Initial population
    this._populateStandard(selectElement, data, formatOption);
    resultsCounter.textContent = `${data.length} รายการ`;
  }
  
  /**
   * Enable virtual scrolling for very large datasets
   * @private
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {Array} data - Data array
   * @param {number} batchSize - Items per batch
   * @param {Function} formatOption - Option formatter
   * @returns {void}
   */
  _enableVirtualScrolling(selectElement, data, batchSize, formatOption) {
    // For HTML select elements, we can't implement true virtual scrolling
    // Instead, we'll implement lazy loading with batches
    console.log('Virtual scrolling not supported for HTML select elements, using batch loading');
    this._populateInBatches(selectElement, data, batchSize, formatOption);
  }
  
  /**
   * Populate dropdown in batches for better performance
   * @private
   * @param {HTMLSelectElement} selectElement - The select element
   * @param {Array} data - Data array
   * @param {number} batchSize - Items per batch
   * @param {Function} formatOption - Option formatter
   * @returns {void}
   */
  _populateInBatches(selectElement, data, batchSize, formatOption) {
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Add placeholder
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'เลือก...';
    selectElement.appendChild(placeholderOption);
    
    let currentBatch = 0;
    const totalBatches = Math.ceil(data.length / batchSize);
    
    // Function to load next batch
    const loadNextBatch = () => {
      const startIndex = currentBatch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, data.length);
      
      // Create document fragment for better performance
      const fragment = document.createDocumentFragment();
      
      for (let i = startIndex; i < endIndex; i++) {
        const item = data[i];
        const option = document.createElement('option');
        
        if (formatOption) {
          formatOption(option, item);
        } else {
          option.value = item.id || item.value || item;
          option.textContent = item.name || item.text || item;
        }
        
        fragment.appendChild(option);
      }
      
      selectElement.appendChild(fragment);
      currentBatch++;
      
      // Add "Load More" option if there are more batches
      if (currentBatch < totalBatches) {
        const loadMoreOption = document.createElement('option');
        loadMoreOption.value = '__load_more__';
        loadMoreOption.textContent = `⬇️ โหลดเพิ่ม... (${endIndex}/${data.length})`;
        loadMoreOption.style.fontStyle = 'italic';
        loadMoreOption.style.color = 'var(--brand)';
        selectElement.appendChild(loadMoreOption);
      }
      
      console.log(`Loaded batch ${currentBatch}/${totalBatches} (${endIndex}/${data.length} items)`);
    };
    
    // Load first batch
    loadNextBatch();
    
    // Handle "Load More" selection
    selectElement.addEventListener('change', (e) => {
      if (e.target.value === '__load_more__') {
        // Remove the "Load More" option
        const loadMoreOption = selectElement.querySelector('option[value="__load_more__"]');
        if (loadMoreOption) {
          loadMoreOption.remove();
        }
        
        // Load next batch
        loadNextBatch();
        
        // Reset selection to placeholder
        selectElement.value = '';
      }
    });
  }
  
  /**
   * Create optimized dropdown with custom UI (alternative to HTML select)
   * @param {HTMLElement} container - Container element
   * @param {Array} data - Data array
   * @param {Object} options - Options
   * @returns {HTMLElement} Custom dropdown element
   */
  createCustomDropdown(container, data, options = {}) {
    const {
      placeholder = 'เลือก...',
      searchPlaceholder = 'ค้นหา...',
      maxHeight = '200px',
      formatOption = null,
      onSelect = null
    } = options;
    
    // Create custom dropdown structure
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-dropdown';
    dropdown.style.cssText = `
      position: relative;
      width: 100%;
    `;
    
    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger';
    trigger.textContent = placeholder;
    trigger.style.cssText = `
      width: 100%;
      min-height: var(--touch-comfortable);
      padding: 16px 20px;
      border-radius: var(--radius);
      border: 2px solid var(--line);
      background: var(--card);
      color: var(--text);
      font-size: var(--fs-base);
      text-align: left;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    // Add dropdown arrow
    const arrow = document.createElement('span');
    arrow.textContent = '▼';
    arrow.style.cssText = `
      font-size: 12px;
      transition: transform 0.2s ease;
    `;
    trigger.appendChild(arrow);
    
    // Create dropdown panel
    const panel = document.createElement('div');
    panel.className = 'custom-dropdown-panel';
    panel.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1000;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-height: ${maxHeight};
      overflow-y: auto;
      display: none;
    `;
    
    // Add search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = searchPlaceholder;
    searchInput.style.cssText = `
      width: 100%;
      padding: 12px;
      border: none;
      border-bottom: 1px solid var(--line);
      background: transparent;
      font-size: var(--fs-sm);
    `;
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-dropdown-options';
    
    panel.appendChild(searchInput);
    panel.appendChild(optionsContainer);
    
    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    
    // Populate options
    this._populateCustomDropdownOptions(optionsContainer, data, formatOption, (item) => {
      trigger.textContent = item.name || item.text || item;
      panel.style.display = 'none';
      arrow.style.transform = 'rotate(0deg)';
      
      if (onSelect) {
        onSelect(item);
      }
    });
    
    // Add search functionality
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filteredData = query === '' ? data : data.filter(item => {
        const searchText = (item.name || item.text || item.toString()).toLowerCase();
        return searchText.includes(query);
      });
      
      this._populateCustomDropdownOptions(optionsContainer, filteredData, formatOption, (item) => {
        trigger.textContent = item.name || item.text || item;
        panel.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
        
        if (onSelect) {
          onSelect(item);
        }
      });
    });
    
    // Toggle dropdown
    trigger.addEventListener('click', () => {
      const isOpen = panel.style.display !== 'none';
      panel.style.display = isOpen ? 'none' : 'block';
      arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      
      if (!isOpen) {
        searchInput.focus();
      }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        panel.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
      }
    });
    
    container.appendChild(dropdown);
    return dropdown;
  }
  
  /**
   * Populate custom dropdown options
   * @private
   * @param {HTMLElement} container - Options container
   * @param {Array} data - Data array
   * @param {Function} formatOption - Option formatter
   * @param {Function} onSelect - Selection callback
   * @returns {void}
   */
  _populateCustomDropdownOptions(container, data, formatOption, onSelect) {
    container.innerHTML = '';
    
    if (data.length === 0) {
      const emptyOption = document.createElement('div');
      emptyOption.textContent = 'ไม่พบข้อมูล';
      emptyOption.style.cssText = `
        padding: 12px;
        color: var(--muted);
        font-style: italic;
        text-align: center;
      `;
      container.appendChild(emptyOption);
      return;
    }
    
    data.forEach(item => {
      const option = document.createElement('div');
      option.className = 'custom-dropdown-option';
      option.style.cssText = `
        padding: 12px;
        cursor: pointer;
        border-bottom: 1px solid var(--line);
        transition: background-color 0.2s ease;
      `;
      
      if (formatOption) {
        formatOption(option, item);
      } else {
        option.textContent = item.name || item.text || item;
      }
      
      option.addEventListener('mouseenter', () => {
        option.style.backgroundColor = 'var(--bg)';
      });
      
      option.addEventListener('mouseleave', () => {
        option.style.backgroundColor = 'transparent';
      });
      
      option.addEventListener('click', () => {
        onSelect(item);
      });
      
      container.appendChild(option);
    });
  }
  
  /**
   * Fetch data with progress tracking
   * @private
   * @param {Function} fetchFunction - Function that performs the fetch
   * @param {string} dataType - Type of data being fetched
   * @param {HTMLSelectElement} selectElement - Element to show progress on
   * @returns {Promise<any>} Fetched data
   */
  async _fetchWithProgress(fetchFunction, dataType, selectElement) {
    const startTime = Date.now();
    let progressInterval;
    
    try {
      // Start progress simulation
      let progress = 0;
      progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 15, 90);
        this.updateLoadingProgress(selectElement, progress);
      }, 200);
      
      // Perform the actual fetch
      const data = await fetchFunction();
      
      // Complete progress
      clearInterval(progressInterval);
      this.updateLoadingProgress(selectElement, 100, 'เสร็จสิ้น');
      
      // Calculate loading time
      const loadTime = Date.now() - startTime;
      console.log(`✅ Loaded ${dataType} in ${loadTime}ms`);
      
      return data;
      
    } catch (error) {
      // Clear progress on error
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      const loadTime = Date.now() - startTime;
      console.error(`❌ Failed to load ${dataType} after ${loadTime}ms:`, error);
      
      throw error;
    }
  }
  
  /**
   * Show global loading indicator for multiple dropdowns
   * @param {string} message - Loading message
   * @returns {HTMLElement} Loading indicator element
   */
  showGlobalLoading(message = 'กำลังโหลดข้อมูล...') {
    // Remove existing global loader
    const existingLoader = document.getElementById('dropdown-global-loader');
    if (existingLoader) {
      existingLoader.remove();
    }
    
    // Create global loading indicator
    const loader = document.createElement('div');
    loader.id = 'dropdown-global-loader';
    loader.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 30px;
      border-radius: 8px;
      z-index: 10000;
      text-align: center;
      min-width: 200px;
    `;
    
    loader.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #ffffff30;
          border-top: 4px solid #ffffff;
          border-radius: 50%;
          animation: dropdownSpin 1s linear infinite;
          margin: 0 auto;
        "></div>
      </div>
      <div>${message}</div>
    `;
    
    document.body.appendChild(loader);
    return loader;
  }
  
  /**
   * Hide global loading indicator
   * @returns {void}
   */
  hideGlobalLoading() {
    const loader = document.getElementById('dropdown-global-loader');
    if (loader) {
      loader.remove();
    }
  }
  
  /**
   * Show loading progress for multiple operations
   * @param {Array} operations - Array of operation objects
   * @returns {Promise<Array>} Results of all operations
   */
  async loadMultipleWithProgress(operations) {
    const globalLoader = this.showGlobalLoading('กำลังโหลดข้อมูลทั้งหมด...');
    const results = [];
    
    try {
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        const progress = ((i + 1) / operations.length) * 100;
        
        // Update global progress
        const progressText = `กำลังโหลด ${operation.name}... (${i + 1}/${operations.length})`;
        globalLoader.querySelector('div:last-child').textContent = progressText;
        
        try {
          const result = await operation.fetch();
          results.push({ success: true, data: result, name: operation.name });
        } catch (error) {
          results.push({ success: false, error, name: operation.name });
        }
      }
      
      return results;
      
    } finally {
      this.hideGlobalLoading();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DropdownManager;
} else if (typeof window !== 'undefined') {
  window.DropdownManager = DropdownManager;
}
