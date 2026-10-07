TEMPLATES.compare = async (spec, DF) => {
  const c = (n) => DF.color(n);
  DF.style(`
.cmp { display: grid; }
.cmp.side { grid-template-columns: minmax(0, 1fr) 44px minmax(0, 1fr); align-items: stretch; }
.cmp.stacked { grid-template-columns: minmax(0, 1fr); }
.cmp-panel { border: 1.5px solid var(--edge); border-radius: 14px; padding: 16px 18px 18px; display: flex; flex-direction: column; min-width: 0; }
.cmp-panel.accent { border: 2px solid var(--hilite-edge); box-shadow: 0 0 0 5px var(--hilite-glow); }
.cmp-head { align-self: flex-start; }
.cmp-title { display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 999px; background: var(--edge); color: var(--ink); line-height: 1.2; }
.accent .cmp-title { background: var(--hilite-edge); color: var(--bg); }
.cmp-caption { margin-top: 10px; font-size: 14.5px; color: var(--body); }
.cmp-body { display: flex; flex-direction: column; gap: 14px; margin-top: 14px; }
.cmp-arrow { display: grid; place-items: center; color: var(--line); }
.cmp.stacked .cmp-arrow { height: 46px; }
.cmp-arrow span { width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--edge); background: var(--bg); display: grid; place-items: center; }
.cmp.stacked .cmp-arrow svg { transform: rotate(90deg); }
.cmp-rows { display: flex; flex-direction: column; gap: 6px; }
.cmp-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 11px; border-radius: 9px; background: var(--surface-alt);
  border-left: 3px solid transparent; font-size: 14.5px; color: var(--body); }
.cmp-mark { flex: none; width: 18px; height: 18px; margin-top: 1px; color: var(--faint); }
.cmp-mark svg { width: 18px; height: 18px; display: block; }
.cmp-row.ok .cmp-mark, .cmp-row.new .cmp-mark { color: var(--ok); }
.cmp-row.fail .cmp-mark, .cmp-row.removed .cmp-mark { color: var(--fail); }
.cmp-row.changed .cmp-mark { color: var(--hilite); }
.cmp-row.new { border-left-color: var(--ok-edge); }
.cmp-row.changed { border-left-color: var(--hilite-edge); color: var(--ink); }
.cmp-row.removed .cmp-text { text-decoration: line-through; color: var(--faint); }
.cmp-row.muted { color: var(--faint); }
.cmp-label { font-size: 13.5px; color: var(--muted); margin-bottom: 7px; }
.cmp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cmp-chip { min-width: 40px; height: 36px; padding: 0 11px; border-radius: 9px; display: inline-grid; place-items: center;
  font-weight: 700; font-size: 15px; border: 1.5px solid var(--edge); color: var(--ink); }
.cmp-chip.sent { background: ${DF.tint(c("blue"), DF.dark ? 0.22 : 0.14)}; border-color: ${c("blue")}; }
.cmp-chip.done { background: ${DF.tint(c("green"), DF.dark ? 0.14 : 0.1)}; border-color: var(--ok-edge); color: var(--ok); }
.cmp-chip.new { background: var(--ok-edge); border-color: var(--ok-edge); color: var(--bg); }
.cmp-chip.fail { background: ${DF.tint(c("red"), DF.dark ? 0.16 : 0.1)}; border-color: var(--fail-edge); color: var(--fail); }
.cmp-chip.skipped { border-style: dashed; border-color: var(--faint); color: var(--faint); }
.cmp-chip.muted { border-color: var(--edge); color: var(--faint); }
.cmp-textblock { font-size: 14.5px; color: var(--body); }
.cmp-flow { align-self: center; }
.cmp-key { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 18px; font-size: 13px; color: var(--muted); align-items: center; }
.cmp-key span { display: inline-flex; align-items: center; gap: 7px; }
.cmp-key .cmp-chip { min-width: 22px; height: 18px; padding: 0; border-radius: 5px; }
`);

  const MARKS = {
    ok: '<path d="M4.5 10.5l3.8 3.8 7.2-8.3"/>',
    fail: '<path d="M5.5 5.5l9 9M14.5 5.5l-9 9"/>',
    new: '<path d="M10 4.5v11M4.5 10h11"/>',
    removed: '<path d="M4.5 10h11"/>',
    changed: '<circle cx="10" cy="10" r="4" fill="currentColor" stroke="none"/>',
    muted: '<circle cx="10" cy="10" r="3"/>',
  };
  const mark = (s) => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${MARKS[s] || MARKS.muted}</svg>`;
  const ARROW = '<span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8h10M8.5 3.5L13 8l-4.5 4.5"/></svg></span>';

  const blocks = {
    rows(b) {
      const list = DF.el("div", "cmp-rows");
      for (const it of b.items || []) {
        const st = it.status || "";
        const r = DF.el("div", `cmp-row chk ${st}`);
        const m = DF.el("span", "cmp-mark");
        m.innerHTML = it.icon ? DF.icon(it.icon) : mark(st || "muted");
        r.append(m, DF.el("span", "cmp-text", it.text));
        list.appendChild(r);
      }
      return list;
    },
    chips(b) {
      const wrap = DF.el("div");
      if (b.label) wrap.appendChild(DF.el("div", "cmp-label chk", b.label));
      const row = DF.el("div", "cmp-chips");
      for (const it of b.items || []) row.appendChild(DF.el("span", `cmp-chip chk ${it.state || "sent"}`, String(it.text)));
      wrap.appendChild(row);
      return wrap;
    },
    text: (b) => DF.el("div", "cmp-textblock chk", b.text),
  };

  // Lay out without maxWidth so layoutFlow never warns or widens the page; this template decides what fits.
  async function fitFlow(box, b, inner) {
    const opts = {nodes: b.nodes || [], edges: b.edges || [], numbered: !!b.numbered, nodeWidth: b.nodeWidth};
    const dirs = b.direction && b.direction !== "auto" ? [b.direction] : ["right", "down"];
    let r;
    for (const d of dirs) {
      r = await DF.layoutFlow(box, {...opts, direction: d});
      if (r.width <= inner + 0.5) return {...r, fits: true};
    }
    return {...r, fits: false};
  }

  function panel(p, which) {
    const accent = which === "after" && p.accent !== false;
    const el = DF.el("div", "cmp-panel chk" + (accent ? " accent" : ""));
    const head = DF.el("div", "cmp-head");
    head.appendChild(DF.el("span", "cmp-title chk", p.title || (which === "before" ? "Before" : "After")));
    el.appendChild(head);
    if (p.caption) el.appendChild(DF.el("div", "cmp-caption chk", p.caption));
    const body = DF.el("div", "cmp-body");
    el.appendChild(body);
    return {el, body, blocks: p.blocks || []};
  }

  const stage = DF.stage();
  async function build(mode) {
    stage.innerHTML = "";
    const grid = DF.el("div", `cmp ${mode}`);
    stage.appendChild(grid);
    const B = panel(spec.before || {}, "before"), A = panel(spec.after || {}, "after");
    const arrow = DF.el("div", "cmp-arrow");
    arrow.innerHTML = ARROW;
    grid.append(B.el, arrow, A.el);
    const flows = [];
    for (const P of [B, A])
      for (const b of P.blocks) {
        if (b.type === "flow") {
          const box = DF.el("div", "cmp-flow");
          P.body.appendChild(box);
          flows.push([box, b, P]);
        } else if (blocks[b.type]) P.body.appendChild(blocks[b.type](b));
        else DF.warn(`unknown compare block type "${b.type}"`);
      }
    const used = {later: false, external: false};
    let fits = true;
    for (const [box, b, P] of flows) {
      const r = await fitFlow(box, b, P.body.clientWidth);
      fits &&= r.fits;
      used.later ||= r.used.later;
      used.external ||= r.used.external;
    }
    return {used, fits};
  }

  const KEY = {done: "already stored", sent: "sent", skipped: "not sent", fail: "failed", new: "new", muted: "not there yet"};
  function chipKey() {
    if (spec.chipKey === false) return;
    const states = [...new Set([spec.before, spec.after].flatMap((p) => (p?.blocks || []).filter((b) => b.type === "chips")
      .flatMap((b) => (b.items || []).map((it) => it.state || "sent"))))];
    if (states.length < 2) return;
    const words = {...KEY, ...(spec.chipKey || {})};
    const key = DF.el("div", "cmp-key chk");
    for (const st of states) {
      const item = DF.el("span");
      item.append(DF.el("i", `cmp-chip ${st}`), words[st] || st);
      key.appendChild(item);
    }
    document.body.appendChild(key);
  }

  function alignCaptions() {
    const caps = [...stage.querySelectorAll(".cmp-caption")];
    if (caps.length !== 2 || !stage.querySelector(".cmp.side")) return;
    const h = Math.max(...caps.map((c) => c.offsetHeight));
    caps.forEach((c) => (c.style.minHeight = h + "px"));
  }

  const layout = spec.layout || "auto";
  let res = await build(layout === "stacked" ? "stacked" : "side");
  if (!res.fits && layout === "auto") res = await build("stacked");
  if (!res.fits) DF.warn("a flow block is wider than its panel; drop nodes or set direction: down");
  alignCaptions();
  chipKey();

  const items = [];
  if (res.used.later) items.push({line: "plain", text: "request"}, {line: "later", dashed: true, text: "reply that arrives later"});
  if (res.used.external) items.push({box: "external", text: "another company's system"});
  if (items.length && spec.legend !== false) DF.legend(items);
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
