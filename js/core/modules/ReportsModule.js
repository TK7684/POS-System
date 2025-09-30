/**
 * Reports Module - Enhanced reporting functionality with export capabilities
 * Integrates with ExportManager and ReportTemplateManager for comprehensive reporting
 */

class ReportsModule {
  constructor() {
    this.exportManager = null;
    this.templateManager = null;
    this.currentReportData = null;
    this.currentTemplate = 'sales';
    this.initialized = false;
  }

  /**
   * Initialize the reports module
   */
  async init() {
    if (this.initialized) return;

    try {
      // Initialize managers
      await this.initializeManagers();
      
      // Setup UI enhancements
      this.setupReportsUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('Reports Module initialized');
    } catch (error) {
      console.error('Failed to initialize Reports Module:', error);
    }
  }

  /**
   * Initialize export and template managers
   */
  async initializeManagers() {
    // Initialize Export Manager
    if (window.ExportManager) {
      this.exportManager = new window.ExportManager();
      this.exportManager.init();
    }

    // Initialize Template Manager
    if (window.ReportTemplateManager) {
      this.templateManager = new window.ReportTemplateManager();
      this.templateManager.init();
    }
  }

  /**
   * Setup enhanced reports UI
   */
  setupReportsUI() {
    const reportsScreen = document.getElementById('reports-screen');
    if (!reportsScreen) return;

    // Add template selector
    this.addTemplateSelector(reportsScreen);
    
    // Add export options
    this.addExportOptions(reportsScreen);
    
    // Add quick date filters
    this.addQuickDateFilters(reportsScreen);
    
    // Add report preview
    this.addReportPreview(reportsScreen);
  }

  /**
   * Add template selector to reports screen
   */
  addTemplateSelector(reportsScreen) {
    const reportCard = reportsScreen.querySelector('.card');
    if (!reportCard) return;

    // Create template selector
    const templateField = document.createElement('div');
    templateField.className = 'field';
    templateField.innerHTML = `
      <label class="label" for="report-template">ประเภทรายงาน</label>
      <select class="select" id="report-template">
        <option value="sales">รายงานการขาย</option>
        <option value="purchase">รายงานการซื้อ</option>
        <option value="inventory">รายงานสต๊อก</option>
        <option value="profit">รายงานกำไร</option>
        <option value="daily-sales">สรุปยอดขายรายวัน</option>
        <option value="menu-performance">ประสิทธิภาพเมนู</option>
        <option value="platform-comparison">เปรียบเทียบแพลตฟอร์ม</option>
      </select>
    `;

    // Insert before date fields
    const dateRow = reportCard.querySelector('.row');
    reportCard.insertBefore(templateField, dateRow);
  }

  /**
   * Add export options to reports screen
   */
  addExportOptions(reportsScreen) {
    // Find the existing export button and enhance it
    const existingExportBtn = reportsScreen.querySelector('button[onclick="exportReport()"]');
    if (existingExportBtn && this.exportManager) {
      this.exportManager.enhanceExportButton(existingExportBtn);
    }
  }

  /**
   * Add quick date filters
   */
  addQuickDateFilters(reportsScreen) {
    const reportCard = reportsScreen.querySelector('.card');
    if (!reportCard) return;

    // Create quick filters
    const quickFilters = document.createElement('div');
    quickFilters.className = 'field';
    quickFilters.innerHTML = `
      <label class="label">ช่วงเวลาด่วน</label>
      <div class="row" style="gap: 8px; flex-wrap: wrap;">
        <button class="btn ghost pill" data-period="today">วันนี้</button>
        <button class="btn ghost pill" data-period="yesterday">เมื่อวาน</button>
        <button class="btn ghost pill" data-period="week">สัปดาห์นี้</button>
        <button class="btn ghost pill" data-period="month">เดือนนี้</button>
        <button class="btn ghost pill" data-period="quarter">ไตรมาสนี้</button>
        <button class="btn ghost pill" data-period="year">ปีนี้</button>
      </div>
    `;

    // Insert after template selector
    const templateField = reportCard.querySelector('#report-template').closest('.field');
    templateField.parentNode.insertBefore(quickFilters, templateField.nextSibling);

    // Add event listeners for quick filters
    quickFilters.querySelectorAll('[data-period]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.applyQuickDateFilter(btn.dataset.period);
      });
    });
  }

  /**
   * Add report preview section
   */
  addReportPreview(reportsScreen) {
    const reportResultCard = reportsScreen.querySelectorAll('.card')[1];
    if (!reportResultCard) return;

    // Add report statistics
    const statsSection = document.createElement('div');
    statsSection.className = 'report-stats';
    statsSection.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
      padding: 16px;
      background: var(--bg);
      border-radius: var(--radius);
      border: 1px solid var(--line);
    `;
    statsSection.innerHTML = `
      <div class="stat-item">
        <div class="stat-value" id="stat-records">-</div>
        <div class="stat-label">รายการ</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="stat-revenue">-</div>
        <div class="stat-label">ยอดขาย</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="stat-profit">-</div>
        <div class="stat-label">กำไร</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="stat-margin">-</div>
        <div class="stat-label">อัตรากำไร</div>
      </div>
    `;

    // Add CSS for stats
    const style = document.createElement('style');
    style.textContent = `
      .stat-item {
        text-align: center;
      }
      .stat-value {
        font-size: var(--fs-lg);
        font-weight: 700;
        color: var(--brand);
        margin-bottom: 4px;
      }
      .stat-label {
        font-size: var(--fs-xs);
        color: var(--muted);
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);

    // Insert stats before report content
    const reportContent = reportResultCard.querySelector('#report-content');
    reportContent.parentNode.insertBefore(statsSection, reportContent);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Template change listener
    const templateSelect = document.getElementById('report-template');
    if (templateSelect) {
      templateSelect.addEventListener('change', (e) => {
        this.currentTemplate = e.target.value;
        this.updateTemplateDescription();
      });
    }

    // Override the global generateReport function
    window.generateReport = () => this.generateReport();
    window.exportReport = (format) => this.exportReport(format);
  }

  /**
   * Apply quick date filter
   */
  applyQuickDateFilter(period) {
    const fromInput = document.getElementById('rp_from');
    const toInput = document.getElementById('rp_to');
    
    if (!fromInput || !toInput) return;

    const today = new Date();
    let fromDate, toDate;

    switch (period) {
      case 'today':
        fromDate = toDate = today;
        break;
      
      case 'yesterday':
        fromDate = toDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        fromDate = startOfWeek;
        toDate = today;
        break;
      
      case 'month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = today;
        break;
      
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        fromDate = new Date(today.getFullYear(), quarter * 3, 1);
        toDate = today;
        break;
      
      case 'year':
        fromDate = new Date(today.getFullYear(), 0, 1);
        toDate = today;
        break;
    }

    if (fromDate && toDate) {
      fromInput.value = fromDate.toISOString().split('T')[0];
      toInput.value = toDate.toISOString().split('T')[0];
      
      // Highlight selected period
      document.querySelectorAll('[data-period]').forEach(btn => {
        btn.classList.remove('brand');
      });
      document.querySelector(`[data-period="${period}"]`).classList.add('brand');
    }
  }

  /**
   * Update template description
   */
  updateTemplateDescription() {
    if (!this.templateManager) return;

    const template = this.templateManager.getTemplate(this.currentTemplate);
    if (template && template.description) {
      // Show template description in UI
      window.POS.critical.toast(`เลือกรายงาน: ${template.description}`);
    }
  }

  /**
   * Generate report with enhanced functionality
   */
  async generateReport() {
    try {
      window.POS.critical.loading(true);

      // Get form data
      const fromDate = document.getElementById('rp_from').value;
      const toDate = document.getElementById('rp_to').value;
      const template = this.currentTemplate;

      if (!fromDate || !toDate) {
        window.POS.critical.toast('กรุณาเลือกช่วงวันที่');
        return;
      }

      // Generate report using Google Apps Script
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler((result) => {
            this.handleReportSuccess(result, template);
          })
          .withFailureHandler((error) => {
            this.handleReportError(error);
          })
          .generateProfitReport(fromDate, toDate);
      } else {
        // Fallback for development/testing
        this.generateMockReport(fromDate, toDate, template);
      }

    } catch (error) {
      this.handleReportError(error);
    } finally {
      window.POS.critical.loading(false);
    }
  }

  /**
   * Handle successful report generation
   */
  handleReportSuccess(result, template) {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    // Store current report data
    this.currentReportData = result.data || [];
    
    // Display report
    reportContent.innerHTML = result.html || '<div class="muted">ไม่มีข้อมูล</div>';
    
    // Update statistics
    this.updateReportStatistics(this.currentReportData);
    
    window.POS.critical.toast('✅ สร้างรายงานเสร็จแล้ว');
  }

  /**
   * Handle report generation error
   */
  handleReportError(error) {
    console.error('Report generation failed:', error);
    
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
      reportContent.innerHTML = '<div class="muted">❌ ไม่สามารถสร้างรายงานได้</div>';
    }
    
    window.POS.critical.toast('❌ ไม่สามารถสร้างรายงานได้');
  }

  /**
   * Generate mock report for testing
   */
  generateMockReport(fromDate, toDate, template) {
    const mockData = [
      {
        date: fromDate,
        menu: 'กุ้งแซ่บ',
        quantity: 5,
        revenue: 600,
        cost: 300,
        profit: 300,
        platform: 'Walk-in'
      },
      {
        date: toDate,
        menu: 'ส้มตำ',
        quantity: 3,
        revenue: 180,
        cost: 90,
        profit: 90,
        platform: 'Grab'
      }
    ];

    // Generate HTML table
    const html = `
      <table class="table">
        <thead>
          <tr>
            <th>วันที่</th>
            <th>เมนู</th>
            <th>จำนวน</th>
            <th>ยอดขาย</th>
            <th>ต้นทุน</th>
            <th>กำไร</th>
          </tr>
        </thead>
        <tbody>
          ${mockData.map(item => `
            <tr>
              <td data-label="วันที่">${item.date}</td>
              <td data-label="เมนู">${item.menu}</td>
              <td data-label="จำนวน">${item.quantity}</td>
              <td data-label="ยอดขาย">${item.revenue.toLocaleString()} บาท</td>
              <td data-label="ต้นทุน">${item.cost.toLocaleString()} บาท</td>
              <td data-label="กำไร">${item.profit.toLocaleString()} บาท</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    this.handleReportSuccess({ data: mockData, html }, template);
  }

  /**
   * Update report statistics
   */
  updateReportStatistics(data) {
    if (!data || data.length === 0) {
      document.getElementById('stat-records').textContent = '0';
      document.getElementById('stat-revenue').textContent = '0 บาท';
      document.getElementById('stat-profit').textContent = '0 บาท';
      document.getElementById('stat-margin').textContent = '0%';
      return;
    }

    const totalRecords = data.length;
    const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalProfit = data.reduce((sum, item) => sum + (item.profit || 0), 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

    document.getElementById('stat-records').textContent = totalRecords.toLocaleString();
    document.getElementById('stat-revenue').textContent = totalRevenue.toLocaleString() + ' บาท';
    document.getElementById('stat-profit').textContent = totalProfit.toLocaleString() + ' บาท';
    document.getElementById('stat-margin').textContent = profitMargin.toFixed(1) + '%';
  }

  /**
   * Export report with enhanced options
   */
  async exportReport(format = 'csv') {
    if (!this.exportManager) {
      window.POS.critical.toast('ระบบส่งออกไม่พร้อมใช้งาน');
      return;
    }

    if (!this.currentReportData || this.currentReportData.length === 0) {
      window.POS.critical.toast('ไม่มีข้อมูลสำหรับส่งออก กรุณาสร้างรายงานก่อน');
      return;
    }

    try {
      await this.exportManager.exportReport(format, this.currentTemplate, this.currentReportData);
    } catch (error) {
      console.error('Export failed:', error);
      window.POS.critical.toast('❌ ไม่สามารถส่งออกได้');
    }
  }

  /**
   * Schedule report generation (placeholder for future implementation)
   */
  scheduleReport(templateName, schedule) {
    if (this.templateManager) {
      this.templateManager.scheduleReport(templateName, schedule);
    }
  }

  /**
   * Get current report data
   */
  getCurrentReportData() {
    return this.currentReportData;
  }

  /**
   * Set custom report data
   */
  setReportData(data) {
    this.currentReportData = data;
    this.updateReportStatistics(data);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReportsModule;
} else if (typeof window !== 'undefined') {
  window.ReportsModule = ReportsModule;
}