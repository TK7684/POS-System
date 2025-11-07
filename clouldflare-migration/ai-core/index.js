/**
 * AI Core System - Unified Entry Point
 * Provides complete database access for both LINE Bot and WebApp
 * No restrictions - full CRUD operations on all tables
 */

// Import core components
import { DatabaseManager } from './database/database-manager.js';
import { AIProvider } from './ai-providers/ai-provider.js';
import { AIAssistant } from './handlers/ai-assistant.js';
import { LineBotHandler } from './handlers/line-bot-handler.js';
import { WebAppHandler } from './handlers/webapp-handler.js';

/**
 * AI Core System Factory
 * Creates configured AI handlers for different platforms
 */
export class AICoreSystem {
  constructor(config = {}) {
    this.config = this._mergeConfig(config);
    this.databaseManager = null;
    this.aiProvider = null;
    this.initialized = false;
  }

  /**
   * Initialize the AI core system
   */
  async initialize() {
    try {
      // Initialize database manager
      this.databaseManager = new DatabaseManager(
        this.config.supabaseUrl,
        this.config.supabaseKey
      );

      // Initialize AI provider
      this.aiProvider = new AIProvider(
        this.config.aiProvider.type,
        this.config.aiProvider.config
      );
      await this.aiProvider.initialize();

      this.initialized = true;
      console.log('AI Core System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Core System:', error);
      throw error;
    }
  }

  /**
   * Create LINE Bot handler
   */
  createLineBotHandler() {
    if (!this.initialized) {
      throw new Error('AI Core System not initialized. Call initialize() first.');
    }

    const lineBotConfig = {
      ...this.config,
      aiProvider: this.aiProvider,
      databaseManager: this.databaseManager,
    };

    return new LineBotHandler(lineBotConfig);
  }

  /**
   * Create WebApp handler
   */
  createWebAppHandler() {
    if (!this.initialized) {
      throw new Error('AI Core System not initialized. Call initialize() first.');
    }

    const webAppConfig = {
      ...this.config,
      aiProvider: this.aiProvider,
      databaseManager: this.databaseManager,
    };

    return new WebAppHandler(webAppConfig);
  }

  /**
   * Create AI assistant for direct use
   */
  createAIAssistant() {
    if (!this.initialized) {
      throw new Error('AI Core System not initialized. Call initialize() first.');
    }

    return new AIAssistant({
      ...this.config,
      aiProvider: this.aiProvider,
      databaseManager: this.databaseManager,
    });
  }

  /**
   * Get database manager directly
   */
  getDatabaseManager() {
    if (!this.initialized) {
      throw new Error('AI Core System not initialized. Call initialize() first.');
    }
    return this.databaseManager;
  }

  /**
   * Get AI provider directly
   */
  getAIProvider() {
    if (!this.initialized) {
      throw new Error('AI Core System not initialized. Call initialize() first.');
    }
    return this.aiProvider;
  }

  /**
   * Merge configuration with defaults
   */
  _mergeConfig(userConfig) {
    // Default configuration
    const defaultConfig = {
      supabaseUrl: this._getEnvVar('SUPABASE_URL') || 'https://rtfreafhlelpxqwohspq.supabase.co',
      supabaseKey: this._getEnvVar('SUPABASE_ANON_KEY') || this._getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),

      aiProvider: {
        type: 'gemini',
        config: {
          apiKey: this._getEnvVar('GEMINI_API_KEY') || this._getEnvVar('GOOGLE_CLOUD_API_KEY'),
        }
      },

      // Performance settings
      maxTokens: 2048,
      temperature: 0.7,
      timeout: 30000,

      // Security settings
      enableRateLimit: true,
      maxRequestsPerMinute: 60,
      enableInputSanitization: true,

      // Feature flags
      enableCaching: true,
      enableDebugging: false,
      enableAnalytics: true,
    };

    // Merge user config
    return this._deepMerge(defaultConfig, userConfig);
  }

  /**
   * Get environment variable (browser or server)
   */
  _getEnvVar(name) {
    // Browser environment
    if (typeof window !== 'undefined') {
      return window[name] || window[`VITE_${name}`] || null;
    }

    // Server environment (Cloudflare Workers)
    if (typeof globalThis !== 'undefined' && globalThis.process?.env) {
      return globalThis.process.env[name] || null;
    }

    return null;
  }

  /**
   * Deep merge objects
   */
  _deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Health check for all components
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {},
    };

    try {
      // Check database connection
      if (this.databaseManager) {
        health.components.database = await this._checkDatabase();
      }

      // Check AI provider
      if (this.aiProvider) {
        health.components.aiProvider = await this._checkAIProvider();
      }

      // Overall status
      const hasIssues = Object.values(health.components).some(comp => comp.status !== 'healthy');
      health.status = hasIssues ? 'degraded' : 'healthy';

    } catch (error) {
      health.status = 'error';
      health.error = error.message;
    }

    return health;
  }

  /**
   * Check database health
   */
  async _checkDatabase() {
    try {
      if (!this.databaseManager) {
        return { status: 'error', message: 'Database manager not initialized' };
      }

      // Simple connectivity test
      await this.databaseManager.read('users', { columns: 'id', limit: 1 });

      return { status: 'healthy', message: 'Database connected' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Check AI provider health
   */
  async _checkAIProvider() {
    try {
      if (!this.aiProvider) {
        return { status: 'error', message: 'AI provider not initialized' };
      }

      // Simple test request
      await this.aiProvider.generateCompletion('Test', { maxTokens: 10 });

      return { status: 'healthy', message: 'AI provider working' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        system: {
          platform: typeof window !== 'undefined' ? 'browser' : 'cloudflare',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Cloudflare Worker',
          memory: typeof performance !== 'undefined' ? performance.memory : null,
        },
        database: {
          status: 'unknown',
          recordCounts: {},
        },
        ai: {
          provider: this.config.aiProvider?.type || 'unknown',
          status: 'unknown',
        },
      };

      // Get database stats
      if (this.databaseManager) {
        const tables = ['users', 'menus', 'ingredients', 'sales', 'purchases', 'expenses'];

        for (const table of tables) {
          try {
            const count = await this.databaseManager.read(table, {
              columns: 'id',
              limit: 1000
            });
            stats.database.recordCounts[table] = count.length;
          } catch (error) {
            stats.database.recordCounts[table] = 'error';
          }
        }

        stats.database.status = 'connected';
      }

      // Test AI provider
      if (this.aiProvider) {
        try {
          const testStart = Date.now();
          await this.aiProvider.generateCompletion('ping', { maxTokens: 5 });
          const responseTime = Date.now() - testStart;

          stats.ai.status = 'healthy';
          stats.ai.responseTime = `${responseTime}ms`;
        } catch (error) {
          stats.ai.status = 'error';
          stats.ai.error = error.message;
        }
      }

      return stats;
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        status: 'error',
      };
    }
  }

  /**
   * Export configuration
   */
  exportConfig() {
    return {
      ...this.config,
      // Don't export sensitive keys
      supabaseKey: this.config.supabaseKey ? '[REDACTED]' : null,
      'aiProvider.config.apiKey': this.config.aiProvider?.config?.apiKey ? '[REDACTED]' : null,
    };
  }
}

// Export main components for direct use
export {
  DatabaseManager,
  AIProvider,
  AIAssistant,
  LineBotHandler,
  WebAppHandler,
  AICoreSystem,
};

// Default export - unified system
export default AICoreSystem;
