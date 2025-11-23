<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...props
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="input-group"
  role="group"
  class={cn(
    'ui:group/input-group ui:border-input ui:dark:bg-input/30 ui:shadow-xs ui:relative ui:flex ui:w-full ui:items-center ui:rounded-md ui:border ui:outline-none ui:transition-[color,box-shadow]',
    'ui:h-9 ui:has-[>textarea]:h-auto',

    // Variants based on alignment.
    'ui:has-[>[data-align=inline-start]]:[&>input]:ps-2',
    'ui:has-[>[data-align=inline-end]]:[&>input]:pe-2',
    'ui:has-[>[data-align=block-start]]:h-auto ui:has-[>[data-align=block-start]]:flex-col ui:has-[>[data-align=block-start]]:[&>input]:pb-3',
    'ui:has-[>[data-align=block-end]]:h-auto ui:has-[>[data-align=block-end]]:flex-col ui:has-[>[data-align=block-end]]:[&>input]:pt-3',

    // Focus state.
    'ui:has-[[data-slot=input-group-control]:focus-visible]:border-ring ui:has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 ui:has-[[data-slot=input-group-control]:focus-visible]:ring-[3px]',

    // Error state.
    'ui:has-[[data-slot][aria-invalid=true]]:ring-destructive/20 ui:has-[[data-slot][aria-invalid=true]]:border-destructive ui:dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40',

    className
  )}
  {...props}
>
  {@render children?.()}
</div>
