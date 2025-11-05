# 🤖 LINE Bot Connection Guide

Complete guide to connect your POS system to LINE Bot for automatic expense and purchase tracking.

---

## 📋 Overview

Your LINE Bot can:
- ✅ Read messages from LINE groups
- ✅ Parse expense data (ค่าไฟ, ค่าน้ำ, etc.)
- ✅ Parse ingredient purchases (น้ำแข็ง 2 กระสอบ 110 บาท)
- ✅ Detect sales transactions (จ่ายสด 478 บาท)
- ✅ Handle misspellings with fuzzy matching
- ✅ Learn from chat history
- ✅ Request confirmation for uncertain data

---

## 🚀 Setup Steps

### Step 1: Create a LINE Bot Account

1. **Go to LINE Developers Console**
   - Visit: https://developers.line.biz/console/
   - Sign in with your LINE account

2. **Create a Provider**
   - Click "Create" → "Provider"
   - Enter provider name (e.g., "POS System")
   - Click "Create"

3. **Create a Messaging API Channel**
   - In your provider, click "Create"
   - Select "Messaging API"
   - Fill in:
     - Channel name: "POS Bot"
     - Channel description: "POS Expense & Purchase Tracking Bot"
     - Category: "Shopping"
     - Subcategory: "Other"
   - Accept LINE Terms of Service
   - Click "Create"

4. **Get Your Credentials**
   - Go to your channel → "Basic settings"
   - Copy **Channel secret** (save this securely)
   - Go to "Messaging API" tab
   - Issue **Channel access token** (save this securely)

---

### Step 2: Configure Webhook URL

**Important:** LINE Bot requires a webhook URL (HTTPS endpoint) to receive messages. Since your app is on Netlify, you have two options:

#### Option A: Use Netlify Functions (Recommended)

1. **Create Netlify Function**
   Create file: `netlify/functions/line-webhook.js`

```javascript
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const body = event.body;
  const signature = event.headers['x-line-signature'];

  // Verify signature
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');

  if (hash !== signature) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid signature' })
    };
  }

  const events = JSON.parse(body).events || [];

  // Process each event
  for (const event of events) {
    if (event.type === 'message') {
      // Forward to your frontend or process here
      // For now, you can store in Supabase or call your processing logic
      console.log('Received message:', event.message.text);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
```

2. **Set Environment Variables in Netlify**
   - Go to Netlify Dashboard → Your Site → Site settings → Environment variables
   - Add:
     - `LINE_CHANNEL_SECRET` = Your channel secret
     - `LINE_CHANNEL_ACCESS_TOKEN` = Your channel access token

3. **Get Webhook URL**
   - After deploying, your webhook URL will be:
     `https://jade-cannoli-b0d851.netlify.app/.netlify/functions/line-webhook`

#### Option B: Use a Separate Backend Server

If you have a backend server (Node.js, Python, etc.), set up webhook endpoint there.

---

### Step 3: Configure Webhook in LINE Developers Console

1. **Go to your channel → Messaging API tab**
2. **Set Webhook URL**
   - Enter your webhook URL: `https://your-site.netlify.app/.netlify/functions/line-webhook`
   - Click "Update"
   - Click "Verify" to test connection (should show "Success")

3. **Enable Webhook**
   - Toggle "Use webhook" to ON

4. **Auto-reply messages (Optional)**
   - Disable "Auto-reply messages" if you want to handle all messages manually

---

### Step 4: Add Bot to LINE Group

1. **Add Bot as Friend**
   - Go to your channel → "Messaging API" tab
   - Scan QR code with your LINE app
   - Add bot as friend

2. **Invite Bot to Group**
   - Open your LINE group chat
   - Click group settings → "Add members"
   - Search for your bot
   - Add bot to group

3. **Get Group ID**
   - After adding bot, send a message in the group
   - Check your webhook logs or use LINE API to get group ID
   - Or use this method:
     - In your webhook handler, log `event.source.groupId` when message is from group
     - Copy the group ID

---

### Step 5: Configure in Your App

1. **Update `config/integrations.js`**

```javascript
const LINE_BOT_CONFIG = {
  CHANNEL_ACCESS_TOKEN: "YOUR_CHANNEL_ACCESS_TOKEN_HERE",
  CHANNEL_SECRET: "YOUR_CHANNEL_SECRET_HERE",
  WEBHOOK_URL: "https://jade-cannoli-b0d851.netlify.app/.netlify/functions/line-webhook",
  GROUP_IDS: [
    "YOUR_LINE_GROUP_ID_HERE", // Add your group ID
  ],
  // ... rest of config
};
```

2. **Update `pos-app.js` initialization**

The bot is already initialized in your code. Just make sure it uses the config:

```javascript
async function initializeLineBot() {
  try {
    // Use config from integrations.js
    window.lineBot.channelAccessToken = window.LINE_BOT_CONFIG.CHANNEL_ACCESS_TOKEN;
    window.lineBot.webhookUrl = window.LINE_BOT_CONFIG.WEBHOOK_URL;
    window.lineBot.groupId = window.LINE_BOT_CONFIG.GROUP_IDS[0];
    
    await window.lineBot.initialize();
    showToast("💬 Line Bot initialized successfully");
    return true;
  } catch (error) {
    showToast("❌ Line Bot initialization failed: " + error.message);
    return false;
  }
}
```

---

## 🔧 Netlify Functions Setup

### Create Netlify Function File

Create directory structure:
```
supabase-migration/
  netlify/
    functions/
      line-webhook.js
```

### Complete Webhook Handler

```javascript
// netlify/functions/line-webhook.js
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const body = event.body;
    const signature = event.headers['x-line-signature'] || event.headers['X-Line-Signature'];

    // Verify signature
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');

    if (hash !== signature) {
      console.error('Invalid signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    const data = JSON.parse(body);
    const events = data.events || [];

    // Process events
    for (const evt of events) {
      if (evt.type === 'message') {
        const messageText = evt.message?.text || '';
        const messageType = evt.message?.type;
        const sourceType = evt.source?.type; // 'user', 'group', 'room'
        const sourceId = evt.source?.groupId || evt.source?.userId || evt.source?.roomId;
        
        // Store message in Supabase for processing
        // Your frontend can poll or use real-time subscriptions
        console.log('Message received:', {
          text: messageText,
          type: messageType,
          source: sourceType,
          sourceId: sourceId,
        });

        // Option 1: Store in Supabase for frontend to process
        // Option 2: Process directly here (requires Supabase client)
        // Option 3: Send to your frontend via webhook to frontend endpoint
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

---

## 📝 Alternative: Store Messages in Supabase

Instead of processing directly, you can store messages in Supabase and have your frontend process them:

### 1. Create Messages Table in Supabase

```sql
CREATE TABLE IF NOT EXISTS line_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_text TEXT,
  message_type TEXT,
  source_type TEXT, -- 'user', 'group', 'room'
  source_id TEXT,
  user_id TEXT,
  image_url TEXT,
  raw_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Update Webhook to Store Messages

```javascript
// In your webhook handler
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Store message
await supabase.from('line_messages').insert({
  message_text: messageText,
  message_type: messageType,
  source_type: sourceType,
  source_id: sourceId,
  user_id: evt.source?.userId,
  raw_data: evt,
  processed: false,
});
```

### 3. Process Messages in Frontend

Add to `pos-app.js`:

```javascript
// Poll for new messages or use Supabase real-time
async function processLineMessages() {
  const { data: messages } = await window.supabase
    .from('line_messages')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(10);

  for (const msg of messages || []) {
    await window.lineBot.processMessage(
      msg.message_text,
      msg.source_type,
      msg.image_url
    );
    
    // Mark as processed
    await window.supabase
      .from('line_messages')
      .update({ processed: true })
      .eq('id', msg.id);
  }
}

// Poll every 5 seconds
setInterval(processLineMessages, 5000);
```

---

## 🧪 Testing

### Test Webhook

1. **Send test message in LINE group**
2. **Check Netlify Function logs**
   - Netlify Dashboard → Functions → Logs
   - Should see incoming webhook requests

3. **Verify message processing**
   - Check Supabase `line_messages` table
   - Or check browser console for processing logs

### Test Message Formats

Try these in your LINE group:

```
ค่าไฟ 500 บาท
น้ำแข็ง 2 กระสอบ 110 บาท
จ่ายสด 478 บาท ข้าว2
```

---

## 🔐 Security Notes

1. **Keep credentials secure**
   - Never commit tokens to Git
   - Use environment variables
   - Rotate tokens regularly

2. **Verify webhook signatures**
   - Always verify LINE signature
   - Prevents unauthorized requests

3. **Rate limiting**
   - LINE has rate limits
   - Handle errors gracefully

---

## 📚 Resources

- **LINE Developers Console:** https://developers.line.biz/console/
- **LINE Messaging API Docs:** https://developers.line.biz/en/docs/messaging-api/
- **Netlify Functions Docs:** https://docs.netlify.com/functions/overview/

---

## 📝 Step 6: Create Database Table

Run the SQL script to create the `line_messages` table in Supabase:

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project: `rtfreafhlelpxqwohspq`

2. **Run SQL Script**
   - Go to SQL Editor
   - Copy and paste contents from `create-line-messages-table.sql`
   - Click "Run"

This creates the table where LINE messages will be stored.

---

## 🔄 Step 7: Set Environment Variables in Netlify

1. **Go to Netlify Dashboard**
   - Site settings → Environment variables

2. **Add these variables:**
   ```
   LINE_CHANNEL_SECRET = Your channel secret from LINE Console
   LINE_CHANNEL_ACCESS_TOKEN = Your channel access token
   SUPABASE_URL = https://rtfreafhlelpxqwohspq.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = Your Supabase service role key (for webhook)
   ```

3. **Get Supabase Service Role Key:**
   - Supabase Dashboard → Project Settings → API
   - Copy "service_role" key (keep this secret!)

---

## ✅ Step 8: Test the Connection

1. **Verify Webhook URL**
   - Your webhook URL: `https://jade-cannoli-b0d851.netlify.app/.netlify/functions/line-webhook`
   - Test in LINE Console → Messaging API → Webhook URL → "Verify"

2. **Send Test Message**
   - Send a message in your LINE group: "ค่าไฟ 500 บาท"
   - Check Netlify Function logs
   - Check Supabase `line_messages` table

3. **Check Frontend Processing**
   - Open your app: https://jade-cannoli-b0d851.netlify.app
   - Click "💬 Line Bot" button
   - Messages should be processed automatically

---

## 🐛 Troubleshooting

### Webhook not receiving messages
- ✅ Check webhook URL is correct
- ✅ Verify webhook is enabled in LINE Console
- ✅ Check Netlify Function logs
- ✅ Ensure HTTPS (not HTTP)

### Messages not processing
- ✅ Check browser console for errors
- ✅ Verify Supabase connection
- ✅ Check `line_messages` table
- ✅ Verify bot is in group

### Signature verification fails
- ✅ Check `LINE_CHANNEL_SECRET` is correct
- ✅ Verify signature header name matches

---

## ✅ Quick Checklist

- [ ] Created LINE Bot in Developers Console
- [ ] Got Channel Access Token
- [ ] Got Channel Secret
- [ ] Created Netlify Function for webhook
- [ ] Set environment variables in Netlify
- [ ] Configured webhook URL in LINE Console
- [ ] Verified webhook connection
- [ ] Added bot to LINE group
- [ ] Got Group ID
- [ ] Updated config in `config/integrations.js`
- [ ] Tested with sample messages

---

**🎉 Once configured, your LINE Bot will automatically process messages from your group and update your POS database!**

