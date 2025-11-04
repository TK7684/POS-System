/**
 * Responsive Modal Component
 * Accessible, touch-optimized, and mobile-friendly
 */

import { createElement } from '../utils/dom.js';
import { lockScroll, unlockScroll } from '../utils/scroll.js';

/**
 * Modal Component Class
 */
export class Modal {
  constructor(options = {}) {
    this.options = {
      title: '',
      content: '',
      size: 'md', // sm, md, lg, xl, full
      closable: true,
      backdrop: true,
      keyboard: true,
      showCloseButton: true,
      center: true,
      animation: true,
      className: '',
      footer: null,
      onShow: null,
      onHide: null,
      onConfirm: null,
      onCancel: null,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showFooter: true,
      confirmVariant: 'primary',
      cancelVariant: 'secondary',
      ...options
    };

    this.isVisible = false;
    this.isAnimating = false;
    this.element = null;
    this.backdrop = null;
    this.modal = null;
    this.focusedElementBeforeOpen = null;
    this.boundHandlers = {};
  }

  /**
   * Create modal element
   * @returns {HTMLElement} Modal element
   */
  render() {
    const modalContainer = createElement('div', {
      className: `modal ${this.options.animation ? 'modal-animation' : ''} ${this.options.className}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': this.options.title ? 'modal-title' : null,
      'aria-describedby': 'modal-content'
    });

    // Create backdrop
    if (this.options.backdrop) {
      this.backdrop = createElement('div', {
        className: 'modal-backdrop',
        'aria-hidden': 'true'
      });
      modalContainer.appendChild(this.backdrop);
    }

    // Create modal content
    this.modal = createElement('div', {
      className: `modal-content modal-${this.options.size}`
    });

    // Create header
    if (this.options.title || this.options.showCloseButton) {
      this.modal.appendChild(this.createHeader());
    }

    // Create body
    this.modal.appendChild(this.createBody());

    // Create footer
    if (this.options.showFooter || this.options.footer) {
      this.modal.appendChild(this.createFooter());
    }

    modalContainer.appendChild(this.modal);
    this.element = modalContainer;

    // Bind event handlers
    this.bindEventHandlers();

    return modalContainer;
  }

  /**
   * Create modal header
   * @returns {HTMLElement} Header element
   */
  createHeader() {
    const header = createElement('div', {
      className: 'modal-header'
    });

    // Title
    if (this.options.title) {
      const title = createElement('h2', {
        id: 'modal-title',
        className: 'modal-title'
      });
      title.textContent = this.options.title;
      header.appendChild(title);
    }

    // Spacer
    const spacer = createElement('div', {
      className: 'flex-1'
    });
    header.appendChild(spacer);

    // Close button
    if (this.options.showCloseButton && this.options.closable) {
      const closeButton = createElement('button', {
        type: 'button',
        className: 'modal-close',
        'aria-label': 'Close modal'
      });
      closeButton.innerHTML = '&times;';
      header.appendChild(closeButton);

      // Add close handler
      this.boundHandlers.closeButtonClick = () => this.hide();
      closeButton.addEventListener('click', this.boundHandlers.closeButtonClick);
    }

    return header;
  }

  /**
   * Create modal body
   * @returns {HTMLElement} Body element
   */
  createBody() {
    const body = createElement('div', {
      id: 'modal-content',
      className: 'modal-body'
    });

    if (typeof this.options.content === 'string') {
      body.innerHTML = this.options.content;
    } else if (this.options.content instanceof HTMLElement) {
      body.appendChild(this.options.content);
    } else if (typeof this.options.content === 'function') {
      const content = this.options.content();
      if (content instanceof HTMLElement) {
        body.appendChild(content);
      } else {
        body.innerHTML = String(content);
      }
    }

    return body;
  }

  /**
   * Create modal footer
   * @returns {HTMLElement} Footer element
   */
  createFooter() {
    const footer = createElement('div', {
      className: 'modal-footer'
    });

    if (this.options.footer) {
      // Custom footer
      if (this.options.footer instanceof HTMLElement) {
        footer.appendChild(this.options.footer);
      } else if (typeof this.options.footer === 'function') {
        const customFooter = this.options.footer();
        if (customFooter instanceof HTMLElement) {
          footer.appendChild(customFooter);
        }
      }
    } else {
      // Default footer with confirm/cancel buttons
      const cancelButton = createElement('button', {
        type: 'button',
        className: `btn btn-${this.options.cancelVariant}`,
        'data-action': 'cancel'
      });
      cancelButton.textContent = this.options.cancelText;
      footer.appendChild(cancelButton);

      const confirmButton = createElement('button', {
        type: 'button',
        className: `btn btn-${this.options.confirmVariant}`,
        'data-action': 'confirm'
      });
      confirmButton.textContent = this.options.confirmText;
      footer.appendChild(confirmButton);

      // Add button handlers
      this.boundHandlers.footerButtonClick = (event) => {
        const action = event.target.dataset.action;
        if (action === 'confirm') {
          this.handleConfirm();
        } else if (action === 'cancel') {
          this.handleCancel();
        }
      };

      cancelButton.addEventListener('click', this.boundHandlers.footerButtonClick);
      confirmButton.addEventListener('click', this.boundHandlers.footerButtonClick);
    }

    return footer;
  }

  /**
   * Bind event handlers
   */
  bindEventHandlers() {
    // Backdrop click
    if (this.backdrop && this.options.closable) {
      this.boundHandlers.backdropClick = () => this.hide();
      this.backdrop.addEventListener('click', this.boundHandlers.backdropClick);
    }

    // Keyboard events
    if (this.options.keyboard) {
      this.boundHandlers.keydown = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.hide();
        }
      };
      document.addEventListener('keydown', this.boundHandlers.keydown);
    }

    // Touch events for mobile
    if ('ontouchstart' in window) {
      this.boundHandlers.touchStart = (event) => {
        if (event.target === this.backdrop && this.options.closable) {
          this.hide();
        }
      };
      this.backdrop?.addEventListener('touchstart', this.boundHandlers.touchStart);
    }
  }

  /**
   * Unbind event handlers
   */
  unbindEventHandlers() {
    // Remove all bound event listeners
    Object.entries(this.boundHandlers).forEach(([event, handler]) => {
      if (event === 'closeButtonClick') {
        const closeBtn = this.element?.querySelector('.modal-close');
        closeBtn?.removeEventListener('click', handler);
      } else if (event === 'footerButtonClick') {
        const buttons = this.element?.querySelectorAll('[data-action]');
        buttons.forEach(btn => btn.removeEventListener('click', handler));
      } else if (event === 'backdropClick') {
        this.backdrop?.removeEventListener('click', handler);
      } else if (event === 'keydown') {
        document.removeEventListener('keydown', handler);
      } else if (event === 'touchStart') {
        this.backdrop?.removeEventListener('touchstart', handler);
      }
    });

    this.boundHandlers = {};
  }

  /**
   * Show modal
   * @param {HTMLElement} container - Container element (default: body)
   */
  show(container = document.body) {
    if (this.isVisible || this.isAnimating) return;

    this.isAnimating = true;

    // Store focused element
    this.focusedElementBeforeOpen = document.activeElement;

    // Create modal if not exists
    if (!this.element) {
      this.render();
    }

    // Add to container
    container.appendChild(this.element);

    // Lock scroll
    lockScroll();

    // Focus management
    this.trapFocus();

    // Trigger animation
    requestAnimationFrame(() => {
      this.element.classList.add('show');

      // Animation complete
      setTimeout(() => {
        this.isVisible = true;
        this.isAnimating = false;

        // Focus first focusable element
        this.focusFirstElement();

        // Trigger show callback
        if (this.options.onShow) {
          this.options.onShow(this);
        }
      }, this.options.animation ? 250 : 0);
    });
  }

  /**
   * Hide modal
   */
  hide() {
    if (!this.isVisible || this.isAnimating) return;

    this.isAnimating = true;

    // Start hide animation
    this.element.classList.remove('show');

    // Animation complete
    setTimeout(() => {
      this.isVisible = false;
      this.isAnimating = false;

      // Remove from DOM
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      // Unlock scroll
      unlockScroll();

      // Restore focus
      this.restoreFocus();

      // Trigger hide callback
      if (this.options.onHide) {
        this.options.onHide(this);
      }
    }, this.options.animation ? 250 : 0);
  }

  /**
   * Toggle modal visibility
   * @param {HTMLElement} container - Container element
   */
  toggle(container = document.body) {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(container);
    }
  }

  /**
   * Handle confirm action
   */
  handleConfirm() {
    if (this.options.onConfirm) {
      const result = this.options.onConfirm(this);

      // If promise, hide after resolution
      if (result && typeof result.then === 'function') {
        this.setLoading(true);
        result
          .then(() => this.hide())
          .catch(() => {
            // Keep modal open on error
            this.setLoading(false);
          });
      } else {
        this.hide();
      }
    } else {
      this.hide();
    }
  }

  /**
   * Handle cancel action
   */
  handleCancel() {
    if (this.options.onCancel) {
      const result = this.options.onCancel(this);

      if (result && typeof result.then === 'function') {
        result.then(() => this.hide());
      } else {
        this.hide();
      }
    } else {
      this.hide();
    }
  }

  /**
   * Focus management - trap focus within modal
   */
  trapFocus() {
    const focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    this.boundHandlers.tabKey = handleTabKey;
    this.element.addEventListener('keydown', this.boundHandlers.tabKey);
  }

  /**
   * Focus first focusable element
   */
  focusFirstElement() {
    const focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  /**
   * Restore focus to previous element
   */
  restoreFocus() {
    if (this.focusedElementBeforeOpen && this.focusedElementBeforeOpen.focus) {
      this.focusedElementBeforeOpen.focus();
    }
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    if (!this.modal) return;

    const buttons = this.modal.querySelectorAll('.btn');
    buttons.forEach(button => {
      if (loading) {
        button.disabled = true;
        button.classList.add('loading');
      } else {
        button.disabled = false;
        button.classList.remove('loading');
      }
    });
  }

  /**
   * Update modal title
   * @param {string} title - New title
   */
  setTitle(title) {
    this.options.title = title;

    if (this.modal) {
      const titleElement = this.modal.querySelector('#modal-title');
      if (titleElement) {
        titleElement.textContent = title;
      } else if (title) {
        // Create title if it doesn't exist
        const header = this.modal.querySelector('.modal-header');
        if (header) {
          const spacer = header.querySelector('.flex-1');
          const newTitle = createElement('h2', {
            id: 'modal-title',
            className: 'modal-title'
          });
          newTitle.textContent = title;
          header.insertBefore(newTitle, spacer);
        }
      }
    }
  }

  /**
   * Update modal content
   * @param {string|HTMLElement|Function} content - New content
   */
  setContent(content) {
    this.options.content = content;

    if (this.modal) {
      const body = this.modal.querySelector('#modal-content');
      if (body) {
        body.innerHTML = '';

        if (typeof content === 'string') {
          body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
          body.appendChild(content);
        } else if (typeof content === 'function') {
          const newContent = content();
          if (newContent instanceof HTMLElement) {
            body.appendChild(newContent);
          } else {
            body.innerHTML = String(newContent);
          }
        }
      }
    }
  }

  /**
   * Update modal size
   * @param {string} size - New size (sm, md, lg, xl, full)
   */
  setSize(size) {
    this.options.size = size;

    if (this.modal) {
      this.modal.className = this.modal.className.replace(/modal-\w+/, `modal-${size}`);
    }
  }

  /**
   * Check if modal is visible
   * @returns {boolean} Visibility state
   */
  isModalVisible() {
    return this.isVisible;
  }

  /**
   * Destroy modal
   */
  destroy() {
    // Hide modal first
    if (this.isVisible) {
      this.hide();
    }

    // Unbind event handlers
    this.unbindEventHandlers();

    // Remove element
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    // Clean up references
    this.element = null;
    this.backdrop = null;
    this.modal = null;
    this.focusedElementBeforeOpen = null;
  }
}

/**
 * Modal Factory Functions
 */

/**
 * Create alert modal
 * @param {string} message - Alert message
 * @param {string} title - Alert title
 * @param {Object} options - Modal options
 * @returns {Promise} Promise that resolves when modal is closed
 */
export function createAlert(message, title = 'Alert', options = {}) {
  return new Promise((resolve) => {
    const modal = new Modal({
      title,
      content: `<p>${message}</p>`,
      showFooter: true,
      showCloseButton: false,
      closable: false,
      confirmText: 'OK',
      confirmVariant: 'primary',
      onShow: () => {
        // Focus confirm button
        setTimeout(() => {
          const confirmBtn = modal.modal?.querySelector('[data-action="confirm"]');
          confirmBtn?.focus();
        }, 100);
      },
      onConfirm: () => {
        modal.destroy();
        resolve(true);
      },
      ...options
    });

    modal.show();
  });
}

/**
 * Create confirm modal
 * @param {string} message - Confirmation message
 * @param {string} title - Confirmation title
 * @param {Object} options - Modal options
 * @returns {Promise} Promise that resolves with user choice
 */
export function createConfirm(message, title = 'Confirm', options = {}) {
  return new Promise((resolve) => {
    const modal = new Modal({
      title,
      content: `<p>${message}</p>`,
      showFooter: true,
      showCloseButton: true,
      closable: true,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      confirmVariant: 'primary',
      onCancel: () => {
        modal.destroy();
        resolve(false);
      },
      onConfirm: () => {
        modal.destroy();
        resolve(true);
      },
      ...options
    });

    modal.show();
  });
}

/**
 * Create prompt modal
 * @param {string} message - Prompt message
 * @param {string} defaultValue - Default input value
 * @param {string} title - Prompt title
 * @param {Object} options - Modal options
 * @returns {Promise} Promise that resolves with input value or null
 */
export function createPrompt(message, defaultValue = '', title = 'Prompt', options = {}) {
  return new Promise((resolve) => {
    const input = createElement('input', {
      type: 'text',
      className: 'form-input',
      value: defaultValue,
      placeholder: options.placeholder || 'Enter value...'
    });

    const content = createElement('div');
    const messagePara = createElement('p');
    messagePara.textContent = message;
    content.appendChild(messagePara);
    content.appendChild(input);

    const modal = new Modal({
      title,
      content,
      showFooter: true,
      showCloseButton: true,
      closable: true,
      confirmText: 'OK',
      cancelText: 'Cancel',
      onShow: () => {
        // Focus input
        setTimeout(() => {
          input.focus();
          input.select();
        }, 100);
      },
      onConfirm: () => {
        modal.destroy();
        resolve(input.value);
      },
      onCancel: () => {
        modal.destroy();
        resolve(null);
      },
      ...options
    });

    modal.show();
  });
}

/**
 * Create loading modal
 * @param {string} message - Loading message
 * @param {Object} options - Modal options
 * @returns {Modal} Modal instance
 */
export function createLoadingModal(message = 'Loading...', options = {}) {
  const content = createElement('div', {
    className: 'loading-modal-content'
  });

  const spinner = createElement('div', {
    className: 'spinner spinner-lg'
  });

  const messageEl = createElement('p', {
    className: 'text-center mt-md'
  });
  messageEl.textContent = message;

  content.appendChild(spinner);
  content.appendChild(messageEl);

  const modal = new Modal({
    title: '',
    content,
    showFooter: false,
    showCloseButton: false,
    closable: false,
    keyboard: false,
    backdrop: true,
    size: 'sm',
    className: 'modal-loading',
    ...options
  });

  modal.show();
  return modal;
}

/**
 * Create responsive modal that adapts to screen size
 * @param {Object} options - Modal options
 * @returns {Modal} Modal instance
 */
export function createResponsiveModal(options = {}) {
  const responsiveOptions = {
    size: window.innerWidth < 768 ? 'full' : 'md',
    center: window.innerWidth >= 768,
    ...options
  };

  const modal = new Modal(responsiveOptions);

  // Add resize handler for responsive behavior
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newSize = window.innerWidth < 768 ? 'full' : options.size || 'md';
      modal.setSize(newSize);
    }, 150);
  };

  window.addEventListener('resize', handleResize);

  // Override destroy to clean up resize handler
  const originalDestroy = modal.destroy.bind(modal);
  modal.destroy = () => {
    window.removeEventListener('resize', handleResize);
    originalDestroy();
  };

  return modal;
}

// Export default
export default Modal;
