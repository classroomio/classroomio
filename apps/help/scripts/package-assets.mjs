/**
 * Packages `blume build` output for the assets-only Cloudflare Worker.
 *
 * `deployment.base: '/help'` makes Blume emit URLs like `/help/foo`, but it
 * does NOT nest the output — pages land in `dist/foo/index.html`. The worker
 * is asked for `/help/foo` (the website proxies the full path through), so
 * the build is moved under `build/help/` to line up with the served paths.
 *
 * No redirects are generated here: `/help` is a clean-break URL space with no
 * prior public paths to forward. If a future internal redirect is ever
 * needed, write it as a `_redirects` file at the assets root the same way
 * apps/docs/scripts/package-assets.mjs does — under a `base`, Astro prefixes
 * a redirect's source but not its target, so Astro's own `redirects` config
 * is unusable here too.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const out = resolve(root, 'build');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await cp(dist, resolve(out, 'help'), { recursive: true });

console.log('[help] Packaged dist/ -> build/help/');
