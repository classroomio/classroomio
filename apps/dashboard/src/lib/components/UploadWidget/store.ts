import { writable } from 'svelte/store';

export const handleOpenWidget = writable({
  open: false
});
