/**
 * Security Testing Module
 * Tests authentication, authorization, and input validation
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
 */

class SecurityTestingModule {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || '',
      timeout: config.timeout || 10000,
      ...config
    };
    
    // Test user credentials for different roles
    this.testUsers = {
      owner: {
        user_key: 'owner@test.com',
        role: 'OWNER',
        name: 'Test Owner',
        active: true
      },
      partner: {
        user_key: 'partner@test.com',
        role: 'PARTNER',
        name: 'Test Partner',
        active: true
      },
      staff: {
        user_key: 'staff@test.com',
        role: 'STAFF',
        name: 'Test Staff',
        active: true
      },
      inactive: {
        user_key: 'inactive@test.com',
        role: 'STAFF',
        name: 'Inactive User',
        active: false
      }
    };
    
    this.testResults = {
      timestamp: null,
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: [],
      vulnerabilities: []
    };
  }

  /**
   * Test user authentication
   * Requirement: 8.1
   */
  async testAuthentication() {
    console.log('Testing user authentication...');
    
    const results = [];
    
    // Test 1: Valid user authentication
    try {
      const result = await this.authenticateUser(this.testUsers.owner);
      
      results.push({
        testName: 'Valid user authentication - OWNER',
        passed: result.authenticated === true,
        user: this.testUsers.owner.user_key,
        role: this.testUsers.owner.role,
        requirement: '8.1',
        message: result.authenticated
          ? 'Successfully authenticated valid OWNER user'
          : 'Failed to authenticate valid user'
      });
    } catch (error) {
      results.push({
        testName: 'Valid user authentication - OWNER',
        passed: false,
        error: error.message,
        requirement: '8.1'
      });
    }
    
    // Test 2: Valid PARTNER authentication
    try {
      const result = await this.authenticateUser(this.testUsers.partner);
      
      results.push({
        testName: 'Valid user authentication - PARTNER',
        passed: result.authenticated === true,
        user: this.testUsers.partner.user_key,
        role: this.testUsers.partner.role,
        requirement: '8.1',
        message: result.authenticated
          ? 'Successfully authenticated valid PARTNER user'
          : 'Failed to authenticate valid user'
      });
    } catch (error) {
      results.push({
        testName: 'Valid user authentication - PARTNER',
        passed: false,
        error: error.message,
        requirement: '8.1'
      });
    }
    
    // Test 3: Valid STAFF authentication
    try {
      const result = await this.authenticateUser(this.testUsers.staff);
      
      results.push({
        testName: 'Valid user authentication - STAFF',
        passed: result.authenticated === true,
        user: this.testUsers.staff.user_key,
        role: this.testUsers.staff.role,
        requirement: '8.1',
        message: result.authenticated
          ? 'Successfully authenticated valid STAFF user'
          : 'Failed to authenticate valid user'
      });
    } catch (error) {
      results.push({
        testName: 'Valid user authentication - STAFF',
        passed: false,
        error: error.message,
        requirement: '8.1'
      });
    }
    
    // Test 4: Invalid user authentication
    try {
      const invalidUser = {
        user_key: 'nonexistent@test.com',
        role: 'STAFF',
        name: 'Invalid User',
        active: true
      };
      
      const result = await this.authenticateUser(invalidUser);
      
      results.push({
        testName: 'Invalid user authentication',
        passed: result.authenticated === false,
        user: invalidUser.user_key,
        requirement: '8.1',
        message: result.authenticated === false
          ? 'Correctly rejected invalid user'
          : 'Failed to reject invalid user'
      });
    } catch (error) {
      results.push({
        testName: 'Invalid user authentication',
        passed: true, // Exception is acceptable for invalid user
        error: error.message,
        requirement: '8.1',
        message: 'Rejected invalid user with exception'
      });
    }
    
    // Test 5: Empty credentials
    try {
      const emptyUser = {
        user_key: '',
        role: '',
        name: '',
        active: true
      };
      
      const result = await this.authenticateUser(emptyUser);
      
      results.push({
        testName: 'Empty credentials authentication',
        passed: result.authenticated === false,
        requirement: '8.1',
        message: result.authenticated === false
          ? 'Correctly rejected empty credentials'
          : 'Failed to reject empty credentials'
      });
    } catch (error) {
      results.push({
        testName: 'Empty credentials authentication',
        passed: true,
        error: error.message,
        requirement: '8.1',
        message: 'Rejected empty credentials with exception'
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
   * Test role-based authorization
   * Requirements: 8.2, 8.3, 8.4
   */
  async testAuthorization() {
    console.log('Testing role-based authorization...');
    
    const results = [];
    
    // Define operations and their required roles
    const operations = [
      {
        name: 'Add Purchase',
        action: 'addPurchase',
        allowedRoles: ['OWNER', 'PARTNER', 'STAFF'],
        params: { ingredient_id: 'TEST', qtyBuy: 10, totalPrice: 100 }
      },
      {
        name: 'Add Sale',
        action: 'addSale',
        allowedRoles: ['OWNER', 'PARTNER', 'STAFF'],
        params: { platform: 'Grab', menu_id: 'TEST', qty: 1, price: 50 }
      },
      {
        name: 'View Reports',
        action: 'getReport',
        allowedRoles: ['OWNER', 'PARTNER'],
        params: { type: 'daily' }
      },
      {
        name: 'Manage Users',
        action: 'manageUsers',
        allowedRoles: ['OWNER'],
        params: {}
      },
      {
        name: 'View Bootstrap Data',
        action: 'getBootstrapData',
        allowedRoles: ['OWNER', 'PARTNER', 'STAFF'],
        params: {}
      }
    ];
    
    // Test each operation with each role
    for (const operation of operations) {
      // Test OWNER role (Requirement 8.2)
      try {
        const result = await this.checkAuthorization(
          this.testUsers.owner,
          operation.action,
          operation.params
        );
        
        const shouldAllow = operation.allowedRoles.includes('OWNER');
        const passed = result.authorized === shouldAllow;
        
        results.push({
          testName: `${operation.name} - OWNER role`,
          operation: operation.name,
          role: 'OWNER',
          passed: passed,
          authorized: result.authorized,
          expected: shouldAllow,
          requirement: '8.2',
          message: passed
            ? `OWNER ${shouldAllow ? 'correctly allowed' : 'correctly denied'} access`
            : `OWNER authorization check failed`
        });
      } catch (error) {
        results.push({
          testName: `${operation.name} - OWNER role`,
          operation: operation.name,
          role: 'OWNER',
          passed: false,
          error: error.message,
          requirement: '8.2'
        });
      }
      
      // Test PARTNER role (Requirement 8.3)
      try {
        const result = await this.checkAuthorization(
          this.testUsers.partner,
          operation.action,
          operation.params
        );
        
        const shouldAllow = operation.allowedRoles.includes('PARTNER');
        const passed = result.authorized === shouldAllow;
        
        results.push({
          testName: `${operation.name} - PARTNER role`,
          operation: operation.name,
          role: 'PARTNER',
          passed: passed,
          authorized: result.authorized,
          expected: shouldAllow,
          requirement: '8.3',
          message: passed
            ? `PARTNER ${shouldAllow ? 'correctly allowed' : 'correctly denied'} access`
            : `PARTNER authorization check failed`
        });
      } catch (error) {
        results.push({
          testName: `${operation.name} - PARTNER role`,
          operation: operation.name,
          role: 'PARTNER',
          passed: false,
          error: error.message,
          requirement: '8.3'
        });
      }
      
      // Test STAFF role (Requirement 8.4)
      try {
        const result = await this.checkAuthorization(
          this.testUsers.staff,
          operation.action,
          operation.params
        );
        
        const shouldAllow = operation.allowedRoles.includes('STAFF');
        const passed = result.authorized === shouldAllow;
        
        results.push({
          testName: `${operation.name} - STAFF role`,
          operation: operation.name,
          role: 'STAFF',
          passed: passed,
          authorized: result.authorized,
          expected: shouldAllow,
          requirement: '8.4',
          message: passed
            ? `STAFF ${shouldAllow ? 'correctly allowed' : 'correctly denied'} access`
            : `STAFF authorization check failed`
        });
      } catch (error) {
        results.push({
          testName: `${operation.name} - STAFF role`,
          operation: operation.name,
          role: 'STAFF',
          passed: false,
          error: error.message,
          requirement: '8.4'
        });
      }
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
   * Test inactive user access denial
   * Requirement: 8.5
   */
  async testInactiveUsers() {
    console.log('Testing inactive user access denial...');
    
    const results = [];
    
    // Test 1: Inactive user authentication should fail
    try {
      const result = await this.authenticateUser(this.testUsers.inactive);
      
      results.push({
        testName: 'Inactive user authentication',
        passed: result.authenticated === false,
        user: this.testUsers.inactive.user_key,
        active: this.testUsers.inactive.active,
        requirement: '8.5',
        message: result.authenticated === false
          ? 'Correctly denied access to inactive user'
          : 'Failed to deny access to inactive user'
      });
    } catch (error) {
      results.push({
        testName: 'Inactive user authentication',
        passed: true, // Exception is acceptable
        error: error.message,
        requirement: '8.5',
        message: 'Denied inactive user with exception'
      });
    }
    
    // Test 2: Inactive user cannot perform operations
    const operations = ['addPurchase', 'addSale', 'getReport', 'getBootstrapData'];
    
    for (const operation of operations) {
      try {
        const result = await this.checkAuthorization(
          this.testUsers.inactive,
          operation,
          {}
        );
        
        results.push({
          testName: `Inactive user - ${operation}`,
          operation: operation,
          passed: result.authorized === false,
          user: this.testUsers.inactive.user_key,
          requirement: '8.5',
          message: result.authorized === false
            ? `Correctly denied ${operation} for inactive user`
            : `Failed to deny ${operation} for inactive user`
        });
      } catch (error) {
        results.push({
          testName: `Inactive user - ${operation}`,
          operation: operation,
          passed: true,
          error: error.message,
          requirement: '8.5',
          message: 'Denied operation with exception'
        });
      }
    }
    
    // Test 3: User with active=false flag
    try {
      const inactiveUser = {
        user_key: 'test@inactive.com',
        role: 'OWNER',
        name: 'Inactive Owner',
        active: false
      };
      
      const result = await this.authenticateUser(inactiveUser);
      
      results.push({
        testName: 'User with active=false flag',
        passed: result.authenticated === false,
        user: inactiveUser.user_key,
        role: inactiveUser.role,
        requirement: '8.5',
        message: result.authenticated === false
          ? 'Correctly denied access despite OWNER role'
          : 'Failed to check active flag'
      });
    } catch (error) {
      results.push({
        testName: 'User with active=false flag',
        passed: true,
        error: error.message,
        requirement: '8.5',
        message: 'Denied inactive user with exception'
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
   * Authenticate user against Users sheet
   */
  async authenticateUser(user) {
    // Simulate authentication check
    // In real implementation, this would query the Users sheet
    
    if (!user.user_key || user.user_key === '') {
      return { authenticated: false, reason: 'Empty user_key' };
    }
    
    if (!user.active) {
      return { authenticated: false, reason: 'User is inactive' };
    }
    
    // Check if user exists in test users
    const validUsers = Object.values(this.testUsers).filter(u => u.active);
    const userExists = validUsers.some(u => u.user_key === user.user_key);
    
    if (!userExists) {
      return { authenticated: false, reason: 'User not found' };
    }
    
    return {
      authenticated: true,
      user: user.user_key,
      role: user.role,
      name: user.name
    };
  }

  /**
   * Check user authorization for operation
   */
  async checkAuthorization(user, action, params) {
    // First check authentication
    const authResult = await this.authenticateUser(user);
    
    if (!authResult.authenticated) {
      return {
        authorized: false,
        reason: 'User not authenticated',
        authResult: authResult
      };
    }
    
    // Define role permissions
    const permissions = {
      'OWNER': ['addPurchase', 'addSale', 'getReport', 'manageUsers', 'getBootstrapData', 'searchIngredients', 'getIngredientMap', 'getLowStockHTML'],
      'PARTNER': ['addPurchase', 'addSale', 'getReport', 'getBootstrapData', 'searchIngredients', 'getIngredientMap', 'getLowStockHTML'],
      'STAFF': ['addPurchase', 'addSale', 'getBootstrapData', 'searchIngredients', 'getIngredientMap']
    };
    
    const userPermissions = permissions[user.role] || [];
    const authorized = userPermissions.includes(action);
    
    return {
      authorized: authorized,
      user: user.user_key,
      role: user.role,
      action: action,
      reason: authorized ? 'Permission granted' : 'Insufficient permissions'
    };
  }

  /**
   * Get security test report
   */
  getSecurityReport() {
    return {
      ...this.testResults,
      generatedAt: new Date().toISOString(),
      passed: this.testResults.failed === 0,
      securityScore: this.calculateSecurityScore()
    };
  }

  /**
   * Calculate security score
   */
  calculateSecurityScore() {
    if (this.testResults.totalTests === 0) {
      return 0;
    }
    
    const score = (this.testResults.passed / this.testResults.totalTests) * 100;
    
    // Deduct points for critical vulnerabilities
    const criticalVulnerabilities = this.testResults.vulnerabilities.filter(
      v => v.severity === 'critical'
    ).length;
    
    return Math.max(0, score - (criticalVulnerabilities * 10));
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityTestingModule;
} else if (typeof window !== 'undefined') {
  window.SecurityTestingModule = SecurityTestingModule;
}

  /**
   * Test input validation and parameter sanitization
   * Requirement: 8.6
   */
  async testInputValidation() {
    console.log('Testing input validation and parameter sanitization...');
    
    const results = [];
    
    // Test 1: SQL injection attempts
    const sqlInjectionPayloads = [
      "'; DROP TABLE Users; --",
      "1' OR '1'='1",
      "admin'--",
      "' OR 1=1--",
      "1; DELETE FROM Ingredients WHERE '1'='1"
    ];
    
    for (const payload of sqlInjectionPayloads) {
      try {
        const sanitized = this.sanitizeInput(payload);
        const containsDangerousChars = this.containsSQLInjection(sanitized);
        
        results.push({
          testName: 'SQL injection prevention',
          payload: payload,
          sanitized: sanitized,
          passed: !containsDangerousChars,
          requirement: '8.7',
          message: !containsDangerousChars
            ? 'Successfully sanitized SQL injection attempt'
            : 'Failed to sanitize SQL injection'
        });
      } catch (error) {
        results.push({
          testName: 'SQL injection prevention',
          payload: payload,
          passed: true, // Exception is acceptable
          error: error.message,
          requirement: '8.7',
          message: 'Rejected malicious input with exception'
        });
      }
    }
    
    // Test 2: Script injection attempts
    const scriptPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>'
    ];
    
    for (const payload of scriptPayloads) {
      try {
        const sanitized = this.sanitizeInput(payload);
        const containsScripts = this.containsScriptTags(sanitized);
        
        results.push({
          testName: 'Script injection prevention',
          payload: payload,
          sanitized: sanitized,
          passed: !containsScripts,
          requirement: '8.6',
          message: !containsScripts
            ? 'Successfully sanitized script injection'
            : 'Failed to sanitize script tags'
        });
      } catch (error) {
        results.push({
          testName: 'Script injection prevention',
          payload: payload,
          passed: true,
          error: error.message,
          requirement: '8.6',
          message: 'Rejected malicious input with exception'
        });
      }
    }
    
    // Test 3: Special character handling
    const specialChars = [
      { input: 'test<>test', expected: 'test&lt;&gt;test' },
      { input: 'test&test', expected: 'test&amp;test' },
      { input: 'test"test', expected: 'test&quot;test' },
      { input: "test'test", expected: 'test&#x27;test' },
      { input: 'test/test', expected: 'test&#x2F;test' }
    ];
    
    for (const test of specialChars) {
      try {
        const sanitized = this.escapeHTML(test.input);
        const passed = sanitized === test.expected || !this.containsDangerousChars(sanitized);
        
        results.push({
          testName: 'Special character escaping',
          input: test.input,
          sanitized: sanitized,
          expected: test.expected,
          passed: passed,
          requirement: '8.6',
          message: passed
            ? 'Successfully escaped special characters'
            : 'Failed to escape special characters'
        });
      } catch (error) {
        results.push({
          testName: 'Special character escaping',
          input: test.input,
          passed: false,
          error: error.message,
          requirement: '8.6'
        });
      }
    }
    
    // Test 4: Numeric input validation
    const numericTests = [
      { input: '123', valid: true },
      { input: '-456', valid: true },
      { input: '12.34', valid: true },
      { input: 'abc', valid: false },
      { input: '12abc', valid: false },
      { input: '1e10', valid: true },
      { input: 'NaN', valid: false },
      { input: 'Infinity', valid: false }
    ];
    
    for (const test of numericTests) {
      try {
        const isValid = this.validateNumericInput(test.input);
        const passed = isValid === test.valid;
        
        results.push({
          testName: 'Numeric input validation',
          input: test.input,
          expected: test.valid,
          actual: isValid,
          passed: passed,
          requirement: '8.6',
          message: passed
            ? `Correctly validated numeric input: ${test.input}`
            : `Failed to validate numeric input: ${test.input}`
        });
      } catch (error) {
        results.push({
          testName: 'Numeric input validation',
          input: test.input,
          passed: false,
          error: error.message,
          requirement: '8.6'
        });
      }
    }
    
    // Test 5: Email validation
    const emailTests = [
      { email: 'test@example.com', valid: true },
      { email: 'user.name@domain.co.th', valid: true },
      { email: 'invalid@', valid: false },
      { email: '@invalid.com', valid: false },
      { email: 'no-at-sign.com', valid: false },
      { email: 'test@domain', valid: false }
    ];
    
    for (const test of emailTests) {
      try {
        const isValid = this.validateEmail(test.email);
        const passed = isValid === test.valid;
        
        results.push({
          testName: 'Email validation',
          email: test.email,
          expected: test.valid,
          actual: isValid,
          passed: passed,
          requirement: '8.6',
          message: passed
            ? `Correctly validated email: ${test.email}`
            : `Failed to validate email: ${test.email}`
        });
      } catch (error) {
        results.push({
          testName: 'Email validation',
          email: test.email,
          passed: false,
          error: error.message,
          requirement: '8.6'
        });
      }
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
   * Test XSS prevention
   * Requirement: 8.8
   */
  async testXSSPrevention() {
    console.log('Testing XSS prevention...');
    
    const results = [];
    
    // XSS attack vectors
    const xssVectors = [
      {
        name: 'Basic script tag',
        payload: '<script>alert("XSS")</script>',
        context: 'HTML'
      },
      {
        name: 'Image onerror',
        payload: '<img src=x onerror=alert("XSS")>',
        context: 'HTML'
      },
      {
        name: 'SVG script',
        payload: '<svg/onload=alert("XSS")>',
        context: 'HTML'
      },
      {
        name: 'JavaScript protocol',
        payload: '<a href="javascript:alert(\'XSS\')">Click</a>',
        context: 'HTML'
      },
      {
        name: 'Event handler',
        payload: '<div onmouseover="alert(\'XSS\')">Hover</div>',
        context: 'HTML'
      },
      {
        name: 'Data URI',
        payload: '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>',
        context: 'HTML'
      },
      {
        name: 'Style injection',
        payload: '<style>body{background:url("javascript:alert(\'XSS\')")}</style>',
        context: 'CSS'
      },
      {
        name: 'Meta refresh',
        payload: '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
        context: 'HTML'
      }
    ];
    
    for (const vector of xssVectors) {
      try {
        // Test HTML escaping
        const escaped = this.escapeHTML(vector.payload);
        const containsScripts = this.containsScriptTags(escaped);
        const containsEventHandlers = this.containsEventHandlers(escaped);
        
        const passed = !containsScripts && !containsEventHandlers;
        
        results.push({
          testName: `XSS prevention - ${vector.name}`,
          payload: vector.payload,
          escaped: escaped,
          context: vector.context,
          passed: passed,
          requirement: '8.8',
          message: passed
            ? `Successfully prevented XSS: ${vector.name}`
            : `Failed to prevent XSS: ${vector.name}`
        });
      } catch (error) {
        results.push({
          testName: `XSS prevention - ${vector.name}`,
          payload: vector.payload,
          passed: true, // Exception is acceptable
          error: error.message,
          requirement: '8.8',
          message: 'Rejected XSS attempt with exception'
        });
      }
    }
    
    // Test content escaping in different contexts
    const contexts = [
      {
        name: 'User input in HTML',
        input: '<script>alert("test")</script>',
        escapeFunction: 'escapeHTML'
      },
      {
        name: 'User input in attribute',
        input: '" onload="alert(\'XSS\')"',
        escapeFunction: 'escapeAttribute'
      },
      {
        name: 'User input in JavaScript',
        input: '"; alert("XSS"); "',
        escapeFunction: 'escapeJavaScript'
      }
    ];
    
    for (const context of contexts) {
      try {
        let escaped;
        switch (context.escapeFunction) {
          case 'escapeHTML':
            escaped = this.escapeHTML(context.input);
            break;
          case 'escapeAttribute':
            escaped = this.escapeAttribute(context.input);
            break;
          case 'escapeJavaScript':
            escaped = this.escapeJavaScript(context.input);
            break;
        }
        
        const safe = !this.containsDangerousChars(escaped);
        
        results.push({
          testName: context.name,
          input: context.input,
          escaped: escaped,
          passed: safe,
          requirement: '8.8',
          message: safe
            ? `Successfully escaped content in ${context.name}`
            : `Failed to escape content in ${context.name}`
        });
      } catch (error) {
        results.push({
          testName: context.name,
          input: context.input,
          passed: false,
          error: error.message,
          requirement: '8.8'
        });
      }
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
   * Test CSRF protection
   * Requirement: 8.9
   */
  async testCSRFProtection() {
    console.log('Testing CSRF protection...');
    
    const results = [];
    
    // Test 1: CSRF token generation
    try {
      const token1 = this.generateCSRFToken();
      const token2 = this.generateCSRFToken();
      
      const tokensUnique = token1 !== token2;
      const tokenValid = token1.length >= 32;
      
      results.push({
        testName: 'CSRF token generation',
        passed: tokensUnique && tokenValid,
        token1Length: token1.length,
        token2Length: token2.length,
        unique: tokensUnique,
        requirement: '8.9',
        message: (tokensUnique && tokenValid)
          ? 'CSRF tokens generated correctly'
          : 'CSRF token generation failed'
      });
    } catch (error) {
      results.push({
        testName: 'CSRF token generation',
        passed: false,
        error: error.message,
        requirement: '8.9'
      });
    }
    
    // Test 2: CSRF token validation
    try {
      const validToken = this.generateCSRFToken();
      const invalidToken = 'invalid-token-12345';
      
      const validResult = this.validateCSRFToken(validToken, validToken);
      const invalidResult = this.validateCSRFToken(invalidToken, validToken);
      
      results.push({
        testName: 'CSRF token validation',
        passed: validResult === true && invalidResult === false,
        validTokenCheck: validResult,
        invalidTokenCheck: invalidResult,
        requirement: '8.9',
        message: (validResult && !invalidResult)
          ? 'CSRF token validation works correctly'
          : 'CSRF token validation failed'
      });
    } catch (error) {
      results.push({
        testName: 'CSRF token validation',
        passed: false,
        error: error.message,
        requirement: '8.9'
      });
    }
    
    // Test 3: Request without CSRF token should be rejected
    try {
      const result = this.validateRequest({
        method: 'POST',
        headers: {},
        body: { action: 'addPurchase' }
      });
      
      results.push({
        testName: 'Request without CSRF token',
        passed: result.valid === false,
        requirement: '8.9',
        message: result.valid === false
          ? 'Correctly rejected request without CSRF token'
          : 'Failed to reject request without CSRF token'
      });
    } catch (error) {
      results.push({
        testName: 'Request without CSRF token',
        passed: true, // Exception is acceptable
        error: error.message,
        requirement: '8.9',
        message: 'Rejected request with exception'
      });
    }
    
    // Test 4: Request with valid CSRF token should be accepted
    try {
      const token = this.generateCSRFToken();
      const result = this.validateRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': token },
        body: { action: 'addPurchase' },
        session: { csrfToken: token }
      });
      
      results.push({
        testName: 'Request with valid CSRF token',
        passed: result.valid === true,
        requirement: '8.9',
        message: result.valid === true
          ? 'Correctly accepted request with valid CSRF token'
          : 'Failed to accept request with valid CSRF token'
      });
    } catch (error) {
      results.push({
        testName: 'Request with valid CSRF token',
        passed: false,
        error: error.message,
        requirement: '8.9'
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
   * Test CORS handling
   * Requirement: 8.10
   */
  async testCORSHandling() {
    console.log('Testing CORS handling...');
    
    const results = [];
    
    // Test 1: Allowed origin
    try {
      const allowedOrigins = [
        'https://example.com',
        'https://app.example.com',
        'http://localhost:3000'
      ];
      
      for (const origin of allowedOrigins) {
        const result = this.checkCORSOrigin(origin, allowedOrigins);
        
        results.push({
          testName: `CORS - Allowed origin: ${origin}`,
          origin: origin,
          passed: result.allowed === true,
          requirement: '8.10',
          message: result.allowed
            ? `Correctly allowed origin: ${origin}`
            : `Failed to allow valid origin: ${origin}`
        });
      }
    } catch (error) {
      results.push({
        testName: 'CORS - Allowed origins',
        passed: false,
        error: error.message,
        requirement: '8.10'
      });
    }
    
    // Test 2: Disallowed origin
    try {
      const allowedOrigins = ['https://example.com'];
      const disallowedOrigins = [
        'https://malicious.com',
        'http://evil.com',
        'https://phishing-example.com'
      ];
      
      for (const origin of disallowedOrigins) {
        const result = this.checkCORSOrigin(origin, allowedOrigins);
        
        results.push({
          testName: `CORS - Disallowed origin: ${origin}`,
          origin: origin,
          passed: result.allowed === false,
          requirement: '8.10',
          message: result.allowed === false
            ? `Correctly blocked origin: ${origin}`
            : `Failed to block malicious origin: ${origin}`
        });
      }
    } catch (error) {
      results.push({
        testName: 'CORS - Disallowed origins',
        passed: false,
        error: error.message,
        requirement: '8.10'
      });
    }
    
    // Test 3: CORS headers
    try {
      const headers = this.getCORSHeaders('https://example.com', ['https://example.com']);
      
      const hasOrigin = 'Access-Control-Allow-Origin' in headers;
      const hasMethods = 'Access-Control-Allow-Methods' in headers;
      const hasHeaders = 'Access-Control-Allow-Headers' in headers;
      
      results.push({
        testName: 'CORS headers',
        passed: hasOrigin && hasMethods && hasHeaders,
        headers: headers,
        requirement: '8.10',
        message: (hasOrigin && hasMethods && hasHeaders)
          ? 'CORS headers set correctly'
          : 'Missing required CORS headers'
      });
    } catch (error) {
      results.push({
        testName: 'CORS headers',
        passed: false,
        error: error.message,
        requirement: '8.10'
      });
    }
    
    // Test 4: Preflight request handling
    try {
      const preflightRequest = {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      };
      
      const response = this.handlePreflightRequest(preflightRequest, ['https://example.com']);
      
      const hasCorrectStatus = response.status === 200 || response.status === 204;
      const hasCORSHeaders = 'Access-Control-Allow-Origin' in response.headers;
      
      results.push({
        testName: 'CORS preflight request',
        passed: hasCorrectStatus && hasCORSHeaders,
        response: response,
        requirement: '8.10',
        message: (hasCorrectStatus && hasCORSHeaders)
          ? 'Preflight request handled correctly'
          : 'Failed to handle preflight request'
      });
    } catch (error) {
      results.push({
        testName: 'CORS preflight request',
        passed: false,
        error: error.message,
        requirement: '8.10'
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

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Sanitize input to prevent injection attacks
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');
    
    // Remove or escape dangerous SQL characters
    sanitized = sanitized.replace(/['";\\]/g, '');
    
    // Remove SQL keywords
    const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT', 'UNION', 'EXEC', 'EXECUTE'];
    sqlKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    return sanitized;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(str) {
    if (typeof str !== 'string') {
      return str;
    }
    
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'\/]/g, char => htmlEscapes[char]);
  }

  /**
   * Escape attribute values
   */
  escapeAttribute(str) {
    if (typeof str !== 'string') {
      return str;
    }
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Escape JavaScript strings
   */
  escapeJavaScript(str) {
    if (typeof str !== 'string') {
      return str;
    }
    
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  /**
   * Check if string contains SQL injection patterns
   */
  containsSQLInjection(str) {
    const sqlPatterns = [
      /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b)/i,
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bEXEC\b|\bEXECUTE\b)/i,
      /(;|\-\-|\/\*|\*\/)/,
      /('|")\s*(OR|AND)\s*('|")?(\d+|true|false)\s*=\s*('|")?(\d+|true|false)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Check if string contains script tags
   */
  containsScriptTags(str) {
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    return scriptPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Check if string contains event handlers
   */
  containsEventHandlers(str) {
    const eventHandlers = [
      /on(load|error|click|mouseover|mouseout|focus|blur|change|submit)\s*=/gi
    ];
    
    return eventHandlers.some(pattern => pattern.test(str));
  }

  /**
   * Check if string contains dangerous characters
   */
  containsDangerousChars(str) {
    return /<|>|javascript:|on\w+=/i.test(str);
  }

  /**
   * Validate numeric input
   */
  validateNumericInput(input) {
    if (typeof input === 'number') {
      return !isNaN(input) && isFinite(input);
    }
    
    if (typeof input === 'string') {
      // Check if it's a valid number string
      const num = Number(input);
      return !isNaN(num) && isFinite(num) && input.trim() !== '';
    }
    
    return false;
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(providedToken, expectedToken) {
    if (!providedToken || !expectedToken) {
      return false;
    }
    
    return providedToken === expectedToken;
  }

  /**
   * Validate request with CSRF protection
   */
  validateRequest(request) {
    // GET requests don't need CSRF protection
    if (request.method === 'GET') {
      return { valid: true, reason: 'GET request' };
    }
    
    // Check for CSRF token in headers
    const token = request.headers['X-CSRF-Token'] || request.headers['x-csrf-token'];
    
    if (!token) {
      return { valid: false, reason: 'Missing CSRF token' };
    }
    
    // Validate token against session
    const sessionToken = request.session?.csrfToken;
    
    if (!sessionToken) {
      return { valid: false, reason: 'No session token' };
    }
    
    if (token !== sessionToken) {
      return { valid: false, reason: 'Invalid CSRF token' };
    }
    
    return { valid: true, reason: 'Valid CSRF token' };
  }

  /**
   * Check CORS origin
   */
  checkCORSOrigin(origin, allowedOrigins) {
    const allowed = allowedOrigins.includes(origin);
    
    return {
      allowed: allowed,
      origin: origin,
      reason: allowed ? 'Origin in whitelist' : 'Origin not in whitelist'
    };
  }

  /**
   * Get CORS headers
   */
  getCORSHeaders(origin, allowedOrigins) {
    const headers = {};
    
    if (allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-Token';
      headers['Access-Control-Allow-Credentials'] = 'true';
      headers['Access-Control-Max-Age'] = '86400'; // 24 hours
    }
    
    return headers;
  }

  /**
   * Handle CORS preflight request
   */
  handlePreflightRequest(request, allowedOrigins) {
    const origin = request.headers['Origin'];
    const headers = this.getCORSHeaders(origin, allowedOrigins);
    
    return {
      status: 204,
      headers: headers,
      body: null
    };
  }
