<script lang="ts">
  import * as Chart from '@cio/ui/base/chart';
  import { t } from '$lib/utils/functions/translations';
  import type { AiUsageData } from '$features/settings/utils/types';

  interface Props {
    usage: AiUsageData | null;
  }

  let { usage }: Props = $props();

  const data = $derived(usage?.history ?? []);
  const totalTokens = $derived(data.reduce((sum, day) => sum + day.tokens, 0));
  const totalRequests = $derived(usage?.requestsThisMonth ?? 0);

  const chartConfig = $derived({
    tokens: {
      label: $t('settings.ai_credits.chart.tokens'),
      color: 'var(--chart-1)'
    }
  } satisfies Chart.ChartConfig);

  const series = $derived([
    { key: 'tokens', value: 'tokens', label: chartConfig.tokens.label, color: 'var(--color-tokens)' }
  ]);

  const hasData = $derived(data.some((day) => day.tokens > 0));
</script>

<div class="bg-card flex flex-col rounded-xl border p-3 md:p-5 dark:text-white">
  <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h3 class="text-lg font-semibold tracking-tight">{$t('settings.ai_credits.chart.heading')}</h3>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        {$t('settings.ai_credits.chart.subheading')}
      </p>
    </div>
    <div class="flex flex-wrap gap-6 text-right">
      <div>
        <p class="ui:text-muted-foreground text-xs">{$t('settings.ai_credits.chart.total_tokens')}</p>
        <p class="text-xl font-semibold">{totalTokens.toLocaleString()}</p>
      </div>
      <div>
        <p class="ui:text-muted-foreground text-xs">{$t('settings.ai_credits.chart.total_requests')}</p>
        <p class="text-xl font-semibold">{totalRequests.toLocaleString()}</p>
      </div>
    </div>
  </div>

  {#if hasData}
    <Chart.ChartContainer class="h-[260px] w-full" config={chartConfig}>
      <Chart.BarChart {data} x="date" axis="x" {series} />
    </Chart.ChartContainer>
  {:else}
    <div class="ui:text-muted-foreground flex h-[260px] items-center justify-center text-sm">
      {$t('settings.ai_credits.chart.empty')}
    </div>
  {/if}
</div>
