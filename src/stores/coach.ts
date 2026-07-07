import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersonaKey } from "@/lib/personas";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
  image?: string;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

export const DEFAULT_SYSTEM_PROMPT = `You are Health Agent (Epoch AI), the elite and proactive AI health coach.
You have FULL ACCESS to the user's Medical Profile and Daily Logs (provided in each message as context).

YOUR CORE PERSONALITY:
- You are a strict but encouraging health coach who genuinely cares about the user's progress.
- You are proactive: you don't wait to be asked — you detect problems and act.
- You speak the user's language. Be direct, concise, motivational.
- You NEVER hallucinate data. If info is missing, say so and ask.
- Use Markdown and KaTeX ($…$ inline, $$…$$ block) when useful.
- NEVER use Arabic, Russian, or Chinese characters in Persian responses.

YOUR PROACTIVE DUTIES:
1. PROFILE CHECK: If the user's profile is missing critical data (Age, Height, Weight, Gender, Activity Level, Goal), politely ask them to provide it ONE BY ONE — like a real intake interview. Calculate BMR/TDEE once you have enough data and share the results.
2. DAILY LOG CHECK: If the user hasn't logged anything today (no calories, water, or workouts mentioned), warn them with a friendly reminder. Example: "امروز هیچ چیزی ثبت نکردی! حداقل آبی که خوردی رو بگو 💧"
3. PROGRAM TRACKING: If the user shares their program start date (or first conversation date), track their progress week by week and celebrate milestones.
4. LOG REGISTRATION: When the user mentions eating, drinking water, exercising, or studying — you MUST extract the data and tell them: "ثبت شد! ✅ [details]" and log it via the system. Always confirm what you registered.
5. SMART REMINDERS: If multiple days have passed with no logs, escalate your tone: Day 1 = gentle, Day 2 = concerned, Day 3+ = strict coach mode.
6. WEEKLY REPORT: If asked for a summary, analyze all logs for the past 7 days and provide insights on consistency, areas to improve, and recommendations.

WRITE AGENT ACTIONS (CRITICAL):
You can dynamically modify the user's profile or add daily logs by outputting a JSON block at the very end of your response, wrapped inside a \`\`\`agent-action block. Make sure to ONLY output it when the user explicitly mentions a change, or when you gather new information (e.g. from the profile check interview).
Examples:
1. To update profile (age, weight, height, targetWeight, activity, gender, waist, neck, hip):
\`\`\`agent-action
{"action":"update_profile","data":{"weightKg":75,"age":20,"heightCm":180}}
\`\`\`

2. To add/merge daily log values (calories, cardioMin, waterMl, studyMin, weightKg):
\`\`\`agent-action
{"action":"add_log","data":{"calories":500,"waterMl":250}}
\`\`\`

3. Convenience shortcut for water:
\`\`\`agent-action
{"action":"add_water","data":{"ml":250}}
\`\`\`

4. Shortcut for calories:
\`\`\`agent-action
{"action":"add_calories","data":{"kcal":300}}
\`\`\`

5. Shortcut for cardio minutes:
\`\`\`agent-action
{"action":"add_cardio","data":{"minutes":30}}
\`\`\`

6. Shortcut for study minutes:
\`\`\`agent-action
{"action":"add_study","data":{"minutes":45}}
\`\`\`

REPLY in the user's active language (detected from their messages).`;

export const PRESET_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "claude-sonnet-4",
  "deepseek-r1",
  "qwen-2.5-72b",
];

type State = {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  persona: PersonaKey;
  threads: ChatThread[];
  programStartDate: number | null;
  setProgramStartDate: (date: number) => void;
  activeThreadId: string | null;
  setConfig: (
    p: Partial<Pick<State, "baseUrl" | "apiKey" | "model" | "systemPrompt" | "persona">>,
  ) => void;
  createThread: () => void;
  selectThread: (id: string) => void;
  deleteThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
  push: (m: ChatMessage) => void;
  appendToLast: (chunk: string) => void;
  clearCurrentThread: () => void;
  getMessages: () => ChatMessage[];
};

// Helper to get messages from active thread (not stored in state, so not persisted)
function getActiveMessages(threads: ChatThread[], activeId: string | null): ChatMessage[] {
  if (!activeId) return [];
  return threads.find((t) => t.id === activeId)?.messages || [];
}

export const useCoach = create<State>()(
  persist(
    (set, get) => ({
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4o-mini",
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      persona: "ally",
      threads: [],
      programStartDate: null,
      setProgramStartDate: (date) => set({ programStartDate: date }),
      activeThreadId: null,

      setConfig: (p) => set((s) => ({ ...s, ...p })),

      createThread: () =>
        set((s) => {
          const id = crypto.randomUUID();
          const newThread: ChatThread = {
            id,
            title: "New Chat",
            messages: [],
            updatedAt: Date.now(),
          };
          return { threads: [newThread, ...s.threads], activeThreadId: id };
        }),

      selectThread: (id) => set({ activeThreadId: id }),

      deleteThread: (id) =>
        set((s) => {
          const threads = s.threads.filter((t) => t.id !== id);
          return {
            threads,
            activeThreadId: s.activeThreadId === id ? threads[0]?.id || null : s.activeThreadId,
          };
        }),

      renameThread: (id, title) =>
        set((s) => ({
          threads: s.threads.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

      push: (m) =>
        set((s) => {
          let activeId = s.activeThreadId;
          let threads = [...s.threads];

          if (!activeId) {
            activeId = crypto.randomUUID();
            threads = [
              { id: activeId, title: "New Chat", messages: [], updatedAt: Date.now() },
              ...threads,
            ];
          }

          return {
            activeThreadId: activeId,
            threads: threads
              .map((t) => {
                if (t.id === activeId) {
                  const msgs = [...t.messages, m];
                  let title = t.title;
                  if (title === "New Chat" && m.role === "user") {
                    title = m.content.slice(0, 30) + (m.content.length > 30 ? "..." : "");
                  }
                  return { ...t, messages: msgs, title, updatedAt: Date.now() };
                }
                return t;
              })
              .sort((a, b) => b.updatedAt - a.updatedAt),
          };
        }),

      appendToLast: (chunk) =>
        set((s) => {
          if (!s.activeThreadId) return s;
          return {
            threads: s.threads.map((t) => {
              if (t.id === s.activeThreadId) {
                if (t.messages.length === 0) return t;
                const last = t.messages[t.messages.length - 1];
                return {
                  ...t,
                  messages: [
                    ...t.messages.slice(0, -1),
                    { ...last, content: last.content + chunk },
                  ],
                  updatedAt: Date.now(),
                };
              }
              return t;
            }),
          };
        }),

      clearCurrentThread: () =>
        set((s) => {
          if (!s.activeThreadId) return s;
          return {
            threads: s.threads.map((t) =>
              t.id === s.activeThreadId
                ? { ...t, messages: [], title: "New Chat", updatedAt: Date.now() }
                : t,
            ),
          };
        }),

      getMessages: () => getActiveMessages(get().threads, get().activeThreadId),
    }),
    {
      name: "aura.coach.v2",
      partialize: (s) => ({
        baseUrl: s.baseUrl,
        apiKey: s.apiKey,
        model: s.model,
        systemPrompt: s.systemPrompt,
        persona: s.persona,
        threads: s.threads,
        programStartDate: s.programStartDate,
        activeThreadId: s.activeThreadId,
      }),
    },
  ),
);
