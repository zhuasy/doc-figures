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
- Keep units, interval boundaries and totals honest. Label invented data "Illustrative".
- Figures are 13 in wide at 200 dpi; for a compact chart `fig.set_size_inches(9, h)` keeps text readable.
