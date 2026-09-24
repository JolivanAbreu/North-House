// Service worker mínimo, focado em notificações push reais.
// Não faz cache de assets (o app não precisa funcionar 100% offline,
// só precisa continuar recebendo avisos de novo pedido).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { titulo: 'Novo pedido!', corpo: 'Você tem uma atualização no SGV MEI.' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload não era JSON, mantém os valores padrão
  }

  event.waitUntil(
    self.registration.showNotification(data.titulo, {
      body: data.corpo,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { pedidoId: data.pedidoId },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/admin/pedidos');
      }
    })
  );
});
