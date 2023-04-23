let cacheName = "kbPWA-v2"

self.addEventListener("install", event => {
    console.log("Service worker installed");
});

self.addEventListener("activate", async (event) => {
    console.log("Service worker activated");
    const cacheNames = await caches.keys()
    await Promise.all(
        cacheNames.filter((name) =>  name.startsWith("kb"))
        .map(name => caches.delete(name))
    )
});

self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        let host = self.location.origin
        let body = e.request.url.replace(host, "")
        // Never cache non GET
        if (e.request.method != "GET") {
            //console.log("[Service Worker] Not caching: ", e.request.url)
            return await fetch(e.request)
        }
        // For software use caching
        const cache = await caches.open(cacheName);
        // Use network primarily and cache as backup
        return await fetch(e.request).then((response) => {
            //console.log(`[Service Worker] Caching resource: ${e.request.url}`);
            cache.put(e.request.url, response.clone());
            return response;
        }).catch(() => {
            //console.log(`[Service Worker] Cached resource: ${e.request.url}`);
            return cache.match(e.request.url);
        })
    })());
});
