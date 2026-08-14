// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type { StarsKvNamespace } from '$lib/server/github-stars';

declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    interface Platform {
      env: {
        ASSETS: {
          fetch: typeof fetch;
        };
        /**
         * Cloudflare KV namespace bound in `wrangler.jsonc`.
         * Create with: `pnpm exec wrangler kv namespace create CACHE`
         * then set the returned id on the `CACHE` binding.
         */
        CACHE: StarsKvNamespace;
      };
    }
  }
}

export {};
