# onion: layers inside layers

Use when the point is depth: what wraps what, and what each wrapper adds. Good for a call that passes through
proxies, sandboxes and adapters, for "where does the secret live", and for comparing how deep two designs nest.

Each layer is a box drawn inside the one before it. The first layer is the outermost; the last is the core.
Numbers count inward. Put two or three onions side by side with `onions` to compare designs.

| Field | Type | Meaning |
| --- | --- | --- |
| `layers` | list | One onion, outermost first. Use this or `onions`. |
| `onions` | list | Several onions side by side: `{label, sublabel, entry, layers, verdict, verdictKey}`. Two fit well; three need short text. |
| `entry` | string | One line above the onion: what enters it ("Agent calls drive.search"). Per column or top-level. |
| `layers[].title`, `does` | string | Short name, and what this layer adds in plain words. |
| `layers[].icon`, `color` | string | Icon from `render/icons/` and palette color. |
| `layers[].chips` | list | Small labels under the text. `{"text": "Google token", "secret": true}` marks where a secret is readable (orange, key icon); `{"text": "...", "ok": true}` is green; a plain string is neutral. |
| `layers[].changed`, `tag`, `external`, `faded` | bool, string, bool, bool | Same meanings as in `flow`: orange "look here", a tag, amber dashed for another company's system, faded context. |
| `verdict`, `verdictKey` | string | One line under a column (or under a single onion, top-level), such as `"verdictKey": "Depth:", "verdict": "5 layers, 2 run our code"`. |
| `numbered` | bool | Default true. |
| `note` | string | Footer line. |

```json
{
  "template": "onion",
  "title": "One tool call, from agent to API",
  "entry": "Agent calls drive.search_files",
  "layers": [
    {"title": "Agent harness", "does": "Sends an MCP tools/call", "icon": "bot", "color": "blue"},
    {"title": "Credential proxy", "does": "Checks the caller, adds the token", "icon": "shield", "chips": [{"text": "Google token", "secret": true}]},
    {"title": "Google Drive API", "does": "Searches the files", "icon": "cloud", "external": true}
  ]
}
```

Full example: `examples/onion.json`.

## Gotchas

- More than about six layers per onion gets narrow: the innermost box loses about 30 px of width per layer.
- Keep `does` to one short clause. Side by side, the core box is under 300 px wide.
- An onion shows nesting, not order in time. For who calls whom and what comes back, use `sequence`.
