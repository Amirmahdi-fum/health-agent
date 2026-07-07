import { useMemo } from "react";
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { useLogs } from "@/stores/logs";
import { useT } from "@/lib/i18n";

export function GoalDistributionChart() {
  const { logs, goals, getToday } = useLogs();
  const { lang, n } = useT();

  const data = useMemo(() => {
    const today = getToday();

    const calcPerc = (val: number, goal: number) =>
      Math.min(100, Math.max(0, goal > 0 ? (val / goal) * 100 : 0));

    return [
      {
        name: lang === "fa" ? "مطالعه" : "Study",
        value: calcPerc(today.studyMin, goals.studyMin),
        fill: "#f43f5e", // Rose
        actual: today.studyMin,
        goal: goals.studyMin,
        unit: "Min",
      },
      {
        name: lang === "fa" ? "آب" : "Water",
        value: calcPerc(today.waterMl, goals.waterMl),
        fill: "#0ea5e9", // Sky Blue
        actual: today.waterMl,
        goal: goals.waterMl,
        unit: "ml",
      },
      {
        name: lang === "fa" ? "کاردیو" : "Cardio",
        value: calcPerc(today.cardioMin, goals.cardioMin),
        fill: "#f59e0b", // Amber
        actual: today.cardioMin,
        goal: goals.cardioMin,
        unit: "Min",
      },
      {
        name: lang === "fa" ? "کالری" : "Calories",
        value: calcPerc(today.calories, goals.calories),
        fill: "#10b981", // Emerald
        actual: today.calories,
        goal: goals.calories,
        unit: "kcal",
      },
    ];
  }, [logs, goals, lang]);

  return (
    <div className="h-64 relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="30%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: "rgba(255,255,255,0.03)" }}
            dataKey="value"
            cornerRadius={10}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              background: "rgba(11,12,15,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
            itemStyle={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
            formatter={(val: number, name: string, props: any) => [
              `${n(props.payload.actual)} / ${n(props.payload.goal)} ${props.payload.unit} (${n(Math.round(val))}%)`,
              name,
            ]}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Legend built directly inside */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
          {lang === "fa" ? "دستیابی به هدف" : "Goal Attainment"}
        </span>
        <span className="text-3xl font-black text-white tracking-tighter mt-1 drop-shadow-xl">
          {n(Math.round(data.reduce((acc, curr) => acc + curr.value, 0) / 4))}%
        </span>
      </div>
    </div>
  );
}
