# tree: one thing splits into branches

Use it for hierarchies (taxonomies, org charts), decision trees ("if this, then that") and frequency trees (of
1,000 people, 10 are sick, 9 of them test positive...). A frequency tree is the clearest way to show
conditional chances: it turns percentages into counts the reader can add.

| Field | On | Meaning |
| --- | --- | --- |
| `root` | figure | The top node; every node is `{id?, label, value?, does?, edge?, hl?, children?}` |
| `value` | node | A count or amount shown before the label ("990 healthy") |
| `edge` | node | Label on the line from its parent ("99%", "if the cache is cold") |
| `hl` | node | Orange outline on the node and its incoming line |
| `sum` | figure | `{label, of: [ids], total?, result?}`: adds the chosen leaves under the tree and states the answer; the leaves are highlighted |
| `direction` | figure | `right` (default, root on the left) or `down` |
| `nodeWidth`, `note` | figure | As in `flow` |

`examples/tree.json`: a base-rate frequency tree with a sum, and a small decision tree.

## Tips

- Up to 15 boxes. Three levels of two branches (7 boxes) read at a glance.
- Values must add up: children of a node sum to the node. The `sum` row warns when `total` disagrees with the
  leaves.
- Put the question's answer in `sum.result` in plain words ("Only 9 of those 98 are sick").
