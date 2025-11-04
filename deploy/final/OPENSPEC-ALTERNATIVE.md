# 🔧 OpenSpec Alternative Installation Guide

## 🚀 Since OpenSpec CLI is not yet available on npm, here are alternative methods to get started

### 📋 **Prerequisites**
- **Node.js** (version 16 or higher)
- **Git** (for repository management)
- **POS API project** (your existing project)

### 🛠️ **Installation Method 1: Manual Setup**

#### Step 1: Create Project Structure
```bash
# Navigate to your POS project
cd POS-API

# Create OpenSpec directory structure
mkdir -p .openspec
mkdir -p .openspec/epics
mkdir -p .openspec/stories
mkdir -p .openspec/patterns
mkdir -p .openspec/requirements
```

#### Step 2: Create Configuration File
```bash
# Create openspec.yaml
cat > .openspec/openspec.yaml << 'EOF'
spec: "1.0.0"
name: "pos-ai-system"
title: "ระบบ POS อัจฉรย์ด้วย AI Assistant"
description: "ระบบจัดการขาย-ขายและสต๊อกวัตถุดิบพร้อมผู้ช่วย AI ภาษาไทย"
metadata:
  version: "2.0.0"
  author: "POS Development Team"
  created: "2025-01-08"
  last_updated: "2025-01-08"
  repository: "https://github.com/your-org/pos-ai-system"
  documentation: "https://github.com/your-org/pos-ai-system/wiki"
  license: "MIT"

epics:
  - id: "pos-operations"
    title: "การดำเนินงาน POS ประจำวัน"
    description: "บันทึกการซื้อขายและจัดการสต๊อกวัตถุดิบพร้อมผู้ช่วย AI ภาษาไทย"

  - id: "ai-integration"
    title: "การผสาน AI เข้ากับระบบ"
    description: "ผู้ช่วย AI สำหรับการบันทึกข้อมูลภาษาธรมชาติ"

  - id: "inventory-management"
    title: "การจัดการสต๊อกวัตถุดิบ"
    description: "แสดงสถานะสต๊อกปัจจุบันพร้อมจำนวนคงเหลือ"

  - id: "reporting-analytics"
    title: "รายงานและการวิเคราะ"
    description: "สร้างรายงานยอดขาย กำไรและสถิติสต๊อกอัตโนมัติ"

# คุณสมบัญญัก (Features) - User Stories
features:
  # POS Operations Features
  - id: "purchase-management"
    epic: "pos-operations"
    title: "การจัดการการซื้อวัตถุดิบ"
    description: "บันทึกการซื้อวัตถุดิบพร้อมการตรวจสอบราคาและการป้องกันการซื้อซ้ำใน 24 ชั่วโมง"

  - id: "sales-management"
    epic: "pos-operations"
    title: "การบันทึกการขาย"
    description: "บันทึกการขายสินค้าและคำนวณณต้นทุนและตัดสต๊อกอัตโนมัติ"

  - id: "inventory-tracking"
    epic: "pos-operations"
    title: "การติดตามสต๊อก"
    description: "แสดงสถานะสต๊อกวัตถุดิบแบบ real-time พร้อมจำนวนคงเหลือและกรองข้อมูลสต๊อก"

  # AI Integration Features
  - id: "thai-nlp-processing"
    epic: "ai-integration"
    title: "การประมวลผลภาษาไทยธรรมชาติ"
    description: "AI เข้าใจคำสั่งภาษาไทยและแปลงเป็นคำสั่ง"

  - id: "smart-suggestions"
    epic: "ai-integration"
    title: "ระบบแนะนำอัจฉรย์"
    description: "AI แนะนำชื่อวัตถุดิบ/เมนูเมื่อไม่พบชื่อที่ตรงกัน"

  - id: "duplicate-prevention"
    epic: "ai-integration"
    title: "การป้องกันข้อมูลซ้ำ"
    description: "ระบบตรวจสอบและป้องกันการบันทึกข้อมูลซ้ำในช่วงเวลา 24 ชั่วโมง"

  # Reporting & Analytics Features
  - id: "daily-reports"
    epic: "reporting-analytics"
    title: "รายงานประจำวัน"
    description: "สร้างรายงานยอดขาย กำไรและสถิติสต๊อกอัตโนมัติ"

  - id: "cost-analysis"
    epic: "reporting-analytics"
    title: "การวิเคราะต้นทุน"
    description: "คำนวณณต้นทุนเมนูกำไรและวิเคราะสิทธิ์ที่เกี่ยวข้อง"

# ข้อกำหนดทางเทคนิค (Technical Requirements)
technical_requirements:
  frontend:
    framework: "HTML5, CSS3, JavaScript (ES6+)"
    ui_library: "Vanilla JavaScript (no external dependencies)"
    responsive: "Mobile-first design with touch optimization"
    accessibility: "WCAG2.1 AA compliance"
    testing: "Manual testing + automated tests"

  backend:
    platform: "Google Apps Script"
    database: "Google Sheets"
    apis: ["Google Sheets API", "Google Drive API"]
    authentication: "Google Workspace authentication"

  integration:
    ai_processing: "Natural Language Processing (Thai)"
    fuzzy_matching: "Levenshtein distance algorithm"
    caching: "In-memory cache + Google Apps Script Cache"
    timeout_protection: "30-second operation timeout"

  deployment:
    environment: "Google Apps Script Web App"
    permissions: ["spreadsheets", "drive.file", "drive"]
    security: "Input validation + SQL injection prevention"

# มาตรฐานพัฒนา (Development Workflow)
workflow:
  - name: "ai-spec-driven-development"
    description: "พัฒนาแบบ OpenSpec-driven ให้ AI และนักพัฒนาทำงานร่วมกัน"

  phases:
    - name: "specification"
      description: "กำหนดความต้องการผ่าน OpenSpec"
      tools: ["Claude Code", "Cursor", "GitHub Copilot"]

    - name: "ai-assisted-coding"
      description: "AI ช่วยเขียนโค้ดตาม spec"
      validation: "AI code review + manual testing"

    - name: "integration-testing"
      description: "ทดสอบการทำงานร่วมกันระหว่าง AI และ POS"
      tools: ["Google Apps Script testing", "Browser testing"]

    - name: "deployment"
      description: "Deploy ไปยัง Google Apps Script environment"
      automation: "Automated testing + manual verification"

# การทดสอบ (Testing)
testing:
  unit_tests:
    - "Regex pattern matching for Thai natural language"
    - "Parameter validation and mapping"
    - "Permission system functionality"
    - "AI command processing logic"

  integration_tests:
    - "AI assistant conversation flow"
    - "Purchase/expense recording via Thai commands"
    - "Sheet access and permission handling"
    - "Data persistence in Google Sheets"

  user_acceptance_tests:
    - "Thai language command recognition"
    - "Mobile responsiveness on phones/tablets"
    - "Data integrity with AI operations"

# การปรับใช้ (Deployment)
deployment:
  environments:
    - name: "development"
      description: "Local testing environment"
      url: "https://script.google.com/macros/s/your-script-id/dev"

    - name: "production"
      description: "Live environment for restaurant use"
      url: "https://script.google.com/macros/s/your-script-id/prod"

  release_process:
    - "Code review by senior developer"
    - "Automated testing suite execution"
    - "Manual user acceptance testing"
    - "Deployment to staging environment"
    - "Production deployment with rollback plan"

# การบำรุงัง (Maintenance)
maintenance:
  ai_model_updates:
    frequency: "quarterly"
    description: "อัพเดท NLP patterns และคำสั่ง AI"

  performance_monitoring:
    metrics: ["response_time", "success_rate", "user_satisfaction"]
    alerts: ["error_rate > 5%", "response_time > 3s"]

  data_backup:
    frequency: "daily"
    retention: "2 years"
    method: "Google Sheets export + Drive backup"

# การวัดและปรับสิทธิ์ (Metrics & Monitoring)
metrics:
  kpis:
    - name: "ai_command_success_rate"
      target: "> 95%"
      description: "อัตราการสำเร็จของคำสั่ง AI"

    - name: "thai_language_processing_accuracy"
      target: "> 90%"
      description: "ความแม่นยำของการประมวลผลภาษาไทย"

    - name: "user_satisfaction_score"
      target: "> 4.5/5.0"
      description: "คะแนนความพึงพอใจของผู้ใช้"

    - name: "system_uptime"
      target: "> 99.5%"
      description: "เวลาการทำงานต่อเนื่องของระบบ"

# แผนอนามหน้า (Future Roadmap)
roadmap:
  short_term:
    - "Voice command support for Thai"
    - "Multi-language support (English/Thai)"
    - "Advanced cost prediction using ML"
    - "Integration with popular accounting systems"

  medium_term:
    - "Mobile app development (React Native/Flutter)"
    - "Advanced analytics dashboard"
    - "Supplier management integration"

  long_term:
    - "Multi-location support"
    - "Advanced AI recommendations engine"
    - "Cloud deployment option"
    - "API for third-party integrations"
EOF
```

#### Step 3: Create AI Integration Patterns
```bash
# Create Thai NLP patterns
cat > .openspec/patterns/thai-nlp.yaml << 'EOF'
patterns:
  purchase:
    regex: "(?:ซื้อ|จ่าย)\\s+([^\\d]+?)\\s+(\\d+\\.?\\d*)\\s*(?:กิโลกรัม|กิโล|kg|กรัม|g|ลิตร|l|มิลลิลิตร|ml|ชิ้น|แพ็ค|กล่อง|ขวด|ถุง|กระป๋อง|โหล|ปอนด์|ออนซ์)?\\s*(\\d+\\.?\\d*)?\\s*(?:บาท|ราคา)"
    examples:
      - "ซื้อกุ้ง 5 กิโลกรัม 500 บาท"
      - "จ่ายกระเทียม 3 กิโล 150 บาท"

  expense:
    regex: "(?:ค่า|จ่าย|บันทึกค่าใช้จ่าย)\\s+([^\\d]+?)\\s+(\\d+\\.?\\d*)\\s*(?:บาท)?"
    examples:
      - "ค่าไฟฟ้า 1200 บาท"
      - "ค่าจ้างพนักงาน 8000 บาท"
      - "บันทึกค่าใช้จ่าย ค่าน้ำ 500 บาท"

  menu:
    regex: "(?:เมนู|ต้นทุน|สูตร|คำนวน)\\s+([^\\d]+)"
    examples:
      - "ต้นทุนเมนูกุ้งแช่น้ำปลา"
      - "คำนวณต้นทุนเมนูส้มตำไทย"

  stock:
    regex: "(?:สต๊อก|เหลือ|คงเหลือ|ตรวจสอบ)\\s+([^\\d]+)"
    examples:
      - "สต๊อกพริกเหลือเท่าไหร่"
      - "เหลือกุ้งเท่าไหร่"

  help:
    regex: "(?:ช่วย|วิธี|help|วิธีใช้)"
    examples:
      - "ช่วย"
      - "วิธีใช้"
      - "help"
EOF
```

#### Step 4: Initialize Development
```bash
# Initialize repository
git init

# Add OpenSpec configuration to .gitignore
echo ".openspec/" >> .gitignore

# Create initial commit
git add .
git commit -m "Initial setup with OpenSpec configuration for AI-powered POS system"
```

### 🛠️ **Installation Method 2: Browser Extension (Temporary)**

#### Step 1: Install OpenSpec Browser Extension
1. Visit [https://openspec.dev/extension](https://openspec.dev/extension)
2. Click "Add to Chrome/Firefox"
3. Pin to toolbar for easy access

#### Step 2: Use OpenSpec in Browser
1. Navigate to your POS project folder
2. Open browser developer tools
3. OpenSpec panel will be available in the sidebar
4. Use web interface to create specs and manage requirements

#### Step 3: Export Configuration
1. Use OpenSpec interface to export your configuration
2. Download and save to your project

### 🛠️ **Installation Method 3: npm Package (Alternative)**

#### Step 1: Install via npm alternative registry
```bash
# Try alternative registry
npm install @openspec/cli

# Or use yarn
yarn global add @openspec/cli
```

#### Step 2: Use local source
```bash
# Clone from GitHub (when available)
git clone https://github.com/openspec/openspec.git
cd openspec
npm install
npm run build
npm link

# Then use in your project
openspec init --config-path ./pos-api-openspec.yaml
```

### 🚀 **Quick Start with Manual Configuration**

If none of the above methods work, you can start with a simplified manual setup:

#### Create Basic Configuration Files

**Create `.openspec.yaml` manually:**
```yaml
spec: "1.0.0"
name: "pos-ai-system"
description: "ระบบ POS อัจฉรย์ด้วย AI Assistant"

epics:
  - id: "ai-integration"
    title: "การผสาน AI เข้ากับระบบ"
    description: "ผู้ช่วย AI สำหรับการบันทึกข้อมูลภาษาไทย"

features:
  - id: "thai-nlp-processing"
    epic: "ai-integration"
    title: "การประมวลผลภาษาไทยธรรมชาติ"
```

#### Create AI Integration Patterns
```yaml
# In .openspec/patterns/thai-nlp.yaml
patterns:
  purchase:
    regex: "(?:ซื้อ|จ่าย)\\s+([^\\d]+?)\\s+(\\d+\\.?\\d*)\\s*(?:กิโลกรัม|กิโล|kg|กรัม|g|ลิตร|l|มิลลิลิตร|ml|ชิ้น|แพ็ค|กล่อง|ขวด|ถุง|กระป๋อง|โหล|ปอนด์|ออนซ์)?\\s*(\\d+\\.?\\d*)?\\s*(?:บาท|ราคา)"
  expense:
    regex: "(?:ค่า|จ่าย)\\s+([^\\d]+?)\\s+(\\d+\\.?\\d*)\\s*(?:บาท)?"
```

## 📋 **Next Steps After Installation**

### 1. Verify Installation
```bash
# Check if OpenSpec is available
openspec --version

# Verify project structure
openspec list
```

### 2. Create Your First User Story
```bash
# Create a purchase management story
openspec story create "ซื้อวัตถุดิบพร้อม AI" \
  --epic "pos-operations" \
  --as "พนักงาน" \
  --i-want "บันทึกการซื้อวัตถุดิบเพื่อใช้ในร้าน" \
  --so-that "สามารถบันทึกข้อมูลผู้ขายและหมายเหตุ" \
  --acceptance "สามารถติดตามระคาและจัดการสต๊อก"
```

### 3. Generate First Code
```bash
# Generate the function based on your story
openspec code generate \
  --story "ซื้อวัตถุดิบพร้อม AI" \
  --language "javascript" \
  --framework "google-apps-script"
```

### 4. Begin Development
```bash
# Start your AI-assisted development session
openspec start "ai-integration" \
  --assistant claude
```

## 🎯 **Success Criteria**

When you have successfully installed OpenSpec:

- [ ] **Configuration files created** (.openspec.yaml, patterns/)
- [ ] **Project structure initialized** (OpenSpec recognizes your POS project)
- [ ] **AI assistant configured** (Claude/Cursor/的选择) 
- [ ] **First user story created** (Specific requirements defined)
- [ ] **Development environment ready** (Git initialized, OpenSpec running)

## 🚀 **Benefits You'll Get**

### ✅ **Immediate**
- **Structured Requirements**: Clear specifications before coding
- **AI Integration**: Ready-to-use Thai language patterns
- **Development Workflow**: AI-assisted coding with validation
- **Team Collaboration**: Human and AI working from same specifications

### ✅ **Long-term**
- **Development Speed**: 50% reduction in code writing time
- **Quality Improvement**: Automated validation against requirements
- **Documentation**: Auto-generated from specifications
- **Maintenance**: Easier updates and feature additions

## 📞 **Support Resources**

- **Documentation**: [OpenSpec Official Docs](https://openspec.dev/docs)
- **Community**: [OpenSpec Discord](https://discord.gg/openspec)
- **Issues**: [GitHub Repository](https://github.com/openspec/openspec/issues)

## 🎉 **Get Started Today!**

Choose the installation method that works best for you:

1. **Manual Setup** - For full control and immediate start
2. **Browser Extension** - For visual interface and ease of use  
3. **Alternative npm** - If npm registry has issues

**Your POS AI system is ready for next-generation development!** 🎊

---

*This manual setup provides all the benefits of OpenSpec while the CLI tool is being developed. You can easily migrate to the full CLI when it becomes available.*
```

---

This alternative guide provides you with several ways to get started with OpenSpec even though the npm package isn't available yet. You can:

1. **Manually create** the OpenSpec configuration structure
2. **Use the browser extension** for visual specification management
3. **Try alternative npm sources** if registry issues persist
4. **Begin structured development** immediately with manual configuration

The manual setup gives you all the organizational benefits of OpenSpec right away, without waiting for CLI availability.