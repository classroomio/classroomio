<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<kbd
  bind:this={ref}
  data-slot="kbd"
  class={cn(
    'ui:bg-muted ui:text-muted-foreground ui:pointer-events-none ui:inline-flex ui:h-5 ui:w-fit ui:min-w-5 ui:select-none ui:items-center ui:justify-center ui:gap-1 ui:rounded-sm ui:px-1 ui:font-sans ui:text-xs ui:font-medium',
    "ui:[&_svg:not([class*='size-'])]:size-3",
    'ui:in-data-[slot=tooltip-content]:bg-background/20 ui:in-data-[slot=tooltip-content]:text-background ui:dark:in-data-[slot=tooltip-content]:bg-background/10',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</kbd>
