// Combined test script for both Google Gemini and HuggingFace APIs
// Usage: node test-both-apis.js [gemini-key] [huggingface-url] [message]

const https = require('https');
const http = require('http');

// Configuration
const GEMINI_KEY = process.argv[2] || process.env.GOOGLE_GEMINI_API_KEY || '';
const HUGGINGFACE_URL = process.argv[3] || process.env.HUGGINGFACE_PROXY_URL || 'http://localhost:8788/api/huggingface';
const TEST_MESSAGE = process.argv[4] || 'Hello, how are you?';

// Test Google Gemini API
async function testGemini() {
  if (!GEMINI_KEY) {
    console.log('⚠️  Skipping Gemini test (no API key provided)');
    return null;
  }

  console.log('🔵 Testing Google Gemini API...');
  const payload = {
    contents: [{
      parts: [{
        text: `You are a helpful assistant. Respond in Thai language.\n\nUser: ${TEST_MESSAGE}\n\nAssistant:`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  const models = [
    { version: 'v1', model: 'gemini-2.5-flash' },
    { version: 'v1', model: 'gemini-2.0-flash' },
    { version: 'v1', model: 'gemini-1.5-flash' }
  ];

  for (const { version, model } of models) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_KEY}`;
    
    try {
      const result = await makeHttpsRequest(url, payload);
      if (result.success) {
        console.log(`✅ Gemini (${version}/${model}) Success!`);
        console.log('Response:', result.data);
        console.log('---\n');
        return result.data;
      } else if (result.status === 404) {
        continue; // Try next model
      } else {
        console.log(`❌ Gemini (${version}/${model}) Failed: ${result.error}`);
        if (result.errorDetails) {
          console.log('Details:', JSON.stringify(result.errorDetails, null, 2));
        }
        return null;
      }
    } catch (error) {
      console.log(`❌ Gemini (${version}/${model}) Error: ${error.message}`);
      continue;
    }
  }
  
  console.log('❌ All Gemini models failed\n');
  return null;
}

// Test HuggingFace API
async function testHuggingFace() {
  console.log('🟣 Testing HuggingFace API (via proxy)...');
  
  const models = [
    'microsoft/DialoGPT-large',
    'facebook/blenderbot-400M-distill',
    'gpt2'
  ];

  for (const model of models) {
    const payload = {
      model: model,
      inputs: `You are a helpful assistant. Respond in Thai language.\n\nUser: ${TEST_MESSAGE}\n\nAssistant:`
    };

    try {
      const result = await makeHttpRequest(HUGGINGFACE_URL, payload);
      if (result.success) {
        console.log(`✅ HuggingFace (${model}) Success!`);
        console.log('Response:', JSON.stringify(result.data, null, 2));
        console.log('---\n');
        return result.data;
      } else {
        console.log(`❌ HuggingFace (${model}) Failed: ${result.error}`);
        if (result.errorDetails) {
          console.log('Details:', JSON.stringify(result.errorDetails, null, 2));
        }
        continue;
      }
    } catch (error) {
      console.log(`❌ HuggingFace (${model}) Error: ${error.message}`);
      continue;
    }
  }
  
  console.log('❌ All HuggingFace models failed\n');
  return null;
}

// Make HTTPS request
function makeHttpsRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(payload);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
              resolve({ success: true, data: json.candidates[0].content.parts[0].text });
            } else {
              resolve({ success: false, error: 'Invalid response', errorDetails: json });
            }
          } catch (e) {
            resolve({ success: false, error: 'Parse error', errorDetails: data });
          }
        } else {
          try {
            resolve({ success: false, error: `HTTP ${res.statusCode}`, status: res.statusCode, errorDetails: JSON.parse(data) });
          } catch (e) {
            resolve({ success: false, error: `HTTP ${res.statusCode}`, status: res.statusCode, errorDetails: data });
          }
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Make HTTP/HTTPS request (auto-detect)
function makeHttpRequest(url, payload) {
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

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.generated_text || json[0]?.generated_text || json.error) {
              resolve({ success: true, data: json });
            } else {
              resolve({ success: false, error: 'Unexpected format', errorDetails: json });
            }
          } catch (e) {
            resolve({ success: false, error: 'Parse error', errorDetails: data });
          }
        } else {
          try {
            resolve({ success: false, error: `HTTP ${res.statusCode}`, status: res.statusCode, errorDetails: JSON.parse(data) });
          } catch (e) {
            resolve({ success: false, error: `HTTP ${res.statusCode}`, status: res.statusCode, errorDetails: data });
          }
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Run both tests
async function runTests() {
  console.log('🚀 Testing Both APIs');
  console.log('Message:', TEST_MESSAGE);
  console.log('---\n');

  const [geminiResult, huggingfaceResult] = await Promise.all([
    testGemini(),
    testHuggingFace()
  ]);

  console.log('\n📊 Summary:');
  console.log('Gemini:', geminiResult ? '✅ Success' : '❌ Failed');
  console.log('HuggingFace:', huggingfaceResult ? '✅ Success' : '❌ Failed');
}

runTests().catch(console.error);

