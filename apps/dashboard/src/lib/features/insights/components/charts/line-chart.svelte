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
  import { visibleTicks } from '$features/ui';

  import { INSIGHTS_COLORS } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    valueKey: string;
    label: string;
    color?: string;
    percent?: boolean;
    target?: { value: number; label: string } | null;
    yMax?: number | null;
  }

  let {
    points,
    valueKey,
    label,
    color = INSIGHTS_COLORS.primary,
    percent = false,
    target = null,
    yMax = null
  }: Props = $props();

  const TARGET_KEY = 'target';

  let containerWidth = $state(800);

  const labelByRank = $derived(new Map(points.map((point) => [point.rank, point.label])));
  const data = $derived(target ? points.map((point) => ({ ...point, [TARGET_KEY]: target.value })) : points);
  const series = $derived([
    {
      key: valueKey,
      label,
      color,
      props: { defined: (point: InsightsChartPoint) => typeof point[valueKey] === 'number' }
    },
    ...(target
      ? [{ key: TARGET_KEY, label: target.label, color: INSIGHTS_COLORS.neutral, props: { 'stroke-dasharray': '6 4' } }]
      : [])
  ]);
  const config = $derived(
    Object.fromEntries(
      series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])
    ) satisfies ChartConfig
  );
  const yDomain = $derived(percent ? [0, 100] : yMax ? [0, yMax] : undefined);
  const allRanks = $derived(points.map((point) => point.rank));
  const ticks = $derived(visibleTicks(allRanks, containerWidth, 64));
  const legendItems = $derived(
    target
      ? series.map((entry) => ({
          label: entry.label,
          color: entry.color,
          dashed: entry.key === TARGET_KEY
        }))
      : []
  );

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
      <Skeleton class="h-[240px] w-full" />
    {:then Chart}
      <Chart.ChartContainer class="h-[240px] w-full" {config}>
        <Chart.LineChart
          {data}
          x="rank"
          {yDomain}
          padding={{ top: 12, right: 28, bottom: 36, left: 28 }}
          {series}
          props={{ xAxis: { ticks, format: formatTick, tickLabel } }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip labelFormatter={(rank: number) => labelByRank.get(rank) ?? ''} />
          {/snippet}
        </Chart.LineChart>
      </Chart.ChartContainer>
      {#if target}
        <Chart.ChartLegend items={legendItems} showValue={false} class="mt-3" />
      {/if}
    {/await}
  {:else}
    <Skeleton class="h-[240px] w-full" />
  {/if}
</div>
