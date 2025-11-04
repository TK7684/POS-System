# Change: Fix Initialization and Runtime Errors

## Summary
Resolve page-load syntax errors, broken constructors, and undefined handlers by cleaning Firebase config, separating HTML, and stabilizing initialization.

## Context
- Index reported `Unexpected end of input` due to HTML/markdown embedded in `firebase-config.js`.
- Constructor/runtime errors in optional modules and onclick handlers were triggered by invalid script order and missing functions.
- Potential null access in toast updates when the element is not yet present.

## Goals
- Make `firebase-config.js` valid JS using Firebase compat SDK.
- Move HTML to `index-firebase.html` and enforce correct script order.
- Ensure onclick handlers exist and toast updates are safe.
- Maintain progressive enhancement for optional modules.

## Non-Goals
- Implement full Reports module UI (placeholder only).

## Risks
- Deployed environment caching old assets; mitigate via long-cache headers with file changes or version querystrings as needed.
