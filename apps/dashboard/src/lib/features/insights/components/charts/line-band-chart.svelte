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
  import { EXERCISE_TICK_MIN_WIDTH, visibleTicks } from '$features/ui';

  import { INSIGHTS_COLORS } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    keys: { average: string; low?: string; high?: string; overlay?: string };
    labels: { average: string; band?: string; overlay?: string };
  }

  let { points, keys, labels }: Props = $props();

  let containerWidth = $state(800);

  const labelByRank = $derived(new Map(points.map((point) => [point.rank, point.label])));
  const isDefined = (key: string) => (point: InsightsChartPoint) => typeof point[key] === 'number';
  const isCompare = $derived(Boolean(keys.overlay));
  const averageColor = $derived(isCompare ? INSIGHTS_COLORS.neutral : INSIGHTS_COLORS.primary);
  const averageLine = $derived(isCompare ? { strokeWidth: 2, 'stroke-dasharray': '6 4' } : { strokeWidth: 2 });

  const series = $derived([
    ...(keys.low && keys.high
      ? [
          {
            key: 'band',
            label: labels.band ?? '',
            value: keys.high,
            color: INSIGHTS_COLORS.band,
            props: { y0: keys.low, y1: keys.high, line: false, fillOpacity: 1, defined: isDefined(keys.high) }
          }
        ]
      : []),
    ...(keys.overlay
      ? [
          {
            key: 'overlay',
            label: labels.overlay ?? '',
            value: keys.overlay,
            color: INSIGHTS_COLORS.primary,
            props: { fillOpacity: 0, line: { strokeWidth: 2.5 }, defined: isDefined(keys.overlay) }
          }
        ]
      : []),
    {
      key: 'average',
      label: labels.average,
      value: keys.average,
      color: averageColor,
      props: { fillOpacity: 0, line: averageLine, defined: isDefined(keys.average) }
    }
  ]);
  const config = $derived(
    Object.fromEntries(
      series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])
    ) satisfies ChartConfig
  );
  const allRanks = $derived(points.map((point) => point.rank));
  const ticks = $derived(visibleTicks(allRanks, containerWidth, EXERCISE_TICK_MIN_WIDTH));
  const legendItems = $derived.by(() => {
    if (keys.overlay && labels.overlay) {
      return [
        { label: labels.overlay, color: INSIGHTS_COLORS.primary, dashed: false },
        { label: labels.average, color: averageColor, dashed: true }
      ];
    }

    const items: Array<{ label: string; color: string; dashed: boolean }> = [
      { label: labels.average, color: averageColor, dashed: false }
    ];
    if (keys.low && keys.high && labels.band) {
      items.push({
        label: labels.band,
        color: INSIGHTS_COLORS.band,
        dashed: false
      });
    }

    return items;
  });

  function formatTick(rank: number): string {
    const label = labelByRank.get(rank) ?? '';
    const availablePerTick = ticks.length > 0 ? containerWidth / ticks.length : 120;
    const maxChars = Math.max(8, Math.min(20, Math.floor((availablePerTick - 16) / 7.5)));
    if (label.length > maxChars) {
      return `${label.slice(0, maxChars)}…`;
    }
    return label;
  }
</script>

{#snippet tickLabel({ props: tickProps, index }: { props: any; index: number })}
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
        <Chart.AreaChart
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
        </Chart.AreaChart>
      </Chart.ChartContainer>
      <Chart.ChartLegend items={legendItems} showValue={false} class="mt-3" />
    {/await}
  {:else}
    <Skeleton class="h-[260px] w-full" />
  {/if}
</div>
