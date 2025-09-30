/**
 * Error Handling Integration Example for POS Application
 * Demonstrates how to integrate ErrorHandler, ValidationUtils, DataValidator, and SyncConflictResolver
 * Provides usage examples and initialization code
 * 
 * Requirements: 1.6, 8.4 - Comprehensive error handling and conflict resolution
 */

class ErrorHandlingIntegration {
  constructor() {
    this.errorHandler = window.ErrorHandler;
    this.validationUtils = window.ValidationUtils;
    this.dataValidator = window.DataValidator;
    this.syncConflictResolver = window.SyncConflictResolver;
    
    this.initialize();
  }

  /**
   * Initialize error handling integration
   */
  initialize() {
    // Set up form validation examples
    this.setupFormValidation();
    
    // Set up data validation examples
    this.setupDataValidation();
    
    // Set up sync conflict handling
    this.setupSyncConflictHandling();
    
    // Set up offline/online handling
    this.setupOfflineHandling();
    
    console.log('Error handling system initialized successfully');
  }

  /**
   * Setup form validation examples
   */
  setupFormValidation() {
    // Example: Purchase form validation
    this.validationUtils.registerField('ingredient-name', [
      ValidationUtils.required(),
      ValidationUtils.minLength(2),
      ValidationUtils.maxLength(100)
    ]);

    this.validationUtils.registerField('purchase-quantity', [
      ValidationUtils.required(),
      ValidationUtils.positiveNumber()
    ]);

    this.validationUtils.registerField('purchase-price', [
      ValidationUtils.required(),
      ValidationUtils.price()
    ]);

    // Example: Menu form validation
    this.validationUtils.registerField('menu-name', [
      ValidationUtils.required(),
      ValidationUtils.minLength(2),
      ValidationUtils.maxLength(200)
    ]);

    this.validationUtils.registerField('menu-price', [
      ValidationUtils.required(),
      ValidationUtils.price()
    ]);

    // Custom validation example
    this.validationUtils.registerField('ingredient-ratio', [
      ValidationUtils.required(),
      ValidationUtils.custom((value, field) => {
        const ratio = parseFloat(value);
        if (isNaN(ratio) || ratio <= 0 || ratio > 1000) {
          return {
            valid: false,
            message: 'อัตราส่วนต้องอยู่ระหว่าง 0.001 ถึง 1000'
          };
        }
        return { valid: true };
      })
    ]);
  }

  /**
   * Setup data validation examples
   */
  setupDataValidation() {
    // Example: Validate ingredient data before saving
    window.addEventListener('beforeSaveIngredient', (event) => {
      const ingredientData = event.detail;
      const validation = this.dataValidator.validateData('ingredient', ingredientData);
      
      if (!validation.valid) {
        this.errorHandler.handleError('validation-failed', new Error('Ingredient validation failed'), {
          errors: validation.errors,
          data: ingredientData
        });
        event.preventDefault();
        return;
      }
      
      // Auto-repair if needed
      const repairResult = this.dataValidator.repairDataIntegrity('ingredient', ingredientData);
      if (repairResult.repaired) {
        console.log('Data integrity repairs applied:', repairResult.repairs);
        event.detail = repairResult.data;
      }
    });

    // Example: Validate transaction data
    window.addEventListener('beforeSaveTransaction', (event) => {
      const transactionData = event.detail;
      const validation = this.dataValidator.validateData('transaction', transactionData);
      
      if (!validation.valid) {
        this.errorHandler.handleError('transaction-validation-failed', new Error('Transaction validation failed'), {
          errors: validation.errors,
          data: transactionData
        });
        event.preventDefault();
        return;
      }
    });
  }

  /**
   * Setup sync conflict handling
   */
  setupSyncConflictHandling() {
    // Listen for conflict resolution events
    window.addEventListener('conflictResolved', (event) => {
      const { entityId, resolvedData, strategy } = event.detail;
      console.log(`Conflict resolved for ${entityId} using ${strategy}:`, resolvedData);
      
      // Save resolved data
      this.saveResolvedData(entityId, resolvedData);
    });

    // Example: Simulate sync conflict
    window.addEventListener('simulateSyncConflict', (event) => {
      const { entityType, entityId } = event.detail;
      
      // Create mock local and remote data
      const localData = this.createMockData(entityType, entityId, 'local');
      const remoteData = this.createMockData(entityType, entityId, 'remote');
      
      // Trigger sync conflict
      const conflictEvent = new CustomEvent('syncConflict', {
        detail: {
          entityType,
          entityId,
          localData,
          remoteData
        }
      });
      window.dispatchEvent(conflictEvent);
    });
  }

  /**
   * Setup offline/online handling
   */
  setupOfflineHandling() {
    // Handle network errors with automatic retry
    window.addEventListener('networkError', async (event) => {
      const { operation, data, retryFunction } = event.detail;
      
      const result = this.errorHandler.handleError('network-error', new Error('Network operation failed'), {
        operationId: operation,
        retryFunction: retryFunction
      });
      
      if (!result.recovered) {
        // Store for later sync
        this.storeForOfflineSync(operation, data);
      }
    });

    // Handle coming back online
    window.addEventListener('online', () => {
      this.processPendingOfflineOperations();
    });

    // Handle going offline
    window.addEventListener('offline', () => {
      this.showOfflineNotification();
    });
  }

  /**
   * Create mock data for testing
   */
  createMockData(entityType, entityId, source) {
    const baseTimestamp = Date.now();
    const timestamp = source === 'local' ? baseTimestamp : baseTimestamp - 5000;
    
    switch (entityType) {
      case 'ingredient':
        return {
          id: entityId,
          name: `${source} ingredient name`,
          stockUnit: 'kg',
          buyUnit: 'kg',
          ratio: 1,
          minStock: 10,
          currentStock: source === 'local' ? 25 : 30,
          lastUpdated: timestamp
        };
        
      case 'menu':
        return {
          id: entityId,
          name: `${source} menu item`,
          category: 'main',
          price: source === 'local' ? 150 : 160,
          cost: 80,
          ingredients: [
            { ingredientId: 'ing1', quantity: 0.2 }
          ],
          isActive: true,
          lastUpdated: timestamp
        };
        
      case 'transaction':
        return {
          id: entityId,
          type: 'sale',
          timestamp: timestamp,
          items: [
            { menuId: 'menu1', quantity: 1, unitPrice: 150, totalPrice: 150 }
          ],
          total: 150,
          platform: source === 'local' ? 'local-platform' : 'remote-platform',
          synced: false,
          lastUpdated: timestamp
        };
        
      default:
        return { id: entityId, lastUpdated: timestamp };
    }
  }

  /**
   * Save resolved data (mock implementation)
   */
  async saveResolvedData(entityId, resolvedData) {
    try {
      // This would typically save to your data storage system
      console.log(`Saving resolved data for ${entityId}:`, resolvedData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Trigger success event
      const event = new CustomEvent('dataSaved', {
        detail: { entityId, data: resolvedData }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      this.errorHandler.handleError('save-failed', error, {
        entityId,
        data: resolvedData
      });
    }
  }

  /**
   * Store data for offline sync
   */
  storeForOfflineSync(operation, data) {
    try {
      const offlineQueue = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]');
      offlineQueue.push({
        operation,
        data,
        timestamp: Date.now(),
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      
      localStorage.setItem('pos_offline_queue', JSON.stringify(offlineQueue));
      console.log(`Stored operation ${operation} for offline sync`);
      
    } catch (error) {
      this.errorHandler.handleError('offline-storage-failed', error, {
        operation,
        data
      });
    }
  }

  /**
   * Process pending offline operations
   */
  async processPendingOfflineOperations() {
    try {
      const offlineQueue = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]');
      
      if (offlineQueue.length === 0) return;
      
      console.log(`Processing ${offlineQueue.length} pending offline operations`);
      
      for (const operation of offlineQueue) {
        try {
          await this.processOfflineOperation(operation);
        } catch (error) {
          this.errorHandler.handleError('offline-operation-failed', error, {
            operation: operation.operation,
            data: operation.data
          });
        }
      }
      
      // Clear processed operations
      localStorage.removeItem('pos_offline_queue');
      
    } catch (error) {
      this.errorHandler.handleError('offline-processing-failed', error);
    }
  }

  /**
   * Process individual offline operation
   */
  async processOfflineOperation(operation) {
    // This would typically make the actual API call
    console.log(`Processing offline operation: ${operation.operation}`, operation.data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Trigger success event
    const event = new CustomEvent('offlineOperationProcessed', {
      detail: operation
    });
    window.dispatchEvent(event);
  }

  /**
   * Show offline notification
   */
  showOfflineNotification() {
    let indicator = document.getElementById('offline-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.className = 'offline-indicator';
      indicator.textContent = 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต - ระบบทำงานแบบออฟไลน์';
      document.body.appendChild(indicator);
    }
    
    indicator.classList.add('show');
    
    // Hide when back online
    const hideWhenOnline = () => {
      indicator.classList.remove('show');
      window.removeEventListener('online', hideWhenOnline);
    };
    window.addEventListener('online', hideWhenOnline);
  }

  /**
   * Example usage methods for testing
   */
  
  // Test form validation
  testFormValidation() {
    console.log('Testing form validation...');
    
    // Create test form
    const form = document.createElement('form');
    form.id = 'test-form';
    form.innerHTML = `
      <div class="form-field">
        <label for="test-ingredient-name">Ingredient Name:</label>
        <input type="text" id="test-ingredient-name" value="">
        <div id="test-ingredient-name-error"></div>
      </div>
      <div class="form-field">
        <label for="test-purchase-quantity">Quantity:</label>
        <input type="number" id="test-purchase-quantity" value="">
        <div id="test-purchase-quantity-error"></div>
      </div>
    `;
    
    document.body.appendChild(form);
    
    // Register validation
    this.validationUtils.registerField('test-ingredient-name', [
      ValidationUtils.required(),
      ValidationUtils.minLength(2)
    ]);
    
    this.validationUtils.registerField('test-purchase-quantity', [
      ValidationUtils.required(),
      ValidationUtils.positiveNumber()
    ]);
    
    // Test validation
    setTimeout(() => {
      document.getElementById('test-ingredient-name').value = 'A'; // Too short
      document.getElementById('test-purchase-quantity').value = '-5'; // Negative
      
      const result = this.validationUtils.validateForm('test-form');
      console.log('Form validation result:', result);
      
      // Clean up
      setTimeout(() => form.remove(), 3000);
    }, 1000);
  }

  // Test sync conflict
  testSyncConflict() {
    console.log('Testing sync conflict...');
    
    const event = new CustomEvent('simulateSyncConflict', {
      detail: {
        entityType: 'ingredient',
        entityId: 'test-ingredient-1'
      }
    });
    window.dispatchEvent(event);
  }

  // Test network error
  testNetworkError() {
    console.log('Testing network error...');
    
    const event = new CustomEvent('networkError', {
      detail: {
        operation: 'save-ingredient',
        data: { id: 'test-ing', name: 'Test Ingredient' },
        retryFunction: async () => {
          console.log('Retrying network operation...');
          // Simulate successful retry
          return Promise.resolve();
        }
      }
    });
    window.dispatchEvent(event);
  }
}

// Initialize error handling integration when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ErrorHandlingIntegration = new ErrorHandlingIntegration();
  });
} else {
  window.ErrorHandlingIntegration = new ErrorHandlingIntegration();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandlingIntegration;
}