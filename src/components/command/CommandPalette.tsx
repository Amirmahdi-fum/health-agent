import { Command } from "cmdk";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { usePalette } from "@/stores/palette";
import { useUI } from "@/stores/ui";
import { useCoach } from "@/stores/coach";
import { useMutation } from "@tanstack/react-query";
import { insertLog } from "@/lib/logs.functions";
import { awardXp } from "@/lib/gamification.functions";
import { toast } from "sonner";
import {
  Weight,
  Droplets,
  MessageSquare,
  Languages,
  Settings as SettingsIcon,
  LineChart,
  Users,
  Sparkles,
} from "lucide-react";

export function CommandPalette() {
  const { open, setOpen, toggle } = usePalette();
  const navigate = useNavigate();
  const { lang, toggleLang } = useUI();
  const coach = useCoach();
  const [value, setValue] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, setOpen]);

  useEffect(() => {
    if (!open) setValue("");
  }, [open]);

  const parsed = useMemo(() => {
    const v = value.trim();
    const m = v.match(/^(log\s+weight|log\s+water|chat)\s+(.+)$/i);
    if (m) return { cmd: m[1].toLowerCase().replace(/\s+/g, " "), arg: m[2] };
    return null;
  }, [value]);

  const logMut = useMutation({
    mutationFn: async (p: { type: "weight" | "water"; n: number }) => {
      if (p.type === "weight") await insertLog({ data: { type: "weight", payload: { kg: p.n } } });
      else await insertLog({ data: { type: "water", payload: { ml: p.n } } });
      await awardXp({ data: { xp: 5, activity: p.type } }).catch(() => {});
    },
  });

  const doLogWeight = async (kg: number) => {
    await logMut.mutateAsync({ type: "weight", n: kg });
    toast.success(lang === "fa" ? `وزن ثبت شد: ${kg}kg` : `Logged weight ${kg}kg`);
    setOpen(false);
  };
  const doLogWater = async (ml: number) => {
    await logMut.mutateAsync({ type: "water", n: ml });
    toast.success(lang === "fa" ? `آب ثبت شد: ${ml}ml` : `Logged water ${ml}ml`);
    setOpen(false);
  };
  const doChat = (msg: string) => {
    coach.push({ id: crypto.randomUUID(), role: "user", content: msg, ts: Date.now() });
    navigate({ to: "/coach" });
    setOpen(false);
  };

  const wKg = parsed && parsed.cmd === "log weight" ? Number(parsed.arg) : NaN;
  const wMl = parsed && parsed.cmd === "log water" ? Number(parsed.arg) : NaN;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-start pt-[10vh] px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="w-full max-w-xl glass rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="Command palette" className="[&_[cmdk-input]]:outline-none">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Sparkles className="h-4 w-4 text-[color:var(--aura-fg-muted)]" />
                <Command.Input
                  autoFocus
                  value={value}
                  onValueChange={setValue}
                  placeholder={
                    lang === "fa"
                      ? "دستور یا جستجو… (مثلا: Log Weight 70)"
                      : "Type a command or search… (e.g. Log Weight 70)"
                  }
                  className="flex-1 bg-transparent text-sm placeholder:text-[color:var(--aura-fg-muted)]"
                />
                <kbd className="mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-[color:var(--aura-fg-muted)]">
                  ESC
                </kbd>
              </div>
              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="text-sm text-[color:var(--aura-fg-muted)] p-4 text-center">
                  {lang === "fa" ? "چیزی پیدا نشد" : "No results"}
                </Command.Empty>

                {parsed?.cmd === "log weight" && !Number.isNaN(wKg) && wKg > 0 && (
                  <PaletteItem
                    icon={<Weight className="h-4 w-4" />}
                    onSelect={() => doLogWeight(wKg)}
                  >
                    {lang === "fa" ? `ثبت وزن ${wKg}kg` : `Log weight ${wKg}kg`}
                  </PaletteItem>
                )}
                {parsed?.cmd === "log water" && !Number.isNaN(wMl) && wMl > 0 && (
                  <PaletteItem
                    icon={<Droplets className="h-4 w-4" />}
                    onSelect={() => doLogWater(wMl)}
                  >
                    {lang === "fa" ? `ثبت آب ${wMl}ml` : `Log water ${wMl}ml`}
                  </PaletteItem>
                )}
                {parsed?.cmd === "chat" && parsed.arg && (
                  <PaletteItem
                    icon={<MessageSquare className="h-4 w-4" />}
                    onSelect={() => doChat(parsed.arg)}
                  >
                    {lang === "fa"
                      ? `ارسال به مربی: "${parsed.arg}"`
                      : `Send to Coach: "${parsed.arg}"`}
                  </PaletteItem>
                )}

                <Command.Group
                  heading={lang === "fa" ? "دستورات" : "Commands"}
                  className="text-[10px] uppercase tracking-wider text-[color:var(--aura-fg-muted)] px-2 pt-2"
                >
                  <PaletteItem
                    icon={<Weight className="h-4 w-4" />}
                    onSelect={() => setValue("Log Weight ")}
                  >
                    Log Weight [kg]
                  </PaletteItem>
                  <PaletteItem
                    icon={<Droplets className="h-4 w-4" />}
                    onSelect={() => setValue("Log Water ")}
                  >
                    Log Water [ml]
                  </PaletteItem>
                  <PaletteItem
                    icon={<MessageSquare className="h-4 w-4" />}
                    onSelect={() => setValue("Chat ")}
                  >
                    Chat [message]
                  </PaletteItem>
                  <PaletteItem
                    icon={<Languages className="h-4 w-4" />}
                    onSelect={() => {
                      toggleLang();
                      setOpen(false);
                    }}
                  >
                    {lang === "fa" ? "تغییر به English" : "Toggle Language (فارسی)"}
                  </PaletteItem>
                </Command.Group>

                <Command.Group
                  heading={lang === "fa" ? "پیمایش" : "Navigate"}
                  className="text-[10px] uppercase tracking-wider text-[color:var(--aura-fg-muted)] px-2 pt-2"
                >
                  <PaletteItem
                    icon={<LineChart className="h-4 w-4" />}
                    onSelect={() => {
                      navigate({ to: "/charts" });
                      setOpen(false);
                    }}
                  >
                    {lang === "fa" ? "نمودارهای پیشرفت" : "View Progress Charts"}
                  </PaletteItem>
                  <PaletteItem
                    icon={<Users className="h-4 w-4" />}
                    onSelect={() => {
                      navigate({ to: "/friends" });
                      setOpen(false);
                    }}
                  >
                    {lang === "fa" ? "دوستان" : "Friends & Leaderboard"}
                  </PaletteItem>
                  <PaletteItem
                    icon={<SettingsIcon className="h-4 w-4" />}
                    onSelect={() => {
                      navigate({ to: "/settings" });
                      setOpen(false);
                    }}
                  >
                    {lang === "fa" ? "تنظیمات" : "Open Settings"}
                  </PaletteItem>
                </Command.Group>

                {coach.getMessages().length > 0 && (
                  <Command.Group
                    heading={lang === "fa" ? "تاریخچه گفتگو" : "Conversation history"}
                    className="text-[10px] uppercase tracking-wider text-[color:var(--aura-fg-muted)] px-2 pt-2"
                  >
                    {coach
                      .getMessages()
                      .filter((m: any) => m.role === "user")
                      .slice(-8)
                      .reverse()
                      .map((m: any) => (
                        <PaletteItem
                          key={m.id}
                          icon={<MessageSquare className="h-4 w-4" />}
                          onSelect={() => {
                            navigate({ to: "/coach" });
                            setOpen(false);
                          }}
                        >
                          <span className="truncate">{m.content.slice(0, 60)}</span>
                        </PaletteItem>
                      ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PaletteItem({
  icon,
  children,
  onSelect,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm data-[selected=true]:bg-white/[0.06] text-white/90"
    >
      <span className="text-[color:var(--aura-fg-muted)]">{icon}</span>
      <span className="flex-1 min-w-0">{children}</span>
    </Command.Item>
  );
}
