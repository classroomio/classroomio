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
  success(message = 'Success') {
    snackbarStore.update((store) => {
      store.open = true;
      store.message = message;
      store.severity = SNACKBAR_SEVERITY.SUCCESS;

      return store;
    });
  },
  error(message = 'Something went wrong - Please try later') {
    snackbarStore.update((store) => {
      store.open = true;
      store.message = message;
      store.severity = SNACKBAR_SEVERITY.ERROR;

      return store;
    });
  },
  info(message = 'Update') {
    snackbarStore.update((store) => {
      store.open = true;
      store.message = message;
      store.severity = SNACKBAR_SEVERITY.INFO;

      return store;
    });
  }
};
