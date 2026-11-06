#!/usr/bin/env node
// Render figure specs (JSON) to PNG with one headless Chrome:
//   node render.mjs spec.json [more.json ...] [--out DIR] [--theme both|dark|light] [--no-sheet] [--svg] [--html] [--t3]
// --svg also writes <name>.<theme>.svg (vector, see svg.js). --html also writes <name>.html. --t3 writes only
// <name>.t3.html for T3 Code's html_render: laid out for its 728 px frame, with no page background or padding.
import {spawn} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(path.join(HERE, "page.html")).href;

function parseArgs(argv) {
  const opts = {files: [], out: "figures", theme: "both", sheet: true, svg: false, html: false, t3: false};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") opts.out = argv[++i];
    else if (a === "--theme") opts.theme = argv[++i];
    else if (a === "--no-sheet") opts.sheet = false;
    else if (a === "--svg") opts.svg = true;
    else if (a === "--html") opts.html = true;
    else if (a === "--t3") opts.html = opts.t3 = true;
    else if (a === "-h" || a === "--help") opts.help = true;
    else opts.files.push(a);
  }
  return opts;
}

/** Playwright's chrome-headless-shell starts in about 60 ms, against about 300 ms for full Chrome, with the same pixels. */
function findHeadlessShell() {
  for (const pw of ["Library/Caches/ms-playwright", ".cache/ms-playwright"].map((p) => path.join(os.homedir(), p))) {
    if (!fs.existsSync(pw)) continue;
    for (const d of fs.readdirSync(pw).filter((d) => d.startsWith("chromium_headless_shell-")).sort().reverse())
      for (const sub of fs.readdirSync(path.join(pw, d)))
        for (const exe of ["chrome-headless-shell", "headless_shell"]) {
          const p = path.join(pw, d, sub, exe);
          if (fs.existsSync(p)) return p;
        }
  }
  return null;
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const shell = findHeadlessShell();
  if (shell) return shell;
  const candidates = [
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
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error("No Chrome found. Install Google Chrome or set CHROME_PATH.");
  return found;
}

function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "docfigs-chrome-"));
  const exe = findChrome();
  const shell = /headless.shell/.test(path.basename(exe));
  const proc = spawn(exe, [
    ...(shell ? [] : ["--headless=new"]), "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--hide-scrollbars",
    "--disable-gpu", "--allow-file-access-from-files", "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
    // Puppeteer's startup set: skip Keychain, sync, component updates and other background services.
    "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-sync",
    "--metrics-recording-only", "--no-service-autorun", "--password-store=basic", "--use-mock-keychain",
    "--disable-field-trial-config", "--disable-client-side-phishing-detection", "--disable-domain-reliability",
    "--disable-hang-monitor", "--disable-ipc-flooding-protection",
    "--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,CertificateTransparencyComponentUpdater,AutofillServerCommunication",
    // Open page.html at startup so the first tab loads it while Chrome is still coming up.
    "--disable-backgrounding-occluded-windows", PAGE,
  ], {stdio: ["ignore", "ignore", "pipe"]});
  const exited = new Promise((r) => proc.once("exit", r));
  const done = async () => {
    // SIGKILL: the profile is thrown away, so a graceful shutdown only adds time.
    proc.kill("SIGKILL");
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
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); this.waiters = []; }
  open() {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.method) {
        this.waiters = this.waiters.filter((w) => !(w.method === d.method && w.sid === d.sessionId && (w.resolve(d.params), true)));
        return;
      }
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
  /** Resolves on the next `method` event from `sid`. Register before the call that triggers it. */
  once(method, sid) { return new Promise((resolve) => this.waiters.push({method, sid, resolve})); }
}

/**
 * A tab with page.html loaded once; each figure then renders in place, with no navigation.
 * The first tab is the one Chrome opened at startup. Icons are set after load: icon() reads them only at render time.
 */
async function openTab(cdp, icons) {
  let targetId = null;
  if (!cdp.startTabTaken) {
    cdp.startTabTaken = true;
    const {targetInfos} = await cdp.send("Target.getTargets");
    targetId = targetInfos.find((t) => t.type === "page" && t.url === PAGE)?.targetId;
  }
  if (!targetId) ({targetId} = await cdp.send("Target.createTarget", {url: PAGE}));
  const {sessionId: sid} = await cdp.send("Target.attachToTarget", {targetId, flatten: true});
  // A new tab can still show its first blank document, so wait inside the page and retry if a navigation
  // replaces the document while we wait.
  const ready = `new Promise((ok) => { const c = () => typeof renderFigure === "function" && document.readyState === "complete"
    ? ok((window.ICONS = ${JSON.stringify(icons)}, true)) : setTimeout(c, 5); c(); })`;
  const deadline = Date.now() + 15000;
  for (;;) {
    const r = await cdp.send("Runtime.evaluate", {expression: ready, awaitPromise: true, returnByValue: true}, sid).catch((e) => ({e}));
    if (r.result?.value === true) break;
    if (Date.now() > deadline) throw new Error("page.html did not load");
    await sleep(5);
  }
  return sid;
}

/**
 * tokens.css rewritten for a shadow root: :root becomes :host, and the body rules move to the host element.
 * `all: initial` keeps the embedding page's fonts and colors out of the figure.
 */
function hostCss() {
  let css = fs.readFileSync(path.join(HERE, "tokens.css"), "utf8");
  for (const [from, to] of [
    [":root[data-theme=light] {", ":host([data-theme=light]) {"],
    [":root {", ":host {"],
    ["html, body { margin: 0; background: var(--bg); }", ":host { all: initial; display: block; box-sizing: border-box; background: var(--bg); }"],
    ["\nbody {", "\n:host {"],
  ]) {
    if (!css.includes(from)) throw new Error(`tokens.css changed; update hostCss() for "${from.trim()}"`);
    css = css.replace(from, to);
  }
  return css;
}

const escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/**
 * One HTML file per figure. Each theme is a <div class="docfig"> with a declarative shadow root, so its CSS and
 * ids stay inside it; with both themes, prefers-color-scheme shows the one that matches the reader.
 * Text uses the reader's system fonts, so the PNG stays the checked version.
 */
function figureHtml(spec, parts, t3 = false) {
  // For T3 Code's html_render the host app supplies the background and margins. A flow may lay out up to 10%
  // wider than its canvas; the frame can't grow, so zoom that figure down to fit.
  const wide = parts[0].w / 2 - BODY_PAD_X;
  const fit = wide > T3_CONTENT ? `width: ${wide}px; zoom: ${(T3_CONTENT / wide).toFixed(4)};` : "width: 100%;";
  const base = hostCss() + (t3 ? `\n:host { background: transparent; padding: 0; ${fit} }` : "");
  const figs = parts.map((p) => {
    const {html, styles, hostStyle} = p.exported;
    return `<div class="docfig" data-theme="${p.theme}"${hostStyle ? ` style="${escAttr(hostStyle)}"` : ""}>` +
      `<template shadowrootmode="open"><style>${base}\n${styles.join("\n")}</style>${html}</template></div>`;
  }).join("\n");
  const toggle = parts.length > 1
    ? `<style>@media (prefers-color-scheme: dark) { .docfig[data-theme=light] { display: none; } }
@media not (prefers-color-scheme: dark) { .docfig[data-theme=dark] { display: none; } }</style>\n`
    : "";
  const title = String(spec.title || spec.name).replace(/[&<>]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"})[c]);
  return `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>${title}</title>
<body style="margin: 0${t3 ? "; background: transparent" : ""}">
<!-- doc-figures: copy from here to "end figure" to embed. Edit the spec JSON and re-render, not this file. -->
${toggle}${figs}
<!-- end figure -->
`;
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

const RENDER_TIMEOUT_MS = 7500;
class TimeoutError extends Error {}
const withTimeout = (p, ms, msg) => {
  let timer;
  const expire = new Promise((_, fail) => { timer = setTimeout(() => fail(new TimeoutError(msg)), ms); });
  return Promise.race([p, expire]).finally(() => clearTimeout(timer));
};

/** html_render's frame is 728 px with an 8 px gutter each side; body padding (30 px a side) is dropped on export. */
const T3_CONTENT = 712, BODY_PAD_X = 60;

async function renderOne(cdp, sid, spec, theme, outFile, {html = false, png = true, svg = false} = {}) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {width: 1600, height: 1200, deviceScaleFactor: 2, mobile: false}, sid);
  const r = await withTimeout(cdp.send("Runtime.evaluate", {
    expression: `renderFigure(${JSON.stringify(spec)}, ${JSON.stringify(theme)})`, awaitPromise: true, returnByValue: true,
  }, sid), RENDER_TIMEOUT_MS, `render timed out after ${RENDER_TIMEOUT_MS / 1000}s`);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  const {w, h, warnings, error} = r.result.value;
  if (error) throw new Error(error);
  if (png) {
    const shot = await cdp.send("Page.captureScreenshot", {format: "png", captureBeyondViewport: true, clip: {x: 0, y: 0, width: w, height: h, scale: 1}}, sid);
    await fs.promises.writeFile(outFile, Buffer.from(shot.data, "base64"));
  }
  if (svg) {
    const doc = (await cdp.send("Runtime.evaluate", {expression: "figureSvg()", returnByValue: true}, sid)).result.value;
    await fs.promises.writeFile(outFile.replace(/\.png$/, ".svg"), doc);
  }
  const exported = html
    ? (await cdp.send("Runtime.evaluate", {expression: `exportFigure(${JSON.stringify(theme)})`, returnByValue: true}, sid)).result.value
    : null;
  return {w: w * 2, h: h * 2, warnings, exported};
}

async function contactSheet(cdp, sid, entries, outFile) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
  const cells = entries.map((e) => `<figure><figcaption>${esc(e.name)}${e.warnings.length ? ` <b>${e.warnings.length} warning(s)</b>` : ""}</figcaption><img src="${pathToFileURL(e.file).href}"></figure>`).join("");
  const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:16px;background:#777;font:14px -apple-system,sans-serif;display:grid;grid-template-columns:repeat(2,880px);gap:16px;align-items:start;width:max-content}figure{margin:0}figcaption{color:#fff;margin:0 0 6px}b{color:#ffd54f}img{width:880px;display:block}</style>${cells}`;
  const tmp = `${outFile}.tmp.html`;
  await fs.promises.writeFile(tmp, html);
  await cdp.send("Emulation.setDeviceMetricsOverride", {width: 1820, height: 1000, deviceScaleFactor: 1, mobile: false}, sid);
  const loaded = cdp.once("Page.loadEventFired", sid);
  await cdp.send("Page.navigate", {url: pathToFileURL(tmp).href}, sid);
  await withTimeout(loaded, 5000, "contact sheet did not load");
  const size = (await cdp.send("Runtime.evaluate", {expression: "({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight})", returnByValue: true}, sid)).result.value;
  // Only the agent looks at contact sheets, so trade file size for a faster encode (same pixels).
  const shot = await cdp.send("Page.captureScreenshot", {format: "png", optimizeForSpeed: true, captureBeyondViewport: true, clip: {x: 0, y: 0, width: size.w, height: size.h, scale: 1}}, sid);
  await fs.promises.writeFile(outFile, Buffer.from(shot.data, "base64"));
  await fs.promises.rm(tmp, {force: true});
}

async function blankTab(cdp) {
  const {targetId} = await cdp.send("Target.createTarget", {url: "about:blank"});
  const {sessionId: sid} = await cdp.send("Target.attachToTarget", {targetId, flatten: true});
  await cdp.send("Page.enable", {}, sid);
  return sid;
}

/**
 * Run `jobs` (async functions taking a tab session) on up to `n` tabs from `open()`, in list order.
 * A job that returns "replace-tab" left its page in an unknown state, so the worker opens a fresh tab.
 */
async function pool(n, jobs, open) {
  let next = 0;
  const worker = async () => {
    let sid = await open();
    while (next < jobs.length) if ((await jobs[next++](sid)) === "replace-tab") sid = await open();
  };
  await Promise.all(Array.from({length: Math.min(n, jobs.length)}, worker));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.files.length) {
    console.log("usage: node render.mjs spec.json [more.json ...] [--out DIR] [--theme both|dark|light] [--no-sheet] [--svg] [--html] [--t3]");
    process.exit(opts.help ? 0 : 2);
  }
  const started = Date.now();
  const chromeReady = launch();
  chromeReady.catch(() => {});
  const themes = opts.theme === "both" ? ["dark", "light"] : [opts.theme];
  const specs = loadSpecs(opts.files);
  const icons = loadIcons();
  fs.mkdirSync(opts.out, {recursive: true});
  const chrome = await chromeReady;
  const tabs = Math.max(1, Math.min(+process.env.DOCFIGS_TABS || 6, os.availableParallelism()));
  let failed = 0;
  try {
    const cdp = new CDP(chrome.url);
    await cdp.open();
    // Results are stored per job and printed in input order, so the log reads the same at any tab count.
    const results = [];
    const jobs = [];
    for (const spec of specs)
      for (const theme of themes) {
        const file = path.resolve(opts.out, `${spec.name}.${theme}.png`);
        const slot = results.push(null) - 1;
        jobs.push(async (sid) => {
          try { results[slot] = {spec, theme, file, ...(await renderOne(cdp, sid, opts.t3 ? {...spec, width: T3_CONTENT + BODY_PAD_X} : spec, theme, file, {html: opts.html, png: !opts.t3, svg: opts.svg && !opts.t3}))}; }
          catch (err) {
            results[slot] = {spec, theme, err};
            // A timed-out template may still be running and would draw into the next figure.
            if (err instanceof TimeoutError) return "replace-tab";
          }
        });
      }
    await pool(tabs, jobs, () => openTab(cdp, icons));
    const sheet = [];
    for (const r of results) {
      if (r.err) {
        failed++;
        console.log(`FAIL ${r.spec.name} (${r.theme}): ${String(r.err.message || r.err).split("\n").slice(0, 4).join("\n  ")}`);
        continue;
      }
      if (!opts.t3) console.log(`${path.relative(process.cwd(), r.file)}  ${r.w}x${r.h}${opts.svg ? "  (and .svg)" : ""}`);
      if (r.theme === themes[0]) {
        r.warnings.forEach((w) => console.log(`  WARN ${w}`));
        sheet.push({name: r.spec.name, file: r.file, warnings: r.warnings});
      }
    }
    if (opts.html)
      for (const spec of specs) {
        const parts = results.filter((r) => r.spec === spec && !r.err);
        if (parts.length !== themes.length) continue;
        const file = path.resolve(opts.out, `${spec.name}${opts.t3 ? ".t3" : ""}.html`);
        await fs.promises.writeFile(file, figureHtml(spec, parts, opts.t3));
        console.log(`${path.relative(process.cwd(), file)}  (HTML, ${themes.join(" and ")} theme)`);
      }
    if (opts.sheet && !opts.t3 && sheet.length > 1) {
      // Four per sheet keeps each sheet short enough to inspect without heavy downscaling.
      const pages = [];
      for (let i = 0; i < sheet.length; i += 4) pages.push(sheet.slice(i, i + 4));
      const files = pages.map((_, i) => path.resolve(opts.out, pages.length > 1 ? `contact-sheet-${i + 1}.png` : "contact-sheet.png"));
      await pool(tabs, pages.map((page, i) => (sid) => contactSheet(cdp, sid, page, files[i])), () => blankTab(cdp));
      for (const file of files) console.log(`${path.relative(process.cwd(), file)}  (figures at doc width; inspect these, not each PNG)`);
    }
  } finally {
    await chrome.done();
  }
  console.log(`done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
