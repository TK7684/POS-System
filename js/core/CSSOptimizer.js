/**
 * CSS Optimizer - Removes unused CSS and optimizes selectors
 * Implements tree-shaking for CSS to reduce bundle size
 */

class CSSOptimizer {
  constructor() {
    this.usedSelectors = new Set();
    this.unusedSelectors = new Set();
    this.optimizedRules = new Map();
    this.observer = null;
    
    this.init();
  }

  /**
   * Initialize the optimizer
   */
  init() {
    this.scanUsedSelectors();
    this.optimizeSelectors();
    this.setupDynamicOptimization();
  }

  /**
   * Scan DOM for actually used CSS selectors
   */
  scanUsedSelectors() {
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      // Add class selectors
      element.classList.forEach(className => {
        this.usedSelectors.add(`.${className}`);
      });
      
      // Add ID selectors
      if (element.id) {
        this.usedSelectors.add(`#${element.id}`);
      }
      
      // Add tag selectors
      this.usedSelectors.add(element.tagName.toLowerCase());
      
      // Add attribute selectors
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') || attr.name === 'aria-current') {
          this.usedSelectors.add(`[${attr.name}]`);
          this.usedSelectors.add(`[${attr.name}="${attr.value}"]`);
        }
      });
    });

    // Add pseudo-selectors that are commonly used
    const pseudoSelectors = [
      ':hover', ':focus', ':active', ':focus-visible',
      ':first-child', ':last-child', ':nth-child',
      '::before', '::after', '::placeholder'
    ];
    
    pseudoSelectors.forEach(pseudo => {
      this.usedSelectors.add(pseudo);
    });

    console.log(`Found ${this.usedSelectors.size} used selectors`);
  }

  /**
   * Optimize CSS selectors for better performance
   */
  optimizeSelectors() {
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          this.optimizeStyleSheet(sheet);
        } catch (e) {
          // Skip cross-origin stylesheets
          console.warn('Could not optimize stylesheet:', e);
        }
      });
    } catch (error) {
      console.warn('CSS optimization failed:', error);
    }
  }

  /**
   * Optimize individual stylesheet
   */
  optimizeStyleSheet(sheet) {
    const rules = Array.from(sheet.cssRules || sheet.rules || []);
    const optimizedRules = [];
    
    rules.forEach(rule => {
      if (this.isRuleUsed(rule)) {
        const optimizedRule = this.optimizeRule(rule);
        if (optimizedRule) {
          optimizedRules.push(optimizedRule);
        }
      } else {
        this.unusedSelectors.add(rule.selectorText || rule.cssText);
      }
    });

    // Store optimized rules for potential reconstruction
    this.optimizedRules.set(sheet.href || 'inline', optimizedRules);
  }

  /**
   * Check if a CSS rule is actually used
   */
  isRuleUsed(rule) {
    // Always keep media queries and keyframes
    if (rule.type === CSSRule.MEDIA_RULE || 
        rule.type === CSSRule.KEYFRAMES_RULE ||
        rule.type === CSSRule.SUPPORTS_RULE) {
      return true;
    }

    // Check style rules
    if (rule.type === CSSRule.STYLE_RULE && rule.selectorText) {
      return this.isSelectorUsed(rule.selectorText);
    }

    return true; // Keep other rule types
  }

  /**
   * Check if a selector is used in the DOM
   */
  isSelectorUsed(selectorText) {
    // Split complex selectors
    const selectors = selectorText.split(',').map(s => s.trim());
    
    return selectors.some(selector => {
      // Check if any part of the selector is used
      const parts = selector.split(/[\s>+~]/).filter(part => part.trim());
      
      return parts.some(part => {
        const cleanPart = part.replace(/[:()]/g, '').trim();
        return this.usedSelectors.has(cleanPart) || 
               this.usedSelectors.has(part) ||
               this.isEssentialSelector(part);
      });
    });
  }

  /**
   * Check if selector is essential (should never be removed)
   */
  isEssentialSelector(selector) {
    const essentialSelectors = [
      'html', 'body', '*', '::before', '::after',
      ':root', ':focus-visible', ':hover', ':active',
      '@media', '@keyframes', '@supports'
    ];

    return essentialSelectors.some(essential => 
      selector.includes(essential)
    );
  }

  /**
   * Optimize individual CSS rule
   */
  optimizeRule(rule) {
    if (rule.type !== CSSRule.STYLE_RULE) {
      return rule.cssText;
    }

    // Optimize selector specificity
    const optimizedSelector = this.optimizeSelector(rule.selectorText);
    
    // Optimize declarations
    const optimizedDeclarations = this.optimizeDeclarations(rule.style);
    
    return `${optimizedSelector}{${optimizedDeclarations}}`;
  }

  /**
   * Optimize CSS selector for better performance
   */
  optimizeSelector(selectorText) {
    return selectorText
      // Remove unnecessary spaces
      .replace(/\s+/g, ' ')
      // Optimize descendant selectors
      .replace(/\s*>\s*/g, '>')
      .replace(/\s*\+\s*/g, '+')
      .replace(/\s*~\s*/g, '~')
      // Remove redundant selectors
      .trim();
  }

  /**
   * Optimize CSS declarations
   */
  optimizeDeclarations(style) {
    const declarations = [];
    
    for (let i = 0; i < style.length; i++) {
      const property = style[i];
      const value = style.getPropertyValue(property);
      const priority = style.getPropertyPriority(property);
      
      // Skip empty values
      if (!value) continue;
      
      // Optimize value
      const optimizedValue = this.optimizeValue(property, value);
      
      // Add declaration
      const declaration = `${property}:${optimizedValue}${priority ? '!important' : ''}`;
      declarations.push(declaration);
    }
    
    return declarations.join(';');
  }

  /**
   * Optimize CSS property values
   */
  optimizeValue(property, value) {
    return value
      // Remove unnecessary spaces
      .replace(/\s+/g, ' ')
      // Optimize colors
      .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3')
      // Optimize zero values
      .replace(/\b0px\b/g, '0')
      .replace(/\b0em\b/g, '0')
      .replace(/\b0rem\b/g, '0')
      .replace(/\b0%\b/g, '0')
      // Remove trailing zeros
      .replace(/(\d)\.0+(\D)/g, '$1$2')
      .trim();
  }

  /**
   * Setup dynamic optimization for new elements
   */
  setupDynamicOptimization() {
    if (!window.MutationObserver) return;

    this.observer = new MutationObserver((mutations) => {
      let needsRescan = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              needsRescan = true;
            }
          });
        } else if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'class' || 
              mutation.attributeName === 'id') {
            needsRescan = true;
          }
        }
      });

      if (needsRescan) {
        // Debounce rescanning
        clearTimeout(this.rescanTimeout);
        this.rescanTimeout = setTimeout(() => {
          this.scanUsedSelectors();
        }, 1000);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id']
    });
  }

  /**
   * Generate optimized CSS string
   */
  generateOptimizedCSS() {
    const cssRules = [];
    
    this.optimizedRules.forEach((rules, source) => {
      cssRules.push(`/* Optimized from: ${source} */`);
      cssRules.push(...rules);
    });

    return cssRules.join('\n');
  }

  /**
   * Remove unused CSS rules from DOM
   */
  removeUnusedCSS() {
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          
          for (let i = rules.length - 1; i >= 0; i--) {
            const rule = rules[i];
            
            if (!this.isRuleUsed(rule)) {
              sheet.deleteRule(i);
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      });
      
      console.log(`Removed ${this.unusedSelectors.size} unused CSS rules`);
    } catch (error) {
      console.warn('Could not remove unused CSS:', error);
    }
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      usedSelectors: this.usedSelectors.size,
      unusedSelectors: this.unusedSelectors.size,
      optimizedRules: Array.from(this.optimizedRules.keys()),
      unusedSelectorsList: Array.from(this.unusedSelectors).slice(0, 10) // First 10 for debugging
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    clearTimeout(this.rescanTimeout);
    
    this.usedSelectors.clear();
    this.unusedSelectors.clear();
    this.optimizedRules.clear();
  }
}

// Auto-initialize after DOM is ready and CSS is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for CSS to load before optimizing
    setTimeout(() => {
      window.cssOptimizer = new CSSOptimizer();
    }, 500);
  });
} else {
  setTimeout(() => {
    window.cssOptimizer = new CSSOptimizer();
  }, 500);
}

export default CSSOptimizer;