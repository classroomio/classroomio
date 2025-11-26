<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '../../tools';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLUListElement>> = $props();
</script>

<ul
  bind:this={ref}
  data-slot="pagination-content"
<<<<<<< HEAD
  class={cn('flex flex-row items-center gap-1', className)}
=======
  class={cn('ui:flex ui:flex-row ui:items-center ui:gap-1', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</ul>
