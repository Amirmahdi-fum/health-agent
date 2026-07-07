import { useState } from "react";
import { Plus } from "lucide-react";
import { LogModal } from "./LogModal";
import { motion, AnimatePresence } from "framer-motion";

export function LogFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            onClick={() => setOpen(true)}
            aria-label="Add log"
            className="fixed h-14 w-14 rounded-full grid place-items-center shadow-2xl z-[100] right-6 lg:right-8 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:bottom-8"
            style={{
              background:
                "radial-gradient(120% 100% at 0% 0%, rgba(94,106,210,0.95), rgba(16,185,129,0.95))",
              boxShadow:
                "0 12px 40px -8px rgba(94,106,210,0.55), 0 0 0 1px rgba(255,255,255,0.12) inset",
            }}
          >
            <Plus className="h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
      {open && <LogModal onClose={() => setOpen(false)} />}
    </>
  );
}
