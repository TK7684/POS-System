// Test script for LINE webhook API
// Usage: node test-line-webhook.js [url]

const crypto = require('crypto');
const https = require('https');
const http = require('http');

// Configuration
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || 'your-channel-secret-here';
const WEBHOOK_URL = process.argv[2] || 'http://localhost:3000/api/line-webhook';

// Sample LINE webhook event payload
const testPayload = {
  events: [
    {
      type: 'message',
      replyToken: 'test-reply-token',
      source: {
        userId: 'test-user-id',
        type: 'user'
      },
      timestamp: Date.now(),
      message: {
        type: 'text',
        id: 'test-message-id',
        text: 'Test message from API test script'
      }
    }
  ]
};

// Generate signature
function generateSignature(body, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('base64');
}

// Send test request
function testWebhook() {
  const body = JSON.stringify(testPayload);
  const signature = generateSignature(testPayload, CHANNEL_SECRET);

  console.log('Testing LINE Webhook API');
  console.log('URL:', WEBHOOK_URL);
  console.log('Signature:', signature);
  console.log('Payload:', body);
  console.log('---\n');

  const url = new URL(WEBHOOK_URL);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Line-Signature': signature,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = client.request(options, (res) => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log('Headers:', res.headers);
    console.log('---\n');

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response Body:');
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request Error:', error.message);
  });

  req.write(body);
  req.end();
}

// Run test
if (!CHANNEL_SECRET || CHANNEL_SECRET === 'your-channel-secret-here') {
  console.error('ERROR: LINE_CHANNEL_SECRET environment variable not set');
  console.error('Usage: LINE_CHANNEL_SECRET=your-secret node test-line-webhook.js [url]');
  process.exit(1);
}

testWebhook();

