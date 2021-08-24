import { writable } from 'svelte/store';

export const invitationModal = writable({
  open: false,
  tutors: '',
  students: '',
});
