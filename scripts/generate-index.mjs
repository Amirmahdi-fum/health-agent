/**
 * Post-build: generate index.html for GitHub Pages (static SPA).
 * TanStack Start + @lovable.dev/vite-tanstack-config only produces SSR output.
 * This script creates a minimal index.html that loads the client bundle.
 */
import { readdirSync, writeFileSync, statSync } from "fs";
import { join } from "path";

const outDir = join(import.meta.dirname, "..", ".output", "public");
const assetsDir = join(outDir, "assets");
const base = (process.env.VITE_BASE_PATH || "/").replace(/\/?$/, "/");

const files = readdirSync(assetsDir);
const cssFiles = files.filter((f) => f.endsWith(".css"));

// Main entry = largest index-*.js
const indexJs = files
  .filter((f) => f.startsWith("index-") && f.endsWith(".js"))
  .map((f) => ({ name: f, size: statSync(join(assetsDir, f)).size }))
  .sort((a, b) => b.size - a.size)[0];

if (!indexJs) {
  console.error("❌ No index-*.js found in assets!");
  process.exit(1);
}

const cssLinks = cssFiles
  .map((f) => `    <link rel="stylesheet" href="${base}assets/${f}">`)
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Health Agent" />
    <title>Health Agent — Your AI-Powered Health OS</title>
    <meta name="description" content="Health Agent — a bilingual, glassmorphic AI health OS. Track biometrics, cardio, sleep, nutrition, and chat with an on-device AI coach (BYOK)." />
    <meta name="author" content="Health Agent" />
    <meta name="theme-color" content="#07080a" />
    <meta property="og:title" content="Health Agent — Your AI-Powered Health OS" />
    <meta property="og:description" content="Bilingual glassmorphic AI health OS. Biometrics, cardio, sleep, nutrition, streaks, and a BYOK AI coach." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    <link rel="alternate icon" href="${base}favicon.ico" type="image/x-icon" />
    <link rel="manifest" href="${base}manifest.webmanifest" />
    <link rel="apple-touch-icon" href="${base}apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Vazirmatn:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" />
${cssLinks}
  </head>
  <body class="min-h-dvh bg-background font-sans text-foreground antialiased">
    <div id="root"></div>
    <script type="module" src="${base}assets/${indexJs.name}"></script>
  </body>
</html>`;

// .nojekyll tells GitHub Pages to skip Jekyll and serve files as-is
writeFileSync(join(outDir, ".nojekyll"), "");
writeFileSync(join(outDir, "index.html"), html);
writeFileSync(join(outDir, "404.html"), html);
console.log(`✅ Generated index.html, 404.html, .nojekyll`);
console.log(`   entry: ${base}assets/${indexJs.name}`);
console.log(`   css:   ${cssFiles.length} file(s)`);
console.log(`   base:  ${base}`);
