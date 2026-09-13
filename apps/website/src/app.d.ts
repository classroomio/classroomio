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
        CACHE: StarsKvNamespace;
      };
    }
  }
}

export {};
