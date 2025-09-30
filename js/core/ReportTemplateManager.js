/**
 * Report Template Manager - Manages customizable report templates
 * Provides flexible template system for generating various types of reports
 */

class ReportTemplateManager {
  constructor() {
    this.templates = new Map();
    this.customTemplates = new Map();
    this.initialized = false;
    
    // Initialize default templates
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize the template manager
   */
  init() {
    if (this.initialized) return;
    
    this.loadCustomTemplates();
    this.initialized = true;
    
    console.log('Report Template Manager initialized');
  }

  /**
   * Initialize default report templates
   */
  initializeDefaultTemplates() {
    // Daily Sales Summary Template
    this.templates.set('daily-sales', {
      id: 'daily-sales',
      name: 'สรุปยอดขายรายวัน',
      description: 'รายงานสรุปยอดขายแยกตามวัน',
      category: 'sales',
      fields: [
        { key: 'date', label: 'วันที่', type: 'date', required: true },
        { key: 'totalOrders', label: 'จำนวนออเดอร์', type: 'number', aggregate: 'sum' },
        { key: 'totalRevenue', label: 'ยอดขายรวม', type: 'currency', aggregate: 'sum' },
        { key: 'totalCost', label: 'ต้นทุนรวม', type: 'currency', aggregate: 'sum' },
        { key: 'grossProfit', label: 'กำไรขั้นต้น', type: 'currency', aggregate: 'sum' },
        { key: 'profitMargin', label: 'อัตรากำไร (%)', type: 'percentage', calculated: true }
      ],
      groupBy: ['date'],
      sortBy: [{ field: 'date', direction: 'desc' }],
      filters: [
        { key: 'dateRange', label: 'ช่วงวันที่', type: 'daterange', required: true },
        { key: 'platform', label: 'แพลตฟอร์ม', type: 'select', options: ['all', 'walkin', 'grab', 'lineman', 'shopee', 'foodpanda'] }
      ]
    });

    // Menu Performance Template
    this.templates.set('menu-performance', {
      id: 'menu-performance',
      name: 'ประสิทธิภาพเมนู',
      description: 'รายงานการขายแยกตามเมนู',
      category: 'sales',
      fields: [
        { key: 'menuName', label: 'ชื่อเมนู', type: 'text', required: true },
        { key: 'totalSold', label: 'จำนวนที่ขาย', type: 'number', aggregate: 'sum' },
        { key: 'revenue', label: 'ยอดขาย', type: 'currency', aggregate: 'sum' },
        { key: 'avgPrice', label: 'ราคาเฉลี่ย', type: 'currency', calculated: true },
        { key: 'cost', label: 'ต้นทุน', type: 'currency', aggregate: 'sum' },
        { key: 'profit', label: 'กำไร', type: 'currency', aggregate: 'sum' },
        { key: 'profitMargin', label: 'อัตรากำไร (%)', type: 'percentage', calculated: true },
        { key: 'popularity', label: 'ความนิยม (%)', type: 'percentage', calculated: true }
      ],
      groupBy: ['menuName'],
      sortBy: [{ field: 'totalSold', direction: 'desc' }],
      filters: [
        { key: 'dateRange', label: 'ช่วงวันที่', type: 'daterange', required: true },
        { key: 'minSales', label: 'ยอดขายขั้นต่ำ', type: 'number' }
      ]
    });

    // Platform Comparison Template
    this.templates.set('platform-comparison', {
      id: 'platform-comparison',
      name: 'เปรียบเทียบแพลตฟอร์ม',
      description: 'รายงานเปรียบเทียบยอดขายแยกตามแพลตฟอร์ม',
      category: 'sales',
      fields: [
        { key: 'platform', label: 'แพลตฟอร์ม', type: 'text', required: true },
        { key: 'orderCount', label: 'จำนวนออเดอร์', type: 'number', aggregate: 'sum' },
        { key: 'revenue', label: 'ยอดขาย', type: 'currency', aggregate: 'sum' },
        { key: 'avgOrderValue', label: 'มูลค่าเฉลี่ยต่อออเดอร์', type: 'currency', calculated: true },
        { key: 'marketShare', label: 'ส่วนแบ่งตลาด (%)', type: 'percentage', calculated: true },
        { key: 'growth', label: 'อัตราการเติบโต (%)', type: 'percentage', calculated: true }
      ],
      groupBy: ['platform'],
      sortBy: [{ field: 'revenue', direction: 'desc' }],
      filters: [
        { key: 'dateRange', label: 'ช่วงวันที่', type: 'daterange', required: true },
        { key: 'compareWith', label: 'เปรียบเทียบกับ', type: 'daterange' }
      ]
    });

    // Inventory Status Template
    this.templates.set('inventory-status', {
      id: 'inventory-status',
      name: 'สถานะสต๊อกวัตถุดิบ',
      description: 'รายงานสถานะสต๊อกและการเคลื่อนไหวของวัตถุดิบ',
      category: 'inventory',
      fields: [
        { key: 'ingredientName', label: 'ชื่อวัตถุดิบ', type: 'text', required: true },
        { key: 'currentStock', label: 'สต๊อกปัจจุบัน', type: 'number' },
        { key: 'unit', label: 'หน่วย', type: 'text' },
        { key: 'minStock', label: 'สต๊อกขั้นต่ำ', type: 'number' },
        { key: 'maxStock', label: 'สต๊อกสูงสุด', type: 'number' },
        { key: 'reorderPoint', label: 'จุดสั่งซื้อ', type: 'number', calculated: true },
        { key: 'daysRemaining', label: 'วันที่เหลือ', type: 'number', calculated: true },
        { key: 'status', label: 'สถานะ', type: 'text', calculated: true },
        { key: 'lastPurchase', label: 'ซื้อล่าสุด', type: 'date' },
        { key: 'avgCost', label: 'ต้นทุนเฉลี่ย', type: 'currency' }
      ],
      groupBy: ['status'],
      sortBy: [{ field: 'daysRemaining', direction: 'asc' }],
      filters: [
        { key: 'status', label: 'สถานะ', type: 'select', options: ['all', 'low', 'normal', 'high', 'out'] },
        { key: 'category', label: 'หมวดหมู่', type: 'select' }
      ]
    });

    // Purchase History Template
    this.templates.set('purchase-history', {
      id: 'purchase-history',
      name: 'ประวัติการซื้อ',
      description: 'รายงานประวัติการซื้อวัตถุดิบ',
      category: 'purchase',
      fields: [
        { key: 'date', label: 'วันที่', type: 'date', required: true },
        { key: 'ingredientName', label: 'วัตถุดิบ', type: 'text', required: true },
        { key: 'quantity', label: 'จำนวน', type: 'number' },
        { key: 'unit', label: 'หน่วย', type: 'text' },
        { key: 'unitPrice', label: 'ราคาต่อหน่วย', type: 'currency' },
        { key: 'totalPrice', label: 'ราคารวม', type: 'currency' },
        { key: 'supplier', label: 'ผู้ขาย', type: 'text' },
        { key: 'actualYield', label: 'ผลผลิตจริง', type: 'number' },
        { key: 'yieldRate', label: 'อัตราผลผลิต (%)', type: 'percentage', calculated: true }
      ],
      groupBy: ['date', 'ingredientName'],
      sortBy: [{ field: 'date', direction: 'desc' }],
      filters: [
        { key: 'dateRange', label: 'ช่วงวันที่', type: 'daterange', required: true },
        { key: 'ingredient', label: 'วัตถุดิบ', type: 'select' },
        { key: 'supplier', label: 'ผู้ขาย', type: 'text' }
      ]
    });

    // Cost Analysis Template
    this.templates.set('cost-analysis', {
      id: 'cost-analysis',
      name: 'วิเคราะห์ต้นทุน',
      description: 'รายงานวิเคราะห์ต้นทุนและความคุ้มค่า',
      category: 'analysis',
      fields: [
        { key: 'period', label: 'ช่วงเวลา', type: 'text', required: true },
        { key: 'totalRevenue', label: 'ยอดขายรวม', type: 'currency', aggregate: 'sum' },
        { key: 'materialCost', label: 'ต้นทุนวัตถุดิบ', type: 'currency', aggregate: 'sum' },
        { key: 'laborCost', label: 'ต้นทุนแรงงาน', type: 'currency', aggregate: 'sum' },
        { key: 'overheadCost', label: 'ค่าใช้จ่ายอื่น', type: 'currency', aggregate: 'sum' },
        { key: 'totalCost', label: 'ต้นทุนรวม', type: 'currency', calculated: true },
        { key: 'grossProfit', label: 'กำไรขั้นต้น', type: 'currency', calculated: true },
        { key: 'netProfit', label: 'กำไรสุทธิ', type: 'currency', calculated: true },
        { key: 'grossMargin', label: 'อัตรากำไรขั้นต้น (%)', type: 'percentage', calculated: true },
        { key: 'netMargin', label: 'อัตรากำไรสุทธิ (%)', type: 'percentage', calculated: true }
      ],
      groupBy: ['period'],
      sortBy: [{ field: 'period', direction: 'desc' }],
      filters: [
        { key: 'dateRange', label: 'ช่วงวันที่', type: 'daterange', required: true },
        { key: 'groupBy', label: 'จัดกลุ่มตาม', type: 'select', options: ['day', 'week', 'month', 'quarter'] }
      ]
    });
  }

  /**
   * Load custom templates from localStorage
   */
  loadCustomTemplates() {
    try {
      const saved = localStorage.getItem('pos-custom-templates');
      if (saved) {
        const customTemplates = JSON.parse(saved);
        Object.entries(customTemplates).forEach(([key, template]) => {
          this.customTemplates.set(key, template);
        });
      }
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    }
  }

  /**
   * Save custom templates to localStorage
   */
  saveCustomTemplates() {
    try {
      const customTemplatesObj = {};
      this.customTemplates.forEach((template, key) => {
        customTemplatesObj[key] = template;
      });
      localStorage.setItem('pos-custom-templates', JSON.stringify(customTemplatesObj));
    } catch (error) {
      console.error('Failed to save custom templates:', error);
    }
  }

  /**
   * Get all available templates
   */
  getAllTemplates() {
    const allTemplates = new Map();
    
    // Add default templates
    this.templates.forEach((template, key) => {
      allTemplates.set(key, { ...template, isCustom: false });
    });
    
    // Add custom templates
    this.customTemplates.forEach((template, key) => {
      allTemplates.set(key, { ...template, isCustom: true });
    });
    
    return allTemplates;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category) {
    const allTemplates = this.getAllTemplates();
    const filtered = new Map();
    
    allTemplates.forEach((template, key) => {
      if (template.category === category) {
        filtered.set(key, template);
      }
    });
    
    return filtered;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || this.customTemplates.get(templateId);
  }

  /**
   * Create custom template
   */
  createCustomTemplate(templateData) {
    const template = {
      id: templateData.id || `custom-${Date.now()}`,
      name: templateData.name,
      description: templateData.description || '',
      category: templateData.category || 'custom',
      fields: templateData.fields || [],
      groupBy: templateData.groupBy || [],
      sortBy: templateData.sortBy || [],
      filters: templateData.filters || [],
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    this.customTemplates.set(template.id, template);
    this.saveCustomTemplates();
    
    return template;
  }

  /**
   * Update custom template
   */
  updateCustomTemplate(templateId, updates) {
    const template = this.customTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      modified: new Date().toISOString()
    };

    this.customTemplates.set(templateId, updatedTemplate);
    this.saveCustomTemplates();
    
    return updatedTemplate;
  }

  /**
   * Delete custom template
   */
  deleteCustomTemplate(templateId) {
    if (!this.customTemplates.has(templateId)) {
      throw new Error(`Template ${templateId} not found`);
    }

    this.customTemplates.delete(templateId);
    this.saveCustomTemplates();
  }

  /**
   * Generate report data using template
   */
  async generateReport(templateId, filters = {}, rawData = null) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Get data based on template category
    const data = rawData || await this.fetchDataForTemplate(template, filters);
    
    // Process data according to template configuration
    const processedData = this.processTemplateData(data, template, filters);
    
    return {
      template,
      data: processedData,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters,
        recordCount: processedData.length
      }
    };
  }

  /**
   * Fetch data for template (placeholder - would integrate with actual data source)
   */
  async fetchDataForTemplate(template, filters) {
    // This would integrate with the actual data fetching system
    // For now, return empty array as placeholder
    console.log('Fetching data for template:', template.id, 'with filters:', filters);
    return [];
  }

  /**
   * Process template data according to configuration
   */
  processTemplateData(rawData, template, filters) {
    let processedData = [...rawData];

    // Apply filters
    processedData = this.applyFilters(processedData, template.filters, filters);

    // Group data if specified
    if (template.groupBy && template.groupBy.length > 0) {
      processedData = this.groupData(processedData, template.groupBy);
    }

    // Calculate derived fields
    processedData = this.calculateDerivedFields(processedData, template.fields);

    // Apply sorting
    if (template.sortBy && template.sortBy.length > 0) {
      processedData = this.sortData(processedData, template.sortBy);
    }

    return processedData;
  }

  /**
   * Apply filters to data
   */
  applyFilters(data, templateFilters, appliedFilters) {
    return data.filter(item => {
      return templateFilters.every(filter => {
        const filterValue = appliedFilters[filter.key];
        if (!filterValue || filterValue === 'all') return true;

        const itemValue = item[filter.key];
        
        switch (filter.type) {
          case 'daterange':
            if (filterValue.start && filterValue.end) {
              const itemDate = new Date(itemValue);
              const startDate = new Date(filterValue.start);
              const endDate = new Date(filterValue.end);
              return itemDate >= startDate && itemDate <= endDate;
            }
            return true;
          
          case 'select':
            return itemValue === filterValue;
          
          case 'number':
            return parseFloat(itemValue) >= parseFloat(filterValue);
          
          case 'text':
            return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
          
          default:
            return true;
        }
      });
    });
  }

  /**
   * Group data by specified fields
   */
  groupData(data, groupByFields) {
    const grouped = {};
    
    data.forEach(item => {
      const key = groupByFields.map(field => item[field]).join('|');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    // Convert to array and aggregate
    return Object.values(grouped).map(group => {
      const aggregated = { ...group[0] };
      
      // Aggregate numeric fields
      group.slice(1).forEach(item => {
        Object.keys(item).forEach(key => {
          if (typeof item[key] === 'number' && typeof aggregated[key] === 'number') {
            aggregated[key] += item[key];
          }
        });
      });
      
      return aggregated;
    });
  }

  /**
   * Calculate derived fields
   */
  calculateDerivedFields(data, fields) {
    return data.map(item => {
      const calculated = { ...item };
      
      fields.forEach(field => {
        if (field.calculated) {
          switch (field.key) {
            case 'profitMargin':
              if (calculated.revenue && calculated.revenue > 0) {
                calculated.profitMargin = ((calculated.profit || 0) / calculated.revenue) * 100;
              }
              break;
            
            case 'avgPrice':
              if (calculated.totalSold && calculated.totalSold > 0) {
                calculated.avgPrice = (calculated.revenue || 0) / calculated.totalSold;
              }
              break;
            
            case 'avgOrderValue':
              if (calculated.orderCount && calculated.orderCount > 0) {
                calculated.avgOrderValue = (calculated.revenue || 0) / calculated.orderCount;
              }
              break;
            
            case 'yieldRate':
              if (calculated.quantity && calculated.quantity > 0) {
                calculated.yieldRate = ((calculated.actualYield || 0) / calculated.quantity) * 100;
              }
              break;
            
            case 'daysRemaining':
              // This would calculate based on usage patterns
              calculated.daysRemaining = Math.floor(calculated.currentStock / (calculated.dailyUsage || 1));
              break;
            
            case 'status':
              if (calculated.currentStock <= calculated.minStock) {
                calculated.status = 'low';
              } else if (calculated.currentStock >= (calculated.maxStock || Infinity)) {
                calculated.status = 'high';
              } else {
                calculated.status = 'normal';
              }
              break;
          }
        }
      });
      
      return calculated;
    });
  }

  /**
   * Sort data by specified criteria
   */
  sortData(data, sortBy) {
    return data.sort((a, b) => {
      for (const sort of sortBy) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Validate template structure
   */
  validateTemplate(template) {
    const errors = [];
    
    if (!template.id) errors.push('Template ID is required');
    if (!template.name) errors.push('Template name is required');
    if (!template.fields || !Array.isArray(template.fields)) errors.push('Template fields must be an array');
    
    template.fields?.forEach((field, index) => {
      if (!field.key) errors.push(`Field ${index}: key is required`);
      if (!field.label) errors.push(`Field ${index}: label is required`);
      if (!field.type) errors.push(`Field ${index}: type is required`);
    });
    
    return errors;
  }

  /**
   * Export template configuration
   */
  exportTemplate(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const exportData = {
      ...template,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template-${templateId}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }

  /**
   * Import template configuration
   */
  async importTemplate(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const templateData = JSON.parse(e.target.result);
          const errors = this.validateTemplate(templateData);
          
          if (errors.length > 0) {
            reject(new Error(`Template validation failed: ${errors.join(', ')}`));
            return;
          }
          
          // Generate new ID to avoid conflicts
          templateData.id = `imported-${Date.now()}`;
          templateData.imported = true;
          templateData.importedAt = new Date().toISOString();
          
          const template = this.createCustomTemplate(templateData);
          resolve(template);
        } catch (error) {
          reject(new Error(`Failed to parse template file: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read template file'));
      reader.readAsText(file);
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReportTemplateManager;
} else if (typeof window !== 'undefined') {
  window.ReportTemplateManager = ReportTemplateManager;
} 