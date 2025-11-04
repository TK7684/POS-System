# Requirements Document

## Introduction

The POS system currently has non-functional dropdown menus across multiple screens (Purchase, Sale, and Menu screens). Users cannot select ingredients, menus, platforms, or units because the dropdowns are not being populated with data from the Google Sheets backend. This critical issue prevents users from recording purchases, sales, or managing menu recipes, making the core functionality of the POS system unusable.

## Requirements

### Requirement 1: Populate Ingredient Dropdowns

**User Story:** As a restaurant staff member, I want to see a list of available ingredients in the dropdown menus, so that I can select the correct ingredient when recording purchases or managing menu recipes.

#### Acceptance Criteria

1. WHEN the Purchase screen loads THEN the system SHALL fetch all ingredients from the Ingredients sheet and populate the "วัตถุดิบ" (Ingredient) dropdown
2. WHEN the Menu screen loads THEN the system SHALL fetch all ingredients from the Ingredients sheet and populate the "วัตถุดิบ" (Ingredient) dropdown
3. WHEN an ingredient is selected in the Purchase screen THEN the system SHALL automatically populate the unit dropdown with the appropriate buy_unit for that ingredient
4. WHEN an ingredient is selected in the Menu screen THEN the system SHALL automatically populate the unit field with the stock_unit for that ingredient
5. IF the ingredient fetch fails THEN the system SHALL display an error message and provide a retry option

### Requirement 2: Populate Menu Dropdowns

**User Story:** As a restaurant staff member, I want to see a list of available menu items in the dropdown, so that I can select the correct menu when recording sales or managing recipes.

#### Acceptance Criteria

1. WHEN the Sale screen loads THEN the system SHALL fetch all menus from the Menus sheet and populate the "เมนู" (Menu) dropdown
2. WHEN the Menu screen loads THEN the system SHALL fetch all menus from the Menus sheet and populate the "เมนู" (Menu) dropdown
3. WHEN a menu is selected in the Sale screen THEN the system SHALL automatically populate the price field with the default selling price for that menu
4. WHEN a menu is selected in the Menu screen THEN the system SHALL load and display all ingredients currently associated with that menu
5. IF the menu fetch fails THEN the system SHALL display an error message and provide a retry option

### Requirement 3: Populate Platform Dropdown

**User Story:** As a restaurant staff member, I want to see a list of available sales platforms in the dropdown, so that I can accurately record which platform each sale came from.

#### Acceptance Criteria

1. WHEN the Sale screen loads THEN the system SHALL populate the "แพลตฟอร์ม" (Platform) dropdown with predefined platform options (Walk-in, Grab, Line Man, Shopee Food, Foodpanda)
2. WHEN a platform is selected THEN the system SHALL store the platform value with the sale record
3. IF additional platforms exist in the Platforms sheet THEN the system SHALL include those in the dropdown as well

### Requirement 4: Implement Caching and Performance Optimization

**User Story:** As a restaurant staff member, I want the dropdowns to load quickly without delays, so that I can efficiently record transactions during busy periods.

#### Acceptance Criteria

1. WHEN dropdown data is fetched THEN the system SHALL cache the data locally for 5 minutes
2. WHEN navigating between screens THEN the system SHALL reuse cached data instead of refetching
3. WHEN the sync button is clicked THEN the system SHALL clear the cache and refetch fresh data
4. WHEN the app is offline THEN the system SHALL use cached data if available
5. IF cached data is older than 5 minutes THEN the system SHALL automatically refetch in the background

### Requirement 5: Handle Loading States and Errors

**User Story:** As a restaurant staff member, I want to see clear feedback when dropdowns are loading or if there's an error, so that I understand what's happening and can take appropriate action.

#### Acceptance Criteria

1. WHEN dropdown data is being fetched THEN the system SHALL display a loading indicator in the dropdown
2. WHEN dropdown data fails to load THEN the system SHALL display an error message with a retry button
3. WHEN the retry button is clicked THEN the system SHALL attempt to refetch the dropdown data
4. WHEN dropdown data loads successfully THEN the system SHALL remove the loading indicator and display the options
5. IF no data is available THEN the system SHALL display a helpful message indicating no items exist

### Requirement 6: Implement Google Apps Script Backend Functions

**User Story:** As a system, I need backend functions to retrieve ingredient and menu data, so that the frontend can populate dropdowns with accurate information.

#### Acceptance Criteria

1. WHEN the frontend calls getIngredients() THEN the backend SHALL return an array of all active ingredients with id, name, stock_unit, and buy_unit
2. WHEN the frontend calls getMenus() THEN the backend SHALL return an array of all active menus with id, name, and price
3. WHEN the frontend calls getMenuIngredients(menuId) THEN the backend SHALL return an array of ingredients used in that menu with quantities
4. IF a sheet doesn't exist THEN the backend SHALL return an empty array instead of throwing an error
5. WHEN backend functions are called THEN they SHALL use caching to improve performance

### Requirement 7: Initialize Dropdowns on Screen Load

**User Story:** As a restaurant staff member, I want dropdowns to be automatically populated when I navigate to a screen, so that I don't have to manually refresh or wait.

#### Acceptance Criteria

1. WHEN the Purchase screen is displayed THEN the system SHALL automatically initialize ingredient and unit dropdowns
2. WHEN the Sale screen is displayed THEN the system SHALL automatically initialize menu and platform dropdowns
3. WHEN the Menu screen is displayed THEN the system SHALL automatically initialize both menu and ingredient dropdowns
4. WHEN a screen is revisited THEN the system SHALL use cached data if available
5. IF initialization fails THEN the system SHALL display an error and provide a manual refresh option
