# docs

The ClassroomIO documentation site, built with [Blume](https://useblume.dev) (Astro + Vite). Served at
[classroomio.com/docs](https://classroomio.com/docs).

## Requirements

Node **>= 22.12** (see `.nvmrc`). The rest of the monorepo is still on Node 20, so switch versions
before working here:

```bash
nvm use
```

## Develop

```bash
pnpm dev      # fetches the OpenAPI spec, then starts the dev server
pnpm build    # builds to dist/, then packages to build/ for the worker
pnpm preview  # builds, then serves through the worker on :4173
pnpm validate # checks internal links and heading anchors
```

Use `pnpm preview` before deploying anything that touches routing. `pnpm dev` serves pages straight
from Blume and never sees Cloudflare's asset server, so it cannot show you the `_redirects` rules, the
404 page, or the trailing-slash handling — only `preview` runs the site the way production does.

## How it's served

The site is fully static. `classroomio.com/docs/*` is proxied by the marketing site
(`apps/website/src/hooks.server.ts`) to the `cio-docs` worker, which serves the build as static
assets — there is no server-side rendering.

Two things follow from being mounted at `/docs`:

- **Links** are authored root-relative (`/course-enrollment`). Blume prepends the base at build time.
- **Images** must be written with the base (`/docs/certificates-rules.webp`). Blume deliberately does
  not rebase images, so an unprefixed path would 404.

`scripts/package-assets.mjs` moves `dist/` under `build/docs/` to match the served path and writes the
`_redirects` file (`/docs` → `/docs/home`, and the legacy `/docs/how-to-guides/*` → `/docs/*`).

## API reference

`/docs/api/reference` is rendered at build time by Scalar. `scripts/fetch-openapi.mjs` pulls the spec
from R2 and injects the bearer auth scheme via `@cio/utils/openapi/public-api`. Because it is static,
a new spec reaches the site only on a rebuild — `.github/workflows/upload-openapi-spec.yml` triggers
one automatically.
