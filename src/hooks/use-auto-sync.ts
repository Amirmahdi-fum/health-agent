import { useEffect, useRef } from "react";
import { useSession } from "./use-session";
import { pickAdapter } from "@/lib/sync/health-adapter";
import { recordSync } from "@/lib/sync.functions";
import type { QueryClient } from "@tanstack/react-query";

export function useAutoSync(queryClient: QueryClient) {
  const { user } = useSession();
  const isInteracting = useRef(false);
  const syncTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const trackElements = (): boolean => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" ||
        active.getAttribute("contenteditable") === "true" ||
        active.closest("[data-interactive='true']") !== null;
    };

    const performSync = async () => {
      if (isInteracting.current || trackElements()) {
        syncTimeout.current = window.setTimeout(performSync, 10000);
        return;
      }
      try {
        const adapter = pickAdapter();
        const entries = await adapter.sync();
        if (entries && entries.length > 0) {
          await recordSync({ data: { entries } });
          queryClient.invalidateQueries({ queryKey: ["sync-latest"] });
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      } catch (err) {
        console.debug("[AutoSync]", err);
      }
      const delay = 45000 + Math.floor(Math.random() * 15001);
      syncTimeout.current = window.setTimeout(performSync, delay);
    };

    const onStart = () => { isInteracting.current = true; };
    const onEnd = () => { isInteracting.current = false; };

    document.addEventListener("focusin", trackElements);
    document.addEventListener("focusout", trackElements);
    document.addEventListener("mousedown", onStart);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchstart", onStart);
    document.addEventListener("touchend", onEnd);

    syncTimeout.current = window.setTimeout(performSync, 45000);

    return () => {
      document.removeEventListener("focusin", trackElements);
      document.removeEventListener("focusout", trackElements);
      document.removeEventListener("mousedown", onStart);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [user, queryClient]);
}
