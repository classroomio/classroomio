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
  data-slot="card-header"
  class={cn(
    'ui:has-data-[slot=card-action]:grid-cols-[1fr_auto] ui:[.border-b]:pb-6 ui:grid ui:auto-rows-min ui:grid-rows-[auto_auto] ui:items-start ui:gap-1.5 ui:px-6 @container/card-header',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
