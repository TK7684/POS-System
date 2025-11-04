# Troubleshooting Guide: Functional Testing Module

## Current Status
The functional testing module configuration has been fixed to properly receive the API URL from `ComprehensiveTestConfig.environment`. However, tests are still showing 0% pass rate.

## Changes Made

### 1. Fixed Module Instantiation
- **File**: `test/execute-comprehensive-tests.js` (Line 238)
- **Change**: Pass `this.config.environment` instead of `this.config`
- **Status**: ✅ Applied

### 2. Fixed HTML Test Runner
- **File**: `test-comprehensive.html`
- **Changes**: Updated 7 module instantiations to use `ComprehensiveTestConfig.environment`
- **Status**: ✅ Applied

### 3. Added Debug Logging
- **File**: `test/functional-testing-module.js`
- **Change**: Added console.log statements in constructor to debug config
- **Status**: ✅ Applied

## Debugging Steps

### Step 1: Verify Configuration Loading
Open `test/test-config-debug.html` in your browser to verify:
1. ComprehensiveTestConfig is loaded
2. environment.apiUrl is set correctly
3. Module can be instantiated
4. API calls can be made

### Step 2: Check Browser Console
When running tests in `test-comprehensive.html`, check the browser console for:
```
FunctionalTestingModule constructor received config: {...}
FunctionalTestingModule this.config.apiUrl: https://...
```

If you see an empty apiUrl, the config is not being passed correctly.

### Step 3: Verify API Endpoint
Test the API endpoint directly:
```
https://script.google.com/macros/s/AKfycbzGZwameaQOt-XPEG-PptzyJPzHtF2eUYiEl7crPmDu9Os_j0BrsFMCn5kdG2QTdePW/exec?action=getBootstrapData
```

This should return a JSON response with status: "success".

## Common Issues

### Issue 1: "API URL not configured"
**Cause**: Config not being passed to module constructor
**Solution**: Verify `ComprehensiveTestConfig.environment` is being passed, not `ComprehensiveTestConfig`

### Issue 2: "Module not defined"
**Cause**: Script not loaded or loading order issue
**Solution**: Check that all `<script>` tags are present and in correct order in test-comprehensive.html

### Issue 3: CORS Errors
**Cause**: Google Apps Script not allowing cross-origin requests
**Solution**: Ensure the Apps Script is deployed as a web app with "Anyone" access

### Issue 4: Network Timeout
**Cause**: API taking too long to respond
**Solution**: Increase timeout in config or check Apps Script performance

## Expected Test Flow

1. **Initialization**
   - Load ComprehensiveTestConfig
   - Load all test modules
   - Initialize ComprehensiveTestExecutor
   - Executor registers all modules

2. **Test Execution**
   - User clicks "Run All Tests"
   - Executor instantiates each module with `config.environment`
   - Module constructor sets `this.config.apiUrl`
   - Module runs tests using `makeApiCall()`

3. **API Call**
   - `makeApiCall()` checks if `this.config.apiUrl` exists
   - If exists, makes fetch request
   - Returns result or throws error

## Next Steps

1. **Open test-config-debug.html** to verify configuration
2. **Check browser console** for debug logs
3. **Test API endpoint** directly in browser
4. **Run tests again** and check for specific error messages
5. **Report findings** with console logs and error messages

## Configuration Reference

### Correct Structure
```javascript
// In test/comprehensive-test-config.js
const ComprehensiveTestConfig = {
  environment: {
    apiUrl: 'https://...',
    spreadsheetId: '...',
    timeout: 10000,
    retries: 3,
    testMode: true
  },
  // ... other config
};
```

### Module Constructor
```javascript
// In test/functional-testing-module.js
constructor(config = {}) {
  this.config = {
    apiUrl: config.apiUrl || '',  // Should get value from config.apiUrl
    timeout: config.timeout || 10000,
    retries: config.retries || 3,
    ...config
  };
}
```

### Instantiation
```javascript
// Correct ✅
const module = new FunctionalTestingModule(ComprehensiveTestConfig.environment);

// Incorrect ❌
const module = new FunctionalTestingModule(ComprehensiveTestConfig);
```

## Contact
If issues persist after following these steps, provide:
1. Browser console logs
2. Network tab showing API requests
3. Specific error messages
4. Results from test-config-debug.html
