import { writable } from 'svelte/store';

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
