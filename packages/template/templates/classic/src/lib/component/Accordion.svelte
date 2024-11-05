<script lang="ts">
  import { Add, Subtract } from 'carbon-icons-svelte'; // Import the icons
  export let title = '';
  export let content = '';
  let isOpen = false; // State to track if the accordion is open or closed
  function toggleAccordion() {
    isOpen = !isOpen; // Toggle the accordion state
  }
</script>

<div class="space-y-2 shadow-md bg-white">
  <!-- Accordion Header -->
  <div
    class="flex justify-between items-center cursor-pointer p-4 bg-white rounded"
    on:click={toggleAccordion}
  >
    <p class="font-semibold text-lg max-w-[90%]">{title}</p>
    <!-- Icon changes based on the state -->
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
    class={`transition-max-height duration-300 ease-in-out overflow-hidden ${
      isOpen ? 'max-h-40' : 'max-h-0'
    }`}
  >
    <div class="p-4 bg-white rounded-b">
      <p>
        {content}
      </p>
    </div>
  </div>
</div>
