import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertLog, LOG_TYPES, type LogType } from "@/lib/logs.functions";
import { useLogs } from "@/stores/logs";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export function LogModal({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const [type, setType] = useState<LogType>("water");
  const [value, setValue] = useState("");
  const qc = useQueryClient();
  const { user } = useSession();
  const addEntry = useLogs((s) => s.addEntry);
  const addToday = useLogs((s) => s.addToday);

  const mut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => insertLog({ data: { type, payload } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logs"] });
      toast.success(t("save"));
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!value.trim()) return;
    const num = Number(value);
    const val = !isNaN(num) ? num : value.trim();

    const payload: Record<string, number | string> = {};
    if (type === "weight") payload.kg = val;
    else if (type === "food") payload.kcal = val;
    else if (type === "water") payload.ml = val;
    else if (type === "cardio" || type === "study") payload.minutes = val;
    else if (type === "sleep") payload.hours = val;
    else payload.value = val;

    if (user) {
      // Online: send to Supabase
      mut.mutate(payload);
    } else {
      // Offline/Guest: save locally
      const today = new Date().toISOString().slice(0, 10);
      addEntry({ type, payload, log_date: today });

      // Also update daily aggregate for dashboard widgets
      const patch: Record<string, number> = {};
      if (type === "food") patch.calories = num || 0;
      if (type === "cardio") patch.cardioMin = num || 0;
      if (type === "water") patch.waterMl = num || 0;
      if (type === "study") patch.studyMin = num || 0;
      if (type === "weight") patch.weightKg = (num || undefined) ?? 0;
      if (Object.keys(patch).length > 0) addToday(patch);

      toast.success(t("save"));
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        style={{ zIndex: 110 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="fixed inset-x-4 top-[20%] mx-auto max-w-sm glass p-5 rounded-2xl border border-white/10 shadow-2xl"
        style={{ zIndex: 120, top: "20%" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">New Log</div>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded-full hover:bg-white/[0.06] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {LOG_TYPES.map((lt) => (
              <button
                key={lt}
                onClick={() => setType(lt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition ${
                  type === lt
                    ? "bg-[#5e6ad2]/20 border-[#5e6ad2] border text-[#5e6ad2]"
                    : "bg-white/[0.02] border border-white/[0.06] text-[color:var(--aura-fg-muted)] hover:bg-white/[0.05]"
                }`}
              >
                {lt}
              </button>
            ))}
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--aura-fg-muted)] mb-1">
              Value
            </div>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="e.g. 500, or text..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#10b981]"
            />
          </div>

          <button
            disabled={mut.isPending || !value}
            onClick={submit}
            className="h-10 w-full rounded-xl bg-gradient-to-r from-[#5e6ad2] to-[#10b981] font-medium text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:grayscale transition flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" /> {t("save")}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
