import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/coach")({
  component: CoachPage,
});

function CoachPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-2rem)] lg:h-screen w-full flex flex-col overflow-hidden"
    >
      <ChatPanel />
    </motion.div>
  );
}
