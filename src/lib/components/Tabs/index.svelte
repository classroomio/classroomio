<script>
  import TextChip from '$lib/components/Chip/Text.svelte';

  export let tabs = [];
  export let currentTab;
  export let onChange;
</script>

<div class="w-full flex flex-col">
  <div class="flex items-center border-b-2 w-full overflow-x-auto">
    {#each tabs as tab}
      {#if !tab.icon && !tab.badgeValue}
        <button
          class="relative {currentTab === tab.value
            ? 'text-primary-700'
            : 'dark:bg-gray-500 dark:text-white'} dark:bg-transparent font-semibold focus:outline-none w-fit mr-8 text-center py-3"
          on:click={onChange(tab.value)}
        >
          <div class="flex items-center justify-center w-full text-center">
            {tab.label}
          </div>
          <span
            class="absolute bottom-0 left-0 h-1 bg-primary-700 transition-all ease-in-out duration-500 {currentTab ===
            tab.value
              ? 'w-full'
              : 'w-0'}"
          />
        </button>
      {:else}
        <button
          class="relative {currentTab === tab.value
            ? 'text-primary-700'
            : 'dark:bg-gray-500 dark:text-white'} dark:bg-transparent font-semibold focus:outline-none w-24 text-left py-3 mr-10"
          on:click={onChange(tab.value)}
        >
          <div class="grid grid-cols-5 md:grid-cols-4 gap-5 md:gap-3 items-center">
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
            class="absolute bottom-0 left-0 h-1 bg-primary-700 transition-all ease-in-out duration-500 {currentTab ===
            tab.value
              ? 'w-full'
              : 'w-0'}"
          />
        </button>
      {/if}
    {/each}
  </div>

  <div class="mt-4">
    <slot name="content" />
  </div>
</div>
