<a href="https://classroomio.com/">
  <img alt="A flexible, user-friendly platform for creating, managing, and delivering trainings for companies and training organisations" src="https://brand.cdn.clsrio.com/og/classroomio-opengraph.jpg" />
  <h1 align="center">ClassroomIO</h1>
</a>

The Open Source Teaching Platform for Bootcamps

## Tools

- SvelteKit
- Tailwind
- Cloudflare Workers (`cio-web`) + Workers KV

## Cloudflare KV (GitHub stars cache)

The marketing site caches the GitHub star count in a Workers KV namespace bound as `CACHE` (see `wrangler.jsonc`). Values survive deploys and are refreshed from GitHub at most once every 24 hours.

One-time setup (requires `wrangler login`):

```bash
cd apps/website
pnpm kv:create
# copy the returned id into wrangler.jsonc → kv_namespaces[0].id
# optionally: pnpm exec wrangler kv namespace create CACHE --preview
# and set preview_id as well
```

Local `vite dev` / prerender use Wrangler’s local KV via `platformProxy` in `svelte.config.js`.
