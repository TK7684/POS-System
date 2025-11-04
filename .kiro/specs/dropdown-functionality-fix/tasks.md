# Implementation Plan

- [x] 1. Implement backend API functions in Google Apps Script




  - Create getIngredients() function that queries the Ingredients sheet and returns array of ingredient objects with id, name, stock_unit, buy_unit, and buy_to_stock_ratio
  - Create getMenus() function that queries the Menus sheet and returns array of menu objects with id, name, and price
  - Create getMenuIngredients(menuId) function that queries the MenuRecipes sheet and returns ingredients for a specific menu
  - Create getPlatforms() function that returns predefined platform list (Walk-in, Grab, Line Man, Shopee Food, Foodpanda)
  - Add error handling to all functions to return empty arrays instead of throwing errors when sheets don't exist
  - Implement caching in backend functions using existing _getCache() and _setCache() utilities
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Create DropdownManager class for frontend dropdown management



  - [x] 2.1 Create js/core/DropdownManager.js with class structure and constructor


    - Initialize with reference to CacheManager
    - Set up cache keys and TTL constants
    - Create internal state management for tracking loaded dropdowns
    - _Requirements: 4.1, 4.2_
  

  - [x] 2.2 Implement data fetching methods with caching

    - Write getIngredients(forceRefresh) method that calls google.script.run.getIngredients() with caching
    - Write getMenus(forceRefresh) method that calls google.script.run.getMenus() with caching
    - Write getMenuIngredients(menuId) method that calls google.script.run.getMenuIngredients() with caching
    - Write getPlatforms() method that returns platform list (can be hardcoded or fetched)
    - Implement cache checking logic with 5-minute TTL
    - Add retry logic with exponential backoff for failed requests
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3_
  

  - [x] 2.3 Implement dropdown population methods

    - Write populateIngredients(selectElement, options) method that populates ingredient dropdown with fetched data
    - Write populateMenus(selectElement, options) method that populates menu dropdown with fetched data
    - Write populatePlatforms(selectElement) method that populates platform dropdown
    - Write populateUnits(selectElement, unitType) method that populates unit dropdown with predefined units
    - Add option to include "เลือก..." placeholder as first option
    - Implement proper option element creation with value and text
    - _Requirements: 1.1, 2.1, 3.1_
  

  - [x] 2.4 Implement loading state management

    - Write showLoading(selectElement) method that displays loading indicator in dropdown
    - Write hideLoading(selectElement) method that removes loading indicator
    - Write showError(selectElement, message) method that displays error state with retry option
    - Add visual indicators (⏳, ❌) for different states
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 2.5 Implement event handlers and utility methods


    - Write onIngredientChange(selectElement, callback) method for ingredient selection events
    - Write onMenuChange(selectElement, callback) method for menu selection events
    - Write clearCache() method that invalidates all cached dropdown data
    - Add error handling wrapper for all async operations
    - _Requirements: 1.3, 1.4, 2.3, 2.4, 4.3_

- [x] 3. Create screen-specific modules for dropdown initialization





  - [x] 3.1 Create or update PurchaseModule (js/core/modules/PurchaseModule.js)


    - Create module class with constructor accepting dropdownManager
    - Implement init() method that initializes ingredient dropdown on Purchase screen
    - Implement onIngredientChange handler that auto-populates unit dropdown based on selected ingredient's buy_unit
    - Add loading state handling during initialization
    - Add error handling with user-friendly messages
    - _Requirements: 1.1, 1.3, 1.5, 7.1, 7.4, 7.5_
  
  - [x] 3.2 Create or update SaleModule (js/core/modules/SaleModule.js)


    - Create module class with constructor accepting dropdownManager
    - Implement init() method that initializes menu and platform dropdowns on Sale screen
    - Implement onMenuChange handler that auto-populates price field based on selected menu
    - Add loading state handling during initialization
    - Add error handling with user-friendly messages
    - _Requirements: 2.1, 2.3, 3.1, 3.2, 7.2, 7.4, 7.5_
  
  - [x] 3.3 Create or update MenuModule (js/core/modules/MenuModule.js)


    - Create module class with constructor accepting dropdownManager
    - Implement init() method that initializes menu and ingredient dropdowns on Menu screen
    - Implement onMenuChange handler that loads and displays menu ingredients when menu is selected
    - Implement unit field auto-population based on selected ingredient's stock_unit
    - Add loading state handling during initialization
    - Add error handling with user-friendly messages
    - _Requirements: 1.1, 1.4, 2.1, 2.4, 7.3, 7.4, 7.5_

- [x] 4. Integrate DropdownManager with existing application




  - [x] 4.1 Update js/critical.js to initialize DropdownManager


    - Import DropdownManager in module loader initialization
    - Create global dropdownManager instance
    - Pass dropdownManager to screen modules when they're loaded
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 4.2 Update loadScreenModule function to initialize dropdowns


    - Modify loadScreenModule() in js/critical.js to call module.init() with dropdownManager
    - Ensure dropdowns are initialized when navigating to Purchase, Sale, or Menu screens
    - Add error handling for module initialization failures
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 4.3 Update sync button handler to clear dropdown cache


    - Modify initSync() function to call dropdownManager.clearCache() when sync button is clicked
    - Trigger dropdown refresh after cache clear
    - Add visual feedback during sync operation
    - _Requirements: 4.3_

- [x] 5. Implement offline support for dropdowns



  - [x] 5.1 Add offline detection and cached data usage


    - Modify DropdownManager to check online/offline status before fetching
    - Use cached data when offline, even if expired
    - Display offline indicator when using cached data
    - _Requirements: 4.4_
  
  - [x] 5.2 Implement cache persistence across sessions


    - Store dropdown cache in localStorage for persistence
    - Load cached data from localStorage on app initialization
    - Implement cache versioning to handle data structure changes
    - _Requirements: 4.4_

- [x] 6. Add comprehensive error handling and user feedback

  - [x] 6.1 Implement retry mechanism for failed requests


    - Add retry button to error states in dropdowns
    - Implement exponential backoff for automatic retries
    - Limit maximum retry attempts to prevent infinite loops
    - _Requirements: 1.5, 2.5, 5.2, 5.3_
  
  - [x] 6.2 Add user-friendly error messages


    - Create Thai language error messages for different error types
    - Display contextual error messages based on error type (network, timeout, empty data)
    - Add helpful hints for resolving common errors
    - _Requirements: 5.2, 5.5_
  
  - [x] 6.3 Implement loading indicators and progress feedback


    - Add spinner or loading animation during data fetch
    - Show progress indicator for long-running operations
    - Provide feedback when dropdowns are successfully populated
    - _Requirements: 5.1, 5.4_

- [x] 7. Update Index.html to support dropdown functionality


  - Ensure all dropdown select elements have proper id attributes (p_ing, s_menu, m_menu, m_ingredient, s_platform)
  - Add data attributes to dropdowns for easier selection and configuration
  - Ensure unit dropdowns (p_unit, m_unit) are properly structured
  - Verify form structure supports auto-population of related fields
  - _Requirements: 1.1, 1.3, 2.1, 2.3, 3.1_

- [x] 8. Implement preloading and performance optimizations

  - [x] 8.1 Add intelligent preloading based on time of day


    - Preload ingredient data during morning hours (9-11 AM)
    - Preload menu data during lunch and dinner hours (11 AM-2 PM, 5-9 PM)
    - Use requestIdleCallback for non-blocking preloading
    - _Requirements: 4.1, 4.2_
  
  - [x] 8.2 Optimize dropdown rendering for large datasets


    - Implement virtual scrolling for dropdowns with 100+ items
    - Add search/filter functionality for large dropdown lists
    - Lazy load dropdown options in batches if needed
    - _Requirements: 4.1_

- [ ]* 9. Write unit tests for DropdownManager
  - Create test file test/unit/dropdown-manager.test.js
  - Write tests for data fetching methods with mocked google.script.run
  - Write tests for caching behavior (cache hit, cache miss, cache expiration)
  - Write tests for error handling scenarios
  - Write tests for dropdown population methods
  - _Requirements: All requirements_

- [ ]* 10. Write integration tests for screen modules
  - Create test file test/integration/dropdown-integration.test.js
  - Write tests for Purchase screen dropdown initialization
  - Write tests for Sale screen dropdown initialization
  - Write tests for Menu screen dropdown initialization
  - Write tests for auto-population behavior (unit, price, ingredients)
  - Write tests for cache integration and sync button behavior
  - _Requirements: All requirements_

- [ ]* 11. Perform end-to-end testing
  - Test complete purchase flow with dropdown selection
  - Test complete sale flow with dropdown selection
  - Test menu management flow with dropdown selection
  - Test offline behavior with cached dropdowns
  - Test error recovery and retry mechanisms
  - Test performance with large datasets (100+ ingredients, 50+ menus)
  - _Requirements: All requirements_

- [x] 12. Documentation and deployment



  - Update user documentation to explain dropdown functionality
  - Add inline code comments for DropdownManager and modules
  - Create troubleshooting guide for common dropdown issues
  - Deploy updated Code.gs to Google Apps Script
  - Deploy updated frontend files
  - Verify functionality in production environment
  - _Requirements: All requirements_
