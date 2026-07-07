import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { exportAllData, resetAccount } from "@/lib/export.functions";
import { useCoach } from "@/stores/coach";
import { useProfile } from "@/stores/profile";
import { Download, FileDown, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { haptic } from "@/lib/haptics";

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataManagement({ lang }: { lang: "en" | "fa" }) {
  const coach = useCoach();
  const profile = useProfile((s) => s.profile);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<null | "json" | "pdf" | "reset">(null);

  const exportJson = async () => {
    setBusy("json");
    try {
      const server = await exportAllData();
      const bundle = {
        ...server,
        local: {
          profile,
          coach_messages: coach.getMessages(),
          coach_config: { model: coach.model, persona: coach.persona },
        },
      };
      download(
        `health-agent-export-${new Date().toISOString().slice(0, 10)}.json`,
        new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }),
      );
      toast.success(lang === "fa" ? "خروجی JSON آماده شد" : "JSON exported");
    } catch (e: unknown) {
      toast.error((e as Error).message);
      haptic("error");
    } finally {
      setBusy(null);
    }
  };

  const exportPdf = async () => {
    setBusy("pdf");
    try {
      const [{ default: jsPDF }, data] = await Promise.all([import("jspdf"), exportAllData()]);
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const now = new Date().toLocaleDateString();
      doc.setFillColor(7, 8, 10);
      doc.rect(0, 0, 595, 90, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("Health Agent — Fitness Report", 40, 45);
      doc.setFontSize(10);
      doc.setTextColor(160);
      doc.text(`Generated ${now}`, 40, 65);

      let y = 120;
      doc.setTextColor(30);
      doc.setFontSize(14);
      doc.text("Profile", 40, y);
      y += 20;
      doc.setFontSize(10);
      const bio = ((data.profile as Record<string, unknown>)?.biometrics ?? {}) as Record<
        string,
        unknown
      >;
      const lines = [
        `Name: ${(data.profile as Record<string, unknown>)?.display_name ?? "—"}`,
        `Age: ${bio.age ?? "—"}  Gender: ${bio.gender ?? "—"}`,
        `Weight: ${bio.weightKg ?? "—"} kg  Height: ${bio.heightCm ?? "—"} cm`,
        `Target: ${bio.targetWeight ?? "—"} kg  Activity: ${bio.activity ?? "—"}`,
      ];
      lines.forEach((l) => {
        doc.text(l, 40, y);
        y += 14;
      });

      y += 10;
      doc.setFontSize(14);
      doc.text("Last 7 Days", 40, y);
      y += 18;
      doc.setFontSize(10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const weekLogs = ((data.daily_logs ?? []) as unknown[]).filter((l) => {
        const row = l as Record<string, unknown>;
        return new Date((row.log_date as string) || "") >= cutoff;
      });
      const grouped: Record<string, number> = {};
      for (const l of weekLogs) {
        const row = l as Record<string, unknown>;
        const type = row.type as string;
        grouped[type] = (grouped[type] ?? 0) + 1;
      }
      Object.entries(grouped).forEach(([k, v]) => {
        doc.text(`${k}: ${v} entries`, 40, y);
        y += 14;
      });

      y += 10;
      doc.setFontSize(14);
      doc.text("Gamification", 40, y);
      y += 18;
      doc.setFontSize(10);
      const s = (data.user_stats ?? {}) as Record<string, unknown>;
      if (s) {
        doc.text(`Level ${s.level}  ·  ${s.xp} XP`, 40, y);
        y += 14;
        doc.text(`Streak: ${s.current_streak} days (longest ${s.longest_streak})`, 40, y);
        y += 14;
        doc.text(`Badges: ${((s.unlocked_badges as unknown[]) ?? []).length}`, 40, y);
        y += 14;
      }

      y += 10;
      doc.setFontSize(14);
      doc.text("Coach Recommendations", 40, y);
      y += 18;
      doc.setFontSize(9);
      doc.setTextColor(70);
      const lastAssistant = [...coach.getMessages()].reverse().find((m) => m.role === "assistant");
      const rec =
        lastAssistant?.content?.slice(0, 900) ??
        "No recent coach output. Ask your coach for a plan.";
      doc.text(doc.splitTextToSize(rec, 520), 40, y);

      doc.setTextColor(120);
      doc.setFontSize(8);
      doc.text("Health Agent — bilingual AI health companion", 40, 820);
      doc.save(`health-agent-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(lang === "fa" ? "گزارش PDF آماده شد" : "PDF report ready");
    } catch (e: unknown) {
      toast.error((e as Error).message);
      haptic("error");
    } finally {
      setBusy(null);
    }
  };

  const doReset = async () => {
    setBusy("reset");
    try {
      await resetAccount({ data: { confirm } });
      await supabase.auth.signOut();
      toast.success(lang === "fa" ? "حساب پاک شد" : "Account reset");
      navigate({ to: "/settings", replace: true });
    } catch (e: unknown) {
      toast.error((e as Error).message);
      haptic("error");
    } finally {
      setBusy(null);
    }
  };

  const confirmMatch = confirm === "DELETE" || confirm === "حذف";

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold text-[color:var(--aura-fg-muted)] uppercase tracking-wider flex items-center gap-2">
        <Download className="h-3.5 w-3.5" /> {lang === "fa" ? "مدیریت داده‌ها" : "Data Management"}
      </h2>
      <div className="glass p-4 grid gap-3">
        <div className="grid sm:grid-cols-2 gap-2">
          <button
            disabled={busy === "json"}
            onClick={exportJson}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm hover:bg-white/[0.08] disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {lang === "fa" ? "خروجی JSON" : "Export JSON"}
          </button>
          <button
            disabled={busy === "pdf"}
            onClick={exportPdf}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm hover:bg-white/[0.08] disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" /> {lang === "fa" ? "گزارش PDF" : "Export PDF Report"}
          </button>
        </div>
      </div>

      <div className="glass p-4 border border-red-500/20 grid gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-red-300">
              {lang === "fa" ? "بازنشانی حساب" : "Reset Account"}
            </div>
            <div className="text-xs text-[color:var(--aura-fg-muted)] mt-0.5">
              {lang === "fa"
                ? "همه گزارش‌ها، سینک‌ها، دوستان و پیشرفت پاک می‌شوند. عبارت «حذف» را تایپ کنید."
                : "All logs, syncs, friends and progress will be erased. Type DELETE to confirm."}
            </div>
          </div>
        </div>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={lang === "fa" ? "حذف" : "DELETE"}
          className="mono tracking-widest bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500/50"
        />
        <button
          disabled={!confirmMatch || busy === "reset"}
          onClick={doReset}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-4 w-4" />{" "}
          {busy === "reset" ? "…" : lang === "fa" ? "پاک کردن همه" : "Wipe Everything"}
        </button>
      </div>
    </section>
  );
}
