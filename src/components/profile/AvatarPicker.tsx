import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/stores/profile";
import { useT } from "@/lib/i18n";
import { X } from "lucide-react";

export const AVATAR_GRADIENTS: string[] = [
  "from-[#5e6ad2] to-[#10b981]",
  "from-[#8b5cf6] to-[#ec4899]",
  "from-[#f59e0b] to-[#ef4444]",
  "from-[#06b6d4] to-[#3b82f6]",
  "from-[#10b981] to-[#eab308]",
  "from-[#6366f1] to-[#0ea5e9]",
  "from-[#f43f5e] to-[#8b5cf6]",
  "from-[#22d3ee] to-[#a855f7]",
  "from-[#84cc16] to-[#0d9488]",
  "from-[#fb923c] to-[#db2777]",
  "from-[#0f172a] to-[#5e6ad2]",
  "from-[#f472b6] to-[#facc15]",
];

export function Avatar({ id, size = 40 }: { id: number; size?: number }) {
  const g = AVATAR_GRADIENTS[(id - 1) % 12];
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${g} shrink-0`}
      style={{ width: size, height: size }}
    />
  );
}

export function AvatarPicker({ current }: { current?: number }) {
  const [open, setOpen] = useState(false);
  const { profile, update } = useProfile();
  const { lang } = useT();

  const activeId = current ?? profile.avatarId ?? 1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-full cursor-pointer hover:opacity-90 transition active:scale-95"
      >
        <Avatar id={activeId} size={96} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed z-50 inset-x-4 top-[12%] mx-auto max-w-sm glass p-5 rounded-3xl border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold">
                  {lang === "fa" ? "انتخاب آواتار" : "Choose Avatar"}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 grid place-items-center rounded-full hover:bg-white/[0.06] transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_GRADIENTS.map((_, i) => {
                  const id = i + 1;
                  const active = id === activeId;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        update({ avatarId: id });
                        setOpen(false);
                      }}
                      className={`p-1 rounded-full transition ${
                        active
                          ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#07080a] scale-105 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                          : "hover:scale-105 opacity-80 hover:opacity-100 ring-1 ring-white/10"
                      }`}
                    >
                      <Avatar id={id} size={56} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
