/**
 * User Analytics - Privacy-compliant user behavior tracking and feedback system
 * Implements A/B testing framework for UI improvements
 */

class UserAnalytics {
  constructor() {
    this.isEnabled = false;
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.events = [];
    this.performanceData = [];
    this.feedbackData = [];
    this.abTests = new Map();
    this.userPreferences = this.loadUserPreferences();
    
    this.init();
  }

  /**
   * Initialize analytics system
   */
  init() {
    this.checkPrivacyConsent();
    this.setupEventTracking();
    this.setupPerformanceTracking();
    this.setupFeedbackSystem();
    this.setupABTesting();
    this.startSession();
  }

  /**
   * Check privacy consent
   */
  checkPrivacyConsent() {
    const consent = localStorage.getItem('analytics-consent');
    this.isEnabled = consent === 'true';
    
    if (!consent) {
      this.showConsentDialog();
    }
  }

  /**
   * Show privacy consent dialog
   */
  showConsentDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'analytics-consent-dialog';
    dialog.innerHTML = `
      <div class="consent-content">
        <h3>ช่วยปรับปรุงระบบ POS</h3>
        <p>เราต้องการเก็บข้อมูลการใช้งานเพื่อปรับปรุงประสิทธิภาพของระบบ</p>
        <p>ข้อมูลจะไม่เชื่อมโยงกับตัวตนของคุณและจะใช้เพื่อการพัฒนาเท่านั้น</p>
        <div class="consent-buttons">
          <button id="consent-accept" class="btn-primary">ยอมรับ</button>
          <button id="consent-decline" class="btn-secondary">ไม่ยอมรับ</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    document.getElementById('consent-accept').addEventListener('click', () => {
      this.setConsent(true);
      dialog.remove();
    });
    
    document.getElementById('consent-decline').addEventListener('click', () => {
      this.setConsent(false);
      dialog.remove();
    });
  }

  /**
   * Set user consent
   */
  setConsent(consent) {
    localStorage.setItem('analytics-consent', consent.toString());
    this.isEnabled = consent;
    
    if (consent) {
      this.startSession();
    }
  }

  /**
   * Generate anonymous session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get anonymous user ID
   */
  getUserId() {
    let userId = localStorage.getItem('analytics-user-id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('analytics-user-id', userId);
    }
    return userId;
  }

  /**
   * Load user preferences
   */
  loadUserPreferences() {
    const preferences = localStorage.getItem('user-preferences');
    return preferences ? JSON.parse(preferences) : {
      theme: 'light',
      language: 'th',
      quickActions: [],
      favoriteScreens: []
    };
  }

  /**
   * Setup event tracking
   */
  setupEventTracking() {
    if (!this.isEnabled) return;
    
    // Track page views
    this.trackPageView();
    
    // Track user interactions
    this.trackUserInteractions();
    
    // Track feature usage
    this.trackFeatureUsage();
    
    // Track errors
    this.trackErrors();
  }

  /**
   * Track page views
   */
  trackPageView() {
    const currentScreen = this.getCurrentScreen();
    this.trackEvent('page_view', {
      screen: currentScreen,
      timestamp: Date.now(),
      referrer: document.referrer,
      userAgent: navigator.userAgent.substring(0, 100) // Truncated for privacy
    });
    
    // Track screen changes
    const observer = new MutationObserver(() => {
      const newScreen = this.getCurrentScreen();
      if (newScreen !== currentScreen) {
        this.trackEvent('screen_change', {
          from: currentScreen,
          to: newScreen,
          timestamp: Date.now()
        });
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  /**
   * Get current screen name
   */
  getCurrentScreen() {
    const activeTab = document.querySelector('.tabbtn.active');
    if (activeTab) {
      return activeTab.dataset.route || 'unknown';
    }
    
    const visibleCard = document.querySelector('.card:not([style*="display: none"])');
    if (visibleCard) {
      return visibleCard.id || 'unknown';
    }
    
    return 'home';
  }

  /**
   * Track user interactions
   */
  trackUserInteractions() {
    // Track button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('button, .btn, .tabbtn')) {
        this.trackEvent('button_click', {
          element: e.target.tagName.toLowerCase(),
          text: e.target.textContent.substring(0, 50),
          className: e.target.className,
          screen: this.getCurrentScreen(),
          timestamp: Date.now()
        });
      }
    });
    
    // Track form interactions
    document.addEventListener('submit', (e) => {
      this.trackEvent('form_submit', {
        formId: e.target.id,
        screen: this.getCurrentScreen(),
        timestamp: Date.now()
      });
    });
    
    // Track search usage
    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-search]')) {
        this.trackEvent('search_query', {
          searchType: e.target.dataset.search,
          queryLength: e.target.value.length,
          screen: this.getCurrentScreen(),
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage() {
    // Track quick actions usage
    document.addEventListener('click', (e) => {
      if (e.target.closest('.quick-actions')) {
        this.trackEvent('quick_action_used', {
          action: e.target.dataset.action || 'unknown',
          screen: this.getCurrentScreen(),
          timestamp: Date.now()
        });
      }
    });
    
    // Track export usage
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-export]')) {
        this.trackEvent('export_used', {
          exportType: e.target.dataset.export,
          screen: this.getCurrentScreen(),
          timestamp: Date.now()
        });
      }
    });
    
    // Track offline usage
    window.addEventListener('offline', () => {
      this.trackEvent('offline_mode_entered', {
        timestamp: Date.now()
      });
    });
    
    window.addEventListener('online', () => {
      this.trackEvent('online_mode_restored', {
        timestamp: Date.now()
      });
    });
  }

  /**
   * Track errors
   */
  trackErrors() {
    window.addEventListener('error', (e) => {
      this.trackEvent('javascript_error', {
        message: e.message.substring(0, 100),
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        screen: this.getCurrentScreen(),
        timestamp: Date.now()
      });
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      this.trackEvent('promise_rejection', {
        reason: e.reason ? e.reason.toString().substring(0, 100) : 'unknown',
        screen: this.getCurrentScreen(),
        timestamp: Date.now()
      });
    });
  }

  /**
   * Setup performance tracking
   */
  setupPerformanceTracking() {
    if (!this.isEnabled) return;
    
    // Track performance metrics from PerformanceMonitor
    if (window.performanceMonitor) {
      window.performanceMonitor.onAlert((alert) => {
        this.trackPerformanceAlert(alert);
      });
    }
  }

  /**
   * Track performance alert
   */
  trackPerformanceAlert(alert) {
    this.trackEvent('performance_alert', {
      alertType: alert.type,
      severity: alert.severity,
      data: alert.data,
      screen: this.getCurrentScreen(),
      timestamp: alert.timestamp
    });
  }

  /**
   * Track performance data
   */
  trackPerformance(performanceData) {
    if (!this.isEnabled) return;
    
    this.performanceData.push({
      ...performanceData,
      sessionId: this.sessionId,
      userId: this.userId,
      screen: this.getCurrentScreen()
    });
    
    // Keep only last 100 performance records
    if (this.performanceData.length > 100) {
      this.performanceData = this.performanceData.slice(-100);
    }
    
    // Send to server if available
    this.sendPerformanceData(performanceData);
  }

  /**
   * Setup feedback system
   */
  setupFeedbackSystem() {
    this.createFeedbackWidget();
    this.setupFeedbackTriggers();
  }

  /**
   * Create feedback widget
   */
  createFeedbackWidget() {
    const widget = document.createElement('div');
    widget.className = 'feedback-widget';
    widget.innerHTML = `
      <button class="feedback-trigger" title="ให้ความคิดเห็น">
        💬
      </button>
      <div class="feedback-form" style="display: none;">
        <h4>ความคิดเห็นของคุณ</h4>
        <textarea placeholder="แบ่งปันประสบการณ์การใช้งาน..." rows="3"></textarea>
        <div class="rating">
          <span>ความพึงพอใจ:</span>
          <div class="stars">
            <span data-rating="1">⭐</span>
            <span data-rating="2">⭐</span>
            <span data-rating="3">⭐</span>
            <span data-rating="4">⭐</span>
            <span data-rating="5">⭐</span>
          </div>
        </div>
        <div class="feedback-buttons">
          <button class="submit-feedback">ส่ง</button>
          <button class="cancel-feedback">ยกเลิก</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    
    // Setup widget interactions
    this.setupFeedbackWidgetEvents(widget);
  }

  /**
   * Setup feedback widget events
   */
  setupFeedbackWidgetEvents(widget) {
    const trigger = widget.querySelector('.feedback-trigger');
    const form = widget.querySelector('.feedback-form');
    const textarea = widget.querySelector('textarea');
    const stars = widget.querySelectorAll('.stars span');
    const submitBtn = widget.querySelector('.submit-feedback');
    const cancelBtn = widget.querySelector('.cancel-feedback');
    
    let selectedRating = 0;
    
    trigger.addEventListener('click', () => {
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });
    
    stars.forEach(star => {
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.rating);
        stars.forEach((s, index) => {
          s.style.opacity = index < selectedRating ? '1' : '0.3';
        });
      });
    });
    
    submitBtn.addEventListener('click', () => {
      const feedback = textarea.value.trim();
      if (feedback || selectedRating > 0) {
        this.submitFeedback({
          text: feedback,
          rating: selectedRating,
          screen: this.getCurrentScreen(),
          timestamp: Date.now()
        });
        
        textarea.value = '';
        selectedRating = 0;
        stars.forEach(s => s.style.opacity = '0.3');
        form.style.display = 'none';
        
        this.showFeedbackThankYou();
      }
    });
    
    cancelBtn.addEventListener('click', () => {
      form.style.display = 'none';
    });
  }

  /**
   * Setup feedback triggers
   */
  setupFeedbackTriggers() {
    // Trigger feedback after certain actions
    let actionCount = 0;
    
    document.addEventListener('click', () => {
      actionCount++;
      
      // Show feedback prompt after 50 actions
      if (actionCount === 50) {
        this.showFeedbackPrompt();
      }
    });
    
    // Trigger feedback on errors
    window.addEventListener('error', () => {
      setTimeout(() => {
        this.showErrorFeedbackPrompt();
      }, 2000);
    });
  }

  /**
   * Show feedback prompt
   */
  showFeedbackPrompt() {
    if (!this.isEnabled) return;
    
    const prompt = document.createElement('div');
    prompt.className = 'feedback-prompt';
    prompt.innerHTML = `
      <div class="prompt-content">
        <p>คุณใช้งานระบบมาสักพักแล้ว ช่วยแบ่งปันความคิดเห็นหน่อยได้ไหม?</p>
        <div class="prompt-buttons">
          <button class="give-feedback">ให้ความคิดเห็น</button>
          <button class="maybe-later">ไว้ทีหลัง</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(prompt);
    
    prompt.querySelector('.give-feedback').addEventListener('click', () => {
      document.querySelector('.feedback-widget .feedback-form').style.display = 'block';
      prompt.remove();
    });
    
    prompt.querySelector('.maybe-later').addEventListener('click', () => {
      prompt.remove();
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (prompt.parentNode) {
        prompt.remove();
      }
    }, 10000);
  }

  /**
   * Show error feedback prompt
   */
  showErrorFeedbackPrompt() {
    if (!this.isEnabled) return;
    
    const prompt = document.createElement('div');
    prompt.className = 'error-feedback-prompt';
    prompt.innerHTML = `
      <div class="prompt-content">
        <p>เกิดข้อผิดพลาด ช่วยบอกเราว่าเกิดอะไรขึ้นได้ไหม?</p>
        <button class="report-error">รายงานปัญหา</button>
        <button class="dismiss">ปิด</button>
      </div>
    `;
    
    document.body.appendChild(prompt);
    
    prompt.querySelector('.report-error').addEventListener('click', () => {
      document.querySelector('.feedback-widget .feedback-form').style.display = 'block';
      document.querySelector('.feedback-widget textarea').placeholder = 'อธิบายปัญหาที่เกิดขึ้น...';
      prompt.remove();
    });
    
    prompt.querySelector('.dismiss').addEventListener('click', () => {
      prompt.remove();
    });
  }

  /**
   * Submit feedback
   */
  submitFeedback(feedback) {
    if (!this.isEnabled) return;
    
    const feedbackData = {
      ...feedback,
      sessionId: this.sessionId,
      userId: this.userId,
      userAgent: navigator.userAgent.substring(0, 100),
      url: window.location.href
    };
    
    this.feedbackData.push(feedbackData);
    
    // Send to server if available
    this.sendFeedbackData(feedbackData);
    
    this.trackEvent('feedback_submitted', {
      rating: feedback.rating,
      hasText: !!feedback.text,
      screen: feedback.screen,
      timestamp: feedback.timestamp
    });
  }

  /**
   * Show feedback thank you message
   */
  showFeedbackThankYou() {
    const thankYou = document.createElement('div');
    thankYou.className = 'feedback-thank-you';
    thankYou.innerHTML = '<p>ขอบคุณสำหรับความคิดเห็น!</p>';
    
    document.body.appendChild(thankYou);
    
    setTimeout(() => {
      thankYou.remove();
    }, 3000);
  }

  /**
   * Setup A/B testing framework
   */
  setupABTesting() {
    this.loadABTests();
    this.assignUserToTests();
  }

  /**
   * Load A/B tests configuration
   */
  loadABTests() {
    // Example A/B tests configuration
    const tests = [
      {
        id: 'quick-actions-position',
        name: 'Quick Actions Position',
        variants: ['bottom-right', 'bottom-center'],
        traffic: 0.5, // 50% of users
        active: true
      },
      {
        id: 'search-suggestions',
        name: 'Search Suggestions Count',
        variants: ['5-suggestions', '10-suggestions'],
        traffic: 0.3, // 30% of users
        active: true
      },
      {
        id: 'dashboard-layout',
        name: 'Dashboard Layout',
        variants: ['grid-layout', 'list-layout'],
        traffic: 0.4, // 40% of users
        active: true
      }
    ];
    
    tests.forEach(test => {
      this.abTests.set(test.id, test);
    });
  }

  /**
   * Assign user to A/B tests
   */
  assignUserToTests() {
    this.abTests.forEach((test, testId) => {
      if (!test.active) return;
      
      const userHash = this.hashUserId(this.userId + testId);
      const shouldParticipate = userHash < test.traffic;
      
      if (shouldParticipate) {
        const variantIndex = Math.floor(userHash * test.variants.length / test.traffic);
        const variant = test.variants[variantIndex];
        
        this.assignUserToVariant(testId, variant);
        
        this.trackEvent('ab_test_assigned', {
          testId,
          variant,
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Hash user ID for consistent A/B test assignment
   */
  hashUserId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / Math.pow(2, 31);
  }

  /**
   * Assign user to specific variant
   */
  assignUserToVariant(testId, variant) {
    localStorage.setItem(`ab-test-${testId}`, variant);
    
    // Apply variant changes
    this.applyVariant(testId, variant);
  }

  /**
   * Apply A/B test variant
   */
  applyVariant(testId, variant) {
    switch (testId) {
      case 'quick-actions-position':
        this.applyQuickActionsPosition(variant);
        break;
      case 'search-suggestions':
        this.applySearchSuggestions(variant);
        break;
      case 'dashboard-layout':
        this.applyDashboardLayout(variant);
        break;
    }
  }

  /**
   * Apply quick actions position variant
   */
  applyQuickActionsPosition(variant) {
    const quickActions = document.querySelector('.quick-actions');
    if (quickActions) {
      quickActions.classList.add(`position-${variant}`);
    }
  }

  /**
   * Apply search suggestions variant
   */
  applySearchSuggestions(variant) {
    const maxSuggestions = variant === '5-suggestions' ? 5 : 10;
    
    // Store in global variable for search components to use
    window.MAX_SEARCH_SUGGESTIONS = maxSuggestions;
  }

  /**
   * Apply dashboard layout variant
   */
  applyDashboardLayout(variant) {
    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
      dashboard.classList.add(`layout-${variant}`);
    }
  }

  /**
   * Track A/B test conversion
   */
  trackConversion(testId, conversionType = 'default') {
    const variant = localStorage.getItem(`ab-test-${testId}`);
    if (variant) {
      this.trackEvent('ab_test_conversion', {
        testId,
        variant,
        conversionType,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Track event
   */
  trackEvent(eventName, eventData) {
    if (!this.isEnabled) return;
    
    const event = {
      name: eventName,
      data: eventData,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // Send to server if available
    this.sendEventData(event);
  }

  /**
   * Start analytics session
   */
  startSession() {
    if (!this.isEnabled) return;
    
    this.trackEvent('session_start', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 100),
      screen: {
        width: screen.width,
        height: screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  /**
   * End analytics session
   */
  endSession() {
    if (!this.isEnabled) return;
    
    this.trackEvent('session_end', {
      timestamp: Date.now(),
      duration: Date.now() - parseInt(this.sessionId.split('_')[1])
    });
    
    // Send remaining data
    this.sendAllData();
  }

  /**
   * Send event data to server
   */
  sendEventData(event) {
    // In a real implementation, this would send to your analytics server
    console.log('Analytics Event:', event);
  }

  /**
   * Send performance data to server
   */
  sendPerformanceData(data) {
    // In a real implementation, this would send to your analytics server
    console.log('Performance Data:', data);
  }

  /**
   * Send feedback data to server
   */
  sendFeedbackData(feedback) {
    // In a real implementation, this would send to your feedback system
    console.log('Feedback Data:', feedback);
  }

  /**
   * Send all collected data
   */
  sendAllData() {
    if (!this.isEnabled) return;
    
    const allData = {
      events: this.events,
      performance: this.performanceData,
      feedback: this.feedbackData,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    // In a real implementation, this would send to your server
    console.log('All Analytics Data:', allData);
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    return {
      isEnabled: this.isEnabled,
      sessionId: this.sessionId,
      eventsCount: this.events.length,
      performanceRecords: this.performanceData.length,
      feedbackCount: this.feedbackData.length,
      activeABTests: Array.from(this.abTests.entries())
        .filter(([_, test]) => test.active)
        .map(([id, test]) => ({
          id,
          name: test.name,
          variant: localStorage.getItem(`ab-test-${id}`)
        }))
    };
  }
}

// Auto-initialize user analytics
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.UserAnalytics = new UserAnalytics();
    
    // End session on page unload
    window.addEventListener('beforeunload', () => {
      window.UserAnalytics.endSession();
    });
  });
} else {
  window.UserAnalytics = new UserAnalytics();
  
  window.addEventListener('beforeunload', () => {
    window.UserAnalytics.endSession();
  });
}

export default UserAnalytics;