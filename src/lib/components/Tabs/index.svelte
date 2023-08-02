<script>
  import Chip from '../Chip/index.svelte';
  export let tabs = [];
  export let currentTab;
  export let onChange;
</script>

<div class="w-full flex flex-col">
  <div class="flex items-center justify-center">
    {#each tabs as tab}
      <button
        class="relative border-r-1 border-t-0 border-b-0 border-l-0 rounded-none {currentTab ===
        tab.value
          ? 'text-black font-bold bg-gray-100 dark:bg-gray-700'
          : 'bg-gray-200 dark:bg-gray-500 text-gray'} focus:outline-none w-40 text-left p-3"
        on:click={onChange(tab.value)}
      >
        {tab.label}
        {#if typeof tab.badgeValue === 'number'}
          <Chip value={tab.badgeValue} className="ml-1 bg-gray-300" />
        {/if}

        {#if currentTab === tab.value}
          <span class="absolute w-full top-0 left-0 h-1 bg-blue-500" />
        {/if}
      </button>
    {/each}
  </div>

  <div class="mt-4">
    <slot name="content" />
  </div>
</div>
