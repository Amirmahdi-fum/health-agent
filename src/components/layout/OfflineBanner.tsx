import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, CheckCircle2 } from "lucide-react";
import { useUI } from "@/stores/ui";
import { flushQueue, queueCount } from "@/lib/offline-queue";
import { toast } from "sonner";

export function OfflineBanner() {
  const lang = useUI((s) => s.lang);
  const [online, setOnline] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(queueCount());
    setOnline(navigator.onLine);
    refresh();
    const onOnline = async () => {
      setOnline(true);
      const n = await flushQueue();
      if (n > 0)
        toast.success(
          lang === "fa" ? `${n} مورد سینک شد` : `Synced ${n} pending log${n > 1 ? "s" : ""}`,
        );
      refresh();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("aura:queue-changed", refresh);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("aura:queue-changed", refresh);
    };
  }, [lang]);

  const show = !online || count > 0;
  const msg = !online
    ? lang === "fa"
      ? "حالت آفلاین - داده‌ها همگام خواهند شد"
      : "Offline Mode — Changes will sync"
    : lang === "fa"
      ? `${count} مورد در صف سینک`
      : `${count} pending — will sync`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-40 flex justify-center pt-[env(safe-area-inset-top,0px)]"
        >
          <div
            className={`mt-2 mx-4 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 backdrop-blur-xl border ${online ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`}
          >
            {online ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            <span>{msg}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
