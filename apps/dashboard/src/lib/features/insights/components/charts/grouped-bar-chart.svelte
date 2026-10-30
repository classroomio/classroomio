<script module lang="ts">
  function loadChart() {
    if (typeof window === 'undefined') return Promise.reject(new Error('browser-only'));

    return import('@cio/ui/base/chart');
  }
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import type { ChartConfig } from '@cio/ui/base/chart/types';
  import { Skeleton } from '@cio/ui/base/skeleton';

  import {
    formatCount,
    formatPercent,
    GROUPED_BAR_GAP,
    groupedBandPadding,
    truncateLabel
  } from '../../utils/insights-utils';
  import type { InsightsChartPoint, InsightsChartSeries } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    series: InsightsChartSeries[];
    percent?: boolean;
  }

  let { points, series, percent = false }: Props = $props();

  const labelByKey = $derived(new Map(points.map((point) => [point.key, point.label])));
  const config = $derived(
    Object.fromEntries(
      series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])
    ) satisfies ChartConfig
  );
  const legendItems = $derived(series.map((entry) => ({ label: entry.label, color: entry.color })));
  const yDomain = $derived(percent ? [0, 100] : undefined);
  const formatValue = $derived(percent ? formatPercent : formatCount);

  const CHART_PADDING = { top: 8, right: 20, bottom: 32, left: 24 };

  let containerWidth = $state(800);

  const bandPadding = $derived(
    groupedBandPadding(containerWidth - CHART_PADDING.left - CHART_PADDING.right, points.length, series.length)
  );

  function formatCategory(key: string): string {
    const label = labelByKey.get(key) ?? key;
    const availablePerGroup = points.length > 0 ? containerWidth / points.length : 120;
    const maxChars = Math.max(6, Math.min(14, Math.floor(availablePerGroup / 8)));
    return truncateLabel(label, maxChars);
  }
</script>

<div class="w-full" bind:clientWidth={containerWidth}>
  {#if browser}
    {#await loadChart()}
      <Skeleton class="h-[240px] w-full" />
    {:then Chart}
      <Chart.ChartContainer class="h-[240px] w-full" {config}>
        <Chart.BarChart
          data={points}
          x="key"
          xScale={Chart.scaleBand().padding(bandPadding)}
          seriesLayout="group"
          groupPadding={GROUPED_BAR_GAP}
          axis="x"
          padding={CHART_PADDING}
          {series}
          {yDomain}
          props={{ xAxis: { format: formatCategory } }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip labelFormatter={(key: string) => labelByKey.get(key) ?? key} valueFormatter={formatValue} />
          {/snippet}
        </Chart.BarChart>
      </Chart.ChartContainer>
      <Chart.ChartLegend items={legendItems} showValue={false} class="mt-3" />
    {/await}
  {:else}
    <Skeleton class="h-[240px] w-full" />
  {/if}
</div>
