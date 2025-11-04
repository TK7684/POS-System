/**
 * Utility Functions for POS System
 * Common helper functions with proper error handling and validation
 */

import { BUSINESS, ERRORS, LOGGING } from '../config/config.js';

/**
 * Safe number conversion with validation
 * @param {*} value - Value to convert
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} Converted number or default
 */
export function safeNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  return num;
}

/**
 * Validate business rules
 * @param {Object} data - Data to validate
 * @param {Array} rules - Validation rules
 * @returns {Object} Validation result
 */
export function validateBusinessRules(data, rules) {
  const errors = [];
  const warnings = [];

  for (const rule of rules) {
    const { field, type, min, max, required, pattern } = rule;
    const value = data[field];

    if (required && (value === null || value === undefined || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value !== null && value !== undefined && value !== '') {
      switch (type) {
        case 'number':
          const num = safeNumber(value);
          if (min !== undefined && num < min) {
            errors.push(`${field} must be at least ${min}`);
          }
          if (max !== undefined && num > max) {
            errors.push(`${field} must not exceed ${max}`);
          }
          break;

        case 'string':
          if (min !== undefined && String(value).length < min) {
            errors.push(`${field} must be at least ${min} characters`);
          }
          if (max !== undefined && String(value).length > max) {
            errors.push(`${field} must not exceed ${max} characters`);
          }
          if (pattern && !new RegExp(pattern).test(value)) {
            errors.push(`${field} format is invalid`);
          }
          break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'THB') {
  const num = safeNumber(amount);
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const options = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }
  };

  return dateObj.toLocaleString('th-TH', options[format] || options.short);
}

/**
 * Generate unique ID with prefix
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'ID') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

/**
 * Deep clone object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }

  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe JSON parse with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed JSON or default value
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logError('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * Safe JSON stringify with error handling
 * @param {*} obj - Object to stringify
 * @param {string} defaultValue - Default value if stringification fails
 * @returns {string} JSON string or default value
 */
export function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    logError('JSON stringify error:', error);
    return defaultValue;
  }
}

/**
 * Logging utility
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {*} data - Additional data to log
 */
export function log(level, message, data = null) {
  const levels = LOGGING.LEVELS;
  const currentLevel = LOGGING.CURRENT_LEVEL;

  if (levels[level] <= currentLevel) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    switch (level) {
      case 'ERROR':
        console.error(logMessage, data);
        break;
      case 'WARN':
        console.warn(logMessage, data);
        break;
      case 'INFO':
        console.info(logMessage, data);
        break;
      case 'DEBUG':
        console.log(logMessage, data);
        break;
    }
  }
}

/**
 * Error logging shortcut
 * @param {string} message - Error message
 * @param {*} data - Error data
 */
export function logError(message, data = null) {
  log('ERROR', message, data);
}

/**
 * Warning logging shortcut
 * @param {string} message - Warning message
 * @param {*} data - Warning data
 */
export function logWarn(message, data = null) {
  log('WARN', message, data);
}

/**
 * Info logging shortcut
 * @param {string} message - Info message
 * @param {*} data - Info data
 */
export function logInfo(message, data = null) {
  log('INFO', message, data);
}

/**
 * Debug logging shortcut
 * @param {string} message - Debug message
 * @param {*} data - Debug data
 */
export function logDebug(message, data = null) {
  log('DEBUG', message, data);
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if device is tablet
 * @returns {boolean} True if tablet device
 */
export function isTablet() {
  return /iPad|Android/i.test(navigator.userAgent) && !isMobile();
}

/**
 * Get platform fee
 * @param {string} platform - Platform name
 * @returns {number} Platform fee percentage
 */
export function getPlatformFee(platform) {
  return BUSINESS.PLATFORMS[platform]?.fee || 0;
}

/**
 * Calculate profit margin
 * @param {number} revenue - Revenue amount
 * @param {number} cost - Cost amount
 * @returns {number} Profit margin percentage
 */
export function calculateProfitMargin(revenue, cost) {
  const rev = safeNumber(revenue);
  const c = safeNumber(cost);

  if (rev === 0) return 0;
  return ((rev - c) / rev) * 100;
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Extract numbers from string
 * @param {string} text - Text to extract numbers from
 * @returns {Array} Array of numbers found
 */
export function extractNumbers(text) {
  const matches = text.match(/-?\d+\.?\d*/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Round number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded number
 */
export function roundTo(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((safeNumber(num) + Number.EPSILON) * factor) / factor;
}

/**
 * Calculate percentage change
 * @param {number} oldValue - Old value
 * @param {number} newValue - New value
 * @returns {number} Percentage change
 */
export function calculatePercentageChange(oldValue, newValue) {
  const old = safeNumber(oldValue);
  const newVal = safeNumber(newValue);

  if (old === 0) return newVal > 0 ? 100 : 0;
  return ((newVal - old) / old) * 100;
}

/**
 * Generate color based on value
 * @param {number} value - Value to evaluate
 * @param {number} threshold - Threshold for color change
 * @param {string} positiveColor - Color for positive values
 * @param {string} negativeColor - Color for negative values
 * @returns {string} Color code
 */
export function getValueColor(value, threshold = 0, positiveColor = '#22c55e', negativeColor = '#ef4444') {
  const val = safeNumber(value);
  return val >= threshold ? positiveColor : negativeColor;
}

/**
 * Create retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise} Function result
 */
export async function retryWithBackoff(fn, maxAttempts = 3, initialDelay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
