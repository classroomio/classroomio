<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLUListElement>> = $props();
</script>

<ul
  bind:this={ref}
  data-slot="sidebar-menu-sub"
  data-sidebar="menu-sub"
  class={cn(
<<<<<<< HEAD
    'border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5',
    'group-data-[collapsible=icon]:hidden',
=======
    'ui:border-sidebar-border ui:mx-3.5 ui:flex ui:min-w-0 ui:translate-x-px ui:flex-col ui:gap-1 ui:border-l ui:px-2.5 ui:py-0.5',
    'ui:group-data-[collapsible=icon]:hidden',
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
>
  {@render children?.()}
</ul>
