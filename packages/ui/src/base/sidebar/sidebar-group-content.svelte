<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="sidebar-group-content"
  data-sidebar="group-content"
<<<<<<< HEAD
  class={cn('w-full text-sm', className)}
=======
  class={cn('ui:w-full ui:text-sm', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</div>
