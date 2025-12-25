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
  data-slot="sidebar-group"
  data-sidebar="group"
  class={cn('ui:relative ui:flex ui:w-full ui:min-w-0 ui:flex-col ui:p-2', className)}
  {...restProps}
>
  {@render children?.()}
</div>
