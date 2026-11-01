const CACHE="agenda-cours-v15";
const FILES=["./","index.html","contenus.js","xlsx.full.min.js","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith("agenda-cours-")&&n!==CACHE).map(n=>caches.delete(n)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin&&!/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))return; /* Google Agenda : jamais mis en cache ici */
  const req=u.origin===location.origin?(e.request.mode==="navigate"?new Request(e.request.url,{cache:"no-cache",credentials:"same-origin"}):new Request(e.request,{cache:"no-cache"})):e.request; /* toujours vérifier auprès de GitHub : pas de version vieille de 10 min */
  e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)));
});
