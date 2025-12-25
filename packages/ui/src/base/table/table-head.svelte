<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLThAttributes } from 'svelte/elements';

  let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLThAttributes> = $props();
</script>

<th
  bind:this={ref}
  data-slot="table-head"
  class={cn(
    'ui:text-foreground ui:h-10 ui:whitespace-nowrap ui:bg-clip-padding ui:px-2 ui:text-left ui:font-medium ui:[&:has([role=checkbox])]:pr-0 align-middle',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</th>
