/**
 * Enhanced AI Agent Chat UI
 * Supports batch text processing and data confirmation
 *
 * @author Enhanced UI Assistant
 * @version 2.0
 */

class AIAgentChatEnhancedUI {
  constructor() {
    this.aiAgent = new AIAgentChatEnhanced();
    this.isOpen = false;
    this.currentMode = 'chat'; // 'chat' or 'batch'
    this.conversationHistory = [];

    this.init();
  }

  /**
   * Initialize the UI
   */
  init() {
    this.createChatUI();
    this.bindEvents();
    this.addCustomStyles();
  }

  /**
   * Create the chat UI elements
   */
  createChatUI() {
    // Main container
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'ai-chat-enhanced-container';
    this.chatContainer.className = 'ai-chat-enhanced-hidden';

    // Header
    const header = document.createElement('div');
    header.className = 'ai-chat-enhanced-header';
    header.innerHTML = `
      <div class="ai-chat-enhanced-title">
        🤖 AI Agent Enhanced
        <span class="ai-chat-enhanced-mode" id="ai-chat-mode-indicator">แชท</span>
      </div>
      <div class="ai-chat-enhanced-controls">
        <button class="ai-chat-enhanced-mode-btn" onclick="window.aiChatEnhancedUI.toggleMode()">
          📝 โหมด: <span id="current-mode">แชท</span>
        </button>
        <button class="ai-chat-enhanced-close" onclick="window.aiChatEnhancedUI.hideChat()">✕</button>
      </div>
    `;

    // Body
    const body = document.createElement('div');
    body.className = 'ai-chat-enhanced-body';

    // Messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.id = 'ai-chat-enhanced-messages';
    this.messagesContainer.className = 'ai-chat-enhanced-messages';

    // Batch processing area (hidden by default)
    this.batchArea = document.createElement('div');
    this.batchArea.id = 'ai-chat-enhanced-batch-area';
    this.batchArea.className = 'ai-chat-enhanced-batch-area';
    this.batchArea.style.display = 'none';
    this.batchArea.innerHTML = `
      <div class="ai-chat-enhanced-batch-header">
        <h3>📋 ประมวลผลข้อความแบบกลุ่ม</h3>
        <p>วางรายการค่าใช้จ่ายจากบันทึก ระบบจะแยกประเภทให้อัตโนมัติ</p>
      </div>
      <textarea
        id="batch-text-input"
        placeholder="วางข้อความรายการค่าใช้จ่ายที่นี่...&#10;ตัวอย่าง:&#10;20-Sep-2025	คริสตัล 600 มล *12	49&#10;20-Sep-2025	เอโร ซอสดองสไตล์เกาหลี 1 ลิตร * 3	345&#10;21-Sep-2025	ค่าจ้างน้องพลอย	300"
        rows="8"
      ></textarea>
      <div class="ai-chat-enhanced-batch-actions">
        <button class="ai-chat-enhanced-btn ai-chat-enhanced-btn-primary" onclick="window.aiChatEnhancedUI.processBatchText()">
          🔍 วิเคราะห์ข้อมูล
        </button>
        <button class="ai-chat-enhanced-btn ai-chat-enhanced-btn-secondary" onclick="window.aiChatEnhancedUI.clearBatchInput()">
          🗑️ ล้างข้อมูล
        </button>
      </div>
      <div id="batch-results" class="ai-chat-enhanced-batch-results"></div>
    `;

    // Chat input area
    this.chatInputArea = document.createElement('div');
    this.chatInputArea.id = 'ai-chat-enhanced-chat-area';
    this.chatInputArea.className = 'ai-chat-enhanced-input-area';

    const inputContainer = document.createElement('div');
    inputContainer.className = 'ai-chat-enhanced-input-container';

    this.chatInput = document.createElement('textarea');
    this.chatInput.id = 'ai-chat-enhanced-input';
    this.chatInput.placeholder = 'พิมพ์คำสั่งหรือวางข้อความ...';
    this.chatInput.rows = 1;

    this.sendButton = document.createElement('button');
    this.sendButton.className = 'ai-chat-enhanced-send-btn';
    this.sendButton.innerHTML = '📤';
    this.sendButton.onclick = () => this.sendMessage();

    inputContainer.appendChild(this.chatInput);
    inputContainer.appendChild(this.sendButton);
    this.chatInputArea.appendChild(inputContainer);

    body.appendChild(this.messagesContainer);
    body.appendChild(this.batchArea);
    body.appendChild(this.chatInputArea);

    this.chatContainer.appendChild(header);
    this.chatContainer.appendChild(body);

    // Floating toggle button
    this.toggleButton = document.createElement('div');
    this.toggleButton.id = 'ai-chat-enhanced-toggle';
    this.toggleButton.className = 'ai-chat-enhanced-toggle';
    this.toggleButton.innerHTML = '🤖+';
    this.toggleButton.title = 'เปิด AI Agent Enhanced';
    this.toggleButton.onclick = () => this.toggleChat();

    // Add to page
    document.body.appendChild(this.chatContainer);
    document.body.appendChild(this.toggleButton);
  }

  /**
   * Toggle between chat and batch mode
   */
  toggleMode() {
    if (this.currentMode === 'chat') {
      this.currentMode = 'batch';
      this.chatInputArea.style.display = 'none';
      this.batchArea.style.display = 'block';
      document.getElementById('current-mode').textContent = 'ประมวลผลกลุ่ม';
      document.getElementById('ai-chat-mode-indicator').textContent = 'ประมวลผลกลุ่ม';
    } else {
      this.currentMode = 'chat';
      this.batchArea.style.display = 'none';
      this.chatInputArea.style.display = 'block';
      document.getElementById('current-mode').textContent = 'แชท';
      document.getElementById('ai-chat-mode-indicator').textContent = 'แชท';
    }
  }

  /**
   * Process batch text input
   */
  async processBatchText() {
    const textInput = document.getElementById('batch-text-input').value.trim();

    if (!textInput) {
      this.addMessage('system', '⚠️ กรุณาใส่ข้อความที่ต้องการประมวลผล');
      return;
    }

    // Show processing message
    this.addMessage('user', textInput, true);
    this.addMessage('system', '🔍 กำลังวิเคราะห์ข้อมูล...');

    try {
      const result = await this.aiAgent.processBatchText(textInput);

      if (result.success) {
        this.displayBatchResults(result);
      } else {
        this.addMessage('system', `❌ ${result.message}`);
      }
    } catch (error) {
      this.addMessage('system', `❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  }

  /**
   * Display batch processing results
   * @param {Object} result - Processing result
   */
  displayBatchResults(result) {
    const resultsDiv = document.getElementById('batch-results');
    const { summary, data } = result;

    let html = `
      <div class="ai-chat-enhanced-results-header">
        <h4>📊 ผลการวิเคราะห์ข้อมูล</h4>
        <div class="ai-chat-enhanced-summary">
          <strong>รวมทั้งหมด:</strong> ${summary.totalItems} รายการ, ${this.formatCurrency(summary.totalAmount)} บาท
        </div>
      </div>
    `;

    // Display categories
    html += '<div class="ai-chat-enhanced-categories">';
    for (const [type, info] of Object.entries(summary.categories)) {
      html += `
        <div class="ai-chat-enhanced-category-item">
          <div class="category-header">
            <span class="category-icon">${this.getCategoryIcon(type)}</span>
            <span class="category-name">${info.name}</span>
            <span class="category-count">${info.count} รายการ</span>
            <span class="category-amount">${this.formatCurrency(info.amount)} บาท</span>
          </div>
        </div>
      `;
    }
    html += '</div>';

    // Display detailed items
    html += '<div class="ai-chat-enhanced-items-details">';
    const categoryNames = {
      purchases: 'วัตถุดิบ',
      expenses: 'ค่าใช้จ่าย',
      overheads: 'ค่าใช้จ่ายคงที่',
      equipment: 'อุปกรณ์',
      supplies: 'วัสดุสิ้นเปลือง',
      uncategorized: 'ไม่ได้จัดหมวด'
    };

    for (const [type, items] of Object.entries(data)) {
      if (items.length > 0) {
        html += `
          <div class="category-section">
            <h5>${this.getCategoryIcon(type)} ${categoryNames[type]} (${items.length} รายการ)</h5>
            <div class="items-list">
        `;

        items.forEach(item => {
          html += `
            <div class="item-row">
              <div class="item-date">${item.date}</div>
              <div class="item-description">${item.description}</div>
              <div class="item-quantity">${item.quantity} ${item.unit}</div>
              <div class="item-price">${this.formatCurrency(item.price)} บาท</div>
              <div class="item-total">${this.formatCurrency(item.totalPrice)} บาท</div>
            </div>
          `;
        });

        html += '</div></div>';
      }
    }
    html += '</div>';

    // Confirmation buttons
    html += `
      <div class="ai-chat-enhanced-confirmation">
        <p>ตรวจสอบข้อมูลข้างต้นแล้ว ต้องการบันทึกข้อมูลหรือไม่?</p>
        <div class="confirmation-buttons">
          <button class="ai-chat-enhanced-btn ai-chat-enhanced-btn-success" onclick="window.aiChatEnhancedUI.confirmSave(true)">
            ✅ ยืนยันการบันทึก
          </button>
          <button class="ai-chat-enhanced-btn ai-chat-enhanced-btn-danger" onclick="window.aiChatEnhancedUI.confirmSave(false)">
            ❌ ยกเลิก
          </button>
        </div>
      </div>
    `;

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Confirm and save the processed data
   * @param {boolean} confirmed - User confirmation
   */
  async confirmSave(confirmed) {
    if (confirmed) {
      this.addMessage('system', '💾 กำลังบันทึกข้อมูล...');

      try {
        const result = await this.aiAgent.confirmAndSave(true);

        if (result.success) {
          this.addMessage('system', `✅ ${result.message}`);
          if (result.purchases.length > 0) {
            this.addMessage('system', `📦 บันทึกวัตถุดิบ ${result.purchases.length} รายการ`);
          }
          if (result.expenses.length > 0) {
            this.addMessage('system', `💰 บันทึกค่าใช้จ่าย ${result.expenses.length} รายการ`);
          }
          if (result.equipment.length > 0) {
            this.addMessage('system', `🔧 บันทึกอุปกรณ์ ${result.equipment.length} รายการ`);
          }
          if (result.supplies.length > 0) {
            this.addMessage('system', `📎 บันทึกวัสดุ ${result.supplies.length} รายการ`);
          }
        } else {
          this.addMessage('system', `⚠️ ${result.message}`);
          if (result.errors.length > 0) {
            result.errors.forEach(error => {
              this.addMessage('system', `❌ ${error}`);
            });
          }
        }
      } catch (error) {
        this.addMessage('system', `❌ เกิดข้อผิดพลาดในการบันทึก: ${error.message}`);
      }

      // Clear results after saving
      document.getElementById('batch-results').style.display = 'none';
      this.clearBatchInput();
    } else {
      this.addMessage('system', '❌ ยกเลิกการบันทึกข้อมูล');
      document.getElementById('batch-results').style.display = 'none';
    }
  }

  /**
   * Clear batch input
   */
  clearBatchInput() {
    document.getElementById('batch-text-input').value = '';
    document.getElementById('batch-results').innerHTML = '';
    document.getElementById('batch-results').style.display = 'none';
  }

  /**
   * Send chat message
   */
  async sendMessage() {
    const message = this.chatInput.value.trim();

    if (!message) return;

    // Add user message
    this.addMessage('user', message);

    // Clear input
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';

    // Process message based on current mode
    if (this.currentMode === 'chat') {
      await this.processChatMessage(message);
    }
  }

  /**
   * Process chat message
   * @param {string} message - User message
   */
  async processChatMessage(message) {
    this.addMessage('system', '🤔 กำลังคิด...');

    try {
      // For now, use the original AI agent for chat mode
      if (window.aiAgentChat) {
        const response = await window.aiAgentChat.processMessage(message);
        this.addMessage('assistant', response.message);
      } else {
        // Fallback to enhanced agent
        if (message.includes('ช่วย') || message.includes('วิธีใช้')) {
          this.addMessage('assistant', this.aiAgent.getHelpText());
        } else {
          this.addMessage('assistant', '🔍 ลองสลับไปโหมดประมวลผลกลุ่มเพื่อวิเคราะห์ข้อความแบบลิสต์ หรือพิมพ์ "ช่วย" เพื่อดูวิธีใช้');
        }
      }
    } catch (error) {
      this.addMessage('system', `❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  }

  /**
   * Add message to conversation
   * @param {string} type - Message type (user, assistant, system)
   * @param {string} content - Message content
   * @param {boolean} isBatch - Whether this is batch input
   */
  addMessage(type, content, isBatch = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-chat-enhanced-message ai-chat-enhanced-${type}`;

    const timestamp = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let icon = '';
    switch (type) {
      case 'user':
        icon = '👤';
        break;
      case 'assistant':
        icon = '🤖';
        break;
      case 'system':
        icon = 'ℹ️';
        break;
    }

    if (isBatch) {
      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="message-icon">${icon}</span>
          <span class="message-time">${timestamp}</span>
          <span class="message-badge">ข้อความแบบกลุ่ม</span>
        </div>
        <pre class="message-content">${this.escapeHtml(content)}</pre>
      `;
    } else if (type === 'assistant') {
      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="message-icon">${icon}</span>
          <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-content">${content}</div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="message-icon">${icon}</span>
          <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-content">${content}</div>
      `;
    }

    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    // Store in history
    this.conversationHistory.push({
      type,
      content,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get category icon
   * @param {string} type - Category type
   * @returns {string} Icon emoji
   */
  getCategoryIcon(type) {
    const icons = {
      purchases: '🥬',
      expenses: '💰',
      overheads: '🏢',
      equipment: '🔧',
      supplies: '📎',
      uncategorized: '❓'
    };
    return icons[type] || '📋';
  }

  /**
   * Format currency
   * @param {number} amount - Amount
   * @returns {string} Formatted amount
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Toggle chat window
   */
  toggleChat() {
    if (this.isOpen) {
      this.hideChat();
    } else {
      this.showChat();
    }
  }

  /**
   * Show chat window
   */
  showChat() {
    this.chatContainer.classList.remove('ai-chat-enhanced-hidden');
    this.chatContainer.classList.add('ai-chat-enhanced-visible');
    this.toggleButton.style.display = 'none';
    this.isOpen = true;

    // Focus input
    if (this.currentMode === 'chat') {
      this.chatInput.focus();
    }
  }

  /**
   * Hide chat window
   */
  hideChat() {
    this.chatContainer.classList.remove('ai-chat-enhanced-visible');
    this.chatContainer.classList.add('ai-chat-enhanced-hidden');
    this.toggleButton.style.display = 'flex';
    this.isOpen = false;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Input events
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.chatInput.addEventListener('input', () => {
      this.chatInput.style.height = 'auto';
      this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    });

    // Batch textarea auto-resize
    const batchTextarea = document.getElementById('batch-text-input');
    batchTextarea.addEventListener('input', () => {
      batchTextarea.style.height = 'auto';
      batchTextarea.style.height = Math.min(batchTextarea.scrollHeight, 300) + 'px';
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.hideChat();
      }
    });
  }

  /**
   * Add custom styles
   */
  addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced AI Chat Styles */
      #ai-chat-enhanced-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 500px;
        height: 700px;
        max-width: 90vw;
        max-height: 80vh;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        border: 1px solid #e2e8f0;
      }

      #ai-chat-enhanced-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #0f766e, #14b8a6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(15, 118, 110, 0.4);
        z-index: 9998;
        transition: all 0.3s ease;
      }

      #ai-chat-enhanced-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(15, 118, 110, 0.5);
      }

      .ai-chat-enhanced-hidden {
        display: none !important;
      }

      .ai-chat-enhanced-visible {
        display: flex !important;
      }

      .ai-chat-enhanced-header {
        background: linear-gradient(135deg, #0f766e, #14b8a6);
        color: white;
        padding: 16px 20px;
        border-radius: 16px 16px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .ai-chat-enhanced-title {
        font-size: 18px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ai-chat-enhanced-mode {
        font-size: 12px;
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 8px;
        border-radius: 12px;
      }

      .ai-chat-enhanced-controls {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .ai-chat-enhanced-mode-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .ai-chat-enhanced-mode-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .ai-chat-enhanced-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }

      .ai-chat-enhanced-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .ai-chat-enhanced-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .ai-chat-enhanced-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ai-chat-enhanced-batch-area {
        padding: 16px;
        display: none;
      }

      .ai-chat-enhanced-batch-header h3 {
        margin: 0 0 8px 0;
        color: #1e293b;
        font-size: 18px;
      }

      .ai-chat-enhanced-batch-header p {
        margin: 0 0 16px 0;
        color: #64748b;
        font-size: 14px;
      }

      .ai-chat-enhanced-batch-area textarea {
        width: 100%;
        min-height: 120px;
        max-height: 300px;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-family: monospace;
        font-size: 14px;
        resize: vertical;
        transition: border-color 0.2s;
      }

      .ai-chat-enhanced-batch-area textarea:focus {
        outline: none;
        border-color: #0f766e;
      }

      .ai-chat-enhanced-batch-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }

      .ai-chat-enhanced-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ai-chat-enhanced-btn-primary {
        background: #0f766e;
        color: white;
      }

      .ai-chat-enhanced-btn-primary:hover {
        background: #0d5f54;
      }

      .ai-chat-enhanced-btn-secondary {
        background: #e2e8f0;
        color: #475569;
      }

      .ai-chat-enhanced-btn-secondary:hover {
        background: #cbd5e1;
      }

      .ai-chat-enhanced-btn-success {
        background: #059669;
        color: white;
      }

      .ai-chat-enhanced-btn-success:hover {
        background: #047857;
      }

      .ai-chat-enhanced-btn-danger {
        background: #dc2626;
        color: white;
      }

      .ai-chat-enhanced-btn-danger:hover {
        background: #b91c1c;
      }

      .ai-chat-enhanced-batch-results {
        margin-top: 16px;
        max-height: 300px;
        overflow-y: auto;
      }

      .ai-chat-enhanced-results-header h4 {
        margin: 0 0 12px 0;
        color: #1e293b;
        font-size: 16px;
      }

      .ai-chat-enhanced-summary {
        background: #f1f5f9;
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
      }

      .ai-chat-enhanced-categories {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;
        margin: 16px 0;
      }

      .ai-chat-enhanced-category-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
      }

      .category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 13px;
      }

      .category-icon {
        font-size: 16px;
      }

      .category-name {
        font-weight: 600;
        flex: 1;
      }

      .category-count {
        color: #64748b;
      }

      .category-amount {
        font-weight: 700;
        color: #059669;
      }

      .ai-chat-enhanced-items-details {
        margin-top: 16px;
      }

      .category-section {
        margin-bottom: 20px;
      }

      .category-section h5 {
        margin: 0 0 8px 0;
        color: #1e293b;
        font-size: 14px;
        font-weight: 600;
      }

      .items-list {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
      }

      .item-row {
        display: grid;
        grid-template-columns: 80px 1fr 60px 80px 80px;
        gap: 8px;
        padding: 8px 12px;
        font-size: 12px;
        border-bottom: 1px solid #e2e8f0;
      }

      .item-row:last-child {
        border-bottom: none;
      }

      .item-date {
        color: #64748b;
      }

      .item-description {
        font-weight: 500;
      }

      .item-quantity {
        text-align: center;
        color: #64748b;
      }

      .item-price {
        text-align: right;
        color: #64748b;
      }

      .item-total {
        text-align: right;
        font-weight: 600;
        color: #059669;
      }

      .ai-chat-enhanced-confirmation {
        background: #fef3c7;
        border: 1px solid #fbbf24;
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
      }

      .ai-chat-enhanced-confirmation p {
        margin: 0 0 12px 0;
        color: #92400e;
        font-weight: 600;
      }

      .confirmation-buttons {
        display: flex;
        gap: 8px;
      }

      .ai-chat-enhanced-input-area {
        padding: 16px;
        border-top: 1px solid #e2e8f0;
      }

      .ai-chat-enhanced-input-container {
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }

      #ai-chat-enhanced-input {
        flex: 1;
        min-height: 40px;
        max-height: 120px;
        padding: 10px 12px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 14px;
        resize: none;
        transition: border-color 0.2s;
      }

      #ai-chat-enhanced-input:focus {
        outline: none;
        border-color: #0f766e;
      }

      .ai-chat-enhanced-send-btn {
        background: #0f766e;
        color: white;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .ai-chat-enhanced-send-btn:hover {
        background: #0d5f54;
        transform: scale(1.05);
      }

      .ai-chat-enhanced-message {
        max-width: 85%;
        word-wrap: break-word;
      }

      .ai-chat-enhanced-user {
        align-self: flex-end;
      }

      .ai-chat-enhanced-user .message-content {
        background: #0f766e;
        color: white;
        padding: 12px 16px;
        border-radius: 16px 16px 4px 16px;
      }

      .ai-chat-enhanced-user pre.message-content {
        background: #0f766e;
        color: white;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .ai-chat-enhanced-assistant {
        align-self: flex-start;
      }

      .ai-chat-enhanced-assistant .message-content {
        background: #f1f5f9;
        color: #1e293b;
        padding: 12px 16px;
        border-radius: 16px 16px 16px 4px;
        white-space: pre-wrap;
      }

      .ai-chat-enhanced-system {
        align-self: center;
        max-width: 70%;
      }

      .ai-chat-enhanced-system .message-content {
        background: #fef3c7;
        color: #92400e;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;
        text-align: center;
      }

      .message-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        font-size: 11px;
        color: #64748b;
      }

      .message-icon {
        font-size: 14px;
      }

      .message-badge {
        background: #dc2626;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }

      .message-time {
        font-size: 10px;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        #ai-chat-enhanced-container {
          background: #1e293b;
          border-color: #334155;
        }

        .ai-chat-enhanced-message pre.message-content,
        .ai-chat-enhanced-assistant .message-content {
          background: #334155;
          color: #f1f5f9;
        }

        .ai-chat-enhanced-user .message-content {
          background: #0f766e;
        }

        .ai-chat-enhanced-system .message-content {
          background: #451a03;
          color: #fbbf24;
        }
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        #ai-chat-enhanced-container {
          width: 100%;
          height: 100vh;
          bottom: 0;
          right: 0;
          border-radius: 0;
          max-width: 100%;
          max-height: 100%;
        }

        .item-row {
          grid-template-columns: 60px 1fr 50px 60px 60px;
          font-size: 11px;
        }

        .ai-chat-enhanced-categories {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.aiChatEnhancedUI = new AIAgentChatEnhancedUI();
  });
} else {
  window.aiChatEnhancedUI = new AIAgentChatEnhancedUI();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgentChatEnhancedUI;
}
