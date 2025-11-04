/**
 * Gemini-Enhanced AI Agent Chat UI
 * Displays AI-powered insights and intelligent categorization
 *
 * @author Gemini UI Specialist
 * @version 3.0
 */

class AIAgentChatGeminiUI {
  constructor(apiKey) {
    this.aiAgent = new AIAgentChatGemini(apiKey);
    this.isOpen = false;
    this.currentMode = 'chat';
    this.conversationHistory = [];
    this.systemStatus = null;

    this.init();
  }

  /**
   * Initialize the UI
   */
  init() {
    this.createChatUI();
    this.bindEvents();
    this.addCustomStyles();
    this.checkSystemStatus();
  }

  /**
   * Create the enhanced chat UI
   */
  createChatUI() {
    // Main container
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'ai-chat-gemini-container';
    this.chatContainer.className = 'ai-chat-gemini-hidden';

    // Header with status indicator
    const header = document.createElement('div');
    header.className = 'ai-chat-gemini-header';
    header.innerHTML = `
      <div class="ai-chat-gemini-title">
        🤖✨ AI Agent Gemini
        <span class="ai-chat-gemini-mode" id="ai-chat-mode-indicator">แชท</span>
        <span class="ai-chat-gemini-status" id="gemini-status">
          <span class="status-dot"></span>
          <span class="status-text">กำลังตรวจสอบ...</span>
        </span>
      </div>
      <div class="ai-chat-gemini-controls">
        <button class="ai-chat-gemini-mode-btn" onclick="window.aiChatGeminiUI.toggleMode()">
          📝 โหมด: <span id="current-mode">แชท</span>
        </button>
        <button class="ai-chat-gemini-insights-btn" onclick="window.aiChatGeminiUI.showSystemStatus()">
          📊 สถานะ
        </button>
        <button class="ai-chat-gemini-close" onclick="window.aiChatGeminiUI.hideChat()">✕</button>
      </div>
    `;

    // Body
    const body = document.createElement('div');
    body.className = 'ai-chat-gemini-body';

    // Messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.id = 'ai-chat-gemini-messages';
    this.messagesContainer.className = 'ai-chat-gemini-messages';

    // Insights panel (hidden by default)
    this.insightsPanel = document.createElement('div');
    this.insightsPanel.id = 'ai-chat-gemini-insights';
    this.insightsPanel.className = 'ai-chat-gemini-insights';
    this.insightsPanel.style.display = 'none';

    // Batch processing area
    this.batchArea = document.createElement('div');
    this.batchArea.id = 'ai-chat-gemini-batch-area';
    this.batchArea.className = 'ai-chat-gemini-batch-area';
    this.batchArea.style.display = 'none';
    this.batchArea.innerHTML = `
      <div class="ai-chat-gemini-batch-header">
        <h3>🧠 ประมวลผลด้วย Gemini AI</h3>
        <p>วางรายการค่าใช้จ่าย AI จะวิเคราะห์และจัดหมวดหมู่อัตโนมัติ</p>
      </div>
      <div class="gemini-feature-highlight">
        <div class="feature-item">
          <span class="feature-icon">✨</span>
          <span>ประมวลผลอัจฉริยะด้วย Gemini AI</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎯</span>
          <span>จัดหมวดหมู่อัตโนมัติอย่างแม่นยำ</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">💡</span>
          <span>สร้างข้อมูลเชิงลึกและข้อเสนอแนะ</span>
        </div>
      </div>
      <textarea
        id="batch-text-input-gemini"
        placeholder="วางข้อความรายการค่าใช้จ่ายที่นี่...&#10;Gemini AI จะช่วยวิเคราะห์และจัดหมวดหมู่ให้อัตโนมัติ&#10;&#10;ตัวอย่าง:&#10;20-Sep-2025	คริสตัล 600 มล *12	49&#10;20-Sep-2025	เอโร ซอสดองสไตล์เกาหลี 1 ลิตร * 3	345&#10;21-Sep-2025	ค่าจ้างน้องพลอย	300"
        rows="8"
      ></textarea>
      <div class="ai-chat-gemini-batch-actions">
        <button class="ai-chat-gemini-btn ai-chat-gemini-btn-primary" onclick="window.aiChatGeminiUI.processBatchText()">
          🧠 วิเคราะห์ด้วย AI
        </button>
        <button class="ai-chat-gemini-btn ai-chat-gemini-btn-secondary" onclick="window.aiChatGeminiUI.clearBatchInput()">
          🗑️ ล้างข้อมูล
        </button>
      </div>
      <div id="batch-results-gemini" class="ai-chat-gemini-batch-results"></div>
    `;

    // Chat input area
    this.chatInputArea = document.createElement('div');
    this.chatInputArea.id = 'ai-chat-gemini-chat-area';
    this.chatInputArea.className = 'ai-chat-gemini-input-area';

    const inputContainer = document.createElement('div');
    inputContainer.className = 'ai-chat-gemini-input-container';

    this.chatInput = document.createElement('textarea');
    this.chatInput.id = 'ai-chat-gemini-input';
    this.chatInput.placeholder = 'พิมพ์คำสั่งหรือถาม Gemini AI...';
    this.chatInput.rows = 1;

    this.sendButton = document.createElement('button');
    this.sendButton.className = 'ai-chat-gemini-send-btn';
    this.sendButton.innerHTML = '🧠';
    this.sendButton.onclick = () => this.sendMessage();

    inputContainer.appendChild(this.chatInput);
    inputContainer.appendChild(this.sendButton);
    this.chatInputArea.appendChild(inputContainer);

    body.appendChild(this.messagesContainer);
    body.appendChild(this.insightsPanel);
    body.appendChild(this.batchArea);
    body.appendChild(this.chatInputArea);

    this.chatContainer.appendChild(header);
    this.chatContainer.appendChild(body);

    // Floating toggle button
    this.toggleButton = document.createElement('div');
    this.toggleButton.id = 'ai-chat-gemini-toggle';
    this.toggleButton.className = 'ai-chat-gemini-toggle';
    this.toggleButton.innerHTML = '🤖✨';
    this.toggleButton.title = 'เปิด AI Agent Gemini';
    this.toggleButton.onclick = () => this.toggleChat();

    // Add to page
    document.body.appendChild(this.chatContainer);
    document.body.appendChild(this.toggleButton);
  }

  /**
   * Check system status
   */
  async checkSystemStatus() {
    this.updateStatus('กำลังตรวจสอบ...', 'checking');

    try {
      this.systemStatus = await this.aiAgent.testSystem();

      if (this.systemStatus.gemini) {
        this.updateStatus('Gemini AI พร้อมใช้งาน', 'connected');
      } else {
        this.updateStatus('ใช้โหมดปกติ (ไม่มี Gemini)', 'fallback');
      }
    } catch (error) {
      this.updateStatus('เกิดข้อผิดพลาด', 'error');
    }
  }

  /**
   * Update status indicator
   * @param {string} text - Status text
   * @param {string} status - Status type
   */
  updateStatus(text, status) {
    const statusElement = document.getElementById('gemini-status');
    const statusDot = statusElement.querySelector('.status-dot');
    const statusText = statusElement.querySelector('.status-text');

    statusText.textContent = text;

    // Remove all status classes
    statusDot.classList.remove('connected', 'checking', 'error', 'fallback');

    // Add appropriate class
    statusDot.classList.add(status);
  }

  /**
   * Process batch text with Gemini
   */
  async processBatchText() {
    const textInput = document.getElementById('batch-text-input-gemini').value.trim();

    if (!textInput) {
      this.addMessage('system', '⚠️ กรุณาใส่ข้อความที่ต้องการประมวลผล');
      return;
    }

    // Show processing message
    this.addMessage('user', textInput, true);
    this.addMessage('system', '🧠 Gemini AI กำลังวิเคราะห์ข้อมูลอัจฉริยะ...');

    try {
      const result = await this.aiAgent.processBatchTextGemini(textInput);

      if (result.success) {
        this.displayBatchResults(result);

        // Generate insights if Gemini is available
        if (result.geminiEnhanced) {
          this.generateAndDisplayInsights(result.data);
        }
      } else {
        this.addMessage('system', `❌ ${result.message}`);
      }
    } catch (error) {
      this.addMessage('system', `❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  }

  /**
   * Generate and display AI insights
   * @param {Object} categorizedData - Categorized data
   */
  async generateAndDisplayInsights(categorizedData) {
    try {
      this.addMessage('system', '💡 กำลังสร้างข้อมูลเชิงลึก...');

      const insights = await this.aiAgent.generateInsights(categorizedData);
      this.displayInsights(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  }

  /**
   * Display insights panel
   * @param {Object} insights - AI-generated insights
   */
  displayInsights(insights) {
    const insightsPanel = document.getElementById('ai-chat-gemini-insights');

    let html = `
      <div class="insights-header">
        <h3>💡 ข้อมูลเชิงลึกจาก Gemini AI</h3>
        <button class="close-insights" onclick="window.aiChatGeminiUI.hideInsights()">✕</button>
      </div>
      <div class="insights-content">
    `;

    if (insights.naturalSummary) {
      html += `
        <div class="insight-section">
          <h4>📝 สรุปโดย AI</h4>
          <p>${insights.naturalSummary}</p>
        </div>
      `;
    }

    if (insights.summary) {
      html += `
        <div class="insight-section">
          <h4>📊 ภาพรวม</h4>
          <p>${insights.summary}</p>
        </div>
      `;
    }

    if (insights.topCategory) {
      html += `
        <div class="insight-section">
          <h4>🏆 ประเภทที่ใช้จ่ายสูงสุด</h4>
          <p>${insights.topCategory}</p>
        </div>
      `;
    }

    if (insights.recommendations && insights.recommendations.length > 0) {
      html += `
        <div class="insight-section">
          <h4>🎯 ข้อเสนอแนะ</h4>
          <ul>
            ${insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (insights.observations && insights.observations.length > 0) {
      html += `
        <div class="insight-section">
          <h4>🔍 จุดที่น่าสังเกต</h4>
          <ul>
            ${insights.observations.map(obs => `<li>${obs}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    html += '</div>';
    insightsPanel.innerHTML = html;
    insightsPanel.style.display = 'block';
  }

  /**
   * Hide insights panel
   */
  hideInsights() {
    const insightsPanel = document.getElementById('ai-chat-gemini-insights');
    insightsPanel.style.display = 'none';
  }

  /**
   * Show system status
   */
  showSystemStatus() {
    const status = this.aiAgent.getSystemStatus();

    let statusHtml = `
      <div class="system-status-header">
        <h3>📊 สถานะระบบ AI Agent Gemini</h3>
        <button class="close-status" onclick="window.aiChatGeminiUI.hideSystemStatus()">✕</button>
      </div>
      <div class="system-status-content">
    `;

    statusHtml += `
      <div class="status-item">
        <span class="status-label">เวอร์ชัน:</span>
        <span class="status-value">${status.version}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Gemini AI:</span>
        <span class="status-value ${status.geminiConnected ? 'connected' : 'disconnected'}">
          ${status.geminiConnected ? '🟢 เชื่อมต่อ' : '🔴 ไม่เชื่อมต่อ'}
        </span>
      </div>
    `;

    statusHtml += '<h4>คุณสมบัติ:</h4><div class="features-list">';
    for (const [feature, enabled] of Object.entries(status.features)) {
      const featureNames = {
        geminiEnhanced: 'ปรับปรุงด้วย Gemini AI',
        batchProcessing: 'ประมวลผลแบบกลุ่ม',
        intelligentCategorization: 'จัดหมวดหมู่อัจฉริยะ',
        insightsGeneration: 'สร้างข้อมูลเชิงลึก',
        fallbackMode: 'โหมดสำรอง'
      };
      statusHtml += `
        <div class="feature-status">
          <span class="feature-name">${featureNames[feature] || feature}</span>
          <span class="feature-enabled">${enabled ? '✅' : '❌'}</span>
        </div>
      `;
    }
    statusHtml += '</div>';

    if (status.cacheStats) {
      statusHtml += `
        <h4>แคชสถิติ:</h4>
        <div class="cache-stats">
          <div class="status-item">
            <span class="status-label">ขนาดแคช:</span>
            <span class="status-value">${status.cacheStats.size} รายการ</span>
          </div>
          <div class="status-item">
            <span class="status-label">หมดอายุภายใน:</span>
            <span class="status-value">${status.cacheStats.timeout/1000} วินาที</span>
          </div>
        </div>
      `;
    }

    statusHtml += '</div>';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'ai-chat-gemini-modal';
    modal.innerHTML = `
      <div class="modal-content">
        ${statusHtml}
        <div class="modal-actions">
          <button class="ai-chat-gemini-btn ai-chat-gemini-btn-secondary" onclick="window.aiChatGeminiUI.clearCache()">
            🗑️ ล้างแคช
          </button>
          <button class="ai-chat-gemini-btn ai-chat-gemini-btn-primary" onclick="window.aiChatGeminiUI.hideSystemStatus()">
            ปิด
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Hide system status modal
   */
  hideSystemStatus() {
    const modal = document.querySelector('.ai-chat-gemini-modal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Clear cache
   */
  async clearCache() {
    this.aiAgent.clearCache();
    this.addMessage('system', '🗑️ ล้างแคชเรียบร้อย');
    this.hideSystemStatus();
  }

  /**
   * Display batch results with AI enhancements
   * @param {Object} result - Processing result
   */
  displayBatchResults(result) {
    const resultsDiv = document.getElementById('batch-results-gemini');
    const { summary, data } = result;
    const geminiBadge = result.geminiEnhanced ?
      '<span class="gemini-badge">🧠 ปรับปรุงด้วย AI</span>' : '';

    let html = `
      <div class="ai-chat-gemini-results-header">
        <h4>🧠 ผลการวิเคราะห์ข้อมูล</h4>
        ${geminiBadge}
        <div class="ai-chat-gemini-summary">
          <strong>รวมทั้งหมด:</strong> ${summary.totalItems} รายการ, ${this.formatCurrency(summary.totalAmount)} บาท
        </div>
      </div>
    `;

    // Display categories with AI confidence
    html += '<div class="ai-chat-gemini-categories">';
    for (const [type, info] of Object.entries(summary.categories)) {
      html += `
        <div class="ai-chat-gemini-category-item">
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

    // Display detailed items with AI categorization
    html += '<div class="ai-chat-gemini-items-details">';
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
          const aiBadge = item.aiCategorized ? '<span class="ai-categorized-badge">🤖 AI</span>' : '';
          html += `
            <div class="item-row">
              <div class="item-date">${item.date}</div>
              <div class="item-description">
                ${item.description}
                ${aiBadge}
              </div>
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
      <div class="ai-chat-gemini-confirmation">
        <p>ตรวจสอบข้อมูลข้างต้นแล้ว ต้องการบันทึกข้อมูลหรือไม่?</p>
        <div class="confirmation-buttons">
          <button class="ai-chat-gemini-btn ai-chat-gemini-btn-success" onclick="window.aiChatGeminiUI.confirmSave(true)">
            ✅ ยืนยันการบันทึก
          </button>
          <button class="ai-chat-gemini-btn ai-chat-gemini-btn-danger" onclick="window.aiChatGeminiUI.confirmSave(false)">
            ❌ ยกเลิก
          </button>
        </div>
      </div>
    `;

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Confirm and save with Gemini enhancements
   * @param {boolean} confirmed - User confirmation
   */
  async confirmSave(confirmed) {
    if (confirmed) {
      this.addMessage('system', '💾 กำลังบันทึกข้อมูลด้วย Gemini AI...');

      try {
        const result = await this.aiAgent.confirmAndSaveGemini(true);

        if (result.success) {
          this.addMessage('system', `✅ ${result.message}`);

          // Display insights if available
          if (result.insights) {
            setTimeout(() => {
              this.displayInsights(result.insights);
            }, 1000);
          }

          // Show save statistics
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

      document.getElementById('batch-results-gemini').style.display = 'none';
      this.clearBatchInput();
    } else {
      this.addMessage('system', '❌ ยกเลิกการบันทึกข้อมูล');
      document.getElementById('batch-results-gemini').style.display = 'none';
    }
  }

  /**
   * Clear batch input
   */
  clearBatchInput() {
    document.getElementById('batch-text-input-gemini').value = '';
    document.getElementById('batch-results-gemini').innerHTML = '';
    document.getElementById('batch-results-gemini').style.display = 'none';
    this.hideInsights();
  }

  /**
   * Send chat message with Gemini
   */
  async sendMessage() {
    const message = this.chatInput.value.trim();

    if (!message) return;

    this.addMessage('user', message);
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';

    this.addMessage('system', '🧠 Gemini AI กำลังตอบ...');

    try {
      // Simple AI response for demo
      setTimeout(() => {
        const responses = [
          'ฉันเข้าใจแล้ว สามารถช่วยวิเคราะห์ข้อมูลค่าใช้จ่ายของคุณได้',
          'ลองใช้โหมดประมวลผลกลุ่มเพื่อวิเคราะห์ข้อมูลหลายรายการพร้อมกัน',
          'Gemini AI พร้อมช่วยจัดการข้อมูลร้านอาหารของคุณ',
          'สามารถวางข้อความรายการค่าใช้จ่ายเพื่อให้ AI วิเคราะห์ให้'
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage('assistant', response);
      }, 1500);
    } catch (error) {
      this.addMessage('system', `❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  }

  /**
   * Add message to conversation
   */
  addMessage(type, content, isBatch = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-chat-gemini-message ai-chat-gemini-${type}`;

    const timestamp = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let icon = '';
    switch (type) {
      case 'user': icon = '👤'; break;
      case 'assistant': icon = '🧠'; break;
      case 'system': icon = 'ℹ️'; break;
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

    this.conversationHistory.push({
      type,
      content,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Toggle between chat and batch mode
   */
  toggleMode() {
    if (this.currentMode === 'chat') {
      this.currentMode = 'batch';
      this.chatInputArea.style.display = 'none';
      this.batchArea.style.display = 'block';
      document.getElementById('current-mode').textContent = 'ประมวลผล AI';
      document.getElementById('ai-chat-mode-indicator').textContent = 'ประมวลผล AI';
    } else {
      this.currentMode = 'chat';
      this.batchArea.style.display = 'none';
      this.chatInputArea.style.display = 'block';
      document.getElementById('current-mode').textContent = 'แชท';
      document.getElementById('ai-chat-mode-indicator').textContent = 'แชท';
    }
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
    this.chatContainer.classList.remove('ai-chat-gemini-hidden');
    this.chatContainer.classList.add('ai-chat-gemini-visible');
    this.toggleButton.style.display = 'none';
    this.isOpen = true;

    if (this.currentMode === 'chat') {
      this.chatInput.focus();
    }
  }

  /**
   * Hide chat window
   */
  hideChat() {
    this.chatContainer.classList.remove('ai-chat-gemini-visible');
    this.chatContainer.classList.add('ai-chat-gemini-hidden');
    this.toggleButton.style.display = 'flex';
    this.isOpen = false;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.chatInput.addEventListener('input', () => {
      this.chatInput.style.height = 'auto';
      this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    });

    const batchTextarea = document.getElementById('batch-text-input-gemini');
    batchTextarea.addEventListener('input', () => {
      batchTextarea.style.height = 'auto';
      batchTextarea.style.height = Math.min(batchTextarea.scrollHeight, 300) + 'px';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.hideChat();
      }
    });
  }

  /**
   * Helper functions
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

  formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add custom styles for Gemini UI
   */
  addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Gemini AI Chat Styles */
      #ai-chat-gemini-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 550px;
        height: 750px;
        max-width: 90vw;
        max-height: 85vh;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        border: 1px solid #e2e8f0;
      }

      #ai-chat-gemini-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 70px;
        height: 70px;
        background: linear-gradient(135deg, #4285f4, #34a853, #fbbc05, #ea4335);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(66, 133, 244, 0.4);
        z-index: 9998;
        transition: all 0.3s ease;
        animation: geminiPulse 2s infinite;
      }

      @keyframes geminiPulse {
        0% { box-shadow: 0 4px 20px rgba(66, 133, 244, 0.4); }
        50% { box-shadow: 0 4px 30px rgba(66, 133, 244, 0.6); }
        100% { box-shadow: 0 4px 20px rgba(66, 133, 244, 0.4); }
      }

      #ai-chat-gemini-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(66, 133, 244, 0.5);
      }

      .ai-chat-gemini-hidden {
        display: none !important;
      }

      .ai-chat-gemini-visible {
        display: flex !important;
      }

      .ai-chat-gemini-header {
        background: linear-gradient(135deg, #4285f4, #34a853);
        color: white;
        padding: 16px 20px;
        border-radius: 16px 16px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .ai-chat-gemini-title {
        font-size: 18px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .ai-chat-gemini-mode {
        font-size: 12px;
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 8px;
        border-radius: 12px;
      }

      .ai-chat-gemini-status {
        font-size: 11px;
        background: rgba(255, 255, 255, 0.15);
        padding: 4px 8px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #fbbf24;
      }

      .status-dot.connected {
        background: #10b981;
        animation: statusPulse 2s infinite;
      }

      .status-dot.checking {
        background: #f59e0b;
        animation: statusPulse 1s infinite;
      }

      .status-dot.error {
        background: #ef4444;
      }

      .status-dot.fallback {
        background: #6b7280;
      }

      @keyframes statusPulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      .ai-chat-gemini-insights {
        position: absolute;
        top: 60px;
        right: 20px;
        width: 300px;
        max-height: 400px;
        background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        border: 1px solid #0ea5e9;
        border-radius: 12px;
        padding: 16px;
        overflow-y: auto;
        z-index: 10;
        box-shadow: 0 4px 20px rgba(14, 165, 233, 0.2);
      }

      .insights-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .insights-header h3 {
        margin: 0;
        font-size: 16px;
        color: #0c4a6e;
      }

      .close-insights {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #64748b;
      }

      .insight-section {
        margin-bottom: 16px;
      }

      .insight-section h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #0c4a6e;
      }

      .insight-section p,
      .insight-section ul {
        margin: 0;
        font-size: 13px;
        color: #475569;
        line-height: 1.5;
      }

      .insight-section ul {
        padding-left: 16px;
      }

      .gemini-badge {
        display: inline-block;
        background: linear-gradient(135deg, #4285f4, #34a853);
        color: white;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
        margin-left: 8px;
      }

      .ai-categorized-badge {
        display: inline-block;
        background: #10b981;
        color: white;
        font-size: 10px;
        padding: 1px 4px;
        border-radius: 4px;
        font-weight: 600;
        margin-left: 4px;
      }

      .gemini-feature-highlight {
        background: linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(52, 168, 83, 0.1));
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
      }

      .feature-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        color: #1e293b;
      }

      .feature-icon {
        font-size: 16px;
      }

      .ai-chat-gemini-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      .modal-content {
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      }

      .system-status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .system-status-header h3 {
        margin: 0;
        color: #1e293b;
      }

      .close-status {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #64748b;
      }

      .status-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e2e8f0;
      }

      .status-label {
        font-weight: 600;
        color: #374151;
      }

      .status-value {
        color: #1e293b;
      }

      .status-value.connected {
        color: #10b981;
      }

      .status-value.disconnected {
        color: #ef4444;
      }

      .features-list {
        margin: 16px 0;
      }

      .feature-status {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 14px;
      }

      .feature-name {
        color: #374151;
      }

      .feature-enabled {
        color: #10b981;
      }

      .modal-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
        justify-content: flex-end;
      }

      /* Inherit other styles from enhanced UI */
      .ai-chat-gemini-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .ai-chat-gemini-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ai-chat-gemini-batch-area {
        padding: 16px;
        display: none;
      }

      .ai-chat-gemini-batch-header h3 {
        margin: 0 0 8px 0;
        color: #1e293b;
        font-size: 18px;
      }

      .ai-chat-gemini-batch-header p {
        margin: 0 0 16px 0;
        color: #64748b;
        font-size: 14px;
      }

      .ai-chat-gemini-batch-area textarea {
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

      .ai-chat-gemini-batch-area textarea:focus {
        outline: none;
        border-color: #4285f4;
      }

      .ai-chat-gemini-batch-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }

      .ai-chat-gemini-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ai-chat-gemini-btn-primary {
        background: linear-gradient(135deg, #4285f4, #34a853);
        color: white;
      }

      .ai-chat-gemini-btn-primary:hover {
        background: linear-gradient(135deg, #3367d6, #2d8f47);
        transform: translateY(-1px);
      }

      .ai-chat-gemini-btn-secondary {
        background: #e2e8f0;
        color: #475569;
      }

      .ai-chat-gemini-btn-secondary:hover {
        background: #cbd5e1;
      }

      .ai-chat-gemini-btn-success {
        background: #10b981;
        color: white;
      }

      .ai-chat-gemini-btn-success:hover {
        background: #059669;
      }

      .ai-chat-gemini-btn-danger {
        background: #ef4444;
        color: white;
      }

      .ai-chat-gemini-btn-danger:hover {
        background: #dc2626;
      }

      .ai-chat-gemini-batch-results {
        margin-top: 16px;
        max-height: 300px;
        overflow-y: auto;
      }

      .ai-chat-gemini-results-header h4 {
        margin: 0 0 12px 0;
        color: #1e293b;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ai-chat-gemini-summary {
        background: #f1f5f9;
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
      }

      .ai-chat-gemini-categories {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;
        margin: 16px 0;
      }

      .ai-chat-gemini-category-item {
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

      .ai-chat-gemini-items-details {
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

      .ai-chat-gemini-confirmation {
        background: #fef3c7;
        border: 1px solid #fbbf24;
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
      }

      .ai-chat-gemini-confirmation p {
        margin: 0 0 12px 0;
        color: #92400e;
        font-weight: 600;
      }

      .confirmation-buttons {
        display: flex;
        gap: 8px;
      }

      .ai-chat-gemini-input-area {
        padding: 16px;
        border-top: 1px solid #e2e8f0;
      }

      .ai-chat-gemini-input-container {
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }

      #ai-chat-gemini-input {
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

      #ai-chat-gemini-input:focus {
        outline: none;
        border-color: #4285f4;
      }

      .ai-chat-gemini-send-btn {
        background: linear-gradient(135deg, #4285f4, #34a853);
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

      .ai-chat-gemini-send-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
      }

      .ai-chat-gemini-controls {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .ai-chat-gemini-mode-btn,
      .ai-chat-gemini-insights-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .ai-chat-gemini-mode-btn:hover,
      .ai-chat-gemini-insights-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .ai-chat-gemini-close {
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

      .ai-chat-gemini-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .ai-chat-gemini-message {
        max-width: 85%;
        word-wrap: break-word;
      }

      .ai-chat-gemini-user {
        align-self: flex-end;
      }

      .ai-chat-gemini-user .message-content {
        background: linear-gradient(135deg, #4285f4, #34a853);
        color: white;
        padding: 12px 16px;
        border-radius: 16px 16px 4px 16px;
      }

      .ai-chat-gemini-user pre.message-content {
        background: linear-gradient(135deg, #4285f4, #34a853);
        color: white;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .ai-chat-gemini-assistant {
        align-self: flex-start;
      }

      .ai-chat-gemini-assistant .message-content {
        background: linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(52, 168, 83, 0.1));
        color: #1e293b;
        padding: 12px 16px;
        border-radius: 16px 16px 16px 4px;
        white-space: pre-wrap;
      }

      .ai-chat-gemini-system {
        align-self: center;
        max-width: 70%;
      }

      .ai-chat-gemini-system .message-content {
        background: linear-gradient(135deg, #fef3c7, #fed7aa);
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
        background: #ef4444;
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
        #ai-chat-gemini-container {
          background: #1e293b;
          border-color: #334155;
        }

        .ai-chat-gemini-message pre.message-content,
        .ai-chat-gemini-assistant .message-content {
          background: rgba(66, 133, 244, 0.1);
          color: #f1f5f9;
        }

        .ai-chat-gemini-user .message-content {
          background: linear-gradient(135deg, #4285f4, #34a853);
        }

        .ai-chat-gemini-system .message-content {
          background: linear-gradient(135deg, #451a03, #7c2d12);
          color: #fbbf24;
        }

        .ai-chat-gemini-insights {
          background: linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(52, 168, 83, 0.1));
          border-color: #4285f4;
        }
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        #ai-chat-gemini-container {
          width: 100%;
          height: 100vh;
          bottom: 0;
          right: 0;
          border-radius: 0;
          max-width: 100%;
          max-height: 100%;
        }

        #ai-chat-gemini-toggle {
          width: 60px;
          height: 60px;
          font-size: 24px;
          bottom: 80px;
        }

        .ai-chat-gemini-insights {
          position: static;
          width: 100%;
          margin: 16px 0;
          max-height: 200px;
        }

        .item-row {
          grid-template-columns: 60px 1fr 40px 50px 50px;
          font-size: 11px;
        }

        .ai-chat-gemini-categories {
          grid-template-columns: 1fr;
        }

        .ai-chat-gemini-title {
          font-size: 16px;
        }

        .ai-chat-gemini-controls {
          gap: 4px;
        }

        .ai-chat-gemini-mode-btn,
        .ai-chat-gemini-insights-btn {
          font-size: 10px;
          padding: 4px 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Replace with your actual API key
    const apiKey = 'AIzaSyC0hovjfAaGmgAiH8dUyphGAFCO80aE2Dk';
    window.aiChatGeminiUI = new AIAgentChatGeminiUI(apiKey);
  });
} else {
  const apiKey = 'AIzaSyC0hovjfAaGmgAiH8dUyphGAFCO80aE2Dk';
  window.aiChatGeminiUI = new AIAgentChatGeminiUI(apiKey);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgentChatGeminiUI;
}
