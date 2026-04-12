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
  role="list"
  data-slot="resource-list-group"
  class={cn('ui:group/resource-list ui:flex ui:w-full ui:flex-col ui:rounded-md ui:border ui:border-border', className)}
  {...restProps}
>
  {@render children?.()}
</div>
