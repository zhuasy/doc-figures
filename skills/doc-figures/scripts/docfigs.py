"""Shared style for explanatory doc figures. Import it, draw, save PNGs.

Every helper takes plain data, so all figures in one doc can read from one example and stay consistent.
Render with: uv run --with matplotlib python your_figs.py
"""

import sys
import textwrap

import matplotlib

matplotlib.use("Agg")
import matplotlib.font_manager as fm
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Patch, Polygon, Rectangle

_names = {f.name for f in fm.fontManager.ttflist}
SANS = next(
    (n for n in ("Helvetica Neue", "Helvetica", "Inter", "Arial") if n in _names), "DejaVu Sans"
)
MONO = next(
    (n for n in ("Menlo", "SF Mono", "JetBrains Mono", "Consolas") if n in _names),
    "DejaVu Sans Mono",
)
WIDTH = 13  # inches; every figure in a doc uses the same width so text renders at the same size
DPI = 200

# Theme: dark by default (DOCFIGS_THEME=light for paper-white pages). Every helper reads these names,
# so a script that uses BG / SURFACE instead of literal "white" renders correctly in both.
import os

THEME = os.environ.get("DOCFIGS_THEME", "dark").lower()
DARK = THEME == "dark"

# Notion's dark mode, text color then background color per accent: Notion's earlier accent set, which is
# brighter than today's and reads better as bar fills. Orange, Yellow and Green are from notionavenue.co.
NOTION = {
    "gray": ("#9B9B9B", "#252525"),
    "brown": ("#A27763", "#2E2724"),
    "orange": ("#FFA344", "#594A3A"),
    "yellow": ("#FFDC49", "#59563B"),
    "green": ("#4DAB9A", "#354C4B"),
    "blue": ("#529CCA", "#364954"),
    "purple": ("#9A6DD7", "#443F57"),
    "pink": ("#E255A1", "#533B4C"),
    "red": ("#FF7369", "#594141"),
}

# Page and surfaces: Notion's background, sidebar and hover/menu greys
BG = "#191919" if DARK else "#ffffff"  # figure background
SURFACE = "#202020" if DARK else "#ffffff"  # cards and boxes
SURFACE_ALT = "#252525" if DARK else "#f9fafb"  # frames and lane backgrounds
# Text and chrome
INK, BODY, MUTED, FAINT, GRID, EDGE = (
    ("#ECECEC", "#D0D0D0", "#BDBDBD", "#8A8A8A", "#2A2A2A", "#3A3A3A")
    if DARK
    else ("#111827", "#374151", "#6b7280", "#9ca3af", "#eef0f3", "#d1d5db")
)
# Categorical fills: give each concept one color and keep it in every figure.
# Dark accents are 300-level tones, lighter and less saturated than Notion's own tag colors, so lines and
# small labels clear APCA Lc 60 on the card grey (Notion's #529CCA blue measures Lc 43, its purple Lc 34).
SLATE, BLUE, TEAL, VIOLET, SKY, STONE = (
    ("#B0BEC5", "#93C5FD", "#80CBC4", "#C4B5FD", "#81D4FA", "#BCAAA4")
    if DARK
    else ("#334155", "#3b82f6", "#0d9488", "#8b5cf6", "#0ea5e9", "#94a3b8")
)
AMBER = "#FFD54F" if DARK else "#f59e0b"  # another company's system, such as a payment or OCR vendor
# One highlight color means "look here"
HILITE, HILITE_FILL, HILITE_EDGE, HILITE_TEXT = (
    ("#FDBA74", "#3F3226", "#F59E0B", "#FDBA74")
    if DARK
    else ("#f97316", "#fff7ed", "#fdba74", "#c2410c")
)
# Status
FAIL, OK, OK_FILL, OK_EDGE = (
    ("#FCA5A5", "#86EFAC", "#1F3A2A", "#4ADE80") if DARK else ("#dc2626", "#047857", "#d1fae5", "#6ee7b7")
)
# Hatched fills mean waiting, not work
WAIT = dict(color="#2A2A2A" if DARK else "#f3f4f6", edge=FAINT, hatch="///")
WAIT_EXTERNAL = dict(color="#3D3720" if DARK else "#fef3c7", edge=AMBER, hatch="///")
SOFT_AMBER = "#5A4F1E" if DARK else "#fde68a"

plt.rcParams.update(
    {
        "font.family": SANS,
        "font.size": 11,
        "figure.facecolor": BG,
        "axes.facecolor": BG,
        "savefig.facecolor": BG,
        "text.color": INK,
        "axes.labelcolor": MUTED,
        "xtick.color": MUTED,
        "ytick.color": MUTED,
        "axes.edgecolor": EDGE,
    }
)


def tint(color, amount=0.22):
    """A fill for `color` that sits on this theme's background: the color blended toward BG.
    Use it for card fills keyed to a concept color (tint(BLUE) behind a blue title)."""
    import matplotlib.colors as mc

    c, b = mc.to_rgb(color), mc.to_rgb(BG)
    return mc.to_hex(tuple(b[i] + (c[i] - b[i]) * amount for i in range(3)))


def figure(height, title, subtitle=""):
    """A blank figure with the standard title block. Offsets are in inches so they hold at any height."""
    fig = plt.figure(figsize=(WIDTH, height), dpi=DPI)
    fig.text(0.015, 1 - 0.3 / height, title, fontsize=16, fontweight="bold", color=INK, va="top")
    if subtitle:
        fig.text(0.015, 1 - 0.62 / height, subtitle, fontsize=11, color=MUTED, va="top")
    return fig


def canvas(fig, rect=(0, 0, 1, 1)):
    """An axes with 0..1 coordinates and no chrome, for cards, boxes and arrows."""
    ax = fig.add_axes(rect)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    return ax


def save(fig, path):
    fig.savefig(path, facecolor=BG)
    plt.close(fig)
    print(f"wrote {path}", file=sys.stderr)


def comparison(title, before, after, subtitle=""):
    """Two readable panels; wrap every item and grow the canvas to retain all text."""
    columns = [
        [textwrap.fill(str(item), width=38) for item in items]
        for items in (before, after)
    ]
    line_height, item_gap = 0.24, 0.16
    body_height = max(
        (sum(len(item.splitlines()) * line_height + item_gap for item in items)
         for items in columns),
        default=0,
    )
    panel_top = 1.05
    height = panel_top + 0.65 + max(body_height, 0.5) + 0.3
    fig = figure(height, title, subtitle)
    fig.set_size_inches(9, height)
    ax = canvas(fig)
    for x, label, items, edge, heading in (
        (0.035, "Before", columns[0], EDGE, MUTED),
        (0.535, "After", columns[1], HILITE_EDGE, HILITE_TEXT),
    ):
        top = 1 - panel_top / height
        bottom = 0.25 / height
        rbox(ax, x, bottom, 0.43, top - bottom, SURFACE, edge, pad=0.003)
        fig.text(x + 0.02, top - 0.18 / height, label,
                 fontsize=12, fontweight="bold", color=heading, va="top")
        offset = panel_top + 0.55
        for item in items:
            for line in item.splitlines():
                fig.text(x + 0.02, 1 - offset / height, line,
                         fontsize=12, color=BODY, va="top")
                offset += line_height
            offset += item_gap
    return fig


def legend(fig, entries, y=0.012, x=0.5, ncol=5):
    """entries: list of (label, style); style is a color string or a dict like WAIT."""
    handles = []
    for text, style in entries:
        st = style if isinstance(style, dict) else dict(color=style)
        handles.append(
            Patch(
                facecolor=st["color"],
                edgecolor=st.get("edge", st["color"]),
                hatch=st.get("hatch"),
                lw=st.get("lw", 1),
                label=text,
            )
        )
    fig.legend(
        handles=handles,
        loc="lower center",
        bbox_to_anchor=(x, y),
        ncol=min(len(handles), ncol),
        frameon=False,
        fontsize=10.5,
        handlelength=1.6,
        columnspacing=1.6,
    )


def rbox(target, x, y, w, h, fc, ec, pad=0.006, r=0.012, lw=1.2, z=1):
    """Rounded box. target is a figure (figure coords) or an axes (data coords).
    pad grows the box on every side, so use a small pad when it must hug text."""
    patch = FancyBboxPatch(
        (x, y), w, h, boxstyle=f"round,pad={pad},rounding_size={r}", fc=fc, ec=ec, lw=lw, zorder=z
    )
    if hasattr(target, "transFigure") and not hasattr(target, "transData"):
        patch.set_transform(target.transFigure)
        target.add_artist(patch)
    else:
        target.add_patch(patch)


def lines(fig, x, y, items, step=0.05, key_width=0.12):
    """Stacked text in figure coords. items: (kind, text[, value]) with kind in
    head | text | strong | muted | mono | kv | gap."""
    for j, item in enumerate(items):
        kind, text = item[0], item[1]
        yy = y - j * step
        if kind == "head":
            fig.text(x, yy, text.upper(), fontsize=10, fontweight="bold", color=MUTED)
        elif kind == "kv":
            fig.text(x, yy, text, fontsize=10.5, family=MONO, color=BODY)
            fig.text(
                x + key_width, yy, item[2], fontsize=10.5, family=MONO, color=INK, fontweight="bold"
            )
        elif kind == "mono":
            fig.text(x, yy, text, fontsize=11, family=MONO, color=HILITE_TEXT)
        elif kind != "gap":
            fig.text(
                x,
                yy,
                text,
                fontsize=11,
                color={"strong": INK, "muted": MUTED}.get(kind, BODY),
                fontweight="bold" if kind == "strong" else "normal",
            )


def _style_axes(ax, xmax, xlabel, ticks):
    ax.set_yticks([])
    ax.set_xlim(0, xmax)
    ax.xaxis.grid(True, color=GRID)
    ax.set_axisbelow(True)
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(EDGE)
    if ticks is not None:
        ax.set_xticks(ticks)
    ax.set_xlabel(xlabel, color=MUTED, fontsize=9.5, labelpad=2)


def timeline(
    ax, rows, xmax, xlabel="", ticks=None, label_x=None, focus=None, tree=False, min_w=None
):
    """A waterfall: one row per item, drawn top to bottom.

    Each row is a dict:
      label, span=(start, end), color or style dict, level (indent, 0 = bold top level)
      parts=[(start, end, color-or-style), ...]   stacked segments instead of one bar
      note, note_color                            text to the right of the bar
      parent                                      index of the parent row, for tree=True
      failed=True                                 red outline
      hilite=True                                 orange outline
    focus=i fades every other row. Labels are drawn as text, left aligned, so indentation shows.
    label_x defaults to just inside the figure's left edge; give the axes a left margin of about 0.2.
    """
    n = len(rows)
    if label_x is None:
        pos = ax.get_position()
        label_x = -(pos.x0 - 0.02) / pos.width
    min_w = min_w if min_w is not None else xmax * 0.005
    for i, r in enumerate(rows):
        y = n - 1 - i
        alpha = 0.16 if focus is not None and i != focus else 1.0
        base = r.get("style") or dict(color=r.get("color", BLUE))
        for s, e, st in r.get("parts") or [(r["span"][0], r["span"][1], base)]:
            st = st if isinstance(st, dict) else dict(color=st)
            ax.barh(
                y,
                max(e - s, r.get("min_w", min_w)),
                left=s,
                height=0.6,
                color=st["color"],
                alpha=alpha,
                hatch=st.get("hatch"),
                edgecolor=st.get("edge", st["color"]),
                linewidth=1.2 if st.get("hatch") else 0,
                zorder=3,
            )
        s, e = r["span"]
        if r.get("failed"):
            ax.barh(
                y, e - s, left=s, height=0.6, fill=False, edgecolor=FAIL, linewidth=2.2, zorder=4
            )
        if r.get("hilite") or focus == i:
            ax.add_patch(
                Rectangle(
                    (s - xmax * 0.005, y - 0.45),
                    max(e - s, min_w) + xmax * 0.01,
                    0.9,
                    fill=False,
                    ec=HILITE,
                    lw=2.2,
                    zorder=4,
                )
            )
        if tree and r.get("parent") is not None:
            p = rows[r["parent"]]
            px = p["span"][0] + xmax * 0.003
            py = n - 1 - r["parent"]
            ax.plot([px, px, s], [py - 0.3, y, y], color=FAINT, lw=1.1, zorder=2)
        if r.get("note"):
            ax.text(
                e + xmax * 0.012,
                y,
                r["note"],
                va="center",
                fontsize=10,
                color=r.get("note_color", MUTED),
                alpha=max(alpha, 0.35),
            )
        level = r.get("level", 0)
        ax.text(
            label_x + level * 0.025,
            y,
            r["label"],
            transform=ax.get_yaxis_transform(),
            ha="left",
            va="center",
            fontsize=11 if level == 0 else 10.5,
            fontweight="bold" if r.get("bold", level == 0) else "normal",
            color=INK if level <= 1 else BODY,
            alpha=max(alpha, 0.35),
        )
    ax.set_ylim(-0.8, n - 0.2)
    _style_axes(ax, xmax, xlabel, ticks)


def outline_all(ax, rows, xmax):
    """Orange frame around every bar: 'this whole thing'."""
    end = max(r["span"][1] for r in rows)
    ax.add_patch(
        Rectangle(
            (-xmax * 0.007, -0.55),
            end + xmax * 0.014,
            len(rows) - 0.05,
            fill=False,
            ec=HILITE,
            lw=2.2,
            zorder=4,
        )
    )


def zoom_funnel(fig, top, bottom, x0, x1, row_index, n_rows):
    """Dotted guides under a highlighted bar in `top` and a soft funnel down to `bottom`. Draw after layout."""
    fig.canvas.draw()
    to_fig = fig.transFigure.inverted()
    y_bar = n_rows - 1 - row_index
    y_lo = top.get_ylim()[0]
    for x in (x0, x1):
        top.plot(
            [x, x],
            [y_bar - 0.43, y_lo],
            color=HILITE,
            lw=1,
            alpha=0.5,
            linestyle=(0, (2, 2)),
            zorder=1,
        )
    pts = [
        to_fig.transform(top.transData.transform((x0, y_lo))),
        to_fig.transform(top.transData.transform((x1, y_lo))),
        to_fig.transform(bottom.transAxes.transform((1, 1))),
        to_fig.transform(bottom.transAxes.transform((0, 1))),
    ]
    fig.add_artist(
        Polygon(
            pts,
            closed=True,
            transform=fig.transFigure,
            facecolor=HILITE,
            alpha=0.07,
            edgecolor="none",
            zorder=0,
        )
    )


def panel_heading(ax, title, subtitle=""):
    """A numbered heading above a sub-panel, placed in points so it never collides with the panel."""
    ax.annotate(
        title,
        xy=(-0.315, 1),
        xycoords="axes fraction",
        xytext=(0, 34),
        textcoords="offset points",
        fontsize=12.5,
        fontweight="bold",
        color=INK,
        va="bottom",
        zorder=5,
    )
    if subtitle:
        ax.annotate(
            subtitle,
            xy=(-0.315, 1),
            xycoords="axes fraction",
            xytext=(0, 16),
            textcoords="offset points",
            fontsize=10,
            color=MUTED,
            va="bottom",
            zorder=5,
        )


def arrow(ax, x0, y0, x1, y1, color=MUTED, rad=0.0, lw=1.5):
    ax.annotate(
        "",
        xy=(x1, y1),
        xytext=(x0, y0),
        arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, connectionstyle=f"arc3,rad={rad}"),
    )


def highlight_substring(fig, ax, x, y, before, highlighted, size=14):
    """Monospace text with its tail highlighted. Measures real text extents, never counts characters."""
    t1 = ax.text(x, y, before, fontsize=size, family=MONO, color=MUTED)
    fig.canvas.draw()
    sx = t1.get_window_extent().transformed(ax.transData.inverted()).x1
    t2 = ax.text(sx, y, highlighted, fontsize=size, family=MONO, color=HILITE_TEXT, zorder=3)
    fig.canvas.draw()
    bb = t2.get_window_extent().transformed(ax.transData.inverted())
    rbox(
        ax,
        bb.x0,
        bb.y0 - 0.006,
        bb.x1 - bb.x0,
        bb.y1 - bb.y0 + 0.012,
        HILITE_FILL,
        HILITE_EDGE,
        pad=0.004,
        r=0.008,
    )
    return bb


def pill(ax, x, y, text, color, dot=True):
    """A filled rounded label, optionally with a dot on a swimlane at x."""
    ax.text(
        x + (0.012 if dot else 0),
        y,
        text,
        ha="left",
        va="center",
        fontsize=10,
        color=BG if DARK else "white",
        fontweight="bold",
        zorder=4,
        bbox=dict(boxstyle="round,pad=0.35,rounding_size=0.8", fc=color, ec="none"),
    )
    if dot:
        ax.plot([x], [y], marker="o", ms=7, color=color, zorder=4)


def swimlanes(ax, lanes, top=0.935, bottom=0.02):
    """lanes: {key: (x, title)} on a canvas axes. Draws headers and dashed lifelines; returns lanes."""
    for x, name in lanes.values():
        rbox(ax, x - 0.075, top, 0.15, 0.055, SURFACE_ALT, EDGE, pad=0.004, r=0.01)
        ax.text(
            x,
            top + 0.027,
            name,
            ha="center",
            va="center",
            fontsize=11.5,
            fontweight="bold",
            color=INK,
        )
        ax.plot([x, x], [bottom, top - 0.005], color=EDGE, lw=1.2, linestyle=(0, (4, 4)), zorder=0)
    return lanes


def message(ax, lanes, src, dst, y, text):
    xa, xb = lanes[src][0], lanes[dst][0]
    ax.annotate(
        "",
        xy=(xb, y),
        xytext=(xa, y),
        arrowprops=dict(arrowstyle="-|>", color=BODY, lw=1.4, shrinkA=4, shrinkB=4),
        zorder=2,
    )
    ax.text(
        (xa + xb) / 2,
        y + 0.012,
        text,
        ha="center",
        va="bottom",
        fontsize=10.5,
        color=BODY,
        bbox=dict(boxstyle="round,pad=0.15", fc=BG, ec="none"),
        zorder=3,
    )
