import { useProfile } from "@/stores/profile";
import { useT } from "@/lib/i18n";
import { bmi, bmr, tdee, bodyFatUSNavy, type Activity, type Gender } from "@/lib/calc";
import { memo, useState, type ReactNode } from "react";
import {
  HeartPulse,
  Bone,
  Pill,
  Plus,
  X,
  Stethoscope,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Activity as ActivityIcon,
  Flame,
  Dna,
  Scale,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function Field({
  label,
  children,
  tooltip,
}: {
  label: string;
  children: ReactNode;
  tooltip?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0 relative group">
      <span className="text-[11px] uppercase tracking-wider text-[color:var(--aura-fg-muted)] flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="relative inline-block cursor-help text-[color:var(--aura-fg-dim)] hover:text-white transition">
            <HelpCircle className="h-3 w-3" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-[10px] text-white font-normal normal-case leading-normal shadow-xl z-50">
              {tooltip}
            </span>
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm mono focus:outline-none focus:border-[#5e6ad2] focus:bg-white/[0.05] transition";

const NumberInput = memo(function NumberInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (n: number) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      defaultValue={value || ""}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return;
        const n = Number(raw);
        if (!Number.isNaN(n)) onCommit(n);
      }}
      onBlur={(e) => {
        if (e.target.value === "") onCommit(0);
      }}
      className={inputCls}
    />
  );
});

// Tag-based input component with modern visual feedback and quick suggestions
function TagInput({
  value,
  onChange,
  presets,
  placeholder,
  icon: Icon,
  accentColor,
}: {
  value: string;
  onChange: (val: string) => void;
  presets: string[];
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}) {
  const [inputVal, setInputVal] = useState("");

  const tags = value
    ? value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const addTag = (tag: string) => {
    const cleaned = tag.trim();
    if (!cleaned) return;
    if (tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) return;
    const nextTags = [...tags, cleaned];
    onChange(nextTags.join(", "));
  };

  const removeTag = (idxToRemove: number) => {
    const nextTags = tags.filter((_, idx) => idx !== idxToRemove);
    onChange(nextTags.join(", "));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
      setInputVal("");
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Input container with rich focus state */}
      <div
        className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/10 hover:border-white/20 focus-within:!border-[#5e6ad2] rounded-2xl transition"
        style={{
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
          <div
            className="p-1.5 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputVal) {
                addTag(inputVal);
                setInputVal("");
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm focus:outline-none placeholder-white/20"
          />
          {inputVal && (
            <button
              onClick={() => {
                addTag(inputVal);
                setInputVal("");
              }}
              className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dynamic Tag rendering with framer-motion */}
        <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
          <AnimatePresence initial={false}>
            {tags.map((tag, idx) => (
              <motion.span
                key={tag + idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border text-white transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: `${accentColor}10`,
                  borderColor: `${accentColor}25`,
                  boxShadow: `0 2px 8px -2px ${accentColor}15`,
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(idx)}
                  className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          {tags.length === 0 && (
            <span className="text-xs text-white/20 italic select-none pointer-events-none">
              None listed
            </span>
          )}
        </div>
      </div>

      {/* Suggested Quick Badges */}
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mr-1">
          Suggestions:
        </span>
        {presets.map((preset) => {
          const isSelected = tags.some((t) => t.toLowerCase() === preset.toLowerCase());
          return (
            <button
              key={preset}
              type="button"
              disabled={isSelected}
              onClick={() => addTag(preset)}
              className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                isSelected
                  ? "bg-white/5 border-white/5 text-white/20 line-through"
                  : "bg-white/[0.02] border-white/10 hover:border-white/20 text-white/60 hover:text-white"
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileWizard() {
  const { profile, update } = useProfile();
  const { t, lang } = useT();

  const presets = {
    diseases:
      lang === "fa"
        ? ["آسم", "دیابت", "فشار خون بالا", "حساسیت به گلوتن", "آریتمی قلبی"]
        : ["Asthma", "Diabetes", "Hypertension", "Gluten Allergy", "Anemia"],
    joints:
      lang === "fa"
        ? ["زانو درد", "دیسک کمر", "آسیب مچ پا", "درد شانه", "سندرم تونل کارپال"]
        : ["Knee Pain", "Lower Back Pain", "Ankle Sprain", "Shoulder Pain", "Carpal Tunnel"],
    medications:
      lang === "fa"
        ? ["متفورمین", "آسپرین", "ویتامین D3", "امگا ۳", "مولتی ویتامین"]
        : ["Metformin", "Aspirin", "Vitamin D3", "Omega 3", "Multivitamins"],
  };

  // Check if any medical warning is active
  const hasMedicalIssues = [profile.diseases, profile.joints, profile.medications].some(
    (f) => f && f.trim().length > 0,
  );

  // Calculate Live Metrics
  const liveBmi = bmi(profile.weightKg, profile.heightCm);
  const liveBmr = bmr(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const liveTdee = tdee(liveBmr, profile.activity);
  const liveBf = bodyFatUSNavy({
    gender: profile.gender,
    heightCm: profile.heightCm,
    waistCm: profile.waistCm,
    neckCm: profile.neckCm,
    hipCm: profile.hipCm,
  });

  // Metric Ring Component
  const MetricRing = ({ label, value, unit, icon: Icon, color, progress }: any) => (
    <div className="relative p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3 overflow-hidden group hover:bg-white/[0.04] transition">
      <div
        className="absolute top-0 right-0 w-16 h-16 blur-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/5" strokeWidth="3" />
          <motion.circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray="100 100"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 100 - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-lg font-bold mono">{value > 0 ? value.toFixed(1) : "-"}</span>
          <span className="text-[10px] text-white/40">{unit}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6">
      {/* Section 1: Biometric & General Profile Fields */}
      <section
        className="glass p-6 rounded-3xl border border-white/[0.08] grid gap-4 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)",
        }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8.5 w-8.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ActivityIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Health Profile</h2>
              <p className="text-[10px] text-white/40 mt-0.5">Live biometric analytics</p>
            </div>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
          <MetricRing
            label="BMI"
            value={liveBmi}
            unit="SCORE"
            icon={Scale}
            color="#3b82f6"
            progress={Math.min(100, (liveBmi / 40) * 100)}
          />
          <MetricRing
            label="BODY FAT"
            value={liveBf}
            unit="%"
            icon={Dna}
            color="#8b5cf6"
            progress={Math.min(100, (liveBf / 40) * 100)}
          />
          <MetricRing
            label="BMR"
            value={liveBmr}
            unit="KCAL"
            icon={HeartPulse}
            color="#ec4899"
            progress={Math.min(100, (liveBmr / 2500) * 100)}
          />
          <MetricRing
            label="TDEE"
            value={liveTdee}
            unit="KCAL"
            icon={Flame}
            color="#f59e0b"
            progress={Math.min(100, (liveTdee / 4000) * 100)}
          />
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.04]">
          <Field label={t("age")}>
            <NumberInput value={profile.age} onCommit={(v) => update({ age: v })} />
          </Field>
          <Field label={t("gender")}>
            <select
              value={profile.gender}
              onChange={(e) => update({ gender: e.target.value as Gender })}
              className={inputCls}
            >
              <option value="male">{t("male")}</option>
              <option value="female">{t("female")}</option>
            </select>
          </Field>
          <Field label={`${t("height")} (${t("cm")})`}>
            <NumberInput value={profile.heightCm} onCommit={(v) => update({ heightCm: v })} />
          </Field>
          <Field label={`${t("weight")} (${t("kg")})`}>
            <NumberInput value={profile.weightKg} onCommit={(v) => update({ weightKg: v })} />
          </Field>
          <Field label={`${t("targetWeight")} (${t("kg")})`}>
            <NumberInput
              value={profile.targetWeightKg}
              onCommit={(v) => update({ targetWeightKg: v })}
            />
          </Field>
          <Field
            label={`${t("waist")} (${t("cm")})`}
            tooltip={lang === "fa" ? "دور کمر جهت محاسبه درصد چربی" : "Used for body fat formula"}
          >
            <NumberInput value={profile.waistCm} onCommit={(v) => update({ waistCm: v })} />
          </Field>
          <Field
            label={`${t("neck")} (${t("cm")})`}
            tooltip={lang === "fa" ? "دور گردن جهت محاسبه درصد چربی" : "Used for body fat formula"}
          >
            <NumberInput value={profile.neckCm} onCommit={(v) => update({ neckCm: v })} />
          </Field>
          {profile.gender === "female" && (
            <Field
              label={`${t("hip")} (${t("cm")})`}
              tooltip={
                lang === "fa" ? "دور باسن جهت محاسبه درصد چربی" : "Used for body fat formula"
              }
            >
              <NumberInput value={profile.hipCm} onCommit={(v) => update({ hipCm: v })} />
            </Field>
          )}
          <Field label={t("activity")}>
            <select
              value={profile.activity}
              onChange={(e) => update({ activity: e.target.value as Activity })}
              className={inputCls}
            >
              <option value="sedentary">{t("sedentary")} (1.2)</option>
              <option value="light">{t("light")} (1.375)</option>
              <option value="moderate">{t("moderate")} (1.55)</option>
              <option value="very">{t("very")} (1.725)</option>
              <option value="extreme">{t("extreme")} (1.9)</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Section 2: Highly Advanced Medical Profile */}
      <section
        className="glass p-6 rounded-3xl border border-white/[0.08] grid gap-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)",
        }}
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Stethoscope className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t("medical")}</h2>
              <p className="text-[10px] text-white/40 mt-0.5">
                {lang === "fa"
                  ? "پیکربندی پرونده پزشکی برای بهینه‌سازی مربی هوش مصنوعی"
                  : "Medical record configurations used by the AI Coach"}
              </p>
            </div>
          </div>

          {/* AI Coach Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-medium text-white/70">AI Linked</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Diseases & Allergies */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[color:var(--aura-fg-muted)] font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              {t("diseases")}
            </span>
            <TagInput
              value={profile.diseases}
              onChange={(val) => update({ diseases: val })}
              presets={presets.diseases}
              placeholder={lang === "fa" ? "افزودن حساسیت یا بیماری..." : "Add allergy/disease..."}
              icon={HeartPulse}
              accentColor="#f87171"
            />
          </div>

          {/* Joint Limits */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[color:var(--aura-fg-muted)] font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {t("joints")}
            </span>
            <TagInput
              value={profile.joints}
              onChange={(val) => update({ joints: val })}
              presets={presets.joints}
              placeholder={lang === "fa" ? "افزودن محدودیت حرکتی..." : "Add joint limitation..."}
              icon={Bone}
              accentColor="#fbbf24"
            />
          </div>

          {/* Medications */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[color:var(--aura-fg-muted)] font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t("medications")}
            </span>
            <TagInput
              value={profile.medications}
              onChange={(val) => update({ medications: val })}
              presets={presets.medications}
              placeholder={lang === "fa" ? "افزودن داروی مصرفی..." : "Add medication..."}
              icon={Pill}
              accentColor="#34d399"
            />
          </div>
        </div>

        {/* AI Insight Box */}
        <AnimatePresence>
          {hasMedicalIssues && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-indigo-500/[0.03] border border-indigo-500/10 rounded-2xl flex gap-3 items-start"
            >
              <AlertCircle className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-[11px] font-semibold text-indigo-300 block">
                  {lang === "fa" ? "تحلیل ایمنی هوش مصنوعی" : "AI Coach Safety Insights"}
                </span>
                <p className="text-[10px] text-white/50 leading-relaxed mt-1">
                  {lang === "fa"
                    ? "اطلاعات ثبت شده در بالا به طور خودکار به عنوان پروتکل‌های ایمنی مربی هوش مصنوعی شما اعمال می‌شود. مربی در چت‌های بعدی به طور خودکار تمریناتی که بر روی مفاصل آسیب‌دیده فشار می‌آورند را حذف کرده و تداخلات دارویی با شدت تمرینات را کنترل خواهد کرد."
                    : "The above parameters are dynamically fed to your AI Coach. Recommended routines will automatically exclude movements affecting flagged joint limits and adjust intensity based on active medications."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
