/**
 * Post-build: start `vite dev` server, capture the SSR-rendered HTML
 * (with TanStack hydration data), then rewrite dev asset paths to
 * point to the production-built assets in .output/public/assets/.
 *
 * TanStack Start needs SSR hydration data — a bare <div id="root">
 * + <script> crashes with "Invariant failed" because no hydration
 * script is present.
 *
 * Workflow: vite build → this script → vite dev on temp port → fetch / →
 * rewrite asset src/href to production hashes → save to .output/public
 */
import { spawn } from "child_process";
import { writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cwd = join(__dirname, "..");
const outDir = join(cwd, ".output", "public");
const assetsDir = join(outDir, "assets");
const base = (process.env.VITE_BASE_PATH || "/").replace(/\/?$/, "/");

// --------------------------------------------------------------
// 1. Find production asset hashes
// --------------------------------------------------------------
const files = readdirSync(assetsDir);
const cssFiles = files.filter((f) => f.endsWith(".css"));
const indexJs = files
  .filter((f) => f.startsWith("index-") && f.endsWith(".js"))
  .map((f) => ({ name: f, size: statSync(join(assetsDir, f)).size }))
  .sort((a, b) => b.size - a.size)[0];

if (!indexJs) {
  console.error("❌ No index-*.js found in assets!");
  process.exit(1);
}
const cssFile = cssFiles[0];

// --------------------------------------------------------------
// 2. Start vite dev server on temp port
// --------------------------------------------------------------
console.log("🔄 Starting vite dev server for SSR capture...");
const child = spawn("npx", ["vite", "dev", "--port", "34599", "--host", "127.0.0.1", "--strictPort"], {
  cwd,
  env: { ...process.env },
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

child.stdout.on("data", (d) => process.stderr.write(d));
child.stderr.on("data", (d) => process.stderr.write(d));

// --------------------------------------------------------------
// 3. Wait for server, fetch HTML (follow redirects to base path)
// --------------------------------------------------------------
const maxRetries = 30;
let html = "";
const fetchUrl = `http://127.0.0.1:34599${base}`;

for (let i = 0; i < maxRetries; i++) {
  await new Promise((r) => setTimeout(r, 2500));
  try {
    const resp = await fetch(fetchUrl, { redirect: "follow" });
    if (resp.ok) {
      html = await resp.text();
      console.log(`✅ Got SSR HTML (${html.length} bytes)`);
      break;
    } else if (i === 0) {
      console.log(`  attempt ${i + 1}/${maxRetries}: status ${resp.status}`);
    }
  } catch {
    if (i < 3 || i % 5 === 0) console.log(`  retry ${i + 1}/${maxRetries}...`);
  }
}

// Kill dev server
child.kill("SIGTERM");
setTimeout(() => { try { child.kill("SIGKILL"); } catch {} }, 2000);

if (!html) {
  console.error("❌ Could not fetch SSR output — falling back to minimal shell");
  const cssLinks = cssFile ? `    <link rel="stylesheet" href="${base}assets/${cssFile}">` : "";
  html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Health Agent" />
    <title>Health Agent — Your AI-Powered Health OS</title>
    <meta name="description" content="Health Agent — a bilingual, glassmorphic AI health OS. Track biometrics, cardio, sleep, nutrition, and chat with an on-device AI coach (BYOK)." />
    <meta name="theme-color" content="#07080a" />
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    <link rel="manifest" href="${base}manifest.webmanifest" />
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
}

// --------------------------------------------------------------
// 4. Rewrite dev asset paths to production hashes
// --------------------------------------------------------------
// Replace dev CSS: /src/styles.css or /@tanstack-start/styles.css?...
// with production CSS
if (cssFile) {
  html = html.replace(
    /<link[^>]*href="[^"]*\/src\/styles\.css[^"]*"[^>]*>/g,
    `<link rel="stylesheet" href="${base}assets/${cssFile}">`
  );
  html = html.replace(
    /<link[^>]*\/@tanstack-start\/styles\.css[^"]*"[^>]*>/g,
    ""
  );
}

// Replace dev client entry with production JS
html = html.replace(
  /<script[^>]*src="[^"]*\/@id\/virtual:tanstack-start-dev-client-entry"[^>]*><\/script>/g,
  `<script type="module" src="${base}assets/${indexJs.name}"></script>`
);

// Remove modulepreload for dev entry
html = html.replace(
  /<link[^>]*modulepreload[^>]*href="[^"]*\/@id\/[^"]*"[^>]*>/g,
  ""
);

// Fix favicon, manifest, apple-touch paths
if (base !== "/") {
  html = html.replace(/(src|href)="\/favicon/g, `$1="${base}favicon`);
  html = html.replace(/(src|href)="\/manifest/g, `$1="${base}manifest`);
  html = html.replace(/(src|href)="\/apple-touch/g, `$1="${base}apple-touch`);
  html = html.replace(/(src|href)="\/sw\.js/g, `$1="${base}sw.js`);
  html = html.replace(/\/_serverFn\//g, `${base}_serverFn/`);
  // Fix SSR manifest script paths
  html = html.replace(/src:"\/@/g, `src:"${base}@`);
  html = html.replace(/src:"\/src\//g, `src:"${base}src/`);
}

// Remove dev data-tsd-source attributes
html = html.replace(/ data-tsd-source="[^"]*"/g, "");

// --------------------------------------------------------------
// 5. Write final HTML
// --------------------------------------------------------------
writeFileSync(join(outDir, "index.html"), html);
writeFileSync(join(outDir, "404.html"), html);
writeFileSync(join(outDir, ".nojekyll"), "");

console.log(`✅ Generated index.html, 404.html, .nojekyll`);
console.log(`   entry: ${base}assets/${indexJs.name}`);
console.log(`   css:   ${cssFile || "none"}`);
console.log(`   base:  ${base}`);
console.log(`   html:  ${html.length} bytes`);
