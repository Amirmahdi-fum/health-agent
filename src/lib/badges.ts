export type BadgeDef = {
  id: string;
  name: { en: string; fa: string };
  desc: { en: string; fa: string };
  emoji: string;
  gradient: string;
};

export const BADGES: BadgeDef[] = [
  {
    id: "first_log",
    emoji: "🌱",
    name: { en: "First Steps", fa: "اولین قدم" },
    desc: { en: "Logged your first entry.", fa: "اولین ورودی خود را ثبت کردید." },
    gradient: "from-emerald-400 to-cyan-400",
  },
  {
    id: "dawn_ascender",
    emoji: "🌄",
    name: { en: "Dawn Ascender", fa: "صعودگر سپیده" },
    desc: { en: "Fasted cardio before 5:00 AM.", fa: "کاردیو ناشتا پیش از ساعت ۵ صبح." },
    gradient: "from-amber-400 to-red-500",
  },
  {
    id: "hydration_hero",
    emoji: "💧",
    name: { en: "Hydration Hero", fa: "قهرمان آب" },
    desc: { en: "Hit the water target 3 days in a row.", fa: "سه روز پیاپی هدف آب را زدید." },
    gradient: "from-sky-400 to-blue-600",
  },
  {
    id: "water_champion",
    emoji: "🌊",
    name: { en: "Water Champion", fa: "قهرمان اقیانوس" },
    desc: { en: "Hit the water target 10 days in a row.", fa: "ده روز پیاپی هدف آب را زدید." },
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "bodyweight_beast",
    emoji: "🦍",
    name: { en: "Bodyweight Beast", fa: "غول کالیستنیک" },
    desc: {
      en: "Completed a full bodyweight routine.",
      fa: "یک تمرین کامل کالیستنیک را ثبت کردید.",
    },
    gradient: "from-red-500 to-purple-600",
  },
  {
    id: "streak_7",
    emoji: "🔥",
    name: { en: "Ignition", fa: "احتراق" },
    desc: { en: "7-day activity streak.", fa: "استریک ۷ روزه فعالیت." },
    gradient: "from-orange-400 to-red-600",
  },
  {
    id: "streak_30",
    emoji: "🏔️",
    name: { en: "Iron Month", fa: "ماه آهنین" },
    desc: { en: "30-day streak. You're built different.", fa: "استریک ۳۰ روزه. تو متفاوتی." },
    gradient: "from-slate-400 to-slate-700",
  },
  {
    id: "level_5",
    emoji: "⚔️",
    name: { en: "Spartan Scholar", fa: "دانشمند اسپارتی" },
    desc: { en: "Reached level 5.", fa: "به سطح ۵ رسیدید." },
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "level_10",
    emoji: "🛡️",
    name: { en: "Praetorian", fa: "پرتوریان" },
    desc: { en: "Reached level 10.", fa: "به سطح ۱۰ رسیدید." },
    gradient: "from-fuchsia-500 to-rose-600",
  },
  {
    id: "cardio_10",
    emoji: "🏃",
    name: { en: "Marathoner Soul", fa: "روح ماراتنی" },
    desc: { en: "Logged 10 cardio sessions.", fa: "۱۰ جلسه کاردیو ثبت شد." },
    gradient: "from-lime-400 to-green-600",
  },
  {
    id: "food_50",
    emoji: "🥗",
    name: { en: "Macro Master", fa: "استاد ماکرو" },
    desc: { en: "Logged 50 meals.", fa: "۵۰ وعده غذایی ثبت شد." },
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    id: "scholar",
    emoji: "📚",
    name: { en: "Sage of Study", fa: "خردمند مطالعه" },
    desc: { en: "Logged 1000 minutes of study.", fa: "۱۰۰۰ دقیقه مطالعه ثبت شد." },
    gradient: "from-teal-400 to-emerald-600",
  },
];

export function xpForLevel(level: number): number {
  // total XP required to reach next level
  return 200 * level;
}

export function levelFromXp(xp: number): {
  level: number;
  toNext: number;
  inLevel: number;
  span: number;
} {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  const span = xpForLevel(level);
  return { level, toNext: span - remaining, inLevel: remaining, span };
}

export const XP_FOR = {
  food: 10,
  water_target: 20,
  cardio: 50,
  strength: 50,
  weight: 5,
  sleep: 5,
  study: 10,
  note: 5,
  stress: 5,
  photo_food: 15,
} as const;

export function levelTitle(level: number, lang: "en" | "fa"): string {
  const titles =
    lang === "fa"
      ? [
          "تازه‌کار",
          "شاگرد",
          "دانش‌آموز",
          "جنگجو",
          "دانشمند اسپارتی",
          "لژیونر",
          "قهرمان",
          "استاد",
          "افسانه",
          "پرتوریان",
        ]
      : [
          "Novice",
          "Apprentice",
          "Disciple",
          "Warrior",
          "Spartan Scholar",
          "Legionnaire",
          "Champion",
          "Master",
          "Legend",
          "Praetorian",
        ];
  return titles[Math.min(level - 1, titles.length - 1)];
}
