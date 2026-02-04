const CACHE_NAME = 'poa-app-v2';
const OFFLINE_URL = '/offline.html';

// App shell to precache on install
const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ──────────────────────────────────────────────
// Install: precache app shell
// ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ──────────────────────────────────────────────
// Activate: clean old caches, claim clients
// ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ──────────────────────────────────────────────
// Fetch handler
//
// IMPORTANT: Navigation responses (HTML) are NEVER cached because this is
// a login-based app. Caching HTML would risk serving a stale authenticated
// page after logout, which is a security issue.
//
// Only truly static assets (images, CSS, JS, fonts) are cached using
// stale-while-revalidate for fast repeat loads.
// ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip API calls and Next.js data requests (carry auth state)
  if (request.url.includes('/api/') || request.url.includes('/_next/data/')) return;

  // Navigation requests: always go to network, only show offline page if network fails
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets (images, CSS, JS, fonts): stale-while-revalidate
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });

        // Return cached version instantly if available, update cache in background
        return cached || networkFetch;
      })
    );
    return;
  }
});

// ──────────────────────────────────────────────
// Push notifications
// ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'POA Benachrichtigung';
  const options = {
    body: data.body || 'Sie haben eine neue Benachrichtigung.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'poa-notification',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ──────────────────────────────────────────────
// Notification click: open the app
// ──────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if available
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise open a new window
        return clients.openWindow(urlToOpen);
      })
  );
});

// ──────────────────────────────────────────────
// Background sync
// ──────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'poa-background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

// ──────────────────────────────────────────────
// Periodic background sync
// ──────────────────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'poa-periodic-sync') {
    event.waitUntil(Promise.resolve());
  }
});
