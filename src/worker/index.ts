/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

// To avoid TypeScript errors about duplicate definitions
export {};

self.addEventListener('push', (event) => {
  console.log('SW: Push Event Received', event);
  const data = event.data?.json() ?? {};
  console.log('SW: Push Data Parsed:', data);
  const title = data.title || 'Notifikasi Baru';
  
  // More robust URL detection (handles nested Laravel data)
  const targetUrl = data.url || (data.data && data.data.url) || data.action_url || '/dashboard';
  
  const options = {
    body: data.body || 'Anda mendapat pesan baru.',
    icon: data.icon || '/images/logo-mp.png',
    badge: '/badge.png',
    data: {
      url: targetUrl
    },
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'open_url',
        title: 'Buka Aplikasi'
      }
    ]
  };


  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('SW: Success showing notification'))
      .catch((err) => console.error('SW: Error showing notification:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return (client as WindowClient).focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
