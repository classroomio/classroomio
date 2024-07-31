<script>
  import { afterUpdate } from 'svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';

  import CloseButton from '../Buttons/Close/index.svelte';
  import TextField from '../Form/TextField.svelte';

  export let open = false;
  export let backButton = false;
  export let buttonColor = '';
  export let buttonOnClick = () => {};
  export let onClose = () => {};
  export let modalHeading = '';
  export let headerClass = '';
  export let labelClass = '';
  export let width = '';
  export let maxWidth = '';
  export let containerClass = '';
  export let size = '';
  export let value = '';
  export let isCloseable = true;
  export let showSearchBar = false;

  afterUpdate(() => {
    if (open) {
      if (!document) return;
      document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    } else {
      if (!document) return;
      document.getElementsByTagName('body')[0].style.overflow = 'auto';
    }
  });
</script>

{#if open}
  <div
    class="dialog fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-100 bg-opacity-50"
    on:click={onClose}
    role="presentation"
  >
    <div aria-hidden="true" class="backdrop" />
    <div
      class="{maxWidth || 'container'} {size === 'sm'
        ? 'small'
        : ''} mx-auto bg-white dark:bg-neutral-800 {width} rounded-md pt-2 shadow-lg"
      on:click={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div
        class="flex flex-wrap gap-3 md:gap-0 items-center justify-end md:justify-between border border-l-0 border-r-0 border-t-0 border-gray-100 dark:border-neutral-600 p-4 px-5 {headerClass}"
      >
        <div class="flex items-center gap-3">
          {#if backButton}
            <button
              type="button"
              on:click={buttonOnClick}
              class="p-2 hover:bg-gray-100 rounded-full transition-all duration-300"
            >
              <ArrowLeft color={buttonColor} />
            </button>
          {/if}
          <p class="text-md m-0 font-medium dark:text-white {labelClass}">
            {modalHeading}
          </p>
        </div>

        <div class="flex items-center gap-5">
          <!-- an option for modals with search inputs in the design -->
          {#if showSearchBar}
            <TextField onKeyDown={(e) => (value = e.target.value)} showSearchBar={true} />
          {/if}
          {#if isCloseable}
            <div class="rounded-full">
              <CloseButton onClick={onClose} contained={true} size="small" />
            </div>
          {/if}
        </div>
      </div>

      <div class="body h-4/5 overflow-y-auto p-6 {containerClass}">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .container {
    max-width: 1000px;
  }
  .body {
    max-height: 60vh;
  }

  .small {
    max-width: 388px;
  }
</style>
