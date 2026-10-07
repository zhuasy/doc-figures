# stack: a PR stack

Use for stacked PRs: what each layer adds, why it needs the layer below, and the merge order.

Layers grow upward from the base branch. The left badges give the merge order (a check for merged PRs), the arrow between two layers carries the upper layer's `needs`, and the PR being described gets the orange treatment and a "THIS PR" tag.

| Field | Type | Meaning |
| --- | --- | --- |
| `base` | string | Base branch shown under the stack. Default `main`. |
| `prs` | list | PRs bottom-up: the first sits on the base, the last is the top of the stack. |
| `prs[].number`, `title`, `adds` | number, string, string | PR number (optional: omit it to draw the layer without a number badge, e.g. before the PRs exist), short title, what it adds in plain words. |
| `prs[].status` | `merged`, `open`, `draft` | Merged layers fade and show a check; drafts get a dashed border. |
| `prs[].this` | bool | The PR whose description holds the figure. Its incoming arrow turns orange. |
| `prs[].needs` | string | Finishes the sentence "needs …": why this layer depends on the one below. |
| `note` | string or `false` | Footer line. Default: "Merge bottom-up: #a, then #b …" from the unmerged PRs. |

```json
{
  "template": "stack",
  "title": "Three PRs that add per-document progress",
  "subtitle": "Each layer builds on the one below it.",
  "prs": [
    {"number": 101, "title": "Add the run items table", "adds": "One row per document in a run", "status": "merged"},
    {"number": 102, "title": "Engine writes item progress", "adds": "Records each document's status", "status": "open", "needs": "the table from #101"},
    {"number": 103, "title": "Show progress on the runs page", "adds": "A live bar per document", "status": "open", "this": true, "needs": "the status #102 writes"}
  ]
}
```

Full example: `examples/stack.json`.

## Gotchas

- Order is bottom-up, the same order the PRs merge. Reversing it flips every arrow's meaning.
- Write `needs` as the missing piece ("the table from #101"), not "depends on #101": the number alone tells the reader nothing.
- Keep `adds` to one line. The card grows with long text, but a stack reads best when every layer is one glance.
- Render the same figure for every PR in the stack and move `this: true`, so each description highlights itself.
- More than about six layers gets tall; collapse merged history into the base (`"base": "main + #1790–#1795"`).
