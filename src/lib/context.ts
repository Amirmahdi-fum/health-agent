import type { Profile } from "@/stores/profile";
import type { ModuleKey } from "@/stores/modules";
import { bmi, bmiCategory, bmr, tdee, bodyFatUSNavy } from "@/lib/calc";
import type { Lang } from "@/stores/ui";
import type { DayLog } from "@/stores/logs";

export function buildCoachContext(
  profile: Profile,
  active: Record<ModuleKey, boolean>,
  lang: Lang,
  logs?: DayLog[],
  goals?: { calories: number; cardioMin: number; waterMl: number; studyMin: number },
  programStartDate?: number | null,
) {
  const bmiV = bmi(profile.weightKg, profile.heightCm);
  const bmrV = bmr(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tdeeV = tdee(bmrV, profile.activity);
  const bfV = bodyFatUSNavy({
    gender: profile.gender,
    heightCm: profile.heightCm,
    waistCm: profile.waistCm,
    neckCm: profile.neckCm,
    hipCm: profile.hipCm,
  });

  // Build recent logs (last 7 days)
  const recentLogs = logs
    ? logs.slice(-7).map((l) => ({
        date: l.date,
        calories: l.calories,
        cardioMin: l.cardioMin,
        waterMl: l.waterMl,
        studyMin: l.studyMin,
        weightKg: l.weightKg,
      }))
    : [];

  // Today's log
  const today = recentLogs.length > 0 ? recentLogs[recentLogs.length - 1] : null;
  const todayStr = new Date().toISOString().split("T")[0];
  const hasTodayLog = today?.date === todayStr;

  // Days since last log
  const lastLogDate = recentLogs.length > 0 ? recentLogs[recentLogs.length - 1].date : null;
  const daysSinceLastLog = lastLogDate
    ? Math.floor((Date.now() - new Date(lastLogDate).getTime()) / 86400000)
    : null;

  // Profile completeness check (critical fields only)
  const criticalFields = {
    name: !!profile.name,
    age: profile.age > 0,
    gender: !!profile.gender,
    heightCm: profile.heightCm > 0,
    weightKg: profile.weightKg > 0,
    targetWeightKg: profile.targetWeightKg > 0,
    activity: !!profile.activity,
  };
  const filledCount = Object.values(criticalFields).filter(Boolean).length;
  const profileCompleteness = Math.round((filledCount / Object.keys(criticalFields).length) * 100);
  const missingFields = Object.entries(criticalFields)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  // Program duration
  const daysSinceProgramStart = programStartDate
    ? Math.floor((Date.now() - programStartDate) / 86400000)
    : null;

  // Calculate 7-day averages
  const avgLogs =
    recentLogs.length > 0
      ? {
          avgCalories: Math.round(
            recentLogs.reduce((s, l) => s + l.calories, 0) / recentLogs.length,
          ),
          avgCardioMin: Math.round(
            recentLogs.reduce((s, l) => s + l.cardioMin, 0) / recentLogs.length,
          ),
          avgWaterMl: Math.round(recentLogs.reduce((s, l) => s + l.waterMl, 0) / recentLogs.length),
          avgStudyMin: Math.round(
            recentLogs.reduce((s, l) => s + l.studyMin, 0) / recentLogs.length,
          ),
        }
      : null;

  // Total logs count
  const totalLogsCount = logs?.length ?? 0;

  return {
    language: lang,
    profile: {
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      targetWeightKg: profile.targetWeightKg,
      activity: profile.activity,
    },
    profileCompleteness,
    missingFields,
    metrics: {
      bmi: Number(bmiV.toFixed(2)),
      bmiCategory: bmiCategory(bmiV),
      bmr: Math.round(bmrV),
      tdee: Math.round(tdeeV),
      bodyFatPct: Number(bfV.toFixed(1)),
    },
    medical: {
      diseases: profile.diseases,
      jointLimits: profile.joints,
      medications: profile.medications,
    },
    today: today
      ? {
          date: today.date,
          calories: today.calories,
          cardioMin: today.cardioMin,
          waterMl: today.waterMl,
          studyMin: today.studyMin,
          weightKg: today.weightKg,
        }
      : null,
    hasTodayLog,
    daysSinceLastLog,
    goals: goals || null,
    recentTrend: recentLogs,
    weeklyAverages: avgLogs,
    programStartDate: programStartDate
      ? new Date(programStartDate).toISOString().split("T")[0]
      : null,
    daysSinceProgramStart,
    totalLogsCount,
    activeModules: (Object.keys(active) as ModuleKey[]).filter((k) => active[k]),
    inactiveModules: (Object.keys(active) as ModuleKey[]).filter((k) => !active[k]),
  };
}
