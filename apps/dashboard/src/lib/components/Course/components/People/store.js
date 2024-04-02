import { writable } from 'svelte/store';

export const deleteMemberModal = writable({
  open: false
});
