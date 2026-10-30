TEMPLATES.layers = async (spec, DF) => {
  DF.style(`
    .ly { display: flex; flex-direction: column; }
    .ly-layer { border: 1.5px dashed var(--edge); border-radius: 16px; background: var(--surface-alt); padding: 10px 12px 12px; }
    .ly-layer > .heading { margin: 0 4px 8px; }
    .ly-row { display: flex; align-items: stretch; }
    .ly-box {
      position: relative; flex: 1 1 0; min-width: 0; background: var(--surface); border: 1.5px solid var(--edge);
      border-radius: 12px; padding: 10px 12px 11px; border-top-width: 4px;
    }
    .ly-box.us { box-shadow: 0 0 0 4px var(--bg), 0 0 0 7px var(--hilite-edge); }
    .ly-head { display: flex; align-items: center; gap: 8px; }
    .ly-head .ic { flex: none; width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; }
    .ly-head .ic svg { width: 15px; height: 15px; }
    .ly-head b { color: var(--ink); font-size: 15px; }
    .ly-head .tag { margin-left: auto; }
    .ly-does { margin-top: 3px; font-size: 13px; color: var(--muted); }
    .ly-items { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
    .ly-items span { font-size: 12.5px; padding: 2px 8px; border-radius: 6px; color: var(--ink); }
    .ly-parts { display: flex; gap: 6px; margin-top: 8px; }
    .ly-part { flex: 1 1 0; min-width: 0; border-radius: 8px; padding: 6px 8px 7px; }
    .ly-part b { display: block; color: var(--ink); font-size: 13.5px; }
    .ly-part span { display: block; font-size: 12.5px; color: var(--muted); line-height: 1.3; }
    .ly-gap { position: relative; height: 74px; }
    .ly-gap.empty { height: 14px; }
    .ly-link { position: absolute; top: 0; bottom: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--line); }
    .ly-link svg { position: absolute; top: 0; left: 50%; transform: translateX(-50%); }
    .ly-pill {
      position: relative; font-size: 13px; color: var(--ink); background: var(--surface); border: 1.5px solid var(--edge);
      border-radius: 10px; padding: 2px 9px; white-space: nowrap; line-height: 1.35;
    }
    .ly-pill i { font-style: normal; color: var(--faint); margin-right: 4px; }
    .ly-side { flex: none; width: 124px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; color: var(--line); }
    .ly-side .ly-h { display: flex; flex-direction: column; align-items: center; }
  `);

  const S = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const right = `<svg width="108" height="14" viewBox="0 0 108 14"><path d="M2 7h103M99 1l6 6-6 6" ${S}/></svg>`;
  const left = `<svg width="108" height="14" viewBox="0 0 108 14"><path d="M106 7H3M9 1L3 7l6 6" ${S}/></svg>`;
  const shaft = (h, down, up) => {
    let d = `M8 ${up ? 2 : 0}V${down ? h - 2 : h}`;
    if (down) d += `M2 ${h - 8}l6 6 6-6`;
    if (up) d += "M2 8l6-6 6 6";
    return `<svg width="16" height="${h}" viewBox="0 0 16 ${h}"><path d="${d}" ${S}/></svg>`;
  };

  const ids = new Map();
  const box = (b) => {
    const hue = DF.color(b.color);
    const c = DF.el("div", ["ly-box", "chk", b.us && "us"].filter(Boolean).join(" "));
    c.style.borderTopColor = hue;
    if (b.span) c.style.flexGrow = b.span;
    if (b.id) ids.set(b.id, c);
    const head = DF.el("div", "ly-head");
    if (b.icon) {
      const ic = DF.el("div", "ic");
      ic.style.background = DF.tint(hue);
      ic.style.color = hue;
      ic.innerHTML = DF.icon(b.icon);
      head.appendChild(ic);
    }
    head.appendChild(DF.el("b", null, b.label));
    if (b.tag) head.appendChild(DF.el("i", "tag", b.tag));
    c.appendChild(head);
    if (b.does) c.appendChild(DF.el("div", "ly-does", b.does));
    if (b.items && b.items.length) {
      const it = DF.el("div", "ly-items");
      for (const t of b.items) {
        const s = DF.el("span", null, t);
        s.style.background = DF.tint(hue);
        it.appendChild(s);
      }
      c.appendChild(it);
    }
    if (b.parts && b.parts.length) {
      const ps = DF.el("div", "ly-parts");
      for (const p of b.parts) {
        const e = DF.el("div", "ly-part chk");
        e.style.background = DF.tint(hue);
        e.appendChild(DF.el("b", null, p.label));
        if (p.does) e.appendChild(DF.el("span", null, p.does));
        if (p.id) ids.set(p.id, e);
        ps.appendChild(e);
      }
      c.appendChild(ps);
    }
    return c;
  };

  const layers = spec.layers || [];
  if (!layers.length) DF.warn("layers has no layers");
  const root = DF.el("div", "ly");
  DF.stage().appendChild(root);
  const gaps = [];

  layers.forEach((l, i) => {
    const sec = DF.el("div", "ly-layer");
    if (l.label) sec.appendChild(DF.el("div", "heading", l.label));
    const row = DF.el("div", "ly-row");
    (l.boxes || []).forEach((b, j) => {
      if (j > 0) {
        const prev = l.boxes[j - 1];
        const s = DF.el("div", "ly-side");
        if (prev.right) {
          const h = DF.el("div", "ly-h");
          h.appendChild(DF.el("span", "ly-pill chk", prev.right));
          h.insertAdjacentHTML("beforeend", right);
          s.appendChild(h);
        }
        if (b.left) {
          const h = DF.el("div", "ly-h");
          h.insertAdjacentHTML("beforeend", left);
          h.appendChild(DF.el("span", "ly-pill chk", b.left));
          s.appendChild(h);
        }
        if (!prev.right && !b.left) s.style.width = "12px";
        row.appendChild(s);
      }
      row.appendChild(box(b));
    });
    sec.appendChild(row);
    root.appendChild(sec);
    if (i < layers.length - 1) {
      const links = l.links?.length ? l.links : l.down || l.up ? [{down: l.down, up: l.up, center: true}] : [];
      const g = DF.el("div", "ly-gap" + (links.length ? "" : " empty"));
      root.appendChild(g);
      gaps.push({g, links});
    }
  });

  // Each link sits over the center of the box or part it names in `at` (layer `down`/`up`: the figure), so arrows land on what they touch.
  const R = root.getBoundingClientRect();
  for (const {g, links} of gaps) {
    const h = g.getBoundingClientRect().height;
    for (const k of links) {
      const t = k.center ? root : ids.get(k.at);
      if (!t) { DF.warn(`link at unknown id "${k.at}"`); continue; }
      const r = t.getBoundingClientRect();
      const x = r.left - R.left + r.width / 2 + (k.shift || 0);
      const a = DF.el("div", "ly-link");
      a.style.left = x + "px";
      a.innerHTML = shaft(h, !!k.down, !!k.up);
      const pill = DF.el("div", "ly-pill chk");
      if (k.down) { const d = DF.el("div"); d.append(DF.el("i", null, "↓"), document.createTextNode(k.down)); pill.appendChild(d); }
      if (k.up) { const u = DF.el("div"); u.append(DF.el("i", null, "↑"), document.createTextNode(k.up)); pill.appendChild(u); }
      a.appendChild(pill);
      g.appendChild(a);
    }
  }

  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
