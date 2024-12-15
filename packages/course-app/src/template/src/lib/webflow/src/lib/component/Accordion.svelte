<script lang="ts">
  import { Add, Subtract } from 'carbon-icons-svelte';
  interface Props {
    title?: string;
    content?: string;
  }

  let { title = '', content = '' }: Props = $props();

  let isOpen = $state(false);
  let contentHeight = $state('0px'); // Track the height of the content
  let contentRef: HTMLDivElement = $state(); // Reference to the content div

  function toggleAccordion() {
    isOpen = !isOpen;
    if (isOpen) {
      // Measure and set the height when opening
      contentHeight = `${contentRef.scrollHeight}px`;
    } else {
      // Set to 0 height when closing
      contentHeight = '0px';
    }
  }
</script>

<div
  class="hover:dark:bg-[#282828] space-y-2 shadow-md bg-white dark:bg-inherit border dark:border-[#282828] rounded"
>
  <!-- Accordion Header -->
  <div
    class="flex justify-between items-center cursor-pointer p-4 bg-white dark:bg-inherit rounded"
    onclick={toggleAccordion}
  >
    <p class="font-semibold text-lg">{title}</p>
    <!-- Icon changes based on the state -->
    <div class="flex items-center justify-center p-[2px] dark:bg-[#232429]">
      {#if isOpen}
        <Subtract class="text-xl transition-transform duration-200 ease-in" />
      {:else}
        <Add class="text-xl transition-transform duration-200 ease-in" />
      {/if}
    </div>
  </div>

  <!-- Accordion Content -->
  <div
    bind:this={contentRef}
    style="max-height: {contentHeight}; transition: max-height 0.3s ease-in-out; overflow: hidden;"
  >
    <div class="p-4 bg-white dark:bg-inherit rounded-b">
      <p>
        {content}
      </p>
    </div>
  </div>
</div>
