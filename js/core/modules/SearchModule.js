/**
 * Search Module - Advanced search and filtering functionality
 * Implements real-time search with instant results, smart filtering, and search result ranking
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

class SearchModule {
  constructor() {
    this.initialized = false;
    this.searchIndex = new Map();
    this.searchHistory = [];
    this.savedSearches = new Map();
    this.filterPresets = new Map();
    this.searchCache = new Map();
    this.debounceTimer = null;
    this.maxHistoryItems = 20;
    this.maxCacheItems = 50;
    
    // Search configuration
    this.config = {
      minSearchLength: 1,
      debounceDelay: 150,
      maxResults: 100,
      fuzzyThreshold: 0.6,
      enableFuzzySearch: true,
      enableSearchHistory: true,
      enableAutoComplete: true
    };
  }

  /**
   * Initialize search module
   */
  init() {
    if (this.initialized) return;
    
    this.loadSearchData();
    this.loadSearchHistory();
    this.loadSavedSearches();
    this.loadFilterPresets();
    this.setupDefaultFilters();
    this.initialized = true;
    
    console.log('Search module initialized');
  }

  /**
   * Build search index for all searchable data
   */
  async buildSearchIndex() {
    try {
      // Clear existing index
      this.searchIndex.clear();
      
      // Index ingredients
      await this.indexIngredients();
      
      // Index menus
      await this.indexMenus();
      
      // Index transactions (sales and purchases)
      await this.indexTransactions();
      
      console.log(`Search index built with ${this.searchIndex.size} items`);
      
      // Cache the index
      this.cacheSearchIndex();
      
    } catch (error) {
      console.error('Failed to build search index:', error);
      throw error;
    }
  } 
 /**
   * Index ingredients for search
   */
  async indexIngredients() {
    try {
      // Get ingredients data from API or cache
      const ingredients = await this.getIngredientsData();
      
      ingredients.forEach(ingredient => {
        const searchTerms = this.generateSearchTerms([
          ingredient.id,
          ingredient.name,
          ingredient.stockU,
          ingredient.buyU
        ]);
        
        this.searchIndex.set(`ingredient_${ingredient.id}`, {
          type: 'ingredient',
          id: ingredient.id,
          name: ingredient.name,
          displayName: `${ingredient.name} (${ingredient.id})`,
          searchTerms,
          data: ingredient,
          category: 'วัตถุดิบ',
          relevanceScore: this.calculateRelevanceScore('ingredient', ingredient)
        });
      });
      
    } catch (error) {
      console.warn('Failed to index ingredients:', error);
    }
  }

  /**
   * Index menus for search
   */
  async indexMenus() {
    try {
      // Get menus data from API or cache
      const menus = await this.getMenusData();
      
      menus.forEach(menu => {
        const searchTerms = this.generateSearchTerms([
          menu.menu_id,
          menu.name
        ]);
        
        this.searchIndex.set(`menu_${menu.menu_id}`, {
          type: 'menu',
          id: menu.menu_id,
          name: menu.name,
          displayName: `${menu.name} (${menu.menu_id})`,
          searchTerms,
          data: menu,
          category: 'เมนู',
          relevanceScore: this.calculateRelevanceScore('menu', menu)
        });
      });
      
    } catch (error) {
      console.warn('Failed to index menus:', error);
    }
  }

  /**
   * Index transactions for search
   */
  async indexTransactions() {
    try {
      // Get recent transactions (limit for performance)
      const transactions = await this.getTransactionsData(100);
      
      transactions.forEach(transaction => {
        const searchTerms = this.generateSearchTerms([
          transaction.id,
          transaction.type,
          transaction.date,
          transaction.platform,
          transaction.menu_id,
          transaction.ingredient_id,
          transaction.note
        ]);
        
        this.searchIndex.set(`transaction_${transaction.id}`, {
          type: 'transaction',
          id: transaction.id,
          name: this.getTransactionDisplayName(transaction),
          displayName: this.getTransactionDisplayName(transaction),
          searchTerms,
          data: transaction,
          category: transaction.type === 'sale' ? 'การขาย' : 'การซื้อ',
          relevanceScore: this.calculateRelevanceScore('transaction', transaction)
        });
      });
      
    } catch (error) {
      console.warn('Failed to index transactions:', error);
    }
  }  /**
   
* Perform real-time search with instant results
   * Requirement: 9.1, 9.4
   */
  search(query, options = {}) {
    const {
      types = ['ingredient', 'menu', 'transaction'],
      categories = [],
      filters = {},
      maxResults = this.config.maxResults,
      enableFuzzy = this.config.enableFuzzySearch,
      sortBy = 'relevance'
    } = options;

    // Validate query
    if (!query || query.length < this.config.minSearchLength) {
      return {
        results: [],
        suggestions: this.getSearchSuggestions(query),
        totalCount: 0,
        query,
        executionTime: 0
      };
    }

    const startTime = performance.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(query, options);
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      return {
        ...cached,
        fromCache: true,
        executionTime: performance.now() - startTime
      };
    }

    // Normalize query
    const normalizedQuery = this.normalizeSearchQuery(query);
    const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);

    // Search in index
    const results = [];
    
    for (const [key, item] of this.searchIndex) {
      // Filter by type
      if (!types.includes(item.type)) continue;
      
      // Filter by category
      if (categories.length > 0 && !categories.includes(item.category)) continue;
      
      // Apply custom filters
      if (!this.applyFilters(item, filters)) continue;
      
      // Calculate match score
      const matchScore = this.calculateMatchScore(item, queryTerms, enableFuzzy);
      
      if (matchScore > 0) {
        results.push({
          ...item,
          matchScore,
          highlightedName: this.highlightMatches(item.name, queryTerms)
        });
      }
    }

    // Sort results
    this.sortSearchResults(results, sortBy);
    
    // Limit results
    const limitedResults = results.slice(0, maxResults);
    
    // Cache results
    const searchResult = {
      results: limitedResults,
      suggestions: this.getSearchSuggestions(query, limitedResults),
      totalCount: results.length,
      query,
      executionTime: performance.now() - startTime
    };
    
    this.cacheSearchResult(cacheKey, searchResult);
    
    // Add to search history
    if (this.config.enableSearchHistory && limitedResults.length > 0) {
      this.addToSearchHistory(query, limitedResults.length);
    }
    
    return searchResult;
  }  /**

   * Get search suggestions and auto-complete
   * Requirement: 9.1, 9.6
   */
  getSearchSuggestions(query, currentResults = []) {
    const suggestions = [];
    
    // Add search history suggestions
    if (this.config.enableSearchHistory) {
      const historySuggestions = this.searchHistory
        .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map(item => ({
          type: 'history',
          text: item.query,
          count: item.resultCount,
          lastUsed: item.timestamp
        }));
      
      suggestions.push(...historySuggestions);
    }
    
    // Add auto-complete suggestions from index
    if (query.length >= 2) {
      const autoComplete = [];
      const normalizedQuery = this.normalizeSearchQuery(query);
      
      for (const [key, item] of this.searchIndex) {
        // Check if any search term starts with query
        const matchingTerms = item.searchTerms.filter(term => 
          term.toLowerCase().startsWith(normalizedQuery.toLowerCase())
        );
        
        if (matchingTerms.length > 0) {
          autoComplete.push({
            type: 'autocomplete',
            text: matchingTerms[0],
            category: item.category,
            itemType: item.type
          });
        }
        
        if (autoComplete.length >= 10) break;
      }
      
      suggestions.push(...autoComplete);
    }
    
    // Add category suggestions
    if (currentResults.length === 0 && query.length >= 3) {
      const categorySuggestions = [
        { type: 'category', text: 'วัตถุดิบ', filter: { types: ['ingredient'] } },
        { type: 'category', text: 'เมนู', filter: { types: ['menu'] } },
        { type: 'category', text: 'การขาย', filter: { types: ['transaction'], categories: ['การขาย'] } },
        { type: 'category', text: 'การซื้อ', filter: { types: ['transaction'], categories: ['การซื้อ'] } }
      ];
      
      suggestions.push(...categorySuggestions);
    }
    
    return suggestions.slice(0, 15);
  }  /**
 
  * Create advanced filtering system
   * Requirement: 9.3, 9.5
   */
  createAdvancedFilter(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Filter container not found:', containerId);
      return;
    }

    const filterHTML = `
      <div class="advanced-filter">
        <div class="filter-header">
          <h3>ตัวกรองขั้นสูง</h3>
          <div class="filter-actions">
            <button class="btn ghost" onclick="searchModule.clearAllFilters()">ล้างทั้งหมด</button>
            <button class="btn ghost" onclick="searchModule.saveCurrentFilter()">บันทึกตัวกรอง</button>
          </div>
        </div>
        
        <div class="filter-presets">
          <label class="label">ตัวกรองที่บันทึกไว้:</label>
          <div class="preset-buttons" id="filter-presets">
            <!-- Preset buttons will be inserted here -->
          </div>
        </div>
        
        <div class="filter-sections">
          <!-- Type Filter -->
          <div class="filter-section">
            <label class="label">ประเภทข้อมูล:</label>
            <div class="filter-checkboxes">
              <label class="checkbox-label">
                <input type="checkbox" name="type-filter" value="ingredient" checked>
                <span>วัตถุดิบ</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="type-filter" value="menu" checked>
                <span>เมนู</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="type-filter" value="transaction" checked>
                <span>ธุรกรรม</span>
              </label>
            </div>
          </div>
          
          <!-- Category Filter -->
          <div class="filter-section">
            <label class="label">หมวดหมู่:</label>
            <div class="filter-checkboxes">
              <label class="checkbox-label">
                <input type="checkbox" name="category-filter" value="วัตถุดิบ" checked>
                <span>วัตถุดิบ</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="category-filter" value="เมนู" checked>
                <span>เมนู</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="category-filter" value="การขาย" checked>
                <span>การขาย</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="category-filter" value="การซื้อ" checked>
                <span>การซื้อ</span>
              </label>
            </div>
          </div>
          
          <!-- Date Range Filter -->
          <div class="filter-section">
            <label class="label">ช่วงวันที่:</label>
            <div class="date-range-filter">
              <input type="date" id="filter-date-from" class="input" placeholder="จากวันที่">
              <span>ถึง</span>
              <input type="date" id="filter-date-to" class="input" placeholder="ถึงวันที่">
            </div>
          </div>
          
          <!-- Quick Date Filters -->
          <div class="filter-section">
            <label class="label">ช่วงเวลาด่วน:</label>
            <div class="quick-date-filters">
              <button class="btn ghost pill" onclick="searchModule.setQuickDateFilter('today')">วันนี้</button>
              <button class="btn ghost pill" onclick="searchModule.setQuickDateFilter('week')">สัปดาห์นี้</button>
              <button class="btn ghost pill" onclick="searchModule.setQuickDateFilter('month')">เดือนนี้</button>
              <button class="btn ghost pill" onclick="searchModule.setQuickDateFilter('quarter')">ไตรมาสนี้</button>
            </div>
          </div>
          
          <!-- Platform Filter (for transactions) -->
          <div class="filter-section">
            <label class="label">แพลตฟอร์ม:</label>
            <select class="select" id="filter-platform" multiple>
              <option value="">ทั้งหมด</option>
              <option value="walkin">Walk-in</option>
              <option value="grab">Grab</option>
              <option value="lineman">Line Man</option>
              <option value="shopee">Shopee Food</option>
              <option value="foodpanda">Foodpanda</option>
            </select>
          </div>
          
          <!-- Amount Range Filter -->
          <div class="filter-section">
            <label class="label">ช่วงจำนวนเงิน:</label>
            <div class="amount-range-filter">
              <input type="number" id="filter-amount-min" class="input" placeholder="จำนวนขั้นต่ำ" min="0" step="0.01">
              <span>ถึง</span>
              <input type="number" id="filter-amount-max" class="input" placeholder="จำนวนสูงสุด" min="0" step="0.01">
            </div>
          </div>
        </div>
        
        <div class="filter-footer">
          <button class="btn brand" onclick="searchModule.applyAdvancedFilter()">ใช้ตัวกรอง</button>
          <button class="btn ghost" onclick="searchModule.resetAdvancedFilter()">รีเซ็ต</button>
        </div>
      </div>
    `;

    container.innerHTML = filterHTML;
    this.setupFilterEventListeners();
    this.loadFilterPresetButtons();
  } 
 /**
   * Setup event listeners for filter controls
   */
  setupFilterEventListeners() {
    // Type filter checkboxes
    document.querySelectorAll('input[name="type-filter"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateFilterIndicators();
      });
    });

    // Category filter checkboxes
    document.querySelectorAll('input[name="category-filter"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateFilterIndicators();
      });
    });

    // Date range inputs
    const dateFromInput = document.getElementById('filter-date-from');
    const dateToInput = document.getElementById('filter-date-to');
    
    if (dateFromInput) {
      dateFromInput.addEventListener('change', () => {
        this.updateFilterIndicators();
      });
    }
    
    if (dateToInput) {
      dateToInput.addEventListener('change', () => {
        this.updateFilterIndicators();
      });
    }

    // Platform select
    const platformSelect = document.getElementById('filter-platform');
    if (platformSelect) {
      platformSelect.addEventListener('change', () => {
        this.updateFilterIndicators();
      });
    }

    // Amount range inputs
    const amountMinInput = document.getElementById('filter-amount-min');
    const amountMaxInput = document.getElementById('filter-amount-max');
    
    if (amountMinInput) {
      amountMinInput.addEventListener('input', () => {
        this.updateFilterIndicators();
      });
    }
    
    if (amountMaxInput) {
      amountMaxInput.addEventListener('input', () => {
        this.updateFilterIndicators();
      });
    }
  }

  /**
   * Apply advanced filter
   */
  applyAdvancedFilter() {
    const filters = this.collectFilterValues();
    
    // Dispatch filter change event
    window.dispatchEvent(new CustomEvent('advancedFilterChange', {
      detail: { filters }
    }));
    
    // Update visual indicators
    this.updateFilterIndicators();
    
    // Show toast notification
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast('ใช้ตัวกรองแล้ว');
    }
  }

  /**
   * Collect current filter values
   */
  collectFilterValues() {
    const filters = {};
    
    // Type filters
    const typeFilters = Array.from(document.querySelectorAll('input[name="type-filter"]:checked'))
      .map(cb => cb.value);
    if (typeFilters.length > 0) {
      filters.types = typeFilters;
    }
    
    // Category filters
    const categoryFilters = Array.from(document.querySelectorAll('input[name="category-filter"]:checked'))
      .map(cb => cb.value);
    if (categoryFilters.length > 0) {
      filters.categories = categoryFilters;
    }
    
    // Date range
    const dateFrom = document.getElementById('filter-date-from')?.value;
    const dateTo = document.getElementById('filter-date-to')?.value;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    
    // Platform
    const platform = document.getElementById('filter-platform')?.value;
    if (platform) filters.platform = platform;
    
    // Amount range
    const amountMin = document.getElementById('filter-amount-min')?.value;
    const amountMax = document.getElementById('filter-amount-max')?.value;
    if (amountMin) filters.amountMin = parseFloat(amountMin);
    if (amountMax) filters.amountMax = parseFloat(amountMax);
    
    return filters;
  }  /**

   * Update filter visual indicators
   */
  updateFilterIndicators() {
    const filters = this.collectFilterValues();
    const activeFilterCount = Object.keys(filters).length;
    
    // Update filter button badge
    const filterButton = document.querySelector('.filter-toggle-btn');
    if (filterButton) {
      const badge = filterButton.querySelector('.filter-badge');
      if (activeFilterCount > 0) {
        if (badge) {
          badge.textContent = activeFilterCount;
          badge.style.display = 'inline';
        } else {
          const newBadge = document.createElement('span');
          newBadge.className = 'filter-badge';
          newBadge.textContent = activeFilterCount;
          filterButton.appendChild(newBadge);
        }
      } else if (badge) {
        badge.style.display = 'none';
      }
    }
  }

  /**
   * Set quick date filter
   */
  setQuickDateFilter(period) {
    const today = new Date();
    let fromDate, toDate;
    
    switch (period) {
      case 'today':
        fromDate = toDate = today;
        break;
      case 'week':
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - today.getDay());
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + 6);
        break;
      case 'month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        fromDate = new Date(today.getFullYear(), quarter * 3, 1);
        toDate = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        break;
    }
    
    if (fromDate && toDate) {
      const dateFromInput = document.getElementById('filter-date-from');
      const dateToInput = document.getElementById('filter-date-to');
      
      if (dateFromInput) {
        dateFromInput.value = fromDate.toISOString().split('T')[0];
      }
      if (dateToInput) {
        dateToInput.value = toDate.toISOString().split('T')[0];
      }
      
      this.updateFilterIndicators();
    }
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    // Reset checkboxes
    document.querySelectorAll('input[name="type-filter"], input[name="category-filter"]')
      .forEach(cb => cb.checked = true);
    
    // Clear date inputs
    const dateInputs = ['filter-date-from', 'filter-date-to'];
    dateInputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
    
    // Clear platform select
    const platformSelect = document.getElementById('filter-platform');
    if (platformSelect) platformSelect.value = '';
    
    // Clear amount inputs
    const amountInputs = ['filter-amount-min', 'filter-amount-max'];
    amountInputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
    
    this.updateFilterIndicators();
    
    // Dispatch clear event
    window.dispatchEvent(new CustomEvent('advancedFilterClear'));
    
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast('ล้างตัวกรองแล้ว');
    }
  }  /**

   * Save current filter as preset
   */
  saveCurrentFilter() {
    const filters = this.collectFilterValues();
    
    if (Object.keys(filters).length === 0) {
      if (window.POS && window.POS.critical && window.POS.critical.toast) {
        window.POS.critical.toast('ไม่มีตัวกรองที่จะบันทึก');
      }
      return;
    }
    
    const name = prompt('ชื่อตัวกรอง:');
    if (!name) return;
    
    const presetId = `preset_${Date.now()}`;
    this.filterPresets.set(presetId, {
      id: presetId,
      name,
      filters,
      createdAt: new Date().toISOString()
    });
    
    this.saveFilterPresets();
    this.loadFilterPresetButtons();
    
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast(`บันทึกตัวกรอง "${name}" แล้ว`);
    }
  }

  /**
   * Load filter preset buttons
   */
  loadFilterPresetButtons() {
    const container = document.getElementById('filter-presets');
    if (!container) return;
    
    const presetsContainer = container.querySelector('.preset-buttons');
    if (!presetsContainer) return;
    
    presetsContainer.innerHTML = '';
    
    if (this.filterPresets.size === 0) {
      presetsContainer.innerHTML = '<div class="muted">ยังไม่มีตัวกรองที่บันทึกไว้</div>';
      return;
    }
    
    for (const [id, preset] of this.filterPresets) {
      const button = document.createElement('button');
      button.className = 'btn ghost pill preset-btn';
      button.innerHTML = `
        ${preset.name}
        <span class="preset-delete" onclick="searchModule.deleteFilterPreset('${id}')" title="ลบ">×</span>
      `;
      button.onclick = (e) => {
        if (e.target.classList.contains('preset-delete')) return;
        this.applyFilterPreset(id);
      };
      
      presetsContainer.appendChild(button);
    }
  }

  /**
   * Apply filter preset
   */
  applyFilterPreset(presetId) {
    const preset = this.filterPresets.get(presetId);
    if (!preset) return;
    
    const { filters } = preset;
    
    // Apply type filters
    document.querySelectorAll('input[name="type-filter"]').forEach(cb => {
      cb.checked = !filters.types || filters.types.includes(cb.value);
    });
    
    // Apply category filters
    document.querySelectorAll('input[name="category-filter"]').forEach(cb => {
      cb.checked = !filters.categories || filters.categories.includes(cb.value);
    });
    
    // Apply date filters
    if (filters.dateFrom) {
      const dateFromInput = document.getElementById('filter-date-from');
      if (dateFromInput) dateFromInput.value = filters.dateFrom;
    }
    
    if (filters.dateTo) {
      const dateToInput = document.getElementById('filter-date-to');
      if (dateToInput) dateToInput.value = filters.dateTo;
    }
    
    // Apply platform filter
    if (filters.platform) {
      const platformSelect = document.getElementById('filter-platform');
      if (platformSelect) platformSelect.value = filters.platform;
    }
    
    // Apply amount filters
    if (filters.amountMin) {
      const amountMinInput = document.getElementById('filter-amount-min');
      if (amountMinInput) amountMinInput.value = filters.amountMin;
    }
    
    if (filters.amountMax) {
      const amountMaxInput = document.getElementById('filter-amount-max');
      if (amountMaxInput) amountMaxInput.value = filters.amountMax;
    }
    
    this.updateFilterIndicators();
    this.applyAdvancedFilter();
    
    if (window.POS && window.POS.critical && window.POS.critical.toast) {
      window.POS.critical.toast(`ใช้ตัวกรอง "${preset.name}" แล้ว`);
    }
  }

  /**
   * Delete filter preset
   */
  deleteFilterPreset(presetId) {
    const preset = this.filterPresets.get(presetId);
    if (!preset) return;
    
    if (confirm(`ต้องการลบตัวกรอง "${preset.name}" หรือไม่?`)) {
      this.filterPresets.delete(presetId);
      this.saveFilterPresets();
      this.loadFilterPresetButtons();
      
      if (window.POS && window.POS.critical && window.POS.critical.toast) {
        window.POS.critical.toast(`ลบตัวกรอง "${preset.name}" แล้ว`);
      }
    }
  }  // Helper 
methods for search functionality

  /**
   * Generate search terms from input values
   */
  generateSearchTerms(values) {
    const terms = new Set();
    
    values.forEach(value => {
      if (!value) return;
      
      const str = String(value).toLowerCase();
      
      // Add full value
      terms.add(str);
      
      // Add individual words
      str.split(/\s+/).forEach(word => {
        if (word.length > 1) {
          terms.add(word);
        }
      });
      
      // Add partial matches for Thai text
      if (this.isThaiText(str)) {
        for (let i = 0; i < str.length - 1; i++) {
          for (let j = i + 2; j <= str.length; j++) {
            terms.add(str.substring(i, j));
          }
        }
      }
    });
    
    return Array.from(terms);
  }

  /**
   * Check if text contains Thai characters
   */
  isThaiText(text) {
    return /[\u0E00-\u0E7F]/.test(text);
  }

  /**
   * Calculate relevance score for search ranking
   */
  calculateRelevanceScore(type, item) {
    let score = 0;
    
    // Base score by type
    const typeScores = {
      'ingredient': 100,
      'menu': 90,
      'transaction': 80
    };
    
    score += typeScores[type] || 50;
    
    // Boost score based on usage frequency (if available)
    if (item.usageCount) {
      score += Math.min(item.usageCount * 2, 50);
    }
    
    // Boost recent items
    if (item.lastUsed) {
      const daysSinceUsed = (Date.now() - new Date(item.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUsed < 7) {
        score += 20 - (daysSinceUsed * 2);
      }
    }
    
    return score;
  }

  /**
   * Calculate match score for search results
   */
  calculateMatchScore(item, queryTerms, enableFuzzy) {
    let score = 0;
    const searchTerms = item.searchTerms;
    
    queryTerms.forEach(queryTerm => {
      let bestMatch = 0;
      
      searchTerms.forEach(searchTerm => {
        // Exact match
        if (searchTerm === queryTerm) {
          bestMatch = Math.max(bestMatch, 100);
        }
        // Starts with
        else if (searchTerm.startsWith(queryTerm)) {
          bestMatch = Math.max(bestMatch, 80);
        }
        // Contains
        else if (searchTerm.includes(queryTerm)) {
          bestMatch = Math.max(bestMatch, 60);
        }
        // Fuzzy match
        else if (enableFuzzy) {
          const fuzzyScore = this.calculateFuzzyScore(searchTerm, queryTerm);
          if (fuzzyScore >= this.config.fuzzyThreshold) {
            bestMatch = Math.max(bestMatch, fuzzyScore * 40);
          }
        }
      });
      
      score += bestMatch;
    });
    
    // Normalize score
    score = score / queryTerms.length;
    
    // Apply relevance boost
    score = score * (1 + item.relevanceScore / 1000);
    
    return score;
  }  /*
*
   * Calculate fuzzy matching score using Levenshtein distance
   */
  calculateFuzzyScore(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    
    return 1 - (distance / maxLen);
  }

  /**
   * Sort search results
   */
  sortSearchResults(results, sortBy) {
    switch (sortBy) {
      case 'relevance':
        results.sort((a, b) => b.matchScore - a.matchScore);
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name, 'th'));
        break;
      case 'type':
        results.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
          }
          return b.matchScore - a.matchScore;
        });
        break;
      case 'category':
        results.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category, 'th');
          }
          return b.matchScore - a.matchScore;
        });
        break;
    }
  }

  /**
   * Highlight matching terms in text
   */
  highlightMatches(text, queryTerms) {
    let highlighted = text;
    
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
  }

  /**
   * Escape special regex characters
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Normalize search query
   */
  normalizeSearchQuery(query) {
    return query.toLowerCase().trim();
  }

  /**
   * Apply custom filters to search item
   */
  applyFilters(item, filters) {
    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const itemDate = this.getItemDate(item);
      if (itemDate) {
        if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && itemDate > new Date(filters.dateTo)) {
          return false;
        }
      }
    }
    
    // Platform filter
    if (filters.platform && item.data.platform !== filters.platform) {
      return false;
    }
    
    // Amount range filter
    if (filters.amountMin || filters.amountMax) {
      const amount = this.getItemAmount(item);
      if (amount !== null) {
        if (filters.amountMin && amount < filters.amountMin) {
          return false;
        }
        if (filters.amountMax && amount > filters.amountMax) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Get date from search item
   */
  getItemDate(item) {
    if (item.type === 'transaction' && item.data.date) {
      return new Date(item.data.date);
    }
    return null;
  }

  /**
   * Get amount from search item
   */
  getItemAmount(item) {
    if (item.type === 'transaction') {
      return item.data.total || item.data.totalPrice || null;
    }
    return null;
  }  // D
ata loading methods

  /**
   * Get ingredients data
   */
  async getIngredientsData() {
    // Try to get from cache first
    if (window.cacheManager) {
      const cached = await window.cacheManager.get('ingredients');
      if (cached) return cached;
    }
    
    // Fallback to API call
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(data => {
            const ingredients = data.ingredients || [];
            resolve(ingredients);
          })
          .withFailureHandler(reject)
          .getBootstrapData();
      } else {
        // Mock data for development
        resolve([
          { id: 'ING001', name: 'กุ้งสด', stockU: 'ตัว', buyU: 'กก.' },
          { id: 'ING002', name: 'น้ำปลา', stockU: 'มล.', buyU: 'ขวด' }
        ]);
      }
    });
  }

  /**
   * Get menus data
   */
  async getMenusData() {
    // Try to get from cache first
    if (window.cacheManager) {
      const cached = await window.cacheManager.get('menus');
      if (cached) return cached;
    }
    
    // Fallback to API call
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(data => {
            const menus = data.menus || [];
            resolve(menus);
          })
          .withFailureHandler(reject)
          .getBootstrapData();
      } else {
        // Mock data for development
        resolve([
          { menu_id: 'M001', name: 'กุ้งแซ่บ' },
          { menu_id: 'M002', name: 'กุ้งทอด' }
        ]);
      }
    });
  }

  /**
   * Get transactions data
   */
  async getTransactionsData(limit = 100) {
    // This would typically come from the API
    // For now, return empty array as transactions are not cached
    return [];
  }

  /**
   * Get transaction display name
   */
  getTransactionDisplayName(transaction) {
    if (transaction.type === 'sale') {
      return `ขาย ${transaction.menu_id} - ${transaction.platform}`;
    } else if (transaction.type === 'purchase') {
      return `ซื้อ ${transaction.ingredient_id}`;
    }
    return `${transaction.type} ${transaction.id}`;
  }  /
/ Cache and storage methods

  /**
   * Generate cache key
   */
  generateCacheKey(query, options) {
    return `search_${query}_${JSON.stringify(options)}`;
  }

  /**
   * Cache search result
   */
  cacheSearchResult(key, result) {
    // Limit cache size
    if (this.searchCache.size >= this.maxCacheItems) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }
    
    this.searchCache.set(key, {
      ...result,
      cachedAt: Date.now()
    });
  }

  /**
   * Cache search index
   */
  cacheSearchIndex() {
    try {
      const indexData = Array.from(this.searchIndex.entries());
      localStorage.setItem('pos_search_index', JSON.stringify(indexData));
      localStorage.setItem('pos_search_index_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Failed to cache search index:', error);
    }
  }

  /**
   * Load search data from cache
   */
  loadSearchData() {
    try {
      const indexData = localStorage.getItem('pos_search_index');
      const timestamp = localStorage.getItem('pos_search_index_timestamp');
      
      if (indexData && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        // Cache valid for 1 hour
        if (age < 3600000) {
          const entries = JSON.parse(indexData);
          this.searchIndex = new Map(entries);
          console.log('Loaded search index from cache');
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load search data from cache:', error);
    }
    
    // Build fresh index if cache is invalid
    this.buildSearchIndex();
  }

  /**
   * Add to search history
   */
  addToSearchHistory(query, resultCount) {
    // Remove existing entry for this query
    this.searchHistory = this.searchHistory.filter(item => item.query !== query);
    
    // Add new entry at the beginning
    this.searchHistory.unshift({
      query,
      resultCount,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.searchHistory.length > this.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    }
    
    this.saveSearchHistory();
  }

  /**
   * Load search history
   */
  loadSearchHistory() {
    try {
      const history = localStorage.getItem('pos_search_history');
      if (history) {
        this.searchHistory = JSON.parse(history);
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
      this.searchHistory = [];
    }
  }

  /**
   * Save search history
   */
  saveSearchHistory() {
    try {
      localStorage.setItem('pos_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  } 
 /**
   * Load saved searches
   */
  loadSavedSearches() {
    try {
      const saved = localStorage.getItem('pos_saved_searches');
      if (saved) {
        const entries = JSON.parse(saved);
        this.savedSearches = new Map(entries);
      }
    } catch (error) {
      console.warn('Failed to load saved searches:', error);
      this.savedSearches = new Map();
    }
  }

  /**
   * Save searches to storage
   */
  saveSavedSearches() {
    try {
      const entries = Array.from(this.savedSearches.entries());
      localStorage.setItem('pos_saved_searches', JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save searches:', error);
    }
  }

  /**
   * Load filter presets
   */
  loadFilterPresets() {
    try {
      const presets = localStorage.getItem('pos_filter_presets');
      if (presets) {
        const entries = JSON.parse(presets);
        this.filterPresets = new Map(entries);
      }
    } catch (error) {
      console.warn('Failed to load filter presets:', error);
      this.filterPresets = new Map();
    }
  }

  /**
   * Save filter presets
   */
  saveFilterPresets() {
    try {
      const entries = Array.from(this.filterPresets.entries());
      localStorage.setItem('pos_filter_presets', JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save filter presets:', error);
    }
  }

  /**
   * Setup default filter presets
   */
  setupDefaultFilters() {
    if (this.filterPresets.size === 0) {
      // Add some default filter presets
      this.filterPresets.set('preset_ingredients', {
        id: 'preset_ingredients',
        name: 'วัตถุดิบเท่านั้น',
        filters: { types: ['ingredient'] },
        createdAt: new Date().toISOString()
      });
      
      this.filterPresets.set('preset_menus', {
        id: 'preset_menus',
        name: 'เมนูเท่านั้น',
        filters: { types: ['menu'] },
        createdAt: new Date().toISOString()
      });
      
      this.filterPresets.set('preset_today_sales', {
        id: 'preset_today_sales',
        name: 'การขายวันนี้',
        filters: { 
          types: ['transaction'], 
          categories: ['การขาย'],
          dateFrom: new Date().toISOString().split('T')[0]
        },
        createdAt: new Date().toISOString()
      });
      
      this.saveFilterPresets();
    }
  }

  /**
   * Get module info
   */
  getInfo() {
    return {
      name: 'SearchModule',
      version: '1.0.0',
      initialized: this.initialized,
      indexSize: this.searchIndex.size,
      historySize: this.searchHistory.length,
      savedSearches: this.savedSearches.size,
      filterPresets: this.filterPresets.size,
      cacheSize: this.searchCache.size
    };
  }
}

export default SearchModule;