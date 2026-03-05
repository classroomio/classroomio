<script lang="ts">
  import { cn, type WithElementRef } from '../../tools';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
  bind:this={ref}
  data-slot="item-sub-description"
  class={cn(
    'ui:text-muted-foreground ui:line-clamp-1 ui:text-balance ui:text-xs ui:font-normal ui:leading-normal',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</span>
