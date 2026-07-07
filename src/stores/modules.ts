import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModuleKey = "nutrition" | "cardio" | "strength" | "recovery";

type State = {
  active: Record<ModuleKey, boolean>;
  toggle: (k: ModuleKey) => void;
  set: (k: ModuleKey, v: boolean) => void;
};

export const useModules = create<State>()(
  persist(
    (set) => ({
      active: { nutrition: true, cardio: true, strength: true, recovery: true },
      toggle: (k) => set((s) => ({ active: { ...s.active, [k]: !s.active[k] } })),
      set: (k, v) => set((s) => ({ active: { ...s.active, [k]: v } })),
    }),
    { name: "aura.modules.v1" },
  ),
);
