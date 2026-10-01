/* Safar Curated — lightweight PWA service worker.
   Goals: make the installed app feel native (instant repeat loads + offline
   fallback) WITHOUT ever caching dynamic/auth/booking data.
   SAFE BY DESIGN:
     - /api/* is NEVER intercepted (always live network → bookings, auth,
       payments always fresh).
     - Navigations use network-first (never serve stale HTML); cache is only a
       fallback when the device is offline.
     - Only same-origin static assets (_next/static, icons, fonts, images) are
       cached stale-while-revalidate. */

const VERSION = 'safar-v2';
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => cache.add(OFFLINE_URL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/icon') ||
    url.pathname.startsWith('/apple-icon') ||
    /\.(?:js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|webp|avif|ico)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only.
  if (url.origin !== self.location.origin) return;

  // NEVER touch API / auth / dynamic data — always live network.
  if (url.pathname.startsWith('/api')) return;

  // App navigations: network-first, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(PAGES_CACHE);
          cache.put(request, fresh.clone()).catch(() => {});
          return fresh;
        } catch (e) {
          const cache = await caches.open(PAGES_CACHE);
          const cached = (await cache.match(request)) || (await cache.match(OFFLINE_URL));
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets: stale-while-revalidate for instant repeat loads.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })()
    );
  }
});
