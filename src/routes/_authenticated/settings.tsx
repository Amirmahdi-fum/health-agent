import { createFileRoute } from "@tanstack/react-router";
import { DataManagement } from "@/components/settings/DataManagement";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { LanguageToggle } from "@/components/settings/LanguageToggle";
import { ConnectionPanel } from "@/components/coach/ConnectionPanel";
import { useT } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, Cloud, Smartphone, Bot } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { Bell } from "lucide-react";
import { SyncHub } from "@/components/sync/SyncHub";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang } = useT();
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<"account" | "ai" | "prefs" | "notifs" | "sync">(
    "account",
  );

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to sign in");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(lang === "fa" ? "با موفقیت خارج شدید" : "Signed out successfully");
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      <header className="flex items-center gap-3 mb-6 shrink-0">
        <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 grid place-items-center">
          <SettingsIcon className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav_settings")}</h1>
          <p className="text-xs text-[color:var(--aura-fg-muted)]">
            {lang === "fa"
              ? "تنظیمات محلی، سینک ابری و هوش مصنوعی"
              : "Manage local data, cloud sync, and AI preferences."}
          </p>
        </div>
      </header>

      {/* Tabs Control */}
      <div className="glass p-1.5 rounded-2xl flex items-center gap-1 mb-6 shrink-0 border border-white/5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center justify-center gap-2 flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "account"
              ? "bg-white/10 text-white shadow-lg"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          <Cloud className="w-4 h-4" />
          {lang === "fa" ? "حساب کاربری" : "Account"}
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center justify-center gap-2 flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "ai"
              ? "bg-white/10 text-white shadow-lg"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          <Bot className="w-4 h-4" />
          {lang === "fa" ? "هوش مصنوعی" : "AI Coach"}
        </button>
        <button
          onClick={() => setActiveTab("prefs")}
          className={`flex items-center justify-center gap-2 flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "prefs"
              ? "bg-white/10 text-white shadow-lg"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          {lang === "fa" ? "تنظیمات" : "Prefs"}
        </button>
        <button
          onClick={() => setActiveTab("notifs")}
          className={`flex items-center justify-center gap-2 flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "notifs"
              ? "bg-white/10 text-white shadow-lg"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          <Bell className="w-4 h-4" />
          {lang === "fa" ? "اعلان‌ها" : "Notifs"}
        </button>
        <button
          onClick={() => setActiveTab("sync")}
          className={`flex items-center justify-center gap-2 flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "sync"
              ? "bg-white/10 text-white shadow-lg"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {lang === "fa" ? "همگام‌سازی" : "Sync"}
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="glass glow-dual p-5 lg:p-6 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold">
                    {lang === "fa" ? "حساب کاربری و همگام‌سازی ابری" : "Account & Sync"}
                  </h2>
                </div>
                <p className="text-sm text-[color:var(--aura-fg-muted)] leading-relaxed">
                  {lang === "fa"
                    ? "شما هم‌اکنون به صورت محلی در حال استفاده از برنامه هستید. برای ذخیره داده‌ها در فضای ابری (Supabase)، با حساب گوگل خود وارد شوید."
                    : "You are currently using the app in local-first mode. Sign in to sync your profile and logs to the cloud."}
                </p>

                <div className="pt-4 border-t border-white/5">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                            {lang === "fa" ? "متصل شده" : "Connected"}
                          </div>
                          <div className="text-sm text-white truncate">{user.email}</div>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition"
                        >
                          {lang === "fa" ? "خروج" : "Sign Out"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleGoogleLogin}
                        className="w-full glass px-4 py-3 text-sm hover:bg-white/[0.05] transition flex items-center justify-center gap-2 rounded-xl"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12 5c1.6 0 3 .6 4.1 1.5l3-3C17.2 1.7 14.8.7 12 .7 7.4.7 3.4 3.4 1.5 7.3l3.5 2.7C6 7.3 8.7 5 12 5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.3 12.3c0-.8-.1-1.5-.2-2.3H12v4.5h6.4c-.3 1.5-1.1 2.7-2.4 3.5l3.7 2.9c2.2-2 3.6-5 3.6-8.6z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.5.4-2.3L1.5 7C.6 8.5.1 10.2.1 12s.5 3.5 1.4 5l3.5-2.7z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23.3c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.1-4.1 1.1-3.3 0-6.1-2.3-7-5.3L1.5 16C3.4 20 7.4 23.3 12 23.3z"
                          />
                        </svg>
                        {lang === "fa" ? "ورود با حساب گوگل" : "Sign in with Google"}
                      </button>

                      <div className="mt-6 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--aura-fg-muted)] mb-2">
                          {lang === "fa" ? "راهنمای اتصال ابری" : "Cloud Sync Guide"}
                        </h3>
                        <div className="grid gap-2 text-xs">
                          <div className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold font-mono">
                              1
                            </div>
                            <div className="text-[color:var(--aura-fg)]">
                              {lang === "fa"
                                ? "روی دکمه ورود کلیک کنید و حساب گوگل خود را انتخاب نمایید."
                                : "Click the sign in button and select your Google account."}
                            </div>
                          </div>
                          <div className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                              2
                            </div>
                            <div className="text-[color:var(--aura-fg)]">
                              {lang === "fa"
                                ? "پس از ورود، داده‌های محلی شما (قد، وزن، تنظیمات) به طور خودکار به فضای ابری منتقل می‌شوند."
                                : "Upon login, your local data (height, weight, preferences) will automatically merge to the cloud."}
                            </div>
                          </div>
                          <div className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold font-mono">
                              3
                            </div>
                            <div className="text-[color:var(--aura-fg)]">
                              {lang === "fa"
                                ? "از این پس با هر دستگاه دیگری وارد شوید، گزارش‌ها و پیشرفت‌هایتان همیشه در دسترس خواهند بود."
                                : "Log in from any device moving forward to instantly access your logs, streaks, and progress."}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Admin setup guide — only shows if OAuth not yet configured */}
                      <div className="mt-4 p-4 rounded-xl bg-amber-500/[0.03] border border-amber-500/10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                            {lang === "fa"
                              ? "تنظیمات اولیه (فقط برای مدیر)"
                              : "Initial Setup (Admin Only)"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[color:var(--aura-fg-muted)] leading-relaxed mb-3">
                          {lang === "fa"
                            ? "اگر ورود با گوگل کار نکرد، احتمالاً کلیدهای OAuth در Supabase تنظیم نشده‌اند. مراحل زیر را دنبال کنید:"
                            : "If Google sign-in doesn't work, OAuth credentials may not be configured yet. Follow these steps:"}
                        </p>
                        <div className="space-y-2.5 text-[11px]">
                          {/* Step A */}
                          <div className="flex gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="shrink-0 font-bold text-amber-400 font-mono">A</span>
                            <div className="text-[color:var(--aura-fg)] leading-relaxed space-y-1.5">
                              <div>
                                <span className="font-semibold text-white">
                                  {lang === "fa" ? "Google Cloud Console" : "Google Cloud Console"}:
                                </span>{" "}
                                {lang === "fa" ? "به" : "Go to"}{" "}
                                <code className="px-1 py-0.5 rounded bg-white/10 text-amber-300 font-mono text-[10px]">
                                  console.cloud.google.com
                                </code>{" "}
                                →{" "}
                                {lang === "fa"
                                  ? "ایجاد پروژه جدید یا انتخاب پروژه موجود"
                                  : "Create or select a project"}
                              </div>
                              <div className="pl-3 border-s border-white/10 text-[color:var(--aura-fg-muted)]">
                                {lang === "fa"
                                  ? "⚠️ ابتدا باید OAuth Consent Screen را تنظیم کنید: APIs & Services → OAuth consent screen → User Type: External → Fill in app name, support email, developer email → Save & Continue"
                                  : "⚠️ First configure OAuth Consent Screen: APIs & Services → OAuth consent screen → User Type: External → Fill app name, support email, developer email → Save & Continue"}
                              </div>
                              <div>
                                {lang === "fa"
                                  ? "سپس: APIs & Services → Credentials → Create Credentials → OAuth client ID"
                                  : "Then: APIs & Services → Credentials → Create Credentials → OAuth client ID"}
                              </div>
                            </div>
                          </div>
                          {/* Step B */}
                          <div className="flex gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="shrink-0 font-bold text-amber-400 font-mono">B</span>
                            <div className="text-[color:var(--aura-fg)] leading-relaxed">
                              {lang === "fa"
                                ? "نوع اپلیکیشن را Web Application انتخاب کنید. در بخش"
                                : "Select Web Application as type. In the"}{" "}
                              <span className="font-semibold text-white">
                                {lang === "fa"
                                  ? "Authorized redirect URIs"
                                  : "Authorized redirect URIs"}
                              </span>{" "}
                              {lang === "fa" ? "این آدرس را اضافه کنید:" : "add this URL:"}
                              <br />
                              <code className="mt-1 block px-2 py-1 rounded bg-white/10 text-emerald-300 font-mono text-[10px] break-all select-all">
                                https://pbiegxywqgeezdqryfvx.supabase.co/auth/v1/callback
                              </code>
                            </div>
                          </div>
                          {/* Step C */}
                          <div className="flex gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="shrink-0 font-bold text-amber-400 font-mono">C</span>
                            <div className="text-[color:var(--aura-fg)] leading-relaxed">
                              {lang === "fa"
                                ? "ب پس از ساخت، دو مقدار دریافت می‌کنید:"
                                : "After creation you'll get two values:"}
                              <br />
                              <span className="mt-1 inline-flex flex-wrap gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">
                                  Client ID
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-pink-300 font-mono text-[10px]">
                                  Client Secret
                                </span>
                              </span>
                              {lang === "fa" ? " — هر دو را کپی کنید." : " — copy both of them."}
                            </div>
                          </div>
                          {/* Step D */}
                          <div className="flex gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="shrink-0 font-bold text-amber-400 font-mono">D</span>
                            <div className="text-[color:var(--aura-fg)] leading-relaxed">
                              <span className="font-semibold text-white">
                                {lang === "fa" ? "داشبورد Supabase" : "Supabase Dashboard"}:
                              </span>{" "}
                              {lang === "fa" ? "به" : "Go to"}{" "}
                              <code className="px-1 py-0.5 rounded bg-white/10 text-amber-300 font-mono text-[10px]">
                                supabase.com/dashboard
                              </code>{" "}
                              →{" "}
                              {lang === "fa"
                                ? "پروژه pbiegxywqgeezdqryfvx → Authentication → Providers → Google را باز کنید → Client ID و Client Secret را در فیلدهای مربوطه Paste کنید → Save"
                                : "Open project pbiegxywqgeezdqryfvx → Authentication → Providers → Google → paste the Client ID and Client Secret into their fields → Save"}
                            </div>
                          </div>
                          {/* Step E */}
                          <div className="flex gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="shrink-0 font-bold text-amber-400 font-mono">E</span>
                            <div className="text-[color:var(--aura-fg)] leading-relaxed">
                              <span className="font-semibold text-white">
                                {lang === "fa" ? "اضافه کردن Redirect URL" : "Add Redirect URL"}:
                              </span>{" "}
                              {lang === "fa"
                                ? "در همان داشبورد، به Authentication → URL Configuration بروید و این آدرس را به لیست Redirect URLs اضافه کنید:"
                                : "In the same dashboard, go to Authentication → URL Configuration and add this URL to the Redirect URLs list:"}
                              <br />
                              <code className="mt-1 block px-2 py-1 rounded bg-white/10 text-emerald-300 font-mono text-[10px] break-all select-all">
                                https://amirmahdifarjadi.me/health-agent/
                              </code>
                            </div>
                          </div>
                          {/* Step F — Troubleshooting */}
                          <div className="flex gap-2.5 p-2.5 rounded-lg bg-red-500/[0.04] border border-red-500/15">
                            <span className="shrink-0 font-bold text-red-400 font-mono">F</span>
                            <div className="text-[color:var(--aura-fg)] leading-relaxed space-y-1">
                              <div className="font-semibold text-white">
                                {lang === "fa" ? "عیب‌یابی" : "Troubleshooting"}:
                              </div>
                              <div className="text-[color:var(--aura-fg-muted)]">
                                {lang === "fa"
                                  ? "• خطای 400 redirect_uri_mismatch → URL کال‌بک در Google Cloud اعمال نشده. ۵ دقیقه صبر کنید و دوباره امتحان کنید."
                                  : "• Error 400 redirect_uri_mismatch → callback URL not propagated in Google Cloud. Wait 5 mins and retry."}
                              </div>
                              <div className="text-[color:var(--aura-fg-muted)]">
                                {lang === "fa"
                                  ? "• خطای Unsupported provider → Supabase Dashboard → Google provider را فعال کنید و Client ID/Secret را وارد کنید."
                                  : "• Error Unsupported provider → Enable Google provider in Supabase Dashboard and enter Client ID/Secret."}
                              </div>
                              <div className="text-[color:var(--aura-fg-muted)]">
                                {lang === "fa"
                                  ? "• خطای Email not confirmed → Google consent screen Publishing status را روی Testing بگذارید و ایمیل خود را در Test users اضافه کنید."
                                  : "• Error Email not confirmed → Set Google consent screen Publishing status to Testing and add your email to Test users."}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "ai" && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="glass glow-dual p-5 lg:p-6 rounded-[2rem]">
                <ConnectionPanel />
              </div>
            </motion.div>
          )}

          {activeTab === "prefs" && (
            <motion.div
              key="prefs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="glass glow-dual p-5 lg:p-6 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold">
                    {lang === "fa" ? "تنظیمات دستگاه" : "Device Preferences"}
                  </h2>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-sm font-medium">
                      {lang === "fa" ? "زبان برنامه" : "App Language"}
                    </span>
                    <LanguageToggle />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-sm font-medium">
                      {lang === "fa" ? "پوسته ظاهری" : "App Theme"}
                    </span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              <div className="glass glow-dual p-5 lg:p-6 rounded-[2rem]">
                <DataManagement lang={lang} />
              </div>
            </motion.div>
          )}

          {activeTab === "notifs" && (
            <motion.div
              key="notifs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <NotificationSettings />
            </motion.div>
          )}

          {activeTab === "sync" && (
            <motion.div
              key="sync"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="glass glow-dual p-5 lg:p-6 rounded-[2rem]">
                <SyncHub />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
