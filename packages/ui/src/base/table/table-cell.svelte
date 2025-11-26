<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLTdAttributes } from 'svelte/elements';

  let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLTdAttributes> = $props();
</script>

<td
  bind:this={ref}
  data-slot="table-cell"
<<<<<<< HEAD
  class={cn('whitespace-nowrap bg-clip-padding p-2 align-middle [&:has([role=checkbox])]:pr-0', className)}
=======
  class={cn('ui:whitespace-nowrap ui:bg-clip-padding ui:p-2 ui:[&:has([role=checkbox])]:pr-0 align-middle', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</td>
