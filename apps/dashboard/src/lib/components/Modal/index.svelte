<script lang="ts">
  import CloseButton from '../Buttons/Close/index.svelte';

  interface Props {
    open?: boolean;
    onClose?: any;
    modalHeading?: string;
    headerClass?: string;
    labelClass?: string;
    width?: string;
    maxWidth?: string;
    containerClass?: string;
    size?: string;
    isCloseable?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    open = $bindable(false),
    onClose = () => {},
    modalHeading = '',
    headerClass = '',
    labelClass = '',
    width = '',
    maxWidth = '',
    containerClass = '',
    size = '',
    isCloseable = true,
    children
  }: Props = $props();

  $effect(() => {
    if (open) {
      document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    } else {
      document.getElementsByTagName('body')[0].style.overflow = 'auto';
    }
  });
</script>

{#if open}
  <div
    class="dialog fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-100 bg-opacity-50"
    onclick={onClose}
    role="presentation"
  >
    <div aria-hidden="true" class="backdrop"></div>
    <div
      class="{maxWidth || 'container'} {size === 'sm'
        ? 'small'
        : ''} mx-auto bg-white dark:bg-neutral-800 {width} rounded-md pt-2 shadow-lg"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div
        class="{headerClass} flex items-center justify-between border border-l-0 border-r-0 border-t-0 border-gray-100 p-4 px-5 dark:border-neutral-600"
      >
        <p class="text-md m-0 font-medium dark:text-white {labelClass}">
          {modalHeading}
        </p>
        {#if isCloseable}
          <div class="rounded-full">
            <CloseButton onClick={onClose} contained={true} />
          </div>
        {/if}
      </div>

      <div class="body h-4/5 overflow-y-auto p-6 {containerClass}">
        {@render children?.()}
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
  /* .body {
    max-height: 60vh;
  } */

  .small {
    max-width: 388px;
  }
</style>
