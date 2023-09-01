import { writable } from 'svelte/store';

export const exerciseMode = writable({
  editMode: true
});
