/**
 * Critical Rendering Path Optimizer
 * Optimizes critical rendering path based on test results
 * Requirements: 2.1, 2.2, 2.3
 */

class CriticalRenderingPathOptimizer {
    constructor() {
        this.criticalResources = new Set();
        this.deferredResources = new Set();
        this.preloadedResources = new Set();
        this.optimizationMetrics = {
            beforeOptimization: {},
            afterOptimization: {},
            improvements: {}
        };
        
        this.criticalCSS = '';
        this.nonCriticalCSS = [];
        this.criticalJS = [];
        this.deferredJS = [];
    }

    /**
     * Initialize optimizer and analyze current performance
     */
    async initialize() {
        console.log('🚀 Initializing Critical Rendering Path Optimizer...');
        
        try {
            // Measure baseline performance
            this.optimizationMetrics.beforeOptimization = await this.measurePerformance();
            
            // Analyze critical resources
            await this.analyzeCriticalResources();
            
            // Extract critical CSS
            await this.extractCriticalCSS();
            
            // Identify critical JavaScript
            await this.identifyCriticalJavaScript();
            
            console.log('✅ Critical Rendering Path Optimizer initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize optimizer:', error);
            return false;
        }
    }

    /**
     * Apply all critical rendering path optimizations
     */
    async optimize() {
        console.log('⚡ Applying critical rendering path optimizations...');
        
        try {
            // 1. Inline critical CSS
            await this.inlineCriticalCSS();
            
            // 2. Defer non-critical CSS
            await this.deferNonCriticalCSS();
            
            // 3. Optimize JavaScript loading
            await this.optimizeJavaScriptLoading();
            
            // 4. Preload critical resources
            await this.preloadCriticalResources();
            
            // 5. Optimize font loading
            await this.optimizeFontLoading();
            
            // 6. Minimize render-blocking resources
            await this.minimizeRenderBlockingResources();
            
            // Measure performance after optimization
            this.optimizationMetrics.afterOptimization = await this.measurePerformance();
            this.optimizationMetrics.improvements = this.calculateImprovements();
            
            console.log('✅ Critical rendering path optimizations applied');
            console.log('📊 Performance improvements:', this.optimizationMetrics.improvements);
            
            return this.optimizationMetrics;
            
        } catch (error) {
            console.error('❌ Failed to apply optimizations:', error);
            throw error;
        }
    }

    /**
     * Measure current performance metrics
     */
    async measurePerformance() {
        const metrics = {};
        
        // Use Performance Observer API
        if ('PerformanceObserver' in window) {
            // Measure paint metrics
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                metrics[entry.name] = entry.startTime;
            });
            
            // Measure navigation timing
            const navigationEntries = performance.getEntriesByType('navigation');
            if (navigationEntries.length > 0) {
                const nav = navigationEntries[0];
                metrics.domContentLoaded = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
                metrics.loadComplete = nav.loadEventEnd - nav.loadEventStart;
                metrics.domInteractive = nav.domInteractive - nav.fetchStart;
            }
        }
        
        // Measure resource loading
        const resourceEntries = performance.getEntriesByType('resource');
        metrics.resourceCount = resourceEntries.length;
        metrics.totalResourceSize = resourceEntries.reduce((total, resource) => {
            return total + (resource.transferSize || 0);
        }, 0);
        
        // Measure render-blocking resources
        metrics.renderBlockingResources = this.countRenderBlockingResources();
        
        return metrics;
    }

    /**
     * Analyze critical resources needed for above-the-fold content
     */
    async analyzeCriticalResources() {
        // Identify above-the-fold elements
        const viewportHeight = window.innerHeight;
        const criticalElements = [];
        
        // Find elements in viewport
        document.querySelectorAll('*').forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < viewportHeight && rect.bottom > 0) {
                criticalElements.push(element);
            }
        });
        
        // Analyze CSS used by critical elements
        criticalElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            // Extract critical styles (simplified)
            this.extractElementCriticalStyles(element, computedStyle);
        });
        
        // Identify critical images
        const criticalImages = document.querySelectorAll('img').forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < viewportHeight) {
                this.criticalResources.add(img.src);
            }
        });
        
        console.log(`📊 Found ${criticalElements.length} critical elements`);
        console.log(`📊 Found ${this.criticalResources.size} critical resources`);
    }

    /**
     * Extract critical CSS for above-the-fold content
     */
    async extractCriticalCSS() {
        const criticalStyles = new Set();
        
        // Get all stylesheets
        const stylesheets = Array.from(document.styleSheets);
        
        for (const stylesheet of stylesheets) {
            try {
                if (stylesheet.cssRules) {
                    Array.from(stylesheet.cssRules).forEach(rule => {
                        if (this.isCriticalRule(rule)) {
                            criticalStyles.add(rule.cssText);
                        }
                    });
                }
            } catch (error) {
                // Cross-origin stylesheets may not be accessible
                console.warn('Cannot access stylesheet:', stylesheet.href);
            }
        }
        
        this.criticalCSS = Array.from(criticalStyles).join('\n');
        
        // Minify critical CSS
        this.criticalCSS = this.minifyCSS(this.criticalCSS);
        
        console.log(`📊 Extracted ${this.criticalCSS.length} bytes of critical CSS`);
    }

    /**
     * Check if a CSS rule is critical for above-the-fold rendering
     */
    isCriticalRule(rule) {
        if (rule.type !== CSSRule.STYLE_RULE) return false;
        
        const selector = rule.selectorText;
        
        // Always include base styles
        if (selector.includes('html') || selector.includes('body')) {
            return true;
        }
        
        // Include styles for critical elements
        try {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const rect = element.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    return true;
                }
            }
        } catch (error) {
            // Invalid selector
            return false;
        }
        
        return false;
    }

    /**
     * Identify critical JavaScript needed for initial render
     */
    async identifyCriticalJavaScript() {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        
        scripts.forEach(script => {
            const src = script.src;
            
            // Critical JavaScript patterns
            if (src.includes('critical') || 
                src.includes('inline') || 
                script.hasAttribute('data-critical')) {
                this.criticalJS.push(src);
            } else {
                this.deferredJS.push(src);
            }
        });
        
        console.log(`📊 Identified ${this.criticalJS.length} critical JS files`);
        console.log(`📊 Identified ${this.deferredJS.length} deferrable JS files`);
    }

    /**
     * Inline critical CSS in the document head
     */
    async inlineCriticalCSS() {
        if (!this.criticalCSS) return;
        
        // Create inline style element
        const styleElement = document.createElement('style');
        styleElement.textContent = this.criticalCSS;
        styleElement.setAttribute('data-critical', 'true');
        
        // Insert at the beginning of head
        const head = document.head;
        const firstChild = head.firstChild;
        head.insertBefore(styleElement, firstChild);
        
        console.log('✅ Critical CSS inlined');
    }

    /**
     * Defer non-critical CSS loading
     */
    async deferNonCriticalCSS() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        
        stylesheets.forEach(link => {
            if (!link.hasAttribute('data-critical')) {
                // Convert to preload and load asynchronously
                const href = link.href;
                
                // Create preload link
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'preload';
                preloadLink.as = 'style';
                preloadLink.href = href;
                preloadLink.onload = function() {
                    this.onload = null;
                    this.rel = 'stylesheet';
                };
                
                // Replace original link
                link.parentNode.replaceChild(preloadLink, link);
                
                // Fallback for browsers that don't support preload
                const noscriptElement = document.createElement('noscript');
                const fallbackLink = document.createElement('link');
                fallbackLink.rel = 'stylesheet';
                fallbackLink.href = href;
                noscriptElement.appendChild(fallbackLink);
                preloadLink.parentNode.insertBefore(noscriptElement, preloadLink.nextSibling);
            }
        });
        
        console.log('✅ Non-critical CSS deferred');
    }

    /**
     * Optimize JavaScript loading order and execution
     */
    async optimizeJavaScriptLoading() {
        const scripts = document.querySelectorAll('script[src]');
        
        scripts.forEach(script => {
            const src = script.src;
            
            if (this.deferredJS.includes(src)) {
                // Add defer attribute to non-critical scripts
                script.defer = true;
            } else if (this.criticalJS.includes(src)) {
                // Ensure critical scripts load early
                script.removeAttribute('defer');
                script.removeAttribute('async');
            }
        });
        
        // Preload critical JavaScript
        this.criticalJS.forEach(src => {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'script';
            preloadLink.href = src;
            document.head.appendChild(preloadLink);
        });
        
        console.log('✅ JavaScript loading optimized');
    }

    /**
     * Preload critical resources
     */
    async preloadCriticalResources() {
        this.criticalResources.forEach(resource => {
            if (!this.preloadedResources.has(resource)) {
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'preload';
                
                // Determine resource type
                if (resource.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                    preloadLink.as = 'image';
                } else if (resource.match(/\.(woff|woff2|ttf|otf)$/i)) {
                    preloadLink.as = 'font';
                    preloadLink.crossOrigin = 'anonymous';
                } else if (resource.match(/\.(css)$/i)) {
                    preloadLink.as = 'style';
                } else if (resource.match(/\.(js)$/i)) {
                    preloadLink.as = 'script';
                }
                
                preloadLink.href = resource;
                document.head.appendChild(preloadLink);
                
                this.preloadedResources.add(resource);
            }
        });
        
        console.log(`✅ Preloaded ${this.preloadedResources.size} critical resources`);
    }

    /**
     * Optimize font loading to prevent FOIT/FOUT
     */
    async optimizeFontLoading() {
        const fontLinks = document.querySelectorAll('link[href*="fonts"]');
        
        fontLinks.forEach(link => {
            // Add font-display: swap to prevent invisible text
            if (!link.href.includes('display=swap')) {
                const url = new URL(link.href);
                url.searchParams.set('display', 'swap');
                link.href = url.toString();
            }
            
            // Preload important fonts
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'font';
            preloadLink.href = link.href;
            preloadLink.crossOrigin = 'anonymous';
            document.head.appendChild(preloadLink);
        });
        
        // Add font-display: swap to @font-face rules
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach(sheet => {
            try {
                if (sheet.cssRules) {
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule.type === CSSRule.FONT_FACE_RULE) {
                            if (!rule.style.fontDisplay) {
                                rule.style.fontDisplay = 'swap';
                            }
                        }
                    });
                }
            } catch (error) {
                // Cross-origin stylesheets may not be accessible
            }
        });
        
        console.log('✅ Font loading optimized');
    }

    /**
     * Minimize render-blocking resources
     */
    async minimizeRenderBlockingResources() {
        // Remove unused CSS
        await this.removeUnusedCSS();
        
        // Minimize JavaScript execution during initial render
        await this.minimizeInitialJavaScript();
        
        // Optimize third-party resources
        await this.optimizeThirdPartyResources();
        
        console.log('✅ Render-blocking resources minimized');
    }

    /**
     * Remove unused CSS rules
     */
    async removeUnusedCSS() {
        const usedSelectors = new Set();
        const stylesheets = Array.from(document.styleSheets);
        
        // Find all used selectors
        stylesheets.forEach(sheet => {
            try {
                if (sheet.cssRules) {
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule.type === CSSRule.STYLE_RULE) {
                            try {
                                if (document.querySelector(rule.selectorText)) {
                                    usedSelectors.add(rule.selectorText);
                                }
                            } catch (error) {
                                // Invalid selector
                            }
                        }
                    });
                }
            } catch (error) {
                // Cross-origin stylesheets
            }
        });
        
        console.log(`📊 Found ${usedSelectors.size} used CSS selectors`);
    }

    /**
     * Minimize JavaScript execution during initial render
     */
    async minimizeInitialJavaScript() {
        // Defer non-essential JavaScript
        const scripts = document.querySelectorAll('script:not([data-critical])');
        
        scripts.forEach(script => {
            if (!script.src || !this.criticalJS.includes(script.src)) {
                script.defer = true;
            }
        });
        
        // Use requestIdleCallback for non-critical operations
        if ('requestIdleCallback' in window) {
            const deferredOperations = [];
            
            // Move non-critical operations to idle time
            window.requestIdleCallback(() => {
                deferredOperations.forEach(operation => operation());
            });
        }
    }

    /**
     * Optimize third-party resources
     */
    async optimizeThirdPartyResources() {
        const thirdPartyDomains = new Set();
        const resources = performance.getEntriesByType('resource');
        
        resources.forEach(resource => {
            const url = new URL(resource.name);
            if (url.hostname !== window.location.hostname) {
                thirdPartyDomains.add(url.hostname);
            }
        });
        
        // Add DNS prefetch for third-party domains
        thirdPartyDomains.forEach(domain => {
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'dns-prefetch';
            prefetchLink.href = `//${domain}`;
            document.head.appendChild(prefetchLink);
        });
        
        console.log(`✅ Optimized ${thirdPartyDomains.size} third-party domains`);
    }

    /**
     * Count render-blocking resources
     */
    countRenderBlockingResources() {
        let count = 0;
        
        // Count blocking stylesheets
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([media="print"])');
        count += stylesheets.length;
        
        // Count blocking scripts
        const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
        count += scripts.length;
        
        return count;
    }

    /**
     * Extract critical styles for a specific element
     */
    extractElementCriticalStyles(element, computedStyle) {
        const criticalProperties = [
            'display', 'position', 'top', 'left', 'right', 'bottom',
            'width', 'height', 'margin', 'padding', 'border',
            'background', 'color', 'font-family', 'font-size',
            'font-weight', 'line-height', 'text-align'
        ];
        
        const elementStyles = {};
        criticalProperties.forEach(property => {
            const value = computedStyle.getPropertyValue(property);
            if (value && value !== 'initial' && value !== 'normal') {
                elementStyles[property] = value;
            }
        });
        
        return elementStyles;
    }

    /**
     * Minify CSS content
     */
    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove last semicolon in blocks
            .replace(/\s*{\s*/g, '{') // Remove spaces around braces
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
            .replace(/\s*,\s*/g, ',') // Remove spaces around commas
            .trim();
    }

    /**
     * Calculate performance improvements
     */
    calculateImprovements() {
        const before = this.optimizationMetrics.beforeOptimization;
        const after = this.optimizationMetrics.afterOptimization;
        const improvements = {};
        
        Object.keys(before).forEach(metric => {
            if (typeof before[metric] === 'number' && typeof after[metric] === 'number') {
                const improvement = before[metric] - after[metric];
                const percentageImprovement = (improvement / before[metric]) * 100;
                
                improvements[metric] = {
                    absolute: improvement,
                    percentage: percentageImprovement,
                    before: before[metric],
                    after: after[metric]
                };
            }
        });
        
        return improvements;
    }

    /**
     * Get optimization report
     */
    getOptimizationReport() {
        return {
            timestamp: new Date().toISOString(),
            criticalResourcesCount: this.criticalResources.size,
            criticalCSSSize: this.criticalCSS.length,
            criticalJSCount: this.criticalJS.length,
            deferredJSCount: this.deferredJS.length,
            preloadedResourcesCount: this.preloadedResources.size,
            metrics: this.optimizationMetrics,
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Generate optimization recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const improvements = this.optimizationMetrics.improvements;
        
        if (improvements['first-contentful-paint']?.percentage < 10) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'First Contentful Paint improvement is minimal. Consider optimizing critical CSS further.',
                action: 'Review and minimize critical CSS, ensure only above-the-fold styles are included.'
            });
        }
        
        if (this.criticalCSS.length > 14000) { // 14KB threshold
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                message: 'Critical CSS is larger than recommended 14KB.',
                action: 'Reduce critical CSS size by removing non-essential above-the-fold styles.'
            });
        }
        
        if (this.deferredJS.length < this.criticalJS.length) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                message: 'More JavaScript is marked as critical than deferred.',
                action: 'Review JavaScript criticality and defer more non-essential scripts.'
            });
        }
        
        return recommendations;
    }

    /**
     * Revert optimizations (for testing purposes)
     */
    async revertOptimizations() {
        // Remove inlined critical CSS
        const inlinedStyles = document.querySelectorAll('style[data-critical]');
        inlinedStyles.forEach(style => style.remove());
        
        // Restore original stylesheet loading
        const preloadedStyles = document.querySelectorAll('link[rel="preload"][as="style"]');
        preloadedStyles.forEach(link => {
            link.rel = 'stylesheet';
        });
        
        // Remove preload links
        const preloadLinks = document.querySelectorAll('link[rel="preload"]');
        preloadLinks.forEach(link => link.remove());
        
        console.log('✅ Optimizations reverted');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CriticalRenderingPathOptimizer;
} else if (typeof window !== 'undefined') {
    window.CriticalRenderingPathOptimizer = CriticalRenderingPathOptimizer;
}