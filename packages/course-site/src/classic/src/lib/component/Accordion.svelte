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

<div class="space-y-2 shadow-md bg-white">
  <!-- Accordion Header -->
  <div
    class="flex justify-between items-center cursor-pointer p-4 bg-white rounded"
    onclick={toggleAccordion}
  >
    <p class="font-semibold text-lg max-w-[90%]">{title}</p>
    <div>
      {#if isOpen}
        <Subtract size={20} class="text-xl transition-transform duration-200 ease-in" />
      {:else}
        <Add size={20} class="text-xl transition-transform duration-200 ease-in" />
      {/if}
    </div>
  </div>

  <!-- Accordion Content -->
  <div
    bind:this={contentRef}
    style="max-height: {contentHeight}; transition: max-height 0.3s ease-in-out; overflow: hidden;"
  >
    <div class="p-4 bg-white rounded-b">
      <p>{content}</p>
    </div>
  </div>
</div>
