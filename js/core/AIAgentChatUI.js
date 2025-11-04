/**
 * AI Agent Chat UI Component
 * Provides floating chat interface for AI agent
 * 
 * @version 1.0
 */

class AIAgentChatUI {
  constructor() {
    this.agent = null;
    this.isOpen = false;
    this.isMinimized = false;
    this.messageHistory = [];
    
    this.init();
  }
  
  /**
   * Initialize chat UI
   */
  init() {
    // Create AI agent instance
    this.agent = new AIAgentChat();
    
    // Create UI elements
    this.createChatUI();
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Load saved messages from localStorage
    this.loadMessageHistory();
  }
  
  /**
   * Create chat UI elements
   */
  createChatUI() {
    // Chat container
    const chatContainer = document.createElement('div');
    chatContainer.id = 'ai-chat-container';
    chatContainer.className = 'ai-chat-container';
    chatContainer.innerHTML = `
      <div class="ai-chat-window" id="ai-chat-window">
        <div class="ai-chat-header">
          <div class="ai-chat-title">
            <span class="ai-icon">🤖</span>
            <span class="ai-title-text">AI Assistant</span>
            <span class="ai-status" id="ai-status">พร้อมช่วยเหลือ</span>
          </div>
          <div class="ai-chat-actions">
            <button class="ai-btn-icon" id="ai-btn-minimize" aria-label="ย่อหน้าต่าง">
              <span>−</span>
            </button>
            <button class="ai-btn-icon" id="ai-btn-close" aria-label="ปิดหน้าต่าง">
              <span>×</span>
            </button>
          </div>
        </div>
        
        <div class="ai-chat-messages" id="ai-chat-messages">
          <div class="ai-message ai-message-assistant">
            <div class="ai-message-avatar">🤖</div>
            <div class="ai-message-content">
              <div class="ai-message-text">
                สวัสดีค่ะ! ฉันคือ AI Assistant ที่จะช่วยคุณจัดการร้านอาหาร 🍲
                <br><br>
                <strong>ฉันสามารถช่วยคุณ:</strong>
                <ul>
                  <li>📦 บันทึกการซื้อวัตถุดิบ</li>
                  <li>💰 บันทึกค่าใช้จ่าย</li>
                  <li>🍲 คำนวณต้นทุนเมนู</li>
                  <li>📊 ตรวจสอบสต๊อก</li>
                  <li>💡 วิเคราะห์และให้คำแนะนำ</li>
                </ul>
                <br>
                ลองพิมพ์คำสั่งเป็นภาษาไทยได้เลย! 😊
              </div>
              <div class="ai-message-time">${this.getFormattedTime()}</div>
            </div>
          </div>
        </div>
        
        <div class="ai-chat-input-container">
          <div class="ai-quick-actions" id="ai-quick-actions">
            <button class="ai-quick-btn" data-command="สต๊อกวัตถุดิบเหลือเท่าไหร่">📊 ตรวจสต๊อก</button>
            <button class="ai-quick-btn" data-command="ช่วยคำนวนต้นทุนเมนูกุ้งแช่น้ำปลา">🍲 คำนวนต้นทุน</button>
            <button class="ai-quick-btn" data-command="ช่วยสรุปยอดขายวันนี้">💰 ยอดขาย</button>
          </div>
          <div class="ai-input-wrapper">
            <textarea 
              id="ai-chat-input" 
              class="ai-chat-input" 
              placeholder="พิมพ์คำสั่งหรือคำถาม... (เช่น ซื้อพริก 2 กิโล 100 บาท)"
              rows="1"
            ></textarea>
            <button class="ai-btn-send" id="ai-btn-send" aria-label="ส่งข้อความ">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10L18 2L12 18L10 12L2 10Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <button class="ai-chat-toggle" id="ai-chat-toggle" aria-label="เปิด AI Assistant">
        <span class="ai-toggle-icon">🤖</span>
        <span class="ai-toggle-badge" id="ai-toggle-badge">AI</span>
      </button>
    `;
    
    document.body.appendChild(chatContainer);
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const toggleBtn = document.getElementById('ai-chat-toggle');
    const closeBtn = document.getElementById('ai-btn-close');
    const minimizeBtn = document.getElementById('ai-btn-minimize');
    const sendBtn = document.getElementById('ai-btn-send');
    const input = document.getElementById('ai-chat-input');
    const quickActions = document.querySelectorAll('.ai-quick-btn');
    
    // Toggle chat window
    toggleBtn?.addEventListener('click', () => this.toggleChat());
    
    // Close chat
    closeBtn?.addEventListener('click', () => this.closeChat());
    
    // Minimize chat
    minimizeBtn?.addEventListener('click', () => this.minimizeChat());
    
    // Send message
    sendBtn?.addEventListener('click', () => this.sendMessage());
    
    // Send on Enter (Shift+Enter for new line)
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Auto-resize textarea
    input?.addEventListener('input', () => this.autoResizeTextarea(input));
    
    // Quick actions
    quickActions.forEach(btn => {
      btn.addEventListener('click', () => {
        const command = btn.getAttribute('data-command');
        if (command) {
          input.value = command;
          this.sendMessage();
        }
      });
    });
  }
  
  /**
   * Toggle chat window
   */
  toggleChat() {
    this.isOpen = !this.isOpen;
    const chatWindow = document.getElementById('ai-chat-window');
    const toggleBtn = document.getElementById('ai-chat-toggle');
    
    if (this.isOpen) {
      chatWindow?.classList.add('show');
      toggleBtn?.classList.add('active');
      
      // Focus input
      setTimeout(() => {
        document.getElementById('ai-chat-input')?.focus();
      }, 300);
      
      // Scroll to bottom
      this.scrollToBottom();
    } else {
      chatWindow?.classList.remove('show');
      toggleBtn?.classList.remove('active');
    }
  }
  
  /**
   * Close chat window
   */
  closeChat() {
    this.isOpen = false;
    const chatWindow = document.getElementById('ai-chat-window');
    const toggleBtn = document.getElementById('ai-chat-toggle');
    
    chatWindow?.classList.remove('show');
    toggleBtn?.classList.remove('active');
  }
  
  /**
   * Minimize chat window
   */
  minimizeChat() {
    this.isMinimized = !this.isMinimized;
    const chatWindow = document.getElementById('ai-chat-window');
    const minimizeBtn = document.getElementById('ai-btn-minimize');
    
    if (this.isMinimized) {
      chatWindow?.classList.add('minimized');
      minimizeBtn.querySelector('span').textContent = '□';
    } else {
      chatWindow?.classList.remove('minimized');
      minimizeBtn.querySelector('span').textContent = '−';
    }
  }
  
  /**
   * Send message to AI agent
   */
  async sendMessage() {
    const input = document.getElementById('ai-chat-input');
    const message = input?.value.trim();
    
    if (!message) return;
    
    // Clear input
    input.value = '';
    this.autoResizeTextarea(input);
    
    // Add user message to UI
    this.addMessage('user', message);
    
    // Show typing indicator
    this.showTypingIndicator();
    
    // Update status
    this.updateStatus('กำลังประมวลผล...');
    
    try {
      // Process message with AI agent
      const response = await this.agent.processMessage(message);
      
      // Remove typing indicator
      this.hideTypingIndicator();
      
      // Add assistant response
      this.addMessage('assistant', response.message, response.data);
      
      // Update status
      this.updateStatus('พร้อมช่วยเหลือ');
      
      // Save to history
      this.saveMessageHistory();
      
    } catch (error) {
      console.error('[AI Chat UI] Error:', error);
      this.hideTypingIndicator();
      this.addMessage('assistant', '❌ เกิดข้อผิดพลาด: ' + error.message);
      this.updateStatus('พร้อมช่วยเหลือ');
    }
  }
  
  /**
   * Add message to chat
   */
  addMessage(role, text, data = null) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-message-${role}`;
    
    const avatar = role === 'user' ? '👤' : '🤖';
    
    // Convert markdown-like formatting
    const formattedText = this.formatMessage(text);
    
    messageDiv.innerHTML = `
      <div class="ai-message-avatar">${avatar}</div>
      <div class="ai-message-content">
        <div class="ai-message-text">${formattedText}</div>
        <div class="ai-message-time">${this.getFormattedTime()}</div>
        ${data ? `<div class="ai-message-data" data-info='${JSON.stringify(data)}'></div>` : ''}
      </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
    
    // Add to message history
    this.messageHistory.push({
      role: role,
      text: text,
      data: data,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message ai-message-assistant ai-typing';
    typingDiv.id = 'ai-typing-indicator';
    typingDiv.innerHTML = `
      <div class="ai-message-avatar">🤖</div>
      <div class="ai-message-content">
        <div class="ai-typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }
  
  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const typingIndicator = document.getElementById('ai-typing-indicator');
    typingIndicator?.remove();
  }
  
  /**
   * Update status text
   */
  updateStatus(status) {
    const statusElement = document.getElementById('ai-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }
  
  /**
   * Format message text (markdown-like)
   */
  formatMessage(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/^(•|-)(.+)$/gm, '<li>$2</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }
  
  /**
   * Get formatted time
   */
  getFormattedTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  /**
   * Auto-resize textarea
   */
  autoResizeTextarea(textarea) {
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = newHeight + 'px';
  }
  
  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }
  
  /**
   * Save message history to localStorage
   */
  saveMessageHistory() {
    try {
      localStorage.setItem('ai-chat-history', JSON.stringify(this.messageHistory));
    } catch (error) {
      console.warn('[AI Chat UI] Could not save history:', error);
    }
  }
  
  /**
   * Load message history from localStorage
   */
  loadMessageHistory() {
    try {
      const saved = localStorage.getItem('ai-chat-history');
      if (saved) {
        this.messageHistory = JSON.parse(saved);
        
        // Restore last 10 messages
        const recentMessages = this.messageHistory.slice(-10);
        const messagesContainer = document.getElementById('ai-chat-messages');
        
        // Clear welcome message if there's history
        if (recentMessages.length > 0 && messagesContainer) {
          messagesContainer.innerHTML = '';
        }
        
        recentMessages.forEach(msg => {
          this.addMessage(msg.role, msg.text, msg.data);
        });
      }
    } catch (error) {
      console.warn('[AI Chat UI] Could not load history:', error);
    }
  }
  
  /**
   * Clear message history
   */
  clearHistory() {
    this.messageHistory = [];
    this.agent.clearHistory();
    localStorage.removeItem('ai-chat-history');
    
    const messagesContainer = document.getElementById('ai-chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
      
      // Re-add welcome message
      this.addMessage('assistant', `สวัสดีค่ะ! ประวัติการสนทนาถูกลบแล้ว 🗑️
      
ฉันพร้อมช่วยคุณเริ่มต้นใหม่! มีอะไรให้ช่วยไหมคะ? 😊`);
    }
  }
  
  /**
   * Export conversation
   */
  exportConversation() {
    const text = this.messageHistory
      .map(msg => {
        const time = new Date(msg.timestamp).toLocaleString('th-TH');
        const role = msg.role === 'user' ? 'คุณ' : 'AI';
        return `[${time}] ${role}: ${msg.text}`;
      })
      .join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.AIAgentChatUI = AIAgentChatUI;
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.aiChatUI = new AIAgentChatUI();
    });
  } else {
    window.aiChatUI = new AIAgentChatUI();
  }
}

