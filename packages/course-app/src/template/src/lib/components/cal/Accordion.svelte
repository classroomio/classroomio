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
  class="mx-6 overflow-hidden rounded-3xl bg-white text-black shadow-[0px_3px_#282828] transition"
>
  <button
    class="relative flex w-full cursor-pointer items-center justify-between overflow-hidden bg-inherit p-6"
    onclick={toggleAccordion}
  >
    <p class="text-lg font-semibold">{title}</p>

    <div class="flex items-center justify-center bg-white p-[2px] text-black">
      {#if isOpen}
        <Subtract class="text-xl transition-transform duration-200 ease-in" />
      {:else}
        <Add class="text-xl transition-transform duration-200 ease-in" />
      {/if}
    </div>
    {#if isOpen}
      <div class="absolute bottom-0 left-[2%] mx-auto flex w-[96%] items-center justify-center">
        <svg class="h-2 w-full" viewBox="0 0 360 10" preserveAspectRatio="none">
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
    <div class="rounded-3xl rounded-b bg-inherit p-4">
      <p>
        {content}
      </p>
    </div>
  </div>
</div>
