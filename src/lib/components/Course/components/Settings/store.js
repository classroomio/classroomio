import { writable } from 'svelte/store';

export const settings = writable({
  logo: '',
  course_title: '',
  course_description: '',
  grading: false,
  allow_new_students: false,
  tabs: [
    { id: 1, name: 'Note' },
    { id: 2, name: 'Slide' },
    { id: 3, name: 'Video' }
  ],
  lesson_download: false,
  is_published: false
});
