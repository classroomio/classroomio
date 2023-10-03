import { writable } from 'svelte/store';

export const menu = writable({
  hidden: true
});

export const newOrgModal = writable({
  open: false
});

export const sideBar = writable({
  open: true
});
