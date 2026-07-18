const CACHE="proyecto-rafa-v10";
self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(["./","./index.html"])));
});
self.addEventListener("activate",event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener("fetch",event=>{
  if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put("./index.html",copy));
      return response;
    }).catch(()=>caches.match("./index.html")));
    return;
  }
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});