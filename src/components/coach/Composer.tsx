import { Send, Square, Paperclip, Mic, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

// Minimal typing shim for Web Speech API
type SRResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SR = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: SRResultEvent) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

export function Composer({
  onSend,
  onStop,
  streaming,
  disabled,
  model,
  lang,
}: {
  onSend: (text: string, image?: string) => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
  model: string;
  lang: "en" | "fa";
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<SR | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useT();

  useEffect(() => () => recogRef.current?.stop(), []);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`; // Max height 192px (12rem)
  }, [text]);

  const submit = () => {
    const v = text.trim();
    if ((!v && !image) || streaming) return;
    onSend(v, image ?? undefined);
    setText("");
    setImage(null);
  };

  const pickImage = () => fileRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Only images are supported");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Image is larger than 8MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(f);
  };

  const toggleVoice = () => {
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SR;
      webkitSpeechRecognition?: new () => SR;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    const r = new Ctor();
    r.lang = lang === "fa" ? "fa-IR" : "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: SRResultEvent) => {
      let out = "";
      for (let i = 0; i < e.results.length; i++) out += e.results[i][0].transcript;
      setText((prev) => (prev ? prev + " " : "") + out.trim());
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <div className="glass p-3 flex flex-col gap-2 relative">
      {streaming && (
        <div className="flex items-center gap-2 text-xs text-[color:var(--aura-fg-muted)] px-1">
          <span className="flex gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </span>
          <span>
            {t("thinking")} · <span className="mono">{model}</span>
          </span>
        </div>
      )}

      {image && (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 self-start">
          <img src={image} alt="attachment" className="w-full h-full object-cover" />
          <button
            onClick={() => setImage(null)}
            className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full bg-black/70 border border-white/20 text-white"
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {listening && (
        <div className="flex items-center gap-2 text-xs text-[#10b981] px-1">
          <span className="flex items-end gap-0.5 h-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-0.5 bg-[#10b981] rounded-full animate-pulse"
                style={{ height: `${40 + (i % 3) * 20}%`, animationDelay: `${i * 90}ms` }}
              />
            ))}
          </span>
          <span>{t("listening")}</span>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={pickImage}
          className="h-10 w-10 rounded-lg grid place-items-center text-[color:var(--aura-fg-muted)] hover:text-white hover:bg-white/[0.05] transition shrink-0"
          aria-label={t("attachImage")}
          title={t("attachImage")}
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t("askAnything")}
          className="flex-1 bg-transparent resize-none max-h-48 overflow-y-auto outline-none text-sm py-2 px-2 min-w-0"
          style={{ minHeight: 40 }}
        />

        <button
          type="button"
          onClick={toggleVoice}
          className={`h-10 w-10 rounded-lg grid place-items-center transition shrink-0 ${
            listening
              ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 animate-pulse"
              : "text-[color:var(--aura-fg-muted)] hover:text-white hover:bg-white/[0.05]"
          }`}
          aria-label={t("voiceInput")}
          title={t("voiceInput")}
        >
          <Mic className="h-4 w-4" />
        </button>

        {streaming ? (
          <button
            onClick={onStop}
            className="h-10 px-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition flex items-center gap-1.5 shrink-0"
          >
            <Square className="h-4 w-4" fill="currentColor" />
            <span className="text-xs">{t("stop")}</span>
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={disabled || (!text.trim() && !image)}
            className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#10b981] grid place-items-center text-white disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            aria-label={t("send")}
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
