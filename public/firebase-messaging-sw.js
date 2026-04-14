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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "The Pit 💬";
  const body  = payload.notification?.body  ?? "";

  // Show notification pinned (requireInteraction), then auto-dismiss after 10s
  const showPromise = self.registration.showNotification(title, {
    body,
    icon: "/bodhi.png",
    tag: "the-pit",
    badge: "/bodhi.png",
    requireInteraction: true,
  });

  const closePromise = new Promise((resolve) => {
    setTimeout(() => {
      self.registration.getNotifications({ tag: "the-pit" })
        .then((notifs) => { notifs.forEach((n) => n.close()); })
        .finally(resolve);
    }, 10000);
  });

  // waitUntil both so SW stays alive for the full 10s
  return Promise.all([showPromise, closePromise]);
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
