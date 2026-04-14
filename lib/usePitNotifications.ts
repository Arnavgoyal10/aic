import { useEffect, useRef, useState } from "react";

export function usePitNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    setPermission(Notification.permission);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        swRegRef.current = reg;
      }).catch(() => {});
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
    // Use service worker notification — works even when tab is backgrounded
    if (swRegRef.current) {
      swRegRef.current.showNotification(title, {
        body,
        icon: "/bodhi.png",
        tag: "the-pit",
      });
    } else {
      // Fallback
      new Notification(title, { body, icon: "/bodhi.png", tag: "the-pit" });
    }
  };

  return { permission, requestPermission, notify };
}
