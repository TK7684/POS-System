# Complete Deployment Guide for POS System with AI Integration

## 📋 Pre-Deployment Checklist

### 1. Files to Copy to Google Apps Script

You need to copy **2 main files** to your Google Apps Script project:

#### File 1: Updated Code.gs (Primary)
- Copy the entire content of `gas/Code.gs` to your Apps Script project as `Code.gs`
- This file now includes:
  - All original POS functionality
  - **Improved AI Agent functions** with enhanced error handling
  - **Duplicate detection** for purchases and expenses
  - **Auto-categorization** for expenses
  - **Fuzzy matching** for ingredients and menus
  - **Performance monitoring** and caching
  - **Timeout protection** for AI operations

#### File 2: Updated Index.html (Frontend)
- Copy the entire content of `gas/Index.html` to your Apps Script project as `Index.html`
- This file now includes:
  - **AI Status Indicator** for real-time feedback
  - **AI Assistant buttons** for quick actions
  - **Enhanced mobile optimization**
  - **Responsive design** improvements
  - **Accessibility features**

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Google Apps Script

1. **Open Google Apps Script** (script.google.com)
2. **Create new project** or open existing POS project
3. **Replace Code.gs** with the updated content from `gas/Code.gs`
4. **Replace Index.html** with the updated content from `gas/Index.html`
5. **Save the project** (Ctrl+S)

### Step 2: Auto-Setup Sheet Structure

After copying the code, run these functions in the Apps Script editor:

```javascript
// Run this first to verify and setup sheets
quickSetupDropdownSheets()

// Run this to test AI functionality
testAIProcessing()

// Run this to test purchase flow
testPurchaseFlow()

// Run this to test expense flow
testExpenseFlow()
```

These functions will:
- ✅ Check all required sheets exist
- ✅ Create missing sheets with proper headers
- ✅ Add sample data if sheets are empty
- ✅ Test all dropdown functions
- ✅ Test AI Agent integration
- ✅ Report any issues

### Step 3: Manual Sheet Verification

If you prefer to check manually, ensure these sheets exist with these **exact column names**:

#### Ingredients Sheet
**Required columns:**
- `id` - Ingredient ID (e.g., "ING001")
- `name` - Ingredient name (e.g., "กุ้ง")
- `stock_unit` - Stock unit (e.g., "piece")
- `buy_unit` - Buying unit (e.g., "kg") 
- `buy_to_stock_ratio` - Conversion ratio (e.g., 43)

**Optional columns:**
- `min_stock` - Minimum stock level
- `category` - Ingredient category
- `supplier` - Supplier name

#### Menus Sheet
**Required columns:**
- `menu_id` - Menu ID (e.g., "MENU001")
- `name` - Menu name (e.g., "กุ้งแซ่บ")
- `price` - Menu price (e.g., 120)

**Alternative Thai columns (also supported):**
- `เมนู` - Menu name
- `ราคา` - Price

#### MenuRecipes Sheet
**Required columns:**
- `menu_id` - Menu ID (e.g., "MENU001")
- `ingredient_id` - Ingredient ID (e.g., "ING001")
- `quantity` - Quantity needed (e.g., 5)
- `unit` - Unit (e.g., "piece")

#### Platforms Sheet (Optional)
**Required columns:**
- `id` - Platform ID (e.g., "walkin")
- `name` - Platform name (e.g., "Walk-in")

**If this sheet doesn't exist, default platforms will be used:**
- Walk-in, Grab, Line Man, Shopee Food, Foodpanda

### Step 4: Deploy Web App

1. **Click Deploy** → **New Deployment**
2. **Choose type:** Web app
3. **Execute as:** Me (your email)
4. **Who has access:** Anyone with Google account (or Anyone)
5. **Click Deploy**
6. **Copy the Web App URL** - you'll need this for frontend

### Step 5: Test Backend Functions

Run these test functions in Apps Script editor:

```javascript
// Test individual functions
testDropdownFunctions()

// Test with sheet verification
testDropdownFunctionsWithSheets()

// Test specific function
console.log(getIngredients())
console.log(getMenus())
console.log(getPlatforms())
```

### Step 6: Update Frontend Configuration

Update your frontend configuration with the new Web App URL:

```javascript
// In your frontend config
window.APP_CONFIG = {
  api: {
    baseURL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'
  }
  // ... other config
}
```

## 🔧 Troubleshooting Common Issues

### Issue 1: "Sheet not found" errors

**Solution:** Run `quickSetupDropdownSheets()` to auto-create missing sheets

### Issue 2: Column name mismatches

The updated functions support multiple column name variations:

**For Ingredients:**
- `id` OR `ingredient_id` OR `ID`
- `name` OR `ingredient_name` OR `ชื่อ`
- `stock_unit` OR `หน่วยสต๊อก`
- `buy_unit` OR `หน่วยซื้อ`

**For Menus:**
- `menu_id` OR `id` OR `ID`
- `name` OR `เมนู` OR `menu_name`
- `price` OR `ราคา` OR `selling_price`

### Issue 3: Empty dropdowns

1. **Check data exists:** Ensure sheets have data rows (not just headers)
2. **Run test function:** `testDropdownFunctionsWithSheets()`
3. **Check console logs:** Look for error messages in Apps Script execution log
4. **Clear cache:** Run `clearDropdownCache()`

### Issue 4: Permission errors

1. **Check execution permissions:** Ensure web app executes as "Me"
2. **Check access permissions:** Set to "Anyone with Google account"
3. **Re-deploy:** Create new deployment if permissions changed

## 📊 Sample Data Structure

### Ingredients Sheet Example:
| id | name | stock_unit | buy_unit | buy_to_stock_ratio |
|----|------|------------|----------|-------------------|
| ING001 | กุ้ง | piece | kg | 43 |
| ING002 | น้ำปลา | ml | bottle | 700 |
| ING003 | พริกแกง | g | pack | 100 |

### Menus Sheet Example:
| menu_id | name | price |
|---------|------|-------|
| MENU001 | กุ้งแซ่บ | 120 |
| MENU002 | ส้มตำกุ้ง | 80 |
| MENU003 | ลาบกุ้ง | 100 |

### MenuRecipes Sheet Example:
| menu_id | ingredient_id | quantity | unit |
|---------|---------------|----------|------|
| MENU001 | ING001 | 5 | piece |
| MENU001 | ING002 | 10 | ml |
| MENU002 | ING001 | 3 | piece |

## ✅ Verification Checklist

After deployment, verify these work:

- [ ] `getIngredients()` returns ingredient array
- [ ] `getMenus()` returns menu array  
- [ ] `getPlatforms()` returns platform array
- [ ] `getMenuIngredients('MENU001')` returns ingredients for menu
- [ ] Frontend dropdowns populate correctly
- [ ] Auto-population works (ingredient→unit, menu→price)
- [ ] Error handling works (disconnect internet and test)
- [ ] Cache works (second load should be faster)

## 🆘 Emergency Rollback

If something goes wrong:

1. **Revert Apps Script:** Restore previous Code.gs version
2. **Disable dropdown features:** Comment out DropdownManager initialization in frontend
3. **Use static dropdowns:** Temporarily use hardcoded dropdown options

## 📞 Support

If you encounter issues:

1. **Check execution logs** in Apps Script editor
2. **Run diagnostic functions:** `testDropdownFunctionsWithSheets()`
3. **Verify sheet structure:** Use `verifyAndFixSheetStructure()`
4. **Check frontend console** for JavaScript errors

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Dropdowns load automatically when switching screens
- ✅ Selecting ingredient auto-fills unit dropdown
- ✅ Selecting menu auto-fills price field
- ✅ Error messages appear in Thai when offline
- ✅ Retry buttons work when there are connection issues
- ✅ Data refreshes every 5 minutes automatically