# Dropdown Functionality Guide

## Overview

The POS system now includes enhanced dropdown functionality that automatically populates ingredient, menu, and platform dropdowns with data from Google Sheets. This guide explains how to use the dropdown features effectively.

## Features

### 🔄 Automatic Data Loading
- Dropdowns automatically load data when you navigate to different screens
- Data is cached for 5 minutes to improve performance
- Offline support using cached data when internet is unavailable

### 🎯 Smart Auto-Population
- **Purchase Screen**: Selecting an ingredient automatically sets the appropriate unit
- **Sale Screen**: Selecting a menu automatically fills in the price
- **Menu Screen**: Selecting an ingredient shows the stock unit, selecting a menu loads its ingredients

### ⚡ Performance Optimizations
- Intelligent preloading based on time of day
- Optimized rendering for large datasets (100+ items)
- Search functionality for large dropdown lists
- Batch loading for better performance

### 🛠️ Error Handling & Recovery
- User-friendly error messages in Thai
- Automatic retry with exponential backoff
- Manual retry buttons for failed operations
- Offline indicators when using cached data

## How to Use

### Purchase Screen (ซื้อ)

1. **Select Ingredient (วัตถุดิบ)**
   - Click the ingredient dropdown
   - Choose the ingredient you want to purchase
   - The unit dropdown will automatically update with the correct buying unit

2. **Unit Selection**
   - The unit is automatically selected based on the ingredient
   - You can change it if needed from the available units

3. **Troubleshooting**
   - If dropdown shows "❌ Error message", click on it to retry
   - If showing "📴 Offline", you're using cached data

### Sale Screen (ขาย)

1. **Select Platform (แพลตฟอร์ม)**
   - Choose the sales platform (Walk-in, Grab, Line Man, etc.)

2. **Select Menu (เมนู)**
   - Click the menu dropdown
   - Choose the menu item
   - The price field will automatically fill with the menu's default price

3. **Adjust Price**
   - You can modify the auto-filled price if needed

### Menu Management Screen (จัดการเมนู)

1. **Select Menu (เมนู)**
   - Choose a menu to view or edit its ingredients
   - Existing ingredients will be displayed below

2. **Add Ingredients**
   - Select an ingredient from the dropdown
   - The unit field will show the stock unit automatically
   - Enter the quantity needed per serving

## Error Messages & Solutions

### Common Error Messages

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| ❌ ไม่สามารถเชื่อมต่อได้ | Network connection failed | Check internet connection, click to retry |
| ❌ หมดเวลาการเชื่อมต่อ | Request timeout | Connection is slow, click to retry |
| ❌ ไม่พบข้อมูล | No data found | Contact system administrator |
| ❌ เซิร์ฟเวอร์ขัดข้อง | Server error | Temporary server issue, try again later |
| 📴 เลือก... (ออฟไลน์) | Using offline data | You're offline, using cached data |

### Troubleshooting Steps

1. **Dropdown Won't Load**
   - Check internet connection
   - Click on the error message to retry
   - Use the sync button (🔄) to refresh all data

2. **Outdated Data**
   - Click the sync button to refresh
   - Data automatically refreshes every 5 minutes

3. **Slow Loading**
   - Large datasets are loaded in batches
   - Use search functionality for faster access
   - Data is preloaded during off-peak hours

## Advanced Features

### Search Functionality
For dropdowns with many items (100+):
- A search box appears above the dropdown
- Type to filter options
- Results counter shows number of matches

### Batch Loading
For very large datasets:
- Items load in batches of 50
- "⬇️ โหลดเพิ่ม..." option appears to load more
- Click to load the next batch

### Preloading Schedule
Data is automatically preloaded based on time:
- **9-11 AM**: Ingredients (morning purchase time)
- **11 AM-2 PM**: Menus (lunch sales)
- **5-9 PM**: Menus (dinner sales)
- **10 PM-8 AM**: All data (maintenance time)

## Tips for Best Performance

1. **Keep Internet Connection Stable**
   - Dropdowns work offline but need internet for fresh data

2. **Use Sync Button Regularly**
   - Click sync (🔄) when you add new ingredients or menus

3. **Search for Quick Access**
   - Use search functionality for large lists
   - Type ingredient/menu names to filter quickly

4. **Monitor Status**
   - Look for offline indicators (📴)
   - Check error messages and retry when needed

## Keyboard Shortcuts

- **Tab**: Navigate between dropdowns
- **Enter**: Open dropdown
- **Arrow Keys**: Navigate options
- **Esc**: Close dropdown
- **Type**: Search in large dropdowns

## Mobile Usage

- **Touch-friendly**: All dropdowns are optimized for touch
- **Large touch targets**: Easy to tap on mobile devices
- **Responsive design**: Works on all screen sizes
- **Offline support**: Works without internet using cached data

## Getting Help

If you encounter issues:

1. **Check Error Messages**: Read the Thai error message for guidance
2. **Try Retry**: Click on error messages to retry
3. **Use Sync**: Click the sync button to refresh data
4. **Contact Support**: If problems persist, contact system administrator

## Technical Notes

- Data is cached for 5 minutes for performance
- Automatic retry with exponential backoff (1s, 2s, 4s delays)
- Maximum 3 retry attempts before showing final error
- Offline data persists across browser sessions
- Search is case-insensitive and matches partial text