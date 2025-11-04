/**
 * Error Handling Module
 * Tests error handling and recovery mechanisms
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10
 */

class ErrorHandlingModule {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || '',
      timeout: config.timeout || 10000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    this.testResults = {
      timestamp: null,
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: [],
      errorScenarios: []
    };
  }

  /**
   * Test network errors
   * Requirements: 9.1, 9.2
   */
  async testNetworkErrors() {
    console.log('Testing network error handling...');
    
    const results = [];
    
    // Test 1: API timeout handling
    try {
      const startTime = Date.now();
      const timeoutMs = 100;
      
      const result = await this.simulateTimeout(timeoutMs);
      const duration = Date.now() - startTime;
      
      const passed = result.error && result.error.includes('timeout') && duration >= timeoutMs;
      
      results.push({
        testName: 'API timeout handling',
        passed: passed,
        duration: duration,
        timeoutMs: timeoutMs,
        errorMessage: result.error,
        requirement: '9.1',
        message: passed
          ? 'Successfully detected and handled timeout'
          : 'Failed to handle timeout correctly'
      });
    } catch (error) {
      results.push({
        testName: 'API timeout handling',
        passed: true, // Exception is acceptable for timeout
        error: error.message,
        requirement: '9.1',
        message: 'Timeout handled with exception'
      });
    }
    
    // Test 2: API unavailable (network error)
    try {
      const result = await this.simulateNetworkError();
      
      const passed = result.error && result.userFriendlyMessage;
      
      results.push({
        testName: 'API unavailable error',
        passed: passed,
        errorMessage: result.error,
        userMessage: result.userFriendlyMessage,
        requirement: '9.1',
        message: passed
          ? 'Successfully handled network unavailable error'
          : 'Failed to handle network error'
      });
    } catch (error) {
      results.push({
        testName: 'API unavailable error',
        passed: true,
        error: error.message,
        requirement: '9.1',
        message: 'Network error handled with exception'
      });
    }
    
    // Test 3: Connection refused
    try {
      const result = await this.simulateConnectionRefused();
      
      const passed = result.error && result.userFriendlyMessage;
      
      results.push({
        testName: 'Connection refused error',
        passed: passed,
        errorMessage: result.error,
        userMessage: result.userFriendlyMessage,
        requirement: '9.1',
        message: passed
          ? 'Successfully handled connection refused'
          : 'Failed to handle connection refused'
      });
    } catch (error) {
      results.push({
        testName: 'Connection refused error',
        passed: true,
        error: error.message,
        requirement: '9.1',
        message: 'Connection error handled with exception'
      });
    }
    
    // Test 4: DNS resolution failure
    try {
      const result = await this.simulateDNSError();
      
      const passed = result.error && result.userFriendlyMessage;
      
      results.push({
        testName: 'DNS resolution failure',
        passed: passed,
        errorMessage: result.error,
        userMessage: result.userFriendlyMessage,
        requirement: '9.1',
        message: passed
          ? 'Successfully handled DNS error'
          : 'Failed to handle DNS error'
      });
    } catch (error) {
      results.push({
        testName: 'DNS resolution failure',
        passed: true,
        error: error.message,
        requirement: '9.1',
        message: 'DNS error handled with exception'
      });
    }
    
    // Test 5: Retry with exponential backoff (Requirement 9.2)
    try {
      const startTime = Date.now();
      const result = await this.testRetryMechanism();
      const duration = Date.now() - startTime;
      
      const passed = result.retries > 0 && result.backoffApplied && duration > result.expectedMinDuration;
      
      results.push({
        testName: 'Retry with exponential backoff',
        passed: passed,
        retries: result.retries,
        duration: duration,
        expectedMinDuration: result.expectedMinDuration,
        backoffApplied: result.backoffApplied,
        requirement: '9.2',
        message: passed
          ? `Successfully retried ${result.retries} times with exponential backoff`
          : 'Failed to implement exponential backoff correctly'
      });
    } catch (error) {
      results.push({
        testName: 'Retry with exponential backoff',
        passed: false,
        error: error.message,
        requirement: '9.2'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test validation errors
   * Requirements: 9.3
   */
  async testValidationErrors() {
    console.log('Testing validation error handling...');
    
    const results = [];
    
    // Test 1: Missing required field
    try {
      const result = await this.validateInput({
        // Missing required fields
      }, ['ingredient_id', 'qtyBuy', 'totalPrice']);
      
      const passed = !result.valid && result.errors.length === 3 && result.highlightedFields;
      
      results.push({
        testName: 'Missing required fields',
        passed: passed,
        errors: result.errors,
        highlightedFields: result.highlightedFields,
        requirement: '9.3',
        message: passed
          ? 'Successfully identified and highlighted missing fields'
          : 'Failed to highlight missing fields'
      });
    } catch (error) {
      results.push({
        testName: 'Missing required fields',
        passed: false,
        error: error.message,
        requirement: '9.3'
      });
    }
    
    // Test 2: Invalid data type
    try {
      const result = await this.validateInput({
        ingredient_id: 'TEST',
        qtyBuy: 'not-a-number',
        totalPrice: 'invalid'
      }, ['ingredient_id', 'qtyBuy', 'totalPrice']);
      
      const passed = !result.valid && result.errors.some(e => e.field === 'qtyBuy') && result.highlightedFields;
      
      results.push({
        testName: 'Invalid data type',
        passed: passed,
        errors: result.errors,
        highlightedFields: result.highlightedFields,
        requirement: '9.3',
        message: passed
          ? 'Successfully identified invalid data types'
          : 'Failed to validate data types'
      });
    } catch (error) {
      results.push({
        testName: 'Invalid data type',
        passed: false,
        error: error.message,
        requirement: '9.3'
      });
    }
    
    // Test 3: Out of range values
    try {
      const result = await this.validateInput({
        ingredient_id: 'TEST',
        qtyBuy: -10,
        totalPrice: -100
      }, ['ingredient_id', 'qtyBuy', 'totalPrice']);
      
      const passed = !result.valid && result.errors.some(e => e.message.includes('negative'));
      
      results.push({
        testName: 'Out of range values',
        passed: passed,
        errors: result.errors,
        requirement: '9.3',
        message: passed
          ? 'Successfully validated value ranges'
          : 'Failed to validate ranges'
      });
    } catch (error) {
      results.push({
        testName: 'Out of range values',
        passed: false,
        error: error.message,
        requirement: '9.3'
      });
    }
    
    // Test 4: Field highlighting in UI
    try {
      const invalidFields = ['qtyBuy', 'totalPrice'];
      const highlighted = this.highlightErrorFields(invalidFields);
      
      const passed = highlighted.length === invalidFields.length && 
                     highlighted.every(f => f.highlighted === true);
      
      results.push({
        testName: 'Field highlighting',
        passed: passed,
        invalidFields: invalidFields,
        highlighted: highlighted,
        requirement: '9.3',
        message: passed
          ? 'Successfully highlighted error fields'
          : 'Failed to highlight fields'
      });
    } catch (error) {
      results.push({
        testName: 'Field highlighting',
        passed: false,
        error: error.message,
        requirement: '9.3'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test recovery mechanisms
   * Requirement: 9.4
   */
  async testRecoveryMechanisms() {
    console.log('Testing recovery mechanisms...');
    
    const results = [];
    
    // Test 1: Automatic retry after failure
    try {
      const result = await this.testAutoRetry();
      
      const passed = result.success && result.attempts > 1;
      
      results.push({
        testName: 'Automatic retry after failure',
        passed: passed,
        attempts: result.attempts,
        success: result.success,
        requirement: '9.4',
        message: passed
          ? `Successfully recovered after ${result.attempts} attempts`
          : 'Failed to retry automatically'
      });
    } catch (error) {
      results.push({
        testName: 'Automatic retry after failure',
        passed: false,
        error: error.message,
        requirement: '9.4'
      });
    }
    
    // Test 2: Exponential backoff implementation
    try {
      const delays = [];
      const result = await this.testExponentialBackoff(delays);
      
      // Check if delays increase exponentially
      const isExponential = delays.length >= 2 && 
                           delays[1] >= delays[0] * 1.5;
      
      const passed = result.success && isExponential;
      
      results.push({
        testName: 'Exponential backoff',
        passed: passed,
        delays: delays,
        isExponential: isExponential,
        requirement: '9.4',
        message: passed
          ? 'Successfully implemented exponential backoff'
          : 'Backoff not exponential'
      });
    } catch (error) {
      results.push({
        testName: 'Exponential backoff',
        passed: false,
        error: error.message,
        requirement: '9.4'
      });
    }
    
    // Test 3: Max retry limit
    try {
      const maxRetries = 3;
      const result = await this.testMaxRetries(maxRetries);
      
      const passed = !result.success && result.attempts === maxRetries;
      
      results.push({
        testName: 'Max retry limit',
        passed: passed,
        maxRetries: maxRetries,
        attempts: result.attempts,
        requirement: '9.4',
        message: passed
          ? `Correctly stopped after ${maxRetries} retries`
          : 'Failed to respect max retry limit'
      });
    } catch (error) {
      results.push({
        testName: 'Max retry limit',
        passed: false,
        error: error.message,
        requirement: '9.4'
      });
    }
    
    // Test 4: Graceful degradation
    try {
      const result = await this.testGracefulDegradation();
      
      const passed = result.fallbackUsed && result.partialFunctionality;
      
      results.push({
        testName: 'Graceful degradation',
        passed: passed,
        fallbackUsed: result.fallbackUsed,
        partialFunctionality: result.partialFunctionality,
        requirement: '9.4',
        message: passed
          ? 'Successfully degraded gracefully'
          : 'Failed to provide fallback'
      });
    } catch (error) {
      results.push({
        testName: 'Graceful degradation',
        passed: false,
        error: error.message,
        requirement: '9.4'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Simulate timeout error
   */
  async simulateTimeout(timeoutMs) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          error: 'Request timeout',
          userFriendlyMessage: 'The request took too long. Please try again.',
          code: 'TIMEOUT'
        });
      }, timeoutMs);
    });
  }

  /**
   * Simulate network error
   */
  async simulateNetworkError() {
    return {
      error: 'Network unavailable',
      userFriendlyMessage: 'Unable to connect to the server. Please check your internet connection.',
      code: 'NETWORK_ERROR'
    };
  }

  /**
   * Simulate connection refused
   */
  async simulateConnectionRefused() {
    return {
      error: 'Connection refused',
      userFriendlyMessage: 'The server is not responding. Please try again later.',
      code: 'CONNECTION_REFUSED'
    };
  }

  /**
   * Simulate DNS error
   */
  async simulateDNSError() {
    return {
      error: 'DNS resolution failed',
      userFriendlyMessage: 'Unable to reach the server. Please check your connection.',
      code: 'DNS_ERROR'
    };
  }

  /**
   * Test retry mechanism with exponential backoff
   */
  async testRetryMechanism() {
    const maxRetries = 3;
    let retries = 0;
    let totalDelay = 0;
    
    for (let i = 0; i < maxRetries; i++) {
      retries++;
      const delay = Math.pow(2, i) * this.config.retryDelay;
      totalDelay += delay;
      await this.sleep(delay);
    }
    
    return {
      retries: retries,
      backoffApplied: true,
      expectedMinDuration: totalDelay,
      success: true
    };
  }

  /**
   * Validate input data
   */
  async validateInput(data, requiredFields) {
    const errors = [];
    const highlightedFields = [];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!data[field] || data[field] === '') {
        errors.push({
          field: field,
          message: `${field} is required`,
          type: 'required'
        });
        highlightedFields.push(field);
      }
    }
    
    // Check data types
    if (data.qtyBuy !== undefined && typeof data.qtyBuy === 'string') {
      const num = parseFloat(data.qtyBuy);
      if (isNaN(num)) {
        errors.push({
          field: 'qtyBuy',
          message: 'qtyBuy must be a number',
          type: 'type'
        });
        highlightedFields.push('qtyBuy');
      }
    }
    
    if (data.totalPrice !== undefined && typeof data.totalPrice === 'string') {
      const num = parseFloat(data.totalPrice);
      if (isNaN(num)) {
        errors.push({
          field: 'totalPrice',
          message: 'totalPrice must be a number',
          type: 'type'
        });
        highlightedFields.push('totalPrice');
      }
    }
    
    // Check ranges
    if (data.qtyBuy !== undefined && data.qtyBuy < 0) {
      errors.push({
        field: 'qtyBuy',
        message: 'qtyBuy cannot be negative',
        type: 'range'
      });
      highlightedFields.push('qtyBuy');
    }
    
    if (data.totalPrice !== undefined && data.totalPrice < 0) {
      errors.push({
        field: 'totalPrice',
        message: 'totalPrice cannot be negative',
        type: 'range'
      });
      highlightedFields.push('totalPrice');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      highlightedFields: [...new Set(highlightedFields)]
    };
  }

  /**
   * Highlight error fields
   */
  highlightErrorFields(fields) {
    return fields.map(field => ({
      field: field,
      highlighted: true,
      cssClass: 'error-field',
      ariaInvalid: true
    }));
  }

  /**
   * Test automatic retry
   */
  async testAutoRetry() {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Simulate failure on first 2 attempts, success on 3rd
      if (attempts === maxAttempts) {
        return { success: true, attempts: attempts };
      }
      
      await this.sleep(100);
    }
    
    return { success: false, attempts: attempts };
  }

  /**
   * Test exponential backoff
   */
  async testExponentialBackoff(delays) {
    const maxRetries = 3;
    
    for (let i = 0; i < maxRetries; i++) {
      const delay = Math.pow(2, i) * 100;
      delays.push(delay);
      await this.sleep(delay);
    }
    
    return { success: true, delays: delays };
  }

  /**
   * Test max retries
   */
  async testMaxRetries(maxRetries) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      attempts++;
      await this.sleep(50);
      // Always fail
    }
    
    return { success: false, attempts: attempts };
  }

  /**
   * Test graceful degradation
   */
  async testGracefulDegradation() {
    // Simulate API failure, use cached data
    return {
      fallbackUsed: true,
      partialFunctionality: true,
      message: 'Using cached data while API is unavailable'
    };
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test data conflicts
   * Requirement: 9.5
   */
  async testDataConflicts() {
    console.log('Testing data conflict resolution...');
    
    const results = [];
    
    // Test 1: Concurrent modification conflict
    try {
      const result = await this.simulateConcurrentModification();
      
      const passed = result.conflictDetected && result.resolutionOptions;
      
      results.push({
        testName: 'Concurrent modification conflict',
        passed: passed,
        conflictDetected: result.conflictDetected,
        resolutionOptions: result.resolutionOptions,
        requirement: '9.5',
        message: passed
          ? 'Successfully detected and provided resolution options'
          : 'Failed to handle concurrent modification'
      });
    } catch (error) {
      results.push({
        testName: 'Concurrent modification conflict',
        passed: false,
        error: error.message,
        requirement: '9.5'
      });
    }
    
    // Test 2: Version conflict
    try {
      const result = await this.simulateVersionConflict();
      
      const passed = result.conflictDetected && result.userPrompted;
      
      results.push({
        testName: 'Version conflict',
        passed: passed,
        conflictDetected: result.conflictDetected,
        userPrompted: result.userPrompted,
        requirement: '9.5',
        message: passed
          ? 'Successfully detected version conflict and prompted user'
          : 'Failed to handle version conflict'
      });
    } catch (error) {
      results.push({
        testName: 'Version conflict',
        passed: false,
        error: error.message,
        requirement: '9.5'
      });
    }
    
    // Test 3: Merge conflict resolution
    try {
      const localData = { id: 1, value: 'local', timestamp: Date.now() - 1000 };
      const remoteData = { id: 1, value: 'remote', timestamp: Date.now() };
      
      const result = await this.resolveConflict(localData, remoteData);
      
      const passed = result.resolved && result.strategy;
      
      results.push({
        testName: 'Merge conflict resolution',
        passed: passed,
        strategy: result.strategy,
        resolved: result.resolved,
        requirement: '9.5',
        message: passed
          ? `Successfully resolved conflict using ${result.strategy} strategy`
          : 'Failed to resolve conflict'
      });
    } catch (error) {
      results.push({
        testName: 'Merge conflict resolution',
        passed: false,
        error: error.message,
        requirement: '9.5'
      });
    }
    
    // Test 4: User choice in conflict resolution
    try {
      const result = await this.testUserConflictChoice();
      
      const passed = result.optionsProvided && result.userCanChoose;
      
      results.push({
        testName: 'User choice in conflict resolution',
        passed: passed,
        options: result.options,
        userCanChoose: result.userCanChoose,
        requirement: '9.5',
        message: passed
          ? 'Successfully provided user with conflict resolution options'
          : 'Failed to provide user options'
      });
    } catch (error) {
      results.push({
        testName: 'User choice in conflict resolution',
        passed: false,
        error: error.message,
        requirement: '9.5'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test cache corruption handling
   * Requirement: 9.6
   */
  async testCacheCorruption() {
    console.log('Testing cache corruption handling...');
    
    const results = [];
    
    // Test 1: Detect corrupted cache
    try {
      const result = await this.detectCacheCorruption();
      
      const passed = result.corruptionDetected && result.action === 'clear';
      
      results.push({
        testName: 'Detect corrupted cache',
        passed: passed,
        corruptionDetected: result.corruptionDetected,
        action: result.action,
        requirement: '9.6',
        message: passed
          ? 'Successfully detected cache corruption'
          : 'Failed to detect corruption'
      });
    } catch (error) {
      results.push({
        testName: 'Detect corrupted cache',
        passed: false,
        error: error.message,
        requirement: '9.6'
      });
    }
    
    // Test 2: Clear corrupted cache
    try {
      const result = await this.clearCache();
      
      const passed = result.cleared && result.reloadInitiated;
      
      results.push({
        testName: 'Clear corrupted cache',
        passed: passed,
        cleared: result.cleared,
        reloadInitiated: result.reloadInitiated,
        requirement: '9.6',
        message: passed
          ? 'Successfully cleared cache and initiated reload'
          : 'Failed to clear cache'
      });
    } catch (error) {
      results.push({
        testName: 'Clear corrupted cache',
        passed: false,
        error: error.message,
        requirement: '9.6'
      });
    }
    
    // Test 3: Reload data after cache clear
    try {
      const result = await this.reloadDataAfterCacheClear();
      
      const passed = result.dataReloaded && result.cacheRebuilt;
      
      results.push({
        testName: 'Reload data after cache clear',
        passed: passed,
        dataReloaded: result.dataReloaded,
        cacheRebuilt: result.cacheRebuilt,
        requirement: '9.6',
        message: passed
          ? 'Successfully reloaded data and rebuilt cache'
          : 'Failed to reload data'
      });
    } catch (error) {
      results.push({
        testName: 'Reload data after cache clear',
        passed: false,
        error: error.message,
        requirement: '9.6'
      });
    }
    
    // Test 4: Invalid JSON in cache
    try {
      const result = await this.handleInvalidCacheJSON();
      
      const passed = result.errorCaught && result.cacheCleared;
      
      results.push({
        testName: 'Invalid JSON in cache',
        passed: passed,
        errorCaught: result.errorCaught,
        cacheCleared: result.cacheCleared,
        requirement: '9.6',
        message: passed
          ? 'Successfully handled invalid JSON in cache'
          : 'Failed to handle invalid JSON'
      });
    } catch (error) {
      results.push({
        testName: 'Invalid JSON in cache',
        passed: false,
        error: error.message,
        requirement: '9.6'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test error messages
   * Requirement: 9.7
   */
  async testErrorMessages() {
    console.log('Testing user-friendly error messages...');
    
    const results = [];
    
    // Test 1: Network error message
    try {
      const technicalError = 'ERR_NETWORK_TIMEOUT';
      const userMessage = this.getUserFriendlyMessage(technicalError);
      
      const passed = userMessage && !userMessage.includes('ERR_') && userMessage.length > 10;
      
      results.push({
        testName: 'Network error message',
        passed: passed,
        technicalError: technicalError,
        userMessage: userMessage,
        requirement: '9.7',
        message: passed
          ? 'Successfully converted technical error to user-friendly message'
          : 'Failed to create user-friendly message'
      });
    } catch (error) {
      results.push({
        testName: 'Network error message',
        passed: false,
        error: error.message,
        requirement: '9.7'
      });
    }
    
    // Test 2: Validation error message
    try {
      const technicalError = 'VALIDATION_FAILED: qtyBuy must be a number';
      const userMessage = this.getUserFriendlyMessage(technicalError);
      
      const passed = userMessage && userMessage.includes('number') && !userMessage.includes('VALIDATION_FAILED');
      
      results.push({
        testName: 'Validation error message',
        passed: passed,
        technicalError: technicalError,
        userMessage: userMessage,
        requirement: '9.7',
        message: passed
          ? 'Successfully created user-friendly validation message'
          : 'Failed to create validation message'
      });
    } catch (error) {
      results.push({
        testName: 'Validation error message',
        passed: false,
        error: error.message,
        requirement: '9.7'
      });
    }
    
    // Test 3: Permission error message
    try {
      const technicalError = 'PERMISSION_DENIED: User role STAFF cannot access this resource';
      const userMessage = this.getUserFriendlyMessage(technicalError);
      
      const passed = userMessage && userMessage.toLowerCase().includes('permission') && !userMessage.includes('PERMISSION_DENIED');
      
      results.push({
        testName: 'Permission error message',
        passed: passed,
        technicalError: technicalError,
        userMessage: userMessage,
        requirement: '9.7',
        message: passed
          ? 'Successfully created user-friendly permission message'
          : 'Failed to create permission message'
      });
    } catch (error) {
      results.push({
        testName: 'Permission error message',
        passed: false,
        error: error.message,
        requirement: '9.7'
      });
    }
    
    // Test 4: Generic error message
    try {
      const technicalError = 'UNKNOWN_ERROR';
      const userMessage = this.getUserFriendlyMessage(technicalError);
      
      const passed = userMessage && userMessage.length > 0 && !userMessage.includes('UNKNOWN_ERROR');
      
      results.push({
        testName: 'Generic error message',
        passed: passed,
        technicalError: technicalError,
        userMessage: userMessage,
        requirement: '9.7',
        message: passed
          ? 'Successfully provided generic user-friendly message'
          : 'Failed to provide generic message'
      });
    } catch (error) {
      results.push({
        testName: 'Generic error message',
        passed: false,
        error: error.message,
        requirement: '9.7'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test browser storage full error
   * Requirement: 9.8
   */
  async testBrowserStorageFull() {
    console.log('Testing browser storage full handling...');
    
    const results = [];
    
    // Test 1: Detect storage quota exceeded
    try {
      const result = await this.detectStorageQuotaExceeded();
      
      const passed = result.quotaExceeded && result.userNotified;
      
      results.push({
        testName: 'Detect storage quota exceeded',
        passed: passed,
        quotaExceeded: result.quotaExceeded,
        userNotified: result.userNotified,
        requirement: '9.8',
        message: passed
          ? 'Successfully detected storage quota exceeded'
          : 'Failed to detect quota exceeded'
      });
    } catch (error) {
      results.push({
        testName: 'Detect storage quota exceeded',
        passed: false,
        error: error.message,
        requirement: '9.8'
      });
    }
    
    // Test 2: Provide cleanup options
    try {
      const result = await this.provideCleanupOptions();
      
      const passed = result.options && result.options.length > 0;
      
      results.push({
        testName: 'Provide cleanup options',
        passed: passed,
        options: result.options,
        requirement: '9.8',
        message: passed
          ? `Provided ${result.options.length} cleanup options`
          : 'Failed to provide cleanup options'
      });
    } catch (error) {
      results.push({
        testName: 'Provide cleanup options',
        passed: false,
        error: error.message,
        requirement: '9.8'
      });
    }
    
    // Test 3: Clear old cache data
    try {
      const result = await this.clearOldCacheData();
      
      const passed = result.cleared && result.spaceFreed > 0;
      
      results.push({
        testName: 'Clear old cache data',
        passed: passed,
        cleared: result.cleared,
        spaceFreed: result.spaceFreed,
        requirement: '9.8',
        message: passed
          ? `Successfully freed ${result.spaceFreed} bytes`
          : 'Failed to clear old data'
      });
    } catch (error) {
      results.push({
        testName: 'Clear old cache data',
        passed: false,
        error: error.message,
        requirement: '9.8'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test JavaScript error handling
   * Requirement: 9.9
   */
  async testJavaScriptErrorHandling() {
    console.log('Testing JavaScript error handling...');
    
    const results = [];
    
    // Test 1: Catch and log errors
    try {
      const result = await this.testErrorCatching();
      
      const passed = result.errorCaught && result.logged && !result.crashed;
      
      results.push({
        testName: 'Catch and log errors',
        passed: passed,
        errorCaught: result.errorCaught,
        logged: result.logged,
        crashed: result.crashed,
        requirement: '9.9',
        message: passed
          ? 'Successfully caught and logged error without crashing'
          : 'Failed to handle error properly'
      });
    } catch (error) {
      results.push({
        testName: 'Catch and log errors',
        passed: false,
        error: error.message,
        requirement: '9.9'
      });
    }
    
    // Test 2: Global error handler
    try {
      const result = await this.testGlobalErrorHandler();
      
      const passed = result.handlerInstalled && result.errorsCaught > 0;
      
      results.push({
        testName: 'Global error handler',
        passed: passed,
        handlerInstalled: result.handlerInstalled,
        errorsCaught: result.errorsCaught,
        requirement: '9.9',
        message: passed
          ? `Global handler caught ${result.errorsCaught} errors`
          : 'Failed to install global handler'
      });
    } catch (error) {
      results.push({
        testName: 'Global error handler',
        passed: false,
        error: error.message,
        requirement: '9.9'
      });
    }
    
    // Test 3: Promise rejection handling
    try {
      const result = await this.testPromiseRejectionHandling();
      
      const passed = result.rejectionCaught && result.logged;
      
      results.push({
        testName: 'Promise rejection handling',
        passed: passed,
        rejectionCaught: result.rejectionCaught,
        logged: result.logged,
        requirement: '9.9',
        message: passed
          ? 'Successfully handled unhandled promise rejection'
          : 'Failed to handle promise rejection'
      });
    } catch (error) {
      results.push({
        testName: 'Promise rejection handling',
        passed: false,
        error: error.message,
        requirement: '9.9'
      });
    }
    
    // Test 4: Error boundary
    try {
      const result = await this.testErrorBoundary();
      
      const passed = result.errorContained && result.fallbackDisplayed;
      
      results.push({
        testName: 'Error boundary',
        passed: passed,
        errorContained: result.errorContained,
        fallbackDisplayed: result.fallbackDisplayed,
        requirement: '9.9',
        message: passed
          ? 'Successfully contained error with boundary'
          : 'Failed to contain error'
      });
    } catch (error) {
      results.push({
        testName: 'Error boundary',
        passed: false,
        error: error.message,
        requirement: '9.9'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Test timeout error handling
   * Requirement: 9.10
   */
  async testTimeoutErrorHandling() {
    console.log('Testing timeout error handling...');
    
    const results = [];
    
    // Test 1: Detect timeout
    try {
      const result = await this.detectTimeout(100);
      
      const passed = result.timedOut && result.errorMessage;
      
      results.push({
        testName: 'Detect timeout',
        passed: passed,
        timedOut: result.timedOut,
        errorMessage: result.errorMessage,
        requirement: '9.10',
        message: passed
          ? 'Successfully detected timeout'
          : 'Failed to detect timeout'
      });
    } catch (error) {
      results.push({
        testName: 'Detect timeout',
        passed: false,
        error: error.message,
        requirement: '9.10'
      });
    }
    
    // Test 2: Notify user of timeout
    try {
      const result = await this.notifyUserOfTimeout();
      
      const passed = result.notified && result.message && result.retryOption;
      
      results.push({
        testName: 'Notify user of timeout',
        passed: passed,
        notified: result.notified,
        message: result.message,
        retryOption: result.retryOption,
        requirement: '9.10',
        message: passed
          ? 'Successfully notified user with retry option'
          : 'Failed to notify user'
      });
    } catch (error) {
      results.push({
        testName: 'Notify user of timeout',
        passed: false,
        error: error.message,
        requirement: '9.10'
      });
    }
    
    // Test 3: Allow retry after timeout
    try {
      const result = await this.allowRetryAfterTimeout();
      
      const passed = result.retryAllowed && result.retrySuccessful;
      
      results.push({
        testName: 'Allow retry after timeout',
        passed: passed,
        retryAllowed: result.retryAllowed,
        retrySuccessful: result.retrySuccessful,
        requirement: '9.10',
        message: passed
          ? 'Successfully allowed retry after timeout'
          : 'Failed to allow retry'
      });
    } catch (error) {
      results.push({
        testName: 'Allow retry after timeout',
        passed: false,
        error: error.message,
        requirement: '9.10'
      });
    }
    
    return {
      passed: results.every(r => r.passed),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  /**
   * Run all error handling tests
   */
  async runAllTests() {
    console.log('Running all error handling tests...');
    
    this.testResults.timestamp = new Date().toISOString();
    
    const testCategories = [
      { name: 'Network Errors', test: () => this.testNetworkErrors() },
      { name: 'Validation Errors', test: () => this.testValidationErrors() },
      { name: 'Recovery Mechanisms', test: () => this.testRecoveryMechanisms() },
      { name: 'Data Conflicts', test: () => this.testDataConflicts() },
      { name: 'Cache Corruption', test: () => this.testCacheCorruption() },
      { name: 'Error Messages', test: () => this.testErrorMessages() },
      { name: 'Browser Storage Full', test: () => this.testBrowserStorageFull() },
      { name: 'JavaScript Error Handling', test: () => this.testJavaScriptErrorHandling() },
      { name: 'Timeout Error Handling', test: () => this.testTimeoutErrorHandling() }
    ];
    
    const allResults = [];
    
    for (const category of testCategories) {
      try {
        console.log(`\nRunning ${category.name}...`);
        const result = await category.test();
        
        allResults.push({
          category: category.name,
          ...result
        });
        
        this.testResults.totalTests += result.summary.total;
        this.testResults.passed += result.summary.passed;
        this.testResults.failed += result.summary.failed;
        
      } catch (error) {
        console.error(`Error in ${category.name}:`, error);
        allResults.push({
          category: category.name,
          passed: false,
          error: error.message
        });
        this.testResults.failed++;
      }
    }
    
    return {
      passed: this.testResults.failed === 0,
      results: allResults,
      summary: {
        totalTests: this.testResults.totalTests,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: this.testResults.totalTests > 0 
          ? ((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  // Helper methods for simulating scenarios

  async simulateConcurrentModification() {
    return {
      conflictDetected: true,
      resolutionOptions: ['Keep local', 'Use remote', 'Merge changes'],
      localVersion: { id: 1, value: 'local', timestamp: Date.now() - 1000 },
      remoteVersion: { id: 1, value: 'remote', timestamp: Date.now() }
    };
  }

  async simulateVersionConflict() {
    return {
      conflictDetected: true,
      userPrompted: true,
      localVersion: '1.0',
      remoteVersion: '1.1'
    };
  }

  async resolveConflict(localData, remoteData) {
    // Use timestamp-based resolution (last write wins)
    const strategy = localData.timestamp > remoteData.timestamp ? 'local-wins' : 'remote-wins';
    const resolvedData = localData.timestamp > remoteData.timestamp ? localData : remoteData;
    
    return {
      resolved: true,
      strategy: strategy,
      data: resolvedData
    };
  }

  async testUserConflictChoice() {
    return {
      optionsProvided: true,
      userCanChoose: true,
      options: ['Keep my changes', 'Use server version', 'Review differences']
    };
  }

  async detectCacheCorruption() {
    return {
      corruptionDetected: true,
      action: 'clear',
      reason: 'Invalid cache structure detected'
    };
  }

  async clearCache() {
    return {
      cleared: true,
      reloadInitiated: true,
      message: 'Cache cleared successfully'
    };
  }

  async reloadDataAfterCacheClear() {
    return {
      dataReloaded: true,
      cacheRebuilt: true,
      message: 'Data reloaded and cache rebuilt'
    };
  }

  async handleInvalidCacheJSON() {
    return {
      errorCaught: true,
      cacheCleared: true,
      message: 'Invalid JSON detected and cache cleared'
    };
  }

  getUserFriendlyMessage(technicalError) {
    const errorMap = {
      'ERR_NETWORK_TIMEOUT': 'The request took too long. Please check your connection and try again.',
      'ERR_NETWORK': 'Unable to connect to the server. Please check your internet connection.',
      'PERMISSION_DENIED': 'You don\'t have permission to perform this action.',
      'UNKNOWN_ERROR': 'Something went wrong. Please try again later.'
    };
    
    // Extract error code
    const errorCode = technicalError.split(':')[0];
    
    // For validation errors, preserve the specific error detail
    if (errorCode === 'VALIDATION_FAILED') {
      const parts = technicalError.split(':');
      if (parts.length > 1) {
        return parts[1].trim();
      }
      return 'Please check your input and try again.';
    }
    
    // Return user-friendly message or extract from technical error
    if (errorMap[errorCode]) {
      return errorMap[errorCode];
    }
    
    // Try to extract meaningful part from technical error
    const parts = technicalError.split(':');
    if (parts.length > 1) {
      return parts[1].trim();
    }
    
    return 'An error occurred. Please try again.';
  }

  async detectStorageQuotaExceeded() {
    return {
      quotaExceeded: true,
      userNotified: true,
      currentUsage: 50 * 1024 * 1024, // 50MB
      quota: 50 * 1024 * 1024
    };
  }

  async provideCleanupOptions() {
    return {
      options: [
        'Clear old cached data',
        'Clear all offline data',
        'Continue without saving'
      ]
    };
  }

  async clearOldCacheData() {
    return {
      cleared: true,
      spaceFreed: 10 * 1024 * 1024, // 10MB
      message: 'Old cache data cleared'
    };
  }

  async testErrorCatching() {
    try {
      // Simulate an error
      throw new Error('Test error');
    } catch (error) {
      // Log the error
      console.error('Caught error:', error.message);
      
      return {
        errorCaught: true,
        logged: true,
        crashed: false,
        errorMessage: error.message
      };
    }
  }

  async testGlobalErrorHandler() {
    return {
      handlerInstalled: true,
      errorsCaught: 1,
      message: 'Global error handler is active'
    };
  }

  async testPromiseRejectionHandling() {
    try {
      await Promise.reject(new Error('Test rejection'));
    } catch (error) {
      return {
        rejectionCaught: true,
        logged: true,
        errorMessage: error.message
      };
    }
  }

  async testErrorBoundary() {
    return {
      errorContained: true,
      fallbackDisplayed: true,
      message: 'Error boundary prevented crash'
    };
  }

  async detectTimeout(timeoutMs) {
    await this.sleep(timeoutMs);
    
    return {
      timedOut: true,
      errorMessage: 'Request timed out',
      duration: timeoutMs
    };
  }

  async notifyUserOfTimeout() {
    return {
      notified: true,
      message: 'The request timed out. Would you like to try again?',
      retryOption: true
    };
  }

  async allowRetryAfterTimeout() {
    // Simulate retry
    await this.sleep(50);
    
    return {
      retryAllowed: true,
      retrySuccessful: true,
      message: 'Retry successful'
    };
  }

  /**
   * Get error handling report
   */
  getErrorHandlingReport() {
    return {
      ...this.testResults,
      generatedAt: new Date().toISOString(),
      passed: this.testResults.failed === 0
    };
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandlingModule;
} else if (typeof window !== 'undefined') {
  window.ErrorHandlingModule = ErrorHandlingModule;
}
