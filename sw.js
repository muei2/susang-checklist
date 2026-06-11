// 수상한렌탈 점검 PWA 서비스워커 — 오프라인 캐시
// 앱 파일을 수정하면 CACHE 버전을 올려야 갱신됩니다.
const CACHE = 'susang-check-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      // 아이콘이 아직 없어도 설치가 실패하지 않도록 개별 추가
      return Promise.all(ASSETS.map(function(url) {
        return c.add(url).catch(function() {});
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; })
        .map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  // 노션/웹훅 등 외부 요청은 캐시하지 않고 네트워크로
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      const fetched = fetch(e.request).then(function(res) {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function() { return cached; });
      return cached || fetched;
    })
  );
});
