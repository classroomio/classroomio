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
  class="hover:dark:bg-[#282828] space-y-2 shadow-md bg-white dark:bg-inherit border dark:border-[#282828] rounded"
>
  <!-- Accordion Header -->
  <div
    class="flex justify-between items-center cursor-pointer p-4 bg-white dark:bg-inherit rounded"
    on:click={toggleAccordion}
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
    class={`transition-max-height duration-300 ease-in-out overflow-hidden ${
      isOpen ? 'max-h-40' : 'max-h-0'
    }`}
  >
    <div class="p-4 bg-white dark:bg-inherit rounded-b">
      <p>
        {content}
      </p>
    </div>
  </div>
</div>
