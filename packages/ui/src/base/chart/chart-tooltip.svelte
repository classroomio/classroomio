<script lang="ts">
  import { cn, type WithElementRef, type WithoutChildren } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getPayloadConfigFromPayload, useChart, type TooltipPayload } from './chart-utils.js';
  import { getTooltipContext, Tooltip as TooltipPrimitive } from 'layerchart';
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
  const tooltipCtx = getTooltipContext();

  const formattedLabel = $derived.by(() => {
    if (hideLabel || !tooltipCtx.payload?.length) return null;

    const [item] = tooltipCtx.payload;
    const key = labelKey ?? item?.label ?? item?.name ?? 'value';

    const itemConfig = getPayloadConfigFromPayload(chart.config, item, key);

    const value =
      !labelKey && typeof label === 'string'
        ? (chart.config[label as keyof typeof chart.config]?.label ?? label)
        : (itemConfig?.label ?? item.label);

    if (value === undefined) return null;
    if (!labelFormatter) return value;
    return labelFormatter(value, tooltipCtx.payload);
  });

  const nestLabel = $derived(tooltipCtx.payload.length === 1 && indicator !== 'dot');
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
      {#each tooltipCtx.payload as item, i (item.key + i)}
        {@const key = `${nameKey || item.key || item.name || 'value'}`}
        {@const itemConfig = getPayloadConfigFromPayload(chart.config, item, key)}
        {@const indicatorColor = color || item.payload?.color || item.color}
        <div
          class={cn(
            'ui:[&>svg]:text-muted-foreground ui:flex ui:w-full ui:flex-wrap ui:items-stretch ui:gap-2 ui:[&>svg]:size-2.5',
            indicator === 'dot' && 'items-center'
          )}
        >
          {#if formatter && item.value !== undefined && item.name}
            {@render formatter({
              value: item.value,
              name: item.name,
              item,
              index: i,
              payload: tooltipCtx.payload
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
                  {itemConfig?.label || item.name}
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
