/*
 * The rendered page as one standalone SVG, for render.mjs --svg. Boxes become paths, inline <svg> (icons, arrows)
 * is copied with its computed colors, and text becomes one <text> per line at the position Chrome laid it out.
 * Line breaks are fixed here, so a reader's fonts can make a line a little wider or narrower but never rewrap it.
 */
function figureSvg() {
  const out = [], late = [], defs = [];
  let uid = 0;
  const num = (v) => +(+v).toFixed(2);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
  const SKIP = new Set(["SCRIPT", "STYLE", "TEMPLATE", "TITLE", "META", "LINK"]);

  /** A computed color as [rgb, alpha], or null when it paints nothing. Handles the color() form of color-mix(). */
  function rgba(c) {
    if (!c || c === "transparent" || c === "none") return null;
    let m, r, g, b, a = 1;
    if ((m = c.match(/^rgba?\(([^)]+)\)$/))) [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    else if ((m = c.match(/^color\(srgb ([^)]+)\)$/))) {
      const v = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
      [r, g, b] = v.slice(0, 3).map((x) => x * 255);
      a = v[3] ?? 1;
    } else return [c, 1];
    return a > 0 ? [`rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`, a] : null;
  }
  const fill = (c, key = "fill") => {
    const p = rgba(c);
    return p ? `${key}="${p[0]}"${p[1] < 1 ? ` ${key}-opacity="${num(p[1])}"` : ""}` : null;
  };

  /** A box outline with per-corner [rx, ry] radii, scaled down the way CSS does when they don't fit. */
  function rrect(x, y, w, h, radii) {
    if (w <= 0 || h <= 0) return "";
    const [tl, tr, br, bl] = radii;
    let f = 1;
    for (const [len, sum] of [[w, tl[0] + tr[0]], [w, bl[0] + br[0]], [h, tl[1] + bl[1]], [h, tr[1] + br[1]]])
      if (sum > len) f = Math.min(f, len / sum);
    const [a, b, c, d] = radii.map(([rx, ry]) => [rx * f, ry * f]);
    const arc = ([rx, ry], ex, ey) => (rx && ry ? `A${num(rx)},${num(ry)} 0 0 1 ${num(ex)},${num(ey)}` : `L${num(ex)},${num(ey)}`);
    return `M${num(x + a[0])},${num(y)}H${num(x + w - b[0])}${arc(b, x + w, y + b[1])}V${num(y + h - c[1])}` +
      `${arc(c, x + w - c[0], y + h)}H${num(x + d[0])}${arc(d, x, y + h - d[1])}V${num(y + a[1])}${arc(a, x + a[0], y)}Z`;
  }

  const SIDES = ["Top", "Right", "Bottom", "Left"], CORNERS = ["TopLeft", "TopRight", "BottomRight", "BottomLeft"];

  /** Border box and padding box outlines of an element, as CSS draws them. */
  function outlines(cs, r) {
    const radii = CORNERS.map((k) => {
      const [rx, ry = rx] = cs[`border${k}Radius`].split(" ").map(parseFloat);
      return [rx || 0, ry || 0];
    });
    const bw = SIDES.map((s) => (cs[`border${s}Style`] === "none" ? 0 : parseFloat(cs[`border${s}Width`]) || 0));
    const [t, rt, bt, l] = bw;
    const inner = radii.map(([rx, ry], i) => [Math.max(0, rx - (i === 0 || i === 3 ? l : rt)), Math.max(0, ry - (i < 2 ? t : bt))]);
    return {
      radii, bw, inner,
      outer: rrect(r.x, r.y, r.width, r.height, radii),
      padding: rrect(r.x + l, r.y + t, r.width - l - rt, r.height - t - bt, inner),
    };
  }

  /** Split a computed list (box-shadow, gradient stops) on top-level commas. */
  function topLevel(s) {
    const out = [];
    let depth = 0, cur = "";
    for (const ch of s) {
      depth += ch === "(" ? 1 : ch === ")" ? -1 : 0;
      if (ch === "," && !depth) { out.push(cur.trim()); cur = ""; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  const COLOR = /rgba?\([^)]*\)|color\([^)]*\)|transparent/;

  function shadows(cs, r, o, parts) {
    if (cs.boxShadow === "none") return;
    // The first shadow paints on top, so draw them last to first.
    for (const s of topLevel(cs.boxShadow).reverse()) {
      const color = s.match(COLOR)?.[0];
      const [ox = 0, oy = 0, blur = 0, spread = 0] = (s.replace(COLOR, "").match(/-?[\d.]+px/g) || []).map(parseFloat);
      const f = fill(color);
      if (!f) continue;
      if (blur) console.warn("figureSvg: blurred box-shadow drawn sharp");
      if (/\binset\b/.test(s)) {
        // An inset shadow fills the padding box outside a copy of it that is moved and shrunk.
        const [t, rt, bt, l] = o.bw;
        const x = r.x + l + ox + spread, y = r.y + t + oy + spread;
        const hole = rrect(x, y, r.width - l - rt - 2 * spread, r.height - t - bt - 2 * spread,
          o.inner.map(([rx, ry]) => [Math.max(0, rx - spread), Math.max(0, ry - spread)]));
        const id = `c${++uid}`;
        defs.push(`<clipPath id="${id}"><path d="${o.padding}"/></clipPath>`);
        parts.push(`<path clip-path="url(#${id})" fill-rule="evenodd" d="${o.padding}${hole}" ${f}/>`);
      } else {
        const grow = o.radii.map(([rx, ry]) => [rx ? rx + spread : 0, ry ? ry + spread : 0]);
        // CSS never paints an outer shadow under its own box, so the box is a hole in it.
        const shape = rrect(r.x + ox - spread, r.y + oy - spread, r.width + 2 * spread, r.height + 2 * spread, grow);
        parts.push(`<path fill-rule="evenodd" d="${shape}${o.outer}" ${f}/>`);
      }
    }
  }

  /** repeating-linear-gradient stripes (the timeline's hatching) as a rotated SVG pattern. */
  function gradient(img, r) {
    const m = img.match(/^repeating-linear-gradient\((.*)\)$/);
    if (!m) { if (img !== "none") console.warn(`figureSvg: background-image not drawn: ${img.slice(0, 60)}`); return null; }
    const args = topLevel(m[1]);
    const angle = /deg$/.test(args[0]) ? parseFloat(args.shift()) : 180;
    const stops = [];
    for (const a of args) {
      const color = a.match(COLOR)?.[0];
      const pos = (a.replace(COLOR, "").match(/[\d.]+px/g) || []).map(parseFloat);
      (pos.length ? pos : [stops.length ? stops[stops.length - 1].pos : 0]).forEach((p) => stops.push({color, pos: p}));
    }
    const period = stops[stops.length - 1]?.pos;
    if (!period) return null;
    const bands = [];
    for (let i = 0; i + 1 < stops.length; i++) {
      const f = stops[i].color === stops[i + 1].color && fill(stops[i].color);
      if (f && stops[i + 1].pos > stops[i].pos)
        bands.push(`<rect x="${num(stops[i].pos)}" width="${num(stops[i + 1].pos - stops[i].pos)}" height="1" ${f}/>`);
    }
    const id = `p${++uid}`;
    defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="${num(period)}" height="1" ` +
      `patternTransform="translate(${num(r.x)},${num(r.y)}) rotate(${angle - 90})">${bands.join("")}</pattern>`);
    return `url(#${id})`;
  }

  function borders(cs, r, o, parts) {
    const [t, rt, bt, l] = o.bw;
    const sides = SIDES.map((s, i) => ({w: o.bw[i], style: cs[`border${s}Style`], color: cs[`border${s}Color`]}))
      .filter((s) => s.w > 0 && rgba(s.color));
    if (!sides.length) return;
    const same = sides.length === 4 && sides.every((s) => s.w === sides[0].w && s.style === sides[0].style && s.color === sides[0].color);
    if (same && (sides[0].style === "dashed" || sides[0].style === "dotted")) {
      // Dashes run along the middle of the border, like Chrome's (whose dash length adapts to each side).
      const w = sides[0].w, h = w / 2;
      const dash = sides[0].style === "dashed" ? `${num(w * 3)} ${num(w * 3)}` : `0 ${num(w * 2)}`;
      const radii = o.radii.map(([rx, ry]) => [Math.max(0, rx - h), Math.max(0, ry - h)]);
      parts.push(`<path d="${rrect(r.x + h, r.y + h, r.width - w, r.height - w, radii)}" fill="none" ${fill(sides[0].color, "stroke")} ` +
        `stroke-width="${num(w)}" stroke-dasharray="${dash}"${sides[0].style === "dotted" ? ' stroke-linecap="round"' : ""}/>`);
      return;
    }
    // Solid borders: the ring between the border box and the padding box. Sides with different colors are each
    // clipped to their own trapezoid, which is how CSS joins them at the corners.
    const ring = `d="${o.outer}${o.padding}" fill-rule="evenodd"`;
    const colors = new Set(sides.map((s) => s.color));
    if (colors.size === 1) { parts.push(`<path ${ring} ${fill(sides[0].color)}/>`); return; }
    const {x, y, width: w, height: h} = r;
    const traps = {
      Top: [[x, y], [x + w, y], [x + w - rt, y + t], [x + l, y + t]],
      Right: [[x + w, y], [x + w, y + h], [x + w - rt, y + h - bt], [x + w - rt, y + t]],
      Bottom: [[x, y + h], [x + w, y + h], [x + w - rt, y + h - bt], [x + l, y + h - bt]],
      Left: [[x, y], [x, y + h], [x + l, y + h - bt], [x + l, y + t]],
    };
    SIDES.forEach((s, i) => {
      const f = o.bw[i] > 0 && fill(cs[`border${s}Color`]);
      if (!f) return;
      const id = `c${++uid}`;
      defs.push(`<clipPath id="${id}"><polygon points="${traps[s].map((p) => p.map(num).join(",")).join(" ")}"/></clipPath>`);
      parts.push(`<path clip-path="url(#${id})" ${ring} ${f}/>`);
    });
  }

  function box(e, cs, parts) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const o = outlines(cs, r);
    shadows(cs, r, o, parts);
    const bg = fill(cs.backgroundColor);
    if (bg) parts.push(`<path d="${o.outer}" ${bg}/>`);
    // Background layers: the first one listed paints on top.
    for (const img of topLevel(cs.backgroundImage).reverse()) {
      const pattern = gradient(img, r);
      if (pattern) parts.push(`<path d="${o.outer}" fill="${pattern}"/>`);
    }
    borders(cs, r, o, parts);
    return o;
  }

  const ctx = document.createElement("canvas").getContext("2d");
  const ascents = {};
  const ascent = (font) => (ascents[font] ??= ((ctx.font = font), ctx.measureText("Hg").fontBoundingBoxAscent));

  /** One <text> per laid-out line: each character's box says which line it landed on. */
  function text(node, cs, parts) {
    const s = node.data;
    if (!s.trim()) return;
    const range = document.createRange();
    const lines = [];
    let cur = null;
    for (let i = 0; i < s.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const q = range.getClientRects()[0];
      if (!q || q.width === 0) continue; // collapsed white space
      const space = /\s/.test(s[i]);
      if (!cur || Math.abs(q.top - cur.top) > q.height / 2) {
        if (space) continue;
        lines.push((cur = {top: q.top, left: q.left, text: ""}));
      }
      cur.text += space ? " " : s[i];
    }
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const up = cs.textTransform === "uppercase" ? (t) => t.toUpperCase() : cs.textTransform === "lowercase" ? (t) => t.toLowerCase() : (t) => t;
    // Chrome draws the PNG with the first installed font after -apple-system, but Safari maps -apple-system to the
    // wider SF Pro. Leave it out so every browser uses the font the figure was laid out and checked with.
    const family = cs.fontFamily.split(",").map((f) => f.trim()).filter((f) => !/^(-apple-system|BlinkMacSystemFont|system-ui)$/.test(f)).join(", ");
    const attrs = [`font-family="${esc(family)}"`, `font-size="${parseFloat(cs.fontSize)}"`,
      cs.fontWeight !== "400" && `font-weight="${cs.fontWeight}"`, cs.fontStyle !== "normal" && `font-style="${cs.fontStyle}"`,
      parseFloat(cs.letterSpacing) && `letter-spacing="${num(parseFloat(cs.letterSpacing))}"`,
      cs.textDecorationLine !== "none" && `text-decoration="${cs.textDecorationLine}"`, fill(cs.color)].filter(Boolean).join(" ");
    for (const ln of lines) {
      const t = ln.text.replace(/ +$/, "");
      if (t) parts.push(`<text x="${num(ln.left)}" y="${num(ln.top + ascent(font))}" ${attrs}>${esc(up(t))}</text>`);
    }
  }

  const PAINT = ["fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "fill-opacity", "stroke-opacity", "fill-rule"];

  /** An inline <svg>, copied with computed paint (currentColor and CSS variables resolved) and its CSS transform. */
  function inlineSvg(e, cs) {
    const r = e.getBoundingClientRect();
    const w = e.clientWidth || r.width, h = e.clientHeight || r.height;
    if (!w || !h) return "";
    const copy = e.cloneNode(true);
    const src = [e, ...e.querySelectorAll("*")], dst = [copy, ...copy.querySelectorAll("*")];
    src.forEach((s, i) => {
      const c = getComputedStyle(s), d = dst[i];
      d.removeAttribute("class");
      d.removeAttribute("style");
      if (s === e) return;
      for (const p of PAINT) {
        let v = c.getPropertyValue(p);
        if (!v || v === "none" && p !== "fill" && p !== "stroke") continue;
        if (p === "fill" || p === "stroke") {
          const col = rgba(v);
          d.setAttribute(p, col ? col[0] : "none");
          if (col && col[1] < 1) d.setAttribute(`${p}-opacity`, num(col[1]));
          else d.removeAttribute(`${p}-opacity`);
          continue;
        }
        if (p === "fill-opacity" || p === "stroke-opacity") { if (v !== "1" && !d.hasAttribute(p)) d.setAttribute(p, v); continue; }
        d.setAttribute(p, v.replace(/px/g, "").replace(/,\s*/g, " "));
      }
      const op = parseFloat(c.opacity);
      if (op < 1) d.setAttribute("opacity", op);
    });
    for (const a of ["x", "y"]) copy.removeAttribute(a);
    copy.setAttribute("x", num(-w / 2));
    copy.setAttribute("y", num(-h / 2));
    copy.setAttribute("width", num(w));
    copy.setAttribute("height", num(h));
    if (cs.overflow === "visible") copy.setAttribute("overflow", "visible");
    // getBoundingClientRect already includes any translate; a rotation turns the copy about its center.
    const m = new DOMMatrix(cs.transform === "none" ? undefined : cs.transform);
    const turn = m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1 ? "" : ` matrix(${[m.a, m.b, m.c, m.d].map(num).join(",")},0,0)`;
    const body = new XMLSerializer().serializeToString(copy).replace(/ xmlns="[^"]*"/, "");
    return `<g transform="translate(${num(r.x + r.width / 2)},${num(r.y + r.height / 2)})${turn}">${body}</g>`;
  }

  function walk(e, buf) {
    const cs = getComputedStyle(e);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    // Positioned elements with a positive z-index paint after everything else.
    if (buf !== late && cs.position !== "static" && parseInt(cs.zIndex, 10) > 0) return walk(e, late);
    const op = parseFloat(cs.opacity);
    const parts = [];
    if (e instanceof SVGSVGElement) parts.push(inlineSvg(e, cs));
    else {
      const o = e === document.body ? null : box(e, cs, parts);
      const kids = [];
      for (const c of e.childNodes)
        if (c.nodeType === Node.TEXT_NODE) text(c, cs, kids);
        else if (c.nodeType === Node.ELEMENT_NODE && !SKIP.has(c.tagName)) walk(c, kids);
      if (kids.length && o && cs.overflowX !== "visible") {
        const id = `c${++uid}`;
        defs.push(`<clipPath id="${id}"><path d="${o.padding}"/></clipPath>`);
        parts.push(`<g clip-path="url(#${id})">${kids.join("")}</g>`);
      } else parts.push(...kids);
    }
    const s = parts.join("");
    if (s) buf.push(op < 1 ? `<g opacity="${num(op)}">${s}</g>` : s);
  }

  walk(document.body, out);
  const W = +document.body.dataset.w, H = +document.body.dataset.h;
  const bg = fill(getComputedStyle(document.body).backgroundColor) || 'fill="none"';
  const title = document.getElementById("title")?.textContent || "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">` +
    `<title>${esc(title)}</title><defs>${defs.join("")}</defs><rect width="${W}" height="${H}" ${bg}/>` +
    `${out.join("")}${late.join("")}</svg>\n`;
}
