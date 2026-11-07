/*
 * loop: cause and feedback. Two to six quantities sit on a ring; each arrow says whether more of one makes MORE (+)
 * or LESS (−) of the next. The template counts the minus signs: an even count is a reinforcing loop (it runs away),
 * an odd count a balancing loop (it settles), and says so in the middle. `inputs` are outside causes that push on
 * one quantity, such as a new ferry or a mutation.
 */
TEMPLATES.loop = async (spec, DF) => {
  DF.style(`
.lp { position: relative; margin: 0 auto; }
.lp .node { width: var(--nw); }
.lp-sign { position: absolute; width: 28px; height: 28px; margin: -14px 0 0 -14px; border-radius: 50%; display: grid; place-items: center;
  font-size: 19px; font-weight: 800; line-height: 1; color: var(--bg); }
.lp-sign.plus { background: var(--ok); }
.lp-sign.minus { background: var(--fail); }
.lp-lab { position: absolute; font-size: 13.5px; line-height: 1.3; color: var(--body); background: var(--bg); padding: 1px 6px; border-radius: 8px; max-width: 170px; }
.lp-mid { position: absolute; transform: translate(-50%, -50%); text-align: center; max-width: var(--mw); }
.lp-badge { display: inline-grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; font-size: 22px; font-weight: 800; color: var(--bg); }
.lp-badge.R { background: var(--hilite); }
.lp-badge.B { background: var(--ok); }
.lp-kind { margin-top: 5px; font-size: 12.5px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: var(--ink); }
.lp-take { margin-top: 14px; padding: 11px 14px; border-radius: 12px; border: 1.5px solid var(--ok-edge); font-size: 15px; color: var(--ink); line-height: 1.4; }
.lp-take.R { border-color: var(--hilite-edge); }
.lp-take b { color: var(--ok); }
.lp-take.R b { color: var(--hilite); }
.lp-key { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: 18px; font-size: 13.5px; color: var(--muted); align-items: center; }
.lp-key span { display: inline-flex; align-items: center; gap: 7px; }
.lp-key .lp-sign { position: static; margin: 0; width: 20px; height: 20px; font-size: 15px; }
`);

  const nodes = spec.nodes || [];
  const ids = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
  const links = (spec.links || []).filter((l) => {
    const ok = l.from in ids && l.to in ids;
    if (!ok) DF.warn(`link "${l.from}" -> "${l.to}" names an unknown node`);
    return ok;
  });
  const inputs = spec.inputs || [];
  const N = nodes.length;
  if (N < 2 || N > 6) DF.warn(`loop has ${N} quantities; a loop reads best with 2 to 6`);
  nodes.forEach((n) => DF.lintBox(n.label));
  const sign = (l) => (/^(-|−|minus|less)$/i.test(String(l.sign ?? "+")) ? -1 : 1);
  links.forEach((l) => { if (l.sign == null) DF.warn(`link ${l.from} -> ${l.to} has no sign; say "+" (more makes more) or "-" (more makes less)`); });

  // Each quantity must feed the next one round the ring, in node order, or it is not one loop.
  const ring = nodes.map((n, i) => links.find((l) => ids[l.from] === i && ids[l.to] === (i + 1) % N));
  if (ring.some((l) => !l)) DF.warn("links must go round the ring in node order (node 1 → 2 → … → last → 1)");
  const minus = ring.filter(Boolean).filter((l) => sign(l) < 0).length;
  const kind = minus % 2 ? "B" : "R";
  if (spec.kind && spec.kind[0].toUpperCase() !== kind)
    DF.warn(`the signs make a ${kind === "B" ? "balancing" : "reinforcing"} loop (${minus} minus), but kind says "${spec.kind}"`);

  const W = DF.canvasWidth();
  const nw = spec.nodeWidth || 200;
  const inW = 170, inGap = 56;
  const start = N === 2 ? Math.PI : -Math.PI / 2;
  const ang = (i) => start + (2 * Math.PI * i) / N;
  // Inputs sit beside their node, on the outer side; the ring moves over to leave room for them.
  const sideOf = (i) => (Math.cos(ang(i)) < -0.01 ? "L" : "R");
  const need = {L: 0, R: 0};
  inputs.forEach((inp) => { if (inp.to in ids) need[sideOf(ids[inp.to])] = inW + inGap; });
  const avail = W - need.L - need.R;
  const rx = Math.max(140, Math.min(320, (avail - nw) / 2));
  const wrap = DF.el("div", "lp");
  wrap.style.setProperty("--nw", nw + "px");
  DF.stage().appendChild(wrap);

  const els = nodes.map((n) => {
    const e = DF.card(n, nw);
    wrap.appendChild(e);
    return e;
  });
  await document.fonts.ready;
  const hMax = Math.max(...els.map((e) => e.offsetHeight));
  const ry = spec.height ? spec.height / 2 : Math.max(N === 2 ? 90 : 120, Math.min(220, hMax * (N === 4 ? 1.1 : 0.8) + 60));
  const cx = need.L + avail / 2, cy = ry + hMax / 2 + 12;
  const P = (a) => ({x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a)});
  const rects = els.map((e, i) => {
    const p = P(ang(i));
    const r = {l: p.x - nw / 2, t: p.y - e.offsetHeight / 2, w: nw, h: e.offsetHeight};
    Object.assign(e.style, {left: r.l + "px", top: r.t + "px"});
    return r;
  });
  const inside = (p, r, pad = 10) => p.x > r.l - pad && p.x < r.l + r.w + pad && p.y > r.t - pad && p.y < r.t + r.h + pad;

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "wires");
  const col = {1: DF.css("--ok-edge"), [-1]: DF.css("--fail-edge"), in: DF.css("--line")};
  svg.innerHTML = `<defs>${Object.entries(col).map(([k, v]) =>
    `<marker id="lp-${k === "-1" ? "m" : k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${v}"/></marker>`).join("")}</defs>`;
  wrap.prepend(svg);
  const pathEl = (d, color, marker, w = 2.2) => {
    const p = document.createElementNS(ns, "path");
    Object.entries({d, fill: "none", stroke: color, "stroke-width": w, "marker-end": `url(#${marker})`}).forEach(([k, v]) => p.setAttribute(k, v));
    svg.appendChild(p);
  };

  let maxY = Math.max(...rects.map((r) => r.t + r.h));
  links.forEach((l) => {
    const i = ids[l.from], j = ids[l.to];
    let a0 = ang(i), a1 = ang(j);
    if (a1 <= a0) a1 += 2 * Math.PI;
    const pts = [];
    for (let k = 0; k <= 160; k++) {
      const p = P(a0 + ((a1 - a0) * k) / 160);
      if (!inside(p, rects[i]) && !inside(p, rects[j])) pts.push(p);
    }
    if (pts.length < 2) return DF.warn(`link ${l.from} -> ${l.to} has no room; widen the ring or shorten the boxes`);
    const s = sign(l);
    pathEl("M" + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L"), col[s], s > 0 ? "lp-1" : "lp-m");
    const am = (a0 + a1) / 2, m = P(am);
    const badge = DF.el("div", `lp-sign chk ${s > 0 ? "plus" : "minus"}`, s > 0 ? "+" : "−");
    Object.assign(badge.style, {left: m.x + "px", top: m.y + "px"});
    wrap.appendChild(badge);
    if (l.label) {
      const lab = DF.el("div", "lp-lab chk", l.label);
      wrap.appendChild(lab);
      // Outside the ring, beside the badge.
      const dx = Math.cos(am), dy = Math.sin(am);
      const x = m.x + dx * 22 + (dx >= 0 ? 0 : -lab.offsetWidth), y = m.y + dy * 22 - lab.offsetHeight / 2 + (Math.abs(dy) > 0.7 ? dy * lab.offsetHeight / 2 : 0);
      const want = Math.abs(dx) < 0.3 ? m.x + 20 : x;
      let xx = Math.min(W - lab.offsetWidth, Math.max(0, want)), yy = y;
      // Pushed back over the badge by the canvas edge: put the label above or below the badge instead.
      if (Math.abs(xx - want) > 1) yy = dy < 0 ? m.y - 18 - lab.offsetHeight : m.y + 18;
      Object.assign(lab.style, {left: xx + "px", top: yy + "px"});
      maxY = Math.max(maxY, yy + lab.offsetHeight);
    }
  });

  inputs.forEach((inp) => {
    const j = ids[inp.to];
    if (j == null) return DF.warn(`input "${inp.label}" points at unknown node "${inp.to}"`);
    const r = rects[j];
    const right = sideOf(j) === "R";
    const e = DF.card({...inp, external: inp.external ?? false}, inW);
    wrap.appendChild(e);
    const x = right ? Math.min(W - inW, r.l + r.w + inGap) : Math.max(0, r.l - inGap - inW);
    const y = r.t + r.h / 2 - e.offsetHeight / 2;
    Object.assign(e.style, {left: x + "px", top: y + "px"});
    const s = inp.sign == null ? 0 : sign(inp);
    const x1 = right ? x : x + inW, x2 = right ? r.l + r.w + 3 : r.l - 3, yy = r.t + r.h / 2;
    pathEl(`M${x1},${yy} L${x2},${yy}`, s ? col[s] : col.in, s > 0 ? "lp-1" : s < 0 ? "lp-m" : "lp-in", 1.8);
    if (s) {
      const b = DF.el("div", `lp-sign chk ${s > 0 ? "plus" : "minus"}`, s > 0 ? "+" : "−");
      Object.assign(b.style, {left: (x1 + x2) / 2 + "px", top: yy - 18 + "px"});
      wrap.appendChild(b);
    }
    maxY = Math.max(maxY, y + e.offsetHeight);
  });

  const mid = DF.el("div", "lp-mid chk");
  mid.appendChild(DF.el("div", `lp-badge ${kind}`, kind));
  mid.appendChild(DF.el("div", "lp-kind", kind === "B" ? "Balancing" : "Reinforcing"));
  Object.assign(mid.style, {left: cx + "px", top: cy + "px"});
  wrap.appendChild(mid);

  const H = Math.ceil(maxY + 8);
  Object.assign(wrap.style, {width: W + "px", height: H + "px"});
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);

  {
    const t = DF.el("div", `lp-take chk ${kind}`);
    t.append(DF.el("b", null, kind === "B" ? "Balancing loop: " : "Reinforcing loop: "),
      spec.takeaway || (kind === "B" ? "each push comes back as the opposite push, so it settles." : "each push comes back bigger, so it runs away until something else stops it."));
    document.body.appendChild(t);
  }
  if (spec.legend !== false) {
    const key = DF.el("div", "lp-key chk");
    const add = (cls, t, text) => {
      const s = DF.el("span");
      s.append(DF.el("i", `lp-sign ${cls}`, t), text);
      key.appendChild(s);
    };
    const used = [...links, ...inputs.filter((i) => i.sign != null)].map(sign);
    if (used.includes(1)) add("plus", "+", "more of one makes more of the next");
    if (used.includes(-1)) add("minus", "−", "more of one makes less of the next");
    document.body.appendChild(key);
  }
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
