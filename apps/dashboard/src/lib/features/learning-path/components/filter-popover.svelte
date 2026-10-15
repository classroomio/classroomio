<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import SlidersIcon from '@lucide/svelte/icons/sliders-horizontal';
  import type { FilterGroup, FilterOption } from '../utils/types';

  interface Props {
    groups: FilterGroup[];
    selected: Record<string, string>;
    onChange?: (groupId: string, value: string) => void;
  }

  let { groups, selected, onChange }: Props = $props();

  const activeFilterCount = $derived(groups.filter((group) => selected[group.id] !== group.options[0]?.value).length);

  function clearFilters() {
    for (const group of groups) {
      onChange?.(group.id, group.options[0]?.value ?? '');
    }
  }
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        type="button"
        class="ui:border-border ui:bg-background ui:text-foreground ui:hover:bg-muted ui:focus-visible:ring-primary/40 relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label={$t('learningPath.toolbar.filters')}
      >
        <SlidersIcon class="size-3.5 shrink-0" />
        <span class="hidden sm:inline">{$t('learningPath.toolbar.filters')}</span>
        {#if activeFilterCount > 0}
          <span
            class="ui:bg-primary ui:text-primary-foreground inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-0.5 text-[10px] leading-none font-semibold"
          >
            {activeFilterCount}
          </span>
        {/if}
      </button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content class="w-80" align="start">
    <div class="flex items-center justify-between border-b pb-2">
      <span class="text-sm font-semibold">{$t('learningPath.toolbar.filters')}</span>
      {#if activeFilterCount > 0}
        <button type="button" class="ui:text-primary text-xs hover:underline" onclick={clearFilters}>
          {$t('learningPath.toolbar.clear_all')}
        </button>
      {/if}
    </div>

    <div class="mt-3 space-y-4">
      {#each groups as group (group.id)}
        <div>
          <p class="ui:text-muted-foreground mb-2 text-xs font-medium">{group.label}</p>
          <div class="flex flex-wrap gap-2">
            {#each group.options as option (option.value)}
              <button
                type="button"
                onclick={() => onChange?.(group.id, option.value)}
                class={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  selected[group.id] === option.value
                    ? 'ui:border-primary/40 ui:bg-primary/10 ui:text-primary'
                    : 'ui:text-muted-foreground ui:hover:border-primary/40 ui:hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>
