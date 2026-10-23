<script lang="ts">
  import { onDestroy } from 'svelte';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { Search } from '@cio/ui/custom/search';
  import { SortSelect } from '$features/ui';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import { t } from '$lib/utils/functions/translations';

  import { insightsLearnersApi } from '../../api';
  import { countActiveLearnerFilters, LEARNER_FILTER_OPTIONS, LEARNER_SORTS } from '../../utils/insights-utils';
  import type { LearnerFilters } from '../../utils/types';

  const search = new DebouncedSearch({
    initial: insightsLearnersApi.search,
    onApply: (value) => void insightsLearnersApi.setSearch(value)
  });

  onDestroy(() => search.destroy());

  const filterKeys = Object.keys(LEARNER_FILTER_OPTIONS) as Array<keyof LearnerFilters>;

  const sortOptions = $derived(LEARNER_SORTS.map((value) => ({ value, label: $t(`insights.learners.sort.${value}`) })));
  const activeFilterCount = $derived(countActiveLearnerFilters(insightsLearnersApi.filters));

  function filterLabel(key: keyof LearnerFilters, value: string): string {
    return $t(`insights.learners.filters.${key}.${value || 'any'}`);
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  <Search
    value={search.draft}
    onValueChange={(value) => search.input(value)}
    placeholder={$t('insights.learners.search')}
    class="w-full max-w-none sm:max-w-[260px]"
    data-testid="insights-learners-search"
  />
  {#each filterKeys as filterKey (filterKey)}
    <Select.Root
      type="single"
      value={insightsLearnersApi.filters[filterKey]}
      onValueChange={(value) => insightsLearnersApi.setFilter(filterKey, value)}
    >
      <Select.Trigger class="min-w-[150px]" aria-label={$t(`insights.learners.filters.${filterKey}.label`)}>
        {filterLabel(filterKey, insightsLearnersApi.filters[filterKey])}
      </Select.Trigger>
      <Select.Content>
        {#each LEARNER_FILTER_OPTIONS[filterKey] as option (option)}
          <Select.Item value={option} label={filterLabel(filterKey, option)}
            >{filterLabel(filterKey, option)}</Select.Item
          >
        {/each}
      </Select.Content>
    </Select.Root>
  {/each}
  <SortSelect
    options={sortOptions}
    value={insightsLearnersApi.sort}
    onValueChange={(value) => insightsLearnersApi.setSortValue(value)}
  />
  {#if activeFilterCount > 0}
    <Button variant="ghost" size="sm" onclick={() => insightsLearnersApi.clearFilters()}>
      {$t('insights.learners.clear_filters', { count: activeFilterCount })}
    </Button>
  {/if}
</div>
