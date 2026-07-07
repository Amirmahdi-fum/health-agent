// Add missing letters and complete the character blocks.
export function languageValidation(text: string, lang: "en" | "fa"): string {
  if (!text) return text;

  if (lang === "en") {
    // Strip Cyrillic (Russian) and CJK (Chinese/Japanese/Korean) blocks + Greek
    return text.replace(/[\u0370-\u03FF\u0400-\u04FF\u4E00-\u9FFF]/g, "");
  }

  // For Persian (fa):
  // 1. Strip Cyrillic, CJK, Greek
  let clean = text.replace(/[\u0370-\u03FF\u0400-\u04FF\u4E00-\u9FFF]/g, "");

  // 2. Replace common Arabic-specific characters with their Persian equivalents
  clean = clean
    .replace(/ي/g, "ی") // Arabic Ya to Persian Ye
    .replace(/ك/g, "ک") // Arabic Kaf to Persian Ke
    .replace(/ة/g, "ه") // Ta Marbuta to Heh
    // Remove Arabic diacritics (Tashkeel)
    .replace(/[\u064B-\u0652]/g, "");

  return clean;
}
