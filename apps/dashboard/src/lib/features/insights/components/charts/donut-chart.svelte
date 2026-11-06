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

  import { donutTotal, formatCount, formatPercent, percentOf } from '../../utils/insights-utils';
  import type { DonutSegment } from '../../utils/types';

  interface Props {
    segments: DonutSegment[];
    centerLabel: string;
  }

  let { segments, centerLabel }: Props = $props();

  const total = $derived(donutTotal(segments));
  const config = $derived(
    Object.fromEntries(
      segments.map((segment) => [segment.key, { label: segment.label, color: segment.color }])
    ) satisfies ChartConfig
  );
</script>

<div class="flex flex-col items-center gap-6 sm:flex-row">
  <div class="relative size-[180px] shrink-0">
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
    <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-2" aria-hidden="true">
      <span class="text-2xl font-bold tabular-nums">{formatCount(total)}</span>
      <span class="ui:text-muted-foreground max-w-[100px] truncate text-center text-xs" title={centerLabel}>
        {centerLabel}
      </span>
    </div>
  </div>
  <ul class="w-full flex-1 space-y-2 text-sm">
    {#each segments as segment (segment.key)}
      <li class="flex min-w-0 items-center gap-2">
        <span class="size-2.5 shrink-0 rounded-sm" style="background: {segment.color}" aria-hidden="true"></span>
        <span class="min-w-0 flex-1 truncate" title={segment.label}>{segment.label}</span>
        <span class="ml-auto shrink-0 font-semibold tabular-nums">{formatCount(segment.value)}</span>
        <span class="ui:text-muted-foreground w-10 shrink-0 text-right text-xs tabular-nums">
          {formatPercent(percentOf(segment.value, total))}
        </span>
      </li>
    {/each}
  </ul>
</div>
