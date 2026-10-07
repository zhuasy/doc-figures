---
name: doc-figures
description: "Make polished explanatory figures for PRs, design docs, PRDs and Claude Docs from a short JSON spec: big-picture system flows, before/after comparisons, PR stacks, call sequences, record fields and timelines. Renders light and dark PNGs in about a second and checks them for overlaps and tiny text. Use when a PR or document needs a diagram, picture, graphic or visual, when the user says picturefy or wants it easy on the eyes, or to replace Mermaid or ASCII diagrams."
---

# Doc figures

Write a short JSON spec. The renderer lays it out in one house style, checks it and writes PNGs. Never place
coordinates by hand, and don't read the renderer's source to use it.

## 1. Pick the picture

Write the takeaway in one sentence, then pick the template. Read only that template's reference.

| Template | Use for | Reference |
| --- | --- | --- |
| `flow` | The big picture: the parts of a system and how requests move. Every PR opens with one | `references/flow.md` |
| `compare` | Before and after: what a change does differently | `references/compare.md` |
| `stack` | Stacked PRs: what each adds, why it needs the one below, merge order | `references/stack.md` |
| `sequence` | Who calls whom, in order, with waits and replies that arrive later | `references/sequence.md` |
| `card` | The fields of a record, payload or table, and links between them | `references/card.md` |
| `timeline` | Where time went: waterfalls, retries, waits, zooming into one part | `references/timeline.md` |

A chart of measured data series (bars, lines, distributions) is not a template: see `references/charts.md`.

## 2. Write the spec

- **One concrete example.** Invent names and numbers by default and say "Illustrative" in the subtitle. Dig up
  real data only when the figure claims a measurement. Numbers must add up.
- **Plain words.** Use the doc's terms. Each box says what it does, not only its name. Code identifiers appear
  only where the reader will search for them.
- **Mark the change.** `changed: true` turns a box or arrow orange; everything else is context.
- **One meaning per color** across a set. Amber is another company's system; orange means "look here".
- Put a set of figures in one JSON array or several files and render them in one call.

## 3. Render

`<skill-folder>` is the folder this SKILL.md is in:

```sh
node <skill-folder>/render/render.mjs figs/*.json --out figs/out
```

Each figure becomes `<name>.dark.png` and `<name>.light.png`, 1800 px wide for a column about 900 px wide. A
set also gets contact sheets, four figures each. Ten figures take about three seconds. `--theme dark` renders
one theme. Needs Node 22+ and Google Chrome (or Playwright's Chromium).

## 4. Check once

- Fix every `WARN` line in the spec: shorten a label, drop a box, or split the figure. Re-render.
- Then look once at the contact sheets, or the single PNG (Read in Claude Code, `view_image` in Codex). Is the
  takeaway obvious in five seconds? Is every fact right? Don't open each PNG separately.

## 5. Deliver

Upload once, when the figures are final, to one destination: see `references/embedding.md` (GitHub `<picture>`
with both themes, Claude Docs blobs, repository Markdown). Keep the spec JSON beside the doc or the PR assets so
anyone can edit and re-render.

## When no template fits

Add an option to the closest template in `render/templates/` instead of drawing by hand. Templates share
`render/common.js` (`DF.card`, `DF.layoutFlow`, `DF.wires`, `DF.legend`, `DF.warn`). Render `examples/*.json`
afterwards to check nothing else broke. Matplotlib (`references/charts.md`) is the last resort.
