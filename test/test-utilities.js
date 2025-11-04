/**
 * Test Utility Functions
 * Common utilities for assertions, mocking, timing, and test helpers
 */

const TestUtilities = {
  // ============================================================================
  // ASSERTION UTILITIES
  // ============================================================================

  /**
   * Assert that a value is truthy
   */
  assertTrue: function(value, message = 'Expected value to be truthy') {
    if (!value) {
      throw new Error(`Assertion failed: ${message}. Got: ${value}`);
    }
    return true;
  },

  /**
   * Assert that a value is falsy
   */
  assertFalse: function(value, message = 'Expected value to be falsy') {
    if (value) {
      throw new Error(`Assertion failed: ${message}. Got: ${value}`);
    }
    return true;
  },

  /**
   * Assert equality
   */
  assertEqual: function(actual, expected, message = '') {
    if (actual !== expected) {
      const msg = message || `Expected ${expected} but got ${actual}`;
      throw new Error(`Assertion failed: ${msg}`);
    }
    return true;
  },

  /**
   * Assert deep equality for objects and arrays
   */
  assertDeepEqual: function(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      const msg = message || `Expected ${expectedStr} but got ${actualStr}`;
      throw new Error(`Assertion failed: ${msg}`);
    }
    return true;
  },

  /**
   * Assert that value is not null or undefined
   */
  assertExists: function(value, message = 'Expected value to exist') {
    if (value === null || value === undefined) {
      throw new Error(`Assertion failed: ${message}`);
    }
    return true;
  },

  /**
   * Assert that value is null or undefined
   */
  assertNotExists: function(value, message = 'Expected value to not exist') {
    if (value !== null && value !== undefined) {
      throw new Error(`Assertion failed: ${message}. Got: ${value}`);
    }
    return true;
  },

  /**
   * Assert that array contains value
   */
  assertContains: function(array, value, message = '') {
    if (!Array.isArray(array)) {
      throw new Error('First argument must be an array');
    }
    if (!array.includes(value)) {
      const msg = message || `Expected array to contain ${value}`;
      throw new Error(`Assertion failed: ${msg}`);
    }
    return true;
  },

  /**
   * Assert that object has property
   */
  assertHasProperty: function(obj, property, message = '') {
    if (!obj.hasOwnProperty(property)) {
      const msg = message || `Expected object to have property ${property}`;
      throw new Error(`Assertion failed: ${msg}`);
    }
    return true;
  },

  /**
   * Assert that value is of expected type
   */
  assertType: function(value, expectedType, message = '') {
    const actualType = typeof value;
    if (actualType !== expectedType) {
      const msg = message || `Expected type ${expectedType} but got ${actualType}`;
      throw new Error(`Assertion failed: ${msg}`);
    }
    return true;
  },

  /**
   * Assert that value is within range
   */
  assertInRange: function(value, min, max, message = '') {
    if (value < min || value > max) {
      const msg = message || `Expected value ${value} to be between ${min} and ${max}`;
      throw new Error(`Assertion failed: ${msg}`);
    }
    return true;
  },

  /**
   * Assert that function throws error
   */
  assertThrows: function(fn, expectedError = null, message = '') {
    try {
      fn();
      throw new Error(`Assertion failed: Expected function to throw error`);
    } catch (error) {
      if (expectedError && error.message !== expectedError) {
        const msg = message || `Expected error "${expectedError}" but got "${error.message}"`;
        throw new Error(`Assertion failed: ${msg}`);
      }
    }
    return true;
  },

  // ============================================================================
  // TIMING UTILITIES
  // ============================================================================

  /**
   * Measure execution time of a function
   */
  measureTime: async function(fn, label = 'Operation') {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      result,
      duration,
      label,
      startTime,
      endTime
    };
  },

  /**
   * Assert that operation completes within time limit
   */
  assertTimingUnder: async function(fn, maxMs, label = 'Operation') {
    const { duration, result } = await this.measureTime(fn, label);
    
    if (duration > maxMs) {
      throw new Error(
        `Timing assertion failed: ${label} took ${duration.toFixed(2)}ms, ` +
        `expected under ${maxMs}ms`
      );
    }
    
    return { duration, result, passed: true };
  },

  /**
   * Wait for specified milliseconds
   */
  wait: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Wait for condition to be true
   */
  waitFor: async function(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await this.wait(interval);
    }
    
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  },

  /**
   * Retry function with exponential backoff
   */
  retryWithBackoff: async function(fn, maxRetries = 3, initialDelay = 100) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i);
          await this.wait(delay);
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
  },

  // ============================================================================
  // MOCKING UTILITIES
  // ============================================================================

  /**
   * Create a mock function that tracks calls
   */
  createMock: function(implementation = null) {
    const calls = [];
    
    const mockFn = function(...args) {
      calls.push({ args, timestamp: Date.now() });
      if (implementation) {
        return implementation(...args);
      }
    };
    
    mockFn.calls = calls;
    mockFn.callCount = () => calls.length;
    mockFn.calledWith = (...expectedArgs) => {
      return calls.some(call => 
        JSON.stringify(call.args) === JSON.stringify(expectedArgs)
      );
    };
    mockFn.reset = () => calls.length = 0;
    
    return mockFn;
  },

  /**
   * Mock API response
   */
  mockApiResponse: function(data, delay = 0) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          data: data,
          timestamp: new Date().toISOString()
        });
      }, delay);
    });
  },

  /**
   * Mock API error
   */
  mockApiError: function(errorMessage, delay = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, delay);
    });
  },

  /**
   * Mock localStorage
   */
  mockLocalStorage: function() {
    const storage = {};
    
    return {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => storage[key] = String(value),
      removeItem: (key) => delete storage[key],
      clear: () => Object.keys(storage).forEach(key => delete storage[key]),
      get length() { return Object.keys(storage).length; },
      key: (index) => Object.keys(storage)[index] || null
    };
  },

  /**
   * Mock fetch API
   */
  mockFetch: function(responses = {}) {
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options = {}) {
      const key = `${options.method || 'GET'} ${url}`;
      const response = responses[key] || responses[url];
      
      if (!response) {
        throw new Error(`No mock response for ${key}`);
      }
      
      return {
        ok: response.ok !== false,
        status: response.status || 200,
        json: async () => response.data,
        text: async () => JSON.stringify(response.data)
      };
    };
    
    return {
      restore: () => window.fetch = originalFetch
    };
  },

  // ============================================================================
  // DATA GENERATION UTILITIES
  // ============================================================================

  /**
   * Generate random string
   */
  randomString: function(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generate random number in range
   */
  randomNumber: function(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate random date
   */
  randomDate: function(start = new Date(2024, 0, 1), end = new Date()) {
    const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(timestamp);
  },

  /**
   * Generate unique ID
   */
  generateId: function(prefix = 'TEST') {
    return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  },

  // ============================================================================
  // TEST RESULT UTILITIES
  // ============================================================================

  /**
   * Create test result object
   */
  createTestResult: function(testName, status, details = {}) {
    return {
      testName,
      status, // 'passed', 'failed', 'skipped', 'warning'
      timestamp: new Date().toISOString(),
      duration: details.duration || 0,
      error: details.error || null,
      assertions: details.assertions || [],
      metadata: details.metadata || {}
    };
  },

  /**
   * Format test results for display
   */
  formatTestResults: function(results) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    
    return {
      total,
      passed,
      failed,
      skipped,
      warnings,
      successRate: total > 0 ? (passed / total * 100).toFixed(2) : 0,
      results
    };
  },

  /**
   * Group test results by category
   */
  groupResultsByCategory: function(results) {
    const grouped = {};
    
    results.forEach(result => {
      const category = result.metadata?.category || 'uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(result);
    });
    
    return grouped;
  },

  // ============================================================================
  // VALIDATION UTILITIES
  // ============================================================================

  /**
   * Validate required fields in object
   */
  validateRequiredFields: function(obj, requiredFields) {
    const missing = [];
    
    requiredFields.forEach(field => {
      if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
        missing.push(field);
      }
    });
    
    return {
      valid: missing.length === 0,
      missing
    };
  },

  /**
   * Validate data types
   */
  validateDataTypes: function(obj, schema) {
    const errors = [];
    
    Object.keys(schema).forEach(key => {
      const expectedType = schema[key];
      const actualType = typeof obj[key];
      
      if (actualType !== expectedType) {
        errors.push({
          field: key,
          expected: expectedType,
          actual: actualType
        });
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate numeric range
   */
  validateRange: function(value, min, max) {
    return {
      valid: value >= min && value <= max,
      value,
      min,
      max
    };
  },

  // ============================================================================
  // LOGGING UTILITIES
  // ============================================================================

  /**
   * Create test logger
   */
  createLogger: function(prefix = 'TEST') {
    return {
      info: (msg) => console.log(`[${prefix}] INFO: ${msg}`),
      warn: (msg) => console.warn(`[${prefix}] WARN: ${msg}`),
      error: (msg) => console.error(`[${prefix}] ERROR: ${msg}`),
      debug: (msg) => console.debug(`[${prefix}] DEBUG: ${msg}`),
      group: (label) => console.group(`[${prefix}] ${label}`),
      groupEnd: () => console.groupEnd()
    };
  },

  /**
   * Log test execution
   */
  logTestExecution: function(testName, fn) {
    return async function(...args) {
      console.log(`▶ Starting test: ${testName}`);
      const startTime = performance.now();
      
      try {
        const result = await fn(...args);
        const duration = performance.now() - startTime;
        console.log(`✓ Test passed: ${testName} (${duration.toFixed(2)}ms)`);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        console.error(`✗ Test failed: ${testName} (${duration.toFixed(2)}ms)`);
        console.error(`  Error: ${error.message}`);
        throw error;
      }
    };
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestUtilities;
} else if (typeof window !== 'undefined') {
  window.TestUtilities = TestUtilities;
}
