import { writable } from 'svelte/store';

export const courseMetaDeta = writable<{
  view: 'grid' | 'list';
}>({
  view: 'grid'
});

export const createCourseModal = writable({
  title: '',
  type: '',
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
  description: '',
  isSaving: false,
  error: null
};

export const copyCourseModal = writable({ ...copyCourseModalInitialState });

export const deleteCourseModalInitialState = {
  open: false,
  id: '',
  title: '',
  isDeleting: false
};

export const deleteCourseModal = writable({ ...deleteCourseModalInitialState });
