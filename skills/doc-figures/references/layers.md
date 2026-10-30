# layers: a layered architecture

Use for an org or system drawn as stacked layers (interfaces, products, platforms, core), where each layer
works with the next in both directions. Mark one box with `us: true` to ring it in orange without making it
the center: every box keeps its own color.

```json
{
  "template": "layers",
  "title": "Each layer works in both directions with the next",
  "layers": [
    {"label": "Products", "boxes": [
      {"label": "Document assistants", "icon": "file-text", "color": "teal", "items": ["Invoices", "Claims"]}
    ], "down": "run saved assistants", "up": "outputs, traces"},
    {"label": "Platforms", "boxes": [
      {"label": "Agent platform", "icon": "bot", "color": "orange", "us": true, "tag": "Our team", "right": "run a workflow"},
      {"label": "Workflow platform", "icon": "workflow", "color": "sky", "left": "agent step"}
    ]}
  ]
}
```

| Field | On | Meaning |
| --- | --- | --- |
| `label`, `boxes` | layer | Heading of the band and its boxes, left to right |
| `down`, `up` | layer | Labels of the two arrows to the next layer down; either may be left out |
| `label`, `icon`, `color`, `does`, `items` | box | Name, icon, top-bar color, one line, small chips |
| `us`, `tag` | box | Orange ring around the box; pill text in the header |
| `right`, `left` | box | Arrow to the next box in the row, or from it back to this one |
| `span` | box | Relative width (default 1) |

Keep two or three boxes per layer and four or five layers.
