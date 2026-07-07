import { motion } from "framer-motion";
import { X, Lock } from "lucide-react";
import { useState } from "react";
import { BADGES, type BadgeDef } from "@/lib/badges";
import { useT } from "@/lib/i18n";

export function BadgesModal({
  onClose,
  unlocked,
  xp,
  level,
  streak,
  longest,
  levelTitle,
}: {
  onClose: () => void;
  unlocked: string[];
  xp: number;
  level: number;
  streak: number;
  longest: number;
  levelTitle: string;
}) {
  const { lang, n } = useT();
  const [detail, setDetail] = useState<BadgeDef | null>(null);
  const isUnlocked = (id: string) => unlocked.includes(id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="glass w-full max-w-2xl rounded-3xl p-5 lg:p-6 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[color:var(--aura-fg-muted)]">
              {lang === "fa" ? "پیشرفت" : "Progression"}
            </div>
            <div className="text-lg font-semibold">
              {lang === "fa" ? `سطح ${n(level)} — ${levelTitle}` : `Level ${level} — ${levelTitle}`}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <Stat label={lang === "fa" ? "XP" : "XP"} value={n(xp)} />
          <Stat label={lang === "fa" ? "استریک" : "Streak"} value={`${n(streak)}🔥`} />
          <Stat label={lang === "fa" ? "بلندترین" : "Longest"} value={n(longest)} />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {BADGES.map((b) => {
            const ok = isUnlocked(b.id);
            return (
              <button
                key={b.id}
                onClick={() => setDetail(b)}
                className={`relative aspect-square rounded-2xl p-3 grid place-items-center text-center overflow-hidden transition ${ok ? `bg-gradient-to-br ${b.gradient}` : "bg-white/[0.03] border border-white/[0.06]"}`}
                style={ok ? { boxShadow: "0 8px 30px -10px rgba(0,0,0,0.6)" } : undefined}
              >
                <div className={`text-3xl ${ok ? "" : "grayscale opacity-40"}`}>{b.emoji}</div>
                <div
                  className={`absolute inset-x-1 bottom-1.5 text-[9px] font-medium leading-tight ${ok ? "text-white" : "text-[color:var(--aura-fg-muted)]"}`}
                >
                  {b.name[lang]}
                </div>
                {!ok && (
                  <div className="absolute top-2 end-2">
                    <Lock className="h-3 w-3 text-white/40" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-6"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="glass max-w-sm p-6 rounded-3xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`mx-auto h-24 w-24 rounded-3xl grid place-items-center text-5xl mb-3 ${isUnlocked(detail.id) ? `bg-gradient-to-br ${detail.gradient}` : "bg-white/[0.05] grayscale"}`}
              >
                {detail.emoji}
              </div>
              <div className="text-lg font-semibold">{detail.name[lang]}</div>
              <div className="text-sm text-[color:var(--aura-fg-muted)] mt-1">
                {detail.desc[lang]}
              </div>
              {!isUnlocked(detail.id) && (
                <div className="mt-3 text-[11px] text-[color:var(--aura-fg-muted)] flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" /> {lang === "fa" ? "قفل" : "Locked"}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--aura-fg-muted)]">
        {label}
      </div>
      <div className="text-lg font-semibold mono">{value}</div>
    </div>
  );
}
