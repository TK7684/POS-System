# Dropdown Troubleshooting Guide

## Quick Diagnosis

### 🔍 Check Dropdown Status

1. **Look for Visual Indicators**
   - ⏳ = Loading
   - ❌ = Error (click to retry)
   - 📴 = Offline mode
   - ✅ = Success

2. **Check Error Messages**
   - Read the Thai error message
   - Look for hints below the error
   - Note retry attempt numbers

## Common Issues & Solutions

### Issue 1: Dropdowns Show "เลือก..." and Won't Load

**Symptoms:**
- Dropdown only shows placeholder text
- No options appear when clicked
- No error messages

**Possible Causes:**
- JavaScript not loaded properly
- DropdownManager not initialized
- Network connectivity issues

**Solutions:**
1. **Refresh the page** (F5 or Ctrl+R)
2. **Check browser console** for JavaScript errors
3. **Verify internet connection**
4. **Clear browser cache** and reload

### Issue 2: "❌ ไม่สามารถเชื่อมต่อได้" (Cannot Connect)

**Symptoms:**
- Red error message in dropdown
- Network-related error

**Solutions:**
1. **Check Internet Connection**
   - Verify WiFi/mobile data is working
   - Try accessing other websites
   
2. **Retry the Connection**
   - Click on the error message to retry
   - Wait for automatic retry (1s, 2s, 4s intervals)
   
3. **Use Sync Button**
   - Click the sync button (🔄) to refresh all data
   
4. **Check Firewall/Proxy**
   - Ensure Google Apps Script domain is not blocked

### Issue 3: "❌ หมดเวลาการเชื่อมต่อ" (Connection Timeout)

**Symptoms:**
- Timeout error after waiting
- Slow network connection

**Solutions:**
1. **Wait and Retry**
   - Connection may be slow
   - Click error message to retry with longer timeout
   
2. **Check Network Speed**
   - Test internet speed
   - Switch to better network if available
   
3. **Try During Off-Peak Hours**
   - Network may be congested
   - Try again later

### Issue 4: "📴 เลือก... (ออฟไลน์)" (Offline Mode)

**Symptoms:**
- Offline indicator in dropdown
- Using cached data

**Solutions:**
1. **This is Normal When Offline**
   - System is working correctly
   - Using previously cached data
   
2. **To Get Fresh Data**
   - Restore internet connection
   - Click sync button when online
   - Data will refresh automatically

### Issue 5: Auto-Population Not Working

**Symptoms:**
- Selecting ingredient doesn't set unit
- Selecting menu doesn't set price
- Related fields remain empty

**Solutions:**
1. **Check Data Attributes**
   - Ensure dropdown has correct `data-dropdown-type`
   - Verify target fields have `data-auto-populate`
   
2. **Verify Module Initialization**
   - Check browser console for errors
   - Ensure screen modules are loaded
   
3. **Refresh and Retry**
   - Reload the page
   - Try selecting different items

### Issue 6: Slow Performance with Large Lists

**Symptoms:**
- Dropdown takes long to open
- Browser becomes unresponsive
- Many items in dropdown (100+)

**Solutions:**
1. **Use Search Functionality**
   - Type in search box to filter items
   - Search is faster than scrolling
   
2. **Enable Batch Loading**
   - Large lists load in batches automatically
   - Click "โหลดเพิ่ม" to load more items
   
3. **Clear Cache Periodically**
   - Use sync button to refresh data
   - Clears accumulated cache

### Issue 7: Data Not Updating

**Symptoms:**
- New ingredients/menus don't appear
- Old data still showing
- Changes in Google Sheets not reflected

**Solutions:**
1. **Force Refresh**
   - Click sync button (🔄)
   - This clears cache and fetches fresh data
   
2. **Check Cache Expiration**
   - Data refreshes automatically every 5 minutes
   - Wait for automatic refresh
   
3. **Verify Google Sheets**
   - Ensure data was saved in Google Sheets
   - Check sheet permissions

## Advanced Troubleshooting

### Browser Console Debugging

1. **Open Developer Tools**
   - Press F12 or Ctrl+Shift+I
   - Go to Console tab
   
2. **Look for Errors**
   - Red error messages
   - JavaScript exceptions
   - Network failures
   
3. **Check Network Tab**
   - Failed requests to Google Apps Script
   - Timeout issues
   - CORS errors

### Manual Testing Commands

Open browser console and try these commands:

```javascript
// Check DropdownManager status
window.dropdownManager?.getDropdownState('p_ing')

// Retry all failed dropdowns
window.dropdownManager?.retryAllFailed()

// Clear all cache
window.dropdownManager?.clearCache()

// Check preloading stats
window.dropdownManager?.getPreloadingStats()

// Manual preload
window.dropdownManager?.manualPreload(['ingredients', 'menus'])
```

### Performance Monitoring

```javascript
// Check cache status
console.log('Cache status:', window.cacheManager?.getStats())

// Monitor dropdown loading times
console.log('Loading times:', window.dropdownManager?.getLoadingStats())
```

## Prevention Tips

### Regular Maintenance

1. **Weekly Cache Clear**
   - Click sync button weekly
   - Prevents cache buildup
   
2. **Monitor Performance**
   - Watch for slow loading
   - Check error patterns
   
3. **Update Browser**
   - Keep browser updated
   - Clear cache monthly

### Best Practices

1. **Stable Internet**
   - Use reliable WiFi
   - Avoid switching networks frequently
   
2. **Regular Sync**
   - Sync after adding new data
   - Sync before important operations
   
3. **Monitor Status**
   - Watch for error indicators
   - Address issues promptly

## When to Contact Support

Contact system administrator if:

1. **Persistent Errors**
   - Same error after multiple retries
   - Errors across multiple devices
   
2. **Data Integrity Issues**
   - Wrong data appearing
   - Missing critical information
   
3. **Performance Problems**
   - Consistently slow loading
   - Browser crashes
   
4. **System-Wide Issues**
   - All users affected
   - Google Sheets access problems

## Error Code Reference

| Code | Message | Severity | Action |
|------|---------|----------|--------|
| NET001 | ไม่สามารถเชื่อมต่อได้ | Medium | Retry, check connection |
| NET002 | หมดเวลาการเชื่อมต่อ | Medium | Retry, check speed |
| DATA001 | ไม่พบข้อมูล | Low | Contact admin |
| AUTH001 | ไม่มีสิทธิ์เข้าถึง | High | Re-login, contact admin |
| SRV001 | เซิร์ฟเวอร์ขัดข้อง | High | Wait, contact admin |
| CACHE001 | ข้อมูลแคชหมดอายุ | Low | Auto-refresh |

## Diagnostic Checklist

Before contacting support, check:

- [ ] Internet connection working
- [ ] Browser updated to latest version
- [ ] JavaScript enabled
- [ ] No browser extensions blocking scripts
- [ ] Tried clearing cache and cookies
- [ ] Tested on different device/browser
- [ ] Checked Google Sheets access
- [ ] Noted exact error messages
- [ ] Recorded steps to reproduce issue