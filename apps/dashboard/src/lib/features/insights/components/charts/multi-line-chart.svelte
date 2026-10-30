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
  import { EXERCISE_TICK_MIN_WIDTH, truncateTickLabel, visibleTicks, type ChartAxisTickProps } from '$features/ui';

  import { cycleColor, INSIGHTS_COLORS, NO_COHORT_SERIES_KEY } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    seriesKeys: Array<{ key: string; label: string; dashed?: boolean }>;
  }

  let { points, seriesKeys }: Props = $props();

  let containerWidth = $state(800);

  const labelByRank = $derived(new Map(points.map((point) => [point.rank, point.label])));
  const series = $derived.by(() => {
    let cohortIndex = 0;

    return seriesKeys.map((entry) => {
      const isDirect = entry.key === NO_COHORT_SERIES_KEY;
      const color = isDirect ? INSIGHTS_COLORS.slate : cycleColor(cohortIndex++);
      const dash = entry.dashed ? { 'stroke-dasharray': '6 4' } : {};

      return {
        key: entry.key,
        label: entry.label,
        color,
        props: { ...dash, defined: (point: InsightsChartPoint) => typeof point[entry.key] === 'number' }
      };
    });
  });
  const config = $derived(
    Object.fromEntries(
      series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])
    ) satisfies ChartConfig
  );
  const allRanks = $derived(points.map((point) => point.rank));
  const ticks = $derived(visibleTicks(allRanks, containerWidth, EXERCISE_TICK_MIN_WIDTH));
  const legendItems = $derived(
    series.map((entry, index) => ({
      label: entry.label,
      color: entry.color,
      dashed: Boolean(seriesKeys[index]?.dashed)
    }))
  );

  function formatTick(rank: number): string {
    return truncateTickLabel(labelByRank.get(rank) ?? '', containerWidth, ticks.length);
  }
</script>

{#snippet tickLabel({ props: tickProps, index }: { props: ChartAxisTickProps; index: number })}
  {@const isFirst = index === 0}
  {@const isLast = index === ticks.length - 1 && ticks.length > 1}
  {@const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle'}
  <text
    x={tickProps.x}
    y={tickProps.y}
    dy="8"
    text-anchor={anchor}
    class="lc-axis-tick-label fill-muted-foreground font-normal"
    font-size="12"
  >
    {tickProps.value}
  </text>
{/snippet}

<div class="w-full" bind:clientWidth={containerWidth}>
  {#if browser}
    {#await loadChart()}
      <Skeleton class="h-[260px] w-full" />
    {:then Chart}
      <Chart.ChartContainer class="h-[260px] w-full" {config}>
        <Chart.LineChart
          data={points}
          x="rank"
          yDomain={[0, 100]}
          padding={{ top: 12, right: 28, bottom: 36, left: 28 }}
          {series}
          props={{ xAxis: { ticks, format: formatTick, tickLabel } }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip labelFormatter={(rank: number) => labelByRank.get(rank) ?? ''} />
          {/snippet}
        </Chart.LineChart>
      </Chart.ChartContainer>
      <Chart.ChartLegend items={legendItems} showValue={false} class="mt-3" />
    {/await}
  {:else}
    <Skeleton class="h-[260px] w-full" />
  {/if}
</div>
