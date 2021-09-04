import { writable } from 'svelte/store';
import { SNACKBAR_SEVERITY } from './constants';

export const snackbarStore = writable({
  open: false,
  message: '',
  severity: SNACKBAR_SEVERITY.DEFAULT,
  handleClose: () => {},
  autoHideDuration: 6000,
});
