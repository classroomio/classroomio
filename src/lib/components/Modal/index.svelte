<script>
  import { afterUpdate } from 'svelte';
  import CloseButton from '../Buttons/Close/index.svelte';

  export let open = false;
  export let onClose = () => {};
  export let modalHeading = '';
  export let width = '';
  export let maxWidth = '';
  export let containerClass = '';
  export let size = '';

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
    class="dialog fixed overflow-x-hidden overflow-y-auto inset-0 flex justify-center items-center z-50 bg-gray-100 bg-opacity-50"
    on:click={onClose}
    role="presentation"
  >
    <div aria-hidden="true" class="backdrop" />
    <div
      class="{maxWidth || 'container'} {size === 'sm'
        ? 'small'
        : ''} bg-white dark:bg-black mx-auto {width} shadow-lg p-5 pt-2 rounded-md"
      on:click={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="dark:text-white text-xl m-0">
          {modalHeading}
        </h3>
        <div class="rounded-full">
          <CloseButton onClick={onClose} contained={true} size="small" />
        </div>
      </div>

      <div class="body p-1 h-4/5 overflow-y-auto {containerClass}">
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
