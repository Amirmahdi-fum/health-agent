import { useCoach } from "@/stores/coach";
import { PERSONAS, type PersonaKey } from "@/lib/personas";
import { useT } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function PersonaSelector() {
  const { persona, setConfig } = useCoach();
  const { lang } = useT();
  const keys = Object.keys(PERSONAS) as PersonaKey[];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {keys.map((k) => {
        const p = PERSONAS[k];
        const active = persona === k;
        return (
          <button
            key={k}
            onClick={() => setConfig({ persona: k })}
            className={`relative glass p-4 text-start transition ${active ? "border-2" : "border border-white/[0.06] hover:border-white/20"}`}
            style={
              active ? { borderColor: p.color, boxShadow: `0 0 24px -8px ${p.color}` } : undefined
            }
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">{p.emoji}</div>
              {active && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-6 w-6 rounded-full grid place-items-center"
                  style={{ background: p.color }}
                >
                  <Check className="h-3.5 w-3.5 text-white" />
                </motion.div>
              )}
            </div>
            <div className="text-sm font-semibold">{p.name[lang]}</div>
            <div className="text-[11px] text-[color:var(--aura-fg-muted)] mt-1 leading-relaxed">
              {p.desc[lang]}
            </div>
          </button>
        );
      })}
    </div>
  );
}
