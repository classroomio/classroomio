<script>
  import { fly } from 'svelte/transition';
  import Information24 from 'carbon-icons-svelte/lib/Information24';
  import Warning24 from 'carbon-icons-svelte/lib/Warning24';
  import CheckmarkOutline24 from 'carbon-icons-svelte/lib/CheckmarkOutline24';

  import CloseButton from '../Buttons/Close/index.svelte';
  import { SNACKBAR_SEVERITY, SNACKBAR_SEVERITY_COLOR } from './constants';
  import { snackbarStore, snackbarStoreInitialState } from './store';

  let severityColor;

  function handleClose() {
    if (typeof $snackbarStore.handleClose === 'number') {
      $snackbarStore.handleClose();
    }

    snackbarStore.set(snackbarStoreInitialState);
  }

  // When open is true trigger autoHideDuration
  function handleOpen(open) {
    if (!open) {
      return;
    }

    const { autoHideDuration } = $snackbarStore;

    if (typeof autoHideDuration === 'number') {
      setTimeout(handleClose, autoHideDuration);
    }
  }

  $: handleOpen($snackbarStore.open);
  $: severityColor = SNACKBAR_SEVERITY_COLOR[$snackbarStore.severity];
</script>

{#if $snackbarStore.open}
  {#key $snackbarStore.message}
    <div
      transition:fly={{ x: 200, duration: 500 }}
      class="root text-white rounded-md flex justify-between items-center absolute {severityColor}"
    >
      <div class="flex items-center">
        {#if $snackbarStore.severity === SNACKBAR_SEVERITY.SUCCESS}
          <CheckmarkOutline24 class="carbon-icon" />
        {:else if $snackbarStore.severity === SNACKBAR_SEVERITY.WARNING}
          <Warning24 class="carbon-icon" />
        {:else}
          <Information24 class="carbon-icon" />
        {/if}
        <p class="ml-2 text-lg">{$snackbarStore.message}</p>
      </div>

      <CloseButton onClick={handleClose} contained={true} color="text-white" />
    </div>
  {/key}
{/if}

<style>
  .root {
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    right: 5%;
    left: auto;
    top: 24px;
    transform: translateX(-5%);
    min-width: 288px;
    padding: 6px 16px;
    flex-wrap: wrap;
    z-index: 51;
  }
</style>
