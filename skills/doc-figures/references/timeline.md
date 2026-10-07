# timeline

A waterfall of where time went: one bar per span on a shared time axis, nested by indentation.
Use it for request traces, retries, queue waits, and breaking one duration into parts.
For "who calls whom, in what order" with no durations, use `sequence` instead.

```json
{
  "template": "timeline",
  "title": "One document's trip through a run",
  "subtitle": "Illustrative. The first try failed and the second succeeded.",
  "unit": "s",
  "axisLabel": "seconds since the row was admitted",
  "rows": [
    {"label": "Row · invoice.pdf", "start": 0, "end": 151, "color": "slate"},
    {"label": "Extract, try 1", "start": 2.6, "end": 42.8, "depth": 1, "failed": true, "note": "timed out"},
    {"label": "waiting to retry", "start": 42.8, "end": 60.8, "depth": 1, "wait": true},
    {"label": "Extract, try 2", "start": 60.8, "end": 134.6, "depth": 1, "focus": true}
  ]
}
```

Full examples: `examples/timeline.json` (a trip with a retry, and a two-panel zoom with stacked parts).

## Fields

| Field | On | Meaning | Default |
| --- | --- | --- | --- |
| `unit` | spec, panel | `ms`, `s` or `min`; durations switch unit when that reads better | `s` |
| `axisLabel` | spec, panel | Words under the axis, such as "seconds since the job started" | the unit spelled out |
| `panels` | spec | `[{title, subtitle, unit, axisLabel, rows}]` stacked top to bottom, each with its own axis | one panel from `rows` |
| `focus` | spec | Index of the row to outline when there are no panels | none |
| `label`, `start`, `end` | row | Name and span, in the panel's unit | required |
| `depth` | row | Indent level; 0 is bold. A row must fit inside the nearest shallower row above it | 0 |
| `color` | row, part | `blue teal violet slate sky amber stone green red pink orange` | `blue` |
| `wait` | row, part | `true` for a grey hatched wait of ours, `"external"` for an amber wait on another company | none |
| `failed` | row | Red outline and red text | false |
| `focus` | row | Orange outline; every other row in the panel fades | false |
| `note` | row | Muted text after the duration | none |
| `duration` | row | `false` hides the duration text | shown |
| `parts` | row | `[{start, end, color, wait, label}]` stacked in one bar; labeled parts go in the legend | none |
| `legend`, `note` | spec | `legend: false` hides the legend; `note` adds a line under the figure | shown |

## Gotchas

- The renderer warns when a child falls outside its parent, when parts don't add up to their bar,
  and when a start comes after its end. Fix the data; don't silence the warning.
- Spans under 3px are drawn 3px wide and the figure says so. For a span that matters,
  zoom in with a second panel instead.
- Bars share one left edge across panels, and long notes shrink the plot for every panel.
  Keep notes to a few words.
- Use one color per concept across the doc (for example attempt = blue, job = teal).
  Status belongs on `failed`, not on the color.
