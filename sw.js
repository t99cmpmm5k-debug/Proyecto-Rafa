const CACHE="corredor-solido-v20-9-1-inicio-d";
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","./index.html"]))) });
self.addEventListener("activate",e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener("fetch",e=>{if(e.request.mode==="navigate"){e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return r}).catch(()=>caches.match("./index.html")));return;}e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
