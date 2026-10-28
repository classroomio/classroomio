<script lang="ts">
  import * as Tooltip from '../tooltip';
  import { cn } from '../../tools';
  import ChartLegendItem from './chart-legend-item.svelte';
  import type { ChartLegendItem as TChartLegendItem } from './chart-utils';

  interface Props {
    items: TChartLegendItem[];
    showValue?: boolean;
    class?: string;
  }

  let { items, showValue = true, class: className }: Props = $props();
</script>

{#if items.length > 0}
  <Tooltip.Provider delayDuration={200}>
    <div
      class={cn(
        'ui:flex ui:flex-nowrap ui:items-center ui:justify-center ui:gap-x-5 ui:overflow-hidden',
        className ?? 'ui:mt-4'
      )}
    >
      {#each items as item (item.label)}
        <ChartLegendItem {item} {showValue} />
      {/each}
    </div>
  </Tooltip.Provider>
{/if}
