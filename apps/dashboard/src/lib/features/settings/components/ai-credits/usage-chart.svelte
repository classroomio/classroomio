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
  } satisfies ChartConfig);

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

  {#if browser && hasData}
    {#await loadChart() then C}
      <C.ChartContainer class="h-[260px] w-full" config={chartConfig}>
        <C.BarChart {data} x="date" axis="x" {series} />
      </C.ChartContainer>
    {/await}
  {:else if hasData}
    <div class="flex h-[260px] items-center justify-center">
      <Spinner class="ui:text-muted-foreground size-6" />
    </div>
  {:else}
    <div class="ui:text-muted-foreground flex h-[260px] items-center justify-center text-sm">
      {$t('settings.ai_credits.chart.empty')}
    </div>
  {/if}
</div>
