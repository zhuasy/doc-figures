/* Shared runtime for every template: theme, helpers, flow layout and self-checks. */
window.TEMPLATES = {};
const DF = (() => {
  const spec = window.SPEC || {};
  const dark = (window.THEME || "dark") !== "light";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const warnings = [];

  const PALETTE = dark
    ? {blue: "#93C5FD", teal: "#80CBC4", violet: "#C4B5FD", slate: "#B0BEC5", sky: "#81D4FA", amber: "#FFD54F",
       stone: "#BCAAA4", green: "#86EFAC", red: "#FCA5A5", pink: "#F9A8D4", orange: "#FDBA74"}
    : {blue: "#2563EB", teal: "#0F766E", violet: "#7C3AED", slate: "#475569", sky: "#0284C7", amber: "#A16207",
       stone: "#78716C", green: "#15803D", red: "#B91C1C", pink: "#BE185D", orange: "#C2410C"};

  const color = (name) => PALETTE[name] || name || PALETTE.slate;
  const tint = (hex, a = dark ? 0.16 : 0.12) => hex + Math.round(a * 255).toString(16).padStart(2, "0");
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const warn = (msg) => warnings.push(msg);

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function icon(name) {
    if (!name) return "";
    const svg = (window.ICONS || {})[name];
    if (!svg) warn(`unknown icon "${name}" (see render/icons/)`);
    return svg || "";
  }

  const TAGS = {changed: "changed", new: "new", removed: "removed"};
  /** Style comes from `changed` or a known tag; any other tag text shows as a plain pill (orange with `changed`). */
  const tagKind = (n) => (n.changed ? "changed" : TAGS[n.tag] ? n.tag : null);
  const tagText = (n) => n.tag || (n.changed ? "changed" : null);
  const tagEl = (text, kind) => el("i", "tag " + (kind || TAGS[text] || "plain"), text);

  /** A node card: icon, bold label, one line of "what it does", optional tag. */
  function card(n, width) {
    const kind = tagKind(n), text = tagText(n);
    const c = el("div", ["node", "chk", n.external && "external", kind, n.faded && "faded"].filter(Boolean).join(" "));
    if (width) c.style.width = width + "px";
    if (n.icon) {
      const hue = color(n.color || (n.external ? "amber" : "slate"));
      const ic = el("div", "ic");
      ic.style.background = tint(hue);
      ic.style.color = hue;
      ic.innerHTML = icon(n.icon);
      c.appendChild(ic);
    }
    const tx = el("div", "tx");
    const b = el("b");
    b.appendChild(el("em", null, n.label));
    if (text) b.appendChild(tagEl(text, kind));
    tx.appendChild(b);
    if (n.does) tx.appendChild(el("span", "does", n.does));
    c.appendChild(tx);
    return c;
  }

  function edgeLabel(e, num) {
    const kind = e.changed ? "changed" : e.later ? "later" : "";
    const l = el("div", "elabel chk" + (num == null ? " nonum" : ""));
    if (num != null) l.appendChild(el("i", "num " + kind, String(num)));
    l.appendChild(el("span", null, e.label));
    return l;
  }

  function orthogonal(pts) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = out[out.length - 1], b = pts[i];
      if (Math.abs(a.x - b.x) > 0.5 && Math.abs(a.y - b.y) > 0.5) {
        const m = Math.round((a.y + b.y) / 2);
        out.push({x: a.x, y: m}, {x: b.x, y: m});
      }
      out.push(b);
    }
    return out;
  }

  /** SVG path through axis-aligned points with rounded corners. */
  function path(points, r = 9) {
    const pts = orthogonal(points.map((p) => ({x: Math.round(p.x), y: Math.round(p.y)})));
    const sg = (v) => (Math.abs(v) < 1 ? 0 : Math.sign(v));
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
      const r1 = Math.min(r, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
      const p = (q) => ({x: b.x + sg(q.x - b.x) * r1, y: b.y + sg(q.y - b.y) * r1});
      const s = p(a), t = p(c);
      d += ` L${s.x},${s.y} Q${b.x},${b.y} ${t.x},${t.y}`;
    }
    const z = pts[pts.length - 1];
    return d + ` L${z.x},${z.y}`;
  }

  const STROKE = {plain: "--line", later: "--amber", changed: "--hilite-edge", ok: "--ok-edge", fail: "--fail-edge"};
  /** An <svg> layer with one arrowhead marker per stroke kind. */
  function wires(container) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "wires");
    svg.innerHTML = `<defs>${Object.entries(STROKE).map(([k, v]) =>
      `<marker id="arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${css(v)}"/></marker>`).join("")}</defs>`;
    container.prepend(svg);
    return {
      svg,
      line(points, kind = "plain", {dashed = false, width = 1.8, arrow = true} = {}) {
        const p = document.createElementNS(ns, "path");
        p.setAttribute("d", path(points));
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", css(STROKE[kind] || STROKE.plain));
        p.setAttribute("stroke-width", kind === "changed" ? width + 0.6 : width);
        if (dashed) p.setAttribute("stroke-dasharray", "6 5");
        if (arrow) p.setAttribute("marker-end", `url(#arrow-${kind})`);
        svg.appendChild(p);
        return p;
      },
      size(w, h) { svg.setAttribute("width", w); svg.setAttribute("height", h); },
    };
  }

  const edgeKind = (e) => (e.changed ? "changed" : e.later ? "later" : "plain");

  /**
   * Lay out nodes (optionally grouped) and edges inside `container` with ELK.
   * direction: "auto" tries left-to-right first and falls back to top-down when wider than maxWidth.
   */
  async function layoutFlow(container, {nodes, edges = [], direction = "auto", numbered = true, maxWidth, nodeWidth}) {
    container.style.position = "relative";
    const leaves = {};
    const walk = (list) => list.forEach((n) => (n.children ? walk(n.children) : (leaves[n.id] = n)));
    walk(nodes);
    for (const e of edges) for (const end of [e.from, e.to]) if (!leaves[end]) warn(`edge points at unknown node "${end}"`);
    const usable = edges.filter((e) => leaves[e.from] && leaves[e.to]);

    let step = 0;
    const nums = usable.map((e) => (e.step !== undefined ? e.step : numbered && e.label ? ++step : null));

    const attempt = async (dir, width) => {
      container.innerHTML = "";
      container.classList.toggle("dir-right", dir === "RIGHT");
      const els = {}, labels = [];
      for (const [id, n] of Object.entries(leaves)) container.appendChild((els[id] = card(n, width)));
      usable.forEach((e, i) => { if (e.label) container.appendChild((labels[i] = edgeLabel(e, nums[i]))); });
      const toElk = (n) => n.children
        ? {id: n.id, children: n.children.map(toElk), layoutOptions: {"elk.padding": "[top=46,left=24,bottom=24,right=24]"}}
        : {id: n.id, width: els[n.id].offsetWidth, height: els[n.id].offsetHeight};
      const graph = {
        id: "root",
        layoutOptions: {
          "elk.algorithm": "layered",
          "elk.direction": dir,
          "elk.edgeRouting": "ORTHOGONAL",
          "elk.hierarchyHandling": "INCLUDE_CHILDREN",
          "elk.layered.spacing.nodeNodeBetweenLayers": dir === "RIGHT" ? "36" : "30",
          "elk.layered.spacing.edgeNodeBetweenLayers": "14",
          "elk.spacing.nodeNode": "30",
          "elk.spacing.edgeNode": "20",
          "elk.spacing.edgeEdge": "14",
          "elk.spacing.edgeLabel": "6",
          "elk.edgeLabels.placement": "CENTER",
          "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
          "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
          "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
        },
        children: nodes.map(toElk),
        edges: usable.map((e, i) => ({
          id: "e" + i, sources: [e.from], targets: [e.to],
          labels: labels[i] ? [{text: e.label, width: labels[i].offsetWidth, height: labels[i].offsetHeight}] : [],
        })),
      };
      const g = await new ELK().layout(graph);
      return {g, els, labels};
    };

    // Up to 10% wider still shows 15px text at about 14px when the doc scales it down.
    const fits = (g) => !maxWidth || g.width <= maxWidth * 1.1;
    let res;
    const dir = String(direction).toUpperCase();
    if (dir === "RIGHT" || dir === "DOWN") res = await attempt(dir, nodeWidth || (dir === "RIGHT" ? 172 : 228));
    else {
      res = await attempt("RIGHT", nodeWidth || 172);
      if (!fits(res.g)) res = await attempt("DOWN", nodeWidth || 228);
    }
    const {g, els, labels} = res;
    if (!fits(g)) warn(`flow is ${Math.round(g.width)}px wide, more than the ${maxWidth}px canvas; split it or drop nodes`);
    else if (maxWidth && g.width > maxWidth)
      document.documentElement.style.setProperty("--w", document.body.offsetWidth + Math.ceil(g.width - maxWidth) + "px");

    const origin = {root: {x: 0, y: 0}}, laid = [...(g.edges || [])], groups = [];
    const place = (n, ox, oy) => {
      const x = ox + n.x, y = oy + n.y;
      origin[n.id] = {x, y};
      (n.edges || []).forEach((e) => laid.push(e));
      if (!n.children) return Object.assign(els[n.id].style, {left: x + "px", top: y + "px"});
      const box = el("div", "group");
      Object.assign(box.style, {left: x + "px", top: y + "px", width: n.width + "px", height: n.height + "px"});
      const src = (function find(list) {
        for (const s of list) { if (s.id === n.id) return s; if (s.children) { const f = find(s.children); if (f) return f; } }
      })(nodes);
      box.appendChild(el("div", "gl heading", src.label));
      groups.push(box);
      n.children.forEach((c) => place(c, x, y));
    };
    g.children.forEach((n) => place(n, 0, 0));

    const w = wires(container);
    // Groups go under the wires, or their opaque fill hides every arrow inside them.
    groups.reverse().forEach((box) => container.prepend(box));
    if (laid.length !== usable.length) warn(`${usable.length - laid.length} edge(s) were not routed`);
    for (const e of laid) {
      const i = +e.id.slice(1), o = origin[e.container || "root"], spec = usable[i];
      const s = e.sections[0];
      const pts = [s.startPoint, ...(s.bendPoints || []), s.endPoint].map((q) => ({x: q.x + o.x, y: q.y + o.y}));
      w.line(pts, edgeKind(spec), {dashed: !!spec.later});
      if (labels[i]) {
        const l = e.labels[0];
        Object.assign(labels[i].style, {left: l.x + o.x + "px", top: l.y + o.y + "px"});
      }
    }
    w.size(g.width, g.height);
    container.style.width = g.width + "px";
    container.style.height = g.height + "px";
    return {
      width: g.width, height: g.height,
      used: {
        later: usable.some((e) => e.later),
        external: Object.values(leaves).some((n) => n.external),
        plain: usable.some((e) => !e.later),
      },
    };
  }

  /** Legend row. items: [{line: "plain"|"later"|"changed", dashed}, {box: "external"}, {swatch: color}] with text. */
  function legend(items, parent = document.body) {
    const lg = el("div", "legend chk");
    for (const it of items) {
      const s = el("span");
      if (it.line) {
        const c = css(STROKE[it.line] || STROKE.plain);
        s.innerHTML = `<svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" stroke="${c}" stroke-width="1.8" ${it.dashed ? 'stroke-dasharray="6 5"' : ""}/></svg>`;
      } else if (it.box === "external") {
        s.innerHTML = `<svg width="22" height="14"><rect x="1" y="1" width="20" height="12" rx="3" fill="none" stroke="${css("--amber")}" stroke-dasharray="3 2"/></svg>`;
      } else if (it.swatch) {
        const c = color(it.swatch);
        s.innerHTML = `<svg width="16" height="12"><rect x="0" y="0" width="16" height="12" rx="3" fill="${it.hatch ? "none" : c}" stroke="${c}"/></svg>`;
      }
      s.appendChild(document.createTextNode(it.text));
      lg.appendChild(s);
    }
    parent.appendChild(lg);
    return lg;
  }

  function checks() {
    const items = [...document.querySelectorAll(".chk")].filter((e) => e.offsetParent !== null || e === document.body);
    const rects = items.map((e) => e.getBoundingClientRect());
    const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    const name = (e) => `"${e.textContent.trim().replace(/\s+/g, " ").slice(0, 32)}"`;
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++)
        if (!items[i].contains(items[j]) && !items[j].contains(items[i]) && hit(rects[i], rects[j]))
          warn(`overlap: ${name(items[i])} and ${name(items[j])}`);
    const body = document.body.getBoundingClientRect();
    items.forEach((e, i) => {
      if (rects[i].right > body.right + 1 || rects[i].left < body.left - 1) warn(`outside the canvas: ${name(e)}`);
      if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== "visible") warn(`text clipped: ${name(e)}`);
    });
    let small = null;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const p = walker.currentNode.parentElement;
      if (!walker.currentNode.textContent.trim() || !p) continue;
      const size = parseFloat(getComputedStyle(p).fontSize);
      if (size < 12.5 && !p.closest(".tag,.num")) { small = `${size}px text: "${walker.currentNode.textContent.trim().slice(0, 30)}"`; break; }
    }
    if (small) warn(`text below 12.5px reads too small in a doc: ${small}`);
  }

  async function run() {
    try {
      if (spec.width) document.documentElement.style.setProperty("--w", spec.width + "px");
      document.getElementById("title").textContent = spec.title || "";
      const sub = document.getElementById("subtitle");
      if (spec.subtitle) sub.textContent = spec.subtitle; else sub.remove();
      const name = spec.template || "flow";
      await new Promise((ok, fail) => {
        const s = el("script");
        s.src = `templates/${name}.js`;
        s.onload = ok;
        s.onerror = () => fail(new Error(`no template "${name}" (see render/templates/)`));
        document.head.appendChild(s);
      });
      await TEMPLATES[name](spec, DF);
      await document.fonts.ready;
      checks();
      const b = document.body;
      b.dataset.w = Math.ceil(Math.max(b.offsetWidth, b.scrollWidth));
      b.dataset.h = Math.ceil(Math.max(b.offsetHeight, b.scrollHeight));
      document.body.dataset.warnings = JSON.stringify(warnings);
      document.body.dataset.done = "1";
    } catch (err) {
      document.body.dataset.error = String(err && err.stack || err);
      document.body.dataset.done = "error";
    }
  }

  /** Add template-specific CSS once. */
  function style(text) {
    const s = el("style");
    s.textContent = text;
    document.head.appendChild(s);
  }

  const canvasWidth = () => document.getElementById("stage").clientWidth;

  return {spec, dark, PALETTE, color, tint, css, warn, el, icon, card, tagEl, edgeLabel, path, wires, edgeKind,
          layoutFlow, legend, style, canvasWidth, run, stage: () => document.getElementById("stage")};
})();
