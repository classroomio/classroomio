<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLTableSectionElement>> = $props();
</script>

<<<<<<< HEAD
<thead bind:this={ref} data-slot="table-header" class={cn('[&_tr]:border-b', className)} {...restProps}>
=======
<thead bind:this={ref} data-slot="table-header" class={cn('ui:[&_tr]:border-b', className)} {...restProps}>
>>>>>>> feat/release-v2
  {@render children?.()}
</thead>
