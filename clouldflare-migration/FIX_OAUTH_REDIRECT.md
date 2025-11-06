# 🔧 Fix OAuth Google Login Redirect Issue

## Problem: "localhost is currently unreachable"

This happens because Supabase needs to know which URLs are allowed for OAuth redirects.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Find Your Current URL

**If running locally:**
- Open your app in browser
- Check the URL in address bar:
  - `http://localhost:8000` 
  - `http://localhost:3000`
  - `http://127.0.0.1:8000`
  - Or whatever port you're using

**If deployed to Netlify:**
- Your Netlify URL: `https://your-app-name.netlify.app`

### Step 2: Add Redirect URLs to Supabase

1. **Go to Supabase Dashboard:**
   - Visit: [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: `rtfreafhlelpxqwohspq`

2. **Navigate to Authentication Settings:**
   - Click **Authentication** in left sidebar
   - Click **URL Configuration** (under Settings)

3. **Add Your Redirect URLs:**
   
   **For Local Development:**
   ```
   http://localhost:8000
   http://localhost:8000/*
   http://localhost:3000
   http://localhost:3000/*
   http://127.0.0.1:8000
   http://127.0.0.1:8000/*
   ```

   **For Netlify Deployment:**
   ```
   https://your-app-name.netlify.app
   https://your-app-name.netlify.app/*
   ```

   **For Both (Recommended):**
   Add all of the above URLs so it works everywhere!

4. **Save Changes:**
   - Click **Save** button
   - Wait a few seconds for changes to propagate

### Step 3: Test Again

1. **Clear Browser Cache:**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cookies and cache

2. **Try Login Again:**
   - Click "Sign in with Google"
   - Should redirect back to your app successfully

---

## 🎯 Common Redirect URLs

### For Local Development

Add these to Supabase:
```
http://localhost:8000
http://localhost:8000/*
http://localhost:3000
http://localhost:3000/*
http://localhost:8080
http://localhost:8080/*
http://127.0.0.1:8000
http://127.0.0.1:8000/*
```

### For Netlify Deployment

Add your actual Netlify URL:
```
https://your-actual-app-name.netlify.app
https://your-actual-app-name.netlify.app/*
```

### For Custom Domain

If you have a custom domain:
```
https://yourdomain.com
https://yourdomain.com/*
https://www.yourdomain.com
https://www.yourdomain.com/*
```

---

## 📸 Screenshot Guide

### Where to Find URL Configuration:

```
Supabase Dashboard
  └── Your Project (rtfreafhlelpxqwohspq)
      └── Authentication (left sidebar)
          └── Settings
              └── URL Configuration
                  └── Redirect URLs (add here)
```

### What It Looks Like:

```
┌─────────────────────────────────────────┐
│ URL Configuration                       │
├─────────────────────────────────────────┤
│ Site URL:                              │
│ [https://your-app.netlify.app]         │
│                                         │
│ Redirect URLs:                         │
│ [http://localhost:8000          ] [×]  │
│ [http://localhost:8000/*        ] [×]  │
│ [https://your-app.netlify.app   ] [×]  │
│ [https://your-app.netlify.app/* ] [×]  │
│                                         │
│ [+ Add URL]                            │
│                                         │
│ [Save]                                 │
└─────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### Still Getting "localhost unreachable"?

1. **Check the exact URL:**
   - Open browser console (F12)
   - Check what URL is being used
   - Make sure it matches exactly in Supabase

2. **Check for typos:**
   - `localhost` not `localhos` 
   - `http://` not `https://` (for local)
   - Include the port number: `:8000`

3. **Wait for propagation:**
   - Changes can take 1-2 minutes to propagate
   - Try again after waiting

4. **Check Google OAuth Setup:**
   - Supabase Dashboard → Authentication → Providers
   - Make sure Google is enabled
   - Check Google Client ID/Secret are configured

### "Redirect URI mismatch" Error

This means the URL in your code doesn't match Supabase settings:

1. **Check your code:**
   - Open `supabase-config.js`
   - Line 365: `redirectUrl = window.location.origin + window.location.pathname;`
   - This should match one of your Supabase redirect URLs

2. **Debug:**
   - Add console.log to see what URL is being used:
   ```javascript
   console.log("Redirect URL:", redirectUrl);
   ```

3. **Fix:**
   - Make sure that exact URL is in Supabase redirect URLs list

### Works Locally But Not on Netlify?

1. **Add Netlify URL to Supabase:**
   - Get your Netlify URL: `https://your-app.netlify.app`
   - Add to Supabase redirect URLs
   - Include both with and without `/*`:
     - `https://your-app.netlify.app`
     - `https://your-app.netlify.app/*`

2. **Check HTTPS:**
   - Netlify uses HTTPS automatically
   - Make sure you added `https://` not `http://` for Netlify

---

## 🚀 Quick Checklist

Before testing OAuth:

- [ ] Supabase redirect URLs added (for your current URL)
- [ ] Changes saved in Supabase dashboard
- [ ] Waited 1-2 minutes for propagation
- [ ] Cleared browser cache
- [ ] Google OAuth is enabled in Supabase
- [ ] Google Client ID/Secret configured
- [ ] Testing with correct URL (localhost for local, Netlify for deployed)

---

## 💡 Pro Tips

1. **Add Multiple URLs:**
   - Add all URLs you might use (localhost:8000, localhost:3000, Netlify URL)
   - This way it works everywhere!

2. **Use Environment Variables (Advanced):**
   - For production, use different Supabase projects
   - Dev: localhost redirects
   - Prod: Netlify redirects

3. **Test in Incognito:**
   - Use incognito/private mode to test
   - Avoids cache issues

4. **Check Browser Console:**
   - Open DevTools (F12) → Console
   - Look for OAuth errors
   - Check network tab for redirect calls

---

## 📞 Still Having Issues?

### Check These:

1. **Supabase Project Status:**
   - Is project active? (Dashboard → Settings → General)
   - Is project paused? (Free tier pauses after inactivity)

2. **Google OAuth Configuration:**
   - Supabase Dashboard → Authentication → Providers → Google
   - Is it enabled?
   - Are Client ID and Secret correct?

3. **Network Issues:**
   - Can you access Supabase dashboard?
   - Check Supabase status: [status.supabase.com](https://status.supabase.com)

4. **Code Issues:**
   - Check browser console for errors
   - Verify `supabase-config.js` is loading
   - Check if Supabase client is initialized

---

**Need more help?** Check the main `README.md` or `DEPLOYMENT_GUIDE.md`








