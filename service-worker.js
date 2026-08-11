const CACHE_NAME = "divyangsathi-final-v7-repair";
self.addEventListener("install", event => { self.skipWaiting(); });
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request, {cache:"no-store"}).catch(() => caches.match(event.request)));
});
