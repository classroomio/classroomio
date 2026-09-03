<script module lang="ts">
  function loadChart() {
    if (typeof window === 'undefined') return Promise.reject(new Error('browser-only'));

    return import('@cio/ui/base/chart');
  }
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import type { ChartConfig } from '@cio/ui/base/chart/types';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import { t } from '$lib/utils/functions/translations';
  import AnalyticsPanelCard from './analytics-panel-card.svelte';
  import type { LandingStatsData } from '../utils/types';
  import { bucketSparkline, formatChartTooltipDate, getBucketSize, zeroFillRange } from '../utils/analytics-utils';

  interface Props {
    data: LandingStatsData | null;
    loading?: boolean;
    range?: 7 | 30 | 90;
  }

  let { data, loading = false, range }: Props = $props();

  let containerRef = $state<HTMLDivElement | null>(null);
  let containerWidth = $state<number>(800);

  $effect(() => {
    const element = containerRef;
    if (!element || !browser) return;

    const measure = () => {
      containerWidth = element.clientWidth || 800;
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  });

  const chartConfig = $derived({
    views: {
      label: $t('analytics.trend.views'),
      color: 'var(--chart-4)'
    },
    enrollments: {
      label: $t('analytics.trend.enrollments'),
      color: 'var(--chart-2)'
    }
  } satisfies ChartConfig);

  const series = $derived([
    {
      key: 'views',
      label: chartConfig.views.label,
      color: chartConfig.views.color
    },
    {
      key: 'enrollments',
      label: chartConfig.enrollments.label,
      color: chartConfig.enrollments.color
    }
  ]);

  const totalDays = $derived(range ?? 30);
  const bucketSize = $derived(getBucketSize(totalDays, containerWidth || 800));

  let chartData = $derived(bucketSparkline(zeroFillRange(data?.sparkline, totalDays), bucketSize));

  const hasData = $derived((chartData?.length ?? 0) > 0 && chartData?.some((r) => r.views > 0 || r.enrollments > 0));
</script>

<AnalyticsPanelCard title={$t('analytics.trend.heading')} description={$t('analytics.trend.description')}>
  {#snippet children()}
    <div bind:this={containerRef} class="w-full">
      {#if loading && !chartData}
        <div class="flex h-[280px] items-center justify-center">
          <Spinner class="ui:text-muted-foreground size-6" />
        </div>
      {:else if browser && hasData && chartData}
        {#await loadChart() then C}
          <C.ChartContainer class="h-[280px] w-full" config={chartConfig}>
            <C.BarChart
              data={chartData}
              xScale={C.scaleBand().padding(0.25)}
              x="date"
              axis="x"
              seriesLayout="stack"
              legend
              {series}
              props={{
                xAxis: {
                  format: (d: Date) =>
                    d.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                }
              }}
            >
              {#snippet tooltip()}
                <C.Tooltip
                  labelFormatter={(d: Date) => {
                    const point = chartData?.find((p) => p.date.getTime() === d.getTime());
                    return formatChartTooltipDate(d, point);
                  }}
                />
              {/snippet}
            </C.BarChart>
          </C.ChartContainer>
        {/await}
      {:else if hasData && chartData}
        <div class="flex h-[280px] items-center justify-center">
          <Spinner class="ui:text-muted-foreground size-6" />
        </div>
      {:else}
        <Empty icon={TrendingUpIcon} title={$t('analytics.trend.empty')} class="h-[280px]" />
      {/if}
    </div>
  {/snippet}
</AnalyticsPanelCard>
