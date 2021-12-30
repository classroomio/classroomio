<script>
  import { afterUpdate } from 'svelte';
  import CloseButton from '../Buttons/Close/index.svelte';

  export let open = false;
  export let onClose = () => {};
  export let modalHeading = '';
  export let width = '';
  export let maxWidth = '';
  export let containerClass = '';

  afterUpdate(() => {
    if (open) {
      document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    } else {
      document.getElementsByTagName('body')[0].style.overflow = 'auto';
    }
  });
</script>

{#if open}
  <div
    class="dialog fixed overflow-x-hidden overflow-y-auto inset-0 flex justify-center items-center z-50 bg-gray-100 bg-opacity-50"
    on:click={onClose}
  >
    <div aria-hidden="true" class="backdrop" />
    <div
      class="{maxWidth ||
        'container'} bg-white mx-auto {width} shadow-lg p-5 pt-2 rounded-md"
      on:click={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl m-0">
          {modalHeading}
        </h3>
        <CloseButton onClick={onClose} contained={true} />
      </div>

      <div class="body h-4/5 overflow-y-auto {containerClass}">
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
</style>
