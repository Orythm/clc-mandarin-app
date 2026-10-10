const VERSION = 'v30';
const CACHE = `clc-vocab-${VERSION}`;
// Recordings get their own cache that survives version bumps: each file is downloaded the
// first time it is played and then kept for offline use. Bump AUDIO_CACHE only if files change.
const AUDIO_CACHE = 'clc-audio-v1';
const PRECACHE = [
  '/',
  '/lessons.json',
  '/measure-words.json',
  '/grammar.json',
  '/questions.json',
  '/pinyin.json',
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cacheable(response) {
  return response && (response.ok || response.type === 'opaque');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navigations and lesson / measure-word data: network-first so updates show up right away,
  // keep the latest copy in the cache, fall back to it offline.
  const path = new URL(req.url).pathname;
  const isData = path === '/lessons.json' || path === '/measure-words.json' || path === '/grammar.json' || path === '/questions.json' || path === '/pinyin.json' || path === '/audio/index.json';
  if (req.mode === 'navigate' || isData) {
    const key = isData ? path : '/';
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

  // Recordings: cache-only once fetched, never refreshed (they don't change).
  if (path.startsWith('/audio/') && path.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(path).then((cached) => cached || fetch(path).then((response) => {
          if (response.ok && response.status === 200) cache.put(path, response.clone());
          return response;
        }))
      )
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
