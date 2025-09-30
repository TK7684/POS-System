/**
 * POS API Client - Frontend to Apps Script Communication
 * Handles all communication with Google Apps Script backend
 */

class PosApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl; // Your deployed Apps Script URL
    this.timeout = 10000; // 10 seconds
    this.retryAttempts = 3;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Make API request with retry logic and caching
   */
  async makeRequest(action, params = {}, options = {}) {
    const cacheKey = `${action}_${JSON.stringify(params)}`;
    
    // Check cache first (for GET-like operations)
    if (options.cache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this.executeRequest(action, params);
        
        // Cache successful responses
        if (options.cache && result.status === 'success') {
          this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`API attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Execute single API request
   */
  async executeRequest(action, params) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Prepare request
      const url = new URL(this.baseUrl);
      const requestData = { action, ...params };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || 'API returned error');
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      
      throw error;
    }
  }

  /**
   * Add purchase
   */
  async addPurchase(purchaseData) {
    return await this.makeRequest('addPurchase', purchaseData);
  }

  /**
   * Add sale
   */
  async addSale(saleData) {
    return await this.makeRequest('addSale', saleData);
  }

  /**
   * Get report
   */
  async getReport(reportParams) {
    return await this.makeRequest('getReport', reportParams, { cache: true });
  }

  /**
   * Get bootstrap data (cached)
   */
  async getBootstrapData() {
    return await this.makeRequest('getBootstrapData', {}, { cache: true });
  }

  /**
   * Get low stock HTML
   */
  async getLowStockHTML() {
    const result = await this.makeRequest('getLowStockHTML', {}, { cache: true });
    return result.html;
  }

  /**
   * Search ingredients
   */
  async searchIngredients(query, limit = 10) {
    const result = await this.makeRequest('searchIngredients', { query, limit });
    return result.data;
  }

  /**
   * Get ingredient map (cached)
   */
  async getIngredientMap() {
    const result = await this.makeRequest('getIngredientMap', {}, { cache: true });
    return result.data;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const result = await this.makeRequest('getBootstrapData', {});
      return {
        status: 'success',
        message: 'API connection successful',
        serverTime: result.timestamp
      };
    } catch (error) {
      return {
        status: 'error',
        message: `API connection failed: ${error.message}`
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Utility: delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch requests (for multiple operations)
   */
  async batchRequest(requests) {
    const promises = requests.map(req => 
      this.makeRequest(req.action, req.params, req.options)
    );
    
    return await Promise.allSettled(promises);
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PosApiClient;
} else if (typeof window !== 'undefined') {
  window.PosApiClient = PosApiClient;
}