import { writable } from 'svelte/store';

export const newOrgModal = writable({
  open: false
});

export const sideBar = writable({
  hidden: false
});
