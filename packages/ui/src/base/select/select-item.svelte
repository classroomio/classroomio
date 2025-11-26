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
<<<<<<< HEAD
    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground outline-hidden *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
=======
    "ui:data-highlighted:bg-accent ui:data-highlighted:text-accent-foreground ui:[&_svg:not([class*='text-'])]:text-muted-foreground ui:outline-hidden ui:*:[span]:last:flex ui:*:[span]:last:items-center ui:*:[span]:last:gap-2 ui:relative ui:flex ui:w-full ui:cursor-default ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:py-1.5 ui:pl-2 ui:pr-8 ui:text-sm ui:data-disabled:pointer-events-none ui:data-disabled:opacity-50 ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0",
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
>
  {#snippet children({ selected, highlighted })}
<<<<<<< HEAD
    <span class="absolute right-2 flex size-3.5 items-center justify-center">
      {#if selected}
        <CheckIcon class="size-4" />
=======
    <span class="ui:absolute ui:flex ui:size-3.5 ui:items-center ui:justify-center ui:right-2">
      {#if selected}
        <CheckIcon class="ui:size-4" />
>>>>>>> feat/release-v2
      {/if}
    </span>
    {#if childrenProp}
      {@render childrenProp({ selected, highlighted })}
    {:else}
      {label || value}
    {/if}
  {/snippet}
</SelectPrimitive.Item>
