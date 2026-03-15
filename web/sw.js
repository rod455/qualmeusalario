// sw.js — Service Worker para Web Push Notifications
// Deve ficar na RAIZ do site (web/sw.js)

const APP_NAME = 'Quanto Ganha!';

/* ── Recebe push ── */
self.addEventListener('push', event => {
  let payload = { title: APP_NAME, body: 'Você tem uma atualização salarial.', icon: '/icon-192.png', url: '/' };

  if(event.data){
    try { Object.assign(payload, event.data.json()); }
    catch(e){ payload.body = event.data.text(); }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:    payload.body,
      icon:    payload.icon || '/icon-192.png',
      badge:   '/icon-72.png',
      data:    { url: payload.url || '/' },
      vibrate: [200, 100, 200],
      actions: [
        { action:'ver', title:'Ver resultado' },
        { action:'dispensar', title:'Dispensar' },
      ]
    })
  );
});

/* ── Clique na notificação ── */
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  if(event.action === 'dispensar') return;

  event.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(clientList => {
      for(const client of clientList){
        if(client.url.includes(self.location.origin) && 'focus' in client){
          client.navigate(url);
          return client.focus();
        }
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});

/* ── Instalação ── */
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
