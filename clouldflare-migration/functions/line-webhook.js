/**
 * LINE Bot Webhook Handler for Cloudflare Pages Functions
 * Handles incoming LINE messages and processes them using AI assistant
 * No external imports - pure JavaScript implementation
 */

// Simple logger for serverless environment
const log = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};

// Simple Supabase client implementation
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  from(table) {
    return new SupabaseQuery(this.url, this.key, table);
  }
}

class SupabaseQuery {
  constructor(url, key, table) {
    this.url = url;
    this.key = key;
    this.table = table;
  }

  async insert(data) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase insert failed: ${error}`);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  
  log.info('LINE Webhook - Request received', {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString()
  });

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature',
      },
    });
  }

  // Only accept POST requests
  if (request.method !== 'POST') {
    log.warn('Invalid method', { method: request.method });
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get environment variables
    const LINE_CHANNEL_SECRET = env.LINE_CHANNEL_SECRET;
    const LINE_CHANNEL_ACCESS_TOKEN = env.LINE_CHANNEL_ACCESS_TOKEN;
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const GOOGLE_CLOUD_API_KEY = env.GOOGLE_CLOUD_API_KEY;

    if (!LINE_CHANNEL_SECRET || !LINE_CHANNEL_ACCESS_TOKEN) {
      log.error('Missing LINE credentials');
      return new Response('Server configuration error', { status: 500 });
    }

    // Parse webhook body
    const body = await request.text();
    const signature = request.headers.get('X-Line-Signature');

    log.info('Processing LINE webhook', {
      bodyLength: body.length,
      hasSignature: !!signature
    });

    // Verify signature (simplified for now)
    // TODO: Implement proper signature verification using crypto.subtle
    
    const webhookData = JSON.parse(body);
    const events = webhookData.events || [];

    log.info('LINE events received', { count: events.length });

    // Process each event
    const responses = await Promise.all(
      events.map(event => processLineEvent(event, {
        LINE_CHANNEL_ACCESS_TOKEN,
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        GOOGLE_CLOUD_API_KEY
      }))
    );

    log.info('LINE events processed', { responses: responses.length });

    return new Response(JSON.stringify({ success: true, processed: events.length }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    log.error('LINE webhook error', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

/**
 * Process individual LINE event
 */
async function processLineEvent(event, config) {
  const { LINE_CHANNEL_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLOUD_API_KEY } = config;

  log.info('Processing event', {
    type: event.type,
    source: event.source?.type
  });

  // Only handle message events for now
  if (event.type !== 'message') {
    log.info('Skipping non-message event', { type: event.type });
    return { skipped: true, type: event.type };
  }

  const replyToken = event.replyToken;
  const userMessage = event.message?.text || '';
  const sourceType = event.source?.type;
  const userId = event.source?.userId;
  const groupId = event.source?.groupId;

  log.info('Message received', {
    message: userMessage.substring(0, 100),
    sourceType,
    userId: userId?.substring(0, 8) + '...'
  });

  try {
    // Store message in database
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { error } = await supabase.from('line_messages').insert({
        user_id: userId,
        group_id: groupId,
        source_type: sourceType,
        message: userMessage,
        reply_token: replyToken,
        created_at: new Date().toISOString()
      });

      if (error) {
        log.warn('Failed to store message in database', error);
      } else {
        log.info('Message stored in database');
      }
    }

    // Generate AI response using Gemini
    let aiResponse = 'ขอบคุณสำหรับข้อความค่ะ'; // Default response

    if (GOOGLE_CLOUD_API_KEY && userMessage) {
      try {
        aiResponse = await getGeminiResponse(userMessage, GOOGLE_CLOUD_API_KEY);
      } catch (aiError) {
        log.error('AI response failed, using default', aiError);
      }
    }

    log.info('Sending LINE reply', {
      replyToken: replyToken.substring(0, 10) + '...',
      responseLength: aiResponse.length
    });

    // Send reply to LINE
    await replyLineMessage(replyToken, aiResponse, LINE_CHANNEL_ACCESS_TOKEN);

    return { success: true, replied: true };

  } catch (error) {
    log.error('Event processing error', error);
    
    // Try to send error message to user
    try {
      await replyLineMessage(
        replyToken,
        'ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง',
        LINE_CHANNEL_ACCESS_TOKEN
      );
    } catch (replyError) {
      log.error('Failed to send error reply', replyError);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Get AI response from Google Gemini
 */
async function getGeminiResponse(message, apiKey) {
  const startTime = Date.now();
  
  try {
    log.info('→ Calling Gemini API...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `คุณเป็นผู้ช่วยของร้านอาหารไทย ตอบคำถามเกี่ยวกับเมนู ราคา และข้อมูลร้าน โดยใช้ภาษาไทยที่สุภาพและเป็นกันเอง\n\nคำถาม: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ขอบคุณสำหรับข้อความค่ะ';

    const duration = Date.now() - startTime;
    log.info(`✓ Gemini response received in ${duration}ms`);

    return aiText;

  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`✗ Gemini API failed after ${duration}ms`, error);
    throw error;
  }
}

/**
 * Reply to LINE message
 */
async function replyLineMessage(replyToken, message, accessToken) {
  const startTime = Date.now();

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        replyToken,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      log.error(`LINE API error (${duration}ms)`, {
        status: response.status,
        error: errorText
      });
      throw new Error(`LINE API error: ${response.status}`);
    }

    log.info(`✓ LINE reply sent in ${duration}ms`);

  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`✗ LINE reply failed after ${duration}ms`, error);
    throw error;
  }
}
