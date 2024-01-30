import { writable } from 'svelte/store';

export let handleAddLessonWidget = writable({
  open: false
});
