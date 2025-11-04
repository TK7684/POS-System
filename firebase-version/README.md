# POS & Inventory System - Firebase Version

A comprehensive Point of Sale (POS) and inventory management system with real-time Firebase integration, Google Sheets synchronization, and Line Bot automation capabilities.

## 🚀 Features

### Core POS Functionality
- ✅ **Google Sign-In Authentication** - Secure Firebase authentication with Google
- ✅ **Email/Password Login** - Traditional authentication method
- ✅ **Real-time Inventory Tracking** - Live stock monitoring
- ✅ **Sales & Purchase Recording** - Complete transaction management
- ✅ **Multi-platform Support** - ร้าน, Grab, FoodPanda, Line Man
- ✅ **Comprehensive Menu System** - Complete Thai menu with 32+ items
- ✅ **Ingredient Management** - Detailed recipe and stock tracking
- ✅ **Low Stock Alerts** - Automated notifications for reorder

### Advanced Integrations
- 📊 **Google Sheets Integration** - Automatic data synchronization
- 💬 **Line Bot Integration** - Automated purchase processing from Line
- 🔍 **Slip Image Processing** - OCR for payment slip analysis
- 📱 **Mobile Responsive** - PWA-ready for tablets and phones
- 🌐 **Offline Support** - Works without internet connection
- 📈 **Real-time Analytics** - Live dashboard with metrics
- 🔧 **Debug Panel** - Comprehensive logging and troubleshooting

### Menu Items Included
The system includes your complete Thai menu:

#### กุ้งแช่น้ำปลา
- A1: กุ้งแช่น้ำปลาแซ่บซี๊ด 7 ตัว (฿139)
- A2: กุ้งแช่น้ำปลาแซ่บซี๊ด 12 ตัว (฿179)
- D: กุ้งแช่น้ำปลาแซ่บซี๊ด 70 ตัว (฿1179)

#### กุ้งดองซีอิ๊ว
- B1: กุ้งดองซีอิ๊วสไตล์เกาหลี 7 ตัว (฿139)
- B2: กุ้งดองซีอิ๊วสไตล์เกาหลี 12 ตัว (฿192)

#### เซ็ตเมนู
- SetB1: เซ็ตกุ้งดองซีอิ๊ว 7 ตัว (฿149)
- SetB2: เซ็ตกุ้งดองซีอิ๊ว 12 ตัว (฿215)
- SetB3: เซ็ตแซ่บคุ้ม 7 ตัว + ข้าวญี่ปุ่น + สาหร่าย (฿169)
- SetB4: เซ็ตแซ่บคุ้ม 12 ตัว + ข้าวญี่ปุ่น + สาหร่าย (฿219)

#### แซลมอน
- C1: แซลมอนดองซีอิ๊ว เซ็ตเล็ก (฿256)
- C2: แซลมอนดองซีอิ๋วเกาหลี เซ็ตใหญ่ (฿299)

#### คอมโบเมนู
- B1C1: แซลมอน + กุ้ง ดองซีอิ๊วเกาหลี (฿239)
- SetB1C1: เซ็ตแซ่บคุ้ม แซลม่อน+กุ้งดองซีอิ๊ว + ข้าวญี่ปุ่น + สาหร่าย (฿279)

#### กุ้งลุยสวน/ลาบ
- E1: กุ้งสด ลุยสวน 7 ตัว (฿139)
- E2: กุ้งสุก ลุยสวน 7 ตัว (฿149)
- F1: กุ้งสด ลาบ 7 ตัว (฿139)
- F2: กุ้งสุก ลาบ 7 ตัว (฿149)

#### เมนูเสริม
- G: ปูอัดสดเด้ง + น้ำจิ้มซีฟู้ดจี๊ดจ๊าด 8 ชิ้น (฿79)
- S: สาหร่ายอบกรอบ (฿25)
- L: หอมเจียว (฿20)
- M: มะระหั่นแว่น (฿15)
- N: กะหล่ำปลีซอย (฿15)
- O: น้ำจิ้มซีฟู้ด (฿25)
- P: โค้ก ขนาด 325 มล. (฿30)
- Q: น้ำดื่ม คริสตัล ขนาด 600 มล. (฿25)
- R: เป๊ปซี่ กระป๋อง 325 มล (฿30)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ (for development)
- Firebase account with project created
- Google Cloud Platform account
- Line Developers account (for Line Bot)

### 1. Firebase Setup

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize project
   firebase init
   ```

2. **Configure Firebase Authentication**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable **Google** provider
   - Add your domain to authorized domains
   - Enable **Email/Password** provider

3. **Setup Firestore Database**
   ```bash
   # Deploy security rules
   firebase deploy --only firestore:rules
   
   # Deploy indexes
   firebase deploy --only firestore:indexes
   ```

4. **Configure Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```

### 2. Google Sheets Setup

1. **Enable Google Sheets API**
   - Go to Google Cloud Console → APIs & Services → Library
   - Search and enable "Google Sheets API"
   - Create credentials (API Key + OAuth 2.0 Client ID)

2. **Create Google Sheet**
   - Create new spreadsheet with the following tabs:
     - `Sales` - Columns: Date, Menu, Platform, Quantity, Price, Total, User, Status
     - `Purchases` - Columns: Date, Vendor, Amount, Items, Type, Reference
     - `Inventory` - Columns: Name, Category, Current Stock, Min Stock, Unit, Last Updated
     - `Ingredients` - Columns: Name, Category, Unit, Min Stock, Current Stock
     - `Recipes` - Columns: Menu ID, Ingredient, Quantity, Unit
     - `Expenses` - Columns: Date, Category, Description, Amount, Type
     - `Reports` - Columns: Date, Type, Total, Items Count, Notes

3. **Update Configuration**
   ```javascript
   // In config/integrations.js
   const GOOGLE_SHEETS_CONFIG = {
     API_KEY: "YOUR_API_KEY_HERE",
     CLIENT_ID: "YOUR_CLIENT_ID_HERE",
     SPREADSHEET_ID: "YOUR_SPREADSHEET_ID_HERE"
   };
   ```

### 3. Line Bot Setup

1. **Create Line Bot**
   - Go to Line Developers Console
   - Create new Channel (Messaging API)
   - Get Channel Access Token and Channel Secret

2. **Configure Webhook**
   ```bash
   # Deploy Firebase Functions for webhook
   firebase deploy --only functions
   ```

3. **Update Configuration**
   ```javascript
   // In config/integrations.js
   const LINE_BOT_CONFIG = {
     CHANNEL_ACCESS_TOKEN: "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
     WEBHOOK_URL: "YOUR_WEBHOOK_URL",
     GROUP_IDS: ["YOUR_LINE_GROUP_ID"]
   };
   ```

### 4. Local Development

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd firebase-version
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   # Serve locally
   firebase serve --only hosting
   
   # Or use live server
   npx live-server --port=3000
   ```

## 🚀 Quick Start

### 1. Basic Setup
1. Open `index.html` in your browser
2. Click "🌱 Seed Data" to populate with your menu items
3. Sign in with Google account
4. Start using the POS system

### 2. Connect Integrations
1. Click "📊 Connect Sheets" to connect Google Sheets
2. Click "💬 Line Bot" to initialize Line integration
3. Test by sending a slip image or purchase text to your Line group

### 3. Debug Mode
- Press `Ctrl+Shift+D` to open debug panel
- Press `Ctrl+L` to export logs
- Check Firebase status indicator (top-right corner)

## 📱 Usage Guide

### Basic Operations

#### Recording Sales
1. Click "🛒 บันทึกการขาย"
2. Select platform (ร้าน, Grab, FoodPanda, Line Man)
3. Choose menu from dropdown
4. Enter quantity and price (auto-filled)
5. Click "บันทึกการขาย"

#### Recording Purchases
1. Click "📦 บันทึกการซื้อ"
2. Select ingredient from dropdown
3. Enter quantity purchased
4. Enter total cost
5. Enter unit (กก., ลิตร, etc.)
6. Click "บันทึกการซื้อ"

#### Monitoring Stock
- Real-time low stock alerts appear automatically
- Check "🚨 สต๊อกใกล้หมด" section
- Stock updates automatically after sales/purchases

### Line Bot Operations

#### Processing Payment Slips
1. Send payment slip image to Line group
2. Bot will:
   - Extract amount using OCR
   - Identify vendor from slip
   - Save to Google Sheets
   - Update Firebase inventory
   - Send confirmation message

#### Text Purchase Orders
1. Send text like: "ซื้อกุ้ง 5 ตัว จากตลาด ราคา 500 บาท"
2. Bot will:
   - Parse purchase details
   - Save to Google Sheets
   - Update Firebase inventory
   - Send confirmation

### Google Sheets Integration

#### Automatic Synchronization
- All sales automatically sync to `Sales` sheet
- All purchases sync to `Purchases` sheet
- Inventory updates reflect in `Inventory` sheet
- Real-time updates when connected

#### Manual Operations
- Click "📊 Connect Sheets" to authenticate
- View real-time data in Google Sheets
- Export reports from Sheets as needed

## 🔧 Configuration

### Environment Variables
Create `.env` file for local development:
```env
# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Google Sheets
GOOGLE_SHEETS_API_KEY=your_google_api_key
GOOGLE_SHEETS_CLIENT_ID=your_client_id
GOOGLE_SHEETS_SPREADSHEET_ID=your_sheet_id

# Line Bot
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret
LINE_WEBHOOK_URL=your_webhook_url
LINE_GROUP_ID=your_group_id

# Firebase Functions
FUNCTIONS_BASE_URL=https://your-region-your-project.cloudfunctions.net
```

### Custom Settings
Edit `config/integrations.js` for:
- Menu items and pricing
- Ingredient list and units
- Validation rules
- Feature flags
- UI preferences

## 🐛 Troubleshooting

### Common Issues

#### Firebase Connection Problems
**Error**: "Missing or insufficient permissions"
**Solution**: 
1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Check user authentication status
3. Verify collection names match security rules

#### Google Sheets Integration Issues
**Error**: "API key invalid" or "Unauthorized"
**Solution**:
1. Verify API key in Google Cloud Console
2. Check OAuth 2.0 consent screen configuration
3. Ensure spreadsheet is shared with service account

#### Line Bot Not Responding
**Error**: Webhook timeout or 500 error
**Solution**:
1. Check webhook URL configuration
2. Verify channel access token
3. Check Firebase Functions logs

#### Data Not Syncing
**Error**: Changes not appearing in real-time
**Solution**:
1. Check internet connection
2. Verify Firebase rules allow reads/writes
3. Check browser console for JavaScript errors

### Debug Tools

#### Debug Panel (`Ctrl+Shift+D`)
- View app state and configuration
- Check user authentication status
- Monitor recent logs
- Export logs for analysis

#### Log Export (`Ctrl+L`)
- Download complete log history
- Share logs for support
- Analyze performance issues

#### Firebase Status Indicator
- 🟢 Green: Connected and working
- 🔴 Red: Connection issues
- 🟡 Yellow: Demo mode

## 📊 Performance Monitoring

### Logging System
The app includes comprehensive logging:
- **AUTH**: Authentication events
- **DB**: Database operations
- **UI**: User interactions
- **PERF**: Performance metrics
- **LINE**: Line Bot activities
- **SHEETS**: Google Sheets operations

### Performance Metrics
- API response times
- Database operation duration
- User interaction latency
- Memory usage tracking

## 🔒 Security

### Firebase Security Rules
- Only authenticated users can access data
- Users can only modify their own records
- Input validation on all write operations
- Rate limiting implemented

### Data Protection
- All communications use HTTPS
- Sensitive tokens stored securely
- Input sanitization prevents XSS
- Firebase security rules enforce data access

## 📈 Analytics & Reporting

### Built-in Reports
- Daily/Weekly/Monthly sales summary
- Top selling menu items
- Low stock alerts
- Purchase history analysis
- Profit margin calculations

### Google Sheets Reports
- Pivot tables for advanced analysis
- Charts and visualizations
- Export to PDF/Excel
- Custom report generation

## 🔄 Updates & Maintenance

### Version Updates
1. Backup current data from Google Sheets
2. Update application files
3. Deploy to Firebase Hosting
4. Test all integrations
5. Restore data if needed

### Database Maintenance
- Regular cleanup of old logs
- Archive old transactions
- Optimize Firestore indexes
- Monitor storage usage

## 📞 Support

### Getting Help
1. Check debug panel (`Ctrl+Shift+D`)
2. Export logs (`Ctrl+L`)
3. Review this documentation
4. Check Firebase Functions logs
5. Contact support with logs

### Contributing
1. Fork repository
2. Create feature branch
3. Make changes with logging
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Firebase for real-time database
- Google Sheets API for data synchronization
- Line Messaging API for bot integration
- Tailwind CSS for styling
- Firebase Auth for authentication

---

**Version**: 2.0.0  
**Last Updated**: 2024  
**Compatibility**: Modern browsers with JavaScript ES6+ support