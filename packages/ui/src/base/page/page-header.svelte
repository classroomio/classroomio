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

<div bind:this={ref} data-slot="page-header" class={cn('ui:flex ui:my-4 ui:flex-col', className)} {...restProps}>
  <div class="ui:flex ui:items-start ui:justify-between ui:gap-4">
    {@render children?.()}
  </div>
</div>
