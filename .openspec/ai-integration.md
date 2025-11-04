# AI Integration Specification

## Overview
This specification defines the AI integration requirements for the POS system, enabling natural language processing for purchase, expense, menu, and stock management operations in Thai language.

## Purpose
To enable users to interact with the POS system using natural Thai language commands, reducing manual data entry and improving operational efficiency through intelligent automation.

## Scope

### Functional Requirements

#### 1. Natural Language Processing (NLP)
- **Thai Language Support**: Process commands in Thai language with proper UTF-8 encoding
- **Command Recognition**: Identify and categorize user intents:
  - Purchase commands: "ซื้อ", "จ่าย"
  - Expense commands: "ค่า", "จ่าย" 
  - Menu commands: "ต้นทุน", "เมนู"
  - Stock commands: "สต๊อก", "เหลือ"
  - Help commands: "ช่วย", "วิธีใช้"

#### 2. Data Extraction
- **Parameter Parsing**: Extract key parameters from natural language:
  - Purchase: ingredient name, quantity, unit, price
  - Expense: description, amount, category
  - Menu: menu name, cost calculation requests
  - Stock: ingredient names for inventory checks

#### 3. Smart Features
- **Fuzzy Matching**: Handle misspellings and variations in ingredient/menu names
- **Duplicate Prevention**: Detect and prevent duplicate entries within 24-hour window
- **Auto-Categorization**: Automatically categorize expenses based on description
- **Unit Normalization**: Convert various Thai units to standard forms
- **Price Suggestions**: Suggest pricing when historical data available

#### 4. Error Handling
- **Graceful Failures**: Provide helpful error messages in Thai
- **Input Validation**: Validate all extracted parameters
- **Fallback Options**: Suggest alternatives when exact matches not found
- **Permission Management**: Handle sheet access permissions gracefully

#### 5. Integration Points
- **Google Sheets Integration**: Read/write data to existing POS sheets
- **Real-time Updates**: Update UI with processing status
- **Audit Trail**: Log all AI operations with timestamps
- **Performance Monitoring**: Track response times and success rates

### Technical Requirements

#### 1. Google Apps Script Functions
```javascript
// Core AI processing function
function processAIMessage(params) {
  // Main entry point for AI command processing
}

// Command-specific handlers
function _processPurchaseCommand(message) { }
function _processExpenseCommand(message) { }
function _processMenuCommand(message) { }
function _processStockCommand(message) { }
function _getHelpResponse() { }

// Enhanced utility functions
function addPurchaseFromAI(params) { }
function addExpenseFromAI(params) { }
function _calculateMenuCost(params) { }
function _getStockLevels(params) { }
```

#### 2. Regular Expression Patterns
```javascript
// Thai natural language patterns
const PURCHASE_PATTERN = /(?:ซื้อ|จ่าย)\s+([^\d]+?)\s+(\d+\.?\d*)\s*(?:กิโลกรัม|กิโล|kg|กรัม|g|ลิตร|l|มิลลิลิตร|ml|ชิ้น|แพ็ค|กล่อง|ขวด|ถุง|กระป๋อง|โหล|ปอนด์|ออนซ์)?\s*(\d+\.?\d*)?\s*(?:บาท|ราคา)/i;

const EXPENSE_PATTERN = /(?:ค่า|จ่าย|บันทึกค่าใช้จ่าย)\s+([^\d]+?)\s+(\d+\.?\d*)\s*(?:บาท)?/i;

const MENU_PATTERN = /(?:เมนู|ต้นทุน|สูตร|คำนวน)\s+([^\d]+)/i;

const STOCK_PATTERN = /(?:สต๊อก|เหลือ|คงเหลือ|ตรวจสอบ)\s+([^\d]+)/i;

const HELP_PATTERN = /(?:ช่วย|วิธี|help|วิธีใช้)/i;
```

#### 3. Permission System
```javascript
// Enhanced role-based access
const ROLE_PERMISSIONS = {
  OWNER: ['VIEW', 'BUY', 'SELL', 'PRICE', 'REPORT', 'EXPORT'],
  AI_AGENT: ['VIEW', 'BUY', 'SELL', 'PRICE', 'REPORT'], // Special AI permissions
  PARTNER: ['VIEW', 'SELL', 'REPORT'],
  STAFF: ['VIEW', 'SELL'],
  VIEWER: ['VIEW']
};

function assertPermission(userKey, action) {
  // Special handling for AI_AGENT user
  if (userKey === 'AI_AGENT') {
    return { role: 'OWNER' };
  }
  // Regular permission checking
}
```

#### 4. Caching Strategy
```javascript
// In-memory cache for frequently accessed data
const AI_CACHE = {
  ingredientMap: null,
  menuMap: null,
  lastAccess: 0,
  ttl: 300000 // 5 minutes
};

function _getAICache(key) { }
function _setAICache(key, data) { }
function _clearAICache() { }
```

#### 5. Error Recovery
```javascript
// Timeout protection
function _processWithTimeout(func, timeoutMs) {
  const startTime = Date.now();
  const result = func();
  if (Date.now() - startTime > timeoutMs) {
    throw new Error('TIMEOUT: Function execution exceeded timeout');
  }
  return result;
}

// Retry logic for transient failures
function _retryOperation(operation, maxRetries = 3) { }
```

### Performance Requirements

#### 1. Response Time Targets
- **AI Command Processing**: < 2 seconds for simple commands
- **Data Lookup Operations**: < 1 second with cache
- **Sheet Write Operations**: < 3 seconds including validation
- **Error Recovery**: < 1 second for timeout handling

#### 2. Success Rate Targets
- **Command Recognition**: > 95% success rate
- **Data Extraction**: > 90% accuracy for structured commands
- **Parameter Validation**: 100% validation coverage
- **Error Handling**: 100% graceful failure handling

#### 3. Scalability
- **Concurrent Users**: Support multiple AI users simultaneously
- **Data Volume**: Handle up to 1000 ingredient/menu entries
- **Cache Efficiency**: Reduce sheet API calls by 80%
- **Memory Usage**: < 10MB for in-memory operations

### Security Requirements

#### 1. Input Validation
```javascript
// SQL injection prevention
function _sanitizeInput(input) {
  return String(input)
    .replace(/['"\\]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)<\/script>/gi, '');
}

// Parameter validation
function _validateAIParams(params, required) {
  const missing = required.filter(param => !params[param]);
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}
```

#### 2. Permission Management
```javascript
// Sheet access validation
function _validateSheetAccess(sheetName, action) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    // Test read/write permissions
    const testRange = sheet.getRange(1, 1);
    testRange.getValue();
    return true;
  } catch (error) {
    throw new Error(`Permission denied for ${action} on "${sheetName}": ${error.message}`);
  }
}
```

#### 3. Data Privacy
- **Local Processing**: All NLP processing done server-side
- **No External APIs**: No data sent to external AI services
- **User Consent**: Clear notification of AI data usage
- **Audit Trail**: Complete logging of all AI operations

### Integration Requirements

#### 1. Frontend Integration
```javascript
// AI Status Indicator
function updateAIStatus(message, type = 'active') {
  const indicator = document.getElementById('ai-status-indicator');
  if (indicator) {
    indicator.textContent = `AI: ${message}`;
    indicator.className = `ai-status-indicator ${type}`;
    indicator.classList.add('active');
  }
}

// AI Command Sending
function sendAICommand(command) {
  updateAIStatus('กำลังประมวลผล...', 'active');
  
  google.script.run
    .withSuccessHandler(response => {
      updateAIStatus('เสร็จ', 'success');
      handleAIResponse(response);
    })
    .withFailureHandler(error => {
      updateAIStatus('เกิดข้อผิดพลาด', 'error');
      handleAIError(error);
    })
    .processAIMessage({
      message: command,
      userKey: 'WEB_USER',
      timestamp: new Date().toISOString()
    });
}
```

#### 2. Mobile Optimization
```css
/* Touch-friendly AI interface */
.ai-status-indicator {
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(15, 118, 110, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  z-index: 10001;
  display: none;
}

.ai-status-indicator.active {
  display: block;
}

.ai-status-indicator.error {
  background: rgba(239, 68, 68, 0.9);
}

.ai-status-indicator.success {
  background: rgba(34, 197, 94, 0.9);
}

.ai-quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.ai-quick-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 999px;
  background: #f5f7fb;
  border: 1px solid #e6e9f0;
  color: #111;
  cursor: pointer;
}

.ai-quick-btn:hover {
  filter: brightness(0.98);
}
```

### Testing Requirements

#### 1. Unit Tests
```javascript
// Core functionality tests
function testAICommandParsing() { }
function testParameterExtraction() { }
function testPermissionHandling() { }
function testErrorRecovery() { }
function testDuplicateDetection() { }

// Thai language specific tests
function testThaiLanguageProcessing() { }
function testThaiCharacterEncoding() { }
function testThaiCommandVariations() { }
```

#### 2. Integration Tests
```javascript
// End-to-end workflow tests
function testPurchaseWorkflow() { }
function testExpenseWorkflow() { }
function testMenuAnalysisWorkflow() { }
function testStockCheckWorkflow() { }

// Performance tests
function testAIResponseTimes() { }
function testConcurrentUsers() { }
function testLargeDatasetHandling() { }
```

#### 3. User Acceptance Tests
```javascript
// Thai language command recognition
function testThaiNaturalLanguageCommands() {
  const commands = [
    'ซื้อกุ้ง 5 กิโลกรัม 500 บาท',
    'ค่าไฟฟ้า 1200 บาท',
    'ต้นทุนเมนูกุ้งแช่น้ำปลา',
    'สต๊อกพริกเหลือเท่าไหร่',
    'ช่วย'
  ];
  
  for (const command of commands) {
    const result = processAIMessage({ message: command });
    assert(result.success, `Failed: ${command}`);
  }
}

// Mobile interface tests
function testMobileTouchInteractions() { }
function testResponsiveLayout() { }
function testThaiCharacterDisplay() { }
```

### Deployment Requirements

#### 1. Environment Configuration
```javascript
// Development environment
const AI_CONFIG = {
  development: {
    debugMode: true,
    timeoutMs: 30000,
    cacheEnabled: true,
    loggingLevel: 'verbose'
  },
  production: {
    debugMode: false,
    timeoutMs: 5000,
    cacheEnabled: true,
    loggingLevel: 'error'
  },
  staging: {
    debugMode: true,
    timeoutMs: 10000,
    cacheEnabled: true,
    loggingLevel: 'info'
  }
};
```

#### 2. Rollback Plan
```javascript
// Version management
function rollbackAIVersion(targetVersion) {
  // Restore previous working version
  // Clear all caches
  // Reset configuration
  // Notify users of rollback
}

// Deployment validation
function validateAIDeployment() {
  // Test core AI functions
  // Verify sheet permissions
  // Validate Thai language processing
  // Check mobile responsiveness
}
```

#### 3. Monitoring Setup
```javascript
// Performance metrics
function getAIMetrics() {
  return {
    commandSuccessRate: calculateSuccessRate(),
    averageResponseTime: calculateAverageResponseTime(),
    errorRate: calculateErrorRate(),
    userSatisfaction: calculateUserSatisfaction()
  };
}

// Health checks
function performAIHealthCheck() {
  // Verify all required sheets exist
  // Test regex patterns work
  // Check permissions are valid
  // Validate cache performance
}
```

## Acceptance Criteria

### Functional Acceptance
- [ ] AI correctly identifies Thai purchase commands with 95% accuracy
- [ ] AI correctly identifies Thai expense commands with 95% accuracy
- [ ] AI correctly identifies menu analysis commands with 90% accuracy
- [ ] AI correctly identifies stock check commands with 95% accuracy
- [ ] Duplicate prevention works for all data types within 24-hour window
- [ ] Auto-categorization correctly categorizes 80% of expenses
- [ ] Fuzzy matching provides relevant suggestions for unknown items
- [ ] Error messages are helpful and in Thai language
- [ ] Response times under 2 seconds for 90% of commands

### Technical Acceptance
- [ ] All regex patterns match test cases
- [ ] Permission system handles AI_AGENT correctly
- [ ] Caching reduces sheet API calls by 70%
- [ ] No memory leaks or performance degradation
- [ ] Thai character encoding works correctly
- [ ] Mobile interface is fully responsive
- [ ] Error recovery mechanisms work reliably

### User Acceptance
- [ ] Restaurant staff can use Thai commands without training
- [ ] AI responses are natural and helpful
- [ ] Interface works on mobile phones and tablets
- [ ] Error messages guide users to correct commands
- [ ] System feels responsive and not sluggish
- [ ] Data integrity is maintained with AI operations
- [ ] Staff find the system easier than manual entry

### Security Acceptance
- [ ] All inputs are sanitized and validated
- [ ] No SQL injection vulnerabilities
- [ ] Permission system prevents unauthorized access
- [ ] Audit trail is maintained for all AI operations
- [ ] Data privacy is protected
- [ ] No external API dependencies that could leak data

## Implementation Notes

### Development Phases
1. **Phase 1**: Core regex patterns and command recognition
2. **Phase 2**: Data extraction and validation
3. **Phase 3**: Integration with existing POS functions
4. **Phase 4**: Enhanced features (duplicate prevention, auto-categorization)
5. **Phase 5**: Mobile optimization and UI improvements
6. **Phase 6**: Testing and deployment

### Critical Success Factors
- **Thai Language Expertise**: Deep understanding of Thai grammar patterns
- **Regex Performance**: Optimized patterns for fast matching
- **Error Handling**: Comprehensive coverage for edge cases
- **Mobile Optimization**: Touch-first design principles
- **Performance Monitoring**: Real-time metrics and alerts
- **User Feedback**: Continuous improvement based on usage patterns

This specification provides the foundation for implementing robust AI integration that handles Thai natural language processing while maintaining data integrity and user experience standards.