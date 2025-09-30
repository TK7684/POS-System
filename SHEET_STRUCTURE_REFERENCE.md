# Complete Sheet Structure Reference

## Sheet Names and Column Mappings

### Sheet Constants (Code.gs.js)
```javascript
const SHEET_ING = 'Ingredients';
const SHEET_MENU = 'Menus';
const SHEET_MENU_RECIPES = 'MenuRecipes';
const SHEET_PUR = 'Purchases';
const SHEET_SALE = 'Sales';
const SHEET_USERS = 'Users';
const SHEET_COST_CENTERS = 'CostCenters';
const SHEET_PACKAGING = 'Packaging';
const SHEET_LOTS = 'Lots';
const SHEET_PLATFORMS = 'Platforms';
const SHEET_STOCKS = 'Stocks';
const SHEET_LABOR_LOGS = 'LaborLogs';
const SHEET_WASTE = 'Waste';
const SHEET_MARKET_RUNS = 'MarketRuns';
const SHEET_MARKET_ITEMS = 'MarketRunItems';
const SHEET_PACKING = 'Packing';
const SHEET_PACK_PUR = 'PackingPurchases';
const SHEET_OVERHEADS = 'Overheads';
const SHEET_MENU_EXTRAS = 'MenuExtras';
const SHEET_BATCH_LINES = 'BatchCostLines';
const SHEET_BATCHES = 'Batches';
```

## Quick Reference - Most Used Sheets

| Sheet | Purpose | Key Columns |
|-------|---------|-------------|
| `Ingredients` | Master ingredient list | `id`, `name`, `stock_unit`, `buy_unit` |
| `Purchases` | Purchase transactions | `date`, `ingredient_id`, `qty_buy`, `total_price`, `unit_price` |
| `Sales` | Sales transactions | `date`, `platform`, `menu_id`, `qty`, `price_per_unit` |
| `MenuRecipes` | BOM (Bill of Materials) | `menu_id`, `ingredient_id`, `qty_per_serve` |
| `Users` | User management | `user_key`, `role`, `name`, `active` |

### 1. Ingredients Sheet
**Sheet Name:** `Ingredients`
**Columns:**
- `id` - Ingredient ID (e.g., ING0001)
- `name` - Ingredient name (e.g., มะนาว)
- `stock_unit` - Stock unit (e.g., ลูก)
- `unit_buy` - Buy unit (e.g., แพ็ค)
- `buy_to_stock_ratio` - Conversion ratio (e.g., 0.08)
- `min_stock` - Minimum stock level (e.g., 30)

### 2. Menus Sheet
**Sheet Name:** `Menus`
**Columns:**
- `menu_id` - Menu ID
- `name` - Menu name
- `description` - Menu description
- `category` - Menu category
- `active` - Active status

### 3. MenuRecipes Sheet
**Sheet Name:** `MenuRecipes`
**Columns:**
- `menu_id` - Menu ID
- `ingredient_id` - Ingredient ID
- `ingredient_name` - Ingredient name
- `qty_per_serve` - Quantity per serve (stock units)
- `note` - Notes
- `created_at` - Creation timestamp
- `user_key` - User who created

### 4. Purchases Sheet
**Sheet Name:** `Purchases`
**Columns:**
- `date` - Purchase date
- `lot_id` - Lot ID
- `ingredient_id` - Ingredient ID
- `ingredient_name` - Ingredient name
- `qty_buy` - Quantity bought (buy units)
- `unit` - Unit of measurement (kg, pieces, liters, etc.)
- `total_price` - Total price paid (baht)
- `unit_price` - Price per buy unit (calculated: total_price ÷ qty_buy)
- `qty_stock` - Quantity in stock units (converted)
- `cost_per_stock` - Cost per stock unit
- `remaining_stock` - Remaining stock
- `supplier_note` - Supplier/notes

### 5. Sales Sheet
**Sheet Name:** `Sales`
**Columns:**
- `date` - Sale date
- `platform` - Platform (e.g., ร้าน, Line Man)
- `menu_id` - Menu ID
- `qty` - Quantity sold
- `price_per_unit` - Price per unit
- `net_per_unit` - Net price per unit (after platform fees)
- `gross` - Gross revenue
- `net` - Net revenue
- `cogs` - Cost of goods sold
- `profit` - Profit

### 6. Users Sheet
**Sheet Name:** `Users`
**Columns:**
- `user_key` - User key/email
- `role` - User role (OWNER, PARTNER, STAFF)
- `name` - User name
- `active` - Active status
- `created_at` - Creation date

### 7. CostCenters Sheet
**Sheet Name:** `CostCenters`
**Columns:**
- `cost_center_id` - Cost center ID
- `name` - Cost center name
- `standard_rate` - Standard hourly rate
- `active` - Active status

### 8. Packaging Sheet
**Sheet Name:** `Packaging`
**Columns:**
- `pkg_id` - Packaging ID
- `name` - Packaging name
- `unit` - Unit of measurement
- `active` - Active status

### 9. Lots Sheet
**Sheet Name:** `Lots`
**Columns:**
- `lot_id` - Lot ID
- `ingredient_id` - Ingredient ID
- `date` - Lot date
- `qty_initial` - Initial quantity
- `qty_remaining` - Remaining quantity
- `cost_per_unit` - Cost per unit

### 10. Platforms Sheet
**Sheet Name:** `Platforms`
**Columns:**
- `platform` - Platform name
- `fee_percentage` - Fee percentage
- `active` - Active status

### 11. Stocks Sheet
**Sheet Name:** `Stocks`
**Columns:**
- `ingredient_id` - Ingredient ID
- `current_stock` - Current stock level
- `last_updated` - Last update date
- `min_stock` - Minimum stock level

### 12. LaborLogs Sheet
**Sheet Name:** `LaborLogs`
**Columns:**
- `date` - Date
- `cost_center_id` - Cost center ID
- `hours` - Hours worked
- `rate` - Hourly rate
- `amount` - Total amount
- `user_key` - User who logged
- `note` - Notes

### 13. Waste Sheet
**Sheet Name:** `Waste`
**Columns:**
- `date` - Waste date
- `ingredient_id` - Ingredient ID
- `qty_wasted` - Quantity wasted
- `cost` - Cost of waste
- `user_key` - User who logged
- `note` - Notes

### 14. MarketRuns Sheet
**Sheet Name:** `MarketRuns`
**Columns:**
- `run_id` - Run ID
- `date` - Run date
- `buyer` - Buyer name
- `note` - Notes
- `user_key` - User who created
- `status` - Run status

### 15. MarketRunItems Sheet
**Sheet Name:** `MarketRunItems`
**Columns:**
- `run_id` - Run ID
- `ingredient_id` - Ingredient ID
- `qty_buy` - Quantity bought
- `unit_price` - Unit price
- `lot_id` - Generated lot ID
- `note` - Notes

### 16. Packing Sheet
**Sheet Name:** `Packing`
**Columns:**
- `packing_id` - Packing ID
- `name` - Packing name
- `unit` - Unit
- `cost_per_unit` - Cost per unit
- `active` - Active status

### 17. PackingPurchases Sheet
**Sheet Name:** `PackingPurchases`
**Columns:**
- `date` - Purchase date
- `packing_id` - Packing ID
- `qty` - Quantity
- `unit_price` - Unit price
- `total_cost` - Total cost
- `supplier` - Supplier
- `note` - Notes

### 18. Overheads Sheet
**Sheet Name:** `Overheads`
**Columns:**
- `overhead_id` - Overhead ID
- `name` - Overhead name
- `type` - Type (hourly, per_kg, per_serve)
- `rate` - Rate
- `active` - Active status

### 19. MenuExtras Sheet
**Sheet Name:** `MenuExtras`
**Columns:**
- `menu_id` - Menu ID
- `extra_type` - Extra type
- `cost` - Extra cost
- `note` - Notes

### 20. BatchCostLines Sheet
**Sheet Name:** `BatchCostLines`
**Columns:**
- `batch_id` - Batch ID
- `cost_type` - Cost type
- `amount` - Amount
- `note` - Notes

### 21. Batches Sheet
**Sheet Name:** `Batches`
**Columns:**
- `batch_id` - Batch ID
- `date` - Batch date
- `menu_id` - Menu ID
- `plan_qty` - Planned quantity
- `actual_qty` - Actual quantity
- `weight_kg` - Weight in kg
- `hours` - Hours worked
- `recipe_cost_per_serve` - Recipe cost per serve
- `pack_per_serve` - Packaging cost per serve
- `oh_per_hour` - Overhead per hour
- `oh_per_kg` - Overhead per kg
- `total_cost` - Total cost
- `status` - Batch status
- `user_key` - User who created
- `note` - Notes

## Recent Updates

### Enhanced Purchase Form (Latest)
- **New Fields Added:**
  - `unit` - Custom unit field (kg, pieces, liters, etc.)
  - `total_price` - Total amount paid in baht
  - `unit_price` - Auto-calculated price per unit
- **Auto-Calculation:** Price per unit = Total price ÷ Quantity
- **Enhanced Validation:** All new fields are validated
- **Better UX:** Clear confirmation popup with all details

### English Conversion (Completed)
- All sheet names converted to English
- All column headers converted to English
- All code constants updated
- Functions updated to use English column names
- Frontend labels remain in Thai for user experience

## Implementation Notes

1. **Sheet Names:** All in English (e.g., `Ingredients`, `Purchases`, `Sales`)
2. **Column Headers:** All in English (e.g., `ingredient_id`, `total_price`, `supplier_note`)
3. **Code Constants:** Updated to use English names (e.g., `SHEET_ING`, `SHEET_PUR`)
4. **Functions:** Updated to use new English column names
5. **Frontend:** Labels remain in Thai for better user experience
6. **Data Validation:** Enhanced validation for all new fields
7. **Auto-Calculation:** Price per unit automatically calculated from total price

## Testing Checklist

### Core Functions
- [ ] Test ingredient loading
- [ ] Test purchase recording with new fields
- [ ] Test sales recording
- [ ] Test menu management
- [ ] Test reporting functions
- [ ] Test all CRUD operations

### New Purchase Form Features
- [ ] Test unit field input
- [ ] Test total price input
- [ ] Test auto-calculation of price per unit
- [ ] Test form validation
- [ ] Test confirmation popup
- [ ] Test data storage in Google Sheet

### Data Integrity
- [ ] Verify data integrity
- [ ] Test error handling
- [ ] Test English column mapping
- [ ] Test sheet structure consistency
- [ ] Test user permissions

### Menu Cost Calculation
- [ ] Test menu cost calculation
- [ ] Test missing ingredient detection
- [ ] Test auto-add missing ingredients
- [ ] Test price data validation
