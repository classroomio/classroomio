import { writable } from 'svelte/store';
import { SNACKBAR_SEVERITY } from './constants';

export const snackbarStoreInitialState = {
  open: false,
  message: '',
  severity: SNACKBAR_SEVERITY.DEFAULT,
  handleClose: () => {},
  autoHideDuration: 6000
};

export const snackbarStore = writable({ ...snackbarStoreInitialState });

export const snackbar = {
  success(message = 'snackbar.success') {
    snackbarStore.update((store) => {
      store.open = true;
      store.message = message;
      store.severity = SNACKBAR_SEVERITY.SUCCESS;

      return store;
    });
  },
  error(message = 'snackbar.something') {
    snackbarStore.update((store) => {
      store.open = true;
      store.message = message;
      store.severity = SNACKBAR_SEVERITY.ERROR;

      return store;
    });
  },
  info(message = 'snackbar.updates') {
    snackbarStore.update((store) => {
      store.open = true;
      store.message = message;
      store.severity = SNACKBAR_SEVERITY.INFO;

      return store;
    });
  }
};
