<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLLIElement>, HTMLLIElement> = $props();
</script>

<li
  bind:this={ref}
  data-slot="sidebar-menu-item"
  data-sidebar="menu-item"
<<<<<<< HEAD
  class={cn('group/menu-item relative', className)}
=======
  class={cn('ui:group/menu-item ui:relative', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</li>
