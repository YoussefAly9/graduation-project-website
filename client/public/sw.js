/* eslint-disable no-restricted-globals */
// FreshMart Service Worker for PWA functionality
const CACHE_NAME = 'freshmart-v3';
const RUNTIME_CACHE = 'freshmart-runtime-v3';
const IMAGE_CACHE = 'freshmart-images-v3';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png'
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      try {
        console.log('[Service Worker] Precaching app shell');
        // Cache each URL individually to better handle errors
        for (const url of PRECACHE_URLS) {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
            console.log('[Service Worker] Cached:', url);
          } catch (err) {
            console.warn('[Service Worker] Failed to cache:', url, err);
          }
        }
        
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      } catch (error) {
        console.error('[Service Worker] Precaching failed:', error);
        throw error;
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API calls (same-origin or cross-origin)
  if (url.pathname.startsWith('/api/') || url.href.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Skip other cross-origin requests (CDNs, external resources, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (request.destination === 'script' || request.destination === 'style') {
    // Critical: Always cache JavaScript and CSS files aggressively
    event.respondWith(cacheFirst(request, CACHE_NAME));
  } else if (request.destination === 'document') {
    // HTML documents: try network first, fall back to cache
    event.respondWith(staleWhileRevalidate(request));
  } else if (request.method === 'GET') {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache First Strategy (for images)
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    // Return a fallback response if needed
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Stale While Revalidate Strategy (for app shell)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.ok) {
      // Clone immediately before doing anything else
      const responseToCache = networkResponse.clone();
      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Network First Strategy (for API calls)
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[Service Worker] Returning cached response');
      return cachedResponse;
    }
    
    // Return a proper offline response that won't break the app
    console.log('[Service Worker] No cache available, returning offline response');
    return new Response(JSON.stringify({ 
      data: [],
      error: 'Offline', 
      message: 'You are currently offline. Using fallback data.',
      offline: true
    }), {
      status: 200, // Changed to 200 so app doesn't think it's an error
      headers: { 
        'Content-Type': 'application/json',
        'X-Offline': 'true'
      }
    });
  }
}

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.payload;
    caches.open(RUNTIME_CACHE).then((cache) => {
      cache.addAll(urlsToCache);
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Background sync for offline orders (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Placeholder for syncing offline orders when connection is restored
  console.log('[Service Worker] Syncing offline orders...');
  // Implementation would retrieve pending orders from IndexedDB and POST to API
}

// Push notification handler (future enhancement)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('FreshMart', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

