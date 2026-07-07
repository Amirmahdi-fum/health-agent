import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileBarChart2, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { generateWeeklyReport } from "@/lib/report.functions";
import { useT } from "@/lib/i18n";

export function WeeklyReport() {
  const { lang } = useT();
  const [report, setReport] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => generateWeeklyReport(),
    onSuccess: (data) => setReport(data.report),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="glass p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-[color:var(--aura-fg-muted)]">
            {lang === "fa" ? "تحلیل هفتگی" : "Weekly Analytics"}
          </div>
          <div className="text-lg font-semibold">
            {lang === "fa" ? "گزارش هفتگی عملکرد" : "Weekly Performance Report"}
          </div>
        </div>
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5e6ad2] to-[#10b981] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          {mut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileBarChart2 className="h-4 w-4" />
          )}
          {mut.isPending
            ? lang === "fa"
              ? "در حال تولید…"
              : "Generating…"
            : lang === "fa"
              ? "تولید گزارش"
              : "Generate report"}
        </button>
      </div>
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 prose prose-invert prose-sm max-w-none"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
