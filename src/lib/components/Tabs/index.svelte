<script>
  import Chip from '../Chip/index.svelte';
  export let tabs = [];
  export let currentTab;
  export let onChange;
</script>

<div class="w-full flex flex-col">
  <div class="flex items-center">
    {#each tabs as tab}
      <button
        class="relative {currentTab === tab.value
          ? 'text-blue-500 font-semibold dark:bg-gray-700'
          : 'dark:bg-gray-500'} focus:outline-none w-32 text-left p-3"
        on:click={onChange(tab.value)}
      >
        {tab.label}
        <!-- {#if typeof tab.badgeValue === 'number'}
          <Chip value={tab.badgeValue} className="ml-1 bg-gray-300 dark:text-black" />
        {/if} -->

        {#if currentTab === tab.value}
          <span class="absolute w-2/4 bottom-0 left-0 h-1 bg-blue-500" />
        {/if}
      </button>
    {/each}
  </div>

  <div class="mt-4">
    <slot name="content" />
  </div>
</div>
