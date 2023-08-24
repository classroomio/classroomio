import { writable } from 'svelte/store';

export const courses = writable([]);
export const courseMetaDeta = writable({
  isLoading: true
});

export const createCourseModal = writable({
  open: false,
  title: '',
  description: '',
  emails: '',
  tutors: '',
  students: ''
});

export const copyCourseModalInitialState = {
  open: false,
  courseIdToCopy: null,
  id: '',
  title: '',
  isSaving: false,
  error: null
};
export const copyCourseModal = writable({ ...copyCourseModalInitialState });
