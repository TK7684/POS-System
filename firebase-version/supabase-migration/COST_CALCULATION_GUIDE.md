# Cost Calculation Guide

## Current System: Latest Purchase Price

**How it works:**
- When you record a purchase, the system updates `ingredient.cost_per_unit` with the **latest purchase price**
- Simple and immediate
- **Limitation:** Doesn't account for price fluctuations or bulk discounts

**Example:**
- Day 1: Buy 100 shrimp @ 5 baht each → `cost_per_unit = 5`
- Day 5: Buy 50 shrimp @ 6 baht each → `cost_per_unit = 6` (overwrites previous)
- Menu cost now uses 6 baht, even though you still have 100 at 5 baht price

## Better Options Available

### Option 1: Weighted Average Cost (RECOMMENDED)

**How it works:**
- Calculates: `(SUM(quantity × price)) / SUM(quantity)` from last 90 days
- Automatically accounts for price changes
- Best for: Most businesses, smooth cost tracking

**Example:**
- Day 1: Buy 100 @ 5 baht = 500 baht
- Day 5: Buy 50 @ 6 baht = 300 baht
- Weighted Average: (500 + 300) / (100 + 50) = **5.33 baht per unit**

**To enable:**
```sql
-- Run in Supabase SQL Editor:
-- File: improve-cost-calculation.sql (Option 1)
```

### Option 2: FIFO (First In, First Out)

**How it works:**
- Uses cost from oldest lot/purchase still in stock
- Best for: Perishable items, expiry tracking
- Requires: Lots table tracking (batch/lot system)

**To enable:**
- Requires lot tracking setup
- See `improve-cost-calculation.sql` for FIFO function

### Option 3: Manual Cost Management

You can manually set `cost_per_unit`:
- Via Stock Management UI: Edit ingredient → Set cost
- Via SQL: `UPDATE ingredients SET cost_per_unit = X WHERE id = ...`

## Switching Cost Calculation Methods

1. Open Supabase SQL Editor
2. Run the appropriate section from `improve-cost-calculation.sql`
3. The trigger will automatically use the new method for future purchases

## Viewing Purchase History & Cost Analysis

```sql
-- See all purchase prices for an ingredient
SELECT * FROM ingredient_purchase_analysis 
WHERE ingredient_name LIKE '%กุ้งสด%';

-- Recalculate all costs manually
SELECT * FROM recalculate_all_ingredient_costs();
```

## Operational Costs

**Current status:** Tables exist but no UI yet

**Available tables:**
- ✅ `expenses` - For utilities, rental, other expenses
- ✅ `labor_logs` - For employee costs (hours worked, hourly rate)
- ✅ `overheads` - For overhead cost allocation
- ✅ `cost_centers` - For department/location tracking
- ✅ `cogs` - For complete cost breakdown (ingredients + labor + overhead)

**What's missing:** UI to record these costs

**Files created:**
- `operational-costs-ui.js` - Functions ready to add to your app
- Can be integrated into Stock Management or create new "Expenses" tab

## Quick Setup

### 1. Switch to Weighted Average Cost (Recommended)
```sql
-- In Supabase SQL Editor, run:
-- improve-cost-calculation.sql (Option 1)
```

### 2. View Cost Analysis
```sql
SELECT * FROM ingredient_purchase_analysis 
ORDER BY ingredient_name;
```

### 3. Recalculate All Costs
```sql
SELECT * FROM recalculate_all_ingredient_costs();
```

## Cost Update Flow

1. **Record Purchase** → Trigger updates `cost_per_unit`
2. **Menu Cost Calculation** → Uses `ingredient.cost_per_unit`
3. **Real-time Updates** → Changes reflect immediately

## Best Practices

1. **Use Weighted Average** for most ingredients (handles price fluctuations)
2. **Use FIFO** for perishables with expiry dates
3. **Review monthly** using `ingredient_purchase_analysis` view
4. **Recalculate quarterly** if you notice significant price changes

