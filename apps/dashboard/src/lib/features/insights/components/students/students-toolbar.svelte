<script lang="ts">
  import { onDestroy } from 'svelte';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { Search } from '@cio/ui/custom/search';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import { t } from '$lib/utils/functions/translations';

  import { insightsStudentsApi } from '../../api';
  import { countActiveStudentFilters, STUDENT_FILTER_OPTIONS } from '../../utils/insights-utils';
  import type { StudentFilters } from '../../utils/types';

  const search = new DebouncedSearch({
    initial: insightsStudentsApi.search,
    onApply: (value) => void insightsStudentsApi.setSearch(value)
  });

  onDestroy(() => search.destroy());

  const filterKeys = Object.keys(STUDENT_FILTER_OPTIONS) as Array<keyof StudentFilters>;
  const activeFilterCount = $derived(countActiveStudentFilters(insightsStudentsApi.filters));

  function filterLabel(key: keyof StudentFilters, value: string): string {
    return $t(`insights.students.filters.${key}.${value || 'any'}`);
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  <Search
    value={search.draft}
    onValueChange={(value) => search.input(value)}
    placeholder={$t('insights.students.search')}
    class="w-full max-w-none sm:max-w-[260px]"
    data-testid="insights-students-search"
  />
  {#each filterKeys as filterKey (filterKey)}
    <Select.Root
      type="single"
      value={insightsStudentsApi.filters[filterKey]}
      onValueChange={(value) => insightsStudentsApi.setFilter(filterKey, value)}
    >
      <Select.Trigger class="min-w-[150px]" aria-label={$t(`insights.students.filters.${filterKey}.label`)}>
        {filterLabel(filterKey, insightsStudentsApi.filters[filterKey])}
      </Select.Trigger>
      <Select.Content>
        {#each STUDENT_FILTER_OPTIONS[filterKey] as option (option)}
          <Select.Item value={option} label={filterLabel(filterKey, option)}
            >{filterLabel(filterKey, option)}</Select.Item
          >
        {/each}
      </Select.Content>
    </Select.Root>
  {/each}
  {#if activeFilterCount > 0}
    <Button variant="ghost" size="sm" onclick={() => insightsStudentsApi.clearFilters()}>
      {$t('insights.students.clear_filters', { count: activeFilterCount })}
    </Button>
  {/if}
</div>
