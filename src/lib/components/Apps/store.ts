import { writable } from 'svelte/store';

export const apps = writable<{
  open: boolean;
  dropdown: boolean;
  selectedApp: string | undefined;
  isStudent: boolean;
}>({
  open: false,
  dropdown: false,
  selectedApp: undefined,
  isStudent: false
});
