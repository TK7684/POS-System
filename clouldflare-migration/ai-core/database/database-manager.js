/**
 * Unified Database Manager for AI Chatbots
 * Provides complete CRUD operations for all database tables
 * No restrictions - full read/write access to everything
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export class DatabaseManager {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ==================== Universal CRUD Operations ====================

  /**
   * Read any table with flexible filtering
   */
  async read(table, options = {}) {
    const {
      columns = '*',
      filters = {},
      orderBy = {},
      limit = null,
      offset = null,
      joins = []
    } = options;

    try {
      let query = this.supabase.from(table).select(columns);

      // Apply joins if specified
      if (joins.length > 0) {
        const joinColumns = [columns];
        joins.forEach(join => {
          joinColumns.push(`${join.table}(${join.columns})`);
        });
        query = this.supabase.from(table).select(joinColumns.join(','));
      }

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (typeof value === 'object') {
          if (value.in) query = query.in(field, value.in);
          if (value.gte) query = query.gte(field, value.gte);
          if (value.lte) query = query.lte(field, value.lte);
          if (value.gt) query = query.gt(field, value.gt);
          if (value.lt) query = query.lt(field, value.lt);
          if (value.like) query = query.like(field, value.like);
          if (value.ilike) query = query.ilike(field, value.ilike);
          if (value.neq) query = query.neq(field, value.neq);
        } else {
          query = query.eq(field, value);
        }
      });

      // Apply ordering
      if (orderBy.column) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
      }

      // Apply pagination
      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit || 100) - 1);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error reading from ${table}: ${error.message}`);
    }
  }

  /**
   * Create new records in any table
   */
  async create(table, records, options = {}) {
    const { onConflict = 'ignore' } = options;

    try {
      const { data, error } = await this.supabase
        .from(table)
        .insert(records, { onConflict })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error creating in ${table}: ${error.message}`);
    }
  }

  /**
   * Update records in any table
   */
  async update(table, updates, filters = {}) {
    try {
      let query = this.supabase.from(table).update(updates);

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value.in) query = query.in(field, value.in);
        else query = query.eq(field, value);
      });

      const { data, error } = await query.select();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error updating ${table}: ${error.message}`);
    }
  }

  /**
   * Delete records from any table
   */
  async delete(table, filters = {}) {
    try {
      let query = this.supabase.from(table).delete();

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value.in) query = query.in(field, value.in);
        else query = query.eq(field, value);
      });

      const { data, error } = await query.select();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error deleting from ${table}: ${error.message}`);
    }
  }

  // ==================== Advanced Query Operations ====================

  /**
   * Execute custom SQL queries (for complex operations)
   */
  async executeRawQuery(sql, params = []) {
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: sql,
        params: params
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error executing raw query: ${error.message}`);
    }
  }

  /**
   * Get aggregated data with custom grouping
   */
  async aggregate(table, groupBy, aggregations = {}, filters = {}) {
    try {
      // Build selection query
      const selectFields = [groupBy];
      Object.entries(aggregations).forEach(([field, operation]) => {
        selectFields.push(`${operation}(${field})`);
      });

      let query = this.supabase
        .from(table)
        .select(selectFields.join(', '))
        .group(groupBy);

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        query = query.eq(field, value);
      });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error aggregating data: ${error.message}`);
    }
  }

  // ==================== Business Logic Operations ====================

  /**
   * Complete menu cost calculation with real-time data
   */
  async calculateCompleteMenuCost(menuId) {
    try {
      // Get menu details
      const menu = await this.read('menus', { filters: { id: menuId }, limit: 1 });
      if (!menu.length) throw new Error('Menu not found');

      // Get recipes with ingredients
      const recipes = await this.read('menu_recipes', {
        filters: { menu_id: menuId },
        joins: [{ table: 'ingredients', columns: 'name, cost_per_unit, unit' }]
      });

      let totalCost = 0;
      const breakdown = [];

      for (const recipe of recipes) {
        const ingredientCost = recipe.quantity_per_serve * recipe.ingredients.cost_per_unit;
        totalCost += ingredientCost;
        breakdown.push({
          ingredient: recipe.ingredients.name,
          quantity: recipe.quantity_per_serve,
          unit: recipe.unit,
          cost_per_unit: recipe.ingredients.cost_per_unit,
          total_cost: ingredientCost
        });
      }

      return {
        menu: menu[0],
        total_cost: totalCost,
        breakdown: breakdown,
        selling_price: menu[0].price,
        profit_margin: menu[0].price ? ((menu[0].price - totalCost) / menu[0].price * 100) : 0
      };
    } catch (error) {
      throw new Error(`Error calculating menu cost: ${error.message}`);
    }
  }

  /**
   * Comprehensive sales analytics
   */
  async getSalesAnalytics(dateRange = {}) {
    try {
      const { startDate, endDate, groupBy = 'day' } = dateRange;

      let filters = {};
      if (startDate) filters.gte = { order_date: startDate };
      if (endDate) filters.lte = { order_date: endDate };

      // Get sales data with joins
      const sales = await this.read('sales', {
        columns: 'id, quantity, unit_price, total_amount, order_date, order_time, payment_method',
        joins: [
          { table: 'menus', columns: 'name, menu_id' },
          { table: 'platforms', columns: 'name, commission_rate' }
        ],
        filters
      });

      // Calculate analytics
      const analytics = {
        total_revenue: 0,
        total_orders: sales.length,
        best_sellers: {},
        platform_performance: {},
        payment_methods: {},
        daily_sales: {},
        hourly_distribution: {}
      };

      sales.forEach(sale => {
        analytics.total_revenue += sale.total_amount;

        // Best sellers
        const menuName = sale.menus.name;
        analytics.best_sellers[menuName] = (analytics.best_sellers[menuName] || 0) + sale.quantity;

        // Platform performance
        const platformName = sale.platforms.name;
        if (!analytics.platform_performance[platformName]) {
          analytics.platform_performance[platformName] = { revenue: 0, orders: 0, commission: 0 };
        }
        analytics.platform_performance[platformName].revenue += sale.total_amount;
        analytics.platform_performance[platformName].orders += 1;
        analytics.platform_performance[platformName].commission += sale.total_amount * (sale.platforms.commission_rate / 100);

        // Payment methods
        analytics.payment_methods[sale.payment_method] = (analytics.payment_methods[sale.payment_method] || 0) + 1;

        // Daily sales
        if (!analytics.daily_sales[sale.order_date]) {
          analytics.daily_sales[sale.order_date] = 0;
        }
        analytics.daily_sales[sale.order_date] += sale.total_amount;

        // Hourly distribution
        const hour = parseInt(sale.order_time.split(':')[0]);
        analytics.hourly_distribution[hour] = (analytics.hourly_distribution[hour] || 0) + 1;
      });

      return analytics;
    } catch (error) {
      throw new Error(`Error generating sales analytics: ${error.message}`);
    }
  }

  /**
   * Inventory management with predictive analysis
   */
  async getInventoryAnalytics() {
    try {
      // Get all ingredients with current stock
      const ingredients = await this.read('ingredients', {
        columns: 'id, name, current_stock, min_stock, unit, cost_per_unit, supplier'
      });

      // Get recent purchases for trend analysis
      const recentPurchases = await this.read('purchases', {
        columns: 'ingredient_id, quantity, total_amount, purchase_date',
        filters: {
          gte: { purchase_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
        }
      });

      // Get recent usage from sales via menu recipes
      const recentSales = await this.read('sales', {
        columns: 'menu_id, quantity',
        filters: {
          gte: { order_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
        }
      });

      // Calculate usage patterns
      const usagePatterns = {};
      const ingredientIds = new Set();

      for (const ingredient of ingredients) {
        ingredientIds.add(ingredient.id);
        usagePatterns[ingredient.id] = { usage: 0, purchases: 0 };
      }

      // Calculate ingredient usage from sales
      for (const sale of recentSales) {
        const recipes = await this.read('menu_recipes', {
          filters: { menu_id: sale.menu_id }
        });

        for (const recipe of recipes) {
          if (usagePatterns[recipe.ingredient_id]) {
            usagePatterns[recipe.ingredient_id].usage += recipe.quantity_per_serve * sale.quantity;
          }
        }
      }

      // Calculate recent purchases
      for (const purchase of recentPurchases) {
        if (usagePatterns[purchase.ingredient_id]) {
          usagePatterns[purchase.ingredient_id].purchases += purchase.quantity;
        }
      }

      // Generate analytics
      const analytics = {
        low_stock: [],
        critical_stock: [],
        overstocked: [],
        slow_moving: [],
        fast_moving: [],
        supplier_analysis: {},
        total_inventory_value: 0,
        stock_health_score: 0
      };

      let healthyItems = 0;
      let totalItems = ingredients.length;

      for (const ingredient of ingredients) {
        const stockLevel = ingredient.current_stock / ingredient.min_stock;
        const pattern = usagePatterns[ingredient.id];
        const weeklyUsage = pattern ? pattern.usage : 0;
        const value = ingredient.current_stock * ingredient.cost_per_unit;

        analytics.total_inventory_value += value;

        // Categorize stock levels
        if (stockLevel < 0.5) {
          analytics.critical_stock.push({
            ...ingredient,
            days_of_stock: weeklyUsage > 0 ? (ingredient.current_stock / weeklyUsage * 7).toFixed(1) : 0
          });
        } else if (stockLevel < 1) {
          analytics.low_stock.push({
            ...ingredient,
            days_of_stock: weeklyUsage > 0 ? (ingredient.current_stock / weeklyUsage * 7).toFixed(1) : 0
          });
        } else if (stockLevel > 3) {
          analytics.overstocked.push(ingredient);
        }

        // Movement analysis
        if (weeklyUsage > 0) {
          if (weeklyUsage > ingredient.min_stock * 0.5) {
            analytics.fast_moving.push(ingredient);
          } else if (weeklyUsage < ingredient.min_stock * 0.1) {
            analytics.slow_moving.push(ingredient);
          }
        }

        // Supplier analysis
        if (ingredient.supplier) {
          if (!analytics.supplier_analysis[ingredient.supplier]) {
            analytics.supplier_analysis[ingredient.supplier] = { items: 0, value: 0 };
          }
          analytics.supplier_analysis[ingredient.supplier].items++;
          analytics.supplier_analysis[ingredient.supplier].value += value;
        }

        if (stockLevel >= 1 && stockLevel <= 2) {
          healthyItems++;
        }
      }

      analytics.stock_health_score = (healthyItems / totalItems * 100).toFixed(1);

      return analytics;
    } catch (error) {
      throw new Error(`Error generating inventory analytics: ${error.message}`);
    }
  }

  // ==================== Data Import/Export ====================

  /**
   * Export data from any table
   */
  async exportData(table, format = 'json', options = {}) {
    try {
      const data = await this.read(table, options);

      if (format === 'csv') {
        // Convert to CSV
        if (!data.length) return '';
        const headers = Object.keys(data[0]);
        const csv = [headers.join(',')];
        data.forEach(row => {
          csv.push(headers.map(header => `"${row[header] || ''}"`).join(','));
        });
        return csv.join('\n');
      }

      return data;
    } catch (error) {
      throw new Error(`Error exporting data: ${error.message}`);
    }
  }

  /**
   * Import data into any table
   */
  async importData(table, data, options = {}) {
    const { batchSize = 100, skipDuplicates = true } = options;

    try {
      const results = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const result = await this.create(table, batch, {
          onConflict: skipDuplicates ? 'ignore' : 'merge'
        });
        results.push(...result);
      }
      return results;
    } catch (error) {
      throw new Error(`Error importing data: ${error.message}`);
    }
  }
}

export default DatabaseManager;
