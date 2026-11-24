/* Cache core UI files on install, and cache the large prompt shards as they are visited. */
const NAME='prompttantu-v1';
const CORE=['./','index.html','assets/app.css','assets/app.js','assets/icon.svg','manifest.webmanifest','data/meta.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==NAME).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(resp=>{if(resp.ok){const c=resp.clone();caches.open(NAME).then(cache=>cache.put(req,c))}return resp})));
});
