# Test Configuration Guide

## Overview

This guide explains how to configure the comprehensive test suite for your environment. The configuration file `comprehensive-test-config.js` contains all settings needed to customize test execution, thresholds, and reporting.

## Configuration File Location

```
test/comprehensive-test-config.js
```

## Configuration Structure

### 1. Environment Settings

Configure your test environment connection details:

```javascript
environment: {
  apiUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  spreadsheetId: 'YOUR_SPREADSHEET_ID',
  timeout: 10000,        // Request timeout in milliseconds
  retries: 3,            // Number of retry attempts for failed requests
  testMode: true         // Enable test mode (prevents production data modification)
}
```

**How to configure:**

1. **API URL**: 
   - Deploy your Apps Script as a web app
   - Copy the deployment URL
   - Replace `YOUR_SCRIPT_ID` with your actual script ID
   - Example: `https://script.google.com/macros/s/AKfycbx.../exec`

2. **Spreadsheet ID**:
   - Open your Google Spreadsheet
   - Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Replace `YOUR_SPREADSHEET_ID` with your actual spreadsheet ID

3. **Timeout**:
   - Default: 10000ms (10 seconds)
   - Increase if you have slow network or large datasets
   - Decrease for faster failure detection

4. **Retries**:
   - Default: 3 attempts
   - Increase for unreliable networks
   - Set to 0 to disable retries

5. **Test Mode**:
   - `true`: Safe mode, uses test data
   - `false`: Production mode (use with caution)

### 2. Test Categories

Enable or disable specific test categories:

```javascript
testCategories: {
  sheetVerification: true,    // Sheet structure validation
  apiTesting: true,           // API endpoint testing
  functionalTesting: true,    // Business flow testing
  dataIntegrity: true,        // Data consistency checks
  performance: true,          // Performance benchmarks
  crossBrowser: true,         // Browser compatibility
  pwa: true,                  // PWA and offline testing
  security: true,             // Security auditing
  errorHandling: true,        // Error recovery testing
  reporting: true             // Report accuracy testing
}
```

**When to disable categories:**

- **Development**: Disable slow tests (performance, crossBrowser) for faster feedback
- **CI/CD**: Enable all tests for comprehensive validation
- **Quick checks**: Enable only relevant categories (e.g., just apiTesting)
- **Debugging**: Disable all except the category you're investigating

**Example configurations:**

```javascript
// Quick API check
testCategories: {
  apiTesting: true,
  // All others: false
}

// Core functionality only
testCategories: {
  sheetVerification: true,
  apiTesting: true,
  functionalTesting: true,
  dataIntegrity: true,
  // Others: false
}

// Full comprehensive test
testCategories: {
  // All: true
}
```

### 3. Performance Thresholds

Set performance expectations for your system:

```javascript
thresholds: {
  performance: {
    cacheOperation: 10,        // ms - Cache operations
    apiResponse: 2000,         // ms - API response time
    sheetRead: 100,            // ms - Sheet read operations
    reportGeneration: 1000,    // ms - 30-day report generation
    offlineLoad: 500,          // ms - Cached data loading
    pwaInstall: 3000,          // ms - PWA installation time
    searchResponse: 300        // ms - Search results
  },
  coverage: 90,                // % - Minimum test coverage
  successRate: 95,             // % - Minimum test success rate
  dataIntegrity: 100           // % - Data integrity (must be 100%)
}
```

**Adjusting thresholds:**

- **Slower systems**: Increase time thresholds by 50-100%
- **Faster systems**: Decrease thresholds for stricter validation
- **Production**: Use realistic thresholds based on actual usage
- **Development**: Use relaxed thresholds for faster iteration

**Example adjustments:**

```javascript
// For slower network/system
thresholds: {
  performance: {
    cacheOperation: 20,        // Doubled
    apiResponse: 3000,         // Increased by 50%
    sheetRead: 200,            // Doubled
    reportGeneration: 2000,    // Doubled
    offlineLoad: 1000,         // Doubled
    pwaInstall: 5000,          // Increased
    searchResponse: 500        // Increased
  }
}

// For high-performance requirements
thresholds: {
  performance: {
    cacheOperation: 5,         // Stricter
    apiResponse: 1000,         // Stricter
    sheetRead: 50,             // Stricter
    reportGeneration: 500,     // Stricter
    offlineLoad: 250,          // Stricter
    pwaInstall: 2000,          // Stricter
    searchResponse: 150        // Stricter
  }
}
```

### 4. Reporting Configuration

Configure how test reports are generated and saved:

```javascript
reporting: {
  formats: ['html', 'json', 'csv'],     // Report formats to generate
  destination: 'test/reports',           // Where to save reports
  includeScreenshots: true,              // Capture screenshots on failures
  includeRequirementTraceability: true,  // Map tests to requirements
  saveHistory: true,                     // Keep historical test results
  maxHistoryEntries: 50                  // Maximum history entries to keep
}
```

**Configuration options:**

1. **Formats**:
   - `html`: Human-readable report with visualizations
   - `json`: Machine-readable for automation
   - `csv`: Spreadsheet-compatible for analysis
   - Can enable/disable any combination

2. **Destination**:
   - Relative path from project root
   - Ensure directory exists or will be created
   - Use different paths for different environments

3. **Screenshots**:
   - `true`: Capture on failures (larger reports)
   - `false`: No screenshots (smaller, faster)

4. **Requirement Traceability**:
   - `true`: Show which requirements each test covers
   - `false`: Simpler reports without traceability

5. **History**:
   - `saveHistory: true`: Keep past results for trend analysis
   - `maxHistoryEntries`: Limit storage (older entries deleted)

### 5. Sheet Structure Configuration

Define expected sheet structure for validation:

```javascript
sheets: {
  required: [
    'Ingredients', 'Menus', 'MenuRecipes', 'Purchases', 'Sales',
    'Users', 'CostCenters', 'Packaging', 'Lots', 'Platforms',
    'Stocks', 'LaborLogs', 'Waste', 'MarketRuns', 'MarketRunItems',
    'Packing', 'PackingPurchases', 'Overheads', 'MenuExtras',
    'BatchCostLines', 'Batches'
  ],
  columnMappings: {
    Ingredients: ['id', 'name', 'stock_unit', 'unit_buy', 'buy_to_stock_ratio', 'min_stock'],
    Menus: ['menu_id', 'name', 'description', 'category', 'active'],
    // ... more mappings
  }
}
```

**When to modify:**

- Adding new sheets to your system
- Changing column names
- Adding required columns
- Removing deprecated sheets

**How to update:**

1. Add new sheet name to `required` array
2. Add column mapping for new sheet in `columnMappings`
3. Ensure column names match exactly (case-sensitive)
4. Run sheet verification tests to validate

### 6. API Endpoints Configuration

Define API endpoints to test:

```javascript
apiEndpoints: [
  {
    action: 'getBootstrapData',
    params: {},
    expectedFields: ['ingredientsMap', 'timestamp', 'version'],
    timeout: 5000
  },
  {
    action: 'searchIngredients',
    params: { query: 'test', limit: 10 },
    expectedFields: ['results', 'count'],
    timeout: 2000
  },
  // ... more endpoints
]
```

**Configuration fields:**

- `action`: API action name (must match backend)
- `params`: Test parameters to send
- `expectedFields`: Fields that must be in response
- `timeout`: Specific timeout for this endpoint

**Adding new endpoints:**

```javascript
{
  action: 'yourNewAction',
  params: { 
    requiredParam: 'value',
    optionalParam: 'value'
  },
  expectedFields: ['field1', 'field2', 'field3'],
  timeout: 3000
}
```

### 7. Browser Matrix Configuration

Define browsers and devices to test:

```javascript
browsers: [
  { name: 'Chrome', version: 'latest', platform: 'desktop' },
  { name: 'Firefox', version: 'latest', platform: 'desktop' },
  { name: 'Safari', version: 'latest', platform: 'desktop' },
  { name: 'Edge', version: 'latest', platform: 'desktop' },
  { name: 'Chrome', version: 'latest', platform: 'mobile', device: 'Android' },
  { name: 'Safari', version: 'latest', platform: 'mobile', device: 'iOS' }
]
```

**Customizing browser tests:**

- Add specific browser versions: `version: '90.0'`
- Remove browsers you don't support
- Add more mobile devices
- Specify OS versions

### 8. Device Profiles Configuration

Define device emulation profiles:

```javascript
devices: [
  {
    name: 'Mobile Low-end',
    viewport: { width: 360, height: 640 },
    userAgent: 'Mozilla/5.0 (Linux; Android 8.0; SM-G960F) AppleWebKit/537.36',
    connection: '3g'
  },
  {
    name: 'Desktop',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    connection: 'wifi'
  }
]
```

**Adding custom devices:**

```javascript
{
  name: 'Your Device Name',
  viewport: { 
    width: 1024,    // Screen width in pixels
    height: 768     // Screen height in pixels
  },
  userAgent: 'Your User Agent String',
  connection: 'wifi' | '4g' | '3g' | '2g'
}
```

### 9. Security Configuration

Configure security test scenarios:

```javascript
security: {
  roles: ['OWNER', 'PARTNER', 'STAFF'],
  testUsers: [
    { user_key: 'owner@test.com', role: 'OWNER', active: true },
    { user_key: 'partner@test.com', role: 'PARTNER', active: true },
    { user_key: 'staff@test.com', role: 'STAFF', active: true },
    { user_key: 'inactive@test.com', role: 'STAFF', active: false }
  ],
  xssPayloads: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    // ... more payloads
  ],
  sqlInjectionPayloads: [
    "' OR '1'='1",
    "'; DROP TABLE Users--",
    // ... more payloads
  ]
}
```

**Important notes:**

- Test users must exist in your Users sheet
- XSS payloads test input sanitization
- SQL injection payloads test parameter validation
- Add more payloads based on your security requirements

### 10. Error Scenarios Configuration

Define error scenarios to test:

```javascript
errorScenarios: [
  { 
    type: 'network', 
    scenario: 'timeout', 
    expectedBehavior: 'retry with backoff' 
  },
  { 
    type: 'validation', 
    scenario: 'missing_field', 
    expectedBehavior: 'highlight field' 
  },
  // ... more scenarios
]
```

**Adding custom scenarios:**

```javascript
{
  type: 'your_error_type',
  scenario: 'specific_scenario',
  expectedBehavior: 'what_should_happen'
}
```

## Environment-Specific Configurations

### Development Environment

```javascript
// dev-config.js
const config = {
  environment: {
    apiUrl: 'http://localhost:8080/dev',
    spreadsheetId: 'DEV_SPREADSHEET_ID',
    timeout: 15000,  // Longer timeout for debugging
    retries: 1,      // Fewer retries for faster feedback
    testMode: true
  },
  testCategories: {
    sheetVerification: true,
    apiTesting: true,
    functionalTesting: true,
    dataIntegrity: true,
    performance: false,      // Skip slow tests
    crossBrowser: false,     // Skip browser tests
    pwa: false,
    security: true,
    errorHandling: true,
    reporting: false         // Skip reporting tests
  },
  reporting: {
    formats: ['json'],       // Only JSON for quick review
    includeScreenshots: false,
    saveHistory: false
  }
};
```

### Staging Environment

```javascript
// staging-config.js
const config = {
  environment: {
    apiUrl: 'https://script.google.com/macros/s/STAGING_SCRIPT_ID/exec',
    spreadsheetId: 'STAGING_SPREADSHEET_ID',
    timeout: 10000,
    retries: 3,
    testMode: true
  },
  testCategories: {
    // All enabled
  },
  thresholds: {
    performance: {
      // Realistic thresholds
    },
    successRate: 95
  },
  reporting: {
    formats: ['html', 'json'],
    includeScreenshots: true,
    saveHistory: true,
    maxHistoryEntries: 100
  }
};
```

### Production Monitoring

```javascript
// production-config.js
const config = {
  environment: {
    apiUrl: 'https://script.google.com/macros/s/PROD_SCRIPT_ID/exec',
    spreadsheetId: 'PROD_SPREADSHEET_ID',
    timeout: 5000,   // Strict timeout
    retries: 2,
    testMode: false  // Use with caution!
  },
  testCategories: {
    sheetVerification: true,
    apiTesting: true,
    functionalTesting: false,  // Don't modify production data
    dataIntegrity: true,
    performance: true,
    crossBrowser: false,
    pwa: true,
    security: true,
    errorHandling: false,
    reporting: true
  },
  thresholds: {
    performance: {
      // Strict production thresholds
    },
    successRate: 98  // Higher bar for production
  }
};
```

## Loading Custom Configurations

### Method 1: Modify the Config File

Edit `test/comprehensive-test-config.js` directly:

```javascript
const ComprehensiveTestConfig = {
  environment: {
    apiUrl: 'YOUR_API_URL',
    // ... your settings
  }
};
```

### Method 2: Override at Runtime

In browser console or test script:

```javascript
// Load default config
const config = ComprehensiveTestConfig;

// Override specific settings
config.environment.apiUrl = 'https://your-custom-url.com';
config.testCategories.performance = false;

// Run tests with custom config
const suite = new ComprehensiveTestSuite(config);
await suite.runAllTests();
```

### Method 3: Environment Variables (Node.js)

```javascript
const config = {
  environment: {
    apiUrl: process.env.API_URL || 'default-url',
    spreadsheetId: process.env.SPREADSHEET_ID || 'default-id',
    timeout: parseInt(process.env.TIMEOUT) || 10000
  }
};
```

Then run with:

```bash
API_URL=https://your-url.com SPREADSHEET_ID=your-id node test/run-tests.js
```

## Validation

### Validating Your Configuration

Before running tests, validate your configuration:

```javascript
function validateConfig(config) {
  const errors = [];
  
  // Check required fields
  if (!config.environment.apiUrl || config.environment.apiUrl.includes('YOUR_SCRIPT_ID')) {
    errors.push('API URL not configured');
  }
  
  if (!config.environment.spreadsheetId || config.environment.spreadsheetId.includes('YOUR_SPREADSHEET_ID')) {
    errors.push('Spreadsheet ID not configured');
  }
  
  // Check at least one test category is enabled
  const enabled = Object.values(config.testCategories).some(v => v === true);
  if (!enabled) {
    errors.push('No test categories enabled');
  }
  
  // Check thresholds are positive numbers
  for (const [key, value] of Object.entries(config.thresholds.performance)) {
    if (typeof value !== 'number' || value <= 0) {
      errors.push(`Invalid threshold for ${key}: ${value}`);
    }
  }
  
  return errors;
}

// Use it
const errors = validateConfig(ComprehensiveTestConfig);
if (errors.length > 0) {
  console.error('Configuration errors:', errors);
} else {
  console.log('Configuration is valid');
}
```

## Best Practices

### 1. Use Environment-Specific Configs

Don't use the same configuration for all environments. Create separate configs for:
- Local development
- CI/CD pipelines
- Staging environment
- Production monitoring

### 2. Version Control

- Commit the template config file
- Use `.gitignore` for environment-specific configs with secrets
- Document required configuration changes in README

### 3. Security

- Never commit API keys or credentials
- Use environment variables for sensitive data
- Restrict test user permissions
- Use test mode in non-production environments

### 4. Performance

- Disable unnecessary test categories for faster feedback
- Adjust timeouts based on your network
- Use parallel execution where possible
- Cache test data when appropriate

### 5. Maintenance

- Review and update thresholds regularly
- Add new endpoints as they're developed
- Remove deprecated tests
- Keep requirement mappings up to date

## Next Steps

1. Copy `comprehensive-test-config.js` to create environment-specific configs
2. Update API URL and Spreadsheet ID for your environment
3. Adjust thresholds based on your performance requirements
4. Enable/disable test categories based on your needs
5. Run tests and iterate on configuration
6. Document any custom configurations for your team

For troubleshooting configuration issues, see `TEST_TROUBLESHOOTING.md`.
