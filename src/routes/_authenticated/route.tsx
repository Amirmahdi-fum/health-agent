import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Authenticated route group.
 *
 * Legacy behaviour: redirect unauthenticated users to /auth.
 *
 * Current behaviour: this is a NO-OP group — anyone can access the nested
 * routes. The app is fully local-first: all data lives in IndexedDB /
 * localStorage via Zustand stores, and Supabase is only consulted if the
 * user explicitly signs in (entirely optional).
 *
 * Keeping the group layout means children can later be split into truly
 * protected sub-groups if needed.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});
