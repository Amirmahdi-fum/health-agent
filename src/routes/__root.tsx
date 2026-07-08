import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useUI } from "../stores/ui";
import { AppShell } from "../components/layout/AppShell";
import { LogFab } from "../components/logs/LogFab";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CommandPalette } from "../components/command/CommandPalette";
import { OfflineBanner } from "../components/layout/OfflineBanner";
import { registerPwa } from "../lib/pwa/register-sw";
import { bulkInsertLogs } from "@/lib/logs.functions";
import { useLogs } from "@/stores/logs";
import { getProfile, upsertProfile } from "@/lib/profile.functions";
import { useProfile } from "@/stores/profile";
import { useNotificationScheduler } from "@/hooks/use-notification-scheduler";
import { useAutoSync } from "@/hooks/use-auto-sync";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import type { Profile } from "@/stores/profile";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Health Agent" },
      { title: "Health Agent — Your AI-Powered Health OS" },
      {
        name: "description",
        content:
          "Health Agent — a bilingual, glassmorphic AI health OS. Track biometrics, cardio, sleep, nutrition, and chat with an on-device AI coach (BYOK).",
      },
      { name: "author", content: "Health Agent" },
      { name: "theme-color", content: "#07080a" },
      { property: "og:title", content: "Health Agent — Your AI-Powered Health OS" },
      {
        property: "og:description",
        content:
          "Bilingual glassmorphic AI health OS. Biometrics, cardio, sleep, nutrition, streaks, and a BYOK AI coach.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/svg+xml", href: `${import.meta.env.BASE_URL}favicon.svg` },
      { rel: "alternate icon", href: `${import.meta.env.BASE_URL}favicon.ico`, type: "image/x-icon" },
      { rel: "manifest", href: `${import.meta.env.BASE_URL}manifest.webmanifest` },
      { rel: "apple-touch-icon", href: `${import.meta.env.BASE_URL}apple-touch-icon.png` },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Vazirmatn:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const lang = useUI((s) => s.lang);
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useNotificationScheduler();
  useAutoSync(queryClient);

  // No longer using `mounted` state to skip AppShell layout in SSR,
  // This ensures SSR and Client render the same DOM tree, preventing hydration errors
  // that were completely breaking the Dashboard and Friends pages.

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    document.title =
      lang === "fa"
        ? "هلث ایجنت — دستیار هوشمند سلامتی شما (فارسی)"
        : "Health Agent — Your AI-Powered Health OS";
  }, [lang]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();

        // Sync local logs and profile to Supabase upon successful sign-in
        if (event === "SIGNED_IN" && session?.user) {
          // 1. Sync Profile
          getProfile({ data: {} })
            .then((serverProfile) => {
              if (serverProfile) {
                // Server has a profile, merge/overwrite local with server data
                const mappedProfile: Partial<Profile> = {
                  ...(serverProfile.display_name ? { name: serverProfile.display_name } : {}),
                  ...(serverProfile.biometrics &&
                  typeof serverProfile.biometrics === "object" &&
                  !Array.isArray(serverProfile.biometrics)
                    ? (serverProfile.biometrics as Partial<Profile>)
                    : {}),
                };
                useProfile.getState().update(mappedProfile);
              } else {
                // No server profile yet, upload local data
                upsertProfile({ data: useProfile.getState().profile }).catch((e) =>
                  console.error("[Sync] Failed to upload local profile:", e.message),
                );
              }
            })
            .catch((e) => console.error("[Sync] Failed to fetch profile:", e.message));

          // 2. Sync Offline Logs
          const local = useLogs.getState().entries;
          if (local.length > 0) {
            bulkInsertLogs({
              data: {
                logs: local.map(({ type, payload, log_date }) => ({ type, payload, log_date })),
              },
            })
              .then((res) => {
                if (res?.inserted > 0) {
                  useLogs.getState().clearEntries();
                  queryClient.invalidateQueries({ queryKey: ["logs"] });
                }
              })
              .catch((e: Error) => {
                console.error("[Sync] failed to upload offline logs:", e.message);
              });
          }
        }
      },
    );
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  useEffect(() => {
    registerPwa().catch(() => {});
  }, []);

  const routeContent = (
    <div key={pathname} className="route-fade" suppressHydrationWarning>
      <Outlet />
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>{routeContent}</AppShell>
      <LogFab />
      <CommandPalette />
      <OfflineBanner />
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  );
}
