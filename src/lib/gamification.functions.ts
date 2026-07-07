import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp, BADGES } from "@/lib/badges";

type StatsRow = {
  user_id: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  unlocked_badges: string[];
};

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

async function ensureRow(supabase: SupabaseClient, userId: string): Promise<StatsRow> {
  const { data, error: selectError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (selectError) throw new Error(selectError.message);
  if (data) return { ...data, unlocked_badges: (data.unlocked_badges as string[]) ?? [] };
  const seed = {
    user_id: userId,
    xp: 0,
    level: 1,
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    unlocked_badges: [] as string[],
  };
  const { data: inserted, error: insertError } = await supabase
    .from("user_stats")
    .insert(seed)
    .select("*")
    .single();
  if (!insertError && inserted)
    return { ...inserted, unlocked_badges: (inserted.unlocked_badges as string[]) ?? [] };

  const duplicate =
    insertError?.code === "23505" ||
    String(insertError?.message ?? "")
      .toLowerCase()
      .includes("duplicate");
  if (!duplicate && insertError) throw new Error(insertError.message);

  const { data: raced, error: racedError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (racedError) throw new Error(racedError.message);
  return { ...raced, unlocked_badges: (raced.unlocked_badges as string[]) ?? [] };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + "T00:00:00Z").getTime();
  const d2 = new Date(b + "T00:00:00Z").getTime();
  return Math.round((d2 - d1) / 86400000);
}

export async function getStats() {
  const user = await getCurrentUser();
  return ensureRow(supabase, user.id);
}

const awardSchema = z.object({
  xp: z.number().int().min(0).max(500),
  activity: z.string(),
});

export async function awardXp(input: { data: z.infer<typeof awardSchema> }) {
  const data = awardSchema.parse(input.data);
  const user = await getCurrentUser();
  const row = await ensureRow(supabase, user.id);
  const today = todayISO();

  let currentStreak = row.current_streak;
  let longestStreak = row.longest_streak;
  if (row.last_activity_date !== today) {
    const diff = row.last_activity_date ? daysBetween(row.last_activity_date, today) : Infinity;
    if (diff === 1) currentStreak += 1;
    else if (diff > 1) currentStreak = 1;
    else currentStreak = Math.max(1, currentStreak);
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  const newXp = row.xp + data.xp;
  const { level } = levelFromXp(newXp);

  const unlocked = new Set(row.unlocked_badges);
  unlocked.add("first_log");
  if (currentStreak >= 7) unlocked.add("streak_7");
  if (currentStreak >= 30) unlocked.add("streak_30");
  if (level >= 5) unlocked.add("level_5");
  if (level >= 10) unlocked.add("level_10");

  const badgeIds = Array.from(unlocked).filter((id) => BADGES.some((b) => b.id === id));
  const newlyUnlocked = badgeIds.filter((id) => !row.unlocked_badges.includes(id));

  const { data: updated, error } = await supabase
    .from("user_stats")
    .update({
      xp: newXp,
      level,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      unlocked_badges: badgeIds,
    })
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { stats: updated, newlyUnlocked };
}

export async function unlockBadge(input: { data: { badgeId: string } }) {
  const { badgeId } = z.object({ badgeId: z.string() }).parse(input.data);
  const user = await getCurrentUser();
  const row = await ensureRow(supabase, user.id);
  if (row.unlocked_badges.includes(badgeId)) return row;
  const updated = [...row.unlocked_badges, badgeId];
  await supabase
    .from("user_stats")
    .update({ unlocked_badges: updated })
    .eq("user_id", user.id);
  return { ...row, unlocked_badges: updated };
}
