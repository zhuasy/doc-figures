TEMPLATES.onion = async (spec, DF) => {
  DF.style(`
    .on-row { display: flex; gap: 22px; align-items: stretch; }
    .on-col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; }
    .on-label { font-size: 15px; font-weight: 700; color: var(--ink); margin: 0 0 2px 2px; }
    .on-sublabel { font-size: 13.5px; color: var(--muted); margin: 0 0 10px 2px; }
    .on-entry { display: flex; align-items: center; gap: 7px; font-size: 13.5px; color: var(--muted); margin: 0 0 8px 2px; }
    .on-entry svg { width: 16px; height: 16px; color: var(--faint); flex: none; }
    .on-layer { border: 1.5px solid var(--edge); border-radius: 13px; padding: 9px 12px 12px; }
    .on-layer.core { padding-bottom: 10px; }
    .on-layer.external { border-style: dashed; border-color: var(--amber); }
    .on-layer.changed { border: 2px solid var(--hilite-edge); box-shadow: 0 0 0 4px var(--hilite-glow); }
    .on-layer.faded { opacity: .55; }
    .on-head { display: flex; align-items: flex-start; gap: 9px; }
    .on-num {
      flex: none; width: 22px; height: 22px; margin-top: 1px; border-radius: 50%; display: grid; place-items: center;
      font-size: 12.5px; font-weight: 800; color: var(--bg);
    }
    .on-ic { flex: none; width: 18px; height: 18px; margin-top: 3px; }
    .on-ic svg { width: 18px; height: 18px; }
    .on-tx { min-width: 0; flex: 1; }
    .on-tx b { color: var(--ink); font-size: 14.5px; }
    .on-tx b .tag { margin-left: 7px; }
    .on-does { display: block; font-size: 13px; color: var(--muted); margin-top: 1px; line-height: 1.35; }
    .on-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
    .on-chip {
      display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 600;
      padding: 1px 7px; border-radius: 6px; border: 1px solid var(--edge); color: var(--body); background: var(--bg);
    }
    .on-chip svg { width: 13px; height: 13px; }
    .on-chip.secret { border-color: var(--hilite-edge); color: var(--hilite); }
    .on-chip.ok { border-color: var(--ok-edge); color: var(--ok); }
    .on-body { margin-top: 9px; }
    .on-verdict { margin-top: auto; padding-top: 10px; font-size: 13.5px; color: var(--body); padding-left: 2px; padding-right: 2px; }
    .on-verdict .k { font-weight: 700; color: var(--ink); }
  `);

  const columns = spec.onions || (spec.layers ? [{layers: spec.layers, verdict: spec.verdict, verdictKey: spec.verdictKey}] : []);
  if (!columns.length) DF.warn("onion has no layers");
  const row = DF.el("div", "on-row");
  DF.stage().appendChild(row);
  let sawExternal = false, sawSecret = false;

  const chip = (c) => {
    const o = typeof c === "string" ? {text: c} : c;
    const kind = o.secret ? "secret" : o.ok ? "ok" : "";
    if (o.secret) sawSecret = true;
    const s = DF.el("span", "on-chip " + kind);
    const ic = o.icon || (o.secret ? "key-round" : null);
    if (ic) s.innerHTML = DF.icon(ic);
    s.appendChild(document.createTextNode(o.text));
    return s;
  };

  const layer = (layers, i) => {
    const n = layers[i];
    const core = i === layers.length - 1;
    const hue = DF.color(n.color || (n.external ? "amber" : "slate"));
    if (n.external) sawExternal = true;
    DF.lintBox(n.title);
    const box = DF.el("div", ["on-layer", core && "core", n.external && "external", n.changed && "changed", n.faded && "faded"].filter(Boolean).join(" "));
    if (!n.external && !n.changed) box.style.borderColor = DF.tint(hue, DF.dark ? 0.55 : 0.5);
    box.style.background = DF.tint(hue, DF.dark ? 0.05 : 0.04);

    const head = DF.el("div", "on-head chk");
    if (spec.numbered !== false) {
      const num = DF.el("div", "on-num", String(i + 1));
      num.style.background = n.changed ? DF.css("--hilite") : hue;
      head.appendChild(num);
    }
    if (n.icon) {
      const ic = DF.el("div", "on-ic");
      ic.innerHTML = DF.icon(n.icon);
      ic.style.color = hue;
      head.appendChild(ic);
    }
    const tx = DF.el("div", "on-tx");
    const b = DF.el("b", null, n.title);
    const tagText = n.tag || (n.changed ? "changed" : null);
    if (tagText) b.appendChild(DF.tagEl(tagText, n.changed ? "changed" : null));
    tx.appendChild(b);
    if (n.does) tx.appendChild(DF.el("span", "on-does", n.does));
    if (n.chips && n.chips.length) {
      const cs = DF.el("div", "on-chips");
      n.chips.forEach((c) => cs.appendChild(chip(c)));
      tx.appendChild(cs);
    }
    head.appendChild(tx);
    box.appendChild(head);

    if (!core) {
      const body = DF.el("div", "on-body");
      body.appendChild(layer(layers, i + 1));
      box.appendChild(body);
    }
    return box;
  };

  for (const col of columns) {
    const c = DF.el("div", "on-col");
    if (col.label) c.appendChild(DF.el("div", "on-label chk", col.label));
    if (col.sublabel) c.appendChild(DF.el("div", "on-sublabel chk", col.sublabel));
    if (col.entry || spec.entry) {
      const e = DF.el("div", "on-entry chk");
      e.innerHTML = DF.icon("download");
      e.appendChild(document.createTextNode(col.entry || spec.entry));
      c.appendChild(e);
    }
    const layers = col.layers || [];
    if (!layers.length) DF.warn(`onion column "${col.label || ""}" has no layers`);
    else {
      if (layers.length > 7) DF.warn(`onion column "${col.label || ""}" has ${layers.length} layers; more than 7 gets hard to read`);
      c.appendChild(layer(layers, 0));
    }
    if (col.verdict) {
      const v = DF.el("div", "on-verdict chk");
      if (col.verdictKey) v.appendChild(DF.el("span", "k", col.verdictKey + " "));
      v.appendChild(document.createTextNode(col.verdict));
      c.appendChild(v);
    }
    row.appendChild(c);
  }

  const items = [];
  if (sawSecret) items.push({swatch: "orange", hatch: true, text: "the secret is readable here"});
  if (sawExternal) items.push({box: "external", text: "another company's system"});
  if (items.length && spec.legend !== false) DF.legend(items);
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
