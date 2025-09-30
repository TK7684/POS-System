/**
 * Service Worker for POS System
 * Implements offline-first caching strategies with intelligent resource management
 */

const CACHE_VERSION = 'pos-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Cache strategies per resource type
const CACHE_STRATEGIES = {
  // Static assets - cache first with long expiration
  static: {
    cacheName: STATIC_CACHE,
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  
  // API responses - network first with fallback
  api: {
    cacheName: API_CACHE,
    strategy: 'network-first',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  
  // Dynamic content - stale while revalidate
  dynamic: {
    cacheName: DYNAMIC_CACHE,
    strategy: 'stale-while-revalidate',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 30
  }
};

// Resources to cache immediately on install
const STATIC_RESOURCES = [
  '/',
  '/Index.html',
  '/offline.html',
  '/js/critical.js',
  '/css/critical.css',
  '/css/components.css',
  '/js/core/ModuleLoader.js',
  '/js/core/CSSManager.js',
  '/js/core/ServiceWorkerManager.js',
  '/manifest.json'
];

// API endpoints patterns
const API_PATTERNS = [
  /\/exec\?/,
  /script\.google\.com/,
  /script\.googleusercontent\.com/
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Static resources cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('pos-v') && 
                     !cacheName.includes(CACHE_VERSION);
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
  
  // Notify clients about the update
  notifyClients('sw-updated', { version: CACHE_VERSION });
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine cache strategy based on request
  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch(error => {
        console.error('[SW] Request failed:', request.url, error);
        return getOfflineFallback(request);
      })
  );
});

// Message event - handle commands from main thread
self.addEventListener('message', event => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName)
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch(error => event.ports[0].postMessage({ error: error.message }));
      break;
      
    case 'CACHE_URLS':
      cacheUrls(payload?.urls || [])
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch(error => event.ports[0].postMessage({ error: error.message }));
      break;
  }
});

// Determine appropriate cache strategy for request
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // API requests
  if (API_PATTERNS.some(pattern => pattern.test(request.url))) {
    return CACHE_STRATEGIES.api;
  }
  
  // Static assets (JS, CSS, images)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    return CACHE_STRATEGIES.static;
  }
  
  // HTML pages and other dynamic content
  return CACHE_STRATEGIES.dynamic;
}

// Handle request based on strategy
async function handleRequest(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  
  switch (strategy.strategy) {
    case 'cache-first':
      return cacheFirst(request, cache, strategy);
      
    case 'network-first':
      return networkFirst(request, cache, strategy);
      
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, cache, strategy);
      
    default:
      return fetch(request);
  }
}

// Cache-first strategy
async function cacheFirst(request, cache, strategy) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      await cleanupCache(cache, strategy.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    // Return stale cache if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cache, strategy) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      await cleanupCache(cache, strategy.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Notify about offline mode
      notifyClients('offline-mode', { url: request.url });
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cache, strategy) {
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network in background
  const networkPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        const responseToCache = networkResponse.clone();
        cache.put(request, responseToCache);
        cleanupCache(cache, strategy.maxEntries);
      }
      return networkResponse;
    })
    .catch(error => {
      console.log('[SW] Background fetch failed:', request.url, error);
    });
  
  // Return cached response immediately if available and not expired
  if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
    return cachedResponse;
  }
  
  // Wait for network response if no cache or expired
  return networkPromise || cachedResponse || fetch(request);
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  if (!maxAge) return false;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  
  return (now - responseTime) > maxAge;
}

// Clean up cache to maintain size limits
async function cleanupCache(cache, maxEntries) {
  if (!maxEntries) return;
  
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // Remove oldest entries (simple FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
    
    console.log(`[SW] Cleaned up ${keysToDelete.length} cache entries`);
  }
}

// Get offline fallback response
function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For HTML requests, return offline page or cached main page
  if (request.headers.get('accept')?.includes('text/html')) {
    // If requesting main page, try to return it from cache
    if (url.pathname === '/' || url.pathname === '/Index.html') {
      return caches.match('/Index.html') || caches.match('/');
    }
    
    // For other HTML requests, return offline page
    return caches.match('/offline.html');
  }
  
  // For API requests, return offline indicator
  if (API_PATTERNS.some(pattern => pattern.test(request.url))) {
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
        timestamp: Date.now()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  // For other resources, return network error
  return new Response('', { 
    status: 408, 
    statusText: 'Request Timeout' 
  });
}

// Notify all clients about events
function notifyClients(type, payload) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type, payload });
    });
  });
}

// Clear specific cache or all caches
async function clearCache(cacheName) {
  if (cacheName) {
    return caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    return Promise.all(
      cacheNames
        .filter(name => name.startsWith('pos-v'))
        .map(name => caches.delete(name))
    );
  }
}

// Cache specific URLs
async function cacheUrls(urls) {
  const cache = await caches.open(STATIC_CACHE);
  return cache.addAll(urls);
}

// Push notification event
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'POS ร้านกุ้งแซ่บ',
    body: 'คุณมีการแจ้งเตือนใหม่',
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [200, 100, 200],
    data: {}
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      requireInteraction: notificationData.requireInteraction || false,
      tag: notificationData.tag || 'pos-notification',
      data: notificationData.data
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const { data } = event.notification;
  const action = data?.action || 'open-app';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.postMessage({
              type: 'notification-click',
              payload: { action, data }
            });
            return;
          }
        }
        
        // Open new window if no existing window found
        return clients.openWindow('/').then(client => {
          if (client) {
            client.postMessage({
              type: 'notification-click',
              payload: { action, data }
            });
          }
        });
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Notify clients about notification close
  notifyClients('notification-close', {
    tag: event.notification.tag,
    data: event.notification.data
  });
});

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'pos-data-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    // Notify clients to start sync process
    notifyClients('sync-start', {});
    
    // The actual sync logic will be handled by the main application
    // This just triggers the sync process
    
    console.log('[SW] Offline data sync completed');
    notifyClients('sync-complete', {});
  } catch (error) {
    console.error('[SW] Offline data sync failed:', error);
    notifyClients('sync-failed', { error: error.message });
  }
}

console.log('[SW] Service worker script loaded, version:', CACHE_VERSION);