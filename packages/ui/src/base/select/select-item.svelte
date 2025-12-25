<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { Select as SelectPrimitive } from 'bits-ui';
  import { cn, type WithoutChild } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    value,
    label,
    children: childrenProp,
    ...restProps
  }: WithoutChild<SelectPrimitive.ItemProps> = $props();
</script>

<SelectPrimitive.Item
  bind:ref
  {value}
  data-slot="select-item"
  class={cn(
    "ui:data-highlighted:bg-accent ui:data-highlighted:text-accent-foreground ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:outline-hidden ui:*:[span]:last:flex ui:*:[span]:last:items-center ui:*:[span]:last:gap-2 ui:relative ui:flex ui:w-full ui:cursor-default ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:py-1.5 ui:pl-2 ui:pr-8 ui:text-sm ui:data-disabled:pointer-events-none ui:data-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
    className
  )}
  {...restProps}
>
  {#snippet children({ selected, highlighted })}
    <span class="ui:absolute ui:flex ui:size-3.5 ui:items-center ui:justify-center ui:right-2">
      {#if selected}
        <CheckIcon class="ui:size-4" />
      {/if}
    </span>
    {#if childrenProp}
      {@render childrenProp({ selected, highlighted })}
    {:else}
      {label || value}
    {/if}
  {/snippet}
</SelectPrimitive.Item>
