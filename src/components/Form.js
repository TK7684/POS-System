/**
 * Responsive Form Components
 * Touch-optimized, accessible, and mobile-friendly forms
 */

import { createElement } from '../utils/dom.js';
import { validateField, validateForm } from '../utils/validation.js';

/**
 * Input Component Class
 */
export class Input {
  constructor(options = {}) {
    this.options = {
      type: 'text',
      name: '',
      label: '',
      placeholder: '',
      value: '',
      required: false,
      disabled: false,
      readonly: false,
      validation: {},
      helper: '',
      error: '',
      className: '',
      autocomplete: 'off',
      maxlength: null,
      minlength: null,
      pattern: null,
      inputmode: null,
      ...options
    };

    this.element = null;
    this.inputElement = null;
    this.errorElement = null;
    this.helperElement = null;
    this.isValid = true;
    this.isDirty = false;
    this.listeners = new Map();
  }

  /**
   * Create input element
   * @returns {HTMLElement} Input container element
   */
  render() {
    const container = createElement('div', {
      className: `form-group ${this.options.className}`
    });

    // Label
    if (this.options.label) {
      const label = createElement('label', {
        for: this.options.name,
        className: `form-label ${this.options.required ? 'required' : ''}`
      });
      label.textContent = this.options.label;
      container.appendChild(label);
    }

    // Input container
    const inputContainer = createElement('div', {
      className: 'input-container'
    });

    // Input element
    const input = createElement('input', {
      type: this.options.type,
      name: this.options.name,
      id: this.options.name,
      placeholder: this.options.placeholder,
      value: this.options.value,
      required: this.options.required,
      disabled: this.options.disabled,
      readonly: this.options.readonly,
      autoComplete: this.options.autocomplete,
      maxLength: this.options.maxlength,
      minLength: this.options.minlength,
      pattern: this.options.pattern,
      inputMode: this.options.inputmode,
      className: `form-input ${this.options.error ? 'form-error' : ''}`
    });

    // Add event listeners
    this.addInputListeners(input);

    inputContainer.appendChild(input);
    this.inputElement = input;

    // Add icon or addon if needed
    if (this.options.prefix) {
      inputContainer.insertBefore(
        this.createAddon(this.options.prefix, 'prefix'),
        input
      );
    }

    if (this.options.suffix) {
      inputContainer.appendChild(
        this.createAddon(this.options.suffix, 'suffix')
      );
    }

    container.appendChild(inputContainer);

    // Helper text
    if (this.options.helper) {
      const helper = createElement('div', {
        className: 'form-helper'
      });
      helper.textContent = this.options.helper;
      container.appendChild(helper);
      this.helperElement = helper;
    }

    // Error message
    const error = createElement('div', {
      className: 'form-error-message',
      style: { display: this.options.error ? 'block' : 'none' }
    });
    error.textContent = this.options.error;
    container.appendChild(error);
    this.errorElement = error;

    this.element = container;
    return container;
  }

  /**
   * Create input addon (prefix/suffix)
   * @param {string} content - Addon content
   * @param {string} position - Position (prefix/suffix)
   * @returns {HTMLElement} Addon element
   */
  createAddon(content, position) {
    const addon = createElement('span', {
      className: `input-addon input-addon-${position}`
    });

    if (typeof content === 'string') {
      addon.textContent = content;
    } else if (content instanceof HTMLElement) {
      addon.appendChild(content.cloneNode(true));
    }

    return addon;
  }

  /**
   * Add input event listeners
   * @param {HTMLElement} input - Input element
   */
  addInputListeners(input) {
    // Input validation
    const validateInput = () => {
      this.isDirty = true;
      const validationResult = this.validate();
      this.updateValidationState(validationResult);
      this.emit('change', { value: input.value, valid: validationResult.isValid });
    };

    input.addEventListener('input', validateInput);
    input.addEventListener('blur', validateInput);

    // Touch optimization for mobile
    if ('ontouchstart' in window) {
      input.addEventListener('touchstart', () => {
        input.style.transform = 'scale(1.02)';
      });

      input.addEventListener('touchend', () => {
        setTimeout(() => {
          input.style.transform = '';
        }, 150);
      });
    }

    // Keyboard navigation
    input.addEventListener('keydown', (event) => {
      this.emit('keydown', { event, value: input.value });
    });
  }

  /**
   * Validate input
   * @returns {Object} Validation result
   */
  validate() {
    const value = this.getValue();
    const rules = {
      required: this.options.required,
      minLength: this.options.minlength,
      maxLength: this.options.maxlength,
      pattern: this.options.pattern,
      ...this.options.validation
    };

    const result = validateField(value, rules);
    this.isValid = result.isValid;
    this.setError(result.error || '');

    return result;
  }

  /**
   * Update validation state
   * @param {Object} result - Validation result
   */
  updateValidationState(result) {
    if (this.inputElement) {
      if (result.isValid) {
        this.inputElement.classList.remove('form-error');
        this.inputElement.classList.add('form-success');
      } else {
        this.inputElement.classList.remove('form-success');
        this.inputElement.classList.add('form-error');
      }
    }

    this.setError(result.error || '');
  }

  /**
   * Get input value
   * @returns {string} Input value
   */
  getValue() {
    return this.inputElement ? this.inputElement.value : '';
  }

  /**
   * Set input value
   * @param {string} value - New value
   */
  setValue(value) {
    if (this.inputElement) {
      this.inputElement.value = value;
      if (this.isDirty) {
        this.validate();
      }
    }
  }

  /**
   * Set error message
   * @param {string} error - Error message
   */
  setError(error) {
    this.options.error = error;

    if (this.errorElement) {
      this.errorElement.textContent = error;
      this.errorElement.style.display = error ? 'block' : 'none';
    }

    if (this.inputElement) {
      if (error) {
        this.inputElement.classList.add('form-error');
        this.inputElement.classList.remove('form-success');
      } else {
        this.inputElement.classList.remove('form-error');
        if (this.isDirty && this.isValid) {
          this.inputElement.classList.add('form-success');
        }
      }
    }
  }

  /**
   * Set disabled state
   * @param {boolean} disabled - Disabled state
   */
  setDisabled(disabled) {
    this.options.disabled = disabled;

    if (this.inputElement) {
      this.inputElement.disabled = disabled;
    }
  }

  /**
   * Focus input
   */
  focus() {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  /**
   * Blur input
   */
  blur() {
    if (this.inputElement) {
      this.inputElement.blur();
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  off(event, handler) {
    if (this.listeners.has(event)) {
      const handlers = this.listeners.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      });
    }
  }

  /**
   * Destroy input
   */
  destroy() {
    this.listeners.clear();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * Select Component Class
 */
export class Select {
  constructor(options = {}) {
    this.options = {
      name: '',
      label: '',
      placeholder: 'Select an option',
      options: [],
      value: '',
      required: false,
      disabled: false,
      searchable: false,
      multiple: false,
      className: '',
      ...options
    };

    this.element = null;
    this.selectElement = null;
    this.isOpen = false;
    this.selectedOptions = [];
  }

  /**
   * Create select element
   * @returns {HTMLElement} Select container element
   */
  render() {
    const container = createElement('div', {
      className: `form-group ${this.options.className}`
    });

    // Label
    if (this.options.label) {
      const label = createElement('label', {
        for: this.options.name,
        className: `form-label ${this.options.required ? 'required' : ''}`
      });
      label.textContent = this.options.label;
      container.appendChild(label);
    }

    // Select container
    const selectContainer = createElement('div', {
      className: 'select-container'
    });

    // Native select for accessibility
    const select = createElement('select', {
      name: this.options.name,
      id: this.options.name,
      required: this.options.required,
      disabled: this.options.disabled,
      multiple: this.options.multiple,
      className: 'form-select'
    });

    // Add placeholder option
    if (!this.options.multiple) {
      const placeholderOption = createElement('option', {
        value: '',
        disabled: this.options.required
      });
      placeholderOption.textContent = this.options.placeholder;
      select.appendChild(placeholderOption);
    }

    // Add options
    this.options.options.forEach(optionData => {
      const option = createElement('option', {
        value: optionData.value,
        selected: optionData.selected || optionData.value === this.options.value,
        disabled: optionData.disabled
      });
      option.textContent = optionData.label || optionData.value;

      if (optionData.group) {
        option.setAttribute('data-group', optionData.group);
      }

      select.appendChild(option);
    });

    selectContainer.appendChild(select);
    this.selectElement = select;

    // Add custom dropdown if searchable
    if (this.options.searchable) {
      this.addSearchableDropdown(selectContainer);
    }

    container.appendChild(selectContainer);
    this.element = container;

    // Add event listeners
    this.addEventListeners();

    return container;
  }

  /**
   * Add searchable dropdown
   * @param {HTMLElement} container - Select container
   */
  addSearchableDropdown(container) {
    const searchInput = createElement('input', {
      type: 'text',
      className: 'form-select-search',
      placeholder: 'Search options...',
      style: { display: 'none' }
    });

    const dropdown = createElement('div', {
      className: 'select-dropdown',
      style: { display: 'none' }
    });

    container.appendChild(searchInput);
    container.appendChild(dropdown);

    // Add search functionality
    searchInput.addEventListener('input', (event) => {
      const searchTerm = event.target.value.toLowerCase();
      const options = this.selectElement.querySelectorAll('option');

      dropdown.innerHTML = '';

      Array.from(options).forEach(option => {
        if (option.value && option.textContent.toLowerCase().includes(searchTerm)) {
          const item = createElement('div', {
            className: 'select-dropdown-item',
            'data-value': option.value
          });
          item.textContent = option.textContent;

          item.addEventListener('click', () => {
            this.selectElement.value = option.value;
            searchInput.style.display = 'none';
            dropdown.style.display = 'none';
            this.isOpen = false;
          });

          dropdown.appendChild(item);
        }
      });
    });
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    if (this.selectElement) {
      this.selectElement.addEventListener('change', (event) => {
        this.emit('change', { value: event.target.value, selected: this.getSelectedOptions() });
      });

      // Touch optimization
      if ('ontouchstart' in window) {
        this.selectElement.addEventListener('touchstart', () => {
          this.selectElement.style.transform = 'scale(1.02)';
        });

        this.selectElement.addEventListener('touchend', () => {
          setTimeout(() => {
            this.selectElement.style.transform = '';
          }, 150);
        });
      }
    }
  }

  /**
   * Get selected options
   * @returns {Array} Array of selected option objects
   */
  getSelectedOptions() {
    if (!this.selectElement) return [];

    if (this.options.multiple) {
      return Array.from(this.selectElement.selectedOptions).map(option => ({
        value: option.value,
        label: option.textContent,
        selected: true
      }));
    } else {
      const option = this.selectElement.options[this.selectElement.selectedIndex];
      return option ? [{
        value: option.value,
        label: option.textContent,
        selected: true
      }] : [];
    }
  }

  /**
   * Get selected value
   * @returns {string|string[]} Selected value(s)
   */
  getValue() {
    if (!this.selectElement) return this.options.multiple ? [] : '';

    if (this.options.multiple) {
      return Array.from(this.selectElement.selectedOptions).map(option => option.value);
    } else {
      return this.selectElement.value;
    }
  }

  /**
   * Set selected value
   * @param {string|string[]} value - Value(s) to select
   */
  setValue(value) {
    if (!this.selectElement) return;

    if (this.options.multiple && Array.isArray(value)) {
      Array.from(this.selectElement.options).forEach(option => {
        option.selected = value.includes(option.value);
      });
    } else {
      this.selectElement.value = value;
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.listeners) {
      this.listeners = new Map();
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners && this.listeners.has(event)) {
      this.listeners.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      });
    }
  }
}

/**
 * Form Component Class
 */
export class Form {
  constructor(options = {}) {
    this.options = {
      method: 'POST',
      action: '#',
      fields: [],
      submitText: 'Submit',
      resetText: 'Reset',
      showReset: false,
      loading: false,
      validateOnSubmit: true,
      className: '',
      onSubmit: null,
      onReset: null,
      onChange: null,
      ...options
    };

    this.element = null;
    this.fields = new Map();
    this.isValid = false;
    this.isSubmitting = false;
  }

  /**
   * Create form element
   * @returns {HTMLElement} Form element
   */
  render() {
    const form = createElement('form', {
      method: this.options.method,
      action: this.options.action,
      className: `responsive-form ${this.options.className}`,
      noValidate: true // Custom validation
    });

    // Add fields
    this.options.fields.forEach(fieldConfig => {
      const field = this.createField(fieldConfig);
      if (field) {
        form.appendChild(field);
      }
    });

    // Add buttons
    const buttonContainer = createElement('div', {
      className: 'form-actions flex gap-md justify-end mt-lg'
    });

    // Reset button
    if (this.options.showReset) {
      const resetButton = createElement('button', {
        type: 'button',
        className: 'btn btn-secondary',
        disabled: this.options.loading
      });
      resetButton.textContent = this.options.resetText;
      resetButton.addEventListener('click', () => this.reset());
      buttonContainer.appendChild(resetButton);
    }

    // Submit button
    const submitButton = createElement('button', {
      type: 'submit',
      className: 'btn btn-primary',
      disabled: this.options.loading
    });
    submitButton.innerHTML = this.options.loading ?
      '<span class="spinner"></span> Submitting...' :
      this.options.submitText;
    buttonContainer.appendChild(submitButton);

    form.appendChild(buttonContainer);

    // Add submit event listener
    form.addEventListener('submit', (event) => this.handleSubmit(event));

    this.element = form;
    return form;
  }

  /**
   * Create field based on configuration
   * @param {Object} config - Field configuration
   * @returns {HTMLElement|null} Field element
   */
  createField(config) {
    const { type, name, ...options } = config;

    switch (type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'password':
      case 'date':
        return new Input({
          ...options,
          type,
          name,
          onchange: (data) => this.handleFieldChange(name, data)
        }).render();

      case 'select':
        return new Select({
          ...options,
          name,
          onchange: (data) => this.handleFieldChange(name, data)
        }).render();

      case 'textarea':
        return this.createTextarea(config);

      case 'checkbox':
        return this.createCheckbox(config);

      case 'radio':
        return this.createRadioGroup(config);

      case 'hidden':
        return createElement('input', {
          type: 'hidden',
          name,
          value: options.value || ''
        });

      case 'divider':
        return createElement('hr', {
          className: 'form-divider'
        });

      case 'heading':
        return createElement('h3', {
          className: 'form-heading'
        });

      default:
        console.warn(`Unknown field type: ${type}`);
        return null;
    }
  }

  /**
   * Create textarea field
   * @param {Object} config - Textarea configuration
   * @returns {HTMLElement} Textarea element
   */
  createTextarea(config) {
    const { name, label, placeholder, required, rows = 4, validation = {} } = config;

    const container = createElement('div', {
      className: 'form-group'
    });

    if (label) {
      const labelElement = createElement('label', {
        for: name,
        className: `form-label ${required ? 'required' : ''}`
      });
      labelElement.textContent = label;
      container.appendChild(labelElement);
    }

    const textarea = createElement('textarea', {
      name,
      id: name,
      placeholder: placeholder || '',
      required: required || false,
      rows: rows,
      className: 'form-textarea'
    });

    container.appendChild(textarea);

    // Store field reference
    this.fields.set(name, { element: textarea, type: 'textarea', config });

    return container;
  }

  /**
   * Create checkbox field
   * @param {Object} config - Checkbox configuration
   * @returns {HTMLElement} Checkbox element
   */
  createCheckbox(config) {
    const { name, label, required, checked = false } = config;

    const container = createElement('div', {
      className: 'form-checkbox-group'
    });

    const checkbox = createElement('input', {
      type: 'checkbox',
      name,
      id: name,
      required: required || false,
      checked: checked,
      className: 'form-checkbox'
    });

    const labelElement = createElement('label', {
      for: name,
      className: 'form-checkbox-label'
    });
    labelElement.textContent = label || name;

    container.appendChild(checkbox);
    container.appendChild(labelElement);

    // Store field reference
    this.fields.set(name, { element: checkbox, type: 'checkbox', config });

    return container;
  }

  /**
   * Create radio group
   * @param {Object} config - Radio group configuration
   * @returns {HTMLElement} Radio group element
   */
  createRadioGroup(config) {
    const { name, label, options = [], required } = config;

    const container = createElement('div', {
      className: 'form-radio-group'
    });

    if (label) {
      const groupLabel = createElement('div', {
        className: 'form-label'
      });
      groupLabel.textContent = label;
      container.appendChild(groupLabel);
    }

    options.forEach((option, index) => {
      const radioContainer = createElement('div', {
        className: 'form-radio-item'
      });

      const radio = createElement('input', {
        type: 'radio',
        name,
        id: `${name}_${index}`,
        value: option.value,
        required: required || false,
        checked: option.checked || false,
        className: 'form-radio'
      });

      const optionLabel = createElement('label', {
        for: `${name}_${index}`,
        className: 'form-radio-label'
      });
      optionLabel.textContent = option.label || option.value;

      radioContainer.appendChild(radio);
      radioContainer.appendChild(optionLabel);
      container.appendChild(radioContainer);
    });

    return container;
  }

  /**
   * Handle field change
   * @param {string} fieldName - Field name
   * @param {Object} data - Change data
   */
  handleFieldChange(fieldName, data) {
    // Update field validation state
    const field = this.fields.get(fieldName);
    if (field) {
      field.isValid = data.valid !== false;
      field.value = data.value;
    }

    // Validate entire form
    this.validate();

    // Emit change event
    if (this.options.onChange) {
      this.options.onChange({
        fieldName,
        value: data.value,
        valid: data.valid,
        formValid: this.isValid
      });
    }
  }

  /**
   * Validate entire form
   * @returns {boolean} Form validity
   */
  validate() {
    const formData = this.getFormData();
    const validationRules = {};

    // Build validation rules from field configurations
    this.options.fields.forEach(field => {
      if (field.validation || field.required) {
        validationRules[field.name] = {
          required: field.required,
          ...field.validation
        };
      }
    });

    const result = validateForm(formData, validationRules);
    this.isValid = result.isValid;

    return result;
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async handleSubmit(event) {
    event.preventDefault();

    if (this.isSubmitting) return;

    // Validate form if required
    if (this.options.validateOnSubmit) {
      const validation = this.validate();
      if (!validation.isValid) {
        this.showErrors(validation.errors);
        return;
      }
    }

    this.isSubmitting = true;
    this.setLoading(true);

    try {
      const formData = this.getFormData();

      if (this.options.onSubmit) {
        const result = this.options.onSubmit(formData, this);

        // Handle async submission
        if (result && typeof result.then === 'function') {
          await result;
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.showError('An error occurred while submitting the form');
    } finally {
      this.isSubmitting = false;
      this.setLoading(false);
    }
  }

  /**
   * Get form data as object
   * @returns {Object} Form data
   */
  getFormData() {
    const formData = {};

    if (!this.element) return formData;

    const elements = this.element.elements;

    for (let element of elements) {
      if (element.name && !element.disabled) {
        if (element.type === 'checkbox') {
          formData[element.name] = element.checked;
        } else if (element.type === 'radio') {
          if (element.checked) {
            formData[element.name] = element.value;
          }
        } else if (element.type === 'select-multiple') {
          formData[element.name] = Array.from(element.selectedOptions).map(opt => opt.value);
        } else {
          formData[element.name] = element.value;
        }
      }
    }

    return formData;
  }

  /**
   * Set form data
   * @param {Object} data - Form data to set
   */
  setFormData(data) {
    if (!this.element) return;

    Object.entries(data).forEach(([name, value]) => {
      const element = this.element.elements[name];
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = Boolean(value);
        } else if (element.type === 'radio') {
          const radio = this.element.querySelector(`input[name="${name}"][value="${value}"]`);
          if (radio) radio.checked = true;
        } else if (element.type === 'select-multiple') {
          Array.from(element.options).forEach(option => {
            option.selected = Array.isArray(value) ? value.includes(option.value) : option.value === value;
          });
        } else {
          element.value = value;
        }
      }
    });
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.options.loading = loading;

    if (this.element) {
      const submitButton = this.element.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = loading;
        submitButton.innerHTML = loading ?
          '<span class="spinner"></span> Submitting...' :
          this.options.submitText;
      }

      // Disable all inputs during loading
      const inputs = this.element.querySelectorAll('input, select, textarea, button');
      inputs.forEach(input => {
        if (input.type !== 'submit') {
          input.disabled = loading;
        }
      });
    }
  }

  /**
   * Reset form
   */
  reset() {
    if (this.element) {
      this.element.reset();

      // Reset field states
      this.fields.forEach(field => {
        field.isValid = true;
        field.value = '';
      });

      if (this.options.onReset) {
        this.options.onReset(this);
      }
    }
  }

  /**
   * Show validation errors
   * @param {Object} errors - Validation errors
   */
  showErrors(errors) {
    // Remove existing errors
    this.element.querySelectorAll('.form-error-message').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });

    // Add new errors
    Object.entries(errors).forEach(([fieldName, message]) => {
      const field = this.fields.get(fieldName);
      if (field && field.element) {
        const formGroup = field.element.closest('.form-group');
        if (formGroup) {
          const errorElement = formGroup.querySelector('.form-error-message');
          if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
          }
          field.element.classList.add('form-error');
        }
      }
    });
  }

  /**
   * Show general error
   * @param {string} message - Error message
   */
  showError(message) {
    // Create or update error alert
    let errorAlert = this.element.querySelector('.form-error-alert');

    if (!errorAlert) {
      errorAlert = createElement('div', {
        className: 'alert alert-error form-error-alert'
      });
      this.element.insertBefore(errorAlert, this.element.firstChild);
    }

    errorAlert.textContent = message;
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.element.querySelectorAll('.form-error-message').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });

    this.element.querySelectorAll('.form-error').forEach(el => {
      el.classList.remove('form-error');
    });

    const errorAlert = this.element.querySelector('.form-error-alert');
    if (errorAlert) {
      errorAlert.remove();
    }
  }
}

export default { Input, Select, Form };
