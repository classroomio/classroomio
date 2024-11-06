<!-- <script lang="ts">
  import { Add, Subtract } from 'carbon-icons-svelte'; 
  export let title = '';
  export let content = '';
  let isOpen = false; 
  function toggleAccordion() {
    isOpen = !isOpen;
  }
</script>

<div class="space-y-2 shadow-md bg-white">
  
  <div
    class="flex justify-between items-center cursor-pointer p-4 bg-white rounded"
    on:click={toggleAccordion}
  >
    <p class="font-semibold text-lg">{title}</p>
    
    {#if isOpen}
      <Subtract class="text-xl transition-transform duration-200 ease-in" />
    {:else}
      <Add class="text-xl transition-transform duration-200 ease-in" />
    {/if}
  </div>

  
  <div
    class={`transition-max-height duration-300 ease-in-out overflow-hidden ${
      isOpen ? 'max-h-60' : 'max-h-0'
    }`}
  >
    <div class="p-4 bg-white rounded-b">
      <p>
        {content}
      </p>
    </div>
  </div>
</div> -->

<script lang="ts">
  import { Add, Subtract } from 'carbon-icons-svelte';
  export let title = '';
  export let content = '';

  let isOpen = false;
  let contentHeight = '0px'; // Track the height of the content
  let contentRef: HTMLDivElement; // Reference to the content div

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
    on:click={toggleAccordion}
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
