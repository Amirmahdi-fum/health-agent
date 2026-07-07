import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listLogs } from "@/lib/logs.functions";
import { useUI } from "@/stores/ui";

export function CardioChart() {
  const lang = useUI((s) => s.lang);
  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  }, []);
  const { data: logs = [] } = useQuery({
    queryKey: ["logs", "cardio-stairs", from],
    queryFn: () => listLogs({ data: { from } }),
  });

  const data = useMemo(() => {
    const by: Record<string, { date: string; stairs: number; fasted: number }> = {};
    for (const l of (logs as Array<{
      type: string;
      log_date: string;
      payload?: { stairs?: number; fasted?: boolean; minutes?: number };
    }>) || []) {
      if (l.type !== "cardio") continue;
      const d = l.log_date;
      if (!by[d]) by[d] = { date: d, stairs: 0, fasted: 0 };
      by[d].stairs += Number(l.payload?.stairs ?? 0);
      by[d].fasted += l.payload?.fasted ? Number(l.payload?.minutes ?? 0) : 0;
    }
    return Object.values(by).sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  return (
    <div className="glass p-4">
      <h3 className="text-sm font-semibold mb-3">
        {lang === "fa" ? "پله و کاردیو ناشتا" : "Stair Climbs vs Fasted Cardio"}
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
            <Bar dataKey="stairs" fill="#10b981" name={lang === "fa" ? "پله" : "Stairs"} />
            <Bar
              dataKey="fasted"
              fill="#f59e0b"
              name={lang === "fa" ? "دقیقه ناشتا" : "Fasted min"}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
