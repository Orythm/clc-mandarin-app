const VERSION = 'v16';
const CACHE = `clc-vocab-${VERSION}`;
const PRECACHE = [
  '/',
  '/lessons.json',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cacheable(response) {
  return response && (response.ok || response.type === 'opaque');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navigations and lesson data: network-first so updates show up right away,
  // keep the latest copy in the cache, fall back to it offline.
  const isLessons = new URL(req.url).pathname === '/lessons.json';
  if (req.mode === 'navigate' || isLessons) {
    const key = isLessons ? '/lessons.json' : '/';
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (cacheable(response)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(key, copy));
          }
          return response;
        })
        .catch(() => caches.match(key))
    );
    return;
  }

  // Everything else: cache-first, refreshed in the background.
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req)
          .then((response) => {
            if (cacheable(response)) cache.put(req, response.clone());
            return response;
          })
          .catch(() => cached);
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return network;
      })
    )
  );
});
