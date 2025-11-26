<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLUListElement>, HTMLUListElement> = $props();
</script>

<ul
  bind:this={ref}
  data-slot="sidebar-menu"
  data-sidebar="menu"
<<<<<<< HEAD
  class={cn('flex w-full min-w-0 flex-col gap-1', className)}
=======
  class={cn('ui:flex ui:w-full ui:min-w-0 ui:flex-col ui:gap-1', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</ul>
