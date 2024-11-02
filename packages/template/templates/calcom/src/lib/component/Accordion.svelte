<script lang="ts">
  import { Add, Subtract } from 'carbon-icons-svelte';
  export let title = '';
  export let content = '';
  let isOpen = false;
  function toggleAccordion() {
    isOpen = !isOpen;
  }
</script>

<div
  class=" shadow-[0px_3px_#282828] transition {isOpen
    ? 'bg-[#141414] text-white'
    : 'bg-white text-black'} overflow-hidden rounded-3xl"
>
  <!-- Accordion Header -->
  <div
    class="relative flex justify-between items-center cursor-pointer overflow-hidden mx-6 p-6
      bg-inherit
      "
    on:click={toggleAccordion}
  >
    <p class="font-semibold text-lg">{title}</p>
    <!-- Icon changes based on the state -->
    <div
      class="flex items-center justify-center p-[2px] {isOpen
        ? 'bg-[#282828] text-white'
        : 'bg-white text-black'} "
    >
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
            stroke-dasharray="6, 5"
          />
        </svg>
      </div>
    {/if}
  </div>

  <!-- Accordion Content -->
  <div
    class={` rounded-3xl transition-max-height duration-300 ease-in-out overflow-hidden ${
      isOpen ? 'max-h-40' : 'max-h-0'
    }`}
  >
    <div class="mx-6 p-4 bg-inherit rounded-b rounded-3xl">
      <p>
        {content}
      </p>
    </div>
  </div>
</div>
