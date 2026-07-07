import { useCoach } from "@/stores/coach";
import { toast } from "sonner";
import { useProfile } from "@/stores/profile";
import { useModules } from "@/stores/modules";
import { useLogs } from "@/stores/logs";
import { useUI } from "@/stores/ui";
import { ConnectionPanel } from "./ConnectionPanel";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { useRef, useState, useEffect, useMemo } from "react";
import { streamChat, toApiMessages } from "@/lib/stream";
import { buildCoachContext } from "@/lib/context";
import { processAgentActions } from "@/lib/agent-actions";
import {
  Trash2,
  Settings,
  HeartPulse,
  Dumbbell,
  Utensils,
  BarChart3,
  MessageSquarePlus,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
} from "lucide-react";
import { HealthAgentLogo } from "@/components/brand/HealthAgentLogo";
import { useT } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { languageValidation } from "@/lib/lang-filter";

export function ChatPanel() {
  const threads = useCoach((s) => s.threads);
  const activeId = useCoach((s) => s.activeThreadId);
  const createThread = useCoach((s) => s.createThread);
  const selectThread = useCoach((s) => s.selectThread);
  const deleteThread = useCoach((s) => s.deleteThread);
  const push = useCoach((s) => s.push);
  const appendToLast = useCoach((s) => s.appendToLast);
  const clearCurrentThread = useCoach((s) => s.clearCurrentThread);
  const baseUrl = useCoach((s) => s.baseUrl);
  const apiKey = useCoach((s) => s.apiKey);
  const model = useCoach((s) => s.model);
  const systemPrompt = useCoach((s) => s.systemPrompt);
  const persona = useCoach((s) => s.persona);
  const setConfig = useCoach((s) => s.setConfig);
  const programStartDate = useCoach((s) => s.programStartDate);
  const setProgramStartDate = useCoach((s) => s.setProgramStartDate);

  const profile = useProfile((s) => s.profile);
  const active = useModules((s) => s.active);
  const lang = useUI((s) => s.lang);
  const logs = useLogs((s) => s.logs);
  const goals = useLogs((s) => s.goals);
  const { t } = useT();

  const [streaming, setStreaming] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages =
    useCoach((s) => s.threads.find((t) => t.id === s.activeThreadId)?.messages) || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenuId) return;
    const handleOutsideClick = () => setContextMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [contextMenuId]);

  const showError = (msg: string) => {
    toast.error(msg, {
      duration: 6000,
      className:
        "!bg-red-500/10 !backdrop-blur-xl !border !border-red-500/30 !text-red-100 !shadow-[0_10px_40px_rgba(239,68,68,0.25)]",
    });
  };

  const send = async (text: string, image?: string) => {
    if (!apiKey) {
      setSettingsOpen(true);
      return showError("Add your API key first.");
    }
    if (!model) {
      setSettingsOpen(true);
      return showError("Choose a model first.");
    }

    // Proactive: If this is the user's first ever message, set the program start date to now
    let currentStartDate = programStartDate;
    if (!currentStartDate) {
      currentStartDate = Date.now();
      setProgramStartDate(currentStartDate);
    }

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: text,
      ts: Date.now(),
      ...(image ? { image } : {}),
    };
    const assistantMsg = {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: "",
      ts: Date.now(),
    };
    push(userMsg);
    push(assistantMsg);

    const ctx = buildCoachContext(profile, active, lang, logs, goals, currentStartDate);
    // Grab messages *after* pushing userMsg so it's included
    const freshState = useCoach.getState();
    const freshMessages =
      freshState.threads.find((t) => t.id === freshState.activeThreadId)?.messages || [];
    const apiMessages = toApiMessages(
      systemPrompt,
      ctx,
      freshMessages.slice(0, -1), // Exclude the empty assistant bubble just pushed
      persona,
    );

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    try {
      await streamChat({
        baseUrl,
        apiKey,
        model,
        messages: apiMessages,
        signal: controller.signal,
        onDelta: (d) => {
          // Validation filter
          const clean = languageValidation(d, lang);
          if (clean) appendToLast(clean);
        },
      });

      // After streaming is done, process any agent actions embedded in the assistant's final response
      const finalState = useCoach.getState();
      const finalActiveMessages =
        finalState.threads.find((t) => t.id === finalState.activeThreadId)?.messages || [];
      const finalAssistantMsg = finalActiveMessages[finalActiveMessages.length - 1];

      if (
        finalAssistantMsg &&
        finalAssistantMsg.role === "assistant" &&
        finalAssistantMsg.content
      ) {
        const result = processAgentActions(finalAssistantMsg.content, lang);
        if (result.executedCount > 0) {
          // Update the message in state to remove the raw JSON blocks
          const updatedThreads = finalState.threads.map((t) => {
            if (t.id === finalState.activeThreadId) {
              const msgs = [...t.messages];
              msgs[msgs.length - 1] = { ...finalAssistantMsg, content: result.cleanText };
              return { ...t, messages: msgs };
            }
            return t;
          });
          useCoach.setState({ threads: updatedThreads });
        }
      }
    } catch (e: unknown) {
      const err = e as Error;
      const aborted = err.name === "AbortError" || controller.signal.aborted;
      const state = useCoach.getState();
      const activeMessages =
        state.threads.find((t) => t.id === state.activeThreadId)?.messages || [];
      const last = activeMessages[activeMessages.length - 1];
      if (last && last.role === "assistant" && last.content === "") {
        useCoach.setState({
          threads: state.threads.map((t) =>
            t.id === state.activeThreadId ? { ...t, messages: t.messages.slice(0, -1) } : t,
          ),
        });
      }
      if (!aborted) {
        showError(err.message || "The AI stream failed. Check your API key, model, or network.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setStreaming(false);
    }
  };

  const handleCreateThread = () => {
    stop();
    createThread();
  };

  const handleSelectThread = (id: string) => {
    stop();
    selectThread(id);
  };

  // Advanced, randomized conversation starters based on the new proactive system prompt
  const ALL_SUGGESTIONS = [
    {
      icon: HeartPulse,
      textFa: "من امروز چقدر کاردیو نیاز دارم؟",
      textEn: "How much cardio do I need today?",
    },
    {
      icon: Utensils,
      textFa: "ناهار من رو ثبت کن: ۵۰۰ کالری",
      textEn: "Log my lunch: 500 calories",
    },
    {
      icon: Dumbbell,
      textFa: "یه برنامه تمرینی برای امروز بده",
      textEn: "Give me a workout routine for today",
    },
    {
      icon: BarChart3,
      textFa: "گزارش پیشرفت این هفته من چطوره؟",
      textEn: "How is my progress this week?",
    },
    {
      icon: MessageSquarePlus,
      textFa: "پروفایل من رو چک کن، کامله؟",
      textEn: "Check my profile, is it complete?",
    },
    { icon: HeartPulse, textFa: "TDEE و BMR من رو محاسبه کن", textEn: "Calculate my TDEE and BMR" },
    {
      icon: Utensils,
      textFa: "۲ لیوان آب خوردم، ثبتش کن 💧",
      textEn: "I drank 2 glasses of water, log it 💧",
    },
    {
      icon: Dumbbell,
      textFa: "برای زانو درد چه ورزشی خوبه؟",
      textEn: "What exercises are good for knee pain?",
    },
    {
      icon: HeartPulse,
      textFa: "به نظرت امروز چقدر پیاده‌روی کنم؟",
      textEn: "How much should I walk today?",
    },
    {
      icon: BarChart3,
      textFa: "آیا من به اهداف این ماهم نزدیکم؟",
      textEn: "Am I close to my monthly goals?",
    },
    {
      icon: MessageSquarePlus,
      textFa: "من امروز استرس داشتم، راهنماییم کن",
      textEn: "I was stressed today, give me advice",
    },
    {
      icon: Utensils,
      textFa: "شام یه پیتزا خوردم 🍕 چقدر کالریشه؟",
      textEn: "I had a pizza for dinner 🍕 How many calories?",
    },
    {
      icon: Dumbbell,
      textFa: "امروز ۳۰ دقیقه دویدم، ثبتش کن 🏃",
      textEn: "I ran for 30 mins today, log it 🏃",
    },
    {
      icon: HeartPulse,
      textFa: "بر اساس داده‌هام، چقدر باید بخوابم؟",
      textEn: "Based on my data, how much should I sleep?",
    },
  ];

  // Select 4 random suggestions on mount or thread switch, prioritising missing profile/logs
  const suggestions = useMemo(() => {
    // Check profile completeness and logs dynamically
    const isProfileIncomplete =
      profile.age === 0 || profile.weightKg === 0 || profile.heightCm === 0;
    const todayStr = new Date().toISOString().split("T")[0];
    const hasTodayLog = logs?.some((l) => l.date === todayStr);

    const list = [...ALL_SUGGESTIONS];

    // Priority suggestions
    if (isProfileIncomplete) {
      list.unshift({
        icon: MessageSquarePlus,
        textFa: "میخوام اطلاعات پروفایلم رو برات بگم تا برام ذخیره کنی 📝",
        textEn: "I want to share my profile details for you to save 📝",
      });
    }
    if (!hasTodayLog) {
      list.unshift({
        icon: Utensils,
        textFa: "هنوز لاگی ثبت نکردم، چیا باید ثبت کنم؟ 🍏",
        textEn: "I haven't logged today, what should I track? 🍏",
      });
    }

    // De-duplicate items based on text
    const seen = new Set();
    const unique = list.filter((el) => {
      const k = el.textEn;
      return seen.has(k) ? false : seen.add(k);
    });

    // Take top 2 from priority (if any) and sample the rest randomly to make a total of 4
    const priorityCount = (isProfileIncomplete ? 1 : 0) + (!hasTodayLog ? 1 : 0);
    const priorities = unique.slice(0, priorityCount);
    const pool = unique.slice(priorityCount).sort(() => 0.5 - Math.random());

    return [...priorities, ...pool].slice(0, 4);
  }, [activeId, profile, logs]);

  const firstName = (profile.name || "").split(" ")[0];

  return (
    <div className="flex gap-0 w-full h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)]">
      {/* Sidebar — Threads list (ChatGPT-style) */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 ease-out overflow-hidden flex flex-col bg-black/20 backdrop-blur-2xl border-r border-white/5`}
      >
        <div className="p-3 flex flex-col gap-2 border-b border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40 px-1">
              {t("topics") || "Topics"}
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="h-7 w-7 grid place-items-center rounded-md hover:bg-white/[0.06] transition text-white/50 hover:text-white"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleCreateThread}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-sm font-medium text-white/90 hover:text-white transition-all duration-200 active:scale-[0.98]"
          >
            <MessageSquarePlus className="h-4 w-4 text-[#8c96ff]" />
            <span>{lang === "fa" ? "گفتگوی جدید" : "New Chat"}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 py-2 px-2 space-y-0.5">
          {threads.length === 0 ? (
            <div className="text-center text-xs text-white/30 px-3 py-6">
              {lang === "fa" ? "هنوز گفتگویی ندارید" : "No conversations yet"}
            </div>
          ) : (
            threads.map((th) => {
              const isActive = th.id === activeId;
              return (
                <div key={th.id} className="relative group">
                  <button
                    onClick={() => handleSelectThread(th.id)}
                    className={`w-full text-start px-3 py-2.5 text-sm transition-all duration-200 flex items-center gap-2.5 rounded-xl ${
                      isActive
                        ? "bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        : "text-white/60 hover:bg-white/[0.04] hover:text-white/90"
                    }`}
                  >
                    <MessageSquare
                      className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#8c96ff]" : ""}`}
                    />
                    <span className="truncate flex-1">{th.title}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuId(isActive && contextMenuId === th.id ? null : th.id);
                    }}
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/[0.08] transition text-white/40 hover:text-white"
                    aria-label="More"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {contextMenuId === th.id && (
                    <div
                      className="absolute end-1.5 top-10 z-30 w-40 rounded-xl border border-white/10 bg-[#0a0b0f]/95 backdrop-blur-xl overflow-hidden shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          deleteThread(th.id);
                          setContextMenuId(null);
                        }}
                        className="w-full text-start px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> {t("delete") || "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar footer with user info / settings */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition text-sm text-white/70 hover:text-white"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#10b981] grid place-items-center">
              <Settings className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 text-start">
              <div className="text-xs font-medium">{lang === "fa" ? "تنظیمات" : "Settings"}</div>
              <div className="text-[10px] text-white/40 mono truncate">{model || "no-model"}</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        {/* Header with sidebar-open toggle + title + gear */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/[0.06] transition text-white/60 hover:text-white"
                aria-label="Open sidebar"
                title={lang === "fa" ? "باز کردن لیست چت‌ها" : "Open sidebar"}
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}
            <HealthAgentLogo size={22} />
            <span className="text-sm font-semibold">{t("aiCoach")}</span>
          </div>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <button
                className="h-9 w-9 grid place-items-center rounded-lg glass hover:bg-white/[0.06] transition"
                aria-label={t("settings")}
                title={t("settings")}
              >
                <Settings className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-[#07080a]/95 backdrop-blur-3xl border border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-0 flex flex-col max-h-[85vh] sm:max-h-[90vh]">
              <div className="shrink-0 border-b border-white/10 px-5 py-4">
                <DialogTitle className="text-lg">{t("connectionSettings")}</DialogTitle>
                <DialogDescription className="text-[color:var(--aura-fg-muted)] text-sm mt-1">
                  {t("keyDisclaimer")}
                </DialogDescription>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 grid gap-5">
                <ConnectionPanel />
                <div className="grid gap-2 border-t border-white/5 pt-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--aura-fg-muted)] mb-1">
                    {t("systemPrompt")}
                  </div>
                  <textarea
                    rows={4}
                    value={systemPrompt}
                    onChange={(e) => setConfig({ systemPrompt: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm mono outline-none focus:border-[#5e6ad2] focus:bg-white/[0.04] transition"
                  />
                </div>
                <button
                  onClick={() => {
                    clearCurrentThread();
                    setSettingsOpen(false);
                  }}
                  className="text-xs font-medium text-[color:var(--aura-fg-muted)] hover:text-red-400 flex items-center gap-1.5 self-start transition mb-2"
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t("clearChat")}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          {messages.length === 0 ? (
            <div className="h-full grid place-items-center text-center px-4 relative overflow-hidden">
              <div className="flex flex-col items-center gap-8 max-w-2xl w-full relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 blur-[80px] opacity-40 bg-gradient-to-br from-[#5e6ad2] to-[#10b981] rounded-full scale-[2]" />
                  <div className="relative transform hover:scale-105 transition duration-500">
                    <HealthAgentLogo size={80} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                    {t("greeting")}
                    {firstName ? `, ${firstName}` : ""}?
                  </h2>
                  <p className="text-sm text-white/40 max-w-md mx-auto">
                    {lang === "fa"
                      ? "چگونه می‌توانم امروز به سلامت و تندرستی شما کمک کنم؟"
                      : "How can I help you achieve your wellness goals today?"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-4">
                  {suggestions.map(({ icon: Icon, textFa, textEn }, idx) => (
                    <button
                      key={idx}
                      onClick={() => send(lang === "fa" ? textFa : textEn)}
                      className="group flex items-start gap-4 p-4 text-start rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.99]"
                    >
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#5e6ad2]/10 to-[#10b981]/10 group-hover:from-[#5e6ad2]/20 group-hover:to-[#10b981]/20 grid place-items-center shrink-0 transition duration-300">
                        <Icon className="h-4.5 w-4.5 text-white/70 group-hover:text-white transition" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white/80 group-hover:text-white transition truncate">
                          {lang === "fa" ? textFa : textEn}
                        </div>
                        <div className="text-[11px] text-white/40 mt-0.5 line-clamp-1">
                          {lang === "fa" ? "شروع گفتگو روی این موضوع" : "Start chat on this topic"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <MessageList messages={messages} streaming={streaming} />
          )}
          <div ref={bottomRef} />
        </div>

        <Composer onSend={send} onStop={stop} streaming={streaming} model={model} lang={lang} />
      </div>
    </div>
  );
}
