<script module lang="ts">
  function loadChart() {
    if (typeof window === 'undefined') return Promise.reject(new Error('browser-only'));
    return import('../../../../base/chart');
  }
</script>

<script lang="ts">
  import { Spinner } from '../../../../base/spinner';
  import type { ChartConfig } from '../../../../base/chart/types';
  import { CHART_COLORS } from '../submission-utils';

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
  }

  let { chartData, chartConfig, emptyLabel }: Props = $props();
</script>

{#if chartData.length > 0}
  {#if isBrowser}
    {#await loadChart() then C}
      <C.ChartContainer config={chartConfig} class="ui:h-[280px] ui:w-full ui:flex-col ui:items-center">
        <C.PieChart data={chartData} key="key" label="label" value="responses" c="color" />
        <C.ChartLegend
          items={chartData.map((d) => ({
            label: d.label,
            color: d.color ?? CHART_COLORS[0],
            value: d.responses
          }))}
        />
      </C.ChartContainer>
    {/await}
  {:else}
    <div class="ui:flex ui:h-[280px] ui:w-full ui:items-center ui:justify-center">
      <Spinner class="ui:text-muted-foreground ui:size-6" />
    </div>
  {/if}
{:else}
  <p class="ui:text-muted-foreground ui:text-sm">{emptyLabel}</p>
{/if}
