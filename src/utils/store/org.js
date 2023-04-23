import { writable } from 'svelte/store';

export const orgs = writable([]);
export const currentOrg = writable({
  id: '',
  name: '',
  shortName: '',
  siteName: '',
});
export const orgAudience = writable([]);
