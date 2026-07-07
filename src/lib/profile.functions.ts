import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => patchSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { name, avatar_id, ...biometrics } = data;
    const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: userId,
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
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { name, ...biometrics } = data;
    const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: userId,
      display_name: name,
      biometrics: biometrics as unknown as Json,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({}).parse(data ?? {}))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
