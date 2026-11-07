# freeform: the escape hatch

Use only when no curated template fits the takeaway. You write the layout as HTML; the renderer keeps the house
look (tokens, fonts, both themes, PNG sizes) and still runs the checks for overlap, clipping, canvas edges and small
text. Do not use it to restyle a figure a curated template can draw.

| Field | Type | Meaning |
| --- | --- | --- |
| `html` | string | The figure body. Lay it out with flex or grid; never with absolute coordinates. |
| `css` | string | Optional extra CSS. Use the tokens below, never raw hex colors. |
| `wires` | list | Arrows between elements: `{"from": "#a", "to": "#b", "label": "...", "changed": true, "later": true}`. Straight or one-bend, chosen from where the two boxes sit. |
| `legend` | list | Items for `DF.legend`: `{"line": "plain"}`, `{"line": "later", "dashed": true}`, `{"box": "external"}`, `{"swatch": "orange"}`, each with `text`. |
| `note` | string | Footer line. |

**Classes ready to use:** `row`, `col`, `grow` (layout); `box`, `box alt`, `box external`, `box changed`;
`node` with `ic`, `tx`, `b`, `does` (the flow card, static here); `tag`, `tag new`, `tag plain`; `muted`;
`heading`. `{{icon:shield}}` inserts an icon from `render/icons/`.

**Tokens:** `--ink`, `--body`, `--muted`, `--faint`, `--surface`, `--surface-alt`, `--edge`, `--line`,
`--hilite`, `--hilite-edge`, `--hilite-glow`, `--ok`, `--ok-edge`, `--fail`, `--fail-edge`, `--amber`, `--amber-fill`.

Every `.box` and `.node` is checked for overlap and named like a part (its `<b>` text); every wire needs a label;
more than 8 boxes warns. Add class `chk-me` to check another element for overlap. Leave room between columns
for wire labels (`gap` of 150 px or more).

```json
{
  "template": "freeform",
  "title": "Two callers, one credential store",
  "html": "<div class='row' style='gap:170px'><div class='col grow'><div id='hosted' class='box'>{{icon:bot}}<b>Hosted agent</b><div class='muted'>signs each call</div></div><div id='laptop' class='box external'>{{icon:terminal}}<b>Laptop agent</b><div class='muted'>signs in once</div></div></div><div class='col grow'><div id='proxy' class='box changed'>{{icon:shield}}<b>Credential proxy</b><div class='muted'>adds the vendor token</div></div></div></div>",
  "wires": [{"from": "#hosted", "to": "#proxy", "label": "sends a tool call"}, {"from": "#laptop", "to": "#proxy", "label": "same URL"}]
}
```

Full example: `examples/freeform.json`.

## When to promote

If you draw the same freeform shape a second time, make it a curated template: move the layout into
`render/templates/<name>.js`, give it a reference and an example, and add a row to the table in `SKILL.md`.
