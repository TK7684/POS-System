#!/bin/bash
# Quick test script for LINE webhook API using curl
# Usage: ./test-line-webhook.sh [url] [channel-secret]

WEBHOOK_URL="${1:-http://localhost:3000/api/line-webhook}"
CHANNEL_SECRET="${2:-$LINE_CHANNEL_SECRET}"

if [ -z "$CHANNEL_SECRET" ]; then
  echo "ERROR: LINE_CHANNEL_SECRET not set"
  echo "Usage: ./test-line-webhook.sh [url] [channel-secret]"
  echo "   or: LINE_CHANNEL_SECRET=your-secret ./test-line-webhook.sh [url]"
  exit 1
fi

# Sample payload
PAYLOAD='{"events":[{"type":"message","replyToken":"test-token","source":{"userId":"test-user","type":"user"},"timestamp":1234567890,"message":{"type":"text","id":"msg-123","text":"Test message"}}]}'

# Generate signature (requires Node.js or openssl)
if command -v node &> /dev/null; then
  SIGNATURE=$(node -e "
    const crypto = require('crypto');
    const secret = process.argv[1];
    const body = process.argv[2];
    console.log(crypto.createHmac('sha256', secret).update(body).digest('base64'));
  " "$CHANNEL_SECRET" "$PAYLOAD")
else
  echo "ERROR: Node.js required for signature generation"
  exit 1
fi

echo "Testing: $WEBHOOK_URL"
echo "Signature: $SIGNATURE"
echo "---"

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: $SIGNATURE" \
  -d "$PAYLOAD" \
  -v

