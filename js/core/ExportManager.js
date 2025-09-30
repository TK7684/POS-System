/**
 * Export Manager - Flexible data export system for POS reports
 * Supports CSV, Excel, and print-optimized formats with customizable templates
 */

class ExportManager {
  constructor() {
    this.templates = new Map();
    this.exportFormats = ['csv', 'excel', 'print'];
    this.initialized = false;
    
    // Initialize default templates
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize the export manager
   */
  init() {
    if (this.initialized) return;
    
    this.setupExportUI();
    this.initialized = true;
    
    console.log('Export Manager initialized');
  }

  /**
   * Initialize default export templates
   */
  initializeDefaultTemplates() {
    // Sales Report Template
    this.templates.set('sales', {
      name: 'รายงานการขาย',
      columns: [
        { key: 'date', label: 'วันที่', type: 'date' },
        { key: 'platform', label: 'แพลตฟอร์ม', type: 'text' },
        { key: 'menu', label: 'เมนู', type: 'text' },
        { key: 'quantity', label: 'จำนวน', type: 'number' },
        { key: 'unitPrice', label: 'ราคาต่อหน่วย', type: 'currency' },
        { key: 'revenue', label: 'ยอดขาย', type: 'currency' },
        { key: 'cost', label: 'ต้นทุน', type: 'currency' },
        { key: 'profit', label: 'กำไร', type: 'currency' },
        { key: 'profitMargin', label: 'อัตรากำไร (%)', type: 'percentage' }
      ],
      summary: ['revenue', 'cost', 'profit', 'quantity'],
      groupBy: ['date', 'platform', 'menu']
    });

    // Purchase Report Template
    this.templates.set('purchase', {
      name: 'รายงานการซื้อ',
      columns: [
        { key: 'date', label: 'วันที่', type: 'date' },
        { key: 'ingredient', label: 'วัตถุดิบ', type: 'text' },
        { key: 'quantity', label: 'จำนวน', type: 'number' },
        { key: 'unit', label: 'หน่วย', type: 'text' },
        { key: 'unitPrice', label: 'ราคาต่อหน่วย', type: 'currency' },
        { key: 'totalPrice', label: 'ราคารวม', type: 'currency' },
        { key: 'supplier', label: 'ผู้ขาย', type: 'text' },
        { key: 'actualYield', label: 'ผลผลิตจริง', type: 'number' }
      ],
      summary: ['totalPrice', 'quantity'],
      groupBy: ['date', 'ingredient', 'supplier']
    });

    // Inventory Report Template
    this.templates.set('inventory', {
      name: 'รายงานสต๊อก',
      columns: [
        { key: 'ingredient', label: 'วัตถุดิบ', type: 'text' },
        { key: 'currentStock', label: 'สต๊อกปัจจุบัน', type: 'number' },
        { key: 'unit', label: 'หน่วย', type: 'text' },
        { key: 'minStock', label: 'สต๊อกขั้นต่ำ', type: 'number' },
        { key: 'status', label: 'สถานะ', type: 'text' },
        { key: 'lastPurchase', label: 'ซื้อล่าสุด', type: 'date' },
        { key: 'avgCost', label: 'ต้นทุนเฉลี่ย', type: 'currency' },
        { key: 'totalValue', label: 'มูลค่ารวม', type: 'currency' }
      ],
      summary: ['totalValue', 'currentStock'],
      groupBy: ['status']
    });

    // Profit Analysis Template
    this.templates.set('profit', {
      name: 'รายงานวิเคราะห์กำไร',
      columns: [
        { key: 'period', label: 'ช่วงเวลา', type: 'text' },
        { key: 'revenue', label: 'ยอดขาย', type: 'currency' },
        { key: 'cogs', label: 'ต้นทุนขาย', type: 'currency' },
        { key: 'grossProfit', label: 'กำไรขั้นต้น', type: 'currency' },
        { key: 'grossMargin', label: 'อัตรากำไรขั้นต้น (%)', type: 'percentage' },
        { key: 'expenses', label: 'ค่าใช้จ่าย', type: 'currency' },
        { key: 'netProfit', label: 'กำไรสุทธิ', type: 'currency' },
        { key: 'netMargin', label: 'อัตรากำไรสุทธิ (%)', type: 'percentage' }
      ],
      summary: ['revenue', 'cogs', 'grossProfit', 'netProfit'],
      groupBy: ['period']
    });
  }

  /**
   * Setup export UI components
   */
  setupExportUI() {
    // Add export options to reports screen
    const reportsScreen = document.getElementById('reports-screen');
    if (!reportsScreen) return;

    // Find the export button and enhance it
    const existingExportBtn = reportsScreen.querySelector('button[onclick="exportReport()"]');
    if (existingExportBtn) {
      this.enhanceExportButton(existingExportBtn);
    }
  }

  /**
   * Enhance the existing export button with dropdown options
   */
  enhanceExportButton(button) {
    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.className = 'export-dropdown';
    dropdown.style.cssText = `
      position: relative;
      display: inline-block;
    `;

    // Replace button with dropdown
    button.parentNode.replaceChild(dropdown, button);

    // Create main export button
    const mainBtn = document.createElement('button');
    mainBtn.className = 'btn pill export-main-btn';
    mainBtn.innerHTML = '📤 ส่งออก <span style="margin-left: 4px;">▼</span>';
    mainBtn.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    // Create dropdown menu
    const menu = document.createElement('div');
    menu.className = 'export-menu';
    menu.style.cssText = `
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 200px;
      display: none;
      margin-top: 4px;
    `;

    // Export options
    const exportOptions = [
      { format: 'csv', label: '📄 CSV File', description: 'ไฟล์ CSV สำหรับ Excel' },
      { format: 'excel', label: '📊 Excel File', description: 'ไฟล์ Excel พร้อมฟอร์แมต' },
      { format: 'print', label: '🖨️ Print Report', description: 'รายงานสำหรับพิมพ์' }
    ];

    exportOptions.forEach(option => {
      const menuItem = document.createElement('button');
      menuItem.className = 'export-menu-item';
      menuItem.style.cssText = `
        width: 100%;
        padding: 12px 16px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 4px;
        transition: background-color 0.2s ease;
      `;
      
      menuItem.innerHTML = `
        <div style="font-weight: 600; font-size: var(--fs-sm);">${option.label}</div>
        <div style="font-size: var(--fs-xs); color: var(--muted);">${option.description}</div>
      `;

      menuItem.addEventListener('click', () => {
        this.exportReport(option.format);
        menu.style.display = 'none';
      });

      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = 'var(--bg)';
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });

      menu.appendChild(menuItem);
    });

    // Toggle dropdown
    mainBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = menu.style.display === 'block';
      menu.style.display = isVisible ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    dropdown.appendChild(mainBtn);
    dropdown.appendChild(menu);
  }

  /**
   * Export report in specified format
   */
  async exportReport(format = 'csv', templateName = 'sales', customData = null) {
    try {
      // Get report data
      const data = customData || this.extractCurrentReportData();
      if (!data || data.length === 0) {
        window.POS.critical.toast('ไม่มีข้อมูลสำหรับส่งออก');
        return;
      }

      // Get template
      const template = this.templates.get(templateName) || this.templates.get('sales');
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${template.name.replace(/\s+/g, '_')}_${timestamp}`;

      // Export based on format
      switch (format) {
        case 'csv':
          await this.exportToCSV(data, template, filename);
          break;
        case 'excel':
          await this.exportToExcel(data, template, filename);
          break;
        case 'print':
          await this.exportToPrint(data, template);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      window.POS.critical.toast(`✅ ส่งออก${format.toUpperCase()}เสร็จแล้ว`);
    } catch (error) {
      console.error('Export failed:', error);
      window.POS.critical.toast(`❌ ไม่สามารถส่งออกได้: ${error.message}`);
    }
  }

  /**
   * Extract current report data from DOM
   */
  extractCurrentReportData() {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return [];

    const rows = reportContent.querySelectorAll('.table tbody tr');
    const data = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 6) {
        data.push({
          date: cells[0].textContent.trim(),
          menu: cells[1].textContent.trim(),
          quantity: this.parseNumber(cells[2].textContent),
          revenue: this.parseCurrency(cells[3].textContent),
          cost: this.parseCurrency(cells[4].textContent),
          profit: this.parseCurrency(cells[5].textContent),
          platform: 'Mixed', // Default value
          unitPrice: 0, // Calculate if needed
          profitMargin: 0 // Calculate if needed
        });
      }
    });

    // Calculate derived fields
    data.forEach(item => {
      if (item.quantity > 0) {
        item.unitPrice = item.revenue / item.quantity;
      }
      if (item.revenue > 0) {
        item.profitMargin = (item.profit / item.revenue) * 100;
      }
    });

    return data;
  }

  /**
   * Export to CSV format
   */
  async exportToCSV(data, template, filename) {
    const headers = template.columns.map(col => col.label);
    const rows = data.map(item => 
      template.columns.map(col => this.formatCellValue(item[col.key], col.type))
    );

    // Add summary row if configured
    if (template.summary && template.summary.length > 0) {
      const summaryRow = template.columns.map(col => {
        if (template.summary.includes(col.key)) {
          const sum = data.reduce((total, item) => total + (parseFloat(item[col.key]) || 0), 0);
          return this.formatCellValue(sum, col.type);
        }
        return col.key === template.columns[0].key ? 'รวม' : '';
      });
      rows.push(summaryRow);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Add BOM for proper Thai character display
    const blob = new Blob(['\ufeff' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    this.downloadFile(blob, `${filename}.csv`);
  }

  /**
   * Export to Excel format (using HTML table approach)
   */
  async exportToExcel(data, template, filename) {
    // Create HTML table with Excel-compatible formatting
    let html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .currency { text-align: right; }
            .number { text-align: right; }
            .percentage { text-align: right; }
            .summary { background-color: #e8f4f8; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${template.name}</h2>
          <p>สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
          <table>
            <thead>
              <tr>
    `;

    // Add headers
    template.columns.forEach(col => {
      html += `<th>${col.label}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Add data rows
    data.forEach(item => {
      html += '<tr>';
      template.columns.forEach(col => {
        const value = this.formatCellValue(item[col.key], col.type);
        const cssClass = col.type === 'currency' ? 'currency' : 
                        col.type === 'number' ? 'number' : 
                        col.type === 'percentage' ? 'percentage' : '';
        html += `<td class="${cssClass}">${value}</td>`;
      });
      html += '</tr>';
    });

    // Add summary row if configured
    if (template.summary && template.summary.length > 0) {
      html += '<tr class="summary">';
      template.columns.forEach(col => {
        if (template.summary.includes(col.key)) {
          const sum = data.reduce((total, item) => total + (parseFloat(item[col.key]) || 0), 0);
          const value = this.formatCellValue(sum, col.type);
          const cssClass = col.type === 'currency' ? 'currency' : 
                          col.type === 'number' ? 'number' : 
                          col.type === 'percentage' ? 'percentage' : '';
          html += `<td class="${cssClass}">${value}</td>`;
        } else {
          html += `<td>${col.key === template.columns[0].key ? 'รวม' : ''}</td>`;
        }
      });
      html += '</tr>';
    }

    html += '</tbody></table></body></html>';

    // Create Excel file
    const blob = new Blob([html], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    
    this.downloadFile(blob, `${filename}.xls`);
  }

  /**
   * Export to print-optimized format
   */
  async exportToPrint(data, template) {
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้');
    }

    // Generate print-optimized HTML
    const html = this.generatePrintHTML(data, template);
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  }

  /**
   * Generate print-optimized HTML
   */
  generatePrintHTML(data, template) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH');
    const timeStr = now.toLocaleTimeString('th-TH');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${template.name}</title>
          <style>
            @media print {
              @page { margin: 1cm; size: A4; }
              body { margin: 0; }
            }
            body {
              font-family: 'Sarabun', Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              font-weight: bold;
            }
            .header .subtitle {
              margin: 5px 0;
              color: #666;
            }
            .meta-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 11px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
              font-size: 11px;
            }
            td {
              font-size: 10px;
            }
            .currency, .number, .percentage {
              text-align: right;
            }
            .summary {
              background-color: #e8f4f8;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            .page-break {
              page-break-before: always;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>POS ร้านกุ้งแซ่บ</h1>
            <div class="subtitle">${template.name}</div>
          </div>
          
          <div class="meta-info">
            <div>วันที่พิมพ์: ${dateStr} ${timeStr}</div>
            <div>จำนวนรายการ: ${data.length} รายการ</div>
          </div>

          <table>
            <thead>
              <tr>
                ${template.columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  ${template.columns.map(col => {
                    const value = this.formatCellValue(item[col.key], col.type);
                    const cssClass = col.type === 'currency' ? 'currency' : 
                                    col.type === 'number' ? 'number' : 
                                    col.type === 'percentage' ? 'percentage' : '';
                    return `<td class="${cssClass}">${value}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
              ${template.summary && template.summary.length > 0 ? `
                <tr class="summary">
                  ${template.columns.map(col => {
                    if (template.summary.includes(col.key)) {
                      const sum = data.reduce((total, item) => total + (parseFloat(item[col.key]) || 0), 0);
                      const value = this.formatCellValue(sum, col.type);
                      const cssClass = col.type === 'currency' ? 'currency' : 
                                      col.type === 'number' ? 'number' : 
                                      col.type === 'percentage' ? 'percentage' : '';
                      return `<td class="${cssClass}">${value}</td>`;
                    } else {
                      return `<td>${col.key === template.columns[0].key ? 'รวม' : ''}</td>`;
                    }
                  }).join('')}
                </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="footer">
            <div>รายงานนี้สร้างโดยระบบ POS ร้านกุ้งแซ่บ</div>
            <div>หน้า 1 จาก 1</div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Format cell value based on type
   */
  formatCellValue(value, type) {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'currency':
        return parseFloat(value).toLocaleString('th-TH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' บาท';
      
      case 'number':
        return parseFloat(value).toLocaleString('th-TH');
      
      case 'percentage':
        return parseFloat(value).toFixed(2) + '%';
      
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString('th-TH');
        } else if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date.toLocaleDateString('th-TH');
        }
        return value;
      
      default:
        return String(value);
    }
  }

  /**
   * Parse number from text
   */
  parseNumber(text) {
    const cleaned = String(text).replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Parse currency from text
   */
  parseCurrency(text) {
    const cleaned = String(text).replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Download file
   */
  downloadFile(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Add custom template
   */
  addTemplate(name, template) {
    this.templates.set(name, template);
  }

  /**
   * Get available templates
   */
  getTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * Get template by name
   */
  getTemplate(name) {
    return this.templates.get(name);
  }

  /**
   * Schedule report generation (for future implementation)
   */
  scheduleReport(templateName, schedule, options = {}) {
    // This would integrate with a scheduling system
    console.log('Scheduled report:', { templateName, schedule, options });
    window.POS.critical.toast('การจัดตารางรายงานจะพัฒนาในอนาคต');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportManager;
} else if (typeof window !== 'undefined') {
  window.ExportManager = ExportManager;
}