import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const insertLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => insertSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, data: row } = await supabase
      .from("daily_logs")
      .insert({
        user_id: userId,
        type: data.type,
        payload: data.payload,
        log_date: data.log_date ?? new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z.object({ from: z.string().optional(), to: z.string().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false });
    if (data.from) q = q.gte("log_date", data.from);
    if (data.to) q = q.lte("log_date", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("daily_logs")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkInsertLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ logs: z.array(insertSchema) }).parse(data))
  .handler(async ({ data, context }) => {
    if (!data.logs.length) return { inserted: 0 };
    const rows = data.logs.map((l) => ({
      user_id: context.userId,
      type: l.type,
      payload: l.payload,
      log_date: l.log_date ?? new Date().toISOString().slice(0, 10),
    }));
    const { error } = await context.supabase.from("daily_logs").insert(rows);
    if (error) throw new Error(error.message);
    return { inserted: rows.length };
  });
