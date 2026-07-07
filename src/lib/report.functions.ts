import { supabase } from "@/integrations/supabase/client";

export async function generateWeeklyReport() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 7);
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = to.toISOString().slice(0, 10);

  const [logsRes, syncRes, profileRes, statsRes] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("type,payload,log_date,logged_at")
      .eq("user_id", user.id)
      .gte("log_date", fromIso)
      .lte("log_date", toIso),
    supabase
      .from("device_sync")
      .select("metric,value,synced_at")
      .eq("user_id", user.id)
      .gte("synced_at", from.toISOString()),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const summary = {
    period: { from: fromIso, to: toIso },
    profile: profileRes.data,
    stats: statsRes.data,
    logs: logsRes.data ?? [],
    device: syncRes.data ?? [],
  };

  const prompt = `You are Health Agent Coach, an elite sports scientist. Analyze this user's past 7 days and produce a WEEKLY PERFORMANCE REPORT in markdown. Include:

1. **Executive Summary** (2-3 sentences on wins & gaps)
2. **Metrics Snapshot** — weight trend, avg calories, avg cardio minutes, avg sleep, water hit-rate, streak
3. **What worked / What didn't**
4. **Next Week's Program** — day-by-day workout plan (7 days) tailored to profile & active modules
5. **Nutrition Targets** — daily kcal, protein/carbs/fat grams
6. **One challenge** to level up

Be direct, specific, and use numbers. Reply in the user's language (profile.language).

DATA:
${JSON.stringify(summary, null, 2)}`;

  // Use the user's configured OpenAI-compatible endpoint via Zustand coach store
  // Fallback: use a simple client-side fetch to the user's configured endpoint
  const { useCoach } = await import("@/stores/coach");
  const { baseUrl, apiKey, model } = useCoach.getState();
  const base = baseUrl?.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  if (!base) throw new Error("No AI endpoint configured. Set it in Settings → AI Coach.");

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Report failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "No report generated.";
  return {
    report: typeof content === "string" ? content : JSON.stringify(content),
    period: { from: fromIso, to: toIso },
  };
}
