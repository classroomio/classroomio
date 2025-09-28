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
  class="hover:bg-[#282828] text-white space-y-2 shadow-md bg-[#282828] {isOpen
    ? 'bg-[#282828]'
    : 'bg-inherit'} border border-[#282828] rounded"
>
  <!-- Accordion Header -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex justify-between items-center cursor-pointer p-4 bg-inherit rounded"
    onclick={toggleAccordion}
  >
    <p class="font-semibold text-lg">{title}</p>
    <!-- Icon changes based on the state -->
    <div class="flex items-center justify-center p-[2px] bg-[#232429]">
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
    <div class="p-4 bg-inherit rounded-b">
      <p>
        {content}
      </p>
    </div>
  </div>
</div>
