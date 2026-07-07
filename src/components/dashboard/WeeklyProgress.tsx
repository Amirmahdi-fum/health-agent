import { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "recharts";
import { useProfile } from "@/stores/profile";
import { useLogs } from "@/stores/logs";
import { bmr, tdee } from "@/lib/calc";
import { useT } from "@/lib/i18n";
import { TrendingUp, Flame, Scale, Droplet, Activity } from "lucide-react";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function WeeklyProgress() {
  const [range, setRange] = useState<Range>(7);
  const profile = useProfile((s) => s.profile);
  const localLogs = useLogs((s) => s.logs);
  const { t, lang, n } = useT();

  const tdeeValue = useMemo(() => {
    const bmrV = bmr(profile.weightKg, profile.heightCm, profile.age, profile.gender);
    return tdee(bmrV, profile.activity);
  }, [profile]);

  const stats = useMemo(() => {
    const totalCalories = localLogs.reduce((acc, l) => acc + (l.calories || 0), 0);
    const avgCalories = totalCalories / Math.max(localLogs.length, 1);
    const totalWater = localLogs.reduce((acc, l) => acc + (l.waterMl || 0), 0);
    const totalCardio = localLogs.reduce((acc, l) => acc + (l.cardioMin || 0), 0);

    return { totalCalories, avgCalories, totalWater, totalCardio };
  }, [localLogs]);

  const days = useMemo(() => {
    const map = new Map<
      string,
      { date: string; label: string; weight: number | null; calories: number }
    >();
    for (let i = range - 1; i >= 0; i--) {
      const iso = isoDaysAgo(i);
      const d = new Date(iso);
      map.set(iso, {
        date: iso,
        label: d.toLocaleDateString(lang === "fa" ? "fa-IR-u-nu-latn" : "en-US", {
          month: "short",
          day: "numeric",
        }),
        weight: null,
        calories: 0,
      });
    }
    for (const row of localLogs) {
      const bucket = map.get(row.date);
      if (!bucket) continue;
      if (row.weightKg) bucket.weight = row.weightKg;
      bucket.calories += row.calories || 0;
    }
    return Array.from(map.values());
  }, [localLogs, range, lang]);

  const target = profile.targetWeightKg || null;
  const hasData = localLogs.length > 0;

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 grid place-items-center border border-indigo-500/20">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/50">
              {t("weeklyProgress")}
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">
              {lang === "fa" ? "تحلیل هوشمند پیشرفت" : "Smart progress analytics"}
            </div>
          </div>
        </div>
        <div className="glass flex items-center gap-1 p-1 rounded-xl border border-white/5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                range === r
                  ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {n(r)}D
            </button>
          ))}
        </div>
      </div>

      {!hasData && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <div className="text-xs text-white/40">
            {lang === "fa"
              ? "📊 برای مشاهده نمودارها، اولین لاگ خود را ثبت کنید"
              : "📊 Log your first entry to see progress charts"}
          </div>
        </div>
      )}

      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-2">
          {/* KPI 1 */}
          <div className="glass rounded-xl p-3 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[color:var(--aura-fg-muted)]">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest">
                {lang === "fa" ? "میانگین کالری" : "Avg Calories"}
              </span>
            </div>
            <div className="text-xl font-black text-white mt-1">
              {n(Math.round(stats.avgCalories))}{" "}
              <span className="text-[10px] text-white/30 font-medium">kcal</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="glass rounded-xl p-3 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[color:var(--aura-fg-muted)]">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest">
                {lang === "fa" ? "مجموع کالری" : "Total Calories"}
              </span>
            </div>
            <div className="text-xl font-black text-white mt-1">
              {n(Math.round(stats.totalCalories))}{" "}
              <span className="text-[10px] text-white/30 font-medium">kcal</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="glass rounded-xl p-3 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[color:var(--aura-fg-muted)]">
              <Droplet className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest">
                {lang === "fa" ? "میزان آب" : "Total Water"}
              </span>
            </div>
            <div className="text-xl font-black text-white mt-1">
              {n((stats.totalWater / 1000).toFixed(1))}{" "}
              <span className="text-[10px] text-white/30 font-medium">L</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="glass rounded-xl p-3 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[color:var(--aura-fg-muted)]">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest">
                {lang === "fa" ? "کاردیو" : "Total Cardio"}
              </span>
            </div>
            <div className="text-xl font-black text-white mt-1">
              {n(stats.totalCardio)}{" "}
              <span className="text-[10px] text-white/30 font-medium">min</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Weight trend */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full bg-indigo-400"
                style={{ boxShadow: "0 0 8px #5e6ad2" }}
              />
              <span className="text-sm font-bold text-white">
                {lang === "fa" ? "روند وزن" : "Weight trend"}
              </span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">{profile.weightKg}kg</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={days} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5e6ad2" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#5e6ad2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#666", fontSize: 10 }}
                  stroke="rgba(255,255,255,0.05)"
                />
                <YAxis
                  tick={{ fill: "#666", fontSize: 10 }}
                  domain={["auto", "auto"]}
                  stroke="rgba(255,255,255,0.05)"
                />
                <Tooltip
                  cursor={{ fill: "rgba(94,106,210,0.05)" }}
                  contentStyle={{
                    background: "rgba(11,12,15,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#5e6ad2"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#5e6ad2", strokeWidth: 2, stroke: "#0b0c0f" }}
                  activeDot={{ r: 6, fill: "#fff", stroke: "#5e6ad2", strokeWidth: 2 }}
                  connectNulls
                />
                {target ? (
                  <ReferenceLine
                    y={target}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `${lang === "fa" ? "هدف" : "Target"} ${n(target)}`,
                      fill: "#10b981",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calories vs TDEE */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full bg-emerald-400"
                style={{ boxShadow: "0 0 8px #10b981" }}
              />
              <span className="text-sm font-bold text-white">
                {lang === "fa" ? "کالری در برابر TDEE" : "Calories vs TDEE"}
              </span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">TDEE {n(tdeeValue)}</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={days} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#666", fontSize: 10 }}
                  stroke="rgba(255,255,255,0.05)"
                />
                <YAxis tick={{ fill: "#666", fontSize: 10 }} stroke="rgba(255,255,255,0.05)" />
                <Tooltip
                  cursor={{ fill: "rgba(16,185,129,0.05)" }}
                  contentStyle={{
                    background: "rgba(11,12,15,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}
                />
                <Bar dataKey="calories" fill="url(#calGradient)" radius={[8, 8, 0, 0]} />
                {tdeeValue > 0 ? (
                  <ReferenceLine
                    y={tdeeValue}
                    stroke="#a1a1aa"
                    strokeDasharray="6 4"
                    label={{
                      value: `TDEE ${n(tdeeValue)}`,
                      fill: "#a1a1aa",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
