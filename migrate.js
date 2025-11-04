/**
 * POS System Migration Script
 * Helps transition from legacy codebase to optimized architecture
 */

import fs from 'fs';
import path from 'path';

class Migrator {
  constructor(sourceDir, targetDir) {
    this.sourceDir = sourceDir || './';
    this.targetDir = targetDir || './src/';
    this.migrationLog = [];
    this.backupDir = './backup_' + Date.now();
  }

  /**
   * Main migration process
   */
  async migrate() {
    console.log('🚀 Starting POS System Migration...');

    try {
      // Step 1: Create backup
      await this.createBackup();

      // Step 2: Analyze existing codebase
      const analysis = await this.analyzeCodebase();
      this.logAnalysis(analysis);

      // Step 3: Create new directory structure
      await this.createDirectoryStructure();

      // Step 4: Migrate configuration
      await this.migrateConfiguration();

      // Step 5: Migrate business logic
      await this.migrateBusinessLogic();

      // Step 6: Update entry points
      await this.updateEntryPoints();

      // Step 7: Generate migration report
      this.generateReport();

      console.log('✅ Migration completed successfully!');
      console.log('📁 Check migration-report.md for detailed information');

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('🔄 Rollback may be required. Check backup directory:', this.backupDir);
      process.exit(1);
    }
  }

  /**
   * Create backup of existing files
   */
  async createBackup() {
    console.log('📦 Creating backup...');

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const filesToBackup = [
      'Index.html',
      'ApiClient.js',
      'CacheManager.js',
      'DataPrefetcher.js',
      'gas/',
      'js/',
      'css/'
    ];

    for (const file of filesToBackup) {
      const sourcePath = path.join(this.sourceDir, file);
      const targetPath = path.join(this.backupDir, file);

      if (fs.existsSync(sourcePath)) {
        await this.copyRecursive(sourcePath, targetPath);
        this.log(`Backed up: ${file}`);
      }
    }
  }

  /**
   * Analyze existing codebase
   */
  async analyzeCodebase() {
    console.log('🔍 Analyzing codebase...');

    const analysis = {
      totalFiles: 0,
      jsFiles: 0,
      htmlFiles: 0,
      cssFiles: 0,
      duplicateFunctions: [],
      globalVariables: [],
      apiEndpoints: [],
      businessLogic: []
    };

    // Analyze JavaScript files
    const jsFiles = this.findFiles(this.sourceDir, '.js');
    analysis.jsFiles = jsFiles.length;
    analysis.totalFiles += jsFiles.length;

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Find function definitions
      const functions = content.match(/function\s+(\w+)/g);
      if (functions) {
        functions.forEach(fn => {
          const name = fn.replace('function ', '');
          analysis.businessLogic.push({ file: file, function: name });
        });
      }

      // Find global variables
      const globals = content.match(/^(const|let|var)\s+(\w+)\s*=/gm);
      if (globals) {
        globals.forEach(g => {
          const name = g.match(/(?:const|let|var)\s+(\w+)/)[1];
          analysis.globalVariables.push({ file: file, variable: name });
        });
      }

      // Find API endpoints
      const endpoints = content.match(/google\.script\.run\.(\w+)/g);
      if (endpoints) {
        endpoints.forEach(endpoint => {
          const name = endpoint.replace('google.script.run.', '');
          analysis.apiEndpoints.push({ file: file, endpoint: name });
        });
      }
    }

    // Analyze HTML files
    const htmlFiles = this.findFiles(this.sourceDir, '.html');
    analysis.htmlFiles = htmlFiles.length;
    analysis.totalFiles += htmlFiles.length;

    // Analyze CSS files
    const cssFiles = this.findFiles(this.sourceDir, '.css');
    analysis.cssFiles = cssFiles.length;
    analysis.totalFiles += cssFiles.length;

    return analysis;
  }

  /**
   * Create new directory structure
   */
  async createDirectoryStructure() {
    console.log('📁 Creating directory structure...');

    const directories = [
      'src',
      'src/config',
      'src/core',
      'src/utils',
      'src/modules',
      'src/modules/business',
      'src/modules/ui',
      'src/components',
      'src/assets',
      'tests',
      'docs'
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.targetDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.log(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Migrate configuration from legacy code
   */
  async migrateConfiguration() {
    console.log('⚙️ Migrating configuration...');

    // Extract business rules from existing code
    const configExtract = {
      platforms: this.extractPlatforms(),
      validation: this.extractValidationRules(),
      cacheSettings: this.extractCacheSettings(),
      apiEndpoints: this.extractApiEndpoints()
    };

    // Create enhanced configuration file
    const configPath = path.join(this.targetDir, 'src/config/config.js');
    const configContent = this.generateConfigFile(configExtract);
    fs.writeFileSync(configPath, configContent);

    this.log(`Generated configuration: src/config/config.js`);
  }

  /**
   * Migrate business logic modules
   */
  async migrateBusinessLogic() {
    console.log('💼 Migrating business logic...');

    // Migrate purchase functions
    await this.migratePurchaseLogic();

    // Migrate sales functions
    await this.migrateSalesLogic();

    // Migrate inventory functions
    await this.migrateInventoryLogic();

    // Migrate dropdown functionality
    await this.migrateDropdownLogic();
  }

  /**
   * Update entry points
   */
  async updateEntryPoints() {
    console.log('🔄 Updating entry points...');

    // Create new main entry file
    const mainEntryPath = path.join(this.targetDir, 'src/main.js');
    const mainContent = this.generateMainEntry();
    fs.writeFileSync(mainEntryPath, mainContent);

    // Update HTML files to use new entry points
    await this.updateHtmlFiles();

    this.log('Updated entry points');
  }

  /**
   * Extract platform information from legacy code
   */
  extractPlatforms() {
    const platforms = {};
    const files = this.findFiles(this.sourceDir, '.js');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const platformMatch = content.match(/platformFees\s*=\s*{([^}]+)}/);

      if (platformMatch) {
        const platformContent = platformMatch[1];
        const platformEntries = platformContent.match(/'([^']+)':\s*([0-9.]+)/g);

        if (platformEntries) {
          platformEntries.forEach(entry => {
            const [name, fee] = entry.split(':').map(s => s.trim().replace(/'/g, ''));
            platforms[name] = { fee: parseFloat(fee) };
          });
        }
      }
    }

    return platforms;
  }

  /**
   * Extract validation rules from legacy code
   */
  extractValidationRules() {
    const rules = {};
    const files = this.findFiles(this.sourceDir, '.js');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Look for validation patterns
      const validationPatterns = [
        { pattern: /qty.*>\s*0/g, rule: 'min_quantity', value: 0.01 },
        { pattern: /price.*>\s*0/g, rule: 'min_price', value: 0.01 },
        { pattern: /maxLength.*(\d+)/g, rule: 'max_length', extract: true }
      ];

      validationPatterns.forEach(({ pattern, rule, value, extract }) => {
        const matches = content.match(pattern);
        if (matches) {
          if (extract) {
            const numbers = matches.map(m => parseInt(m.match(/\d+/)[0]));
            rules[rule] = Math.max(...numbers);
          } else {
            rules[rule] = value;
          }
        }
      });
    }

    return rules;
  }

  /**
   * Extract cache settings from legacy code
   */
  extractCacheSettings() {
    const settings = {
      ttl: 5 * 60 * 1000, // Default 5 minutes
      maxSize: 50
    };

    const files = this.findFiles(this.sourceDir, '.js');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Look for cache duration settings
      const durationMatch = content.match(/CACHE_DURATION.*(\d+)/);
      if (durationMatch) {
        settings.ttl = parseInt(durationMatch[1]) * 1000;
      }

      // Look for cache size limits
      const sizeMatch = content.match(/MEMORY_LIMIT.*(\d+)/);
      if (sizeMatch) {
        settings.maxSize = parseInt(sizeMatch[1]);
      }
    }

    return settings;
  }

  /**
   * Extract API endpoints from legacy code
   */
  extractApiEndpoints() {
    const endpoints = [];
    const files = this.findFiles(this.sourceDir, '.js');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const apiCalls = content.match(/google\.script\.run\.(\w+)/g);

      if (apiCalls) {
        apiCalls.forEach(call => {
          const name = call.replace('google.script.run.', '');
          if (!endpoints.find(e => e.name === name)) {
            endpoints.push({
              name,
              file: path.relative(this.sourceDir, file)
            });
          }
        });
      }
    }

    return endpoints;
  }

  /**
   * Generate configuration file content
   */
  generateConfigFile(extract) {
    return `/**
 * Auto-generated configuration from legacy code
 * Generated on: ${new Date().toISOString()}
 */

export const BUSINESS = {
  PLATFORMS: ${JSON.stringify(extract.platforms, null, 2)},
  VALIDATION: ${JSON.stringify(extract.validation, null, 2)}
};

export const CACHE = {
  TTL: ${extract.cacheSettings.ttl},
  MEMORY_LIMIT: ${extract.cacheSettings.maxSize}
};

export const API = {
  ENDPOINTS: ${JSON.stringify(extract.apiEndpoints, null, 2)}
};

export default {
  BUSINESS,
  CACHE,
  API
};
`;
  }

  /**
   * Generate main entry file
   */
  generateMainEntry() {
    return `/**
 * POS System Main Entry Point
 * Optimized version with modern architecture
 */

import { stateManager } from './core/StateManager.js';
import { apiClient } from './core/ApiClient.js';
import { cacheManager } from './core/CacheManager.js';
import { purchaseManager } from './modules/business/PurchaseManager.js';
import { salesManager } from './modules/business/SalesManager.js';

// Initialize global application object
window.posApp = {
  // Core systems
  state: stateManager,
  api: apiClient,
  cache: cacheManager,

  // Business logic
  purchase: purchaseManager,
  sales: salesManager,

  // Utilities
  utils: {
    log: (level, message, data) => console[level](message, data),
    formatCurrency: (amount) => new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount)
  }
};

// Initialize application
async function initializeApp() {
  try {
    console.log('🚀 Initializing POS System...');

    // Load initial data
    await Promise.all([
      loadIngredients(),
      loadMenus(),
      loadTodaySummary()
    ]);

    console.log('✅ POS System initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize POS System:', error);
  }
}

async function loadIngredients() {
  try {
    const ingredients = await apiClient.getIngredients();
    window.posApp.state.setState('data.ingredients', ingredients);
  } catch (error) {
    console.warn('Failed to load ingredients:', error);
  }
}

async function loadMenus() {
  try {
    const menus = await apiClient.getMenus();
    window.posApp.state.setState('data.menus', menus);
  } catch (error) {
    console.warn('Failed to load menus:', error);
  }
}

async function loadTodaySummary() {
  try {
    const summary = await apiClient.getTodaySummary();
    window.posApp.state.setState('data.todaySummary', summary);
  } catch (error) {
    console.warn('Failed to load today summary:', error);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for module usage
export { stateManager, apiClient, cacheManager, purchaseManager, salesManager };
`;
  }

  /**
   * Update HTML files to use new entry points
   */
  async updateHtmlFiles() {
    const htmlFiles = this.findFiles(this.sourceDir, '.html');

    for (const file of htmlFiles) {
      let content = fs.readFileSync(file, 'utf8');

      // Replace old script includes with new module
      if (content.includes('google.script.run')) {
        // Add new module script
        const moduleScript = '<script type="module" src="src/main.js"></script>';

        // Remove old scripts (optional, based on migration strategy)
        content = content.replace(/<script[^>]*google\.script\.run[^>]*>.*?<\/script>/gs, '');

        // Add new module script at end of body
        if (content.includes('</body>')) {
          content = content.replace('</body>', moduleScript + '\n</body>');
        } else {
          content += moduleScript;
        }

        const newPath = path.join(this.targetDir, path.basename(file));
        fs.writeFileSync(newPath, content);
        this.log(`Updated HTML: ${path.basename(file)}`);
      }
    }
  }

  /**
   * Migrate purchase logic specifically
   */
  async migratePurchaseLogic() {
    // Find purchase-related functions
    const purchaseFunctions = this.findBusinessFunctions('purchase');

    // Create migration file
    const migrationContent = this.generatePurchaseMigration(purchaseFunctions);
    const migrationPath = path.join(this.targetDir, 'src/modules/business/purchase-migration.js');
    fs.writeFileSync(migrationPath, migrationContent);

    this.log('Generated purchase migration file');
  }

  /**
   * Migrate sales logic specifically
   */
  async migrateSalesLogic() {
    const salesFunctions = this.findBusinessFunctions('sale');

    const migrationContent = this.generateSalesMigration(salesFunctions);
    const migrationPath = path.join(this.targetDir, 'src/modules/business/sales-migration.js');
    fs.writeFileSync(migrationPath, migrationContent);

    this.log('Generated sales migration file');
  }

  /**
   * Migrate inventory logic specifically
   */
  async migrateInventoryLogic() {
    const inventoryFunctions = this.findBusinessFunctions('stock');

    const migrationContent = this.generateInventoryMigration(inventoryFunctions);
    const migrationPath = path.join(this.targetDir, 'src/modules/business/inventory-migration.js');
    fs.writeFileSync(migrationPath, migrationContent);

    this.log('Generated inventory migration file');
  }

  /**
   * Migrate dropdown logic specifically
   */
  async migrateDropdownLogic() {
    const dropdownFunctions = this.findBusinessFunctions('dropdown');

    const migrationContent = this.generateDropdownMigration(dropdownFunctions);
    const migrationPath = path.join(this.targetDir, 'src/modules/ui/dropdown-migration.js');
    fs.writeFileSync(migrationPath, migrationContent);

    this.log('Generated dropdown migration file');
  }

  /**
   * Find business functions by keyword
   */
  findBusinessFunctions(keyword) {
    const functions = [];
    const files = this.findFiles(this.sourceDir, '.js');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(keyword) && line.includes('function')) {
          functions.push({
            file: path.relative(this.sourceDir, file),
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }

    return functions;
  }

  /**
   * Generate purchase migration content
   */
  generatePurchaseMigration(functions) {
    return `/**
 * Purchase Logic Migration
 * Auto-generated from: ${functions.map(f => f.file).join(', ')}
 */

// TODO: Implement purchase logic migration
console.log('Purchase migration functions found:', ${JSON.stringify(functions, null, 2)});

export const purchaseMigration = {
  functions: ${JSON.stringify(functions, null, 2)},

  // Placeholder for migrated functions
  migrate: function() {
    console.log('Migrating purchase logic...');
    // Implementation needed
  }
};
`;
  }

  /**
   * Generate sales migration content
   */
  generateSalesMigration(functions) {
    return `/**
 * Sales Logic Migration
 * Auto-generated from: ${functions.map(f => f.file).join(', ')}
 */

// TODO: Implement sales logic migration
console.log('Sales migration functions found:', ${JSON.stringify(functions, null, 2)});

export const salesMigration = {
  functions: ${JSON.stringify(functions, null, 2)},

  // Placeholder for migrated functions
  migrate: function() {
    console.log('Migrating sales logic...');
    // Implementation needed
  }
};
`;
  }

  /**
   * Generate inventory migration content
   */
  generateInventoryMigration(functions) {
    return `/**
 * Inventory Logic Migration
 * Auto-generated from: ${functions.map(f => f.file).join(', ')}
 */

// TODO: Implement inventory logic migration
console.log('Inventory migration functions found:', ${JSON.stringify(functions, null, 2)});

export const inventoryMigration = {
  functions: ${JSON.stringify(functions, null, 2)},

  // Placeholder for migrated functions
  migrate: function() {
    console.log('Migrating inventory logic...');
    // Implementation needed
  }
};
`;
  }

  /**
   * Generate dropdown migration content
   */
  generateDropdownMigration(functions) {
    return `/**
 * Dropdown Logic Migration
 * Auto-generated from: ${functions.map(f => f.file).join(', ')}
 */

// TODO: Implement dropdown logic migration
console.log('Dropdown migration functions found:', ${JSON.stringify(functions, null, 2)});

export const dropdownMigration = {
  functions: ${JSON.stringify(functions, null, 2)},

  // Placeholder for migrated functions
  migrate: function() {
    console.log('Migrating dropdown logic...');
    // Implementation needed
  }
};
`;
  }

  /**
   * Find files by extension
   */
  findFiles(dir, extension) {
    const files = [];

    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other common exclusions
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            traverse(fullPath);
          }
        } else if (item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    }

    if (fs.existsSync(dir)) {
      traverse(dir);
    }

    return files;
  }

  /**
   * Copy directory recursively
   */
  async copyRecursive(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const stat = fs.statSync(source);

    if (stat.isDirectory()) {
      const files = fs.readdirSync(source);

      for (const file of files) {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        await this.copyRecursive(sourcePath, targetPath);
      }
    } else {
      fs.copyFileSync(source, target);
    }
  }

  /**
   * Log migration step
   */
  log(message) {
    console.log(`  ${message}`);
    this.migrationLog.push({ timestamp: new Date().toISOString(), message });
  }

  /**
   * Log analysis results
   */
  logAnalysis(analysis) {
    console.log('\n📊 Codebase Analysis:');
    console.log(`  Total files: ${analysis.totalFiles}`);
    console.log(`  JavaScript files: ${analysis.jsFiles}`);
    console.log(`  HTML files: ${analysis.htmlFiles}`);
    console.log(`  CSS files: ${analysis.cssFiles}`);
    console.log(`  Business functions found: ${analysis.businessLogic.length}`);
    console.log(`  API endpoints: ${analysis.apiEndpoints.length}`);
    console.log(`  Global variables: ${analysis.globalVariables.length}`);
  }

  /**
   * Generate migration report
   */
  generateReport() {
    const reportContent = `# POS System Migration Report
Generated: ${new Date().toISOString()}

## Summary
- Backup created: ${this.backupDir}
- Files processed: ${this.migrationLog.length}
- Migration status: ✅ Success

## Migration Steps Completed
${this.migrationLog.map(log => `- ${log.timestamp}: ${log.message}`).join('\n')}

## Next Steps
1. Review migrated code in ${this.targetDir}
2. Update remaining business logic files
3. Test functionality thoroughly
4. Update documentation
5. Deploy to staging environment

## Files Generated
- src/config/config.js - Configuration management
- src/main.js - Application entry point
- src/modules/business/* - Business logic modules
- Migration files for legacy code integration

## Notes
- All original files are backed up in ${this.backupDir}
- HTML files have been updated to use new module system
- Some manual migration may be required for complex business logic
`;

    fs.writeFileSync('migration-report.md', reportContent);
    console.log('\n📋 Migration report generated: migration-report.md');
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new Migrator(process.argv[2], process.argv[3]);
  migrator.migrate().catch(console.error);
}

export default Migrator;
