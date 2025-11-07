#!/bin/bash
# Quick test script for both Gemini and HuggingFace APIs using curl
# Usage: ./test-apis.sh [gemini-key] [huggingface-proxy-url] [message]

GEMINI_KEY="${1:-$GOOGLE_GEMINI_API_KEY}"
HUGGINGFACE_URL="${2:-http://localhost:8788/api/huggingface}"
MESSAGE="${3:-Hello, how are you?}"

echo "=== Testing Google Gemini API ==="
if [ -z "$GEMINI_KEY" ]; then
  echo "ERROR: Google Gemini API key not provided"
  echo "Usage: ./test-apis.sh [gemini-key] [huggingface-url] [message]"
else
  PAYLOAD="{\"contents\":[{\"parts\":[{\"text\":\"You are a helpful assistant. Respond in Thai.\\n\\nUser: $MESSAGE\\n\\nAssistant:\"}]}],\"generationConfig\":{\"temperature\":0.7,\"maxOutputTokens\":2048}}"
  
  curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=$GEMINI_KEY" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    -s | jq '.' || echo "Response received (install jq for pretty formatting)"
fi

echo ""
echo "=== Testing HuggingFace API (via proxy) ==="
HF_PAYLOAD="{\"model\":\"microsoft/DialoGPT-large\",\"inputs\":\"You are a helpful assistant. Respond in Thai.\\n\\nUser: $MESSAGE\\n\\nAssistant:\"}"
curl -X POST "$HUGGINGFACE_URL" \
  -H "Content-Type: application/json" \
  -d "$HF_PAYLOAD" \
  -s | jq '.' || echo "Response received (install jq for pretty formatting)"

