// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    base: process.env.VITE_BASE_PATH || "/",
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        strategies: "generateSW",
        devOptions: { enabled: false },
        // Place SW in the Nitro output directory so the deployed PWA actually finds it
        outDir: ".output/public",
        injectManifest: undefined as any,
        manifest: {
          name: "Health Agent",
          short_name: "HealthAgent",
          description: "Your AI-Powered Health OS",
          theme_color: "#07080a",
          background_color: "#07080a",
          display: "standalone",
          start_url: `${process.env.VITE_BASE_PATH || "/"}?source=pwa`,
          scope: process.env.VITE_BASE_PATH || "/",
          icons: [
            {
              src: `${process.env.VITE_BASE_PATH || ""}favicon.svg`,
              sizes: "any",
              type: "image/svg+xml",
            },
            {
              src: `${process.env.VITE_BASE_PATH || ""}apple-touch-icon.png`,
              sizes: "180x180",
              type: "image/png",
            },
          ],
        },
        workbox: {
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /^\/_serverFn\//],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "health-html", networkTimeoutSeconds: 4 },
            },
            {
              urlPattern: ({ request, url }) =>
                url.origin === self.location.origin &&
                ["style", "script", "worker", "image", "font"].includes(request.destination),
              handler: "CacheFirst",
              options: {
                cacheName: "health-assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
  },
});
