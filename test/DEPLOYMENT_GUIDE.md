# Test Infrastructure Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the comprehensive test infrastructure to production environments. It covers initial setup, configuration, deployment procedures, and post-deployment verification.

## Prerequisites

Before deploying the test infrastructure, ensure you have:

- Access to the production Google Sheets spreadsheet
- Deployed Apps Script web app with API access
- Web server or hosting platform for test HTML files
- Node.js installed (for automated testing)
- Git repository access (for version control)
- CI/CD pipeline access (optional, for automation)

## Deployment Architecture

```
Production Environment
├── Google Apps Script (Backend API)
├── Google Sheets (Data Storage)
├── Web Server (Test Interface)
│   ├── test-comprehensive.html
│   ├── test/*.js (Test Modules)
│   └── test/reports/ (Test Results)
└── CI/CD Pipeline (Automated Testing)
    ├── Scheduled Tests
    ├── Pre-deployment Tests
    └── Monitoring Tests
```

## Step 1: Prepare the Environment

### 1.1 Create Production Test Environment

**Option A: Separate Test Spreadsheet (Recommended)**

1. Create a copy of your production spreadsheet:
   ```
   File → Make a copy → Name: "POS System - Test Environment"
   ```

2. Note the new spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

3. Populate with test data (see Test Data Management section)

**Option B: Use Production Spreadsheet (Caution)**

Only use this approach if:
- Tests are read-only
- You have proper backups
- Test mode is strictly enforced

### 1.2 Deploy Apps Script

1. Open your Apps Script project
2. Deploy as web app:
   ```
   Deploy → New deployment
   Type: Web app
   Execute as: Me
   Who has access: Anyone
   ```

3. Copy the deployment URL:
   ```
   https://script.google.com/macros/s/[SCRIPT_ID]/exec
   ```

4. Test the deployment:
   ```bash
   curl "https://script.google.com/macros/s/[SCRIPT_ID]/exec?action=getBootstrapData"
   ```

### 1.3 Set Up Web Server

**Option A: Static Hosting (GitHub Pages, Netlify, Vercel)**

1. Create a `test` directory in your repository
2. Copy all test files:
   ```bash
   cp -r test/ /path/to/deployment/test/
   cp test-comprehensive.html /path/to/deployment/
   ```

3. Deploy to hosting platform:
   ```bash
   # GitHub Pages
   git add test/ test-comprehensive.html
   git commit -m "Deploy test infrastructure"
   git push origin main
   
   # Netlify
   netlify deploy --prod --dir=.
   
   # Vercel
   vercel --prod
   ```

**Option B: Self-Hosted Server**

1. Set up web server (Apache, Nginx, IIS)
2. Copy files to web root:
   ```bash
   # Linux/Mac
   sudo cp -r test/ /var/www/html/
   sudo cp test-comprehensive.html /var/www/html/
   
   # Windows IIS
   xcopy test\ C:\inetpub\wwwroot\test\ /E /I
   copy test-comprehensive.html C:\inetpub\wwwroot\
   ```

3. Configure CORS if needed:
   ```nginx
   # Nginx
   add_header Access-Control-Allow-Origin *;
   add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
   ```

## Step 2: Configure Test Environment

### 2.1 Update Configuration File

Edit `test/comprehensive-test-config.js`:

```javascript
const ComprehensiveTestConfig = {
  environment: {
    // REQUIRED: Update these values
    apiUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    spreadsheetId: 'YOUR_SPREADSHEET_ID',
    
    // OPTIONAL: Adjust based on your environment
    timeout: 10000,
    retries: 3,
    testMode: true  // IMPORTANT: Keep true for safety
  },
  
  // Enable all test categories for production
  testCategories: {
    sheetVerification: true,
    apiTesting: true,
    functionalTesting: true,
    dataIntegrity: true,
    performance: true,
    crossBrowser: true,
    pwa: true,
    security: true,
    errorHandling: true,
    reporting: true
  },
  
  // Adjust thresholds for your production environment
  thresholds: {
    performance: {
      cacheOperation: 10,
      apiResponse: 2000,
      sheetRead: 100,
      reportGeneration: 1000,
      offlineLoad: 500,
      pwaInstall: 3000,
      searchResponse: 300
    },
    coverage: 90,
    successRate: 95,
    dataIntegrity: 100
  },
  
  // Configure reporting
  reporting: {
    formats: ['html', 'json', 'csv'],
    destination: 'test/reports',
    includeScreenshots: true,
    includeRequirementTraceability: true,
    saveHistory: true,
    maxHistoryEntries: 100
  }
};
```

### 2.2 Create Environment-Specific Configs

Create separate configuration files for different environments:

**test/config/production.config.js**
```javascript
const ProductionConfig = {
  environment: {
    apiUrl: 'https://script.google.com/macros/s/PROD_SCRIPT_ID/exec',
    spreadsheetId: 'PROD_SPREADSHEET_ID',
    timeout: 5000,
    retries: 2,
    testMode: false  // Read-only tests only
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
  }
};
```

**test/config/staging.config.js**
```javascript
const StagingConfig = {
  environment: {
    apiUrl: 'https://script.google.com/macros/s/STAGING_SCRIPT_ID/exec',
    spreadsheetId: 'STAGING_SPREADSHEET_ID',
    timeout: 10000,
    retries: 3,
    testMode: true
  },
  testCategories: {
    // All enabled for comprehensive testing
  }
};
```

### 2.3 Validate Configuration

Run the configuration validator:

```javascript
// In browser console or Node.js
function validateDeploymentConfig(config) {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  if (!config.environment.apiUrl || config.environment.apiUrl.includes('YOUR_')) {
    errors.push('API URL not configured');
  }
  
  if (!config.environment.spreadsheetId || config.environment.spreadsheetId.includes('YOUR_')) {
    errors.push('Spreadsheet ID not configured');
  }
  
  // Check test mode for safety
  if (!config.environment.testMode && config.testCategories.functionalTesting) {
    warnings.push('Functional testing enabled without test mode - may modify production data');
  }
  
  // Check reporting destination exists
  if (!config.reporting.destination) {
    errors.push('Reporting destination not configured');
  }
  
  // Validate thresholds
  for (const [key, value] of Object.entries(config.thresholds.performance)) {
    if (typeof value !== 'number' || value <= 0) {
      errors.push(`Invalid performance threshold for ${key}: ${value}`);
    }
  }
  
  return { errors, warnings };
}

const result = validateDeploymentConfig(ComprehensiveTestConfig);
console.log('Validation Results:', result);
```

## Step 3: Deploy Test Files

### 3.1 File Checklist

Ensure all required files are deployed:

```
✓ test-comprehensive.html          (Main test interface)
✓ test/comprehensive-test-config.js (Configuration)
✓ test/automated-testing-suite.js   (Test orchestrator)
✓ test/test-fixtures.js             (Test data)
✓ test/test-utilities.js            (Helper functions)

Test Modules:
✓ test/sheet-verification-module.js
✓ test/api-testing-module.js
✓ test/functional-testing-module.js
✓ test/data-integrity-module.js
✓ test/performance-testing-module.js
✓ test/cross-browser-testing-module.js
✓ test/pwa-testing-module.js
✓ test/security-testing-module.js
✓ test/error-handling-module.js
✓ test/reporting-testing-module.js
✓ test/report-generation-module.js

Documentation:
✓ test/TEST_GUIDE.md
✓ test/TEST_CONFIGURATION.md
✓ test/TEST_TROUBLESHOOTING.md
✓ test/DEPLOYMENT_GUIDE.md (this file)
✓ test/MAINTENANCE_GUIDE.md

Directories:
✓ test/reports/                     (Create if doesn't exist)
✓ test/config/                      (Environment configs)
```

### 3.2 Deployment Script

Create a deployment script for automation:

**deploy-tests.sh** (Linux/Mac)
```bash
#!/bin/bash

# Configuration
ENVIRONMENT=${1:-staging}
DEPLOY_DIR="/var/www/html/pos-tests"

echo "Deploying test infrastructure to $ENVIRONMENT..."

# Create directories
mkdir -p $DEPLOY_DIR/test/reports
mkdir -p $DEPLOY_DIR/test/config

# Copy test files
cp test-comprehensive.html $DEPLOY_DIR/
cp -r test/*.js $DEPLOY_DIR/test/
cp -r test/*.md $DEPLOY_DIR/test/
cp -r css/ $DEPLOY_DIR/css/

# Copy environment-specific config
cp test/config/${ENVIRONMENT}.config.js $DEPLOY_DIR/test/comprehensive-test-config.js

# Set permissions
chmod -R 755 $DEPLOY_DIR
chmod -R 777 $DEPLOY_DIR/test/reports

echo "Deployment complete!"
echo "Access tests at: http://your-server.com/test-comprehensive.html"
```

**deploy-tests.ps1** (Windows)
```powershell
# Configuration
param(
    [string]$Environment = "staging",
    [string]$DeployDir = "C:\inetpub\wwwroot\pos-tests"
)

Write-Host "Deploying test infrastructure to $Environment..."

# Create directories
New-Item -ItemType Directory -Force -Path "$DeployDir\test\reports"
New-Item -ItemType Directory -Force -Path "$DeployDir\test\config"

# Copy test files
Copy-Item test-comprehensive.html $DeployDir\
Copy-Item -Recurse test\*.js $DeployDir\test\
Copy-Item -Recurse test\*.md $DeployDir\test\
Copy-Item -Recurse css\ $DeployDir\css\

# Copy environment-specific config
Copy-Item "test\config\$Environment.config.js" "$DeployDir\test\comprehensive-test-config.js"

Write-Host "Deployment complete!"
Write-Host "Access tests at: http://your-server.com/test-comprehensive.html"
```

### 3.3 Deploy Using Script

```bash
# Linux/Mac
chmod +x deploy-tests.sh
./deploy-tests.sh production

# Windows
.\deploy-tests.ps1 -Environment production
```

## Step 4: Post-Deployment Verification

### 4.1 Smoke Tests

Run basic smoke tests to verify deployment:

1. **Access Test Interface**
   ```
   Navigate to: https://your-server.com/test-comprehensive.html
   Expected: Page loads without errors
   ```

2. **Test API Connection**
   ```javascript
   // In browser console
   fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getBootstrapData')
     .then(r => r.json())
     .then(d => console.log('API Connected:', d))
     .catch(e => console.error('API Error:', e));
   ```

3. **Run Single Test Module**
   ```
   Click "Run Tests" button in Sheet Verification section
   Expected: Tests complete successfully
   ```

4. **Verify Report Generation**
   ```
   After tests complete, click "Download HTML Report"
   Expected: Report downloads successfully
   ```

### 4.2 Full Test Suite Verification

Run the complete test suite:

1. Click "Run All Tests" button
2. Monitor progress (should complete in 3-5 minutes)
3. Verify all test categories complete
4. Check success rate (should be > 95%)
5. Download and review reports

### 4.3 Verification Checklist

```
✓ Test interface loads without errors
✓ API connection successful
✓ All test modules load correctly
✓ Configuration is correct
✓ Tests can run individually
✓ Full test suite completes
✓ Reports generate successfully
✓ Reports save to correct location
✓ Test history is maintained
✓ No console errors
✓ Performance meets thresholds
✓ All requirements covered
```

## Step 5: Set Up Automated Testing

### 5.1 CI/CD Integration

**GitHub Actions Example**

Create `.github/workflows/comprehensive-tests.yml`:

```yaml
name: Comprehensive Test Suite

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:  # Manual trigger

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run comprehensive tests
        env:
          API_URL: ${{ secrets.API_URL }}
          SPREADSHEET_ID: ${{ secrets.SPREADSHEET_ID }}
        run: node test/run-tests.js
      
      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: test/reports/
          retention-days: 30
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Comprehensive tests failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Jenkins Pipeline Example**

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    triggers {
        cron('H */6 * * *')  // Every 6 hours
    }
    
    environment {
        API_URL = credentials('api-url')
        SPREADSHEET_ID = credentials('spreadsheet-id')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'node test/run-tests.js'
            }
        }
        
        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'test/reports/**/*', fingerprint: true
            }
        }
    }
    
    post {
        failure {
            emailext (
                subject: "Test Failure: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Comprehensive tests failed. Check console output.",
                to: "team@example.com"
            )
        }
    }
}
```

### 5.2 Scheduled Testing Script

Create a standalone script for scheduled testing:

**test/run-scheduled-tests.js**
```javascript
const ComprehensiveTestSuite = require('./automated-testing-suite.js');
const config = require('./comprehensive-test-config.js');
const fs = require('fs');
const path = require('path');

async function runScheduledTests() {
  console.log('Starting scheduled test run...');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Initialize test suite
    const suite = new ComprehensiveTestSuite(config);
    
    // Run all tests
    const results = await suite.runAllTests();
    
    // Generate reports
    await suite.generateReports();
    
    // Check for failures
    const failureCount = results.summary.failed;
    const successRate = results.summary.successRate;
    
    console.log(`Tests completed: ${results.summary.totalTests} total`);
    console.log(`Success rate: ${successRate}%`);
    console.log(`Failures: ${failureCount}`);
    
    // Exit with error code if tests failed
    if (successRate < config.thresholds.successRate) {
      console.error(`Success rate ${successRate}% below threshold ${config.thresholds.successRate}%`);
      process.exit(1);
    }
    
    console.log('All tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runScheduledTests();
```

### 5.3 Set Up Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add scheduled test runs
# Run every 6 hours
0 */6 * * * cd /path/to/project && node test/run-scheduled-tests.js >> /var/log/pos-tests.log 2>&1

# Run daily at 2 AM
0 2 * * * cd /path/to/project && node test/run-scheduled-tests.js >> /var/log/pos-tests.log 2>&1
```

### 5.4 Set Up Task Scheduler (Windows)

```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "node" -Argument "test\run-scheduled-tests.js" -WorkingDirectory "C:\path\to\project"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName "POS Comprehensive Tests" -Action $action -Trigger $trigger -Principal $principal -Settings $settings
```

## Step 6: Set Up Monitoring and Alerts

### 6.1 Configure Notifications

**Email Notifications**

Create `test/notify.js`:

```javascript
const nodemailer = require('nodemailer');

async function sendTestNotification(results) {
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const successRate = results.summary.successRate;
  const status = successRate >= 95 ? '✅ PASSED' : '❌ FAILED';
  
  const mailOptions = {
    from: 'pos-tests@example.com',
    to: 'team@example.com',
    subject: `${status} - POS Test Suite - ${successRate}% Success`,
    html: `
      <h2>Comprehensive Test Results</h2>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Success Rate:</strong> ${successRate}%</p>
      <p><strong>Total Tests:</strong> ${results.summary.totalTests}</p>
      <p><strong>Passed:</strong> ${results.summary.passed}</p>
      <p><strong>Failed:</strong> ${results.summary.failed}</p>
      <p><strong>Warnings:</strong> ${results.summary.warnings}</p>
      <p><strong>Timestamp:</strong> ${results.metadata.timestamp}</p>
      <p><a href="https://your-server.com/test/reports/latest.html">View Full Report</a></p>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

module.exports = { sendTestNotification };
```

**Slack Notifications**

```javascript
const axios = require('axios');

async function sendSlackNotification(results) {
  const successRate = results.summary.successRate;
  const status = successRate >= 95 ? ':white_check_mark: PASSED' : ':x: FAILED';
  const color = successRate >= 95 ? 'good' : 'danger';
  
  const payload = {
    attachments: [{
      color: color,
      title: 'POS Comprehensive Test Results',
      fields: [
        { title: 'Status', value: status, short: true },
        { title: 'Success Rate', value: `${successRate}%`, short: true },
        { title: 'Total Tests', value: results.summary.totalTests, short: true },
        { title: 'Failed', value: results.summary.failed, short: true }
      ],
      footer: 'POS Test Suite',
      ts: Math.floor(Date.now() / 1000)
    }]
  };
  
  await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
}

module.exports = { sendSlackNotification };
```

### 6.2 Set Up Monitoring Dashboard

Create a simple monitoring dashboard:

**test/monitoring-dashboard.html**
```html
<!DOCTYPE html>
<html>
<head>
  <title>POS Test Monitoring Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    .metric.good { background-color: #d4edda; }
    .metric.warning { background-color: #fff3cd; }
    .metric.bad { background-color: #f8d7da; }
    .chart { margin: 20px 0; }
  </style>
</head>
<body>
  <h1>POS Test Monitoring Dashboard</h1>
  
  <div id="metrics"></div>
  <div id="history" class="chart"></div>
  
  <script>
    async function loadDashboard() {
      // Load latest test results
      const response = await fetch('reports/latest.json');
      const results = await response.json();
      
      // Display metrics
      const metricsDiv = document.getElementById('metrics');
      const successRate = results.summary.successRate;
      const statusClass = successRate >= 95 ? 'good' : successRate >= 90 ? 'warning' : 'bad';
      
      metricsDiv.innerHTML = `
        <div class="metric ${statusClass}">
          <h3>Success Rate</h3>
          <p>${successRate}%</p>
        </div>
        <div class="metric">
          <h3>Total Tests</h3>
          <p>${results.summary.totalTests}</p>
        </div>
        <div class="metric">
          <h3>Failed</h3>
          <p>${results.summary.failed}</p>
        </div>
        <div class="metric">
          <h3>Last Run</h3>
          <p>${new Date(results.metadata.timestamp).toLocaleString()}</p>
        </div>
      `;
      
      // Load and display history
      const historyResponse = await fetch('reports/history.json');
      const history = await historyResponse.json();
      displayHistory(history);
    }
    
    function displayHistory(history) {
      // Simple text-based history display
      // In production, use a charting library like Chart.js
      const historyDiv = document.getElementById('history');
      historyDiv.innerHTML = '<h2>Test History</h2>';
      
      const table = document.createElement('table');
      table.innerHTML = `
        <tr>
          <th>Timestamp</th>
          <th>Success Rate</th>
          <th>Total</th>
          <th>Passed</th>
          <th>Failed</th>
        </tr>
      `;
      
      history.slice(-10).forEach(run => {
        const row = table.insertRow();
        row.innerHTML = `
          <td>${new Date(run.timestamp).toLocaleString()}</td>
          <td>${run.successRate}%</td>
          <td>${run.totalTests}</td>
          <td>${run.passed}</td>
          <td>${run.failed}</td>
        `;
      });
      
      historyDiv.appendChild(table);
    }
    
    loadDashboard();
    
    // Refresh every 5 minutes
    setInterval(loadDashboard, 5 * 60 * 1000);
  </script>
</body>
</html>
```

## Step 7: Security Considerations

### 7.1 Secure Configuration

1. **Never commit sensitive data**
   ```bash
   # Add to .gitignore
   echo "test/comprehensive-test-config.js" >> .gitignore
   echo "test/config/*.config.js" >> .gitignore
   echo "test/reports/" >> .gitignore
   ```

2. **Use environment variables**
   ```javascript
   const config = {
     environment: {
       apiUrl: process.env.API_URL || 'default-url',
       spreadsheetId: process.env.SPREADSHEET_ID || 'default-id'
     }
   };
   ```

3. **Restrict access to test interface**
   ```nginx
   # Nginx - Require authentication
   location /test-comprehensive.html {
     auth_basic "Test Access";
     auth_basic_user_file /etc/nginx/.htpasswd;
   }
   ```

### 7.2 Test Data Security

1. **Use anonymized test data**
2. **Don't use production credentials**
3. **Limit test user permissions**
4. **Encrypt sensitive test results**

### 7.3 Access Control

1. **Restrict who can run tests**
2. **Limit access to test reports**
3. **Audit test execution**
4. **Monitor for unauthorized access**

## Step 8: Backup and Recovery

### 8.1 Backup Test Infrastructure

```bash
#!/bin/bash
# backup-tests.sh

BACKUP_DIR="/backups/pos-tests"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup test files
tar -czf $BACKUP_DIR/test-files-$DATE.tar.gz test/ test-comprehensive.html

# Backup test reports
tar -czf $BACKUP_DIR/test-reports-$DATE.tar.gz test/reports/

# Backup configuration
cp test/comprehensive-test-config.js $BACKUP_DIR/config-$DATE.js

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
```

### 8.2 Recovery Procedures

**If test infrastructure fails:**

1. Restore from backup:
   ```bash
   tar -xzf /backups/pos-tests/test-files-YYYYMMDD_HHMMSS.tar.gz
   ```

2. Verify configuration:
   ```bash
   node -e "console.log(require('./test/comprehensive-test-config.js'))"
   ```

3. Run smoke tests:
   ```bash
   node test/run-tests.js --category=apiTesting
   ```

4. Restore full functionality:
   ```bash
   ./deploy-tests.sh production
   ```

## Step 9: Documentation

### 9.1 Deployment Checklist

Create a deployment checklist for your team:

```markdown
# Test Infrastructure Deployment Checklist

## Pre-Deployment
- [ ] Backup current test infrastructure
- [ ] Review and update configuration
- [ ] Test in staging environment
- [ ] Notify team of deployment
- [ ] Schedule maintenance window

## Deployment
- [ ] Deploy test files to server
- [ ] Update configuration for environment
- [ ] Verify file permissions
- [ ] Test API connectivity
- [ ] Run smoke tests

## Post-Deployment
- [ ] Run full test suite
- [ ] Verify report generation
- [ ] Check monitoring dashboard
- [ ] Test automated scheduling
- [ ] Verify notifications work
- [ ] Update documentation
- [ ] Notify team of completion

## Rollback Plan
- [ ] Keep previous version available
- [ ] Document rollback procedure
- [ ] Test rollback in staging
```

### 9.2 Runbook

Create a runbook for operations team (see MAINTENANCE_GUIDE.md)

## Troubleshooting Deployment Issues

### Issue: Tests fail to connect to API

**Solution:**
1. Verify API URL is correct
2. Check Apps Script deployment is active
3. Test API directly with curl
4. Check CORS settings
5. Verify network connectivity

### Issue: Reports not saving

**Solution:**
1. Check directory permissions
2. Verify reporting.destination path
3. Check disk space
4. Review browser console for errors

### Issue: Scheduled tests not running

**Solution:**
1. Verify cron job/task scheduler is active
2. Check script permissions
3. Review log files
4. Test script manually
5. Verify environment variables

### Issue: Performance below thresholds

**Solution:**
1. Review performance test results
2. Check network latency
3. Verify server resources
4. Adjust thresholds if needed
5. Optimize slow operations

## Next Steps

After successful deployment:

1. Monitor test results for first 24 hours
2. Review and adjust thresholds based on actual performance
3. Set up regular review meetings for test results
4. Train team on using test infrastructure
5. Document any environment-specific issues
6. Plan for continuous improvement

For ongoing maintenance, see `MAINTENANCE_GUIDE.md`.
For troubleshooting, see `TEST_TROUBLESHOOTING.md`.
