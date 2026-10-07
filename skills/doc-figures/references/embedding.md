# Putting figures where they will be read

Upload once, after the figures are final. Revisions stay local until then; never sync every draft to every
destination.

## GitHub PR descriptions and READMEs

Use both themes so the image matches the reader's GitHub theme:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="<url-of>/flow.dark.png">
  <img alt="How a run moves through the system; the engine is the changed part" src="<url-of>/flow.light.png">
</picture>
```

Upload the PNGs as GitHub attachments (drag them into the PR description editor) and use the
`https://github.com/user-attachments/assets/<id>` URLs for both themes. Raw links into a private repository
don't load reliably for reviewers.

## Repository Markdown

Save the PNGs next to the doc and link relatively. Use the `<picture>` block above with relative paths.

## Claude Docs

Use one theme, matching the doc (dark unless the doc is light). For each final PNG:

1. Upload it to the doc's artifact: the Artifact tool with `action: "publish"`, `url: <doc artifact url>`,
   `asset: true` and `file_paths: [...]` (one call for up to 25 images). Note each returned asset id.
2. Record it in the doc: Docs `create` with `object: "blob"`, `engine: "blob"`, `container: <doc>`,
   `payload: {"asset": "<asset id>"}`. It returns `blob/<id>`.
3. Insert or replace a block whose markdown is `![alt text](blob/<id>)`.

Blobs are immutable: a changed image is a new upload, a new blob and a replaced block. If a step fails, read
`guide(["topic.uploads"])` for the current flow.

## Anywhere else

Give the local PNG paths and the spec path. Alt text says what the figure shows, not "diagram".
