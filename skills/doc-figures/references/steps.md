# steps: a worked mechanism

Use it to show HOW something works on a tiny concrete example: three to six panels, each with the state (real
numbers, bars, chips or a small grid), the one operation that leads to the next panel, and why it happens. Then
say the general rule, where it stops working, and the common wrong idea. This is the explainer's main figure:
readers who only see a mechanism's name cannot apply it; readers who watch it run on numbers can.

| Field | On | Meaning |
| --- | --- | --- |
| `steps` | figure | 2 to 6 panels: `{title, state: [blocks], op?, why?, hl?}` |
| `title` | step | What this state is ("High cell gets +15") |
| `op` | step | The one operation that turns this panel into the next, shown as "→ op" |
| `why` | step | One line on why the operation does what it does. Required when there is an `op` |
| `hl` | step | Orange outline: the panel where the answer appears |
| `rule` | figure | "In general": the rule the example shows, in words a reader can apply to a new case |
| `limit` | figure | "Stops working when": a real condition that breaks the mechanism. Leave it out if there is none |
| `myth` | figure | "Not this": the common wrong idea, and why the example rules it out |
| `connect` | figure | `false` for side-by-side cases that are not a sequence (three plants, two merge orders): no arrows and no step numbers |
| `columns`, `note` | figure | Panels per row (auto: up to 3); a muted line below |

| Block | Fields | Use for |
| --- | --- | --- |
| `text` | `text` | One short sentence |
| `kv` | `items: [[name, value]]` | A few named quantities ("Stock today", "$100") |
| `chips` | `label?`, `items` | Countable things; item `{text, hl\|ok\|fail\|muted\|out}` or a plain string. `out` crosses the item out: a candidate removed, a step skipped |
| `bars` | `items: [{label, value, show?, hl?}]`, `unit?`, `max?`, `lines?: [{value, label}]`, `height?` | Amounts you compare at a glance. `lines` draws reference levels (full, half full, the old value); the first is orange, the rest grey. `unit` follows every value |
| `grid` | `rows: [[cell]]`, `cols?`, `rowLabels?` | A small table or board, such as ballots; cell `{text, hl\|ok\|fail\|muted\|out}` |

`examples/steps.json`: a two-outcome option hedge, and the same push on a low and a high cell.

## Tips

- Panels are states, not events. Count only what the source counts: four panels for three trips is still
  "three trips" in every title and caption.
- Use the source's own numbers. Keep them small enough to check in your head.
- Each panel changes ONE thing. If two things change, split the panel.
- Show every state; do not make the reader compute it. If the next count drops one option, show the list with
  that option `out` before the count. Write the result of each sum ("= 21", not "more than 19").
- Draw the level each bar is judged against with `lines`: both ends of a band (the low AND the high limit),
  the old value, the 1× case. A bar alone has no size.
- If most panels are only `text`, the template warns: words in boxes are a slide, not a figure.
- Do not start a title with its number ("1. Mix"): the badge already numbers it.
- Keep the same layout in every panel (the same bars in the same order) so the eye sees only what moved.
- `rule` turns the example into something the reader can reuse; write it so it would answer a question about a
  case the figure does not show. `limit` is what lets them say when it does NOT apply.
