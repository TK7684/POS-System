// Test script for HuggingFace API (via Cloudflare proxy)
// Usage: node test-huggingface-api.js [proxy-url] [api-key] [message]

const https = require('https');
const http = require('http');

// Configuration
const PROXY_URL = process.argv[2] || process.env.HUGGINGFACE_PROXY_URL || 'http://localhost:8788/api/huggingface';
const API_KEY = process.argv[3] || process.env.HUGGING_FACE_API_KEY || '';
const TEST_MESSAGE = process.argv[4] || 'Hello, how are you?';

// Test models (try different models)
const TEST_MODELS = [
  'microsoft/DialoGPT-large',
  'facebook/blenderbot-400M-distill',
  'gpt2'
];

// Test HuggingFace API
async function testHuggingFaceAPI() {
  console.log('Testing HuggingFace API (via proxy)');
  console.log('Proxy URL:', PROXY_URL);
  console.log('API Key:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'Not provided (will use server-side key)');
  console.log('Message:', TEST_MESSAGE);
  console.log('---\n');

  // Test each model
  for (const model of TEST_MODELS) {
    console.log(`Testing model: ${model}`);
    
    const payload = {
      model: model,
      inputs: `You are a helpful assistant. Respond in Thai language.\n\nUser: ${TEST_MESSAGE}\n\nAssistant:`
    };

    try {
      const result = await makeRequest(PROXY_URL, payload);
      if (result.success) {
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(result.data, null, 2));
        console.log('---\n');
        return; // Stop on first success
      } else {
        console.log(`❌ Failed: ${result.error}`);
        if (result.errorDetails) {
          console.log('Error details:', result.errorDetails);
        }
        console.log('Trying next model...\n');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
      continue;
    }
  }
  
  console.log('All models failed. Please check your proxy URL and API key configuration.');
}

// Make HTTP request
function makeRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    const body = JSON.stringify(payload);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    // Add API key to headers if provided (though proxy should use server-side key)
    if (API_KEY) {
      options.headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            // HuggingFace responses vary by model
            if (json.generated_text || json[0]?.generated_text || json.error) {
              resolve({
                success: true,
                data: json
              });
            } else {
              resolve({
                success: false,
                error: 'Unexpected response format',
                errorDetails: json
              });
            }
          } catch (e) {
            resolve({
              success: false,
              error: 'Failed to parse response',
              errorDetails: data
            });
          }
        } else {
          try {
            const errorJson = JSON.parse(data);
            resolve({
              success: false,
              error: `HTTP ${res.statusCode}`,
              status: res.statusCode,
              errorDetails: errorJson
            });
          } catch (e) {
            resolve({
              success: false,
              error: `HTTP ${res.statusCode}`,
              status: res.statusCode,
              errorDetails: data
            });
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

// Run test
testHuggingFaceAPI().catch(console.error);

