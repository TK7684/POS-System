/**
 * Responsive Button Component
 * Touch-optimized, accessible, and performance-focused
 */

import { createElement } from '../utils/dom.js';

/**
 * Button Component Class
 */
export class Button {
  constructor(options = {}) {
    this.options = {
      text: '',
      variant: 'primary', // primary, secondary, outline, ghost, danger
      size: 'md', // sm, md, lg, xl
      disabled: false,
      loading: false,
      icon: null,
      iconPosition: 'left', // left, right
      fullWidth: false,
      type: 'button',
      onclick: null,
      className: '',
      attributes: {},
      ...options
    };

    this.element = null;
    this.originalText = this.options.text;
    this.isLoading = false;
  }

  /**
   * Create button element
   * @returns {HTMLElement} Button element
   */
  render() {
    const button = createElement('button', {
      type: this.options.type,
      className: this.getButtonClasses(),
      disabled: this.options.disabled || this.options.loading,
      ...this.options.attributes
    });

    // Add content
    this.setContent(button);

    // Add event listeners
    this.addEventListeners(button);

    this.element = button;
    return button;
  }

  /**
   * Get button classes based on options
   * @returns {string} CSS classes
   */
  getButtonClasses() {
    const classes = ['btn'];

    // Variant
    classes.push(`btn-${this.options.variant}`);

    // Size
    classes.push(`btn-${this.options.size}`);

    // Modifiers
    if (this.options.fullWidth) {
      classes.push('w-full');
    }

    if (this.options.loading) {
      classes.push('loading');
    }

    // Custom classes
    if (this.options.className) {
      classes.push(this.options.className);
    }

    return classes.join(' ');
  }

  /**
   * Set button content
   * @param {HTMLElement} button - Button element
   */
  setContent(button) {
    button.innerHTML = '';

    if (this.options.loading) {
      // Add spinner
      const spinner = createElement('span', {
        className: 'spinner',
        'aria-hidden': 'true'
      });
      button.appendChild(spinner);

      // Add loading text
      const loadingText = createElement('span', {
        className: 'btn-text'
      });
      loadingText.textContent = this.options.loadingText || 'Loading...';
      button.appendChild(loadingText);

      return;
    }

    // Add icon (left)
    if (this.options.icon && this.options.iconPosition === 'left') {
      button.appendChild(this.createIcon());
    }

    // Add text
    if (this.options.text) {
      const text = createElement('span', {
        className: 'btn-text'
      });
      text.textContent = this.options.text;
      button.appendChild(text);
    }

    // Add icon (right)
    if (this.options.icon && this.options.iconPosition === 'right') {
      button.appendChild(this.createIcon());
    }
  }

  /**
   * Create icon element
   * @returns {HTMLElement} Icon element
   */
  createIcon() {
    if (typeof this.options.icon === 'string') {
      const icon = createElement('span', {
        className: 'btn-icon',
        'aria-hidden': 'true'
      });
      icon.innerHTML = this.options.icon;
      return icon;
    }

    // If it's an SVG element or DOM node
    if (this.options.icon instanceof HTMLElement) {
      const iconWrapper = createElement('span', {
        className: 'btn-icon',
        'aria-hidden': 'true'
      });
      iconWrapper.appendChild(this.options.icon.cloneNode(true));
      return iconWrapper;
    }

    return null;
  }

  /**
   * Add event listeners
   * @param {HTMLElement} button - Button element
   */
  addEventListeners(button) {
    // Click handler
    if (this.options.onclick) {
      button.addEventListener('click', (event) => {
        if (this.options.loading || this.options.disabled) {
          event.preventDefault();
          return;
        }

        const result = this.options.onclick(event, this);

        // If result is a promise, show loading state
        if (result && typeof result.then === 'function') {
          this.setLoading(true);
          result.finally(() => {
            this.setLoading(false);
          });
        }
      });
    }

    // Touch feedback for mobile
    if ('ontouchstart' in window) {
      button.addEventListener('touchstart', () => {
        button.style.transform = 'scale(0.98)';
      });

      button.addEventListener('touchend', () => {
        setTimeout(() => {
          button.style.transform = '';
        }, 150);
      });
    }

    // Keyboard navigation
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        button.click();
      }
    });
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    if (this.isLoading === loading) return;

    this.isLoading = loading;
    this.options.loading = loading;

    if (this.element) {
      this.element.disabled = loading || this.options.disabled;
      this.element.className = this.getButtonClasses();
      this.setContent(this.element);
    }
  }

  /**
   * Set disabled state
   * @param {boolean} disabled - Disabled state
   */
  setDisabled(disabled) {
    this.options.disabled = disabled;

    if (this.element) {
      this.element.disabled = disabled || this.options.loading;
    }
  }

  /**
   * Update button text
   * @param {string} text - New text
   */
  setText(text) {
    this.options.text = text;
    this.originalText = text;

    if (this.element && !this.options.loading) {
      this.setContent(this.element);
    }
  }

  /**
   * Update button variant
   * @param {string} variant - New variant
   */
  setVariant(variant) {
    this.options.variant = variant;

    if (this.element) {
      this.element.className = this.getButtonClasses();
    }
  }

  /**
   * Update button size
   * @param {string} size - New size
   */
  setSize(size) {
    this.options.size = size;

    if (this.element) {
      this.element.className = this.getButtonClasses();
    }
  }

  /**
   * Show button
   */
  show() {
    if (this.element) {
      this.element.style.display = '';
    }
  }

  /**
   * Hide button
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * Remove button
   */
  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  /**
   * Focus button
   */
  focus() {
    if (this.element) {
      this.element.focus();
    }
  }

  /**
   * Blur button
   */
  blur() {
    if (this.element) {
      this.element.blur();
    }
  }

  /**
   * Get button element
   * @returns {HTMLElement} Button element
   */
  getElement() {
    return this.element;
  }
}

/**
 * Button Factory Functions
 */

/**
 * Create primary button
 * @param {Object} options - Button options
 * @returns {Button} Button instance
 */
export function createPrimaryButton(options = {}) {
  return new Button({ ...options, variant: 'primary' });
}

/**
 * Create secondary button
 * @param {Object} options - Button options
 * @returns {Button} Button instance
 */
export function createSecondaryButton(options = {}) {
  return new Button({ ...options, variant: 'secondary' });
}

/**
 * Create outline button
 * @param {Object} options - Button options
 * @returns {Button} Button instance
 */
export function createOutlineButton(options = {}) {
  return new Button({ ...options, variant: 'outline' });
}

/**
 * Create ghost button
 * @param {Object} options - Button options
 * @returns {Button} Button instance
 */
export function createGhostButton(options = {}) {
  return new Button({ ...options, variant: 'ghost' });
}

/**
 * Create danger button
 * @param {Object} options - Button options
 * @returns {Button} Button instance
 */
export function createDangerButton(options = {}) {
  return new Button({ ...options, variant: 'danger' });
}

/**
 * Create icon button
 * @param {string|HTMLElement} icon - Icon content
 * @param {Object} options - Button options
 * @returns {Button} Button instance
 */
export function createIconButton(icon, options = {}) {
  return new Button({
    ...options,
    icon,
    text: options.text || '',
    className: `btn-icon-only ${options.className || ''}`
  });
}

/**
 * Create button group
 * @param {Array<Button>} buttons - Array of button instances
 * @param {Object} options - Group options
 * @returns {HTMLElement} Button group element
 */
export function createButtonGroup(buttons, options = {}) {
  const group = createElement('div', {
    className: `btn-group ${options.className || ''}`,
    role: 'group',
    'aria-label': options.ariaLabel || 'Button group'
  });

  buttons.forEach(button => {
    const buttonElement = button.render();
    group.appendChild(buttonElement);
  });

  return group;
}

/**
 * Create responsive button layout
 * @param {Object} options - Layout options
 * @returns {HTMLElement} Responsive container
 */
export function createResponsiveButtonLayout(options = {}) {
  const {
    primaryButton,
    secondaryButtons = [],
    stackOnMobile = true,
    className = ''
  } = options;

  const container = createElement('div', {
    className: `btn-responsive ${stackOnMobile ? 'btn-stack-mobile' : ''} ${className}`
  });

  // Primary button
  if (primaryButton) {
    const primaryElement = primaryButton.render();
    primaryElement.className += ' btn-responsive-primary';
    container.appendChild(primaryElement);
  }

  // Secondary buttons
  if (secondaryButtons.length > 0) {
    const secondaryContainer = createElement('div', {
      className: 'btn-responsive-secondary'
    });

    secondaryButtons.forEach(button => {
      const buttonElement = button.render();
      buttonElement.className += ' btn-responsive-secondary-item';
      secondaryContainer.appendChild(buttonElement);
    });

    container.appendChild(secondaryContainer);
  }

  return container;
}

// Export default
export default Button;
