import { writable } from 'svelte/store';

export const appStore = writable({
  isDark: false,
});
