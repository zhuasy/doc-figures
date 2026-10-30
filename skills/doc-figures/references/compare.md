# compare: before and after

Use it when a change is easiest to see side by side: what got sent, which box was added, which arrow moved.
Panels sit side by side when they fit at about 405px each, and stack with a down arrow otherwise. The After
panel gets the orange "look here" outline.

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `before`, `after` | Panel | | `{title?, caption?, accent?, blocks: [...]}` |
| `layout` | `auto`, `side`, `stacked` | `auto` | `auto` stacks only when a flow block won't fit a side panel |
| `chipKey` | object or `false` | auto | Words for chip states in the key, e.g. `{"skipped": "already there"}` |
| `legend`, `note` | `false`, string | | As in `flow` |

Panel `title` defaults to "Before" and "After". `accent: false` drops the orange outline from After.

| Block | Fields | Use for |
| --- | --- | --- |
| `flow` | `nodes`, `edges`, `direction?`, `nodeWidth?`, `numbered?` | A mini flow; same node and edge fields as `flow` |
| `rows` | `items: [{text, icon?, status?}]` | Outcomes; `status`: ok, fail, changed, new, removed, muted |
| `chips` | `label?`, `items: [{text, state?}]` | Countable things such as parts or pages; `state`: sent (default), done, skipped, fail, new, muted. A plain string is a chip with the default state |
| `text` | `text` | One short sentence |

```json
{
  "template": "compare",
  "title": "Retries send only the parts that are missing",
  "subtitle": "Illustrative: a 5-part upload drops after part 3, then retries.",
  "before": {"caption": "The retry sends every part again.", "blocks": [
    {"type": "chips", "label": "Sent on retry", "items": ["1", "2", "3", "4", "5"]},
    {"type": "rows", "items": [{"text": "3 parts sent twice", "status": "fail"}]}
  ]},
  "after": {"caption": "The API sends only what storage lacks.", "blocks": [
    {"type": "chips", "label": "Sent on retry", "items": [
      {"text": "1", "state": "skipped"}, {"text": "2", "state": "skipped"}, {"text": "3", "state": "skipped"},
      {"text": "4"}, {"text": "5"}]},
    {"type": "rows", "items": [{"text": "Nothing sent twice", "status": "ok"}]}
  ]}
}
```

`examples/compare.json` has three: chips, a side-by-side flow that adds a box, and a stacked flow with a webhook.

## Gotchas

- Use the same nodes, ids and wording in both panels; change only what changed, and mark it with `tag: "new"` or
  `changed: true` on the node or edge.
- Side panels have about 360px inside, so mini flows go top to bottom. Straight chains fit; branches and loops
  push `auto` to stacked. A loop reads best stacked with `nodeWidth: 160` so it runs left to right.
- Keep edge labels to two or three words. In left-to-right flows labels wrap at about 118px; put ` ` between
  words that must stay together, such as `5 s`.
- The chip key appears when two or more chip states are used. Rename states with `chipKey` rather than inventing
  new ones.
- Captions are aligned across side panels, so blocks below them line up. Keep both captions to one or two lines.
