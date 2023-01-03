import { writable } from 'svelte/store';

export const orgs = writable([]);
export const currentOrg = writable({});
