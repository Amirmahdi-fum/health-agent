import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/stores/profile";
import { useModules } from "@/stores/modules";
import { useMemo } from "react";

/**
 * Five-axis wellness balance: Cardio, Strength, Nutrition, Sleep, Mind.
 * Reads active modules + profile activity level to plot a lightweight
 * indicator of coverage across pillars.
 */
export function BalanceRadar() {
  const { lang } = useT();
  const profile = useProfile((s) => s.profile);
  const modules = useModules((s) => s.active);

  const data = useMemo(() => {
    const actScore: Record<string, number> = {
      sedentary: 30,
      light: 55,
      moderate: 75,
      very: 90,
      extreme: 100,
    };
    const base = actScore[profile.activity] ?? 50;
    return [
      { axis: lang === "fa" ? "کاردیو" : "Cardio", value: modules.cardio ? base : 20 },
      {
        axis: lang === "fa" ? "قدرت" : "Strength",
        value: modules.strength ? Math.min(100, base + 5) : 20,
      },
      {
        axis: lang === "fa" ? "تغذیه" : "Nutrition",
        value: modules.nutrition ? Math.min(100, base) : 25,
      },
      { axis: lang === "fa" ? "خواب" : "Sleep", value: modules.recovery ? 70 : 40 },
      { axis: lang === "fa" ? "ذهن" : "Mind", value: 65 },
    ];
  }, [profile, modules, lang]);

  return (
    <div className="glass p-4">
      <div className="text-sm font-semibold mb-2">
        {lang === "fa" ? "توازن سلامت" : "Wellness Balance"}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#b4b4be", fontSize: 11 }} />
            <PolarRadiusAxis stroke="rgba(255,255,255,0.05)" tick={false} axisLine={false} />
            <Radar
              name="You"
              dataKey="value"
              stroke="#5e6ad2"
              fill="url(#radarGrad)"
              fillOpacity={0.55}
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#5e6ad2" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
