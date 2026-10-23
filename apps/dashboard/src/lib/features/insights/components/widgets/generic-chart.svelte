<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import {
    hbarMax,
    INSIGHTS_COLORS,
    SERIES_COLORS,
    toChartPoints,
    toDonutSegments,
    toHbarItems,
    toSeriesPoints
  } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnChart from '../charts/column-chart.svelte';
  import DonutChart from '../charts/donut-chart.svelte';
  import GroupedBarChart from '../charts/grouped-bar-chart.svelte';
  import HbarList from '../charts/hbar-list.svelte';
  import LineChart from '../charts/line-chart.svelte';
  import MultiLineChart from '../charts/multi-line-chart.svelte';

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
      label: $t(`insights.measures.${measure.key}`),
      color: SERIES_COLORS[index % SERIES_COLORS.length]
    }))
  );
</script>

{#if widget.viz === 'donut' && firstDimension}
  <DonutChart segments={toDonutSegments(result, firstDimension, $t)} />
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
    label={$t(`insights.measures.${firstMeasure.key}`)}
    color={INSIGHTS_COLORS.primary}
    percent={isPercent}
  />
{:else if firstMeasure}
  <ColumnChart
    {points}
    valueKey={firstMeasure.key}
    label={$t(`insights.measures.${firstMeasure.key}`)}
    color={INSIGHTS_COLORS.primary}
    percent={isPercent}
  />
{/if}
