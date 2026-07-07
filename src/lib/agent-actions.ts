import { useLogs } from "@/stores/logs";
import { useProfile, type Profile } from "@/stores/profile";
import { toast } from "sonner";

/**
 * Agent Action system: the AI outputs special JSON blocks in its response.
 * This module parses, validates, and executes them against Zustand stores.
 *
 * Supported actions:
 *   - add_log:            Add/merge today's log fields
 *   - update_profile:     Update user profile fields
 *   - add_water:          Convenience – add water in ml to today's log
 *   - add_calories:       Convenience – add calories to today's log
 *   - add_cardio:         Convenience – add cardio minutes to today's log
 *   - add_study:          Convenience – add study minutes to today's log
 *
 * The JSON block MUST be on its own line(s), wrapped in a fenced code block:
 *   ```agent-action
 *   {"action":"add_log","data":{"calories":500}}
 *   ```
 *
 * or bare JSON:
 *   {"action":"add_log","data":{"calories":500}}
 */

const ACTION_BLOCK_RE = /```agent-action\s*\n([\s\S]*?)\n```\s*/g;
const ACTION_BARE_RE = /^\s*(\{[\s\S]*"action"[\s\S]*\})\s*$/gm;

export type AgentAction =
  | { action: "add_log"; data: Record<string, number | string> }
  | { action: "update_profile"; data: Partial<Profile> }
  | { action: "add_water"; data: { ml: number } }
  | { action: "add_calories"; data: { kcal: number } }
  | { action: "add_cardio"; data: { minutes: number } }
  | { action: "add_study"; data: { minutes: number } };

// Extract ALL action blocks from the assistant's full text
export function extractActions(text: string): AgentAction[] {
  const actions: AgentAction[] = [];
  const seen = new Set<string>();

  // Fenced blocks
  for (const m of text.matchAll(ACTION_BLOCK_RE)) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed?.action && !seen.has(m[1].trim())) {
        seen.add(m[1].trim());
        actions.push(parsed as AgentAction);
      }
    } catch {
      /* skip malformed */
    }
  }

  // Bare JSON lines (not inside fenced blocks)
  const stripped = text.replace(ACTION_BLOCK_RE, "");
  for (const m of stripped.matchAll(ACTION_BARE_RE)) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed?.action && !seen.has(m[1].trim())) {
        seen.add(m[1].trim());
        actions.push(parsed as AgentAction);
      }
    } catch {
      /* skip malformed */
    }
  }

  return actions;
}

// Remove action JSON blocks from the displayed text (clean UI)
export function stripActionBlocks(text: string): string {
  return text.replace(ACTION_BLOCK_RE, "").replace(ACTION_BARE_RE, "").trim();
}

// Execute a single action against Zustand stores
function executeAction(a: AgentAction, lang: "fa" | "en"): string | null {
  switch (a.action) {
    case "add_log": {
      const patch: Record<string, number> = {};
      if (a.data.calories != null) patch.calories = Number(a.data.calories);
      if (a.data.cardioMin != null) patch.cardioMin = Number(a.data.cardioMin);
      if (a.data.waterMl != null) patch.waterMl = Number(a.data.waterMl);
      if (a.data.studyMin != null) patch.studyMin = Number(a.data.studyMin);
      if (a.data.weightKg != null) patch.weightKg = Number(a.data.weightKg);
      useLogs.getState().addToday(patch);
      const parts = Object.entries(patch)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      return lang === "fa" ? `لاگ ثبت شد ✅ (${parts})` : `Log registered ✅ (${parts})`;
    }
    case "update_profile": {
      useProfile.getState().update(a.data);
      const fields = Object.keys(a.data).join(", ");
      return lang === "fa" ? `پروفایل آپدیت شد ✅ (${fields})` : `Profile updated ✅ (${fields})`;
    }
    case "add_water": {
      const ml = Number(a.data.ml);
      useLogs.getState().addToday({ waterMl: ml });
      return lang === "fa" ? `${ml} میلی‌لیتر آب ثبت شد 💧` : `${ml}ml water logged 💧`;
    }
    case "add_calories": {
      const kcal = Number(a.data.kcal);
      useLogs.getState().addToday({ calories: kcal });
      return lang === "fa" ? `${kcal} کالری ثبت شد 🔥` : `${kcal} kcal logged 🔥`;
    }
    case "add_cardio": {
      const min = Number(a.data.minutes);
      useLogs.getState().addToday({ cardioMin: min });
      return lang === "fa" ? `${min} دقیقه کاردیو ثبت شد 🏃` : `${min} min cardio logged 🏃`;
    }
    case "add_study": {
      const min = Number(a.data.minutes);
      useLogs.getState().addToday({ studyMin: min });
      return lang === "fa" ? `${min} دقیقه مطالعه ثبت شد 📚` : `${min} min study logged 📚`;
    }
    default:
      return null;
  }
}

// Main entry: parse all actions from assistant text, execute them, show toasts
export function processAgentActions(
  fullText: string,
  lang: "fa" | "en",
): {
  cleanText: string;
  executedCount: number;
  confirmations: string[];
} {
  const actions = extractActions(fullText);
  const confirmations: string[] = [];

  for (const a of actions) {
    const msg = executeAction(a, lang);
    if (msg) {
      confirmations.push(msg);
      toast.success(msg, {
        duration: 4000,
        className:
          "!bg-emerald-500/10 !backdrop-blur-xl !border !border-emerald-500/30 !text-emerald-100 !shadow-[0_10px_40px_rgba(16,185,129,0.25)]",
      });
    }
  }

  return {
    cleanText: stripActionBlocks(fullText),
    executedCount: actions.length,
    confirmations,
  };
}
