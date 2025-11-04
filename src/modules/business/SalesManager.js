/**
 * Sales Management Module
 * Handles all sales-related business logic with validation and optimization
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
  formatDate,
  getPlatformFee,
  calculateProfitMargin
} from '../../utils/utils.js';
import { BUSINESS, ERRORS, SHEETS } from '../../config/config.js';

/**
 * Sales Manager with enhanced business logic
 */
export class SalesManager {
  constructor() {
    this.validationRules = {
      platform: { required: true, type: 'string', min: 1, max: 50 },
      menu_id: { required: true, type: 'string', min: 1, max: 100 },
      qty: { required: true, type: 'number', min: BUSINESS.VALIDATION.MIN_QUANTITY, max: BUSINESS.VALIDATION.MAX_QUANTITY },
      price: { required: true, type: 'number', min: BUSINESS.VALIDATION.MIN_PRICE, max: BUSINESS.VALIDATION.MAX_PRICE }
    };
  }

  /**
   * Add new sale with comprehensive validation
   * @param {Object} saleData - Sale data
   * @returns {Promise<Object>} Sale result
   */
  async addSale(saleData) {
    try {
      actions.setLoading(true);

      // Validate input data
      const validation = this.validateSaleData(saleData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Process and enrich sale data
      const enrichedData = await this.enrichSaleData(saleData);

      // Calculate derived values
      const calculatedData = this.calculateSaleValues(enrichedData);

      // Check inventory availability
      await this.checkInventoryAvailability(calculatedData);

      // Send to API
      const result = await apiClient.addSale({
        userKey: stateManager.getState('user.id', 'guest'),
        ...calculatedData
      });

      // Update local state
      this.updateLocalState(result, calculatedData);

      // Cache the sale
      await this.cacheSale(result);

      // Log success
      logInfo('Sale added successfully', {
        saleId: result.sale_id,
        platform: calculatedData.platform,
        menu: calculatedData.menu_id,
        quantity: calculatedData.qty,
        total: calculatedData.gross
      });

      // Clear form
      actions.setLoading(false);

      return {
        success: true,
        data: result,
        message: 'การบันทึกการขายเสร็จสิ้น'
      };

    } catch (error) {
      logError('Add sale failed:', { error: error.message, data: saleData });
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
   * Validate sale data against business rules
   * @param {Object} data - Sale data to validate
   * @returns {Object} Validation result
   */
  validateSaleData(data) {
    // Basic validation using business rules
    const validation = validateBusinessRules(data, Object.entries(this.validationRules).map(([key, rule]) => ({ field: key, ...rule })));

    // Additional business logic validation
    if (data.qty && data.price) {
      const qty = safeNumber(data.qty);
      const price = safeNumber(data.price);
      const total = qty * price;

      // Check for unusually high sales
      if (total > 50000) {
        validation.warnings.push('ยอดขายสูงผิดปกติ');
      }

      // Check platform validity
      if (data.platform && !BUSINESS.PLATFORMS[data.platform]) {
        validation.warnings.push('แพลตฟอร์มไม่อยู่ในรายการที่กำหนด');
      }
    }

    return validation;
  }

  /**
   * Enrich sale data with additional information
   * @param {Object} data - Original sale data
   * @returns {Promise<Object>} Enriched sale data
   */
  async enrichSaleData(data) {
    const enriched = { ...data };

    try {
      // Get menu information
      const menu = await this.getMenuInfo(data.menu_id);

      if (menu) {
        enriched.menuName = menu.name;
        enriched.menuPrice = menu.price;
        enriched.menuCategory = menu.category;
        enriched.recipeIngredients = menu.ingredients || [];
      } else {
        // Set defaults for new menus
        enriched.menuName = data.menu_id;
        enriched.menuPrice = safeNumber(data.price);
        enriched.menuCategory = 'General';
        enriched.recipeIngredients = [];
      }

      // Add timestamp
      enriched.date = data.date || new Date().toISOString().slice(0, 10);
      enriched.timestamp = new Date().toISOString();

      // Add sale ID
      enriched.sale_id = data.sale_id || generateId('SAL');

      // Get platform fee info
      const platformInfo = BUSINESS.PLATFORMS[data.platform] || { fee: 0, name: data.platform };
      enriched.platformFee = platformInfo.fee;
      enriched.platformName = platformInfo.name;

    } catch (error) {
      logWarn('Failed to enrich sale data:', { error: error.message });
      // Continue with basic enrichment
      enriched.date = data.date || new Date().toISOString().slice(0, 10);
      enriched.sale_id = data.sale_id || generateId('SAL');
    }

    return enriched;
  }

  /**
   * Calculate derived sale values
   * @param {Object} data - Enriched sale data
   * @returns {Object} Sale data with calculated values
   */
  calculateSaleValues(data) {
    const calculated = { ...data };

    // Format numeric values
    calculated.qty = safeNumber(calculated.qty);
    calculated.price = safeNumber(calculated.price);

    // Calculate gross amount
    calculated.gross = calculated.qty * calculated.price;

    // Calculate platform fee and net amounts
    const platformFee = calculated.platformFee || getPlatformFee(calculated.platform);
    calculated.netPerUnit = calculated.price * (1 - platformFee);
    calculated.net = calculated.gross * (1 - platformFee);

    // Calculate COGS (Cost of Goods Sold)
    calculated.cogs = this.calculateCOGS(calculated);

    // Calculate profit
    calculated.profit = calculated.net - calculated.cogs;

    // Calculate profit margin
    calculated.profitMargin = calculated.net > 0 ? calculateProfitMargin(calculated.net, calculated.cogs) : 0;

    return calculated;
  }

  /**
   * Calculate Cost of Goods Sold for a sale
   * @param {Object} saleData - Sale data with recipe information
   * @returns {number} COGS amount
   */
  calculateCOGS(saleData) {
    if (!saleData.recipeIngredients || saleData.recipeIngredients.length === 0) {
      return 0;
    }

    let totalCOGS = 0;

    for (const ingredient of saleData.recipeIngredients) {
      const quantityNeeded = safeNumber(ingredient.qty_per_serve) * safeNumber(saleData.qty);
      const ingredientCost = safeNumber(ingredient.cost_per_unit || 0);

      totalCOGS += quantityNeeded * ingredientCost;
    }

    return totalCOGS;
  }

  /**
   * Check inventory availability before sale
   * @param {Object} saleData - Sale data to check
   * @returns {Promise<void>}
   */
  async checkInventoryAvailability(saleData) {
    if (!saleData.recipeIngredients || saleData.recipeIngredients.length === 0) {
      return;
    }

    const unavailableIngredients = [];

    for (const ingredient of saleData.recipeIngredients) {
      try {
        const ingredientInfo = await this.getIngredientInfo(ingredient.ingredient_id);

        if (ingredientInfo) {
          const requiredQuantity = safeNumber(ingredient.qty_per_serve) * safeNumber(saleData.qty);
          const availableStock = safeNumber(ingredientInfo.stock || 0);

          if (availableStock < requiredQuantity) {
            unavailableIngredients.push({
              ingredient_id: ingredient.ingredient_id,
              name: ingredientInfo.name,
              required: requiredQuantity,
              available: availableStock,
              shortage: requiredQuantity - availableStock
            });
          }
        }
      } catch (error) {
        logWarn('Failed to check ingredient availability:', {
          ingredient_id: ingredient.ingredient_id,
          error: error.message
        });
      }
    }

    if (unavailableIngredients.length > 0) {
      const message = `วัตถุดิบไม่เพียงพอ: ${unavailableIngredients.map(item =>
        `${item.name} (ขาดอีก ${item.shortage})`
      ).join(', ')}`;
      throw new Error(message);
    }
  }

  /**
   * Get menu information from cache or API
   * @param {string} menuId - Menu ID or name
   * @returns {Promise<Object|null>} Menu information
   */
  async getMenuInfo(menuId) {
    try {
      // Try cache first
      const cacheKey = `menu_${menuId}`;
      let menu = await cacheManager.get(cacheKey);

      if (!menu) {
        // Try API
        const menus = await apiClient.getMenus({ search: menuId });
        menu = menus.find(item =>
          item.id === menuId ||
          item.name.toLowerCase() === menuId.toLowerCase()
        );

        if (menu) {
          // Get menu recipe ingredients
          const ingredients = await apiClient.getMenuIngredients(menuId);
          menu.ingredients = ingredients || [];

          await cacheManager.set(cacheKey, menu);
        }
      }

      return menu || null;

    } catch (error) {
      logError('Failed to get menu info:', { menuId, error: error.message });
      return null;
    }
  }

  /**
   * Get ingredient information from cache or API
   * @param {string} ingredientId - Ingredient ID
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
        ingredient = ingredients.find(item => item.id === ingredientId);

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
   * Update local state after successful sale
   * @param {Object} result - API result
   * @param {Object} saleData - Sale data
   */
  updateLocalState(result, saleData) {
    try {
      // Update sales list
      const currentSales = stateManager.getState('data.sales', []);
      const updatedSales = [result, ...currentSales].slice(0, 100); // Keep last 100
      stateManager.setState('data.sales', updatedSales);

      // Update today's summary
      const currentSummary = stateManager.getState('data.todaySummary', {});
      const updatedSummary = {
        ...currentSummary,
        totalSales: (currentSummary.totalSales || 0) + 1,
        totalRevenue: (currentSummary.totalRevenue || 0) + saleData.gross,
        totalProfit: (currentSummary.totalProfit || 0) + saleData.profit,
        lastSaleTime: saleData.timestamp
      };
      stateManager.setState('data.todaySummary', updatedSummary);

      // Update menu statistics if available
      if (saleData.menuName) {
        const currentMenus = stateManager.getState('data.menus', []);
        const menuIndex = currentMenus.findIndex(
          item => item.id === saleData.menu_id ||
                  item.name === saleData.menuName
        );

        if (menuIndex >= 0) {
          const updatedMenus = [...currentMenus];
          const menu = updatedMenus[menuIndex];
          updatedMenus[menuIndex] = {
            ...menu,
            salesCount: (menu.salesCount || 0) + 1,
            totalRevenue: (menu.totalRevenue || 0) + saleData.gross,
            lastSaleDate: saleData.date
          };
          stateManager.setState('data.menus', updatedMenus);
        }
      }

      // Update cache dirty flag
      stateManager.setState('cache.dirty', true);

    } catch (error) {
      logError('Failed to update local state:', { error: error.message });
    }
  }

  /**
   * Cache sale data for offline access
   * @param {Object} sale - Sale data
   */
  async cacheSale(sale) {
    try {
      const cacheKey = `sale_${sale.sale_id}`;
      await cacheManager.set(cacheKey, sale);

      // Also update sales list cache
      const salesCacheKey = 'sales_list';
      const cachedSales = await cacheManager.get(salesCacheKey) || [];
      const updatedSales = [sale, ...cachedSales.filter(s => s.sale_id !== sale.sale_id)];
      await cacheManager.set(salesCacheKey, updatedSales.slice(0, 100));

    } catch (error) {
      logError('Failed to cache sale:', { error: error.message });
    }
  }

  /**
   * Get recent sales
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Recent sales
   */
  async getRecentSales(options = {}) {
    try {
      const { limit = 20, platform, menuId, startDate, endDate } = options;

      // Try cache first
      const cacheKey = `recent_sales_${JSON.stringify(options)}`;
      let sales = await cacheManager.get(cacheKey);

      if (!sales) {
        // Fetch from API
        sales = await apiClient.getRecentTransactions(options);
        await cacheManager.set(cacheKey, sales);
      }

      // Filter locally if needed
      let filteredSales = sales || [];

      if (platform) {
        filteredSales = filteredSales.filter(s =>
          s.platform === platform
        );
      }

      if (menuId) {
        filteredSales = filteredSales.filter(s =>
          s.menu_id === menuId
        );
      }

      if (startDate) {
        const start = new Date(startDate);
        filteredSales = filteredSales.filter(s =>
          new Date(s.date) >= start
        );
      }

      if (endDate) {
        const end = new Date(endDate);
        filteredSales = filteredSales.filter(s =>
          new Date(s.date) <= end
        );
      }

      return filteredSales.slice(0, limit);

    } catch (error) {
      logError('Failed to get recent sales:', { error: error.message });
      return [];
    }
  }

  /**
   * Calculate sales statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Sales statistics
   */
  async getSalesStatistics(startDate, endDate) {
    try {
      const sales = await this.getRecentSales({ startDate, endDate });

      const stats = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, s) => sum + safeNumber(s.gross || 0), 0),
        totalProfit: sales.reduce((sum, s) => sum + safeNumber(s.profit || 0), 0),
        averageSaleValue: 0,
        topMenus: this.getTopSellingMenus(sales),
        salesByPlatform: this.groupSalesByPlatform(sales),
        salesByDay: this.groupSalesByDay(sales),
        revenueTrend: this.calculateRevenueTrend(sales),
        profitMargin: 0
      };

      stats.averageSaleValue = stats.totalSales > 0
        ? stats.totalRevenue / stats.totalSales
        : 0;

      stats.profitMargin = stats.totalRevenue > 0
        ? (stats.totalProfit / stats.totalRevenue) * 100
        : 0;

      return stats;

    } catch (error) {
      logError('Failed to calculate sales statistics:', { error: error.message });
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
        averageSaleValue: 0,
        topMenus: [],
        salesByPlatform: {},
        salesByDay: {},
        revenueTrend: 0,
        profitMargin: 0
      };
    }
  }

  /**
   * Get most frequently sold menus
   * @param {Array} sales - Sales list
   * @param {number} limit - Number of top menus to return
   * @returns {Array} Top menus with sales count
   */
  getTopSellingMenus(sales, limit = 10) {
    const menuCounts = {};

    sales.forEach(sale => {
      const key = sale.menu_id;
      if (!menuCounts[key]) {
        menuCounts[key] = {
          menu_id: key,
          name: sale.menu_name || key,
          count: 0,
          totalRevenue: 0,
          totalQuantity: 0,
          totalProfit: 0
        };
      }

      menuCounts[key].count++;
      menuCounts[key].totalRevenue += safeNumber(sale.gross || 0);
      menuCounts[key].totalQuantity += safeNumber(sale.qty || 0);
      menuCounts[key].totalProfit += safeNumber(sale.profit || 0);
    });

    return Object.values(menuCounts)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  /**
   * Group sales by platform
   * @param {Array} sales - Sales list
   * @returns {Object} Sales grouped by platform
   */
  groupSalesByPlatform(sales) {
    const grouped = {};

    sales.forEach(sale => {
      const platform = sale.platform || 'unknown';
      if (!grouped[platform]) {
        grouped[platform] = {
          count: 0,
          totalRevenue: 0,
          totalProfit: 0,
          averageSaleValue: 0
        };
      }

      grouped[platform].count++;
      grouped[platform].totalRevenue += safeNumber(sale.gross || 0);
      grouped[platform].totalProfit += safeNumber(sale.profit || 0);
    });

    // Calculate averages
    Object.values(grouped).forEach(platform => {
      platform.averageSaleValue = platform.count > 0
        ? platform.totalRevenue / platform.count
        : 0;
    });

    return grouped;
  }

  /**
   * Group sales by day
   * @param {Array} sales - Sales list
   * @returns {Object} Sales grouped by day
   */
  groupSalesByDay(sales) {
    const grouped = {};

    sales.forEach(sale => {
      const date = sale.date || new Date().toISOString().slice(0, 10);
      if (!grouped[date]) {
        grouped[date] = {
          count: 0,
          totalRevenue: 0,
          totalProfit: 0,
          averageSaleValue: 0,
          sales: []
        };
      }

      grouped[date].count++;
      grouped[date].totalRevenue += safeNumber(sale.gross || 0);
      grouped[date].totalProfit += safeNumber(sale.profit || 0);
      grouped[date].sales.push(sale);
    });

    // Calculate averages
    Object.values(grouped).forEach(day => {
      day.averageSaleValue = day.count > 0
        ? day.totalRevenue / day.count
        : 0;
    });

    return grouped;
  }

  /**
   * Calculate revenue trend
   * @param {Array} sales - Sales list
   * @returns {number} Revenue trend percentage
   */
  calculateRevenueTrend(sales) {
    if (sales.length < 2) return 0;

    // Sort by date
    const sortedSales = sales.sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    // Split into two halves
    const midPoint = Math.floor(sortedSales.length / 2);
    const firstHalf = sortedSales.slice(0, midPoint);
    const secondHalf = sortedSales.slice(midPoint);

    const firstHalfRevenue = firstHalf.reduce((sum, s) => sum + safeNumber(s.gross || 0), 0);
    const secondHalfRevenue = secondHalf.reduce((sum, s) => sum + safeNumber(s.gross || 0), 0);

    if (firstHalfRevenue === 0) return secondHalfRevenue > 0 ? 100 : 0;

    return ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;
  }

  /**
   * Get sales suggestions based on history
   * @returns {Promise<Array>} Sales suggestions
   */
  async getSalesSuggestions() {
    try {
      const stats = await this.getSalesStatistics(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        new Date()
      );

      const suggestions = [];

      // Suggest top performing menus
      if (stats.topMenus.length > 0) {
        const topMenu = stats.topMenus[0];
        suggestions.push({
          type: 'top_performer',
          menu_id: topMenu.menu_id,
          name: topMenu.name,
          reason: 'เมนูยอดนิยมสูงสุดใน 7 วันล่าสุด',
          suggestedPrice: topMenu.totalRevenue / topMenu.totalQuantity,
          stats: topMenu
        });
      }

      // Suggest platform optimization
      const platforms = Object.entries(stats.salesByPlatform);
      if (platforms.length > 1) {
        const bestPlatform = platforms.reduce((best, [platform, data]) =>
          data.profitMargin > (best[1]?.profitMargin || 0) ? [platform, data] : best
        , [null, { profitMargin: 0 }]);

        if (bestPlatform[0]) {
          suggestions.push({
            type: 'platform_optimization',
            platform: bestPlatform[0],
            reason: 'แพลตฟอร์มที่ให้กำไรสูงสุด',
            stats: bestPlatform[1]
          });
        }
      }

      return suggestions.slice(0, 3); // Limit to 3 suggestions

    } catch (error) {
      logError('Failed to get sales suggestions:', { error: error.message });
      return [];
    }
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
    if (message.includes('ไม่เพียงพอ')) return 'INSUFFICIENT_INVENTORY';
    return 'UNKNOWN_ERROR';
  }

  /**
   * Export sales data
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} format - Export format ('csv' or 'json')
   * @returns {Promise<string>} Exported data
   */
  async exportSales(startDate, endDate, format = 'csv') {
    try {
      const sales = await this.getRecentSales({ startDate, endDate });

      if (format === 'csv') {
        return this.exportToCSV(sales);
      } else {
        return JSON.stringify(sales, null, 2);
      }

    } catch (error) {
      logError('Failed to export sales:', { error: error.message });
      throw error;
    }
  }

  /**
   * Export sales to CSV format
   * @param {Array} sales - Sales list
   * @returns {string} CSV data
   */
  exportToCSV(sales) {
    const headers = [
      'sale_id',
      'date',
      'platform',
      'menu_id',
      'menu_name',
      'qty',
      'price',
      'gross',
      'net',
      'cogs',
      'profit',
      'profit_margin'
    ];

    const csvRows = [
      headers.join(','),
      ...sales.map(sale => [
        sale.sale_id,
        sale.date,
        sale.platform,
        sale.menu_id,
        `"${sale.menu_name || ''}"`,
        sale.qty,
        sale.price,
        sale.gross,
        sale.net,
        sale.cogs,
        sale.profit,
        sale.profitMargin
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}

// Create singleton instance
export const salesManager = new SalesManager();

// Export for use in other modules
export default salesManager;
