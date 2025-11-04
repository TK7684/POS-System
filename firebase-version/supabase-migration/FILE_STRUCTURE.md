# 📁 File Structure Guide

## 🎯 Essential Application Files
- **`index.html`** - Main POS application UI
- **`pos-app.js`** - Application logic and event handlers
- **`supabase-config.js`** - Supabase configuration and database functions
- **`test-setup.html`** - Test page for verifying Supabase setup

## 📊 Database Schema
- **`database-schema-clean.sql`** - ⭐ **Main schema file** - Run this to set up your database

## 🔧 SQL Maintenance Scripts (use when needed)
- **`check-menu-cost-data.sql`** - Check if menu cost data is complete
- **`fix-stock-transactions-trigger.sql`** - Fix stock transaction trigger issues
- **`improve-cost-calculation.sql`** - Advanced cost calculation methods (Weighted Average, FIFO)

## 📝 Documentation
- **`README.md`** - Main documentation
- **`QUICK_START.md`** - Quick start guide
- **`COST_CALCULATION_GUIDE.md`** - Guide for cost calculation methods
- **`TABLES_OVERVIEW.md`** - Overview of database tables
- **`AI_ASSISTANT_GUIDE.md`** - Guide for AI assistant chatbot

## 🗑️ Files You Can Delete (if not needed)
- **`fix-ingredient-costs.sql`** - One-time fix (already applied)
- **`update-ingredient-cost-trigger.sql`** - One-time fix (already applied)
- **`verify-menu-data-supabase.sql`** - Temporary verification script
- **`data-import-menus.sql`** - One-time data import script
- **`data-migration.js`** - One-time migration script (if migration is complete)

---

**💡 Tip:** If you're not sure about a file, check the comments at the top - they usually explain what it does!

