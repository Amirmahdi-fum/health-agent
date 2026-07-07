import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listLogs } from "@/lib/logs.functions";
import { getProfile } from "@/lib/profile.functions";
import { useT } from "@/lib/i18n";

const RANGES = [30, 90, 365] as const;

export function WeightChart() {
  const { t, lang } = useT();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }, [days]);
  const { data: logs = [] } = useQuery({
    queryKey: ["logs", "weight", from],
    queryFn: () => listLogs({ data: { from } }),
  });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const target = (profile?.biometrics as { targetWeight?: number } | null)?.targetWeight ?? null;

  const data = useMemo(() => {
    return (logs as Array<{ type: string; log_date: string; payload?: { kg?: number } }>)
      .filter((l) => l.type === "weight" && l.payload?.kg)
      .map((l) => ({ date: l.log_date, kg: Number(l.payload!.kg) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{lang === "fa" ? "روند وزن" : "Weight vs Target"}</h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`text-xs px-2 py-1 rounded-lg ${days === r ? "bg-white/[0.08] text-white" : "text-[color:var(--aura-fg-muted)] hover:bg-white/[0.04]"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                background: "#0b0c0f",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Line type="monotone" dataKey="kg" stroke="#5e6ad2" strokeWidth={2} dot={false} />
            {target ? (
              <ReferenceLine
                y={target}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: `${t("targetWeight")}: ${target}`, fill: "#10b981", fontSize: 10 }}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
