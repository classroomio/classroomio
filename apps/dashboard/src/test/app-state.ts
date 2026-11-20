/**
 * Stand-in for SvelteKit's `$app/state` under vitest, where the kit plugin is not active.
 */
export const page = {
  url: new URL('http://localhost/'),
  params: {},
  state: {}
};
