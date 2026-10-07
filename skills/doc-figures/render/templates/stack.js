TEMPLATES.stack = async (spec, DF) => {
  DF.style(`
    .stk { position: relative; }
    .stk-row { display: flex; align-items: center; gap: 12px; }
    .stk-badge {
      flex: none; width: 28px; height: 28px; margin: 0 8px; border-radius: 50%; display: grid; place-items: center;
      font-weight: 800; font-size: 13px; background: var(--muted); color: var(--bg);
    }
    .stk-badge.this { background: var(--hilite-edge); }
    .stk-badge.merged { background: transparent; border: 1.5px solid var(--ok-edge); color: var(--ok); }
    .stk-badge svg { width: 15px; height: 15px; stroke-width: 3; }
    .stk-badge.none { background: none; }
    .stk-card {
      flex: 1; min-width: 0; background: var(--surface); border: 1.5px solid var(--edge); border-radius: 12px;
      padding: 11px 16px 12px;
    }
    .stk-card.this { border: 2px solid var(--hilite-edge); box-shadow: 0 0 0 5px var(--hilite-glow); }
    .stk-card.draft { border-style: dashed; }
    .stk-card.merged { opacity: .6; }
    .stk-head { display: flex; align-items: center; gap: 10px; }
    .stk-head b { color: var(--ink); font-size: 15.5px; min-width: 0; }
    .stk-head .tag { margin-left: 0; vertical-align: 0; flex: none; }
    .stk-num { flex: none; font-family: var(--mono); font-size: 13px; font-weight: 600; padding: 2px 7px; border-radius: 6px; }
    .stk-status { margin-left: auto; padding-left: 12px; font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 5px; white-space: nowrap; }
    .stk-status.merged { color: var(--ok); }
    .stk-status svg { width: 15px; height: 15px; }
    .stk-adds { margin-top: 4px; font-size: 14px; color: var(--muted); }
    .stk-gap { margin-left: 56px; min-height: 34px; padding: 8px 0 8px 46px; display: flex; align-items: center; }
    .stk-needs { font-size: 13.5px; color: var(--muted); }
    .stk-needs .k { font-size: 12.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); margin-right: 7px; }
    .stk-gap.hot .stk-needs { color: var(--body); }
    .stk-gap.hot .stk-needs .k { color: var(--hilite); }
    .stk-base {
      flex: 1; display: flex; align-items: center; gap: 10px; padding: 9px 16px; border-radius: 10px;
      background: var(--surface-alt); border: 1.5px solid var(--edge); font-size: 14px; color: var(--muted);
    }
    .stk-base svg { width: 17px; height: 17px; color: var(--faint); }
    .stk-base code { color: var(--ink); font-size: 14px; font-weight: 600; }
  `);

  const prs = spec.prs || [];
  if (!prs.length) DF.warn("stack has no prs");
  const root = DF.el("div", "stk");
  DF.stage().appendChild(root);
  const blue = DF.color("blue");

  const layer = (pr, i) => {
    const r = DF.el("div", "stk-row");
    const merged = pr.status === "merged";
    const badge = DF.el("div", ["stk-badge", merged && "merged", pr.this && "this"].filter(Boolean).join(" "));
    if (merged) badge.innerHTML = DF.icon("check"); else badge.textContent = i + 1;
    const card = DF.el("div", ["stk-card", "chk", pr.this && "this", pr.status].filter(Boolean).join(" "));
    const head = DF.el("div", "stk-head");
    if (pr.number != null) {
      const num = DF.el("span", "stk-num", "#" + pr.number);
      Object.assign(num.style, {background: DF.tint(blue), color: blue});
      head.appendChild(num);
    }
    head.appendChild(DF.el("b", null, pr.title));
    if (pr.this) head.appendChild(DF.el("i", "tag", "this PR"));
    if (pr.status) {
      const st = DF.el("span", "stk-status " + pr.status);
      if (merged) st.innerHTML = DF.icon("check");
      st.appendChild(document.createTextNode(pr.status));
      head.appendChild(st);
    }
    card.appendChild(head);
    if (pr.adds) card.appendChild(DF.el("div", "stk-adds", pr.adds));
    r.append(badge, card);
    return {row: r, box: card};
  };

  const gap = (text, hot) => {
    const g = DF.el("div", "stk-gap" + (hot ? " hot" : ""));
    if (text) {
      const t = DF.el("div", "stk-needs chk");
      t.append(DF.el("span", "k", "needs"), document.createTextNode(text));
      g.appendChild(t);
    }
    return g;
  };

  const links = [];
  let above = null;
  for (let i = prs.length - 1; i >= 0; i--) {
    const l = layer(prs[i], i);
    if (above) links[links.length - 1].lower = l.box;
    root.appendChild(l.row);
    const g = gap(prs[i].needs, prs[i].this);
    root.appendChild(g);
    links.push({upper: l.box, gap: g, hot: !!prs[i].this});
    above = l;
  }
  const baseRow = DF.el("div", "stk-row");
  const base = DF.el("div", "stk-base chk");
  base.innerHTML = DF.icon("git-branch");
  base.append(DF.el("code", null, spec.base || "main"), document.createTextNode("base branch"));
  baseRow.append(DF.el("div", "stk-badge none"), base);
  root.appendChild(baseRow);
  if (links.length) links[links.length - 1].lower = base;

  const w = DF.wires(root);
  const R = root.getBoundingClientRect();
  for (const {upper, lower, hot} of links) {
    const u = upper.getBoundingClientRect(), d = lower.getBoundingClientRect();
    const x = u.left - R.left + 24;
    w.line([{x, y: d.top - R.top - 1}, {x, y: u.bottom - R.top + 3}], hot ? "changed" : "plain");
  }
  w.size(R.width, R.height);

  const open = prs.filter((p) => p.status !== "merged");
  const order = open.map((p) => "#" + p.number);
  const numbered = open.every((p) => p.number != null);
  const note = spec.note ?? (open.length > 1 ? (numbered ? `Numbers give the merge order. Merge bottom-up: ${order.join(", then ")}.` : "Merge bottom-up, one layer at a time.") : null);
  if (note) document.body.appendChild(DF.el("div", "note chk", note));
};
