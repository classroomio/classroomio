<script module lang="ts">
  function loadChart() {
    if (typeof window === 'undefined') return Promise.reject(new Error('browser-only'));
    return import('../../../../base/chart');
  }
</script>

<script lang="ts">
  import { Spinner } from '../../../../base/spinner';
  import type { ChartConfig } from '../../../../base/chart/types';
  import Empty from '$src/custom/empty/empty.svelte';
  import { BarChart3 } from '@lucide/svelte';

  const isBrowser = typeof window !== 'undefined';

  interface Row {
    key: string;
    label: string;
    responses: number;
    color?: string;
  }

  interface Props {
    chartData: Row[];
    chartConfig: ChartConfig;
    emptyLabel: string;
    series: Array<{ key: string; value: string; label: string; color: string }>;
  }

  let { chartData, chartConfig, emptyLabel, series }: Props = $props();

  const ROW_HEIGHT_PX = 48;
  const MIN_CHART_HEIGHT_PX = 120;
  const AXIS_LABEL_MAX_LENGTH = 28;

  const chartHeightPx = $derived(Math.max(MIN_CHART_HEIGHT_PX, chartData.length * ROW_HEIGHT_PX));

  function truncateAxisLabel(label: string): string {
    if (label.length <= AXIS_LABEL_MAX_LENGTH) return label;

    return `${label.slice(0, AXIS_LABEL_MAX_LENGTH - 1).trimEnd()}…`;
  }
</script>

{#if chartData.length > 0}
  {#if isBrowser}
    {#await loadChart() then C}
      <C.ChartContainer config={chartConfig} class="ui:aspect-auto ui:w-full" style="height: {chartHeightPx}px">
        <C.BarChart
          data={chartData}
          orientation="horizontal"
          y="label"
          axis="y"
          bandPadding={0.25}
          props={{ yAxis: { format: truncateAxisLabel } }}
          {series}
        />
      </C.ChartContainer>
    {:catch error}
      <Empty
        title="Unable to load chart"
        description="Something went wrong while loading the chart. Please refresh the page."
        icon={BarChart3}
        variant="page"
      />
    {/await}
  {:else}
    <div class="ui:flex ui:items-center ui:justify-center" style="height: {chartHeightPx}px">
      <Spinner class="ui:text-muted-foreground ui:size-6" />
    </div>
  {/if}
{:else}
  <p class="ui:text-muted-foreground ui:text-sm">{emptyLabel}</p>
{/if}
