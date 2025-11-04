# Design Document: Dropdown Functionality Fix

## Overview

This design addresses the critical issue of non-functional dropdowns in the POS system. The solution involves creating a modular dropdown management system that fetches data from Google Sheets, implements intelligent caching, handles loading states, and provides a seamless user experience across all screens.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Index.html)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Purchase   │  │     Sale     │  │     Menu     │      │
│  │    Screen    │  │    Screen    │  │    Screen    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  DropdownManager │                       │
│                   │   (js/core/)     │                       │
│                   └────────┬────────┘                        │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  CacheManager   │                        │
│                   │   (existing)    │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  google.script  │
                    │      .run       │
                    └────────┬────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│              Backend (gas/Code.gs)                            │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ getIngredients() │  │   getMenus()     │                  │
│  └──────────────────┘  └──────────────────┘                  │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │getMenuIngredients│  │  getPlatforms()  │                  │
│  └──────────────────┘  └──────────────────┘                  │
└───────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. DropdownManager (Frontend)

**Location:** `js/core/DropdownManager.js`

**Purpose:** Centralized manager for all dropdown operations including fetching, caching, populating, and error handling.

**Key Methods:**

```javascript
class DropdownManager {
  constructor(cacheManager)
  
  // Core dropdown operations
  async populateIngredients(selectElement, options = {})
  async populateMenus(selectElement, options = {})
  async populatePlatforms(selectElement)
  async populateUnits(selectElement, unitType = 'all')
  
  // Data fetching with caching
  async getIngredients(forceRefresh = false)
  async getMenus(forceRefresh = false)
  async getMenuIngredients(menuId)
  async getPlatforms()
  
  // Event handlers
  onIngredientChange(selectElement, callback)
  onMenuChange(selectElement, callback)
  
  // Utility methods
  showLoading(selectElement)
  hideLoading(selectElement)
  showError(selectElement, message)
  clearCache()
}
```

**Responsibilities:**
- Fetch data from backend via google.script.run
- Manage caching through CacheManager
- Populate dropdown elements with options
- Handle loading states and errors
- Provide event handlers for dropdown changes

### 2. Backend API Functions (Google Apps Script)

**Location:** `gas/Code.gs`

**New Functions to Add:**

```javascript
/**
 * Get all ingredients for dropdown population
 * @return {Array} Array of ingredient objects
 */
function getIngredients() {
  // Returns: [{ id, name, stock_unit, buy_unit, buy_to_stock_ratio }]
}

/**
 * Get all menus for dropdown population
 * @return {Array} Array of menu objects
 */
function getMenus() {
  // Returns: [{ id, name, price }]
}

/**
 * Get ingredients for a specific menu
 * @param {string} menuId - Menu ID
 * @return {Array} Array of menu ingredient objects
 */
function getMenuIngredients(menuId) {
  // Returns: [{ ingredient_id, ingredient_name, quantity, unit }]
}

/**
 * Get all platforms for dropdown population
 * @return {Array} Array of platform objects
 */
function getPlatforms() {
  // Returns: [{ id, name }]
}
```

### 3. Screen Initialization Modules

**Locations:** 
- `js/core/modules/PurchaseModule.js`
- `js/core/modules/SaleModule.js`
- `js/core/modules/MenuModule.js`

**Purpose:** Initialize dropdowns when screens are loaded

**Key Methods:**

```javascript
class PurchaseModule {
  constructor(dropdownManager)
  
  async init() {
    // Initialize ingredient and unit dropdowns
    // Set up event handlers
  }
  
  onIngredientChange(ingredientId) {
    // Auto-populate unit dropdown based on ingredient
  }
}

class SaleModule {
  constructor(dropdownManager)
  
  async init() {
    // Initialize menu and platform dropdowns
    // Set up event handlers
  }
  
  onMenuChange(menuId) {
    // Auto-populate price based on menu
  }
}

class MenuModule {
  constructor(dropdownManager)
  
  async init() {
    // Initialize menu and ingredient dropdowns
    // Set up event handlers
  }
  
  onMenuChange(menuId) {
    // Load and display menu ingredients
  }
}
```

## Data Models

### Ingredient Object
```javascript
{
  id: string,           // e.g., "ING001"
  name: string,         // e.g., "กุ้ง"
  stock_unit: string,   // e.g., "piece"
  buy_unit: string,     // e.g., "kg"
  buy_to_stock_ratio: number  // e.g., 43 (1 kg = 43 pieces)
}
```

### Menu Object
```javascript
{
  id: string,           // e.g., "MENU001"
  name: string,         // e.g., "กุ้งแซ่บ"
  price: number         // e.g., 120
}
```

### Menu Ingredient Object
```javascript
{
  ingredient_id: string,    // e.g., "ING001"
  ingredient_name: string,  // e.g., "กุ้ง"
  quantity: number,         // e.g., 5
  unit: string             // e.g., "piece"
}
```

### Platform Object
```javascript
{
  id: string,           // e.g., "walkin"
  name: string          // e.g., "Walk-in"
}
```

## Error Handling

### Error Types and Responses

1. **Network Error**
   - Display: "ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่"
   - Action: Show retry button, use cached data if available

2. **Sheet Not Found**
   - Display: "ไม่พบข้อมูล กรุณาติดต่อผู้ดูแลระบบ"
   - Action: Log error, show empty dropdown with message

3. **Empty Data**
   - Display: "ไม่มีข้อมูล"
   - Action: Show empty dropdown with helpful message

4. **Timeout**
   - Display: "หมดเวลาการเชื่อมต่อ กรุณาลองใหม่"
   - Action: Show retry button, increase timeout on retry

### Error Recovery Strategy

```javascript
async function fetchWithRetry(fetchFunction, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFunction();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

## Caching Strategy

### Cache Structure

```javascript
{
  'ingredients': {
    data: Array<Ingredient>,
    timestamp: number,
    ttl: 300000  // 5 minutes
  },
  'menus': {
    data: Array<Menu>,
    timestamp: number,
    ttl: 300000
  },
  'menu_ingredients_MENU001': {
    data: Array<MenuIngredient>,
    timestamp: number,
    ttl: 300000
  }
}
```

### Cache Invalidation Rules

1. **Time-based:** Automatically expire after 5 minutes
2. **Manual:** Clear on sync button click
3. **Event-based:** Clear specific cache when data is modified
4. **Offline:** Retain cache indefinitely when offline

### Cache Priority

1. **High Priority:** Ingredients, Menus (preload on app start)
2. **Medium Priority:** Platforms (load on Sale screen)
3. **Low Priority:** Menu Ingredients (load on demand)

## Loading States

### Visual Indicators

1. **Initial Load**
   ```html
   <option value="">กำลังโหลด...</option>
   ```

2. **Loading with Spinner**
   ```html
   <option value="">⏳ กำลังโหลด...</option>
   ```

3. **Error State**
   ```html
   <option value="">❌ เกิดข้อผิดพลาด - คลิกเพื่อลองใหม่</option>
   ```

4. **Empty State**
   ```html
   <option value="">ไม่มีข้อมูล</option>
   ```

5. **Success State**
   ```html
   <option value="">เลือก...</option>
   <option value="ING001">กุ้ง</option>
   <option value="ING002">น้ำปลา</option>
   ```

## Testing Strategy

### Unit Tests

1. **DropdownManager Tests**
   - Test data fetching with mocked google.script.run
   - Test caching behavior
   - Test error handling
   - Test dropdown population

2. **Backend Function Tests**
   - Test getIngredients() returns correct format
   - Test getMenus() returns correct format
   - Test getMenuIngredients() with valid/invalid menuId
   - Test getPlatforms() returns correct format

### Integration Tests

1. **Screen Initialization Tests**
   - Test Purchase screen dropdown initialization
   - Test Sale screen dropdown initialization
   - Test Menu screen dropdown initialization
   - Test dropdown auto-population on selection

2. **Cache Integration Tests**
   - Test cache hit/miss scenarios
   - Test cache expiration
   - Test cache invalidation on sync

### End-to-End Tests

1. **User Flow Tests**
   - Test complete purchase flow with dropdown selection
   - Test complete sale flow with dropdown selection
   - Test menu management flow with dropdown selection
   - Test offline behavior with cached dropdowns

### Performance Tests

1. **Load Time Tests**
   - Measure dropdown population time
   - Measure cache retrieval time
   - Measure backend fetch time

2. **Stress Tests**
   - Test with 100+ ingredients
   - Test with 50+ menus
   - Test rapid screen switching

## Implementation Phases

### Phase 1: Backend Functions (Priority: Critical)
- Implement getIngredients()
- Implement getMenus()
- Implement getMenuIngredients()
- Implement getPlatforms()
- Add error handling and caching

### Phase 2: Frontend DropdownManager (Priority: Critical)
- Create DropdownManager class
- Implement data fetching methods
- Implement dropdown population methods
- Implement error handling and loading states

### Phase 3: Screen Module Integration (Priority: High)
- Create/update PurchaseModule
- Create/update SaleModule
- Create/update MenuModule
- Integrate with existing routing system

### Phase 4: Event Handlers and Auto-population (Priority: High)
- Implement ingredient change handler (auto-populate unit)
- Implement menu change handler (auto-populate price)
- Implement menu change handler (load ingredients)

### Phase 5: Testing and Optimization (Priority: Medium)
- Write unit tests
- Write integration tests
- Perform performance optimization
- Add comprehensive error handling

## Security Considerations

1. **Input Validation:** Validate all dropdown selections before processing
2. **XSS Prevention:** Sanitize all text content before inserting into DOM
3. **Access Control:** Ensure backend functions check user permissions
4. **Data Integrity:** Validate data format from backend before caching

## Performance Optimizations

1. **Lazy Loading:** Load dropdown data only when screen is accessed
2. **Preloading:** Preload likely-to-be-used dropdowns based on time of day
3. **Debouncing:** Debounce dropdown change events to prevent excessive calls
4. **Virtual Scrolling:** Implement for dropdowns with 100+ items
5. **Compression:** Compress cached data in localStorage

## Accessibility Considerations

1. **ARIA Labels:** Add proper aria-label attributes to all dropdowns
2. **Keyboard Navigation:** Ensure full keyboard accessibility
3. **Screen Reader Support:** Add aria-live regions for loading states
4. **Focus Management:** Maintain focus on dropdown after population
5. **Error Announcements:** Announce errors to screen readers

## Backward Compatibility

- Maintain existing function signatures
- Gracefully handle missing backend functions
- Provide fallback for browsers without localStorage
- Support older versions of Google Apps Script runtime
