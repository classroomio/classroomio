<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="sidebar-content"
  data-sidebar="content"
  class={cn(
<<<<<<< HEAD
    'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
=======
    'ui:flex ui:min-h-0 ui:flex-1 ui:flex-col ui:gap-2 ui:overflow-auto ui:group-data-[collapsible=icon]:overflow-hidden',
>>>>>>> feat/release-v2
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
