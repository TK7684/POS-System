# 🆓 Free Hosting Migration Guide

Your POS system hit Netlify's free tier limit. Here are **completely free** alternatives that will work for your team.

---

## 🏆 Best Option: Cloudflare Pages

### Why Cloudflare Pages?
- ✅ **Unlimited requests** (vs Netlify's 300 credits/month)
- ✅ **500 builds/month** (vs Netlify's ~20 deploys)
- ✅ **Serverless Functions** (Workers - similar to Netlify Functions)
- ✅ **Global CDN** (faster than Netlify)
- ✅ **100% Free** - No credit limits
- ✅ **Custom domains** free

### Migration Steps

#### Step 1: Create Cloudflare Account
1. Go to: https://dash.cloudflare.com/sign-up
2. Sign up for free account
3. Verify email

#### Step 2: Connect GitHub Repository
1. Go to: Cloudflare Dashboard → Pages → Create a project
2. Connect your GitHub repository
3. Select branch: `main` or `master`
4. Build settings:
   - **Build command**: `echo 'No build needed'`
   - **Build output directory**: `.` (root)
   - **Root directory**: `/` (leave empty)

#### Step 3: Convert Netlify Functions to Cloudflare Workers

Create `functions/line-webhook.js` (Cloudflare Workers format):

```javascript
// Cloudflare Worker for LINE Bot Webhook
export default {
  async fetch(request, env) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.text();
      const signature = request.headers.get('X-Line-Signature');
      
      // Verify signature
      const channelSecret = env.LINE_CHANNEL_SECRET;
      const hmac = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(channelSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(body));
      const calculatedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
      
      if (signature !== calculatedSignature) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = JSON.parse(body);
      const events = data.events || [];

      // Process events (same logic as Netlify function)
      for (const evt of events) {
        if (evt.type === 'message') {
          // ... your existing processing logic ...
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
```

#### Step 4: Set Environment Variables
1. Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables
2. Add:
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `HUGGING_FACE_API_KEY`
   - `GOOGLE_CLOUD_API_KEY`

#### Step 5: Update LINE Webhook URL
1. LINE Developers Console → Webhook URL
2. Update to: `https://your-project.pages.dev/.netlify/functions/line-webhook`
   (Actually, Cloudflare Workers use different paths - see below)

---

## 📋 Option 2: Vercel (Also Excellent)

### Why Vercel?
- ✅ **100GB bandwidth/month** free
- ✅ **100 deploys/month** free
- ✅ **Serverless Functions** (similar to Netlify)
- ✅ **Custom domains** free
- ✅ Easy migration from Netlify

### Migration Steps

1. **Sign up**: https://vercel.com/signup
2. **Import project** from GitHub
3. **Configuration**:
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: `.`
4. **Functions**: Create `api/line-webhook.js` (Vercel format)
5. **Environment Variables**: Add all your secrets
6. **Deploy**

### Vercel Function Format

Create `api/line-webhook.js`:

```javascript
// Vercel Serverless Function
export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Your existing logic here...
  // Similar to Netlify but using req/res instead of event
  
  return res.status(200).json({ success: true });
}
```

---

## 📋 Option 3: GitHub Pages + External Webhook Service

### For Static Hosting Only
- ✅ **Completely free**
- ✅ **Unlimited** (GitHub repos)
- ❌ No serverless functions (need external service)

### Setup
1. Push to GitHub
2. Settings → Pages → Enable GitHub Pages
3. Use external service for LINE webhook:
   - **Pipedream** (free tier)
   - **n8n** (self-hosted)
   - **Zapier** (limited free tier)

---

## 🚀 Quick Migration: Cloudflare Pages

I'll create the Cloudflare Workers version of your functions now.

