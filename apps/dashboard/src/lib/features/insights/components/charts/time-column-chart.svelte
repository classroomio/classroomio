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
  import { bucketDailySeries, formatChartTooltipDate, getBucketSize, visibleTicks } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { INSIGHTS_COLORS, numberCell } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    valueKey: string;
    label: string;
    groupedLabel: string;
  }

  let { points, valueKey, label, groupedLabel }: Props = $props();

  let containerWidth = $state(800);

  const daily = $derived(
    points.map((point) => ({
      date: point.key,
      value: numberCell(point, valueKey)
    }))
  );
  const bucketSize = $derived(getBucketSize(daily.length, containerWidth));
  const buckets = $derived(bucketDailySeries(daily, ['value'], bucketSize, 'sum'));
  const seriesLabel = $derived(bucketSize > 1 ? groupedLabel : label);
  const config = $derived({ value: { label: seriesLabel, color: INSIGHTS_COLORS.primary } } satisfies ChartConfig);
  const series = $derived([{ key: 'value', label: seriesLabel, color: INSIGHTS_COLORS.primary }]);
  const bucketDates = $derived(buckets.map((bucket) => bucket.date));
  const tickDates = $derived(visibleTicks(bucketDates, containerWidth));

  function tooltipLabel(date: Date): string {
    const bucket = buckets.find((entry) => entry.date.getTime() === date.getTime());

    return formatChartTooltipDate(date, bucket);
  }
</script>

<div class="w-full" bind:clientWidth={containerWidth}>
  {#if browser}
    {#await loadChart()}
      <Skeleton class="h-[240px] w-full" />
    {:then Chart}
      <Chart.ChartContainer class="h-[240px] w-full" {config}>
        <Chart.BarChart
          data={buckets}
          x="date"
          xScale={Chart.scaleBand().padding(0.25)}
          axis="x"
          padding={{ top: 8, right: 16, bottom: 32, left: 24 }}
          {series}
          props={{
            xAxis: {
              ticks: tickDates,
              format: (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            }
          }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip labelFormatter={tooltipLabel} />
          {/snippet}
        </Chart.BarChart>
      </Chart.ChartContainer>
    {/await}
  {:else}
    <Skeleton class="h-[240px] w-full" />
  {/if}
  {#if bucketSize > 1}
    <p class="ui:text-muted-foreground mt-2 text-xs">{$t('insights.notes.bucketed_total', { days: bucketSize })}</p>
  {/if}
</div>
