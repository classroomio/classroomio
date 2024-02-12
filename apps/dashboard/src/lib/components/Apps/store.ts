import { writable } from 'svelte/store';

export const apps = writable<{
  open: boolean;
  dropdown: boolean;
  selectedApp: string | undefined;
}>({
  open: false,
  dropdown: false,
  selectedApp: undefined
});
