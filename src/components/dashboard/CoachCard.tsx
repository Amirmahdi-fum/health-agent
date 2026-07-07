import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { useProfile } from "@/stores/profile";
import { useT } from "@/lib/i18n";
import { motion } from "framer-motion";

export function CoachCard() {
  const name = useProfile((s) => s.profile.name);
  const { t, lang } = useT();

  return (
    <Link
      to="/coach"
      className="block relative group overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl transition-all duration-300 hover:border-white/10 hover:shadow-[0_12px_40px_rgba(94,106,210,0.15)]"
    >
      {/* Animated gradient border glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-emerald-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl -z-10" />

      <div className="glass p-6 md:p-8 flex items-center justify-between gap-5 relative overflow-hidden bg-black/40 before:absolute before:inset-0 before:bg-gradient-to-br before:from-indigo-500/5 before:to-emerald-500/5 before:-z-10">
        {/* Abstract Glowing shapes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

        <div className="flex items-center gap-4 md:gap-5 min-w-0">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 10 }}
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 grid place-items-center shrink-0 shadow-lg shadow-indigo-500/20"
          >
            <Sparkles className="h-7 w-7 text-white" />
          </motion.div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-indigo-400 bg-indigo-500/10 uppercase tracking-widest mb-1.5">
              <Sparkles className="h-2.5 w-2.5" />
              {t("aiCoach") || "HEALTH COACH AI"}
            </span>
            <div className="text-lg md:text-xl font-bold tracking-tight text-white leading-tight">
              {lang === "fa"
                ? `${name || "کاربر گرامی"}، چطوری می‌تونم کمکت کنم؟`
                : `How's your day, ${name || "friend"}?`}
            </div>
            <p className="text-xs text-white/40 mt-1 truncate max-w-[280px]">
              {lang === "fa"
                ? "برنامه تمرینی، رژیم غذایی یا پایش سلامتی"
                : "Ask me about workout plans, diet, or health tracking"}
            </p>
          </div>
        </div>

        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 group-hover:border-white/10 transition-colors duration-300">
          <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-white transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
