import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export const LOG_TYPES = [
  "weight",
  "water",
  "food",
  "cardio",
  "sleep",
  "stress",
  "study",
  "note",
] as const;
export type LogType = (typeof LOG_TYPES)[number];

const insertSchema = z.object({
  type: z.enum(LOG_TYPES),
  payload: z.record(z.any()),
  log_date: z.string().optional(),
});

/**
 * Loose input shape accepted by the public functions.
 * `type` is widened to `string` so callers that hold `LogEntry.type: string`
 * (from the zustand log store) can pass values through without a TS cast —
 * the zod `.parse()` inside each function still validates against the enum
 * at runtime, exactly as the original createServerFn validator did.
 */
type LooseLogInput = {
  type: string;
  payload: Record<string, unknown>;
  log_date?: string;
};

/**
 * Insert a single log row into `daily_logs`.
 * Client-side replacement for the TanStack Start createServerFn version.
 *
 * Callers invoke this as `insertLog({ data: { type, payload, log_date? } })`.
 */
export async function insertLog({
  data,
}: {
  data: LooseLogInput;
}): Promise<Database["public"]["Tables"]["daily_logs"]["Row"]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const parsed = insertSchema.parse(data);
  const { error, data: row } = await supabase
    .from("daily_logs")
    .insert({
      user_id: user.id,
      type: parsed.type,
      payload: parsed.payload,
      log_date: parsed.log_date ?? new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row as Database["public"]["Tables"]["daily_logs"]["Row"];
}

/**
 * List daily log rows for the current user, optionally filtered by date range.
 * Client-side replacement for the TanStack Start createServerFn version.
 *
 * Callers invoke this as `listLogs()` or `listLogs({ data: { from?, to? } })`.
 */
export async function listLogs(arg?: {
  data?: { from?: string; to?: string };
}): Promise<Database["public"]["Tables"]["daily_logs"]["Row"][]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const input = z
    .object({ from: z.string().optional(), to: z.string().optional() })
    .parse(arg?.data ?? {});

  let q = supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false });
  if (input.from) q = q.gte("log_date", input.from);
  if (input.to) q = q.lte("log_date", input.to);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  return (rows ?? []) as Database["public"]["Tables"]["daily_logs"]["Row"][];
}

/**
 * Delete a single log row by id (scoped to the current user via RLS).
 * Client-side replacement for the TanStack Start createServerFn version.
 *
 * Callers invoke this as `deleteLog({ data: { id } })`.
 */
export async function deleteLog({ data }: { data: { id: string } }): Promise<{ ok: true }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const input = z.object({ id: z.string().uuid() }).parse(data);
  const { error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("id", input.id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

type BulkInsertInput = {
  logs: LooseLogInput[];
};

/**
 * Bulk-insert multiple log rows into `daily_logs`.
 * Client-side replacement for the TanStack Start createServerFn version.
 *
 * Callers invoke this as `bulkInsertLogs({ data: { logs: [...] } })`.
 */
export async function bulkInsertLogs({
  data,
}: {
  data: BulkInsertInput;
}): Promise<{ inserted: number }> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");

  const input = z.object({ logs: z.array(insertSchema) }).parse(data);
  if (!input.logs.length) return { inserted: 0 };

  const rows = input.logs.map((l) => ({
    user_id: user.id,
    type: l.type,
    payload: l.payload,
    log_date: l.log_date ?? new Date().toISOString().slice(0, 10),
  }));
  const { error } = await supabase.from("daily_logs").insert(rows);
  if (error) throw new Error(error.message);
  return { inserted: rows.length };
}
