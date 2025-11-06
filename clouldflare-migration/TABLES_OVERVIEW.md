# Complete Database Schema Overview

## ✅ All Tables from Google Sheets - Fully Implemented

This database schema includes **ALL** tables from your [Google Sheets](https://docs.google.com/spreadsheets/d/1qb5_R0JhLINnU7KL3q7hFpGWT0m7OCU1sBMZ8hdUs14/edit?gid=330579524#gid=330579524).

---

## 📊 Core Tables (13 tables)

### 1. **users** ✅
- User accounts and authentication
- Roles: admin, manager, user
- Replaces Firebase Auth

### 2. **platforms** ✅
- Delivery platforms (ร้าน, Grab, FoodPanda, Line Man)
- Commission rates

### 3. **categories** ✅
- Categories for ingredients and menus
- Type: ingredient or menu

### 4. **ingredients** ✅
- Ingredient inventory
- Stock levels, suppliers, costs

### 5. **menus** ✅
- Menu items with pricing
- Availability, preparation time

### 6. **menu_recipes** ✅
- Junction table linking menus to ingredients
- Quantity per serve

### 7. **sales** ✅
- Sales transactions
- Order details, payment info

### 8. **purchases** ✅
- Ingredient purchases
- Vendor info, receipts

### 9. **stock_transactions** ✅
- Audit trail for all stock movements
- Links to sales, purchases, adjustments

### 10. **stock_adjustments** ✅
- Manual stock adjustments
- Damage, theft, count corrections

### 11. **expenses** ✅
- Business expenses tracking
- Categories, receipts, approvals

### 12. **labor_logs** ✅
- Employee time tracking
- Shifts, hours worked, pay

### 13. **waste** ✅
- Waste tracking for ingredients/menus
- Spoilage, overproduction

---

## 🔥 Advanced Inventory & Costing (13 tables)

### 14. **cost_centers** ✅
- Department/location cost tracking
- Hierarchical structure

### 15. **packaging** ✅
- Packaging materials inventory
- Stock levels, costs

### 16. **lots** ✅
- Batch/lot tracking for ingredients
- Expiry dates, remaining quantities
- FIFO inventory management

### 17. **market_runs** ✅
- Bulk purchasing trips
- Market visits with multiple items

### 18. **market_run_items** ✅
- Items purchased in each market run
- Links to lots and ingredients
- **Matches your spreadsheet exactly:**
  - run_id
  - ingredient_id
  - qty_buy
  - unit_price
  - lot_id
  - note

### 19. **cogs** ✅
- Cost of Goods Sold tracking
- Breakdown: ingredients, packaging, labor, overhead

### 20. **stocks** ✅
- Detailed stock tracking with lot info
- Location-based inventory

### 21. **packing** ✅
- Finished product packing records
- Batch tracking for prepared items

### 22. **packing_purchases** ✅
- Packaging material purchases
- Separate from ingredient purchases

### 23. **overheads** ✅
- Overhead cost allocation
- Period-based tracking
- Allocation methods: equal, proportional, manual

### 24. **menu_extras** ✅
- Add-ons and customizations
- Extra toppings, sauces

### 25. **batches** ✅
- Production batches
- Batch costing for manufactured items

### 26. **batch_cost_lines** ✅
- Detailed cost breakdown per batch
- Cost types: ingredient, packaging, labor, overhead

---

## 📈 Reporting Views (9 views)

### Analytics & Insights

1. **low_stock_view** - Items needing reorder
2. **recent_transactions_view** - Recent sales & purchases
3. **daily_sales_summary** - Daily revenue by platform
4. **market_run_summary** - Market trip summaries
5. **expired_lots_view** - Expired inventory tracking
6. **cogs_analysis** - Cost analysis by menu item
7. **packaging_inventory_value** - Packaging stock value
8. **batch_cost_summary** - Production batch costs
9. **stock_by_location** - Inventory by location

---

## ⚙️ Automated Functions (8 functions)

### Smart Business Logic

1. **calculate_menu_cost()** - Auto-calculate recipe costs
2. **update_stock_after_transaction()** - Auto-update inventory on sales/purchases
3. **update_menu_cost()** - Auto-update menu profit margins
4. **update_updated_at_column()** - Timestamp management
5. **update_market_run_total()** - Auto-sum market run totals
6. **update_packaging_stock()** - Track packaging inventory
7. **calculate_batch_cost()** - Calculate batch production costs
8. **update_batch_total_cost()** - Auto-update batch costs

---

## 🔐 Security Features

### Row Level Security (RLS)
- Users can only see their own data
- Admin role for full access
- Public read for reference data (platforms, categories, menus)

### Policies Applied:
- users, sales, purchases, expenses
- labor_logs, waste, stock_adjustments
- platforms (with update permissions)

---

## 📊 Performance Optimizations

### 55+ Indexes Created
- All foreign keys indexed
- Date fields for reporting
- Status fields for filtering
- Composite indexes for complex queries

### Real-time Enabled
- platforms
- sales
- ingredients
- menus

---

## 🎯 Table Count Summary

| Category | Count |
|----------|-------|
| Core Tables | 13 |
| Advanced Tables | 13 |
| **Total Tables** | **26** |
| Views | 9 |
| Functions | 8 |
| Triggers | 18 |
| Indexes | 55+ |

---

## 🚀 Ready to Use

All tables match your Google Sheets structure with:
- ✅ Same column names
- ✅ Same relationships
- ✅ Enhanced with UUIDs, timestamps, and foreign keys
- ✅ Automatic calculations
- ✅ Data integrity constraints
- ✅ Performance optimizations

---

## 📝 Next Steps

1. Run `database-schema-clean.sql` in Supabase
2. Enable real-time for tables you need
3. Test with `test-setup.html`
4. Migrate data using `data-migration.js`

---

**Generated:** October 31, 2025  
**Database:** Supabase PostgreSQL  
**Version:** 1.0 - Complete Feature Parity with Google Sheets

