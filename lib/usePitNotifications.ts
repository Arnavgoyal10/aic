import { useEffect, useState } from "react";

export function usePitNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    setPermission(Notification.permission);

    // Register service worker (needed for showNotification to work in background)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Auto-request if not yet decided
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => setPermission(p));
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
  };

  const notify = (title: string, body: string) => {
    if (Notification.permission !== "granted") return;

    if ("serviceWorker" in navigator) {
      // navigator.serviceWorker.ready resolves once the SW is active —
      // showNotification() via SW works reliably even when the tab is backgrounded
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(title, { body, icon: "/bodhi.png", tag: "the-pit" }))
        .catch(() => {
          // SW failed — fall back to plain Notification
          new Notification(title, { body, icon: "/bodhi.png", tag: "the-pit" });
        });
    } else {
      new Notification(title, { body, icon: "/bodhi.png", tag: "the-pit" });
    }
  };

  return { permission, requestPermission, notify };
}
