import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const exportAllData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, logs, sync, stats, friends] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("daily_logs").select("*").eq("user_id", userId).order("logged_at"),
      supabase.from("device_sync").select("*").eq("user_id", userId).order("synced_at"),
      supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("friends").select("*").eq("user_id", userId),
    ]);
    return {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      user_stats: stats.data,
      daily_logs: logs.data ?? [],
      device_sync: sync.data ?? [],
      friends: friends.data ?? [],
    };
  });

export const resetAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ confirm: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.confirm !== "DELETE" && data.confirm !== "حذف") {
      throw new Error("Confirmation phrase does not match");
    }
    const { supabase, userId } = context;
    await supabase.from("daily_logs").delete().eq("user_id", userId);
    await supabase.from("device_sync").delete().eq("user_id", userId);
    await supabase.from("friends").delete().eq("user_id", userId);
    await supabase.from("friends").delete().eq("friend_id", userId);
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
      .eq("user_id", userId);
    await supabase
      .from("profiles")
      .update({
        biometrics: {},
        active_modules: { cardio: true, recovery: true, strength: true, nutrition: true },
        privacy: { hideWeight: false, hideCardio: false, hideStreak: false },
      })
      .eq("id", userId);
    return { ok: true };
  });
