import { writable } from 'svelte/store';

export const settingsDialog = writable({
  open: false,
});
