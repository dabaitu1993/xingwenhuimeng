// 星文绘梦 | 媒体缓存 Service Worker
const CACHE_NAME = 'xwhm-media-v4';
const MEDIA_HOSTS = ['my-website-assets.tos-cn-beijing.volces.com'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async()=>{
    // 简单版本清理：仅保留当前版本
    const keys = await caches.keys();
    await Promise.all(keys.map(k=>{ if(k!==CACHE_NAME) return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isVideo = /\.(mp4|webm|mov)(\?.*)?$/.test(url.pathname);
  const isJson = /\.(json)(\?.*)?$/.test(url.pathname);
  const isImage = /\.(png|jpg|jpeg|webp|gif|avif)(\?.*)?$/.test(url.pathname);
  const isMediaHost = MEDIA_HOSTS.includes(url.hostname);

  // 仅缓存指定媒体域名的视频文件
  if (isVideo && isMediaHost) {
    event.respondWith(cacheFirstRange(req));
    return;
  }
  // 缓存 manifest.json（stale-while-revalidate）
  if (isJson && isMediaHost) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
  // 缓存图片（stale-while-revalidate）
  if (isImage && isMediaHost) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
});

async function cacheFirstRange(request){
  const cache = await caches.open(CACHE_NAME);
  const rangeHeader = request.headers.get('Range');
  const cached = await cache.match(request, {ignoreVary:true});

  if (cached) {
    // 若存在 Range 请求且响应可读，按范围切片返回 206
    if (rangeHeader && cached.type !== 'opaque') {
      const match = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : undefined;
        const buf = await cached.arrayBuffer();
        const total = buf.byteLength;
        const sliceEnd = end !== undefined ? Math.min(end+1, total) : total;
        const sliced = buf.slice(start, sliceEnd);
        const headers = new Headers(cached.headers);
        headers.set('Content-Range', `bytes ${start}-${sliceEnd-1}/${total}`);
        headers.set('Content-Length', String(sliced.byteLength));
        headers.set('Accept-Ranges', 'bytes');
        return new Response(sliced, { status: 206, statusText: 'Partial Content', headers });
      }
    }
    // 无 Range 或不支持切片（opaque），直接返回缓存
    return cached;
  }

  // 首次请求：走网络，并写入缓存（允许 200 或 206）
  const res = await fetch(request);
  try {
    if (res && (res.ok || res.status === 206)) {
      // 存入缓存；若是 206 分片，仍缓存此分片以便后续命中；
      // 后续可扩展：后台拉取完整资源完善缓存。
      cache.put(request, res.clone());
    }
  } catch(e) {
    // 忽略缓存异常，不影响播放
  }
  return res;
}

async function staleWhileRevalidate(request){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then(res=>{
    if(res && res.ok){ cache.put(request, res.clone()); }
    return res;
  }).catch(()=>null);
  return cached || networkPromise || new Response('{}', {status: 200, headers:{'Content-Type':'application/json'}});
}