/**
 * Post-build: replace placeholders in index-template.html with
 * actual production asset hashes, then write to .output/public.
 *
 * The template was captured from a `vite dev` SSR run and contains
 * TanStack Start hydration data ($tsr-stream-barrier) that is
 * required for the client to mount React without "Invariant failed".
 */
import { writeFileSync, readdirSync, statSync, readFileSync } from "fs";
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
// 2. Read template and replace placeholders
// --------------------------------------------------------------
const templatePath = join(__dirname, "index-template.html");
let html = readFileSync(templatePath, "utf-8");

html = html.replace(/\{\{INDEX_JS\}\}/g, indexJs.name);
html = html.replace(/\{\{STYLES_CSS\}\}/g, cssFile || "");

// Disable user display of console.error output.
// --------------------------------------------------------------
// 3. Write final HTML
// --------------------------------------------------------------
writeFileSync(join(outDir, "index.html"), html);
writeFileSync(join(outDir, "404.html"), html);
writeFileSync(join(outDir, ".nojekyll"), "");

console.log(`✅ Generated index.html, 404.html, .nojekyll (SSR hydration template)`);
console.log(`   entry: ${base}assets/${indexJs.name}`);
console.log(`   css:   ${base}assets/${cssFile || "none"}`);
console.log(`   base:  ${base}`);
console.log(`   html:  ${html.length} bytes`);
