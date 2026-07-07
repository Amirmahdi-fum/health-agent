import { motion } from "framer-motion";

export function RingWidget({
  value,
  max,
  label,
  unit,
  color = "var(--aura-indigo)",
  size = 120,
}: {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex flex-col items-center gap-3 relative"
      style={{ direction: "ltr" }}
    >
      <div className="relative group" style={{ width: size, height: size }}>
        {/* Glow effect behind */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
          style={{ backgroundColor: color }}
        />

        <svg width={size} height={size} className="-rotate-90 relative z-10 drop-shadow-xl">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={stroke}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: 1.5, ease: "easeOut", type: "spring", bounce: 0.2 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center z-20">
          <div className="flex flex-col items-center leading-none">
            <span className="font-mono text-xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              {Math.round(value)}
            </span>
            <span className="font-mono text-[10px] text-white/30 font-medium tracking-wide">
              / {Math.round(max)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">
          {label}
        </span>
        {unit && (
          <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
}
