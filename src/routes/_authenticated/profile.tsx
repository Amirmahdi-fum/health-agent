import { createFileRoute } from "@tanstack/react-router";
import { HeroProfile } from "@/components/profile/HeroProfile";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6"
    >
      <HeroProfile />
    </motion.div>
  );
}
