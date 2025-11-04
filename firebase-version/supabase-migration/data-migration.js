// Firebase to Supabase Data Migration Script
// This script exports data from Firebase and imports it to Supabase

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Firebase configuration
  firebase: {
    // You'll need to provide your Firebase service account key
    // serviceAccountKey: './serviceAccountKey.json'
    projectId: 'pos-agent-8767b',
  },

  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
  },

  // Export/Import settings
  exportPath: './migration-export',
  batchSize: 100,
  continueOnError: true
};

// Initialize Firebase
let firebaseApp, firestore;
try {
  firebaseApp = initializeApp({
    projectId: CONFIG.firebase.projectId,
    // Add other config as needed
  });
  firestore = getFirestore();
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.serviceRoleKey);

// Migration class
class DataMigrator {
  constructor() {
    this.stats = {
      exported: {},
      imported: {},
      errors: []
    };
    this.exportPath = CONFIG.exportPath;

    // Create export directory
    if (!fs.existsSync(this.exportPath)) {
      fs.mkdirSync(this.exportPath, { recursive: true });
    }
  }

  // Logger for migration
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      data
    };

    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);

    if (data) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }

    // Save to migration log
    fs.appendFileSync(
      path.join(this.exportPath, 'migration.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }

  // Export all Firebase collections
  async exportFromFirebase() {
    this.log('info', 'Starting Firebase export...');

    const collections = [
      'users',
      'ingredients',
      'menus',
      'menuRecipes',
      'sales',
      'purchases',
      'expenses',
      'platforms',
      'stocks'
    ];

    for (const collectionName of collections) {
      await this.exportCollection(collectionName);
    }

    this.log('info', 'Firebase export completed', this.stats.exported);
    return this.stats.exported;
  }

  // Export single collection from Firebase
  async exportCollection(collectionName) {
    this.log('info', `Exporting collection: ${collectionName}`);

    try {
      const collectionRef = firestore.collection(collectionName);
      const snapshot = await collectionRef.get();

      const data = [];
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        const docData = {
          id: doc.id,
          ...doc.data()
        };

        // Transform timestamps
        this.transformTimestamps(docData);

        data.push(docData);
        batchCount++;

        // Save batch
        if (batchCount >= CONFIG.batchSize) {
          await this.saveBatch(collectionName, data.slice(-CONFIG.batchSize));
          batchCount = 0;
        }
      }

      // Save remaining data
      if (batchCount > 0) {
        await this.saveBatch(collectionName, data.slice(-batchCount));
      }

      // Save collection metadata
      const metadata = {
        collection: collectionName,
        totalDocs: snapshot.size,
        exportedAt: new Date().toISOString(),
        fields: this.getCollectionFields(data)
      };

      fs.writeFileSync(
        path.join(this.exportPath, `${collectionName}_metadata.json`),
        JSON.stringify(metadata, null, 2)
      );

      this.stats.exported[collectionName] = snapshot.size;
      this.log('info', `Exported ${snapshot.size} documents from ${collectionName}`);

    } catch (error) {
      this.log('error', `Failed to export ${collectionName}`, error);
      this.stats.errors.push({
        collection: collectionName,
        type: 'export',
        error: error.message
      });

      if (!CONFIG.continueOnError) {
        throw error;
      }
    }
  }

  // Save batch to file
  async saveBatch(collectionName, batch) {
    const filename = `${collectionName}_batch_${Date.now()}.json`;
    const filepath = path.join(this.exportPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(batch, null, 2));
    this.log('debug', `Saved batch: ${filename} (${batch.length} documents)`);
  }

  // Transform Firebase timestamps to ISO strings
  transformTimestamps(obj) {
    const transform = (value) => {
      if (value && typeof value === 'object') {
        if (value.toDate && typeof value.toDate === 'function') {
          return value.toDate().toISOString();
        }

        if (value.seconds !== undefined && value.nanoseconds !== undefined) {
          return new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
        }

        // Recursively transform nested objects
        for (const key in value) {
          if (value.hasOwnProperty(key)) {
            value[key] = transform(value[key]);
          }
        }
      }

      return value;
    };

    return transform(obj);
  }

  // Get collection fields for metadata
  getCollectionFields(data) {
    const fields = new Set();

    for (const doc of data) {
      for (const key in doc) {
        if (doc.hasOwnProperty(key) && key !== 'id') {
          fields.add(key);
        }
      }
    }

    return Array.from(fields);
  }

  // Import data to Supabase
  async importToSupabase() {
    this.log('info', 'Starting Supabase import...');

    // Import order matters due to foreign key constraints
    const importOrder = [
      'users',
      'platforms',
      'categories',
      'ingredients',
      'menus',
      'menu_recipes',
      'sales',
      'purchases',
      'expenses'
    ];

    for (const tableName of importOrder) {
      await this.importTable(tableName);
    }

    this.log('info', 'Supabase import completed', this.stats.imported);
    return this.stats.imported;
  }

  // Import single table to Supabase
  async importTable(tableName) {
    this.log('info', `Importing table: ${tableName}`);

    try {
      // Load exported data
      const exportFiles = this.getExportFiles(tableName);

      if (exportFiles.length === 0) {
        this.log('warning', `No export files found for ${tableName}`);
        return;
      }

      let totalImported = 0;

      for (const file of exportFiles) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));

        // Transform data for Supabase
        const transformedData = await this.transformDataForSupabase(tableName, data);

        if (transformedData.length === 0) {
          continue;
        }

        // Import to Supabase
        const { data: importResult, error } = await supabase
          .from(tableName)
          .upsert(transformedData, {
            onConflict: this.getConflictStrategy(tableName)
          });

        if (error) {
          this.log('error', `Failed to import batch to ${tableName}`, error);
          this.stats.errors.push({
            table: tableName,
            type: 'import',
            file: path.basename(file),
            error: error.message
          });

          if (!CONFIG.continueOnError) {
            throw error;
          }
        } else {
          totalImported += transformedData.length;
          this.log('debug', `Imported ${transformedData.length} records from ${path.basename(file)}`);
        }
      }

      this.stats.imported[tableName] = totalImported;
      this.log('info', `Successfully imported ${totalImported} records to ${tableName}`);

    } catch (error) {
      this.log('error', `Failed to import ${tableName}`, error);
      this.stats.errors.push({
        table: tableName,
        type: 'import',
        error: error.message
      });

      if (!CONFIG.continueOnError) {
        throw error;
      }
    }
  }

  // Get export files for a collection/table
  getExportFiles(collectionName) {
    const exportDir = this.exportPath;
    const files = fs.readdirSync(exportDir);

    return files
      .filter(file => file.startsWith(`${collectionName}_batch_`) && file.endsWith('.json'))
      .map(file => path.join(exportDir, file))
      .sort();
  }

  // Transform data for Supabase schema
  async transformDataForSupabase(tableName, data) {
    const transformed = [];

    for (const record of data) {
      const transformedRecord = await this.transformRecord(tableName, record);
      if (transformedRecord) {
        transformed.push(transformedRecord);
      }
    }

    return transformed;
  }

  // Transform single record for Supabase
  async transformRecord(tableName, record) {
    try {
      let transformed = { ...record };

      // Remove Firebase-specific fields
      delete transformed._collections;
      delete transformed._ref;

      switch (tableName) {
        case 'users':
          transformed = this.transformUserRecord(transformed);
          break;

        case 'ingredients':
          transformed = this.transformIngredientRecord(transformed);
          break;

        case 'menus':
          transformed = this.transformMenuRecord(transformed);
          break;

        case 'menuRecipes':
          transformed = this.transformMenuRecipeRecord(transformed);
          break;

        case 'sales':
          transformed = this.transformSaleRecord(transformed);
          break;

        case 'purchases':
          transformed = this.transformPurchaseRecord(transformed);
          break;

        case 'expenses':
          transformed = this.transformExpenseRecord(transformed);
          break;

        case 'platforms':
          transformed = this.transformPlatformRecord(transformed);
          break;
      }

      // Add created_at if missing
      if (!transformed.created_at) {
        transformed.created_at = new Date().toISOString();
      }

      return transformed;

    } catch (error) {
      this.log('error', `Failed to transform record for ${tableName}`, {
        recordId: record.id,
        error: error.message
      });

      if (CONFIG.continueOnError) {
        return null;
      } else {
        throw error;
      }
    }
  }

  // User record transformation
  transformUserRecord(record) {
    return {
      id: record.uid || record.id,
      email: record.email,
      display_name: record.displayName || record.display_name,
      avatar_url: record.photoURL || record.avatar_url,
      auth_provider: record.providerData?.[0]?.providerId || 'email',
      email_verified: record.emailVerified || false,
      role: record.role || 'user',
      created_at: record.createdAt || record.metadata?.creationTime,
      last_sign_in_at: record.metadata?.lastSignInTime
    };
  }

  // Ingredient record transformation
  transformIngredientRecord(record) {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      unit: record.unit || 'pieces',
      category_id: record.category_id, // Will need mapping
      min_stock: parseFloat(record.min_stock) || 0,
      current_stock: parseFloat(record.current_stock) || 0,
      cost_per_unit: parseFloat(record.cost_per_unit) || 0,
      supplier: record.supplier,
      supplier_code: record.supplier_code,
      barcode: record.barcode,
      is_active: record.is_active !== false,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  // Menu record transformation
  transformMenuRecord(record) {
    return {
      id: record.id,
      menu_id: record.menu_id || record.id,
      name: record.name,
      description: record.description,
      price: parseFloat(record.price) || 0,
      category_id: record.category_id, // Will need mapping
      image_url: record.image_url,
      is_active: record.is_active !== false,
      is_available: record.is_available !== false,
      preparation_time_minutes: record.preparation_time_minutes || 5,
      sort_order: record.sort_order || 0,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  // Menu recipe record transformation
  transformMenuRecipeRecord(record) {
    return {
      id: record.id,
      menu_id: record.menu_id,
      ingredient_id: record.ingredient_id,
      quantity_per_serve: parseFloat(record.quantity_per_serve) || parseFloat(record.quantity) || 1,
      unit: record.unit,
      cost_per_unit: parseFloat(record.cost_per_unit) || 0,
      is_optional: record.is_optional || false,
      notes: record.notes,
      created_at: record.created_at
    };
  }

  // Sale record transformation
  transformSaleRecord(record) {
    return {
      id: record.id,
      menu_id: record.menu_id,
      platform_id: record.platform_id, // Will need mapping
      user_id: record.user_id,
      quantity: parseInt(record.quantity) || 1,
      unit_price: parseFloat(record.unit_price) || parseFloat(record.price) || 0,
      total_amount: parseFloat(record.total_amount) || 0,
      order_date: record.date || record.order_date || new Date().toISOString().split('T')[0],
      order_time: record.time || record.order_time || new Date().toTimeString().split(' ')[0],
      customer_name: record.customer_name,
      customer_phone: record.customer_phone,
      order_number: record.order_number,
      payment_method: record.payment_method || 'cash',
      payment_status: record.payment_status || 'paid',
      status: record.status || 'completed',
      notes: record.notes,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  // Purchase record transformation
  transformPurchaseRecord(record) {
    return {
      id: record.id,
      ingredient_id: record.ingredient_id,
      user_id: record.user_id,
      quantity: parseFloat(record.quantity) || 0,
      unit: record.unit,
      unit_price: parseFloat(record.unit_price) || 0,
      total_amount: parseFloat(record.total_amount) || 0,
      vendor: record.vendor,
      vendor_invoice: record.vendor_invoice,
      purchase_date: record.date || record.purchase_date || new Date().toISOString().split('T')[0],
      purchase_time: record.time || record.purchase_time || new Date().toTimeString().split(' ')[0],
      receipt_number: record.receipt_number,
      receipt_image_url: record.receipt_image_url,
      payment_method: record.payment_method || 'cash',
      payment_status: record.payment_status || 'paid',
      status: record.status || 'completed',
      notes: record.notes,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  // Expense record transformation
  transformExpenseRecord(record) {
    return {
      id: record.id,
      user_id: record.user_id,
      category: record.category,
      subcategory: record.subcategory,
      description: record.description,
      amount: parseFloat(record.amount) || 0,
      expense_date: record.date || record.expense_date || new Date().toISOString().split('T')[0],
      payment_method: record.payment_method || 'cash',
      receipt_image_url: record.receipt_image_url,
      receipt_number: record.receipt_number,
      vendor: record.vendor,
      is_recurring: record.is_recurring || false,
      recurring_frequency: record.recurring_frequency,
      status: record.status || 'approved',
      notes: record.notes,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  // Platform record transformation
  transformPlatformRecord(record) {
    return {
      id: record.id,
      name: record.name,
      commission_rate: parseFloat(record.commission_rate) || 0,
      description: record.description,
      color: record.color || '#6366f1',
      sort_order: parseInt(record.sort_order) || 0,
      is_active: record.is_active !== false,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  // Get conflict resolution strategy for upsert
  getConflictStrategy(tableName) {
    const strategies = {
      users: 'email',
      platforms: 'name',
      ingredients: 'name',
      menus: 'menu_id'
    };

    return strategies[tableName] || null;
  }

  // Generate migration report
  generateReport() {
    const report = {
      migrationDate: new Date().toISOString(),
      summary: {
        totalExported: Object.values(this.stats.exported).reduce((a, b) => a + b, 0),
        totalImported: Object.values(this.stats.imported).reduce((a, b) => a + b, 0),
        totalErrors: this.stats.errors.length
      },
      exportStats: this.stats.exported,
      importStats: this.stats.imported,
      errors: this.stats.errors,
      config: CONFIG
    };

    const reportPath = path.join(this.exportPath, 'migration_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log('info', `Migration report saved to: ${reportPath}`);
    return report;
  }

  // Run complete migration
  async migrate() {
    try {
      this.log('info', '🚀 Starting Firebase to Supabase migration');

      // Step 1: Export from Firebase
      await this.exportFromFirebase();

      // Step 2: Import to Supabase
      await this.importToSupabase();

      // Step 3: Generate report
      const report = this.generateReport();

      this.log('info', '✅ Migration completed successfully', report.summary);

      return report;

    } catch (error) {
      this.log('error', '❌ Migration failed', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const migrator = new DataMigrator();

  try {
    const report = await migrator.migrate();

    console.log('\n📊 Migration Summary:');
    console.log(`Total Exported: ${report.summary.totalExported} records`);
    console.log(`Total Imported: ${report.summary.totalImported} records`);
    console.log(`Total Errors: ${report.summary.totalErrors}`);

    if (report.summary.totalErrors > 0) {
      console.log('\n⚠️  Some errors occurred. Check the migration log for details.');
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DataMigrator;
