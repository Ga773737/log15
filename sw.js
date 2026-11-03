// 15分ログ: オフラインで起動できるよう、アプリ本体をiPhoneに保存しておく
const CACHE = 'log15-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 通信できれば最新版を使い、できない・遅いときは保存済みの版で起動する
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; });
    const timeout = new Promise(r => setTimeout(r, 2500, null));
    try {
      const res = await Promise.race([net, timeout]);
      if (res) return res;
    } catch (_) {}
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' && await cache.match('./index.html'));
    if (hit) { net.catch(() => {}); return hit; }
    return net;
  })());
});
