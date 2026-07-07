import { create } from "zustand";

type State = {
  open: boolean;
  setOpen: (o: boolean) => void;
  toggle: () => void;
};

export const usePalette = create<State>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
