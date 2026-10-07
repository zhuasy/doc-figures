TEMPLATES.sequence = async (spec, DF) => {
  DF.style(`
    .seq { position: relative; }
    .node.seq-head { flex-direction: column; align-items: center; text-align: center; gap: 7px; padding: 11px 10px 12px; }
    .node.seq-head .tx { width: 100%; }
    .seq-label {
      position: absolute; z-index: 2; display: flex; align-items: flex-start; gap: 6px;
      font-size: 13.5px; line-height: 1.3; color: var(--body); background: var(--bg);
      padding: 1px 7px 1px 3px; border-radius: 10px;
    }
    .seq-label.nonum { padding-left: 7px; }
    .seq-label.hot, .seq-band { background: color-mix(in srgb, var(--hilite-edge) 14%, var(--bg)); }
    .seq-band { position: absolute; border-radius: 10px; }
    .seq-gap {
      position: absolute; z-index: 2; white-space: nowrap; font-size: 13px; font-style: italic;
      color: var(--faint); background: var(--bg); padding: 2px 12px; letter-spacing: .02em;
    }
    .seq-note {
      position: absolute; z-index: 2; font-size: 13.5px; line-height: 1.35; color: var(--muted);
      background: var(--surface-alt); border: 1.5px solid var(--edge); border-radius: 10px; padding: 8px 12px;
    }
  `);
  const box = DF.el("div", "seq");
  DF.stage().appendChild(box);
  const W = DF.canvasWidth();
  const actors = spec.actors || [];
  const colW = W / Math.max(actors.length, 1);
  if (colW < 120) DF.warn(`${actors.length} actors leave ${Math.round(colW)}px per column; drop actors or split the figure`);
  const cardW = Math.round(Math.min(212, colW - 14));

  const cx = {};
  const heads = actors.map((a, i) => {
    const c = DF.card(a, cardW);
    c.classList.add("seq-head");
    box.appendChild(c);
    cx[a.id] = Math.round(colW * i + colW / 2);
    return c;
  });
  const headH = Math.max(0, ...heads.map((h) => h.offsetHeight));
  heads.forEach((h, i) => Object.assign(h.style, {left: cx[actors[i].id] - cardW / 2 + "px", top: "0px", height: headH + "px"}));

  const w = DF.wires(box);
  const breaks = [];
  const used = {later: false, changed: false};
  let y = headH + 24, step = 0;

  const place = (node, left, top) => Object.assign(node.style, {left: Math.round(left) + "px", top: Math.round(top) + "px"});

  for (const m of spec.messages || []) {
    if (m.gap != null) {
      const g = DF.el("div", "seq-gap chk", `⋯  ${m.gap}  ⋯`);
      box.appendChild(g);
      place(g, (W - g.offsetWidth) / 2, y + 4);
      breaks.push([y, y + g.offsetHeight + 8]);
      y += g.offsetHeight + 26;
      continue;
    }
    if (m.note != null) {
      const xs = (m.over || []).filter((id) => id in cx).map((id) => cx[id]);
      const reach = Math.min(colW / 2 - 8, 80);
      let x0 = xs.length ? Math.min(...xs) - reach : 0, x1 = xs.length ? Math.max(...xs) + reach : W;
      if (x1 - x0 < 190) { const mid = (x0 + x1) / 2; x0 = mid - 95; x1 = mid + 95; }
      x0 = Math.max(0, x0); x1 = Math.min(W, x1);
      const n = DF.el("div", "seq-note chk", m.note);
      n.style.width = Math.round(x1 - x0) + "px";
      box.appendChild(n);
      place(n, x0, y);
      y += n.offsetHeight + 20;
      continue;
    }
    const a = cx[m.from], b = cx[m.to];
    if (a == null || b == null) { DF.warn(`message "${m.label}" names an unknown actor`); continue; }
    const kind = DF.edgeKind(m);
    used.later ||= !!m.later;
    used.changed ||= !!m.changed;
    const num = m.step !== undefined ? m.step : spec.numbered !== false ? ++step : null;
    const lab = DF.el("div", ["seq-label chk", num == null && "nonum", m.changed && "hot", m.faded && "faded"].filter(Boolean).join(" "));
    if (num != null) lab.appendChild(DF.el("i", `num ${kind === "plain" ? "" : kind}`, String(num)));
    lab.appendChild(DF.el("span", null, m.label || ""));
    box.appendChild(lab);

    let pts, top, bottom;
    if (a === b) {
      const dir = actors.length > 1 && a > W - colW ? -1 : 1;
      lab.style.maxWidth = Math.max(130, colW - 50) + "px";
      const lh = lab.offsetHeight, hgt = Math.max(26, lh + 4);
      top = y + 2;
      bottom = top + hgt;
      pts = [{x: a, y: top}, {x: a + dir * 30, y: top}, {x: a + dir * 30, y: bottom}, {x: a + dir, y: bottom}];
      place(lab, dir > 0 ? a + 40 : a - 40 - lab.offsetWidth, top + (hgt - lh) / 2);
    } else {
      const x0 = Math.min(a, b), span = Math.abs(b - a);
      lab.style.maxWidth = Math.max(130, span - 24) + "px";
      place(lab, x0 + (span - lab.offsetWidth) / 2, y);
      top = y;
      bottom = y + lab.offsetHeight + 7;
      pts = [{x: a, y: bottom}, {x: b - Math.sign(b - a), y: bottom}];
    }
    if (m.changed) {
      const xs = pts.map((p) => p.x).concat(parseFloat(lab.style.left), parseFloat(lab.style.left) + lab.offsetWidth);
      const band = DF.el("div", "seq-band");
      Object.assign(band.style, {
        left: Math.min(...xs) - 14 + "px", top: top - 7 + "px",
        width: Math.max(...xs) - Math.min(...xs) + 28 + "px", height: bottom - top + 14 + "px",
      });
      box.prepend(band);
    }
    const line = w.line(pts, kind, {dashed: !!m.later});
    if (m.faded) line.setAttribute("opacity", ".32");
    y = bottom + 22;
  }

  const end = y - 6;
  const ns = "http://www.w3.org/2000/svg";
  const anchor = w.svg.querySelector("defs").nextSibling;
  for (const x of Object.values(cx)) {
    let from = headH;
    for (const [b0, b1] of [...breaks, [end, end]]) {
      if (b0 > from) {
        const l = document.createElementNS(ns, "line");
        Object.entries({x1: x, x2: x, y1: from, y2: b0, stroke: DF.css("--faint"), "stroke-width": 1.3, "stroke-dasharray": "2 5"})
          .forEach(([k, v]) => l.setAttribute(k, v));
        w.svg.insertBefore(l, anchor);
      }
      from = b1;
    }
  }
  w.size(W, end);
  Object.assign(box.style, {width: W + "px", height: end + "px"});

  const items = [];
  if (used.later) items.push({line: "plain", text: "call"}, {line: "later", dashed: true, text: "reply that arrives later"});
  if (used.changed) items.push({line: "changed", text: "changed"});
  if (actors.some((a) => a.external)) items.push({box: "external", text: "another company's system"});
  if (items.length && spec.legend !== false) DF.legend(items);
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
