import { writable } from 'svelte/store';

export const isNewAnouncementModal = writable({
  open: false
});

export const anouncementList = writable([]);
