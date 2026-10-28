<script lang="ts">
  import { onDestroy } from 'svelte';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import { Button } from '@cio/ui/base/button';
  import * as Command from '@cio/ui/base/command';
  import * as Popover from '@cio/ui/base/popover';
  import { cn } from '@cio/ui/tools';
  import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import { t } from '$lib/utils/functions/translations';

  import type { InsightsCohortOption } from '../utils/types';

  interface Props {
    options: InsightsCohortOption[];
    total: number;
    matchTotal: number;
    search: string;
    selectedIds: string[];
    isDefault: boolean;
    loading: boolean;
    hasMore: boolean;
    failed: boolean;
    hasDirectStudents: boolean;
    onOpenChange: (open: boolean) => void;
    onSearch: (search: string) => void;
    onLoadMore: () => void;
    onChange: (ids: string[] | null) => void;
  }

  let {
    options,
    total,
    matchTotal,
    search: appliedSearch,
    selectedIds,
    isDefault,
    loading,
    hasMore,
    failed,
    hasDirectStudents,
    onOpenChange,
    onSearch,
    onLoadMore,
    onChange
  }: Props = $props();

  let isOpen = $state(false);

  const search = new DebouncedSearch({
    delayMs: 300,
    onApply: (value) => onSearch(value)
  });

  const selectedSet = $derived(new Set(selectedIds));
  const selectableOptions = $derived(options.filter((cohort) => cohort.students !== 0));
  const selectedCount = $derived(selectedIds.length);
  const showEmpty = $derived(!loading && options.length === 0);
  const selectLabelKey = $derived(
    !loading && !hasMore && options.length > 0 && !appliedSearch
      ? 'insights.cohorts.select_all'
      : 'insights.cohorts.select_shown'
  );

  onDestroy(() => search.destroy());

  $effect(() => {
    search.sync(appliedSearch);
  });

  function handleOpenChange(open: boolean) {
    isOpen = open;
    onOpenChange(open);
  }

  function toggle(cohortId: string) {
    const next = selectedSet.has(cohortId) ? selectedIds.filter((id) => id !== cohortId) : [...selectedIds, cohortId];

    onChange(next);
  }

  function selectShown() {
    onChange(selectableOptions.map((cohort) => cohort.id));
  }

  function clear() {
    onChange([]);
  }

  function reset() {
    onChange(null);
  }

  function handleSearchInput() {
    search.input(search.draft);
  }

  function retry() {
    onOpenChange(true);
  }
</script>

<Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        size="sm"
        class="justify-between gap-2"
        testId="insights-cohort-picker"
        aria-busy={loading}
      >
        <span class="truncate">
          {$t('insights.cohorts.picker', { selected: selectedCount, total })}
        </span>
        <ChevronsUpDownIcon class="size-4 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-[360px] p-0" align="end">
    <Command.Root shouldFilter={false}>
      <Command.Input
        placeholder={$t('insights.cohorts.search')}
        bind:value={search.draft}
        oninput={handleSearchInput}
      />
      <Command.List>
        {#if loading && options.length === 0}
          <Command.Item value="__loading" disabled>{$t('insights.cohorts.loading')}</Command.Item>
        {:else if failed && options.length === 0}
          <Command.Item value="__failed" disabled>{$t('insights.cohorts.load_failed')}</Command.Item>
        {:else if showEmpty}
          <Command.Empty>{$t('insights.cohorts.empty')}</Command.Empty>
        {/if}
        {#each options as cohort (cohort.id)}
          <Command.Item
            value={`${cohort.name} ${cohort.id}`}
            onSelect={() => toggle(cohort.id)}
            disabled={cohort.students === 0}
            aria-checked={selectedSet.has(cohort.id)}
          >
            <span
              class={cn(
                'ui:border-input flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                selectedSet.has(cohort.id) && 'ui:border-primary ui:bg-primary'
              )}
            >
              {#if selectedSet.has(cohort.id)}
                <CheckIcon class="custom ui:text-primary-foreground size-3" />
              {/if}
            </span>
            <span class="min-w-0 flex-1 truncate">{cohort.name}</span>
            {#if cohort.students !== null}
              <span class="ui:text-muted-foreground text-xs">
                {cohort.students === 0
                  ? $t('insights.cohorts.no_students')
                  : $t('insights.cohorts.students', { count: cohort.students })}
              </span>
            {/if}
          </Command.Item>
        {/each}
      </Command.List>
    </Command.Root>
    {#if hasMore || failed}
      <div class="ui:border-border flex items-center justify-between gap-2 border-t px-3 py-2">
        <span class="ui:text-muted-foreground text-xs">
          {failed
            ? $t('insights.cohorts.load_failed')
            : $t('insights.cohorts.showing_matches', { shown: options.length, total: matchTotal })}
        </span>
        {#if hasMore}
          <Button variant="ghost" size="sm" disabled={loading} onclick={onLoadMore}>
            {$t('insights.cohorts.load_more')}
          </Button>
        {:else}
          <Button variant="ghost" size="sm" onclick={retry}>{$t('insights.retry')}</Button>
        {/if}
      </div>
    {/if}
    <div class="ui:border-border flex items-center justify-between gap-2 border-t p-2">
      <Button variant="ghost" size="sm" disabled={isDefault} onclick={reset}>
        {$t('insights.cohorts.newest', { count: INSIGHTS_LIMITS.chartedCohorts })}
      </Button>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled={selectableOptions.length === 0} onclick={selectShown}>
          {$t(selectLabelKey)}
        </Button>
        <Button variant="ghost" size="sm" disabled={selectedCount === 0} onclick={clear}>
          {$t('insights.cohorts.none')}
        </Button>
      </div>
    </div>
    {#if hasDirectStudents}
      <p class="ui:text-muted-foreground ui:border-border border-t px-3 py-2 text-xs">
        {$t('insights.cohorts.direct_included')}
      </p>
    {/if}
  </Popover.Content>
</Popover.Root>
