TEMPLATES.freeform = async (spec, DF) => {
  DF.style(`
    .fx { position: relative; }
    .fx .node { position: relative; width: auto; }
    .fx .row { display: flex; gap: 18px; align-items: flex-start; }
    .fx .col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
    .fx .grow { flex: 1 1 0; min-width: 0; }
    .fx .box { border: 1.5px solid var(--edge); border-radius: 12px; padding: 10px 13px; background: var(--surface); }
    .fx .box.alt { background: var(--surface-alt); }
    .fx .box.external { border-style: dashed; border-color: var(--amber); }
    .fx .box.changed { border: 2px solid var(--hilite-edge); box-shadow: 0 0 0 4px var(--hilite-glow); }
    .fx .muted { color: var(--muted); font-size: 13.5px; }
    .fx b, .fx .title { color: var(--ink); }
    .fx .icon { display: inline-grid; vertical-align: -3px; margin-right: 5px; }
    .fx .icon svg { width: 17px; height: 17px; }
    .fx-label {
      position: absolute; transform: translate(-50%, -50%); font-size: 13px; line-height: 1.3; color: var(--body);
      background: var(--bg); padding: 1px 7px; border-radius: 9px; white-space: nowrap;
    }
  `);
  if (spec.css) DF.style(spec.css);
  if (!spec.html) DF.warn("freeform needs html");

  const root = DF.el("div", "fx");
  DF.stage().appendChild(root);
  const html = String(spec.html || "").replace(/\{\{icon:([a-z0-9-]+)\}\}/g, (_, n) => `<span class="icon">${DF.icon(n)}</span>`);
  root.innerHTML = html;
  const boxes = root.querySelectorAll(".box, .node");
  root.querySelectorAll(".box, .node, .chk-me").forEach((e) => e.classList.add("chk"));
  boxes.forEach((b) => DF.lintBox((b.querySelector("b, .title") || b).textContent.trim()));
  DF.lintCount(boxes.length);
  await document.fonts.ready;

  const wires = spec.wires || [];
  if (wires.length) {
    const w = DF.wires(root);
    const R = root.getBoundingClientRect();
    const rel = (r) => ({l: r.left - R.left, r: r.right - R.left, t: r.top - R.top, b: r.bottom - R.top,
                         cx: (r.left + r.right) / 2 - R.left, cy: (r.top + r.bottom) / 2 - R.top});
    const found = wires.map((wire) => {
      const a = root.querySelector(wire.from), b = root.querySelector(wire.to);
      if (!a || !b) DF.warn(`freeform wire: no element for ${!a ? wire.from : wire.to}`);
      else DF.lintArrow(wire.label, wire.from, wire.to);
      return a && b ? {wire, A: rel(a.getBoundingClientRect()), B: rel(b.getBoundingClientRect()), to: wire.to} : null;
    }).filter(Boolean);
    const side = ({A, B}) => (B.l >= A.r ? "right" : B.r <= A.l ? "left" : B.t >= A.b ? "down" : "up");
    const slots = {};
    for (const f of found) (slots[f.to + side(f)] ||= []).push(f);
    for (const group of Object.values(slots)) group.forEach((f, i) => { f.slot = (i + 1) / (group.length + 1); });
    const gap = 3;
    const routes = [];
    for (const f of found) {
      const {wire, A, B} = f, dir = side(f), horiz = dir === "right" || dir === "left";
      const shared = slots[f.to + dir].length > 1;
      const spread = (lo, hi) => (shared ? lo + (hi - lo) * f.slot : (lo + hi) / 2);
      let pts, mid;
      if (horiz) {
        const lo = Math.max(A.t, B.t) + 8, hi = Math.min(A.b, B.b) - 8;
        let y0 = A.cy, y1 = spread(B.t + 10, B.b - 10);
        if (lo <= hi && !shared) y0 = y1 = Math.min(Math.max((A.cy + B.cy) / 2, lo), hi);
        const x0 = dir === "right" ? A.r + gap : A.l - gap, x1 = dir === "right" ? B.l - gap : B.r + gap;
        // Bend near the source so the long last segment can carry the label.
        const mx = Math.round(x0 + Math.sign(x1 - x0) * Math.min(28, Math.abs(x1 - x0) / 2));
        pts = Math.abs(y0 - y1) < 1 ? [{x: x0, y: y0}, {x: x1, y: y1}] : [{x: x0, y: y0}, {x: mx, y: y0}, {x: mx, y: y1}, {x: x1, y: y1}];
        mid = {x: (pts[pts.length - 2].x + x1) / 2, y: y1};
      } else {
        const x0 = A.cx, x1 = spread(B.l + 14, B.r - 14);
        const y0 = dir === "down" ? A.b + gap : A.t - gap, y1 = dir === "down" ? B.t - gap : B.b + gap;
        const my = Math.round(y0 + Math.sign(y1 - y0) * Math.min(20, Math.abs(y1 - y0) / 2));
        pts = Math.abs(x0 - x1) < 1 ? [{x: x0, y: y0}, {x: x1, y: y1}] : [{x: x0, y: y0}, {x: x0, y: my}, {x: x1, y: my}, {x: x1, y: y1}];
        mid = {x: x1, y: (pts[pts.length - 2].y + y1) / 2};
      }
      routes.push(pts);
      const kind = wire.kind || (wire.changed ? "changed" : wire.later ? "later" : "plain");
      w.line(pts, kind, {dashed: !!(wire.dashed || wire.later)});
      if (wire.label) {
        const l = DF.el("div", "fx-label chk", wire.label);
        l.style.left = mid.x + "px";
        l.style.top = mid.y + "px";
        root.appendChild(l);
      }
    }
    DF.warnCrossings(DF.countCrossings(routes));
    w.size(R.width, R.height);
  }
  if (spec.legend) DF.legend(spec.legend);
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
