import { writable } from 'svelte/store';

export const courseMetaDeta = writable<{
  view: 'grid' | 'list';
}>({
  view: 'list'
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

export const saveTemplateModalInitialState = {
  open: false,
  id: '',
  title: '',
  name: '',
  mode: 'copy' as 'copy' | 'convert',
  isPublished: false,
  studentCount: 0
};

export const saveTemplateModal = writable({ ...saveTemplateModalInitialState });
