import { writable } from 'svelte/store';

export const newOrgModal = writable({
  open: false
});
