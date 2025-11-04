/**
 * Form Validation Utilities
 * Comprehensive validation with international support
 */

import { logError, logWarn } from './utils.js';

/**
 * Validation rule registry
 */
const VALIDATION_RULES = {
  required: {
    validate: (value) => value !== null && value !== undefined && value !== '' && String(value).trim() !== '',
    message: 'This field is required'
  },

  email: {
    validate: (value) => {
      if (!value) return true; // Optional email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(String(value).toLowerCase());
    },
    message: 'Please enter a valid email address'
  },

  phone: {
    validate: (value) => {
      if (!value) return true; // Optional phone
      // Support Thai and international phone formats
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      return phoneRegex.test(String(value).replace(/\s/g, ''));
    },
    message: 'Please enter a valid phone number'
  },

  number: {
    validate: (value) => {
      if (!value) return true; // Optional number
      const num = parseFloat(String(value));
      return !isNaN(num) && isFinite(num);
    },
    message: 'Please enter a valid number'
  },

  integer: {
    validate: (value) => {
      if (!value) return true; // Optional integer
      const num = parseInt(String(value), 10);
      return !isNaN(num) && Number.isInteger(num);
    },
    message: 'Please enter a whole number'
  },

  positive: {
    validate: (value) => {
      if (!value) return true; // Optional positive
      const num = parseFloat(String(value));
      return !isNaN(num) && num > 0;
    },
    message: 'Please enter a positive number'
  },

  minLength: {
    validate: (value, min) => {
      if (!value) return true; // Optional field
      return String(value).length >= parseInt(min);
    },
    message: (min) => `Minimum length is ${min} characters`,
    hasParameter: true
  },

  maxLength: {
    validate: (value, max) => {
      if (!value) return true; // Optional field
      return String(value).length <= parseInt(max);
    },
    message: (max) => `Maximum length is ${max} characters`,
    hasParameter: true
  },

  min: {
    validate: (value, min) => {
      if (!value) return true; // Optional field
      const num = parseFloat(String(value));
      return !isNaN(num) && num >= parseFloat(min);
    },
    message: (min) => `Minimum value is ${min}`,
    hasParameter: true
  },

  max: {
    validate: (value, max) => {
      if (!value) return true; // Optional field
      const num = parseFloat(String(value));
      return !isNaN(num) && num <= parseFloat(max);
    },
    message: (max) => `Maximum value is ${max}`,
    hasParameter: true
  },

  pattern: {
    validate: (value, pattern) => {
      if (!value) return true; // Optional field
      try {
        const regex = new RegExp(pattern);
        return regex.test(String(value));
      } catch (error) {
        logError('Invalid regex pattern:', { pattern, error: error.message });
        return true;
      }
    },
    message: 'Please match the required format',
    hasParameter: true
  },

  thaiText: {
    validate: (value) => {
      if (!value) return true; // Optional field
      // Allow Thai characters, spaces, and common punctuation
      const thaiRegex = /^[\u0E00-\u0E7F\s\.\,\-\!\?\(\)]+$/;
      return thaiRegex.test(String(value));
    },
    message: 'Please enter Thai text only'
  },

  englishText: {
    validate: (value) => {
      if (!value) return true; // Optional field
      // Allow English letters, numbers, spaces, and common punctuation
      const englishRegex = /^[a-zA-Z0-9\s\.\,\-\!\?\(\)]+$/;
      return englishRegex.test(String(value));
    },
    message: 'Please enter English text only'
  },

  price: {
    validate: (value) => {
      if (!value) return true; // Optional price
      const priceRegex = /^\d+(\.\d{1,2})?$/;
      return priceRegex.test(String(value));
    },
    message: 'Please enter a valid price (e.g., 100.50)'
  },

  quantity: {
    validate: (value) => {
      if (!value) return true; // Optional quantity
      const num = parseFloat(String(value));
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    message: 'Please enter a valid quantity (0.01 - 999999)'
  },

  id: {
    validate: (value) => {
      if (!value) return true; // Optional ID
      // Allow alphanumeric, hyphens, and underscores
      const idRegex = /^[a-zA-Z0-9_\-]+$/;
      return idRegex.test(String(value));
    },
    message: 'ID can only contain letters, numbers, hyphens, and underscores'
  },

  date: {
    validate: (value) => {
      if (!value) return true; // Optional date
      const date = new Date(String(value));
      return !isNaN(date.getTime());
    },
    message: 'Please enter a valid date'
  },

  url: {
    validate: (value) => {
      if (!value) return true; // Optional URL
      try {
        new URL(String(value));
        return true;
      } catch (error) {
        return false;
      }
    },
    message: 'Please enter a valid URL'
  },

  thaiMobile: {
    validate: (value) => {
      if (!value) return true; // Optional mobile
      // Thai mobile numbers: 08-09 prefix, 9-10 digits
      const thaiMobileRegex = /^(0[689]\d{8,9})$/;
      return thaiMobileRegex.test(String(value).replace(/[\s\-\(\)]/g, ''));
    },
    message: 'Please enter a valid Thai mobile number (e.g., 0812345678)'
  },

  thaiID: {
    validate: (value) => {
      if (!value) return true; // Optional ID
      // Thai ID card: 13 digits
      const thaiIDRegex = /^\d{13}$/;
      if (!thaiIDRegex.test(String(value))) return false;

      // Check digit validation for Thai ID
      const digits = String(value).split('').map(Number);
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += digits[i] * (13 - i);
      }
      const checkDigit = (11 - (sum % 11)) % 10;
      return checkDigit === digits[12];
    },
    message: 'Please enter a valid Thai ID card number'
  }
};

/**
 * Validate a single field
 * @param {*} value - Field value to validate
 * @param {Object} rules - Validation rules object
 * @returns {Object} Validation result
 */
export function validateField(value, rules = {}) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Early return if no rules
  if (Object.keys(rules).length === 0) {
    return result;
  }

  // Run each validation rule
  Object.entries(rules).forEach(([ruleName, ruleValue]) => {
    const rule = VALIDATION_RULES[ruleName];

    if (!rule) {
      logWarn(`Unknown validation rule: ${ruleName}`);
      return;
    }

    let isValid;
    let message;

    try {
      if (rule.hasParameter) {
        isValid = rule.validate(value, ruleValue);
        message = typeof rule.message === 'function' ? rule.message(ruleValue) : rule.message;
      } else {
        isValid = rule.validate(value);
        message = rule.message;
      }
    } catch (error) {
      logError(`Validation error for rule ${ruleName}:`, { error: error.message, value, ruleValue });
      isValid = false;
      message = 'Validation error occurred';
    }

    if (!isValid) {
      result.isValid = false;
      result.errors.push({
        rule: ruleName,
        message,
        value,
        ruleValue
      });
    }
  });

  return result;
}

/**
 * Validate entire form
 * @param {Object} formData - Form data object
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Form validation result
 */
export function validateForm(formData, validationRules = {}) {
  const result = {
    isValid: true,
    errors: {},
    warnings: {},
    summary: [],
    fieldCount: Object.keys(validationRules).length,
    validFieldCount: 0,
    invalidFieldCount: 0
  };

  // Validate each field
  Object.entries(validationRules).forEach(([fieldName, rules]) => {
    const value = formData[fieldName];
    const fieldResult = validateField(value, rules);

    if (fieldResult.isValid) {
      result.validFieldCount++;
    } else {
      result.isValid = false;
      result.invalidFieldCount++;
      result.errors[fieldName] = fieldResult.errors;
      result.warnings[fieldName] = fieldResult.warnings;

      // Add to summary
      fieldResult.errors.forEach(error => {
        result.summary.push({
          field: fieldName,
          rule: error.rule,
          message: error.message,
          value: error.value
        });
      });
    }
  });

  return result;
}

/**
 * Real-time validation as user types
 * @param {HTMLInputElement} input - Input element
 * @param {Object} rules - Validation rules
 * @param {Function} callback - Validation callback
 * @param {Object} options - Validation options
 * @returns {Function} Cleanup function
 */
export function validateOnInput(input, rules, callback, options = {}) {
  const {
    debounceMs = 300,
    validateOnBlur = true,
    validateOnChange = true
  } = options;

  let debounceTimer;

  const performValidation = () => {
    const value = input.value;
    const result = validateField(value, rules);

    // Update UI based on validation result
    updateFieldValidationUI(input, result);

    // Call callback
    if (callback) {
      callback(result, value, input);
    }
  };

  const debouncedValidate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performValidation, debounceMs);
  };

  const listeners = [];

  // Input event (with debounce)
  if (validateOnChange) {
    input.addEventListener('input', debouncedValidate);
    listeners.push(() => input.removeEventListener('input', debouncedValidate));
  }

  // Blur event (immediate validation)
  if (validateOnBlur) {
    input.addEventListener('blur', performValidation);
    listeners.push(() => input.removeEventListener('blur', performValidation));
  }

  // Initial validation
  if (input.value) {
    performValidation();
  }

  // Return cleanup function
  return () => {
    clearTimeout(debounceTimer);
    listeners.forEach(cleanup => cleanup());
  };
}

/**
 * Update field UI based on validation result
 * @param {HTMLInputElement} input - Input element
 * @param {Object} validationResult - Validation result
 */
export function updateFieldValidationUI(input, validationResult) {
  // Find form group
  const formGroup = input.closest('.form-group') || input.closest('.input-container');
  if (!formGroup) return;

  // Remove existing validation classes
  formGroup.classList.remove('form-valid', 'form-invalid', 'form-warning');

  // Remove existing error messages
  const existingError = formGroup.querySelector('.form-error-message');
  if (existingError) {
    existingError.remove();
  }

  // Apply new validation state
  if (validationResult.isValid) {
    formGroup.classList.add('form-valid');
    input.setAttribute('aria-invalid', 'false');
  } else {
    formGroup.classList.add('form-invalid');
    input.setAttribute('aria-invalid', 'true');

    // Add error message
    if (validationResult.errors.length > 0) {
      const errorElement = document.createElement('div');
      errorElement.className = 'form-error-message';
      errorElement.textContent = validationResult.errors[0].message;
      errorElement.setAttribute('role', 'alert');
      formGroup.appendChild(errorElement);
    }
  }

  // Add warning messages
  if (validationResult.warnings.length > 0) {
    formGroup.classList.add('form-warning');

    validationResult.warnings.forEach(warning => {
      const warningElement = document.createElement('div');
      warningElement.className = 'form-warning-message';
      warningElement.textContent = warning.message;
      formGroup.appendChild(warningElement);
    });
  }
}

/**
 * Clear validation state from field
 * @param {HTMLInputElement} input - Input element
 */
export function clearFieldValidation(input) {
  const formGroup = input.closest('.form-group') || input.closest('.input-container');
  if (!formGroup) return;

  formGroup.classList.remove('form-valid', 'form-invalid', 'form-warning');
  input.removeAttribute('aria-invalid');

  // Remove error and warning messages
  const messages = formGroup.querySelectorAll('.form-error-message, .form-warning-message');
  messages.forEach(msg => msg.remove());
}

/**
 * Validate Thai-specific fields
 * @param {string} fieldType - Type of Thai field
 * @param {*} value - Field value
 * @returns {Object} Validation result
 */
export function validateThaiField(fieldType, value) {
  switch (fieldType) {
    case 'thai_name':
      return validateField(value, {
        required: true,
        minLength: 2,
        maxLength: 50,
        thaiText: true
      });

    case 'thai_address':
      return validateField(value, {
        required: true,
        minLength: 5,
        maxLength: 200,
        thaiText: true
      });

    case 'thai_mobile':
      return validateField(value, {
        required: true,
        thaiMobile: true
      });

    case 'thai_id':
      return validateField(value, {
        required: true,
        thaiID: true
      });

    default:
      return validateField(value, { required: true });
  }
}

/**
 * Create validation schema for common POS fields
 * @param {string} fieldType - Type of field
 * @param {Object} options - Additional options
 * @returns {Object} Validation rules
 */
export function createPOSSchema(fieldType, options = {}) {
  const baseRules = {
    required: options.required !== false
  };

  switch (fieldType) {
    case 'ingredient_name':
      return {
        ...baseRules,
        minLength: 1,
        maxLength: 100,
        pattern: '^[\\u0E00-\\u0E7Fa-zA-Z0-9\\s\\-\\(\\)]+$'
      };

    case 'quantity':
      return {
        ...baseRules,
        number: true,
        positive: true,
        min: options.min || 0.01,
        max: options.max || 999999
      };

    case 'price':
      return {
        ...baseRules,
        number: true,
        positive: true,
        min: options.min || 0.01,
        max: options.max || 999999,
        pattern: '^\\d+(\\.\\d{1,2})?$'
      };

    case 'menu_name':
      return {
        ...baseRules,
        minLength: 1,
        maxLength: 100
      };

    case 'platform':
      return {
        ...baseRules,
        pattern: '^[a-zA-Z0-9\\s\\-_]+$',
        maxLength: 50
      };

    case 'supplier_note':
      return {
        required: false,
        maxLength: 500
      };

    case 'customer_phone':
      return {
        ...baseRules,
        phone: true,
        maxLength: 20
      };

    case 'customer_email':
      return {
        required: false,
        email: true,
        maxLength: 100
      };

    default:
      return baseRules;
  }
}

/**
 * Async validation for server-side checks
 * @param {*} value - Field value
 * @param {Function} validator - Async validation function
 * @param {number} debounceMs - Debounce time in milliseconds
 * @returns {Promise} Validation promise
 */
export function validateAsync(value, validator, debounceMs = 300) {
  return new Promise((resolve) => {
    let debounceTimer;

    const performValidation = async () => {
      try {
        const result = await validator(value);
        resolve({
          isValid: result.isValid || true,
          message: result.message || '',
          data: result.data || null
        });
      } catch (error) {
        logError('Async validation error:', { error: error.message, value });
        resolve({
          isValid: false,
          message: 'Validation failed. Please try again.',
          data: null
        });
      }
    };

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performValidation, debounceMs);
  });
}

/**
 * Validate multiple fields in parallel
 * @param {Object} fieldValues - Object with field values
 * @param {Object} validationRules - Validation rules object
 * @returns {Promise<Object>} Promise with validation results
 */
export function validateFormAsync(fieldValues, validationRules) {
  const validations = Object.entries(validationRules).map(async ([fieldName, rules]) => {
    const value = fieldValues[fieldName];

    // Check for async validators
    const asyncRules = Object.entries(rules).filter(([ruleName, ruleValue]) =>
      typeof ruleValue === 'function'
    );

    if (asyncRules.length > 0) {
      const asyncResults = await Promise.all(
        asyncRules.map(async ([ruleName, validator]) => {
          try {
            const result = await validator(value);
            return { ruleName, isValid: result.isValid, message: result.message };
          } catch (error) {
            return { ruleName, isValid: false, message: 'Validation error' };
          }
        })
      );

      return {
        fieldName,
        isValid: asyncResults.every(r => r.isValid),
        errors: asyncResults.filter(r => !r.isValid)
      };
    } else {
      // Sync validation
      return {
        fieldName,
        ...validateField(value, rules)
      };
    }
  });

  return Promise.all(validations).then(results => {
    const overallResult = {
      isValid: true,
      errors: {},
      summary: []
    };

    results.forEach(result => {
      if (!result.isValid) {
        overallResult.isValid = false;
        overallResult.errors[result.fieldName] = result.errors || result.asyncErrors;
      }

      if (result.errors) {
        overallResult.summary.push(...result.errors);
      } else if (result.asyncErrors) {
        overallResult.summary.push(...result.asyncErrors);
      }
    });

    return overallResult;
  });
}

/**
 * Custom validation rule registration
 * @param {string} name - Rule name
 * @param {Object} rule - Rule definition
 */
export function registerValidationRule(name, rule) {
  if (VALIDATION_RULES[name]) {
    logWarn(`Validation rule '${name}' already exists and will be overwritten`);
  }

  VALIDATION_RULES[name] = {
    validate: rule.validate || ((value) => true),
    message: rule.message || 'Invalid input',
    hasParameter: rule.hasParameter || false
  };
}

/**
 * Get available validation rules
 * @returns {Array} Array of rule names
 */
export function getAvailableRules() {
  return Object.keys(VALIDATION_RULES);
}

/**
 * Remove validation rule
 * @param {string} name - Rule name to remove
 */
export function removeValidationRule(name) {
  if (VALIDATION_RULES[name]) {
    delete VALIDATION_RULES[name];
    logWarn(`Validation rule '${name}' has been removed`);
  }
}

/**
 * Validation presets for common use cases
 */
export const PRESETS = {
  thaiPerson: {
    firstName: { required: true, thaiText: true, minLength: 1, maxLength: 50 },
    lastName: { required: true, thaiText: true, minLength: 1, maxLength: 50 },
    thaiId: { required: true, thaiID: true },
    phone: { required: true, thaiMobile: true },
    email: { required: false, email: true }
  },

  product: {
    name: { required: true, minLength: 1, maxLength: 100 },
    price: { required: true, price: true, positive: true },
    quantity: { required: true, quantity: true, positive: true },
    category: { required: true, minLength: 1, maxLength: 50 }
  },

  login: {
    username: { required: true, minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$' },
    password: { required: true, minLength: 6, maxLength: 100 },
    remember: { required: false }
  },

  contact: {
    name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, email: true },
    phone: { required: false, phone: true },
    message: { required: true, minLength: 10, maxLength: 1000 }
  }
};

// Export validation rules for external use
export { VALIDATION_RULES };
