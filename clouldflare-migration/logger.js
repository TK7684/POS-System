// 📊 Comprehensive Logging Utility for POS System
// Provides detailed logging with timestamps, categories, and performance metrics

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  PERFORMANCE: 4
};

const LogCategory = {
  AUTH: '🔐 AUTH',
  DATABASE: '💾 DATABASE',
  API: '🌐 API',
  UI: '🎨 UI',
  PAYMENT: '💰 PAYMENT',
  INVENTORY: '📦 INVENTORY',
  AI: '🤖 AI',
  LINE: '💬 LINE',
  EXPENSE: '💸 EXPENSE',
  REPORT: '📊 REPORT',
  GENERAL: '⚙️ GENERAL'
};

class Logger {
  constructor(minLevel = LogLevel.DEBUG) {
    this.minLevel = minLevel;
    this.performanceMarks = new Map();
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
  }

  _formatTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 23);
  }

  _shouldLog(level) {
    return level >= this.minLevel;
  }

  _saveLog(level, category, message, data) {
    const log = {
      timestamp: this._formatTimestamp(),
      level,
      category,
      message,
      data
    };
    
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(category, message, data = null) {
    if (!this._shouldLog(LogLevel.DEBUG)) return;
    
    const prefix = `[${this._formatTimestamp()}] [DEBUG] ${category}`;
    console.log(`${prefix}: ${message}`, data || '');
    this._saveLog(LogLevel.DEBUG, category, message, data);
  }

  info(category, message, data = null) {
    if (!this._shouldLog(LogLevel.INFO)) return;
    
    const prefix = `[${this._formatTimestamp()}] [INFO] ${category}`;
    console.log(`${prefix}: ${message}`, data || '');
    this._saveLog(LogLevel.INFO, category, message, data);
  }

  warn(category, message, data = null) {
    if (!this._shouldLog(LogLevel.WARN)) return;
    
    const prefix = `[${this._formatTimestamp()}] [WARN] ${category}`;
    console.warn(`${prefix}: ${message}`, data || '');
    this._saveLog(LogLevel.WARN, category, message, data);
  }

  error(category, message, error = null) {
    if (!this._shouldLog(LogLevel.ERROR)) return;
    
    const prefix = `[${this._formatTimestamp()}] [ERROR] ${category}`;
    console.error(`${prefix}: ${message}`, error || '');
    
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null;
    
    this._saveLog(LogLevel.ERROR, category, message, errorData);
  }

  // Performance monitoring
  startTimer(label, category = LogCategory.GENERAL) {
    const mark = {
      label,
      category,
      startTime: performance.now(),
      timestamp: this._formatTimestamp()
    };
    
    this.performanceMarks.set(label, mark);
    this.debug(category, `⏱️ Timer started: ${label}`);
  }

  endTimer(label, additionalData = null) {
    const mark = this.performanceMarks.get(label);
    if (!mark) {
      this.warn(LogCategory.GENERAL, `Timer not found: ${label}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - mark.startTime;
    
    this.performanceMarks.delete(label);
    
    const perfData = {
      label,
      duration: `${duration.toFixed(2)}ms`,
      startTime: mark.timestamp,
      endTime: this._formatTimestamp(),
      ...additionalData
    };

    if (duration > 1000) {
      this.warn(mark.category, `⏱️ SLOW: ${label} took ${duration.toFixed(2)}ms`, perfData);
    } else {
      this.info(mark.category, `⏱️ ${label} completed in ${duration.toFixed(2)}ms`, perfData);
    }

    return duration;
  }

  // Function wrapper for automatic logging
  wrapFunction(fn, functionName, category = LogCategory.GENERAL) {
    const logger = this;
    
    return async function(...args) {
      const callId = `${functionName}_${Date.now()}`;
      
      logger.debug(category, `→ Calling ${functionName}`, { 
        args: args.length > 0 ? args : 'no args',
        callId 
      });
      
      logger.startTimer(callId, category);
      
      try {
        const result = await fn.apply(this, args);
        
        const duration = logger.endTimer(callId, { 
          functionName,
          status: 'success'
        });
        
        logger.debug(category, `✓ ${functionName} completed`, { 
          callId,
          duration: `${duration?.toFixed(2)}ms`,
          resultType: typeof result
        });
        
        return result;
      } catch (error) {
        logger.endTimer(callId, { 
          functionName,
          status: 'error'
        });
        
        logger.error(category, `✗ ${functionName} failed`, error);
        throw error;
      }
    };
  }

  // API call logging
  logAPICall(method, url, category = LogCategory.API) {
    this.info(category, `→ ${method} ${url}`);
    return this.startTimer(`API_${method}_${url}`, category);
  }

  logAPIResponse(method, url, status, data = null) {
    const timerId = `API_${method}_${url}`;
    this.endTimer(timerId, { method, url, status });
    
    if (status >= 200 && status < 300) {
      this.info(LogCategory.API, `✓ ${method} ${url} - ${status}`, data);
    } else if (status >= 400) {
      this.error(LogCategory.API, `✗ ${method} ${url} - ${status}`, data);
    }
  }

  // Database operation logging
  logDBOperation(operation, table, data = null) {
    this.info(LogCategory.DATABASE, `→ ${operation} on ${table}`, data);
  }

  logDBResult(operation, table, result) {
    const count = Array.isArray(result) ? result.length : (result ? 1 : 0);
    this.info(LogCategory.DATABASE, `✓ ${operation} on ${table} - ${count} record(s)`, { count });
  }

  logDBError(operation, table, error) {
    this.error(LogCategory.DATABASE, `✗ ${operation} on ${table} failed`, error);
  }

  // User action logging
  logUserAction(action, details = null) {
    this.info(LogCategory.UI, `👤 User action: ${action}`, details);
  }

  // Get logs for debugging
  getLogs(filter = null) {
    if (!filter) return this.logs;
    
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.category && log.category !== filter.category) return false;
      if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }

  // Export logs
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.info(LogCategory.GENERAL, 'Logs cleared');
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {
      activTimers: this.performanceMarks.size,
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(l => l.level === LogLevel.ERROR).length,
      warnCount: this.logs.filter(l => l.level === LogLevel.WARN).length,
      avgResponseTime: null
    };

    const perfLogs = this.logs.filter(l => l.data && l.data.duration);
    if (perfLogs.length > 0) {
      const totalTime = perfLogs.reduce((sum, log) => {
        const duration = parseFloat(log.data.duration);
        return sum + (isNaN(duration) ? 0 : duration);
      }, 0);
      summary.avgResponseTime = `${(totalTime / perfLogs.length).toFixed(2)}ms`;
    }

    return summary;
  }
}

// Create global logger instance
const logger = new Logger(LogLevel.DEBUG);

// Expose to window for browser debugging
if (typeof window !== 'undefined') {
  window.Logger = Logger;
  window.logger = logger;
  window.LogCategory = LogCategory;
  window.LogLevel = LogLevel;
  
  // Add debugging helpers
  window.getLogs = (filter) => logger.getLogs(filter);
  window.exportLogs = () => logger.exportLogs();
  window.clearLogs = () => logger.clearLogs();
  window.getPerformanceSummary = () => logger.getPerformanceSummary();
}

// Export for Node.js/modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, logger, LogCategory, LogLevel };
}

