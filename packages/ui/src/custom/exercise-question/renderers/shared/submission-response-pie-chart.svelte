<script lang="ts">
  import * as Chart from '../../../../base/chart';
  import type { ChartConfig } from '../../../../base/chart';

  import { CHART_COLORS } from '../submission-utils';

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
  <Chart.Container config={chartConfig} class="ui:h-[280px] ui:w-full ui:flex-col ui:items-center">
    <Chart.PieChart data={chartData} key="key" label="label" value="responses" c="color" />
    <Chart.ChartLegend
      items={chartData.map((d) => ({
        label: d.label,
        color: d.color ?? CHART_COLORS[0],
        value: d.responses
      }))}
    />
  </Chart.Container>
{:else}
  <p class="ui:text-muted-foreground ui:text-sm">{emptyLabel}</p>
{/if}
