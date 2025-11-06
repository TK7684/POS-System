# 🚀 Quick Deploy Guide

## Option 1: Cloudflare Pages (Recommended - Free)

### Step 1: Push to Git
```bash
git push origin main
```

### Step 2: Deploy on Cloudflare Pages

1. **Go to:** https://dash.cloudflare.com/
2. **Navigate to:** Workers & Pages → Create Application → Pages → Connect to Git
3. **Select your repository** and branch (main)
4. **Build Settings:**
   - Framework preset: `None`
   - Build command: (leave empty)
   - Build output directory: `.`
   - Root directory: `clouldflare-migration` (or leave empty if root)

5. **Click "Save and Deploy"**

### Step 3: Add Environment Variables

After first deployment, go to:
**Pages → Your Project → Settings → Environment Variables**

Add these (Production):
```
SUPABASE_URL=https://rtfreafhlelpxqwohspq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=(your service role key from Supabase)
GOOGLE_CLOUD_API_KEY=AIzaSyBGZhBGZjZNlH7sbPcGfeUKaOQDQsBSFHE
HUGGING_FACE_API_KEY=(your Hugging Face key if you have one)
LINE_CHANNEL_ACCESS_TOKEN=(your LINE token)
LINE_CHANNEL_SECRET=(your LINE secret)
```

### Step 4: Redeploy

After adding environment variables, trigger a new deployment:
**Pages → Your Project → Deployments → Retry deployment**

---

## Option 2: Netlify Drop (Fastest - 30 seconds)

1. **Go to:** https://app.netlify.com/drop
2. **Drag & drop** the `clouldflare-migration` folder
3. **Wait 30 seconds** - You'll get a URL
4. **Done!** ✅

**Note:** For Netlify, you'll need to add environment variables in:
**Site settings → Environment variables**

---

## Option 3: Vercel (Alternative)

1. **Go to:** https://vercel.com/
2. **Import Git Repository**
3. **Root Directory:** `clouldflare-migration`
4. **Deploy**

---

## ✅ After Deployment

1. **Test the site** - Make sure all features work
2. **Check mobile view** - Test on phone
3. **Verify AI chatbot** - Test with Google Gemini API
4. **Test CSV import** - Try uploading your expenses CSV
5. **Check expenses tab** - Make sure it works on mobile

---

## 🔧 Troubleshooting

### Build Fails?
- Check that all files are in the repository
- Verify `index.html` is in the root
- Check build logs for errors

### Functions Not Working?
- Verify environment variables are set
- Check Cloudflare Workers logs
- Ensure `functions/` folder is included

### Mobile Issues?
- Clear browser cache
- Test in incognito mode
- Check browser console for errors

---

## 📱 Install as PWA

After deployment:
1. Open the site on your phone
2. **iPhone:** Safari → Share → Add to Home Screen
3. **Android:** Chrome → Menu → Add to Home Screen

---

Your site will be live at: `https://your-project.pages.dev` (Cloudflare) or `https://your-project.netlify.app` (Netlify)

