# Mobile Performance Optimization Guide

## Overview

This document describes the performance optimizations implemented for the POS system to ensure fast loading and smooth interactions on mobile devices.

## Implemented Optimizations

### 1. Critical CSS Inlining

**What:** Critical above-the-fold CSS is inlined directly in the HTML `<head>` section.

**Why:** Eliminates render-blocking CSS requests for the initial viewport, improving First Contentful Paint (FCP) and Largest Contentful Paint (LCP).

**Implementation:**
- `Index.html`: Critical CSS inlined in `<style>` tag (lines 13-200+)
- `index-hybrid.html`: Critical mobile-first CSS inlined in `<style>` tag
- Non-critical CSS loaded asynchronously after page load

**Files Modified:**
- `Index.html`
- `index-hybrid.html`

### 2. CSS Containment

**What:** CSS `contain` property applied to components to isolate rendering scope.

**Why:** Tells the browser that an element's subtree is independent, allowing for better rendering optimization and preventing layout thrashing.

**Implementation:**
```css
/* Layout, style, and paint containment */
.card, .tile, .kpi, .table-card {
  contain: layout style paint;
}

/* Layout and style containment for app shell */
.appbar, .tabbar {
  contain: layout style paint;
}

main {
  contain: layout style;
}

/* Modal and overlay containment */
.modal, .loading, .toast {
  contain: layout style paint;
}
```

**Benefits:**
- Reduces paint areas
- Improves scrolling performance
- Prevents layout recalculation cascades
- Better frame rates on mobile devices

**Files Modified:**
- `Index.html` (critical CSS)
- `css/critical.css`
- `css/components.css`
- `css/mobile-optimized.css`

### 3. will-change Property

**What:** `will-change` CSS property applied to elements that will be animated.

**Why:** Hints to the browser which properties will change, allowing it to optimize rendering ahead of time.

**Implementation:**
```css
/* Hover states */
.btn:hover, .tile:hover, .table-card:hover {
  will-change: transform;
}

/* Active states */
.btn:active, .tile:active {
  will-change: transform;
}

/* Modal animations */
.modal {
  will-change: opacity;
}

.modal.show .modal-content {
  will-change: transform;
}

/* Loading and toast */
.loading, .toast {
  will-change: opacity;
}

.spinner {
  will-change: transform;
}
```

**Best Practices:**
- Only applied during interaction (hover, active)
- Removed after animation completes
- Not overused (can cause memory issues)

**Files Modified:**
- `Index.html` (critical CSS)
- `css/critical.css`
- `css/components.css`
- `css/mobile-optimized.css`

### 4. Image Lazy Loading

**What:** Images below the fold use `loading="lazy"` attribute.

**Why:** Defers loading of off-screen images until user scrolls near them, reducing initial page load time and bandwidth usage.

**Implementation:**
```html
<!-- For any images added in the future -->
<img src="product.jpg" alt="Product" loading="lazy" decoding="async">
```

**Guidelines for Future Development:**
- Add `loading="lazy"` to all images below the fold
- Add `decoding="async"` for non-critical images
- Use `loading="eager"` only for above-the-fold images
- Always include `width` and `height` attributes to prevent layout shift

**Current Status:**
- No images currently in main HTML files
- Pattern documented for future use
- Test files demonstrate proper implementation

### 5. Optimized CSS Selectors

**What:** Simplified and optimized CSS selectors for faster matching.

**Why:** Complex selectors slow down CSS parsing and style calculation, especially on mobile devices.

**Optimizations Applied:**

**Before:**
```css
/* Complex descendant selectors */
.card .product-name .title span {
  font-size: 18px;
}
```

**After:**
```css
/* Direct class selectors */
.product-name {
  font-size: var(--fs-base);
}
```

**Best Practices:**
- Use class selectors instead of descendant selectors
- Avoid universal selectors (`*`) in complex rules
- Keep selector specificity low
- Use CSS custom properties for reusable values

**Files Modified:**
- `css/components.css`
- `css/mobile-optimized.css`

### 6. Additional Performance Enhancements

#### Content Visibility
```css
/* Optimize long lists */
.order-items, .menu-items, .report-items {
  content-visibility: auto;
}

/* Hide off-screen content */
.hide, [hidden] {
  content-visibility: hidden;
}
```

#### GPU Acceleration
```css
/* Force GPU acceleration for fixed elements */
.appbar, .tabbar, .modal {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}
```

#### Smooth Scrolling
```css
/* Optimize touch scrolling */
main, .modal-body {
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
}
```

#### Font Rendering
```css
body {
  text-rendering: optimizeSpeed;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

## Performance Metrics

### Target Metrics (Mobile)
- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **First Input Delay (FID):** < 100ms
- **Time to Interactive (TTI):** < 3.5s
- **Frame Rate:** ≥ 30fps (target 60fps)

### Testing Tools
1. **Chrome DevTools**
   - Performance tab
   - Lighthouse audit
   - Network throttling (Slow 3G, Fast 3G)

2. **WebPageTest**
   - Mobile 3G profile
   - Real device testing

3. **Chrome Remote Debugging**
   - Test on actual mobile devices
   - Monitor frame rate and paint times

## Mobile-Specific Optimizations

### Small Screens (< 480px)
```css
@media (max-width: 479px) {
  /* Simplified shadows */
  .card, .tile {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  /* Remove backdrop blur */
  .appbar, .tabbar {
    backdrop-filter: none;
    background: var(--card);
  }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Remove will-change */
  * {
    will-change: auto !important;
  }
  
  /* Disable GPU acceleration */
  .appbar, .tabbar, .modal {
    transform: none;
  }
}
```

## Best Practices for Future Development

### 1. Adding New Components
- Apply `contain: layout style paint` to isolated components
- Use `will-change` sparingly and only during interactions
- Test on low-end mobile devices

### 2. Adding Images
```html
<!-- Above the fold -->
<img src="hero.jpg" alt="Hero" loading="eager" width="800" height="600">

<!-- Below the fold -->
<img src="product.jpg" alt="Product" loading="lazy" decoding="async" width="400" height="300">
```

### 3. Adding Animations
```css
/* Good: will-change on interaction */
.button:hover {
  will-change: transform;
  transform: scale(1.05);
}

/* Bad: will-change always on */
.button {
  will-change: transform; /* Don't do this */
}
```

### 4. CSS Selector Guidelines
```css
/* Good: Direct class selector */
.product-card { }

/* Bad: Deep descendant selector */
.container .section .card .product { }

/* Good: BEM naming */
.product-card__title { }

/* Bad: Complex specificity */
div.container > ul > li > a.link { }
```

## Monitoring Performance

### Regular Checks
1. Run Lighthouse audit monthly
2. Test on real devices quarterly
3. Monitor Core Web Vitals in production
4. Check bundle sizes after updates

### Performance Budget
- Critical CSS: < 14KB (inlined)
- Total CSS: < 50KB (gzipped)
- JavaScript: < 100KB (gzipped)
- Images: Use WebP format, < 100KB each
- Total page weight: < 500KB (initial load)

## Troubleshooting

### Issue: Slow Initial Load
**Solution:**
- Check if critical CSS is inlined
- Verify non-critical CSS loads asynchronously
- Reduce critical CSS size if > 14KB

### Issue: Janky Scrolling
**Solution:**
- Check for expensive CSS selectors
- Verify `contain` property on components
- Remove unnecessary `will-change` properties
- Test with Chrome DevTools Performance tab

### Issue: Layout Shifts
**Solution:**
- Add `width` and `height` to images
- Reserve space for dynamic content
- Use `aspect-ratio` CSS property
- Test with Lighthouse CLS metric

### Issue: High Memory Usage
**Solution:**
- Remove excessive `will-change` properties
- Check for memory leaks in JavaScript
- Limit number of animated elements
- Use `content-visibility: auto` for long lists

## References

- [CSS Containment Spec](https://www.w3.org/TR/css-contain-1/)
- [will-change MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [Lazy Loading Images](https://web.dev/lazy-loading-images/)
- [Core Web Vitals](https://web.dev/vitals/)
- [CSS Performance Optimization](https://web.dev/optimize-css/)
