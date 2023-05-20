import { writable, derived } from 'svelte/store';

export const orgs = writable([]);
export const currentOrg = writable({
  id: '',
  name: '',
  shortName: '',
  siteName: '',
  avatar_url: '',
});
export const orgAudience = writable([]);
export const orgTeam = writable([]);
export const currentOrgPath = derived(
  currentOrg,
  ($currentOrg) => `/org/${$currentOrg.siteName}`
);
