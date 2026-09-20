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

<div
  bind:this={ref}
  data-slot="sidebar-menu-badge"
  data-sidebar="menu-badge"
  class={cn(
    'ui:text-muted-foreground ui:pointer-events-none ui:ml-auto ui:flex ui:h-5 ui:min-w-5 ui:shrink-0 ui:select-none ui:items-center ui:justify-center ui:rounded-md ui:px-1 ui:text-xs ui:font-medium ui:tabular-nums',
    'ui:group-data-[collapsible=icon]:hidden',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
