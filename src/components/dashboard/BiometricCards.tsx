import { useProfile } from "@/stores/profile";
import { useLogs } from "@/stores/logs";
import { bmi, bmiCategory, bmr, tdee, bodyFatUSNavy } from "@/lib/calc";
import { useT } from "@/lib/i18n";
import { TrendingUp, Flame, Activity, Percent, Scale } from "lucide-react";
import { BiometricCard } from "./BiometricCard";
import { useMemo } from "react";

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100,
    h = 32;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--aura-indigo)"
        strokeWidth="1.5"
        style={{ filter: "drop-shadow(0 0 4px var(--aura-indigo-glow))" }}
      />
    </svg>
  );
}

const CAT_COLOR: Record<string, string> = {
  underweight: "#60a5fa",
  normal: "#10b981",
  overweight: "#f59e0b",
  obese: "#ef4444",
};

export function BiometricCards() {
  const profile = useProfile((s) => s.profile);
  const logs = useLogs((s) => s.logs);
  const { t, n } = useT();
  // Reactive, memoized derived metrics — recompute whenever any profile field mutates.
  const { bmiV, cat, bmrV, tdeeV, bfV, weightPts } = useMemo(() => {
    const bmiV = bmi(profile.weightKg, profile.heightCm);
    const bmrV = bmr(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    return {
      bmiV,
      cat: bmiCategory(bmiV),
      bmrV,
      tdeeV: tdee(bmrV, profile.activity),
      bfV: bodyFatUSNavy({
        gender: profile.gender,
        heightCm: profile.heightCm,
        waistCm: profile.waistCm,
        neckCm: profile.neckCm,
        hipCm: profile.hipCm,
      }),
      weightPts: logs.map((l) => l.weightKg ?? profile.weightKg),
    };
  }, [profile, logs]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <BiometricCard
        icon={<Scale className="h-4 w-4" />}
        label={t("weightTrend")}
        value={n(profile.weightKg, 1)}
        unit={t("kg")}
        sub={<Sparkline data={weightPts} />}
        accent="var(--aura-indigo)"
      />
      <BiometricCard
        icon={<TrendingUp className="h-4 w-4" />}
        label={t("bmi")}
        value={n(bmiV, 1)}
        sub={
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider"
            style={{ background: CAT_COLOR[cat] + "20", color: CAT_COLOR[cat] }}
          >
            {t(cat)}
          </span>
        }
        accent={CAT_COLOR[cat]}
      />
      <BiometricCard
        icon={<Flame className="h-4 w-4" />}
        label={t("bmr")}
        value={n(bmrV)}
        unit={t("kcal")}
        accent="#f59e0b"
      />
      <BiometricCard
        icon={<Activity className="h-4 w-4" />}
        label={t("tdee")}
        value={n(tdeeV)}
        unit={t("kcal")}
        accent="var(--aura-emerald)"
      />
      <BiometricCard
        icon={<Percent className="h-4 w-4" />}
        label={t("bodyFat")}
        value={n(bfV, 1)}
        unit="%"
        accent="#a78bfa"
      />
    </div>
  );
}
