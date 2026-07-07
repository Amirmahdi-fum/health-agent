import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const syncSchema = z.object({
  source: z.enum(["apple", "google", "mock"]),
  metric: z.enum(["steps", "floors", "sleep"]),
  value: z.record(z.any()),
});

export const recordSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ entries: z.array(syncSchema) }).parse(data))
  .handler(async ({ data, context }) => {
    const rows = data.entries.map((e) => ({ ...e, user_id: context.userId }));
    const { error } = await context.supabase.from("device_sync").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true, count: rows.length };
  });

export const latestSync = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("device_sync")
      .select("*")
      .eq("user_id", context.userId)
      .order("synced_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
