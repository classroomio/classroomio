<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';
  import { useSidebar } from './context.svelte';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> = $props();

  const sidebar = useSidebar();
</script>

<button
  bind:this={ref}
  data-sidebar="rail"
  data-slot="sidebar-rail"
  aria-label="Toggle Sidebar"
  tabIndex={-1}
  onclick={sidebar.toggle}
  title="Toggle Sidebar"
  class={cn(
    'ui:hover:after:bg-sidebar-border ui:absolute ui:inset-y-0 ui:z-20 ui:hidden ui:w-4 ui:-translate-x-1/2 ui:transition-all ui:ease-linear ui:after:absolute ui:after:inset-y-0 ui:after:left-[calc(1/2*100%-1px)] ui:after:w-[2px] ui:sm:flex ui:group-data-[side=left]:-right-4 ui:group-data-[side=right]:left-0',
    'ui:in-data-[side=left]:cursor-w-resize ui:in-data-[side=right]:cursor-e-resize',
    'ui:[[data-side=left][data-state=collapsed]_&]:cursor-e-resize ui:[[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
    'ui:hover:group-data-[collapsible=offcanvas]:bg-sidebar ui:group-data-[collapsible=offcanvas]:translate-x-0 ui:group-data-[collapsible=offcanvas]:after:left-full',
    'ui:[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
    'ui:[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</button>
