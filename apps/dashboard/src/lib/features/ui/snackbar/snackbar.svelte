<script lang="ts">
  import { Toaster, toast } from '@cio/ui/base/sonner';
  import { SNACKBAR_SEVERITY } from './constants';
  import { snackbarStore, snackbarStoreInitialState } from './store';
  import { t } from '$lib/utils/functions/translations';

  function handleClose() {
    if (typeof $snackbarStore.handleClose === 'function') {
      $snackbarStore.handleClose();
    }

    snackbarStore.update((_s) => ({
      ..._s,
      ...snackbarStoreInitialState
    }));
  }

  function showToast() {
    const message = $t($snackbarStore.message);
    const { autoHideDuration, id, severity } = $snackbarStore;

    const options = {
      duration: autoHideDuration || 5000,
      onDismiss: handleClose,
      onAutoClose: handleClose,
      // Reusing an id swaps that toast's content instead of stacking a new one.
      ...(id ? { id } : {})
    };

    if (severity === SNACKBAR_SEVERITY.LOADING) {
      // Sonner draws the spinner; it stays until the caller resolves this id.
      toast.loading(message, options);
    } else if (severity === SNACKBAR_SEVERITY.SUCCESS) {
      toast.success(message, options);
    } else if (severity === SNACKBAR_SEVERITY.ERROR) {
      toast.error(message, options);
    } else {
      toast.info(message, options);
    }
  }

  $effect(() => {
    if ($snackbarStore.open) {
      showToast();
    }
  });
</script>

<Toaster position="top-right" class="!left-auto" closeButton />
