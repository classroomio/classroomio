<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import {
    chartedCohorts,
    cohortOptionsFromSeries,
    defaultCohortIds,
    NO_COHORT_SERIES_KEY,
    toSeriesPoints
  } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import MultiLineChart from '../charts/multi-line-chart.svelte';
  import CohortSeriesPicker from '../cohort-series-picker.svelte';

  let { result }: WidgetRendererProps = $props();

  const lines = $derived(toSeriesPoints(result, 'exercise', 'cohort', 'best_score_pct__avg', $t));
  const defaultOptions = $derived.by(() => {
    const loadedOptions = insightsApi.cohortOptions;

    return loadedOptions.length > 0 ? loadedOptions : cohortOptionsFromSeries(lines.seriesKeys);
  });
  const defaultIds = $derived(defaultCohortIds(defaultOptions));
  const selectedIds = $derived(insightsApi.selection.cohortIds ?? defaultIds);
  const knownOptions = $derived.by(() => {
    const knownById = { ...insightsApi.cohortOptionsById };
    const defaultEntries = defaultOptions.map((cohort) => [cohort.id, cohort] as const);
    const defaultsById = Object.fromEntries(defaultEntries);

    return Object.values({ ...knownById, ...defaultsById });
  });
  const seriesKeys = $derived(chartedCohorts(lines.seriesKeys, knownOptions, selectedIds, $t));
  const hasDirectStudents = $derived(lines.seriesKeys.some((entry) => entry.key === NO_COHORT_SERIES_KEY));
  const showPicker = $derived((insightsApi.dashboard?.scope.cohortCount ?? 0) > 1);
</script>

{#if showPicker}
  <div class="mb-3 flex justify-end">
    <CohortSeriesPicker
      options={insightsApi.cohortOptions}
      total={insightsApi.cohortCount}
      matchTotal={insightsApi.cohortOptionsMatchTotal}
      search={insightsApi.cohortOptionsSearch}
      {selectedIds}
      isDefault={insightsApi.selection.cohortIds === null}
      loading={insightsApi.cohortOptionsLoading}
      hasMore={insightsApi.cohortOptionsHasMore}
      failed={insightsApi.cohortOptionsFailed}
      {hasDirectStudents}
      onOpenChange={(open) => {
        if (open) {
          void insightsApi.openCohortOptions();
        } else {
          insightsApi.closeCohortOptions();
        }
      }}
      onSearch={(search) => insightsApi.searchCohortOptions(search)}
      onLoadMore={() => insightsApi.loadMoreCohortOptions()}
      onChange={(ids) => insightsApi.setCohortIds(ids)}
    />
  </div>
{/if}

<MultiLineChart points={lines.points} {seriesKeys} />
