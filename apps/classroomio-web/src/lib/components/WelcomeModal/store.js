import { writable } from 'svelte/store';

export const welcomeModalStore = writable({
  open: false
});
