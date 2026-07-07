import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DayLog = {
  date: string;
  calories: number;
  cardioMin: number;
  waterMl: number;
  studyMin: number;
  weightKg?: number;
};

export type LogEntry = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  log_date: string;
};

type State = {
  goals: { calories: number; cardioMin: number; waterMl: number; studyMin: number };
  logs: DayLog[];
  entries: LogEntry[];
  setGoal: (k: keyof State["goals"], v: number) => void;
  addToday: (patch: Partial<Omit<DayLog, "date">>) => void;
  addEntry: (entry: Omit<LogEntry, "id">) => void;
  removeEntry: (id: string) => void;
  getToday: () => DayLog;
  clearEntries: () => void;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

function seedTrend(): DayLog[] {
  const arr: DayLog[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    arr.push({
      date: d.toISOString().slice(0, 10),
      calories: 0,
      cardioMin: 0,
      waterMl: 0,
      studyMin: 0,
      weightKg: 78 + Math.sin(i / 3) * 0.6,
    });
  }
  return arr;
}

const FALLBACK_TODAY: DayLog = {
  date: "", // Will be dynamically ignored or patched, just a stable reference
  calories: 0,
  cardioMin: 0,
  waterMl: 0,
  studyMin: 0,
};

export const useLogs = create<State>()(
  persist(
    (set, get) => ({
      goals: { calories: 2400, cardioMin: 30, waterMl: 3000, studyMin: 120 },
      logs: seedTrend(),
      entries: [],
      setGoal: (k, v) => set((s) => ({ goals: { ...s.goals, [k]: v } })),
      getToday: () => {
        const k = todayKey();
        return get().logs.find((l) => l.date === k) ?? { ...FALLBACK_TODAY, date: k };
      },
      addToday: (patch) =>
        set((s) => {
          const k = todayKey();
          const existing = s.logs.find((l) => l.date === k);
          if (existing) {
            return {
              logs: s.logs.map((l) => (l.date === k ? { ...l, ...patch } : l)),
            };
          }
          return {
            logs: [
              ...s.logs,
              { date: k, calories: 0, cardioMin: 0, waterMl: 0, studyMin: 0, ...patch },
            ],
          };
        }),
      addEntry: (entry) =>
        set((s) => ({
          entries: [
            {
              id: crypto.randomUUID(),
              type: entry.type,
              payload: entry.payload,
              log_date: entry.log_date,
            },
            ...s.entries,
          ],
        })),
      removeEntry: (id) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
        })),
      clearEntries: () => set({ entries: [] }),
    }),
    { name: "aura.logs.v1" },
  ),
);
