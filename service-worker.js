const CACHE_NAME = "paper-pro-v3"; // Versiyonu değiştirdik ki eski hafıza silinsin
const ASSETS = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js"
];

self.addEventListener("install", e => {
    self.skipWaiting(); // Yeni versiyonu bekletmeden hemen kur
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", e => {
    // GELİŞTİRİCİ DOSTU STRATEJİ: Önce internetten çekmeyi dene, başarısız olursan (çevrimdışıysan) cache'den ver.
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});


