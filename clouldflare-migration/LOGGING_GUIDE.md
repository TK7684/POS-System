# 📊 Comprehensive Logging System Guide

## Overview

The POS system now includes a comprehensive logging system for easy debugging and optimization. All major functions are logged with detailed performance metrics.

## Features

✅ **Performance Tracking** - Automatic timing for all operations  
✅ **Categorized Logging** - Easy filtering by category (AUTH, DATABASE, AI, etc.)  
✅ **Request Tracking** - Unique IDs for tracing requests through the system  
✅ **Error Tracking** - Detailed error logs with stack traces  
✅ **Memory Management** - Keeps last 1000 logs in memory  
✅ **Export Functionality** - Export logs as JSON for analysis  

## Log Categories

| Category | Icon | Description |
|----------|------|-------------|
| `AUTH` | 🔐 | Authentication and authorization events |
| `DATABASE` | 💾 | All database operations (CRUD) |
| `API` | 🌐 | External API calls |
| `UI` | 🎨 | User interface interactions |
| `PAYMENT` | 💰 | Payment processing |
| `INVENTORY` | 📦 | Stock and inventory management |
| `AI` | 🤖 | AI assistant operations |
| `LINE` | 💬 | LINE bot messaging |
| `EXPENSE` | 💸 | Expense tracking |
| `REPORT` | 📊 | Report generation |
| `GENERAL` | ⚙️ | General operations |

## Usage in Browser Console

### View All Logs
```javascript
getLogs()
```

### Filter by Category
```javascript
getLogs({ category: '🤖 AI' })
```

### Filter by Level
```javascript
getLogs({ level: LogLevel.ERROR })
```

### Search Logs
```javascript
getLogs({ search: 'Google sign-in' })
```

### Export Logs
```javascript
exportLogs()  // Downloads as JSON file
```

### Clear Logs
```javascript
clearLogs()
```

### Get Performance Summary
```javascript
getPerformanceSummary()
```

## Performance Monitoring

### View Slow Operations
Operations taking > 1000ms are automatically flagged as SLOW in the logs.

### Average Response Times
```javascript
const summary = getPerformanceSummary();
console.log(summary.avgResponseTime);
```

## Logging in Your Code

### Basic Logging
```javascript
logger.info(LogCategory.GENERAL, 'Operation completed');
logger.error(LogCategory.DATABASE, 'Query failed', error);
logger.warn(LogCategory.AUTH, 'Invalid token');
logger.debug(LogCategory.UI, 'Button clicked', { buttonId: 'save-btn' });
```

### Performance Timing
```javascript
// Start timer
logger.startTimer('myOperation', LogCategory.DATABASE);

// ... do work ...

// End timer (automatically logs duration)
logger.endTimer('myOperation');
```

### Wrap Functions for Automatic Logging
```javascript
const myFunction = logger.wrapFunction(
  async function myOperation(param1, param2) {
    // Your code here
    return result;
  },
  'myOperation',
  LogCategory.DATABASE
);
```

This automatically logs:
- Function entry with parameters
- Execution time
- Success/failure
- Return value type

### API Call Logging
```javascript
// Log API request
logger.logAPICall('POST', '/api/users', LogCategory.API);

// ... make request ...

// Log API response
logger.logAPIResponse('POST', '/api/users', 200, { userId: 123 });
```

### Database Operation Logging
```javascript
// Log DB operation
logger.logDBOperation('INSERT', 'users', { username: 'john' });

// ... execute query ...

// Log DB result
logger.logDBResult('INSERT', 'users', result);

// Or log DB error
logger.logDBError('INSERT', 'users', error);
```

### User Action Logging
```javascript
logger.logUserAction('Added item to cart', { 
  itemId: 123, 
  quantity: 2 
});
```

## Log Levels

```javascript
LogLevel.DEBUG   // Detailed debugging information
LogLevel.INFO    // General informational messages
LogLevel.WARN    // Warning messages
LogLevel.ERROR   // Error messages
LogLevel.PERFORMANCE  // Performance metrics
```

### Set Minimum Log Level
```javascript
// Only show WARN and ERROR logs
logger.minLevel = LogLevel.WARN;
```

## Example Log Output

```
[2025-11-07 15:30:45.123] [INFO] 🔐 AUTH: → Calling Supabase Google sign-in...
[2025-11-07 15:30:45.456] [INFO] 🔐 AUTH: ⏱️ google_signin completed in 333.45ms
[2025-11-07 15:30:45.457] [INFO] 🔐 AUTH: ✓ Google sign-in initiated { redirecting: true }

[2025-11-07 15:30:46.789] [INFO] 💾 DATABASE: → SELECT on menus { limit: 50 }
[2025-11-07 15:30:46.850] [INFO] 💾 DATABASE: ✓ SELECT on menus - 42 record(s)
[2025-11-07 15:30:46.851] [INFO] 💾 DATABASE: ⏱️ load_menus completed in 62.34ms

[2025-11-07 15:30:50.123] [ERROR] 🤖 AI: ✗ Request REQ_5_1730970650120 failed after 1234ms
  Error: API rate limit exceeded
    at AIProvider.call (ai-provider.js:45)
    ...
```

## Performance Optimization

### Identify Slow Operations
1. Open console and run:
```javascript
const slow = getLogs({ search: 'SLOW' });
console.table(slow);
```

2. Look for operations with high duration
3. Optimize those specific functions

### Track Memory Usage
```javascript
const summary = getPerformanceSummary();
console.log(`Total logs: ${summary.totalLogs}`);
console.log(`Errors: ${summary.errorCount}`);
console.log(`Warnings: ${summary.warnCount}`);
```

## Debugging Workflows

### Debug Authentication Issues
```javascript
const authLogs = getLogs({ category: '🔐 AUTH' });
console.table(authLogs);
```

### Debug Database Queries
```javascript
const dbLogs = getLogs({ category: '💾 DATABASE' });
const errors = getLogs({ category: '💾 DATABASE', level: LogLevel.ERROR });
```

### Debug AI Assistant
```javascript
const aiLogs = getLogs({ category: '🤖 AI' });
// Look for request IDs and trace through the entire flow
```

### Export for Analysis
```javascript
// Export all logs
exportLogs();

// Or get as JSON string
const json = logger.exportLogs();
```

## Production Tips

1. **Keep logs enabled** - They're optimized for performance
2. **Monitor error rates** - Check `getPerformanceSummary()` regularly
3. **Export logs before clearing** - Save important debugging sessions
4. **Use log levels** - Set to WARN in production if needed
5. **Check performance** - Look for SLOW warnings

## Integration

### Already Logged Components
- ✅ Authentication (Google + Email)
- ✅ Database operations (via Supabase)
- ✅ AI Assistant (full request lifecycle)
- ✅ UI interactions
- ✅ Performance metrics

### To Add Logging to New Code
See the "Logging in Your Code" section above.

## Troubleshooting

### Logs not showing?
```javascript
// Check if logger is loaded
console.log(typeof logger);  // Should be 'object'

// Check log level
console.log(logger.minLevel);  // Should be 0 for DEBUG
```

### Too many logs?
```javascript
// Increase to show only warnings and errors
logger.minLevel = LogLevel.WARN;

// Or clear old logs
clearLogs();
```

### Need more detail?
```javascript
// Set to DEBUG mode
logger.minLevel = LogLevel.DEBUG;

// Enable all logs for specific category
const myLogs = getLogs({ category: '🤖 AI' });
```

## Support

For issues or questions about the logging system, check:
1. This guide
2. Browser console for error messages
3. `logger.js` source code for implementation details

---

**Last Updated:** November 7, 2025  
**Version:** 1.0.0

