import { useCoach, PRESET_MODELS } from "@/stores/coach";
import { useT } from "@/lib/i18n";
import {
  Eye,
  EyeOff,
  Key,
  Link as LinkIcon,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

const inputCls =
  "w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm mono focus:outline-none focus:border-[#5e6ad2] focus:bg-white/[0.05] transition-all duration-200 shadow-inner";

export function ConnectionPanel() {
  const { baseUrl, apiKey, model, setConfig } = useCoach();
  const { t, lang } = useT();
  const [reveal, setReveal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string; ping?: number } | null>(
    null,
  );

  const isCustom = !PRESET_MODELS.includes(model);

  const handleTest = async () => {
    if (!baseUrl) return;
    setTesting(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      // standard GET to /models to verify credentials
      const res = await fetch(`${base}/models`, {
        method: "GET",
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        mode: "cors",
      });
      const ping = Date.now() - start;
      if (res.ok) {
        setTestResult({
          ok: true,
          msg:
            lang === "fa"
              ? "تمام مدل‌های در دسترس با موفقیت دریافت شدند."
              : "Successfully fetched available models.",
          ping,
        });
      } else {
        let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const body = await res.json();
          if (body.error?.message) errorMsg = body.error.message;
        } catch {
          /* ignore */
        }
        setTestResult({ ok: false, msg: errorMsg });
      }
    } catch (e: unknown) {
      setTestResult({
        ok: false,
        msg:
          (e as Error).message ||
          (lang === "fa" ? "خطای اتصال شبکه یا CORS" : "Network error or CORS issue"),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid gap-4 py-2">
      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium flex items-center gap-2 text-[color:var(--aura-fg-muted)]">
          <LinkIcon className="h-3.5 w-3.5 text-[#5e6ad2]" /> {t("baseUrl")}
        </span>
        <input
          value={baseUrl}
          onChange={(e) => setConfig({ baseUrl: e.target.value })}
          className={inputCls}
          placeholder="https://api.openai.com/v1"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium flex items-center gap-2 text-[color:var(--aura-fg-muted)]">
          <Key className="h-3.5 w-3.5 text-[#10b981]" /> {t("apiKey")}
        </span>
        <div className="relative">
          <input
            type={reveal ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setConfig({ apiKey: e.target.value })}
            className={inputCls + " pe-12"}
            placeholder="sk-..."
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute inset-y-0 end-0 px-3.5 flex items-center text-[color:var(--aura-fg-muted)] hover:text-white transition"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <span className="text-[10px] leading-relaxed text-[color:var(--aura-fg-dim)]">
          {t("keyDisclaimer")}
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium flex items-center gap-2 text-[color:var(--aura-fg-muted)]">
          <Cpu className="h-3.5 w-3.5 text-indigo-400" /> {t("model")}
        </span>
        <select
          value={isCustom ? "__custom__" : model}
          onChange={(e) => {
            if (e.target.value === "__custom__") setConfig({ model: "" });
            else setConfig({ model: e.target.value });
          }}
          className={inputCls}
        >
          {PRESET_MODELS.map((m) => (
            <option key={m} value={m} className="bg-[#07080a] text-white">
              {m}
            </option>
          ))}
          <option value="__custom__" className="bg-[#07080a] text-white">
            {t("customModel")}
          </option>
        </select>
        {isCustom && (
          <input
            value={model}
            onChange={(e) => setConfig({ model: e.target.value })}
            className={`${inputCls} mt-2`}
            placeholder="my-custom-model-id"
          />
        )}
      </label>

      {/* Test Connection Button */}
      <div className="flex flex-col gap-2.5 mt-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !baseUrl}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-300 ${
            testing
              ? "bg-[#5e6ad2]/10 border-[#5e6ad2]/30 text-[#5e6ad2]/70 cursor-wait"
              : "bg-[#5e6ad2]/10 hover:bg-[#5e6ad2]/20 border-[#5e6ad2]/30 hover:border-[#5e6ad2]/50 text-[#8c96ff] hover:text-white"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Zap className={`h-4 w-4 ${testing ? "animate-spin" : "animate-pulse"}`} />
          {testing
            ? lang === "fa"
              ? "در حال اعتبارسنجی اتصال…"
              : "Validating connection…"
            : lang === "fa"
              ? "بررسی و تست اتصال"
              : "Verify & Test Connection"}
        </button>

        {testResult && (
          <div
            className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs border transition-all duration-300 ${
              testResult.ok
                ? "bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-300 shadow-[0_4px_20px_rgba(16,185,129,0.05)]"
                : "bg-red-500/[0.04] border-red-500/20 text-red-300 shadow-[0_4px_20px_rgba(239,68,68,0.05)]"
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-none flex items-center gap-2 mb-1">
                {testResult.ok
                  ? lang === "fa"
                    ? "اتصال با موفقیت برقرار شد"
                    : "Connection Authorized"
                  : lang === "fa"
                    ? "خطا در برقراری ارتباط"
                    : "Authorization Failed"}
                {testResult.ok && testResult.ping !== undefined && (
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 opacity-90 text-emerald-400">
                    {testResult.ping}ms
                  </span>
                )}
              </div>
              <div className="opacity-80 leading-relaxed break-words">{testResult.msg}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
