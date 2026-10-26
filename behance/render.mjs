// Gera as pranchas PNG (node behance/render.mjs) e, com "motion", os vídeos MP4.
import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, "export");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

async function boards() {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(dir, "src/boards.html")).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  for (const s of await page.$$("section[data-name]")) {
    const name = await s.getAttribute("data-name");
    await s.screenshot({ path: path.join(out, `${name}.png`) });
    console.log("prancha", name);
  }
  await page.close();
}

// Vídeo quadro a quadro: pausa as animações CSS e avança o tempo manualmente (sem travadas).
async function motion(name, seconds, fps = 30) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pathToFileURL(path.join(dir, `src/${name}.html`)).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const tmp = path.join(out, `_${name}`); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp);
  const total = Math.round(seconds * fps);
  for (let f = 0; f < total; f++) {
    await page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), (f / fps) * 1000);
    await page.screenshot({ path: path.join(tmp, `${String(f).padStart(4, "0")}.png`) });
  }
  await new Promise((ok, fail) => spawn("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(tmp, "%04d.png"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", path.join(out, `${name}.mp4`)], { stdio: "inherit" })
    .on("exit", (c) => (c ? fail(new Error("ffmpeg " + c)) : ok())));
  await new Promise((ok, fail) => spawn("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(out, `${name}.mp4`), "-vf", "fps=15,scale=1400:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=200[p];[b][p]paletteuse=dither=sierra2_4a",
    path.join(out, `${name}.gif`)], { stdio: "inherit" }).on("exit", (c) => (c ? fail(new Error("gif " + c)) : ok())));
  rmSync(tmp, { recursive: true, force: true });
  console.log("vídeo", name);
  await page.close();
}

const arg = process.argv[2];
if (!arg || arg === "boards") await boards();
if (!arg || arg === "motion") for (const [n, s] of [["motion-1-intro", 9], ["motion-2-widget", 11], ["motion-3-funil", 8]]) await motion(n, s);
await browser.close();
