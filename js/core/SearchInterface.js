/**
 * Search Interface - UI component for search functionality
 * Provides search input, results display, and filter controls
 */

class SearchInterface {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.searchModule = null;
    this.currentQuery = '';
    this.currentFilters = {};
    this.debounceTimer = null;
    
    // Configuration
    this.config = {
      placeholder: 'ค้นหาวัตถุดิบ, เมนู, หรือธุรกรรม...',
      showFilters: true,
      showSuggestions: true,
      showHistory: true,
      debounceDelay: 200,
      maxSuggestions: 10,
      ...options
    };
    
    this.init();
  }

  /**
   * Initialize search interface
   */
  async init() {
    if (!this.container) {
      console.error('Search container not found:', this.containerId);
      return;
    }

    // Load search module
    await this.loadSearchModule();
    
    // Create UI
    this.createSearchUI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('Search interface initialized');
  }

  /**
   * Load search module
   */
  async loadSearchModule() {
    try {
      if (window.moduleLoader) {
        const SearchModule = await window.moduleLoader.loadModule('search');
        this.searchModule = new SearchModule();
        await this.searchModule.init();
      } else {
        console.warn('Module loader not available, search functionality limited');
      }
    } catch (error) {
      console.error('Failed to load search module:', error);
    }
  }

  /**
   * Create search UI
   */
  createSearchUI() {
    const searchHTML = `
      <div class="search-interface">
        <!-- Search Input -->
        <div class="search-input-container">
          <div class="search-input-wrapper">
            <input 
              type="text" 
              id="${this.containerId}-search-input" 
              class="search-input input" 
              placeholder="${this.config.placeholder}"
              autocomplete="off"
              spellcheck="false"
            >
            <button class="search-clear-btn" id="${this.containerId}-clear-btn" title="ล้างการค้นหา">×</button>
            ${this.config.showFilters ? `
              <button class="filter-toggle-btn btn ghost" id="${this.containerId}-filter-btn" title="ตัวกรอง">
                🔍
                <span class="filter-badge" style="display: none;">0</span>
              </button>
            ` : ''}
          </div>
          
          <!-- Search Suggestions -->
          <div class="search-suggestions" id="${this.containerId}-suggestions" style="display: none;">
            <!-- Suggestions will be populated here -->
          </div>
        </div>

        <!-- Advanced Filters (initially hidden) -->
        ${this.config.showFilters ? `
          <div class="advanced-filters" id="${this.containerId}-filters" style="display: none;">
            <!-- Filters will be populated by SearchModule -->
          </div>
        ` : ''}

        <!-- Search Results -->
        <div class="search-results" id="${this.containerId}-results">
          <div class="search-status">
            <div class="search-placeholder">
              <div class="search-icon">🔍</div>
              <div class="search-message">เริ่มพิมพ์เพื่อค้นหา</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = searchHTML;
    
    // Initialize advanced filters if enabled
    if (this.config.showFilters && this.searchModule) {
      this.searchModule.createAdvancedFilter(`${this.containerId}-filters`);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const searchInput = document.getElementById(`${this.containerId}-search-input`);
    const clearBtn = document.getElementById(`${this.containerId}-clear-btn`);
    const filterBtn = document.getElementById(`${this.containerId}-filter-btn`);
    const suggestionsContainer = document.getElementById(`${this.containerId}-suggestions`);

    // Search input events
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });

      searchInput.addEventListener('focus', () => {
        this.showSuggestions();
      });

      searchInput.addEventListener('blur', () => {
        // Delay hiding suggestions to allow clicking on them
        setTimeout(() => {
          this.hideSuggestions();
        }, 200);
      });

      searchInput.addEventListener('keydown', (e) => {
        this.handleKeyDown(e);
      });
    }

    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearSearch();
      });
    }

    // Filter toggle button
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        this.toggleFilters();
      });
    }

    // Advanced filter events
    window.addEventListener('advancedFilterChange', (e) => {
      this.currentFilters = e.detail.filters;
      this.performSearch(this.currentQuery);
    });

    window.addEventListener('advancedFilterClear', () => {
      this.currentFilters = {};
      this.performSearch(this.currentQuery);
    });

    // Click outside to hide suggestions
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideSuggestions();
      }
    });
  }

  /**
   * Handle search input
   */
  handleSearchInput(query) {
    this.currentQuery = query;
    
    // Clear previous debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Show/hide clear button
    const clearBtn = document.getElementById(`${this.containerId}-clear-btn`);
    if (clearBtn) {
      clearBtn.style.display = query ? 'block' : 'none';
    }

    // Debounce search
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
      this.updateSuggestions(query);
    }, this.config.debounceDelay);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(e) {
    const suggestionsContainer = document.getElementById(`${this.containerId}-suggestions`);
    
    if (!suggestionsContainer || suggestionsContainer.style.display === 'none') {
      return;
    }

    const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
    const currentActive = suggestionsContainer.querySelector('.suggestion-item.active');
    let activeIndex = -1;

    if (currentActive) {
      activeIndex = Array.from(suggestions).indexOf(currentActive);
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, suggestions.length - 1);
        this.setActiveSuggestion(suggestions, activeIndex);
        break;

      case 'ArrowUp':
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
        this.setActiveSuggestion(suggestions, activeIndex);
        break;

      case 'Enter':
        e.preventDefault();
        if (currentActive) {
          this.selectSuggestion(currentActive);
        } else {
          this.performSearch(this.currentQuery);
        }
        break;

      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  /**
   * Set active suggestion
   */
  setActiveSuggestion(suggestions, activeIndex) {
    suggestions.forEach((suggestion, index) => {
      suggestion.classList.toggle('active', index === activeIndex);
    });
  }

  /**
   * Perform search
   */
  async performSearch(query) {
    if (!this.searchModule) {
      this.showSearchStatus('ระบบค้นหาไม่พร้อมใช้งาน');
      return;
    }

    const resultsContainer = document.getElementById(`${this.containerId}-results`);
    
    if (!query || query.trim().length === 0) {
      this.showSearchPlaceholder();
      return;
    }

    // Show loading
    this.showSearchStatus('กำลังค้นหา...');

    try {
      const searchResult = await this.searchModule.search(query, {
        filters: this.currentFilters
      });

      this.displaySearchResults(searchResult);
      
    } catch (error) {
      console.error('Search failed:', error);
      this.showSearchStatus('เกิดข้อผิดพลาดในการค้นหา');
    }
  }

  /**
   * Display search results
   */
  displaySearchResults(searchResult) {
    const resultsContainer = document.getElementById(`${this.containerId}-results`);
    
    if (searchResult.results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-status">
          <div class="no-results">
            <div class="no-results-icon">🔍</div>
            <div class="no-results-message">ไม่พบผลลัพธ์สำหรับ "${searchResult.query}"</div>
            <div class="no-results-suggestions">
              ลองค้นหาด้วยคำอื่น หรือใช้ตัวกรองเพื่อขยายผลการค้นหา
            </div>
          </div>
        </div>
      `;
      return;
    }

    const resultsHTML = `
      <div class="search-results-header">
        <div class="results-info">
          พบ ${searchResult.totalCount} รายการ สำหรับ "${searchResult.query}"
          ${searchResult.fromCache ? ' (จากแคช)' : ''}
        </div>
        <div class="results-time">
          ${searchResult.executionTime.toFixed(1)} ms
        </div>
      </div>
      
      <div class="search-results-list">
        ${searchResult.results.map(result => this.renderSearchResult(result)).join('')}
      </div>
      
      ${searchResult.totalCount > searchResult.results.length ? `
        <div class="search-results-footer">
          แสดง ${searchResult.results.length} จาก ${searchResult.totalCount} รายการ
        </div>
      ` : ''}
    `;

    resultsContainer.innerHTML = resultsHTML;
    
    // Setup result click handlers
    this.setupResultClickHandlers();
  }

  /**
   * Render individual search result
   */
  renderSearchResult(result) {
    const typeIcons = {
      'ingredient': '📦',
      'menu': '🍢',
      'transaction': '💰'
    };

    const typeLabels = {
      'ingredient': 'วัตถุดิบ',
      'menu': 'เมนู',
      'transaction': 'ธุรกรรม'
    };

    return `
      <div class="search-result-item" data-type="${result.type}" data-id="${result.id}">
        <div class="result-icon">${typeIcons[result.type] || '📄'}</div>
        <div class="result-content">
          <div class="result-title">${result.highlightedName || result.name}</div>
          <div class="result-meta">
            <span class="result-type">${typeLabels[result.type] || result.type}</span>
            <span class="result-category">${result.category}</span>
            ${result.matchScore ? `<span class="result-score">${Math.round(result.matchScore)}%</span>` : ''}
          </div>
          ${this.renderResultDetails(result)}
        </div>
        <div class="result-actions">
          <button class="btn ghost pill" onclick="searchInterface.selectResult('${result.type}', '${result.id}')">
            เลือก
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render result details based on type
   */
  renderResultDetails(result) {
    switch (result.type) {
      case 'ingredient':
        return `
          <div class="result-details">
            <span>หน่วยสต๊อก: ${result.data.stockU || 'ไม่ระบุ'}</span>
            <span>หน่วยซื้อ: ${result.data.buyU || 'ไม่ระบุ'}</span>
          </div>
        `;
      
      case 'menu':
        return `
          <div class="result-details">
            <span>รหัสเมนู: ${result.data.menu_id}</span>
          </div>
        `;
      
      case 'transaction':
        return `
          <div class="result-details">
            <span>วันที่: ${result.data.date || 'ไม่ระบุ'}</span>
            <span>จำนวน: ${result.data.total || result.data.totalPrice || 'ไม่ระบุ'} บาท</span>
          </div>
        `;
      
      default:
        return '';
    }
  }

  /**
   * Setup result click handlers
   */
  setupResultClickHandlers() {
    const resultItems = document.querySelectorAll(`#${this.containerId} .search-result-item`);
    
    resultItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn')) return; // Skip if clicking button
        
        const type = item.dataset.type;
        const id = item.dataset.id;
        this.selectResult(type, id);
      });
    });
  }

  /**
   * Select search result
   */
  selectResult(type, id) {
    // Dispatch custom event for result selection
    const event = new CustomEvent('searchResultSelected', {
      detail: { type, id }
    });
    
    window.dispatchEvent(event);
    
    // Also call callback if provided
    if (this.config.onResultSelect) {
      this.config.onResultSelect(type, id);
    }
  }

  /**
   * Update suggestions
   */
  async updateSuggestions(query) {
    if (!this.config.showSuggestions || !this.searchModule) {
      return;
    }

    const suggestionsContainer = document.getElementById(`${this.containerId}-suggestions`);
    
    if (!query || query.length < 2) {
      this.hideSuggestions();
      return;
    }

    try {
      const suggestions = this.searchModule.getSearchSuggestions(query);
      
      if (suggestions.length === 0) {
        this.hideSuggestions();
        return;
      }

      const suggestionsHTML = suggestions
        .slice(0, this.config.maxSuggestions)
        .map(suggestion => this.renderSuggestion(suggestion))
        .join('');

      suggestionsContainer.innerHTML = suggestionsHTML;
      this.showSuggestions();
      
      // Setup suggestion click handlers
      this.setupSuggestionClickHandlers();
      
    } catch (error) {
      console.error('Failed to update suggestions:', error);
      this.hideSuggestions();
    }
  }

  /**
   * Render suggestion item
   */
  renderSuggestion(suggestion) {
    const icons = {
      'history': '🕒',
      'autocomplete': '💡',
      'category': '📁'
    };

    return `
      <div class="suggestion-item" data-type="${suggestion.type}" data-text="${suggestion.text}">
        <div class="suggestion-icon">${icons[suggestion.type] || '🔍'}</div>
        <div class="suggestion-content">
          <div class="suggestion-text">${suggestion.text}</div>
          ${suggestion.count ? `<div class="suggestion-meta">${suggestion.count} รายการ</div>` : ''}
          ${suggestion.category ? `<div class="suggestion-meta">${suggestion.category}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Setup suggestion click handlers
   */
  setupSuggestionClickHandlers() {
    const suggestionItems = document.querySelectorAll(`#${this.containerId}-suggestions .suggestion-item`);
    
    suggestionItems.forEach(item => {
      item.addEventListener('click', () => {
        this.selectSuggestion(item);
      });
    });
  }

  /**
   * Select suggestion
   */
  selectSuggestion(suggestionElement) {
    const text = suggestionElement.dataset.text;
    const searchInput = document.getElementById(`${this.containerId}-search-input`);
    
    if (searchInput) {
      searchInput.value = text;
      this.currentQuery = text;
      this.performSearch(text);
    }
    
    this.hideSuggestions();
  }

  /**
   * Show suggestions
   */
  showSuggestions() {
    const suggestionsContainer = document.getElementById(`${this.containerId}-suggestions`);
    if (suggestionsContainer && suggestionsContainer.innerHTML.trim()) {
      suggestionsContainer.style.display = 'block';
    }
  }

  /**
   * Hide suggestions
   */
  hideSuggestions() {
    const suggestionsContainer = document.getElementById(`${this.containerId}-suggestions`);
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
  }

  /**
   * Clear search
   */
  clearSearch() {
    const searchInput = document.getElementById(`${this.containerId}-search-input`);
    const clearBtn = document.getElementById(`${this.containerId}-clear-btn`);
    
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    
    if (clearBtn) {
      clearBtn.style.display = 'none';
    }
    
    this.currentQuery = '';
    this.hideSuggestions();
    this.showSearchPlaceholder();
  }

  /**
   * Toggle filters
   */
  toggleFilters() {
    const filtersContainer = document.getElementById(`${this.containerId}-filters`);
    const filterBtn = document.getElementById(`${this.containerId}-filter-btn`);
    
    if (filtersContainer) {
      const isVisible = filtersContainer.style.display !== 'none';
      filtersContainer.style.display = isVisible ? 'none' : 'block';
      
      if (filterBtn) {
        filterBtn.classList.toggle('active', !isVisible);
      }
    }
  }

  /**
   * Show search placeholder
   */
  showSearchPlaceholder() {
    const resultsContainer = document.getElementById(`${this.containerId}-results`);
    resultsContainer.innerHTML = `
      <div class="search-status">
        <div class="search-placeholder">
          <div class="search-icon">🔍</div>
          <div class="search-message">เริ่มพิมพ์เพื่อค้นหา</div>
        </div>
      </div>
    `;
  }

  /**
   * Show search status message
   */
  showSearchStatus(message) {
    const resultsContainer = document.getElementById(`${this.containerId}-results`);
    resultsContainer.innerHTML = `
      <div class="search-status">
        <div class="search-message">${message}</div>
      </div>
    `;
  }

  /**
   * Get current search state
   */
  getSearchState() {
    return {
      query: this.currentQuery,
      filters: this.currentFilters
    };
  }

  /**
   * Set search query programmatically
   */
  setSearchQuery(query) {
    const searchInput = document.getElementById(`${this.containerId}-search-input`);
    if (searchInput) {
      searchInput.value = query;
      this.handleSearchInput(query);
    }
  }

  /**
   * Destroy search interface
   */
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Make it available globally
window.SearchInterface = SearchInterface;

export default SearchInterface;