<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import { Badge } from '@cio/ui/base/badge';
  import { Button, buttonVariants } from '@cio/ui/base/button';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import { Search } from '@cio/ui/custom/search';
  import { cn } from '@cio/ui/tools';
  import { ZAPIER_APP_CATEGORIES } from '@cio/utils/constants/zapier';

  import type {
    ZapierDirectoryCategory,
    ZapierDirectoryCounts,
    ZapierDirectoryQuick
  } from '$features/automation/utils/types';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.directory';
  const CATEGORY_T = 'automation.zapier.catalog.categories';
  const QUICK_FILTERS: ZapierDirectoryQuick[] = ['all', 'popular', 'recent'];

  interface Props {
    query?: string;
    category: ZapierDirectoryCategory;
    quick: ZapierDirectoryQuick;
    counts: ZapierDirectoryCounts;
    onQuickChange: (quick: ZapierDirectoryQuick) => void;
    onCategoryChange: (category: ZapierDirectoryCategory) => void;
  }

  let { query = $bindable(''), category, quick, counts, onQuickChange, onCategoryChange }: Props = $props();

  let isFiltersOpen = $state(false);

  const categoryOptions = $derived(ZAPIER_APP_CATEGORIES.filter((key) => counts.categories[key] > 0));
  const activeFilterCount = $derived((category === 'all' ? 0 : 1) + (quick === 'all' ? 0 : 1));

  function getQuickCount(value: ZapierDirectoryQuick): number {
    if (value === 'popular') return counts.popular;
    if (value === 'recent') return counts.recent;

    return counts.all;
  }

  /** Discover and Categories behave as one selection: exactly one filter is active at a time. */
  function isQuickActive(value: ZapierDirectoryQuick): boolean {
    if (value === 'all') return quick === 'all' && category === 'all';

    return quick === value;
  }

  function selectQuick(value: ZapierDirectoryQuick) {
    onQuickChange(value);
    isFiltersOpen = false;
  }

  function selectCategory(value: ZapierDirectoryCategory) {
    onCategoryChange(value);
    isFiltersOpen = false;
  }
</script>

{#snippet filterRow(label: string, count: number, isActive: boolean, onSelect: () => void)}
  <Button
    variant="ghost"
    size="sm"
    class={cn(
      'ui:hover:bg-accent h-auto w-full justify-between gap-2 px-2 py-1.75 text-[13px] font-normal',
      isActive && 'ui:bg-accent font-semibold'
    )}
    aria-pressed={isActive}
    onclick={onSelect}
  >
    <span class="truncate">{label}</span>
    <span class="ui:text-muted-foreground text-[11.5px] tabular-nums">{count}</span>
  </Button>
{/snippet}

{#snippet filterGroups()}
  <div>
    <p class="ui:text-muted-foreground px-2 pb-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase">
      {$t(`${T}.discover`)}
    </p>
    {#each QUICK_FILTERS as value (value)}
      {@render filterRow(
        value === 'all' ? $t(`${T}.all_apps`) : value === 'popular' ? $t(`${T}.popular`) : $t(`${T}.recent`),
        getQuickCount(value),
        isQuickActive(value),
        () => selectQuick(value)
      )}
    {/each}
  </div>

  <div>
    <p class="ui:text-muted-foreground px-2 pb-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase">
      {$t(`${T}.categories`)}
    </p>
    {#each categoryOptions as key (key)}
      {@render filterRow($t(`${CATEGORY_T}.${key}`), counts.categories[key], category === key, () =>
        selectCategory(category === key ? 'all' : key)
      )}
    {/each}
  </div>
{/snippet}

<div class="flex flex-col gap-4">
  <Search
    bind:value={query}
    placeholder={$t(`${T}.search_placeholder`)}
    class="w-full max-w-none"
    data-testid="zapier-directory-search"
  />

  <div class="hidden flex-col gap-5 min-[860px]:flex">
    {@render filterGroups()}
  </div>

  <Collapsible.Root bind:open={isFiltersOpen} class="flex flex-col gap-3 min-[860px]:hidden">
    <Collapsible.Trigger class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-between')}>
      <span class="flex items-center gap-2">
        <FilterIcon size={16} class="custom" />
        {$t(`${T}.filters_title`)}
      </span>
      <span class="flex items-center gap-2">
        {#if activeFilterCount > 0}
          <Badge variant="secondary">{activeFilterCount}</Badge>
        {/if}
        <ChevronDownIcon size={16} class={cn('custom transition-transform', isFiltersOpen && 'rotate-180')} />
      </span>
    </Collapsible.Trigger>

    <Collapsible.Content class="flex flex-col gap-5">
      {@render filterGroups()}
    </Collapsible.Content>
  </Collapsible.Root>
</div>
