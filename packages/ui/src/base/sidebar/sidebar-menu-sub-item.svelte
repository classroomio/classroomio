<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    children,
    class: className,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLLIElement>> = $props();
</script>

<li
  bind:this={ref}
  data-slot="sidebar-menu-sub-item"
  data-sidebar="menu-sub-item"
<<<<<<< HEAD
  class={cn('group/menu-sub-item relative', className)}
=======
  class={cn('ui:group/menu-sub-item ui:relative', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</li>
