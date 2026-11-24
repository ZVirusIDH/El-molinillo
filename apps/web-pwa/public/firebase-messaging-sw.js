// firebase-messaging-sw.js
// Service Worker para recepción de notificaciones Push en segundo plano (Web / PWA)
// Diseñado con privacidad por defecto y carga dinámica de credenciales desde IndexedDB.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Abre la base de datos IndexedDB para obtener la configuración dinámica del centro
function obtenerConfiguracionCentro() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MolinilloDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('configuracion')) {
        resolve(null);
        return;
      }
      const transaction = db.transaction(['configuracion'], 'readonly');
      const store = transaction.objectStore('configuracion');
      const getReq = store.get('firebaseConfig');

      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('configuracion')) {
        db.createObjectStore('configuracion');
      }
    };
  });
}

// Inicialización diferida del Messaging cuando se recibe una notificación
self.addEventListener('push', (event) => {
  event.waitUntil(
    obtenerConfiguracionCentro().then((config) => {
      if (!config) {
        console.warn('[SW] No se encontró configuración de Firebase en IndexedDB');
        return;
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }

      // Procesar payload seguro de notificación
      let data = {};
      try {
        data = event.data ? event.data.json() : {};
      } catch (e) {
        data = { notification: { title: 'Nuevo aviso escolar', body: event.data.text() } };
      }

      const notif = data.notification || {};
      const payloadData = data.data || {};

      const title = notif.title || 'Aviso Escolar - Molinillo';
      const options = {
        body: notif.body || 'Tienes una nueva comunicación en el centro escolar.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: payloadData,
        vibrate: [200, 100, 200],
        tag: payloadData.tag || 'molinillo-notif',
        renotify: true,
      };

      return self.registration.showNotification(title, options);
    })
  );
});

// Al pulsar sobre la notificación, abre la aplicación en la pantalla correspondiente
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
