const CACHE='swing-shell-v3-1';
const SHELL=['./','./index.html','./src/app.js','./src/core.js','./src/seed.js','./src/style.css','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('swing-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.includes('/data/'))return;event.respondWith(fetch(event.request).then(r=>{if(r.ok){const copy=r.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(event.request,copy)));}return r;}).catch(()=>caches.match(event.request).then(r=>r||Response.error())));});
