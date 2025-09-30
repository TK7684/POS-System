/**
 * CSS Minifier - Minifies CSS for production
 * Removes whitespace, comments, and optimizes values
 */

class CSSMinifier {
  constructor() {
    this.options = {
      removeComments: true,
      removeWhitespace: true,
      optimizeValues: true,
      mergeDuplicates: true,
      removeUnused: false // Set to true only if you're sure about usage
    };
  }

  /**
   * Minify CSS string
   */
  minify(css, options = {}) {
    const opts = { ...this.options, ...options };
    let minified = css;

    if (opts.removeComments) {
      minified = this.removeComments(minified);
    }

    if (opts.removeWhitespace) {
      minified = this.removeWhitespace(minified);
    }

    if (opts.optimizeValues) {
      minified = this.optimizeValues(minified);
    }

    if (opts.mergeDuplicates) {
      minified = this.mergeDuplicateRules(minified);
    }

    return minified;
  }

  /**
   * Remove CSS comments
   */
  removeComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  /**
   * Remove unnecessary whitespace
   */
  removeWhitespace(css) {
    return css
      // Remove leading/trailing whitespace
      .trim()
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove spaces around specific characters
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*,\s*/g, ',')
      .replace(/\s*>\s*/g, '>')
      .replace(/\s*\+\s*/g, '+')
      .replace(/\s*~\s*/g, '~')
      // Remove trailing semicolons
      .replace(/;}/g, '}')
      // Remove empty rules
      .replace(/[^{}]+{\s*}/g, '');
  }

  /**
   * Optimize CSS values
   */
  optimizeValues(css) {
    return css
      // Optimize hex colors
      .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3')
      // Optimize zero values
      .replace(/\b0px\b/g, '0')
      .replace(/\b0em\b/g, '0')
      .replace(/\b0rem\b/g, '0')
      .replace(/\b0%\b/g, '0')
      .replace(/\b0s\b/g, '0')
      .replace(/\b0ms\b/g, '0')
      // Remove leading zeros
      .replace(/\b0+(\.\d+)/g, '$1')
      // Remove trailing zeros
      .replace(/(\d)\.0+(\D)/g, '$1$2')
      // Optimize margin/padding shorthand
      .replace(/margin:0 0 0 0/g, 'margin:0')
      .replace(/padding:0 0 0 0/g, 'padding:0')
      // Optimize font-weight
      .replace(/font-weight:normal/g, 'font-weight:400')
      .replace(/font-weight:bold/g, 'font-weight:700')
      // Optimize background
      .replace(/background-color:transparent/g, 'background:0 0')
      // Optimize border
      .replace(/border:none/g, 'border:0')
      .replace(/border:0px/g, 'border:0')
      // Optimize outline
      .replace(/outline:none/g, 'outline:0');
  }

  /**
   * Merge duplicate CSS rules (basic implementation)
   */
  mergeDuplicateRules(css) {
    const rules = new Map();
    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let match;

    // Extract all rules
    while ((match = ruleRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      
      if (rules.has(selector)) {
        // Merge declarations
        const existing = rules.get(selector);
        const merged = this.mergeDeclarations(existing, declarations);
        rules.set(selector, merged);
      } else {
        rules.set(selector, declarations);
      }
    }

    // Rebuild CSS
    let merged = '';
    rules.forEach((declarations, selector) => {
      merged += `${selector}{${declarations}}`;
    });

    return merged;
  }

  /**
   * Merge CSS declarations
   */
  mergeDeclarations(existing, newDeclarations) {
    const existingProps = new Map();
    const newProps = new Map();

    // Parse existing declarations
    existing.split(';').forEach(decl => {
      const [prop, value] = decl.split(':').map(s => s.trim());
      if (prop && value) {
        existingProps.set(prop, value);
      }
    });

    // Parse new declarations
    newDeclarations.split(';').forEach(decl => {
      const [prop, value] = decl.split(':').map(s => s.trim());
      if (prop && value) {
        newProps.set(prop, value);
      }
    });

    // Merge (new declarations override existing)
    const merged = new Map([...existingProps, ...newProps]);

    // Convert back to string
    return Array.from(merged.entries())
      .map(([prop, value]) => `${prop}:${value}`)
      .join(';');
  }

  /**
   * Minify CSS file and return optimized version
   */
  async minifyFile(cssContent) {
    try {
      const minified = this.minify(cssContent);
      const originalSize = cssContent.length;
      const minifiedSize = minified.length;
      const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

      return {
        css: minified,
        originalSize,
        minifiedSize,
        savings: `${savings}%`
      };
    } catch (error) {
      console.error('CSS minification failed:', error);
      return {
        css: cssContent,
        originalSize: cssContent.length,
        minifiedSize: cssContent.length,
        savings: '0%',
        error: error.message
      };
    }
  }

  /**
   * Create critical CSS from full CSS
   */
  extractCritical(css, criticalSelectors = []) {
    const defaultCritical = [
      'html', 'body', '.app', '.appbar', '.tabbar', 'main',
      '.tabbtn', '.title', '.spacer', '.hide', '.loading',
      '.spinner', '.toast', ':focus-visible', '@media'
    ];

    const selectors = [...defaultCritical, ...criticalSelectors];
    const criticalRules = [];
    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let match;

    while ((match = ruleRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      
      if (this.isCriticalSelector(selector, selectors)) {
        criticalRules.push(`${selector}{${declarations}}`);
      }
    }

    return this.minify(criticalRules.join(''));
  }

  /**
   * Check if selector is critical
   */
  isCriticalSelector(selector, criticalSelectors) {
    return criticalSelectors.some(critical => {
      if (critical.startsWith('@')) {
        return selector.includes(critical);
      }
      return selector.includes(critical);
    });
  }

  /**
   * Generate CSS statistics
   */
  getStats(originalCSS, minifiedCSS) {
    const originalLines = originalCSS.split('\n').length;
    const minifiedLines = minifiedCSS.split('\n').length;
    const originalRules = (originalCSS.match(/\{[^}]*\}/g) || []).length;
    const minifiedRules = (minifiedCSS.match(/\{[^}]*\}/g) || []).length;

    return {
      originalSize: originalCSS.length,
      minifiedSize: minifiedCSS.length,
      sizeSavings: ((originalCSS.length - minifiedCSS.length) / originalCSS.length * 100).toFixed(1) + '%',
      originalLines,
      minifiedLines,
      lineSavings: ((originalLines - minifiedLines) / originalLines * 100).toFixed(1) + '%',
      originalRules,
      minifiedRules,
      ruleSavings: originalRules - minifiedRules
    };
  }
}

// Export for use in build tools or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CSSMinifier;
} else if (typeof window !== 'undefined') {
  window.CSSMinifier = CSSMinifier;
}

export default CSSMinifier;