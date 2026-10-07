TEMPLATES.card = async (spec, DF) => {
  DF.style(`
    .cards { position: relative; display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-start; row-gap: 28px; }
    .rec { background: var(--surface); border: 1.5px solid var(--edge); border-radius: 12px; overflow: hidden; }
    .rec-h { display: flex; gap: 11px; align-items: center; padding: 12px 14px; background: var(--surface-alt); border-bottom: 1.5px solid var(--edge); }
    .rec-h .ic { flex: none; width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; }
    .rec-h .ic svg { width: 19px; height: 19px; }
    .rec-t { min-width: 0; }
    .rec-t b { display: block; color: var(--ink); font-size: 16px; line-height: 1.25; overflow-wrap: anywhere; }
    .rec-t span { display: block; color: var(--muted); font-size: 13.5px; margin-top: 1px; }
    .fr { display: grid; grid-template-columns: var(--nw, 42%) minmax(0, 1fr) auto; column-gap: 12px; align-items: baseline;
          padding: 8px 14px 9px 16px; border-top: 1px solid var(--grid); }
    .rec-h + .fr { border-top: 0; }
    .fn { font-family: var(--mono); font-size: 13.5px; color: var(--ink); overflow-wrap: anywhere; }
    .fv { font-size: 14px; color: var(--body); overflow-wrap: anywhere; }
    .fr .tag { margin-left: 0; align-self: center; }
    .fnote { grid-column: 1 / -1; font-size: 13px; line-height: 1.35; color: var(--muted); margin-top: 3px; }
    .fr.new { box-shadow: inset 3px 0 0 var(--ok-edge); background: color-mix(in srgb, var(--ok-edge) 8%, transparent); }
    .fr.changed { box-shadow: inset 3px 0 0 var(--hilite-edge); background: color-mix(in srgb, var(--hilite-edge) 9%, transparent); }
    .fr.removed { box-shadow: inset 3px 0 0 var(--fail-edge); }
    .fr.removed .fn, .fr.removed .fv { color: var(--fail); text-decoration: line-through; }
  `);

  const cards = spec.cards || [];
  const links = spec.links || [];
  const wrap = DF.el("div", "cards");
  DF.stage().appendChild(wrap);

  const labels = links.map((l) => {
    if (!l.label) return null;
    const lab = DF.edgeLabel({label: l.label, changed: l.changed}, null);
    wrap.appendChild(lab);
    return lab;
  });
  const labelW = Math.max(0, ...labels.filter(Boolean).map((l) => l.offsetWidth));
  const gap = links.length ? Math.max(76, labelW + 32) : 24;
  const usable = DF.canvasWidth();
  let cols = Math.max(1, cards.length);
  while (cols > 1 && (usable - gap * (cols - 1)) / cols < 260) cols--;
  const width = spec.cardWidth || (cols === 1 ? Math.min(560, usable) : Math.floor((usable - gap * (cols - 1)) / cols));
  wrap.style.columnGap = gap + "px";

  const rows = {};
  for (const c of cards) {
    const box = DF.el("div", "rec chk");
    box.style.width = width + "px";
    const head = DF.el("div", "rec-h");
    if (c.icon) {
      const hue = DF.color(c.color);
      const ic = DF.el("div", "ic");
      Object.assign(ic.style, {background: DF.tint(hue), color: hue});
      ic.innerHTML = DF.icon(c.icon);
      head.appendChild(ic);
    }
    const t = DF.el("div", "rec-t");
    t.appendChild(DF.el("b", null, c.title || c.id));
    if (c.subtitle) t.appendChild(DF.el("span", null, c.subtitle));
    head.appendChild(t);
    box.appendChild(head);
    for (const f of c.fields || []) {
      const r = DF.el("div", "fr" + (f.tag ? " " + f.tag : ""));
      r.appendChild(DF.el("span", "fn", f.name));
      r.appendChild(DF.el("span", "fv", f.value == null ? "" : String(f.value)));
      r.appendChild(f.tag ? DF.tagEl(f.tag) : DF.el("span"));
      if (f.note) r.appendChild(DF.el("span", "fnote", f.note));
      box.appendChild(r);
      rows[`${c.id}.${f.name}`] = r;
    }
    wrap.appendChild(box);
    const probe = DF.el("span", "fn");
    Object.assign(probe.style, {position: "absolute", visibility: "hidden", whiteSpace: "nowrap"});
    box.appendChild(probe);
    const longest = Math.max(0, ...(c.fields || []).map((f) => ((probe.textContent = f.name), probe.offsetWidth)));
    probe.remove();
    box.style.setProperty("--nw", Math.min(longest + 24, Math.round(width * 0.45)) + "px");
  }
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
  if (!links.length) return;

  await document.fonts.ready;
  const base = wrap.getBoundingClientRect();
  const rel = (r) => ({left: r.left - base.left, right: r.right - base.left, top: r.top - base.top});
  const yOf = (row) => {
    const n = row.querySelector(".fn").getBoundingClientRect();
    return n.top - base.top + Math.min(n.height, 19) / 2;
  };

  const routes = links.map((l, i) => {
    const a = rows[l.from], b = rows[l.to];
    if (!a || !b) return DF.warn(`link "${l.from}" -> "${l.to}" names an unknown card field (use cardId.fieldName)`);
    const c1 = rel(a.closest(".rec").getBoundingClientRect()), c2 = rel(b.closest(".rec").getBoundingClientRect());
    const r = {i, y1: yOf(a), y2: yOf(b)};
    if (c1.right <= c2.left) Object.assign(r, {x1: c1.right, x2: c2.left, lo: c1.right, hi: c2.left});
    else if (c2.right <= c1.left) Object.assign(r, {x1: c1.left, x2: c2.right, lo: c2.right, hi: c1.left});
    else if (c1.left + c1.right < base.width) Object.assign(r, {x1: c1.left, x2: c2.left, side: "L", edge: Math.min(c1.left, c2.left)});
    else Object.assign(r, {x1: c1.right, x2: c2.right, side: "R", edge: Math.max(c1.right, c2.right)});
    return r;
  }).filter(Boolean);

  // Links sharing a gap get their own vertical lane; links between stacked cards run in the outer margin.
  const lanes = {};
  for (const r of routes) (lanes[r.side || Math.round(r.lo)] ||= []).push(r);
  const w = DF.wires(wrap);
  const ns = "http://www.w3.org/2000/svg";
  for (const group of Object.values(lanes))
    group.forEach((r, k) => {
      const mx = r.side ? r.edge + (r.side === "L" ? -1 : 1) * (16 + 8 * k) : r.lo + ((k + 1) * (r.hi - r.lo)) / (group.length + 1);
      const l = links[r.i];
      const kind = l.changed ? "changed" : "plain";
      w.line([{x: r.x1, y: r.y1}, {x: mx, y: r.y1}, {x: mx, y: r.y2}, {x: r.x2, y: r.y2}], kind);
      const dot = document.createElementNS(ns, "circle");
      Object.entries({cx: r.x1, cy: r.y1, r: 3.5, fill: DF.css(kind === "changed" ? "--hilite-edge" : "--line")})
        .forEach(([k2, v]) => dot.setAttribute(k2, v));
      w.svg.appendChild(dot);
      const lab = labels[r.i];
      if (!lab) return;
      const midY = (r.y1 + r.y2) / 2 - lab.offsetHeight / 2;
      Object.assign(lab.style, {left: mx - lab.offsetWidth / 2 + "px", top: midY + "px"});
    });
  w.size(wrap.offsetWidth, wrap.offsetHeight);
};
