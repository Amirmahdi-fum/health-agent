import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Sparkles, User, Volume2, Square } from "lucide-react";
import { useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/stores/coach";
import { stripActionBlocks } from "@/lib/agent-actions";

function isFarsi(s: string): boolean {
  return /[\u0600-\u06FF]/.test(s);
}

function AudioButton({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const clean = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\$+[^$]+\$+/g, "")
      .replace(/[#*_>`~[\]()]/g, "")
      .slice(0, 4000);
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = isFarsi(clean) ? "fa-IR" : "en-US";
    u.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(u.lang.slice(0, 2)));
    if (match) u.voice = match;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
  };
  return (
    <button
      onClick={toggle}
      className="mt-2 inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[color:var(--aura-fg-muted)] hover:text-white hover:bg-white/[0.08] transition"
      aria-label="Play audio"
    >
      {playing ? (
        <Square className="h-3 w-3" fill="currentColor" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      {playing ? "Stop" : "Play"}
    </button>
  );
}

export function ChatMessage({
  message,
  isStreaming,
  isLast,
}: {
  message: ChatMessageType;
  isStreaming: boolean;
  isLast: boolean;
}) {
  const isUser = message.role === "user";
  // Hide secret agent-action JSON blocks from the rendered chat (they are executed in the background)
  const displayContent = isUser ? message.content : stripActionBlocks(message.content);
  const fa = isFarsi(displayContent);

  // Custom components for Markdown to handle BiDi perfectly via dir="auto"
  const markdownComponents = {
    p: ({ children }: any) => (
      <p
        dir="auto"
        className="mb-2 leading-relaxed"
        style={fa ? { fontFamily: "var(--font-sans-fa)" } : undefined}
      >
        {children}
      </p>
    ),
    li: ({ children }: any) => (
      <li
        dir="auto"
        className="leading-relaxed"
        style={fa ? { fontFamily: "var(--font-sans-fa)" } : undefined}
      >
        {children}
      </li>
    ),
    h1: ({ children }: any) => (
      <h1
        dir="auto"
        className="text-xl font-bold mt-4 mb-2"
        style={fa ? { fontFamily: "var(--font-sans-fa)" } : undefined}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2
        dir="auto"
        className="text-lg font-bold mt-3 mb-1.5"
        style={fa ? { fontFamily: "var(--font-sans-fa)" } : undefined}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3
        dir="auto"
        className="text-md font-bold mt-2 mb-1"
        style={fa ? { fontFamily: "var(--font-sans-fa)" } : undefined}
      >
        {children}
      </h3>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className={`flex gap-3 msg-in ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
          isUser ? "bg-white/[0.06]" : "bg-gradient-to-br from-[#5e6ad2] to-[#10b981]"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-white" />}
      </div>
      <div className={`min-w-0 flex-1 ${isUser ? "text-end" : ""}`}>
        {isUser ? (
          <div className="inline-flex flex-col items-end gap-2 max-w-full">
            {message.image && (
              <img
                src={message.image}
                alt="attachment"
                className="max-h-56 rounded-xl border border-white/10 object-cover"
              />
            )}
            {message.content && (
              <div
                dir="auto"
                className={`inline-block glass px-3.5 py-2 text-sm whitespace-pre-wrap text-start ${fa ? "leading-relaxed" : ""}`}
                style={fa ? { fontFamily: "var(--font-sans-fa)" } : undefined}
              >
                {message.content}
              </div>
            )}
          </div>
        ) : (
          <div
            dir="auto"
            className={`prose prose-invert prose-sm max-w-none katex-container ${fa ? "leading-relaxed" : ""} ${
              isLast && isStreaming ? "blink-cursor" : ""
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {displayContent || " "}
            </ReactMarkdown>
            {!isStreaming && displayContent && <AudioButton text={displayContent} />}
          </div>
        )}
      </div>
    </div>
  );
}
