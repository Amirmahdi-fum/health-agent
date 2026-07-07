import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listLogs, deleteLog } from "@/lib/logs.functions";
import { useLogs } from "@/stores/logs";
import { useSession } from "@/hooks/use-session";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Trash2,
  ShieldAlert,
  Sparkles,
  Scale,
  Apple,
  Footprints,
  Dumbbell,
  HeartPulse,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/logs")({
  component: LogsPage,
});

function LogIcon({ type }: { type: string }) {
  switch (type) {
    case "weight":
      return <Scale className="h-4 w-4 text-pink-400" />;
    case "food":
      return <Apple className="h-4 w-4 text-amber-400" />;
    case "cardio":
      return <Footprints className="h-4 w-4 text-emerald-400" />;
    case "strength":
      return <Dumbbell className="h-4 w-4 text-indigo-400" />;
    case "recovery":
    case "water":
      return <HeartPulse className="h-4 w-4 text-blue-400" />;
    default:
      return <Sparkles className="h-4 w-4 text-purple-400" />;
  }
}

function LogsPage() {
  const { t, lang } = useT();
  const qc = useQueryClient();
  const { user } = useSession();

  // Local entries from persistent Zustand store (always available offline)
  const localEntries = useLogs((s) => s.entries);

  // Fetch remote logs from Supabase only when authenticated
  const {
    data: remoteLogs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["logs"],
    queryFn: () => listLogs(),
    enabled: !!user,
    staleTime: 60_000,
  });

  // When logged-in, merge remote logs on top of local logs for a unified view
  // (remote logs always have id, type, payload, log_date — same shape as LogEntry)
  const logs = user ? (remoteLogs ?? []) : localEntries;

  const delLocal = useLogs((s) => s.removeEntry);

  const del = useMutation({
    mutationFn: (id: string) => {
      if (user) {
        return deleteLog({ data: { id } }); // remote
      } else {
        delLocal(id);
        toast.success(lang === "fa" ? "با موفقیت حذف شد" : "Log deleted");
        return Promise.resolve({ ok: true });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logs"] });
    },
  });

  const getLogTitle = (log: { type: string; payload?: unknown }) => {
    const payload = (log.payload as Record<string, unknown>) ?? {};
    if (log.type === "weight")
      return lang === "fa" ? `ثبت وزن: ${payload.kg} کیلوگرم` : `Weight logged: ${payload.kg} kg`;
    if (log.type === "food")
      return lang === "fa"
        ? `کالری مصرفی: ${payload.kcal} کیلوکالری`
        : `Calories: ${payload.kcal} kcal`;
    if (log.type === "cardio")
      return lang === "fa"
        ? `تمرین هوازی: ${payload.minutes} دقیقه`
        : `Cardio: ${payload.minutes} mins`;
    if (log.type === "water")
      return lang === "fa"
        ? `نوشیدن آب: ${payload.ml} میلی‌لیتر`
        : `Water intake: ${payload.ml} ml`;
    if (log.type === "study")
      return lang === "fa" ? `مطالعه: ${payload.minutes} دقیقه` : `Study: ${payload.minutes} mins`;
    return log.type;
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 grid place-items-center">
          <CalendarDays className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {lang === "fa" ? "تاریخچه فعالیت‌ها" : "Activity Logs"}
          </h1>
          <p className="text-xs text-[color:var(--aura-fg-muted)]">
            {lang === "fa" ? "تمام لاگ‌های ثبت شده سلامتی شما" : "All your health logs"}
          </p>
        </div>
      </header>

      {isLoading && user ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : !logs || logs.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="h-12 w-12 text-[color:var(--aura-fg-muted)] opacity-50" />
          <h3 className="font-semibold text-lg">
            {lang === "fa" ? "داده‌ای پیدا نشد" : "No logs found"}
          </h3>
          <p className="text-xs text-[color:var(--aura-fg-muted)] max-w-sm">
            {lang === "fa"
              ? "اولین لاگ خود را از طریق دکمه + در پایین صفحه ثبت کنید."
              : "Click the + button at the bottom right to start logging."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass glow-dual p-4 rounded-2xl flex items-center justify-between gap-4 border border-white/5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.04] grid place-items-center shrink-0">
                    <LogIcon type={log.type} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{getLogTitle(log)}</h4>
                    <p className="text-[11px] text-[color:var(--aura-fg-muted)]">
                      {new Date(log.log_date).toLocaleDateString(
                        lang === "fa" ? "fa-IR-u-nu-latn" : "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => del.mutate(log.id)}
                  disabled={del.isPending}
                  className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-[color:var(--aura-fg-muted)] grid place-items-center transition shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
