import { Bell, Smartphone, Droplets, HeartPulse, CalendarClock, TestTube2 } from "lucide-react";
import { useNotifications } from "@/stores/notifications";
import { useUI } from "@/stores/ui";
import { sendNotification } from "@/lib/notifications";
import { toast } from "sonner";

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="relative h-6 w-11 rounded-full transition-colors shrink-0"
      style={{ background: enabled ? "rgb(99 102 241)" : "rgba(255,255,255,0.1)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all"
        style={{ [enabled ? "right" : "left"]: "2px" } as React.CSSProperties}
      />
    </button>
  );
}

function Row({
  icon,
  title,
  desc,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/5 grid place-items-center shrink-0 text-indigo-400">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-[color:var(--aura-fg-muted)] mt-0.5">{desc}</div>
        </div>
      </div>
      <Toggle enabled={enabled} onChange={onChange} label={title} />
    </div>
  );
}

export function NotificationSettings() {
  const { preferences, updatePreferences, requestPushPermission } = useNotifications();
  const lang = useUI((s) => s.lang);

  const handlePushToggle = async (v: boolean) => {
    if (v) {
      const granted = await requestPushPermission();
      if (!granted) {
        toast.error(
          lang === "fa"
            ? "دسترسی به نوتیفیکیشن رد شد. لطفاً در مرورگر خود اجازه دهید."
            : "Notification permission denied. Please allow it in your browser settings.",
        );
        return;
      }
      toast.success(
        lang === "fa"
          ? "نوتیفیکیشن خارج‌برنامه‌ای فعال شد!"
          : "External push notifications enabled!",
      );
    } else {
      updatePreferences({ pushEnabled: false });
      toast.success(
        lang === "fa"
          ? "نوتیفیکیشن خارج‌برنامه‌ای غیرفعال شد"
          : "External push notifications disabled",
      );
    }
  };

  const handleTest = async () => {
    await sendNotification({
      title: lang === "fa" ? "تست نوتیفیکیشن 🔔" : "Test Notification 🔔",
      message:
        lang === "fa"
          ? "این یک پیام تست است. سیستم نوتیفیکشن به درستی کار می‌کند!"
          : "This is a test message. The notification system is working perfectly!",
      type: "system",
    });
    toast.success(lang === "fa" ? "نوتیفیکشن تست ارسال شد" : "Test notification sent");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass p-4 rounded-2xl border border-white/5">
        <Row
          icon={<Smartphone className="h-5 w-5" />}
          title={lang === "fa" ? "نوتیفیکیشن خارج‌برنامه‌ای" : "External Push Notifications"}
          desc={
            lang === "fa"
              ? "دریافت اعلان حتی وقتی برنامه باز نیست (نیاز به دسترسی مرورگر)"
              : "Receive alerts even when the app is closed (requires browser permission)"
          }
          enabled={preferences.pushEnabled}
          onChange={handlePushToggle}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold text-[color:var(--aura-fg-muted)] px-1 uppercase tracking-wider">
          {lang === "fa" ? "یادآورهای خودکار" : "Automated Reminders"}
        </h4>
        <Row
          icon={<CalendarClock className="h-5 w-5" />}
          title={lang === "fa" ? "یادآور ثبت لاگ روزانه" : "Daily Log Reminder"}
          desc={
            lang === "fa"
              ? "یادآوری برای ثبت اطلاعات سلامتی روزانه"
              : "Reminder to log your daily health stats"
          }
          enabled={preferences.dailyLogReminder}
          onChange={(v) => updatePreferences({ dailyLogReminder: v })}
        />
        <Row
          icon={<Droplets className="h-5 w-5" />}
          title={lang === "fa" ? "یادآور نوشیدن آب" : "Water Reminder"}
          desc={
            lang === "fa"
              ? "پیشنهاد نوشیدن آب در طول روز"
              : "Suggestions to drink water throughout the day"
          }
          enabled={preferences.waterReminders}
          onChange={(v) => updatePreferences({ waterReminders: v })}
        />
        <Row
          icon={<HeartPulse className="h-5 w-5" />}
          title={lang === "fa" ? "یادآور فعالیت بدنی" : "Cardio Reminder"}
          desc={
            lang === "fa" ? "تشویق به انجام فعالیت کاردیو" : "Encouragement to do cardio activity"
          }
          enabled={preferences.cardioReminders}
          onChange={(v) => updatePreferences({ cardioReminders: v })}
        />
      </div>

      <div className="glass p-4 rounded-2xl border border-white/5">
        <label className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 grid place-items-center shrink-0 text-indigo-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {lang === "fa" ? "زمان یادآور روزانه" : "Daily Reminder Time"}
              </div>
              <div className="text-xs text-[color:var(--aura-fg-muted)] mt-0.5">
                {lang === "fa" ? "ساعت پیش‌فرض برای یادآور لاگ" : "Default time for log reminder"}
              </div>
            </div>
          </div>
          <input
            type="time"
            value={preferences.dailyLogTime}
            onChange={(e) => updatePreferences({ dailyLogTime: e.target.value })}
            className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </label>
      </div>

      <button
        onClick={handleTest}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium text-sm transition-colors"
      >
        <TestTube2 className="h-4 w-4" />
        {lang === "fa" ? "تست سیستم نوتیفیکشن" : "Test Notification System"}
      </button>
    </div>
  );
}
