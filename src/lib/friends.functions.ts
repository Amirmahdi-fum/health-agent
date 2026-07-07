import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyFriendCode = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("friend_code, privacy")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const listFriends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("friends")
      .select("friend_id, created_at")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((r: { friend_id: string }) => r.friend_id);
    if (!ids.length) return [];
    const { data: rows, error: err2 } = await context.supabase.rpc("friend_weekly_summary", {
      _user_ids: ids,
    });
    if (err2) throw new Error(err2.message);
    return rows ?? [];
  });

export const addFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ code: z.string().min(4).max(16) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: found, error } = await context.supabase.rpc("find_profile_by_code", {
      _code: data.code.trim().toUpperCase(),
    });
    if (error) throw new Error(error.message);
    const target = (found ?? [])[0];
    if (!target) throw new Error("Friend code not found");
    if (target.id === context.userId) throw new Error("That's you");
    const { error: insErr } = await context.supabase.from("friends").insert([
      { user_id: context.userId, friend_id: target.id },
      { user_id: target.id, friend_id: context.userId },
    ]);
    if (insErr && !String(insErr.message).includes("duplicate")) throw new Error(insErr.message);
    return { ok: true, friend: target };
  });

export const removeFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ friendId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("friends")
      .delete()
      .eq("user_id", context.userId)
      .eq("friend_id", data.friendId);
    await context.supabase
      .from("friends")
      .delete()
      .eq("user_id", data.friendId)
      .eq("friend_id", context.userId);
    return { ok: true };
  });

export const setPrivacy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({
        hideWeight: z.boolean().optional(),
        hideCardio: z.boolean().optional(),
        hideStreak: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: cur } = await context.supabase
      .from("profiles")
      .select("privacy")
      .eq("id", context.userId)
      .maybeSingle();
    const merged = { ...((cur?.privacy as Record<string, unknown>) ?? {}), ...data };
    const { data: row, error } = await context.supabase
      .from("profiles")
      .update({ privacy: merged })
      .eq("id", context.userId)
      .select("privacy")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
