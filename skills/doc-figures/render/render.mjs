#!/usr/bin/env node
// Render figure specs (JSON) to PNG with one headless Chrome:
//   node render.mjs spec.json [more.json ...] [--out DIR] [--theme both|dark|light] [--no-sheet]
import {spawn} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(HERE, "page.html")).href;

function parseArgs(argv) {
  const opts = {files: [], out: "figures", theme: "both", sheet: true};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") opts.out = argv[++i];
    else if (a === "--theme") opts.theme = argv[++i];
    else if (a === "--no-sheet") opts.sheet = false;
    else if (a === "-h" || a === "--help") opts.help = true;
    else opts.files.push(a);
  }
  return opts;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  const mac = "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
  for (const pw of ["Library/Caches/ms-playwright", ".cache/ms-playwright"].map((p) => path.join(os.homedir(), p)))
    if (fs.existsSync(pw))
      for (const d of fs.readdirSync(pw).filter((d) => d.startsWith("chromium-")).sort().reverse())
        for (const exe of [`chrome-mac-arm64/${mac}`, `chrome-mac/${mac}`, "chrome-linux64/chrome", "chrome-linux/chrome"])
          candidates.push(path.join(pw, d, exe));
  const found = candidates.find((c) => c && fs.existsSync(c));
  if (!found) throw new Error("No Chrome found. Install Google Chrome or set CHROME_PATH.");
  return found;
}

function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "docfigs-chrome-"));
  const proc = spawn(findChrome(), [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--hide-scrollbars",
    "--disable-gpu", "--allow-file-access-from-files", "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "about:blank",
  ], {stdio: ["ignore", "ignore", "pipe"]});
  const exited = new Promise((r) => proc.once("exit", r));
  const done = async () => {
    proc.kill();
    await Promise.race([exited, sleep(3000)]);
    fs.rmSync(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 100});
  };
  return new Promise((resolve, reject) => {
    let buf = "";
    const timer = setTimeout(() => reject(new Error("Chrome did not start within 15s")), 15000);
    proc.stderr.on("data", (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); resolve({url: m[1], done}); }
    });
    proc.once("exit", (code) => reject(new Error(`Chrome exited (${code}): ${buf.slice(-500)}`)));
  });
}

class CDP {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); }
  open() {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      const p = d.id && this.pending.get(d.id);
      if (!p) return;
      this.pending.delete(d.id);
      d.error ? p.reject(new Error(`${p.method}: ${d.error.message}`)) : p.resolve(d.result);
    };
    return new Promise((ok, fail) => { this.ws.onopen = ok; this.ws.onerror = () => fail(new Error("CDP connect failed")); });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({id, method, params, sessionId}));
    return new Promise((resolve, reject) => this.pending.set(id, {resolve, reject, method}));
  }
}

function loadSpecs(files) {
  const specs = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(f, "utf8"));
    const list = Array.isArray(data) ? data : [data];
    const stem = path.basename(f).replace(/\.json$/, "");
    list.forEach((s, i) => specs.push({...s, name: s.name || (list.length > 1 ? `${stem}-${i + 1}` : stem)}));
  }
  return specs;
}

function loadIcons() {
  const dir = path.join(HERE, "icons");
  const icons = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".svg")))
    icons[f.slice(0, -4)] = fs.readFileSync(path.join(dir, f), "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
  return icons;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function renderOne(cdp, sid, spec, theme, icons, outFile) {
  const boot = `window.SPEC=${JSON.stringify(spec)};window.THEME=${JSON.stringify(theme)};window.ICONS=${JSON.stringify(icons)};`;
  const {identifier} = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {source: boot}, sid);
  await cdp.send("Page.navigate", {url: PAGE}, sid);
  let state;
  for (let t = 0; t < 300; t++) {
    await sleep(25);
    const r = await cdp.send("Runtime.evaluate", {expression: "document.body && document.body.dataset.done", returnByValue: true}, sid);
    state = r.result.value;
    if (state) break;
  }
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", {identifier}, sid);
  const read = async (expr) => (await cdp.send("Runtime.evaluate", {expression: expr, returnByValue: true}, sid)).result.value;
  if (state !== "1") throw new Error(state === "error" ? await read("document.body.dataset.error") : "render timed out after 7.5s");
  const {w, h, warnings} = await read("({w:+document.body.dataset.w,h:+document.body.dataset.h,warnings:JSON.parse(document.body.dataset.warnings)})");
  const shot = await cdp.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: true, clip: {x: 0, y: 0, width: w, height: h, scale: 1}}, sid);
  fs.writeFileSync(outFile, Buffer.from(shot.data, "base64"));
  return {w: w * 2, h: h * 2, warnings};
}

async function contactSheet(cdp, sid, entries, outFile) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
  const cells = entries.map((e) => `<figure><figcaption>${esc(e.name)}${e.warnings.length ? ` <b>${e.warnings.length} warning(s)</b>` : ""}</figcaption><img src="${pathToFileURL(e.file).href}"></figure>`).join("");
  const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:16px;background:#777;font:14px -apple-system,sans-serif;display:grid;grid-template-columns:repeat(2,880px);gap:16px;align-items:start;width:max-content}figure{margin:0}figcaption{color:#fff;margin:0 0 6px}b{color:#ffd54f}img{width:880px;display:block}</style>${cells}`;
  const tmp = path.join(os.tmpdir(), `docfigs-sheet-${process.pid}.html`);
  fs.writeFileSync(tmp, html);
  await cdp.send("Emulation.setDeviceMetricsOverride", {width: 1820, height: 1000, deviceScaleFactor: 1, mobile: false}, sid);
  await cdp.send("Page.navigate", {url: pathToFileURL(tmp).href}, sid);
  for (let t = 0; t < 200; t++) {
    await sleep(25);
    const r = await cdp.send("Runtime.evaluate", {expression: "document.readyState==='complete' && [...document.images].every(i=>i.complete)", returnByValue: true}, sid);
    if (r.result.value) break;
  }
  const size = (await cdp.send("Runtime.evaluate", {expression: "({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight})", returnByValue: true}, sid)).result.value;
  const shot = await cdp.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: true, clip: {x: 0, y: 0, width: size.w, height: size.h, scale: 1}}, sid);
  fs.writeFileSync(outFile, Buffer.from(shot.data, "base64"));
  fs.rmSync(tmp, {force: true});
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.files.length) {
    console.log("usage: node render.mjs spec.json [more.json ...] [--out DIR] [--theme both|dark|light] [--no-sheet]");
    process.exit(opts.help ? 0 : 2);
  }
  const themes = opts.theme === "both" ? ["dark", "light"] : [opts.theme];
  const specs = loadSpecs(opts.files);
  const icons = loadIcons();
  fs.mkdirSync(opts.out, {recursive: true});
  const started = Date.now();
  const chrome = await launch();
  let failed = 0;
  try {
    const cdp = new CDP(chrome.url);
    await cdp.open();
    const {targetId} = await cdp.send("Target.createTarget", {url: "about:blank"});
    const {sessionId: sid} = await cdp.send("Target.attachToTarget", {targetId, flatten: true});
    await cdp.send("Page.enable", {}, sid);
    await cdp.send("Runtime.enable", {}, sid);
    const sheet = [];
    for (const spec of specs) {
      for (const theme of themes) {
        await cdp.send("Emulation.setDeviceMetricsOverride", {width: 1600, height: 1200, deviceScaleFactor: 2, mobile: false}, sid);
        const file = path.resolve(opts.out, `${spec.name}.${theme}.png`);
        try {
          const r = await renderOne(cdp, sid, spec, theme, icons, file);
          console.log(`${path.relative(process.cwd(), file)}  ${r.w}x${r.h}`);
          if (theme === themes[0]) {
            r.warnings.forEach((w) => console.log(`  WARN ${w}`));
            sheet.push({name: spec.name, file, warnings: r.warnings});
          }
        } catch (err) {
          failed++;
          console.log(`FAIL ${spec.name} (${theme}): ${String(err.message || err).split("\n").slice(0, 4).join("\n  ")}`);
        }
      }
    }
    if (opts.sheet && sheet.length > 1) {
      // Four per sheet keeps each sheet short enough to inspect without heavy downscaling.
      const pages = [];
      for (let i = 0; i < sheet.length; i += 4) pages.push(sheet.slice(i, i + 4));
      for (const [i, page] of pages.entries()) {
        const file = path.resolve(opts.out, pages.length > 1 ? `contact-sheet-${i + 1}.png` : "contact-sheet.png");
        await contactSheet(cdp, sid, page, file);
        console.log(`${path.relative(process.cwd(), file)}  (figures at doc width; inspect these, not each PNG)`);
      }
    }
  } finally {
    await chrome.done();
  }
  console.log(`done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
