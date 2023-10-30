<script lang="ts">
  import { fly } from 'svelte/transition';
  import InformationIcon from 'carbon-icons-svelte/lib/Information.svelte';
  import WarningIcon from 'carbon-icons-svelte/lib/Warning.svelte';
  import CheckmarkOutline24 from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';

  import CloseButton from '../Buttons/Close/index.svelte';
  import { SNACKBAR_SEVERITY, SNACKBAR_SEVERITY_COLOR } from './constants';
  import { snackbarStore, snackbarStoreInitialState } from './store';

  let severityColor: string;
  let timeoutId: NodeJS.Timeout | undefined;

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
          <CheckmarkOutline24 size={24} class="carbon-icon dark:text-white" />
        {:else if $snackbarStore.severity === SNACKBAR_SEVERITY.WARNING}
          <WarningIcon size={24} class="carbon-icon dark:text-white" />
        {:else}
          <InformationIcon size={24} class="carbon-icon dark:text-white" />
        {/if}
        <p class="dark:text-white ml-2 text-lg">{$snackbarStore.message}</p>
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
