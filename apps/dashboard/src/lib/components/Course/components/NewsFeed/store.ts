import { writable } from 'svelte/store';

export const isNewFeedModal = writable({
  open: false
});
