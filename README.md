<h1 align="center">doc-figures</h1>

<p align="center">
  <b>Diagrams for PRs and design docs, from a few lines of JSON.</b><br>
  Your agent writes the spec. The skill lays it out, checks it, and renders light and dark PNGs in about a second.
</p>

<p align="center">
  <code>npx skills add zhuasy/doc-figures</code>
</p>

Ask your agent for a picture: *"add a diagram of the retry fix to this PR"*. It writes a spec like this:

```json
{
  "template": "flow",
  "title": "Retries resume where the upload stopped",
  "subtitle": "Illustrative. The API now asks storage which parts already arrived.",
  "nodes": [
    {"id": "browser", "label": "Browser", "icon": "monitor", "color": "blue",
     "does": "Splits the file into 5 parts"},
    {"id": "api", "label": "Upload API", "icon": "server", "color": "violet",
     "does": "Asks storage which parts it already has", "changed": true},
    {"id": "gcs", "label": "Cloud storage", "icon": "cloud", "color": "sky",
     "does": "Keeps parts 1–3 from the first try", "external": true}
  ],
  "edges": [
    {"from": "browser", "to": "api", "label": "retry the upload"},
    {"from": "api", "to": "gcs", "label": "list stored parts", "changed": true},
    {"from": "gcs", "to": "api", "label": "parts 1–3", "later": true}
  ]
}
```

and gets this:

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/flow-small.dark.png">
  <img alt="A flow: a browser retries an upload and the API asks storage which parts already arrived" src="docs/flow-small.light.png">
</picture>

- **No coordinates.** The spec names the parts and the links. The skill places boxes and routes arrows.
- **Checked on every render.** It warns about overlapping boxes, clipped labels and text too small to read.
- **Light and dark.** Both PNGs come out together, and GitHub shows the one that matches the reader's theme.
- **Sharp.** 1800 px wide for a 900 px column, so text stays crisp on retina screens.

## Seven templates

### `compare` · before and after

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/compare-upload-retry.dark.png">
  <img alt="Before and after: a retry sends only the upload parts that are missing" src="docs/compare-upload-retry.light.png">
</picture>

<details><summary>The spec for this picture (56 lines of JSON)</summary>

```json
{
  "template": "compare",
  "name": "compare-upload-retry",
  "title": "Retries send only the parts that are missing",
  "subtitle": "Illustrative: a 5-part upload drops after part 3, then retries.",
  "before": {
    "caption": "The retry starts over and sends every part again.",
    "blocks": [
      {
        "type": "chips",
        "label": "Stored after the first try",
        "items": [
          {"text": "1", "state": "done"},
          {"text": "2", "state": "done"},
          {"text": "3", "state": "done"},
          {"text": "4", "state": "muted"},
          {"text": "5", "state": "muted"}
        ]
      },
      {
        "type": "chips",
        "label": "Sent on retry",
        "items": [{"text": "1"}, {"text": "2"}, {"text": "3"}, {"text": "4"}, {"text": "5"}]
      },
      {"type": "rows", "items": [{"text": "5 parts sent; 3 of them twice", "status": "fail"}]}
    ]
  },
  "after": {
    "caption": "The API asks storage what arrived and sends only the rest.",
    "blocks": [
      {
        "type": "chips",
        "label": "Stored after the first try",
        "items": [
          {"text": "1", "state": "done"},
          {"text": "2", "state": "done"},
          {"text": "3", "state": "done"},
          {"text": "4", "state": "muted"},
          {"text": "5", "state": "muted"}
        ]
      },
      {
        "type": "chips",
        "label": "Sent on retry",
        "items": [
          {"text": "1", "state": "skipped"},
          {"text": "2", "state": "skipped"},
          {"text": "3", "state": "skipped"},
          {"text": "4"},
          {"text": "5"}
        ]
      },
      {"type": "rows", "items": [{"text": "2 parts sent; nothing twice", "status": "ok"}]}
    ]
  }
}
```

</details>



### `sequence` · who calls whom, including replies that arrive later

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/sequence.dark.png">
  <img alt="A sequence: an OCR service calls a webhook later, and the engine saves the result" src="docs/sequence.light.png">
</picture>

<details><summary>The spec for this picture (43 lines of JSON)</summary>

```json
{
  "template": "sequence",
  "title": "How a parse result comes back to the engine",
  "subtitle": "Illustrative. The engine never waits on the OCR service; the orange step is the one a PR would change.",
  "actors": [
    {"id": "engine", "label": "Engine", "icon": "cpu", "color": "teal", "does": "Runs each step"},
    {
      "id": "ocr",
      "label": "OCR service",
      "icon": "file-scan",
      "color": "amber",
      "does": "Reads documents",
      "external": true
    },
    {"id": "api", "label": "API", "icon": "server", "color": "violet", "does": "Receives webhooks"},
    {
      "id": "queue",
      "label": "Job queue",
      "icon": "list-ordered",
      "color": "teal",
      "does": "Holds steps for workers"
    },
    {
      "id": "db",
      "label": "Postgres",
      "icon": "database",
      "color": "slate",
      "does": "Source of truth"
    }
  ],
  "messages": [
    {"from": "engine", "to": "ocr", "label": "submit document"},
    {"gap": "38 s later"},
    {"from": "ocr", "to": "api", "label": "webhook: done", "later": true},
    {
      "note": "The webhook only queues work, so a slow step never blocks it.",
      "over": ["api", "queue"]
    },
    {"from": "api", "to": "queue", "label": "queue settle"},
    {"from": "queue", "to": "engine", "label": "settle step"},
    {"from": "engine", "to": "db", "label": "save result", "changed": true}
  ]
}
```

</details>



### `stack` · stacked PRs, what each one needs, merge order

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/stack.dark.png">
  <img alt="A stack of four PRs, each naming what it needs from the one below" src="docs/stack.light.png">
</picture>

<details><summary>The spec for this picture (36 lines of JSON)</summary>

```json
{
  "template": "stack",
  "title": "Four PRs that add per-document progress",
  "subtitle": "Illustrative. Each layer builds on the one below it.",
  "base": "main",
  "prs": [
    {
      "number": 101,
      "title": "Add the run items table",
      "adds": "Stores one row per document in a run, with its status",
      "status": "merged"
    },
    {
      "number": 102,
      "title": "Engine writes item progress",
      "adds": "The engine records each document's status as it moves through a run",
      "status": "open",
      "needs": "the run items table from #101"
    },
    {
      "number": 103,
      "title": "Show progress on the runs page",
      "adds": "A live progress bar for every document, synced from the new table",
      "status": "open",
      "this": true,
      "needs": "the per-document status that #102 writes"
    },
    {
      "number": 104,
      "title": "Retry failed documents from the page",
      "adds": "A retry button that queues only the documents that failed",
      "status": "draft",
      "needs": "the progress view from #103 to show which documents failed"
    }
  ]
}
```

</details>



### `card` · the fields of a record, and what changed

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/card-span.dark.png">
  <img alt="A record card: two new fields and one changed field on a job span" src="docs/card-span.light.png">
</picture>

<details><summary>The spec for this picture (43 lines of JSON)</summary>

```json
{
  "name": "card-span",
  "template": "card",
  "title": "A job span gains two fields",
  "subtitle": "Illustrative values. Green rows are new; the orange row changed.",
  "cards": [
    {
      "id": "span",
      "title": "job step.execute",
      "subtitle": "One span per job, inside the row's trace",
      "icon": "activity",
      "color": "teal",
      "fields": [
        {
          "name": "trace_id",
          "value": "4bf92f35 77b34da6",
          "note": "Shared by every span in the row's trace"
        },
        {"name": "span_id", "value": "00f067aa 0ba902b7"},
        {"name": "name", "value": "step.execute"},
        {"name": "duration_ms", "value": 452},
        {
          "name": "attempt_id",
          "value": "att_7Q2",
          "tag": "new",
          "note": "Links the span to the Attempt it ran for"
        },
        {
          "name": "db_ms",
          "value": "35 (4 queries)",
          "tag": "new",
          "note": "Time spent waiting on Postgres"
        },
        {
          "name": "status",
          "value": "ok",
          "tag": "changed",
          "note": "Was \"completed\"; now uses the OpenTelemetry word"
        }
      ]
    }
  ]
}
```

</details>



### `timeline` · where the time went

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/timeline-trip.dark.png">
  <img alt="A timeline: a failed try, a wait, then a successful retry" src="docs/timeline-trip.light.png">
</picture>

<details><summary>The spec for this picture (31 lines of JSON)</summary>

```json
{
  "name": "timeline-trip",
  "template": "timeline",
  "title": "One document's trip through a run",
  "subtitle": "Illustrative. The first extract try failed, waited 18 s, and the second try succeeded.",
  "unit": "s",
  "axisLabel": "seconds since the row was admitted",
  "rows": [
    {"label": "Row · invoice.pdf", "start": 0, "end": 151, "color": "slate"},
    {"label": "Attempt · Source", "start": 0.5, "end": 2.4, "depth": 1},
    {
      "label": "Attempt · Extract, try 1",
      "start": 2.6,
      "end": 42.8,
      "depth": 1,
      "failed": true,
      "note": "timed out"
    },
    {"label": "waiting to retry", "start": 42.8, "end": 60.8, "depth": 1, "wait": true},
    {
      "label": "Attempt · Extract, try 2",
      "start": 60.8,
      "end": 134.6,
      "depth": 1,
      "focus": true,
      "note": "succeeded"
    },
    {"label": "Attempt · Formula", "start": 134.6, "end": 137.3, "depth": 1},
    {"label": "Attempt · Export", "start": 137.3, "end": 151, "depth": 1}
  ]
}
```

</details>



### `layers` · a layered architecture, both directions

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/layers.dark.png">
  <img alt="Four layers, from user interfaces down to core capabilities, with arrows both ways between them" src="docs/layers.light.png">
</picture>

<details><summary>The spec for this picture (88 lines of JSON)</summary>

```json
{
  "template": "layers",
  "name": "layers",
  "title": "Each layer works in both directions with the next",
  "subtitle": "Illustrative. The orange ring marks the team that owns this design.",
  "layers": [
    {
      "label": "User interfaces",
      "boxes": [
        {
          "label": "Web app",
          "icon": "message-square",
          "color": "blue",
          "does": "Start jobs, follow them live"
        },
        {
          "label": "Review queue",
          "icon": "eye",
          "color": "pink",
          "does": "Check outputs against their sources"
        }
      ],
      "down": "reviews, corrections, new jobs",
      "up": "outputs with sources"
    },
    {
      "label": "Products",
      "boxes": [
        {
          "label": "Document assistants",
          "icon": "file-text",
          "color": "teal",
          "items": ["Invoices", "Claims", "Contracts", "Reports"]
        },
        {
          "label": "Quality loop",
          "icon": "refresh-cw",
          "color": "violet",
          "items": ["Evals", "Feedback", "Traces"]
        }
      ],
      "down": "run saved assistants",
      "up": "outputs, traces"
    },
    {
      "label": "Platforms",
      "boxes": [
        {
          "label": "Agent platform",
          "icon": "bot",
          "color": "orange",
          "us": true,
          "tag": "Our team",
          "does": "Runs agents for every product",
          "items": ["Agents", "Harness", "Runtime"],
          "right": "run a workflow"
        },
        {
          "label": "Workflow platform",
          "icon": "workflow",
          "color": "sky",
          "does": "Pipelines as code",
          "items": ["APIs", "Runtime"],
          "left": "agent step"
        }
      ],
      "down": "OCR, model calls",
      "up": "results"
    },
    {
      "label": "Core capabilities",
      "boxes": [
        {
          "label": "OCR service",
          "icon": "file-scan",
          "color": "slate",
          "does": "Read, extract, split"
        },
        {
          "label": "Models",
          "icon": "sparkles",
          "color": "stone",
          "does": "In-house and hosted models"
        }
      ]
    }
  ]
}
```

</details>



`flow`, at the top, draws the parts of a system and how requests move between them.

## Install

```sh
npx skills add zhuasy/doc-figures        # add -g for every project
pnpm dlx skills add zhuasy/doc-figures   # or bunx skills add zhuasy/doc-figures
```

Works with Claude Code, Codex, Cursor and other agents that read skills. Needs Node 22+ and Google Chrome or
Chromium (set `CHROME_PATH` if it lives somewhere unusual).

To render by hand:

```sh
node skills/doc-figures/render/render.mjs skills/doc-figures/examples/*.json --out out
```

The specs behind every image on this page are in [`skills/doc-figures/examples/`](skills/doc-figures/examples).

## License

MIT. The bundled elkjs (EPL-2.0) and Lucide icons (ISC) keep their own licenses: see
[`NOTICE.md`](skills/doc-figures/render/NOTICE.md).
