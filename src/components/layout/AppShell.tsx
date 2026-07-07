import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  Settings as SettingsIcon,
  Sparkles,
  Languages,
  CalendarDays,
  LogOut,
  LineChart,
  Users,
  LogIn,
} from "lucide-react";
import { HealthAgentLogo } from "@/components/brand/HealthAgentLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useT } from "@/lib/i18n";
import { useUI } from "@/stores/ui";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile } from "@/lib/profile.functions";
import { Avatar } from "@/components/profile/AvatarPicker";
import { StreakBadge } from "@/components/gamification/StreakBadge";
import { usePalette } from "@/stores/palette";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  const toggleLang = useUI((s) => s.toggleLang);
  const lang = useUI((s) => s.lang);
  const openPalette = usePalette((s) => s.setOpen);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
    enabled: !!user,
  });

  const nav = [
    { to: "/", label: t("nav_home"), icon: LayoutDashboard },
    { to: "/logs", label: lang === "fa" ? "تاریخچه" : "History", icon: CalendarDays },
    { to: "/charts", label: lang === "fa" ? "نمودارها" : "Charts", icon: LineChart },
    { to: "/friends", label: lang === "fa" ? "دوستان" : "Friends", icon: Users },
    { to: "/profile", label: t("nav_profile"), icon: User },
    { to: "/coach", label: t("nav_coach"), icon: Sparkles },
    { to: "/settings", label: t("nav_settings"), icon: SettingsIcon },
  ] as const;

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/settings", replace: true });
  };

  const signIn = () => navigate({ to: "/settings" });

  return (
    <div className="relative z-10 min-h-screen font-sans selection:bg-indigo-500/30">
      <aside className="hidden lg:flex fixed inset-y-4 start-4 w-64 flex-col p-4 gap-4 z-20 glass rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-3xl overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-indigo-500/5 before:to-emerald-500/5 before:-z-10">
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 grid place-items-center border border-white/10 shrink-0">
            <HealthAgentLogo size={24} className="drop-shadow-lg" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-wide truncate bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              Health Agent
            </div>
            <div className="text-[11px] text-[color:var(--aura-fg-muted)] truncate">
              {t("tagline")}
            </div>
          </div>
        </div>

        <nav className="flex-1 mt-4 flex flex-col gap-1.5 overflow-y-auto no-scrollbar px-1">
          {nav.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium transition-all duration-300 ${
                  active ? "text-white" : "text-[color:var(--aura-fg-muted)] hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="aura-nav-active-glass"
                    className="absolute inset-0 rounded-2xl bg-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div
                  className={`relative flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300 ${active ? "bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-lg" : "bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white"}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-white/5">
          {user ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar id={profile?.avatar_id ?? 1} size={36} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate">
                  {profile?.display_name ?? user.email}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Sync Active
                </div>
              </div>
              <button
                onClick={signOut}
                className="h-8 w-8 grid place-items-center rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="glass p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/5 grid place-items-center">
                <Users className="h-5 w-5 text-white/40" />
              </div>
              <div>
                <div className="text-xs font-semibold mb-1">
                  {lang === "fa" ? "حساب کاربری" : "Account Sync"}
                </div>
                <div className="text-[10px] text-[color:var(--aura-fg-muted)] leading-relaxed">
                  {lang === "fa"
                    ? "برای سینک ابری و قابلیت دوستان وارد شوید"
                    : "Sign in to enable cloud sync and social features."}
                </div>
              </div>
              <button
                onClick={signIn}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                {lang === "fa" ? "ورود به حساب" : "Sign In"}
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={toggleLang}
              className="flex-1 glass py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs hover:bg-white/10 transition-colors"
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="font-mono text-white/50">{lang === "en" ? "EN" : "FA"}</span>
            </button>
            <NotificationBell />
            <button
              onClick={() => openPalette(true)}
              className="flex-1 glass py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs hover:bg-white/10 transition-colors"
            >
              <kbd className="font-mono text-white/50 text-[10px] px-1.5 py-0.5 bg-white/5 rounded">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-30 backdrop-blur-2xl bg-[#07080a]/80 border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 grid place-items-center border border-white/10 shrink-0">
              <HealthAgentLogo size={18} />
            </div>
            <span className="text-sm font-bold truncate bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              Health Agent
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!user ? (
              <button
                onClick={signIn}
                className="h-8 px-3 rounded-lg bg-white/10 text-xs font-medium flex items-center gap-1"
              >
                <LogIn className="h-3.5 w-3.5" /> {lang === "fa" ? "ورود" : "Login"}
              </button>
            ) : (
              <>
                <StreakBadge compact />
                <Link
                  to="/profile"
                  className="focus:outline-none transition-transform active:scale-95"
                >
                  <Avatar id={profile?.avatar_id ?? 1} size={30} />
                </Link>
              </>
            )}
            <NotificationBell side="bottom" />
            <button
              onClick={toggleLang}
              className="text-[10px] font-mono h-8 w-8 rounded-lg bg-white/5 grid place-items-center shrink-0"
            >
              {lang === "en" ? "EN" : "FA"}
            </button>
          </div>
        </div>
      </header>

      <main
        className="lg:ps-[288px] min-h-screen px-4 lg:px-8 py-6 lg:py-8"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="max-w-6xl mx-auto h-full">{children}</div>
      </main>

      <nav
        className="lg:hidden fixed inset-x-4 z-40 glass rounded-[1.5rem] flex items-center justify-around px-2 py-2 backdrop-blur-3xl border border-white/10 shadow-2xl"
        style={{
          bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          background: "rgba(7,8,10,0.85)",
        }}
      >
        {nav
          .filter((n) => ["/", "/logs", "/charts", "/coach", "/settings"].includes(n.to))
          .map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`relative flex-1 flex flex-col items-center gap-1.5 py-2 rounded-2xl text-[10px] font-medium transition-all duration-300 ${
                  active ? "text-white" : "text-[color:var(--aura-fg-muted)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="aura-mobile-nav-active"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`h-5 w-5 relative transition-transform duration-300 ${active ? "scale-110 text-indigo-400" : ""}`}
                />
                <span className="truncate max-w-[80px] relative">{n.label}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
