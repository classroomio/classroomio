<script lang="ts">
  import { fly } from 'svelte/transition';
  import { InlineNotification } from 'carbon-components-svelte';
  import { capitalizeFirstLetter } from '$lib/utils/functions/string';

  import { SNACKBAR_SEVERITY } from './constants';
  import { snackbarStore, snackbarStoreInitialState } from './store';
  import { t } from '$lib/utils/functions/translations';

  let timeoutId: NodeJS.Timeout | undefined;
  let kind: 'error' | 'info' | 'info-square' | 'success' | 'warning' | 'warning-alt' = 'info';

  function handleClose() {
    if (typeof $snackbarStore.handleClose === 'function') {
      $snackbarStore.handleClose();
    }

    snackbarStore.update((_s) => ({
      ..._s,
      ...snackbarStoreInitialState
    }));
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }

  // When open is true trigger autoHideDuration
  function handleOpen(open: boolean) {
    if (!open) {
      return;
    }

    const { autoHideDuration } = $snackbarStore;

    if (typeof autoHideDuration === 'number' && !timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleClose, autoHideDuration);
    }
  }

  $: handleOpen($snackbarStore.open);
  $: kind =
    $snackbarStore.severity === SNACKBAR_SEVERITY.SUCCESS
      ? 'success'
      : $snackbarStore.severity === SNACKBAR_SEVERITY.ERROR
        ? 'error'
        : 'info';
</script>

{#if $snackbarStore.open}
  {#key $snackbarStore.message}
    <div transition:fly={{ x: 200, duration: 500 }} class="root absolute">
      <InlineNotification
        {kind}
        title={capitalizeFirstLetter(kind || '')}
        subtitle={$t($snackbarStore.message)}
        on:close={(e) => {
          e.preventDefault();
          handleClose();
        }}
      />
    </div>
  {/key}
{/if}

<style>
  .root {
    right: 5%;
    left: auto;
    top: 24px;
    transform: translateX(-5%);
    min-width: 288px;
    z-index: 51;
  }
</style>
