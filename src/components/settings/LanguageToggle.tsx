import { useUI } from "@/stores/ui";
import { useT } from "@/lib/i18n";

export function LanguageToggle() {
  const lang = useUI((s) => s.lang);
  const toggleLang = useUI((s) => s.toggleLang);
  const { t } = useT();

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all"
    >
      <span className="text-sm font-medium">{lang === "fa" ? "فارسی (FA)" : "English (EN)"}</span>
    </button>
  );
}
