import { useUI, type Lang } from "@/stores/ui";

const DICT = {
  appName: { en: "Health Agent", fa: "هلث ایجنت" },
  tagline: { en: "Your AI-Powered Health OS", fa: "دستیار هوشمند سلامتی شما" },
  nav_home: { en: "Dashboard", fa: "داشبورد" },
  nav_friends: { en: "Friends", fa: "دوستان" },
  nav_charts: { en: "Charts", fa: "نمودارها" },
  nav_logs: { en: "Logs", fa: "لاگ‌ها" },
  nav_profile: { en: "Profile", fa: "پروفایل" },
  nav_settings: { en: "Settings", fa: "تنظیمات" },
  nav_coach: { en: "Health Agent", fa: "هلث ایجنت" },
  greeting_morning: { en: "Ready for your morning climb", fa: "آماده صعود صبحگاهی" },
  bmi: { en: "BMI", fa: "شاخص توده بدنی" },
  bmr: { en: "BMR", fa: "متابولیسم پایه" },
  tdee: { en: "TDEE", fa: "کالری روزانه" },
  bodyFat: { en: "Body Fat", fa: "چربی بدن" },
  weight: { en: "Weight", fa: "وزن" },
  targetWeight: { en: "Target Weight", fa: "وزن هدف" },
  height: { en: "Height", fa: "قد" },
  age: { en: "Age", fa: "سن" },
  gender: { en: "Gender", fa: "جنسیت" },
  male: { en: "Male", fa: "مرد" },
  female: { en: "Female", fa: "زن" },
  waist: { en: "Waist", fa: "دور کمر" },
  neck: { en: "Neck", fa: "دور گردن" },
  hip: { en: "Hip", fa: "دور باسن" },
  activity: { en: "Activity Level", fa: "سطح فعالیت" },
  sedentary: { en: "Sedentary", fa: "بی‌تحرک" },
  light: { en: "Lightly Active", fa: "کم‌تحرک" },
  moderate: { en: "Moderately Active", fa: "متوسط" },
  very: { en: "Very Active", fa: "پرتحرک" },
  extreme: { en: "Extremely Active", fa: "بسیار پرتحرک" },
  medical: { en: "Medical Profile", fa: "پروفایل پزشکی" },
  diseases: { en: "Diseases / Allergies", fa: "بیماری‌ها / حساسیت‌ها" },
  joints: { en: "Joint Limits", fa: "محدودیت‌های مفصلی" },
  medications: { en: "Medications", fa: "داروها" },
  underweight: { en: "Underweight", fa: "کمبود وزن" },
  normal: { en: "Normal", fa: "طبیعی" },
  overweight: { en: "Overweight", fa: "اضافه وزن" },
  obese: { en: "Obese", fa: "چاق" },
  save: { en: "Save", fa: "ذخیره" },
  modules: { en: "Modules", fa: "ماژول‌ها" },
  mod_nutrition: { en: "Nutrition & Macros", fa: "تغذیه و درشت‌مغذی‌ها" },
  mod_cardio: { en: "Cardio & Run", fa: "کاردیو و دویدن" },
  mod_strength: { en: "Strength & Calisthenics", fa: "قدرتی و کالیستنیک" },
  mod_recovery: { en: "Recovery & Wellness", fa: "ریکاوری و سلامت" },
  today: { en: "Today", fa: "امروز" },
  calories: { en: "Calories", fa: "کالری" },
  cardioMin: { en: "Cardio min", fa: "دقیقه کاردیو" },
  water: { en: "Water", fa: "آب" },
  study: { en: "Study", fa: "مطالعه" },
  aiCoach: { en: "Health Agent", fa: "هلث ایجنت" },
  aiConnect: { en: "Connection", fa: "اتصال" },
  baseUrl: { en: "Base URL", fa: "آدرس پایه (URL)" },
  apiKey: { en: "API Key", fa: "کلید (API)" },
  model: { en: "Model", fa: "مدل" },
  customModel: { en: "Custom model…", fa: "مدل سفارشی…" },
  send: { en: "Send", fa: "ارسال" },
  stop: { en: "Stop", fa: "توقف" },
  thinking: { en: "Thinking", fa: "در حال فکر کردن" },
  askAnything: { en: "Ask your coach anything…", fa: "هر سوالی از مربی بپرس…" },
  keyDisclaimer: {
    en: "Your key is stored only in this browser and sent directly to your chosen endpoint.",
    fa: "کلید فقط در همین مرورگر ذخیره می‌شود و مستقیم به سرور انتخابی ارسال می‌گردد.",
  },
  profileTitle: { en: "Health Profile", fa: "پروفایل سلامت" },
  settingsTitle: { en: "Workspace Settings", fa: "تنظیمات فضای کاری" },
  active: { en: "Active", fa: "فعال" },
  inactive: { en: "Inactive", fa: "غیرفعال" },
  cm: { en: "cm", fa: "سانتی‌متر" },
  kg: { en: "kg", fa: "کیلوگرم" },
  years: { en: "years", fa: "سال" },
  kcal: { en: "kcal", fa: "کیلوکالری" },
  weightTrend: { en: "Weight Trend", fa: "روند وزن" },
  goal: { en: "Goal", fa: "هدف" },
  systemPrompt: { en: "System Prompt", fa: "پرامپت سیستمی" },
  weeklyProgress: { en: "Weekly Progress", fa: "پیشرفت هفتگی" },
  healthScore: { en: "Health Score", fa: "امتیاز سلامت" },
  identity: { en: "Identity", fa: "هویت" },
  biometrics: { en: "Biometrics", fa: "بیومتریک" },
  achievements: { en: "Achievements", fa: "دستاوردها" },
  share: { en: "Share", fa: "اشتراک" },
  edit: { en: "Edit", fa: "ویرایش" },
  bio: { en: "Bio", fa: "بیوگرافی" },
  memberSince: { en: "Spartan since", fa: "عضو از" },
  settings: { en: "Settings", fa: "تنظیمات" },
  attachImage: { en: "Attach image", fa: "افزودن تصویر" },
  voiceInput: { en: "Voice input", fa: "ورودی صوتی" },
  listening: { en: "Listening…", fa: "در حال شنیدن…" },
  greeting: { en: "How can I help you today", fa: "امروز چطور می‌تونم کمکت کنم" },
  suggest_cardio: { en: "Plan my fasted cardio", fa: "برنامه کاردیو ناشتا برام بچین" },
  suggest_knee: { en: "Design a knee-friendly routine", fa: "روتین دوستدار زانو طراحی کن" },
  suggest_nutrition: { en: "Analyze my nutrition", fa: "تغذیه من رو تحلیل کن" },
  suggest_report: { en: "Weekly performance report", fa: "گزارش عملکرد هفتگی" },
  clearChat: { en: "Clear conversation", fa: "پاک‌کردن گفتگو" },
  connectionSettings: { en: "Connection & Prompt", fa: "اتصال و پرامپت" },
  topics: { en: "Topics", fa: "موضوعات چت" },
  delete: { en: "Delete", fa: "حذف" },
} as const;

type Key = keyof typeof DICT;

export function t(key: Key, lang: Lang): string {
  return DICT[key][lang];
}

export function useT() {
  const lang = useUI((s) => s.lang);
  return {
    lang,
    t: (k: Key) => DICT[k][lang],
    n: (v: number | string, digits = 0) => formatNumber(v, lang, digits),
  };
}

export function formatNumber(v: number | string, lang: Lang, digits = 0): string {
  if (v === "" || v === null || v === undefined) return "";
  const num = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(num)) return String(v);
  // Always render with Western (English) digits — including in fa mode per design.
  // Persian digits are intentionally NOT used; numerals stay LTR/English everywhere.
  const s = digits > 0 ? num.toFixed(digits) : Math.round(num).toString();
  return s;
}
