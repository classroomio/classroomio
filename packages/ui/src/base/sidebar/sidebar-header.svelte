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
  data-slot="sidebar-header"
  data-sidebar="header"
<<<<<<< HEAD
  class={cn('flex flex-col gap-2 p-2', className)}
=======
  class={cn('ui:flex ui:flex-col ui:gap-2 ui:p-2', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</div>
