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
specs. Readers forget names; they keep a mechanism they watched run. A reader believes every line of a figure, so
one wrong number or arrow costs more than a missing detail: say less, and make all of it true.

0. **Read the source like a checker.** Before you plan, list the source's claims, numbers, cases and stages, each
   with its qualifiers ("in most years", "about", "among metals"). Every statement in a figure must trace to that
   list or be arithmetic on it. Never add a cause, a number or a general rule the source does not give; if the
   source says "a small rise", draw it small and leave it unnumbered.
1. **Claim first.** The first figure states the idea in one plain sentence and shows its result.
2. **Ground it in a picture.** If the idea happens in space (moons round a planet, a stone on a slope, cells in a
   pond), draw the real thing once, side or top view, with `freeform` and inline SVG. Bars and tables organize;
   only a picture shows what "in line" or "at right angles to the slope" looks like.
3. **Run the mechanism on numbers.** Use `steps` (or `tree`, `loop`) with the source's own small example. Show
   every step the conclusion depends on; a named step that is not shown is the commonest failure. Show each
   state, not only the result: the list with the removed item crossed out (`out`) before the next count, the amount
   left after each step.
4. **Never make the reader do arithmetic.** Write the result of every sum, ratio and unit change ("about 4,900
   tons", not "7 times larger"; "500 ms", not "half a second" beside "3 ms"). Put compared amounts in the
   same unit, side by side, on one axis. Draw the level each amount is judged against: both ends of a band, the
   calm level, the 1× case (`lines` in `bars`).
5. **Show the case where it does not happen.** Beside the example, show the control: the same push on flat
   ground, the quiet hour when demand falls, the attempt that fails. A
   mechanism is understood when the reader can say what changes the outcome.
6. **Every effect shows its cause.** If a figure says B follows A, the link is on that figure ("damaged
   cell → alarm signal → immune cells arrive"). Say why each condition is needed ("air would undo the
   reaction, so it must be kept out"), and what a name means ("cold start: the engine has not warmed up").
7. **State the rule, then its limit.** After the example, say the general rule in words a reader could apply to
   a case the figures do not show (`rule`). Add `limit` only for a real condition that breaks the mechanism, as
   strongly as the source says it and no more: "weaker when it is hot" is not "stops working when it is hot".
8. **Name the wrong idea.** If there is a common misconception, show it beside the truth (`myth`, or `compare`
   with `"arrow": false`) and say what rules it out.
9. **Draw, don't list.** Words in boxes are a slide. A cycle that repeats is a path or a timeline drawn to scale,
   not four cards; a part's shape or position is a `freeform` drawing. Keep text for the claim and the why.
   Cover the words: the shapes, positions and arrows alone should still show what moves, where and which way. If
   they do not, the figure is a list with lines.
10. **Plain words, one meaning each.** Define each term the first time it appears, in the figure itself. Never
   let one label mean two things (copies A, B, C and tallies A, B, C). Write "almost never", not "never", for
   statistical claims. Use `hl`, not `changed`: nothing is changing in an explainer. Keep one color for one thing
   in every figure (cost is always red).
11. **Three to five figures, no repeats.** Each answers one question: what happens, how, why, when not, what
   people get wrong. Say the rule once; do not restate it in every figure.
12. **Check every number last.** Recompute each number in a title, caption or callout from the figure's own
   values (40 kg over 0.5 kg is 80 times, not 40). Check units and powers of ten. Check counts against the source
   ("three trips", "two rounds"): a figure's panel count is not the source's count, and a wrong number teaches a
   wrong idea. Section 4 gives the full review.

## 2. Write the spec

- **Real parts, example data.** Every box and arrow is a part that exists in the system or the change; never add
  one to fill out the picture. In a system figure, example values (names, numbers, ids) may be invented: say
  "Illustrative" in the subtitle. In an explainer, use only the source's numbers and arithmetic on them. Dig up
  real data only when the figure claims a measurement. Numbers must add up.
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

## 4. Check

- Fix every `WARN` line in the spec: shorten a label, drop a box, or split the figure. Re-render. Arrow crossings
  hurt reading more than anything else; reorder nodes or edges in the spec to remove them. The checks also flag
  vague or missing arrow labels, generic or code-style box names, lone boxes, more than 8 boxes, and text under
  4.5:1 contrast.
- **PR, system or doc figure:** look once at the contact sheets, or the single PNG (Read in Claude Code,
  `view_image` in Codex). Is the takeaway obvious in five seconds? Is every fact right? Don't open each PNG
  separately.
- **Explainer:** pick the mode from the request.
  - **Fast (default):** one review pass. Fix what it finds, re-render, and look once more only at the figures
    you changed.
  - **Thorough:** when the user asks for careful, thorough, final or publish-ready figures, or says "slow mode".
    Review in passes until a pass finds nothing, usually two or three.
  - **Reasoning effort** matters more than the number of passes. If you or the caller can choose it, use high
    effort for explainers and max for figures that will be published.

  In each pass, open every light PNG and check, against the source and not from memory:
  1. **Picture.** Does each drawing match the plan, with the eye path in the order of the cause? Cover the words:
     do the shapes still show the mechanism?
  2. **Numbers.** Recompute every number, sum, ratio and unit from the source.
  3. **Sentences.** Is each title, caption and rule as narrow as the source, with its qualifiers kept? Is each
     "because" and each arrow a link the source states?
  4. **Drawings against words.** Does every arrow, shift and position point the way its caption says? Is a red
     cross or `myth` only on a false statement?
  Fix what you find in the spec and re-render. In thorough mode, start the next pass. Fast mode keeps all four
  checks and drops only the repeat passes: numbers and drawings against words catch most errors.

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
