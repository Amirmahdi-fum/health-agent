import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function BiometricCard({
  icon,
  label,
  value,
  unit,
  sub,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  sub?: ReactNode;
  accent?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="relative overflow-hidden glass rounded-3xl p-5 border border-white/5 shadow-lg flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:border-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
      style={{
        background: "rgba(10, 11, 15, 0.45)",
      }}
    >
      {/* Decorative Glow Ring behind Icon */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ backgroundColor: accent || "var(--aura-indigo)" }}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-white/50 tracking-wider uppercase truncate">
          {label}
        </span>
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center border transition-colors duration-300"
          style={{
            borderColor: accent ? `${accent}20` : "rgba(255,255,255,0.05)",
            background: accent ? `${accent}10` : "rgba(255,255,255,0.02)",
            color: accent || "var(--aura-indigo)",
          }}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-extrabold text-white tracking-tight leading-none">
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-white/40">{unit}</span>}
        </div>

        {sub && <div className="text-xs mt-2 pt-2 border-t border-white/5 pb-3">{sub}</div>}
      </div>
    </motion.div>
  );
}
