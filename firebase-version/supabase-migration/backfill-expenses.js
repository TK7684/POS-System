// Backfill expenses from Google Sheets and process old LINE messages
// Run this in browser console or as a Cloudflare Function

/**
 * Import expenses from Google Sheets format
 * Google Sheet: https://docs.google.com/spreadsheets/d/1J_D0qoEsR_zTtWcTNPNLkzxoJXrImobbhDJIAGeJQeA/edit?gid=2073711849#gid=2073711849
 * 
 * Format:
 * - Column A: วันที่ (Date)
 * - Column B: ชื่อค่าใช้จ่าย (Description)
 * - Column C: จำนวนค่าใช้จ่าย (Amount)
 * - Column D: กลุ่มค่าใช้จ่าย (Category)
 */

async function backfillExpensesFromGoogleSheets(expensesData) {
  if (!window.supabase || !window.POS) {
    throw new Error("Supabase not available");
  }

  console.log(`📊 Starting backfill of ${expensesData.length} expenses...`);

  const results = {
    imported: 0,
    skipped: 0,
    errors: 0,
    duplicates: [],
  };

  // Category mapping from Google Sheets to database
  const categoryMap = {
    'อื่นๆ': 'other',
    'ค่าพนักงาน': 'labor',
    'ค่าเช่าพื้นที่': 'rental',
    '2025-8': 'other', // Default for missing category
    '2025-9': 'other',
  };

  for (const expense of expensesData) {
    try {
      // Parse date from "27-Aug-2025" or "01-Sep-2025" format
      const dateStr = expense.date || expense.วันที่;
      let expenseDate;
      
      if (dateStr) {
        // Try to parse "DD-MMM-YYYY" format
        const dateMatch = dateStr.match(/(\d{1,2})-(\w{3})-(\d{4})/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          const monthMap = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          expenseDate = `${year}-${monthMap[month] || '01'}-${day.padStart(2, '0')}`;
        } else {
          expenseDate = new Date().toISOString().split('T')[0];
        }
      } else {
        expenseDate = new Date().toISOString().split('T')[0];
      }

      const description = expense.description || expense['ชื่อค่าใช้จ่าย'] || '';
      const amount = parseFloat(expense.amount || expense['จำนวนค่าใช้จ่าย'] || 0);
      const categoryName = expense.category || expense['กลุ่มค่าใช้จ่าย'] || 'อื่นๆ';
      const category = categoryMap[categoryName] || 'other';

      if (!description || amount <= 0) {
        console.warn('⚠️ Skipping invalid expense:', expense);
        results.skipped++;
        continue;
      }

      // Check for duplicates (same date, similar amount, similar description)
      const { data: existingExpenses } = await window.supabase
        .from('expenses')
        .select('*')
        .eq('expense_date', expenseDate)
        .gte('amount', amount - 5)
        .lte('amount', amount + 5);

      const isDuplicate = existingExpenses?.some(exp => {
        const descSimilarity = calculateSimilarity(
          (exp.description || '').toLowerCase(),
          description.toLowerCase()
        );
        return descSimilarity > 0.7;
      });

      if (isDuplicate) {
        console.log('↩️ Duplicate found:', description, amount);
        results.duplicates.push({ description, amount, date: expenseDate });
        results.skipped++;
        continue;
      }

      // Insert expense
      const { data, error } = await window.supabase
        .from('expenses')
        .insert({
          description,
          amount,
          expense_date: expenseDate,
          category,
          payment_method: 'cash',
          status: 'approved',
          notes: `Imported from Google Sheets`,
        })
        .select();

      if (error) {
        console.error('❌ Error importing expense:', error, expense);
        results.errors++;
      } else {
        console.log('✅ Imported:', description, amount, expenseDate);
        results.imported++;
      }
    } catch (error) {
      console.error('❌ Error processing expense:', error, expense);
      results.errors++;
    }
  }

  console.log('📊 Backfill complete:', results);
  return results;
}

/**
 * Process all old LINE messages and extract expenses
 */
async function processOldLineMessages() {
  if (!window.supabase || !window.POS) {
    throw new Error("Supabase not available");
  }

  console.log('📱 Processing old LINE messages...');

  // Get all unprocessed messages
  const { data: messages, error } = await window.supabase
    .from('line_messages')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  console.log(`Found ${messages?.length || 0} unprocessed messages`);

  const results = {
    processed: 0,
    expensesFound: 0,
    errors: 0,
  };

  for (const message of messages || []) {
    try {
      const messageText = message.message_text || '';
      
      if (!messageText || message.message_type !== 'text') {
        // Mark as processed even if not text
        await window.supabase
          .from('line_messages')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', message.id);
        continue;
      }

      // Try to parse as expense
      const expenseData = parseExpenseFromMessage(messageText);
      
      if (expenseData) {
        // Check if expense already exists
        const { data: existing } = await window.supabase
          .from('expenses')
          .select('*')
          .eq('expense_date', expenseData.date || new Date().toISOString().split('T')[0])
          .gte('amount', expenseData.amount - 5)
          .lte('amount', expenseData.amount + 5)
          .limit(1);

        const isDuplicate = existing?.some(exp => {
          const descSimilarity = calculateSimilarity(
            (exp.description || '').toLowerCase(),
            (expenseData.description || '').toLowerCase()
          );
          return descSimilarity > 0.7;
        });

        if (!isDuplicate) {
          // Insert expense
          const { error: insertError } = await window.supabase
            .from('expenses')
            .insert({
              description: expenseData.description || messageText,
              amount: expenseData.amount,
              expense_date: expenseData.date || new Date().toISOString().split('T')[0],
              category: expenseData.category || 'other',
              payment_method: 'cash',
              status: 'approved',
              notes: `Processed from LINE message: ${messageText}`,
            });

          if (!insertError) {
            results.expensesFound++;
            console.log('✅ Found expense in message:', messageText);
          }
        }
      }

      // Mark message as processed
      await window.supabase
        .from('line_messages')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', message.id);

      results.processed++;
    } catch (error) {
      console.error('❌ Error processing message:', error, message);
      results.errors++;
    }
  }

  console.log('📱 Processing complete:', results);
  return results;
}

// Helper function to calculate string similarity
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
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
  return matrix[str2.length][str1.length];
}

// Simplified expense parser (from LINE webhook)
function parseExpenseFromMessage(messageText) {
  const text = messageText.trim();
  
  // Look for amount patterns
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
      if (amount > 0 && amount < 1000000) break;
    }
  }
  
  if (!amount || amount <= 0) return null;
  
  // Extract description
  let description = text
    .replace(/\d+(?:,\d{3})*(?:\.\d{2})?\s*บาท?/gi, '')
    .replace(/฿\s*\d+/gi, '')
    .trim();
  
  if (!description || description.length < 2) {
    description = 'ค่าใช้จ่ายอื่นๆ';
  }
  
  // Determine category
  let category = 'other';
  const categoryMap = {
    'ค่าไฟ': 'utility',
    'ค่าไฟฟ้า': 'utility',
    'ค่าน้ำ': 'utility',
    'ค่าเช่า': 'rental',
    'ค่าแรง': 'labor',
    'ค่าพนักงาน': 'labor',
  };
  
  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (text.includes(keyword)) {
      category = cat;
      break;
    }
  }
  
  return {
    amount,
    description: description.substring(0, 200),
    category,
    date: new Date().toISOString().split('T')[0],
  };
}

// Export functions for use
if (typeof window !== 'undefined') {
  window.backfillExpenses = {
    fromGoogleSheets: backfillExpensesFromGoogleSheets,
    processOldLineMessages: processOldLineMessages,
  };
}



