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

// Handle background messages (when tab is not in focus)
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "The Pit 💬";
  const body  = payload.notification?.body  ?? "";
  return self.registration.showNotification(title, {
    body,
    icon: "/bodhi.png",
    tag: "the-pit",
    badge: "/bodhi.png",
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
