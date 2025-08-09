const CACHE_NAME = "supp-tracker-cache-v2";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll([
          "/",
          "/index.html",
          "/manifest.json",
          "/icons/icon-192.png",
          "/icons/icon-512.png",
        ])
      )
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
  );
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((networkResponse) => {
        if (request.url.includes("/assets/")) {
          const responseClone = networkResponse.clone();
          event.waitUntil(
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, responseClone))
          );
        }
        return networkResponse;
      });
    })
  );
});
