# loop: cause and feedback

Use it when the explanation is "A drives B, and B comes back to drive A": prices that settle, populations that
explode, climate feedbacks, a flash that spreads. Each arrow carries a sign: `+` means more of one makes more of
the next, `-` means more of one makes less. The template counts the minus signs and labels the loop: an odd
count is **balancing** (it settles), an even count is **reinforcing** (it runs away). Readers learn to predict
the behaviour from the signs.

| Field | On | Meaning |
| --- | --- | --- |
| `nodes` | figure | 2 to 6 quantities, in ring order, with node fields as in `flow` (`label`, `does`, `icon`, `color`, `hl`) |
| `links` | figure | `{from, to, sign, label}`; must go round the ring in node order (1 → 2 → … → 1) |
| `inputs` | figure | Outside causes: `{label, does?, to, sign?}`, drawn beside the node they push on |
| `takeaway` | figure | One sentence under the ring: what the loop does here |
| `kind` | figure | Optional check: `"balancing"` or `"reinforcing"`; warns if the signs disagree |
| `legend`, `note`, `nodeWidth`, `height` | figure | Hide the sign key; a muted line; box width (200); ring height |

```json
{
  "template": "loop",
  "title": "Why a self-adjusting toll settles",
  "nodes": [
    {"id": "toll", "label": "Toll", "does": "Up 10¢ if full, down 10¢ if half empty"},
    {"id": "drivers", "label": "Drivers who cross"},
    {"id": "full", "label": "Time the bridge is full"}
  ],
  "links": [
    {"from": "toll", "to": "drivers", "sign": "-", "label": "higher toll, fewer drivers"},
    {"from": "drivers", "to": "full", "sign": "+", "label": "more drivers, fuller bridge"},
    {"from": "full", "to": "toll", "sign": "+", "label": "fuller bridge, higher toll"}
  ],
  "inputs": [{"label": "New ferry", "to": "drivers", "sign": "-"}],
  "takeaway": "Each push comes back as the opposite push, so the toll settles where drivers just fill the bridge."
}
```

## Tips

- Name each node as a quantity that can go up or down ("Drivers who cross", not "Drivers").
- Write each link label as "more X, more Y" or "higher X, fewer Y": it teaches the sign.
- An `input` answers "what if" questions: show the outside change the reader is likely to ask about.
- Pair it with a `steps` figure that runs the loop once on numbers.
