import { useEffect, useRef, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pickAdapter } from "@/lib/sync/health-adapter";
import { latestSync, recordSync } from "@/lib/sync.functions";
import { getProfile, upsertProfile } from "@/lib/profile.functions";
import { useProfile } from "@/stores/profile";
import { useLogs } from "@/stores/logs";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Monitor,
  Smartphone,
  Cloud,
  CloudOff,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  ArrowUpDown,
  LogIn,
} from "lucide-react";

function relTime(dateIso: string | null, lang: "en" | "fa"): string {
  if (!dateIso) return lang === "fa" ? "هرگز سینک نشده" : "Never synced";
  const diff = (Date.now() - new Date(dateIso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang === "fa" ? "fa-IR-u-nu-latn" : "en", {
    numeric: "auto",
  });
  const abs = Math.abs(diff);
  const [v, u]: [number, Intl.RelativeTimeFormatUnit] =
    abs < 60
      ? [-Math.round(diff), "second"]
      : abs < 3600
        ? [-Math.round(diff / 60), "minute"]
        : abs < 86400
          ? [-Math.round(diff / 3600), "hour"]
          : [-Math.round(diff / 86400), "day"];
  return rtf.format(v, u);
}

// Detect current device type
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}

function getDeviceIcon(type: string) {
  if (type === "iOS" || type === "Android") return Smartphone;
  return Monitor;
}

type SyncEntry = {
  source: string;
  synced_at: string;
  metric: string;
};

export function SyncHub() {
  const { t, lang } = useT();
  const { user } = useSession();
  const qc = useQueryClient();
  const profile = useProfile((s) => s.profile);
  const localLogs = useLogs((s) => s.logs);
  const [spinning, setSpinning] = useState(false);
  const [lastStatus, setLastStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const statusTimer = useRef<number | null>(null);

  const deviceType = getDeviceType();
  const DeviceIcon = getDeviceIcon(deviceType);

  // Fetch last sync records
  const { data: syncHistory } = useQuery({
    queryKey: ["sync-latest"],
    queryFn: () => latestSync(),
    enabled: !!user,
  });

  const lastSync = syncHistory?.[0]?.synced_at ?? null;

  // Count unique synced devices
  const connectedDevices = useMemo(() => {
    if (!syncHistory || syncHistory.length === 0) return [];
    const devices: Record<string, string> = {};
    syncHistory.forEach((entry: SyncEntry) => {
      const src = entry.source || "unknown";
      if (!devices[src] || new Date(entry.synced_at) > new Date(devices[src])) {
        devices[src] = entry.synced_at;
      }
    });
    return Object.entries(devices).map(([name, lastSeen]) => ({
      name,
      lastSeen,
    }));
  }, [syncHistory]);

  // Manual full sync mutation
  const fullSyncMutation = useMutation({
    mutationFn: async () => {
      // 1. Push local profile to cloud
      await upsertProfile({ data: profile });

      // 2. Pull cloud profile
      const serverProfile = await getProfile({ data: {} });
      if (serverProfile) {
        const mapped: Partial<typeof profile> = {
          ...(serverProfile.display_name ? { name: serverProfile.display_name } : {}),
          ...(serverProfile.biometrics &&
          typeof serverProfile.biometrics === "object" &&
          !Array.isArray(serverProfile.biometrics)
            ? (serverProfile.biometrics as Partial<typeof profile>)
            : {}),
        };
        useProfile.getState().update(mapped);
      }

      // 3. Push local offline logs
      const entries = useLogs.getState().entries;
      if (entries.length > 0) {
        const res = await import("@/lib/logs.functions").then((m) =>
          m.bulkInsertLogs({
            data: {
              logs: entries.map(({ type, payload, log_date }) => ({
                type,
                payload,
                log_date,
              })),
            },
          })
        );
        if (res?.inserted > 0) {
          useLogs.getState().clearEntries();
        }
      }

      // 4. Sync device health data
      const adapter = pickAdapter();
      const deviceEntries = await adapter.sync();
      await recordSync({ data: { entries: deviceEntries } });

      return { ok: true };
    },
    onSuccess: () => {
      setLastStatus("success");
      qc.invalidateQueries({ queryKey: ["sync-latest"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
      toast.success(lang === "fa" ? "سینک کامل انجام شد ✅" : "Full sync completed ✅");
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = window.setTimeout(() => setLastStatus("idle"), 3000);
    },
    onError: (e: Error) => {
      setLastStatus("error");
      toast.error(lang === "fa" ? `خطا در سینک: ${e.message}` : `Sync error: ${e.message}`);
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = window.setTimeout(() => setLastStatus("idle"), 5000);
    },
  });

  const handleManualSync = async () => {
    setSpinning(true);
    try {
      await fullSyncMutation.mutateAsync();
    } finally {
      setSpinning(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, []);

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
      });
      if (error) toast.error(error.message);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to sign in");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8 space-y-4">
        <CloudOff className="h-12 w-12 mx-auto text-white/20 mb-3" />
        <p className="text-sm text-[color:var(--aura-fg-muted)]">
          {lang === "fa"
            ? "برای استفاده از سینک، ابتدا وارد شوید."
            : "Sign in to enable cloud sync."}
        </p>
        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          <LogIn className="h-4 w-4" />
          {lang === "fa" ? "ورود با گوگل" : "Sign in with Google"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <AnimatePresence>
        {lastStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
          >
            <CheckCircle className="h-4 w-4" />
            {lang === "fa" ? "سینک موفقیت‌آمیز بود" : "Sync completed successfully"}
          </motion.div>
        )}
        {lastStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <Shield className="h-4 w-4" />
            {lang === "fa" ? "سینک با خطا مواجه شد" : "Sync encountered an error"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current device card */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <DeviceIcon className="h-5 w-5 text-indigo-400" />
          <div>
            <div className="text-sm font-semibold text-white">
              {deviceType} — {lang === "fa" ? "دستگاه فعلی" : "Current Device"}
            </div>
            <div className="text-xs text-[color:var(--aura-fg-muted)]">
              {lang === "fa" ? "متصل و فعال" : "Connected & Active"}
            </div>
          </div>
          <div className="ml-auto">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
        {lastSync && (
          <div className="text-xs text-[color:var(--aura-fg-muted)] flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {lang === "fa" ? `آخرین سینک: ${relTime(lastSync, "fa")}` : `Last sync: ${relTime(lastSync, "en")}`}
          </div>
        )}
      </div>

      {/* Connected devices */}
      {connectedDevices.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--aura-fg-muted)] mb-2">
            {lang === "fa" ? "دستگاه‌های متصل" : "Connected Devices"}
          </h4>
          <div className="space-y-2">
            {connectedDevices.map((dev) => {
              const DevIcon = getDeviceIcon(dev.name);
              return (
                <div
                  key={dev.name}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <DevIcon className="h-4 w-4 text-white/40" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{dev.name}</div>
                    <div className="text-xs text-[color:var(--aura-fg-muted)]">
                      {lang === "fa"
                        ? `آخرین فعالیت: ${relTime(dev.lastSeen, "fa")}`
                        : `Last active: ${relTime(dev.lastSeen, "en")}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual sync button */}
      <button
        onClick={handleManualSync}
        disabled={spinning || fullSyncMutation.isPending}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition disabled:opacity-50"
      >
        <motion.span
          animate={{ rotate: spinning ? 360 : 0 }}
          transition={{ duration: 0.9, repeat: spinning ? Infinity : 0, ease: "linear" }}
        >
          <RefreshCw className="h-4 w-4" />
        </motion.span>
        {lang === "fa" ? "سینک دستی" : "Manual Sync"}
      </button>

      {/* Sync info */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold text-white">
            {lang === "fa" ? "وضعیت سینک خودکار" : "Auto-Sync Status"}
          </span>
        </div>
        <div className="text-xs text-[color:var(--aura-fg-muted)] space-y-1">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3 w-3" />
            {lang === "fa"
              ? "هر ۴۵ تا ۶۰ ثانیه به صورت خودکار اجرا می‌شود"
              : "Runs automatically every 45-60 seconds"}
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            {lang === "fa"
              ? "هنگام تایپ، چت یا تغییر تنظیمات متوقف می‌شود"
              : "Paused during typing, chatting, or editing settings"}
          </div>
        </div>
      </div>
    </div>
  );
}
