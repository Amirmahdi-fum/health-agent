export type Gender = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "very" | "extreme";

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

export function bmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";
export function bmiCategory(v: number): BmiCategory {
  if (v < 18.5) return "underweight";
  if (v < 25) return "normal";
  if (v < 30) return "overweight";
  return "obese";
}

export function bmr(weightKg: number, heightCm: number, ageY: number, gender: Gender): number {
  if (!weightKg || !heightCm || !ageY) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageY;
  return gender === "male" ? base + 5 : base - 161;
}

export function tdee(bmrValue: number, activity: Activity): number {
  return bmrValue * ACTIVITY_FACTOR[activity];
}

export function bodyFatUSNavy(opts: {
  gender: Gender;
  heightCm: number;
  waistCm: number;
  neckCm: number;
  hipCm?: number;
}): number {
  const { gender, heightCm, waistCm, neckCm, hipCm } = opts;
  if (!heightCm || !waistCm || !neckCm) return 0;
  const log10 = (n: number) => Math.log10(n);
  try {
    if (gender === "male") {
      if (waistCm - neckCm <= 0) return 0;
      const v =
        495 / (1.0324 - 0.19077 * log10(waistCm - neckCm) + 0.15456 * log10(heightCm)) - 450;
      return Math.max(0, v);
    }
    if (!hipCm || waistCm + hipCm - neckCm <= 0) return 0;
    const v =
      495 / (1.29579 - 0.35004 * log10(waistCm + hipCm - neckCm) + 0.221 * log10(heightCm)) - 450;
    return Math.max(0, v);
  } catch {
    return 0;
  }
}
