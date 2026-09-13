<script lang="ts">
  import { getChartContext, Tooltip as TooltipPrimitive } from 'layerchart';
  import { cn, type WithElementRef, type WithoutChildren } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getPayloadConfigFromPayload, useChart, type TooltipPayload } from './chart-utils';
  import type { Snippet } from 'svelte';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function defaultFormatter(value: any, _payload: TooltipPayload[]) {
    return `${value}`;
  }

  let {
    ref = $bindable(null),
    class: className,
    hideLabel = false,
    indicator = 'dot',
    hideIndicator = false,
    labelKey,
    label,
    labelFormatter = defaultFormatter,
    labelClassName,
    formatter,
    nameKey,
    color,
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> & {
    hideLabel?: boolean;
    label?: string;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
    hideIndicator?: boolean;
    labelClassName?: string;
    labelFormatter?: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((value: any, payload: TooltipPayload[]) => string | number | Snippet) | null;
    formatter?: Snippet<
      [
        {
          value: unknown;
          name: string;
          item: TooltipPayload;
          index: number;
          payload: TooltipPayload[];
        }
      ]
    >;
  } = $props();

  const chart = useChart();
  const chartCtx = getChartContext();

  const visibleSeries = $derived(chartCtx.tooltip.series.filter((s) => s.value !== undefined));

  const formattedLabel = $derived.by(() => {
    if (hideLabel || !visibleSeries?.length) return null;

    const [item] = visibleSeries;
    const tooltipData = chartCtx.tooltip.data;

    const dataLabel = tooltipData != null ? chartCtx.x(tooltipData) : undefined;

    const key = labelKey ?? item?.label ?? 'value';

    let value: unknown;
    if (!labelKey && typeof label === 'string') {
      value = chart.config[label as keyof typeof chart.config]?.label ?? label;
    } else {
      const itemConfig = getPayloadConfigFromPayload(
        chart.config,
        item,
        key,
        tooltipData as Record<string, unknown> | null
      );
      value = itemConfig?.label ?? dataLabel;
    }

    if (value === undefined) return null;
    if (!labelFormatter) return value;
    return labelFormatter(value, visibleSeries);
  });

  const nestLabel = $derived(visibleSeries.length === 1 && indicator !== 'dot');
</script>

{#snippet TooltipLabel()}
  {#if formattedLabel}
    <div class={cn('ui:font-medium', labelClassName)}>
      {#if typeof formattedLabel === 'function'}
        {@render formattedLabel()}
      {:else}
        {formattedLabel}
      {/if}
    </div>
  {/if}
{/snippet}

<TooltipPrimitive.Root variant="none">
  <div
    bind:this={ref}
    class={cn(
      'ui:border-border/50 ui:bg-background ui:grid ui:min-w-[9rem] ui:items-start ui:gap-1.5 ui:rounded-lg ui:border ui:px-2.5 ui:py-1.5 ui:text-xs ui:shadow-xl',
      className
    )}
    {...restProps}
  >
    {#if !nestLabel}
      {@render TooltipLabel()}
    {/if}
    <div class="ui:grid ui:gap-1.5">
      {#each visibleSeries as item, i (item.key + i)}
        {@const key = `${nameKey || item.key || item.label || 'value'}`}
        {@const itemConfig = getPayloadConfigFromPayload(chart.config, item, key, chartCtx.tooltip.data)}
        {@const indicatorColor = color || item.config?.color || item.color}
        <div
          class={cn(
            'ui:[&>svg]:text-muted-foreground ui:flex ui:w-full ui:flex-wrap ui:items-stretch ui:gap-2 ui:[&>svg]:size-2.5',
            indicator === 'dot' && 'ui:items-center'
          )}
        >
          {#if formatter && item.value !== undefined && item.label}
            {@render formatter({
              value: item.value,
              name: item.label,
              item,
              index: i,
              payload: visibleSeries
            })}
          {:else}
            {#if itemConfig?.icon}
              <itemConfig.icon />
            {:else if !hideIndicator}
              <div
                style="--color-bg: {indicatorColor}; --color-border: {indicatorColor};"
                class={cn('ui:border-(--color-border) ui:bg-(--color-bg) ui:shrink-0 ui:rounded-[2px]', {
                  'ui:size-2.5': indicator === 'dot',
                  'ui:h-full ui:w-1': indicator === 'line',
                  'ui:w-0 ui:border-[1.5px] ui:border-dashed ui:bg-transparent': indicator === 'dashed',
                  'ui:my-0.5': nestLabel && indicator === 'dashed'
                })}
              ></div>
            {/if}
            <div
              class={cn(
                'ui:flex ui:flex-1 ui:shrink-0 ui:justify-between ui:leading-none',
                nestLabel ? 'ui:items-end' : 'ui:items-center'
              )}
            >
              <div class="ui:grid ui:gap-1.5">
                {#if nestLabel}
                  {@render TooltipLabel()}
                {/if}
                <span class="ui:text-muted-foreground">
                  {itemConfig?.label || item.label}
                </span>
              </div>
              {#if item.value !== undefined}
                <span class="ui:text-foreground ui:font-mono ui:font-medium tabular-nums">
                  {item.value.toLocaleString()}
                </span>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</TooltipPrimitive.Root>
