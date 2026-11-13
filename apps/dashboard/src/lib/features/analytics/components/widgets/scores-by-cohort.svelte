<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi } from '../../api';
  import {
    chartedCohorts,
    cohortOptionsFromSeries,
    defaultCohortIds,
    NO_COHORT_SERIES_KEY,
    toSeriesPoints
  } from '../../utils/analytics-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import MultiLineChart from '../charts/multi-line-chart.svelte';
  import CohortSeriesPicker from '../cohort-series-picker.svelte';

  let { result }: WidgetRendererProps = $props();

  const lines = $derived(toSeriesPoints(result, 'exercise', 'cohort', 'best_score_pct__avg', $t));
  const defaultOptions = $derived.by(() => {
    const loadedOptions = analyticsApi.cohortOptions;

    return loadedOptions.length > 0 ? loadedOptions : cohortOptionsFromSeries(lines.seriesKeys);
  });
  const defaultIds = $derived(defaultCohortIds(defaultOptions));
  const selectedIds = $derived(analyticsApi.selection.cohortIds ?? defaultIds);
  const knownOptions = $derived.by(() => {
    const knownById = { ...analyticsApi.cohortOptionsById };
    const defaultEntries = defaultOptions.map((cohort) => [cohort.id, cohort] as const);
    const defaultsById = Object.fromEntries(defaultEntries);

    return Object.values({ ...knownById, ...defaultsById });
  });
  const seriesKeys = $derived(chartedCohorts(lines.seriesKeys, knownOptions, selectedIds, $t));
  const hasDirectStudents = $derived(lines.seriesKeys.some((entry) => entry.key === NO_COHORT_SERIES_KEY));
  const showPicker = $derived((analyticsApi.dashboard?.scope.cohortCount ?? 0) > 1);
</script>

{#if showPicker}
  <div class="mb-3 flex justify-end">
    <CohortSeriesPicker
      options={analyticsApi.cohortOptions}
      total={analyticsApi.cohortCount}
      matchTotal={analyticsApi.cohortOptionsMatchTotal}
      search={analyticsApi.cohortOptionsSearch}
      {selectedIds}
      isDefault={analyticsApi.selection.cohortIds === null}
      loading={analyticsApi.cohortOptionsLoading}
      hasMore={analyticsApi.cohortOptionsHasMore}
      failed={analyticsApi.cohortOptionsFailed}
      {hasDirectStudents}
      onOpenChange={(open) => {
        if (open) {
          void analyticsApi.openCohortOptions();
        } else {
          analyticsApi.closeCohortOptions();
        }
      }}
      onSearch={(search) => analyticsApi.searchCohortOptions(search)}
      onLoadMore={() => analyticsApi.loadMoreCohortOptions()}
      onChange={(ids) => analyticsApi.setCohortIds(ids)}
    />
  </div>
{/if}

<MultiLineChart points={lines.points} {seriesKeys} />
