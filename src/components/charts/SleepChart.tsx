import {
  ComposedChart,
  Line,
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

export function SleepChart() {
  const lang = useUI((s) => s.lang);
  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  }, []);
  const { data: logs = [] } = useQuery({
    queryKey: ["logs", "sleep-stress", from],
    queryFn: () => listLogs({ data: { from } }),
  });

  const data = useMemo(() => {
    const by: Record<string, { date: string; hours: number; stress: number }> = {};
    for (const l of (logs as Array<{
      type: string;
      log_date: string;
      payload?: { hours?: number; level?: number };
    }>) || []) {
      if (!by[l.log_date]) by[l.log_date] = { date: l.log_date, hours: 0, stress: 0 };
      if (l.type === "sleep") by[l.log_date].hours = Number(l.payload?.hours ?? 0);
      if (l.type === "stress") by[l.log_date].stress = Number(l.payload?.level ?? 0);
    }
    return Object.values(by).sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  return (
    <div className="glass p-4">
      <h3 className="text-sm font-semibold mb-3">
        {lang === "fa" ? "خواب و استرس" : "Sleep vs Stress"}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis yAxisId="l" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis
              yAxisId="r"
              orientation="right"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              domain={[0, 10]}
            />
            <Tooltip
              contentStyle={{
                background: "#0b0c0f",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar
              yAxisId="l"
              dataKey="hours"
              fill="#5e6ad2"
              name={lang === "fa" ? "ساعات خواب" : "Sleep hrs"}
            />
            <Line
              yAxisId="r"
              type="monotone"
              dataKey="stress"
              stroke="#ef4444"
              strokeWidth={2}
              name={lang === "fa" ? "استرس" : "Stress"}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
