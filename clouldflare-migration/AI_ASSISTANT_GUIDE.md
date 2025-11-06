# AI Assistant (LINE Bot) Guide

## Overview

Your POS system has an **AI Assistant** powered by LINE Bot integration that can help you:
- ✅ Record purchases via LINE messages
- ✅ Update stock automatically
- ✅ Calculate costs
- ✅ Send purchase confirmations

## How It Works

### 1. LINE Bot Integration
The AI assistant is the `LineBotIntegration` class in `pos-app.js`. It processes purchase information from LINE messages and automatically:
- Parses purchase data (vendor, amount, items)
- Updates Supabase database
- Updates Google Sheets (if connected)
- Sends confirmation messages

### 2. Current Status
The LINE Bot integration code is **already in your application** (`pos-app.js` lines 984-1210), but it needs to be configured with your LINE Bot credentials.

## Setup Instructions

### Step 1: Create a LINE Bot
1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new provider and channel
3. Get your **Channel Access Token** and **Channel Secret**
4. Set up a webhook URL (you'll need a backend server for this)

### Step 2: Configure in Your App
Edit `pos-app.js` line ~1254 and update:
```javascript
window.lineBot.channelAccessToken = "YOUR_LINE_CHANNEL_ACCESS_TOKEN";
window.lineBot.webhookUrl = "YOUR_WEBHOOK_URL";
window.lineBot.groupId = "YOUR_LINE_GROUP_ID";
```

Or use the configuration from `config/integrations.js`:
```javascript
const LINE_BOT_CONFIG = {
  CHANNEL_ACCESS_TOKEN: "your_token_here",
  CHANNEL_SECRET: "your_secret_here",
  WEBHOOK_URL: "your_webhook_url",
  GROUP_IDS: ["your_group_id"]
};
```

### Step 3: How to Use

#### Via LINE Messages
Send messages to your LINE Bot like:
- **Text Purchase**: "ซื้อ กุ้งสด 2kg ราคา 500 บาท จากร้านตลาด"
- **Slip Purchase**: Send an image of a purchase receipt/slip

The bot will:
1. Parse the purchase information
2. Save to Supabase database
3. Update ingredient stock automatically
4. Send a confirmation message

## Manual Purchase Entry (Current Method)

Currently, you're using the web form:
1. Click **"📦 ซื้อวัตถุดิบ"** (Purchase Ingredients)
2. Fill in the form:
   - Select ingredient
   - Enter quantity
   - Enter price
   - Enter unit
3. Click **"บันทึกการซื้อ"** (Save Purchase)

**What happens automatically:**
- ✅ Stock is updated (via database trigger)
- ✅ Stock transactions are recorded
- ✅ Low stock alerts update in real-time
- ✅ Cost calculations are updated

## Features

### Automatic Stock Updates
When you record a purchase:
- The `update_stock_after_transaction()` trigger automatically:
  - Increases `ingredients.current_stock`
  - Creates a `stock_transactions` record
  - Updates timestamps

### Real-time Low Stock Alerts
The **"🚨 สต๊อกใกล้หมด (Real-time)"** section automatically updates when:
- A purchase increases stock (item may no longer be low stock)
- A sale decreases stock (item may become low stock)
- Stock is adjusted manually

### Cost Calculation
Menu costs are automatically calculated based on:
- Ingredient prices from purchases
- Recipe quantities from `menu_recipes`
- Updated whenever ingredient costs change

## Troubleshooting

### Low Stock Not Updating After Purchase
✅ **Fixed**: The system now refreshes the low stock list automatically after each purchase.

If you still see issues:
1. Check browser console for errors
2. Verify Supabase connection is active (green indicator)
3. Try refreshing the page

### LINE Bot Not Working
The LINE Bot needs:
1. **Backend Server**: A webhook endpoint to receive LINE messages
2. **Configuration**: LINE Bot credentials set in the code
3. **Network Access**: Your server must be accessible from LINE's servers

For local development, use a tool like [ngrok](https://ngrok.com/) to expose your local server.

## Future Enhancements

Potential improvements:
- 🤖 Add a web-based chat interface (not just LINE)
- 🧠 AI-powered purchase parsing from natural language
- 📊 Automatic cost analysis and recommendations
- 🔔 Push notifications for low stock items
- 📱 Mobile app with voice commands

## Code Locations

- **LINE Bot Integration**: `pos-app.js` lines 984-1210
- **Purchase Processing**: `pos-app.js` lines 759-809
- **Stock Update Trigger**: `database-schema-clean.sql` lines 473-523
- **Real-time Subscriptions**: `supabase-config.js` lines 124-194

