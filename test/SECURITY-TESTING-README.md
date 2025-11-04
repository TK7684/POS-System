# Security Testing Module

## Overview

The Security Testing Module provides comprehensive security testing for the POS System, covering authentication, authorization, input validation, XSS prevention, CSRF protection, and CORS handling.

## Requirements Coverage

This module tests the following requirements from the specification:

- **Requirement 8.1**: User authentication verification
- **Requirement 8.2**: OWNER role access control
- **Requirement 8.3**: PARTNER role access control
- **Requirement 8.4**: STAFF role access control
- **Requirement 8.5**: Inactive user access denial
- **Requirement 8.6**: Input parameter sanitization
- **Requirement 8.7**: SQL injection prevention
- **Requirement 8.8**: XSS attack prevention
- **Requirement 8.9**: CSRF protection
- **Requirement 8.10**: CORS handling

## Features

### 1. Authentication Testing

Tests user authentication against the Users sheet:

- Valid user authentication for all roles (OWNER, PARTNER, STAFF)
- Invalid user rejection
- Empty credentials handling
- User credential verification

### 2. Authorization Testing

Tests role-based access control:

- **OWNER Role**: Full access to all features
  - Add Purchase/Sale
  - View Reports
  - Manage Users
  - View Bootstrap Data

- **PARTNER Role**: Limited access
  - Add Purchase/Sale
  - View Reports
  - View Bootstrap Data
  - Cannot manage users

- **STAFF Role**: Restricted access
  - Add Purchase/Sale
  - View Bootstrap Data
  - Cannot view reports or manage users

### 3. Inactive User Testing

Tests that inactive users are denied access:

- Inactive user authentication fails
- Inactive users cannot perform operations
- Active flag is properly checked

### 4. Input Validation Testing

Tests parameter sanitization and validation:

- SQL injection prevention
- Script injection prevention
- Special character escaping
- Numeric input validation
- Email format validation

### 5. XSS Prevention Testing

Tests cross-site scripting prevention:

- Basic script tag injection
- Image onerror attacks
- SVG script injection
- JavaScript protocol attacks
- Event handler injection
- Data URI attacks
- Style injection
- Meta refresh attacks
- Content escaping in different contexts

### 6. CSRF Protection Testing

Tests cross-site request forgery protection:

- CSRF token generation
- CSRF token validation
- Request validation with/without tokens
- Token uniqueness

### 7. CORS Handling Testing

Tests cross-origin resource sharing:

- Allowed origin validation
- Disallowed origin blocking
- CORS headers configuration
- Preflight request handling

## Usage

### Running Tests in Browser

1. Open `test-security-module.html` in a web browser
2. Click "Run All Tests" to execute all security tests
3. Or click individual test buttons to run specific test categories
4. View detailed results with pass/fail status

### Running Tests Programmatically

```javascript
// Initialize the module
const securityModule = new SecurityTestingModule({
  apiUrl: 'https://your-api-url.com',
  timeout: 10000
});

// Run all tests
const authResults = await securityModule.testAuthentication();
const authzResults = await securityModule.testAuthorization();
const inactiveResults = await securityModule.testInactiveUsers();
const inputResults = await securityModule.testInputValidation();
const xssResults = await securityModule.testXSSPrevention();
const csrfResults = await securityModule.testCSRFProtection();
const corsResults = await securityModule.testCORSHandling();

// Get comprehensive report
const report = securityModule.getSecurityReport();
console.log('Security Score:', report.securityScore);
```

## Test User Credentials

The module uses the following test users:

```javascript
{
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
}
```

## Security Test Categories

### Authentication Tests (5 tests)
- Valid OWNER authentication
- Valid PARTNER authentication
- Valid STAFF authentication
- Invalid user rejection
- Empty credentials rejection

### Authorization Tests (15 tests)
- Add Purchase: OWNER, PARTNER, STAFF
- Add Sale: OWNER, PARTNER, STAFF
- View Reports: OWNER, PARTNER (denied for STAFF)
- Manage Users: OWNER only
- View Bootstrap Data: OWNER, PARTNER, STAFF

### Inactive User Tests (5 tests)
- Inactive user authentication
- Inactive user operations (4 operations)

### Input Validation Tests (20+ tests)
- SQL injection prevention (5 payloads)
- Script injection prevention (5 payloads)
- Special character escaping (5 tests)
- Numeric validation (8 tests)
- Email validation (6 tests)

### XSS Prevention Tests (11+ tests)
- 8 XSS attack vectors
- 3 context-specific escaping tests

### CSRF Protection Tests (4 tests)
- Token generation
- Token validation
- Request without token
- Request with valid token

### CORS Handling Tests (7+ tests)
- Allowed origins (3 tests)
- Disallowed origins (3 tests)
- CORS headers
- Preflight request

## Expected Results

All tests should pass with the following criteria:

- ✅ Valid users are authenticated
- ✅ Invalid users are rejected
- ✅ Role-based permissions are enforced
- ✅ Inactive users are denied access
- ✅ Malicious input is sanitized
- ✅ XSS attacks are prevented
- ✅ CSRF tokens are validated
- ✅ CORS policies are enforced

## Security Score

The module calculates a security score based on:

- Test pass rate (0-100%)
- Critical vulnerabilities (-10 points each)

A score of 90% or higher indicates good security posture.

## Integration with Comprehensive Test Suite

This module integrates with the comprehensive testing framework:

```javascript
// In comprehensive-test-suite.js
const securityModule = new SecurityTestingModule(config);
const securityResults = {
  authentication: await securityModule.testAuthentication(),
  authorization: await securityModule.testAuthorization(),
  inactiveUsers: await securityModule.testInactiveUsers(),
  inputValidation: await securityModule.testInputValidation(),
  xssPrevention: await securityModule.testXSSPrevention(),
  csrfProtection: await securityModule.testCSRFProtection(),
  corsHandling: await securityModule.testCORSHandling()
};
```

## Troubleshooting

### Common Issues

1. **Authentication tests fail**
   - Verify Users sheet structure
   - Check user_key, role, and active columns
   - Ensure test users exist in the sheet

2. **Authorization tests fail**
   - Review role permission mappings
   - Verify operation access rules
   - Check role names match exactly

3. **Input validation tests fail**
   - Review sanitization functions
   - Check escaping logic
   - Verify regex patterns

4. **XSS tests fail**
   - Review HTML escaping
   - Check for unescaped output
   - Verify context-specific escaping

5. **CSRF tests fail**
   - Check token generation
   - Verify token validation logic
   - Ensure tokens are unique

6. **CORS tests fail**
   - Review allowed origins list
   - Check CORS headers
   - Verify preflight handling

## Best Practices

1. **Run security tests regularly**
   - Before each deployment
   - After security-related changes
   - As part of CI/CD pipeline

2. **Review failed tests immediately**
   - Security failures are critical
   - Fix vulnerabilities before deployment
   - Document security decisions

3. **Keep test data updated**
   - Update test users as needed
   - Add new attack vectors
   - Review security patterns

4. **Monitor security score**
   - Maintain 90%+ score
   - Investigate score drops
   - Track trends over time

## Files

- `security-testing-module.js` - Main testing module
- `test-security-module.html` - Browser-based test runner
- `SECURITY-TESTING-README.md` - This documentation

## Dependencies

- `test-config.js` - Test configuration
- `test-utilities.js` - Common test utilities

## Contributing

When adding new security tests:

1. Follow existing test patterns
2. Document requirement coverage
3. Add test to appropriate category
4. Update this README
5. Test thoroughly before committing

## License

Part of the POS System Comprehensive Testing Suite
