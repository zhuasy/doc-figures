TEMPLATES.timeline = async (spec, DF) => {
  DF.style(`
    .tl-panel { position: relative; }
    .tl-panel + .tl-panel { margin-top: 30px; }
    .tl-h { font-size: 16px; font-weight: 700; color: var(--ink); margin: 0 0 2px; }
    .tl-s { font-size: 13.5px; color: var(--muted); margin: 0 0 12px; }
    .tl-plot { position: relative; }
    .tl-grid { position: absolute; top: 0; width: 1px; background: var(--grid); }
    .tl-axis { position: absolute; height: 1.5px; background: var(--edge); }
    .tl-tick { position: absolute; font-size: 13px; color: var(--muted); transform: translateX(-50%); white-space: nowrap; }
    .tl-axislabel { position: absolute; font-size: 13px; color: var(--muted); transform: translateX(-50%); white-space: nowrap; }
    .tl-row { position: absolute; left: 0; right: 0; }
    .tl-label { position: absolute; top: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px; color: var(--body); }
    .tl-label.d0 { font-weight: 700; color: var(--ink); font-size: 14.5px; }
    .tl-label.wait { font-style: italic; color: var(--muted); }
    .tl-label.failed { color: var(--fail); }
    .tl-bar { position: absolute; border-radius: 3px; }
    .tl-wait { border: 1.2px solid var(--faint);
      background: repeating-linear-gradient(135deg, var(--faint) 0 1.2px, transparent 1.2px 6px), var(--grid); }
    .tl-ext { border: 1.2px solid var(--amber);
      background: repeating-linear-gradient(135deg, var(--amber) 0 1.2px, transparent 1.2px 6px), var(--amber-fill); }
    .tl-ring { position: absolute; border-radius: 5px; border: 2px solid var(--hilite-edge); }
    .tl-ring.failed { border-color: var(--fail-edge); border-radius: 4px; }
    .tl-text { position: absolute; top: 0; white-space: nowrap; font-size: 13.5px; color: var(--body); }
    .tl-text.failed { color: var(--fail); }
    .tl-text.ext { color: var(--amber); }
    .tl-text .tl-note { color: var(--muted); margin-left: 8px; }
    .tl-sw { display: inline-block; width: 16px; height: 12px; border-radius: 3px; vertical-align: middle; margin-right: 6px; }
  `);
  const ROW = 34, BAR = 18, AXIS = 46, INDENT = 16, GAP = 9, MIN_W = 3;
  const UNIT = {ms: "milliseconds", s: "seconds", min: "minutes"};
  const stage = DF.stage();
  const W = DF.canvasWidth();
  const panels = (spec.panels || [{rows: spec.rows || [], focus: spec.focus, axisLabel: spec.axisLabel}])
    .map((p) => ({...p, unit: p.unit || spec.unit || "s", rows: p.rows || []}));

  const fmt = (v, unit) => {
    if (unit === "ms" && v >= 1000) return fmt(v / 1000, "s");
    if (unit === "s" && v < 1) return fmt(v * 1000, "ms");
    if (unit === "min" && v < 1) return fmt(v * 60, "s");
    return `${+v.toPrecision(v >= 100 ? 4 : 3)} ${unit}`;
  };
  const measure = (cls, text) => {
    const m = DF.el("span", cls, text);
    m.style.cssText = "position:absolute;visibility:hidden;left:0;top:0;overflow:visible";
    stage.appendChild(m);
    const w = m.scrollWidth;
    m.remove();
    return w;
  };
  const isWait = (r) => r.wait === true || r.wait === "external";

  for (const p of panels) {
    const stack = [];
    p.rows.forEach((r, i) => {
      const name = `"${r.label}"`;
      if (!(r.start <= r.end)) DF.warn(`row ${name}: start ${r.start} is after end ${r.end}`);
      const depth = r.depth || 0;
      while (stack.length && (stack[stack.length - 1].depth || 0) >= depth) stack.pop();
      const parent = stack[stack.length - 1];
      const eps = 1e-9 * Math.max(1, Math.abs(r.end));
      if (parent && (r.start < parent.start - eps || r.end > parent.end + eps))
        DF.warn(`row ${name} (${r.start}–${r.end}) falls outside its parent "${parent.label}" (${parent.start}–${parent.end})`);
      stack.push(r);
      if (r.parts) {
        const sum = r.parts.reduce((a, q) => a + (q.end - q.start), 0), span = r.end - r.start;
        if (Math.abs(sum - span) > Math.max(1e-6, span * 0.005))
          DF.warn(`row ${name}: parts add up to ${+sum.toFixed(4)} but the bar is ${+span.toFixed(4)}`);
        r.parts.forEach((q) => {
          if (q.start < r.start - eps || q.end > r.end + eps) DF.warn(`row ${name}: part "${q.label || q.start}" is outside the bar`);
        });
      }
      if (spec.focus === i && !spec.panels) r.focus = true;
    });
  }

  const allRows = panels.flatMap((p) => p.rows);
  const labelW = Math.min(300, Math.max(120,
    ...allRows.map((r) => (r.depth || 0) * INDENT + measure(`tl-label${r.depth ? "" : " d0"}${isWait(r) ? " wait" : ""}`, r.label) + 22)));

  const domainOf = (p) => {
    const d0 = Math.min(...p.rows.map((r) => r.start)), d1 = Math.max(...p.rows.map((r) => r.end));
    const span = (d1 - d0) || 1, mag = 10 ** Math.floor(Math.log10(span / 6));
    const step = [1, 2, 2.5, 5, 10, 20].map((k) => k * mag).find((s) => span / s <= 7);
    const lo = Math.floor(d0 / step + 1e-9) * step, hi = d1 > lo ? d1 : lo + step;
    const ticks = [];
    for (let t = lo; t <= hi + step * 1e-6; t += step) ticks.push(+t.toPrecision(10));
    return {lo, hi, ticks};
  };
  const rightText = (r, unit) => (r.duration === false ? "" : fmt(r.end - r.start, unit));

  for (const p of panels) {
    p.dom = domainOf(p);
    p.plotW = W - labelW - 4;
    for (const r of p.rows) {
      const frac = (r.end - p.dom.lo) / (p.dom.hi - p.dom.lo);
      const tw = measure("tl-text", rightText(r, p.unit)) + (r.note ? measure("tl-text", r.note) + 8 : 0);
      if (frac > 0) p.plotW = Math.min(p.plotW, (W - labelW - GAP - tw - 2) / frac);
    }
  }
  const plotW = Math.floor(Math.min(...panels.map((p) => p.plotW)));
  if (plotW < 300) DF.warn(`only ${plotW}px left for bars; shorten notes or labels`);

  let widened = false;
  const legend = new Map();
  for (const p of panels) {
    const box = DF.el("div", "tl-panel");
    if (p.title) box.appendChild(DF.el("div", "tl-h chk", p.title));
    if (p.subtitle) box.appendChild(DF.el("div", "tl-s chk", p.subtitle));
    const plot = DF.el("div", "tl-plot");
    const n = p.rows.length;
    plot.style.height = n * ROW + AXIS + "px";
    const x = (v) => labelW + ((v - p.dom.lo) / (p.dom.hi - p.dom.lo)) * plotW;

    for (const t of p.dom.ticks) {
      const g = DF.el("div", "tl-grid");
      Object.assign(g.style, {left: x(t) + "px", height: n * ROW + "px"});
      plot.appendChild(g);
      const lab = DF.el("div", "tl-tick chk", String(+t.toPrecision(6)));
      Object.assign(lab.style, {left: x(t) + "px", top: n * ROW + 7 + "px"});
      plot.appendChild(lab);
    }
    const axis = DF.el("div", "tl-axis");
    Object.assign(axis.style, {left: labelW + "px", width: plotW + "px", top: n * ROW + "px"});
    plot.appendChild(axis);
    const al = DF.el("div", "tl-axislabel chk", p.axisLabel || UNIT[p.unit] || p.unit);
    Object.assign(al.style, {left: labelW + plotW / 2 + "px", top: n * ROW + 26 + "px"});
    plot.appendChild(al);

    const focused = p.rows.some((r) => r.focus);
    p.rows.forEach((r, i) => {
      const row = DF.el("div", "tl-row");
      Object.assign(row.style, {top: i * ROW + "px", height: ROW + "px"});
      if (focused && !r.focus) row.style.opacity = ".35";
      const depth = r.depth || 0;
      const label = DF.el("div", ["tl-label", "chk", !depth && "d0", isWait(r) && "wait", r.failed && "failed"].filter(Boolean).join(" "), r.label);
      Object.assign(label.style, {left: depth * INDENT + "px", width: labelW - depth * INDENT - 14 + "px", lineHeight: ROW + "px"});
      row.appendChild(label);

      const segs = r.parts || [{start: r.start, end: r.end, color: r.color, wait: r.wait}];
      let left = Infinity, right = -Infinity;
      for (const q of segs) {
        let a = x(q.start), w = x(q.end) - a;
        if (w < MIN_W) { a -= (MIN_W - w) / 2; w = MIN_W; widened = true; }
        const bar = DF.el("div", "tl-bar" + (q.wait === "external" ? " tl-ext" : q.wait ? " tl-wait" : ""));
        Object.assign(bar.style, {left: a + "px", width: w + "px", top: (ROW - BAR) / 2 + "px", height: BAR + "px"});
        if (!q.wait) bar.style.background = DF.color(q.color || r.color || "blue");
        if (r.parts) bar.style.borderRadius = "0";
        row.appendChild(bar);
        left = Math.min(left, a); right = Math.max(right, a + w);
        if (r.parts) {
          const key = q.wait === "external" ? "ext" : q.wait ? "wait" : q.label || q.color;
          if (q.label || q.wait) legend.set(key, {color: q.color, wait: q.wait, text: q.label});
        } else if (q.wait) legend.set(q.wait === "external" ? "ext" : "wait", {wait: q.wait});
      }
      for (const [on, cls, pad] of [[r.failed, "tl-ring failed", 0], [r.focus, "tl-ring", 3]]) {
        if (!on) continue;
        const ring = DF.el("div", cls);
        Object.assign(ring.style, {left: left - pad + "px", width: right - left + 2 * pad + "px",
          top: (ROW - BAR) / 2 - pad + "px", height: BAR + 2 * pad + "px"});
        row.appendChild(ring);
      }
      if (r.failed) legend.set("failed", {failed: true});

      const text = DF.el("div", ["tl-text", "chk", r.failed && "failed", r.wait === "external" && "ext"].filter(Boolean).join(" "));
      text.textContent = rightText(r, p.unit);
      if (r.note) text.appendChild(DF.el("span", "tl-note", r.note));
      Object.assign(text.style, {left: right + GAP + "px", lineHeight: ROW + "px"});
      if (text.textContent) row.appendChild(text);
      plot.appendChild(row);
    });
    box.appendChild(plot);
    stage.appendChild(box);
  }

  if (legend.size && spec.legend !== false) {
    const lg = DF.el("div", "legend chk");
    for (const it of legend.values()) {
      const s = DF.el("span");
      const sw = DF.el("span", "tl-sw" + (it.wait === "external" ? " tl-ext" : it.wait ? " tl-wait" : ""));
      if (it.failed) Object.assign(sw.style, {border: "2px solid var(--fail-edge)", background: "transparent"});
      else if (!it.wait) sw.style.background = DF.color(it.color || "slate");
      s.appendChild(sw);
      s.appendChild(document.createTextNode(it.text ||
        (it.failed ? "failed try" : it.wait === "external" ? "waiting on another company's system" : "waiting (ours)")));
      lg.appendChild(s);
    }
    document.body.appendChild(lg);
  }
  if (widened) document.body.appendChild(DF.el("div", "note chk", `Spans too short to see are drawn ${MIN_W}px wide.`));
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
