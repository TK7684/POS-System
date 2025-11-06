# ⚡ Quick Fix: OAuth "localhost unreachable"

## 🎯 The Problem
After clicking "Sign in with Google", you get redirected to localhost and see "localhost is currently unreachable".

## ✅ The Solution (2 minutes)

### Step 1: Find Your URL

Open your app in browser and check the address bar:
- **Local:** `http://localhost:8000` or `http://localhost:3000`
- **Netlify:** `https://your-app.netlify.app`

### Step 2: Add to Supabase

1. Go to: https://supabase.com/dashboard
2. Select project: `rtfreafhlelpxqwohspq`
3. Click: **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add:

   **If running locally:**
   ```
   http://localhost:8000
   http://localhost:8000/*
   ```

   **If on Netlify:**
   ```
   https://your-app-name.netlify.app
   https://your-app-name.netlify.app/*
   ```

5. Click **Save**
6. Wait 30 seconds

### Step 3: Try Again

1. Clear browser cache (Ctrl+Shift+Delete)
2. Try Google login again
3. ✅ Should work now!

---

## 🔍 Still Not Working?

Check browser console (F12) - you'll see:
```
🔐 OAuth redirect URL: http://localhost:8000
```

Make sure that **exact URL** is in Supabase redirect URLs list!

---

**Full guide:** See `FIX_OAUTH_REDIRECT.md` for detailed troubleshooting






