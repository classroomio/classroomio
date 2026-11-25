<script lang="ts">
  import { onDestroy } from 'svelte';
  import XIcon from '@lucide/svelte/icons/x';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { Search } from '@cio/ui/custom/search';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi, analyticsStudentsApi } from '../../api';
  import { countActiveStudentFilters, STUDENT_FILTER_OPTIONS } from '../../utils/analytics-utils';
  import type { StudentFilters } from '../../utils/types';

  const search = new DebouncedSearch({
    initial: analyticsStudentsApi.search,
    onApply: (value) => void analyticsStudentsApi.setSearch(value)
  });

  onDestroy(() => search.destroy());

  const filterKeys = Object.keys(STUDENT_FILTER_OPTIONS) as Array<keyof StudentFilters>;
  const activeFilterCount = $derived(
    countActiveStudentFilters(analyticsStudentsApi.filters, analyticsStudentsApi.refs)
  );
  const cohortCount = $derived(analyticsStudentsApi.refs.cohortIds.length);
  const lessonId = $derived(analyticsStudentsApi.refs.lessonId);
  const lessonTitle = $derived.by(() => {
    const courseId = analyticsApi.selection.courseId;
    const items = courseId ? analyticsApi.dashboard?.structures[courseId]?.items : undefined;

    return items?.find((item) => item.id === lessonId)?.title ?? $t('analytics.drilldown.lesson_fallback');
  });

  function filterLabel(key: keyof StudentFilters, value: string): string {
    return $t(`analytics.students.filters.${key}.${value || 'any'}`);
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  <Search
    value={search.draft}
    onValueChange={(value) => search.input(value)}
    placeholder={$t('analytics.students.search')}
    class="w-full max-w-none sm:max-w-[260px]"
    data-testid="analytics-students-search"
  />
  {#each filterKeys as filterKey (filterKey)}
    <Select.Root
      type="single"
      value={analyticsStudentsApi.filters[filterKey]}
      onValueChange={(value) => analyticsStudentsApi.setFilter(filterKey, value)}
    >
      <Select.Trigger class="min-w-[150px]" aria-label={$t(`analytics.students.filters.${filterKey}.label`)}>
        {filterLabel(filterKey, analyticsStudentsApi.filters[filterKey])}
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
  {#if cohortCount > 0}
    <Button
      variant="secondary"
      size="sm"
      testId="analytics-students-cohort-chip"
      onclick={() => analyticsStudentsApi.clearRefFilter('cohortIds')}
    >
      {$t('analytics.students.filters.cohort_chip', { count: cohortCount })}
      <XIcon />
    </Button>
  {/if}
  {#if lessonId}
    <Button
      variant="secondary"
      size="sm"
      testId="analytics-students-lesson-chip"
      onclick={() => analyticsStudentsApi.clearRefFilter('lessonId')}
    >
      {$t('analytics.drilldown.lesson_incomplete', { lesson: lessonTitle })}
      <XIcon />
    </Button>
  {/if}
  {#if activeFilterCount > 0}
    <Button variant="ghost" size="sm" onclick={() => analyticsStudentsApi.clearFilters()}>
      {$t('analytics.students.clear_filters', { count: activeFilterCount })}
    </Button>
  {/if}
</div>
