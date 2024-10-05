import { writable } from 'svelte/store';

export const newOrgModal = writable({
  open: false
});

export const sideBar = writable({
  hidden: true
});

export const profileMenu = writable<{
  ref?: HTMLDivElement;
  open: boolean;
}>({
  ref: undefined,
  open: false
});
