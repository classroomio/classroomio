import { writable } from 'svelte/store';

export const courses = writable([]);

export const createCourseModal = writable({
  open: false,
  title: '',
  description: '',
  emails: '',
  tutors: '',
  students: '',
});
