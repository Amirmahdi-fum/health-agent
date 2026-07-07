import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

const syncSchema = z.object({
  source: z.enum(["apple", "google", "mock"]),
  metric: z.enum(["steps", "floors", "sleep"]),
  value: z.record(z.any()),
});

const recordSyncInput = z.object({ entries: z.array(syncSchema) });

/**
 * Record a batch of health-sync entries into the `device_sync` table.
 * Client-side replacement for the TanStack Start createServerFn version.
 *
 * Callers invoke this as `recordSync({ data: { entries } })` to preserve
 * the original server-fn call signature.
 */
export async function recordSync({
  data,
}: {
  data: z.infer<typeof recordSyncInput>;
}): Promise<{ ok: true; count: number }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const parsed = recordSyncInput.parse(data);
  const rows = parsed.entries.map((e) => ({ ...e, user_id: user.id }));
  const { error } = await supabase.from("device_sync").insert(rows);
  if (error) throw new Error(error.message);
  return { ok: true, count: rows.length };
}

/**
 * Fetch the most recent sync rows for the current user.
 * Client-side replacement for the TanStack Start createServerFn version.
 *
 * Callers invoke this as `latestSync()` (no arguments).
 */
export async function latestSync(): Promise<Database["public"]["Tables"]["device_sync"]["Row"][]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("device_sync")
    .select("*")
    .eq("user_id", user.id)
    .order("synced_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data ?? [];
}
