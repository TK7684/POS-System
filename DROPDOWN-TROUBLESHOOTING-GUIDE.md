# 🔧 Dropdown Troubleshooting Guide

## 🚀 Quick Testing Options

### **Option 1: Comprehensive Test Page**
Open `test-dropdown-comprehensive.html` in your browser:
- ✅ Automatic test execution
- ✅ Visual test results
- ✅ Statistics and progress tracking
- ✅ Export test report as JSON

### **Option 2: Console Diagnostic**
1. Open your POS application
2. Open browser DevTools (F12)
3. Go to Console tab
4. Copy and paste contents of `dropdown-diagnostic.js`
5. Press Enter
6. Run `testDropdownPopulation()` to manually test dropdowns

### **Option 3: Browser DevTools**
Open DevTools Console and run:
```javascript
// Quick check
console.log('CacheManager:', typeof CacheManager);
console.log('window.cacheManager:', !!window.cacheManager);
console.log('window.dropdownManager:', !!window.dropdownManager);
console.log('window.moduleLoader:', !!window.moduleLoader);
```

---

## 📋 Test Scenarios Explained

### **Scenario 1: Dependency Loading** 🏗️
**What it tests:** Verifies all required JavaScript files are loaded

**Common Issues:**
- ❌ CacheManager.js not loaded → Add `<script src="CacheManager.js"></script>`
- ❌ critical.js not loaded → Check script tag exists
- ❌ Wrong loading order → CacheManager.js must load BEFORE critical.js

**Expected Results:**
- ✅ CacheManager class is defined
- ✅ Critical.js functions available (routeTo, toast, loading)
- ✅ ModuleLoader initialized
- ✅ DropdownManager initialized

---

### **Scenario 2: Initialization Sequence** ⚙️
**What it tests:** Checks if components initialize in correct order

**Common Issues:**
- ❌ window.cacheManager not created → initModuleLoader() not called
- ❌ window.dropdownManager not created → CacheManager not available when needed
- ❌ Timing issues → Scripts loading in wrong order

**Expected Results:**
- ✅ DOM fully loaded
- ✅ window.cacheManager instance created
- ✅ window.dropdownManager instance created with CacheManager reference
- ✅ Module instances can be created

**Initialization Timeline:**
```
0ms:   DOM loaded
0ms:   CacheManager.js loaded
0ms:   critical.js starts loading (defer)
50ms:  critical.js executes, initCritical() runs
100ms: initModuleLoader() runs
200ms: DropdownManager initialized
```

---

### **Scenario 3: API Connection** 🔌
**What it tests:** Connection to Google Apps Script backend

**Common Issues:**
- ❌ google.script.run not available → Not in GAS environment
- ❌ API calls fail → Backend Code.gs has errors
- ❌ CORS errors → Running locally instead of from GAS

**Expected Results:**
- ✅ google.script.run available (GAS environment only)
- ✅ Can fetch ingredients data
- ✅ Can fetch menus data
- ✅ Error handling works

**Testing in Different Environments:**
- **Google Apps Script**: All API tests should pass
- **Local Development**: API tests will fail (expected) - use mock data
- **Hosted (non-GAS)**: Need to implement alternative API endpoint

---

### **Scenario 4: Dropdown Population** 📝
**What it tests:** Actual population of dropdown elements with data

**Common Issues:**
- ❌ Dropdowns show only "Loading..." → DropdownManager not initialized
- ❌ Dropdowns empty → API fetch failed
- ❌ No data → Google Sheets empty or wrong sheet names

**Expected Results:**
For each dropdown:
- ✅ Purchase - Ingredient: Populated with ingredients
- ✅ Purchase - Unit: Starts empty (populated on ingredient change)
- ✅ Sale - Menu: Populated with menus
- ✅ Sale - Platform: Populated with platforms
- ✅ Menu - Menu Select: Populated with menus
- ✅ Menu - Ingredient: Populated with ingredients

**Manual Test:**
```javascript
// In browser console
const select = document.getElementById('p_ing');
await window.dropdownManager.populateIngredients(select);
console.log('Options:', select.options.length);
```

---

### **Scenario 5: Event Handlers** 🎯
**What it tests:** Dropdown change events trigger correct actions

**Common Issues:**
- ❌ Ingredient change doesn't update unit → Handler not attached
- ❌ Menu change doesn't update price → Handler not attached
- ❌ Events not firing → Module not initialized

**Expected Results:**
- ✅ Ingredient change updates unit dropdown
- ✅ Menu change updates price field
- ✅ Handlers properly attached to elements

---

## 🐛 Common Problems & Solutions

### **Problem 1: "DropdownManager is not defined"**

**Diagnosis:**
```javascript
console.log(typeof window.dropdownManager); // undefined
```

**Causes:**
1. CacheManager.js not loaded
2. critical.js not loaded
3. initModuleLoader() not running
4. Timing issue - checking too early

**Solution:**
1. Add to HTML before critical.js:
   ```html
   <script src="CacheManager.js"></script>
   ```

2. Wait for initialization:
   ```javascript
   setTimeout(() => {
     console.log(window.dropdownManager);
   }, 500);
   ```

---

### **Problem 2: "Dropdowns show only 'Loading...'"**

**Diagnosis:**
```javascript
const select = document.getElementById('p_ing');
console.log('Options:', select.options.length); // Should be > 1
```

**Causes:**
1. DropdownManager not initialized
2. API call failed
3. No data in Google Sheets
4. populateIngredients() never called

**Solution:**
1. Check DropdownManager exists:
   ```javascript
   console.log(!!window.dropdownManager);
   ```

2. Manually populate to test:
   ```javascript
   await window.dropdownManager.populateIngredients(
     document.getElementById('p_ing')
   );
   ```

3. Check for errors in console

---

### **Problem 3: "Module not loading"**

**Diagnosis:**
```javascript
console.log(!!window.purchaseInstance); // Should be true after visiting purchase tab
```

**Causes:**
1. ModuleLoader not initialized
2. Module file missing
3. Module file has errors
4. Tab routing not triggering module load

**Solution:**
1. Navigate to tab first (modules are lazy-loaded)
2. Check module file exists
3. Manually load module:
   ```javascript
   const PurchaseModule = await window.moduleLoader.loadModule('purchase');
   ```

---

### **Problem 4: "API calls failing"**

**Diagnosis:**
```javascript
console.log(typeof google !== 'undefined' && google.script); // Should be object in GAS
```

**Causes:**
1. Not in Google Apps Script environment
2. Code.gs has errors
3. Permissions not granted
4. Sheet structure incorrect

**Solution:**
1. For GAS: Check Code.gs for syntax errors
2. For local dev: Use mock data:
   ```javascript
   window.dropdownManager.MOCK_MODE = true;
   ```

---

## 📊 Test Result Interpretation

### **All Green (All Tests Pass)** ✅
- System working correctly
- If dropdowns still don't work, issue is in Google Sheets data

### **Red on Scenario 1** ❌
- **Critical**: File loading issue
- Fix: Check HTML script tags and file paths

### **Red on Scenario 2** ❌
- **Critical**: Initialization issue
- Fix: Check critical.js initialization sequence

### **Red on Scenario 3** ⚠️
- **Warning**: API connection issue
- Normal if running locally
- Critical if running in GAS

### **Red on Scenario 4** ❌
- **Critical**: Dropdown population failing
- Usually caused by Scenario 1 or 2 failures
- Fix root cause first

---

## 🔍 Step-by-Step Debugging

### **Step 1: Open DevTools**
- Press F12 (or Cmd+Option+I on Mac)
- Go to Console tab

### **Step 2: Check Dependencies**
```javascript
console.log('1. CacheManager:', typeof CacheManager);
console.log('2. cacheManager instance:', !!window.cacheManager);
console.log('3. dropdownManager instance:', !!window.dropdownManager);
console.log('4. moduleLoader instance:', !!window.moduleLoader);
```

**Expected Output:**
```
1. CacheManager: function
2. cacheManager instance: true
3. dropdownManager instance: true
4. moduleLoader instance: true
```

### **Step 3: Check Dropdowns**
```javascript
const p_ing = document.getElementById('p_ing');
console.log('Ingredient dropdown:', {
  exists: !!p_ing,
  options: p_ing?.options.length,
  value: p_ing?.value
});
```

### **Step 4: Manual Population Test**
```javascript
// Test ingredient dropdown
const select = document.getElementById('p_ing');
if (window.dropdownManager) {
  await window.dropdownManager.populateIngredients(select);
  console.log('Populated with', select.options.length, 'options');
} else {
  console.error('DropdownManager not available!');
}
```

### **Step 5: Check Network Tab**
- Go to Network tab in DevTools
- Reload page
- Look for failed requests (red)
- Check if CacheManager.js and critical.js loaded

### **Step 6: Check Errors**
- Look for red errors in Console
- Common errors:
  - "CacheManager is not defined"
  - "Cannot read property 'populateIngredients' of undefined"
  - "Failed to fetch"

---

## 💡 Quick Fixes

### **If DropdownManager not initialized:**
```javascript
// Run this in console to force initialization
if (typeof CacheManager !== 'undefined' && !window.cacheManager) {
  window.cacheManager = new CacheManager();
}

if (window.cacheManager && !window.dropdownManager) {
  // You'll need to load DropdownManager.js first
  console.log('Load DropdownManager.js and try again');
}
```

### **If dropdowns won't populate:**
```javascript
// Force populate all dropdowns
async function forcePopulateAll() {
  if (!window.dropdownManager) {
    console.error('DropdownManager not available');
    return;
  }
  
  const dropdowns = [
    { id: 'p_ing', method: 'populateIngredients' },
    { id: 's_menu', method: 'populateMenus' },
    { id: 's_platform', method: 'populatePlatforms' },
    { id: 'm_menu', method: 'populateMenus' },
    { id: 'm_ingredient', method: 'populateIngredients' }
  ];
  
  for (const dd of dropdowns) {
    const element = document.getElementById(dd.id);
    if (element) {
      try {
        await window.dropdownManager[dd.method](element);
        console.log(`✅ ${dd.id}: ${element.options.length} options`);
      } catch (error) {
        console.error(`❌ ${dd.id}:`, error.message);
      }
    }
  }
}

// Run it
forcePopulateAll();
```

---

## 📞 Getting Help

If dropdowns still don't work after testing:

1. **Run comprehensive test:**
   ```
   Open test-dropdown-comprehensive.html
   Wait for tests to complete
   Click "Export Report"
   ```

2. **Run console diagnostic:**
   ```
   Open POS app
   F12 → Console
   Paste dropdown-diagnostic.js
   Run testDropdownPopulation()
   ```

3. **Collect information:**
   - Test results from comprehensive test
   - Console errors (screenshot)
   - Network tab (screenshot of failed requests)
   - Browser and version
   - Environment (GAS or local)

4. **Common solutions:**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Check file paths are correct
   - Verify all files uploaded to GAS
   - Check Code.gs for syntax errors

