/**
 * Data Validation and Integrity System for POS Application
 * Provides comprehensive data validation and conflict resolution
 * Ensures data integrity across offline/online synchronization
 * 
 * Requirements: 8.4 - Data conflicts handling and sync resolution
 */

class DataValidator {
  constructor() {
    this.errorHandler = window.ErrorHandler;
    this.validationSchemas = new Map();
    this.integrityChecks = new Map();
    this.conflictResolvers = new Map();
    
    // Initialize default schemas
    this.initializeDefaultSchemas();
  }

  /**
   * Data validation schemas for different entity types
   */
  initializeDefaultSchemas() {
    // Ingredient validation schema
    this.validationSchemas.set('ingredient', {
      id: { type: 'string', required: true, minLength: 1 },
      name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
      stockUnit: { type: 'string', required: true, minLength: 1 },
      buyUnit: { type: 'string', required: true, minLength: 1 },
      ratio: { type: 'number', required: true, min: 0.001 },
      minStock: { type: 'number', required: false, min: 0 },
      currentStock: { type: 'number', required: false, min: 0 },
      lastUpdated: { type: 'timestamp', required: true }
    });

    // Menu item validation schema
    this.validationSchemas.set('menu', {
      id: { type: 'string', required: true, minLength: 1 },
      name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
      category: { type: 'string', required: false, maxLength: 50 },
      price: { type: 'number', required: true, min: 0 },
      cost: { type: 'number', required: false, min: 0 },
      ingredients: { type: 'array', required: true, minItems: 1 },
      isActive: { type: 'boolean', required: true },
      lastUpdated: { type: 'timestamp', required: true }
    });

    // Transaction validation schema
    this.validationSchemas.set('transaction', {
      id: { type: 'string', required: true, minLength: 1 },
      type: { type: 'enum', required: true, values: ['sale', 'purchase'] },
      timestamp: { type: 'timestamp', required: true },
      items: { type: 'array', required: true, minItems: 1 },
      total: { type: 'number', required: true, min: 0 },
      platform: { type: 'string', required: false },
      notes: { type: 'string', required: false, maxLength: 500 },
      synced: { type: 'boolean', required: true },
      lastUpdated: { type: 'timestamp', required: true }
    });

    // Purchase item validation schema
    this.validationSchemas.set('purchaseItem', {
      ingredientId: { type: 'string', required: true, minLength: 1 },
      quantity: { type: 'number', required: true, min: 0.001 },
      unitPrice: { type: 'number', required: true, min: 0 },
      totalPrice: { type: 'number', required: true, min: 0 }
    });

    // Sale item validation schema
    this.validationSchemas.set('saleItem', {
      menuId: { type: 'string', required: true, minLength: 1 },
      quantity: { type: 'number', required: true, min: 1 },
      unitPrice: { type: 'number', required: true, min: 0 },
      totalPrice: { type: 'number', required: true, min: 0 }
    });
  }

  /**
   * Validate data against schema
   */
  validateData(entityType, data) {
    const schema = this.validationSchemas.get(entityType);
    if (!schema) {
      return {
        valid: false,
        errors: [`Unknown entity type: ${entityType}`]
      };
    }

    const errors = [];
    const warnings = [];

    // Validate each field in the schema
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const fieldValue = data[fieldName];
      const fieldResult = this.validateField(fieldName, fieldValue, fieldSchema);
      
      if (!fieldResult.valid) {
        errors.push(...fieldResult.errors);
      }
      if (fieldResult.warnings) {
        warnings.push(...fieldResult.warnings);
      }
    }

    // Check for unexpected fields
    for (const fieldName of Object.keys(data)) {
      if (!schema[fieldName]) {
        warnings.push(`Unexpected field: ${fieldName}`);
      }
    }

    // Run entity-specific integrity checks
    const integrityResult = this.runIntegrityChecks(entityType, data);
    if (!integrityResult.valid) {
      errors.push(...integrityResult.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      entityType,
      data
    };
  }

  /**
   * Validate individual field
   */
  validateField(fieldName, value, schema) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (schema.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${fieldName}' is required`);
      return { valid: false, errors, warnings };
    }

    // Skip validation for optional empty fields
    if (!schema.required && (value === undefined || value === null || value === '')) {
      return { valid: true, errors, warnings };
    }

    // Type validation
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field '${fieldName}' must be a string`);
        } else {
          if (schema.minLength && value.length < schema.minLength) {
            errors.push(`Field '${fieldName}' must be at least ${schema.minLength} characters`);
          }
          if (schema.maxLength && value.length > schema.maxLength) {
            errors.push(`Field '${fieldName}' must not exceed ${schema.maxLength} characters`);
          }
        }
        break;

      case 'number':
        const num = parseFloat(value);
        if (isNaN(num) || !isFinite(num)) {
          errors.push(`Field '${fieldName}' must be a valid number`);
        } else {
          if (schema.min !== undefined && num < schema.min) {
            errors.push(`Field '${fieldName}' must be at least ${schema.min}`);
          }
          if (schema.max !== undefined && num > schema.max) {
            errors.push(`Field '${fieldName}' must not exceed ${schema.max}`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Field '${fieldName}' must be a boolean`);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Field '${fieldName}' must be an array`);
        } else {
          if (schema.minItems && value.length < schema.minItems) {
            errors.push(`Field '${fieldName}' must have at least ${schema.minItems} items`);
          }
          if (schema.maxItems && value.length > schema.maxItems) {
            errors.push(`Field '${fieldName}' must not have more than ${schema.maxItems} items`);
          }
        }
        break;

      case 'enum':
        if (!schema.values.includes(value)) {
          errors.push(`Field '${fieldName}' must be one of: ${schema.values.join(', ')}`);
        }
        break;

      case 'timestamp':
        const timestamp = parseInt(value);
        if (isNaN(timestamp) || timestamp <= 0) {
          errors.push(`Field '${fieldName}' must be a valid timestamp`);
        } else {
          // Check if timestamp is reasonable (not too far in past/future)
          const now = Date.now();
          const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
          const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000);
          
          if (timestamp < oneYearAgo) {
            warnings.push(`Field '${fieldName}' timestamp seems too old`);
          } else if (timestamp > oneYearFromNow) {
            warnings.push(`Field '${fieldName}' timestamp seems too far in future`);
          }
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Run entity-specific integrity checks
   */
  runIntegrityChecks(entityType, data) {
    const errors = [];

    switch (entityType) {
      case 'ingredient':
        // Check ratio consistency
        if (data.ratio && data.ratio <= 0) {
          errors.push('Ingredient ratio must be positive');
        }
        break;

      case 'menu':
        // Check ingredients array structure
        if (data.ingredients && Array.isArray(data.ingredients)) {
          data.ingredients.forEach((ingredient, index) => {
            if (!ingredient.ingredientId || !ingredient.quantity) {
              errors.push(`Menu ingredient at index ${index} is missing required fields`);
            }
            if (ingredient.quantity <= 0) {
              errors.push(`Menu ingredient at index ${index} must have positive quantity`);
            }
          });
        }
        
        // Check price vs cost relationship
        if (data.price && data.cost && data.price < data.cost) {
          errors.push('Menu item price should not be less than cost');
        }
        break;

      case 'transaction':
        // Check transaction items
        if (data.items && Array.isArray(data.items)) {
          let calculatedTotal = 0;
          
          data.items.forEach((item, index) => {
            const itemSchema = data.type === 'sale' ? 'saleItem' : 'purchaseItem';
            const itemValidation = this.validateData(itemSchema, item);
            
            if (!itemValidation.valid) {
              errors.push(`Transaction item at index ${index}: ${itemValidation.errors.join(', ')}`);
            }
            
            calculatedTotal += item.totalPrice || 0;
          });
          
          // Check total calculation
          if (Math.abs(calculatedTotal - data.total) > 0.01) {
            errors.push(`Transaction total (${data.total}) does not match sum of items (${calculatedTotal})`);
          }
        }
        
        // Check timestamp reasonableness
        if (data.timestamp > Date.now() + 60000) { // Allow 1 minute future tolerance
          errors.push('Transaction timestamp cannot be in the future');
        }
        break;

      case 'purchaseItem':
        // Check price calculation
        if (data.quantity && data.unitPrice && data.totalPrice) {
          const expectedTotal = data.quantity * data.unitPrice;
          if (Math.abs(expectedTotal - data.totalPrice) > 0.01) {
            errors.push(`Purchase item total price (${data.totalPrice}) does not match quantity × unit price (${expectedTotal})`);
          }
        }
        break;

      case 'saleItem':
        // Check price calculation
        if (data.quantity && data.unitPrice && data.totalPrice) {
          const expectedTotal = data.quantity * data.unitPrice;
          if (Math.abs(expectedTotal - data.totalPrice) > 0.01) {
            errors.push(`Sale item total price (${data.totalPrice}) does not match quantity × unit price (${expectedTotal})`);
          }
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect data conflicts between local and remote versions
   */
  detectConflicts(localData, remoteData, entityType) {
    const conflicts = [];
    const schema = this.validationSchemas.get(entityType);
    
    if (!schema) {
      return { hasConflicts: false, conflicts: [] };
    }

    // Compare timestamps first
    const localTimestamp = localData.lastUpdated || 0;
    const remoteTimestamp = remoteData.lastUpdated || 0;
    
    if (localTimestamp === remoteTimestamp) {
      return { hasConflicts: false, conflicts: [] };
    }

    // Check each field for conflicts
    for (const fieldName of Object.keys(schema)) {
      const localValue = localData[fieldName];
      const remoteValue = remoteData[fieldName];
      
      if (!this.valuesEqual(localValue, remoteValue)) {
        conflicts.push({
          field: fieldName,
          localValue,
          remoteValue,
          localTimestamp,
          remoteTimestamp
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      entityType,
      localData,
      remoteData
    };
  }

  /**
   * Compare two values for equality (handles arrays and objects)
   */
  valuesEqual(value1, value2) {
    if (value1 === value2) return true;
    
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) return false;
      return value1.every((item, index) => this.valuesEqual(item, value2[index]));
    }
    
    if (typeof value1 === 'object' && typeof value2 === 'object' && 
        value1 !== null && value2 !== null) {
      const keys1 = Object.keys(value1);
      const keys2 = Object.keys(value2);
      
      if (keys1.length !== keys2.length) return false;
      return keys1.every(key => this.valuesEqual(value1[key], value2[key]));
    }
    
    return false;
  }

  /**
   * Resolve conflicts automatically where possible
   */
  resolveConflicts(conflictData) {
    const { conflicts, entityType, localData, remoteData } = conflictData;
    const resolution = {
      strategy: 'manual', // Default to manual resolution
      resolvedData: null,
      autoResolved: [],
      manualRequired: []
    };

    // Try automatic resolution strategies
    for (const conflict of conflicts) {
      const autoResolution = this.attemptAutoResolution(conflict, entityType);
      
      if (autoResolution.resolved) {
        resolution.autoResolved.push({
          field: conflict.field,
          strategy: autoResolution.strategy,
          value: autoResolution.value
        });
      } else {
        resolution.manualRequired.push(conflict);
      }
    }

    // If all conflicts were auto-resolved, create resolved data
    if (resolution.manualRequired.length === 0) {
      resolution.strategy = 'automatic';
      resolution.resolvedData = { ...localData };
      
      // Apply auto-resolved values
      resolution.autoResolved.forEach(resolved => {
        resolution.resolvedData[resolved.field] = resolved.value;
      });
      
      // Update timestamp to latest
      resolution.resolvedData.lastUpdated = Math.max(
        localData.lastUpdated || 0,
        remoteData.lastUpdated || 0
      );
    }

    return resolution;
  }

  /**
   * Attempt automatic conflict resolution
   */
  attemptAutoResolution(conflict, entityType) {
    const { field, localValue, remoteValue, localTimestamp, remoteTimestamp } = conflict;

    // Strategy 1: Use most recent timestamp
    if (localTimestamp !== remoteTimestamp) {
      return {
        resolved: true,
        strategy: 'most-recent',
        value: localTimestamp > remoteTimestamp ? localValue : remoteValue
      };
    }

    // Strategy 2: Numeric values - use higher value for stock quantities
    if (typeof localValue === 'number' && typeof remoteValue === 'number') {
      if (field === 'currentStock' || field === 'quantity') {
        return {
          resolved: true,
          strategy: 'higher-value',
          value: Math.max(localValue, remoteValue)
        };
      }
    }

    // Strategy 3: Boolean values - prefer true for isActive fields
    if (typeof localValue === 'boolean' && typeof remoteValue === 'boolean') {
      if (field === 'isActive') {
        return {
          resolved: true,
          strategy: 'prefer-active',
          value: localValue || remoteValue
        };
      }
    }

    // Strategy 4: String values - use non-empty value
    if (typeof localValue === 'string' && typeof remoteValue === 'string') {
      if (localValue.trim() === '' && remoteValue.trim() !== '') {
        return {
          resolved: true,
          strategy: 'non-empty',
          value: remoteValue
        };
      } else if (remoteValue.trim() === '' && localValue.trim() !== '') {
        return {
          resolved: true,
          strategy: 'non-empty',
          value: localValue
        };
      }
    }

    // No automatic resolution possible
    return { resolved: false };
  }

  /**
   * Create conflict resolution UI
   */
  showConflictResolutionUI(conflictData) {
    const { conflicts, entityType, localData, remoteData } = conflictData;
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'conflict-resolution-modal';
    modal.innerHTML = `
      <div class="conflict-resolution-content">
        <div class="conflict-header">
          <h3>พบข้อมูลที่ขัดแย้ง</h3>
          <p>กรุณาเลือกเวอร์ชันที่ต้องการสำหรับแต่ละฟิลด์</p>
        </div>
        <div class="conflict-fields">
          ${conflicts.map(conflict => this.createConflictFieldHTML(conflict)).join('')}
        </div>
        <div class="conflict-actions">
          <button class="btn-resolve-auto" onclick="this.resolveAutomatic()">แก้ไขอัตโนมัติ</button>
          <button class="btn-resolve-local" onclick="this.resolveAll('local')">ใช้ข้อมูลในเครื่อง</button>
          <button class="btn-resolve-remote" onclick="this.resolveAll('remote')">ใช้ข้อมูลจากเซิร์ฟเวอร์</button>
          <button class="btn-resolve-manual" onclick="this.resolveManual()">แก้ไขด้วยตนเอง</button>
        </div>
      </div>
    `;

    // Add event handlers
    modal.resolveAutomatic = () => {
      const resolution = this.resolveConflicts(conflictData);
      if (resolution.strategy === 'automatic') {
        this.applyResolution(resolution.resolvedData);
        modal.remove();
      } else {
        alert('ไม่สามารถแก้ไขอัตโนมัติได้ กรุณาเลือกด้วยตนเอง');
      }
    };

    modal.resolveAll = (preference) => {
      const resolvedData = preference === 'local' ? localData : remoteData;
      resolvedData.lastUpdated = Date.now();
      this.applyResolution(resolvedData);
      modal.remove();
    };

    modal.resolveManual = () => {
      const resolvedData = { ...localData };
      const selections = modal.querySelectorAll('.conflict-field-selection');
      
      selections.forEach(selection => {
        const fieldName = selection.dataset.field;
        const selectedValue = selection.querySelector('input[type="radio"]:checked')?.value;
        
        if (selectedValue === 'local') {
          resolvedData[fieldName] = localData[fieldName];
        } else if (selectedValue === 'remote') {
          resolvedData[fieldName] = remoteData[fieldName];
        }
      });
      
      resolvedData.lastUpdated = Date.now();
      this.applyResolution(resolvedData);
      modal.remove();
    };

    document.body.appendChild(modal);
    return modal;
  }

  /**
   * Create HTML for individual conflict field
   */
  createConflictFieldHTML(conflict) {
    const { field, localValue, remoteValue } = conflict;
    
    return `
      <div class="conflict-field" data-field="${field}">
        <div class="conflict-field-name">${field}</div>
        <div class="conflict-field-selection" data-field="${field}">
          <div class="conflict-option">
            <input type="radio" name="conflict-${field}" value="local" id="local-${field}">
            <label for="local-${field}">
              <strong>ในเครื่อง:</strong> ${this.formatValue(localValue)}
            </label>
          </div>
          <div class="conflict-option">
            <input type="radio" name="conflict-${field}" value="remote" id="remote-${field}">
            <label for="remote-${field}">
              <strong>เซิร์ฟเวอร์:</strong> ${this.formatValue(remoteValue)}
            </label>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format value for display in conflict resolution UI
   */
  formatValue(value) {
    if (value === null || value === undefined) {
      return '<em>ไม่มีข้อมูล</em>';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    if (typeof value === 'boolean') {
      return value ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    }
    
    return String(value);
  }

  /**
   * Apply conflict resolution
   */
  applyResolution(resolvedData) {
    // This would typically save the resolved data
    // Implementation depends on the data storage system
    console.log('Applying conflict resolution:', resolvedData);
    
    // Trigger custom event for other components to handle
    const event = new CustomEvent('conflictResolved', {
      detail: { resolvedData }
    });
    window.dispatchEvent(event);
  }

  /**
   * Repair data integrity issues
   */
  repairDataIntegrity(entityType, data) {
    const repairs = [];
    
    switch (entityType) {
      case 'transaction':
        // Recalculate transaction total
        if (data.items && Array.isArray(data.items)) {
          const calculatedTotal = data.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
          if (Math.abs(calculatedTotal - data.total) > 0.01) {
            data.total = calculatedTotal;
            repairs.push(`Corrected transaction total from ${data.total} to ${calculatedTotal}`);
          }
        }
        break;
        
      case 'menu':
        // Recalculate menu cost from ingredients
        if (data.ingredients && Array.isArray(data.ingredients)) {
          // This would require ingredient cost lookup
          // Implementation depends on ingredient data access
        }
        break;
    }
    
    return {
      repaired: repairs.length > 0,
      repairs,
      data
    };
  }

  /**
   * Batch validate multiple entities
   */
  batchValidate(entities) {
    const results = {
      valid: 0,
      invalid: 0,
      errors: [],
      warnings: []
    };
    
    entities.forEach((entity, index) => {
      const validation = this.validateData(entity.type, entity.data);
      
      if (validation.valid) {
        results.valid++;
      } else {
        results.invalid++;
        results.errors.push({
          index,
          entityType: entity.type,
          errors: validation.errors
        });
      }
      
      if (validation.warnings.length > 0) {
        results.warnings.push({
          index,
          entityType: entity.type,
          warnings: validation.warnings
        });
      }
    });
    
    return results;
  }
}

// Create global data validator instance
window.DataValidator = new DataValidator();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataValidator;
}