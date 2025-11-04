# Google Apps Script Deployment Guide

## 🚀 Complete Deployment Steps

### Step 1: Update Google Apps Script Code

1. **Open Google Apps Script** (script.google.com)
2. **Open your POS project**
3. **Replace Code.gs content** with the entire content from `Complete-Code.gs`
4. **Save the project** (Ctrl+S)

### Step 2: Update HTML File

1. **In Google Apps Script**, find your `Index.html` file
2. **Replace the content** with the updated `Index.html` from this project
3. **Save the file**

### Step 3: Test Backend Functions

1. **In Apps Script editor**, run this function:
   ```javascript
   quickSetupDropdownSheets()
   ```
2. **Check execution log** - should show:
   ```
   🚀 Starting quick setup for dropdown functionality...
   📊 Sheet verification completed:
   - Total sheets: 8
   - Existing: X
   - Created: Y
   - Fixed: Z
   - Errors: 0
   🧪 Testing dropdown functions...
   ✅ Setup completed!
   Test results: 4/4 tests passed
   ```

### Step 4: Deploy Web App

1. **Click Deploy** → **New Deployment**
2. **Choose type:** Web app
3. **Execute as:** Me (your email)
4. **Who has access:** Anyone with Google account
5. **Click Deploy**
6. **Copy the Web App URL**

### Step 5: Test the Application

1. **Open the Web App URL** in your browser
2. **Navigate to Purchase screen** (📦 ซื้อ)
3. **Check if ingredient dropdown loads**
4. **Select an ingredient** → unit should auto-populate
5. **Navigate to Sale screen** (💰 ขาย)
6. **Check if menu and platform dropdowns load**
7. **Select a menu** → price should auto-populate

## 🔧 Troubleshooting

### If Dropdowns Don't Load:

1. **Open browser console** (F12)
2. **Look for error messages**
3. **Click the red "🔧 Fix" button** in top-right corner
4. **Or run in console:**
   ```javascript
   fixDropdowns()
   ```

### If Backend Test Fails:

1. **Check sheet permissions**
2. **Verify Google Sheets structure**
3. **Run in Apps Script:**
   ```javascript
   testDropdownFunctions()
   ```

### Common Issues:

#### Issue: "Sheet not found" errors
**Solution:** Run `quickSetupDropdownSheets()` in Apps Script

#### Issue: Empty dropdowns
**Solution:** 
1. Check if sample data was created
2. Verify sheet column names match expected format
3. Run `clearDropdownCache()` and try again

#### Issue: Auto-population not working
**Solution:**
1. Check browser console for JavaScript errors
2. Click "🔧 Fix" button to reinitialize
3. Refresh the page

## 📊 Expected Results

### Backend Test Results:
```
✅ getIngredients: 3 items
✅ getMenus: 3 items  
✅ getPlatforms: 5 items
✅ getMenuIngredients: working
```

### Frontend Console Output:
```
🔧 Setting up dropdown initialization for Google Apps Script...
✅ DropdownManager created
✅ DropdownManager ready
🔧 Initializing purchase dropdowns...
✅ Purchase dropdowns initialized
✅ Unit auto-populated for: กุ้ง
```

## 🎯 Success Checklist

- [ ] Backend functions return data (run `testDropdownFunctions()`)
- [ ] Web app deploys without errors
- [ ] Purchase screen: ingredient dropdown loads
- [ ] Purchase screen: selecting ingredient auto-fills unit
- [ ] Sale screen: menu and platform dropdowns load
- [ ] Sale screen: selecting menu auto-fills price
- [ ] Menu screen: dropdowns load and menu selection shows ingredients
- [ ] Console shows success messages (no errors)

## 📞 Debug Commands

Run these in browser console if needed:

```javascript
// Check dropdown status
console.log('DropdownManager:', !!window.dropdownManager);
console.log('CacheManager:', !!window.cacheManager);

// Fix dropdowns manually
fixDropdowns()

// Test dropdown functions
testDropdowns()

// Check current screen
console.log('Active screen:', document.querySelector('[id$="-screen"]:not(.hide)')?.id);
```

## 🆘 Emergency Reset

If everything fails:

1. **In Apps Script**, run:
   ```javascript
   clearDropdownCache()
   quickSetupDropdownSheets()
   ```

2. **In browser console**, run:
   ```javascript
   // Force recreate DropdownManager
   if (window.CacheManager && window.DropdownManager) {
     window.cacheManager = new CacheManager();
     window.dropdownManager = new DropdownManager(window.cacheManager);
     fixDropdowns();
   }
   ```

3. **Hard refresh browser** (Ctrl+F5)

The dropdown functionality should now work correctly in your Google Apps Script environment!