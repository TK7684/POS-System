// Working Gemini API test with correct models
const https = require('https');

const API_KEY = 'AIzaSyCGpCLLOQ93qRmzhDun09gQqr7lM-L51Yk';
const TEST_MESSAGE = process.argv[2] || 'สวัสดีครับ คุณเป็นอย่างไรบ้าง?';

const models = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

async function testModel(model) {
  const payload = {
    contents: [{
      parts: [{
        text: `You are a helpful assistant. Respond in Thai language.\n\nUser: ${TEST_MESSAGE}\n\nAssistant:`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`;
  const body = JSON.stringify(payload);

  return new Promise((resolve) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1/models/${model}:generateContent?key=${API_KEY}`,
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
              resolve({ success: true, model, response: json.candidates[0].content.parts[0].text });
            } else {
              resolve({ success: false, model, error: 'Invalid response format', data: json });
            }
          } catch (e) {
            resolve({ success: false, model, error: 'Parse error', data });
          }
        } else {
          try {
            const errorJson = JSON.parse(data);
            resolve({ success: false, model, error: `HTTP ${res.statusCode}`, details: errorJson });
          } catch (e) {
            resolve({ success: false, model, error: `HTTP ${res.statusCode}`, details: data });
          }
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, model, error: error.message });
    });

    req.write(body);
    req.end();
  });
}

async function runTest() {
  console.log('🔵 Testing Google Gemini API');
  console.log('Message:', TEST_MESSAGE);
  console.log('---\n');

  for (const model of models) {
    console.log(`Trying model: ${model}...`);
    const result = await testModel(model);
    
    if (result.success) {
      console.log(`✅ Success with ${model}!`);
      console.log('Response:', result.response);
      console.log('---\n');
      return;
    } else {
      console.log(`❌ Failed: ${result.error}`);
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
      console.log('');
    }
  }
  
  console.log('All models failed.');
}

runTest().catch(console.error);

