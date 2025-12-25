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
    'ui:text-sidebar-foreground ui:pointer-events-none ui:absolute ui:right-1 ui:flex ui:h-5 ui:min-w-5 ui:select-none ui:items-center ui:justify-center ui:rounded-md ui:px-1 ui:text-xs ui:font-medium tabular-nums',
    'ui:peer-hover/menu-button:text-sidebar-accent-foreground ui:peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
    'ui:peer-data-[size=sm]/menu-button:top-1',
    'ui:peer-data-[size=default]/menu-button:top-1.5',
    'ui:peer-data-[size=lg]/menu-button:top-2.5',
    'ui:group-data-[collapsible=icon]:hidden',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
