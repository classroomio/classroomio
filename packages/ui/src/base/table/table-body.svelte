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
<tbody bind:this={ref} data-slot="table-body" class={cn('[&_tr:last-child]:border-0', className)} {...restProps}>
=======
<tbody bind:this={ref} data-slot="table-body" class={cn('ui:[&_tr:last-child]:border-0', className)} {...restProps}>
>>>>>>> feat/release-v2
  {@render children?.()}
</tbody>
