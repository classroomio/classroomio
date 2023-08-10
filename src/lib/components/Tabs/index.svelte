<script>
  import TextChip from '$lib/components/Chip/Text.svelte';
  export let tabs = [];
  export let currentTab;
  export let onChange;
</script>

<div class="w-full flex flex-col">
  <div class="flex items-center border-b-2 w-full">
  <div class="flex items-center border-b-2 w-full">
    {#each tabs as tab}
      <button
        class="relative {currentTab === tab.value
          ? 'text-blue-500 dark:bg-gray-700'
          : 'dark:bg-gray-500 text-black'} font-semibold focus:outline-none w-24 text-left py-3 mr-10"
        on:click={onChange(tab.value)}
      >
        <div class="grid grid-cols-4 gap-3 items-center">
          {#if tab.icon}
            <svelte:component this={tab.icon} />
          {/if}
          {tab.label}
          {#if typeof tab.badgeValue === 'number'}
            <TextChip
              value={tab.badgeValue}
              size="sm"
              shape="rounded-full"
              className=" bg-gray-300 dark:text-black text-xs absolute right-0 px-2"
            />
          {/if}
        </div>

        <span
          class="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-md transition-all ease-in-out duration-500 {currentTab ===
          tab.value
            ? 'w-full'
            : 'w-0'}"
        />
        <span
          class="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-md transition-all ease-in-out duration-500 {currentTab ===
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
