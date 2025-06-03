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

      contentHeight = `${contentRef?.scrollHeight}px`;
    } else {
      // Set to 0 height when closing
      contentHeight = '0px';
    }
  }
</script>

<div class="space-y-2 bg-white shadow-md">
  <!-- Accordion Header -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex cursor-pointer items-center justify-between rounded bg-white p-4"
    onclick={toggleAccordion}
  >
    <p class="text-lg font-semibold">{title}</p>
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
    <div class="rounded-b bg-white p-4">
      <p>{content}</p>
    </div>
  </div>
</div>
