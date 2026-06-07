<script module lang="ts">
  let pending: Promise<typeof import('@cio/ui/base/chart')> | null = null;
  function loadChart() {
    pending ??= import('@cio/ui/base/chart');
    return pending;
  }
</script>

<script lang="ts">
  import type * as Chart from '@cio/ui/base/chart';
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
      color: 'var(--primary)'
    },
    enrollments: {
      label: $t('analytics.trend.enrollments'),
      color: 'var(--chart-2, var(--primary))'
    }
  } satisfies Chart.ChartConfig);

  const series = [
    { key: 'views', value: 'views', label: 'Views', color: 'var(--color-views)' },
    { key: 'enrollments', value: 'enrollments', label: 'Enrollments', color: 'var(--color-enrollments)' }
  ];

  const hasData = $derived(
    (data?.sparkline.length ?? 0) > 0 && data?.sparkline.some((r) => r.views > 0 || r.enrollments > 0)
  );
</script>

<AnalyticsPanelCard title={$t('analytics.trend.heading')} description={$t('analytics.trend.description')}>
  {#snippet children()}
    {#if loading && !data}
      <div class="flex h-[280px] items-center justify-center">
        <Spinner class="ui:text-muted-foreground size-6" />
      </div>
    {:else if hasData && data}
      {#await loadChart() then C}
        <C.ChartContainer class="h-[280px] w-full" config={chartConfig}>
          <C.AreaChart data={data.sparkline} x="date" axis="x" {series} />
        </C.ChartContainer>
      {/await}
    {:else}
      <Empty icon={TrendingUpIcon} title={$t('analytics.trend.empty')} class="h-[280px]" />
    {/if}
  {/snippet}
</AnalyticsPanelCard>
