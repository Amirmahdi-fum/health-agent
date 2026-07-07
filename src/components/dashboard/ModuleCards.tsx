import { useModules, type ModuleKey } from "@/stores/modules";
import { useT } from "@/lib/i18n";
import {
  Apple,
  Footprints,
  Dumbbell,
  HeartPulse,
  X,
  Settings as SettingsIcon,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

const META: Record<
  ModuleKey,
  {
    icon: React.ComponentType<{ className?: string }>;
    labelKey: "mod_nutrition" | "mod_cardio" | "mod_strength" | "mod_recovery";
    accent: string;
    desc: string;
  }
> = {
  nutrition: {
    icon: Apple,
    labelKey: "mod_nutrition",
    accent: "#f59e0b",
    desc: "کالری، درشت مغذی‌ها و آب",
  },
  cardio: {
    icon: Footprints,
    labelKey: "mod_cardio",
    accent: "#10b981",
    desc: "پایش فعالیت‌ها و تعداد قدم‌ها",
  },
  strength: {
    icon: Dumbbell,
    labelKey: "mod_strength",
    accent: "#60a5fa",
    desc: "ثبت برنامه‌های بدنسازی و وزنه",
  },
  recovery: {
    icon: HeartPulse,
    labelKey: "mod_recovery",
    accent: "#a78bfa",
    desc: "خواب، بازیابی و شاخص‌های حیاتی",
  },
};

export function ModuleCards() {
  const active = useModules((s) => s.active);
  const toggle = useModules((s) => s.toggle);
  const { t, lang } = useT();
  const [open, setOpen] = useState<ModuleKey | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {(Object.keys(META) as ModuleKey[]).map((k) => {
          const m = META[k];
          const on = active[k];
          const Icon = m.icon;
          return (
            <motion.button
              key={k}
              type="button"
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOpen(k)}
              className="glass p-5 rounded-[2rem] border border-white/5 bg-black/40 text-start flex flex-col justify-between min-h-[140px] relative overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-xl group"
            >
              {/* Radial glow background effect */}
              <div
                className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-5 blur-xl group-hover:opacity-10 transition-opacity duration-300"
                style={{ backgroundColor: m.accent }}
              />

              <div className="flex items-center justify-between w-full">
                <div
                  className="h-10 w-10 rounded-xl grid place-items-center shrink-0 border border-white/5 transition-all duration-300"
                  style={{ background: `${m.accent}15`, color: m.accent }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                    on ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/40"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`}
                  />
                  {on
                    ? lang === "fa"
                      ? "فعال"
                      : "Active"
                    : lang === "fa"
                      ? "غیرفعال"
                      : "Inactive"}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-sm font-bold text-white tracking-wide">{t(m.labelKey)}</div>
                <div className="text-[10px] text-white/40 mt-1 leading-relaxed truncate max-w-full">
                  {lang === "fa" ? m.desc : "Manage health stats & logs"}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            />
            <motion.aside
              initial={{ x: lang === "fa" ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: lang === "fa" ? "-100%" : "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`fixed inset-y-0 ${lang === "fa" ? "start-0" : "end-0"} w-full sm:w-[420px] bg-[#07080a] border-${lang === "fa" ? "e" : "s"} border-white/5 p-6 overflow-y-auto z-50 shadow-2xl`}
              style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top,0px))" }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl grid place-items-center"
                    style={{ background: `${META[open].accent}20`, color: META[open].accent }}
                  >
                    {(() => {
                      const Icon = META[open].icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t(META[open].labelKey)}</h3>
                    <p className="text-[10px] text-white/40">
                      {lang === "fa" ? "پیکربندی و تنظیمات ماژول" : "Configure module settings"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(null)}
                  className="h-9 w-9 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4">
                <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {lang === "fa" ? "ماژول فعال" : "Module enabled"}
                    </div>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      {lang === "fa" ? "نمایش در داشبورد و نمودارها" : "Show on dashboard & charts"}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(open)}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                      active[open] ? "bg-indigo-500" : "bg-white/10"
                    }`}
                    aria-pressed={active[open]}
                  >
                    <span
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-300"
                      style={{
                        left: active[open] ? "1.375rem" : "0.125rem",
                      }}
                    />
                  </button>
                </div>

                <div className="glass p-5 rounded-2xl border border-white/5">
                  <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3 font-bold">
                    {lang === "fa" ? "توضیحات ماژول" : "Module Info"}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {lang === "fa"
                      ? `این ماژول به شما اجازه می‌دهد تا ${META[open].desc} خود را ثبت کرده و از طریق هوش مصنوعی آنها را تحلیل کنید.`
                      : `This module allows you to track and analyze your ${open} metrics using advanced algorithms and AI insights.`}
                  </p>
                </div>

                <div className="glass p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-wider text-white/40 font-bold">
                      {lang === "fa" ? "لاگ‌های اخیر" : "Recent logs"}
                    </span>
                    <Link
                      to="/logs"
                      onClick={() => setOpen(null)}
                      className="text-[10px] text-indigo-400 font-bold hover:underline"
                    >
                      {lang === "fa" ? "ثبت لاگ جدید +" : "Log new entry +"}
                    </Link>
                  </div>
                  <ul className="text-xs text-white/40 space-y-2">
                    <li className="flex items-center gap-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                      <span>{lang === "fa" ? "هنوز لاگی ثبت نشده است" : "No entries yet"}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
