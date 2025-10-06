<script lang="ts">
  import TextChip from '$lib/components/Chip/Text.svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    tabs?: {
      icon?: any;
      label: string;
      value: string | number;
      badgeValue?: number;
    }[];
    currentTab: string | number;
    onChange?: any;
    content?: import('svelte').Snippet;
  }

  let {
    tabs = [],
    currentTab,
    onChange = (v: string | number) => () => {},
    content
  }: Props = $props();
</script>

<div class="flex w-full flex-col">
  <div class="mb-2 flex w-full items-center overflow-x-auto border-b">
    {#each tabs as tab}
      {#if !tab.icon && !tab.badgeValue}
        <button
          class="relative {currentTab === tab.value
            ? 'text-primary-700'
            : 'dark:bg-gray-500 dark:text-white'} mr-4 w-fit px-2 py-3 text-center font-semibold focus:outline-none dark:bg-transparent"
          onclick={onChange(tab.value)}
        >
          <div class="flex w-full items-center justify-center text-center">
            {$t(tab.label)}
          </div>
          <span
            class="bg-primary-700 absolute bottom-0 left-0 h-[2px] transition-all duration-500 ease-in-out {currentTab ===
            tab.value
              ? 'w-full'
              : 'w-0'}"
          ></span>
        </button>
      {:else}
        <button
          class="relative {currentTab === tab.value
            ? 'text-primary-700'
            : 'dark:bg-gray-500 dark:text-white'} mr-8 w-24 px-2 py-3 text-left font-semibold focus:outline-none dark:bg-transparent"
          onclick={onChange(tab.value)}
        >
          <div class="grid grid-cols-5 items-center gap-5 md:grid-cols-4 md:gap-3">
            {#if tab.icon}
              <tab.icon />
            {/if}
            {$t(tab.label)}
            {#if typeof tab.badgeValue === 'number'}
              <TextChip
                value={`${tab.badgeValue}`}
                size="sm"
                shape="rounded-full"
                className="bg-gray-300 dark:text-black text-xs absolute -right-2 px-2"
              />
            {/if}
          </div>
          <span
            class="bg-primary-700 absolute bottom-0 left-0 h-[2px] transition-all duration-500 ease-in-out {currentTab ===
            tab.value
              ? 'w-full'
              : 'w-0'}"
          ></span>
        </button>
      {/if}
    {/each}
  </div>

  <div class="mt-5">
    {@render content?.()}
  </div>
</div>
