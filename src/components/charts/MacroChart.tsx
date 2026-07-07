import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listLogs } from "@/lib/logs.functions";
import { getProfile } from "@/lib/profile.functions";
import { bmr as calcBmr, tdee as calcTdee, type Activity, type Gender } from "@/lib/calc";
import { useUI } from "@/stores/ui";

export function MacroChart() {
  const lang = useUI((s) => s.lang);
  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  }, []);
  const { data: logs = [] } = useQuery({
    queryKey: ["logs", "food", from],
    queryFn: () => listLogs({ data: { from } }),
  });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const tdeeVal = (() => {
    const b = profile?.biometrics as
      | { weightKg?: number; heightCm?: number; age?: number; gender?: Gender; activity?: Activity }
      | undefined;
    if (!b?.weightKg || !b?.heightCm || !b?.age || !b?.gender) return null;
    return calcTdee(
      calcBmr(b.weightKg, b.heightCm, b.age, b.gender as Gender),
      (b.activity ?? "moderate") as Activity,
    );
  })();

  const data = useMemo(() => {
    const by: Record<string, { date: string; protein: number; carbs: number; fat: number }> = {};
    for (const l of (logs as Array<{
      type: string;
      log_date: string;
      payload?: { protein?: number; carbs?: number; fat?: number };
    }>) || []) {
      if (l.type !== "food") continue;
      const d = l.log_date;
      const p = Number(l.payload?.protein ?? 0);
      const c = Number(l.payload?.carbs ?? 0);
      const f = Number(l.payload?.fat ?? 0);
      if (!by[d]) by[d] = { date: d, protein: 0, carbs: 0, fat: 0 };
      by[d].protein += p * 4;
      by[d].carbs += c * 4;
      by[d].fat += f * 9;
    }
    return Object.values(by).sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  return (
    <div className="glass p-4">
      <h3 className="text-sm font-semibold mb-3">
        {lang === "fa" ? "کالری و درشت‌مغذی‌ها" : "Calories & Macros"}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#0b0c0f",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar
              dataKey="protein"
              stackId="a"
              fill="#5e6ad2"
              name={lang === "fa" ? "پروتئین" : "Protein"}
            />
            <Bar
              dataKey="carbs"
              stackId="a"
              fill="#f59e0b"
              name={lang === "fa" ? "کربوهیدرات" : "Carbs"}
            />
            <Bar dataKey="fat" stackId="a" fill="#ef4444" name={lang === "fa" ? "چربی" : "Fat"} />
            {tdeeVal ? (
              <ReferenceLine
                y={tdeeVal}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: `TDEE ${Math.round(tdeeVal)}`, fill: "#10b981", fontSize: 10 }}
              />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
