const CACHE_NAME = 'neo-tasks-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './image_bd669a.png'
];

// Install event: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network falling back to cache strategy
self.addEventListener('fetch', event => {
  // Don't cache API requests (like Cloudflare or Vercel sync endpoints)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      // Cache the fetched response (like tailwind or fonts) for future offline use
      if (response && response.status === 200 && response.type === 'basic') {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
      }
      return response;
    }).catch(() => {
      // If the network fails (offline), return from cache
      return caches.match(event.request);
    })
  );
});
