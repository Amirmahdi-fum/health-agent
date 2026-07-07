import { useLogs } from "@/stores/logs";
import { useProfile } from "@/stores/profile";

export function useTodaySummary() {
  // We use the local store `useLogs` (Zustand) directly.
  // No need for a server connection when the user hasn't opted into sync.
  const getToday = useLogs((s) => s.getToday);
  const today = getToday();

  // For future Google Fit / Apple Health sync stats, we will simulate them for now
  // or read from another sync store.

  return {
    kcal: today.calories || 0,
    cardioMin: today.cardioMin || 0,
    waterMl: today.waterMl || 0,
    studyMin: today.studyMin || 0,
    sleepHours: 0, // Mock for now until sleep is added to DayLog
    steps: today.cardioMin * 100, // Roughly simulating steps based on cardio for offline display
    floors: 0,
    loading: false,
  };
}
