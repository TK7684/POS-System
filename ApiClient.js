/**
 * API Client for POS System
 * Handles communication with Google Apps Script backend
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    this.requestTimeout = 10000; // 10 seconds
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  async makeRequest(action, params = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', action);
      
      // Add parameters to URL
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.result || data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Get ingredient by ID
   */
  async getIngredient(id) {
    return await this.makeRequest('getIngredient', { id });
  }

  /**
   * Get frequently used ingredients
   */
  async getFrequentIngredients(limit = 20) {
    return await this.makeRequest('getFrequentIngredients', { limit });
  }

  /**
   * Get menu by ID
   */
  async getMenu(id) {
    return await this.makeRequest('getMenu', { id });
  }

  /**
   * Get popular menus
   */
  async getPopularMenus(limit = 15) {
    return await this.makeRequest('getPopularMenus', { limit });
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit = 10) {
    return await this.makeRequest('getRecentTransactions', { limit });
  }

  /**
   * Get ingredients with low stock
   */
  async getLowStockIngredients() {
    return await this.makeRequest('getLowStockIngredients');
  }

  /**
   * Get today's sales summary
   */
  async getTodaySummary() {
    return await this.makeRequest('getTodaySummary');
  }

  /**
   * Get recent price updates
   */
  async getRecentPriceUpdates() {
    return await this.makeRequest('getRecentPriceUpdates');
  }

  /**
   * Get all ingredients (for initial load)
   */
  async getAllIngredients() {
    return await this.makeRequest('getAllIngredients');
  }

  /**
   * Get all menus (for initial load)
   */
  async getAllMenus() {
    return await this.makeRequest('getAllMenus');
  }

  /**
   * Add new purchase
   */
  async addPurchase(purchaseData) {
    return await this.makeRequest('addPurchase', purchaseData);
  }

  /**
   * Add new sale
   */
  async addSale(saleData) {
    return await this.makeRequest('addSale', saleData);
  }

  /**
   * Update ingredient stock
   */
  async updateStock(ingredientId, quantity, operation = 'add') {
    return await this.makeRequest('updateStock', {
      ingredientId,
      quantity,
      operation
    });
  }

  /**
   * Get sales report for date range
   */
  async getSalesReport(startDate, endDate) {
    return await this.makeRequest('getSalesReport', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  }

  /**
   * Search ingredients by name or ID
   */
  async searchIngredients(query, limit = 10) {
    return await this.makeRequest('searchIngredients', { query, limit });
  }

  /**
   * Search menus by name
   */
  async searchMenus(query, limit = 10) {
    return await this.makeRequest('searchMenus', { query, limit });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
} else if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;
}