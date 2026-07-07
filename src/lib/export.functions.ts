import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function exportAllData() {
  const user = await getCurrentUser();
  const [profile, logs, sync, stats, friends] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("daily_logs").select("*").eq("user_id", user.id).order("logged_at"),
    supabase.from("device_sync").select("*").eq("user_id", user.id).order("synced_at"),
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("friends").select("*").eq("user_id", user.id),
  ]);
  return {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    user_stats: stats.data,
    daily_logs: logs.data ?? [],
    device_sync: sync.data ?? [],
    friends: friends.data ?? [],
  };
}

export async function resetAccount(input: { data: { confirm: string } }) {
  const { confirm } = z.object({ confirm: z.string() }).parse(input.data);
  if (confirm !== "DELETE" && confirm !== "حذف") {
    throw new Error("Confirmation phrase does not match");
  }
  const user = await getCurrentUser();
  await supabase.from("daily_logs").delete().eq("user_id", user.id);
  await supabase.from("device_sync").delete().eq("user_id", user.id);
  await supabase.from("friends").delete().eq("user_id", user.id);
  await supabase.from("friends").delete().eq("friend_id", user.id);
  await supabase
    .from("user_stats")
    .update({
      xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      unlocked_badges: [],
    })
    .eq("user_id", user.id);
  await supabase
    .from("profiles")
    .update({
      biometrics: {},
      active_modules: { cardio: true, recovery: true, strength: true, nutrition: true },
      privacy: { hideWeight: false, hideCardio: false, hideStreak: false },
    })
    .eq("id", user.id);
  return { ok: true };
}
