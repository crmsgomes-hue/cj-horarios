// Service Worker exclusivo da app CJ Horários.
// Nome de cache único para não colidir com o cache de CJ Visitas ou outras apps CJ.
const CACHE_NAME = 'cj-horarios-cache-v8';
const SCOPE = '/cj-horarios/';

const CORE_ASSETS = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('cj-horarios-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Só intercepta pedidos dentro do próprio scope
  if (!event.request.url.includes(SCOPE)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ---- Notificações push (preparado, ainda não ativo) ----
// Só começa a disparar quando tivermos chaves VAPID e um endpoint no
// servidor a enviar pushes. Por agora fica pronto para esse dia.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'CJ Horários', {
      body: data.body || '',
      icon: SCOPE + 'icon-192.png',
      badge: SCOPE + 'icon-192.png',
      data: data.url || SCOPE
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || SCOPE));
});
