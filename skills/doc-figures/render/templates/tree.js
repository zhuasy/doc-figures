/*
 * tree: one root that splits into branches. Hierarchies, taxonomies, decision trees and frequency trees ("of 1,000
 * people, 10 are sick..."). Write it nested: each node has `children`, and `edge` is the label on the line from its
 * parent. `sum` adds up chosen leaves under the tree, which is how a frequency tree answers its question.
 */
TEMPLATES.tree = async (spec, DF) => {
  DF.style(`
.tr-sum { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; margin-top: 22px; padding: 12px 15px; border-radius: 12px;
  border: 2px solid var(--hilite-edge); box-shadow: 0 0 0 5px var(--hilite-glow); font-size: 15px; color: var(--ink); }
.tr-sum .lab { font-weight: 700; margin-right: 4px; }
.tr-sum .v { min-width: 34px; height: 32px; padding: 0 9px; border-radius: 8px; display: inline-grid; place-items: center; font-weight: 800;
  background: var(--hilite-glow); border: 1.5px solid var(--hilite-edge); }
.tr-sum .op { font-weight: 700; color: var(--muted); }
.tr-sum .res { flex-basis: 100%; color: var(--body); }
`);

  const nodes = [], edges = [], byId = {};
  let auto = 0;
  const sum = spec.sum || null;
  const inSum = new Set(sum ? sum.of || [] : []);
  (function walk(n, parent) {
    const id = n.id || `n${++auto}`;
    const label = n.value != null ? `${n.value} ${n.label || ""}`.trim() : n.label;
    const node = {...n, id, label, hl: n.hl || inSum.has(id)};
    delete node.children;
    nodes.push(node);
    byId[id] = node;
    if (parent) edges.push({from: parent, to: id, label: n.edge, hl: n.hl || inSum.has(id)});
    (n.children || []).forEach((c) => walk(c, id));
  })(spec.root || {label: "(no root)"}, null);
  if (!spec.root) DF.warn("tree needs a root: {label, children: [...]}");
  for (const id of inSum) if (!byId[id]) DF.warn(`sum names unknown node "${id}"`);

  const stage = DF.stage();
  const inner = DF.el("div");
  stage.appendChild(inner);
  const {crossings} = await DF.layoutFlow(inner, {
    nodes, edges, direction: spec.direction || "right", numbered: false, nodeWidth: spec.nodeWidth,
    maxWidth: DF.canvasWidth(), maxBoxes: 15, labelArrows: false,
  });
  inner.style.margin = "0 auto";
  DF.warnCrossings(crossings);

  if (sum) {
    const row = DF.el("div", "tr-sum chk");
    if (sum.label) row.appendChild(DF.el("span", "lab", sum.label));
    const vals = (sum.of || []).map((id) => byId[id]).filter(Boolean);
    vals.forEach((n, i) => {
      if (i) row.appendChild(DF.el("span", "op", "+"));
      row.appendChild(DF.el("span", "v", String(n.value ?? n.label)));
    });
    const nums = vals.map((n) => Number(String(n.value ?? "").replace(/[, ]/g, "")));
    if (vals.length > 1 && nums.every((v) => Number.isFinite(v))) {
      const total = nums.reduce((a, b) => a + b, 0);
      if (sum.total != null && Number(String(sum.total).replace(/[, ]/g, "")) !== total)
        DF.warn(`sum total says ${sum.total} but the leaves add up to ${total}`);
      row.append(DF.el("span", "op", "="), DF.el("span", "v", sum.total != null ? String(sum.total) : total.toLocaleString("en-US")));
    }
    if (sum.result) row.appendChild(DF.el("span", "res", sum.result));
    document.body.appendChild(row);
  }
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
