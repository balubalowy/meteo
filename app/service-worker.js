const CACHE_NAME = 'meteo-cache-v1';
const urlsToCache = [
  '/meteo/app/',
  '/meteo/app/index.html',
  '/meteo/app/css/style.css',
  '/meteo/app/js/app.js',
  '/meteo/app/js/clouds-data.js'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch (Network first, fallback to cache for data freshness, but cache-first for static assets is typical. We'll do network-first for meteo to get fresh data)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Activate (cleanup old caches)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
