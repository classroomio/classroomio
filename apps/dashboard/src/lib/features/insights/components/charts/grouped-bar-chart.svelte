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
  const yDomain = $derived(percent ? [0, 100] : undefined);
</script>

{#if browser}
  {#await loadChart()}
    <Skeleton class="h-[240px] w-full" />
  {:then Chart}
    <Chart.ChartContainer class="h-[240px] w-full" {config}>
      <Chart.BarChart
        data={points}
        x="key"
        xScale={Chart.scaleBand().padding(0.2)}
        seriesLayout="group"
        axis="x"
        legend
        {series}
        {yDomain}
        props={{ xAxis: { format: (key: string) => labelByKey.get(key) ?? key } }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip labelFormatter={(key: string) => labelByKey.get(key) ?? key} />
        {/snippet}
      </Chart.BarChart>
    </Chart.ChartContainer>
  {/await}
{:else}
  <Skeleton class="h-[240px] w-full" />
{/if}
