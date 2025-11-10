/**
 * LINE Bot Webhook Handler for Cloudflare Pages Functions
 * Full AI Assistant with Database Access - Read/Write/Analyze Everything
 * No external imports - pure JavaScript implementation
 */

// Simple logger for serverless environment
const log = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};

// Enhanced Supabase client with full CRUD operations
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  from(table) {
    return new SupabaseQuery(this.url, this.key, table);
  }

  // Direct query method
  async query(method, table, options = {}) {
    const { filters = {}, data = {}, select = '*' } = options;
    
    let url = `${this.url}/rest/v1/${table}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Prefer': 'return=representation'
    };

    // Build query string for filters
    const queryParams = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'object') {
        if (value.eq) queryParams.push(`${key}=eq.${encodeURIComponent(value.eq)}`);
        if (value.gte) queryParams.push(`${key}=gte.${encodeURIComponent(value.gte)}`);
        if (value.lte) queryParams.push(`${key}=lte.${encodeURIComponent(value.lte)}`);
        if (value.like) queryParams.push(`${key}=like.*${encodeURIComponent(value.like)}*`);
        if (value.ilike) queryParams.push(`${key}=ilike.*${encodeURIComponent(value.ilike)}*`);
      } else {
        queryParams.push(`${key}=eq.${encodeURIComponent(value)}`);
      }
    });
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }

    if (select !== '*') {
      url += (queryParams.length > 0 ? '&' : '?') + `select=${encodeURIComponent(select)}`;
    }

    try {
      let response;
      if (method === 'GET') {
        response = await fetch(url, { method: 'GET', headers });
      } else if (method === 'POST') {
        response = await fetch(`${this.url}/rest/v1/${table}`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
      } else if (method === 'PATCH') {
        response = await fetch(url, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
      } else if (method === 'DELETE') {
        response = await fetch(url, { method: 'DELETE', headers });
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase ${method} failed: ${error}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

class SupabaseQuery {
  constructor(url, key, table) {
    this.url = url;
    this.key = key;
    this.table = table;
  }

  async select(columns = '*') {
    return await this.client.query('GET', this.table, { select: columns });
  }

  async insert(data) {
    return await this.client.query('POST', this.table, { data });
  }

  async update(data) {
    return await this.client.query('PATCH', this.table, { data });
  }

  async delete() {
    return await this.client.query('DELETE', this.table);
  }

  eq(column, value) {
    this.filters = this.filters || {};
    this.filters[column] = value;
    return this;
  }

  get client() {
    return new SupabaseClient(this.url, this.key);
  }
}

// Database operations helper
class DatabaseHelper {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = new SupabaseClient(supabaseUrl, supabaseKey);
  }

  async read(table, filters = {}, limit = 50) {
    const result = await this.supabase.query('GET', table, { filters, select: '*' });
    if (result.error) throw result.error;
    return (result.data || []).slice(0, limit);
  }

  async create(table, data) {
    const result = await this.supabase.query('POST', table, { data });
    if (result.error) throw result.error;
    return result.data;
  }

  async update(table, data, filters) {
    const result = await this.supabase.query('PATCH', table, { data, filters });
    if (result.error) throw result.error;
    return result.data;
  }

  async delete(table, filters) {
    const result = await this.supabase.query('DELETE', table, { filters });
    if (result.error) throw result.error;
    return result.data;
  }
}

// AI Intent Analyzer using Gemini
async function analyzeIntent(message, apiKey, dbHelper) {
  try {
    // Get database schema context
    const schemaContext = `
Database Tables:
- menus: id, menu_id, name, price, cost_per_unit, description, is_active, is_available
- ingredients: id, name, unit, current_stock, min_stock, cost_per_unit, description
- stock_transactions: id, ingredient_id, menu_id, transaction_type, quantity, total_amount, created_at
- platforms: id, name, commission_rate, is_active
- menu_recipes: id, menu_id, ingredient_id, quantity_per_serve, unit

Available Operations:
- READ: Show, list, display, check, view, get
- CREATE: Add, create, insert, new, record
- UPDATE: Edit, update, change, modify, set
- DELETE: Delete, remove
- ANALYZE: Calculate, analyze, summary, report, profit, cost
`;

    const prompt = `You are a POS system AI assistant. Analyze the user's intent and return JSON:

{
  "type": "read|create|update|delete|analyze|conversation",
  "entity": "menus|ingredients|stock_transactions|platforms|menu_recipes|sales|purchases",
  "action": "what the user wants to do",
  "parameters": {
    "filters": {},
    "data": {},
    "query": "specific question"
  }
}

User message: "${message}"

${schemaContext}

Return ONLY valid JSON, no other text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const intent = jsonMatch ? JSON.parse(jsonMatch[0]) : { type: 'conversation', entity: null, parameters: {} };
    
    return intent;
  } catch (error) {
    log.error('Intent analysis failed', error);
    return { type: 'conversation', entity: null, parameters: { query: message } };
  }
}

// Execute database operation
async function executeOperation(intent, dbHelper) {
  const { type, entity, parameters } = intent;
  
  try {
    switch (type) {
      case 'read':
        if (!entity) {
          return { success: false, error: 'No entity specified' };
        }
        const data = await dbHelper.read(entity, parameters.filters || {}, parameters.limit || 20);
        return { success: true, data, count: data.length };
        
      case 'create':
        if (!entity || !parameters.data) {
          return { success: false, error: 'Missing entity or data' };
        }
        const created = await dbHelper.create(entity, parameters.data);
        return { success: true, data: created, count: created.length };
        
      case 'update':
        if (!entity || !parameters.filters || !parameters.data) {
          return { success: false, error: 'Missing entity, filters, or data' };
        }
        const updated = await dbHelper.update(entity, parameters.data, parameters.filters);
        return { success: true, data: updated, count: updated.length };
        
      case 'delete':
        if (!entity || !parameters.filters) {
          return { success: false, error: 'Missing entity or filters' };
        }
        const deleted = await dbHelper.delete(entity, parameters.filters);
        return { success: true, data: deleted, count: deleted.length };
        
      case 'analyze':
        // For analyze, we'll use AI to generate insights
        return { success: true, data: null, analysis: true };
        
      default:
        return { success: true, data: null, conversation: true };
    }
  } catch (error) {
    log.error('Operation execution failed', error);
    return { success: false, error: error.message };
  }
}

// Generate response using AI
async function generateResponse(message, intent, operationResult, apiKey) {
  try {
    let context = '';
    
    if (operationResult.success && operationResult.data) {
      const dataPreview = JSON.stringify(operationResult.data.slice(0, 5)).substring(0, 500);
      context = `\n\nDatabase Query Result (${operationResult.count} items):\n${dataPreview}`;
    }
    
    const prompt = `You are a helpful POS system assistant. Answer the user's question in Thai language, be friendly and professional.

User Question: "${message}"
Intent: ${intent.type} ${intent.entity || ''}
${context}

Provide a clear, helpful answer in Thai. If there's data, format it nicely.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'ขอบคุณสำหรับข้อความค่ะ';
  } catch (error) {
    log.error('Response generation failed', error);
    return 'ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง';
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
 * Process individual LINE event with full AI capabilities
 */
async function processLineEvent(event, config) {
  const { LINE_CHANNEL_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLOUD_API_KEY } = config;

  log.info('Processing event', {
    type: event.type,
    source: event.source?.type
  });

  // Only handle message events
  if (event.type !== 'message' || event.message?.type !== 'text') {
    log.info('Skipping non-text message event', { type: event.type });
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
    // Initialize database helper
    const dbHelper = new DatabaseHelper(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Store message in database
    try {
      await dbHelper.create('line_messages', {
        user_id: userId,
        group_id: groupId,
        source_type: sourceType,
        message: userMessage,
        reply_token: replyToken,
        created_at: new Date().toISOString()
      });
      log.info('Message stored in database');
    } catch (dbError) {
      log.warn('Failed to store message in database', dbError);
    }

    // Process with AI - Analyze intent
    log.info('→ Analyzing user intent...');
    const intent = await analyzeIntent(userMessage, GOOGLE_CLOUD_API_KEY, dbHelper);
    log.info('✓ Intent analyzed', { type: intent.type, entity: intent.entity });

    // Execute operation
    let operationResult = { success: true, data: null };
    if (intent.type !== 'conversation') {
      log.info('→ Executing database operation...', { type: intent.type, entity: intent.entity });
      operationResult = await executeOperation(intent, dbHelper);
      log.info('✓ Operation completed', { success: operationResult.success, count: operationResult.count });
    }

    // Generate AI response
    log.info('→ Generating AI response...');
    const aiResponse = await generateResponse(userMessage, intent, operationResult, GOOGLE_CLOUD_API_KEY);
    log.info('✓ Response generated', { length: aiResponse.length });

    // Send reply to LINE
    await replyLineMessage(replyToken, aiResponse, LINE_CHANNEL_ACCESS_TOKEN);

    return { success: true, replied: true, intent: intent.type };

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
