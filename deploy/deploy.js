#!/usr/bin/env node

/**
 * Production Deployment Script
 * Handles automated deployment with rollback capabilities
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProductionDeployer {
    constructor() {
        this.config = {
            projectRoot: process.cwd(),
            buildDir: 'dist',
            backupDir: 'backups',
            deploymentLog: 'deployment.log',
            requiredFiles: [
                'Index.html',
                'js/critical.js',
                'css/critical.css',
                'manifest.json',
                'sw.js'
            ]
        };
        
        this.deploymentId = this.generateDeploymentId();
        this.startTime = Date.now();
    }

    /**
     * Main deployment function
     */
    async deploy() {
        console.log(`🚀 Starting deployment ${this.deploymentId}`);
        this.log(`Deployment ${this.deploymentId} started`);

        try {
            // Pre-deployment checks
            await this.validateEnvironment();
            await this.runTests();
            await this.buildProject();
            
            // Create backup
            await this.createBackup();
            
            // Deploy
            await this.deployFiles();
            await this.updateConfiguration();
            
            // Post-deployment verification
            await this.verifyDeployment();
            await this.cleanupOldBackups();
            
            const duration = Date.now() - this.startTime;
            console.log(`✅ Deployment ${this.deploymentId} completed successfully in ${duration}ms`);
            this.log(`Deployment ${this.deploymentId} completed successfully in ${duration}ms`);
            
            return { success: true, deploymentId: this.deploymentId, duration };
            
        } catch (error) {
            console.error(`❌ Deployment ${this.deploymentId} failed:`, error.message);
            this.log(`Deployment ${this.deploymentId} failed: ${error.message}`);
            
            // Attempt rollback
            await this.rollback();
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate deployment environment
     */
    async validateEnvironment() {
        console.log('🔍 Validating environment...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`Node.js version: ${nodeVersion}`);
        
        // Check required files exist
        for (const file of this.config.requiredFiles) {
            try {
                await fs.access(path.join(this.config.projectRoot, file));
                console.log(`✓ ${file} exists`);
            } catch (error) {
                throw new Error(`Required file missing: ${file}`);
            }
        }
        
        // Check disk space
        const stats = await fs.stat(this.config.projectRoot);
        console.log('✓ Environment validation passed');
    }

    /**
     * Run tests before deployment
     */
    async runTests() {
        console.log('🧪 Running tests...');
        
        try {
            // Run any available tests
            if (await this.fileExists('package.json')) {
                const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
                if (packageJson.scripts && packageJson.scripts.test) {
                    console.log('Running npm test...');
                    execSync('npm test', { stdio: 'inherit' });
                }
            }
            
            // Run basic validation tests
            await this.validateHTML();
            await this.validateJavaScript();
            await this.validateCSS();
            
            console.log('✓ All tests passed');
        } catch (error) {
            throw new Error(`Tests failed: ${error.message}`);
        }
    }

    /**
     * Build project for production
     */
    async buildProject() {
        console.log('🔨 Building project...');
        
        // Create build directory
        const buildPath = path.join(this.config.projectRoot, this.config.buildDir);
        await this.ensureDirectory(buildPath);
        
        // Copy files to build directory
        const filesToCopy = [
            'Index.html',
            'js/',
            'css/',
            'manifest.json',
            'sw.js',
            'offline.html'
        ];
        
        for (const file of filesToCopy) {
            const sourcePath = path.join(this.config.projectRoot, file);
            const destPath = path.join(buildPath, file);
            
            if (await this.fileExists(sourcePath)) {
                const stats = await fs.stat(sourcePath);
                if (stats.isDirectory()) {
                    await this.copyDirectory(sourcePath, destPath);
                } else {
                    await this.ensureDirectory(path.dirname(destPath));
                    await fs.copyFile(sourcePath, destPath);
                }
                console.log(`✓ Copied ${file}`);
            }
        }
        
        // Optimize files for production
        await this.optimizeFiles(buildPath);
        
        console.log('✓ Build completed');
    }

    /**
     * Create backup for rollback
     */
    async createBackup() {
        console.log('💾 Creating backup...');
        
        const backupPath = path.join(this.config.projectRoot, this.config.backupDir, this.deploymentId);
        await this.ensureDirectory(backupPath);
        
        // Backup current production files
        const productionFiles = this.config.requiredFiles;
        
        for (const file of productionFiles) {
            const sourcePath = path.join(this.config.projectRoot, file);
            const backupFilePath = path.join(backupPath, file);
            
            if (await this.fileExists(sourcePath)) {
                await this.ensureDirectory(path.dirname(backupFilePath));
                await fs.copyFile(sourcePath, backupFilePath);
            }
        }
        
        // Create backup metadata
        const backupMetadata = {
            deploymentId: this.deploymentId,
            timestamp: new Date().toISOString(),
            files: productionFiles,
            version: await this.getCurrentVersion()
        };
        
        await fs.writeFile(
            path.join(backupPath, 'backup-metadata.json'),
            JSON.stringify(backupMetadata, null, 2)
        );
        
        console.log(`✓ Backup created: ${backupPath}`);
    }

    /**
     * Deploy files to production
     */
    async deployFiles() {
        console.log('📦 Deploying files...');
        
        const buildPath = path.join(this.config.projectRoot, this.config.buildDir);
        
        // Copy files from build to production
        const filesToDeploy = await this.getFilesInDirectory(buildPath);
        
        for (const file of filesToDeploy) {
            const sourcePath = path.join(buildPath, file);
            const destPath = path.join(this.config.projectRoot, file);
            
            await this.ensureDirectory(path.dirname(destPath));
            await fs.copyFile(sourcePath, destPath);
            console.log(`✓ Deployed ${file}`);
        }
        
        console.log('✓ Files deployed successfully');
    }

    /**
     * Update configuration for production
     */
    async updateConfiguration() {
        console.log('⚙️ Updating configuration...');
        
        // Update service worker with new version
        await this.updateServiceWorker();
        
        // Update manifest with deployment info
        await this.updateManifest();
        
        console.log('✓ Configuration updated');
    }

    /**
     * Verify deployment success
     */
    async verifyDeployment() {
        console.log('✅ Verifying deployment...');
        
        // Check all required files exist
        for (const file of this.config.requiredFiles) {
            const filePath = path.join(this.config.projectRoot, file);
            if (!(await this.fileExists(filePath))) {
                throw new Error(`Deployment verification failed: ${file} not found`);
            }
        }
        
        // Validate HTML
        await this.validateHTML();
        
        // Check service worker registration
        const swContent = await fs.readFile(path.join(this.config.projectRoot, 'sw.js'), 'utf8');
        if (!swContent.includes('CACHE_VERSION')) {
            throw new Error('Service worker validation failed');
        }
        
        console.log('✓ Deployment verification passed');
    }

    /**
     * Rollback to previous version
     */
    async rollback() {
        console.log('🔄 Initiating rollback...');
        
        try {
            const backupPath = path.join(this.config.projectRoot, this.config.backupDir, this.deploymentId);
            
            if (!(await this.fileExists(backupPath))) {
                throw new Error('Backup not found for rollback');
            }
            
            // Restore files from backup
            const backupFiles = await this.getFilesInDirectory(backupPath);
            
            for (const file of backupFiles) {
                if (file === 'backup-metadata.json') continue;
                
                const backupFilePath = path.join(backupPath, file);
                const restorePath = path.join(this.config.projectRoot, file);
                
                await fs.copyFile(backupFilePath, restorePath);
                console.log(`✓ Restored ${file}`);
            }
            
            console.log('✅ Rollback completed successfully');
            this.log(`Rollback completed for deployment ${this.deploymentId}`);
            
        } catch (error) {
            console.error('❌ Rollback failed:', error.message);
            this.log(`Rollback failed for deployment ${this.deploymentId}: ${error.message}`);
        }
    }

    /**
     * Clean up old backups
     */
    async cleanupOldBackups() {
        console.log('🧹 Cleaning up old backups...');
        
        const backupDir = path.join(this.config.projectRoot, this.config.backupDir);
        
        if (!(await this.fileExists(backupDir))) {
            return;
        }
        
        const backups = await fs.readdir(backupDir);
        const sortedBackups = backups.sort().reverse(); // Most recent first
        
        // Keep only the last 5 backups
        const backupsToDelete = sortedBackups.slice(5);
        
        for (const backup of backupsToDelete) {
            const backupPath = path.join(backupDir, backup);
            await this.removeDirectory(backupPath);
            console.log(`✓ Removed old backup: ${backup}`);
        }
        
        console.log('✓ Cleanup completed');
    }

    /**
     * Helper methods
     */
    generateDeploymentId() {
        return `deploy-${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).substr(2, 5)}`;
    }

    async getCurrentVersion() {
        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            return packageJson.version || '1.0.0';
        } catch (error) {
            return '1.0.0';
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }

    async copyDirectory(source, dest) {
        await this.ensureDirectory(dest);
        const entries = await fs.readdir(source, { withFileTypes: true });
        
        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDirectory(sourcePath, destPath);
            } else {
                await fs.copyFile(sourcePath, destPath);
            }
        }
    }

    async removeDirectory(dirPath) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
        } catch (error) {
            // Directory might not exist
        }
    }

    async getFilesInDirectory(dirPath, relativeTo = dirPath) {
        const files = [];
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(relativeTo, fullPath);
            
            if (entry.isDirectory()) {
                const subFiles = await this.getFilesInDirectory(fullPath, relativeTo);
                files.push(...subFiles);
            } else {
                files.push(relativePath);
            }
        }
        
        return files;
    }

    async optimizeFiles(buildPath) {
        // Minify CSS files
        const cssFiles = await this.findFiles(buildPath, '.css');
        for (const cssFile of cssFiles) {
            await this.minifyCSS(cssFile);
        }
        
        // Minify JS files
        const jsFiles = await this.findFiles(buildPath, '.js');
        for (const jsFile of jsFiles) {
            await this.minifyJS(jsFile);
        }
    }

    async findFiles(dir, extension) {
        const files = [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                const subFiles = await this.findFiles(fullPath, extension);
                files.push(...subFiles);
            } else if (entry.name.endsWith(extension)) {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    async minifyCSS(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');
            
            // Simple CSS minification
            content = content
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .replace(/;\s*}/g, '}') // Remove last semicolon in blocks
                .replace(/\s*{\s*/g, '{') // Clean up braces
                .replace(/\s*}\s*/g, '}')
                .replace(/\s*;\s*/g, ';')
                .trim();
            
            await fs.writeFile(filePath, content);
            console.log(`✓ Minified CSS: ${path.basename(filePath)}`);
        } catch (error) {
            console.warn(`Warning: Failed to minify CSS ${filePath}:`, error.message);
        }
    }

    async minifyJS(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');
            
            // Simple JS minification (basic)
            content = content
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
                .replace(/\/\/.*$/gm, '') // Remove line comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .trim();
            
            await fs.writeFile(filePath, content);
            console.log(`✓ Minified JS: ${path.basename(filePath)}`);
        } catch (error) {
            console.warn(`Warning: Failed to minify JS ${filePath}:`, error.message);
        }
    }

    async validateHTML() {
        const htmlPath = path.join(this.config.projectRoot, 'Index.html');
        const content = await fs.readFile(htmlPath, 'utf8');
        
        // Basic HTML validation
        if (!content.includes('<!DOCTYPE html>')) {
            throw new Error('HTML validation failed: Missing DOCTYPE');
        }
        
        if (!content.includes('<html')) {
            throw new Error('HTML validation failed: Missing html tag');
        }
    }

    async validateJavaScript() {
        const jsPath = path.join(this.config.projectRoot, 'js/critical.js');
        if (await this.fileExists(jsPath)) {
            const content = await fs.readFile(jsPath, 'utf8');
            
            // Basic syntax check
            try {
                new Function(content);
            } catch (error) {
                throw new Error(`JavaScript validation failed: ${error.message}`);
            }
        }
    }

    async validateCSS() {
        const cssPath = path.join(this.config.projectRoot, 'css/critical.css');
        if (await this.fileExists(cssPath)) {
            const content = await fs.readFile(cssPath, 'utf8');
            
            // Basic CSS validation
            const openBraces = (content.match(/{/g) || []).length;
            const closeBraces = (content.match(/}/g) || []).length;
            
            if (openBraces !== closeBraces) {
                throw new Error('CSS validation failed: Mismatched braces');
            }
        }
    }

    async updateServiceWorker() {
        const swPath = path.join(this.config.projectRoot, 'sw.js');
        if (await this.fileExists(swPath)) {
            let content = await fs.readFile(swPath, 'utf8');
            
            // Update cache version
            const newVersion = `v${Date.now()}`;
            content = content.replace(/CACHE_VERSION\s*=\s*['"][^'"]*['"]/, `CACHE_VERSION = '${newVersion}'`);
            
            await fs.writeFile(swPath, content);
            console.log(`✓ Updated service worker cache version: ${newVersion}`);
        }
    }

    async updateManifest() {
        const manifestPath = path.join(this.config.projectRoot, 'manifest.json');
        if (await this.fileExists(manifestPath)) {
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
            
            // Add deployment info
            manifest.version = await this.getCurrentVersion();
            manifest.deployed = new Date().toISOString();
            
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
            console.log('✓ Updated manifest with deployment info');
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        
        try {
            fs.appendFile(this.config.deploymentLog, logMessage);
        } catch (error) {
            // Ignore logging errors
        }
    }
}

// CLI usage
if (require.main === module) {
    const deployer = new ProductionDeployer();
    
    deployer.deploy()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 Deployment completed successfully!');
                process.exit(0);
            } else {
                console.error('\n💥 Deployment failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Deployment script error:', error);
            process.exit(1);
        });
}

module.exports = ProductionDeployer;