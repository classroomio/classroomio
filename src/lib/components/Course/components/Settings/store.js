import { writable } from 'svelte/store';

export const settings = writable({
  image: '',
  course_title: '',
  course_description: '',
  grading: false,
  tabs: [
    { id: 1, name: 'Note' },
    { id: 2, name: 'Slide' },
    { id: 3, name: 'Video' }
  ],
  lesson_download: false
});
