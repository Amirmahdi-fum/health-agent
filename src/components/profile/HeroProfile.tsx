import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  QrCode,
  Pencil,
  Check,
  Users,
  ChevronLeft,
  Palette,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/stores/profile";
import { useT } from "@/lib/i18n";
import { AvatarPicker, AVATAR_GRADIENTS } from "./AvatarPicker";
import { HealthScore } from "./HealthScore";
import { BalanceRadar } from "./BalanceRadar";
import { BiometricCards } from "@/components/dashboard/BiometricCards";
import { ProfileWizard } from "./ProfileWizard";
import { BADGES } from "@/lib/badges";

type Tab = "identity" | "biometrics" | "achievements";

// ── Cover Themes ──────────────────────────────────────────────
const COVER_THEMES = [
  {
    id: "aurora",
    label: "Aurora Dusk",
    bg: "radial-gradient(120% 100% at 0% 0%, rgba(94,106,210,0.35), transparent 60%), radial-gradient(120% 100% at 100% 100%, rgba(16,185,129,0.32), transparent 60%), linear-gradient(135deg, #0b0c11, #07080a)",
    meshBg:
      "radial-gradient(circle at 20% 30%, rgba(94,106,210,0.35), transparent 25%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.35), transparent 30%)",
    thumb: "from-[#5e6ad2] to-[#10b981]",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    bg: "radial-gradient(120% 100% at 0% 0%, rgba(139,92,246,0.35), transparent 60%), radial-gradient(120% 100% at 100% 100%, rgba(6,182,212,0.32), transparent 60%), linear-gradient(135deg, #120a1e, #06121a)",
    meshBg:
      "radial-gradient(circle at 20% 30%, rgba(139,92,246,0.35), transparent 25%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.35), transparent 30%)",
    thumb: "from-[#8b5cf6] to-[#06b6d4]",
  },
  {
    id: "amber",
    label: "Midnight Amber",
    bg: "radial-gradient(120% 100% at 0% 0%, rgba(245,158,11,0.30), transparent 60%), radial-gradient(120% 100% at 100% 100%, rgba(239,68,68,0.22), transparent 60%), linear-gradient(135deg, #140d05, #140505)",
    meshBg:
      "radial-gradient(circle at 20% 30%, rgba(245,158,11,0.30), transparent 25%), radial-gradient(circle at 80% 70%, rgba(239,68,68,0.30), transparent 30%)",
    thumb: "from-[#f59e0b] to-[#ef4444]",
  },
  {
    id: "crimson",
    label: "Crimson Nova",
    bg: "radial-gradient(120% 100% at 0% 0%, rgba(244,63,94,0.30), transparent 60%), radial-gradient(120% 100% at 100% 100%, rgba(168,85,247,0.30), transparent 60%), linear-gradient(135deg, #14060d, #07040a)",
    meshBg:
      "radial-gradient(circle at 20% 30%, rgba(244,63,94,0.30), transparent 25%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.30), transparent 30%)",
    thumb: "from-[#f43f5e] to-[#a855f7]",
  },
  {
    id: "void",
    label: "Dark Matter",
    bg: "radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.04), transparent 60%), linear-gradient(135deg, #000, #050505, #0a0a0a)",
    meshBg:
      "radial-gradient(circle at 40% 60%, rgba(255,255,255,0.03), transparent 50%)",
    thumb: "from-[#1a1a2e] to-[#16213e]",
  },
  {
    id: "ocean",
    label: "Deep Ocean",
    bg: "radial-gradient(120% 100% at 0% 0%, rgba(6,182,212,0.25), transparent 60%), radial-gradient(120% 100% at 100% 100%, rgba(16,185,129,0.25), transparent 60%), linear-gradient(135deg, #020f14, #020a0f)",
    meshBg:
      "radial-gradient(circle at 30% 40%, rgba(6,182,212,0.25), transparent 30%), radial-gradient(circle at 70% 60%, rgba(16,185,129,0.25), transparent 30%)",
    thumb: "from-[#06b6d4] to-[#10b981]",
  },
];

// ── Accent Colors ─────────────────────────────────────────────
const ACCENT_COLORS = [
  { id: "indigo", hex: "#5e6ad2" },
  { id: "emerald", hex: "#10b981" },
  { id: "purple", hex: "#a855f7" },
  { id: "rose", hex: "#f43f5e" },
  { id: "amber", hex: "#f59e0b" },
  { id: "cyan", hex: "#06b6d4" },
  { id: "pink", hex: "#ec4899" },
  { id: "lime", hex: "#84cc16" },
];

// ── Avatar Frames ────────────────────────────────────────────
const AVATAR_FRAMES = [
  { id: "neon", label: "Neon", ring: "ring-emerald-400/50" },
  { id: "gold", label: "Gold", ring: "ring-amber-400/50" },
  { id: "cyber", label: "Cyber", ring: "ring-purple-400/50" },
  { id: "crystal", label: "Crystal", ring: "ring-cyan-300/40" },
  { id: "rose", label: "Rose", ring: "ring-pink-400/50" },
  { id: "classic", label: "Classic", ring: "ring-[#07080a]" },
];

// ── Helpers ──────────────────────────────────────────────────
function slugFromName(name: string) {
  const base =
    name.trim().toLowerCase().replace(/\s+/g, "").slice(0, 16) || "spartan";
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return `${base}${(hash % 9000) + 1000}`;
}

function coverById(id?: string) {
  return COVER_THEMES.find((c) => c.id === id) ?? COVER_THEMES[0];
}

function accentById(id?: string) {
  return ACCENT_COLORS.find((c) => c.id === id) ?? ACCENT_COLORS[0];
}

function frameById(id?: string) {
  return AVATAR_FRAMES.find((f) => f.id === id) ?? AVATAR_FRAMES[0];
}

// ── Main Component ───────────────────────────────────────────
export function HeroProfile({
  joinDate,
  stats,
  publicView = false,
}: {
  joinDate?: string | null;
  stats?: { streak: number; xp: number; unlocked: string[] };
  publicView?: boolean;
}) {
  const { profile, update } = useProfile();
  const { t, lang, n } = useT();
  const [tab, setTab] = useState<Tab>("identity");
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const username = useMemo(
    () => profile.customUserId || slugFromName(profile.name),
    [profile.customUserId, profile.name]
  );

  const cover = useMemo(() => coverById(profile.coverId), [profile.coverId]);
  const accent = useMemo(
    () => accentById(profile.accentColor),
    [profile.accentColor],
  );
  const frame = useMemo(
    () => frameById(profile.avatarFrame),
    [profile.avatarFrame],
  );

  const joinedLabel = useMemo(() => {
    const d = joinDate ? new Date(joinDate) : new Date();
    if (lang === "fa") {
      const fmt = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        month: "long",
        year: "numeric",
      });
      return `${t("memberSince")} ${fmt.format(d)}`;
    }
    const fmt = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    });
    return `${t("memberSince")} ${fmt.format(d)}`;
  }, [joinDate, lang, t]);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${username}`;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(lang === "fa" ? "لینک پروفایل کپی شد" : "Profile link copied");
    } catch {
      toast.error(lang === "fa" ? "کپی ناموفق بود" : "Copy failed");
    }
  };

  const showQr = () => {
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(shareUrl)}&bgcolor=07080a&color=ffffff&qzone=2`;
    toast(lang === "fa" ? "QR پروفایل" : "Profile QR", {
      description: shareUrl,
      duration: 8000,
      icon: <img src={qr} alt="QR" className="h-20 w-20 rounded-lg" />,
    });
  };

  return (
    <div className="grid gap-5">
      {/* ── Hero cover ─────────────────────────────── */}
      <div className="relative">
        <div
          className="relative h-[220px] rounded-3xl overflow-hidden border border-white/[0.08]"
          style={{ background: cover.bg }}
        >
          {/* animated mesh dots */}
          <motion.div
            aria-hidden
            className="absolute inset-0 opacity-50"
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{
              duration: 18,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
            style={{
              backgroundImage: cover.meshBg,
              backgroundSize: "200% 200%",
            }}
          />

          {/* floating orbs */}
          <motion.div
            aria-hidden
            className="absolute top-6 start-8 h-16 w-16 rounded-full blur-2xl opacity-20"
            style={{ background: accent.hex }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            aria-hidden
            className="absolute bottom-6 end-12 h-12 w-12 rounded-full blur-2xl opacity-20"
            style={{ background: accent.hex }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5,
            }}
          />

          {/* Top-right actions */}
          {!publicView && (
            <div className="absolute top-3 end-3 flex items-center gap-2 z-10">
              <button
                onClick={share}
                className="backdrop-blur-xl bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 text-xs rounded-xl flex items-center gap-1.5 hover:bg-white/[0.12] transition active:scale-95"
              >
                <Share2 className="h-3.5 w-3.5" /> {t("share")}
              </button>
              <button
                onClick={showQr}
                className="backdrop-blur-xl bg-white/[0.06] border border-white/[0.08] h-8 w-8 grid place-items-center rounded-xl hover:bg-white/[0.12] transition active:scale-95"
                aria-label="QR"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCustomizerOpen(true)}
                className="backdrop-blur-xl bg-white/[0.06] border border-white/[0.08] h-8 w-8 grid place-items-center rounded-xl hover:bg-white/[0.12] transition active:scale-95"
                aria-label="Customize"
              >
                <Palette className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Avatar ────────────────────────────────── */}
        <div className="absolute -bottom-14 inset-x-0 flex justify-center">
          {publicView ? (
            <div
              className={`rounded-full ring-4 ring-offset-2 ring-offset-[#07080a] ${frame.ring}`}
            >
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#5e6ad2] to-[#10b981] border border-white/20" />
            </div>
          ) : (
            <div
              className={`rounded-full ring-4 ring-offset-2 ring-offset-[#07080a] transition-all duration-300 ${frame.ring}`}
            >
              <div className="h-24 w-24 rounded-full overflow-hidden">
                <AvatarPicker current={profile.avatarId} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Identity stack ──────────────────────────── */}
      <div className="mt-12 text-center grid gap-1">
        {editingName && !publicView ? (
          <input
            autoFocus
            defaultValue={profile.name}
            onBlur={(e) => {
              update({ name: e.target.value.trim() || profile.name });
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingName(false);
            }}
            className="mx-auto text-2xl font-bold bg-transparent text-center outline-none border-b-2 border-white/20 focus:border-[var(--accent)] max-w-xs transition-colors"
            style={{ "--accent": accent.hex } as React.CSSProperties}
          />
        ) : (
          <button
            disabled={publicView}
            onClick={() => setEditingName(true)}
            className="mx-auto text-2xl font-bold group inline-flex items-center gap-1.5"
          >
            {profile.name}
            {!publicView && (
              <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition" />
            )}
          </button>
        )}

        {editingUsername && !publicView ? (
          <div className="flex items-center justify-center gap-1 mx-auto max-w-[200px]">
            <span className="text-[color:var(--aura-fg-muted)] mono">@</span>
            <input
              autoFocus
              defaultValue={username}
              onBlur={(e) => {
                update({ customUserId: e.target.value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '') || "" });
                setEditingUsername(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingUsername(false);
              }}
              className="text-sm mono text-[color:var(--aura-fg-muted)] bg-transparent outline-none border-b border-white/20 focus:border-[var(--accent)] w-full transition-colors"
              style={{ "--accent": accent.hex } as React.CSSProperties}
            />
          </div>
        ) : (
          <button
            disabled={publicView}
            onClick={() => setEditingUsername(true)}
            className="mx-auto text-sm text-[color:var(--aura-fg-muted)] mono hover:text-white transition group inline-flex items-center gap-1"
          >
            @{username}
            {!publicView && (
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
            )}
          </button>
        )}

        {editingBio && !publicView ? (
          <div className="mx-auto max-w-md w-full mt-2 grid gap-2">
            <textarea
              autoFocus
              defaultValue={profile.bio}
              maxLength={140}
              rows={2}
              onBlur={(e) => {
                update({ bio: e.target.value });
                setEditingBio(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingBio(false);
              }}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
              style={{ "--accent": accent.hex } as React.CSSProperties}
              placeholder={lang === "fa" ? "درباره من…" : "About me…"}
            />
            <button
              onClick={() => setEditingBio(false)}
              className="inline-flex items-center justify-center gap-1 text-xs rounded-xl py-1.5 text-white transition active:scale-95"
              style={{
                backgroundColor: accent.hex,
              }}
            >
              <Check className="h-3 w-3" /> {t("save")}
            </button>
          </div>
        ) : (
          <button
            disabled={publicView}
            onClick={() => setEditingBio(true)}
            className="mx-auto max-w-md text-sm text-[color:var(--aura-fg-muted)] hover:text-white transition mt-1"
          >
            {profile.bio ||
              (publicView
                ? ""
                : lang === "fa"
                  ? "افزودن بیوگرافی…"
                  : "Add a bio…")}
          </button>
        )}

        <div className="text-xs text-[color:var(--aura-fg-dim)] mt-1 flex items-center justify-center gap-1.5">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: accent.hex }}
          />
          {joinedLabel}
        </div>
      </div>

      {/* ── Health Score ────────────────────────────── */}
      <HealthScore streak={stats?.streak ?? 0} xp={stats?.xp ?? 0} />

      {/* ── Tabs ────────────────────────────────────── */}
      <div className="relative glass p-1 flex items-center gap-1 self-center">
        {(
          [
            { k: "identity", label: t("identity") },
            { k: "biometrics", label: t("biometrics") },
            { k: "achievements", label: t("achievements") },
          ] as { k: Tab; label: string }[]
        ).map((it) => (
          <button
            key={it.k}
            onClick={() => setTab(it.k)}
            className={`relative px-4 py-2 text-sm rounded-xl transition ${
              tab === it.k
                ? "text-white"
                : "text-[color:var(--aura-fg-muted)] hover:text-white"
            }`}
          >
            {tab === it.k && (
              <motion.span
                layoutId="profile-tab-active"
                className="absolute inset-0 bg-white/[0.08] rounded-xl border border-white/10"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <span className="relative">{it.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab bodies ──────────────────────────────── */}
      {tab === "identity" && (
        <div className="grid gap-3">
          <div className="glass p-5 rounded-2xl border border-white/[0.06]">
            <div className="text-[11px] uppercase tracking-widest text-[color:var(--aura-fg-muted)] mb-2">
              {t("bio")}
            </div>
            <p className="text-sm text-[color:var(--aura-fg)] leading-relaxed">
              {profile.bio ||
                (lang === "fa"
                  ? "این کاربر هنوز بیوگرافی ثبت نکرده."
                  : "This user hasn't written a bio yet.")}
            </p>
          </div>
          {!publicView && (
            <Link
              to="/friends"
              className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/[0.05] transition group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-xl grid place-items-center"
                  style={{
                    backgroundColor: `${accent.hex}20`,
                    color: accent.hex,
                  }}
                >
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {lang === "fa" ? "دوستان" : "Friends"}
                  </div>
                  <div className="text-[11px] text-[color:var(--aura-fg-muted)]">
                    {lang === "fa"
                      ? "رقابت، اشتراک‌گذاری و پیگیری پیشرفت"
                      : "Compete, share and follow progress"}
                  </div>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 text-white/40 group-hover:text-white transition" />
            </Link>
          )}
        </div>
      )}

      {tab === "biometrics" && (
        <div className="grid gap-3">
          <BiometricCards />
          <BalanceRadar />
          {!publicView && <ProfileWizard />}
        </div>
      )}

      {tab === "achievements" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {BADGES.map((b) => {
            const unlocked = stats?.unlocked.includes(b.id) ?? false;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`relative aspect-square rounded-2xl p-3 grid place-items-center text-center overflow-hidden transition ${
                  unlocked
                    ? `bg-gradient-to-br ${b.gradient}`
                    : "bg-white/[0.03] border border-white/[0.06]"
                }`}
                style={
                  unlocked
                    ? { boxShadow: "0 8px 30px -10px rgba(0,0,0,0.6)" }
                    : undefined
                }
              >
                <div
                  className={`text-3xl ${
                    unlocked
                      ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      : "grayscale opacity-40"
                  }`}
                >
                  {b.emoji}
                </div>
                <div
                  className={`absolute inset-x-1 bottom-1.5 text-[9px] font-medium leading-tight ${
                    unlocked
                      ? "text-white"
                      : "text-[color:var(--aura-fg-muted)]"
                  }`}
                >
                  {b.name[lang]}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {publicView && (
        <div className="text-center text-xs text-[color:var(--aura-fg-muted)]">
          {lang === "fa"
            ? "نمای عمومی — فقط خواندنی"
            : "Public view — read-only"}{" "}
          · {n(0)}
        </div>
      )}

      {/* ── Customizer Panel ────────────────────────────── */}
      <AnimatePresence>
        {customizerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setCustomizerOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed z-50 inset-x-4 top-[8%] bottom-[8%] mx-auto max-w-lg overflow-y-auto glass rounded-3xl border border-white/[0.08] shadow-2xl p-6"
            >
              {/* header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold">
                    {lang === "fa" ? "شخصی‌سازی پروفایل" : "Profile Customizer"}
                  </span>
                </div>
                <button
                  onClick={() => setCustomizerOpen(false)}
                  className="h-7 w-7 grid place-items-center rounded-full hover:bg-white/[0.06] transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-6">
                {/* Cover themes */}
                <section>
                  <div className="text-[11px] uppercase tracking-widest text-[color:var(--aura-fg-muted)] mb-3">
                    {lang === "fa" ? "طرح کاور" : "Cover Theme"}
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {COVER_THEMES.map((c) => {
                      const active = profile.coverId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => update({ coverId: c.id })}
                          className={`relative aspect-[3/2] rounded-xl overflow-hidden border transition-all duration-200 ${
                            active
                              ? "border-white/40 ring-2 ring-offset-2 ring-offset-[#07080a] scale-[1.03]"
                              : "border-white/[0.06] hover:border-white/20 hover:scale-[1.02]"
                          }`}
                          style={{ background: c.bg }}
                        >
                          <div
                            className="absolute inset-0 opacity-40"
                            style={{
                              backgroundImage: c.meshBg,
                              backgroundSize: "200% 200%",
                            }}
                          />
                          <div className="absolute inset-x-1 bottom-1.5 text-[9px] font-medium text-white/80 text-center truncate">
                            {c.label}
                          </div>
                          {active && (
                            <div className="absolute top-1.5 end-1.5 h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Accent colors */}
                <section>
                  <div className="text-[11px] uppercase tracking-widest text-[color:var(--aura-fg-muted)] mb-3">
                    {lang === "fa" ? "رنگ شاخص" : "Accent Color"}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {ACCENT_COLORS.map((c) => {
                      const active = profile.accentColor === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => update({ accentColor: c.id })}
                          className={`h-9 w-9 rounded-full transition-all duration-200 ${
                            active
                              ? "scale-110 ring-2 ring-white/60 ring-offset-2 ring-offset-[#07080a]"
                              : "hover:scale-110 ring-1 ring-white/10"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          aria-label={c.id}
                        />
                      );
                    })}
                  </div>
                </section>

                {/* Avatar frames */}
                <section>
                  <div className="text-[11px] uppercase tracking-widest text-[color:var(--aura-fg-muted)] mb-3">
                    {lang === "fa" ? "قاب آواتار" : "Avatar Frame"}
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {AVATAR_FRAMES.map((f) => {
                      const active = profile.avatarFrame === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => update({ avatarFrame: f.id })}
                          className={`relative flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                            active
                              ? "border-white/40 bg-white/[0.06]"
                              : "border-white/[0.06] hover:border-white/20 hover:bg-white/[0.03]"
                          }`}
                        >
                          <div
                            className={`rounded-full ring-2 ring-offset-2 ring-offset-[#07080a] ${f.ring}`}
                          >
                            <div
                              className="h-10 w-10 rounded-full bg-gradient-to-br"
                              style={{
                                backgroundImage: `linear-gradient(135deg, ${accent.hex}, ${ACCENT_COLORS[(ACCENT_COLORS.findIndex(a => a.id === accent.id) + 3) % ACCENT_COLORS.length].hex})`,
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-[color:var(--aura-fg-muted)]">
                            {f.label}
                          </div>
                          {active && (
                            <div className="absolute top-1.5 end-1.5 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
