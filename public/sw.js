const CACHE_NAME = 'jay-repair-v3';
const assetsToCache = [
  '/',
  '/index.html',
  '/tracking.html',
  '/logo.jpeg',
  '/founder.jpeg'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

// Activate Event - Deletes old caches (like jay-repair-v1 and jay-repair-v2)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first, fallback to cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
```[cite: 26]

### Verification

After saving this to `public/sw.js` and pushing/redeploying, open your site in the browser, open DevTools / Web Inspector -> Service Workers (or Storage), and confirm `jay-repair-v3` is active and old caches are cleared.

Ready for the next step or file?