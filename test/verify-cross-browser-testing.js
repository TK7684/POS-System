/**
 * Verification Script for Cross-Browser Testing Module
 * Run this to verify the module is working correctly
 */

// Check if running in Node.js or browser
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isNode) {
  console.log('❌ This module must be run in a browser environment');
  console.log('📝 Please open test/test-cross-browser-module.html in a browser');
  process.exit(1);
}

// Verification function
async function verifyCrossBrowserTestingModule() {
  console.log('🔍 Verifying Cross-Browser Testing Module...\n');
  
  const results = {
    moduleLoaded: false,
    classExists: false,
    methodsExist: false,
    canInstantiate: false,
    canRunTests: false,
    errors: []
  };
  
  try {
    // Check if module is loaded
    if (typeof CrossBrowserTestingModule !== 'undefined') {
      results.moduleLoaded = true;
      console.log('✅ Module loaded successfully');
    } else {
      results.errors.push('Module not loaded');
      console.log('❌ Module not loaded');
      return results;
    }
    
    // Check if class exists
    if (typeof CrossBrowserTestingModule === 'function') {
      results.classExists = true;
      console.log('✅ CrossBrowserTestingModule class exists');
    } else {
      results.errors.push('Class does not exist');
      console.log('❌ CrossBrowserTestingModule class does not exist');
      return results;
    }
    
    // Check required methods
    const requiredMethods = [
      'testBrowserCompatibility',
      'testDeviceEmulation',
      'testViewportSizes',
      'testPWAInstallation',
      'testTouchInteractions',
      'testResponsiveLayout',
      'getCrossBrowserReport',
      'reset'
    ];
    
    const instance = new CrossBrowserTestingModule();
    const missingMethods = requiredMethods.filter(method => typeof instance[method] !== 'function');
    
    if (missingMethods.length === 0) {
      results.methodsExist = true;
      console.log('✅ All required methods exist');
    } else {
      results.errors.push(`Missing methods: ${missingMethods.join(', ')}`);
      console.log(`❌ Missing methods: ${missingMethods.join(', ')}`);
      return results;
    }
    
    // Check if can instantiate
    try {
      const testModule = new CrossBrowserTestingModule({ timeout: 5000 });
      results.canInstantiate = true;
      console.log('✅ Can instantiate module');
      
      // Check configuration
      if (testModule.config.timeout === 5000) {
        console.log('✅ Configuration works correctly');
      }
      
      // Check initial state
      if (testModule.testResults && 
          testModule.testResults.summary &&
          testModule.testResults.summary.totalTests === 0) {
        console.log('✅ Initial state is correct');
      }
      
    } catch (error) {
      results.errors.push(`Instantiation error: ${error.message}`);
      console.log(`❌ Cannot instantiate: ${error.message}`);
      return results;
    }
    
    // Try running a simple test
    try {
      console.log('\n🧪 Running sample browser compatibility test...');
      const testModule = new CrossBrowserTestingModule();
      const browserResults = await testModule.testBrowserCompatibility();
      
      if (browserResults && browserResults.results && browserResults.results.length > 0) {
        results.canRunTests = true;
        console.log(`✅ Browser compatibility test completed`);
        console.log(`   Tested ${browserResults.results.length} browsers`);
        console.log(`   Passed: ${browserResults.summary.passed}/${browserResults.summary.total}`);
        
        // Show browser results
        browserResults.results.forEach(result => {
          const status = result.passed ? '✅' : '❌';
          console.log(`   ${status} ${result.browser}: ${result.message}`);
        });
      } else {
        results.errors.push('Test did not return expected results');
        console.log('❌ Test did not return expected results');
      }
      
    } catch (error) {
      results.errors.push(`Test execution error: ${error.message}`);
      console.log(`❌ Test execution failed: ${error.message}`);
    }
    
  } catch (error) {
    results.errors.push(`Verification error: ${error.message}`);
    console.log(`❌ Verification error: ${error.message}`);
  }
  
  // Summary
  console.log('\n📊 Verification Summary:');
  console.log(`   Module Loaded: ${results.moduleLoaded ? '✅' : '❌'}`);
  console.log(`   Class Exists: ${results.classExists ? '✅' : '❌'}`);
  console.log(`   Methods Exist: ${results.methodsExist ? '✅' : '❌'}`);
  console.log(`   Can Instantiate: ${results.canInstantiate ? '✅' : '❌'}`);
  console.log(`   Can Run Tests: ${results.canRunTests ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  const allPassed = results.moduleLoaded && 
                   results.classExists && 
                   results.methodsExist && 
                   results.canInstantiate && 
                   results.canRunTests;
  
  if (allPassed) {
    console.log('\n✅ All verifications passed! Module is working correctly.');
  } else {
    console.log('\n❌ Some verifications failed. Please check the errors above.');
  }
  
  return results;
}

// Auto-run if in browser
if (!isNode) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifyCrossBrowserTestingModule);
  } else {
    verifyCrossBrowserTestingModule();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { verifyCrossBrowserTestingModule };
}
