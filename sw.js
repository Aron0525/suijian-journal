const CACHE_NAME = 'suijian-pwa-v20';
const ASSETS = [
  './',
  './index.html',
  './index.htm',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

function cacheResponse(request, response) {
  if (!response || !response.ok || new URL(request.url).origin !== self.location.origin) return response;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  return response;
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Journal and auth API responses must never enter Cache Storage: it is shared
  // by all sessions on this device and is not an account-scoped data store.
  if (url.origin !== self.location.origin) return;
  const appShell = event.request.mode === 'navigate' || /\/(?:index\.html|index\.htm|app\.js|styles\.css|manifest\.webmanifest|icon\.svg|icons\/icon-(?:180|192|512)\.png)$/.test(url.pathname);
  if (appShell) {
    event.respondWith(networkFirst(event.request));
  }
});
