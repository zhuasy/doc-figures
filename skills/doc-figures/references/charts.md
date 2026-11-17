# Charts of measured data (matplotlib)

The HTML templates cover diagrams and timelines. A plot of real measurements, such as latency percentiles over
a week or error counts per service, is a chart: use matplotlib with the shared style in
`scripts/docfigs.py`. If a `dataviz` skill is available, follow its chart-form and color guidance too.

```sh
uv run --with matplotlib python figs.py out/
DOCFIGS_THEME=light uv run --with matplotlib python figs.py out/
```

- Start from `scripts/example_quickstart.py`. Add `scripts/` to `sys.path` and import the named colors
  (`BG`, `BODY`, `TEAL`, `HILITE`, …), `figure`, `save` and `tint` from `docfigs`. Never write literal colors.
- Render every chart in one script and one process, then look at all of them together.
- **Linear axes only. Never use a log scale**: `save` stops with an error on a log axis. A log axis hides how big
  a gap is: $2 and $20 look as near as $0.20 and $2. When one value dwarfs the others, draw the crowded range in a
  second panel (`zoom_funnel`), or cut the outlier from the plot and state its value in a note.
- Keep units, interval boundaries and totals honest. Label invented data "Illustrative".
- Figures are 13 in wide at 200 dpi; for a compact chart `fig.set_size_inches(9, h)` keeps text readable.

## Line and scatter charts

Start from `scripts/example_charts.py`, which draws one of each.

- **Lines over time or over a count:** `ax.plot(...)`, then `chart_axes(ax, xlabel, ylabel, yfmt="{:g} ms")` for
  the house grid and tick labels. Write each series name at the end of its line, not in a legend. Start the y axis
  at 0 unless the subtitle says where it starts.
- **A trade-off between two measures** (cost against quality, latency against accuracy):
  `scatter(ax, points, xlabel, ylabel, xfmt="${:g}")`. Each point is `dict(label, x, y, color)`.
  - It joins the frontier with a dotted line: the points that no other point beats on both axes. Say that in the
    subtitle in plain words; do not write "Pareto" alone.
  - `better=("low", "high")` says which end of x and of y wins. Change it when, for example, low is better on both.
  - `best=(x, y)` shades the corner better than both values. Choose values you can defend, such as a budget and a
    quality bar, and name them in the text.
  - Give one color per group and name the groups with `legend(fig, [(name, color), ...])`.
  - Each label goes in the first free place around its dot. A `WARN no free place for label` line means two labels
    overlap: shorten the labels, grow the figure or drop points.
