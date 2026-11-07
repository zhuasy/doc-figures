---
name: doc-figures
description: "Make polished explanatory figures for PRs, design docs, PRDs, Claude Docs and explainers of hard ideas from a short JSON spec: big-picture system flows, before/after comparisons, PR stacks, call sequences, record fields, timelines, nested layers (onion), worked step-by-step mechanisms, feedback loops and trees, with a checked freeform layout when none fits. Renders light and dark PNGs or SVGs in about a second and checks them for overlaps and tiny text. Use when a PR or document needs a diagram, picture, graphic or visual, when the user says picturefy or wants it easy on the eyes, or to replace Mermaid or ASCII diagrams."
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
| `layers` | A layered architecture where each layer works both ways with the next; ring one box | `references/layers.md` |
| `onion` | Layers inside layers: what wraps what, where a secret is readable, how deep two designs nest | `references/onion.md` |
| `steps` | How a mechanism works, run on a tiny example: state, operation and why, then the general rule and its limit | `references/steps.md` |
| `loop` | Cause and feedback: quantities that push each other round a ring, and whether the loop settles or runs away | `references/loop.md` |
| `tree` | One thing that splits: hierarchies, decision trees, frequency trees that turn percentages into counts | `references/tree.md` |

If none fits, use `freeform` (`references/freeform.md`): you write the layout as HTML with the house classes, and
the renderer still themes and checks it.

A chart of measured data series (bars, lines, distributions) is not a template: see `references/charts.md`.

## Explaining an idea

When the figures teach a concept to someone new to the field (not a PR or a system), plan the set before the
specs. Readers forget names; they keep a mechanism they watched run.

1. **Claim first.** The first figure states the idea in one plain sentence and shows its result.
2. **Ground it in a picture.** If the idea happens in space (moons round a planet, a stone on a slope, cells in a
   pond), draw the real thing once, side or top view, with `freeform` and inline SVG. Bars and tables organize;
   only a picture shows what "in line" or "at right angles to the slope" looks like.
3. **Run the mechanism on numbers.** Use `steps` (or `tree`, `loop`) with the source's own small example. Show
   every step the conclusion depends on; a named step that is not shown is the commonest failure.
4. **State the rule, then its limit.** After the example, say the general rule in words a reader could apply to a
   case the figures do not show (`rule`). Add `limit` only for a real condition that breaks the mechanism ("no
   frost, no lift, no creep"); leave it out rather than fill it with a scope note or a slower case.
5. **Name the wrong idea.** If there is a common misconception, show it beside the truth (`myth`, or `compare`
   with `"arrow": false`) and say what rules it out.
6. **Plain words, one meaning each.** Define each term the first time it appears, in the figure itself. Never let
   one label mean two things (copies A, B, C and tallies A, B, C). Write "almost never", not "never", for
   statistical claims. Use `hl`, not `changed`: nothing is changing in an explainer.
7. **Three to five figures.** Each answers one question: what happens, how, why, when not, what people get wrong.
   Check every number against the source, including counts ("three trips", "two rounds"): a figure's panel count
   is not the source's count, and a wrong number teaches a wrong idea.

## 2. Write the spec

- **Real parts, example data.** Every box and arrow is a part that exists in the system or the change; never add
  one to fill out the picture. Example values (names, numbers, ids) may be invented: say "Illustrative" in the
  subtitle. Dig up real data only when the figure claims a measurement. Numbers must add up.
- **One subject, four to eight boxes.** Show runtime or deploy, structure or order, not all of them. Calls that go
  back and forth are a `sequence`, not a row of boxes.
- **Real names, specific verbs.** Each box has its real name ("Upload API", not "API") and says what it does.
  Each arrow points one way and says what it does in that direction ("submits the document", not "uses" or
  "calls"); a reply is its own arrow. Use the doc's terms. Box titles name parts, not code: "Upload handler", not
  `uploadHandler` or `worker.ts`. Put an identifier in `does` only where the reader will search for it.
- **Mark the change.** `changed: true` turns a box or arrow orange; everything else is context.
- **One meaning per color** across a set. Amber is another company's system; orange means "look here".
- Put a set of figures in one JSON array or several files and render them in one call.

## 3. Render

`<skill-folder>` is the folder this SKILL.md is in:

```sh
node <skill-folder>/render/render.mjs figs/*.json --out figs/out
```

Each figure becomes `<name>.dark.png` and `<name>.light.png`, 1800 px wide for a column about 900 px wide. A
set also gets contact sheets, four figures each. `--theme dark` renders one theme. Needs Node 22+ and Google
Chrome. Playwright's headless shell (`npx playwright install --only-shell chromium`) is used when present: with
it one figure takes about 0.4 s and twelve about 1.2 s.

Three flags write other formats next to, or instead of, the PNGs (details in `references/embedding.md`):

- `--svg` also writes `<name>.dark.svg` and `<name>.light.svg`: vector copies, about a seventh the size, for
  repository Markdown such as a README. Line breaks are fixed, so the text cannot rewrap.
- `--html` also writes `<name>.html`: static HTML for a web page that takes raw HTML, with both themes.
- `--t3` writes only `<name>.t3.html`, laid out for T3 Code's 728 px `html_render` frame. Use it to show a figure
  inside a T3 thread: pass the file's HTML to `html_preview`, then to `html_render`. It still prints every `WARN`.

## 4. Check once

- Fix every `WARN` line in the spec: shorten a label, drop a box, or split the figure. Re-render. Arrow crossings
  hurt reading more than anything else; reorder nodes or edges in the spec to remove them. The checks also flag
  vague or missing arrow labels, generic or code-style box names, lone boxes, more than 8 boxes, and text under
  4.5:1 contrast.
- Then look once at the contact sheets, or the single PNG (Read in Claude Code, `view_image` in Codex). Is the
  takeaway obvious in five seconds? Is every fact right? Don't open each PNG separately.

## 5. Deliver

Upload once, when the figures are final, to one destination: see `references/embedding.md` (GitHub `<picture>`
with both themes, Claude Docs blobs, repository Markdown). Keep the spec JSON beside the doc or the PR assets so
anyone can edit and re-render.

## Curated first, freeform when needed

1. **A curated template fits:** use it. Add an option to it rather than reaching for freeform to change its look.
2. **None fits:** draw it once with `freeform`. Lay out with flex or grid, never with coordinates.
3. **The same freeform shape comes back:** promote it to a curated template in `render/templates/<name>.js`, with
   a reference, an example and a row in the table above. Templates share `render/common.js` (`DF.card`,
   `DF.layoutFlow`, `DF.wires`, `DF.legend`, `DF.warn`, `DF.lintBox`, `DF.lintArrow`). Render `examples/*.json`
   afterwards to check nothing else broke.

Matplotlib (`references/charts.md`) is only for measured data series.
