# ✅ Cloudflare Pages Deployment Checklist

## Pre-Deployment Verification

### ✅ Core Files (Required)
- [x] `index.html` - Main application entry point
- [x] `pos-app.js` - Main application logic
- [x] `supabase-config.js` - Supabase configuration
- [x] `sw.js` - Service worker for PWA
- [x] `manifest.json` - PWA manifest
- [x] `backfill-expenses.js` - Expense backfill utility
- [x] `config/integrations.js` - Integration configurations

### ✅ Cloudflare Configuration Files
- [x] `wrangler.toml` - Cloudflare Workers configuration
- [x] `cloudflare-pages.json` - Cloudflare Pages build configuration
- [x] `_redirects` - URL redirect rules

### ✅ Functions (Cloudflare Workers)
- [x] `functions/line-webhook.js` - LINE Bot webhook handler
- [x] `functions/midnight-stock-alert.js` - Midnight stock alert cron job

### ✅ OpenSpec Structure
- [x] `openspec/AGENTS.md` - OpenSpec agent instructions
- [x] `openspec/specs/` - Specifications directory
- [x] `openspec/changes/` - Active changes directory
- [x] `openspec/archive/` - Archived changes directory

## Deployment Steps

### 1. Cloudflare Pages Setup
1. Go to: https://dash.cloudflare.com
2. Navigate to: Workers & Pages → Create Application → Pages → Connect to Git
3. Connect your GitHub repository
4. Select repository: `POS-System`
5. Set **Root directory**: `firebase-version/supabase-migration/CloudFlare-Migration`

### 2. Build Configuration
- **Framework preset**: None
- **Build command**: (leave empty)
- **Build output directory**: `.` (current directory)

### 3. Environment Variables
Set these in Cloudflare Dashboard → Pages → Settings → Environment Variables (Production):

```
SUPABASE_URL=https://rtfreafhlelpxqwohspq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=(your service role key from Supabase)
LINE_CHANNEL_SECRET=5b2672bda43572ec8f2d5c4cb96c53d9
LINE_CHANNEL_ACCESS_TOKEN=r/DiyiGj+YDZ5VBLH4GUcRBahv4TIAj3naSZKlCjmwwnsfyzSYLAg3ZoEI7WXBkE0cZzsTDtKJnkNF5ZZ4mZHIrnHn1DETTfIVAIEIW2bqOu7Vd/pNWYrA2Ub2PifQM5b07S/GBp5S+YQPQ47Fqy1AdB04t89/1O/w1cDnyilFU=
HUGGING_FACE_API_KEY=(your Hugging Face API key)
GOOGLE_CLOUD_API_KEY=AIzaSyBGZhBGZjZNlH7sbPcGfeUKaOQDQsBSFHE
LINE_GROUP_ID=(optional - for stock alerts)
```

### 4. Function Routes
After deployment, your functions will be available at:
- `https://your-project.pages.dev/line-webhook` - LINE Bot webhook
- `https://your-project.pages.dev/midnight-stock-alert` - Stock alert cron

### 5. Update LINE Webhook URL
1. Go to: LINE Developers Console → Your Channel → Messaging API
2. Update Webhook URL to: `https://your-project.pages.dev/line-webhook`
3. Click "Verify" (should show "Success")
4. Enable "Use webhook"

### 6. Update Supabase Redirect URLs
1. Go to: Supabase Dashboard → Authentication → URL Configuration
2. Add your Cloudflare Pages URL to Redirect URLs:
   - `https://your-project.pages.dev`
   - `https://your-project.pages.dev/index.html`

### 7. Verify Deployment
- [ ] Visit your site: `https://your-project.pages.dev`
- [ ] Test login functionality
- [ ] Test LINE Bot webhook (send a test message)
- [ ] Verify functions are accessible
- [ ] Check browser console for errors

## File Structure Verification

```
CloudFlare-Migration/
├── index.html                    ✅ Main app
├── pos-app.js                    ✅ App logic
├── supabase-config.js            ✅ Supabase setup
├── sw.js                         ✅ Service worker
├── manifest.json                 ✅ PWA manifest
├── backfill-expenses.js          ✅ Backfill utility
├── wrangler.toml                 ✅ Workers config
├── cloudflare-pages.json         ✅ Pages config
├── _redirects                    ✅ Redirect rules
├── config/
│   └── integrations.js           ✅ Integrations
├── functions/
│   ├── line-webhook.js           ✅ LINE webhook
│   └── midnight-stock-alert.js  ✅ Stock alerts
└── openspec/
    ├── AGENTS.md                 ✅ OpenSpec setup
    ├── specs/                    ✅ Specifications
    ├── changes/                  ✅ Active changes
    └── archive/                  ✅ Archived changes
```

## Troubleshooting

### Build Fails?
- Check Cloudflare Dashboard → Pages → Deployments → Build logs
- Verify all files are in the CloudFlare-Migration folder
- Ensure no Netlify-specific code remains

### Functions Not Working?
- Check Cloudflare Dashboard → Workers → Logs
- Verify environment variables are set correctly
- Check function routes match Cloudflare Pages format

### LINE Webhook Not Receiving Messages?
- Verify webhook URL in LINE Console
- Check Cloudflare Worker logs
- Test webhook manually with curl:
  ```bash
  curl -X POST https://your-project.pages.dev/line-webhook \
    -H "Content-Type: application/json" \
    -H "X-Line-Signature: test" \
    -d '{"events":[]}'
  ```

### OAuth Not Working?
- Verify Supabase redirect URLs include your Cloudflare Pages URL
- Check browser console for OAuth errors
- Ensure SUPABASE_URL and keys are correct

## Ready for Deployment! 🚀

All files are in place and ready for Cloudflare Pages deployment.

