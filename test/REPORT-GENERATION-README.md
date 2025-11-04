# Report Generation Module - User Guide

## Quick Start

### 1. Include the Module

```html
<script src="test/report-generation-module.js"></script>
```

Or in Node.js:

```javascript
const ReportGenerationModule = require('./test/report-generation-module.js');
```

### 2. Create an Instance

```javascript
const reportGenerator = new ReportGenerationModule({
  outputDir: './test-reports',
  includeScreenshots: false,
  historyLimit: 10
});
```

### 3. Generate Reports

```javascript
// HTML Report
const htmlReport = reportGenerator.generateHTMLReport(testResults);

// JSON Report
const jsonReport = reportGenerator.generateJSONReport(testResults);

// CSV Report
const csvReport = reportGenerator.generateCSVReport(testResults);

// Save all formats
const result = await reportGenerator.saveReports(testResults, ['html', 'json', 'csv']);
```

## Test Results Format

Your test results should follow this structure:

```javascript
{
  metadata: {
    timestamp: "2025-10-02T10:30:00.000Z",
    duration: 45230,                    // milliseconds
    environment: "Test Environment",
    version: "1.0.0"
  },
  categories: [
    {
      name: "Category Name",
      status: "passed" | "failed" | "warning" | "skipped",
      tests: [
        {
          testId: "unique-test-id",
          name: "Test Name",
          description: "Test description",
          status: "passed" | "failed" | "warning" | "skipped",
          duration: 1250,               // milliseconds
          requirements: ["1.1", "1.2"], // requirement IDs
          errors: ["Error message 1"],
          warnings: ["Warning message 1"],
          assertions: [
            {
              description: "Assertion description",
              expected: "expected value",
              actual: "actual value",
              passed: true
            }
          ]
        }
      ],
      issues: [
        {
          severity: "critical" | "high" | "medium" | "low",
          message: "Issue description"
        }
      ],
      recommendations: [
        {
          message: "Recommendation text"
        }
      ]
    }
  ],
  requirements: {
    covered: ["1.1", "1.2", "1.3"],
    uncovered: ["4.1", "4.2"],
    traceability: {
      "1.1": {
        tests: ["test-id-1", "test-id-2"],
        status: "covered"
      }
    }
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outputDir` | string | `'./test-reports'` | Directory where reports are saved |
| `includeScreenshots` | boolean | `false` | Include screenshots in reports (future feature) |
| `historyLimit` | number | `10` | Number of historical reports to keep |

## Report Formats

### HTML Report

**Features:**
- Interactive, collapsible sections
- Color-coded status indicators
- Visual progress bars
- Requirement traceability matrix
- Print-friendly layout
- Responsive design

**Use Cases:**
- Human review
- Stakeholder presentations
- Documentation
- Archive

**Example:**
```javascript
const html = reportGenerator.generateHTMLReport(testResults);

// In browser - open in new window
const newWindow = window.open('', '_blank');
newWindow.document.write(html);
newWindow.document.close();

// In Node.js - save to file
const fs = require('fs');
fs.writeFileSync('report.html', html);
```

### JSON Report

**Features:**
- Structured data format
- Complete test information
- Machine-readable
- API-friendly

**Use Cases:**
- CI/CD integration
- Automated processing
- Data analysis
- API consumption

**Example:**
```javascript
const json = reportGenerator.generateJSONReport(testResults);

// Parse the JSON
const report = JSON.parse(json);
console.log(`Success Rate: ${report.summary.successRate}%`);

// Save to file
const fs = require('fs');
fs.writeFileSync('report.json', json);
```

### CSV Report

**Features:**
- Spreadsheet compatible
- Flat structure
- Easy filtering/sorting
- Excel/Google Sheets ready

**Use Cases:**
- Data analysis
- Trend tracking
- Reporting dashboards
- Spreadsheet import

**Example:**
```javascript
const csv = reportGenerator.generateCSVReport(testResults);

// Save to file
const fs = require('fs');
fs.writeFileSync('report.csv', csv);

// Import into Excel or Google Sheets
```

## Saving Reports

The `saveReports()` method handles file saving automatically:

```javascript
// Save all formats
const result = await reportGenerator.saveReports(testResults, ['html', 'json', 'csv']);

if (result.success) {
  console.log('Reports saved:');
  result.files.forEach(file => {
    console.log(`- ${file.format}: ${file.filename} (${file.status})`);
  });
} else {
  console.error('Error:', result.error);
}
```

**In Browser:**
- Triggers file downloads

**In Node.js:**
- Writes files to `outputDir`
- Creates directory if needed
- Manages file history
- Cleans up old reports

## Report History

Track previously generated reports:

```javascript
// Get history
const history = reportGenerator.getReportHistory();

history.forEach(entry => {
  console.log(`${entry.timestamp}: ${entry.summary.successRate}% success`);
});

// Clear history
reportGenerator.clearReportHistory();
```

## Testing the Module

Open `test/test-report-generation.html` in a browser to:
- Generate sample reports
- Test all formats
- See interactive features
- Download reports

## Integration Examples

### With Test Runner

```javascript
// After running tests
const testResults = testRunner.getResults();
const reportGenerator = new ReportGenerationModule();

// Generate and save reports
await reportGenerator.saveReports(testResults, ['html', 'json', 'csv']);
```

### With CI/CD Pipeline

```javascript
// In your CI script
const reportGenerator = new ReportGenerationModule({
  outputDir: './test-reports'
});

const testResults = await runTests();
const result = await reportGenerator.saveReports(testResults, ['json', 'html']);

// Upload to artifact storage
if (result.success) {
  uploadArtifacts(result.files);
}
```

### With Express Server

```javascript
app.get('/api/test-report', async (req, res) => {
  const testResults = await getLatestTestResults();
  const reportGenerator = new ReportGenerationModule();
  
  const format = req.query.format || 'json';
  
  switch (format) {
    case 'html':
      res.type('text/html');
      res.send(reportGenerator.generateHTMLReport(testResults));
      break;
    case 'json':
      res.type('application/json');
      res.send(reportGenerator.generateJSONReport(testResults));
      break;
    case 'csv':
      res.type('text/csv');
      res.send(reportGenerator.generateCSVReport(testResults));
      break;
  }
});
```

## Troubleshooting

### Reports not saving in Node.js

**Issue:** Files not being created

**Solution:**
- Check that output directory exists or can be created
- Verify write permissions
- Check disk space

### HTML report not displaying correctly

**Issue:** Styles or scripts not working

**Solution:**
- Ensure the HTML is complete (check for truncation)
- Open in a modern browser
- Check browser console for errors

### CSV not importing correctly

**Issue:** Data not parsing in spreadsheet

**Solution:**
- Ensure proper CSV escaping
- Check for special characters
- Try different import settings in spreadsheet app

## Best Practices

1. **Generate reports after every test run** - Track progress over time
2. **Use JSON for automation** - Easy to parse and process
3. **Use HTML for humans** - Best for review and presentation
4. **Use CSV for analysis** - Import into analytics tools
5. **Keep history** - Track trends and regressions
6. **Clean up old reports** - Manage disk space
7. **Include metadata** - Environment, version, timestamp
8. **Add requirement traceability** - Link tests to requirements

## API Reference

### Constructor

```javascript
new ReportGenerationModule(config)
```

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `generateHTMLReport()` | `testResults` | `string` | Generate HTML report |
| `generateJSONReport()` | `testResults` | `string` | Generate JSON report |
| `generateCSVReport()` | `testResults` | `string` | Generate CSV report |
| `saveReports()` | `testResults, formats[]` | `Promise<object>` | Save reports to files |
| `getReportHistory()` | - | `array` | Get report history |
| `clearReportHistory()` | - | `void` | Clear report history |

## Support

For issues or questions:
1. Check this README
2. Review the implementation summary
3. Examine the test file for examples
4. Check the source code comments

## License

Part of the Comprehensive Testing Suite for POS System.
