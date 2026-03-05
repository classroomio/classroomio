<script lang="ts">
  import type { ChartLegendItem } from './chart-utils';

  let { items, showValue = true }: { items: ChartLegendItem[]; showValue?: boolean } = $props();
</script>

{#if items.length > 0}
  <div class="ui:flex ui:flex-wrap ui:items-center ui:justify-center ui:gap-x-6 ui:gap-y-2 ui:mt-4">
    {#each items as item (item.label)}
      <div class="ui:flex ui:items-center ui:gap-2">
        <span
          class="ui:size-3 ui:shrink-0 ui:rounded-[2px] ui:ring-1 ui:ring-inset ui:ring-border/50"
          style="background-color: {item.color}"
          aria-hidden="true"
        ></span>
        <span class="ui:text-muted-foreground ui:text-xs">
          {item.label}
          {#if showValue && item.value !== undefined}
            <span class="ui:font-medium ui:text-foreground">({item.value})</span>
          {/if}
        </span>
      </div>
    {/each}
  </div>
{/if}
