# @cio/embeds

Standalone **ES module** bundles for third-party sites (no dependency on `apps/website`). The question-type-picker entry shows a **small loading spinner** (same style as `@cio/ui` `Spinner`) as soon as the bootstrap script runs, then loads the main widget chunk—so slow connections see feedback while the larger bundle downloads.

## Question type picker

Build outputs **`dist/question-type-picker.js`** (bootstrap) plus **additional `question-type-picker-*.js` chunks**. Upload **every** `.js` file from `dist/` to the same directory on your CDN so dynamic `import()` resolves correctly.

CSS for the widget is injected when the main chunk runs.

### Develop

```bash
pnpm --filter @cio/embeds dev
```

Open the dev harness at `http://localhost:5180` (see root `index.html`).

### Build

```bash
pnpm --filter @cio/embeds build
```

`prebuild` runs `@cio/ui` Tailwind generation so `@cio/ui/output.css` exists for `src/embed.css`.

## Deploy to Cloudflare R2

Built files are uploaded with the same S3-compatible credentials and **`assets`** bucket used for Storybook. Objects live under a **per-widget prefix** so future embeds do not clash:

| Widget               | R2 key prefix                  |
| -------------------- | ------------------------------ |
| Question type picker | `embeds/question-type-picker/` |

After upload, every file from `dist/` appears at `embeds/question-type-picker/<filename>`. The bootstrap script is always **`question-type-picker.js`**; lazy-loaded chunks use **content hashes** in the filename (for example `question-type-picker-embed-mount-7a3b2c1d.js`) so they can be cached for a long time. The upload script sets a **short TTL + `must-revalidate`** on the bootstrap only, so a normal refresh picks up new chunk URLs after you deploy. If you still see an old UI, hard-refresh or purge your CDN cache for `question-type-picker.js`.

Map your **public CDN or custom domain** to this bucket (or path) so those URLs are reachable over HTTPS.

### Environment variables

Set these locally (e.g. `.env` in `apps/embeds`, loaded by the upload script) or in CI:

- `CLOUDFLARE_ACCESS_KEY`
- `CLOUDFLARE_SECRET_ACCESS_KEY`
- `CLOUDFLARE_ACCOUNT_ID`

**CDN cache purge (optional):** R2 is only storage; if `assets.cdn.clsrio.com` (or your public host) is **proxied through Cloudflare**, edge cache can still serve old bytes after upload. The upload script can call Cloudflare’s **Purge Cache** API for every file URL it just published.

- `CLOUDFLARE_API_TOKEN` — API token with **Zone → Cache Purge → Purge** on the zone that serves the asset hostname (not the R2 S3 access key).
- `CLOUDFLARE_ZONE_ID` — that zone’s ID (dashboard → site → Overview → API).
- `EMBED_CDN_BASE_URL` — public origin for URLs to purge, default `https://assets.cdn.clsrio.com` (no trailing slash). Override if your embeds are served under another host.
- `EMBED_SKIP_CDN_PURGE=1` — skip purge (e.g. local testing).

If `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ZONE_ID` is missing, upload still succeeds and purge is skipped.

### Manual publish (build + upload)

From the repo root:

```bash
pnpm --filter @cio/embeds run embeds:publish
```

Or from `apps/embeds` after a build:

```bash
pnpm upload:embeds
```

`pnpm upload:embeds` only uploads `dist/`; run `pnpm build` first if needed.

### GitHub Actions

Workflow: [`.github/workflows/deploy-embeds.yml`](../../.github/workflows/deploy-embeds.yml).

- **When it runs:** push to **`main`** that touches `packages/ui/**`, `packages/question-types/**`, or `apps/embeds/**`, or **workflow_dispatch**.
- **What it does:** `pnpm i`, then `pnpm --filter @cio/embeds run embeds:publish`.
- **Secrets:** the job uses the **`production`** environment; configure the R2 `CLOUDFLARE_ACCESS_KEY`, `CLOUDFLARE_SECRET_ACCESS_KEY`, and `CLOUDFLARE_ACCOUNT_ID` there. Optionally add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` so each deploy purges the Cloudflare CDN cache for the published embed URLs. Optional repo variable `EMBED_CDN_BASE_URL` overrides the default public base URL used when building purge URLs.

## Embed on a site

The bootstrap file **`question-type-picker.js`** loads additional chunks via dynamic `import()`. Browsers resolve those URLs **relative to the bootstrap script’s URL**, so **every file from `dist/` must be served from the same directory** (same path prefix on your CDN). Do not host only the bootstrap file.

### Production (CDN / R2 public URL)

Use your public base URL for the picker folder—for example:

```text
https://<your-public-host>/embeds/question-type-picker/
```

Then reference the bootstrap script under that path.

**Auto-mount** (looks for `[data-cio-widget="question-type-picker"]`):

```html
<div data-cio-widget="question-type-picker"></div>
<script type="module" src="https://<your-public-host>/embeds/question-type-picker/question-type-picker.js"></script>
```

**Manual mount** (no `data-cio-widget` on that node—avoid double-mounting):

```html
<div id="qtp"></div>
<script type="module">
  await import('https://<your-public-host>/embeds/question-type-picker/question-type-picker.js');
  const el = document.getElementById('qtp');
  if (el) window.CIO?.questionTypePicker?.mount(el);
</script>
```

### Local or any static host

If you copy all of `dist/` to a single URL prefix, set `src` / `import()` to that prefix + `question-type-picker.js` (same pattern as above, with your host and path).

Use a **`type="module"`** script in all cases; the bundle is ES modules with code-splitting.

### Local smoke test

From `apps/embeds`, after `pnpm build`, serve the folder and open `example-embed.html`:

```bash
pnpm build && npx serve . -p 5190
# open http://localhost:5190/example-embed.html
```

## Adding another widget

1. Add `src/widgets/<name>/widget.svelte` and a bootstrap entry (same pattern as `question-type-picker`).
2. Add a dedicated `build.lib.entry` or Vite config if you need a separate publishable script.
