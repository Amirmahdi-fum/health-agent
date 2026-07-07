import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Database, Json } from "@/integrations/supabase/types";

export const profileSchema = z.object({
  name: z.string().default(""),
  bio: z.string().default(""),
  age: z.number().default(0),
  gender: z.string().default("male"),
  heightCm: z.number().default(0),
  weightKg: z.number().default(0),
  targetWeightKg: z.number().default(0),
  waistCm: z.number().default(0),
  neckCm: z.number().default(0),
  hipCm: z.number().default(0),
  activity: z.string().default("moderate"),
  diseases: z.string().default(""),
  joints: z.string().default(""),
  medications: z.string().default(""),
});

export type ProfilePayload = ReturnType<typeof profileSchema.parse>;

const patchSchema = profileSchema.partial().extend({
  avatar_id: z.number().optional(),
});

/**
 * Partially update the current user's profile row.
 * Client-side replacement for the TanStack Start createServerFn version.
 *
 * Callers invoke this as `updateProfile({ data: { ...patch } })`.
 */
export async function updateProfile({
  data,
}: {
  data: z.infer<typeof patchSchema>;
}): Promise<{ ok: true }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const parsed = patchSchema.parse(data);
  const { name, avatar_id, ...biometrics } = parsed;
  const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };
  if (name !== undefined) payload.display_name = name;
  if (avatar_id !== undefined) payload.avatar_id = avatar_id;
  if (Object.keys(biometrics).length > 0) {
    payload.biometrics = biometrics as unknown as Json;
  }

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

/**
 * Upsert the current user's full profile.
 * Client-side replacement for the TanStack Start createServerFn version.
 *
 * Callers invoke this as `upsertProfile({ data: profile })`.
 */
export async function upsertProfile({
  data,
}: {
  data: z.infer<typeof profileSchema>;
}): Promise<{ ok: true }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const parsed = profileSchema.parse(data);
  const { name, ...biometrics } = parsed;
  const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    display_name: name,
    biometrics: biometrics as unknown as Json,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

/**
 * Fetch the current user's profile row.
 * Client-side replacement for the TanStack Start createServerFn version.
 *
 * Callers invoke this as `getProfile()` or `getProfile({ data: {} })`.
 */
export async function getProfile(_arg?: {
  data?: Record<string, unknown>;
}): Promise<Database["public"]["Tables"]["profiles"]["Row"] | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const { data: row, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return row as Database["public"]["Tables"]["profiles"]["Row"] | null;
}
