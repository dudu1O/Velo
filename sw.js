const C = 'velo-v8';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== C).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
// réseau d'abord (toujours la dernière version si on a du réseau), cache en secours hors ligne
function networkFirst(req, init) {
  return fetch(req, init).then(r => {
    const copy = r.clone();
    caches.open(C).then(c => c.put(req, copy));
    return r;
  }).catch(() => caches.match(req));
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(networkFirst(e.request));
  } else if (u.origin === location.origin) {
    e.respondWith(networkFirst(e.request, { cache: 'no-cache' }));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
