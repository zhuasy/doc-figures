# card: the fields of a record

Use it to show what one record holds, or how a few records refer to each other: a database row or table, an API payload, a span, a config object. Tag the fields a change adds, edits or drops. For how data *moves* between systems, use `flow` instead.

## Spec

| Key | Type | Meaning |
| --- | --- | --- |
| `cards` | list | Records, laid out side by side in order; they wrap to new rows when they don't fit |
| `cards[].id`, `title`, `subtitle` | text | `id` is used by `links`; `title` defaults to `id`; `subtitle` is one muted line |
| `cards[].icon`, `color` | text | Icon name from `render/icons/` and a palette color (`slate`, `blue`, `teal`, ...) |
| `cards[].fields[]` | list | `{name, value?, note?, tag?}`; `tag` is `new`, `changed` or `removed` |
| `links` | list | `{from: "cardId.field", to: "cardId.field", label?, changed?}` arrows, e.g. foreign keys |
| `cardWidth`, `note` | number, text | Override the computed card width; a muted line under the figure |

Field names render in mono; values in the body font; a note sits under the row in muted text.
`new` rows get a green bar and tag, `changed` an orange bar and tag, `removed` is struck through in red.

## Example

```json
{
  "template": "card",
  "title": "Each run item points at its run",
  "subtitle": "Illustrative subset of columns.",
  "cards": [
    {"id": "runs", "title": "runs", "icon": "database", "fields": [
      {"name": "id", "value": "uuid", "note": "Primary key"},
      {"name": "status", "value": "text", "tag": "new"}
    ]},
    {"id": "items", "title": "run_items", "icon": "table", "color": "blue", "fields": [
      {"name": "run_id", "value": "uuid"}
    ]}
  ],
  "links": [{"from": "items.run_id", "to": "runs.id", "label": "foreign key"}]
}
```

`examples/card.json` has a span record and a two-table example.

## Gotchas

- Show only the fields the reader needs; five to eight per card reads well. Say "subset" in the subtitle.
- One card is 560px wide and centered; two or three share the row. Below 260px per card they wrap.
- Links go from the side of one row to the side of the other; the dot marks the source, the arrow the target.
- Links between cards stacked in the same column run in the outer margin. Keep their labels to a word or two, or the label leaves the canvas.
- Wide label text widens the gap between cards for every card in the row; keep link labels short.
- Values are plain text. Put types (`uuid`, `text`) or example values there, not prose; prose goes in `note`.
