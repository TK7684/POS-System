# Report Viewer - User Guide

## Overview
The Report Viewer is an interactive tool for viewing, filtering, searching, and exporting comprehensive test results. It provides multiple ways to analyze test data and generate reports in various formats.

## Features

### 1. Interactive Report Viewer
View test results in a clean, organized interface with the following capabilities:

#### Opening the Report Viewer
1. Run tests using the "Run All Tests" button
2. Click the "View Report" button in the Comprehensive Test Runner section
3. The report viewer modal will open with your test results

#### Report Viewer Components
- **Summary Section**: Overview of total tests, passed, failed, warnings, and success rate
- **Category Sections**: Tests organized by category (Sheet Verification, API Testing, etc.)
- **Test Details**: Each test shows:
  - Status icon (✓ passed, ✗ failed, ⚠ warning)
  - Test name and description
  - Duration
  - Associated requirements
  - Errors and warnings (if any)

### 2. Search and Filter

#### Search Functionality
- **Location**: Top of report viewer modal
- **Usage**: Type in the search box to filter tests by name
- **Behavior**: Real-time filtering as you type
- **Example**: Type "API" to show only API-related tests

#### Filter by Status
- **Location**: Dropdown next to search box
- **Options**:
  - All Tests (default)
  - Passed Only
  - Failed Only
  - Warnings Only
- **Usage**: Select a filter to show only tests with that status

#### Combined Filtering
You can use search and status filter together:
- Search for "performance" AND filter by "Failed Only"
- Results will show only failed performance tests

### 3. Export Reports

The report viewer includes export buttons for three formats:

#### HTML Export
- **Button**: 📄 Export HTML
- **Format**: Standalone HTML file with embedded CSS
- **Use Case**: Share reports via email or web
- **Features**:
  - Fully styled and formatted
  - Includes all test details
  - Printable
  - No external dependencies

#### JSON Export
- **Button**: 📊 Export JSON
- **Format**: Machine-readable JSON
- **Use Case**: Automation, CI/CD integration, data analysis
- **Structure**:
```json
{
  "metadata": { ... },
  "summary": { ... },
  "categories": [ ... ],
  "requirements": { ... }
}
```

#### CSV Export
- **Button**: 📈 Export CSV
- **Format**: Comma-separated values
- **Use Case**: Import into Excel, Google Sheets, or data analysis tools
- **Columns**:
  - Category
  - Test ID
  - Test Name
  - Status
  - Duration (ms)
  - Requirements
  - Errors
  - Warnings

### 4. Test History Browser

#### Viewing History
1. Click the "View History" button in the Comprehensive Test Runner section
2. A modal will display all previous test runs
3. Each history item shows:
   - Date and time of test run
   - Total tests executed
   - Number passed (green)
   - Number failed (red)
   - Overall score percentage

#### Loading Historical Reports
- Click any history item to load that report
- The report viewer will display the historical data
- You can export historical reports just like current reports

### 5. Requirement Coverage Visualization

#### Opening Coverage Chart
1. Open the report viewer
2. Click the "📉 Coverage Chart" button in the toolbar
3. A modal will display the coverage visualization

#### Coverage Components
- **Donut Chart**: Visual representation of coverage percentage
  - Green section: Covered requirements
  - Gray section: Uncovered requirements
  - Center: Coverage percentage
- **Statistics Cards**:
  - Total Requirements
  - Covered (green)
  - Uncovered (red)
- **Requirement Lists**:
  - Left column: Covered requirements (green background)
  - Right column: Uncovered requirements (red background)

## Keyboard Shortcuts

While in the report viewer:
- **Esc**: Close modal (if implemented)
- **Ctrl+F / Cmd+F**: Focus search box (browser default)

## Tips and Best Practices

### Efficient Searching
- Use partial words: "perf" will match "performance"
- Search is case-insensitive
- Clear search to see all tests again

### Analyzing Failed Tests
1. Filter by "Failed Only"
2. Review error messages in each test
3. Check associated requirements
4. Export as CSV for tracking

### Tracking Progress
1. Run tests regularly
2. Use "View History" to compare results over time
3. Monitor success rate trends
4. Export reports for documentation

### Sharing Reports
- **For Developers**: Export JSON for automation
- **For Managers**: Export HTML for easy viewing
- **For Analysis**: Export CSV for spreadsheets

## Troubleshooting

### "No test results available"
- **Cause**: Tests haven't been run yet
- **Solution**: Click "Run All Tests" first

### Export button not working
- **Cause**: Browser blocking downloads
- **Solution**: Check browser's download settings and allow downloads

### History is empty
- **Cause**: No previous test runs saved
- **Solution**: Run tests multiple times to build history

### Search not finding tests
- **Cause**: Test name doesn't match search term
- **Solution**: Try different keywords or clear search

## Technical Details

### Browser Compatibility
- Chrome/Edge: ✓ Full support
- Firefox: ✓ Full support
- Safari: ✓ Full support
- Mobile browsers: ✓ Responsive design

### Data Storage
- Test results: Stored in memory during session
- History: Stored in browser localStorage
- Exports: Downloaded to browser's download folder

### Performance
- Report rendering: < 100ms
- Search filtering: Real-time (< 50ms)
- Export generation: 1-3 seconds
- History loading: < 200ms

## Examples

### Example 1: Finding Failed API Tests
```
1. Click "View Report"
2. Type "API" in search box
3. Select "Failed Only" from filter
4. Review failed tests
5. Click "Export CSV" to track issues
```

### Example 2: Checking Coverage
```
1. Click "View Report"
2. Click "Coverage Chart" button
3. Review coverage percentage
4. Check uncovered requirements list
5. Plan tests for uncovered requirements
```

### Example 3: Comparing with Previous Run
```
1. Click "View History"
2. Note current success rate
3. Click previous test run
4. Compare success rates
5. Identify improvements or regressions
```

## Related Documentation
- [Comprehensive Testing Guide](./README-COMPREHENSIVE-TESTING.md)
- [Report Generation Module](./REPORT-GENERATION-README.md)
- [Implementation Summary](./REPORT-VIEWER-IMPLEMENTATION-SUMMARY.md)

## Support
For issues or questions about the report viewer:
1. Check this documentation
2. Review implementation summary
3. Check browser console for errors
4. Verify test results are available

## Version History
- **v1.0.0** (Current): Initial implementation
  - Interactive report viewer
  - Search and filter functionality
  - HTML, JSON, CSV export
  - Test history browser
  - Coverage visualization
