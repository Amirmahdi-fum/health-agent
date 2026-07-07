import { createFileRoute } from "@tanstack/react-router";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { GoalDistributionChart } from "@/components/dashboard/GoalDistributionChart";
import { BalanceRadar } from "@/components/profile/BalanceRadar";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { BarChart3, TrendingUp, PieChart, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/charts")({
  component: ChartsPage,
});

function ChartsPage() {
  const { lang } = useT();

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 grid place-items-center">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {lang === "fa" ? "نمودارها و تحلیل‌ها" : "Analytics & Charts"}
          </h1>
          <p className="text-xs text-[color:var(--aura-fg-muted)]">
            {lang === "fa"
              ? "پیشرفت بلندمدت شما در وزن، کالری و فعالیت‌ها"
              : "Your long-term progress in weight, calories, and activity."}
          </p>
        </div>
      </header>

      {/* Full-width glassmorphic chart panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-dual rounded-[2rem] p-6 lg:p-8 border border-white/5 relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-[color:var(--aura-fg-muted)] uppercase tracking-widest">
              {lang === "fa" ? "روند هفتگی" : "Weekly Trends"}
            </h2>
          </div>
          <WeeklyProgress />
        </div>
      </motion.div>

      {/* Bottom Grid for Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macros Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass glow-dual rounded-[2rem] p-6 lg:p-8 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="h-4 w-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-[color:var(--aura-fg-muted)] uppercase tracking-widest">
              {lang === "fa" ? "اهداف روزانه" : "Daily Goals"}
            </h2>
          </div>
          <GoalDistributionChart />
        </motion.div>

        {/* Wellness Radar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass glow-dual rounded-[2rem] p-6 lg:p-8 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <BalanceRadar />
        </motion.div>
      </div>
    </div>
  );
}
