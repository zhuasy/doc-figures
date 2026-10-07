# sequence

Who calls whom, in what order. Use it when **timing or order** is the point: a webhook that arrives
later, a retry, which side waits. Use `flow` instead when the reader needs the parts and their
connections, not the order of calls.

```json
{
  "template": "sequence",
  "title": "How a parse result comes back to the engine",
  "subtitle": "Illustrative. The orange step is the one this PR changes.",
  "actors": [
    {"id": "engine", "label": "Engine", "icon": "cpu", "color": "teal", "does": "Runs each step"},
    {"id": "ocr", "label": "OCR service", "icon": "file-scan", "color": "amber", "external": true}
  ],
  "messages": [
    {"from": "engine", "to": "ocr", "label": "submit document"},
    {"gap": "38 s later"},
    {"from": "ocr", "to": "engine", "label": "webhook: done", "later": true},
    {"note": "The engine is free while it waits.", "over": ["engine"]},
    {"from": "engine", "to": "engine", "label": "save result", "changed": true}
  ]
}
```

Full example: `examples/sequence.json`.

## Fields

| Field | On | Meaning |
| --- | --- | --- |
| `actors` | figure | Columns, left to right. Same fields as a flow node: `id`, `label`, `icon`, `color`, `does`, `external`. |
| `numbered` | figure | `false` drops the step numbers. Default `true`. |
| `from`, `to`, `label` | message | One call. `from` equal to `to` draws a self-loop. |
| `later` | message | Dashed amber: a reply or callback that arrives later. |
| `changed` | message | Orange, thicker, on a highlighted row: the call this change adds or alters. |
| `faded` | message | Dimmed: context the reader can skip. |
| `step` | message | Overrides the number, for example to share one number or skip one (`null`). |
| `gap` | row | A break in time, such as `"38 s later"`. Lifelines pause around it. |
| `note`, `over` | row | A callout spanning the listed actor ids; all actors when `over` is missing. |

## Gotchas

- Order the actors so the first calls run left to right. Long arrows that cross several lifelines are
  fine, but keep them to one or two.
- Five actors fit at about 168px per column. Above seven, the renderer warns; split the figure.
- Keep labels to a few words. Long labels wrap and make tall rows.
- Use one `changed` row per figure, so the reader's eye has one place to land.
- A legend appears only when it explains something: `later` arrows, a `changed` row or an `external` actor.
