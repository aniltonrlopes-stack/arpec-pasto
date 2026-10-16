const CACHE = 'arpec-pasto-v3-8';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Usa a versão salva no aparelho; quando houver internet, atualiza em segundo plano
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // recebe o arquivo compartilhado pelo WhatsApp ("Compartilhar" → ArPec)
  if (e.request.method === 'POST' && url.pathname.endsWith('/receber')) {
    e.respondWith((async () => {
      try { const fd = await e.request.formData(); const f = fd.get('arquivo');
        if (f) { const c = await caches.open('arpec-share'); await c.put(new URL('share-file', self.registration.scope).href, new Response(f)); } } catch (err) {}
      return Response.redirect(new URL('index.html?recebido=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});
