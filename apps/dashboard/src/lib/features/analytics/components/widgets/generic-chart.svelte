<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import {
    donutTotal,
    hbarMax,
    histogramPoints,
    ANALYTICS_COLORS,
    SERIES_COLORS,
    toChartPoints,
    toDonutSegments,
    toHbarItems,
    toSeriesPoints
  } from '../../utils/analytics-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnChart from '../charts/column-chart.svelte';
  import DonutChart from '../charts/donut-chart.svelte';
  import GroupedBarChart from '../charts/grouped-bar-chart.svelte';
  import HbarList from '../charts/hbar-list.svelte';
  import LineChart from '../charts/line-chart.svelte';
  import MultiLineChart from '../charts/multi-line-chart.svelte';
  import TimeColumnChart from '../charts/time-column-chart.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const dimensions = $derived(widget.spec.dimensions ?? []);
  const firstDimension = $derived(dimensions[0] ?? null);
  const measures = $derived(result.columns.filter((column) => column.role === 'measure'));
  const firstMeasure = $derived(measures[0]);
  const isPercent = $derived(firstMeasure?.valueType === 'percent');
  const points = $derived(firstDimension ? toChartPoints(result, firstDimension, $t) : []);
  const series = $derived(
    measures.map((measure, index) => ({
      key: measure.key,
      label: $t(`analytics.measures.${measure.key}`),
      color: SERIES_COLORS[index % SERIES_COLORS.length]
    }))
  );
</script>

{#if widget.viz === 'donut' && firstDimension}
  {@const segments = toDonutSegments(result, firstDimension, $t)}
  <DonutChart {segments} centerLabel={$t('analytics.donut.students', { count: donutTotal(segments) })} />
{:else if widget.viz === 'histogram' && firstDimension && firstMeasure}
  <ColumnChart
    points={histogramPoints(result, firstDimension, $t)}
    valueKey={firstMeasure.key}
    label={$t(`analytics.measures.${firstMeasure.key}`)}
    color={ANALYTICS_COLORS.primary}
  />
{:else if widget.viz === 'hbar'}
  {@const items = toHbarItems(result, firstDimension, $t)}
  <HbarList {items} max={hbarMax(items, isPercent)} />
{:else if widget.viz === 'grouped_bar'}
  <GroupedBarChart {points} {series} percent />
{:else if widget.viz === 'multi_line' && dimensions.length === 2 && firstMeasure}
  {@const lines = toSeriesPoints(result, dimensions[0], dimensions[1], firstMeasure.key, $t)}
  <MultiLineChart points={lines.points} seriesKeys={lines.seriesKeys} />
{:else if widget.viz === 'line' && firstMeasure}
  <LineChart
    {points}
    valueKey={firstMeasure.key}
    label={$t(`analytics.measures.${firstMeasure.key}`)}
    color={ANALYTICS_COLORS.primary}
    percent={isPercent}
  />
{:else if widget.viz === 'column' && firstDimension === 'day' && firstMeasure}
  <TimeColumnChart
    {points}
    valueKey={firstMeasure.key}
    label={$t(`analytics.measures.${firstMeasure.key}`)}
    groupedLabel={$t('analytics.legend.logins')}
  />
{:else if firstMeasure}
  <ColumnChart
    {points}
    valueKey={firstMeasure.key}
    label={$t(`analytics.measures.${firstMeasure.key}`)}
    color={ANALYTICS_COLORS.primary}
    percent={isPercent}
  />
{/if}
