// sw.js — service worker for PWA offline support
const CACHE_VERSION = 'mahjong-v1-20260521';
const STATIC_ASSETS = [
    './',
    './index.html',
    './login.html',
    './session_new.html',
    './players.html',
    './query.html',
    './stats.html',
    './achievements.html',
    './export.html',
    './style.css',
    './utils.js',
    './auth.js',
    './config.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Supabase / 跨域 → network only
    if (url.origin !== location.origin) return;

    // 靜態資源 → cache-first，背景更新
    event.respondWith(
        caches.match(req).then(cached => {
            const networkFetch = fetch(req).then(resp => {
                if (resp && resp.ok) {
                    const clone = resp.clone();
                    caches.open(CACHE_VERSION).then(c => c.put(req, clone));
                }
                return resp;
            }).catch(() => cached);
            return cached || networkFetch;
        })
    );
});
