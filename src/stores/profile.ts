import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Activity, Gender } from "@/lib/calc";

export type Profile = {
  name: string;
  bio: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  waistCm: number;
  neckCm: number;
  hipCm: number;
  activity: Activity;
  diseases: string;
  joints: string;
  medications: string;
  // Customization fields
  coverId?: string;
  accentColor?: string;
  avatarFrame?: string;
  avatarId?: number;
  customUserId?: string;
};

type ProfileState = {
  profile: Profile;
  update: (p: Partial<Profile>) => void;
  reset: () => void;
};

export const DEFAULT_PROFILE: Profile = {
  name: "Seyed Amirmahdi",
  bio: "",
  age: 19,
  gender: "male",
  heightCm: 180,
  weightKg: 78,
  targetWeightKg: 74,
  waistCm: 82,
  neckCm: 38,
  hipCm: 0,
  activity: "moderate",
  diseases: "",
  joints: "",
  medications: "",
  coverId: "aurora",
  accentColor: "#5e6ad2",
  avatarFrame: "neon",
  avatarId: 1,
  customUserId: "",
};

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      update: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      reset: () => set({ profile: DEFAULT_PROFILE }),
    }),
    { name: "aura.profile.v1" },
  ),
);
