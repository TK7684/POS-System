// Cloudflare Worker for LINE Bot Webhook
// This replaces the Netlify Function

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        },
      });
    }

    // Handle GET requests (LINE verification)
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', message: 'LINE webhook endpoint is active' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Only allow POST requests for actual webhook events
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      const channelSecret = env.LINE_CHANNEL_SECRET;
      
      if (!channelSecret) {
        console.error('LINE_CHANNEL_SECRET not configured');
        return new Response(JSON.stringify({ error: 'Channel secret not configured' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const body = await request.text();
      const signature = request.headers.get('X-Line-Signature') || request.headers.get('x-line-signature');

      if (!signature) {
        console.error('No signature found');
        return new Response(JSON.stringify({ error: 'No signature' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Verify signature using Web Crypto API (Cloudflare Workers)
      const encoder = new TextEncoder();
      const keyData = encoder.encode(channelSecret);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Sign the body
      const bodyBuffer = encoder.encode(body);
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyBuffer);
      const signatureArray = new Uint8Array(signatureBuffer);
      
      // Convert to base64
      let binary = '';
      for (let i = 0; i < signatureArray.length; i++) {
        binary += String.fromCharCode(signatureArray[i]);
      }
      const calculatedSignature = btoa(binary);

      if (signature !== calculatedSignature) {
        console.error('Invalid signature', { received: signature.substring(0, 20), calculated: calculatedSignature.substring(0, 20) });
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const data = JSON.parse(body);
      const events = data.events || [];

      console.log(`Received ${events.length} events from LINE`);

      // Handle LINE verification request (empty events array)
      // Always return 200 OK for verification, even if env vars aren't fully configured
      if (events.length === 0) {
        console.log('LINE webhook verification request received');
        return new Response(JSON.stringify({ status: 'ok', message: 'Webhook verified' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Process each event
      for (const evt of events) {
        if (evt.type === 'message') {
          const messageText = evt.message?.text || '';
          const messageType = evt.message?.type;
          const sourceType = evt.source?.type;
          const sourceId = evt.source?.groupId || evt.source?.userId || evt.source?.roomId;
          const userId = evt.source?.userId;

          console.log('Processing message:', {
            text: messageText,
            type: messageType,
            source: sourceType,
            sourceId: sourceId,
            userId: userId,
          });

          // Store message in Supabase
          try {
            const supabaseUrl = env?.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
            const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_ANON_KEY;
            
            if (supabaseKey && supabaseUrl) {
              const response = await fetch(`${supabaseUrl}/rest/v1/line_messages`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  message_text: messageText,
                  message_type: messageType,
                  source_type: sourceType,
                  source_id: sourceId,
                  user_id: userId,
                  image_url: null,
                  raw_data: evt,
                  processed: false,
                  created_at: new Date().toISOString(),
                }),
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Error storing message in Supabase:', response.status, errorText);
              } else {
                console.log('Message stored successfully in Supabase');
              }
            }
          } catch (supabaseError) {
            console.error('Error storing message:', supabaseError);
          }

          // Always monitor and record expenses, but give feedback only after successful database update
          if (messageText && messageType === 'text') {
            try {
              // Process and record expense (will return feedback only if database was updated)
              const expenseResult = await processAndRecordExpense(messageText, userId, sourceId, env);
              
      // Only send feedback if expense was successfully recorded in database
      // Also send feedback for duplicates (no database update but user should know)
      if (expenseResult && expenseResult.feedback && 
          ((expenseResult.recorded === true && expenseResult.expenseId) || expenseResult.duplicate === true) &&
          env?.LINE_CHANNEL_ACCESS_TOKEN && evt.replyToken) {
        await replyToLine(evt.replyToken, expenseResult.feedback, env.LINE_CHANNEL_ACCESS_TOKEN);
      }
            } catch (expenseError) {
              console.error('Error processing expense:', expenseError);
              // Don't send feedback on error - database wasn't updated
            }
          }

          // Only respond to commands if wake word "พอส" is used
          const hasWakeWord = messageText && messageText.includes('พอส');
          if (hasWakeWord && env?.LINE_CHANNEL_ACCESS_TOKEN && evt.replyToken) {
            try {
              // Remove wake word and process the command
              const command = messageText.replace(/พอส\s*/i, '').trim();
              const replyText = await processCommand(command, messageType, env);
              if (replyText) {
                await replyToLine(evt.replyToken, replyText, env.LINE_CHANNEL_ACCESS_TOKEN);
              }
            } catch (replyError) {
              console.error('Error processing command:', replyError);
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true, eventsProcessed: events.length }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Webhook error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

// Copy all helper functions from netlify/functions/line-webhook.js
// (processAndRecordExpense, parseExpenseFromMessage, findDuplicateExpense, etc.)
// They work the same way, just use env instead of process.env

async function processAndRecordExpense(messageText, userId, sourceId, env) {
  try {
    const supabaseUrl = env?.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_ANON_KEY;
    
    if (!supabaseKey || !supabaseUrl) {
      console.log('Supabase not configured for expense recording');
      return { recorded: false };
    }

    // Parse expense from message
    const expenseData = parseExpenseFromMessage(messageText);
    if (!expenseData) {
      return { recorded: false };
    }

    // Check for duplicates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/expenses?expense_date=gte.${thirtyDaysAgo.toISOString().split('T')[0]}&order=expense_date.desc&limit=50`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (checkResponse.ok) {
      const existingExpenses = await checkResponse.json();
      const duplicate = findDuplicateExpense(expenseData, existingExpenses);
      
      if (duplicate) {
        console.log('Duplicate expense found, not recording:', duplicate);
        return {
          recorded: false,
          duplicate: true,
          feedback: `ℹ️ พบค่าใช้จ่ายที่คล้ายกันอยู่แล้ว\n` +
                    `📋 ${duplicate.description}\n` +
                    `💰 ฿${parseFloat(duplicate.amount).toLocaleString('th-TH')}\n` +
                    `📅 ${duplicate.expense_date}\n` +
                    `(ไม่บันทึกซ้ำ)`
        };
      }
    }

    // Create new expense
    const expenseRecord = {
      user_id: userId || null,
      category: expenseData.category || 'other',
      subcategory: expenseData.subcategory || null,
      description: expenseData.description || messageText,
      amount: expenseData.amount,
      expense_date: expenseData.date || new Date().toISOString().split('T')[0],
      payment_method: expenseData.paymentMethod || 'cash',
      vendor: expenseData.vendor || null,
      notes: `บันทึกจาก LINE Bot: ${messageText}`,
      status: 'approved',
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(expenseRecord),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Error inserting expense:', insertResponse.status, errorText);
      return {
        recorded: false,
        feedback: null
      };
    }

    const inserted = await insertResponse.json();
    const savedExpense = Array.isArray(inserted) ? inserted[0] : inserted;

    if (!savedExpense || !savedExpense.id) {
      console.error('Failed to get saved expense ID');
      return {
        recorded: false,
        feedback: null
      };
    }

    console.log('Expense successfully recorded in database:', savedExpense.id);
    
    return {
      recorded: true,
      expenseId: savedExpense.id,
      feedback: `✅ บันทึกค่าใช้จ่ายเรียบร้อย\n` +
                `📋 ${expenseData.description}\n` +
                `💰 ฿${expenseData.amount.toLocaleString('th-TH')}\n` +
                `📅 ${expenseData.date || 'วันนี้'}\n` +
                `(บันทึกอัตโนมัติ)`
    };
  } catch (error) {
    console.error('Error in processAndRecordExpense:', error);
    throw error;
  }
}

function parseExpenseFromMessage(messageText) {
  const text = messageText.trim();
  
  const expenseKeywords = ['ค่า', 'จ่าย', 'expense', 'ค่าไฟ', 'ค่าน้ำ', 'ค่าเช่า', 'ค่าแรง'];
  const isExpense = expenseKeywords.some(keyword => text.toLowerCase().includes(keyword));
  
  if (!isExpense && !text.match(/\d+\s*บาท/)) {
    return null;
  }

  const amountPatterns = [
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*฿/,
    /฿\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)/,
  ];

  let amount = null;
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0) break;
    }
  }

  if (!amount || amount <= 0) {
    return null;
  }

  let category = 'other';
  let subcategory = null;
  const categoryMap = {
    'ค่าไฟ': { category: 'utility', subcategory: 'electric' },
    'ค่าไฟฟ้า': { category: 'utility', subcategory: 'electric' },
    'ค่าน้ำ': { category: 'utility', subcategory: 'water' },
    'ค่าเช่า': { category: 'rental', subcategory: null },
    'ค่าแรง': { category: 'labor', subcategory: null },
    'ค่าโทร': { category: 'utility', subcategory: null },
    'ค่าเน็ต': { category: 'utility', subcategory: null },
  };

  for (const [keyword, mapping] of Object.entries(categoryMap)) {
    if (text.includes(keyword)) {
      category = mapping.category;
      subcategory = mapping.subcategory;
      break;
    }
  }

  let description = text
    .replace(/\d+(?:,\d{3})*(?:\.\d{2})?\s*บาท?/gi, '')
    .replace(/฿\s*\d+/gi, '')
    .trim();

  if (!description || description.length < 2) {
    description = category === 'utility' ? 'ค่าใช้จ่ายสาธารณูปโภค' : 'ค่าใช้จ่ายอื่นๆ';
  }

  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
  ];

  let expenseDate = null;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes('\\d{4}')) {
        expenseDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else {
        expenseDate = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
      break;
    }
  }

  let vendor = null;
  const vendorPattern = /(?:จาก|ร้าน|ที่)\s*([ก-ฮA-Za-z0-9\s]+)/i;
  const vendorMatch = text.match(vendorPattern);
  if (vendorMatch) {
    vendor = vendorMatch[1].trim();
  }

  return {
    amount,
    category,
    subcategory,
    description: description.substring(0, 200),
    date: expenseDate,
    vendor,
    paymentMethod: 'cash',
    originalMessage: messageText,
  };
}

function findDuplicateExpense(newExpense, existingExpenses) {
  if (!existingExpenses || existingExpenses.length === 0) {
    return null;
  }

  const amountTolerance = 10;
  const similarityThreshold = 0.7;

  for (const existing of existingExpenses) {
    const amountDiff = Math.abs(parseFloat(existing.amount) - newExpense.amount);
    if (amountDiff > amountTolerance) {
      continue;
    }

    const similarity = calculateSimilarity(
      newExpense.description.toLowerCase(),
      (existing.description || '').toLowerCase()
    );

    if (similarity >= similarityThreshold) {
      const existingDate = new Date(existing.expense_date);
      const newDate = newExpense.date ? new Date(newExpense.date) : new Date();
      const daysDiff = Math.abs((existingDate - newDate) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 3) {
        return existing;
      }
    }
  }

  return null;
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}

async function processCommand(messageText, messageType, env) {
  if (!messageText || messageType !== 'text') {
    return null;
  }

  const text = messageText.trim().toLowerCase();

  if (text === '' || text === 'help' || text === 'ช่วย' || text === '?' || text === 'help me') {
    return `🤖 พอส Bot\n\n` +
           `📋 คำสั่งที่ใช้ได้:\n` +
           `• "พอส" - ดูคำสั่งทั้งหมด\n` +
           `• "พอส ค่าใช้จ่ายวันนี้" - ดูค่าใช้จ่ายวันนี้\n` +
           `• "พอส ค่าใช้จ่ายสัปดาห์" - ดูค่าใช้จ่ายสัปดาห์นี้\n` +
           `• "พอส สต็อก" - ดูสต็อกที่ใกล้หมด\n` +
           `• "พอส ลบรายการล่าสุด" - ลบรายการล่าสุด\n` +
           `• "พอส สถิติ" - ดูสถิติค่าใช้จ่าย\n\n` +
           `💡 หมายเหตุ: พอสจะบันทึกค่าใช้จ่ายอัตโนมัติโดยไม่ต้องเรียก`;
  }

  // Expense summary commands
  if (text.includes('ค่าใช้จ่ายวันนี้') || text.includes('expense today')) {
    return await getExpenseSummary('today', env);
  }

  if (text.includes('ค่าใช้จ่ายสัปดาห์') || text.includes('expense week')) {
    return await getExpenseSummary('week', env);
  }

  if (text.includes('ค่าใช้จ่ายเดือน') || text.includes('expense month')) {
    return await getExpenseSummary('month', env);
  }

  // Stock command
  if (text.includes('สต็อก') || text.includes('stock') || text.includes('สินค้า')) {
    return await getLowStockSummary(env);
  }

  // Statistics command
  if (text.includes('สถิติ') || text.includes('stat') || text.includes('summary')) {
    return await getExpenseStatistics(env);
  }

  // Delete latest entry command
  if (text.includes('ลบรายการล่าสุด') || text.includes('delete latest')) {
    return await handleDeleteLatestEntry(messageText, env);
  }

  return `✅ รับคำสั่งแล้ว\nพิมพ์ "พอส help" เพื่อดูคำสั่งทั้งหมด`;
}

async function getExpenseSummary(period, env) {
  try {
    const supabaseUrl = env?.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_ANON_KEY;
    
    if (!supabaseKey || !supabaseUrl) {
      return '❌ ระบบยังไม่พร้อม';
    }

    const today = new Date();
    let startDate = new Date(today);
    
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(today.getDate() - 30);
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/expenses?expense_date=gte.${startDate.toISOString().split('T')[0]}&select=amount,description,expense_date&order=expense_date.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      return '❌ ไม่สามารถดึงข้อมูลได้';
    }

    const expenses = await response.json();
    const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const periodName = period === 'today' ? 'วันนี้' : period === 'week' ? 'สัปดาห์นี้' : 'เดือนนี้';
    
    let message = `📊 ค่าใช้จ่าย${periodName}\n\n`;
    message += `💰 รวม: ฿${total.toLocaleString('th-TH')}\n`;
    message += `📋 จำนวนรายการ: ${expenses.length}\n\n`;
    
    if (expenses.length > 0) {
      message += `รายการล่าสุด:\n`;
      expenses.slice(0, 5).forEach((e, i) => {
        message += `${i + 1}. ${e.description} ฿${parseFloat(e.amount).toLocaleString('th-TH')}\n`;
      });
      if (expenses.length > 5) {
        message += `... และอีก ${expenses.length - 5} รายการ`;
      }
    }

    return message;
  } catch (error) {
    console.error('Error getting expense summary:', error);
    return '❌ เกิดข้อผิดพลาด';
  }
}

async function getLowStockSummary(env) {
  try {
    const supabaseUrl = env?.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_ANON_KEY;
    
    if (!supabaseKey || !supabaseUrl) {
      return '❌ ระบบยังไม่พร้อม';
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ingredients?select=name,current_stock,min_stock,unit&current_stock=not.is.null&min_stock=not.is.null&is_active=eq.true`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      return '❌ ไม่สามารถดึงข้อมูลได้';
    }

    const ingredients = await response.json();
    const lowStock = ingredients.filter(ing => {
      const current = parseFloat(ing.current_stock) || 0;
      const min = parseFloat(ing.min_stock) || 0;
      return current <= min && min > 0;
    });

    if (lowStock.length === 0) {
      return `✅ สต็อกทั้งหมดเพียงพอ\nไม่มีรายการใกล้หมด`;
    }

    let message = `📦 สต็อกใกล้หมด (${lowStock.length} รายการ)\n\n`;
    lowStock.slice(0, 10).forEach((item, i) => {
      const stock = parseFloat(item.current_stock) || 0;
      const min = parseFloat(item.min_stock) || 0;
      const unit = item.unit || '';
      message += `${i + 1}. ${item.name}\n`;
      message += `   สต็อก: ${stock} ${unit} (ขั้นต่ำ: ${min} ${unit})\n\n`;
    });

    if (lowStock.length > 10) {
      message += `... และอีก ${lowStock.length - 10} รายการ`;
    }

    return message;
  } catch (error) {
    console.error('Error getting low stock:', error);
    return '❌ เกิดข้อผิดพลาด';
  }
}

async function getExpenseStatistics(env) {
  try {
    const supabaseUrl = env?.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_ANON_KEY;
    
    if (!supabaseKey || !supabaseUrl) {
      return '❌ ระบบยังไม่พร้อม';
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/expenses?expense_date=gte.${thirtyDaysAgo.toISOString().split('T')[0]}&select=amount,category&order=expense_date.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      return '❌ ไม่สามารถดึงข้อมูลได้';
    }

    const expenses = await response.json();
    const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const byCategory = {};
    expenses.forEach(e => {
      const cat = e.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + (parseFloat(e.amount) || 0);
    });

    let message = `📊 สถิติค่าใช้จ่าย (30 วัน)\n\n`;
    message += `💰 รวม: ฿${total.toLocaleString('th-TH')}\n`;
    message += `📋 จำนวนรายการ: ${expenses.length}\n\n`;
    message += `ตามหมวดหมู่:\n`;
    
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([cat, amount]) => {
        const percent = ((amount / total) * 100).toFixed(1);
        message += `• ${cat}: ฿${amount.toLocaleString('th-TH')} (${percent}%)\n`;
      });

    return message;
  } catch (error) {
    console.error('Error getting statistics:', error);
    return '❌ เกิดข้อผิดพลาด';
  }
}

async function handleDeleteLatestEntry(messageText, env) {
  try {
    const supabaseUrl = env?.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      return '❌ ไม่สามารถลบรายการได้ (ระบบยังไม่พร้อม)';
    }

    const expenseResponse = await fetch(`${supabaseUrl}/rest/v1/expenses?order=created_at.desc&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (expenseResponse.ok) {
      const expenses = await expenseResponse.json();
      if (expenses && expenses.length > 0) {
        const expenseId = expenses[0].id;
        const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/expenses?id=eq.${expenseId}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });

        if (deleteResponse.ok) {
          return `✅ ลบรายการล่าสุดเรียบร้อย\n${expenses[0].description || 'รายการค่าใช้จ่าย'} ฿${expenses[0].amount || 0}`;
        }
      }
    }

    return 'ℹ️ ไม่พบรายการล่าสุดที่สามารถลบได้';
  } catch (error) {
    console.error('Error deleting latest entry:', error);
    return '❌ เกิดข้อผิดพลาดในการลบรายการ';
  }
}

async function replyToLine(replyToken, message, accessToken) {
  if (!replyToken || !message || !accessToken) {
    console.error('Missing reply parameters');
    return;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{
          type: 'text',
          text: message,
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE API error:', response.status, errorText);
    } else {
      console.log('Reply sent successfully');
    }
  } catch (error) {
    console.error('Error replying to LINE:', error);
  }
}

