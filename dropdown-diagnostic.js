/**
 * Dropdown Diagnostic Script
 * Copy and paste this into the browser console when viewing the POS application
 * to diagnose dropdown issues
 */

(function() {
    console.log('🔬 Starting Dropdown Diagnostic...\n');
    
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };
    
    function check(name, condition, errorMsg, successMsg) {
        if (condition) {
            results.passed.push(name);
            console.log(`✅ ${name}: ${successMsg || 'OK'}`);
            return true;
        } else {
            results.failed.push(name);
            console.error(`❌ ${name}: ${errorMsg || 'FAILED'}`);
            return false;
        }
    }
    
    function warn(name, message) {
        results.warnings.push(name);
        console.warn(`⚠️  ${name}: ${message}`);
    }
    
    console.log('=== 1. DEPENDENCY CHECK ===');
    check(
        'CacheManager Class',
        typeof CacheManager !== 'undefined',
        'CacheManager.js not loaded - Add <script src="CacheManager.js"></script> before critical.js',
        'CacheManager.js loaded successfully'
    );
    
    check(
        'Critical.js Functions',
        typeof window.routeTo === 'function',
        'critical.js not loaded properly',
        'critical.js loaded successfully'
    );
    
    console.log('\n=== 2. INITIALIZATION CHECK ===');
    
    if (check(
        'window.cacheManager',
        !!window.cacheManager,
        'CacheManager instance not created - Check initModuleLoader() in critical.js',
        `Instance exists: ${typeof window.cacheManager}`
    )) {
        check(
            'CacheManager Methods',
            typeof window.cacheManager.get === 'function' && 
            typeof window.cacheManager.set === 'function',
            'CacheManager missing required methods',
            'All required methods present'
        );
    }
    
    if (check(
        'window.dropdownManager',
        !!window.dropdownManager,
        '🚨 CRITICAL: DropdownManager not initialized! This is why dropdowns don\'t work.',
        `Instance exists: ${typeof window.dropdownManager}`
    )) {
        check(
            'DropdownManager.cacheManager',
            !!window.dropdownManager.cacheManager,
            'DropdownManager created without CacheManager reference',
            'DropdownManager has CacheManager reference'
        );
        
        check(
            'DropdownManager Methods',
            typeof window.dropdownManager.populateIngredients === 'function' &&
            typeof window.dropdownManager.populateMenus === 'function' &&
            typeof window.dropdownManager.populatePlatforms === 'function',
            'DropdownManager missing required methods',
            'All populate methods present'
        );
    }
    
    check(
        'window.moduleLoader',
        !!window.moduleLoader,
        'ModuleLoader not initialized',
        `Instance exists: ${typeof window.moduleLoader}`
    );
    
    console.log('\n=== 3. MODULE CHECK ===');
    const modules = ['purchaseInstance', 'saleInstance', 'menuInstance', 'reportsInstance'];
    modules.forEach(moduleName => {
        if (window[moduleName]) {
            console.log(`✅ ${moduleName}: Loaded`);
            if (window[moduleName].dropdownManager) {
                console.log(`   └─ Has dropdownManager reference ✓`);
            } else {
                console.warn(`   └─ ⚠️  Missing dropdownManager reference`);
            }
        } else {
            console.log(`ℹ️  ${moduleName}: Not loaded yet (lazy loaded on tab access)`);
        }
    });
    
    console.log('\n=== 4. DOM ELEMENT CHECK ===');
    const dropdowns = [
        { id: 'p_ing', name: 'Purchase - Ingredient' },
        { id: 'p_unit', name: 'Purchase - Unit' },
        { id: 's_menu', name: 'Sale - Menu' },
        { id: 's_platform', name: 'Sale - Platform' },
        { id: 'm_menu', name: 'Menu - Menu Select' },
        { id: 'm_ingredient', name: 'Menu - Ingredient' }
    ];
    
    dropdowns.forEach(dd => {
        const element = document.getElementById(dd.id);
        if (element) {
            const optionCount = element.options.length;
            if (optionCount > 1) {
                console.log(`✅ ${dd.name} (${dd.id}): ${optionCount} options`);
            } else if (optionCount === 1) {
                console.warn(`⚠️  ${dd.name} (${dd.id}): Only placeholder - not populated`);
            } else {
                console.error(`❌ ${dd.name} (${dd.id}): Empty`);
            }
        } else {
            console.error(`❌ ${dd.name} (${dd.id}): Element not found in DOM`);
        }
    });
    
    console.log('\n=== 5. GOOGLE APPS SCRIPT CHECK ===');
    if (typeof google !== 'undefined' && google.script && google.script.run) {
        console.log('✅ Google Apps Script API available');
        console.log('   Running in GAS environment');
    } else {
        console.warn('⚠️  Google Apps Script API not available');
        console.log('   Running in local/dev environment');
    }
    
    console.log('\n=== 6. INITIALIZATION TIMING ===');
    console.log(`Document readyState: ${document.readyState}`);
    console.log(`DOMContentLoaded: ${document.readyState !== 'loading' ? 'Yes' : 'No'}`);
    
    console.log('\n=== 7. MANUAL DROPDOWN TEST ===');
    if (window.dropdownManager) {
        console.log('Testing dropdown population manually...');
        
        async function testDropdownPopulation() {
            try {
                // Test ingredient dropdown
                const ingredientSelect = document.getElementById('p_ing');
                if (ingredientSelect) {
                    console.log('Attempting to populate ingredient dropdown...');
                    await window.dropdownManager.populateIngredients(ingredientSelect);
                    console.log(`✅ Ingredient dropdown populated: ${ingredientSelect.options.length} options`);
                } else {
                    console.error('❌ Ingredient dropdown not found');
                }
                
                // Test menu dropdown
                const menuSelect = document.getElementById('s_menu');
                if (menuSelect) {
                    console.log('Attempting to populate menu dropdown...');
                    await window.dropdownManager.populateMenus(menuSelect);
                    console.log(`✅ Menu dropdown populated: ${menuSelect.options.length} options`);
                } else {
                    console.error('❌ Menu dropdown not found');
                }
                
                // Test platform dropdown
                const platformSelect = document.getElementById('s_platform');
                if (platformSelect) {
                    console.log('Attempting to populate platform dropdown...');
                    await window.dropdownManager.populatePlatforms(platformSelect);
                    console.log(`✅ Platform dropdown populated: ${platformSelect.options.length} options`);
                } else {
                    console.error('❌ Platform dropdown not found');
                }
            } catch (error) {
                console.error('❌ Dropdown population failed:', error);
                console.error('Error details:', error.message);
                console.error('Stack trace:', error.stack);
            }
        }
        
        console.log('Run the test with: testDropdownPopulation()');
        window.testDropdownPopulation = testDropdownPopulation;
    } else {
        console.error('❌ Cannot test - DropdownManager not initialized');
    }
    
    console.log('\n=== DIAGNOSTIC SUMMARY ===');
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    
    if (results.failed.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES:');
        results.failed.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (!window.dropdownManager) {
        console.log('\n💡 PRIMARY ISSUE DETECTED:');
        console.log('   DropdownManager is not initialized!');
        console.log('\n🔧 SOLUTION:');
        console.log('   1. Make sure CacheManager.js is loaded BEFORE critical.js');
        console.log('   2. Check that initModuleLoader() is called');
        console.log('   3. Wait for initialization (100-200ms after page load)');
        console.log('\n   In your HTML, ensure:');
        console.log('   <script src="CacheManager.js"></script>');
        console.log('   <script src="js/critical.js" defer></script>');
    }
    
    console.log('\n📊 Full diagnostic report saved to: window.dropdownDiagnostic');
    window.dropdownDiagnostic = {
        timestamp: new Date().toISOString(),
        results,
        environment: {
            hasCacheManager: typeof CacheManager !== 'undefined',
            hasCacheManagerInstance: !!window.cacheManager,
            hasDropdownManager: !!window.dropdownManager,
            hasModuleLoader: !!window.moduleLoader,
            hasGoogleScript: typeof google !== 'undefined' && !!google.script,
            documentReady: document.readyState
        },
        modules: {
            purchase: !!window.purchaseInstance,
            sale: !!window.saleInstance,
            menu: !!window.menuInstance,
            reports: !!window.reportsInstance
        }
    };
    
    console.log('\n✅ Diagnostic complete!');
    console.log('💡 For manual dropdown test, run: testDropdownPopulation()');
    
})();

