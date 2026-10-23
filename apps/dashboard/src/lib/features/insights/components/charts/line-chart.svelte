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
    valueKey: string;
    label: string;
    color?: string;
    percent?: boolean;
  }

  let { points, valueKey, label, color = INSIGHTS_COLORS.primary, percent = false }: Props = $props();

  const labelByRank = $derived(new Map(points.map((point) => [point.rank, point.label])));
  const config = $derived({ [valueKey]: { label, color } } satisfies ChartConfig);
  const series = $derived([
    {
      key: valueKey,
      label,
      color,
      props: { defined: (point: InsightsChartPoint) => typeof point[valueKey] === 'number' }
    }
  ]);
  const yDomain = $derived(percent ? [0, 100] : undefined);
  const ticks = $derived(points.map((point) => point.rank));
</script>

{#if browser}
  {#await loadChart()}
    <Skeleton class="h-[240px] w-full" />
  {:then Chart}
    <Chart.ChartContainer class="h-[240px] w-full" {config}>
      <Chart.LineChart
        data={points}
        x="rank"
        {yDomain}
        {series}
        props={{ xAxis: { ticks, format: (rank: number) => labelByRank.get(rank) ?? '' } }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip labelFormatter={(rank: number) => labelByRank.get(rank) ?? ''} />
        {/snippet}
      </Chart.LineChart>
    </Chart.ChartContainer>
  {/await}
{:else}
  <Skeleton class="h-[240px] w-full" />
{/if}
