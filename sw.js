/* ─────────────────────────────────────────
   StockSchool Service Worker v2
   GitHub Pages compatible — relative paths
   ───────────────────────────────────────── */

const CACHE = 'stockschool-v2';

const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
];

/* INSTALL */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] cache error:', err))
  );
});

/* ACTIVATE */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* FETCH — cache first, network fallback */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        fetch(event.request.clone()).then(fresh => {
          if (fresh && fresh.status === 200)
            caches.open(CACHE).then(c => c.put(event.request, fresh));
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request.clone()).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        caches.open(CACHE).then(c => {
          try { c.put(event.request, response.clone()); } catch(e) {}
        });
        return response;
      }).catch(() => {
        if (event.request.destination === 'document')
          return caches.match('./index.html');
      });
    })
  );
});
