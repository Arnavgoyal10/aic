import { useEffect, useState } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { ref, set } from "firebase/database";
import { app, db } from "@/lib/firebase";

const VAPID_KEY = "BJ2DI3Xy8HEfn3HMz3aYWpEpDYYgWx15-kuV4Y4c4bYQF8yeKNJakom8CdIZrDLm4PQmPrCMMQb5jBCObNM78Gg";

export function usePitNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);

    if (Notification.permission === "granted") {
      registerFCMToken();
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        setPermission(p);
        if (p === "granted") registerFCMToken();
      });
    }
  }, []);

  // Handle messages when the tab is open (Firebase routes to onMessage, not SW)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const messaging = getMessaging(app);
    const unsub = onMessage(messaging, (payload) => {
      // LOG E: onMessage fires when the PAGE is in foreground — if you see this
      // while the tab is in background, FCM is wrongly routing to the page instead of SW
      console.log('[PAGE LOG-E] onMessage fired (tab is foreground)', JSON.stringify(payload));
      const title = payload.notification?.title ?? "The Pit 💬";
      const body = payload.notification?.body ?? "";
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, { body, icon: "/bodhi.png", tag: "the-pit" });
      });
    });
    return unsub;
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") registerFCMToken();
  };

  return { permission, requestPermission };
}

async function registerFCMToken() {
  try {
    const sw = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: sw });
    if (!token) return;
    // Use last 20 chars as DB key (tokens contain invalid chars)
    const key = token.slice(-20).replace(/[.#$[\]]/g, "_");
    await set(ref(db, `pit/fcm_tokens/${key}`), { token, ts: Date.now() });
  } catch (err) {
    console.error("[FCM] token registration failed:", err);
  }
}
