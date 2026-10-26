// sw.js - Service Worker para Dóbida Aprende (100% Offline PWA)
const CACHE_NAME = 'dobida-aprende-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './dialogues.json',
  './dictionary.json',
  './verbs_grammar.json',
  './native_lexicon.json',
  './lesson1.json',
  './lesson1_karaoke.json',
  './track2_audio.mp3',
  './sample_t3.mp3',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

// Install Event - Pre-cache core files
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets for offline usage...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Some external resources could not be cached immediately:', err);
      });
    })
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First with Network Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Handle Range Requests for Audio if needed
  if (req.headers.has('range')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedRes = await cache.match(req.url);
        if (cachedRes) {
          // Serve from cache or fetch network
          return fetch(req).catch(() => cachedRes);
        }
        return fetch(req);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req).then((networkResponse) => {
        // Cache newly requested local or CDN resources
        if (networkResponse && networkResponse.status === 200 && (req.url.startsWith(self.location.origin) || req.url.includes('cdn') || req.url.includes('lucide'))) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for html pages
        if (req.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
