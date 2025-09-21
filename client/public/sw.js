// Gobbly Turkey PWA Service Worker
const CACHE_NAME = 'gobbly-turkey-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Resources to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/sounds/background.mp3',
  '/sounds/hit.mp3', 
  '/sounds/success.mp3',
  '/textures/asphalt.png',
  '/textures/grass.png',
  '/textures/sand.jpg',
  '/textures/sky.png',
  '/textures/wood.jpg',
  '/geometries/heart.gltf',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {cache: 'reload'})));
      })
    ])
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          // Return cached version
          return response;
        }
        
        // Fetch from network and cache if successful
        return fetch(request).then(fetchResponse => {
          // Don't cache non-successful responses or opaque responses
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }
          
          // Clone the response because it's a stream
          const responseToCache = fetchResponse.clone();
          
          caches.open(DYNAMIC_CACHE).then(cache => {
            // Only cache same-origin requests
            if (url.origin === location.origin) {
              cache.put(request, responseToCache);
            }
          });
          
          return fetchResponse;
        }).catch(() => {
          // Network failed, try to return a fallback
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          // For other resources, let them fail gracefully
          return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
  }
});

// Background sync for offline score submissions (future enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-scores') {
    event.waitUntil(
      // Handle offline score syncing when connection is restored
      console.log('[SW] Background sync: scores')
    );
  }
});

// Push notifications (future enhancement for game updates)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      tag: 'game-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification('Gobbly Turkey', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service Worker loaded');