import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { Users, UserPlus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/friends")({
  component: FriendsPage,
});

function FriendsPage() {
  const { t, lang } = useT();

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 grid place-items-center">
          <Users className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("nav_friends") || (lang === "fa" ? "دوستان" : "Friends")}
          </h1>
          <p className="text-xs text-[color:var(--aura-fg-muted)]">
            {lang === "fa"
              ? "با دوستان خود رقابت کنید و از پیشرفت‌شان باخبر شوید"
              : "Connect, compete, and share your health journey."}
          </p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-dual rounded-[2rem] p-10 text-center border border-white/5 flex flex-col items-center gap-4"
      >
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 grid place-items-center">
          <UserPlus className="h-8 w-8 text-indigo-400" />
        </div>
        <h3 className="text-xl font-semibold">
          {lang === "fa" ? "دوستی پیدا نشد" : "No friends yet"}
        </h3>
        <p className="text-sm text-[color:var(--aura-fg-muted)] max-w-sm leading-relaxed">
          {lang === "fa"
            ? "بخش دوستان یک ویژگی اجتماعی است که با سینک ابری فعال می‌شود. برای استفاده از آن، وارد حساب گوگل خود شوید."
            : "Friends is a social feature powered by Supabase realtime. Sign in with your Google account to sync and start inviting friends."}
        </p>
        <div className="flex items-center gap-2 text-xs text-[color:var(--aura-fg-muted)] mt-2">
          <Sparkles className="h-3 w-3" />
          <span>{lang === "fa" ? "به زودی..." : "Coming soon..."}</span>
        </div>
      </motion.div>
    </div>
  );
}
