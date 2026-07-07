import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "water" | "cardio" | "log" | "system";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

export type NotificationPreferences = {
  pushEnabled: boolean;
  waterReminders: boolean;
  cardioReminders: boolean;
  dailyLogReminder: boolean;
  dailyLogTime: string; // e.g. "20:00"
};

type State = {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  // Actions
  addNotification: (n: Omit<AppNotification, "id" | "date" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  // Permissions
  requestPushPermission: () => Promise<boolean>;
};

export const useNotifications = create<State>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: {
        pushEnabled: false,
        waterReminders: true,
        cardioReminders: true,
        dailyLogReminder: true,
        dailyLogTime: "20:00",
      },
      addNotification: (n) => {
        const newNotif: AppNotification = {
          ...n,
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          read: false,
        };
        set((s) => ({ notifications: [newNotif, ...s.notifications] }));
      },
      markAsRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllAsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearNotifications: () => set({ notifications: [] }),
      updatePreferences: (prefs) => set((s) => ({ preferences: { ...s.preferences, ...prefs } })),

      requestPushPermission: async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
          return false;
        }
        try {
          const permission = await window.Notification.requestPermission();
          const granted = permission === "granted";
          set((s) => ({ preferences: { ...s.preferences, pushEnabled: granted } }));
          return granted;
        } catch (e) {
          console.error("Failed to request notification permission:", e);
          return false;
        }
      },
    }),
    { name: "aura.notifications.v1" },
  ),
);
