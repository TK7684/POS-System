# App Specification

## Purpose
Client-side POS web app with Firebase backend, PWA support, and modular UI.

## Requirements

### Requirement: App Initialization
The system SHALL initialize critical systems in this order: viewport vars, keyboard handling, routing, theme, sync, PWA, responsive layout, service worker, module loader, quick actions, final optimizations.
The system SHALL attach DOMContentLoaded handler to invoke initialization when the document is ready.

#### Scenario: Document already interactive
- WHEN the page script runs after DOM is ready
- THEN initialization is executed immediately

### Requirement: Firebase Configuration
The system MUST load Firebase compat SDKs before `firebase-config.js`.
`firebase-config.js` MUST initialize `firebase` and expose `window.firebaseDB`, `window.firebaseAuth`, `window.firebaseStorage`, and `window.POS` helpers.

#### Scenario: SDK loaded
- GIVEN compat SDK scripts are present
- WHEN `firebase-config.js` executes
- THEN `window.POS` provides `database`, `auth`, and `functions` helpers

### Requirement: UI Actions
The system SHALL provide modal open/close functions for sale and purchase.
The system SHALL show toast notifications for success, info, and error states.

#### Scenario: Show reports (placeholder)
- WHEN user clicks Reports
- THEN a placeholder toast is shown until the Reports module is implemented

### Requirement: Service Worker Integration
The system SHOULD initialize a service worker manager and respond to online/offline/update events.

### Requirement: Module Loader
The system SHOULD lazy-load modules (`purchase`, `sale`, `menu`, `reports`) via a module loader.
