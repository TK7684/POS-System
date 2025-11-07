/**
 * Optimized LINE Bot Handler with Full AI Capabilities
 * Complete database access with no restrictions
 * Natural language processing for all operations
 */

import { AIAssistant } from './ai-assistant.js';

export class LineBotHandler {
  constructor(config) {
    this.ai = new AIAssistant(config);
    this.lineConfig = config.lineBot;
    this.initialized = false;
  }

  async initialize() {
    try {
      await this.ai.initialize();
      this.initialized = true;
      console.log('LINE Bot Handler initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LINE Bot Handler:', error);
      throw error;
    }
  }

  /**
   * Main webhook handler - processes all LINE messages
   */
  async handleWebhook(request, env) {
    try {
      // Verify LINE signature
      const isValid = await this._verifySignature(request);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const events = request.events || [];
      const results = [];

      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          const result = await this._processMessage(event);
          results.push(result);
        } else if (event.type === 'follow') {
          await this._handleFollow(event);
        } else if (event.type === 'unfollow') {
          await this._handleUnfollow(event);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        eventsProcessed: results.length,
        results
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('LINE Webhook error:', error);
      return new Response(JSON.stringify({
        error: error.message,
        details: 'Failed to process webhook'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Process individual message
   */
  async _processMessage(event) {
    const { message, source, replyToken } = event;
    const userId = source.userId;

    try {
      // Create context for this interaction
      const context = {
        platform: 'line',
        userId: userId,
        messageType: message.type,
        timestamp: new Date().toISOString()
      };

      // Process with AI assistant
      const result = await this.ai.processRequest(message.text, context);

      // Format response for LINE
      const lineResponse = await this._formatLineResponse(result);

      // Send reply
      await this._replyToUser(replyToken, lineResponse);

      // Log the interaction
      await this._logInteraction(event, result);

      return {
        success: true,
        userId,
        intent: result.intent?.type || 'unknown',
        responseSent: true
      };

    } catch (error) {
      console.error('Error processing message:', error);

      // Send error response
      const errorResponse = {
        type: 'text',
        text: `ขอโทษครับ เกิดข้อผิดพลาด: ${error.message}\n\nโปรดลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ`
      };

      try {
        await this._replyToUser(replyToken, errorResponse);
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }

      return {
        success: false,
        userId,
        error: error.message,
        responseSent: false
      };
    }
  }

  /**
   * Format AI response for LINE messaging
   */
  async _formatLineResponse(result) {
    if (!result.success) {
      return {
        type: 'text',
        text: `❌ ${result.error}\n\n${result.suggestion || ''}`
      };
    }

    const { response, data, intent } = result;

    // For complex data, create rich message
    if (intent?.type === 'analyze' || intent?.type === 'read') {
      return await this._createRichMessage(response, data, intent);
    }

    // Simple text response
    return {
      type: 'text',
      text: response
    };
  }

  /**
   * Create rich LINE message with buttons, images, etc.
   */
  async _createRichMessage(text, data, intent) {
    const maxLength = 1990; // LINE text limit
    let messageText = text;

    // Add data summary
    if (data && (data.data || data.count !== undefined)) {
      const count = data.data ? data.data.length : data.count;
      messageText += `\n\n📊 พบข้อมูล ${count} รายการ`;
    }

    // Truncate if too long
    if (messageText.length > maxLength) {
      messageText = messageText.substring(0, maxLength - 3) + '...';
    }

    // Create quick reply buttons based on intent
    const quickReply = await this._createQuickReply(intent, data);

    if (quickReply && quickReply.items.length > 0) {
      return {
        type: 'text',
        text: messageText,
        quickReply: quickReply
      };
    }

    return {
      type: 'text',
      text: messageText
    };
  }

  /**
   * Generate context-aware quick reply buttons
   */
  async _createQuickReply(intent, data) {
    const items = [];

    // Universal buttons
    items.push({
      type: 'action',
      action: {
        type: 'message',
        label: '📈 สรุปยอดวันนี้',
        text: 'แสดงยอดขายวันนี้'
      }
    });

    items.push({
      type: 'action',
      action: {
        type: 'message',
        label: '📦 ตรวจสต็อก',
        text: 'ตรวจสอบสต็อกวัตถุดิบ'
      }
    });

    items.push({
      type: 'action',
      action: {
        type: 'message',
        label: '💰 ค่าใช้จ่าย',
        text: 'แสดงค่าใช้จ่ายล่าสุด'
      }
    });

    // Context-specific buttons
    if (intent?.entity === 'sales') {
      items.push({
        type: 'action',
        action: {
          type: 'message',
          label: '📊 วิเคราะห์ยอดขาย',
          text: 'วิเคราะห์ยอดขาย 7 วันล่าสุด'
        }
      });
    }

    if (intent?.entity === 'ingredients' || intent?.entity === 'inventory') {
      items.push({
        type: 'action',
        action: {
          type: 'message',
          label: '⚠️ สินค้าใกล้หมด',
          text: 'แสดงวัตถุดิบที่ใกล้จะหมด'
        }
      });
    }

    if (intent?.type === 'create' && intent?.entity === 'expenses') {
      items.push({
        type: 'action',
        action: {
          type: 'message',
          label: '➕ เพิ่มค่าใช้จ่ายอีก',
          text: 'เพิ่มค่าใช้จ่าย'
        }
      });
    }

    return {
      items: items.slice(0, 13) // LINE limit is 13 quick reply buttons
    };
  }

  /**
   * Handle user follow event
   */
  async _handleFollow(event) {
    const welcomeMessage = {
      type: 'text',
      text: `🎉 ยินดีต้อนรับสู่ระบบ POS Assistant!

ฉันสามารถช่วยคุณได้ทั้งหมดนี้:
• บันทึกขายและค่าใช้จ่าย
• ตรวจสอบสต็อกวัตถุดิบ
• วิเคราะห์ข้อมูลทางการเงิน
• จัดการเมนูและราคา
• สร้างรายงานต่างๆ
• อื่นๆ อีกมากมาย!

เพียงพิมพ์คำสั่งเป็นภาษาธรรมดา เช่น:
• "แสดงยอดขายวันนี้"
• "ซื้อกุ้งสด 5 กิโลกรัม ราคา 500 บาท"
• "ตรวจสอบสต็อกน้ำแข็ง"
• "วิเคราะห์กำไรเดือนนี้"

ลองใช้งานได้เลย! 🚀`
    };

    await this._replyToUser(event.replyToken, welcomeMessage);
  }

  /**
   * Handle user unfollow event
   */
  async _handleUnfollow(event) {
    console.log('User unfollowed:', event.source.userId);
    // Cleanup user data if needed
  }

  /**
   * Send reply to LINE user
   */
  async _replyToUser(replyToken, message) {
    const payload = {
      replyToken: replyToken,
      messages: Array.isArray(message) ? message : [message]
    };

    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.lineConfig.channelAccessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LINE API error: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Push message to user (for proactive notifications)
   */
  async pushMessage(to, message) {
    const payload = {
      to: to,
      messages: Array.isArray(message) ? message : [message]
    };

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.lineConfig.channelAccessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LINE API error: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Send proactive alerts and notifications
   */
  async sendDailySummary(userId) {
    try {
      const result = await this.ai.processRequest('สรุปภาพรวมร้านวันนี้ ทุกอย่าง', {
        platform: 'line',
        userId: userId,
        type: 'notification'
      });

      if (result.success) {
        const message = await this._formatLineResponse(result);
        await this.pushMessage(userId, message);
      }
    } catch (error) {
      console.error('Failed to send daily summary:', error);
    }
  }

  async sendLowStockAlert(userId, ingredients) {
    const text = `⚠️ แจ้งเตือนสต็อกใกล้หมด!

รายการวัตถุดิบที่ต้องเติม:\n${ingredients.map(ing =>
  `• ${ing.name}: ${ing.current_stock} ${ing.unit} (ขั้นต่ำ: ${ing.min_stock} ${ing.unit})`
).join('\n')}

พิมพ์ "สั่งซื้อวัตถุดิบ" เพื่อบันทึกการสั่งซื้อ`;

    const message = { type: 'text', text };
    await this.pushMessage(userId, message);
  }

  /**
   * Verify LINE webhook signature
   */
  async _verifySignature(request) {
    const signature = request.headers.get('x-line-signature') ||
                     request.headers.get('X-Line-Signature');

    if (!signature) {
      return false;
    }

    try {
      const body = await request.text();
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.lineConfig.channelSecret);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const bodyBuffer = encoder.encode(body);
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyBuffer);
      const signatureArray = new Uint8Array(signatureBuffer);

      let binary = '';
      for (let i = 0; i < signatureArray.length; i++) {
        binary += String.fromCharCode(signatureArray[i]);
      }
      const calculatedSignature = btoa(binary);

      return signature === calculatedSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Log interactions for analytics
   */
  async _logInteraction(event, result) {
    try {
      const logData = {
        user_id: event.source.userId,
        message: event.message.text,
        intent: result.intent?.type || 'unknown',
        entity: result.intent?.entity || 'unknown',
        success: result.success,
        timestamp: new Date().toISOString(),
        platform: 'line'
      };

      // Store in database for analytics
      if (this.ai.db) {
        await this.ai.db.create('bot_interactions', logData);
      }
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  }

  /**
   * Get user preferences and history
   */
  async getUserContext(userId) {
    try {
      // Get user interaction history
      const history = await this.ai.db.read('bot_interactions', {
        filters: { user_id: userId },
        orderBy: { column: 'timestamp', ascending: false },
        limit: 10
      });

      // Analyze user patterns
      const commonIntents = history.reduce((acc, log) => {
        const key = `${log.intent}_${log.entity}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      return {
        interactionCount: history.length,
        commonIntents,
        lastInteraction: history[0]?.timestamp
      };
    } catch (error) {
      return null;
    }
  }
}

export default LineBotHandler;
