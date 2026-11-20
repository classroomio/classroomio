import { writable } from 'svelte/store';

export const deletePathMemberModal = writable({
  open: false
});
