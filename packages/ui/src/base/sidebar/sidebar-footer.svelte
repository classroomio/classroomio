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
  data-slot="sidebar-footer"
  data-sidebar="footer"
  class={cn('ui:flex ui:flex-col ui:gap-2 ui:p-2', className)}
  {...restProps}
>
  {@render children?.()}
</div>
