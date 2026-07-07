export function haptic(pattern: "log" | "achievement" | "error"): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    if (pattern === "log") navigator.vibrate(50);
    else if (pattern === "achievement") navigator.vibrate([50, 50, 50]);
    else if (pattern === "error") navigator.vibrate(200);
  } catch {
    /* ignore */
  }
}
