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

  interface Props {
    data: LandingStatsData | null;
    loading?: boolean;
  }

  let { data, loading = false }: Props = $props();

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

  let chartData = $derived(
    data?.sparkline.map((d) => {
      const [year, month, day] = d.date.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return { ...d, date };
    })
  );

  const hasData = $derived((chartData?.length ?? 0) > 0 && chartData?.some((r) => r.views > 0 || r.enrollments > 0));
</script>

<AnalyticsPanelCard title={$t('analytics.trend.heading')} description={$t('analytics.trend.description')}>
  {#snippet children()}
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
            seriesLayout="group"
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
                labelFormatter={(d: Date) =>
                  d.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
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
  {/snippet}
</AnalyticsPanelCard>
