<script module lang="ts">
  let pending: Promise<typeof import('@cio/ui/base/chart')> | null = null;
  function loadChart() {
    pending ??= import('@cio/ui/base/chart');
    return pending;
  }
</script>

<script lang="ts">
  import type * as Chart from '@cio/ui/base/chart';
  import { t } from '$lib/utils/functions/translations';
  import type { LoginActivityData } from '$features/org/utils/types';

  interface Props {
    data: LoginActivityData;
  }

  let { data }: Props = $props();

  const chartConfig = $derived({
    count: {
      label: $t('dashboard.login_activity_logins'),
      color: 'var(--chart-1)'
    }
  } satisfies Chart.ChartConfig);

  const series = $derived([
    {
      key: 'count',
      value: 'count',
      label: chartConfig.count.label,
      color: 'var(--color-count)'
    }
  ]);

  const hasData = $derived(data !== null && data.some((d) => d.count > 0));
</script>

<div class="bg-card flex min-h-[45vh] w-full flex-col rounded-xl border p-3 md:p-5 dark:text-white">
  <div class="mb-4">
    <h3 class="text-lg font-semibold tracking-tight">
      {$t('dashboard.login_activity_title')}
    </h3>
    <p class="ui:text-muted-foreground mt-1 text-sm">
      {$t('dashboard.login_activity_description')}
    </p>
  </div>

  <div class="flex h-full flex-col justify-center">
    {#if hasData}
      {#await loadChart() then C}
        <C.ChartContainer class="h-[260px] w-full" config={chartConfig}>
          <C.BarChart {data} x="day" axis="x" {series} />
        </C.ChartContainer>
      {/await}
    {:else}
      <div class="ui:text-muted-foreground flex h-[260px] items-center justify-center text-sm">
        {$t('dashboard.login_activity_no_data')}
      </div>
    {/if}
  </div>
</div>
