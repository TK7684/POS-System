# 🔧 API Keys Fix - Cloudflare Pages Function Routing

## Issue
The `/api-keys.js` route is returning HTML (404) instead of JavaScript, causing:
```
Refused to execute script from 'https://pos-admin-bho.pages.dev/api-keys.js' 
because its MIME type ('text/html') is not executable
```

## Solution

### Option 1: Verify Function Route (Recommended)
Cloudflare Pages Functions in `/functions` folder should be automatically routed. 

**Check:**
1. Go to Cloudflare Dashboard → Workers & Pages → pos-admin-bho
2. Check Functions tab - you should see `api-keys` listed
3. The route should be: `https://pos-admin-bho.pages.dev/api-keys.js`

**If function is not listed:**
- Make sure `functions/api-keys.js` exists in your repository
- Redeploy the site
- Check build logs for any errors

### Option 2: Use Different Route Name
If `/api-keys.js` doesn't work, try:
- `/api/api-keys` (create `functions/api/api-keys.js`)
- `/get-api-keys` (rename to `functions/get-api-keys.js`)

### Option 3: Manual Verification
Test the function directly:
```bash
curl https://pos-admin-bho.pages.dev/api-keys.js
```

Should return JavaScript code, not HTML.

## Environment Variables
Make sure these are set in Cloudflare Pages:
1. Go to: Settings → Environment Variables
2. Add for **Production**:
   - `GOOGLE_CLOUD_API_KEY` = (your Google Gemini API key)
   - `HUGGING_FACE_API_KEY` = (your Hugging Face API key)

## Debugging
Open browser console and check:
1. Network tab → Look for `/api-keys.js` request
2. Check response headers → Should be `Content-Type: application/javascript`
3. Check response body → Should be JavaScript code, not HTML

## Current Status
✅ Function code is correct
✅ Headers are set properly
⏳ Waiting for Cloudflare to recognize the function route

