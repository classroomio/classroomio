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
  data-slot="resource-list-row-end"
  class={cn('ui:flex ui:shrink-0 ui:items-center ui:justify-end ui:gap-2 ui:self-center', className)}
  {...restProps}
>
  {@render children?.()}
</div>
