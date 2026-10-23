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

  import { INSIGHTS_COLORS } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    valueKey: string;
    label: string;
    color?: string;
    percent?: boolean;
  }

  let { points, valueKey, label, color = INSIGHTS_COLORS.primary, percent = false }: Props = $props();

  const labelByKey = $derived(new Map(points.map((point) => [point.key, point.label])));
  const config = $derived({ [valueKey]: { label, color } } satisfies ChartConfig);
  const series = $derived([{ key: valueKey, label, color }]);
  const yDomain = $derived(percent ? [0, 100] : undefined);
</script>

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
        {series}
        {yDomain}
        props={{ xAxis: { format: (key: string) => labelByKey.get(key) ?? key } }}
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
