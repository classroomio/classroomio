<script lang="ts">
  import { Add, Subtract } from 'carbon-icons-svelte';
  interface Props {
    title?: string;
    content?: string;
  }

  let { title = '', content = '' }: Props = $props();

  let isOpen = $state(false);
  let contentHeight = $state('0px'); // Track the height of the content
  let contentRef: HTMLDivElement | undefined = $state(); // Reference to the content div

  function toggleAccordion() {
    isOpen = !isOpen;
    if (isOpen && contentRef) {
      // Measure and set the height when opening
      contentHeight = `${contentRef.scrollHeight}px`;
    } else {
      // Set to 0 height when closing
      contentHeight = '0px';
    }
  }
</script>

<div
  class="mx-6 shadow-[0px_3px_#282828] transition bg-white text-black overflow-hidden rounded-3xl"
>
  <button
    class="relative flex justify-between items-center w-full cursor-pointer overflow-hidden p-6 bg-inherit"
    onclick={toggleAccordion}
  >
    <p class="font-semibold text-lg">{title}</p>

    <div class="flex items-center justify-center p-[2px] bg-white text-black">
      {#if isOpen}
        <Subtract class="text-xl transition-transform duration-200 ease-in" />
      {:else}
        <Add class="text-xl transition-transform duration-200 ease-in" />
      {/if}
    </div>
    {#if isOpen}
      <div class="flex items-center justify-center absolute left-[2%] bottom-0 w-[96%] mx-auto">
        <svg class="w-full h-2" viewBox="0 0 360 10" preserveAspectRatio="none">
          <line
            x1="0"
            y1="5"
            x2="360"
            y2="5"
            stroke="#656565"
            stroke-width="2"
            stroke-dasharray="2, 5"
          />
        </svg>
      </div>
    {/if}
  </button>

  <div
    bind:this={contentRef}
    style="max-height: {contentHeight}; transition: max-height 0.3s ease-in-out; overflow: hidden;"
    class="rounded-3xl"
  >
    <div class=" p-4 bg-inherit rounded-b rounded-3xl">
      <p>
        {content}
      </p>
    </div>
  </div>
</div>
