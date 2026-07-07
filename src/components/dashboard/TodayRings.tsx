import { RingWidget } from "./RingWidget";
import { useModules } from "@/stores/modules";
import { useT } from "@/lib/i18n";
import { useTodaySummary } from "@/hooks/use-today-summary";
import { SyncButton } from "./SyncButton";

export function TodayRings() {
  const s = useTodaySummary();
  const goals = {
    calories: 2400,
    cardioMin: 30,
    waterMl: 3000,
    studyMin: 120,
    steps: 10000,
    sleepHours: 8,
  };
  const active = useModules((s) => s.active);
  const { t } = useT();

  const rings = [
    {
      key: "nutrition",
      enabled: active.nutrition,
      value: s.kcal,
      max: goals.calories,
      label: t("calories"),
      unit: t("kcal"),
    },
    {
      key: "cardio",
      enabled: active.cardio,
      value: s.cardioMin || s.steps / 100,
      max: goals.cardioMin,
      label: t("cardioMin"),
      unit: "",
    },
    {
      key: "recovery",
      enabled: active.recovery,
      value: s.waterMl,
      max: goals.waterMl,
      label: t("water"),
      unit: "ml",
    },
    {
      key: "recovery-2",
      enabled: active.recovery,
      value: s.studyMin,
      max: goals.studyMin,
      label: t("study"),
      unit: "min",
    },
  ]
    .filter((r) => r.enabled)
    .map((r) => ({ ...r, color: r.value / r.max >= 1 ? "#10b981" : "#5e6ad2" }));

  if (!rings.length) return null;

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-wider text-[color:var(--aura-fg-muted)]">
          {t("today")}
        </div>
        <SyncButton />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rings.map((r) => (
          <RingWidget
            key={r.key}
            value={r.value}
            max={r.max}
            label={r.label}
            unit={r.unit}
            color={r.color}
          />
        ))}
      </div>
    </div>
  );
}
