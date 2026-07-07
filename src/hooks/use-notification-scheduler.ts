import { useEffect, useRef } from "react";
import { useNotifications } from "../stores/notifications";
import { useLogs } from "../stores/logs";
import { sendNotification } from "../lib/notifications";
import { useUI } from "../stores/ui";

const DAILY_LOG_SENT_KEY = "ha_daily_log_notif_sent";
const WATER_SENT_KEY = "ha_water_notif_sent";
const CARDIO_SENT_KEY = "ha_cardio_notif_sent";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function wasAlreadySent(prefix: string) {
  try {
    return localStorage.getItem(`${prefix}_${todayKey()}`) === "1";
  } catch {
    return false;
  }
}

function markSent(prefix: string) {
  try {
    localStorage.setItem(`${prefix}_${todayKey()}`, "1");
  } catch {
    /* storage unavailable */
  }
}

export function useNotificationScheduler() {
  const { preferences } = useNotifications();
  const logs = useLogs((s) => s.logs);
  const lang = useUI((s) => s.lang);
  const lastRunRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAndTrigger = async () => {
      const ts = todayKey();

      // Throttle: at most once per 60 seconds
      const now = new Date();
      const minuteBucket = `${ts}-${now.getHours()}-${Math.floor(now.getMinutes() / 5)}`;
      if (lastRunRef.current === minuteBucket) return;
      lastRunRef.current = minuteBucket;

      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      // Parse preference time (default "20:00")
      const [prefHour, prefMin] = preferences.dailyLogTime.split(":").map(Number);

      // 1. Daily Log Reminder — fires once after target time each day
      if (preferences.dailyLogReminder && !wasAlreadySent(DAILY_LOG_SENT_KEY)) {
        if (currentHour > prefHour || (currentHour === prefHour && currentMin >= prefMin)) {
          const hasLogToday = logs.some(
            (l) =>
              l.date === ts &&
              (l.calories > 0 || l.waterMl > 0 || l.cardioMin > 0 || l.studyMin > 0),
          );
          if (!hasLogToday) {
            markSent(DAILY_LOG_SENT_KEY);
            await sendNotification({
              title: lang === "fa" ? "فراموش نکردی؟ 🍏" : "Did you forget? 🍏",
              message:
                lang === "fa"
                  ? "امروز هنوز اطلاعات سلامتی خودت رو ثبت نکردی. بیا لاگ‌های امروزت رو ثبت کنیم!"
                  : "You haven't logged any health stats today. Let's record your logs!",
              type: "log",
            });
          }
        }
      }

      // 2. Water reminder — once in afternoon if water is low
      if (
        preferences.waterReminders &&
        !wasAlreadySent(WATER_SENT_KEY) &&
        currentHour >= 14 &&
        currentHour <= 22
      ) {
        const todayLog = logs.find((l) => l.date === ts);
        const waterLogged = todayLog?.waterMl || 0;
        if (waterLogged < 1000) {
          markSent(WATER_SENT_KEY);
          await sendNotification({
            title: lang === "fa" ? "وقت آب خوردنه! 💧" : "Time to hydrate! 💧",
            message:
              lang === "fa"
                ? `امروز فقط ${waterLogged} میلی‌لیتر آب ثبت کردی. یک لیوان آب بنوش و ثبتش کن!`
                : `You've only logged ${waterLogged}ml of water today. Drink a glass now!`,
            type: "water",
          });
        }
      }

      // 3. Cardio reminder — once in evening if no cardio logged
      if (
        preferences.cardioReminders &&
        !wasAlreadySent(CARDIO_SENT_KEY) &&
        currentHour >= 18 &&
        currentHour <= 22
      ) {
        const todayLog = logs.find((l) => l.date === ts);
        const cardioLogged = todayLog?.cardioMin || 0;
        if (cardioLogged === 0) {
          markSent(CARDIO_SENT_KEY);
          await sendNotification({
            title: lang === "fa" ? "وقت ورزشه! 🏃‍♂️" : "Time to move! 🏃‍♂️",
            message:
              lang === "fa"
                ? "امروز هیچ فعالیت بدنی ثبت نکردی. یه پیاده‌روی کوتاه هم عالیه!"
                : "No cardio logged today. Even a short walk counts!",
            type: "cardio",
          });
        }
      }
    };

    // Run immediately on mount
    checkAndTrigger();

    // Check every 2 minutes
    const interval = setInterval(checkAndTrigger, 2 * 60 * 1000);

    // Also check when user returns to the tab (setInterval is throttled in background)
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        lastRunRef.current = ""; // force re-check
        checkAndTrigger();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [preferences, logs, lang]);
}
