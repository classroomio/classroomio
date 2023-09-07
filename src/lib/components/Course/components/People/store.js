import { writable } from 'svelte/store';

export const deleteMemberModal = writable({
  open: false
});

export const invitationModal = writable({
  open: false,
  students: ''
});

export const resetForm = () =>
  invitationModal.update(() => ({
    open: false,
    students: ''
  }));
