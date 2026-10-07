# flow: the big picture

Use for how the parts of a system connect and in what order requests move between them. This is the
big-picture figure every PR opens with: mark the part the change touches with `changed: true`.

```json
{
  "template": "flow",
  "title": "Retries resume where the upload stopped",
  "subtitle": "Illustrative. Orange marks what this PR changes.",
  "nodes": [
    {"id": "browser", "label": "Browser", "icon": "monitor", "color": "blue", "does": "Splits the file into 5 parts"},
    {"id": "api", "label": "Upload API", "icon": "server", "color": "violet", "does": "Asks storage which parts it has", "changed": true},
    {"id": "gcs", "label": "Cloud storage", "icon": "cloud", "color": "sky", "does": "Keeps parts from the first try", "external": true}
  ],
  "edges": [
    {"from": "browser", "to": "api", "label": "retry the upload"},
    {"from": "api", "to": "gcs", "label": "list stored parts", "changed": true},
    {"from": "gcs", "to": "api", "label": "parts 1–3", "later": true}
  ]
}
```

| Field | On | Meaning |
| --- | --- | --- |
| `id`, `label`, `does` | node | Key for edges, bold name, one short line on what the box does |
| `icon`, `color` | node | Any file name in `render/icons/`; a palette name (below) |
| `changed`, `tag` | node | Orange outline and CHANGED tag; `tag: "new"` (green) or `"removed"` (red, struck through); any other `tag` text is a plain pill, orange with `changed` (e.g. "new config") |
| `external`, `faded` | node | Dashed amber border for another company's system; dim a box that is context only |
| `children` | node | Makes a group: `{"id", "label", "children": [nodes]}` draws a labeled region around them |
| `from`, `to`, `label` | edge | Arrow between node ids, short label; labels are numbered in list order |
| `later`, `changed` | edge | Dashed amber for a reply that arrives later; orange for the changed path |
| `step` | edge | Override the number, or `null` for no number |
| `direction` | figure | `auto` (default: left to right if it fits, else top down), `right`, `down` |
| `numbered`, `legend`, `note` | figure | `false` turns off step numbers or the legend; `note` adds a muted line below |

Colors: `blue`, `teal`, `violet`, `slate`, `sky`, `amber`, `stone`, `green`, `red`, `pink`, `orange`. Pick one
per kind of thing and keep it across figures; amber is for other companies' systems.

## Tips

- Five to eight boxes read at a glance. Past ten, split into an overview and a zoomed-in second figure.
- Put the verb on the edge ("save the run") and the role in `does` ("Source of truth for runs").
- A group is for a real boundary (our backend, one Kubernetes cluster, the customer's network).
- Left to right fits about three to four boxes; more boxes fall back to top down automatically.
