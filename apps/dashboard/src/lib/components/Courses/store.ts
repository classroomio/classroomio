import { writable } from 'svelte/store';
import type { Course } from '$lib/utils/types';

export const courses = writable<Course[]>([]);

export const view = writable('grid');

export const courseMetaDeta = writable<{
  isLoading: boolean;
  view: 'grid' | 'list';
}>({
  isLoading: true,
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
  isSaving: false,
  error: null
};

export const copyCourseModal = writable({ ...copyCourseModalInitialState });
