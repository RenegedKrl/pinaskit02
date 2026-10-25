// Gera public/w.js (minificado). Uso: node widget/build.mjs
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
await build({
  entryPoints: ["widget/src/index.ts"], bundle: true, minify: true, format: "iife",
  target: "es2018", outfile: "public/w.js", legalComments: "none",
});
const size = gzipSync(readFileSync("public/w.js")).length;
console.log(`public/w.js: ${(size / 1024).toFixed(1)} KB gzip`);
if (size > 12 * 1024) { console.error("Acima de 12 KB gzip"); process.exit(1); }
