/**
 * Validation Utilities for POS Application
 * Provides comprehensive client-side validation with Thai error messages
 * Integrates with ErrorHandler for consistent error reporting
 * 
 * Requirements: 1.6 - Real-time validation and helpful error messages
 */

class ValidationUtils {
  constructor() {
    this.errorHandler = window.ErrorHandler;
    this.validationRules = new Map();
    this.activeValidations = new Map();
  }

  /**
   * Validation rule definitions
   */
  static RULES = {
    REQUIRED: 'required',
    NUMBER: 'number',
    POSITIVE_NUMBER: 'positive-number',
    PRICE: 'price',
    QUANTITY: 'quantity',
    EMAIL: 'email',
    PHONE: 'phone',
    MIN_LENGTH: 'min-length',
    MAX_LENGTH: 'max-length',
    PATTERN: 'pattern',
    CUSTOM: 'custom'
  };

  /**
   * Thai validation error messages
   */
  static VALIDATION_MESSAGES = {
    'required': 'กรุณากรอกข้อมูลที่จำเป็น',
    'number': 'กรุณากรอกตัวเลขที่ถูกต้อง',
    'positive-number': 'กรุณากรอกตัวเลขที่มากกว่า 0',
    'price': 'กรุณากรอกราคาที่ถูกต้อง (เช่น 10.50)',
    'quantity': 'กรุณากรอกจำนวนที่ถูกต้อง',
    'email': 'กรุณากรอกอีเมลที่ถูกต้อง',
    'phone': 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง',
    'min-length': 'ข้อมูลสั้นเกินไป (ต้องมีอย่างน้อย {min} ตัวอักษร)',
    'max-length': 'ข้อมูลยาวเกินไป (ไม่เกิน {max} ตัวอักษร)',
    'pattern': 'รูปแบบข้อมูลไม่ถูกต้อง',
    'custom': 'ข้อมูลไม่ถูกต้อง'
  };

  /**
   * Register validation rules for a form field
   */
  registerField(fieldId, rules) {
    this.validationRules.set(fieldId, rules);
    
    const field = document.getElementById(fieldId);
    if (field) {
      // Add real-time validation
      field.addEventListener('input', () => this.validateField(fieldId));
      field.addEventListener('blur', () => this.validateField(fieldId));
      
      // Add accessibility attributes
      field.setAttribute('aria-describedby', `${fieldId}-error`);
    }
  }

  /**
   * Validate a single field
   */
  validateField(fieldId, showErrors = true) {
    const field = document.getElementById(fieldId);
    const rules = this.validationRules.get(fieldId);
    
    if (!field || !rules) {
      return { valid: true, errors: [] };
    }

    const value = field.value.trim();
    const errors = [];

    // Check each validation rule
    for (const rule of rules) {
      const result = this.applyValidationRule(value, rule, field);
      if (!result.valid) {
        errors.push(result.message);
      }
    }

    const isValid = errors.length === 0;
    
    if (showErrors) {
      this.displayFieldValidation(fieldId, isValid, errors);
    }

    // Store validation state
    this.activeValidations.set(fieldId, { valid: isValid, errors });

    return { valid: isValid, errors };
  }

  /**
   * Apply a single validation rule
   */
  applyValidationRule(value, rule, field) {
    switch (rule.type) {
      case ValidationUtils.RULES.REQUIRED:
        return this.validateRequired(value);
        
      case ValidationUtils.RULES.NUMBER:
        return this.validateNumber(value);
        
      case ValidationUtils.RULES.POSITIVE_NUMBER:
        return this.validatePositiveNumber(value);
        
      case ValidationUtils.RULES.PRICE:
        return this.validatePrice(value);
        
      case ValidationUtils.RULES.QUANTITY:
        return this.validateQuantity(value);
        
      case ValidationUtils.RULES.EMAIL:
        return this.validateEmail(value);
        
      case ValidationUtils.RULES.PHONE:
        return this.validatePhone(value);
        
      case ValidationUtils.RULES.MIN_LENGTH:
        return this.validateMinLength(value, rule.min);
        
      case ValidationUtils.RULES.MAX_LENGTH:
        return this.validateMaxLength(value, rule.max);
        
      case ValidationUtils.RULES.PATTERN:
        return this.validatePattern(value, rule.pattern);
        
      case ValidationUtils.RULES.CUSTOM:
        return this.validateCustom(value, rule.validator, field);
        
      default:
        return { valid: true, message: '' };
    }
  }

  /**
   * Individual validation methods
   */
  validateRequired(value) {
    const valid = value.length > 0;
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES.required
    };
  }

  validateNumber(value) {
    if (value === '') return { valid: true, message: '' };
    
    const number = parseFloat(value);
    const valid = !isNaN(number) && isFinite(number);
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES.number
    };
  }

  validatePositiveNumber(value) {
    if (value === '') return { valid: true, message: '' };
    
    const number = parseFloat(value);
    const valid = !isNaN(number) && isFinite(number) && number > 0;
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES['positive-number']
    };
  }

  validatePrice(value) {
    if (value === '') return { valid: true, message: '' };
    
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    const number = parseFloat(value);
    const valid = priceRegex.test(value) && !isNaN(number) && number >= 0;
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES.price
    };
  }

  validateQuantity(value) {
    if (value === '') return { valid: true, message: '' };
    
    const number = parseFloat(value);
    const valid = !isNaN(number) && isFinite(number) && number > 0;
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES.quantity
    };
  }

  validateEmail(value) {
    if (value === '') return { valid: true, message: '' };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(value);
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES.email
    };
  }

  validatePhone(value) {
    if (value === '') return { valid: true, message: '' };
    
    // Thai phone number patterns
    const phoneRegex = /^(\+66|0)[0-9]{8,9}$/;
    const valid = phoneRegex.test(value.replace(/[-\s]/g, ''));
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES.phone
    };
  }

  validateMinLength(value, min) {
    const valid = value.length >= min;
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES['min-length'].replace('{min}', min)
    };
  }

  validateMaxLength(value, max) {
    const valid = value.length <= max;
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES['max-length'].replace('{max}', max)
    };
  }

  validatePattern(value, pattern) {
    if (value === '') return { valid: true, message: '' };
    
    const regex = new RegExp(pattern);
    const valid = regex.test(value);
    return {
      valid,
      message: valid ? '' : ValidationUtils.VALIDATION_MESSAGES.pattern
    };
  }

  validateCustom(value, validator, field) {
    try {
      const result = validator(value, field);
      return {
        valid: result.valid,
        message: result.message || ValidationUtils.VALIDATION_MESSAGES.custom
      };
    } catch (error) {
      return {
        valid: false,
        message: ValidationUtils.VALIDATION_MESSAGES.custom
      };
    }
  }

  /**
   * Display field validation results
   */
  displayFieldValidation(fieldId, isValid, errors) {
    const field = document.getElementById(fieldId);
    const fieldContainer = field?.closest('.form-field') || field?.parentElement;
    
    if (!fieldContainer) return;

    // Remove existing validation classes and messages
    fieldContainer.classList.remove('has-error', 'has-success');
    const existingError = fieldContainer.querySelector('.form-error');
    const existingSuccess = fieldContainer.querySelector('.form-success');
    
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();

    if (field.value.trim() === '') {
      // Empty field - no validation display
      field.setAttribute('aria-invalid', 'false');
      return;
    }

    if (isValid) {
      // Show success state
      fieldContainer.classList.add('has-success');
      field.setAttribute('aria-invalid', 'false');
      
      const successElement = document.createElement('div');
      successElement.className = 'form-success';
      successElement.textContent = 'ถูกต้อง';
      fieldContainer.appendChild(successElement);
    } else {
      // Show error state
      fieldContainer.classList.add('has-error');
      field.setAttribute('aria-invalid', 'true');
      
      const errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      errorElement.id = `${fieldId}-error`;
      errorElement.textContent = errors[0]; // Show first error
      fieldContainer.appendChild(errorElement);

      // Report validation error to error handler
      if (this.errorHandler) {
        this.errorHandler.handleError('validation-error', new Error(errors[0]), {
          fieldId,
          value: field.value,
          inputElement: field
        });
      }
    }
  }

  /**
   * Validate entire form
   */
  validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return { valid: false, errors: [] };

    const allErrors = [];
    let allValid = true;

    // Validate all registered fields in the form
    const formFields = form.querySelectorAll('[id]');
    formFields.forEach(field => {
      if (this.validationRules.has(field.id)) {
        const result = this.validateField(field.id, true);
        if (!result.valid) {
          allValid = false;
          allErrors.push(...result.errors);
        }
      }
    });

    // Focus on first invalid field
    if (!allValid) {
      const firstInvalidField = form.querySelector('.has-error input, .has-error select, .has-error textarea');
      if (firstInvalidField) {
        firstInvalidField.focus();
      }
    }

    return { valid: allValid, errors: allErrors };
  }

  /**
   * Clear validation for a field
   */
  clearFieldValidation(fieldId) {
    const field = document.getElementById(fieldId);
    const fieldContainer = field?.closest('.form-field') || field?.parentElement;
    
    if (fieldContainer) {
      fieldContainer.classList.remove('has-error', 'has-success');
      const errorElement = fieldContainer.querySelector('.form-error');
      const successElement = fieldContainer.querySelector('.form-success');
      
      if (errorElement) errorElement.remove();
      if (successElement) successElement.remove();
    }

    if (field) {
      field.setAttribute('aria-invalid', 'false');
    }

    this.activeValidations.delete(fieldId);
  }

  /**
   * Clear all validation in a form
   */
  clearFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const formFields = form.querySelectorAll('[id]');
    formFields.forEach(field => {
      if (this.validationRules.has(field.id)) {
        this.clearFieldValidation(field.id);
      }
    });
  }

  /**
   * Auto-fix common input errors
   */
  autoFixInput(fieldId) {
    const field = document.getElementById(fieldId);
    const rules = this.validationRules.get(fieldId);
    
    if (!field || !rules) return false;

    let value = field.value;
    let fixed = false;

    // Auto-fix based on validation rules
    for (const rule of rules) {
      switch (rule.type) {
        case ValidationUtils.RULES.NUMBER:
        case ValidationUtils.RULES.POSITIVE_NUMBER:
        case ValidationUtils.RULES.PRICE:
        case ValidationUtils.RULES.QUANTITY:
          // Remove non-numeric characters except decimal point
          const cleaned = value.replace(/[^\d.-]/g, '');
          if (cleaned !== value) {
            field.value = cleaned;
            fixed = true;
          }
          break;
          
        case ValidationUtils.RULES.PHONE:
          // Format Thai phone number
          const phoneClean = value.replace(/[^\d+]/g, '');
          if (phoneClean.startsWith('66')) {
            field.value = '+' + phoneClean;
            fixed = true;
          } else if (phoneClean.startsWith('0') && phoneClean.length === 10) {
            // Valid Thai mobile format
            field.value = phoneClean;
            fixed = true;
          }
          break;
      }
    }

    if (fixed) {
      // Re-validate after fixing
      this.validateField(fieldId);
    }

    return fixed;
  }

  /**
   * Get validation summary for a form
   */
  getValidationSummary(formId) {
    const form = document.getElementById(formId);
    if (!form) return null;

    const summary = {
      totalFields: 0,
      validFields: 0,
      invalidFields: 0,
      errors: []
    };

    const formFields = form.querySelectorAll('[id]');
    formFields.forEach(field => {
      if (this.validationRules.has(field.id)) {
        summary.totalFields++;
        const validation = this.activeValidations.get(field.id);
        
        if (validation) {
          if (validation.valid) {
            summary.validFields++;
          } else {
            summary.invalidFields++;
            summary.errors.push(...validation.errors);
          }
        }
      }
    });

    return summary;
  }

  /**
   * Create validation rule builders for easier setup
   */
  static createRule(type, options = {}) {
    return { type, ...options };
  }

  static required() {
    return ValidationUtils.createRule(ValidationUtils.RULES.REQUIRED);
  }

  static number() {
    return ValidationUtils.createRule(ValidationUtils.RULES.NUMBER);
  }

  static positiveNumber() {
    return ValidationUtils.createRule(ValidationUtils.RULES.POSITIVE_NUMBER);
  }

  static price() {
    return ValidationUtils.createRule(ValidationUtils.RULES.PRICE);
  }

  static quantity() {
    return ValidationUtils.createRule(ValidationUtils.RULES.QUANTITY);
  }

  static email() {
    return ValidationUtils.createRule(ValidationUtils.RULES.EMAIL);
  }

  static phone() {
    return ValidationUtils.createRule(ValidationUtils.RULES.PHONE);
  }

  static minLength(min) {
    return ValidationUtils.createRule(ValidationUtils.RULES.MIN_LENGTH, { min });
  }

  static maxLength(max) {
    return ValidationUtils.createRule(ValidationUtils.RULES.MAX_LENGTH, { max });
  }

  static pattern(pattern) {
    return ValidationUtils.createRule(ValidationUtils.RULES.PATTERN, { pattern });
  }

  static custom(validator) {
    return ValidationUtils.createRule(ValidationUtils.RULES.CUSTOM, { validator });
  }
}

// Create global validation instance
window.ValidationUtils = new ValidationUtils();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationUtils;
}