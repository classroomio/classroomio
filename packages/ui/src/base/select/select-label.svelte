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
<<<<<<< HEAD
  class={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
=======
  class={cn('ui:text-muted-foreground ui:px-2 ui:py-1.5 ui:text-xs', className)}
>>>>>>> feat/release-v2
  {...restProps}
>
  {@render children?.()}
</div>
