# POS System - ระบบขายหน้าร้าน

Optimized POS System with PWA, Offline Support, and Enhanced Dropdown Functionality

## 🚀 Features

### Core Functionality
- **Purchase Management** - จัดการการซื้อวัตถุดิบ
- **Sales Management** - จัดการการขาย
- **Menu & BOM Management** - จัดการเมนูและส่วนผสม
- **Profit Reports** - รายงานกำไร
- **Inventory Tracking** - ติดตามสต๊อก

### Enhanced Dropdown System
- **🔄 Automatic Data Loading** - โหลดข้อมูลอัตโนมัติจาก Google Sheets
- **⚡ Smart Caching** - แคชข้อมูล 5 นาที เพื่อประสิทธิภาพ
- **📱 Offline Support** - ใช้งานได้แม้ไม่มีอินเทอร์เน็ต
- **🎯 Auto-Population** - เติมข้อมูลอัตโนมัติ (หน่วย, ราคา)
- **🛠️ Error Recovery** - จัดการข้อผิดพลาดและลองใหม่อัตโนมัติ
- **🔍 Search & Filter** - ค้นหาในรายการขนาดใหญ่
- **⏰ Intelligent Preloading** - โหลดข้อมูลล่วงหน้าตามเวลา

### Technical Features
- **PWA Support** - ติดตั้งเป็นแอปได้
- **Responsive Design** - ใช้งานได้ทุกอุปกรณ์
- **Touch Optimized** - เหมาะสำหรับหน้าจอสัมผัส
- **Performance Optimized** - เร็วและประหยัดแบตเตอรี่

## 📋 Quick Start

### Prerequisites
- Google Apps Script project
- Google Sheets with data structure
- Modern web browser

### Installation

1. **Setup Google Sheets**
   ```
   - Ingredients Sheet: id, name, stock_unit, buy_unit, buy_to_stock_ratio
   - Menus Sheet: id, name, price
   - MenuRecipes Sheet: menu_id, ingredient_id, quantity, unit
   - Platforms Sheet: id, name (optional)
   ```

2. **Deploy Google Apps Script**
   ```javascript
   // Copy Code.gs content to your Apps Script project
   // Deploy as web app with appropriate permissions
   ```

3. **Deploy Frontend**
   ```bash
   # Upload all files to your web server
   # Ensure proper file structure is maintained
   ```

4. **Configure**
   ```javascript
   // Update API endpoints in configuration
   // Set cache settings as needed
   ```

## 🎯 Usage Guide

### Purchase Screen (หน้าซื้อ)
1. เลือกวัตถุดิบ → หน่วยจะถูกเลือกอัตโนมัติ
2. ใส่จำนวนและราคา
3. บันทึกการซื้อ

### Sale Screen (หน้าขาย)
1. เลือกแพลตฟอร์ม (Walk-in, Grab, etc.)
2. เลือกเมนู → ราคาจะถูกใส่อัตโนมัติ
3. ปรับจำนวนและราคาตามต้องการ
4. บันทึกการขาย

### Menu Management (จัดการเมนู)
1. เลือกเมนูเพื่อดูส่วนผสม
2. เพิ่มวัตถุดิบใหม่ → หน่วยจะถูกใส่อัตโนมัติ
3. ใส่จำนวนที่ใช้ต่อเสิร์ฟ
4. บันทึกส่วนผสม

## 🔧 Dropdown System

### Auto-Population Features
- **Ingredient → Unit**: เลือกวัตถุดิบแล้วหน่วยจะถูกเลือกอัตโนมัติ
- **Menu → Price**: เลือกเมนูแล้วราคาจะถูกใส่อัตโนมัติ
- **Menu → Ingredients**: เลือกเมนูแล้วจะแสดงส่วนผสมที่มี

### Error Handling
- **Network Issues**: แสดงข้อความข้อผิดพลาดและปุ่มลองใหม่
- **Offline Mode**: ใช้ข้อมูลที่แคชไว้เมื่อไม่มีอินเทอร์เน็ต
- **Timeout**: ลองใหม่อัตโนมัติด้วย exponential backoff

### Performance Optimization
- **Caching**: แคชข้อมูล 5 นาที
- **Batch Loading**: โหลดข้อมูลเป็นชุดสำหรับรายการใหญ่
- **Search**: ค้นหาแบบ real-time สำหรับรายการมาก
- **Preloading**: โหลดข้อมูลล่วงหน้าตามเวลาใช้งาน

## 📚 Documentation

- **[User Guide](docs/dropdown-functionality-guide.md)** - คู่มือการใช้งาน
- **[Troubleshooting](docs/dropdown-troubleshooting-guide.md)** - แก้ไขปัญหา
- **[Deployment](docs/dropdown-deployment-checklist.md)** - การติดตั้ง

## 🛠️ Technical Architecture

### Frontend Structure
```
js/
├── core/
│   ├── DropdownManager.js      # Main dropdown functionality
│   └── modules/
│       ├── PurchaseModule.js   # Purchase screen integration
│       ├── SaleModule.js       # Sale screen integration
│       └── MenuModule.js       # Menu screen integration
├── critical.js                 # App initialization
└── ...
```

### Backend (Google Apps Script)
```javascript
// Core functions
getIngredients()           // Fetch all ingredients
getMenus()                 // Fetch all menus
getMenuIngredients(id)     // Fetch menu ingredients
getPlatforms()             // Fetch sales platforms
```

### Data Flow
```
Google Sheets → Apps Script → Frontend Cache → UI Components
```

## 🔍 Troubleshooting

### Common Issues

**Dropdowns not loading:**
- Check internet connection
- Click error message to retry
- Use sync button (🔄) to refresh

**Auto-population not working:**
- Refresh the page
- Check browser console for errors
- Verify data in Google Sheets

**Performance issues:**
- Use search for large lists
- Clear cache periodically
- Check network speed

### Debug Commands
```javascript
// Check dropdown status
window.dropdownManager?.getDropdownState('p_ing')

// Retry failed dropdowns
window.dropdownManager?.retryAllFailed()

// Clear cache
window.dropdownManager?.clearCache()
```

## 📱 Mobile Support

- **Touch-friendly interface** - ปุ่มและ dropdown ขนาดเหมาะสำหรับสัมผัส
- **Responsive design** - ปรับขนาดตามหน้าจอ
- **Offline capability** - ใช้งานได้แม้ไม่มีสัญญาณ
- **PWA installation** - ติดตั้งเป็นแอปบนมือถือได้

## 🚀 Performance

### Benchmarks
- **Initial load**: < 3 seconds
- **Cached data**: < 500ms
- **Search results**: < 300ms
- **Auto-population**: < 100ms

### Optimization Features
- Intelligent caching with 5-minute TTL
- Batch loading for large datasets (100+ items)
- Search functionality for quick access
- Time-based preloading (morning: ingredients, lunch/dinner: menus)

## 🔒 Security

- **Input validation** on all form fields
- **XSS prevention** with proper sanitization
- **CSRF protection** via Google Apps Script
- **Access control** through Google account permissions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Update documentation
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- **Technical Issues**: Check troubleshooting guide first
- **Feature Requests**: Submit via GitHub issues
- **Emergency Support**: Contact system administrator

---

**Made with ❤️ for efficient restaurant management**
