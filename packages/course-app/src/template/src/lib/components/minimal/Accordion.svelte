<script lang="ts">
  import { Add, Subtract } from 'carbon-icons-svelte';
  interface Props {
    title?: string;
    content?: string;
  }

  let { title = '', content = '' }: Props = $props();

  let isOpen = $state(false);
  let contentHeight = $state('0px'); // Track the height of the content
  let contentRef: HTMLDivElement | undefined; // Reference to the content div

  function toggleAccordion() {
    isOpen = !isOpen;

    if (isOpen) {
      // Measure and set the height when opening
      if (contentRef) {
        contentHeight = `${contentRef.scrollHeight}px`;
      }
    } else {
      // Set to 0 height when closing
      contentHeight = '0px';
    }
  }
</script>

<div class="space-y-2 shadow-md bg-white">
  <!-- Accordion Header -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex justify-between items-center cursor-pointer p-4 bg-white rounded"
    onclick={toggleAccordion}
  >
    <p class="font-semibold text-lg">{title}</p>
    {#if isOpen}
      <Subtract class="text-xl transition-transform duration-200 ease-in" />
    {:else}
      <Add class="text-xl transition-transform duration-200 ease-in" />
    {/if}
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
