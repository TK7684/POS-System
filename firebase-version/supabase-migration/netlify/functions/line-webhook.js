// Netlify Function for LINE Bot Webhook
// This receives messages from LINE and processes them

const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    
    if (!channelSecret) {
      console.error('LINE_CHANNEL_SECRET not configured');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Channel secret not configured' }),
      };
    }

    const body = event.body;
    const signature = event.headers['x-line-signature'] || 
                     event.headers['X-Line-Signature'] || 
                     event.multiValueHeaders?.['X-Line-Signature']?.[0];

    if (!signature) {
      console.error('No signature found');
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No signature' }),
      };
    }

    // Verify signature
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');

    if (hash !== signature) {
      console.error('Invalid signature', { received: signature, calculated: hash });
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    const data = JSON.parse(body);
    const events = data.events || [];

    console.log(`Received ${events.length} events from LINE`);

    // Process each event
    for (const evt of events) {
      if (evt.type === 'message') {
        const messageText = evt.message?.text || '';
        const messageType = evt.message?.type;
        const sourceType = evt.source?.type; // 'user', 'group', 'room'
        const sourceId = evt.source?.groupId || evt.source?.userId || evt.source?.roomId;
        const userId = evt.source?.userId;
        const imageUrl = evt.message?.type === 'image' ? 
          (await getImageUrl(evt.message.id, process.env.LINE_CHANNEL_ACCESS_TOKEN)) : null;

        console.log('Processing message:', {
          text: messageText,
          type: messageType,
          source: sourceType,
          sourceId: sourceId,
          userId: userId,
          hasImage: !!imageUrl,
        });

        // Store message in Supabase using REST API (no dependencies needed)
        // This allows the frontend to process messages asynchronously
        try {
          const supabaseUrl = process.env.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
          
          if (supabaseKey && supabaseUrl) {
            // Use Supabase REST API directly (no npm package needed)
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
                image_url: imageUrl,
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
          } else {
            console.log('Supabase credentials not configured, message logged only');
          }
        } catch (supabaseError) {
          console.error('Error storing message:', supabaseError);
          // Continue even if storage fails - message is still logged
        }

        // Always monitor and record expenses, but give feedback only after successful database update
        if (messageText && messageType === 'text') {
          try {
            // Process and record expense (will return feedback only if database was updated)
            const expenseResult = await processAndRecordExpense(messageText, userId, sourceId);
            
            // Only send feedback if expense was successfully recorded in database
            // Also send feedback for duplicates (no database update but user should know)
            if (expenseResult && expenseResult.feedback && 
                ((expenseResult.recorded === true && expenseResult.expenseId) || expenseResult.duplicate === true) &&
                process.env.LINE_CHANNEL_ACCESS_TOKEN && evt.replyToken) {
              await replyToLine(evt.replyToken, expenseResult.feedback, process.env.LINE_CHANNEL_ACCESS_TOKEN);
            }
          } catch (expenseError) {
            console.error('Error processing expense:', expenseError);
            // Don't send feedback on error - database wasn't updated
          }
        }

        // Only respond to commands if wake word "พอส" is used
        const hasWakeWord = messageText && messageText.includes('พอส');
        if (hasWakeWord && process.env.LINE_CHANNEL_ACCESS_TOKEN && evt.replyToken) {
          try {
            // Remove wake word and process the command
            const command = messageText.replace(/พอส\s*/i, '').trim();
            const replyText = await processCommand(command, messageType);
            if (replyText) {
              await replyToLine(evt.replyToken, replyText, process.env.LINE_CHANNEL_ACCESS_TOKEN);
            }
          } catch (replyError) {
            console.error('Error processing command:', replyError);
          }
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true, eventsProcessed: events.length }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Helper function to get image URL from LINE
async function getImageUrl(messageId, accessToken) {
  if (!accessToken || !messageId) return null;
  
  try {
    // LINE API requires downloading the image content
    // For now, we'll store the message ID and download later if needed
    // In production, you could download here and upload to Supabase Storage
    return `line://message/${messageId}`;
  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
}

// Process command after wake word (only called when "พอส" is detected)
async function processCommand(messageText, messageType) {
  if (!messageText || messageType !== 'text') {
    return null;
  }

  const text = messageText.trim().toLowerCase();

  // Help command
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
    return await getExpenseSummary('today');
  }

  if (text.includes('ค่าใช้จ่ายสัปดาห์') || text.includes('expense week')) {
    return await getExpenseSummary('week');
  }

  if (text.includes('ค่าใช้จ่ายเดือน') || text.includes('expense month')) {
    return await getExpenseSummary('month');
  }

  // Stock command
  if (text.includes('สต็อก') || text.includes('stock') || text.includes('สินค้า')) {
    return await getLowStockSummary();
  }

  // Statistics command
  if (text.includes('สถิติ') || text.includes('stat') || text.includes('summary')) {
    return await getExpenseStatistics();
  }

  // Delete latest entry command
  if (text.includes('ลบรายการล่าสุด') || text.includes('delete latest')) {
    return await handleDeleteLatestEntry(messageText);
  }

  // Purchase parsing
  if (text.includes('ซื้อ')) {
    const purchaseMatch = messageText.match(/ซื้อ\s*([ก-ฮ]+)\s+(\d+(?:\.\d+)?)\s*(กก|โล|กิโล|กรัม|ชิ้น|กระสอบ|kg)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (purchaseMatch) {
      const ingredient = purchaseMatch[1].trim();
      const quantity = purchaseMatch[2];
      const unit = purchaseMatch[3];
      const price = purchaseMatch[4].replace(/,/g, '');
      return `✅ บันทึกการซื้อ: ${ingredient} ${quantity} ${unit} ฿${price}\nรายการจะถูกอัพเดทในระบบ`;
    }
  }

  // Default: acknowledge
  return `✅ รับคำสั่งแล้ว\nพิมพ์ "พอส help" เพื่อดูคำสั่งทั้งหมด`;
}

// Process message and generate reply with command parsing (deprecated - use processCommand instead)
async function processMessageAndGetReply(messageText, messageType) {
  if (!messageText || messageType !== 'text') {
    return null;
  }

  const text = messageText.trim().toLowerCase();

  // ===== COMMAND PARSING =====
  // Delete latest entry command: "ลบรายการล่าสุด"
  if (text.includes('ลบรายการล่าสุด') || text.includes('ลบรายการ') || text.includes('delete latest')) {
    return await handleDeleteLatestEntry(messageText);
  }

  // ===== EXPENSE MESSAGES =====
  if (text.includes('ค่า') || text.includes('จ่าย') || text.includes('expense')) {
    const amountMatch = messageText.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/);
    const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : null;
    
    if (amount) {
      return `✅ บันทึกค่าใช้จ่าย: ฿${amount}\nรายการจะถูกบันทึกในระบบ`;
    }
    return `✅ กำลังบันทึกค่าใช้จ่าย...`;
  }

  // ===== PURCHASE MESSAGES =====
  // Enhanced purchase parsing: "ซื้อกุ้ง 20 กก 4750" or "ซื้อ กุ้ง 20 กก 4750"
  if (text.includes('ซื้อ') || text.match(/[ก-ฮ]+\s+\d+.*(กก|โล|กิโล|กรัม|ชิ้น|กระสอบ)/)) {
    // Pattern 1: "ซื้อกุ้ง 20 กก 4750" (no space after ซื้อ)
    let purchaseMatch = messageText.match(/ซื้อ([ก-ฮ]+)\s+(\d+(?:\.\d+)?)\s*(กก|โล|กิโล|กรัม|ชิ้น|กระสอบ|kg)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    
    // Pattern 2: "ซื้อ กุ้ง 20 กก 4750" (with space after ซื้อ)
    if (!purchaseMatch) {
      purchaseMatch = messageText.match(/ซื้อ\s+([ก-ฮ]+)\s+(\d+(?:\.\d+)?)\s*(กก|โล|กิโล|กรัม|ชิ้น|กระสอบ|kg)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    }
    
    // Pattern 3: "ซื้อกุ้ง 20 กก 4750 บาท" (with บาท at end)
    if (!purchaseMatch) {
      purchaseMatch = messageText.match(/ซื้อ([ก-ฮ]+)\s+(\d+(?:\.\d+)?)\s*(กก|โล|กิโล|กรัม|ชิ้น|กระสอบ|kg)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/i);
    }
    
    if (purchaseMatch) {
      const ingredient = purchaseMatch[1].trim();
      const quantity = purchaseMatch[2];
      const unit = purchaseMatch[3];
      const price = purchaseMatch[4].replace(/,/g, '');
      return `✅ บันทึกการซื้อ: ${ingredient} ${quantity} ${unit} ฿${price}\nรายการจะถูกอัพเดทในระบบ`;
    }
    return `✅ กำลังบันทึกการซื้อวัตถุดิบ...\nรายการจะถูกอัพเดทในระบบ`;
  }

  // ===== SALES MESSAGES =====
  if (text.includes('จ่ายสด') || text.includes('ขาย') || (text.includes('บาท') && (text.includes('ข้าว') || text.includes('สาหร่าย')))) {
    const amountMatch = messageText.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/);
    const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : null;
    
    if (amount) {
      return `💰 บันทึกการขาย: ฿${amount}\nรายการจะถูกบันทึกในระบบ`;
    }
    return `💰 กำลังบันทึกการขาย...`;
  }

  // ===== USE NLP FOR COMPLEX MESSAGES =====
  // For messages that don't match patterns, use NLP
  try {
    const nlpResult = await understandMessageWithNLP(messageText);
    if (nlpResult && nlpResult.action) {
      return nlpResult.reply;
    }
  } catch (nlpError) {
    console.error('NLP processing error:', nlpError);
  }

  // Default response
  return `📝 รับข้อความแล้ว: ${messageText}\nกำลังประมวลผล...`;
}

// Handle delete latest entry command
async function handleDeleteLatestEntry(messageText) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      return '❌ ไม่สามารถลบรายการได้ (ระบบยังไม่พร้อม)';
    }

    // Try to delete from expenses table first
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

// NLP integration with free API and Google Cloud fallback
async function understandMessageWithNLP(messageText) {
  // Try free API first (Hugging Face Inference API - free tier)
  try {
    const freeApiResult = await callFreeNLPAPI(messageText);
    if (freeApiResult) {
      return freeApiResult;
    }
  } catch (freeError) {
    console.log('Free NLP API failed, trying Google Cloud...', freeError.message);
  }

  // Fallback to Google Cloud Natural Language API if available
  try {
    const googleApiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (googleApiKey) {
      const googleResult = await callGoogleNLPAPI(messageText, googleApiKey);
      if (googleResult) {
        return googleResult;
      }
    }
  } catch (googleError) {
    console.log('Google NLP API failed:', googleError.message);
  }

  return null;
}

// Free NLP API (Hugging Face Inference API)
async function callFreeNLPAPI(messageText) {
  try {
    // Use Hugging Face API with API key if available
    const hfApiKey = process.env.HUGGING_FACE_API_KEY;
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add API key to headers if available (more reliable)
    if (hfApiKey) {
      headers['Authorization'] = `Bearer ${hfApiKey}`;
    }

    // Use a lightweight Thai language model from Hugging Face
    const response = await fetch('https://api-inference.huggingface.co/models/airesearch/wangchanberta-base-att-spm-uncased', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        inputs: messageText,
        parameters: {
          return_all_scores: true
        }
      }),
      // Add timeout to avoid hanging
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Parse result and extract intent
    // For now, return a simple classification
    const text = messageText.toLowerCase();
    if (text.includes('ลบ') || text.includes('delete')) {
      return {
        action: 'delete',
        reply: '🗑️ ต้องการลบรายการใช่ไหม? พิมพ์ "ลบรายการล่าสุด" เพื่อยืนยัน'
      };
    }
    
    if (text.includes('ซื้อ') || text.includes('buy') || text.includes('purchase')) {
      return {
        action: 'purchase',
        reply: '✅ กำลังบันทึกการซื้อ...'
      };
    }

    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('NLP API timeout');
    }
    throw error;
  }
}

// Google Cloud Natural Language API (fallback)
async function callGoogleNLPAPI(messageText, apiKey) {
  try {
    const response = await fetch(`https://language.googleapis.com/v1/documents:analyzeSentiment?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: messageText,
          language: 'th'
        },
        encodingType: 'UTF8'
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Google NLP API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Extract intent from sentiment and entities
    const text = messageText.toLowerCase();
    if (text.includes('ลบ') || text.includes('delete')) {
      return {
        action: 'delete',
        reply: '🗑️ ต้องการลบรายการใช่ไหม?'
      };
    }

    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Google NLP API timeout');
    }
    throw error;
  }
}

// Process and record expense with duplicate detection (gives feedback when recorded)
async function processAndRecordExpense(messageText, userId, sourceId) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseKey || !supabaseUrl) {
      console.log('Supabase not configured for expense recording');
      return { recorded: false };
    }

    // Parse expense from message
    const expenseData = parseExpenseFromMessage(messageText);
    if (!expenseData) {
      return { recorded: false }; // Not an expense message
    }

    // Check for duplicates in database (last 30 days)
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
      
      // Check for duplicates
      const duplicate = findDuplicateExpense(expenseData, existingExpenses);
      
      if (duplicate) {
        console.log('Duplicate expense found, not recording:', duplicate);
        // Give feedback for duplicate (no database update needed)
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
      user_id: userId || null, // Will be set by RLS or use a system user
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
      // Don't return feedback - database wasn't updated
      return {
        recorded: false,
        feedback: null // No feedback on error
      };
    }

    const inserted = await insertResponse.json();
    const savedExpense = Array.isArray(inserted) ? inserted[0] : inserted;

    // Verify we got a valid saved expense with ID
    if (!savedExpense || !savedExpense.id) {
      console.error('Failed to get saved expense ID');
      return {
        recorded: false,
        feedback: null // No feedback - couldn't confirm save
      };
    }

    console.log('Expense successfully recorded in database:', savedExpense.id);
    
    // Only return feedback after confirming database was updated
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

// Parse expense data from message
function parseExpenseFromMessage(messageText) {
  const text = messageText.trim();
  
  // Check if it's an expense message
  const expenseKeywords = ['ค่า', 'จ่าย', 'expense', 'ค่าไฟ', 'ค่าน้ำ', 'ค่าเช่า', 'ค่าแรง'];
  const isExpense = expenseKeywords.some(keyword => text.toLowerCase().includes(keyword));
  
  if (!isExpense && !text.match(/\d+\s*บาท/)) {
    return null; // Not an expense message
  }

  // Extract amount
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

  // Extract category
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

  // Extract description (remove amount and common words)
  let description = text
    .replace(/\d+(?:,\d{3})*(?:\.\d{2})?\s*บาท?/gi, '')
    .replace(/฿\s*\d+/gi, '')
    .trim();

  if (!description || description.length < 2) {
    description = category === 'utility' ? 'ค่าใช้จ่ายสาธารณูปโภค' : 'ค่าใช้จ่ายอื่นๆ';
  }

  // Extract date (if mentioned)
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

  // Extract vendor (if mentioned)
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
    description: description.substring(0, 200), // Limit length
    date: expenseDate,
    vendor,
    paymentMethod: 'cash',
    originalMessage: messageText,
  };
}

// Find duplicate expense with fuzzy matching
function findDuplicateExpense(newExpense, existingExpenses) {
  if (!existingExpenses || existingExpenses.length === 0) {
    return null;
  }

  const amountTolerance = 10; // Within 10 baht
  const similarityThreshold = 0.7; // 70% similarity

  for (const existing of existingExpenses) {
    // Check amount similarity
    const amountDiff = Math.abs(parseFloat(existing.amount) - newExpense.amount);
    if (amountDiff > amountTolerance) {
      continue;
    }

    // Check description similarity
    const similarity = calculateSimilarity(
      newExpense.description.toLowerCase(),
      (existing.description || '').toLowerCase()
    );

    if (similarity >= similarityThreshold) {
      // Check date similarity (within 3 days)
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

// Calculate string similarity (Levenshtein distance)
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

// Get expense summary for today/week/month
async function getExpenseSummary(period) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
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

// Get low stock summary
async function getLowStockSummary() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
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

// Get expense statistics
async function getExpenseStatistics() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
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
    
    // Group by category
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

// Helper function to reply to LINE
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

