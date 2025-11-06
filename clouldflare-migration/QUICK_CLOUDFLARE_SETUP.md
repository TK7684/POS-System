# 🚀 Quick Cloudflare Pages Setup (5 Minutes)

## Step 1: Sign Up (1 minute)
1. Go to: https://dash.cloudflare.com/sign-up
2. Sign up with email or GitHub
3. Verify email

## Step 2: Connect Repository (2 minutes)
1. Go to: **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**
2. Select **GitHub** (or your Git provider)
3. Authorize Cloudflare
4. Select repository: `supabase-migration`
5. Click **Begin setup**

## Step 3: Configure Build (1 minute)
**Build Settings:**
- **Framework preset**: `None`
- **Build command**: (leave empty - no build needed)
- **Build output directory**: `.` (root)
- **Root directory**: `firebase-version/supabase-migration` ⚠️ **IMPORTANT: Set this to your project subdirectory**

Click **Save and Deploy**

## Step 4: Add Environment Variables (1 minute)
1. After first deployment, go to: **Pages** → **Your Project** → **Settings** → **Environment Variables**
2. Add these (Production):

```
LINE_CHANNEL_SECRET = 5b2672bda43572ec8f2d5c4cb96c53d9
LINE_CHANNEL_ACCESS_TOKEN = r/DiyiGj+YDZ5VBLH4GUcRBahv4TIAj3naSZKlCjmwwnsfyzSYLAg3ZoEI7WXBkE0cZzsTDtKJnkNF5ZZ4mZHIrnHn1DETTfIVAIEIW2bqOu7Vd/pNWYrA2Ub2PifQM5b07S/GBp5S+YQPQ47Fqy1AdB04t89/1O/w1cDnyilFU=
SUPABASE_URL = https://rtfreafhlelpxqwohspq.supabase.co
SUPABASE_SERVICE_ROLE_KEY = (get from Supabase Dashboard → Settings → API → service_role key)
HUGGING_FACE_API_KEY = hf_YOUR_HUGGING_FACE_API_KEY_HERE
GOOGLE_CLOUD_API_KEY = AIzaSyBGZhBGZjZNlH7sbPcGfeUKaOQDQsBSFHE
LINE_GROUP_ID = (your LINE group ID - get after adding bot to group)
```

3. Click **Save**

## Step 5: Update LINE Webhook (1 minute)
1. Go to: LINE Developers Console → Your Channel → Messaging API
2. Update **Webhook URL** to: `https://pos-admin-bho.pages.dev/line-webhook`
   (Replace `your-project` with your actual Cloudflare Pages project name)
3. Click **Update** → **Verify** (should show "Success")
4. Enable **Use webhook**

## ✅ Done!

Your site is live at: `https://your-project.pages.dev`

**Functions automatically available at:**
- `https://your-project.pages.dev/line-webhook` (LINE Bot webhook)
- `https://your-project.pages.dev/midnight-stock-alert` (Stock alert)

---

## 🔧 Cloudflare Workers Functions Setup

Cloudflare Pages automatically detects functions in the `functions/` folder.

**Your functions are already converted:**
- ✅ `functions/line-webhook.js` - LINE Bot webhook
- ✅ `functions/midnight-stock-alert.js` - Daily stock alerts

**No additional setup needed!** They'll work automatically.

---

## 📝 Scheduled Functions (Stock Alert)

For the midnight stock alert, you can:

**Option 1: Use Cron Trigger (Cloudflare Workers)**
1. Create a separate Worker
2. Add Cron Trigger: `0 0 * * *` (daily at midnight UTC)
3. Copy code from `functions/midnight-stock-alert.js`

**Option 2: Use External Cron Service (Free)**
- Use cron-job.org to call: `https://your-project.pages.dev/midnight-stock-alert`
- Schedule: Daily at 00:00 UTC (7 AM Thailand time)

---

## 🎉 Benefits Over Netlify

- ✅ **500 builds/month** (vs Netlify's 300 credits = ~20 deploys)
- ✅ **Unlimited bandwidth** (vs Netlify's 100GB)
- ✅ **Unlimited requests**
- ✅ **100K Worker requests/day**
- ✅ **No credit limits**
- ✅ **Unlimited team members**

---

## 🆘 Troubleshooting

**Function not working?**
- Check Cloudflare Dashboard → Workers → Logs
- Verify environment variables are set
- Check function route matches

**Webhook not receiving?**
- Verify webhook URL in LINE Console
- Check Cloudflare Worker logs
- Test with: `curl -X POST https://your-project.pages.dev/line-webhook`

**Build fails?**
- Check build logs in Cloudflare Dashboard
- Ensure all files are committed to Git

---

**Your POS system is now on Cloudflare Pages - completely free! 🎉**

