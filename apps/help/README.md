# help

The ClassroomIO Help Center, built with [Blume](https://useblume.dev) (Astro + Vite). Served at
[classroomio.com/help](https://classroomio.com/help).

This is the user-facing counterpart to `apps/docs` (developer docs). Guides here are for people
running a ClassroomIO academy — creating courses, managing enrollment, publishing an academy.
Anything for people integrating with, running, or contributing to the product itself belongs in
`apps/docs` instead.

## Requirements

Node **>= 22.12** (see `.nvmrc`). The rest of the monorepo is still on Node 20, so switch versions
before working here:

```bash
nvm use
```

## Develop

```bash
pnpm dev      # starts the dev server
pnpm build    # builds to dist/, then packages to build/ for the worker
pnpm preview  # builds, then serves through the worker on :4174
pnpm validate # checks internal links and heading anchors
```

Use `pnpm preview` before deploying anything that touches routing. `pnpm dev` serves pages straight
from Blume and never sees Cloudflare's asset server, so it cannot show you the 404 page or the
trailing-slash handling — only `preview` runs the site the way production does.

## Navigation

`blume.config.ts` defines an **explicit `navigation.sidebar` array**, which controls group
membership and order and overrides Blume's default folder-tree/`meta.ts` inference entirely.
A page must be listed in that array to appear in the sidebar at all — adding a new `.mdx` file
under `content/help` is not enough by itself. Within a group, page order still comes from each
page's `sidebar: { order: N }` frontmatter.

## Editing docs without a repo clone

Non-technical writers can edit existing pages through a browser-based CMS (Sveltia) at
`classroomio.com/help/admin` instead of cloning the repo — see `CMS_GUIDE.md` for how to log in,
edit, and submit changes for review. Editing existing pages needs no config change; adding a new
page or reordering groups still needs the `navigation.sidebar` follow-up described above, which
stays a developer task.

## How it's served

The site is fully static. `classroomio.com/help/*` is proxied by the marketing site
(`apps/website/src/hooks.server.ts`) to the `cio-help` worker, which serves the build as static
assets — there is no server-side rendering.

Two things follow from being mounted at `/help`:

- **Links** are authored root-relative to the content root (e.g. `/build-a-course/course-types`).
  Blume prepends the base at build time.
- **Images** must be written with the base (`/help/customize-organization.webp`). Blume deliberately
  does not rebase images, so an unprefixed path would 404.

`scripts/package-assets.mjs` moves `dist/` under `build/help/` to match the served path. There are no
redirects from the old `/docs/guides/*` URLs — this is a clean-break move, by design.
