// Render stills of a composition at given frames with a single bundle + browser (visual QC).
// usage: node scripts/p10_stills.mjs <compId> <outDir> <frame,frame,...> [scale]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
const [compId, outDir, framesArg, scaleArg] = process.argv.slice(2);
const frames = framesArg.split(",").map(Number);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), webpackOverride: (c) => c, rspack: true });
const browser = await openBrowser("chrome", { browserExecutable: process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell", chromiumOptions: { gl: "swangle" } });
const inputProps = scaleArg ? { scale: Number(scaleArg) } : {};
const composition = await selectComposition({ serveUrl, id: compId, inputProps, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" } });
for (const f of frames) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: path.join(outDir, `f${String(f).padStart(6, "0")}.jpg`), imageFormat: "jpeg", jpegQuality: 85, inputProps, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" } });
  console.log(`frame ${f} ${Date.now() - t0} ms`);
}
await browser.close({ silent: true });
