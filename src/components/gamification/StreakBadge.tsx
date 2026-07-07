import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { getStats } from "@/lib/gamification.functions";
import { levelFromXp, levelTitle } from "@/lib/badges";
import { useT } from "@/lib/i18n";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";
import { BadgesModal } from "./BadgesModal";

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === new Date().toISOString().slice(0, 10);
}
function isYesterdayOrToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((+today - +d) / 86400000);
  return diff <= 1;
}

export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const { user } = useSession();
  const { lang, n } = useT();
  const [showBadges, setShowBadges] = useState(false);
  const { data } = useQuery({
    queryKey: ["user_stats"],
    queryFn: () => getStats(),
    enabled: !!user,
    refetchOnWindowFocus: false,
  });
  if (!user || !data) return null;

  const active = isYesterdayOrToday(data.last_activity_date);
  const flameColor = active ? "#f59e0b" : "#4b5563";
  const { level, inLevel, span } = levelFromXp(data.xp);
  const pct = Math.min(100, (inLevel / span) * 100);

  return (
    <>
      <button
        onClick={() => setShowBadges(true)}
        className="glass px-2.5 py-1.5 flex items-center gap-2 text-xs hover:bg-white/[0.06] transition"
        aria-label="Streak and level"
      >
        <motion.span
          animate={active && isToday(data.last_activity_date) ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Flame
            className="h-4 w-4"
            style={{
              color: flameColor,
              filter: active ? `drop-shadow(0 0 6px ${flameColor})` : "none",
            }}
          />
        </motion.span>
        <span className="mono font-semibold" style={{ color: active ? "#f59e0b" : "#9ca3af" }}>
          {n(data.current_streak)}
        </span>
        {!compact && (
          <>
            <span className="hidden sm:block h-4 w-px bg-white/10" />
            <div className="hidden sm:flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-[#5e6ad2]" />
              <span className="mono text-[10px]">L{n(level)}</span>
              <div className="w-14 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5e6ad2] to-[#10b981]"
                  style={{ width: `${pct}%`, boxShadow: "0 0 6px #5e6ad2" }}
                />
              </div>
            </div>
          </>
        )}
      </button>
      {showBadges && (
        <BadgesModal
          onClose={() => setShowBadges(false)}
          unlocked={data.unlocked_badges}
          xp={data.xp}
          level={level}
          streak={data.current_streak}
          longest={data.longest_streak}
          levelTitle={levelTitle(level, lang)}
        />
      )}
    </>
  );
}
