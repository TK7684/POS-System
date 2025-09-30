# 🚀 คู่มือการ Deploy และ Monitor ระบบ POS

## 📋 สารบัญ
1. [การเตรียมความพร้อม](#การเตรียมความพร้อม)
2. [การ Deploy แบบอัตโนมัติ](#การ-deploy-แบบอัตโนมัติ)
3. [การ Monitor ระบบ](#การ-monitor-ระบบ)
4. [การแก้ไขปัญหา](#การแก้ไขปัญหา)
5. [การ Rollback](#การ-rollback)
6. [Best Practices](#best-practices)

---

## 🛠️ การเตรียมความพร้อม

### ความต้องการของระบบ
- **Node.js** เวอร์ชัน 16+ 
- **Git** สำหรับ version control
- **Web Server** (Apache/Nginx) หรือ hosting service
- **SSL Certificate** สำหรับ HTTPS
- **Domain name** สำหรับการเข้าถึง

### การตรวจสอบไฟล์ที่จำเป็น
```bash
# ตรวจสอบไฟล์หลักที่ต้องมี
ls -la Index.html
ls -la js/critical.js
ls -la css/critical.css
ls -la manifest.json
ls -la sw.js
ls -la offline.html
```

### การตั้งค่า Environment Variables
```bash
# สร้างไฟล์ .env
echo "NODE_ENV=production" > .env
echo "DEPLOY_TARGET=production" >> .env
echo "BACKUP_ENABLED=true" >> .env
```

---

## 🚀 การ Deploy แบบอัตโนมัติ

### การใช้งาน Deployment Script

#### 1. การ Deploy พื้นฐาน
```bash
# รัน deployment script
node deploy/deploy.js

# หรือใช้ npm script (ถ้ามี)
npm run deploy
```

#### 2. การ Deploy แบบกำหนดเอง
```bash
# Deploy พร้อมกำหนด environment
NODE_ENV=production node deploy/deploy.js

# Deploy พร้อม backup
BACKUP_ENABLED=true node deploy/deploy.js
```

### ขั้นตอนการ Deploy อัตโนมัติ

#### Phase 1: Pre-deployment Validation
```
🔍 Validating environment...
✓ Node.js version: v18.17.0
✓ Index.html exists
✓ js/critical.js exists
✓ css/critical.css exists
✓ manifest.json exists
✓ sw.js exists
✓ Environment validation passed
```

#### Phase 2: Testing
```
🧪 Running tests...
✓ HTML validation passed
✓ JavaScript syntax check passed
✓ CSS validation passed
✓ All tests passed
```

#### Phase 3: Building
```
🔨 Building project...
✓ Created build directory
✓ Copied Index.html
✓ Copied js/
✓ Copied css/
✓ Copied manifest.json
✓ Copied sw.js
✓ Minified CSS files
✓ Minified JS files
✓ Build completed
```

#### Phase 4: Backup
```
💾 Creating backup...
✓ Created backup directory: backups/deploy-2024-01-15T10-30-00-abc123
✓ Backed up Index.html
✓ Backed up js/critical.js
✓ Backed up css/critical.css
✓ Backed up manifest.json
✓ Backed up sw.js
✓ Backup metadata created
✓ Backup created
```

#### Phase 5: Deployment
```
📦 Deploying files...
✓ Deployed Index.html
✓ Deployed js/critical.js
✓ Deployed css/critical.css
✓ Deployed manifest.json
✓ Deployed sw.js
✓ Files deployed successfully
```

#### Phase 6: Configuration Update
```
⚙️ Updating configuration...
✓ Updated service worker cache version: v1705312200000
✓ Updated manifest with deployment info
✓ Configuration updated
```

#### Phase 7: Verification
```
✅ Verifying deployment...
✓ All required files exist
✓ HTML validation passed
✓ Service worker validation passed
✓ Deployment verification passed
```

#### Phase 8: Cleanup
```
🧹 Cleaning up old backups...
✓ Removed old backup: deploy-2024-01-10T08-15-30-xyz789
✓ Removed old backup: deploy-2024-01-09T14-22-45-def456
✓ Cleanup completed
```

### ผลลัพธ์การ Deploy
```
✅ Deployment deploy-2024-01-15T10-30-00-abc123 completed successfully in 15847ms

📊 Deployment Summary:
- Deployment ID: deploy-2024-01-15T10-30-00-abc123
- Duration: 15.8 seconds
- Files deployed: 12
- Backup created: ✓
- Tests passed: ✓
- Verification: ✓
```

---

## 📊 การ Monitor ระบบ

### การเปิด Monitoring Dashboard

#### 1. เปิดผ่าน Web Browser
```
http://your-domain.com/deploy/monitoring-dashboard.html
```

#### 2. การใช้งาน Dashboard

**หน้าจอหลัก:**
- 🟢 System Status: Healthy/Warning/Error
- 📈 Requests/Hour: จำนวน request ต่อชั่วโมง
- ⚡ Avg Response Time: เวลาตอบสนองเฉลี่ย
- ❌ Error Rate: อัตราข้อผิดพลาด
- 💾 Memory Usage: การใช้งาน memory
- ⏱️ Uptime: เวลาที่ระบบทำงาน
- 🚨 Active Alerts: การแจ้งเตือนที่ยังไม่ได้จัดการ

**กราฟและแผนภูมิ:**
- 📊 Response Time Trend: แนวโน้มเวลาตอบสนอง
- 🌐 Network Activity: กิจกรรมเครือข่าย
- 🚨 Recent Alerts: การแจ้งเตือนล่าสุด
- 🔍 Error Log: บันทึกข้อผิดพลาด

### การตั้งค่า Monitoring

#### 1. การกำหนด Alert Thresholds
```javascript
// ใน js/core/ProductionMonitor.js
const config = {
    alertThresholds: {
        errorRate: 0.05,        // 5% error rate
        responseTime: 2000,     // 2 seconds
        memoryUsage: 100 * 1024 * 1024  // 100MB
    }
};
```

#### 2. การตั้งค่า Error Tracking
```javascript
// ใน js/core/ErrorTracker.js
window.errorTracker = new ErrorTracker({
    dsn: 'https://your-sentry-dsn.com',  // Sentry DSN (optional)
    environment: 'production',
    release: '1.0.0',
    enableConsoleCapture: true,
    enableNetworkCapture: true
});
```

### การดู Metrics แบบเรียลไทม์

#### 1. ผ่าน Browser Console
```javascript
// ดู dashboard data
console.log(window.productionMonitor.getDashboardData());

// ดู error ที่เก็บไว้
console.log(window.errorTracker.getStoredErrors());

// ดู performance metrics
console.log(window.productionMonitor.getPerformanceMetrics(Date.now() - 3600000));
```

#### 2. การส่งออก Metrics
```javascript
// ส่งออกเป็น JSON
const metrics = window.productionMonitor.exportMetrics('json');
console.log(metrics);

// ส่งออกเป็น CSV
const csvData = window.productionMonitor.exportMetrics('csv');
console.log(csvData);
```

---

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อยและวิธีแก้

#### 1. Deployment Failed
**อาการ:** การ deploy ล้มเหลว
```
❌ Deployment deploy-xxx failed: Tests failed: HTML validation failed: Missing DOCTYPE
```

**วิธีแก้:**
```bash
# ตรวจสอบไฟล์ HTML
head -5 Index.html

# แก้ไขให้มี DOCTYPE
echo '<!DOCTYPE html>' > temp.html
tail -n +2 Index.html >> temp.html
mv temp.html Index.html

# Deploy ใหม่
node deploy/deploy.js
```

#### 2. High Error Rate
**อาการ:** อัตราข้อผิดพลาดสูง
```
🚨 [SYSTEM] High error rate: 8.5%
```

**วิธีแก้:**
```bash
# ตรวจสอบ error log
tail -100 deployment.log

# ดู error ใน browser console
# เปิด monitoring dashboard และดู Error Log section

# แก้ไขปัญหาตาม error message
# Deploy hotfix
node deploy/deploy.js
```

#### 3. Slow Response Time
**อาการ:** เวลาตอบสนองช้า
```
🚨 [PERFORMANCE] Multiple slow requests detected: 15
```

**วิธีแก้:**
```bash
# ตรวจสอบ network requests ใน browser dev tools
# ดู Performance tab ใน monitoring dashboard

# อาจต้องปรับปรุง:
# - ลดขนาดไฟล์ JS/CSS
# - เพิ่ม caching
# - ปรับปรุง database queries
```

#### 4. Memory Usage High
**อาการ:** การใช้ memory สูง
```
🚨 [SYSTEM] High memory usage: 150MB
```

**วิธีแก้:**
```javascript
// ตรวจสอบ memory usage
console.log(performance.memory);

// ล้าง cache หากจำเป็น
if (window.cacheManager) {
    window.cacheManager.clearOldCache();
}

// รีเฟรชหน้าเว็บ
location.reload();
```

### การ Debug แบบขั้นสูง

#### 1. การเปิด Debug Mode
```javascript
// เปิด debug logging
localStorage.setItem('debug', 'true');

// ดู detailed logs
window.productionMonitor.on('metric', (data) => {
    console.log('New metric:', data);
});

window.errorTracker.on('error', (error) => {
    console.log('New error:', error);
});
```

#### 2. การตรวจสอบ Service Worker
```javascript
// ตรวจสอบ service worker status
navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('SW registrations:', registrations);
});

// ดู cache contents
caches.keys().then(cacheNames => {
    console.log('Cache names:', cacheNames);
    return Promise.all(
        cacheNames.map(cacheName => 
            caches.open(cacheName).then(cache => 
                cache.keys().then(keys => ({
                    cacheName,
                    keys: keys.map(key => key.url)
                }))
            )
        )
    );
}).then(cacheContents => {
    console.log('Cache contents:', cacheContents);
});
```

---

## 🔄 การ Rollback

### การ Rollback อัตโนมัติ

#### 1. เมื่อ Deployment ล้มเหลว
```
❌ Deployment deploy-2024-01-15T10-30-00-abc123 failed: Verification failed
🔄 Initiating rollback...
✓ Restored Index.html
✓ Restored js/critical.js
✓ Restored css/critical.css
✓ Restored manifest.json
✓ Restored sw.js
✅ Rollback completed successfully
```

#### 2. การ Rollback แบบ Manual
```bash
# ดู deployment history
ls -la backups/

# เลือก backup ที่ต้องการ rollback
BACKUP_ID="deploy-2024-01-14T15-20-30-def456"

# Rollback
node -e "
const DeploymentManager = require('./deploy/deployment-config.js');
const deployer = new DeploymentManager();
deployer.rollback({
    deploymentId: '$BACKUP_ID',
    rollbackData: require('./backups/$BACKUP_ID/backup-metadata.json')
});
"
```

### การตรวจสอบหลัง Rollback

#### 1. Verification Steps
```bash
# ตรวจสอบไฟล์หลัก
ls -la Index.html js/critical.js css/critical.css

# ตรวจสอบ service worker version
grep "CACHE_VERSION" sw.js

# ทดสอบการทำงาน
curl -I http://your-domain.com/
```

#### 2. การแจ้งเตือนผู้ใช้
```javascript
// แสดงข้อความแจ้งเตือน
if (window.notificationManager) {
    window.notificationManager.show({
        title: 'ระบบได้รับการอัปเดต',
        message: 'กรุณารีเฟรชหน้าเว็บเพื่อใช้งานเวอร์ชันล่าสุด',
        type: 'info',
        persistent: true
    });
}
```

---

## 💡 Best Practices

### การ Deploy

#### 1. Pre-deployment Checklist
- [ ] ทดสอบในสภาพแวดล้อม staging ก่อน
- [ ] สำรองข้อมูลสำคัญ
- [ ] แจ้งผู้ใช้เกี่ยวกับการ maintenance
- [ ] เตรียม rollback plan
- [ ] ตรวจสอบ dependencies ทั้งหมด

#### 2. Deployment Timing
- **เวลาที่เหมาะสม:** นอกเวลาทำการ (22:00-06:00)
- **หลีกเลี่ยง:** เวลาเร่งด่วน (11:00-14:00, 17:00-20:00)
- **วันที่เหมาะสม:** วันอังคาร-พฤหัสบดี
- **หลีกเลี่ยง:** วันจันทร์และวันศุกร์

#### 3. Rollback Strategy
- เก็บ backup ไว้อย่างน้อย 5 เวอร์ชัน
- ทดสอบ rollback procedure เป็นประจำ
- มี communication plan สำหรับ emergency rollback
- ตั้ง monitoring alerts สำหรับ post-deployment

### การ Monitor

#### 1. Key Metrics ที่ต้องติดตาม
- **Performance:** Response time, throughput, error rate
- **Availability:** Uptime, service health
- **User Experience:** Page load time, user interactions
- **Business:** Transaction volume, conversion rate

#### 2. Alert Configuration
```javascript
const alertConfig = {
    critical: {
        errorRate: 0.1,      // 10%
        responseTime: 5000,  // 5 seconds
        downtime: 300        // 5 minutes
    },
    warning: {
        errorRate: 0.05,     // 5%
        responseTime: 2000,  // 2 seconds
        memoryUsage: 0.8     // 80% of limit
    }
};
```

#### 3. Regular Maintenance
- **Daily:** ตรวจสอบ dashboard และ alerts
- **Weekly:** วิเคราะห์ performance trends
- **Monthly:** ทำความสะอาด logs และ backups
- **Quarterly:** ทบทวนและปรับปรุง monitoring setup

### การรักษาความปลอดภัย

#### 1. Access Control
- ใช้ HTTPS เท่านั้น
- จำกัดการเข้าถึง deployment scripts
- ใช้ environment variables สำหรับ sensitive data
- Regular security updates

#### 2. Data Protection
- เข้ารหัสข้อมูลสำคัญ
- Regular backups
- Test restore procedures
- Compliance with data protection regulations

---

## 📞 การติดต่อและสนับสนุน

### ในกรณีฉุกเฉิน
- **Deployment Issues:** [เบอร์โทรฉุกเฉิน]
- **System Down:** [เบอร์โทรฉุกเฉิน]
- **Security Incidents:** [เบอร์โทรฉุกเฉิน]

### การสนับสนุนทั่วไป
- **Email:** [อีเมลสนับสนุน]
- **Line:** [Line ID]
- **Documentation:** [URL เอกสาร]

### การรายงานปัญหา
เมื่อพบปัญหา กรุณาแจ้งข้อมูลต่อไปนี้:
- Deployment ID
- Error messages
- Steps to reproduce
- Browser/device information
- Screenshots (ถ้ามี)

---

*คู่มือนี้จะได้รับการอัปเดตเมื่อมีการเปลี่ยนแปลงระบบ หากมีคำถามเพิ่มเติม กรุณาติดต่อทีมสนับสนุน*