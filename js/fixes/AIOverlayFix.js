/**
 * AI Overlay Window Fix
 * Fixes close, minimize, and functionality issues with AI chat overlay
 *
 * @version 1.0
 * @author Engineering Fix
 */

class AIOverlayFix {
  constructor() {
    this.originalUI = null;
    this.flickerFixApplied = false;
    this.processingResetTimer = null;

    this.init();
  }

  /**
   * Initialize fixes
   */
  init() {
    // Wait for DOM and original AI chat to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.applyFixes(), 1000);
      });
    } else {
      setTimeout(() => this.applyFixes(), 1000);
    }

    // Apply fixes periodically in case of timing issues
    setInterval(() => {
      this.reapplyEventListeners();
      this.resetProcessingLock();
    }, 5000);
  }

  /**
   * Apply all fixes
   */
  applyFixes() {
    console.log('[AI Overlay Fix] Applying fixes...');

    // Fix close/minimize button event listeners
    this.fixButtonListeners();

    // Fix processing lock issues
    this.fixProcessingLock();

    // Fix z-index and positioning issues
    this.fixPositioning();

    // Fix AI agent functionality
    this.fixAIFunctionality();

    // Add emergency close mechanism
    this.addEmergencyClose();

    console.log('[AI Overlay Fix] All fixes applied');
  }

  /**
   * Fix close/minimize button event listeners
   */
  fixButtonListeners() {
    const closeBtn = document.getElementById('ai-btn-close');
    const minimizeBtn = document.getElementById('ai-btn-minimize');
    const toggleBtn = document.getElementById('ai-chat-toggle');

    if (closeBtn) {
      // Remove existing listeners and add fresh ones
      closeBtn.replaceWith(closeBtn.cloneNode(true));
      const newCloseBtn = document.getElementById('ai-btn-close');

      newCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[AI Overlay Fix] Close button clicked');

        // Force close the window
        this.forceCloseChat();
      });

      // Make button more visible and clickable
      newCloseBtn.style.cssText += `
        cursor: pointer !important;
        z-index: 9999 !important;
        pointer-events: all !important;
      `;
    }

    if (minimizeBtn) {
      // Remove existing listeners and add fresh ones
      minimizeBtn.replaceWith(minimizeBtn.cloneNode(true));
      const newMinimizeBtn = document.getElementById('ai-btn-minimize');

      newMinimizeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[AI Overlay Fix] Minimize button clicked');

        // Force minimize/restore
        this.forceMinimizeChat();
      });

      newMinimizeBtn.style.cssText += `
        cursor: pointer !important;
        z-index: 9999 !important;
        pointer-events: all !important;
      `;
    }

    if (toggleBtn) {
      // Ensure toggle button works
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[AI Overlay Fix] Toggle button clicked');

        const chatWindow = document.getElementById('ai-chat-window');
        if (chatWindow) {
          const isVisible = chatWindow.style.display !== 'none' &&
                           chatWindow.style.opacity !== '0' &&
                           !chatWindow.classList.contains('hidden');

          if (isVisible) {
            this.forceCloseChat();
          } else {
            this.forceOpenChat();
          }
        }
      });
    }
  }

  /**
   * Fix processing lock that might be stuck
   */
  fixProcessingLock() {
    // Reset AI agent processing state
    if (window.aiChatUI && window.aiChatUI.agent) {
      window.aiChatUI.agent.isProcessing = false;
      console.log('[AI Overlay Fix] Processing lock reset');
    }

    // Also fix enhanced UI if exists
    if (window.aiChatEnhancedUI && window.aiChatEnhancedUI.aiAgent) {
      window.aiChatEnhancedUI.aiAgent.isProcessing = false;
    }
  }

  /**
   * Fix positioning and z-index issues
   */
  fixPositioning() {
    const chatWindow = document.getElementById('ai-chat-window');
    const chatContainer = document.getElementById('ai-chat-container');

    if (chatWindow) {
      chatWindow.style.cssText += `
        z-index: 10000 !important;
        pointer-events: all !important;
        position: fixed !important;
      `;
    }

    if (chatContainer) {
      chatContainer.style.cssText += `
        z-index: 10000 !important;
        pointer-events: all !important;
      `;
    }
  }

  /**
   * Fix AI agent functionality
   */
  fixAIFunctionality() {
    // Override processMessage to add better error handling
    if (window.aiChatUI && window.aiChatUI.agent) {
      const originalProcessMessage = window.aiChatUI.agent.processMessage;

      window.aiChatUI.agent.processMessage = async function(message) {
        try {
          // Reset processing lock
          this.isProcessing = false;

          // Call original method with timeout
          const result = await Promise.race([
            originalProcessMessage.call(this, message),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('AI response timeout')), 10000)
            )
          ]);

          return result;
        } catch (error) {
          console.error('[AI Overlay Fix] ProcessMessage error:', error);
          this.isProcessing = false;

          // Return a helpful error message instead of repeating
          return {
            success: false,
            message: `❌ ขออภัย ระบบ AI กำลังมีปัญหาชั่วคราว: ${error.message}\n\n💡 กรุณาลองอีกครั้งในภายหลังหรือติดต่อผู้ดูแลระบบ`,
            error: error
          };
        }
      };
    }
  }

  /**
   * Add emergency close mechanism
   */
  addEmergencyClose() {
    // Add keyboard shortcut (ESC to close)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const chatWindow = document.getElementById('ai-chat-window');
        if (chatWindow && chatWindow.classList.contains('show')) {
          this.forceCloseChat();
          console.log('[AI Overlay Fix] Emergency close activated');
        }
      }
    });

    // Add double-click outside to close
    document.addEventListener('dblclick', (e) => {
      const chatWindow = document.getElementById('ai-chat-window');
      const chatContainer = document.getElementById('ai-chat-container');

      if (chatWindow && chatWindow.classList.contains('show') &&
          !chatContainer.contains(e.target)) {
        this.forceCloseChat();
        console.log('[AI Overlay Fix] Double-click outside close activated');
      }
    });
  }

  /**
   * Force close chat window
   */
  forceCloseChat() {
    const chatWindow = document.getElementById('ai-chat-window');
    const toggleBtn = document.getElementById('ai-chat-toggle');

    if (chatWindow) {
      chatWindow.classList.remove('show');
      chatWindow.style.display = 'none';
      chatWindow.style.opacity = '0';
      chatWindow.style.pointerEvents = 'none';
    }

    if (toggleBtn) {
      toggleBtn.classList.remove('active');
    }

    // Reset UI state
    if (window.aiChatUI) {
      window.aiChatUI.isOpen = false;
      window.aiChatUI.isMinimized = false;
    }

    console.log('[AI Overlay Fix] Chat force closed');
  }

  /**
   * Force open chat window
   */
  forceOpenChat() {
    const chatWindow = document.getElementById('ai-chat-window');
    const toggleBtn = document.getElementById('ai-chat-toggle');

    if (chatWindow) {
      chatWindow.classList.add('show');
      chatWindow.style.display = 'flex';
      chatWindow.style.opacity = '1';
      chatWindow.style.pointerEvents = 'all';
    }

    if (toggleBtn) {
      toggleBtn.classList.add('active');
    }

    // Reset UI state
    if (window.aiChatUI) {
      window.aiChatUI.isOpen = true;
    }

    console.log('[AI Overlay Fix] Chat force opened');
  }

  /**
   * Force minimize/restore chat window
   */
  forceMinimizeChat() {
    const chatWindow = document.getElementById('ai-chat-window');
    const minimizeBtn = document.getElementById('ai-btn-minimize');

    if (chatWindow) {
      const isMinimized = chatWindow.classList.contains('minimized');

      if (isMinimized) {
        chatWindow.classList.remove('minimized');
        chatWindow.style.height = '600px';
        if (minimizeBtn) minimizeBtn.querySelector('span').textContent = '−';
        if (window.aiChatUI) window.aiChatUI.isMinimized = false;
      } else {
        chatWindow.classList.add('minimized');
        chatWindow.style.height = '56px';
        if (minimizeBtn) minimizeBtn.querySelector('span').textContent = '□';
        if (window.aiChatUI) window.aiChatUI.isMinimized = true;
      }
    }

    console.log('[AI Overlay Fix] Chat minimize toggled');
  }

  /**
   * Reapply event listeners periodically
   */
  reapplyEventListeners() {
    // Quick check and reapply if needed
    const closeBtn = document.getElementById('ai-btn-close');
    if (closeBtn && closeBtn.style.cursor !== 'pointer') {
      this.fixButtonListeners();
    }
  }

  /**
   * Reset processing lock periodically
   */
  resetProcessingLock() {
    if (window.aiChatUI && window.aiChatUI.agent && window.aiChatUI.agent.isProcessing) {
      console.warn('[AI Overlay Fix] Processing lock was stuck, resetting...');
      window.aiChatUI.agent.isProcessing = false;
    }
  }

  /**
   * Clear AI chat cache and reset
   */
  static resetAIChat() {
    try {
      // Clear localStorage
      localStorage.removeItem('ai-chat-history');

      // Reset AI agent
      if (window.aiChatUI) {
        window.aiChatUI.clearHistory();
        window.aiChatUI.agent.isProcessing = false;
      }

      // Force close and reopen
      const fix = new AIOverlayFix();
      fix.forceCloseChat();

      setTimeout(() => {
        fix.forceOpenChat();
      }, 500);

      console.log('[AI Overlay Fix] AI chat reset complete');

    } catch (error) {
      console.error('[AI Overlay Fix] Reset failed:', error);
    }
  }

  /**
   * Get diagnostic information
   */
  static getDiagnostics() {
    const diagnostics = {
      aiChatUI: !!window.aiChatUI,
      aiAgent: !!(window.aiChatUI && window.aiChatUI.agent),
      chatWindow: !!document.getElementById('ai-chat-window'),
      chatContainer: !!document.getElementById('ai-chat-container'),
      closeButton: !!document.getElementById('ai-btn-close'),
      minimizeButton: !!document.getElementById('ai-btn-minimize'),
      toggleButton: !!document.getElementById('ai-chat-toggle'),
      isProcessing: !!(window.aiChatUI && window.aiChatUI.agent && window.aiChatUI.agent.isProcessing),
      isOpen: !!(window.aiChatUI && window.aiChatUI.isOpen),
      localStorage: !!localStorage.getItem('ai-chat-history')
    };

    console.log('[AI Overlay Fix] Diagnostics:', diagnostics);
    return diagnostics;
  }
}

// Auto-initialize the fix
window.aiOverlayFix = new AIOverlayFix();

// Make static methods available globally
window.AIOverlayFix = AIOverlayFix;

// Add console commands for manual debugging
console.log('[AI Overlay Fix] Loaded. Use AIOverlayFix.getDiagnostics() to check status or AIOverlayFix.resetAIChat() to reset.');
