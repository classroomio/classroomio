import { writable } from 'svelte/store';

export const invitationModal = writable({
  open: false,
  tutors: '',
  students: '',
});

export const resetForm = () =>
  invitationModal.update(() => ({
    open: false,
    tutors: '',
    students: '',
  }));
