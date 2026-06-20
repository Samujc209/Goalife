// ===== Goalife service worker (PWA + OneSignal push, unified) =====
// IMPORTANT: this single file handles BOTH offline caching and push
// notifications. The line below pulls in OneSignal's push handlers so the
// PWA service worker and OneSignal don't fight over the same scope.
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
const CACHE = 'goalife-v5';
self.addEventListener('install', e => {
  self.skipWaiting();
  // Use the REAL scope this worker is running at (e.g. https://user.github.io/Whatever/)
  // instead of a hardcoded folder name — this way it keeps working even if the
  // GitHub repo gets renamed later, no code change needed.
  const base = self.registration.scope;
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([base, base + 'index.html']))
      .catch(err => console.error('SW install cache error:', err))
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
    )
  );
});
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIF') {
    const { delay, title, body, tag } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body, tag, vibrate: [200, 100, 200], renotify: true
      });
    }, delay);
  }
});
