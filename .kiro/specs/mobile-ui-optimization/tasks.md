# Implementation Plan

- [x] 1. Update viewport configuration and critical CSS foundation




  - Update viewport meta tag in Index.html and index-hybrid.html to prevent zoom and support safe areas
  - Implement dynamic viewport height calculation in JavaScript for accurate vh units
  - Update CSS custom properties in critical.css with mobile-first font scale using clamp()
  - Add touch target size variables (--touch-min, --touch-comfortable, --touch-primary)
  - Implement safe area inset variables for notched devices
  - _Requirements: 1.1, 3.1, 3.7, 6.1, 6.4_

- [x] 2. Create mobile-optimized CSS module







  - Create new css/mobile-optimized.css file with mobile-specific enhancements
  - Implement mobile-first typography system with fluid scaling
  - Add mobile-specific utility classes for spacing and layout
  - Implement touch-friendly focus states with 2px visible indicators
  - Add reduced motion media query support
  - Link the new CSS file in both Index.html and index-hybrid.html
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.5_

- [x] 3. Update button components for touch optimization




  - Update .btn class in components.css with minimum 52px height
  - Implement .btn.brand with 56px height for primary actions
  - Add proper padding (16px horizontal, 14px vertical minimum)
  - Ensure 16px minimum font size for all button text
  - Add 12px minimum gap between adjacent buttons
  - Update icon button styles to 48px × 48px minimum with 24px icons
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

- [x] 4. Update form input components




  - Update .input, .select, .textarea classes with 52px minimum height
  - Set font-size to 16px to prevent iOS auto-zoom
  - Implement 14px vertical and 16px horizontal padding
  - Add enhanced focus states with 3px shadow and brand color border
  - Update placeholder text styling for better visibility
  - _Requirements: 2.1, 3.6, 7.4_

- [x] 5. Update navigation components




  - Update .tabbar height to 60px plus safe area inset
  - Update .tabbtn minimum height to 60px
  - Ensure navigation labels are at least 14px font size
  - Add proper touch spacing between tab buttons
  - Update .appbar height to 56px plus safe area inset
  - _Requirements: 1.5, 2.4, 3.5_

- [x] 6. Optimize product grid and card layouts




  - Update .grid class for single column on mobile (< 480px)
  - Implement 2-column layout for large mobile (480px - 767px)
  - Update .tile/.card minimum height to 120px
  - Set card padding to 16px on all sides
  - Ensure product names use --fs-base (18-20px)
  - Ensure prices use --fs-md (20-22px) with bold weight
  - Add 16px vertical spacing between items
  - _Requirements: 1.2, 1.3, 3.2, 3.3, 3.4, 4.1_

- [x] 7. Update table status cards




  - Update table card minimum height to 140px
  - Set table number font size to --fs-lg (22-26px)
  - Set table status font size to --fs-base (18-20px)
  - Implement 20px padding on all sides
  - Add 12px gap between card elements
  - _Requirements: 1.4, 4.1_

- [x] 8. Implement mobile-optimized modal system




  - Update modal positioning to bottom sheet on mobile (align-items: flex-end)
  - Set modal content to full width with 90vh max-height on mobile
  - Implement 24px border-radius on top corners only for mobile
  - Add 24px padding plus safe area inset at bottom
  - Update close button to 48px × 48px minimum
  - Position close button at top-right with 16px spacing
  - Implement centered modal for tablet and desktop (min-width: 768px)
  - _Requirements: 2.1, 4.4_

- [x] 9. Update search and category components




  - Update search input height to 48px minimum
  - Set search input font size to 16px
  - Update category tab height to 48px minimum
  - Ensure proper touch spacing between category tabs
  - _Requirements: 2.4, 4.5_

- [x] 10. Update order summary and totals display





  - Set order total font size to --fs-xl (24-28px)
  - Ensure line item text is at least --fs-sm (16-18px)
  - Add 16px vertical spacing between order items
  - Update submit/checkout button to 56px height
  - _Requirements: 1.2, 1.3, 4.3_

- [x] 11. Implement responsive breakpoint system





  - Update responsive-layout.css with mobile-first breakpoints
  - Implement styles for < 480px (small mobile)
  - Implement styles for 480px - 767px (large mobile)
  - Implement styles for 768px - 1023px (tablet)
  - Implement styles for >= 1024px (desktop)
  - Add orientation change handling with 300ms transition
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Implement accessibility enhancements




  - Add 2px visible focus indicators to all interactive elements
  - Ensure color contrast ratio of 4.5:1 for all text
  - Add aria-labels to icon-only buttons
  - Ensure all form inputs have associated labels
  - Implement prefers-reduced-motion media query
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 13. Optimize performance for mobile devices




  - Inline critical mobile CSS in HTML head
  - Add CSS containment (contain: layout style) to components
  - Implement will-change for animated elements
  - Add loading="lazy" to images below the fold
  - Optimize CSS selectors for mobile performance
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 14. Update dropdown and select components




  - Update dropdown height to 48px minimum
  - Ensure dropdown options have 48px minimum height
  - Add proper touch spacing between dropdown items
  - Set dropdown font size to 16px
  - _Requirements: 2.1, 4.6_

- [ ] 15. Test and validate on real devices
  - Test on iPhone SE (375px) for smallest screen validation
  - Test on iPhone 14 (390px) for common device validation
  - Test on iPhone 14 Pro Max (430px) for large screen validation
  - Test on Samsung Galaxy S21 (360px) for Android validation
  - Test on iPad Mini (768px) for tablet breakpoint validation
  - Verify all text is readable without zoom
  - Verify all buttons are easily tappable without mis-taps
  - Verify no horizontal scrolling occurs
  - Verify safe areas are respected on notched devices
  - Verify form inputs don't trigger auto-zoom on iOS
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 5.6_
