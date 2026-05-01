/**
 * Service worker for Sleep Diaries PWA.
 * Strategy: cache-first for assets, network-first for navigation.
 * This allows the app to work offline after first load.
 */
const CACHE = 'sleep-diaries-v2';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: precache core shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for assets, network-first for HTML navigation
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always fetch HTML from network so app updates are picked up
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for everything else (JS, images, fonts)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        // Only cache successful same-origin responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
