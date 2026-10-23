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

  import { SERIES_COLORS } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    seriesKeys: Array<{ key: string; label: string }>;
  }

  let { points, seriesKeys }: Props = $props();

  const labelByRank = $derived(new Map(points.map((point) => [point.rank, point.label])));
  const series = $derived(
    seriesKeys.map((entry, index) => {
      const color = SERIES_COLORS[index % SERIES_COLORS.length];

      return {
        key: entry.key,
        label: entry.label,
        color,
        props: {
          defined: (point: InsightsChartPoint) => typeof point[entry.key] === 'number'
        }
      };
    })
  );
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
      <Chart.LineChart
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
      </Chart.LineChart>
    </Chart.ChartContainer>
  {/await}
{:else}
  <Skeleton class="h-[260px] w-full" />
{/if}
