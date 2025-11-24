<script lang="ts">
  import * as Tabs from '@cio/ui/base/tabs';
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
    onChange?: (value: string | number) => void;
    content?: import('svelte').Snippet;
  }

  let { tabs = [], currentTab = $bindable(), onChange = (_v: string | number) => {}, content }: Props = $props();

  function handleValueChange(newValue: string) {
    currentTab = newValue;
    onChange(newValue);
  }
</script>

<Tabs.Root value={String(currentTab)} onValueChange={handleValueChange} class="flex w-full flex-col">
  <Tabs.List
    class="mb-2 flex h-auto w-full items-center justify-start overflow-x-auto rounded-none border-b bg-transparent p-0"
  >
    {#each tabs as tab}
      <Tabs.Trigger
        value={String(tab.value)}
        class="data-[state=active]:border-primary-700 data-[state=active]:text-primary-700 relative mr-4 w-fit rounded-none border-b-2 border-transparent px-2 py-3
          text-center font-semibold data-[state=active]:bg-transparent
          dark:data-[state=inactive]:text-white"
      >
        <div class="flex items-center gap-1 {tab.icon || tab.badgeValue ? 'justify-start' : 'justify-center'}">
          {#if tab.icon}
            <svelte:component this={tab.icon} size={16} />
          {/if}
          {$t(tab.label)}
          {#if typeof tab.badgeValue === 'number'}
            <TextChip
              value={`${tab.badgeValue}`}
              size="sm"
              shape="rounded-full"
              className="absolute -right-2 bg-gray-300 px-2 text-xs dark:text-black"
            />
          {/if}
        </div>
      </Tabs.Trigger>
    {/each}
  </Tabs.List>

  <Tabs.Content value={String(currentTab)} class="mt-5">
    {@render content?.()}
  </Tabs.Content>
</Tabs.Root>
