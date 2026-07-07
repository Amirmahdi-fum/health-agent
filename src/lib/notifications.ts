import { useNotifications, type NotificationType } from "../stores/notifications";
import { toast } from "sonner";

export interface SendNotificationOptions {
  title: string;
  message: string;
  type: NotificationType;
  silent?: boolean;
}

export async function sendNotification({
  title,
  message,
  type,
  silent = false,
}: SendNotificationOptions) {
  const { preferences, addNotification } = useNotifications.getState();

  // 1. Internal Notification (always stored unless disabled)
  addNotification({ title, message, type });

  // 2. In-app UI Toast
  if (!silent) {
    toast.info(`${title}`, {
      description: message,
      duration: 5000,
      className:
        "!bg-indigo-500/10 !backdrop-blur-xl !border !border-indigo-500/30 !text-indigo-100 !shadow-[0_10px_40px_rgba(99,102,241,0.25)]",
    });
  }

  // 3. External Browser Notification (Push)
  if (
    preferences.pushEnabled &&
    typeof window !== "undefined" &&
    "Notification" in window &&
    window.Notification.permission === "granted"
  ) {
    // If inside a Service Worker scope, we can show it via the registration (best practice for background)
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body: message,
          icon: "/favicon.svg",
          badge: "/favicon.svg",
          tag: `health-agent-${type}`,
          // @ts-ignore: TS doesn't recognize renotify on standard NotificationOptions but it is standard for SW
          renotify: true,
        });
      } else {
        new window.Notification(title, {
          body: message,
          icon: "/favicon.svg",
        });
      }
    } catch (e) {
      console.warn("ServiceWorker notification failed, falling back:", e);
      try {
        new window.Notification(title, {
          body: message,
          icon: "/favicon.svg",
        });
      } catch (err) {
        console.error("Standard Notification fallback failed:", err);
      }
    }
  }
}
