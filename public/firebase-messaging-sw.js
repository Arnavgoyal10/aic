importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDxEFcbgZgQc-Ufe3AXj_mjevvo20mIe8M",
  authDomain: "aicbodhi.firebaseapp.com",
  databaseURL: "https://aicbodhi-default-rtdb.firebaseio.com",
  projectId: "aicbodhi",
  storageBucket: "aicbodhi.firebasestorage.app",
  messagingSenderId: "611481951987",
  appId: "1:611481951987:web:e86e58ace11032fd992186"
});

const messaging = firebase.messaging();

// LOG A: Did the raw push event reach the SW at all?
self.addEventListener('push', (event) => {
  console.log('[SW LOG-A] Raw push event received', event.data ? event.data.text() : '(no data)');
});

// LOG B: Did Firebase intercept it and call onBackgroundMessage?
messaging.onBackgroundMessage((payload) => {
  console.log('[SW LOG-B] onBackgroundMessage fired', JSON.stringify(payload));
  const title = payload.notification?.title ?? "The Pit 💬";
  const body  = payload.notification?.body  ?? "";
  // LOG C: Are we actually reaching showNotification?
  console.log('[SW LOG-C] Calling showNotification with title:', title, 'body:', body);
  return self.registration.showNotification(title, {
    body,
    icon: "/bodhi.png",
    tag: "the-pit",
    badge: "/bodhi.png",
  }).then(() => {
    // LOG D: Did showNotification resolve successfully?
    console.log('[SW LOG-D] showNotification resolved OK');
  }).catch((err) => {
    console.error('[SW LOG-D] showNotification FAILED', err);
  });
});

// Focus or open the app when notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow("/");
    })
  );
});
