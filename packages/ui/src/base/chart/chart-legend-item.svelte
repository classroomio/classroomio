<script lang="ts">
  import * as Tooltip from '../tooltip';
  import type { ChartLegendItem } from './chart-utils';

  interface Props {
    item: ChartLegendItem;
    showValue?: boolean;
  }

  let { item, showValue = true }: Props = $props();

  let textEl = $state<HTMLElement | null>(null);
  let isTruncated = $state(false);

  function checkTruncation() {
    if (textEl) {
      isTruncated = textEl.scrollWidth > textEl.clientWidth;
    }
  }

  $effect(() => {
    if (!textEl) return;
    checkTruncation();

    const observer = new ResizeObserver(() => {
      checkTruncation();
    });
    observer.observe(textEl);

    return () => {
      observer.disconnect();
    };
  });
</script>

<Tooltip.Root disabled={!isTruncated}>
  <Tooltip.Trigger
    onpointerenter={checkTruncation}
    onfocus={checkTruncation}
    class="ui:flex ui:min-w-0 ui:shrink ui:items-center ui:gap-1.5 ui:border-0 ui:bg-transparent ui:p-0 ui:text-left ui:cursor-default"
  >
    {#if item.dashed}
      <span
        class="ui:h-0 ui:w-3.5 ui:shrink-0 ui:border-b-2 ui:border-dashed"
        style="border-color: {item.color}"
        aria-hidden="true"
      ></span>
    {:else}
      <span
        class="ui:size-2.5 ui:shrink-0 ui:rounded-[2px] ui:ring-1 ui:ring-inset ui:ring-border/50"
        style="background-color: {item.color}"
        aria-hidden="true"
      ></span>
    {/if}
    <span bind:this={textEl} class="ui:text-muted-foreground ui:truncate ui:text-xs">
      {item.label}
      {#if showValue && item.value !== undefined}
        <span class="ui:font-medium ui:text-foreground">({item.value})</span>
      {/if}
    </span>
  </Tooltip.Trigger>
  {#if isTruncated}
    <Tooltip.Content side="top" sideOffset={4}>
      {item.label}
      {#if showValue && item.value !== undefined}
        <span>({item.value})</span>
      {/if}
    </Tooltip.Content>
  {/if}
</Tooltip.Root>
