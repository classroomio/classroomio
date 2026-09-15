import { writable } from 'svelte/store';

export const clonePathModalInitialState = {
  open: false,
  id: '',
  name: '',
  description: '',
  isSaving: false
};

export const clonePathModal = writable({ ...clonePathModalInitialState });
