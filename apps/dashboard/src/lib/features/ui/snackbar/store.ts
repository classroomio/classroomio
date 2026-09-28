import { SNACKBAR_SEVERITY } from './constants';
import { writable } from 'svelte/store';

export type SnackbarAction = {
  label: string;
  onClick: () => void;
};

export const snackbarStoreInitialState = {
  open: false,
  message: '',
  severity: SNACKBAR_SEVERITY.DEFAULT,
  handleClose: () => {},
  autoHideDuration: 6000,
  /** When set, the toast replaces the one already holding this id. */
  id: undefined as string | undefined,
  action: undefined as SnackbarAction | undefined
};

export const snackbarStore = writable({ ...snackbarStoreInitialState });

function show(message: string, severity: string, id?: string, autoHideDuration?: number, action?: SnackbarAction) {
  snackbarStore.update((store) => {
    store.open = true;
    store.message = message;
    store.severity = severity;
    store.id = id;
    store.autoHideDuration = autoHideDuration ?? snackbarStoreInitialState.autoHideDuration;
    store.action = action;

    return store;
  });
}

let loadingToastCount = 0;

export const snackbar = {
  success(message = 'snackbar.success', id?: string, action?: SnackbarAction) {
    show(message, SNACKBAR_SEVERITY.SUCCESS, id, undefined, action);
  },
  error(message = 'snackbar.something', id?: string) {
    show(message, SNACKBAR_SEVERITY.ERROR, id);
  },
  info(message = 'snackbar.updates', id?: string) {
    show(message, SNACKBAR_SEVERITY.INFO, id);
  },
  /**
   * A toast with a spinner that stays open until the caller resolves it.
   *
   * Returns an id to pass back to `success`/`error`, which swaps that toast's
   * content in place — so long-running work reports its outcome where the user
   * was already watching, instead of stacking a second toast beside it.
   */
  loading(message: string): string {
    const id = `snackbar-loading-${(loadingToastCount += 1)}`;
    show(message, SNACKBAR_SEVERITY.LOADING, id, Number.POSITIVE_INFINITY);

    return id;
  }
};
