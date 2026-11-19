// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type { StarsKvNamespace } from '$lib/server/github-stars';
import type { ChangelogKvNamespace } from '$lib/server/changelog';

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
        CACHE: StarsKvNamespace & ChangelogKvNamespace;
        USERJOT_API_KEY?: string;
      };
    }
  }
}

export {};
