<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLTdAttributes } from 'svelte/elements';

  let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLTdAttributes> = $props();
</script>

<td
  bind:this={ref}
  data-slot="table-cell"
  class={cn('ui:whitespace-nowrap ui:bg-clip-padding ui:p-2 ui:[&:has([role=checkbox])]:pr-0 align-middle', className)}
  {...restProps}
>
  {@render children?.()}
</td>
