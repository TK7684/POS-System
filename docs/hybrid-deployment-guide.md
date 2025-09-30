# 🚀 POS Hybrid System Deployment Guide

## Overview
This guide will help you deploy your POS system using the hybrid architecture:
- **Frontend**: Hosted on GitHub Pages (or similar)
- **Backend**: Google Apps Script
- **Features**: PWA, Offline support, Real-time sync

## 📋 Prerequisites
- Google account
- GitHub account
- Your POS system files

---

## 🔧 Step 1: Deploy Google Apps Script Backend

### 1.1 Create New Apps Script Project
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Rename to "POS-API"

### 1.2 Setup Your Sheets
1. Create a new Google Sheets document
2. Create these sheets:
   - `Ingredients`
   - `Purchases` 
   - `Sales`
   - `Menus`
   - `MenuRecipes`
   - `Users`
   - `CostCenters`
   - `Platforms`

### 1.3 Add the API Code
1. Replace `Code.gs` content with `apps-script-api.gs`
2. Add your existing POS functions (addPurchase, addSale, etc.)
3. Update sheet references to match your sheet names

### 1.4 Deploy as Web App
1. Click "Deploy" → "New Deployment"
2. Choose type: "Web app"
3. Settings:
   - Execute as: "Me"
   - Who has access: "Anyone" (for CORS)
4. Click "Deploy"
5. **Copy the Web App URL** - you'll need this!

### 1.5 Test the API
```bash
# Test with curl (replace YOUR_URL)
curl -X POST "YOUR_APPS_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action": "getBootstrapData"}'
```

---

## 🌐 Step 2: Deploy Frontend to GitHub Pages

### 2.1 Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Create new repository: `pos-system`
3. Make it public

### 2.2 Upload Your Files
Upload these files to your repository:
```
pos-system/
├── index.html (use index-hybrid.html)
├── manifest.json
├── sw.js
├── css/
│   ├── critical.css
│   └── components.css
├── js/
│   ├── critical.js
│   ├── api/
│   │   └── PosApiClient.js
│   ├── pos-hybrid-integration.js
│   └── core/
│       └── (all your core modules)
└── offline.html
```

### 2.3 Enable GitHub Pages
1. Go to repository Settings
2. Scroll to "Pages" section
3. Source: "Deploy from a branch"
4. Branch: "main" / "master"
5. Folder: "/ (root)"
6. Click "Save"

### 2.4 Get Your Site URL
Your site will be available at:
`https://YOUR_USERNAME.github.io/pos-system/`

---

## ⚙️ Step 3: Configure the Connection

### 3.1 First-Time Setup
1. Visit your GitHub Pages URL
2. Click the settings button (⚙️)
3. Enter your Apps Script Web App URL
4. Click "Test Connection"
5. If successful, click "Save"

### 3.2 Verify PWA Features
1. Open your site on mobile
2. Look for "Install App" prompt
3. Test offline functionality
4. Verify sync when back online

---

## 🧪 Step 4: Testing Checklist

### ✅ Backend Tests
- [ ] Apps Script deploys without errors
- [ ] API responds to test requests
- [ ] CORS headers are working
- [ ] All endpoints return proper JSON

### ✅ Frontend Tests  
- [ ] Site loads on GitHub Pages
- [ ] PWA manifest is accessible
- [ ] Service worker registers
- [ ] Install prompt appears
- [ ] Offline mode works
- [ ] API connection successful

### ✅ Integration Tests
- [ ] Can add purchases online
- [ ] Can add sales online  
- [ ] Data syncs when offline→online
- [ ] Reports load correctly
- [ ] Error handling works

---

## 🔧 Step 5: Advanced Configuration

### 5.1 Custom Domain (Optional)
If you have your own domain:
1. Add CNAME file to repository
2. Configure DNS settings
3. Update manifest.json URLs

### 5.2 Environment Variables
For different environments (dev/prod):

```javascript
// In your frontend
const CONFIG = {
  development: {
    apiUrl: 'https://script.google.com/macros/s/DEV_SCRIPT_ID/exec'
  },
  production: {
    apiUrl: 'https://script.google.com/macros/s/PROD_SCRIPT_ID/exec'
  }
};

const currentConfig = CONFIG[window.location.hostname.includes('localhost') ? 'development' : 'production'];
```

### 5.3 Analytics (Optional)
Add Google Analytics to track usage:

```html
<!-- In your index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
**Problem**: "Access to fetch blocked by CORS policy"
**Solution**: 
- Ensure Apps Script is deployed with "Anyone" access
- Check that you're using POST requests
- Verify the correct Apps Script URL

#### 2. Apps Script Timeout
**Problem**: Requests taking too long
**Solution**:
- Optimize your Apps Script functions
- Add caching to reduce Sheets API calls
- Implement request batching

#### 3. PWA Not Installing
**Problem**: Install prompt doesn't appear
**Solution**:
- Check manifest.json is accessible
- Verify HTTPS (required for PWA)
- Ensure service worker is registered
- Check browser developer tools for errors

#### 4. Offline Sync Issues
**Problem**: Data not syncing when back online
**Solution**:
- Check localStorage for queued operations
- Verify online/offline event listeners
- Test API connectivity manually

### Debug Tools

#### Check API Status
```javascript
// In browser console
window.posHybridSystem.getStatus()
```

#### View Offline Queue
```javascript
// In browser console
JSON.parse(localStorage.getItem('pos-offline-queue'))
```

#### Test API Directly
```javascript
// In browser console
const client = new PosApiClient('YOUR_API_URL');
client.testConnection().then(console.log);
```

---

## 📊 Monitoring & Maintenance

### 1. Apps Script Quotas
Monitor your usage:
- Script runtime: 6 min/execution
- Triggers: 20/script
- Email: 100/day

### 2. GitHub Pages Limits
- 1GB storage
- 100GB bandwidth/month
- 10 builds/hour

### 3. Performance Monitoring
Add performance tracking:

```javascript
// Track API response times
const startTime = performance.now();
await apiCall();
const duration = performance.now() - startTime;
console.log(`API call took ${duration}ms`);
```

---

## 🎉 Success!

Once deployed, your POS system will have:

✅ **PWA Features**: Install as app, offline support
✅ **Real-time Sync**: Automatic data synchronization  
✅ **Scalable Backend**: Google Apps Script handles the load
✅ **Fast Frontend**: Static hosting for optimal performance
✅ **Mobile Optimized**: Works great on phones and tablets

Your users can now:
- Install the app on their devices
- Work offline when internet is poor
- Have data automatically sync when back online
- Enjoy fast, native-like experience

## 🔗 Quick Links

- **Frontend URL**: `https://YOUR_USERNAME.github.io/pos-system/`
- **Apps Script**: `https://script.google.com/home/projects/YOUR_PROJECT_ID`
- **API URL**: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`

Happy coding! 🚀