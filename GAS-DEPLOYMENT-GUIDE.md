# 📤 Google Apps Script Deployment Guide

## 🎯 Files to Upload to Google Apps Script

Google Apps Script requires you to upload files through their web editor. Here's exactly what you need:

---

## 📋 Required Files (Upload These)

### **1. Code.gs** 
- ✅ Already exists in `gas/Code.gs`
- This is your backend Google Apps Script code
- **Action:** Copy content from `gas/Code.gs` and paste into GAS editor

### **2. Index.html**
- ✅ Modified version at `gas/Index.html`
- This is your main HTML interface
- **Action:** Copy content from `gas/Index.html` and paste into GAS editor as `Index.html`

### **3. CacheManager.html** (NEW - Create this)
- Source: `CacheManager.js`
- **Action:** 
  1. In GAS editor, create new HTML file called `CacheManager`
  2. Copy entire content from `CacheManager.js`
  3. Paste into `CacheManager.html`
  4. Remove the file extension - name it just `CacheManager`

### **4. Critical.html** (NEW - Create this)
- Source: `js/critical.js`
- **Action:**
  1. In GAS editor, create new HTML file called `Critical`
  2. Copy entire content from `js/critical.js`
  3. Paste into `Critical.html`
  4. Remove the file extension - name it just `Critical`

### **5. appsscript.json** (Optional)
- ✅ Already exists in `gas/appsscript.json`
- **Action:** Copy if you need specific settings

---

## 🚀 Step-by-Step Deployment

### **Step 1: Open Google Apps Script**
1. Go to https://script.google.com
2. Open your POS project (or create new one)

### **Step 2: Upload Backend Code**
1. Open or create `Code.gs`
2. Copy content from `gas/Code.gs`
3. Paste into GAS editor

### **Step 3: Upload Main HTML**
1. Click `+` next to Files
2. Select "HTML"
3. Name it `Index`
4. Copy content from `gas/Index.html`
5. Paste into editor

### **Step 4: Create CacheManager Include**
1. Click `+` next to Files
2. Select "HTML"
3. Name it `CacheManager` (no .html extension)
4. Copy **entire content** from `CacheManager.js`
5. Paste into editor

### **Step 5: Create Critical Include**
1. Click `+` next to Files
2. Select "HTML"
3. Name it `Critical` (no .html extension)
4. Copy **entire content** from `js/critical.js`
5. Paste into editor

---

## 📁 Your GAS Project Should Look Like This:

```
📁 Your POS Project (in GAS Editor)
├── 📄 Code.gs              ← Backend script
├── 📄 Index.html           ← Main interface
├── 📄 CacheManager         ← CacheManager code (as HTML file)
├── 📄 Critical             ← Critical.js code (as HTML file)
└── 📄 appsscript.json     ← Optional manifest
```

---

## 🔧 How It Works

The `gas/Index.html` uses Google Apps Script's template syntax:

```html
<script>
  <?!= HtmlService.createHtmlOutputFromFile('CacheManager').getContent(); ?>
</script>
<script>
  <?!= HtmlService.createHtmlOutputFromFile('Critical').getContent(); ?>
</script>
```

This tells GAS to:
1. Read the `CacheManager` HTML file
2. Insert its content inline into Index.html
3. Do the same for `Critical`

---

## ⚠️ Important Notes

### **File Naming in GAS**
- GAS automatically adds `.html` extension
- When you create "CacheManager", it becomes "CacheManager.html"
- But you reference it as just "CacheManager" in code

### **What NOT to Upload**
❌ Don't upload these (they won't work in GAS):
- `css/` folder
- `js/` folder structure
- `manifest.json`
- `sw.js` (service worker)
- Any other external files

### **Modules and Dependencies**
The current setup includes the critical files. If you need additional modules:

**For PurchaseModule, SaleModule, MenuModule:**
1. Create new HTML files in GAS: `PurchaseModule`, `SaleModule`, `MenuModule`
2. Copy content from respective `.js` files
3. Include them in `Critical.html` using:
```javascript
<?!= HtmlService.createHtmlOutputFromFile('PurchaseModule').getContent(); ?>
```

---

## ✅ Testing Your Deployment

After uploading:

1. Click **Deploy** > **Test deployments**
2. Click **Open** to test the web app
3. Check that dropdowns populate with data
4. Verify all tabs work correctly
5. Check browser console for errors

---

## 🐛 Troubleshooting

### "ReferenceError: CacheManager is not defined"
- Make sure `CacheManager` HTML file exists
- Check that Index.html includes the scriptlet correctly

### "Module not found" errors
- Create HTML files for each module needed
- Include them in the proper order in Index.html

### Dropdowns still not working
- Check that `Code.gs` has the backend functions
- Verify your Google Sheet is properly configured
- Check browser console for specific errors

---

## 📦 Quick Summary

**Total Files to Upload:** 4-5 files

1. ✅ `Code.gs` - Backend
2. ✅ `Index.html` - Main UI
3. ✅ `CacheManager` - Cache management
4. ✅ `Critical` - Core functionality
5. ⚠️ `appsscript.json` - Optional

**That's it!** Google Apps Script will combine everything into one web app.

