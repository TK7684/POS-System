// Vercel Serverless Function for LINE Bot Webhook
// This replaces the Netlify Function

export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Line-Signature');
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const crypto = require('crypto');
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    
    if (!channelSecret) {
      console.error('LINE_CHANNEL_SECRET not configured');
      return res.status(500).json({ error: 'Channel secret not configured' });
    }

    const body = JSON.stringify(req.body);
    const signature = req.headers['x-line-signature'] || req.headers['X-Line-Signature'];

    if (!signature) {
      console.error('No signature found');
      return res.status(401).json({ error: 'No signature' });
    }

    // Verify signature
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');

    if (hash !== signature) {
      console.error('Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const data = req.body;
    const events = data.events || [];

    console.log(`Received ${events.length} events from LINE`);

    // Process events (same as Netlify function)
    // Import helper functions or copy them here
    // ... (same processing logic as netlify/functions/line-webhook.js)

    return res.status(200).json({ success: true, eventsProcessed: events.length });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

