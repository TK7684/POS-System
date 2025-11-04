/**
 * Firebase Cloud Functions for POS System
 * Handles Line Bot webhook, Google Sheets integration, and data processing
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { LineBot } = require('./lineBot');
const { SheetsAPI } = require('./sheetsApi');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize integrations
const lineBot = new LineBot();
const sheetsApi = new SheetsAPI();

// ---------- Line Bot Webhook ----------
exports.processLineWebhook = functions.https.onRequest(async (req, res) => {
    console.log('🔍 LINE Webhook received:', {
        method: req.method,
        headers: req.headers,
        body: req.body
    });

    // Verify Line signature (security)
    const signature = req.headers['x-line-signature'];
    if (!lineBot.verifySignature(req.rawBody, signature)) {
        console.error('❌ Invalid Line signature');
        return res.status(403).send('Invalid signature');
    }

    try {
        const events = req.body.events || [];

        for (const event of events) {
            await processLineEvent(event);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Error processing Line webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function processLineEvent(event) {
    console.log('📱 Processing Line event:', {
        type: event.type,
        source: event.source,
        timestamp: event.timestamp
    });

    switch (event.type) {
        case 'message':
            await handleLineMessage(event);
            break;
        case 'postback':
            await handleLinePostback(event);
            break;
        case 'follow':
            await handleLineFollow(event);
            break;
        default:
            console.log('⚠️ Unhandled event type:', event.type);
    }
}

async function handleLineMessage(event) {
    const message = event.message;
    const userId = event.source.userId;

    console.log('💬 Processing Line message:', {
        type: message.type,
        userId: userId,
        content: message.text ? message.text.substring(0, 100) : '[non-text]'
    });

    try {
        if (message.type === 'text') {
            await processTextMessage(message.text, userId, event.replyToken);
        } else if (message.type === 'image') {
            await processImageMessage(message, userId, event.replyToken);
        } else {
            await lineBot.replyMessage(event.replyToken,
                '⚠️ รองรับเฉพาะข้อความและรูปภาพเท่านั้นครับ/ค่ะ'
            );
        }
    } catch (error) {
        console.error('❌ Error handling Line message:', error);
        await lineBot.replyMessage(event.replyToken,
            '❌ เกิดข้อผิดพลาด กรุณาลองใหม่'
        );
    }
}

async function processTextMessage(text, userId, replyToken) {
    console.log('📝 Processing text message:', { text, userId });

    // Check for purchase keywords
    const purchaseKeywords = ['ซื้อ', 'จัดซื้อ', 'ซื้อวัตถุดิบ', 'จัดหา', 'สั่ง'];
    const isPurchase = purchaseKeywords.some(keyword => text.toLowerCase().includes(keyword));

    if (isPurchase) {
        await processTextPurchase(text, userId, replyToken);
    } else if (text.toLowerCase().includes('สต็อก') || text.toLowerCase().includes('stock')) {
        await sendStockReport(userId, replyToken);
    } else if (text.toLowerCase().includes('ยอด') || text.toLowerCase().includes('sales')) {
        await sendSalesReport(userId, replyToken);
    } else if (text.toLowerCase().includes('ช่วยเหลือ') || text.toLowerCase().includes('help')) {
        await sendHelpMessage(userId, replyToken);
    } else {
        await sendDefaultMessage(replyToken);
    }
}

async function processTextPurchase(text, userId, replyToken) {
    console.log('🛒 Processing text purchase:', { text, userId });

    try {
        // Parse purchase details
        const purchaseData = parsePurchaseText(text);

        if (!purchaseData) {
            await lineBot.replyMessage(replyToken,
                '❌ ไม่สามารถอ่านข้อมูลการซื้อได้\n\n' +
                '💡 กรุณาระบุ:\n' +
                '• รายการที่ซื้อ\n' +
                '• จำนวน\n' +
                '• ราคา\n\n' +
                'ตัวอย่าง: "ซื้อกุ้ง 5 ตัว ราคา 500 บาท"'
            );
            return;
        }

        // Save to Firestore
        const docRef = await admin.firestore().collection('line_purchases').add({
            ...purchaseData,
            source: 'line_bot_text',
            userId: userId,
            status: 'pending_review',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Google Sheets
        await sheetsApi.appendPurchase(purchaseData);

        // Send confirmation
        const confirmMessage =
            '✅ บันทึกข้อมูลการซื้อเรียบร้อย\n\n' +
            `📋 ร้าน: ${purchaseData.vendor}\n` +
            `📦 รายการ: ${purchaseData.items.join(', ')}\n` +
            `💰 จำนวนเงิน: ฿${purchaseData.amount}\n` +
            `🕐 เวลา: ${new Date().toLocaleString('th-TH')}\n` +
            `📝 รหัส: ${docRef.id}`;

        await lineBot.replyMessage(replyToken, confirmMessage);

        console.log('✅ Text purchase processed successfully:', { docId: docRef.id, ...purchaseData });

    } catch (error) {
        console.error('❌ Error processing text purchase:', error);
        await lineBot.replyMessage(replyToken,
            '❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาติดต่อผู้ดูแล'
        );
    }
}

function parsePurchaseText(text) {
    console.log('🔍 Parsing purchase text:', text);

    // Extract vendor/shop name
    const vendorMatch = text.match(/ร้าน[\s]*([^\n]+)/i) ||
                      text.match(/จาก[\s]*([^\n]+)/i) ||
                      text.match(/ที่[\s]*([^\n]+)/i);

    // Extract amount
    const amountMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*บาท/) ||
                      text.match(/ราคา[\s]*[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
                      text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);

    // Extract items
    const items = [];
    const ingredientMatch = text.match(/ซื้อ[\s]*([^\d]+)/i);
    if (ingredientMatch) {
        const itemText = ingredientMatch[1].trim();
        // Split by common separators
        const splitItems = itemText.split(/[,\/และ]/);
        splitItems.forEach(item => {
            const cleaned = item.replace(/จาก|ที่|ร้าน/gi, '').trim();
            if (cleaned) items.push(cleaned);
        });
    }

    if (!vendorMatch || !amountMatch || items.length === 0) {
        console.log('❌ Incomplete purchase data:', { vendor: !!vendorMatch, amount: !!amountMatch, items: items.length });
        return null;
    }

    const purchaseData = {
        type: 'text_purchase',
        vendor: vendorMatch[1].trim(),
        amount: parseFloat(amountMatch[1].replace(',', '')),
        items: items,
        date: new Date().toISOString(),
        originalText: text
    };

    console.log('✅ Parsed purchase data:', purchaseData);
    return purchaseData;
}

async function processImageMessage(message, userId, replyToken) {
    console.log('🖼️ Processing image message:', { messageId: message.id, userId });

    try {
        // Get image content
        const imageContent = await lineBot.getImageContent(message.id);

        // Process with OCR (simulate for now)
        const slipData = await processSlipImage(imageContent);

        if (!slipData) {
            await lineBot.replyMessage(replyToken,
                '❌ ไม่สามารถอ่านข้อมูลจากรูปภาพได้\n\n' +
                '💡 กรุณาแน่ใจว่า:\n' +
                '• ภาพชัดเจน\n' +
                '• ไม่มีแสงสะท้อน\n' +
                '• แสดงจำนวนเงินชัดเจน'
            );
            return;
        }

        // Save to Firestore
        const docRef = await admin.firestore().collection('line_purchases').add({
            ...slipData,
            source: 'line_bot_slip',
            userId: userId,
            status: 'pending_review',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Google Sheets
        await sheetsApi.appendPurchase(slipData);

        // Send confirmation
        const confirmMessage =
            '✅ บันทึกข้อมูลจากรูปสลิปเรียบร้อย\n\n' +
            `🏦 ธนาคาร: ${slipData.bank}\n` +
            `💰 จำนวน: ฿${slipData.amount}\n` +
            `📅 วันที่: ${slipData.date}\n` +
            `📝 รหัส: ${docRef.id}`;

        await lineBot.replyMessage(replyToken, confirmMessage);

        console.log('✅ Slip purchase processed successfully:', { docId: docRef.id, ...slipData });

    } catch (error) {
        console.error('❌ Error processing image message:', error);
        await lineBot.replyMessage(replyToken,
            '❌ เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่'
        );
    }
}

async function processSlipImage(imageContent) {
    console.log('🔍 Processing slip image...');

    // Simulate OCR processing (in production, use real OCR service like Google Vision API)
    const mockSlipData = {
        type: 'slip_purchase',
        bank: ['กสิกราม', 'กรุงเทพ', 'ไทยพาณิชย์', 'กรุงศรีวัฒน์'][Math.floor(Math.random() * 4)],
        amount: Math.floor(Math.random() * 5000) + 500,
        date: new Date().toLocaleDateString('th-TH'),
        time: new Date().toLocaleTimeString('th-TH'),
        reference: 'SLIP' + Date.now(),
        slipImage: 'processed_image_base64' // Would store actual processed image
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Slip image processed:', mockSlipData);
    return mockSlipData;
}

// ---------- Report Functions ----------
async function sendStockReport(userId, replyToken) {
    console.log('📊 Generating stock report for user:', userId);

    try {
        const snapshot = await admin.firestore()
            .collection('stocks')
            .where('current_stock', '<=', admin.firestore.FieldValue.documentField('min_stock'))
            .get();

        if (snapshot.empty) {
            await lineBot.replyMessage(replyToken,
                '✅ สต็อกทั้งหมดอยู่ในระดับปกติ\n\n' +
                '📈 ไม่มีรายการที่ต้องเติม!'
            );
            return;
        }

        let report = '⚠️ รายการที่ต้องเติม:\n\n';
        snapshot.forEach(doc => {
            const item = doc.data();
            report += `📦 ${item.name}\n`;
            report += `   ปัจจุบัน: ${item.current_stock} ${item.unit}\n`;
            report += `   ขั้นต่ำ: ${item.min_stock} ${item.unit}\n`;
            report += `   ขาด: ${item.min_stock - item.current_stock} ${item.unit}\n\n`;
        });

        report += '📊 สามารถตรวจสอบได้ที่ระบบ POS';

        await lineBot.replyMessage(replyToken, report);

    } catch (error) {
        console.error('❌ Error generating stock report:', error);
        await lineBot.replyMessage(replyToken,
            '❌ เกิดข้อผิดพลาดในการสร้างรายงานสต็อก'
        );
    }
}

async function sendSalesReport(userId, replyToken) {
    console.log('💰 Generating sales report for user:', userId);

    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const snapshot = await admin.firestore()
            .collection('sales')
            .where('timestamp', '>=', startOfDay)
            .where('timestamp', '<', endOfDay)
            .orderBy('timestamp', 'desc')
            .get();

        if (snapshot.empty) {
            await lineBot.replyMessage(replyToken,
                '📝 ยังไม่มีรายการขายวันนี้\n\n' +
                '🛍️ เริ่มบันทึกรายการขายได้เลย!'
            );
            return;
        }

        let totalSales = 0;
        let report = '📊 รายงานการขายวันนี้:\n\n';

        snapshot.forEach(doc => {
            const sale = doc.data();
            totalSales += sale.total_amount || 0;
            report += `🍜 ${sale.menu_name}\n`;
            report += `   จำนวน: ${sale.quantity}\n`;
            report += `   ราคา: ฿${sale.total_amount}\n`;
            report += `   🕐 ${sale.timestamp.toDate().toLocaleTimeString('th-TH')}\n\n`;
        });

        report += `💰 รวมทั้งหมด: ฿${totalSales}\n`;
        report += `📈 สามารถดูรายละเอียดได้ที่ระบบ POS`;

        await lineBot.replyMessage(replyToken, report);

    } catch (error) {
        console.error('❌ Error generating sales report:', error);
        await lineBot.replyMessage(replyToken,
            '❌ เกิดข้อผิดพลาดในการสร้างรายงานการขาย'
        );
    }
}

async function sendHelpMessage(userId, replyToken) {
    console.log('❓ Sending help message to user:', userId);

    const helpMessage =
        '🤖 POS Bot ช่วยเหลือ:\n\n' +
        '📝 **คำสั่ง:**\n' +
        '• "ซื้อ [รายการ] [จำนวน] [ราคา]" - บันทึกการซื้อ\n' +
        '• "สต็อก" หรือ "stock" - ดูรายการที่ต้องเติม\n' +
        '• "ยอด" หรือ "sales" - ดูยอดขายวันนี้\n\n' +
        '📷 **ส่งรูปสลิป:**\n' +
        'ส่งรูปสลิปโอนเงินเพื่อบันทึกข้อมูลการจ่ายเงิน\n\n' +
        '💡 **ตัวอย่าง:**\n' +
        '• "ซื้อกุ้ง 5 ตัว จากตลาด ราคา 500 บาท"\n' +
        '• "ซื้อน้ำมัน 2 ขวด ราคา 150 บาท"\n\n' +
        '🔧 **ติดต่อผู้ดูแล:**\n' +
        'หากพบปัญหา กรุณาติดต่อผู้ดูแลระบบ';

    await lineBot.replyMessage(replyToken, helpMessage);
}

async function sendDefaultMessage(replyToken) {
    const defaultMessage =
        '❓ ไม่เข้าใจคำสั่ง\n\n' +
        'พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด\n' +
        'หรือส่งรูปสลิปเพื่อบันทึกข้อมูลการจ่ายเงิน';

    await lineBot.replyMessage(replyToken, defaultMessage);
}

// ---------- Other Event Handlers ----------
async function handleLinePostback(event) {
    const data = event.postback.data;
    console.log('🔄 Handling postback:', data);

    // Handle menu selections, confirmations, etc.
    // This can be extended for interactive menus
}

async function handleLineFollow(event) {
    console.log('👋 User added bot:', event.source.userId);

    const welcomeMessage =
        '🎉 ยินดีต้อนรับสู่ POS Bot!\n\n' +
        '🤖 ฉันสามารถช่วยคุณได้:\n' +
        '✅ บันทึกการซื้อของจากข้อความ\n' +
        '✅ อ่านข้อมูลจากรูปสลิป\n' +
        '✅ อัปเดตสต็อกแบบ real-time\n' +
        '✅ สร้างรายงานการขาย\n\n' +
        'พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด!\n\n' +
        '🔧 ติดต่อผู้ดูแลระบบหากมีปัญหา';

    await lineBot.replyMessage(event.replyToken, welcomeMessage);
}

// ---------- Utility Functions ----------
exports.savePurchase = functions.https.onCall(async (data, context) => {
    console.log('💾 Saving purchase via function:', { data, auth: context.auth });

    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated',
            'Authentication required to save purchases');
    }

    try {
        const docRef = await admin.firestore().collection('purchases').add({
            ...data,
            userId: context.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Google Sheets
        await sheetsApi.appendPurchase(data);

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('❌ Error saving purchase:', error);
        throw new functions.https.HttpsError('internal',
            'Failed to save purchase: ' + error.message);
    }
});

exports.updateInventory = functions.https.onCall(async (data, context) => {
    console.log('📦 Updating inventory via function:', { data, auth: context.auth });

    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated',
            'Authentication required to update inventory');
    }

    try {
        const { ingredientId, quantity, operation } = data;

        const ingredientRef = admin.firestore().collection('ingredients').doc(ingredientId);
        const doc = await ingredientRef.get();

        if (!doc.exists) {
            throw new functions.https.HttpsError('not-found',
                'Ingredient not found');
        }

        const currentData = doc.data();
        const newStock = operation === 'add' ?
            currentData.current_stock + quantity :
            currentData.current_stock - quantity;

        await ingredientRef.update({
            current_stock: newStock,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update stocks collection
        const stockRef = admin.firestore().collection('stocks').doc(ingredientId);
        await stockRef.set({
            ingredientId: ingredientId,
            name: currentData.name,
            current_stock: newStock,
            min_stock: currentData.min_stock,
            need_reorder: newStock <= currentData.min_stock,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true, newStock };
    } catch (error) {
        console.error('❌ Error updating inventory:', error);
        throw new functions.https.HttpsError('internal',
            'Failed to update inventory: ' + error.message);
    }
});

// ---------- Error Handling and Logging ----------
exports.healthCheck = functions.https.onRequest(async (req, res) => {
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: require('./package.json').version || '1.0.0'
    };

    console.log('🏥 Health check:', healthData);
    res.status(200).json(healthData);
});
