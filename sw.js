const CACHE = 'churreria-v1';
const ASSETS = [
  '/cerropdv/',
  '/cerropdv/index.html',
  '/cerropdv/manifest.json',
  '/cerropdv/icon-192x192.png',
  '/cerropdv/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Poppins:wght@400;500;600;700&display=swap'
];

// Instalar: cachear assets esenciales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activar: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first para Firebase, cache-first para assets locales
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase y APIs externas → siempre network
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com') && url.pathname.includes('firestore')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Assets locales → cache-first, fallback network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/cerropdv/index.html'));
    })
  );
});
