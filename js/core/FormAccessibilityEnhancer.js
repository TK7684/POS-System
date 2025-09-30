/**
 * FormAccessibilityEnhancer - Enhanced form accessibility and keyboard navigation
 * Provides advanced form navigation, validation, and accessibility features
 */

class FormAccessibilityEnhancer {
  constructor() {
    this.forms = new Map();
    this.validationMessages = new Map();
    this.autoSaveEnabled = false;
    this.autoSaveDelay = 2000;
    
    this.init();
  }

  init() {
    this.enhanceExistingForms();
    this.setupGlobalFormHandlers();
    this.setupAutoComplete();
    this.setupFormValidation();
    this.setupKeyboardShortcuts();
  }

  enhanceExistingForms() {
    // Enhance purchase form
    this.enhanceForm('purchase', {
      container: '#purchase-screen',
      fields: [
        { id: 'p_date', type: 'date', required: true, label: 'วันที่ซื้อ' },
        { id: 'p_ing', type: 'select', required: true, label: 'วัตถุดิบ', searchable: true },
        { id: 'p_qty', type: 'number', required: true, label: 'จำนวน', min: 0, step: 0.01 },
        { id: 'p_unit', type: 'select', required: true, label: 'หน่วย' },
        { id: 'p_actual_yield', type: 'number', label: 'จำนวนจริงที่ได้', min: 0 },
        { id: 'p_total_price', type: 'number', required: true, label: 'ราคารวม', min: 0, step: 0.01 },
        { id: 'p_price', type: 'number', label: 'ราคาต่อหน่วย', readonly: true },
        { id: 'p_note', type: 'text', label: 'หมายเหตุ' }
      ],
      submitButton: 'button[onclick="onAddPurchase()"]',
      resetButton: 'button[onclick="resetPurchase()"]'
    });

    // Enhance sale form
    this.enhanceForm('sale', {
      container: '#sale-screen',
      fields: [
        { id: 's_date', type: 'date', required: true, label: 'วันที่ขาย' },
        { id: 's_platform', type: 'select', required: true, label: 'แพลตฟอร์ม' },
        { id: 's_menu', type: 'select', required: true, label: 'เมนู', searchable: true },
        { id: 's_qty', type: 'number', required: true, label: 'จำนวนเสิร์ฟ', min: 1, step: 1 },
        { id: 's_price', type: 'number', required: true, label: 'ราคาขาย', min: 0, step: 0.01 }
      ],
      submitButton: 'button[onclick="onAddSale()"]',
      resetButton: 'button[onclick="resetSale()"]'
    });

    // Enhance menu form
    this.enhanceForm('menu', {
      container: '#menu-screen',
      fields: [
        { id: 'm_menu', type: 'select', required: true, label: 'เมนู' },
        { id: 'm_ingredient', type: 'select', required: true, label: 'วัตถุดิบ', searchable: true },
        { id: 'm_qty', type: 'number', required: true, label: 'จำนวนต่อเสิร์ฟ', min: 0, step: 0.01 },
        { id: 'm_unit', type: 'text', label: 'หน่วย', readonly: true }
      ],
      submitButton: 'button[onclick="addMenuIngredient()"]',
      resetButton: 'button[onclick="resetMenuForm()"]'
    });

    // Enhance report form
    this.enhanceForm('report', {
      container: '#reports-screen',
      fields: [
        { id: 'rp_from', type: 'date', required: true, label: 'จากวันที่' },
        { id: 'rp_to', type: 'date', required: true, label: 'ถึงวันที่' }
      ],
      submitButton: 'button[onclick="generateReport()"]',
      resetButton: 'button[onclick="resetReportForm()"]'
    });
  }

  enhanceForm(formName, config) {
    const container = document.querySelector(config.container);
    if (!container) return;

    const formData = {
      name: formName,
      container,
      fields: new Map(),
      config,
      currentFieldIndex: -1,
      isValid: false
    };

    // Enhance each field
    config.fields.forEach((fieldConfig, index) => {
      const field = document.getElementById(fieldConfig.id);
      if (field) {
        this.enhanceField(field, fieldConfig, formData, index);
        formData.fields.set(fieldConfig.id, { element: field, config: fieldConfig, index });
      }
    });

    // Enhance form navigation
    this.setupFormNavigation(formData);
    
    // Enhance form submission
    this.setupFormSubmission(formData);

    this.forms.set(formName, formData);
  }

  enhanceField(field, config, formData, index) {
    // Add enhanced attributes
    field.setAttribute('data-field-index', index);
    field.setAttribute('data-form', formData.name);
    
    if (config.required) {
      field.setAttribute('required', 'true');
      field.setAttribute('aria-required', 'true');
    }

    if (config.min !== undefined) {
      field.setAttribute('min', config.min);
    }

    if (config.max !== undefined) {
      field.setAttribute('max', config.max);
    }

    if (config.step !== undefined) {
      field.setAttribute('step', config.step);
    }

    if (config.readonly) {
      field.setAttribute('readonly', 'true');
      field.setAttribute('tabindex', '-1');
    }

    // Add enhanced label
    this.enhanceFieldLabel(field, config);

    // Add validation
    this.setupFieldValidation(field, config, formData);

    // Add auto-complete for searchable selects
    if (config.searchable && field.tagName === 'SELECT') {
      this.makeSelectSearchable(field, config);
    }

    // Add quick input helpers
    this.addQuickInputHelpers(field, config);

    // Add field-specific keyboard shortcuts
    this.setupFieldKeyboardShortcuts(field, config, formData);
  }

  enhanceFieldLabel(field, config) {
    const existingLabel = document.querySelector(`label[for="${field.id}"]`);
    if (existingLabel) {
      // Add required indicator
      if (config.required && !existingLabel.querySelector('.required-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'required-indicator';
        indicator.textContent = ' *';
        indicator.setAttribute('aria-label', 'จำเป็น');
        existingLabel.appendChild(indicator);
      }

      // Add help text if available
      if (config.help) {
        const helpId = `${field.id}-help`;
        let helpElement = document.getElementById(helpId);
        
        if (!helpElement) {
          helpElement = document.createElement('div');
          helpElement.id = helpId;
          helpElement.className = 'field-help';
          helpElement.textContent = config.help;
          existingLabel.parentNode.appendChild(helpElement);
        }
        
        field.setAttribute('aria-describedby', helpId);
      }
    }
  }

  setupFieldValidation(field, config, formData) {
    const validateField = () => {
      const isValid = this.validateField(field, config);
      this.updateFieldValidationState(field, config, isValid);
      this.updateFormValidationState(formData);
      return isValid;
    };

    // Real-time validation
    field.addEventListener('input', validateField);
    field.addEventListener('blur', validateField);
    field.addEventListener('change', validateField);

    // Custom validation for specific field types
    if (config.type === 'number') {
      field.addEventListener('input', (e) => {
        // Allow only numbers and decimal point
        const value = e.target.value;
        if (value && !/^\d*\.?\d*$/.test(value)) {
          e.target.value = value.slice(0, -1);
        }
      });
    }

    if (config.type === 'date') {
      field.addEventListener('change', (e) => {
        const date = new Date(e.target.value);
        const today = new Date();
        
        if (date > today) {
          this.showFieldWarning(field, 'วันที่ในอนาคต - กรุณาตรวจสอบ');
        }
      });
    }
  }

  validateField(field, config) {
    const value = field.value.trim();
    
    // Required field validation
    if (config.required && !value) {
      this.setFieldError(field, 'กรุณากรอกข้อมูลนี้');
      return false;
    }

    // Type-specific validation
    if (value) {
      switch (config.type) {
        case 'number':
          const num = parseFloat(value);
          if (isNaN(num)) {
            this.setFieldError(field, 'กรุณากรอกตัวเลข');
            return false;
          }
          if (config.min !== undefined && num < config.min) {
            this.setFieldError(field, `ค่าต่ำสุด ${config.min}`);
            return false;
          }
          if (config.max !== undefined && num > config.max) {
            this.setFieldError(field, `ค่าสูงสุด ${config.max}`);
            return false;
          }
          break;

        case 'date':
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            this.setFieldError(field, 'รูปแบบวันที่ไม่ถูกต้อง');
            return false;
          }
          break;

        case 'select':
          if (field.selectedIndex === 0 && field.options[0].value === '') {
            this.setFieldError(field, 'กรุณาเลือกตัวเลือก');
            return false;
          }
          break;
      }
    }

    // Custom validation rules
    if (config.validate && typeof config.validate === 'function') {
      const customResult = config.validate(value, field);
      if (customResult !== true) {
        this.setFieldError(field, customResult);
        return false;
      }
    }

    this.clearFieldError(field);
    return true;
  }

  setFieldError(field, message) {
    field.setAttribute('aria-invalid', 'true');
    
    const errorId = `${field.id}-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'field-error';
      errorElement.setAttribute('role', 'alert');
      field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    field.setAttribute('aria-describedby', 
      (field.getAttribute('aria-describedby') || '') + ' ' + errorId
    );

    // Announce error to screen reader
    if (window.accessibilityManager) {
      window.accessibilityManager.announceToScreenReader(
        `${field.getAttribute('aria-label') || field.name}: ${message}`,
        'assertive'
      );
    }
  }

  clearFieldError(field) {
    field.removeAttribute('aria-invalid');
    
    const errorId = `${field.id}-error`;
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.remove();
    }

    // Clean up aria-describedby
    const describedBy = field.getAttribute('aria-describedby');
    if (describedBy) {
      const cleanDescribedBy = describedBy.replace(errorId, '').trim();
      if (cleanDescribedBy) {
        field.setAttribute('aria-describedby', cleanDescribedBy);
      } else {
        field.removeAttribute('aria-describedby');
      }
    }
  }

  showFieldWarning(field, message) {
    const warningId = `${field.id}-warning`;
    let warningElement = document.getElementById(warningId);
    
    if (!warningElement) {
      warningElement = document.createElement('div');
      warningElement.id = warningId;
      warningElement.className = 'field-warning';
      field.parentNode.appendChild(warningElement);
    }
    
    warningElement.textContent = message;
    
    // Auto-hide warning after 3 seconds
    setTimeout(() => {
      if (warningElement.parentNode) {
        warningElement.remove();
      }
    }, 3000);
  }

  makeSelectSearchable(select, config) {
    // Convert select to searchable combobox
    const wrapper = document.createElement('div');
    wrapper.className = 'searchable-select-wrapper';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = select.className;
    input.id = select.id + '-search';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-label', config.label + ' (พิมพ์เพื่อค้นหา)');
    
    const dropdown = document.createElement('div');
    dropdown.className = 'searchable-dropdown';
    dropdown.setAttribute('role', 'listbox');
    dropdown.style.display = 'none';
    
    // Copy options to dropdown
    Array.from(select.options).forEach((option, index) => {
      if (option.value) {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.setAttribute('role', 'option');
        item.setAttribute('data-value', option.value);
        item.textContent = option.textContent;
        item.addEventListener('click', () => {
          this.selectSearchableOption(select, input, dropdown, option.value, option.textContent);
        });
        dropdown.appendChild(item);
      }
    });

    // Setup search functionality
    input.addEventListener('input', (e) => {
      this.filterSearchableOptions(dropdown, e.target.value);
    });

    input.addEventListener('focus', () => {
      dropdown.style.display = 'block';
      input.setAttribute('aria-expanded', 'true');
    });

    input.addEventListener('blur', (e) => {
      // Delay hiding to allow clicking on options
      setTimeout(() => {
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
      }, 200);
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      this.handleSearchableKeydown(e, dropdown, select, input);
    });

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);
    select.parentNode.insertBefore(wrapper, select);
    select.style.display = 'none';
  }

  filterSearchableOptions(dropdown, query) {
    const items = dropdown.querySelectorAll('.dropdown-item');
    const lowerQuery = query.toLowerCase();
    
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      const matches = text.includes(lowerQuery);
      item.style.display = matches ? 'block' : 'none';
      
      if (matches) {
        // Highlight matching text
        const regex = new RegExp(`(${query})`, 'gi');
        item.innerHTML = item.textContent.replace(regex, '<mark>$1</mark>');
      }
    });
  }

  selectSearchableOption(select, input, dropdown, value, text) {
    select.value = value;
    input.value = text;
    dropdown.style.display = 'none';
    input.setAttribute('aria-expanded', 'false');
    
    // Trigger change event
    select.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Announce selection
    if (window.accessibilityManager) {
      window.accessibilityManager.announceToScreenReader(`เลือก ${text}`);
    }
  }

  handleSearchableKeydown(e, dropdown, select, input) {
    const items = Array.from(dropdown.querySelectorAll('.dropdown-item:not([style*="display: none"])'));
    const currentIndex = items.findIndex(item => item.classList.contains('highlighted'));
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        this.highlightSearchableOption(items, nextIndex);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        this.highlightSearchableOption(items, prevIndex);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0) {
          const selectedItem = items[currentIndex];
          this.selectSearchableOption(
            select, 
            input, 
            dropdown, 
            selectedItem.dataset.value, 
            selectedItem.textContent
          );
        }
        break;
        
      case 'Escape':
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        break;
    }
  }

  highlightSearchableOption(items, index) {
    items.forEach((item, i) => {
      item.classList.toggle('highlighted', i === index);
    });
    
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }

  addQuickInputHelpers(field, config) {
    if (config.type === 'date') {
      this.addDateQuickButtons(field);
    }
    
    if (config.type === 'number' && config.id.includes('qty')) {
      this.addQuantityQuickButtons(field);
    }
  }

  addDateQuickButtons(field) {
    const container = field.parentNode;
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'quick-date-btns';
    
    const buttons = [
      { label: 'วันนี้', value: () => new Date().toISOString().split('T')[0] },
      { label: 'เมื่อวาน', value: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      }},
      { label: 'สัปดาห์ที่แล้ว', value: () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo.toISOString().split('T')[0];
      }}
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn quick-date-btn';
      button.textContent = btn.label;
      button.addEventListener('click', () => {
        field.value = btn.value();
        field.dispatchEvent(new Event('change', { bubbles: true }));
      });
      buttonsContainer.appendChild(button);
    });

    container.appendChild(buttonsContainer);
  }

  addQuantityQuickButtons(field) {
    const container = field.parentNode;
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'quick-qty-btns';
    
    const quantities = [0.5, 1, 2, 5, 10];
    
    quantities.forEach(qty => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn quick-qty-btn';
      button.textContent = qty.toString();
      button.addEventListener('click', () => {
        field.value = qty;
        field.dispatchEvent(new Event('input', { bubbles: true }));
      });
      buttonsContainer.appendChild(button);
    });

    container.appendChild(buttonsContainer);
  }

  setupFormNavigation(formData) {
    const fields = Array.from(formData.fields.values())
      .sort((a, b) => a.index - b.index)
      .map(f => f.element)
      .filter(f => !f.hasAttribute('readonly') && f.tabIndex !== -1);

    fields.forEach((field, index) => {
      field.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'Enter':
            if (field.tagName !== 'TEXTAREA') {
              e.preventDefault();
              if (e.ctrlKey) {
                // Ctrl+Enter: Submit form
                this.submitForm(formData);
              } else {
                // Enter: Next field
                this.focusNextField(fields, index);
              }
            }
            break;
            
          case 'ArrowDown':
            if (field.tagName !== 'SELECT' && field.tagName !== 'TEXTAREA') {
              e.preventDefault();
              this.focusNextField(fields, index);
            }
            break;
            
          case 'ArrowUp':
            if (field.tagName !== 'SELECT' && field.tagName !== 'TEXTAREA') {
              e.preventDefault();
              this.focusPreviousField(fields, index);
            }
            break;
        }
      });
    });
  }

  focusNextField(fields, currentIndex) {
    const nextIndex = (currentIndex + 1) % fields.length;
    fields[nextIndex].focus();
    
    if (window.accessibilityManager) {
      const label = fields[nextIndex].getAttribute('aria-label') || 
                   fields[nextIndex].name || 
                   'ฟิลด์ถัดไป';
      window.accessibilityManager.announceToScreenReader(`ไปยัง ${label}`);
    }
  }

  focusPreviousField(fields, currentIndex) {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : fields.length - 1;
    fields[prevIndex].focus();
    
    if (window.accessibilityManager) {
      const label = fields[prevIndex].getAttribute('aria-label') || 
                   fields[prevIndex].name || 
                   'ฟิลด์ก่อนหน้า';
      window.accessibilityManager.announceToScreenReader(`ไปยัง ${label}`);
    }
  }

  setupFormSubmission(formData) {
    const submitButton = formData.container.querySelector(formData.config.submitButton);
    if (submitButton) {
      submitButton.addEventListener('click', (e) => {
        if (!this.validateForm(formData)) {
          e.preventDefault();
          e.stopPropagation();
          this.focusFirstInvalidField(formData);
        }
      });
    }
  }

  validateForm(formData) {
    let isValid = true;
    const invalidFields = [];

    formData.fields.forEach((fieldData) => {
      const fieldValid = this.validateField(fieldData.element, fieldData.config);
      if (!fieldValid) {
        isValid = false;
        invalidFields.push(fieldData);
      }
    });

    if (!isValid && window.accessibilityManager) {
      const fieldNames = invalidFields.map(f => f.config.label).join(', ');
      window.accessibilityManager.announceToScreenReader(
        `พบข้อผิดพลาด ${invalidFields.length} ฟิลด์: ${fieldNames}`,
        'assertive'
      );
    }

    return isValid;
  }

  focusFirstInvalidField(formData) {
    const invalidField = Array.from(formData.fields.values())
      .sort((a, b) => a.index - b.index)
      .find(f => f.element.getAttribute('aria-invalid') === 'true');

    if (invalidField) {
      invalidField.element.focus();
      invalidField.element.select();
    }
  }

  submitForm(formData) {
    if (this.validateForm(formData)) {
      const submitButton = formData.container.querySelector(formData.config.submitButton);
      if (submitButton) {
        submitButton.click();
      }
    }
  }

  setupGlobalFormHandlers() {
    // Global form keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, select, textarea')) {
        const formName = e.target.getAttribute('data-form');
        const formData = this.forms.get(formName);
        
        if (formData) {
          switch (true) {
            case e.ctrlKey && e.key === 'Enter':
              e.preventDefault();
              this.submitForm(formData);
              break;
              
            case e.ctrlKey && e.key === 'r':
              e.preventDefault();
              this.resetForm(formData);
              break;
              
            case e.key === 'F2':
              e.preventDefault();
              this.showFormHelp(formData);
              break;
          }
        }
      }
    });
  }

  resetForm(formData) {
    const resetButton = formData.container.querySelector(formData.config.resetButton);
    if (resetButton) {
      resetButton.click();
    }
    
    // Clear all validation states
    formData.fields.forEach((fieldData) => {
      this.clearFieldError(fieldData.element);
    });

    if (window.accessibilityManager) {
      window.accessibilityManager.announceToScreenReader('ล้างฟอร์มแล้ว');
    }
  }

  showFormHelp(formData) {
    const helpText = `
      ฟอร์ม ${formData.name}:
      - Enter: ไปฟิลด์ถัดไป
      - Ctrl+Enter: บันทึกฟอร์ม
      - Ctrl+R: ล้างฟอร์ม
      - ↑↓: นำทางระหว่างฟิลด์
      - F2: แสดงความช่วยเหลือนี้
    `;

    if (window.accessibilityManager) {
      window.accessibilityManager.announceToScreenReader(helpText);
    }
  }

  setupAutoComplete() {
    // Setup intelligent auto-complete based on usage patterns
    this.setupIngredientAutoComplete();
    this.setupMenuAutoComplete();
    this.setupPlatformAutoComplete();
  }

  setupIngredientAutoComplete() {
    const ingredientSelects = document.querySelectorAll('#p_ing, #m_ingredient');
    ingredientSelects.forEach(select => {
      // This would integrate with the existing data to show recent/frequent ingredients
      select.addEventListener('focus', () => {
        // Move recent items to top
        this.prioritizeRecentOptions(select, 'ingredients');
      });
    });
  }

  setupMenuAutoComplete() {
    const menuSelects = document.querySelectorAll('#s_menu, #m_menu');
    menuSelects.forEach(select => {
      select.addEventListener('focus', () => {
        this.prioritizeRecentOptions(select, 'menus');
      });
    });
  }

  setupPlatformAutoComplete() {
    const platformSelect = document.getElementById('s_platform');
    if (platformSelect) {
      platformSelect.addEventListener('focus', () => {
        // Auto-suggest platform based on time of day
        const hour = new Date().getHours();
        let suggestedPlatform = 'walkin';
        
        if (hour >= 11 && hour <= 14) {
          suggestedPlatform = 'grab';
        } else if (hour >= 17 && hour <= 21) {
          suggestedPlatform = 'lineman';
        }
        
        // Highlight suggested option
        const option = platformSelect.querySelector(`option[value="${suggestedPlatform}"]`);
        if (option && !platformSelect.value) {
          option.style.backgroundColor = 'rgba(15, 118, 110, 0.1)';
          option.style.fontWeight = 'bold';
        }
      });
    }
  }

  prioritizeRecentOptions(select, type) {
    try {
      const recentItems = JSON.parse(localStorage.getItem(`recent_${type}`) || '[]');
      const options = Array.from(select.options);
      
      // Sort options: recent items first, then alphabetical
      options.sort((a, b) => {
        const aRecent = recentItems.indexOf(a.value);
        const bRecent = recentItems.indexOf(b.value);
        
        if (aRecent !== -1 && bRecent !== -1) {
          return aRecent - bRecent; // More recent first
        } else if (aRecent !== -1) {
          return -1; // a is recent, b is not
        } else if (bRecent !== -1) {
          return 1; // b is recent, a is not
        } else {
          return a.textContent.localeCompare(b.textContent, 'th');
        }
      });
      
      // Rebuild select with sorted options
      const selectedValue = select.value;
      select.innerHTML = '';
      options.forEach(option => select.appendChild(option));
      select.value = selectedValue;
      
    } catch (error) {
      console.error('Failed to prioritize recent options:', error);
    }
  }

  setupFormValidation() {
    // Add custom validation rules
    this.addValidationRule('purchase', 'p_qty', (value) => {
      const num = parseFloat(value);
      if (num <= 0) return 'จำนวนต้องมากกว่า 0';
      if (num > 1000) return 'จำนวนสูงเกินไป กรุณาตรวจสอบ';
      return true;
    });

    this.addValidationRule('purchase', 'p_total_price', (value) => {
      const num = parseFloat(value);
      if (num <= 0) return 'ราคาต้องมากกว่า 0';
      if (num > 100000) return 'ราคาสูงเกินไป กรุณาตรวจสอบ';
      return true;
    });

    this.addValidationRule('sale', 's_qty', (value) => {
      const num = parseInt(value);
      if (num <= 0) return 'จำนวนเสิร์ฟต้องมากกว่า 0';
      if (num > 100) return 'จำนวนเสิร์ฟสูงเกินไป กรุณาตรวจสอบ';
      return true;
    });

    this.addValidationRule('report', 'rp_to', (value, field) => {
      const fromField = document.getElementById('rp_from');
      if (fromField && fromField.value) {
        const fromDate = new Date(fromField.value);
        const toDate = new Date(value);
        
        if (toDate < fromDate) {
          return 'วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น';
        }
        
        const daysDiff = (toDate - fromDate) / (1000 * 60 * 60 * 24);
        if (daysDiff > 365) {
          return 'ช่วงวันที่ไม่ควรเกิน 1 ปี';
        }
      }
      return true;
    });
  }

  addValidationRule(formName, fieldId, validator) {
    const formData = this.forms.get(formName);
    if (formData && formData.fields.has(fieldId)) {
      const fieldData = formData.fields.get(fieldId);
      fieldData.config.validate = validator;
    }
  }

  setupKeyboardShortcuts() {
    // Form-specific keyboard shortcuts are already handled in setupGlobalFormHandlers
    // This method can be extended for additional shortcuts
  }

  updateFormValidationState(formData) {
    const allValid = Array.from(formData.fields.values())
      .every(fieldData => !fieldData.element.hasAttribute('aria-invalid'));
    
    formData.isValid = allValid;
    
    // Update submit button state
    const submitButton = formData.container.querySelector(formData.config.submitButton);
    if (submitButton) {
      submitButton.disabled = !allValid;
      submitButton.setAttribute('aria-disabled', (!allValid).toString());
    }
  }

  // Public API
  getFormData(formName) {
    return this.forms.get(formName);
  }

  validateFormByName(formName) {
    const formData = this.forms.get(formName);
    return formData ? this.validateForm(formData) : false;
  }

  resetFormByName(formName) {
    const formData = this.forms.get(formName);
    if (formData) {
      this.resetForm(formData);
    }
  }

  // Cleanup
  destroy() {
    this.forms.clear();
    this.validationMessages.clear();
    
    // Remove enhanced elements
    document.querySelectorAll('.searchable-select-wrapper').forEach(wrapper => {
      const originalSelect = wrapper.nextElementSibling;
      if (originalSelect && originalSelect.tagName === 'SELECT') {
        originalSelect.style.display = '';
        wrapper.remove();
      }
    });
    
    document.querySelectorAll('.quick-date-btns, .quick-qty-btns').forEach(el => el.remove());
    document.querySelectorAll('.field-error, .field-warning, .field-help').forEach(el => el.remove());
  }
}

export default FormAccessibilityEnhancer;