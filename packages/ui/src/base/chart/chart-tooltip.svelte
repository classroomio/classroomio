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
<<<<<<< HEAD
    <div class={cn('font-medium', labelClassName)}>
=======
    <div class={cn('ui:font-medium', labelClassName)}>
>>>>>>> feat/release-v2
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
<<<<<<< HEAD
      'border-border/50 bg-background grid min-w-[9rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl',
=======
      'ui:border-border/50 ui:bg-background ui:grid ui:min-w-[9rem] ui:items-start ui:gap-1.5 ui:rounded-lg ui:border ui:px-2.5 ui:py-1.5 ui:text-xs ui:shadow-xl',
>>>>>>> feat/release-v2
      className
    )}
    {...restProps}
  >
    {#if !nestLabel}
      {@render TooltipLabel()}
    {/if}
<<<<<<< HEAD
    <div class="grid gap-1.5">
=======
    <div class="ui:grid ui:gap-1.5">
>>>>>>> feat/release-v2
      {#each tooltipCtx.payload as item, i (item.key + i)}
        {@const key = `${nameKey || item.key || item.name || 'value'}`}
        {@const itemConfig = getPayloadConfigFromPayload(chart.config, item, key)}
        {@const indicatorColor = color || item.payload?.color || item.color}
        <div
          class={cn(
<<<<<<< HEAD
            '[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:size-2.5',
=======
            'ui:[&>svg]:text-muted-foreground ui:flex ui:w-full ui:flex-wrap ui:items-stretch ui:gap-2 ui:[&>svg]:size-2.5',
>>>>>>> feat/release-v2
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
<<<<<<< HEAD
                class={cn('border-(--color-border) bg-(--color-bg) shrink-0 rounded-[2px]', {
                  'size-2.5': indicator === 'dot',
                  'h-full w-1': indicator === 'line',
                  'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                  'my-0.5': nestLabel && indicator === 'dashed'
=======
                class={cn('ui:border-(--color-border) ui:bg-(--color-bg) ui:shrink-0 ui:rounded-[2px]', {
                  'ui:size-2.5': indicator === 'dot',
                  'ui:h-full ui:w-1': indicator === 'line',
                  'ui:w-0 ui:border-[1.5px] ui:border-dashed ui:bg-transparent': indicator === 'dashed',
                  'ui:my-0.5': nestLabel && indicator === 'dashed'
>>>>>>> feat/release-v2
                })}
              ></div>
            {/if}
            <div
<<<<<<< HEAD
              class={cn('flex flex-1 shrink-0 justify-between leading-none', nestLabel ? 'items-end' : 'items-center')}
            >
              <div class="grid gap-1.5">
                {#if nestLabel}
                  {@render TooltipLabel()}
                {/if}
                <span class="text-muted-foreground">
=======
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
>>>>>>> feat/release-v2
                  {itemConfig?.label || item.name}
                </span>
              </div>
              {#if item.value !== undefined}
<<<<<<< HEAD
                <span class="text-foreground font-mono font-medium tabular-nums">
=======
                <span class="ui:text-foreground ui:font-mono ui:font-medium tabular-nums">
>>>>>>> feat/release-v2
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
