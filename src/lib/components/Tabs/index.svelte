<script>
  import { Video, Notebook, PresentationFile } from 'carbon-icons-svelte';
  export let tabs = [];
  export let currentTab;
  export let onChange;
</script>

<div class="w-full flex flex-col">
  <div class="flex items-center border-b-2 w-full">
    {#each tabs as tab}
      <button
        class="relative {currentTab === tab.value
          ? 'text-blue-500 dark:bg-gray-700'
          : 'dark:bg-gray-500 text-black'} font-semibold focus:outline-none w-16 text-left py-3 mr-10"
        on:click={onChange(tab.value)}
      >
        {#if tab.value === 1}
          <div class="grid grid-cols-3 gap-4 items-center">
            <Notebook />
            {tab.label}
          </div>
        {:else if tab.value === 2}
          <div class="grid grid-cols-3 gap-4 items-center">
            <PresentationFile />
            {tab.label}
          </div>
        {:else}
          <div class="grid grid-cols-3 gap-4 items-center">
            <Video />
            {tab.label}
          </div>
        {/if}
        <!-- {tab.label} -->
        <!-- {#if typeof tab.badgeValue === 'number'}
          <Chip value={tab.badgeValue} className="ml-1 bg-gray-300 dark:text-black" />
        {/if} -->

        <span
          class="absolute w-full bottom-0 left-0 h-1 bg-blue-500 rounded-md transition-all ease-in-out duration-500 {currentTab ===
          tab.value
            ? 'w-full'
            : 'w-0'}"
        />
      </button>
    {/each}
  </div>

  <div class="mt-4">
    <slot name="content" />
  </div>
</div>
