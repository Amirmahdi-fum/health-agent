import { Moon } from "lucide-react";
import { useT } from "@/lib/i18n";

export function ThemeToggle() {
  const { lang } = useT();
  return (
    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-[color:var(--aura-fg-muted)]">
      <Moon className="h-4 w-4 text-indigo-400" />
      <span className="text-sm font-medium">
        {lang === "fa" ? "تیره (پیش‌فرض)" : "Dark (Default)"}
      </span>
    </div>
  );
}
