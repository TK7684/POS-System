// Backfill expenses from Google Sheets and process old LINE messages
// Run this in browser console or as a Cloudflare Function

/**
 * Intelligent CSV Parser
 * Handles quoted fields, different delimiters, and encoding issues
 */
function parseCSV(csvText) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      currentLine.push(currentField.trim());
      currentField = '';
      i++;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Line separator
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some(f => f)) { // Only add non-empty lines
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
      }
      // Skip \r\n combination
      if (char === '\r' && nextChar === '\n') {
        i += 2;
      } else {
        i++;
      }
    } else {
      currentField += char;
      i++;
    }
  }

  // Add last field and line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some(f => f)) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Intelligent Column Detection
 * Automatically detects which columns contain dates, descriptions, amounts, categories, etc.
 */
function detectColumns(headers, sampleRows) {
  const detection = {
    date: null,
    description: null,
    amount: null,
    category: null,
    itemName: null,
    quantity: null,
    unit: null,
    vendor: null,
  };

  // Date patterns (Thai and English)
  const datePatterns = [
    /^\d{1,2}-\w{3}-\d{4}$/, // 27-Aug-2025
    /^\d{4}-\d{2}-\d{2}$/, // 2025-08-27
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // 27/08/2025
    /วันที่|date|Date/i,
  ];

  // Amount patterns
  const amountPatterns = [
    /จำนวน|amount|Amount|price|Price|ราคา|ค่าใช้จ่าย/i,
    /^\d+(?:,\d{3})*(?:\.\d{2})?$/,
  ];

  // Description patterns
  const descriptionPatterns = [
    /ชื่อ|description|Description|รายละเอียด|รายการ/i,
  ];

  // Category patterns
  const categoryPatterns = [
    /กลุ่ม|category|Category|ประเภท/i,
  ];

  // Item name patterns (for purchases/ingredients)
  const itemNamePatterns = [
    /ชื่อสินค้า|item|Item|วัตถุดิบ|ingredient/i,
  ];

  // Quantity patterns
  const quantityPatterns = [
    /จำนวน|quantity|Quantity|qty/i,
  ];

  // Unit patterns
  const unitPatterns = [
    /หน่วย|unit|Unit/i,
  ];

  // Vendor patterns
  const vendorPatterns = [
    /ผู้ขาย|vendor|Vendor|ร้าน|supplier/i,
  ];

  // Detect by header name first (Thai and English)
  headers.forEach((header, idx) => {
    const headerLower = header.toLowerCase().trim();
    
    // Date detection (Thai: วันที่, English: date, Date)
    if (!detection.date && (
      headerLower.includes('วันที่') || 
      headerLower.includes('date') || 
      datePatterns.some(p => p.test(header))
    )) {
      detection.date = idx;
    } 
    // Amount detection (Thai: จำนวนค่าใช้จ่าย, ราคา, English: amount, price)
    else if (!detection.amount && (
      headerLower.includes('จำนวน') || 
      headerLower.includes('ราคา') || 
      headerLower.includes('amount') || 
      headerLower.includes('price') ||
      amountPatterns.some(p => p.test(header))
    )) {
      detection.amount = idx;
    } 
    // Description detection (Thai: ชื่อค่าใช้จ่าย, รายละเอียด, English: description)
    else if (!detection.description && (
      headerLower.includes('ชื่อ') || 
      headerLower.includes('รายละเอียด') || 
      headerLower.includes('description') ||
      descriptionPatterns.some(p => p.test(header))
    )) {
      detection.description = idx;
    } 
    // Category detection (Thai: กลุ่มค่าใช้จ่าย, ประเภท, English: category)
    else if (!detection.category && (
      headerLower.includes('กลุ่ม') || 
      headerLower.includes('ประเภท') || 
      headerLower.includes('category') ||
      categoryPatterns.some(p => p.test(header))
    )) {
      detection.category = idx;
    } 
    // Item name detection
    else if (!detection.itemName && itemNamePatterns.some(p => p.test(header))) {
      detection.itemName = idx;
    } 
    // Quantity detection
    else if (!detection.quantity && quantityPatterns.some(p => p.test(header))) {
      detection.quantity = idx;
    } 
    // Unit detection
    else if (!detection.unit && unitPatterns.some(p => p.test(header))) {
      detection.unit = idx;
    } 
    // Vendor detection
    else if (!detection.vendor && vendorPatterns.some(p => p.test(header))) {
      detection.vendor = idx;
    }
  });

  // If not found by header, detect by content
  if (sampleRows.length > 0) {
    headers.forEach((header, idx) => {
      // Check date column by content
      if (!detection.date && sampleRows.some(row => {
        const val = row[idx] || '';
        return datePatterns[0].test(val) || datePatterns[1].test(val) || datePatterns[2].test(val);
      })) {
        detection.date = idx;
      }

      // Check amount column by content (numeric values)
      if (!detection.amount && sampleRows.some(row => {
        const val = row[idx] || '';
        return /^\d+(?:,\d{3})*(?:\.\d{2})?$/.test(val.replace(/\s/g, ''));
      })) {
        detection.amount = idx;
      }

      // Check description/item name (longest text field that's not date/amount)
      if (!detection.description && !detection.itemName) {
        const avgLength = sampleRows.reduce((sum, row) => {
          const val = row[idx] || '';
          return sum + val.length;
        }, 0) / sampleRows.length;
        
        if (avgLength > 5 && idx !== detection.date && idx !== detection.amount) {
          // Check if it looks like an item name (contains ingredient-like words)
          const hasItemKeywords = sampleRows.some(row => {
            const val = (row[idx] || '').toLowerCase();
            return /กุ้ง|ปลา|เนื้อ|ผัก|เครื่อง|อุปกรณ์|ถุง|ชาม|ช้อน/.test(val);
          });
          
          if (hasItemKeywords) {
            detection.itemName = idx;
          } else {
            detection.description = idx;
          }
        }
      }
    });
  }

  // Fallback: use first few columns as defaults if not detected
  if (detection.date === null && headers.length > 0) detection.date = 0;
  if (detection.description === null && detection.itemName === null && headers.length > 1) {
    detection.description = 1;
  }
  if (detection.amount === null && headers.length > 2) detection.amount = 2;
  if (detection.category === null && headers.length > 3) detection.category = 3;

  return detection;
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  // Try "DD-MMM-YYYY" format (27-Aug-2025, 01-Sep-2025)
  const dateMatch = dateStr.match(/(\d{1,2})-(\w{3})-(\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const monthMap = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
      // Handle case variations
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    const monthKey = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    return `${year}-${monthMap[monthKey] || monthMap[month] || '01'}-${day.padStart(2, '0')}`;
  }

  // Try "YYYY-MM-DD" format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try "DD/MM/YYYY" format
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try parsing as Date object
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Parse amount from various formats
 */
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  
  // Remove currency symbols and spaces
  const cleaned = amountStr.toString().replace(/[฿,\s]/g, '');
  const amount = parseFloat(cleaned);
  
  return isNaN(amount) ? 0 : amount;
}

/**
 * Intelligent category detection from description
 */
function detectCategory(description, categoryStr) {
  if (categoryStr && categoryStr.trim()) {
    const categoryMap = {
      'อื่นๆ': 'other',
      'ค่าพนักงาน': 'labor',
      'ค่าแรง': 'labor',
      'ค่าเช่าพื้นที่': 'rental',
      'ค่าเช่า': 'rental',
      'ค่าไฟ': 'utility',
      'ค่าไฟฟ้า': 'utility',
      'ค่าน้ำ': 'utility',
    };
    
    const normalized = categoryStr.trim();
    if (categoryMap[normalized]) {
      return categoryMap[normalized];
    }
  }

  // Auto-detect from description
  const desc = (description || '').toLowerCase();
  
  if (/ค่าไฟ|ค่าไฟฟ้า|ค่าน้ำ|สาธารณูปโภค/.test(desc)) {
    return 'utility';
  }
  if (/ค่าเช่า|เช่าพื้นที่/.test(desc)) {
    return 'rental';
  }
  if (/ค่าแรง|ค่าพนักงาน|พนักงาน/.test(desc)) {
    return 'labor';
  }
  
  // Check if it's an ingredient/purchase (contains ingredient keywords)
  if (/กุ้ง|ปลา|เนื้อ|ผัก|เครื่อง|อุปกรณ์|ถุง|ชาม|ช้อน|วัตถุดิบ/.test(desc)) {
    return 'other'; // Ingredients are usually "other" category
  }

  return 'other';
}

/**
 * Import expenses from CSV (intelligent column detection)
 */
async function importExpensesFromCSV(csvText) {
  if (!window.supabase || !window.POS) {
    throw new Error("Supabase not available");
  }

  // Parse CSV
  const lines = parseCSV(csvText);
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  const headers = lines[0];
  const dataRows = lines.slice(1, Math.min(11, lines.length)); // Use first 10 rows for detection
  const allRows = lines.slice(1);

  // Detect columns
  const columns = detectColumns(headers, dataRows);
  
  console.log('📊 Detected columns:', columns);
  console.log('📋 Headers:', headers);

  const results = {
    imported: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0,
    columnMapping: columns,
  };

  // Process each row
  for (const row of allRows) {
    try {
      // Extract data based on detected columns
      const dateStr = columns.date !== null ? (row[columns.date] || '') : '';
      const description = columns.description !== null ? (row[columns.description] || '') : 
                          columns.itemName !== null ? (row[columns.itemName] || '') : '';
      const amountStr = columns.amount !== null ? (row[columns.amount] || '') : '';
      const categoryStr = columns.category !== null ? (row[columns.category] || '') : '';

      // Skip if no description or amount
      if (!description || !description.trim()) {
        results.skipped++;
        continue;
      }

      const amount = parseAmount(amountStr);
      if (amount <= 0) {
        results.skipped++;
        continue;
      }

      const expenseDate = parseDate(dateStr);
      const category = detectCategory(description, categoryStr);

      // Check for duplicates
      const { data: existingExpenses } = await window.supabase
        .from('expenses')
        .select('*')
        .eq('expense_date', expenseDate)
        .gte('amount', amount - 5)
        .lte('amount', amount + 5)
        .limit(10);

      const isDuplicate = existingExpenses?.some(exp => {
        const descSimilarity = calculateSimilarity(
          (exp.description || '').toLowerCase(),
          description.toLowerCase()
        );
        return descSimilarity > 0.7;
      });

      if (isDuplicate) {
        results.duplicates++;
        results.skipped++;
        continue;
      }

      // Insert expense
      const { data, error } = await window.supabase
        .from('expenses')
        .insert({
          description: description.trim(),
          amount: amount,
          expense_date: expenseDate,
          category: category,
          payment_method: 'cash',
          status: 'approved',
          notes: `Imported from CSV`,
        })
        .select();

      if (error) {
        console.error('❌ Error importing expense:', error, { description, amount, date: expenseDate });
        results.errors++;
      } else {
        console.log('✅ Imported:', description, amount, expenseDate);
        results.imported++;
      }
    } catch (error) {
      console.error('❌ Error processing row:', error, row);
      results.errors++;
    }
  }

  console.log('📊 Import complete:', results);
  return results;
}

/**
 * Import expenses from Google Sheets format (backward compatibility)
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
    duplicates: 0,
  };

  // Category mapping from Google Sheets to database
  const categoryMap = {
    'อื่นๆ': 'other',
    'ค่าพนักงาน': 'labor',
    'ค่าแรง': 'labor',
    'ค่าเช่าพื้นที่': 'rental',
    'ค่าเช่า': 'rental',
    'ค่าไฟ': 'utility',
    'ค่าไฟฟ้า': 'utility',
    'ค่าน้ำ': 'utility',
  };

  for (const expense of expensesData) {
    try {
      // Parse date from "27-Aug-2025" or "01-Sep-2025" format
      const dateStr = expense.date || expense.วันที่ || expense['Date'] || expense['วันที่'];
      const expenseDate = parseDate(dateStr);

      const description = expense.description || expense['ชื่อค่าใช้จ่าย'] || expense['Description'] || expense['รายละเอียด'] || '';
      const amount = parseAmount(expense.amount || expense['จำนวนค่าใช้จ่าย'] || expense['Amount'] || expense['ราคา'] || 0);
      const categoryName = expense.category || expense['กลุ่มค่าใช้จ่าย'] || expense['Category'] || expense['ประเภท'] || '';
      const category = detectCategory(description, categoryName);

      if (!description || !description.trim() || amount <= 0) {
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
        .lte('amount', amount + 5)
        .limit(10);

      const isDuplicate = existingExpenses?.some(exp => {
        const descSimilarity = calculateSimilarity(
          (exp.description || '').toLowerCase(),
          description.toLowerCase()
        );
        return descSimilarity > 0.7;
      });

      if (isDuplicate) {
        console.log('↩️ Duplicate found:', description, amount);
        results.duplicates++;
        results.skipped++;
        continue;
      }

      // Insert expense
      const { data, error } = await window.supabase
        .from('expenses')
        .insert({
          description: description.trim(),
          amount: amount,
          expense_date: expenseDate,
          category: category,
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
 * Process all old LINE messages and extract expenses (enhanced)
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
    purchasesFound: 0,
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

      // Try to parse as purchase (if contains ingredient keywords)
      const purchaseData = parsePurchaseFromMessage(messageText);
      if (purchaseData && window.POS && window.POS.functions && window.POS.functions.processPurchase) {
        try {
          const result = await window.POS.functions.processPurchase(purchaseData);
          if (result && result.success) {
            results.purchasesFound++;
            console.log('✅ Found purchase in message:', messageText);
          }
        } catch (purchaseError) {
          console.warn('⚠️ Could not process purchase:', purchaseError);
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

/**
 * Parse purchase from LINE message (enhanced)
 */
function parsePurchaseFromMessage(messageText) {
  const text = messageText.trim();
  
  // Purchase patterns: "ซื้อ [item] [quantity] [unit] ราคา [amount]"
  const purchasePatterns = [
    /ซื้อ\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(ตัว|กก|kg|กรัม|ลิตร|ขวด|ชิ้น|ซอง|แพ็ค|แพค)\s*(?:ราคา|บาท)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /ซื้อ\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(ตัว|กก|kg|กรัม|ลิตร|ขวด|ชิ้น|ซอง|แพ็ค|แพค)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/i,
  ];
  
  for (const pattern of purchasePatterns) {
    const match = text.match(pattern);
    if (match) {
      const itemName = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unit = match[3].trim();
      const amount = parseAmount(match[4]);
      
      if (itemName && quantity > 0 && amount > 0) {
        return {
          ingredient_name: itemName,
          quantity: quantity,
          unit: unit,
          total_amount: amount,
          type: "purchase",
          date: new Date().toISOString(),
        };
      }
    }
  }
  
  return null;
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
      amount = parseAmount(match[1]);
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
  const category = detectCategory(description, '');
  
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
    fromCSV: importExpensesFromCSV,
    processOldLineMessages: processOldLineMessages,
    parseCSV: parseCSV,
    detectColumns: detectColumns,
  };
}
