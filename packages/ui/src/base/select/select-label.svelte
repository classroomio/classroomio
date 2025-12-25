<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {} = $props();
</script>

<div
  bind:this={ref}
  data-slot="select-label"
  class={cn('ui:text-muted-foreground ui:px-2 ui:py-1.5 ui:text-xs', className)}
  {...restProps}
>
  {@render children?.()}
</div>
