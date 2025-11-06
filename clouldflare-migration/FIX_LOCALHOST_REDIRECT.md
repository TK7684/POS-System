# 🔧 Fix: OAuth Keeps Redirecting to localhost:3000

## 🎯 The Problem
Even after updating redirect URLs in Supabase, OAuth still redirects to `http://localhost:3000/?code=...` instead of your Cloudflare Pages URL.

## ✅ The Solution (3 Critical Steps)

### Step 1: Update Site URL (CRITICAL - Most Common Issue!)

The **Site URL** setting in Supabase can override your redirect URLs. This is often the culprit!

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `rtfreafhlelpxqwohspq`

2. **Navigate to Site URL:**
   - Click **Authentication** in left sidebar
   - Click **URL Configuration** (under Settings)
   - Look for **Site URL** field (at the top, above Redirect URLs)

3. **Update Site URL:**
   - **Current (WRONG):** `http://localhost:3000`
   - **Should be:** `https://pos-admin-bho.pages.dev`
   - ⚠️ **MUST include `https://` prefix!**

4. **Click Save**

### Step 2: Verify Redirect URLs

Make sure your Redirect URLs list has:

```
https://pos-admin-bho.pages.dev
https://pos-admin-bho.pages.dev/*
```

⚠️ **Important:**
- Must include `https://` prefix (not just `pos-admin-bho.pages.dev`)
- Include both with and without `/*` wildcard
- Remove `http://localhost:3000` if you don't need it

### Step 3: Check Google OAuth Provider Settings

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Providers**
   - Click on **Google** provider
   - Check if there's a "Redirect URI" field
   - If present, make sure it's set to: `https://pos-admin-bho.pages.dev` or leave it empty to use the Site URL

2. **In Google Cloud Console (if needed):**
   - Go to: https://console.cloud.google.com
   - Navigate to **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID (the one used by Supabase)
   - Click to edit it
   - Under **Authorized redirect URIs**, make sure you have:
     ```
     https://rtfreafhlelpxqwohspq.supabase.co/auth/v1/callback
     ```
   - ⚠️ **Note:** The redirect URI should point to Supabase, not directly to your app. Supabase handles the redirect to your app.

### Step 4: Clear Cache and Test

1. **Wait 1-2 minutes** for changes to propagate
2. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cookies and cache for the site
3. **Try OAuth again**

---

## 🔍 Debugging Steps

### Check What URL Is Being Used

1. Open browser console (F12)
2. Click "Sign in with Google"
3. Look for this log message:
   ```
   🔐 OAuth redirect URL: https://pos-admin-bho.pages.dev
   ```
4. Make sure this exact URL matches what's in Supabase

### If Still Redirecting to localhost:3000

1. **Check browser console** for any errors
2. **Check Network tab** in DevTools:
   - Look for the OAuth request
   - Check the `redirect_to` parameter in the request
3. **Verify Site URL** is correct (not `localhost:3000`)
4. **Check if there are multiple Supabase projects** - make sure you're editing the right one

---

## 🚨 Common Mistakes

### ❌ Wrong Site URL:
```
http://localhost:3000
pos-admin-bho.pages.dev
```

### ✅ Correct Site URL:
```
https://pos-admin-bho.pages.dev
```

### ❌ Wrong Redirect URLs:
```
pos-admin-bho.pages.dev
http://pos-admin-bho.pages.dev
```

### ✅ Correct Redirect URLs:
```
https://pos-admin-bho.pages.dev
https://pos-admin-bho.pages.dev/*
```

---

## 📋 Quick Checklist

Before testing OAuth:

- [ ] **Site URL** is set to `https://pos-admin-bho.pages.dev` (with https://)
- [ ] **Redirect URLs** include:
  - [ ] `https://pos-admin-bho.pages.dev`
  - [ ] `https://pos-admin-bho.pages.dev/*`
- [ ] Both settings are **saved** in Supabase
- [ ] Waited **1-2 minutes** for propagation
- [ ] **Cleared browser cache** and cookies
- [ ] Google OAuth provider is **enabled** in Supabase

---

## 💡 Why This Happens

Supabase uses the **Site URL** as the default redirect destination for OAuth flows. Even if you specify a different `redirectTo` in your code, if the Site URL is set to `localhost:3000`, Supabase may still redirect there.

The Site URL should match your production URL (Cloudflare Pages), and you can add additional redirect URLs for development environments.

---

## 🆘 Still Not Working?

If you've completed all steps and it's still redirecting to localhost:

1. **Double-check the Site URL** - this is the #1 cause
2. **Check browser console** for the actual redirect URL being used
3. **Verify you're editing the correct Supabase project**
4. **Try in an incognito/private window** to rule out cache issues
5. **Check if there's a service worker** interfering - try disabling it temporarily

---

**Need more help?** Check `FIX_OAUTH_REDIRECT.md` for detailed troubleshooting.

