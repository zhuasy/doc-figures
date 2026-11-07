/*
 * steps: a worked mechanism. A row of panels, each showing a concrete state (numbers, bars, chips, a small grid),
 * the one operation that turns it into the next panel, and why. Optional `rule` and `limit` callouts state the
 * general rule the example shows and where it stops working, so a reader can apply it to a new case.
 */
TEMPLATES.steps = async (spec, DF) => {
  const c = (n) => DF.color(n);
  DF.style(`
.st { display: grid; column-gap: 0; row-gap: 18px; align-items: stretch; }
.st-panel { border: 1.5px solid var(--edge); border-radius: 14px; padding: 13px 15px 14px; display: flex; flex-direction: column; min-width: 0; background: var(--surface); }
.st-panel.hl { border: 2px solid var(--hilite-edge); box-shadow: 0 0 0 5px var(--hilite-glow); }
.st-head { display: flex; align-items: baseline; gap: 9px; }
.st-n { flex: none; width: 24px; height: 24px; border-radius: 50%; display: inline-grid; place-items: center; font-size: 13px; font-weight: 800;
  background: var(--muted); color: var(--bg); transform: translateY(-1px); }
.hl .st-n { background: var(--hilite); }
.st-title { font-size: 15.5px; font-weight: 700; color: var(--ink); line-height: 1.3; }
.st-body { display: flex; flex-direction: column; gap: 10px; margin-top: 11px; flex: 1; }
.st-op { margin-top: 12px; padding: 7px 10px; border-radius: 9px; background: var(--surface-alt); font-size: 14px; color: var(--ink); font-weight: 600; }
.st-op::before { content: "→ "; color: var(--hilite); font-weight: 800; }
.st-why { margin-top: 7px; font-size: 13.5px; color: var(--muted); line-height: 1.4; }
.st-gap { display: grid; place-items: center; color: var(--line); }
.st-gap span { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--edge); background: var(--bg); display: grid; place-items: center; }
.st-text { font-size: 14.5px; color: var(--body); line-height: 1.4; }
.st-label { font-size: 13px; color: var(--muted); margin-bottom: 5px; }
.st-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.st-chip { min-width: 34px; height: 32px; padding: 0 9px; border-radius: 8px; display: inline-grid; place-items: center; font-weight: 700; font-size: 14.5px;
  border: 1.5px solid ${c("blue")}; background: ${DF.tint(c("blue"), DF.dark ? 0.2 : 0.12)}; color: var(--ink); }
.st-chip.hl { border-color: var(--hilite-edge); background: var(--hilite-glow); color: var(--ink); }
.st-chip.ok { border-color: var(--ok-edge); color: var(--ok); background: ${DF.tint(c("green"), DF.dark ? 0.14 : 0.1)}; }
.st-chip.fail { border-color: var(--fail-edge); color: var(--fail); background: ${DF.tint(c("red"), DF.dark ? 0.16 : 0.1)}; }
.st-chip.muted { border: 1.5px dashed var(--faint); color: var(--faint); background: none; }
.st-chip.out { border: 1.5px dashed var(--faint); color: var(--muted); background: none; text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: var(--fail); }
.st-bars { position: relative; display: flex; align-items: flex-end; gap: 8px; height: var(--bh, 110px); border-bottom: 1.5px solid var(--line); padding: 0 2px; }
.st-col { flex: 1 1 0; min-width: 0; height: 100%; position: relative; }
.st-bar { position: absolute; left: 0; right: 0; bottom: 0; border-radius: 5px 5px 0 0; background: ${c("blue")}; }
.st-bar.hl { background: var(--hilite-edge); }
.st-bar.ok { background: var(--ok-edge); }
.st-bar.fail { background: var(--fail-edge); }
.st-bar.muted { background: var(--edge); }
.st-col b { position: absolute; left: 50%; transform: translateX(-50%); margin-bottom: 3px; font-size: 13px; color: var(--ink); white-space: nowrap; }
.st-line { position: absolute; left: 0; right: 0; border-top: 1.5px dashed var(--hilite-edge); }
.st-line.ref { border-top-color: var(--muted); }
.st-line.ref i { color: var(--muted); }
.st-line i { position: absolute; right: 0; bottom: 2px; font-style: normal; font-size: 12.5px; font-weight: 600; color: var(--hilite); background: var(--surface); padding: 0 3px; }
.st-names { display: flex; gap: 8px; padding: 4px 2px 0; }
.st-names span { flex: 1 1 0; min-width: 0; text-align: center; font-size: 12.5px; color: var(--muted); overflow-wrap: anywhere; }
.st-grid { border-collapse: separate; border-spacing: 3px; margin: -3px; }
.st-grid td, .st-grid th { min-width: 28px; height: 28px; padding: 0 6px; text-align: center; font-size: 14px; border-radius: 6px; color: var(--ink); }
.st-grid td { background: var(--surface-alt); font-weight: 600; }
.st-grid th { font-size: 12.5px; color: var(--muted); font-weight: 600; }
.st-grid td.hl { background: var(--hilite-glow); box-shadow: inset 0 0 0 1.5px var(--hilite-edge); }
.st-grid td.ok { color: var(--ok); box-shadow: inset 0 0 0 1.5px var(--ok-edge); }
.st-grid td.fail { color: var(--fail); box-shadow: inset 0 0 0 1.5px var(--fail-edge); }
.st-grid td.out { background: none; color: var(--muted); box-shadow: inset 0 0 0 1.5px var(--faint); text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: var(--fail); }
.st-grid td.muted { color: var(--faint); }
.st-kv { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 12px; font-size: 14px; }
.st-kv span:nth-child(odd) { color: var(--muted); }
.st-kv span:nth-child(even) { color: var(--ink); font-weight: 600; }
.st-kv .hl { color: var(--hilite); }
.st-calls { display: grid; gap: 10px; margin-top: 20px; }
.st-call { display: flex; gap: 11px; align-items: flex-start; padding: 11px 14px; border-radius: 12px; border: 1.5px solid var(--edge); font-size: 15px; color: var(--ink); line-height: 1.4; }
.st-call b { flex: none; font-size: 12.5px; letter-spacing: .07em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; margin-top: 1px; }
.st-call.rule { border-color: var(--ok-edge); }
.st-call.rule b { background: var(--ok); color: var(--bg); }
.st-call.limit { border-color: var(--fail-edge); }
.st-call.limit b { background: var(--fail); color: var(--bg); }
.st-call.myth { border-style: dashed; }
.st-call.myth b { background: var(--muted); color: var(--bg); }
`);

  const ARROW = '<span><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8h10M8.5 3.5L13 8l-4.5 4.5"/></svg></span>';
  const item = (it) => (typeof it === "object" && it !== null ? it : {text: it});
  const cls = (it) => ["hl", "ok", "fail", "muted", "out"].find((k) => it[k] || it.state === k) || "";

  const blocks = {
    text: (b) => DF.el("div", "st-text chk", b.text),
    chips(b) {
      const w = DF.el("div");
      if (b.label) w.appendChild(DF.el("div", "st-label chk", b.label));
      const row = DF.el("div", "st-chips");
      for (const it of (b.items || []).map(item)) row.appendChild(DF.el("span", `st-chip chk ${cls(it)}`, String(it.text)));
      w.appendChild(row);
      return w;
    },
    bars(b) {
      const w = DF.el("div");
      if (b.label) w.appendChild(DF.el("div", "st-label chk", b.label));
      const items = (b.items || []).map(item);
      // Reference lines: the level every bar is compared with (full, half full, the old value).
      const lines = [...(b.line ? [b.line] : []), ...(b.lines || [])];
      const unit = b.unit ? (/^[%°]/.test(b.unit) ? b.unit : " " + b.unit) : "";
      const max = b.max || Math.max(1, ...items.map((i) => +i.value || 0), ...lines.map((l) => +l.value || 0));
      const area = DF.el("div", "st-bars");
      if (b.height) area.style.setProperty("--bh", b.height + "px");
      // Room above the tallest bar for its value label.
      area.style.marginTop = "20px";
      for (const it of items) {
        const pct = (100 * Math.max(0, +it.value || 0)) / max;
        const col = DF.el("div", "st-col");
        const bar = DF.el("div", `st-bar ${cls(it)}`);
        bar.style.height = `${pct}%`;
        const v = DF.el("b", "chk", it.show != null ? String(it.show) : (typeof it.value === "number" ? it.value.toLocaleString("en-US") : String(it.value)) + unit);
        v.style.bottom = `calc(${pct}% + 3px)`;
        col.append(bar, v);
        area.appendChild(col);
      }
      lines.forEach((l, i) => {
        const ln = DF.el("div", "st-line" + (i && !l.hl ? " ref" : ""));
        ln.style.bottom = `${(100 * l.value) / max}%`;
        if (l.label) ln.appendChild(DF.el("i", null, l.label));
        area.appendChild(ln);
      });
      w.appendChild(area);
      if (items.some((i) => i.label)) {
        const names = DF.el("div", "st-names");
        for (const it of items) names.appendChild(DF.el("span", "chk", it.label || ""));
        w.appendChild(names);
      }
      return w;
    },
    grid(b) {
      const w = DF.el("div");
      if (b.label) w.appendChild(DF.el("div", "st-label chk", b.label));
      const t = DF.el("table", "st-grid");
      if (b.cols) {
        const tr = DF.el("tr");
        if (b.rowLabels) tr.appendChild(DF.el("th"));
        b.cols.forEach((h) => tr.appendChild(DF.el("th", null, h)));
        t.appendChild(tr);
      }
      (b.rows || []).forEach((r, i) => {
        const tr = DF.el("tr");
        if (b.rowLabels) tr.appendChild(DF.el("th", null, b.rowLabels[i] ?? ""));
        r.map(item).forEach((cell) => tr.appendChild(DF.el("td", cls(cell), String(cell.text))));
        t.appendChild(tr);
      });
      w.appendChild(t);
      return w;
    },
    kv(b) {
      const g = DF.el("div", "st-kv chk");
      for (const [k, v] of b.items || []) {
        const it = item(v);
        g.append(DF.el("span", null, k), DF.el("span", cls(it), String(it.text)));
      }
      return g;
    },
  };

  const steps = spec.steps || [];
  if (steps.length < 2) DF.warn("steps needs at least 2 steps; one state is a card or a flow");
  if (steps.length > 6) DF.warn(`${steps.length} steps; keep a worked example to 3 to 6 steps, or split it`);
  // A panel of words only is a slide, not a figure: the reader has to picture the state themselves.
  const wordy = steps.filter((s) => (s.state || s.blocks || []).every((b) => b.type === "text")).length;
  if (steps.length >= 2 && wordy * 2 > steps.length)
    DF.warn(`${wordy} of ${steps.length} steps show only text; show each state as chips, bars, a grid or kv, or draw it with freeform`);
  if (spec.connect !== false) steps.forEach((s, i) => {
    if (/^\s*(step\s*)?\d+\s*[.):]/i.test(s.title || "")) DF.warn(`step ${i + 1} title "${s.title}" repeats the step number the badge already shows`);
  });
  const usable = DF.canvasWidth();
  const GAP = 34;
  let cols = spec.columns || (steps.length <= 3 ? steps.length : steps.length === 4 ? 2 : 3);
  while (cols > 1 && (usable - GAP * (cols - 1)) / cols < 220) cols--;

  const grid = DF.el("div", "st");
  grid.style.gridTemplateColumns = Array.from({length: cols}, () => "minmax(0, 1fr)").join(` ${GAP}px `);
  DF.stage().appendChild(grid);
  steps.forEach((s, i) => {
    const p = DF.el("div", "st-panel chk" + (s.hl || s.changed ? " hl" : ""));
    const head = DF.el("div", "st-head");
    // Separate cases get no number, so nobody reads them as a sequence or counts them as events.
    if (spec.connect !== false) head.appendChild(DF.el("span", "st-n", String(i + 1)));
    head.appendChild(DF.el("span", "st-title chk", s.title || ""));
    p.appendChild(head);
    const body = DF.el("div", "st-body");
    for (const b of s.state || s.blocks || []) {
      if (blocks[b.type]) body.appendChild(blocks[b.type](b));
      else DF.warn(`unknown steps block type "${b.type}" (text, chips, bars, grid, kv)`);
    }
    p.appendChild(body);
    if (s.op) p.appendChild(DF.el("div", "st-op chk", s.op));
    if (s.why) p.appendChild(DF.el("div", "st-why chk", s.why));
    else if (s.op && i < steps.length - 1 && spec.connect !== false) DF.warn(`step ${i + 1} has an operation but no "why"; say why it happens`);
    const col = i % cols;
    p.style.gridColumn = String(col * 2 + 1);
    grid.appendChild(p);
    if (spec.connect !== false && col < cols - 1 && i < steps.length - 1) {
      const gap = DF.el("div", "st-gap");
      gap.innerHTML = ARROW;
      gap.style.gridColumn = String(col * 2 + 2);
      grid.appendChild(gap);
    }
  });

  const calls = [["rule", spec.rule, "In general"], ["limit", spec.limit, "Stops working when"], ["myth", spec.myth, "Not this"]]
    .filter(([, t]) => t);
  if (calls.length) {
    const box = DF.el("div", "st-calls");
    for (const [k, t, word] of calls) {
      const call = DF.el("div", `st-call chk ${k}`);
      call.append(DF.el("b", null, word), DF.el("span", null, t));
      box.appendChild(call);
    }
    document.body.appendChild(box);
  }
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
