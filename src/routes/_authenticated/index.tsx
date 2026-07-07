import { createFileRoute } from "@tanstack/react-router";
import { BiometricCards } from "@/components/dashboard/BiometricCards";
import { TodayRings } from "@/components/dashboard/TodayRings";
import { ModuleCards } from "@/components/dashboard/ModuleCards";
import { CoachCard } from "@/components/dashboard/CoachCard";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/stores/profile";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/")({
  component: Index,
});

function Index() {
  const { t } = useT();
  const name = useProfile((s) => s.profile.name);

  // A sleek glassmorphic Bento Grid style index dashboard
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* HEADER SECTION */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <div className="text-xs font-medium tracking-[0.2em] uppercase text-[color:var(--aura-fg-muted)]">
          {t("today")}
        </div>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
          {t("greeting_morning")},{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-indigo-400 bg-clip-text text-transparent">
            {name || "Guest"}
          </span>
        </h1>
      </motion.header>

      {/* BENTO GRID: TOP ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Main Rings / Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 md:col-span-2 lg:col-span-2 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <TodayRings />
        </motion.div>

        {/* Coach / AI Agent Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="col-span-1 md:col-span-1 lg:col-span-2 flex flex-col justify-center"
        >
          <CoachCard />
        </motion.div>
      </div>

      {/* BENTO GRID: MIDDLE ROW (Biometrics) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <BiometricCards />
      </motion.div>

      {/* BENTO GRID: BOTTOM ROW (Progress & Modules) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-7 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6"
        >
          <div className="text-sm font-semibold mb-4 text-[color:var(--aura-fg-muted)] tracking-wider">
            {t("weeklyProgress") || "WEEKLY TRENDS"}
          </div>
          <WeeklyProgress />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6"
        >
          <div className="text-sm font-semibold mb-4 text-[color:var(--aura-fg-muted)] tracking-wider">
            {t("modules") || "ACTIVE MODULES"}
          </div>
          <ModuleCards />
        </motion.div>
      </div>
    </div>
  );
}
