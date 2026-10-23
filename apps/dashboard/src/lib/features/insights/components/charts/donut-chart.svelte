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

  interface Props {
    segments: Array<{ key: string; label: string; value: number; color: string }>;
  }

  let { segments }: Props = $props();

  const config = $derived(
    Object.fromEntries(
      segments.map((segment) => [segment.key, { label: segment.label, color: segment.color }])
    ) satisfies ChartConfig
  );
  const legendItems = $derived(
    segments.map((segment) => ({ label: segment.label, color: segment.color, value: segment.value }))
  );
</script>

<div class="flex flex-col items-center gap-6 sm:flex-row">
  <div class="size-[180px] shrink-0">
    {#if browser}
      {#await loadChart()}
        <Skeleton class="size-[180px] rounded-full" />
      {:then Chart}
        <Chart.ChartContainer class="size-[180px]" {config}>
          <Chart.PieChart
            data={segments}
            key="key"
            label="label"
            value="value"
            c="color"
            innerRadius={0.62}
            padAngle={0.02}
          />
        </Chart.ChartContainer>
      {/await}
    {/if}
  </div>
  {#if browser}
    {#await loadChart() then Chart}
      <Chart.ChartLegend items={legendItems} />
    {/await}
  {/if}
</div>
