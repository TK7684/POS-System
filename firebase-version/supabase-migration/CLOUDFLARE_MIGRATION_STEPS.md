# 🚀 Cloudflare Pages Migration Steps

Complete guide to migrate from Netlify to Cloudflare Pages (100% Free).

---

## Step 1: Create Cloudflare Account

1. Go to: https://dash.cloudflare.com/sign-up
2. Sign up with email or GitHub
3. Verify your email

---

## Step 2: Connect Your Repository

1. Go to: Cloudflare Dashboard → Workers & Pages → Create Application → Pages → Connect to Git
2. Select your Git provider (GitHub/GitLab/Bitbucket)
3. Authorize Cloudflare
4. Select your repository: `supabase-migration`
5. Click "Begin setup"

---

## Step 3: Configure Build Settings

**Build Settings:**
- **Framework preset**: None
- **Build command**: (leave empty)
- **Build output directory**: `.` (root directory)
- **Root directory**: `firebase-version/supabase-migration` ⚠️ **IMPORTANT: Set this to your project subdirectory**

**Environment Variables:**
Click "Save and Deploy" first, then add environment variables:

1. Go to: Pages → Your Project → Settings → Environment Variables
2. Add these variables (Production):

```
LINE_CHANNEL_SECRET = 5b2672bda43572ec8f2d5c4cb96c53d9
LINE_CHANNEL_ACCESS_TOKEN = r/DiyiGj+YDZ5VBLH4GUcRBahv4TIAj3naSZKlCjmwwnsfyzSYLAg3ZoEI7WXBkE0cZzsTDtKJnkNF5ZZ4mZHIrnHn1DETTfIVAIEIW2bqOu7Vd/pNWYrA2Ub2PifQM5b07S/GBp5S+YQPQ47Fqy1AdB04t89/1O/w1cDnyilFU=
SUPABASE_URL = https://rtfreafhlelpxqwohspq.supabase.co
SUPABASE_SERVICE_ROLE_KEY = (your service role key)
HUGGING_FACE_API_KEY = hf_YOUR_HUGGING_FACE_API_KEY_HERE
GOOGLE_CLOUD_API_KEY = AIzaSyBGZhBGZjZNlH7sbPcGfeUKaOQDQsBSFHE
LINE_GROUP_ID = (your LINE group ID)
```

---

## Step 4: Setup Cloudflare Workers (Functions)

Cloudflare Pages uses **Functions** (similar to Netlify Functions).

### Option A: Using Functions Folder (Recommended)

1. The `functions/` folder I created will automatically be detected
2. Cloudflare will create routes:
   - `/functions/line-webhook.js` → Available at: `https://your-site.pages.dev/line-webhook`

### Option B: Manual Setup

1. Go to: Workers & Pages → Create → Worker
2. Name: `line-webhook`
3. Copy code from `functions/line-webhook.js`
4. Set environment variables in Worker settings
5. Get Worker URL: `https://line-webhook.your-subdomain.workers.dev`

---

## Step 5: Update LINE Webhook URL

1. Go to: LINE Developers Console → Your Channel → Messaging API
2. Update Webhook URL to:
   - **If using Pages Functions**: `https://your-project.pages.dev/line-webhook`
   - **If using Worker**: `https://line-webhook.your-subdomain.workers.dev`
3. Click "Verify" (should show "Success")
4. Enable "Use webhook"

---

## Step 6: Deploy

1. Cloudflare will automatically deploy on every push to your repository
2. Or manually trigger: Pages → Your Project → Deployments → Retry deployment

---

## Step 7: Update Your Domain (Optional)

1. Go to: Pages → Your Project → Custom domains
2. Add your domain (if you have one)
3. Cloudflare will provide DNS records to add

---

## 🎉 Done!

Your site will be live at: `https://your-project.pages.dev`

---

## Free Tier Limits Comparison

| Feature | Netlify Free | Cloudflare Pages Free |
|---------|--------------|----------------------|
| Builds/Deploys | 300 credits/month (~20 deploys) | **500 builds/month** |
| Bandwidth | 100GB/month | **Unlimited** |
| Requests | Limited | **Unlimited** |
| Functions | 125K invocations/month | **100K requests/day** |
| Custom Domain | ✅ Free | ✅ Free |
| Team Members | 1 | **Unlimited** |

**Cloudflare is better for teams!**

---

## Troubleshooting

### Function Not Working?
- Check Cloudflare Dashboard → Workers → Logs
- Verify environment variables are set
- Check function route is correct

### Build Fails?
- Check build logs in Cloudflare Dashboard
- Ensure `functions/` folder exists
- Verify all files are in repository

### Webhook Not Receiving Messages?
- Verify webhook URL in LINE Console
- Check Cloudflare Worker logs
- Test webhook manually with curl

---

## Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/

