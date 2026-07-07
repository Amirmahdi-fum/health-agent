import { useMemo } from "react";
import { useProfile } from "@/stores/profile";
import { bmi, bmiCategory, bodyFatUSNavy } from "@/lib/calc";
import { useT } from "@/lib/i18n";

/**
 * Composite Health Score /100 derived from BMI, body fat, activity level,
 * and profile completeness. Purely client-side, reactive to profile edits.
 */
function computeScore(profile: ReturnType<typeof useProfile.getState>["profile"]) {
  let score = 40;
  const b = bmi(profile.weightKg, profile.heightCm);
  const cat = bmiCategory(b);
  if (cat === "normal") score += 25;
  else if (cat === "overweight" || cat === "underweight") score += 12;
  const bf = bodyFatUSNavy({
    gender: profile.gender,
    heightCm: profile.heightCm,
    waistCm: profile.waistCm,
    neckCm: profile.neckCm,
    hipCm: profile.hipCm,
  });
  if (profile.gender === "male") {
    if (bf > 6 && bf < 20) score += 15;
    else if (bf) score += 6;
  } else {
    if (bf > 14 && bf < 28) score += 15;
    else if (bf) score += 6;
  }
  const actMap: Record<string, number> = {
    sedentary: 4,
    light: 8,
    moderate: 14,
    very: 18,
    extreme: 20,
  };
  score += actMap[profile.activity] ?? 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#f43f5e";
}

export function HealthScore({ streak, xp, rank }: { streak: number; xp: number; rank?: string }) {
  const profile = useProfile((s) => s.profile);
  const { t, lang, n } = useT();
  const score = useMemo(() => computeScore(profile), [profile]);
  const color = scoreColor(score);
  const R = 52;
  const C = 2 * Math.PI * R;
  const dash = (score / 100) * C;

  return (
    <div className="glass glow-dual p-5 flex items-center gap-5">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={R}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C - dash}`}
            fill="none"
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transition: "stroke-dasharray 400ms ease-out",
            }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="mono text-3xl font-semibold" style={{ color }}>
              {n(score)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--aura-fg-muted)]">
              /100
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--aura-fg-muted)]">
          {t("healthScore")}
        </div>
        <div className="text-lg font-semibold mt-0.5" style={{ color }}>
          {score >= 80
            ? lang === "fa"
              ? "عالی"
              : "Excellent"
            : score >= 60
              ? lang === "fa"
                ? "خوب"
                : "Good"
              : lang === "fa"
                ? "نیاز به کار"
                : "Needs work"}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Mini label={lang === "fa" ? "استریک" : "Streak"} value={`${n(streak)}🔥`} />
          <Mini label="XP" value={n(xp)} />
          <Mini label={lang === "fa" ? "رتبه" : "Rank"} value={rank ?? "Top 5%"} />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass p-2">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--aura-fg-muted)]">
        {label}
      </div>
      <div className="text-sm font-semibold mono truncate">{value}</div>
    </div>
  );
}
