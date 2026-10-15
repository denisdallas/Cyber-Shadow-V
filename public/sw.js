// Cyber Hunter: Stealth Assassin - Service Worker
// Versioned cache for seamless offline gameplay and asset updates
const CACHE_NAME = 'cyber-hunter-v1';

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icon.svg',
  '/icon-192.png',
  '/pwa-192x192.png',
  '/icon-512.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,600;0,700;1,700&family=JetBrains+Mono:wght@400;600;800&display=swap'
];

// Install event: Pre-cache core shell, icons, manifest, and fonts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use resilient fetching so a failure on an optional external font doesn't abort SW installation
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const req = new Request(url, { mode: url.startsWith('http') ? 'cors' : 'same-origin' });
            const response = await fetch(req);
            if (response && (response.status === 200 || response.type === 'opaque')) {
              await cache.put(req, response);
            }
          } catch (err) {
            console.warn('[SW] Pre-cache item failed non-critically:', url, err);
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event: purge old caches when a new version is released
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting stale cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Cache-First strategy with Network Fallback & Runtime Caching
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle cross-origin or same-origin requests with Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fallback to Network and cache dynamically
      return fetch(request)
        .then((networkResponse) => {
          // Verify valid response before caching
          if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
            return networkResponse;
          }

          // Cache dynamically for offline re-use (JS, CSS, fonts, audio, images)
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Do not cache chrome-extension or uncacheable schemes
            if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
              cache.put(request, responseToCache);
            }
          });

          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation (HTML), fallback to root index.html
          if (request.mode === 'navigate' || request.destination === 'document') {
            return caches.match('/index.html') || caches.match('/');
          }

          // In offline mode with no cache match, return generic fallback if available
          return new Response('Network offline and asset not in cache', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});

// Listen for message from main app thread (e.g., skip waiting on user action)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
