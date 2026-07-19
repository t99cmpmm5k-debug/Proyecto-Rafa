const CACHE="proyecto-rafa-v19-3";
self.addEventListener("install",e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","./index.html"])));
});
self.addEventListener("activate",e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))),
    self.clients.claim()
  ]));
});
self.addEventListener("fetch",e=>{
  if(e.request.mode==="navigate"){
    e.respondWith(fetch(e.request).then(r=>{
      const c=r.clone();
      caches.open(CACHE).then(x=>x.put("./index.html",c));
      return r;
    }).catch(()=>caches.match("./index.html")));
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});