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

<tfoot
  bind:this={ref}
  data-slot="table-footer"
  class={cn('ui:bg-muted/50 ui:border-t ui:font-medium ui:[&>tr]:last:border-b-0', className)}
  {...restProps}
>
  {@render children?.()}
</tfoot>
