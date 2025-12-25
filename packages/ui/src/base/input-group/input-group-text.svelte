<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
  bind:this={ref}
  class={cn(
    "ui:text-muted-foreground ui:flex ui:items-center ui:gap-2 ui:text-sm ui:[&_svg:not([class*='size-'])]:size-4 ui:[&_svg]:pointer-events-none",
    className
  )}
  {...restProps}
>
  {@render children?.()}
</span>
