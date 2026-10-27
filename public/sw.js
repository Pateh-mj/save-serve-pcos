// SaveServe service worker: installable PWA with an offline fallback.
// Only public pages and static assets are cached — dashboards and /api responses
// carry personal health data and are never stored on the device.

const CACHE = "saveserve-v1";
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];
const PUBLIC_PAGES = ["/", "/about", "/ussd", "/patients", "/ngos", "/contact", "/login", "/register"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Hashed build assets and icons never change: cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Pages: network-first; offline → cached public page or the offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && PUBLIC_PAGES.includes(url.pathname)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/offline.html")))
    );
  }
});
