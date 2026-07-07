import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "en" | "fa";

type UIState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
};

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((s) => ({ lang: s.lang === "en" ? "fa" : "en" })),
    }),
    { name: "aura.ui.v1" },
  ),
);
