/**
 * Verification Script for Security Testing Module
 * Run this to verify the security testing module is working correctly
 */

// This script can be run in Node.js or browser console
(async function verifySecurityTesting() {
  console.log('🔒 Security Testing Module Verification\n');
  console.log('=' .repeat(60));
  
  // Check if module is loaded
  if (typeof SecurityTestingModule === 'undefined') {
    console.error('❌ SecurityTestingModule not found!');
    console.log('Please load security-testing-module.js first');
    return;
  }
  
  console.log('✅ SecurityTestingModule loaded successfully\n');
  
  // Initialize module
  const config = {
    apiUrl: 'https://example.com/api',
    timeout: 10000
  };
  
  const securityModule = new SecurityTestingModule(config);
  console.log('✅ Module initialized with config:', config, '\n');
  
  // Verify test users
  console.log('📋 Test Users:');
  Object.entries(securityModule.testUsers).forEach(([role, user]) => {
    console.log(`  - ${role.toUpperCase()}: ${user.user_key} (${user.role}, active: ${user.active})`);
  });
  console.log('');
  
  // Test authentication
  console.log('🔐 Testing Authentication...');
  try {
    const authResult = await securityModule.testAuthentication();
    console.log(`  Total: ${authResult.summary.total}`);
    console.log(`  Passed: ${authResult.summary.passed} ✅`);
    console.log(`  Failed: ${authResult.summary.failed} ${authResult.summary.failed > 0 ? '❌' : ''}`);
    console.log(`  Status: ${authResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  } catch (error) {
    console.error('  ❌ Error:', error.message, '\n');
  }
  
  // Test authorization
  console.log('🔑 Testing Authorization...');
  try {
    const authzResult = await securityModule.testAuthorization();
    console.log(`  Total: ${authzResult.summary.total}`);
    console.log(`  Passed: ${authzResult.summary.passed} ✅`);
    console.log(`  Failed: ${authzResult.summary.failed} ${authzResult.summary.failed > 0 ? '❌' : ''}`);
    console.log(`  Status: ${authzResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  } catch (error) {
    console.error('  ❌ Error:', error.message, '\n');
  }
  
  // Test inactive users
  console.log('🚫 Testing Inactive Users...');
  try {
    const inactiveResult = await securityModule.testInactiveUsers();
    console.log(`  Total: ${inactiveResult.summary.total}`);
    console.log(`  Passed: ${inactiveResult.summary.passed} ✅`);
    console.log(`  Failed: ${inactiveResult.summary.failed} ${inactiveResult.summary.failed > 0 ? '❌' : ''}`);
    console.log(`  Status: ${inactiveResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  } catch (error) {
    console.error('  ❌ Error:', error.message, '\n');
  }
  
  // Test input validation
  console.log('🛡️ Testing Input Validation...');
  try {
    const inputResult = await securityModule.testInputValidation();
    console.log(`  Total: ${inputResult.summary.total}`);
    console.log(`  Passed: ${inputResult.summary.passed} ✅`);
    console.log(`  Failed: ${inputResult.summary.failed} ${inputResult.summary.failed > 0 ? '❌' : ''}`);
    console.log(`  Status: ${inputResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  } catch (error) {
    console.error('  ❌ Error:', error.message, '\n');
  }
  
  // Test XSS prevention
  console.log('🔒 Testing XSS Prevention...');
  try {
    const xssResult = await securityModule.testXSSPrevention();
    console.log(`  Total: ${xssResult.summary.total}`);
    console.log(`  Passed: ${xssResult.summary.passed} ✅`);
    console.log(`  Failed: ${xssResult.summary.failed} ${xssResult.summary.failed > 0 ? '❌' : ''}`);
    console.log(`  Status: ${xssResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  } catch (error) {
    console.error('  ❌ Error:', error.message, '\n');
  }
  
  // Test CSRF protection
  console.log('🛡️ Testing CSRF Protection...');
  try {
    const csrfResult = await securityModule.testCSRFProtection();
    console.log(`  Total: ${csrfResult.summary.total}`);
    console.log(`  Passed: ${csrfResult.summary.passed} ✅`);
    console.log(`  Failed: ${csrfResult.summary.failed} ${csrfResult.summary.failed > 0 ? '❌' : ''}`);
    console.log(`  Status: ${csrfResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  } catch (error) {
    console.error('  ❌ Error:', error.message, '\n');
  }
  
  // Test CORS handling
  console.log('🌐 Testing CORS Handling...');
  try {
    const corsResult = await securityModule.testCORSHandling();
    console.log(`  Total: ${corsResult.summary.total}`);
    console.log(`  Passed: ${corsResult.summary.passed} ✅`);
    console.log(`  Failed: ${corsResult.summary.failed} ${corsResult.summary.failed > 0 ? '❌' : ''}`);
    console.log(`  Status: ${corsResult.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  } catch (error) {
    console.error('  ❌ Error:', error.message, '\n');
  }
  
  // Get security report
  console.log('📊 Security Report:');
  const report = securityModule.getSecurityReport();
  console.log(`  Security Score: ${report.securityScore.toFixed(2)}%`);
  console.log(`  Total Tests: ${report.totalTests}`);
  console.log(`  Passed: ${report.passed}`);
  console.log(`  Failed: ${report.failed}`);
  console.log(`  Warnings: ${report.warnings}`);
  console.log(`  Overall Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Test helper methods
  console.log('🔧 Testing Helper Methods:');
  
  // Test sanitizeInput
  const maliciousInput = "'; DROP TABLE Users; --";
  const sanitized = securityModule.sanitizeInput(maliciousInput);
  console.log(`  sanitizeInput: ${sanitized.length < maliciousInput.length ? '✅' : '❌'}`);
  
  // Test escapeHTML
  const xssInput = '<script>alert("XSS")</script>';
  const escaped = securityModule.escapeHTML(xssInput);
  console.log(`  escapeHTML: ${!escaped.includes('<script>') ? '✅' : '❌'}`);
  
  // Test validateNumericInput
  const validNum = securityModule.validateNumericInput('123');
  const invalidNum = securityModule.validateNumericInput('abc');
  console.log(`  validateNumericInput: ${validNum && !invalidNum ? '✅' : '❌'}`);
  
  // Test validateEmail
  const validEmail = securityModule.validateEmail('test@example.com');
  const invalidEmail = securityModule.validateEmail('invalid@');
  console.log(`  validateEmail: ${validEmail && !invalidEmail ? '✅' : '❌'}`);
  
  // Test generateCSRFToken
  const token1 = securityModule.generateCSRFToken();
  const token2 = securityModule.generateCSRFToken();
  console.log(`  generateCSRFToken: ${token1 !== token2 && token1.length >= 32 ? '✅' : '❌'}`);
  
  // Test validateCSRFToken
  const tokenValid = securityModule.validateCSRFToken(token1, token1);
  const tokenInvalid = securityModule.validateCSRFToken('invalid', token1);
  console.log(`  validateCSRFToken: ${tokenValid && !tokenInvalid ? '✅' : '❌'}`);
  
  console.log('');
  console.log('=' .repeat(60));
  console.log('✅ Security Testing Module Verification Complete!');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Open test/test-security-module.html in browser');
  console.log('2. Click "Run All Tests" to see visual results');
  console.log('3. Review SECURITY-TESTING-README.md for documentation');
  console.log('4. Integrate with comprehensive test suite');
  
})();

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { verifySecurityTesting };
}
