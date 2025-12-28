import { writable } from 'svelte/store';

export const handleAddLessonWidget = writable({
  id: '',
  open: false,
  isSection: false
});
