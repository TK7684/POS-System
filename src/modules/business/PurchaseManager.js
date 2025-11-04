/**
 * Purchase Management Module
 * Handles all purchase-related business logic with validation and optimization
 */

import { apiClient } from '../../core/ApiClient.js';
import { stateManager, actions } from '../../core/StateManager.js';
import { cacheManager } from '../../core/CacheManager.js';
import {
  safeNumber,
  validateBusinessRules,
  generateId,
  logError,
  logInfo,
  logWarn,
  formatCurrency,
  formatDate
} from '../../utils/utils.js';
import { BUSINESS, ERRORS, SHEETS } from '../../config/config.js';

/**
 * Purchase Manager with enhanced business logic
 */
export class PurchaseManager {
  constructor() {
    this.validationRules = {
      ingredient_id: { required: true, type: 'string', min: 1, max: 100 },
      qtyBuy: { required: true, type: 'number', min: BUSINESS.VALIDATION.MIN_QUANTITY, max: BUSINESS.VALIDATION.MAX_QUANTITY },
      unit: { required: true, type: 'string', min: 1, max: 50 },
      totalPrice: { required: true, type: 'number', min: BUSINESS.VALIDATION.MIN_PRICE, max: BUSINESS.VALIDATION.MAX_PRICE },
      unitPrice: { required: false, type: 'number', min: 0, max: BUSINESS.VALIDATION.MAX_PRICE },
      supplierNote: { required: false, type: 'string', max: 500 },
      actualYield: { required: false, type: 'number', min: 0, max: BUSINESS.VALIDATION.MAX_QUANTITY }
    };
  }

  /**
   * Add new purchase with comprehensive validation
   * @param {Object} purchaseData - Purchase data
   * @returns {Promise<Object>} Purchase result
   */
  async addPurchase(purchaseData) {
    try {
      // Validate input data
      const validation = this.validatePurchaseData(purchaseData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Process and enrich purchase data
      const enrichedData = await this.enrichPurchaseData(purchaseData);

      // Calculate derived values
      const calculatedData = this.calculatePurchaseValues(enrichedData);

      // Send to API
      const result = await apiClient.addPurchase({
        userKey: stateManager.getState('user.id', 'guest'),
        ...calculatedData
      });

      // Update local state
      this.updateLocalState(result, calculatedData);

      // Cache the purchase
      await this.cachePurchase(result);

      // Log success
      logInfo('Purchase added successfully', {
        purchaseId: result.purchase_id,
        ingredient: calculatedData.ingredient_id,
        quantity: calculatedData.qtyBuy,
        total: calculatedData.totalPrice
      });

      // Clear form
      actions.setLoading(false);

      return {
        success: true,
        data: result,
        message: 'การบันทึกการซื้อเสร็จสิ้น'
      };

    } catch (error) {
      logError('Add purchase failed:', { error: error.message, data: purchaseData });
      actions.addError(error.message);
      actions.setLoading(false);

      return {
        success: false,
        error: error.message,
        code: this.errorCodeFromMessage(error.message)
      };
    }
  }

  /**
   * Validate purchase data against business rules
   * @param {Object} data - Purchase data to validate
   * @returns {Object} Validation result
   */
  validatePurchaseData(data) {
    // Basic validation using business rules
    const validation = validateBusinessRules(data, Object.entries(this.validationRules).map(([key, rule]) => ({ field: key, ...rule })));

    // Additional business logic validation
    if (data.qtyBuy && data.totalPrice) {
      const qty = safeNumber(data.qtyBuy);
      const total = safeNumber(data.totalPrice);

      if (qty > 0 && total > 0) {
        const unitPrice = total / qty;

        // Check for unusually high prices
        if (unitPrice > 10000) {
          validation.warnings.push('ราคาต่อหน่วยสูงผิดปกติ');
        }

        // Check for unusually low prices
        if (unitPrice < 0.01) {
          validation.warnings.push('ราคาต่อหน่วยต่ำผิดปกติ');
        }
      }
    }

    // Validate actual yield if provided
    if (data.actualYield && data.qtyBuy) {
      const actualYield = safeNumber(data.actualYield);
      const qtyBuy = safeNumber(data.qtyBuy);

      if (actualYield > 0 && qtyBuy > 0) {
        const ratio = actualYield / qtyBuy;
        if (ratio > 1000 || ratio < 0.001) {
          validation.warnings.push('อัตราส่วนผลผลิตต่อการซื้อผิดปกติ');
        }
      }
    }

    return validation;
  }

  /**
   * Enrich purchase data with additional information
   * @param {Object} data - Original purchase data
   * @returns {Promise<Object>} Enriched purchase data
   */
  async enrichPurchaseData(data) {
    const enriched = { ...data };

    try {
      // Get ingredient information
      const ingredient = await this.getIngredientInfo(data.ingredient_id);

      if (ingredient) {
        enriched.ingredientName = ingredient.name;
        enriched.stockUnit = ingredient.stock_unit;
        enriched.buyUnit = ingredient.buy_unit;
        enriched.ratio = ingredient.buy_to_stock_ratio;
        enriched.minStock = ingredient.min_stock;
      } else {
        // Set defaults for new ingredients
        enriched.ingredientName = data.ingredient_id;
        enriched.stockUnit = BUSINESS.DEFAULT_UNITS.STOCK;
        enriched.buyUnit = BUSINESS.DEFAULT_UNITS.BUY;
        enriched.ratio = BUSINESS.DEFAULT_UNITS.RATIO;
        enriched.minStock = 5;
      }

      // Add timestamp
      enriched.date = data.date || new Date().toISOString().slice(0, 10);
      enriched.timestamp = new Date().toISOString();

      // Add lot ID
      enriched.lot_id = data.lot_id || generateId('LOT');

    } catch (error) {
      logWarn('Failed to enrich purchase data:', { error: error.message });
      // Continue with basic enrichment
      enriched.date = data.date || new Date().toISOString().slice(0, 10);
      enriched.lot_id = data.lot_id || generateId('LOT');
    }

    return enriched;
  }

  /**
   * Calculate derived purchase values
   * @param {Object} data - Enriched purchase data
   * @returns {Object} Purchase data with calculated values
   */
  calculatePurchaseValues(data) {
    const calculated = { ...data };

    // Calculate unit price if not provided
    if (!calculated.unitPrice && calculated.qtyBuy && calculated.totalPrice) {
      calculated.unitPrice = safeNumber(calculated.totalPrice) / safeNumber(calculated.qtyBuy);
    }

    // Calculate stock quantity
    if (calculated.actualYield && calculated.actualYield > 0) {
      // Use actual yield for stock calculation
      calculated.qtyStock = safeNumber(calculated.actualYield);
      calculated.costPerStock = safeNumber(calculated.totalPrice) / calculated.qtyStock;
    } else {
      // Use standard ratio for stock calculation
      const ratio = calculated.ratio || 1;
      calculated.qtyStock = safeNumber(calculated.qtyBuy) * (1 / safeNumber(ratio));
      calculated.costPerStock = calculated.qtyStock > 0
        ? safeNumber(calculated.totalPrice) / calculated.qtyStock
        : 0;
    }

    // Format numeric values
    calculated.qtyBuy = safeNumber(calculated.qtyBuy);
    calculated.totalPrice = safeNumber(calculated.totalPrice);
    calculated.unitPrice = safeNumber(calculated.unitPrice);
    calculated.qtyStock = safeNumber(calculated.qtyStock);
    calculated.costPerStock = safeNumber(calculated.costPerStock);

    return calculated;
  }

  /**
   * Get ingredient information from cache or API
   * @param {string} ingredientId - Ingredient ID or name
   * @returns {Promise<Object|null>} Ingredient information
   */
  async getIngredientInfo(ingredientId) {
    try {
      // Try cache first
      const cacheKey = `ingredient_${ingredientId}`;
      let ingredient = await cacheManager.get(cacheKey);

      if (!ingredient) {
        // Try API
        const ingredients = await apiClient.getIngredients({ search: ingredientId });
        ingredient = ingredients.find(item =>
          item.id === ingredientId ||
          item.name.toLowerCase() === ingredientId.toLowerCase()
        );

        if (ingredient) {
          await cacheManager.set(cacheKey, ingredient);
        }
      }

      return ingredient || null;

    } catch (error) {
      logError('Failed to get ingredient info:', { ingredientId, error: error.message });
      return null;
    }
  }

  /**
   * Update local state after successful purchase
   * @param {Object} result - API result
   * @param {Object} purchaseData - Purchase data
   */
  updateLocalState(result, purchaseData) {
    try {
      // Update purchases list
      const currentPurchases = stateManager.getState('data.purchases', []);
      const updatedPurchases = [result, ...currentPurchases].slice(0, 100); // Keep last 100
      stateManager.setState('data.purchases', updatedPurchases);

      // Update ingredient stock if available
      if (purchaseData.ingredientName) {
        const currentIngredients = stateManager.getState('data.ingredients', []);
        const ingredientIndex = currentIngredients.findIndex(
          item => item.id === purchaseData.ingredient_id ||
                  item.name === purchaseData.ingredientName
        );

        if (ingredientIndex >= 0) {
          const updatedIngredients = [...currentIngredients];
          updatedIngredients[ingredientIndex] = {
            ...updatedIngredients[ingredientIndex],
            last_purchase_date: purchaseData.date,
            last_purchase_price: purchaseData.unitPrice,
            stock: (updatedIngredients[ingredientIndex].stock || 0) + purchaseData.qtyStock
          };
          stateManager.setState('data.ingredients', updatedIngredients);
        }
      }

      // Update cache dirty flag
      stateManager.setState('cache.dirty', true);

    } catch (error) {
      logError('Failed to update local state:', { error: error.message });
    }
  }

  /**
   * Cache purchase data for offline access
   * @param {Object} purchase - Purchase data
   */
  async cachePurchase(purchase) {
    try {
      const cacheKey = `purchase_${purchase.purchase_id}`;
      await cacheManager.set(cacheKey, purchase);

      // Also update purchases list cache
      const purchasesCacheKey = 'purchases_list';
      const cachedPurchases = await cacheManager.get(purchasesCacheKey) || [];
      const updatedPurchases = [purchase, ...cachedPurchases.filter(p => p.purchase_id !== purchase.purchase_id)];
      await cacheManager.set(purchasesCacheKey, updatedPurchases.slice(0, 100));

    } catch (error) {
      logError('Failed to cache purchase:', { error: error.message });
    }
  }

  /**
   * Get recent purchases
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Recent purchases
   */
  async getRecentPurchases(options = {}) {
    try {
      const { limit = 20, ingredientId, startDate, endDate } = options;

      // Try cache first
      const cacheKey = `recent_purchases_${JSON.stringify(options)}`;
      let purchases = await cacheManager.get(cacheKey);

      if (!purchases) {
        // Fetch from API
        purchases = await apiClient.getRecentPurchases(options);
        await cacheManager.set(cacheKey, purchases);
      }

      // Filter locally if needed
      let filteredPurchases = purchases || [];

      if (ingredientId) {
        filteredPurchases = filteredPurchases.filter(p =>
          p.ingredient_id === ingredientId
        );
      }

      if (startDate) {
        const start = new Date(startDate);
        filteredPurchases = filteredPurchases.filter(p =>
          new Date(p.date) >= start
        );
      }

      if (endDate) {
        const end = new Date(endDate);
        filteredPurchases = filteredPurchases.filter(p =>
          new Date(p.date) <= end
        );
      }

      return filteredPurchases.slice(0, limit);

    } catch (error) {
      logError('Failed to get recent purchases:', { error: error.message });
      return [];
    }
  }

  /**
   * Calculate purchase statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Purchase statistics
   */
  async getPurchaseStatistics(startDate, endDate) {
    try {
      const purchases = await this.getRecentPurchases({ startDate, endDate });

      const stats = {
        totalPurchases: purchases.length,
        totalAmount: purchases.reduce((sum, p) => sum + safeNumber(p.totalPrice), 0),
        averagePurchaseValue: 0,
        topIngredients: this.getTopPurchasedIngredients(purchases),
        purchasesByDay: this.groupPurchasesByDay(purchases),
        spendingTrend: this.calculateSpendingTrend(purchases)
      };

      stats.averagePurchaseValue = stats.totalPurchases > 0
        ? stats.totalAmount / stats.totalPurchases
        : 0;

      return stats;

    } catch (error) {
      logError('Failed to calculate purchase statistics:', { error: error.message });
      return {
        totalPurchases: 0,
        totalAmount: 0,
        averagePurchaseValue: 0,
        topIngredients: [],
        purchasesByDay: {},
        spendingTrend: 0
      };
    }
  }

  /**
   * Get most frequently purchased ingredients
   * @param {Array} purchases - Purchase list
   * @param {number} limit - Number of top ingredients to return
   * @returns {Array} Top ingredients with purchase count
   */
  getTopPurchasedIngredients(purchases, limit = 10) {
    const ingredientCounts = {};

    purchases.forEach(purchase => {
      const key = purchase.ingredient_id;
      if (!ingredientCounts[key]) {
        ingredientCounts[key] = {
          ingredient_id: key,
          name: purchase.ingredient_name || key,
          count: 0,
          totalAmount: 0,
          totalQuantity: 0
        };
      }

      ingredientCounts[key].count++;
      ingredientCounts[key].totalAmount += safeNumber(purchase.totalPrice);
      ingredientCounts[key].totalQuantity += safeNumber(purchase.qtyBuy);
    });

    return Object.values(ingredientCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Group purchases by day
   * @param {Array} purchases - Purchase list
   * @returns {Object} Purchases grouped by day
   */
  groupPurchasesByDay(purchases) {
    const grouped = {};

    purchases.forEach(purchase => {
      const date = purchase.date || new Date().toISOString().slice(0, 10);
      if (!grouped[date]) {
        grouped[date] = {
          count: 0,
          totalAmount: 0,
          purchases: []
        };
      }

      grouped[date].count++;
      grouped[date].totalAmount += safeNumber(purchase.totalPrice);
      grouped[date].purchases.push(purchase);
    });

    return grouped;
  }

  /**
   * Calculate spending trend
   * @param {Array} purchases - Purchase list
   * @returns {number} Spending trend percentage
   */
  calculateSpendingTrend(purchases) {
    if (purchases.length < 2) return 0;

    // Sort by date
    const sortedPurchases = purchases.sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    // Split into two halves
    const midPoint = Math.floor(sortedPurchases.length / 2);
    const firstHalf = sortedPurchases.slice(0, midPoint);
    const secondHalf = sortedPurchases.slice(midPoint);

    const firstHalfTotal = firstHalf.reduce((sum, p) => sum + safeNumber(p.totalPrice), 0);
    const secondHalfTotal = secondHalf.reduce((sum, p) => sum + safeNumber(p.totalPrice), 0);

    if (firstHalfTotal === 0) return secondHalfTotal > 0 ? 100 : 0;

    return ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
  }

  /**
   * Extract error code from error message
   * @param {string} message - Error message
   * @returns {string} Error code
   */
  errorCodeFromMessage(message) {
    if (message.includes('Validation failed')) return 'VALIDATION_ERROR';
    if (message.includes('permission')) return 'PERMISSION_DENIED';
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('network')) return 'NETWORK_ERROR';
    if (message.includes('timeout')) return 'TIMEOUT';
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get purchase suggestions based on history
   * @returns {Promise<Array>} Purchase suggestions
   */
  async getPurchaseSuggestions() {
    try {
      const stats = await this.getPurchaseStatistics(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date()
      );

      const suggestions = [];

      // Suggest frequently purchased low-stock items
      const lowStock = stateManager.getState('data.lowStock', []);
      for (const item of lowStock) {
        const topIngredient = stats.topIngredients.find(top =>
          top.ingredient_id === item.id
        );

        if (topIngredient) {
          suggestions.push({
            type: 'low_stock_frequent',
            ingredient_id: item.id,
            name: item.name,
            reason: 'พบในรายการวัตถุดิบที่ซื้อบ่อยและสต็อกต่ำ',
            suggestedQuantity: Math.ceil(item.min_stock * 1.5),
            lastPurchase: topIngredient
          });
        }
      }

      return suggestions.slice(0, 5); // Limit to 5 suggestions

    } catch (error) {
      logError('Failed to get purchase suggestions:', { error: error.message });
      return [];
    }
  }

  /**
   * Export purchase data
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} format - Export format ('csv' or 'json')
   * @returns {Promise<string>} Exported data
   */
  async exportPurchases(startDate, endDate, format = 'csv') {
    try {
      const purchases = await this.getRecentPurchases({ startDate, endDate });

      if (format === 'csv') {
        return this.exportToCSV(purchases);
      } else {
        return JSON.stringify(purchases, null, 2);
      }

    } catch (error) {
      logError('Failed to export purchases:', { error: error.message });
      throw error;
    }
  }

  /**
   * Export purchases to CSV format
   * @param {Array} purchases - Purchase list
   * @returns {string} CSV data
   */
  exportToCSV(purchases) {
    const headers = [
      'purchase_id',
      'date',
      'ingredient_id',
      'ingredient_name',
      'qty_buy',
      'unit',
      'unit_price',
      'total_price',
      'supplier_note',
      'lot_id'
    ];

    const csvRows = [
      headers.join(','),
      ...purchases.map(purchase => [
        purchase.purchase_id,
        purchase.date,
        purchase.ingredient_id,
        purchase.ingredient_name || '',
        purchase.qtyBuy,
        purchase.unit,
        purchase.unitPrice,
        purchase.totalPrice,
        `"${purchase.supplier_note || ''}"`,
        purchase.lot_id
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}

// Create singleton instance
export const purchaseManager = new PurchaseManager();

// Export for use in other modules
export default purchaseManager;
