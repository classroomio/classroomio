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

  import { INSIGHTS_COLORS } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    keys: { average: string; low?: string; high?: string; overlay?: string };
    labels: { average: string; band?: string; overlay?: string };
  }

  let { points, keys, labels }: Props = $props();

  const labelByRank = $derived(new Map(points.map((point) => [point.rank, point.label])));
  const isDefined = (key: string) => (point: InsightsChartPoint) => typeof point[key] === 'number';

  const series = $derived([
    ...(keys.low && keys.high
      ? [
          {
            key: 'band',
            label: labels.band ?? '',
            value: keys.high,
            color: INSIGHTS_COLORS.primary,
            props: { y0: keys.low, y1: keys.high, line: false, fillOpacity: 0.14, defined: isDefined(keys.high) }
          }
        ]
      : []),
    {
      key: 'average',
      label: labels.average,
      value: keys.average,
      color: INSIGHTS_COLORS.primary,
      props: { fillOpacity: 0, line: { strokeWidth: 2 }, defined: isDefined(keys.average) }
    },
    ...(keys.overlay
      ? [
          {
            key: 'overlay',
            label: labels.overlay ?? '',
            value: keys.overlay,
            color: INSIGHTS_COLORS.success,
            props: { fillOpacity: 0, line: { strokeWidth: 2.5 }, defined: isDefined(keys.overlay) }
          }
        ]
      : [])
  ]);
  const config = $derived(
    Object.fromEntries(
      series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])
    ) satisfies ChartConfig
  );
  const ticks = $derived(points.map((point) => point.rank));

  function formatTick(rank: number): string {
    const label = labelByRank.get(rank) ?? '';
    if (points.length > 8 && label.length > 14) {
      return `${label.slice(0, 14)}…`;
    }
    return label;
  }
</script>

{#if browser}
  {#await loadChart()}
    <Skeleton class="h-[260px] w-full" />
  {:then Chart}
    <Chart.ChartContainer class="h-[260px] w-full" {config}>
      <Chart.AreaChart
        data={points}
        x="rank"
        yDomain={[0, 100]}
        legend
        {series}
        props={{ xAxis: { ticks, format: formatTick } }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip labelFormatter={(rank: number) => labelByRank.get(rank) ?? ''} />
        {/snippet}
      </Chart.AreaChart>
    </Chart.ChartContainer>
  {/await}
{:else}
  <Skeleton class="h-[260px] w-full" />
{/if}
