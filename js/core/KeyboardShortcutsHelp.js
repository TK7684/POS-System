/**
 * Keyboard Shortcuts Help Dialog
 * Displays available keyboard shortcuts in a modal dialog
 */

class KeyboardShortcutsHelp {
  constructor() {
    this.shortcuts = [
      {
        category: 'การนำทาง (Navigation)',
        items: [
          { key: 'Ctrl + 1', description: 'ไปหน้าหลัก' },
          { key: 'Ctrl + 2', description: 'ไปหน้าซื้อสินค้า' },
          { key: 'Ctrl + 3', description: 'ไปหน้าขายสินค้า' },
          { key: 'Ctrl + 4', description: 'ไปหน้าเมนู' },
          { key: 'Ctrl + 5', description: 'ไปหน้ารายงาน' }
        ]
      },
      {
        category: 'การดำเนินการ (Actions)',
        items: [
          { key: 'Ctrl + N', description: 'สร้างรายการใหม่' },
          { key: 'Ctrl + S', description: 'บันทึกข้อมูล' },
          { key: 'Ctrl + P', description: 'พิมพ์' },
          { key: 'Ctrl + F', description: 'ค้นหา' },
          { key: 'Ctrl + R', description: 'รีเฟรชข้อมูล' }
        ]
      },
      {
        category: 'การกรอกข้อมูล (Forms)',
        items: [
          { key: 'Ctrl + Enter', description: 'ส่งฟอร์มที่เลือก' },
          { key: 'Escape', description: 'ปิดหน้าต่างหรือยกเลิก' },
          { key: 'Tab', description: 'ไปช่องถัดไป' },
          { key: 'Shift + Tab', description: 'ไปช่องก่อนหน้า' }
        ]
      },
      {
        category: 'การเข้าถึงด่วน (Quick Access)',
        items: [
          { key: 'Alt + P', description: 'เพิ่มการซื้อด่วน' },
          { key: 'Alt + S', description: 'เพิ่มการขายด่วน' },
          { key: 'Alt + M', description: 'เพิ่มเมนูด่วน' }
        ]
      },
      {
        category: 'ความช่วยเหลือ (Help)',
        items: [
          { key: 'F1', description: 'แสดงความช่วยเหลือ' },
          { key: 'Ctrl + /', description: 'แสดงคีย์บอร์ดช็อตคัต' },
          { key: 'F5', description: 'รีเฟรชหน้าเว็บ' }
        ]
      },
      {
        category: 'การนำทางตาราง (Table Navigation)',
        items: [
          { key: '↑ ↓ ← →', description: 'เลื่อนในตาราง' },
          { key: 'Enter', description: 'แก้ไขแถวที่เลือก' },
          { key: 'Delete', description: 'ลบแถวที่เลือก' },
          { key: 'Shift + Wheel', description: 'เลื่อนตารางแนวนอน' }
        ]
      }
    ];
    
    this.modal = null;
    this.isVisible = false;
    
    // Bind methods
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }
  
  show() {
    if (this.isVisible) return;
    
    this.createModal();
    this.isVisible = true;
    
    // Add event listeners
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('click', this.handleClickOutside);
    
    // Focus the modal for accessibility
    setTimeout(() => {
      if (this.modal) {
        this.modal.focus();
      }
    }, 100);
  }
  
  hide() {
    if (!this.isVisible) return;
    
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    
    this.isVisible = false;
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('click', this.handleClickOutside);
  }
  
  createModal() {
    // Create modal backdrop
    this.modal = document.createElement('div');
    this.modal.className = 'keyboard-help-modal';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-labelledby', 'keyboard-help-title');
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.tabIndex = -1;
    
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.3s ease-out;
    `;
    
    // Create modal content
    const content = document.createElement('div');
    content.className = 'keyboard-help-content';
    content.style.cssText = `
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 0;
      max-width: 800px;
      max-height: 80vh;
      width: 90%;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg);
    `;
    
    const title = document.createElement('h2');
    title.id = 'keyboard-help-title';
    title.textContent = 'คีย์บอร์ดช็อตคัต';
    title.style.cssText = `
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
    `;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'btn ghost';
    closeButton.innerHTML = '✕';
    closeButton.setAttribute('aria-label', 'ปิด');
    closeButton.style.cssText = `
      width: 32px;
      height: 32px;
      min-height: 32px;
      padding: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: var(--muted);
      transition: all 0.2s ease;
    `;
    
    closeButton.addEventListener('click', this.hide);
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'var(--line)';
      closeButton.style.color = 'var(--text)';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'transparent';
      closeButton.style.color = 'var(--muted)';
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create body
    const body = document.createElement('div');
    body.style.cssText = `
      padding: 24px;
      overflow-y: auto;
      max-height: calc(80vh - 120px);
    `;
    
    // Create shortcuts grid
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    `;
    
    // Add shortcut categories
    this.shortcuts.forEach(category => {
      const categorySection = document.createElement('div');
      categorySection.style.cssText = `
        background: var(--bg);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 20px;
      `;
      
      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = category.category;
      categoryTitle.style.cssText = `
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--brand);
        border-bottom: 1px solid var(--line);
        padding-bottom: 8px;
      `;
      
      const shortcutsList = document.createElement('div');
      shortcutsList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
      `;
      
      category.items.forEach(item => {
        const shortcutItem = document.createElement('div');
        shortcutItem.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        `;
        
        const keyCombo = document.createElement('kbd');
        keyCombo.textContent = item.key;
        keyCombo.style.cssText = `
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 4px 8px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          min-width: 80px;
          text-align: center;
        `;
        
        const description = document.createElement('span');
        description.textContent = item.description;
        description.style.cssText = `
          color: var(--text);
          font-size: 14px;
          flex: 1;
          margin-left: 16px;
        `;
        
        shortcutItem.appendChild(keyCombo);
        shortcutItem.appendChild(description);
        shortcutsList.appendChild(shortcutItem);
      });
      
      categorySection.appendChild(categoryTitle);
      categorySection.appendChild(shortcutsList);
      grid.appendChild(categorySection);
    });
    
    body.appendChild(grid);
    
    // Create footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px 24px;
      border-top: 1px solid var(--line);
      background: var(--bg);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
    `;
    
    const footerText = document.createElement('p');
    footerText.textContent = 'กด Escape หรือคลิกนอกหน้าต่างเพื่อปิด';
    footerText.style.cssText = `
      margin: 0;
      font-size: 12px;
      color: var(--muted);
      text-align: center;
    `;
    
    footer.appendChild(footerText);
    
    // Assemble modal
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    this.modal.appendChild(content);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      .keyboard-help-modal kbd {
        transition: all 0.2s ease;
      }
      
      .keyboard-help-modal kbd:hover {
        background: var(--brand);
        color: white;
        transform: scale(1.05);
      }
      
      @media (max-width: 768px) {
        .keyboard-help-content {
          width: 95% !important;
          max-height: 90vh !important;
        }
        
        .keyboard-help-content > div:nth-child(2) {
          padding: 16px !important;
        }
        
        .keyboard-help-content > div:nth-child(2) > div {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
        }
      }
    `;
    
    if (!document.querySelector('#keyboard-help-styles')) {
      style.id = 'keyboard-help-styles';
      document.head.appendChild(style);
    }
    
    // Add to DOM
    document.body.appendChild(this.modal);
  }
  
  handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.hide();
    }
  }
  
  handleClickOutside(e) {
    if (e.target === this.modal) {
      this.hide();
    }
  }
  
  // Static method to show help
  static show() {
    const help = new KeyboardShortcutsHelp();
    help.show();
    return help;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyboardShortcutsHelp;
} else {
  window.KeyboardShortcutsHelp = KeyboardShortcutsHelp;
}