/**
 * Optimized API Client for POS System
 * Enhanced with better error handling, retries, and performance optimizations
 */

import { API, ERRORS, CACHE, PERFORMANCE } from '../config/config.js';
import { logError, logWarn, logInfo, logDebug, safeNumber, retryWithBackoff } from '../utils/utils.js';

/**
 * Enhanced API Client with modern features
 */
export class ApiClient {
  constructor(baseUrl = API.BASE_URL, options = {}) {
    this.baseUrl = baseUrl;
    this.timeout = options.timeout || API.TIMEOUT;
    this.retryAttempts = options.retryAttempts || API.RETRY_ATTEMPTS;
    this.retryDelay = options.retryDelay || API.RETRY_DELAY;
    this.activeRequests = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;

    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0
    };
  }

  /**
   * Make HTTP request with enhanced error handling and retries
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      this.metrics.totalRequests++;

      // Check if same request is already in progress
      const requestKey = this.getRequestKey(endpoint, options);
      if (this.activeRequests.has(requestKey)) {
        logDebug('Request already in progress, waiting for result:', requestKey);
        return await this.activeRequests.get(requestKey);
      }

      const requestPromise = this.executeRequest(endpoint, options);
      this.activeRequests.set(requestKey, requestPromise);

      const result = await requestPromise;

      // Update metrics
      this.metrics.successfulRequests++;
      this.updateAverageResponseTime(startTime);

      logInfo('API request successful:', { endpoint, duration: Date.now() - startTime });

      return result;

    } catch (error) {
      this.metrics.failedRequests++;
      logError('API request failed:', { endpoint, error: error.message, duration: Date.now() - startTime });
      throw this.enhanceError(error, endpoint);
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * Execute the actual HTTP request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async executeRequest(endpoint, options) {
    const url = this.buildUrl(endpoint, options.params);
    const requestOptions = this.buildRequestOptions(options);

    return await retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Check for API-level errors
        if (data.error) {
          throw new Error(data.error);
        }

        return data.result || data;

      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          throw new Error(ERRORS.TIMEOUT);
        }

        throw error;
      }
    }, this.retryAttempts, this.retryDelay);
  }

  /**
   * Build URL with parameters
   * @param {string} endpoint - API endpoint
   * @param {Object} params - URL parameters
   * @returns {string} Complete URL
   */
  buildUrl(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add action parameter if not present
    if (!url.searchParams.has('action') && !endpoint.includes('?action=')) {
      url.searchParams.append('action', endpoint.replace('/', ''));
    }

    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Build request options
   * @param {Object} options - Request options
   * @returns {Object} Fetch options
   */
  buildRequestOptions(options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    // Handle body serialization
    if (options.body && typeof options.body === 'object') {
      requestOptions.body = JSON.stringify(options.body);
    }

    return requestOptions;
  }

  /**
   * Batch multiple requests
   * @param {Array} requests - Array of request objects
   * @returns {Promise<Array>} Array of responses
   */
  async batchRequests(requests) {
    const batchSize = PERFORMANCE.BATCH_SIZE;
    const results = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(({ endpoint, options }) =>
        this.request(endpoint, options)
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        logError('Batch request failed:', error);
        // Continue with partial results
        const partialResults = await Promise.allSettled(batchPromises);
        partialResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({ error: result.reason });
          }
        });
      }
    }

    return results;
  }

  /**
   * Queue request for later processing
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {number} priority - Request priority (higher = more important)
   */
  queueRequest(endpoint, options = {}, priority = 0) {
    this.requestQueue.push({
      endpoint,
      options,
      priority,
      timestamp: Date.now()
    });

    // Sort queue by priority (descending) and timestamp (ascending)
    this.requestQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    this.processQueue();
  }

  /**
   * Process queued requests
   */
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { endpoint, options } = this.requestQueue.shift();

      try {
        await this.request(endpoint, options);
      } catch (error) {
        logError('Queued request failed:', { endpoint, error: error.message });
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Enhanced error handling
   * @param {Error} error - Original error
   * @param {string} endpoint - API endpoint
   * @returns {Error} Enhanced error
   */
  enhanceError(error, endpoint) {
    let message = error.message;
    let code = 'UNKNOWN_ERROR';

    // Map common errors to user-friendly messages
    if (error.message.includes('HTTP 404')) {
      message = ERRORS.NOT_FOUND;
      code = 'NOT_FOUND';
    } else if (error.message.includes('HTTP 403')) {
      message = ERRORS.PERMISSION;
      code = 'PERMISSION_DENIED';
    } else if (error.message.includes('timeout')) {
      message = ERRORS.TIMEOUT;
      code = 'TIMEOUT';
    } else if (error.message.includes('fetch')) {
      message = ERRORS.NETWORK;
      code = 'NETWORK_ERROR';
    }

    const enhancedError = new Error(message);
    enhancedError.code = code;
    enhancedError.originalError = error;
    enhancedError.endpoint = endpoint;

    return enhancedError;
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get request key for deduplication
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {string} Request key
   */
  getRequestKey(endpoint, options) {
    const params = new URLSearchParams(options.params || {}).toString();
    return `${endpoint}_${params}`;
  }

  /**
   * Update average response time metric
   * @param {number} startTime - Request start time
   */
  updateAverageResponseTime(startTime) {
    const duration = Date.now() - startTime;
    const total = this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1);
    this.metrics.averageResponseTime = (total + duration) / this.metrics.successfulRequests;
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0
        ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
        : 0,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0
    };
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    this.activeRequests.clear();
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  // ===== Specific API Methods =====

  /**
   * Get ingredients
   * @param {Object} options - Query options
   * @returns {Promise} Ingredients data
   */
  async getIngredients(options = {}) {
    return await this.request('/getIngredients', { params: options });
  }

  /**
   * Get menus
   * @param {Object} options - Query options
   * @returns {Promise} Menus data
   */
  async getMenus(options = {}) {
    return await this.request('/getMenus', { params: options });
  }

  /**
   * Add purchase
   * @param {Object} purchaseData - Purchase data
   * @returns {Promise} Purchase result
   */
  async addPurchase(purchaseData) {
    return await this.request('/addPurchase', {
      method: 'POST',
      body: purchaseData
    });
  }

  /**
   * Add sale
   * @param {Object} saleData - Sale data
   * @returns {Promise} Sale result
   */
  async addSale(saleData) {
    return await this.request('/addSale', {
      method: 'POST',
      body: saleData
    });
  }

  /**
   * Get low stock ingredients
   * @returns {Promise} Low stock data
   */
  async getLowStockIngredients() {
    return await this.request('/getLowStockIngredients');
  }

  /**
   * Get today's summary
   * @returns {Promise} Today's summary data
   */
  async getTodaySummary() {
    return await this.request('/getTodaySummary');
  }

  /**
   * Search ingredients
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise} Search results
   */
  async searchIngredients(query, options = {}) {
    return await this.request('/searchIngredients', {
      params: { query, ...options }
    });
  }

  /**
   * Search menus
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise} Search results
   */
  async searchMenus(query, options = {}) {
    return await this.request('/searchMenus', {
      params: { query, ...options }
    });
  }

  /**
   * Update stock
   * @param {string} ingredientId - Ingredient ID
   * @param {number} quantity - Quantity to update
   * @param {string} operation - Operation type (add/subtract)
   * @returns {Promise} Update result
   */
  async updateStock(ingredientId, quantity, operation = 'add') {
    return await this.request('/updateStock', {
      method: 'POST',
      body: { ingredientId, quantity, operation }
    });
  }

  /**
   * Get sales report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise} Sales report data
   */
  async getSalesReport(startDate, endDate) {
    return await this.request('/getSalesReport', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for use in other modules
export default apiClient;
