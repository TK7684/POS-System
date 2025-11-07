// Test script for Google Gemini API
// Usage: node test-gemini-api.js [api-key] [message]

const https = require('https');

// Configuration
const API_KEY = process.argv[2] || process.env.GOOGLE_GEMINI_API_KEY || 'your-api-key-here';
const TEST_MESSAGE = process.argv[3] || 'Hello, how are you?';

// Test payload
const testPayload = {
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

// Test Gemini API
async function testGeminiAPI() {
  console.log('Testing Google Gemini API');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  console.log('Message:', TEST_MESSAGE);
  console.log('---\n');

  // Try available models (newer versions first)
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-pro'
  ];
  
  const versions = ['v1', 'v1beta'];

  for (const model of models) {
    for (const version of versions) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
      
      console.log(`Trying: ${version}/${model}`);
      
      try {
        const result = await makeRequest(url, testPayload);
        if (result.success) {
          console.log('✅ Success!');
          console.log('Response:', result.data);
          return;
        } else {
          console.log(`❌ Failed: ${result.error}`);
          if (result.status === 404) {
            console.log('Model not found, trying next...\n');
            continue;
          } else {
            console.log('Error details:', result.errorDetails);
            return;
          }
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
        continue;
      }
    }
  }
  
  console.log('All attempts failed. Please check your API key and try again.');
}

// Make HTTP request
function makeRequest(url, payload) {
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
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.candidates && json.candidates[0] && json.candidates[0].content) {
              resolve({
                success: true,
                data: json.candidates[0].content.parts[0].text
              });
            } else {
              resolve({
                success: false,
                error: 'Invalid response format',
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
if (!API_KEY || API_KEY === 'your-api-key-here') {
  console.error('ERROR: Google Gemini API key not provided');
  console.error('Usage: node test-gemini-api.js [api-key] [message]');
  console.error('   or: GOOGLE_GEMINI_API_KEY=your-key node test-gemini-api.js [message]');
  process.exit(1);
}

testGeminiAPI().catch(console.error);

