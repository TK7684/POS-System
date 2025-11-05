# ✅ Cloudflare Migration Checklist

## Pre-Migration Setup

- [x] Cloudflare Workers functions created (`functions/line-webhook.js`)
- [x] Midnight stock alert function created (`functions/midnight-stock-alert.js`)
- [x] Configuration files created (`wrangler.toml`, `_redirects`)
- [x] Migration guides created

## Step-by-Step Migration

### 1. Cloudflare Account Setup
- [ ] Sign up at https://dash.cloudflare.com/sign-up
- [ ] Verify email address
- [ ] Complete account setup

### 2. Connect Repository
- [ ] Go to: Workers & Pages → Create Application → Pages → Connect to Git
- [ ] Select GitHub (or your Git provider)
- [ ] Authorize Cloudflare
- [ ] Select repository: `supabase-migration`
- [ ] Click "Begin setup"

### 3. Configure Build
- [ ] Framework preset: `None`
- [ ] Build command: (leave empty)
- [ ] Build output directory: `.` (root)
- [ ] Root directory: `/` (leave empty)
- [ ] Click "Save and Deploy"

### 4. Add Environment Variables
Go to: Pages → Your Project → Settings → Environment Variables

Add these (Production):
- [ ] `LINE_CHANNEL_SECRET` = `5b2672bda43572ec8f2d5c4cb96c53d9`
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` = `r/DiyiGj+YDZ5VBLH4GUcRBahv4TIAj3naSZKlCjmwwnsfyzSYLAg3ZoEI7WXBkE0cZzsTDtKJnkNF5ZZ4mZHIrnHn1DETTfIVAIEIW2bqOu7Vd/pNWYrA2Ub2PifQM5b07S/GBp5S+YQPQ47Fqy1AdB04t89/1O/w1cDnyilFU=`
- [ ] `SUPABASE_URL` = `https://rtfreafhlelpxqwohspq.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (get from Supabase Dashboard)
- [ ] `HUGGING_FACE_API_KEY` = `hf_YOUR_HUGGING_FACE_API_KEY_HERE`
- [ ] `GOOGLE_CLOUD_API_KEY` = `AIzaSyBGZhBGZjZNlH7sbPcGfeUKaOQDQsBSFHE`
- [ ] `LINE_GROUP_ID` = (optional - for stock alerts)

### 5. Get Your Cloudflare URL
- [ ] After deployment, note your site URL: `https://your-project.pages.dev`
- [ ] Your webhook URL will be: `https://your-project.pages.dev/line-webhook`

### 6. Update LINE Webhook
- [ ] Go to LINE Developers Console → Your Channel → Messaging API
- [ ] Update Webhook URL to: `https://your-project.pages.dev/line-webhook`
- [ ] Click "Update"
- [ ] Click "Verify" (should show "Success")
- [ ] Enable "Use webhook"

### 7. Test the Migration
- [ ] Test LINE Bot: Send a message to your LINE group
- [ ] Check Cloudflare Dashboard → Workers → Logs
- [ ] Verify expense recording works
- [ ] Test wake word "พอส" commands

### 8. Update Supabase Redirect URLs (if needed)
- [ ] Go to Supabase Dashboard → Authentication → URL Configuration
- [ ] Add Cloudflare Pages URL to allowed redirect URLs:
  - `https://your-project.pages.dev`
  - `https://your-project.pages.dev/*`

### 9. Commit and Push Changes
- [ ] Commit all new files to Git
- [ ] Push to repository (Cloudflare will auto-deploy)

## Post-Migration

- [ ] Test all features:
  - [ ] Google sign-in
  - [ ] Expense recording
  - [ ] LINE Bot commands
  - [ ] Menu display
  - [ ] Expense history
- [ ] Monitor Cloudflare Dashboard for errors
- [ ] Update any documentation with new URLs

## Troubleshooting

If something doesn't work:
- [ ] Check Cloudflare Dashboard → Workers → Logs
- [ ] Verify environment variables are set
- [ ] Check LINE webhook URL is correct
- [ ] Test webhook manually with curl
- [ ] Review function code in Cloudflare Dashboard

---

## Quick Commands

**Get Supabase Service Role Key:**
1. Supabase Dashboard → Settings → API
2. Copy "service_role" key (not "anon" key)

**Test Webhook:**
```bash
curl -X POST https://your-project.pages.dev/line-webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: test" \
  -d '{"events":[]}'
```

**Check Deployment:**
- Cloudflare Dashboard → Pages → Your Project → Deployments

---

**Ready to migrate? Follow the checklist above! 🚀**

