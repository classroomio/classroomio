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

  import { INSIGHTS_COLORS, truncateLabel } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    valueKey: string;
    label: string;
    color?: string;
    percent?: boolean;
  }

  let { points, valueKey, label, color = INSIGHTS_COLORS.primary, percent = false }: Props = $props();

  let containerWidth = $state(800);

  const labelByKey = $derived(new Map(points.map((point) => [point.key, point.label])));
  const config = $derived({ [valueKey]: { label, color } } satisfies ChartConfig);
  const series = $derived([{ key: valueKey, label, color }]);
  const yDomain = $derived(percent ? [0, 100] : undefined);

  function formatTick(key: string): string {
    const raw = labelByKey.get(key) ?? key;
    const availablePerBar = points.length > 0 ? containerWidth / points.length : 80;
    if (availablePerBar < 45 && raw.includes('%')) {
      return raw.replace(/%/g, '');
    }
    const maxChars = Math.max(5, Math.min(14, Math.floor(availablePerBar / 7)));
    return truncateLabel(raw, maxChars);
  }
</script>

<div class="w-full" bind:clientWidth={containerWidth}>
  {#if browser}
    {#await loadChart()}
      <Skeleton class="h-[240px] w-full" />
    {:then Chart}
      <Chart.ChartContainer class="h-[240px] w-full" {config}>
        <Chart.BarChart
          data={points}
          x="key"
          xScale={Chart.scaleBand().padding(0.25)}
          axis="x"
          padding={{ top: 8, right: 16, bottom: 32, left: 24 }}
          {series}
          {yDomain}
          props={{ xAxis: { format: formatTick } }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip labelFormatter={(key: string) => labelByKey.get(key) ?? key} />
          {/snippet}
        </Chart.BarChart>
      </Chart.ChartContainer>
    {/await}
  {:else}
    <Skeleton class="h-[240px] w-full" />
  {/if}
</div>
