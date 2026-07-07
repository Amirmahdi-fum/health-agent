import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useNotifications } from "@/stores/notifications";
import { useUI } from "@/stores/ui";

export function NotificationBell({ side = "top" }: { side?: "top" | "right" | "bottom" | "left" }) {
  const [open, setOpen] = useState(false);
  const lang = useUI((s) => s.lang);
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const dir = lang === "fa" ? "end" : "start";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={lang === "fa" ? "اعلان‌ها" : "Notifications"}
          aria-haspopup="dialog"
          className="relative grid h-8 w-8 place-items-center rounded-xl bg-white/5 transition-colors hover:bg-white/10"
        >
          <Bell className="h-4 w-4 text-white/70" />
          {unreadCount > 0 && (
            <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#07080a]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={dir}
        side={side}
        sideOffset={8}
        className="z-[100] w-80 max-h-[min(70vh,420px)] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#07080a]/95 p-0 shadow-2xl backdrop-blur-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-3">
          <h3 className="text-sm font-semibold">{lang === "fa" ? "اعلان‌ها" : "Notifications"}</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-indigo-400"
                title={lang === "fa" ? "خواندن همه" : "Mark all as read"}
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => clearNotifications()}
                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-red-400"
                title={lang === "fa" ? "پاک کردن همه" : "Clear all"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              title={lang === "fa" ? "بستن" : "Close"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-[color:var(--aura-fg-muted)]">
              <Bell className="h-8 w-8 opacity-20" />
              <p className="text-xs">
                {lang === "fa" ? "هیچ اعلانی وجود ندارد" : "No notifications"}
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`cursor-pointer rounded-xl p-3 transition-colors ${
                  n.read
                    ? "bg-white/[0.02] opacity-60 hover:bg-white/5"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <strong className="text-xs font-semibold break-words">{n.title}</strong>
                  <span className="whitespace-nowrap text-[10px] text-white/40">
                    {new Date(n.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[color:var(--aura-fg-muted)] break-words">
                  {n.message}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
