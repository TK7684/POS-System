# Delta for App

## ADDED Requirements

### Requirement: Script Ordering
The system MUST load Firebase compat SDK scripts before `firebase-config.js`, and load `pos-app.js` after `firebase-config.js`.

#### Scenario: Correct order
- GIVEN compat SDK scripts are included
- WHEN the page loads
- THEN `firebase-config.js` initializes Firebase and `pos-app.js` can use `window.POS`

### Requirement: Safe DOM Updates
Toast and other DOM updates MUST guard against missing elements and degrade gracefully.

## MODIFIED Requirements

### Requirement: Initialization Stability
- Original: Initialize final optimizations after core systems.
- Updated: Final optimizations MUST be wrapped in try/catch and not block app startup.
