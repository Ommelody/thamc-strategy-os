const CACHE = 'thamc-strategy-v27';
const ASSETS = ['./', './index.html', './manifest.json', './favicon.svg', './icon-192.png', './icon-512.png', './icon-192-maskable.png', './icon-512-maskable.png', './favicon.png', './favicon-32.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for the HTML shell so edits/deploys show up immediately;
// cache-first for static assets (icons, manifest) as an offline fallback.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const isDocument = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html');
  if (isDocument) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
