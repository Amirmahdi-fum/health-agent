import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pickAdapter } from "@/lib/sync/health-adapter";
import { latestSync, recordSync } from "@/lib/sync.functions";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

function relTime(dateIso: string | null, lang: "en" | "fa"): string {
  if (!dateIso) return lang === "fa" ? "هنوز سینک نشده" : "Never synced";
  const diff = (Date.now() - new Date(dateIso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang === "fa" ? "fa-IR-u-nu-latn" : "en", { numeric: "auto" });
  const abs = Math.abs(diff);
  const [v, u]: [number, Intl.RelativeTimeFormatUnit] =
    abs < 60
      ? [-Math.round(diff), "second"]
      : abs < 3600
        ? [-Math.round(diff / 60), "minute"]
        : abs < 86400
          ? [-Math.round(diff / 3600), "hour"]
          : [-Math.round(diff / 86400), "day"];
  const rel = rtf.format(v, u);
  return lang === "fa" ? `${rel} سینک شد` : `Synced ${rel}`;
}

export function SyncButton() {
  const { lang } = useT();
  const qc = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const { data } = useQuery({ queryKey: ["sync-latest"], queryFn: () => latestSync() });
  const last = data?.[0]?.synced_at ?? null;

  const mut = useMutation({
    mutationFn: async () => {
      const adapter = pickAdapter();
      const entries = await adapter.sync();
      await recordSync({ data: { entries } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sync-latest"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
      toast.success(lang === "fa" ? "سینک انجام شد" : "Device data synced");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const run = async () => {
    setSpinning(true);
    try {
      await mut.mutateAsync();
    } finally {
      setSpinning(false);
    }
  };

  return (
    <button
      onClick={run}
      disabled={mut.isPending}
      className="glass px-3 py-2 flex items-center gap-2 text-xs hover:bg-white/[0.06] transition"
    >
      <motion.span
        animate={{ rotate: spinning ? 360 : 0 }}
        transition={{ duration: 0.9, repeat: spinning ? Infinity : 0, ease: "linear" }}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </motion.span>
      <span className="text-[color:var(--aura-fg-muted)]">{relTime(last, lang)}</span>
    </button>
  );
}
