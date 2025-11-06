// Service Worker for POS System PWA
// This enables offline functionality and app-like experience

const CACHE_NAME = 'pos-system-v1';
const urlsToCache = [
  './',
  './index.html',
  './pos-app.js',
  './supabase-config.js',
  './manifest.json'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Supabase API calls (always use network)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  // Skip chrome-extension and other unsupported schemes
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.startsWith('moz-extension://') ||
      event.request.url.startsWith('safari-extension://')) {
    return;
  }

  // Skip localhost:3000 requests (OAuth redirect mismatch - let browser handle)
  if (event.request.url.includes('localhost:3000')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Skip caching chrome-extension URLs
            if (event.request.url.startsWith('chrome-extension://') || 
                event.request.url.startsWith('moz-extension://') ||
                event.request.url.startsWith('safari-extension://')) {
              return response;
            }

            // Skip caching localhost:3000
            if (event.request.url.includes('localhost:3000')) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  // Silently fail if caching is not supported for this request
                  console.warn('Service Worker: Could not cache request', event.request.url);
                }
              })
              .catch(() => {
                // Silently fail cache operations
              });

            return response;
          })
          .catch((error) => {
            // If offline and no cache, show offline page if available
            if (event.request.destination === 'document') {
              return caches.match('./index.html').then((cached) => {
                return cached || new Response('Offline', { 
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'text/plain' }
                });
              });
            }
            // Return a proper Response object
            return new Response('Offline', { 
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
      .catch((error) => {
        // If cache match fails, try to fetch from network
        return fetch(event.request).catch(() => {
          // If fetch also fails, return offline response
          if (event.request.destination === 'document') {
            return caches.match('./index.html').then((cached) => {
              return cached || new Response('Offline', { 
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          }
          return new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Background sync for offline actions (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Sync offline data when back online
      console.log('Service Worker: Syncing data...')
    );
  }
});

// Push notifications (optional - for future use)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'pos-notification'
  };

  event.waitUntil(
    self.registration.showNotification('POS System', options)
  );
});

