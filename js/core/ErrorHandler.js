/**
 * Comprehensive Error Handling System for POS Application
 * Provides centralized error handling with user-friendly messages in Thai
 * Implements automatic error recovery and error reporting
 * 
 * Requirements: 1.6 - Real-time validation and helpful error messages
 */

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 1000;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // Base delay in ms
    
    // Initialize error reporting
    this.initializeErrorReporting();
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Thai error messages for user-friendly display
   */
  static ERROR_MESSAGES = {
    // Network errors
    'network-offline': 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต - ระบบจะทำงานแบบออฟไลน์',
    'network-timeout': 'การเชื่อมต่อหมดเวลา - กรุณาลองใหม่อีกครั้ง',
    'network-error': 'เกิดข้อผิดพลาดในการเชื่อมต่อ - กรุณาตรวจสอบอินเทอร์เน็ต',
    'server-error': 'เซิร์ฟเวอร์ไม่สามารถตอบสนองได้ - กรุณาลองใหม่ในภายหลัง',
    
    // Validation errors
    'validation-required': 'กรุณากรอกข้อมูลที่จำเป็น',
    'validation-invalid-number': 'กรุณากรอกตัวเลขที่ถูกต้อง',
    'validation-invalid-price': 'กรุณากรอกราคาที่ถูกต้อง',
    'validation-invalid-quantity': 'กรุณากรอกจำนวนที่ถูกต้อง',
    'validation-negative-value': 'ค่าต้องเป็นจำนวนบวก',
    'validation-max-length': 'ข้อมูลยาวเกินกำหนด',
    'validation-min-length': 'ข้อมูลสั้นเกินไป',
    
    // Data sync errors
    'sync-conflict': 'พบข้อมูลที่ขัดแย้ง - กรุณาเลือกเวอร์ชันที่ต้องการ',
    'sync-failed': 'การซิงค์ข้อมูลล้มเหลว - จะลองใหม่อัตโนมัติ',
    'sync-partial': 'ซิงค์ข้อมูลบางส่วนเท่านั้น - กรุณาตรวจสอบ',
    
    // Storage errors
    'storage-full': 'พื้นที่จัดเก็บเต็ม - กรุณาลบข้อมูลเก่า',
    'storage-error': 'เกิดข้อผิดพลาดในการจัดเก็บข้อมูล',
    'storage-quota-exceeded': 'เกินขีดจำกัดการจัดเก็บข้อมูล',
    
    // Business logic errors
    'insufficient-stock': 'สต็อกไม่เพียงพอ',
    'invalid-transaction': 'รายการไม่ถูกต้อง',
    'duplicate-entry': 'พบข้อมูลซ้ำ',
    'calculation-error': 'เกิดข้อผิดพลาดในการคำนวณ',
    
    // Generic errors
    'unknown-error': 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
    'operation-failed': 'การดำเนินการล้มเหลว',
    'permission-denied': 'ไม่มีสิทธิ์ในการดำเนินการ',
    'resource-not-found': 'ไม่พบข้อมูลที่ต้องการ'
  };

  /**
   * Error severity levels
   */
  static SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  /**
   * Initialize error reporting system
   */
  initializeErrorReporting() {
    // Set up performance observer for error tracking
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation' && entry.loadEventEnd === 0) {
              this.logError('navigation-error', 'Page failed to load completely', ErrorHandler.SEVERITY.HIGH);
            }
          }
        });
        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Performance observer not available for error tracking');
      }
    }
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleGlobalError({
        type: 'javascript-error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError({
        type: 'promise-rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        error: event.reason
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleGlobalError({
          type: 'resource-error',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          element: event.target.tagName
        });
      }
    }, true);
  }

  /**
   * Handle global errors
   */
  handleGlobalError(errorInfo) {
    const errorId = this.generateErrorId();
    const error = {
      id: errorId,
      timestamp: Date.now(),
      type: errorInfo.type,
      message: errorInfo.message,
      severity: ErrorHandler.SEVERITY.HIGH,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        filename: errorInfo.filename,
        line: errorInfo.lineno,
        column: errorInfo.colno
      },
      stack: errorInfo.error?.stack
    };

    this.logError(error.type, error.message, error.severity, error);
    
    // Don't show UI for resource errors to avoid spam
    if (errorInfo.type !== 'resource-error') {
      this.showErrorToUser(error.type, error.message, ErrorHandler.SEVERITY.MEDIUM);
    }
  }

  /**
   * Main error handling method
   */
  handleError(errorType, originalError, context = {}) {
    const errorId = this.generateErrorId();
    const timestamp = Date.now();
    
    // Determine error severity
    const severity = this.determineSeverity(errorType, originalError);
    
    // Create error object
    const error = {
      id: errorId,
      type: errorType,
      originalError,
      message: this.getErrorMessage(errorType),
      severity,
      timestamp,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        offline: !navigator.onLine
      },
      stack: originalError?.stack
    };

    // Log the error
    this.logError(errorType, error.message, severity, error);

    // Attempt automatic recovery
    const recovered = this.attemptRecovery(errorType, originalError, context);
    
    if (!recovered) {
      // Show error to user if recovery failed
      this.showErrorToUser(errorType, error.message, severity);
    }

    // Report error for analytics
    this.reportError(error);

    return {
      errorId,
      recovered,
      message: error.message,
      severity
    };
  }

  /**
   * Determine error severity based on type and context
   */
  determineSeverity(errorType, originalError) {
    const criticalErrors = ['storage-full', 'permission-denied', 'server-error'];
    const highErrors = ['network-error', 'sync-failed', 'calculation-error'];
    const mediumErrors = ['validation-required', 'network-timeout'];
    
    if (criticalErrors.includes(errorType)) {
      return ErrorHandler.SEVERITY.CRITICAL;
    } else if (highErrors.includes(errorType)) {
      return ErrorHandler.SEVERITY.HIGH;
    } else if (mediumErrors.includes(errorType)) {
      return ErrorHandler.SEVERITY.MEDIUM;
    }
    
    return ErrorHandler.SEVERITY.LOW;
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(errorType) {
    return ErrorHandler.ERROR_MESSAGES[errorType] || ErrorHandler.ERROR_MESSAGES['unknown-error'];
  }

  /**
   * Attempt automatic error recovery
   */
  attemptRecovery(errorType, originalError, context) {
    switch (errorType) {
      case 'network-timeout':
      case 'network-error':
        return this.retryNetworkOperation(context);
        
      case 'storage-error':
        return this.recoverStorage();
        
      case 'sync-failed':
        return this.retrySyncOperation(context);
        
      case 'validation-invalid-number':
      case 'validation-invalid-price':
        return this.sanitizeNumericInput(context);
        
      default:
        return false;
    }
  }

  /**
   * Retry network operations with exponential backoff
   */
  async retryNetworkOperation(context) {
    const operationId = context.operationId || 'unknown';
    const currentAttempts = this.retryAttempts.get(operationId) || 0;
    
    if (currentAttempts >= this.maxRetries) {
      this.retryAttempts.delete(operationId);
      return false;
    }

    const delay = this.retryDelay * Math.pow(2, currentAttempts);
    this.retryAttempts.set(operationId, currentAttempts + 1);

    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (context.retryFunction && typeof context.retryFunction === 'function') {
        await context.retryFunction();
        this.retryAttempts.delete(operationId);
        return true;
      }
    } catch (error) {
      // Retry failed, will try again or give up
      return false;
    }

    return false;
  }

  /**
   * Recover from storage errors
   */
  recoverStorage() {
    try {
      // Clear old cache entries
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('old') || name.includes('temp')) {
              caches.delete(name);
            }
          });
        });
      }

      // Clear old localStorage entries
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('temp_') || key.includes('cache_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retry sync operations
   */
  async retrySyncOperation(context) {
    if (navigator.onLine && context.syncFunction) {
      try {
        await context.syncFunction();
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  /**
   * Sanitize numeric input
   */
  sanitizeNumericInput(context) {
    if (context.inputElement && context.inputElement.value) {
      const sanitized = context.inputElement.value.replace(/[^\d.-]/g, '');
      const number = parseFloat(sanitized);
      
      if (!isNaN(number) && number >= 0) {
        context.inputElement.value = number.toString();
        return true;
      }
    }
    return false;
  }

  /**
   * Show error to user with appropriate UI
   */
  showErrorToUser(errorType, message, severity) {
    // Create or get notification container
    let container = document.getElementById('error-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'error-notifications';
      container.className = 'error-notifications';
      document.body.appendChild(container);
    }

    // Create error notification
    const notification = document.createElement('div');
    notification.className = `error-notification severity-${severity}`;
    
    const icon = this.getErrorIcon(severity);
    const timestamp = new Date().toLocaleTimeString('th-TH');
    
    notification.innerHTML = `
      <div class="error-content">
        <div class="error-header">
          <span class="error-icon">${icon}</span>
          <span class="error-time">${timestamp}</span>
          <button class="error-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="error-message">${message}</div>
        ${severity === ErrorHandler.SEVERITY.CRITICAL ? '<div class="error-actions"><button onclick="location.reload()">รีโหลดหน้า</button></div>' : ''}
      </div>
    `;

    container.appendChild(notification);

    // Auto-remove non-critical errors after delay
    if (severity !== ErrorHandler.SEVERITY.CRITICAL) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, severity === ErrorHandler.SEVERITY.HIGH ? 10000 : 5000);
    }

    // Add haptic feedback on mobile
    if ('vibrate' in navigator && severity === ErrorHandler.SEVERITY.HIGH) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  /**
   * Get appropriate icon for error severity
   */
  getErrorIcon(severity) {
    switch (severity) {
      case ErrorHandler.SEVERITY.CRITICAL:
        return '🚨';
      case ErrorHandler.SEVERITY.HIGH:
        return '⚠️';
      case ErrorHandler.SEVERITY.MEDIUM:
        return '⚡';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Log error to internal log
   */
  logError(type, message, severity, fullError = null) {
    const logEntry = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type,
      message,
      severity,
      fullError
    };

    this.errorLog.unshift(logEntry);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging based on severity
    const consoleMethod = severity === ErrorHandler.SEVERITY.CRITICAL ? 'error' : 
                         severity === ErrorHandler.SEVERITY.HIGH ? 'warn' : 'log';
    console[consoleMethod](`[${severity.toUpperCase()}] ${type}: ${message}`, fullError);

    // Store in localStorage for persistence
    try {
      const recentErrors = this.errorLog.slice(0, 50); // Keep only recent 50 errors
      localStorage.setItem('pos_error_log', JSON.stringify(recentErrors));
    } catch (e) {
      // Storage might be full, ignore
    }
  }

  /**
   * Report error for analytics
   */
  reportError(error) {
    // Only report high and critical errors to avoid spam
    if (error.severity === ErrorHandler.SEVERITY.HIGH || 
        error.severity === ErrorHandler.SEVERITY.CRITICAL) {
      
      // Store for batch reporting
      const errorReports = JSON.parse(localStorage.getItem('pos_error_reports') || '[]');
      errorReports.push({
        id: error.id,
        type: error.type,
        message: error.message,
        severity: error.severity,
        timestamp: error.timestamp,
        context: error.context
      });

      // Keep only recent 100 reports
      if (errorReports.length > 100) {
        errorReports.splice(0, errorReports.length - 100);
      }

      try {
        localStorage.setItem('pos_error_reports', JSON.stringify(errorReports));
      } catch (e) {
        // Storage full, remove old reports
        errorReports.splice(0, 50);
        localStorage.setItem('pos_error_reports', JSON.stringify(errorReports));
      }
    }
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentErrors = this.errorLog.filter(error => now - error.timestamp < oneHour);
    const todayErrors = this.errorLog.filter(error => now - error.timestamp < oneDay);

    const severityCount = this.errorLog.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      total: this.errorLog.length,
      lastHour: recentErrors.length,
      today: todayErrors.length,
      bySeverity: severityCount,
      mostCommon: this.getMostCommonErrors()
    };
  }

  /**
   * Get most common error types
   */
  getMostCommonErrors() {
    const errorCounts = this.errorLog.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
    localStorage.removeItem('pos_error_log');
    localStorage.removeItem('pos_error_reports');
  }

  /**
   * Export error log for debugging
   */
  exportErrorLog() {
    return {
      errors: this.errorLog,
      stats: this.getErrorStats(),
      exportTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }
}

// Create global error handler instance
window.ErrorHandler = new ErrorHandler();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}