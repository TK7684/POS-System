/**
 * Sync Conflict Resolver for POS Application
 * Handles data synchronization conflicts between local and remote data
 * Provides automatic and manual conflict resolution strategies
 * 
 * Requirements: 8.4 - Data conflicts handling during sync
 */

class SyncConflictResolver {
  constructor() {
    this.dataValidator = window.DataValidator;
    this.errorHandler = window.ErrorHandler;
    this.pendingConflicts = new Map();
    this.resolutionStrategies = new Map();
    this.conflictHistory = [];
    
    // Initialize default resolution strategies
    this.initializeResolutionStrategies();
    
    // Listen for sync events
    this.setupSyncEventListeners();
  }

  /**
   * Initialize default conflict resolution strategies
   */
  initializeResolutionStrategies() {
    // Strategy for ingredients
    this.resolutionStrategies.set('ingredient', {
      autoResolve: ['currentStock', 'lastUpdated'],
      preferRemote: ['name', 'stockUnit', 'buyUnit', 'ratio', 'minStock'],
      preferLocal: [],
      requireManual: ['id']
    });

    // Strategy for menu items
    this.resolutionStrategies.set('menu', {
      autoResolve: ['lastUpdated'],
      preferRemote: ['name', 'price', 'ingredients'],
      preferLocal: ['isActive'],
      requireManual: ['id', 'category']
    });

    // Strategy for transactions
    this.resolutionStrategies.set('transaction', {
      autoResolve: [],
      preferRemote: [],
      preferLocal: ['timestamp', 'items', 'total'],
      requireManual: ['id', 'type']
    });
  }

  /**
   * Setup event listeners for sync operations
   */
  setupSyncEventListeners() {
    // Listen for sync start
    window.addEventListener('syncStart', (event) => {
      this.handleSyncStart(event.detail);
    });

    // Listen for sync conflicts
    window.addEventListener('syncConflict', (event) => {
      this.handleSyncConflict(event.detail);
    });

    // Listen for sync complete
    window.addEventListener('syncComplete', (event) => {
      this.handleSyncComplete(event.detail);
    });

    // Listen for offline/online status changes
    window.addEventListener('online', () => {
      this.processPendingConflicts();
    });
  }

  /**
   * Handle sync start event
   */
  handleSyncStart(syncData) {
    console.log('Sync started:', syncData);
    
    // Clear any previous conflict notifications
    this.clearConflictNotifications();
    
    // Show sync progress indicator
    this.showSyncProgress();
  }

  /**
   * Handle sync conflict detection
   */
  async handleSyncConflict(conflictData) {
    const { entityType, localData, remoteData, entityId } = conflictData;
    
    try {
      // Validate both versions of the data
      const localValidation = this.dataValidator.validateData(entityType, localData);
      const remoteValidation = this.dataValidator.validateData(entityType, remoteData);
      
      // If one version is invalid, prefer the valid one
      if (!localValidation.valid && remoteValidation.valid) {
        return this.resolveConflict(entityId, remoteData, 'remote-valid');
      } else if (localValidation.valid && !remoteValidation.valid) {
        return this.resolveConflict(entityId, localData, 'local-valid');
      }
      
      // Detect specific conflicts
      const conflicts = this.dataValidator.detectConflicts(localData, remoteData, entityType);
      
      if (!conflicts.hasConflicts) {
        // No actual conflicts, use most recent
        const localTime = localData.lastUpdated || 0;
        const remoteTime = remoteData.lastUpdated || 0;
        const preferredData = localTime > remoteTime ? localData : remoteData;
        return this.resolveConflict(entityId, preferredData, 'most-recent');
      }
      
      // Try automatic resolution
      const autoResolution = await this.attemptAutomaticResolution(conflicts);
      
      if (autoResolution.success) {
        return this.resolveConflict(entityId, autoResolution.resolvedData, 'automatic');
      }
      
      // Store for manual resolution
      this.pendingConflicts.set(entityId, {
        entityType,
        localData,
        remoteData,
        conflicts: conflicts.conflicts,
        timestamp: Date.now()
      });
      
      // Show conflict notification to user
      this.showConflictNotification(entityId, entityType, conflicts.conflicts.length);
      
      // Log conflict for analytics
      this.logConflict(entityId, entityType, conflicts.conflicts);
      
    } catch (error) {
      this.errorHandler?.handleError('sync-conflict-processing', error, {
        entityId,
        entityType
      });
    }
  }

  /**
   * Attempt automatic conflict resolution
   */
  async attemptAutomaticResolution(conflictData) {
    const { entityType, localData, remoteData, conflicts } = conflictData;
    const strategy = this.resolutionStrategies.get(entityType);
    
    if (!strategy) {
      return { success: false, reason: 'no-strategy' };
    }
    
    const resolvedData = { ...localData };
    const unresolvableConflicts = [];
    
    // Process each conflict
    for (const conflict of conflicts) {
      const { field } = conflict;
      
      if (strategy.requireManual.includes(field)) {
        unresolvableConflicts.push(conflict);
        continue;
      }
      
      if (strategy.autoResolve.includes(field)) {
        // Use automatic resolution logic
        const autoValue = this.getAutomaticResolutionValue(conflict, entityType);
        if (autoValue !== null) {
          resolvedData[field] = autoValue;
          continue;
        }
      }
      
      if (strategy.preferRemote.includes(field)) {
        resolvedData[field] = remoteData[field];
        continue;
      }
      
      if (strategy.preferLocal.includes(field)) {
        resolvedData[field] = localData[field];
        continue;
      }
      
      // Default: require manual resolution
      unresolvableConflicts.push(conflict);
    }
    
    // If any conflicts couldn't be resolved automatically
    if (unresolvableConflicts.length > 0) {
      return { 
        success: false, 
        reason: 'manual-required',
        unresolvableConflicts 
      };
    }
    
    // Update timestamp
    resolvedData.lastUpdated = Date.now();
    
    return {
      success: true,
      resolvedData,
      strategy: 'automatic'
    };
  }

  /**
   * Get automatic resolution value for a conflict
   */
  getAutomaticResolutionValue(conflict, entityType) {
    const { field, localValue, remoteValue, localTimestamp, remoteTimestamp } = conflict;
    
    switch (field) {
      case 'lastUpdated':
        return Math.max(localTimestamp, remoteTimestamp);
        
      case 'currentStock':
        // For stock, use the higher value (assuming both are valid updates)
        if (typeof localValue === 'number' && typeof remoteValue === 'number') {
          return Math.max(localValue, remoteValue);
        }
        break;
        
      case 'isActive':
        // Prefer active state
        return localValue || remoteValue;
        
      default:
        // Use most recent timestamp
        return localTimestamp > remoteTimestamp ? localValue : remoteValue;
    }
    
    return null;
  }

  /**
   * Show conflict notification to user
   */
  showConflictNotification(entityId, entityType, conflictCount) {
    const notification = document.createElement('div');
    notification.className = 'sync-conflict-notification';
    notification.innerHTML = `
      <div class="conflict-notification-content">
        <div class="conflict-icon">⚠️</div>
        <div class="conflict-message">
          <strong>พบข้อมูลที่ขัดแย้ง</strong>
          <p>${entityType} (${entityId}) มีข้อมูลที่ขัดแย้ง ${conflictCount} รายการ</p>
        </div>
        <div class="conflict-actions">
          <button onclick="this.resolveConflict('${entityId}')" class="btn-resolve">แก้ไข</button>
          <button onclick="this.dismissConflict('${entityId}')" class="btn-dismiss">ข้าม</button>
        </div>
      </div>
    `;
    
    // Add event handlers
    notification.resolveConflict = (id) => {
      this.showConflictResolutionUI(id);
      notification.remove();
    };
    
    notification.dismissConflict = (id) => {
      this.dismissConflict(id);
      notification.remove();
    };
    
    // Add to notification container
    let container = document.getElementById('sync-conflict-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sync-conflict-notifications';
      container.className = 'sync-conflict-notifications';
      document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 30000);
  }

  /**
   * Show conflict resolution UI
   */
  showConflictResolutionUI(entityId) {
    const conflictData = this.pendingConflicts.get(entityId);
    if (!conflictData) {
      this.errorHandler?.handleError('conflict-not-found', new Error(`Conflict not found: ${entityId}`));
      return;
    }
    
    // Use DataValidator's conflict resolution UI
    const modal = this.dataValidator.showConflictResolutionUI({
      conflicts: conflictData.conflicts,
      entityType: conflictData.entityType,
      localData: conflictData.localData,
      remoteData: conflictData.remoteData
    });
    
    // Override the apply resolution method
    const originalApplyResolution = this.dataValidator.applyResolution.bind(this.dataValidator);
    this.dataValidator.applyResolution = (resolvedData) => {
      this.resolveConflict(entityId, resolvedData, 'manual');
      originalApplyResolution(resolvedData);
    };
  }

  /**
   * Resolve a conflict with the given data
   */
  async resolveConflict(entityId, resolvedData, strategy) {
    try {
      // Validate resolved data
      const conflictData = this.pendingConflicts.get(entityId);
      if (conflictData) {
        const validation = this.dataValidator.validateData(conflictData.entityType, resolvedData);
        
        if (!validation.valid) {
          throw new Error(`Resolved data is invalid: ${validation.errors.join(', ')}`);
        }
      }
      
      // Apply the resolution
      await this.applyResolution(entityId, resolvedData, strategy);
      
      // Remove from pending conflicts
      this.pendingConflicts.delete(entityId);
      
      // Log successful resolution
      this.logResolution(entityId, strategy);
      
      // Trigger sync continuation
      this.triggerSyncContinuation(entityId, resolvedData);
      
    } catch (error) {
      this.errorHandler?.handleError('conflict-resolution-failed', error, {
        entityId,
        strategy
      });
    }
  }

  /**
   * Apply conflict resolution
   */
  async applyResolution(entityId, resolvedData, strategy) {
    // This would typically save to the appropriate storage
    // Implementation depends on the data storage system
    
    console.log(`Applying conflict resolution for ${entityId}:`, {
      strategy,
      resolvedData
    });
    
    // Trigger custom event for other components
    const event = new CustomEvent('conflictResolved', {
      detail: {
        entityId,
        resolvedData,
        strategy,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Dismiss a conflict (use local data)
   */
  dismissConflict(entityId) {
    const conflictData = this.pendingConflicts.get(entityId);
    if (conflictData) {
      this.resolveConflict(entityId, conflictData.localData, 'dismissed-local');
    }
  }

  /**
   * Process pending conflicts when coming back online
   */
  async processPendingConflicts() {
    if (this.pendingConflicts.size === 0) return;
    
    console.log(`Processing ${this.pendingConflicts.size} pending conflicts`);
    
    // Show batch conflict resolution UI if there are many conflicts
    if (this.pendingConflicts.size > 5) {
      this.showBatchConflictResolutionUI();
    } else {
      // Show individual notifications
      for (const [entityId, conflictData] of this.pendingConflicts) {
        this.showConflictNotification(entityId, conflictData.entityType, conflictData.conflicts.length);
      }
    }
  }

  /**
   * Show batch conflict resolution UI
   */
  showBatchConflictResolutionUI() {
    const modal = document.createElement('div');
    modal.className = 'batch-conflict-modal';
    
    const conflictList = Array.from(this.pendingConflicts.entries())
      .map(([entityId, data]) => `
        <div class="batch-conflict-item" data-entity-id="${entityId}">
          <div class="conflict-info">
            <strong>${data.entityType}</strong> (${entityId})
            <span class="conflict-count">${data.conflicts.length} ข้อขัดแย้ง</span>
          </div>
          <div class="conflict-actions">
            <button onclick="this.resolveIndividual('${entityId}')">แก้ไข</button>
            <button onclick="this.useLocal('${entityId}')">ใช้ในเครื่อง</button>
            <button onclick="this.useRemote('${entityId}')">ใช้เซิร์ฟเวอร์</button>
          </div>
        </div>
      `).join('');
    
    modal.innerHTML = `
      <div class="batch-conflict-content">
        <div class="batch-conflict-header">
          <h3>พบข้อมูลที่ขัดแย้งหลายรายการ</h3>
          <p>กรุณาเลือกวิธีการแก้ไขสำหรับแต่ละรายการ</p>
        </div>
        <div class="batch-conflict-list">
          ${conflictList}
        </div>
        <div class="batch-conflict-actions">
          <button onclick="this.resolveAllLocal()" class="btn-resolve-all-local">ใช้ข้อมูลในเครื่องทั้งหมด</button>
          <button onclick="this.resolveAllRemote()" class="btn-resolve-all-remote">ใช้ข้อมูลเซิร์ฟเวอร์ทั้งหมด</button>
          <button onclick="this.closeModal()" class="btn-close">ปิด</button>
        </div>
      </div>
    `;
    
    // Add event handlers
    modal.resolveIndividual = (entityId) => {
      this.showConflictResolutionUI(entityId);
    };
    
    modal.useLocal = (entityId) => {
      const conflictData = this.pendingConflicts.get(entityId);
      if (conflictData) {
        this.resolveConflict(entityId, conflictData.localData, 'batch-local');
        modal.querySelector(`[data-entity-id="${entityId}"]`).remove();
      }
    };
    
    modal.useRemote = (entityId) => {
      const conflictData = this.pendingConflicts.get(entityId);
      if (conflictData) {
        this.resolveConflict(entityId, conflictData.remoteData, 'batch-remote');
        modal.querySelector(`[data-entity-id="${entityId}"]`).remove();
      }
    };
    
    modal.resolveAllLocal = () => {
      for (const [entityId, conflictData] of this.pendingConflicts) {
        this.resolveConflict(entityId, conflictData.localData, 'batch-all-local');
      }
      modal.remove();
    };
    
    modal.resolveAllRemote = () => {
      for (const [entityId, conflictData] of this.pendingConflicts) {
        this.resolveConflict(entityId, conflictData.remoteData, 'batch-all-remote');
      }
      modal.remove();
    };
    
    modal.closeModal = () => {
      modal.remove();
    };
    
    document.body.appendChild(modal);
  }

  /**
   * Show sync progress indicator
   */
  showSyncProgress() {
    let indicator = document.getElementById('sync-progress-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'sync-progress-indicator';
      indicator.className = 'sync-progress-indicator';
      document.body.appendChild(indicator);
    }
    
    indicator.innerHTML = `
      <div class="sync-progress-content">
        <div class="sync-spinner"></div>
        <span>กำลังซิงค์ข้อมูล...</span>
      </div>
    `;
    
    indicator.classList.add('show');
  }

  /**
   * Hide sync progress indicator
   */
  hideSyncProgress() {
    const indicator = document.getElementById('sync-progress-indicator');
    if (indicator) {
      indicator.classList.remove('show');
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.remove();
        }
      }, 300);
    }
  }

  /**
   * Clear conflict notifications
   */
  clearConflictNotifications() {
    const container = document.getElementById('sync-conflict-notifications');
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * Handle sync complete event
   */
  handleSyncComplete(syncData) {
    console.log('Sync completed:', syncData);
    
    // Hide sync progress
    this.hideSyncProgress();
    
    // Show completion notification if there were conflicts resolved
    if (this.conflictHistory.length > 0) {
      this.showSyncCompletionSummary();
    }
  }

  /**
   * Show sync completion summary
   */
  showSyncCompletionSummary() {
    const recentConflicts = this.conflictHistory.filter(
      conflict => Date.now() - conflict.timestamp < 60000 // Last minute
    );
    
    if (recentConflicts.length === 0) return;
    
    const notification = document.createElement('div');
    notification.className = 'sync-completion-notification';
    notification.innerHTML = `
      <div class="sync-completion-content">
        <div class="completion-icon">✅</div>
        <div class="completion-message">
          <strong>ซิงค์ข้อมูลเสร็จสิ้น</strong>
          <p>แก้ไขข้อขัดแย้ง ${recentConflicts.length} รายการเรียบร้อยแล้ว</p>
        </div>
        <button onclick="this.remove()" class="btn-close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Log conflict for analytics
   */
  logConflict(entityId, entityType, conflicts) {
    const conflictLog = {
      entityId,
      entityType,
      conflictCount: conflicts.length,
      conflictFields: conflicts.map(c => c.field),
      timestamp: Date.now()
    };
    
    this.conflictHistory.push(conflictLog);
    
    // Keep only recent conflicts (last 100)
    if (this.conflictHistory.length > 100) {
      this.conflictHistory = this.conflictHistory.slice(-100);
    }
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('pos_conflict_history', JSON.stringify(this.conflictHistory));
    } catch (e) {
      // Storage might be full, ignore
    }
  }

  /**
   * Log successful resolution
   */
  logResolution(entityId, strategy) {
    console.log(`Conflict resolved for ${entityId} using strategy: ${strategy}`);
    
    // Update conflict history
    const conflictIndex = this.conflictHistory.findIndex(c => c.entityId === entityId);
    if (conflictIndex !== -1) {
      this.conflictHistory[conflictIndex].resolved = true;
      this.conflictHistory[conflictIndex].resolutionStrategy = strategy;
      this.conflictHistory[conflictIndex].resolvedAt = Date.now();
    }
  }

  /**
   * Trigger sync continuation after conflict resolution
   */
  triggerSyncContinuation(entityId, resolvedData) {
    const event = new CustomEvent('syncContinue', {
      detail: {
        entityId,
        resolvedData,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get conflict statistics
   */
  getConflictStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    const recentConflicts = this.conflictHistory.filter(c => now - c.timestamp < oneHour);
    const todayConflicts = this.conflictHistory.filter(c => now - c.timestamp < oneDay);
    const resolvedConflicts = this.conflictHistory.filter(c => c.resolved);
    
    return {
      total: this.conflictHistory.length,
      pending: this.pendingConflicts.size,
      lastHour: recentConflicts.length,
      today: todayConflicts.length,
      resolved: resolvedConflicts.length,
      resolutionRate: this.conflictHistory.length > 0 ? 
        (resolvedConflicts.length / this.conflictHistory.length) * 100 : 0
    };
  }
}

// Create global sync conflict resolver instance
window.SyncConflictResolver = new SyncConflictResolver();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncConflictResolver;
}